-- Rollback cho 0008_sao_credit.sql
drop function if exists dung_sao(integer, text, text);
drop function if exists nhan_thuong_gioi_thieu(text);
drop function if exists nhan_chao_mung();
drop function if exists lay_ma_gioi_thieu();
drop function if exists sao_byte_ngau_nhien();
drop function if exists so_du_sao();
drop function if exists sao_muc(text);
drop table if exists gioi_thieu;
drop table if exists so_cai_sao;
drop table if exists ma_gioi_thieu;
