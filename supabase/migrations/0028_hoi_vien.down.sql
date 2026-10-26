-- Rollback 0028_hoi_vien.sql: khôi phục nap_sao_tu_cong + hoan_don_nap (bản 0027, chép nguyên văn), bỏ hàm / bảng / cột mới.
-- Đơn hội viên (don_nap.loai <> 'sao') KHÔNG khớp ràng buộc cũ (goi not null, sao > 0) → bị XOÁ; Sao tháng đã cấp giữ
-- nguyên số dư (bút toán 'hoi_vien' chuyển thành 'dieu_chinh') rồi mới khôi phục ràng buộc loại của 0027. Khoá cau_hinh
-- sao.hoi_vien.*, sao.chuyen_gia.* giữ lại (vô hại).
-- Trước khi rollback trên production: xuất hoi_vien + don_nap (loai = 'hoi_vien') ra CSV để đối soát / hoàn tiền tay.

-- Thay bản 0025: thêm bước tặng lần nạp đầu (lỗi ở bước này KHÔNG chặn cộng Sao cho người mua, như bước hoa hồng).
-- Phần còn lại giữ nguyên (kể cả gọi hh_cho_don của 0026 trong khối exception).
create or replace function nap_sao_tu_cong(p_ma_don bigint, p_so_tien integer, p_cong text, p_ma_giao_dich text)
    returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_tang integer := 0;
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
    begin
        v_tang := public.nd_tang_cho_don(p_ma_don);
    exception when others then
        v_tang := 0;
        raise warning 'nap_dau don % loi: %', p_ma_don, sqlerrm;
    end;
    begin
        perform public.hh_cho_don(p_ma_don);
    exception when others then
        raise warning 'hoa_hong don % loi: %', p_ma_don, sqlerrm;
    end;
    return jsonb_build_object('ket_qua', 'da_nap', 'sao', v_don.sao, 'sao_tang', v_tang);
end
$$;

-- Thay bản 0025: hoàn tiền còn thu hồi lô Sao tặng lần nạp đầu nếu chính đơn này nhận lô đó. Phần còn lại giữ nguyên.
create or replace function hoan_don_nap(p_ma_don bigint, p_ly_do text) returns jsonb
    language plpgsql security definer set search_path = '' as $$
declare
    v_don public.don_nap;
    v_hh public.hoa_hong;
    v_nd integer := 0;
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
    if coalesce(v_don.sao_tang_dau, 0) > 0 then
        insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
        values (v_don.user_id, -v_don.sao_tang_dau, 'dieu_chinh', left('Thu hồi Sao tặng lần nạp đầu — đơn ' || v_don.ma_don
                || ' đã hoàn tiền', 120), 'thu_hoi:nap_dau:' || v_don.user_id)
        on conflict (khoa) do nothing;
        if found then v_nd := v_don.sao_tang_dau; end if;
    end if;
    select * into v_hh from public.hoa_hong where ma_don = p_ma_don for update;
    if v_hh.ma_don is not null and v_hh.trang_thai <> 'thu_hoi' then
        if v_hh.sao > 0 then
            insert into public.so_cai_sao (user_id, so_luong, loai, ghi_chu, khoa)
            values (v_hh.nguoi_moi_id, -v_hh.sao, 'dieu_chinh', 'Thu hồi hoa hồng — đơn của bạn bè đã hoàn tiền',
                    'thu_hoi:hoa_hong:' || p_ma_don)
            on conflict (khoa) do nothing;
        end if;
        update public.hoa_hong set trang_thai = 'thu_hoi', thu_hoi_luc = now() where ma_don = p_ma_don;
    end if;
    perform public.qt_ghi('don_nap.hoan', p_ma_don::text, jsonb_build_object('sao', v_don.sao, 'so_tien', v_don.so_tien,
        'ly_do', left(trim(p_ly_do), 120), 'thu_hoi_hoa_hong', coalesce(v_hh.sao, 0), 'thu_hoi_nap_dau', v_nd));
    return jsonb_build_object('ket_qua', 'da_hoan', 'sao', v_don.sao, 'thu_hoi_hoa_hong', coalesce(v_hh.sao, 0),
                              'thu_hoi_nap_dau', v_nd);
end
$$;

revoke all on function nap_sao_tu_cong(bigint, integer, text, text), hoan_don_nap(bigint, text) from public, anon, authenticated;
grant execute on function hoan_don_nap(bigint, text) to authenticated;
grant execute on function nap_sao_tu_cong(bigint, integer, text, text) to service_role;

drop function if exists thong_ke_hoi_vien(integer);
drop function if exists hoi_vien_dung_cau_hoi();
drop function if exists hoi_vien_cua_toi();
drop function if exists hoi_vien_cap_sao_thang_tat_ca();
drop function if exists hoi_vien_cap_sao_thang();
drop function if exists hv_cap_sao_thang_cho(uuid);
drop function if exists hoi_vien_ghi_mo(text);
drop function if exists hoi_vien_hieu_luc(uuid);
drop function if exists hv_kich_hoat(bigint);
drop function if exists tao_don_hoi_vien(text);
drop function if exists hv_thang_tron(date, date);
drop function if exists hv_dong_hieu_luc(uuid);
drop function if exists hv_hom_nay();

drop table if exists hoi_vien_mo;
drop table if exists hoi_vien;

delete from don_nap where loai <> 'sao';
alter table don_nap drop constraint if exists don_nap_goi_theo_loai;
alter table don_nap drop constraint if exists don_nap_sao_check;
alter table don_nap add constraint don_nap_sao_check check (sao > 0);
alter table don_nap alter column goi set not null;
alter table don_nap drop constraint if exists don_nap_loai_check;
alter table don_nap drop column if exists loai;

update so_cai_sao set loai = 'dieu_chinh' where loai = 'hoi_vien';
alter table so_cai_sao drop constraint if exists so_cai_sao_loai_check;
alter table so_cai_sao add constraint so_cai_sao_loai_check
    check (loai in ('chao_mung', 'moi_ban', 'duoc_moi', 'dung', 'mua', 'dieu_chinh', 'nhiem_vu', 'hoa_hong', 'chuoi', 'nap_dau'));
