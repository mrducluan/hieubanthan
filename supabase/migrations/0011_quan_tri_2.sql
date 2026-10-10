-- QT-2 + QT-3 (2026-10-10, chủ dự án giao làm tiếp QT-2…QT-4 — docs/KIEN-TRUC-QUAN-TRI.md, docs/MUC-TIEU-TANG-TRUONG.md).
--
-- Không thêm bảng mới. Chỉ thêm HÀM (đều SECURITY DEFINER, kiểm vai trò có hiệu lực = đã qua MFA aal2):
--   Cài đặt site      dat_cau_hinh / xoa_cau_hinh (chủ sở hữu) · cau_hinh_cong_khai() (ai cũng đọc — chỉ khoá
--                     tiền tố site./sao./luan_giai., KHÔNG BAO GIỜ chứa bí mật).
--   Thưởng Sao        sao_muc() + sao_tran_moi() đọc cau_hinh (kẹp 0–100 / 0–200, thiếu thì mặc định cũ 10/20/20,
--                     trần 20) → chủ sở hữu chạy "chiến dịch mời" không cần sửa code. nhan_thuong_gioi_thieu thay
--                     hằng 20 bằng sao_tran_moi(); phần còn lại giữ nguyên 0008.
--   Vai trò           danh_sach_quan_tri / cap_vai_tro / go_vai_tro (chủ sở hữu; không tự đổi, không tự gỡ).
--   Sổ Sao            tra_cuu_sao (chủ sở hữu + hỗ trợ, theo email — mọi lần tra đều ghi nhật ký) ·
--                     dieu_chinh_sao (chủ sở hữu, BÚT TOÁN có lý do, không sửa số dư, có khoá chống ghi trùng).
--   Tăng trưởng       thong_ke_tang_truong(): chuỗi theo TUẦN, chỉ SỐ TỔNG.
--   Hỏi đáp (QT-3)    thong_ke_hoi() + nhat_ky_hoi_gan_day(): đọc nhật ký hỏi đáp đã ẩn danh (0004/0005 vốn
--                     chỉ service role đọc) — dành cho quản trị đã qua MFA, để tìm lỗ hổng tri thức.
-- Mọi hàm GHI đều ghi nhat_ky_quan_tri trong cùng giao dịch. Không hàm nào trả hồ sơ / ngày giờ sinh của ai.
-- Chạy SAU 0010. Rollback: 0011_quan_tri_2.down.sql

-- ---------------------------------------------------------------- hàm phụ
create or replace function qt_can_vai_tro(p_duoc text[]) returns text
    language plpgsql stable security definer set search_path = '' as $$
declare v text := public.vai_tro_hieu_luc();
begin
    if v is null or not (v = any (p_duoc)) then raise exception 'khong_co_quyen'; end if;
    return v;
end
$$;

create or replace function qt_ghi(p_hanh_dong text, p_doi_tuong text, p_chi_tiet jsonb) returns void
    language sql security definer set search_path = '' as $$
    insert into public.nhat_ky_quan_tri (user_id, hanh_dong, doi_tuong, chi_tiet)
    values ((select auth.uid()), p_hanh_dong, p_doi_tuong, p_chi_tiet)
$$;

-- ---------------------------------------------------------------- cài đặt site
create or replace function dat_cau_hinh(p_khoa text, p_gia_tri jsonb, p_mo_ta text default null) returns void
    language plpgsql security definer set search_path = '' as $$
declare v_cu jsonb;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    if p_khoa is null or p_khoa !~ '^(site|sao|luan_giai)\.[a-z0-9_.]{2,50}$' then raise exception 'khoa_khong_hop_le'; end if;
    if p_gia_tri is null or pg_column_size(p_gia_tri) > 4096 then raise exception 'gia_tri_khong_hop_le'; end if;
    select gia_tri into v_cu from public.cau_hinh where khoa = p_khoa;
    insert into public.cau_hinh (khoa, gia_tri, mo_ta, cap_nhat_boi, cap_nhat_luc)
    values (p_khoa, p_gia_tri, left(p_mo_ta, 300), (select auth.uid()), now())
    on conflict (khoa) do update set gia_tri = excluded.gia_tri, mo_ta = coalesce(excluded.mo_ta, public.cau_hinh.mo_ta),
        cap_nhat_boi = excluded.cap_nhat_boi, cap_nhat_luc = excluded.cap_nhat_luc;
    perform public.qt_ghi('cau_hinh.dat', p_khoa, jsonb_build_object('cu', v_cu, 'moi', p_gia_tri));
end
$$;

create or replace function xoa_cau_hinh(p_khoa text) returns void
    language plpgsql security definer set search_path = '' as $$
declare v_cu jsonb;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    delete from public.cau_hinh where khoa = p_khoa returning gia_tri into v_cu;
    if found then perform public.qt_ghi('cau_hinh.xoa', p_khoa, jsonb_build_object('cu', v_cu)); end if;
end
$$;

-- Ai cũng đọc được (web đọc bằng khoá anon, cache ngắn). Chỉ khoá công khai theo tiền tố.
create or replace function cau_hinh_cong_khai() returns jsonb
    language sql stable security definer set search_path = '' as $$
    select coalesce(jsonb_object_agg(khoa, gia_tri), '{}'::jsonb) from public.cau_hinh
    where khoa ~ '^(site|sao|luan_giai)\.'
$$;

-- Đọc một số nguyên trong cau_hinh, kẹp trong [p_min, p_max]; sai kiểu / thiếu → mặc định.
create or replace function qt_so_cau_hinh(p_khoa text, p_mac_dinh integer, p_min integer, p_max integer) returns integer
    language sql stable security definer set search_path = '' as $$
    select least(p_max, greatest(p_min, coalesce(
        (select round((gia_tri #>> '{}')::numeric)::integer from public.cau_hinh
         where khoa = p_khoa and jsonb_typeof(gia_tri) = 'number'),
        p_mac_dinh)))
$$;

-- Thay bản 0008 (immutable, hằng số) — cùng chữ ký, cùng mặc định.
create or replace function sao_muc(p_loai text) returns integer
    language sql stable security definer set search_path = '' as $$
    select case p_loai
        when 'chao_mung' then public.qt_so_cau_hinh('sao.thuong.chao_mung', 10, 0, 100)
        when 'moi_ban'   then public.qt_so_cau_hinh('sao.thuong.moi_ban', 20, 0, 100)
        when 'duoc_moi'  then public.qt_so_cau_hinh('sao.thuong.duoc_moi', 20, 0, 100)
        else 0 end
$$;

create or replace function sao_tran_moi() returns integer
    language sql stable security definer set search_path = '' as $$
    select public.qt_so_cau_hinh('sao.tran_moi_30_ngay', 20, 0, 200)
$$;

-- so_cai_sao.so_luong có check <> 0: mức thưởng chỉnh về 0 thì bỏ qua dòng thưởng đó (vẫn ghi quan hệ mời).
create or replace function nhan_chao_mung() returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_muc integer := public.sao_muc('chao_mung');
    v_n integer := 0;
begin
    if v_uid is null then raise exception 'chua_dang_nhap'; end if;
    if not exists (select 1 from public.ho_so where user_id = v_uid) then
        return jsonb_build_object('ket_qua', 'chua_luu_ho_so');
    end if;
    if exists (select 1 from public.so_cai_sao where khoa = 'chao_mung:' || v_uid) then
        return jsonb_build_object('ket_qua', 'da_nhan', 'sao', 0);
    end if;
    if v_muc > 0 then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
        values (v_uid, v_muc, 'chao_mung', 'Lưu hồ sơ vào tài khoản', 'chao_mung:' || v_uid, current_date + 365)
        on conflict (khoa) do nothing;
        get diagnostics v_n = row_count;
    end if;
    return jsonb_build_object('ket_qua', case when v_n = 1 then 'da_thuong' else 'da_nhan' end,
                              'sao', case when v_n = 1 then v_muc else 0 end);
end;
$$;

create or replace function nhan_thuong_gioi_thieu(p_ma text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_moi uuid;
    v_tao timestamptz;
    v_dem integer;
    v_thuong_moi boolean;
    v_muc_duoc integer := public.sao_muc('duoc_moi');
    v_muc_moi integer := public.sao_muc('moi_ban');
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

    perform pg_advisory_xact_lock(hashtext('gioi_thieu:' || v_moi));
    select count(*) into v_dem from public.gioi_thieu
        where nguoi_moi_id = v_moi and thuong_nguoi_moi and tao_luc > now() - interval '30 days';
    v_thuong_moi := v_dem < public.sao_tran_moi() and v_muc_moi > 0;

    insert into public.gioi_thieu (duoc_moi_id, nguoi_moi_id, ma, thuong_nguoi_moi)
    values (v_uid, v_moi, p_ma, v_thuong_moi)
    on conflict (duoc_moi_id) do nothing;
    if not found then return jsonb_build_object('ket_qua', 'da_nhan'); end if;

    if v_muc_duoc > 0 then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
        values (v_uid, v_muc_duoc, 'duoc_moi', 'Nhận lời mời của bạn bè', 'duoc_moi:' || v_uid, current_date + 365);
    end if;
    if v_thuong_moi then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
        values (v_moi, v_muc_moi, 'moi_ban', 'Bạn bè nhận lời mời', 'moi_ban:' || v_uid, current_date + 365);
    end if;
    return jsonb_build_object('ket_qua', 'da_thuong', 'sao', v_muc_duoc, 'thuong_nguoi_moi', v_thuong_moi);
end;
$$;

-- ---------------------------------------------------------------- vai trò
create or replace function danh_sach_quan_tri() returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    return coalesce((
        select jsonb_agg(jsonb_build_object('user_id', v.user_id, 'email', u.email, 'vai_tro', v.vai_tro,
                                            'tao_luc', v.tao_luc, 'cap_boi', c.email,
                                            'dang_nhap_luc', u.last_sign_in_at) order by v.tao_luc)
        from public.vai_tro_quan_tri v
        join auth.users u on u.id = v.user_id
        left join auth.users c on c.id = v.cap_boi), '[]'::jsonb);
end
$$;

-- Người được cấp phải đăng nhập hieuban.com ít nhất một lần (có trong auth.users).
create or replace function cap_vai_tro(p_email text, p_vai_tro text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid;
    v_cu text;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    if p_vai_tro not in ('chu_so_huu', 'bien_tap', 'tham_dinh', 'ho_tro', 'xem') then
        return jsonb_build_object('ket_qua', 'vai_tro_khong_hop_le');
    end if;
    select id into v_uid from auth.users where lower(email) = lower(trim(p_email)) limit 1;
    if v_uid is null then return jsonb_build_object('ket_qua', 'chua_co_tai_khoan'); end if;
    if v_uid = (select auth.uid()) then return jsonb_build_object('ket_qua', 'khong_tu_doi'); end if;
    select vai_tro into v_cu from public.vai_tro_quan_tri where user_id = v_uid;
    insert into public.vai_tro_quan_tri (user_id, vai_tro, cap_boi) values (v_uid, p_vai_tro, (select auth.uid()))
    on conflict (user_id) do update set vai_tro = excluded.vai_tro, cap_boi = excluded.cap_boi;
    perform public.qt_ghi('vai_tro.cap', v_uid::text, jsonb_build_object('cu', v_cu, 'moi', p_vai_tro));
    return jsonb_build_object('ket_qua', 'da_cap', 'cu', v_cu);
end
$$;

create or replace function go_vai_tro(p_user_id uuid) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_cu text;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    if p_user_id = (select auth.uid()) then return jsonb_build_object('ket_qua', 'khong_tu_go'); end if;
    delete from public.vai_tro_quan_tri where user_id = p_user_id returning vai_tro into v_cu;
    if not found then return jsonb_build_object('ket_qua', 'khong_co'); end if;
    perform public.qt_ghi('vai_tro.go', p_user_id::text, jsonb_build_object('cu', v_cu));
    return jsonb_build_object('ket_qua', 'da_go');
end
$$;

-- ---------------------------------------------------------------- sổ Sao
create or replace function qt_so_du(p_uid uuid) returns integer
    language sql stable security definer set search_path = '' as $$
    select coalesce(sum(so_luong), 0)::integer from public.so_cai_sao
    where user_id = p_uid and (so_luong < 0 or het_han is null or het_han >= current_date)
$$;

-- Tra theo email (người dùng nhờ hỗ trợ). Trả số dư + 30 giao dịch gần nhất + số lời mời. Không trả hồ sơ.
create or replace function tra_cuu_sao(p_email text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare v_uid uuid;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'ho_tro']);
    select id into v_uid from auth.users where lower(email) = lower(trim(p_email)) limit 1;
    perform public.qt_ghi('sao.tra_cuu', coalesce(v_uid::text, 'khong_thay'), null);
    if v_uid is null then return jsonb_build_object('ket_qua', 'khong_thay'); end if;
    return jsonb_build_object(
        'ket_qua', 'ok',
        'ma', left(v_uid::text, 8),
        'so_du', public.qt_so_du(v_uid),
        'da_moi', (select count(*) from public.gioi_thieu where nguoi_moi_id = v_uid),
        'duoc_moi', exists (select 1 from public.gioi_thieu where duoc_moi_id = v_uid),
        'giao_dich', coalesce((
            select jsonb_agg(jsonb_build_object('so_luong', so_luong, 'loai', loai, 'ghi_chu', ghi_chu,
                                                'het_han', het_han, 'tao_luc', tao_luc) order by tao_luc desc)
            from (select * from public.so_cai_sao where user_id = v_uid order by tao_luc desc limit 30) g), '[]'::jsonb));
end
$$;

-- Bút toán điều chỉnh: KHÔNG sửa/xoá dòng cũ. p_khoa do giao diện sinh mỗi lần mở biểu mẫu → bấm hai lần không cộng hai lần.
create or replace function dieu_chinh_sao(p_email text, p_so integer, p_ly_do text, p_khoa text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid;
    v_du integer;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu']);
    if p_so is null or p_so = 0 or abs(p_so) > 1000 then return jsonb_build_object('ket_qua', 'so_khong_hop_le'); end if;
    if p_ly_do is null or char_length(trim(p_ly_do)) not between 5 and 120 then
        return jsonb_build_object('ket_qua', 'thieu_ly_do');
    end if;
    if p_khoa is null or p_khoa !~ '^[a-z0-9-]{8,60}$' then return jsonb_build_object('ket_qua', 'khoa_khong_hop_le'); end if;
    select id into v_uid from auth.users where lower(email) = lower(trim(p_email)) limit 1;
    if v_uid is null then return jsonb_build_object('ket_qua', 'khong_thay'); end if;
    perform pg_advisory_xact_lock(hashtext('sao:' || v_uid));
    v_du := public.qt_so_du(v_uid);
    if p_so < 0 and v_du + p_so < 0 then return jsonb_build_object('ket_qua', 'am_so_du', 'so_du', v_du); end if;
    insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa, het_han)
    values (v_uid, p_so, 'dieu_chinh', left(trim(p_ly_do), 120), 'dieu_chinh:' || p_khoa,
            case when p_so > 0 then current_date + 365 end)
    on conflict (khoa) do nothing;
    if not found then return jsonb_build_object('ket_qua', 'da_ghi', 'so_du', v_du); end if;
    perform public.qt_ghi('sao.dieu_chinh', v_uid::text, jsonb_build_object('so', p_so, 'ly_do', left(trim(p_ly_do), 120)));
    return jsonb_build_object('ket_qua', 'da_ghi', 'so_du', v_du + p_so);
end
$$;

-- ---------------------------------------------------------------- tăng trưởng (số tổng theo tuần, giờ Việt Nam)
create or replace function thong_ke_tang_truong(p_tuan integer default 12) returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
declare v_tu date;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'bien_tap', 'tham_dinh', 'ho_tro', 'xem']);
    p_tuan := least(greatest(coalesce(p_tuan, 12), 1), 52);
    v_tu := date_trunc('week', (now() at time zone 'Asia/Ho_Chi_Minh'))::date - 7 * (p_tuan - 1);
    return coalesce((
        select jsonb_agg(jsonb_build_object(
            'tuan', t.tuan,
            'tai_khoan_moi', (select count(*) from auth.users u
                              where (u.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= t.tuan
                                and (u.created_at at time zone 'Asia/Ho_Chi_Minh')::date < t.tuan + 7),
            'ho_so_moi', (select count(*) from public.ho_so h
                          where (h.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date >= t.tuan
                            and (h.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date < t.tuan + 7),
            'loi_moi', (select count(*) from public.gioi_thieu g
                        where (g.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date >= t.tuan
                          and (g.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date < t.tuan + 7),
            'sao_tang', (select coalesce(sum(so_luong), 0) from public.so_cai_sao s where s.so_luong > 0
                         and (s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date >= t.tuan
                         and (s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date < t.tuan + 7),
            'sao_dung', (select coalesce(-sum(so_luong), 0) from public.so_cai_sao s where s.so_luong < 0
                         and (s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date >= t.tuan
                         and (s.tao_luc at time zone 'Asia/Ho_Chi_Minh')::date < t.tuan + 7),
            'cau_hoi', (select count(*) from public.thanso_hoi_nhat_ky n
                        where (n.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= t.tuan
                          and (n.created_at at time zone 'Asia/Ho_Chi_Minh')::date < t.tuan + 7)
                     + (select count(*) from public.huyenhoc_hoi_nhat_ky n
                        where (n.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= t.tuan
                          and (n.created_at at time zone 'Asia/Ho_Chi_Minh')::date < t.tuan + 7)
        ) order by t.tuan)
        from (select (v_tu + 7 * i) as tuan from generate_series(0, p_tuan - 1) i) t), '[]'::jsonb);
end
$$;

-- ---------------------------------------------------------------- hỏi đáp (QT-3: tìm lỗ hổng tri thức)
-- Hai bảng 0004/0005 gộp chung: mo_dun = 'thanso' | tuvi | kinhdich | battu | phongthuy.
create or replace function qt_hoi_gop() returns table (
    id bigint, bang text, created_at timestamptz, mo_dun text, cau_hoi text, loai text, xu_ly text, do_phu text,
    can_them text[], loi_kiem_tra text[], cau_tra_loi text, huu_ich boolean)
    language sql stable security definer set search_path = '' as $$
    select id, 'thanso', created_at, 'thanso', cau_hoi_da_loc, linh_vuc || '/' || y_dinh, xu_ly, do_phu,
           can_them, loi_kiem_tra, cau_tra_loi, huu_ich from public.thanso_hoi_nhat_ky
    union all
    select id, 'huyenhoc', created_at, mo_dun, cau_hoi_da_loc, loai, xu_ly, do_phu,
           can_them, loi_kiem_tra, cau_tra_loi, huu_ich from public.huyenhoc_hoi_nhat_ky
$$;

create or replace function thong_ke_hoi(p_ngay integer default 30) returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
declare v_tu timestamptz;
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'bien_tap', 'tham_dinh', 'ho_tro', 'xem']);
    v_tu := now() - make_interval(days => least(greatest(coalesce(p_ngay, 30), 1), 365));
    return jsonb_build_object(
        'tong', (select count(*) from public.qt_hoi_gop() h where h.created_at >= v_tu),
        'theo_mo_dun', coalesce((select jsonb_object_agg(mo_dun, jsonb_build_object('tong', n, 'khong_phu', k)) from (
            select mo_dun, count(*) n, count(*) filter (where do_phu <> 'day_du') k
            from public.qt_hoi_gop() h where h.created_at >= v_tu group by mo_dun) x), '{}'::jsonb),
        'can_them', coalesce((select jsonb_agg(jsonb_build_object('muc', muc, 'so', n) order by n desc) from (
            select muc, count(*) n from public.qt_hoi_gop() h, unnest(h.can_them) muc
            where h.created_at >= v_tu group by muc order by n desc limit 30) x), '[]'::jsonb),
        'loai_khong_phu', coalesce((select jsonb_agg(jsonb_build_object('mo_dun', mo_dun, 'loai', loai, 'so', n) order by n desc) from (
            select mo_dun, loai, count(*) n from public.qt_hoi_gop() h
            where h.created_at >= v_tu and h.do_phu <> 'day_du' group by mo_dun, loai order by n desc limit 30) x), '[]'::jsonb),
        'khong_huu_ich', (select count(*) from public.qt_hoi_gop() h where h.created_at >= v_tu and h.huu_ich = false)
    );
end
$$;

create or replace function nhat_ky_hoi_gan_day(p_mo_dun text default null, p_chi_khong_phu boolean default true,
                                              p_gioi_han integer default 50) returns jsonb
    language plpgsql stable security definer set search_path = '' as $$
begin
    perform public.qt_can_vai_tro(array['chu_so_huu', 'bien_tap', 'tham_dinh', 'ho_tro', 'xem']);
    return coalesce((select jsonb_agg(jsonb_build_object(
            'id', bang || ':' || id, 'luc', created_at, 'mo_dun', mo_dun, 'cau_hoi', cau_hoi, 'loai', loai,
            'xu_ly', xu_ly, 'do_phu', do_phu, 'can_them', can_them, 'loi_kiem_tra', loi_kiem_tra,
            'cau_tra_loi', left(cau_tra_loi, 600), 'huu_ich', huu_ich) order by created_at desc)
        from (select * from public.qt_hoi_gop() h
              where (p_mo_dun is null or h.mo_dun = p_mo_dun)
                and (not coalesce(p_chi_khong_phu, true) or h.do_phu <> 'day_du' or h.huu_ich = false)
              order by h.created_at desc limit least(greatest(coalesce(p_gioi_han, 50), 1), 200)) x), '[]'::jsonb);
end
$$;

-- ---------------------------------------------------------------- quyền
revoke execute on function qt_can_vai_tro(text[]), qt_ghi(text, text, jsonb), qt_so_cau_hinh(text, integer, integer, integer),
    sao_tran_moi(), qt_so_du(uuid), qt_hoi_gop(),
    dat_cau_hinh(text, jsonb, text), xoa_cau_hinh(text), cau_hinh_cong_khai(), danh_sach_quan_tri(),
    cap_vai_tro(text, text), go_vai_tro(uuid), tra_cuu_sao(text), dieu_chinh_sao(text, integer, text, text),
    thong_ke_tang_truong(integer), thong_ke_hoi(integer), nhat_ky_hoi_gan_day(text, boolean, integer)
    from public, anon, authenticated;
-- sao_muc giữ như 0008 (đã revoke khỏi public/anon) — create or replace giữ quyền cũ.
grant execute on function dat_cau_hinh(text, jsonb, text), xoa_cau_hinh(text), danh_sach_quan_tri(),
    cap_vai_tro(text, text), go_vai_tro(uuid), tra_cuu_sao(text), dieu_chinh_sao(text, integer, text, text),
    thong_ke_tang_truong(integer), thong_ke_hoi(integer), nhat_ky_hoi_gan_day(text, boolean, integer)
    to authenticated;
grant execute on function cau_hinh_cong_khai() to anon, authenticated;
