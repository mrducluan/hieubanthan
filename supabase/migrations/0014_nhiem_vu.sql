-- SAO-3 (2026-10-14, chủ dự án duyệt): "Nhiệm vụ kiếm Sao" — hộp ba nhiệm vụ dạy vòng tăng trưởng
-- (docs/MUC-TIEU-TANG-TRUONG.md ý tưởng 5): Lưu hồ sơ · Hỏi 3 câu · Mời 1 bạn → nhận Sao.
--
-- Điều kiện KIỂM Ở SQL từ dữ liệu sẵn có, client chỉ gọi:
--   luu_ho_so   có dòng ho_so của chính mình (0006).
--   hoi_3_cau   dem_hoi_tai_khoan.so ≥ 3. Bảng đếm MỚI (chỉ con số, KHÔNG lưu câu hỏi/câu trả lời): web máy chủ
--               cộng 1 bằng service role sau mỗi câu hỏi đáp trả lời được (HTTP 200) khi người hỏi đã đăng nhập.
--               Không dùng luot_hoi (0013): bảng đó chỉ đếm khi bật giới hạn hỏi đáp, theo NGÀY, và bị dọn sau 2 ngày.
--               Không dùng nhật ký hỏi (0004/0005): cố ý không gắn user_id. Người dùng KHÔNG tự cộng được (hàm
--               ghi_cau_hoi_tai_khoan chỉ service role).
--   moi_1_ban   có ≥ 1 dòng gioi_thieu mà mình là người mời (bạn đã tạo tài khoản + lưu hồ sơ + nhận lời mời, 0008).
--               Tính cả khi người mời đã quá trần thưởng mời 30 ngày (quan hệ mời vẫn được ghi).
-- Thưởng: mỗi nhiệm vụ MỘT lần mỗi tài khoản (khoá chính user+mã, khoá sổ cái 'nhiem_vu:<mã>:<uid>'), Sao tặng hạn
-- 365 ngày như các thưởng khác. Mức đọc từ cau_hinh (kẹp 0–50, mặc định 5/5/5). Công tắc sao.nhiem_vu.bat mặc định
-- TẮT (quy ước SAO-2): tắt thì vẫn xem tiến độ, không nhận Sao. Mức 0 = tạm dừng nhiệm vụ đó (không ghi đã nhận).
-- Chạy SAU 0013. Rollback: 0014_nhiem_vu.down.sql

-- Sổ cái nhận thêm loại 'nhiem_vu' (giữ nguyên các loại cũ).
alter table so_cai_sao drop constraint if exists so_cai_sao_loai_check;
alter table so_cai_sao add constraint so_cai_sao_loai_check
    check (loai in ('chao_mung', 'moi_ban', 'duoc_moi', 'dung', 'mua', 'dieu_chinh', 'nhiem_vu'));

create table if not exists nhiem_vu_sao (
    user_id  uuid not null references auth.users (id) on delete cascade,
    ma       text not null check (ma in ('luu_ho_so', 'hoi_3_cau', 'moi_1_ban')),
    so_sao   integer not null check (so_sao between 1 and 50),
    tao_luc  timestamptz not null default now(),
    primary key (user_id, ma)
);

create table if not exists dem_hoi_tai_khoan (
    user_id       uuid primary key references auth.users (id) on delete cascade,
    so            integer not null default 0 check (so >= 0),
    cap_nhat_luc  timestamptz not null default now()
);

alter table nhiem_vu_sao enable row level security;
alter table dem_hoi_tai_khoan enable row level security;
drop policy if exists "nhiem_vu_sao chu doc" on nhiem_vu_sao;
create policy "nhiem_vu_sao chu doc" on nhiem_vu_sao
    for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "dem_hoi_tai_khoan chu doc" on dem_hoi_tai_khoan;
create policy "dem_hoi_tai_khoan chu doc" on dem_hoi_tai_khoan
    for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete, truncate on nhiem_vu_sao, dem_hoi_tai_khoan from anon, authenticated;
revoke all on nhiem_vu_sao, dem_hoi_tai_khoan from anon;

-- ---------------------------------------------------------------- hàm phụ
create or replace function nv_bat() returns boolean
    language sql stable security definer set search_path = '' as $$
    select coalesce((select (gia_tri #>> '{}')::boolean from public.cau_hinh
                     where khoa = 'sao.nhiem_vu.bat' and jsonb_typeof(gia_tri) = 'boolean'), false)
$$;

create or replace function nv_muc(p_ma text) returns integer
    language sql stable security definer set search_path = '' as $$
    select case p_ma
        when 'luu_ho_so' then public.qt_so_cau_hinh('sao.nhiem_vu.luu_ho_so', 5, 0, 50)
        when 'hoi_3_cau' then public.qt_so_cau_hinh('sao.nhiem_vu.hoi_3_cau', 5, 0, 50)
        when 'moi_1_ban' then public.qt_so_cau_hinh('sao.nhiem_vu.moi_1_ban', 5, 0, 50)
        else 0 end
$$;

create or replace function nv_can(p_ma text) returns integer
    language sql immutable set search_path = '' as $$
    select case p_ma when 'luu_ho_so' then 1 when 'hoi_3_cau' then 3 when 'moi_1_ban' then 1 else 0 end
$$;

create or replace function nv_tien_do(p_uid uuid, p_ma text) returns integer
    language sql stable security definer set search_path = '' as $$
    select case p_ma
        when 'luu_ho_so' then (select count(*)::integer from public.ho_so where user_id = p_uid)
        when 'hoi_3_cau' then coalesce((select so from public.dem_hoi_tai_khoan where user_id = p_uid), 0)
        when 'moi_1_ban' then (select count(*)::integer from public.gioi_thieu where nguoi_moi_id = p_uid)
        else 0 end
$$;

-- ---------------------------------------------------------------- đếm câu hỏi (CHỈ service role — web máy chủ)
create or replace function ghi_cau_hoi_tai_khoan(p_user_id uuid) returns integer
    language sql security definer set search_path = '' as $$
    insert into public.dem_hoi_tai_khoan as d (user_id, so) values (p_user_id, 1)
    on conflict (user_id) do update set so = least(d.so + 1, 1000000), cap_nhat_luc = now()
    returning so
$$;

-- ---------------------------------------------------------------- người dùng
-- Tiến độ + đã nhận của chính mình. Tiến độ luôn đọc được (kể cả khi công tắc tắt).
create or replace function nhiem_vu_cua_toi() returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    return jsonb_build_object(
        'bat', public.nv_bat(),
        'nhiem_vu', (select jsonb_agg(jsonb_build_object(
                'ma', m.ma,
                'can', public.nv_can(m.ma),
                'tien_do', least(public.nv_tien_do(v_uid, m.ma), public.nv_can(m.ma)),
                'dat', public.nv_tien_do(v_uid, m.ma) >= public.nv_can(m.ma),
                'sao', public.nv_muc(m.ma),
                'da_nhan', n.ma is not null,
                'sao_da_nhan', n.so_sao) order by m.thu_tu)
            from (values ('luu_ho_so', 1), ('hoi_3_cau', 2), ('moi_1_ban', 3)) m(ma, thu_tu)
            left join public.nhiem_vu_sao n on n.user_id = v_uid and n.ma = m.ma));
end
$$;

-- Nhận thưởng một nhiệm vụ: kiểm công tắc → điều kiện → ghi đã nhận + bút toán sổ cái trong cùng giao dịch.
create or replace function nhan_thuong_nhiem_vu(p_ma text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_muc integer;
    v_td integer;
    v_ten text;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_ma is null or p_ma not in ('luu_ho_so', 'hoi_3_cau', 'moi_1_ban') then
        return jsonb_build_object('ket_qua', 'khong_hop_le');
    end if;
    if not public.nv_bat() then return jsonb_build_object('ket_qua', 'chua_mo'); end if;
    perform pg_advisory_xact_lock(hashtext('nhiem_vu:' || v_uid));
    if exists (select 1 from public.nhiem_vu_sao where user_id = v_uid and ma = p_ma) then
        return jsonb_build_object('ket_qua', 'da_nhan', 'sao', 0);
    end if;
    v_td := public.nv_tien_do(v_uid, p_ma);
    if v_td < public.nv_can(p_ma) then
        return jsonb_build_object('ket_qua', 'chua_dat', 'tien_do', v_td, 'can', public.nv_can(p_ma));
    end if;
    v_muc := public.nv_muc(p_ma);
    if v_muc <= 0 then return jsonb_build_object('ket_qua', 'chua_mo'); end if;
    v_ten := case p_ma when 'luu_ho_so' then 'Nhiệm vụ: lưu hồ sơ' when 'hoi_3_cau' then 'Nhiệm vụ: hỏi 3 câu'
                       else 'Nhiệm vụ: mời 1 bạn' end;
    insert into public.nhiem_vu_sao (user_id, ma, so_sao) values (v_uid, p_ma, v_muc);
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
    values (v_uid, v_muc, 'nhiem_vu', v_ten, 'nhiem_vu:' || p_ma || ':' || v_uid, current_date + 365)
    on conflict (khoa) do nothing;
    return jsonb_build_object('ket_qua', 'da_thuong', 'sao', v_muc);
end
$$;

revoke all on function nv_bat(), nv_muc(text), nv_can(text), nv_tien_do(uuid, text), ghi_cau_hoi_tai_khoan(uuid),
    nhiem_vu_cua_toi(), nhan_thuong_nhiem_vu(text) from public, anon, authenticated;
grant execute on function nhiem_vu_cua_toi(), nhan_thuong_nhiem_vu(text) to authenticated;
grant execute on function ghi_cau_hoi_tai_khoan(uuid) to service_role;
