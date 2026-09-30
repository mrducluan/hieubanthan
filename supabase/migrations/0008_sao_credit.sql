-- CR-C (2026-09-30, chủ dự án chốt làm credit + thưởng mời; CHƯA có thanh toán).
-- "Sao" = credit nội bộ: KHÔNG đổi ra tiền, KHÔNG chuyển nhượng (docs/DE-XUAT-KINH-TE-CONG-DONG.md).
--
-- Thiết kế:
--   so_cai_sao      sổ cái bất biến — số dư = tổng giao dịch còn hạn; mỗi giao dịch có `khoa` duy nhất
--                   (chống ghi trùng khi bấm hai lần / gọi lại).
--   ma_gioi_thieu   mã mời công khai của mỗi người (8 ký tự, không lộ user_id).
--   gioi_thieu      ai mời ai — mỗi tài khoản chỉ được tính là "được mời" MỘT lần; một tầng, không hoa hồng tầng 2.
-- Người dùng CHỈ ĐỌC dữ liệu của mình (RLS). Mọi GHI đi qua hàm SECURITY DEFINER bên dưới, kiểm điều kiện
-- trong cùng giao dịch — client không tự cộng Sao được.
-- Không lưu nội dung luận giải (CLAUDE.md). Chạy SAU 0006 (cần bảng ho_so). Rollback: 0008_sao_credit.down.sql

create table if not exists ma_gioi_thieu (
    user_id  uuid primary key references auth.users (id) on delete cascade,
    ma       text not null unique check (ma ~ '^[a-z0-9]{8}$'),
    tao_luc  timestamptz not null default now()
);

create table if not exists so_cai_sao (
    id          bigint generated always as identity primary key,
    user_id     uuid not null references auth.users (id) on delete cascade,
    so_luong    integer not null check (so_luong <> 0 and abs(so_luong) <= 100000),
    loai        text not null check (loai in ('chao_mung', 'moi_ban', 'duoc_moi', 'dung', 'mua', 'dieu_chinh')),
    ghi_chu     text check (ghi_chu is null or char_length(ghi_chu) <= 120),
    khoa        text not null unique check (char_length(khoa) <= 120),
    het_han     date,
    tao_luc     timestamptz not null default now()
);
create index if not exists so_cai_sao_user_idx on so_cai_sao (user_id, tao_luc desc);

create table if not exists gioi_thieu (
    duoc_moi_id  uuid primary key references auth.users (id) on delete cascade,
    nguoi_moi_id uuid not null references auth.users (id) on delete cascade,
    ma           text not null,
    thuong_nguoi_moi boolean not null,
    tao_luc      timestamptz not null default now(),
    check (duoc_moi_id <> nguoi_moi_id)
);
create index if not exists gioi_thieu_nguoi_moi_idx on gioi_thieu (nguoi_moi_id, tao_luc desc);

alter table ma_gioi_thieu enable row level security;
alter table so_cai_sao enable row level security;
alter table gioi_thieu enable row level security;

create policy "ma_gioi_thieu chu doc" on ma_gioi_thieu
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "so_cai_sao chu doc" on so_cai_sao
    for select to authenticated using ((select auth.uid()) = user_id);
create policy "gioi_thieu hai ben doc" on gioi_thieu
    for select to authenticated using ((select auth.uid()) in (nguoi_moi_id, duoc_moi_id));

-- Mức thưởng (đổi ở đây + ghi vào docs). Sao tặng hết hạn sau 365 ngày.
create or replace function sao_muc(p_loai text) returns integer
    language sql immutable set search_path = '' as $$
    select case p_loai when 'chao_mung' then 10 when 'moi_ban' then 20 when 'duoc_moi' then 20 else 0 end
$$;

-- Số dư: giao dịch âm (tiêu) luôn tính; giao dịch dương chỉ tính khi còn hạn.
-- (Chưa trừ theo thứ tự hết hạn — đủ đúng khi chưa mở tiêu Sao; xem lại khi mở thanh toán.)
create or replace function so_du_sao() returns integer
    language sql stable security definer set search_path = '' as $$
    select coalesce(sum(so_luong), 0)::integer from public.so_cai_sao
    where user_id = (select auth.uid()) and (so_luong < 0 or het_han is null or het_han >= current_date)
$$;

create or replace function lay_ma_gioi_thieu() returns text
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_ma text;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    select ma into v_ma from public.ma_gioi_thieu where user_id = v_uid;
    if v_ma is not null then return v_ma; end if;
    loop
        v_ma := substr(translate(encode(public.sao_byte_ngau_nhien(), 'base64'), '+/=ABCDEFGHIJKLMNOPQRSTUVWXYZ', ''), 1, 8);
        continue when char_length(v_ma) < 8;
        begin
            insert into public.ma_gioi_thieu (user_id, ma) values (v_uid, v_ma);
            return v_ma;
        exception when unique_violation then
            select ma into v_ma from public.ma_gioi_thieu where user_id = v_uid;
            if v_ma is not null then return v_ma; end if;
        end;
    end loop;
end;
$$;

-- Nguồn ngẫu nhiên không cần extension pgcrypto: 16 byte từ gen_random_uuid() (Postgres 13+).
create or replace function sao_byte_ngau_nhien() returns bytea
    language sql volatile set search_path = '' as $$
    select decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex')
$$;

-- Thưởng chào mừng: một lần, khi đã lưu hồ sơ vào tài khoản.
create or replace function nhan_chao_mung() returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_n integer;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if not exists (select 1 from public.ho_so where user_id = v_uid) then
        return jsonb_build_object('ket_qua', 'chua_luu_ho_so');
    end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
    values (v_uid, public.sao_muc('chao_mung'), 'chao_mung', 'Lưu hồ sơ vào tài khoản', 'chao_mung:' || v_uid, current_date + 365)
    on conflict (khoa) do nothing;
    get diagnostics v_n = row_count;
    return jsonb_build_object('ket_qua', case when v_n = 1 then 'da_thuong' else 'da_nhan' end,
                              'sao', case when v_n = 1 then public.sao_muc('chao_mung') else 0 end);
end;
$$;

-- Thưởng mời hai phía. Người GỌI là người được mời (đã đăng nhập). Điều kiện:
--   mã tồn tại · không tự mời · tài khoản được mời mới tạo ≤ 7 ngày · đã lưu hồ sơ vào tài khoản ·
--   chưa từng được tính là "được mời". Người mời bị giới hạn 20 lượt thưởng/30 ngày (vẫn thưởng người được mời).
create or replace function nhan_thuong_gioi_thieu(p_ma text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_moi uuid;
    v_tao timestamptz;
    v_dem integer;
    v_thuong_moi boolean;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_ma is null or p_ma !~ '^[a-z0-9]{8}$' then return jsonb_build_object('ket_qua', 'khong_hop_le'); end if;
    select user_id into v_moi from public.ma_gioi_thieu where ma = p_ma;
    if v_moi is null then return jsonb_build_object('ket_qua', 'khong_hop_le'); end if;
    if v_moi = v_uid then return jsonb_build_object('ket_qua', 'tu_moi'); end if;
    select created_at into v_tao from auth.users where id = v_uid;
    if v_tao < now() - interval '7 days' then return jsonb_build_object('ket_qua', 'tai_khoan_cu'); end if;
    if not exists (select 1 from public.ho_so where user_id = v_uid) then
        return jsonb_build_object('ket_qua', 'chua_luu_ho_so');
    end if;

    -- Khoá theo người mời để đếm trần chính xác khi nhiều người nhận cùng lúc.
    perform pg_advisory_xact_lock(hashtext('gioi_thieu:' || v_moi));
    select count(*) into v_dem from public.gioi_thieu
        where nguoi_moi_id = v_moi and thuong_nguoi_moi and tao_luc > now() - interval '30 days';
    v_thuong_moi := v_dem < 20;

    insert into public.gioi_thieu (duoc_moi_id, nguoi_moi_id, ma, thuong_nguoi_moi)
    values (v_uid, v_moi, p_ma, v_thuong_moi)
    on conflict (duoc_moi_id) do nothing;
    if not found then return jsonb_build_object('ket_qua', 'da_nhan'); end if;

    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
    values (v_uid, public.sao_muc('duoc_moi'), 'duoc_moi', 'Nhận lời mời của bạn bè', 'duoc_moi:' || v_uid, current_date + 365);
    if v_thuong_moi then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
        values (v_moi, public.sao_muc('moi_ban'), 'moi_ban', 'Bạn bè nhận lời mời', 'moi_ban:' || v_uid, current_date + 365);
    end if;
    return jsonb_build_object('ket_qua', 'da_thuong', 'sao', public.sao_muc('duoc_moi'), 'thuong_nguoi_moi', v_thuong_moi);
end;
$$;

-- Tiêu Sao (chưa gắn tính năng nào — chuẩn bị cho Phase 3). Chỉ tiêu được Sao của chính mình.
create or replace function dung_sao(p_so integer, p_khoa text, p_ghi_chu text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_du integer;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_so is null or p_so <= 0 or p_khoa is null then return jsonb_build_object('ket_qua', 'khong_hop_le'); end if;
    perform pg_advisory_xact_lock(hashtext('sao:' || v_uid));
    if exists (select 1 from public.so_cai_sao where khoa = 'dung:' || v_uid || ':' || p_khoa) then
        return jsonb_build_object('ket_qua', 'da_dung');
    end if;
    v_du := public.so_du_sao();
    if v_du < p_so then return jsonb_build_object('ket_qua', 'khong_du', 'so_du', v_du); end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
    values (v_uid, -p_so, 'dung', left(p_ghi_chu, 120), 'dung:' || v_uid || ':' || p_khoa);
    return jsonb_build_object('ket_qua', 'da_dung', 'so_du', v_du - p_so);
end;
$$;

revoke all on function so_du_sao(), lay_ma_gioi_thieu(), nhan_chao_mung(), nhan_thuong_gioi_thieu(text),
    dung_sao(integer, text, text), sao_byte_ngau_nhien(), sao_muc(text) from public, anon;
grant execute on function so_du_sao(), lay_ma_gioi_thieu(), nhan_chao_mung(), nhan_thuong_gioi_thieu(text),
    dung_sao(integer, text, text) to authenticated;
