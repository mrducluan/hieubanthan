-- Rollback 0017_tuvi_hoc.sql: xoá phiếu kiểm chứng, bài luận đã lưu, tuỳ chọn học, kho vectơ ý định (mất hẳn — đúng ý
-- rollback). KHÔNG gỡ extension vector (có thể đang dùng nơi khác; gỡ tay nếu chắc chắn: drop extension vector).
drop function if exists don_du_lieu_hoc_tuvi();
drop function if exists duyet_cau_hoi_vec(bigint, text);
drop function if exists thong_ke_hoc_tuvi(text);
drop function if exists nap_kho_vec(text, text, jsonb);
drop function if exists xac_nhan_y_dinh(text, text, text, jsonb, text, text, boolean);
drop function if exists tim_y_dinh_gan(text, jsonb, text, real, integer);
drop table if exists cau_hoi_vec;
drop function if exists vec_tu_jsonb(jsonb);
drop function if exists y_dinh_hop_le(text, text);
drop trigger if exists tuy_chon_hoc_moc on tuy_chon_hoc;
drop function if exists tuy_chon_hoc_moc();
drop table if exists tuy_chon_hoc;
drop trigger if exists luan_giai_luu_gioi_han on luan_giai_luu;
drop function if exists luan_giai_luu_gioi_han();
drop table if exists luan_giai_luu;
drop function if exists ty_le_kiem_chung(text[], integer);
drop function if exists ghi_kiem_chung(text, uuid, text, text, text, text);
drop function if exists kiem_chung_ma_hop_le(text, text, text);
drop table if exists kiem_chung_phieu;
