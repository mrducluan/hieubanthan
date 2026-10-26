-- Rollback 0029 "Hỏi chuyên gia". Bảng câu hỏi bị XOÁ (câu hỏi + câu trả lời người dùng đã mua mất theo — chỉ chạy khi chắc).
-- Cột don_nap.loai + goi nullable dùng chung với 0028 → KHÔNG gỡ ở đây (0028 gỡ nếu cần). Đơn loai = 'chuyen_gia' bị xoá;
-- check sao > 0 chỉ khôi phục khi không còn đơn nào sao = 0 (0028 có thể còn đơn dịch vụ khác).
drop trigger if exists cg_don_da_tra on don_nap;
drop function if exists cg_don_da_tra();
drop function if exists don_chuyen_gia();
drop function if exists thong_ke_chuyen_gia(integer);
drop function if exists hoan_cau_hoi(bigint, text);
drop function if exists danh_dau_qua_han_chuyen_gia();
drop function if exists tra_loi_cau_hoi(bigint, text);
drop function if exists doc_cau_hoi_chuyen_gia(bigint);
drop function if exists ds_cau_hoi_chuyen_gia(text, integer);
drop function if exists cg_dong_quan_tri(cau_hoi_chuyen_gia, boolean);
drop function if exists huy_cau_hoi(bigint);
drop function if exists danh_gia_cau_hoi(bigint, integer);
drop function if exists cau_hoi_cua_toi();
drop function if exists tao_cau_hoi_chuyen_gia(text, text, jsonb, boolean, boolean, text);
drop function if exists chuyen_gia_thong_tin();
drop function if exists cg_co_lien_he(text);
drop function if exists cg_loc_ho_so(jsonb);
drop function if exists cg_gia_cho(uuid);
drop function if exists cg_da_tung_tra(uuid);
drop function if exists cg_han_gio();
drop function if exists cg_giam_pt();
drop function if exists cg_gia_vnd();
drop table if exists cau_hoi_chuyen_gia;
delete from don_nap where loai = 'chuyen_gia';
do $$ begin
    if not exists (select 1 from don_nap where sao <= 0) then
        alter table don_nap drop constraint if exists don_nap_sao_check;
        alter table don_nap add constraint don_nap_sao_check check (sao > 0);
    else
        raise notice 'don_nap còn đơn sao = 0 (dịch vụ khác) — giữ check sao >= 0';
    end if;
end $$;
