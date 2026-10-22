-- Rollback 0022: xoá phiếu sau 30 ngày và hàng đợi đề xuất luật (mất hẳn — đúng ý rollback). Không đụng 0017.
drop function if exists don_kiem_chung_sau();
drop function if exists duyet_de_xuat_luat(bigint, text, text);
drop function if exists thong_ke_de_xuat_luat(text);
drop function if exists gom_de_xuat_luat(integer, real, integer, real);
drop function if exists ty_le_kiem_chung_sau(integer);
drop function if exists ghi_kiem_chung_sau(text, uuid, text, text, text, text, text, integer);
drop table if exists de_xuat_luat;
drop table if exists kiem_chung_sau;
