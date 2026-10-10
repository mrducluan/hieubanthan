-- Rollback cho 0011_quan_tri_2.sql — xoá hàm QT-2/QT-3, trả 3 hàm Sao về đúng bản 0008 (mức thưởng cố định).
-- Dữ liệu trong cau_hinh / so_cai_sao / nhat_ky_quan_tri giữ nguyên (bút toán điều chỉnh vẫn tính vào số dư).
drop function if exists nhat_ky_hoi_gan_day(text, boolean, integer);
drop function if exists thong_ke_hoi(integer);
drop function if exists qt_hoi_gop();
drop function if exists thong_ke_tang_truong(integer);
drop function if exists dieu_chinh_sao(text, integer, text, text);
drop function if exists tra_cuu_sao(text);
drop function if exists qt_so_du(uuid);
drop function if exists go_vai_tro(uuid);
drop function if exists cap_vai_tro(text, text);
drop function if exists danh_sach_quan_tri();
drop function if exists cau_hinh_cong_khai();
drop function if exists xoa_cau_hinh(text);
drop function if exists dat_cau_hinh(text, jsonb, text);

-- Bản 0008 (chép nguyên văn):
create or replace function sao_muc(p_loai text) returns integer
    language sql immutable security invoker set search_path = '' as $$
    select case p_loai when 'chao_mung' then 10 when 'moi_ban' then 20 when 'duoc_moi' then 20 else 0 end
$$;

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

drop function if exists sao_tran_moi();
drop function if exists qt_so_cau_hinh(text, integer, integer, integer);
drop function if exists qt_ghi(text, text, jsonb);
drop function if exists qt_can_vai_tro(text[]);
