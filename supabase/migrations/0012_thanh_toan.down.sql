-- Rollback cho 0012_thanh_toan.sql. Bút toán 'mua' / 'hoan:' đã ghi trong so_cai_sao GIỮ NGUYÊN (Sao người mua
-- đã trả tiền thật không bị xoá). Bảng đơn nạp bị xoá → trước khi rollback trên production, xuất don_nap ra CSV.
drop function if exists ds_don_nap(text, integer);
drop function if exists hoan_don_nap(bigint, text);
drop function if exists don_cho_doi_soat(integer);
drop function if exists nap_sao_tu_cong(bigint, integer, text, text);
drop function if exists gan_link_don(bigint, text);
drop function if exists huy_don_nap(bigint);
drop function if exists tao_don_nap(text, text);
drop table if exists don_nap;
drop table if exists goi_sao;
