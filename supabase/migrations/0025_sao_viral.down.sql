-- Rollback 0025_sao_viral.sql. Khôi phục bản hàm cũ (so_du_sao 0008, qt_so_du + nhan_thuong_gioi_thieu 0011,
-- nap_sao_tu_cong + hoan_don_nap 0012), xoá bảng/hàm mới. Sao đã thưởng KHÔNG bị thu hồi: bút toán 'hoa_hong' / 'chuoi'
-- chuyển thành 'dieu_chinh' (giữ số dư) rồi mới khôi phục ràng buộc loại cũ. Khoá cau_hinh sao.hoa_hong.*, sao.chuoi.*,
-- sao.qua.* giữ lại (vô hại). Trước khi rollback trên production: xuất bảng hoa_hong ra CSV (đối soát hoa hồng).

create or replace function so_du_sao() returns integer
    language sql stable security definer set search_path = '' as $$
    select coalesce(sum(so_luong), 0)::integer from public.so_cai_sao
    where user_id = (select auth.uid()) and (so_luong < 0 or het_han is null or het_han >= current_date)
$$;

create or replace function qt_so_du(p_uid uuid) returns integer
    language sql stable security definer set search_path = '' as $$
    select coalesce(sum(so_luong), 0)::integer from public.so_cai_sao
    where user_id = p_uid and (so_luong < 0 or het_han is null or het_han >= current_date)
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

drop function if exists don_qua_tang_chuong();
drop function if exists qua_cua_toi();
drop function if exists chuong_duoc_tang(text);
drop function if exists nhan_qua_chuong(text);
drop function if exists xem_qua_chuong(text);
drop function if exists tao_qua_chuong(text);
drop function if exists qua_tran();
drop function if exists diem_danh();
drop function if exists thong_ke_hoa_hong(integer);
drop function if exists hoa_hong_cua_toi();
drop function if exists hh_cho_don(bigint);
drop function if exists vi_sao_chi_tiet();
drop function if exists sao_so_du_cua(uuid);
drop function if exists qt_bat_cau_hinh(text);
drop table if exists qua_tang_chuong;
drop table if exists chuoi_ngay;
drop table if exists hoa_hong;

update so_cai_sao set loai = 'dieu_chinh' where loai in ('hoa_hong', 'chuoi');
alter table so_cai_sao drop constraint if exists so_cai_sao_loai_check;
alter table so_cai_sao add constraint so_cai_sao_loai_check
    check (loai in ('chao_mung', 'moi_ban', 'duoc_moi', 'dung', 'mua', 'dieu_chinh', 'nhiem_vu'));
