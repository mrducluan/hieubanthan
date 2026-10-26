-- SAO-GL (2026-10-26, chủ dự án duyệt "chống gian lận trước khi bật hoa hồng" — docs/DANH-GIA-VIRAL-V2-VA-KINH-DOANH.md §4,
-- pentest SEC-3 phát hiện 1: farm thưởng mời bằng nhiều tài khoản phụ).
--
-- Tín hiệu thiết bị = HMAC(IP + user-agent) do WEB MÁY CHỦ tính bằng bí mật máy chủ (SAO_KHOA_SECRET) — không lưu IP,
-- không lưu user-agent, người dùng không tự tính được. Truyền vào khi nhận thưởng mời (p_thiet_bi, có thể null: không
-- có tín hiệu thì không chặn, như trước).
--   (1) Một thiết bị nhận lời mời cho QUÁ NHIỀU tài khoản trong 30 ngày (mặc định ≥ 3) → người được mời vẫn nhận thưởng
--       của mình, NGƯỜI MỜI không được thưởng, ghi cờ cho người duyệt.
--   (2) Thiết bị người được mời TRÙNG thiết bị lúc người mời nhận lời mời của chính họ → coi như cùng một người: không
--       thưởng người mời, ghi cờ.
--   (3) Hoa hồng: đơn của người được mời có cờ (1)/(2) → không cộng hoa hồng (trạng thái 'nghi_gian_lan'), ghi cờ.
-- Máy KHÔNG tự khoá tài khoản, không trừ Sao đã cộng — chỉ không cộng thưởng mới + ghi cờ cho người duyệt (chủ sở hữu,
-- MFA). Công tắc sao.gian_lan.bat (mặc định BẬT — an toàn hơn). Chạy SAU 0025. Rollback: 0026_chong_gian_lan.down.sql

alter table gioi_thieu add column if not exists thiet_bi text check (thiet_bi is null or thiet_bi ~ '^[a-f0-9]{32,64}$');
alter table gioi_thieu add column if not exists co_gian_lan text check (co_gian_lan is null or co_gian_lan in ('nhieu_tai_khoan', 'cung_thiet_bi'));
create index if not exists gioi_thieu_thiet_bi_idx on gioi_thieu (thiet_bi, tao_luc desc) where thiet_bi is not null;

alter table hoa_hong drop constraint if exists hoa_hong_trang_thai_check;
alter table hoa_hong add constraint hoa_hong_trang_thai_check
    check (trang_thai in ('da_cong', 'qua_tran', 'thu_hoi', 'nghi_gian_lan'));
-- 'nghi_gian_lan' có sao = 0 (ràng buộc sao <= sao_tinh vẫn đúng).

-- Cờ cho người duyệt — chỉ thêm, không ai sửa. Không chứa IP / user-agent (chỉ mã băm thiết bị).
create table if not exists gian_lan_co (
    id        bigint generated always as identity primary key,
    loai      text not null check (loai in ('nhieu_tai_khoan', 'cung_thiet_bi', 'hoa_hong_nghi')),
    user_id   uuid references auth.users (id) on delete cascade,      -- người MỜI (người hưởng lợi)
    lien_quan uuid references auth.users (id) on delete cascade,      -- người được mời
    thiet_bi  text,
    chi_tiet  jsonb,
    tao_luc   timestamptz not null default now()
);
create index if not exists gian_lan_co_luc_idx on gian_lan_co (tao_luc desc);
alter table gian_lan_co enable row level security;   -- không policy: chỉ qua hàm quản trị / service role
revoke all on gian_lan_co from anon, authenticated;

create or replace function gl_tran_thiet_bi() returns integer
    language sql stable security definer set search_path = '' as $$
    select public.qt_so_cau_hinh('sao.gian_lan.thiet_bi_30_ngay', 3, 2, 50)
$$;

create or replace function gl_bat() returns boolean
    language sql stable security definer set search_path = '' as $$
    select coalesce((select (gia_tri #>> '{}')::boolean from public.cau_hinh
                     where khoa = 'sao.gian_lan.bat' and jsonb_typeof(gia_tri) = 'boolean'), true)
$$;

-- Thay bản 0025: thêm p_thiet_bi (mặc định null = không có tín hiệu, hành vi như cũ). Bản 1 tham số bị bỏ để không mơ hồ.
drop function if exists nhan_thuong_gioi_thieu(text);
create or replace function nhan_thuong_gioi_thieu(p_ma text, p_thiet_bi text default null) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_moi uuid;
    v_dem integer;
    v_thuong_moi boolean;
    v_co text;
    v_tb text := case when p_thiet_bi ~ '^[a-f0-9]{32,64}$' then p_thiet_bi end;
    v_muc_duoc integer := public.sao_muc('duoc_moi');
    v_muc_moi integer := public.sao_muc('moi_ban');
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if p_ma is null or p_ma !~ '^[a-z0-9]{8}$' then return jsonb_build_object('ket_qua', 'khong_hop_le'); end if;
    select user_id into v_moi from public.ma_gioi_thieu where ma = p_ma;
    if v_moi is null then return jsonb_build_object('ket_qua', 'khong_hop_le'); end if;
    if v_moi = v_uid then return jsonb_build_object('ket_qua', 'tu_moi'); end if;
    if exists (select 1 from public.gioi_thieu where duoc_moi_id = v_uid) then
        return jsonb_build_object('ket_qua', 'da_nhan');
    end if;
    if exists (select 1 from public.gioi_thieu where duoc_moi_id = v_moi and nguoi_moi_id = v_uid) then
        return jsonb_build_object('ket_qua', 'moi_vong');
    end if;
    if not exists (select 1 from public.ho_so where user_id = v_uid) then
        return jsonb_build_object('ket_qua', 'chua_luu_ho_so');
    end if;

    perform pg_advisory_xact_lock(hashtext('gioi_thieu:' || v_moi));
    select count(*) into v_dem from public.gioi_thieu
        where nguoi_moi_id = v_moi and thuong_nguoi_moi and tao_luc > now() - interval '30 days';
    v_thuong_moi := v_dem < public.sao_tran_moi() and v_muc_moi > 0;

    if v_tb is not null and public.gl_bat() then
        perform pg_advisory_xact_lock(hashtext('gl_tb:' || v_tb));
        if exists (select 1 from public.gioi_thieu where duoc_moi_id = v_moi and thiet_bi = v_tb) then
            v_co := 'cung_thiet_bi';
        elsif (select count(*) from public.gioi_thieu
               where thiet_bi = v_tb and tao_luc > now() - interval '30 days') + 1 >= public.gl_tran_thiet_bi() then
            v_co := 'nhieu_tai_khoan';
        end if;
        if v_co is not null then v_thuong_moi := false; end if;
    end if;

    insert into public.gioi_thieu (duoc_moi_id, nguoi_moi_id, ma, thuong_nguoi_moi, thiet_bi, co_gian_lan)
    values (v_uid, v_moi, p_ma, v_thuong_moi, v_tb, v_co)
    on conflict (duoc_moi_id) do nothing;
    if not found then return jsonb_build_object('ket_qua', 'da_nhan'); end if;
    if v_co is not null then
        insert into public.gian_lan_co (loai, user_id, lien_quan, thiet_bi, chi_tiet)
        values (v_co, v_moi, v_uid, v_tb, jsonb_build_object('ma', p_ma));
    end if;

    if v_muc_duoc > 0 then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
        values (v_uid, v_muc_duoc, 'duoc_moi', 'Nhận lời mời của bạn bè', 'duoc_moi:' || v_uid, current_date + 365);
    end if;
    if v_thuong_moi then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
        values (v_moi, v_muc_moi, 'moi_ban', 'Bạn bè nhận lời mời', 'moi_ban:' || v_uid, current_date + 365);
    end if;
    -- Không lộ cờ cho người dùng (tránh dạy cách lách): chỉ báo người mời có được thưởng hay không như trước.
    return jsonb_build_object('ket_qua', 'da_thuong', 'sao', v_muc_duoc, 'thuong_nguoi_moi', v_thuong_moi);
end;
$$;

-- Thay bản 0025: thêm kiểm cờ gian lận trước khi cộng hoa hồng. Phần còn lại giữ nguyên.
create or replace function hh_cho_don(p_ma_don bigint) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_g public.gioi_thieu;
    v_thu_tu integer;
    v_pt integer := public.qt_so_cau_hinh('sao.hoa_hong.phan_tram', 20, 0, 50);
    v_so_don integer := public.qt_so_cau_hinh('sao.hoa_hong.so_don', 1, 1, 12);
    v_thang integer := public.qt_so_cau_hinh('sao.hoa_hong.thang', 12, 1, 36);
    v_tran integer := public.qt_so_cau_hinh('sao.hoa_hong.tran_30_ngay', 1000, 0, 10000);
    v_tinh integer;
    v_da integer;
    v_cho integer;
begin
    if not public.qt_bat_cau_hinh('sao.hoa_hong.bat') or v_pt <= 0 then return jsonb_build_object('ket_qua', 'tat'); end if;
    select * into v_don from public.don_nap where ma_don = p_ma_don;
    if v_don.ma_don is null or v_don.trang_thai <> 'da_tra' then return jsonb_build_object('ket_qua', 'khong_ap_dung'); end if;
    select * into v_g from public.gioi_thieu where duoc_moi_id = v_don.user_id;
    if v_g.duoc_moi_id is null then return jsonb_build_object('ket_qua', 'khong_duoc_moi'); end if;
    if v_g.tao_luc < now() - make_interval(months => v_thang) then return jsonb_build_object('ket_qua', 'het_thoi_han'); end if;
    select count(*) + 1 into v_thu_tu from public.don_nap d
        where d.user_id = v_don.user_id and d.trang_thai in ('da_tra', 'hoan') and d.ma_don <> v_don.ma_don
          and (d.tra_luc < v_don.tra_luc or (d.tra_luc = v_don.tra_luc and d.ma_don < v_don.ma_don));
    if v_thu_tu > v_so_don then return jsonb_build_object('ket_qua', 'ngoai_so_don'); end if;
    v_tinh := floor(v_don.sao * v_pt / 100.0)::integer;
    if v_tinh <= 0 then return jsonb_build_object('ket_qua', 'qua_nho'); end if;

    perform pg_advisory_xact_lock(hashtext('hoa_hong:' || v_g.nguoi_moi_id));
    if exists (select 1 from public.hoa_hong where ma_don = p_ma_don) then return jsonb_build_object('ket_qua', 'da_xu_ly'); end if;

    if v_g.co_gian_lan is not null and public.gl_bat() then
        insert into public.hoa_hong (ma_don, nguoi_moi_id, duoc_moi_id, sao_don, phan_tram, sao_tinh, sao, trang_thai)
        values (p_ma_don, v_g.nguoi_moi_id, v_don.user_id, v_don.sao, v_pt, v_tinh, 0, 'nghi_gian_lan');
        insert into public.gian_lan_co (loai, user_id, lien_quan, thiet_bi, chi_tiet)
        values ('hoa_hong_nghi', v_g.nguoi_moi_id, v_don.user_id, v_g.thiet_bi,
                jsonb_build_object('ma_don', p_ma_don, 'co_moi', v_g.co_gian_lan));
        return jsonb_build_object('ket_qua', 'nghi_gian_lan', 'sao', 0);
    end if;

    select coalesce(sum(sao), 0) into v_da from public.hoa_hong
        where nguoi_moi_id = v_g.nguoi_moi_id and trang_thai = 'da_cong' and tao_luc > now() - interval '30 days';
    v_cho := least(v_tinh, greatest(0, v_tran - v_da));
    insert into public.hoa_hong (ma_don, nguoi_moi_id, duoc_moi_id, sao_don, phan_tram, sao_tinh, sao, trang_thai)
    values (p_ma_don, v_g.nguoi_moi_id, v_don.user_id, v_don.sao, v_pt, v_tinh, v_cho,
            case when v_cho > 0 then 'da_cong' else 'qua_tran' end);
    if v_cho > 0 then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
        values (v_g.nguoi_moi_id, v_cho, 'hoa_hong', 'Hoa hồng: bạn bè bạn mời đã nạp Sao', 'hoa_hong:' || p_ma_don,
                current_date + 365)
        on conflict (khoa) do nothing;
    end if;
    return jsonb_build_object('ket_qua', case when v_cho > 0 then 'da_cong' else 'qua_tran' end, 'sao', v_cho);
end
$$;

-- Quản trị (chủ sở hữu, MFA): cờ gần đây để người duyệt xem. Mỗi lần xem ghi nhật ký. Trả email để đối soát.
create or replace function gian_lan_gan_day(p_ngay integer default 30) returns jsonb
    language plpgsql security definer set search_path = '' as $$
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    p_ngay := least(greatest(coalesce(p_ngay, 30), 1), 365);
    perform public.qt_ghi('gian_lan.xem', p_ngay::text, null);
    return jsonb_build_object(
        'tong', (select jsonb_object_agg(loai, n) from (select loai, count(*) n from public.gian_lan_co
                 where tao_luc > now() - make_interval(days => p_ngay) group by loai) t),
        'ds', coalesce((select jsonb_agg(jsonb_build_object('loai', c.loai, 'nguoi_moi', u.email, 'duoc_moi', v.email,
                    'luc', c.tao_luc, 'chi_tiet', c.chi_tiet) order by c.tao_luc desc)
                 from (select * from public.gian_lan_co where tao_luc > now() - make_interval(days => p_ngay)
                       order by tao_luc desc limit 100) c
                 left join auth.users u on u.id = c.user_id
                 left join auth.users v on v.id = c.lien_quan), '[]'::jsonb));
end
$$;

revoke all on function gl_tran_thiet_bi(), gl_bat(), gian_lan_gan_day(integer) from public, anon, authenticated;
grant execute on function gian_lan_gan_day(integer) to authenticated;
revoke all on function nhan_thuong_gioi_thieu(text, text) from public, anon;
grant execute on function nhan_thuong_gioi_thieu(text, text) to authenticated;
revoke all on function hh_cho_don(bigint) from public, anon, authenticated;
