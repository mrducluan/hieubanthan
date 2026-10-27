-- Rollback 0026_chong_gian_lan.sql: khôi phục nhan_thuong_gioi_thieu(text) + hh_cho_don của 0025, bỏ cờ gian lận.
-- Hoa hồng 'nghi_gian_lan' (sao = 0) chuyển thành 'qua_tran' trước khi khôi phục ràng buộc trạng thái cũ.
-- Trước khi rollback trên production: xuất bảng gian_lan_co ra CSV nếu cần giữ lịch sử cờ.
drop function if exists gian_lan_gan_day(integer);
drop function if exists nhan_thuong_gioi_thieu(text, text);
create or replace function nhan_thuong_gioi_thieu(p_ma text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid := (select auth.uid());
    v_moi uuid;
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
revoke all on function nhan_thuong_gioi_thieu(text) from public, anon;
grant execute on function nhan_thuong_gioi_thieu(text) to authenticated;

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
revoke all on function hh_cho_don(bigint) from public, anon, authenticated;

drop function if exists gl_bat();
drop function if exists gl_tran_thiet_bi();
drop table if exists gian_lan_co;
update hoa_hong set trang_thai = 'qua_tran' where trang_thai = 'nghi_gian_lan';
alter table hoa_hong drop constraint if exists hoa_hong_trang_thai_check;
alter table hoa_hong add constraint hoa_hong_trang_thai_check check (trang_thai in ('da_cong', 'qua_tran', 'thu_hoi'));
drop index if exists gioi_thieu_thiet_bi_idx;
alter table gioi_thieu drop column if exists co_gian_lan;
alter table gioi_thieu drop column if exists thiet_bi;
