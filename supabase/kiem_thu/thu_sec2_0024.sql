-- SEC-2 đợt 2 (migration 0024). Chạy SAU thu_sao.sql (A, B có ví) và thu_thanso_hoc.sql.
\set ON_ERROR_STOP 1
-- (1) Hoàn Sao khi engine không trả lời được: chỉ service role, chỉ dòng hỏi đáp vừa trừ, một lần.
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select 'A số dư trước' t, so_du_sao() as truoc \gset
select 'A trừ 1 Sao cho câu hỏi' t, dung_sao(1, 'hoi:tuvi:sec2-1', 'Hỏi đáp vượt lượt miễn phí') ->> 'ket_qua';
\set ON_ERROR_STOP 0
select 'A tự hoàn (phải lỗi permission denied)' t, hoan_sao_hoi('11111111-1111-1111-1111-111111111111', 'dung:11111111-1111-1111-1111-111111111111:hoi:tuvi:sec2-1');
\set ON_ERROR_STOP 1
reset role;
set role service_role;
select 'hoàn đúng dòng' t, hoan_sao_hoi('11111111-1111-1111-1111-111111111111', 'dung:11111111-1111-1111-1111-111111111111:hoi:tuvi:sec2-1');
select 'hoàn lần 2 (false)' t, hoan_sao_hoi('11111111-1111-1111-1111-111111111111', 'dung:11111111-1111-1111-1111-111111111111:hoi:tuvi:sec2-1');
select 'hoàn dòng không phải hỏi đáp (false)' t, hoan_sao_hoi('22222222-2222-2222-2222-222222222222', 'dung:22222222-2222-2222-2222-222222222222:lg-1');
select 'hoàn dòng của người khác (false)' t, hoan_sao_hoi('22222222-2222-2222-2222-222222222222', 'dung:11111111-1111-1111-1111-111111111111:hoi:tuvi:sec2-1');
reset role;
set role authenticated;
select '→ A số dư như trước' t, so_du_sao() = :truoc;
reset role;

-- (2) Ghi chú góp ý: mỗi ghi chú có mốc riêng; quá 12 tháng thì bỏ riêng ghi chú đó.
set role service_role;
select 'góp ý chưa đúng kèm ghi chú' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","ma_cau":"sn_sai_nghe","chu_ky":{"pitago":{"duong_doi":7}},"dung":false,"ghi_chu":"Ghi chú cũ","dong_y":true}') ->> 'ok';
reset role;
update thanso_cum_bat_thuong set ghi_chu_luc = array[now() - interval '400 days'] where chu_ky_mau = 'pitago|sn_sai_nghe|dd7';
set role service_role;
select 'thêm ghi chú mới' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","ma_cau":"sn_sai_nghe","chu_ky":{"pitago":{"duong_doi":7}},"dung":false,"ghi_chu":"Ghi chú mới","dong_y":true}') ->> 'ok';
select 'dọn' t, don_du_lieu_hoc() ->> 'cum_lam_sach';
reset role;
select '→ chỉ còn ghi chú mới' t, array_to_string(mau_ghi_chu, '|'), cardinality(ghi_chu_luc) from thanso_cum_bat_thuong where chu_ky_mau = 'pitago|sn_sai_nghe|dd7';
select 'sec2 (0024): OK' t;
