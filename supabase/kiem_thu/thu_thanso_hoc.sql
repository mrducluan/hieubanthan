-- TS-V3 tầng HỌC (migration 0015). Chạy SAU thu_nhiem_vu.sql (đã có người dùng 1111…/2222… và vai trò quản trị).
set role service_role;
select 'góp ý đúng' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","linh_vuc":"su_nghiep","ma_cau":"sn_sai_nghe","chu_ky":{"pitago":{"duong_doi":33,"su_menh":9}},"dung":true}') ->> 'ok';
select 'chưa đúng ×4' t, count(gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","ma_cau":"sn_sai_nghe","chu_ky":{"pitago":{"duong_doi":33}},"dung":false}')) from generate_series(1,4);
select '→ vẫn theo dõi' t, trang_thai from thanso_cum_bat_thuong;
select 'lần 5 → chờ duyệt' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","ma_cau":"sn_sai_nghe","chu_ky":{"pitago":{"duong_doi":33}},"dung":false,"ghi_chu":"Không giống tôi lắm","dong_y":true}') ->> 'trang_thai';
select 'ghi chú không đồng ý → không lưu' t, (gui_phan_hoi_thanso('{"phai":"chaldea","nguon":"bai_doc","chu_ky":{"chaldea":{"duong_doi":6}},"dung":false,"ghi_chu":"bí mật","dong_y":false}') ->> 'ok')
    || '/' || (select count(*) from thanso_phan_hoi where ghi_chu = 'bí mật')::text;
\set ON_ERROR_STOP 0
select 'chữ ký có chữ (phải lỗi chu_ky_khong_hop_le)' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","chu_ky":{"pitago":{"ten":"Nguyen Van A"}},"dung":true}');
select 'chữ ký có ngày sinh dạng số lớn (phải lỗi)' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","chu_ky":{"pitago":{"ngay_sinh":24101988}},"dung":true}');
select 'ghi chú có số điện thoại (phải lỗi)' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","chu_ky":{"pitago":{"duong_doi":3}},"dung":false,"ghi_chu":"gọi 0912345678","dong_y":true}');
\set ON_ERROR_STOP 1
reset role;
select 'anon gọi được gui_phan_hoi_thanso?' t, has_function_privilege('anon','gui_phan_hoi_thanso(jsonb)','execute');
select 'bảng góp ý không có cột tên/ngày sinh/user' t, not exists (select 1 from information_schema.columns
    where table_name = 'thanso_phan_hoi' and column_name in ('ho_ten','ten','ngay_sinh','user_id','birth_date'));
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select 'A đọc thẳng bảng góp ý (RLS: 0 dòng)' t, count(*) from thanso_phan_hoi;
select 'A chủ sở hữu: 1 cụm chờ duyệt, 5 lần' t, (qt_cum_bat_thuong('cho_duyet') -> 'cum' -> 0 ->> 'so_lan');
select qt_cap_nhat_cum((qt_cum_bat_thuong('cho_duyet') -> 'cum' -> 0 ->> 'id')::bigint, 'da_sua', 'Thêm câu nghề cho số 33');
select 'A: cụm đã sửa có luật đề xuất' t, qt_cum_bat_thuong('da_sua') -> 'cum' -> 0 ->> 'luat_de_xuat';
insert into ky_uc_nguoi_dung (tru, ma_cau) values ('su_nghiep_tien_bac','sn_sai_nghe');
select 'A: thấy ký ức của mình' t, count(*) from ky_uc_nguoi_dung;
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'B không thấy ký ức của A' t, count(*) from ky_uc_nguoi_dung;
with x as (delete from ky_uc_nguoi_dung returning 1) select 'B không xoá được ký ức của A' t, count(*) from x;
\set ON_ERROR_STOP 0
select 'B thêm ký ức đứng tên A (phải lỗi RLS)' t;
insert into ky_uc_nguoi_dung (user_id, tru) values ('11111111-1111-1111-1111-111111111111', 'ban_than_tam_ly');
\set ON_ERROR_STOP 1
reset role;
select 'tổng ký ức (chỉ của A)' t, count(*) from ky_uc_nguoi_dung;
