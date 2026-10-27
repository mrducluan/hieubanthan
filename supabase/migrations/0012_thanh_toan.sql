-- TT-1 + TT-2 (2026-10-12, chủ dự án giao làm thanh toán nạp Sao — hình thức CÁ NHÂN, đăng ký hộ kinh doanh sau).
-- Thiết kế: docs/KE-HOACH-THANH-TOAN.md. Sao vẫn là credit nội bộ: KHÔNG đổi ra tiền, KHÔNG chuyển nhượng.
--
--   goi_sao     gói nạp (giá VND + số Sao). Ai cũng đọc gói đang bật. Số tiền đơn LUÔN lấy từ đây ở máy chủ,
--               không bao giờ lấy từ trình duyệt.
--   don_nap     mỗi lần bấm "Nạp" là một đơn: mã đơn số (payOS cần orderCode là số), người mua, gói, số tiền, cổng,
--               trạng thái. Người mua chỉ ĐỌC đơn của mình (RLS). Không lưu số thẻ / tài khoản ngân hàng người mua.
--   Hàm         tao_don_nap (người dùng) · huy_don_nap (người dùng, đơn đang chờ của mình) ·
--               gan_link_don + nap_sao_tu_cong (CHỈ service role — máy chủ web gọi sau khi kiểm chữ ký cổng) ·
--               hoan_don_nap + ds_don_nap (quản trị, qua MFA, ghi nhật ký).
-- nap_sao_tu_cong idempotent theo mã đơn (khoá sổ cái 'mua:{ma_don}' duy nhất) → webhook gửi lại / đối soát chạy
-- trùng không cộng hai lần; sai số tiền → từ chối, đơn chuyển 'sai_tien' để quản trị xử lý tay.
-- Sao MUA không hết hạn (het_han null). Chạy SAU 0011. Rollback: 0012_thanh_toan.down.sql

create table if not exists goi_sao (
    ma        text primary key check (ma ~ '^[a-z0-9_]{2,30}$'),
    ten       text not null check (char_length(ten) between 2 and 40),
    gia_vnd   integer not null check (gia_vnd between 2000 and 50000000),
    sao       integer not null check (sao between 1 and 100000),
    nhan      text check (nhan is null or char_length(nhan) <= 30),
    mo_ta     text check (mo_ta is null or char_length(mo_ta) <= 120),
    bat       boolean not null default true,
    thu_tu    integer not null default 0
);

insert into goi_sao (ma, ten, gia_vnd, sao, nhan, mo_ta, thu_tu) values
    ('thu',       'Thử',       29000,  30,  null,       'Gói nhỏ để thử', 1),
    ('pho_bien',  'Phổ biến',  99000,  110, 'Phổ biến', 'Tặng thêm 10%', 2),
    ('gia_dinh',  'Gia đình',  199000, 240, null,       'Tặng thêm 20% — xem cho cả nhà, hợp đôi', 3)
on conflict (ma) do nothing;

create sequence if not exists don_nap_ma_seq start with 100001;

create table if not exists don_nap (
    ma_don        bigint primary key default nextval('don_nap_ma_seq'),
    user_id       uuid not null references auth.users (id) on delete cascade,
    goi           text not null references goi_sao (ma),
    so_tien       integer not null check (so_tien > 0),
    sao           integer not null check (sao > 0),
    cong          text not null check (cong in ('payos', 'gia')),
    trang_thai    text not null default 'cho' check (trang_thai in ('cho', 'da_tra', 'huy', 'sai_tien', 'hoan')),
    link_id       text check (link_id is null or char_length(link_id) <= 100),
    ma_giao_dich  text check (ma_giao_dich is null or char_length(ma_giao_dich) <= 100),
    tao_luc       timestamptz not null default now(),
    het_han       timestamptz not null default now() + interval '15 minutes',
    tra_luc       timestamptz,
    ghi_chu       text check (ghi_chu is null or char_length(ghi_chu) <= 200)
);
alter sequence don_nap_ma_seq owned by don_nap.ma_don;
create index if not exists don_nap_user_idx on don_nap (user_id, tao_luc desc);
create index if not exists don_nap_cho_idx on don_nap (tao_luc) where trang_thai = 'cho';

alter table goi_sao enable row level security;
alter table don_nap enable row level security;

drop policy if exists "goi_sao ai cung doc goi bat" on goi_sao;
create policy "goi_sao ai cung doc goi bat" on goi_sao for select to anon, authenticated using (bat);
drop policy if exists "don_nap chu doc" on don_nap;
create policy "don_nap chu doc" on don_nap for select to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- người mua
-- Tạo đơn: số tiền + Sao lấy từ goi_sao. Chống spam: tối đa 5 đơn đang chờ còn hạn / người.
create or replace function tao_don_nap(p_goi text, p_cong text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_goi public.goi_sao;
    v_don public.don_nap;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_cong is null or p_cong not in ('payos', 'gia') then return jsonb_build_object('ket_qua', 'cong_khong_hop_le'); end if;
    select * into v_goi from public.goi_sao where ma = p_goi and bat;
    if v_goi.ma is null then return jsonb_build_object('ket_qua', 'goi_khong_hop_le'); end if;
    perform pg_advisory_xact_lock(hashtext('don_nap:' || v_uid));
    if (select count(*) from public.don_nap
        where user_id = v_uid and trang_thai = 'cho' and het_han > now()) >= 5 then
        return jsonb_build_object('ket_qua', 'qua_nhieu_don');
    end if;
    insert into public.don_nap (user_id, goi, so_tien, sao, cong)
    values (v_uid, v_goi.ma, v_goi.gia_vnd, v_goi.sao, p_cong)
    returning * into v_don;
    return jsonb_build_object('ket_qua', 'da_tao', 'ma_don', v_don.ma_don, 'so_tien', v_don.so_tien, 'sao', v_don.sao,
                              'ten_goi', v_goi.ten, 'het_han', v_don.het_han);
end
$$;

create or replace function huy_don_nap(p_ma_don bigint) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    update public.don_nap set trang_thai = 'huy'
    where ma_don = p_ma_don and user_id = v_uid and trang_thai = 'cho';
    return jsonb_build_object('ket_qua', case when found then 'da_huy' else 'khong_doi' end);
end
$$;

-- ---------------------------------------------------------------- máy chủ (service role)
create or replace function gan_link_don(p_ma_don bigint, p_link_id text) returns void
    language sql security definer set search_path = '' as $$
    update public.don_nap set link_id = left(p_link_id, 100) where ma_don = p_ma_don and link_id is null
$$;

-- Cổng báo đã nhận tiền (webhook đã kiểm chữ ký, hoặc đối soát tra cổng). Idempotent theo mã đơn.
-- Đơn đã huỷ / quá hạn mà tiền vẫn về → vẫn cộng Sao (người mua đã trả tiền thật).
create or replace function nap_sao_tu_cong(p_ma_don bigint, p_so_tien integer, p_cong text, p_ma_giao_dich text)
    returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
begin
    select * into v_don from public.don_nap where ma_don = p_ma_don for update;
    if v_don.ma_don is null then return jsonb_build_object('ket_qua', 'khong_co_don'); end if;
    if v_don.cong <> p_cong then return jsonb_build_object('ket_qua', 'sai_cong'); end if;
    if v_don.trang_thai in ('da_tra', 'hoan') then return jsonb_build_object('ket_qua', 'da_xu_ly', 'sao', v_don.sao); end if;
    if p_so_tien is distinct from v_don.so_tien then
        update public.don_nap set trang_thai = 'sai_tien', ma_giao_dich = left(p_ma_giao_dich, 100),
            ghi_chu = left('Cổng báo ' || coalesce(p_so_tien::text, 'null') || ' ₫, đơn ' || v_don.so_tien || ' ₫', 200)
        where ma_don = p_ma_don;
        return jsonb_build_object('ket_qua', 'sai_tien');
    end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
    values (v_don.user_id, v_don.sao, 'mua', left('Nạp gói ' || v_don.goi || ' · đơn ' || v_don.ma_don, 120),
            'mua:' || v_don.ma_don, null)
    on conflict (khoa) do nothing;
    update public.don_nap set trang_thai = 'da_tra', tra_luc = now(), ma_giao_dich = left(p_ma_giao_dich, 100)
    where ma_don = p_ma_don;
    return jsonb_build_object('ket_qua', 'da_nap', 'sao', v_don.sao);
end
$$;

-- Đơn đang chờ (để máy chủ đối soát với cổng) — chỉ service role.
create or replace function don_cho_doi_soat(p_gioi_han integer default 50) returns setof public.don_nap
    language sql stable security definer set search_path = '' as $$
    select * from public.don_nap
    where trang_thai = 'cho' and tao_luc < now() - interval '2 minutes' and tao_luc > now() - interval '3 days'
    order by tao_luc limit least(greatest(coalesce(p_gioi_han, 50), 1), 200)
$$;

-- ---------------------------------------------------------------- quản trị (MFA, ghi nhật ký)
-- Hoàn tiền thủ công: anh chuyển trả tiền ngoài hệ thống, rồi bấm ở đây → bút toán trừ đúng số Sao của đơn
-- (số dư có thể âm nếu người mua đã tiêu — ghi rõ, không sửa dòng cũ).
create or replace function hoan_don_nap(p_ma_don bigint, p_ly_do text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_don public.don_nap;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    if p_ly_do is null or char_length(trim(p_ly_do)) not between 5 and 120 then
        return jsonb_build_object('ket_qua', 'thieu_ly_do');
    end if;
    select * into v_don from public.don_nap where ma_don = p_ma_don for update;
    if v_don.ma_don is null then return jsonb_build_object('ket_qua', 'khong_co_don'); end if;
    if v_don.trang_thai <> 'da_tra' then return jsonb_build_object('ket_qua', 'khong_hoan_duoc', 'trang_thai', v_don.trang_thai); end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
    values (v_don.user_id, -v_don.sao, 'dieu_chinh', left('Hoàn tiền đơn ' || v_don.ma_don || ': ' || trim(p_ly_do), 120),
            'hoan:' || v_don.ma_don)
    on conflict (khoa) do nothing;
    update public.don_nap set trang_thai = 'hoan', ghi_chu = left(trim(p_ly_do), 200) where ma_don = p_ma_don;
    perform public.qt_ghi('don_nap.hoan', p_ma_don::text, jsonb_build_object('sao', v_don.sao, 'so_tien', v_don.so_tien,
                                                                             'ly_do', left(trim(p_ly_do), 120)));
    return jsonb_build_object('ket_qua', 'da_hoan', 'sao', v_don.sao);
end
$$;

-- Danh sách đơn gần đây cho quản trị: không trả email / hồ sơ — chỉ mã đơn, gói, tiền, trạng thái.
create or replace function ds_don_nap(p_trang_thai text default null, p_gioi_han integer default 50) returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'ho_tro']);
    return coalesce((select jsonb_agg(jsonb_build_object('ma_don', ma_don, 'goi', goi, 'so_tien', so_tien, 'sao', sao,
            'cong', cong, 'trang_thai', trang_thai, 'tao_luc', tao_luc, 'tra_luc', tra_luc, 'ghi_chu', ghi_chu)
            order by tao_luc desc)
        from (select * from public.don_nap where p_trang_thai is null or trang_thai = p_trang_thai
              order by tao_luc desc limit least(greatest(coalesce(p_gioi_han, 50), 1), 200)) d), '[]'::jsonb);
end
$$;

-- ---------------------------------------------------------------- quyền
revoke all on function tao_don_nap(text, text), huy_don_nap(bigint), gan_link_don(bigint, text),
    nap_sao_tu_cong(bigint, integer, text, text), don_cho_doi_soat(integer), hoan_don_nap(bigint, text),
    ds_don_nap(text, integer) from public, anon, authenticated;
grant execute on function tao_don_nap(text, text), huy_don_nap(bigint), hoan_don_nap(bigint, text),
    ds_don_nap(text, integer) to authenticated;
grant execute on function gan_link_don(bigint, text), nap_sao_tu_cong(bigint, integer, text, text),
    don_cho_doi_soat(integer) to service_role;
grant select on goi_sao to anon, authenticated;
grant select on don_nap to authenticated;
revoke insert, update, delete on goi_sao, don_nap from anon, authenticated;
