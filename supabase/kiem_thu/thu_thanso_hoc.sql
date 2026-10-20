-- TS-V3 tầng HỌC (migration 0015). Chạy SAU thu_nhiem_vu.sql (đã có người dùng 1111…/2222… và vai trò quản trị).
set role service_role;
select 'góp ý đúng' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","linh_vuc":"su_nghiep","ma_cau":"sn_sai_nghe","chu_ky":{"pitago":{"duong_doi":33,"su_menh":9}},"dung":true}') ->> 'ok';
select 'chưa đúng ×4' t, count(gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","ma_cau":"sn_sai_nghe","chu_ky":{"pitago":{"duong_doi":33}},"dung":false}')) from generate_series(1,4);
select '→ vẫn theo dõi' t, trang_thai from thanso_cum_bat_thuong;
select 'lần 5 → chờ duyệt' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","ma_cau":"sn_sai_nghe","chu_ky":{"pitago":{"duong_doi":33}},"dung":false,"ghi_chu":"Không giống tôi lắm","dong_y":true}') ->> 'trang_thai';
select 'ghi chú không đồng ý → không lưu' t, (gui_phan_hoi_thanso('{"phai":"chaldea","nguon":"bai_doc","chu_ky":{"chaldea":{"so_ten":6}},"dung":false,"ghi_chu":"bí mật","dong_y":false}') ->> 'ok')
    || '/' || (select count(*) from thanso_phan_hoi where ghi_chu = 'bí mật')::text;
\set ON_ERROR_STOP 0
select 'chữ ký có chữ (phải lỗi chu_ky_khong_hop_le)' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","chu_ky":{"pitago":{"ten":"Nguyen Van A"}},"dung":true}');
select 'chữ ký có khoá ngày sinh (phải lỗi)' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","chu_ky":{"pitago":{"ngay_sinh":24}},"dung":true}');
select 'chữ ký rỗng (phải lỗi)' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","chu_ky":{},"dung":true}');
select 'thiếu chữ ký (phải lỗi)' t, gui_phan_hoi_thanso('{"phai":"pitago","nguon":"hoi_dap","dung":true}');
select 'Chaldea gửi số kép 33 (phải lỗi: chỉ gốc 0–9)' t, gui_phan_hoi_thanso('{"phai":"chaldea","nguon":"hoi_dap","chu_ky":{"chaldea":{"so_ten":33}},"dung":true}');
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
insert into ky_uc_nguoi_dung (tru, ma_cau, het_han) values ('tinh_cam_gia_dinh', 'tc_can_gi', '2100-01-01');
select 'A tự đặt hạn 2100 → máy chủ ép về ≤ 180 ngày' t, max(het_han) < now() + interval '181 days' from ky_uc_nguoi_dung;
\set ON_ERROR_STOP 0
select 'A ghi nhớ trùng câu (phải lỗi duplicate)' t;
insert into ky_uc_nguoi_dung (tru, ma_cau) values ('su_nghiep_tien_bac','sn_sai_nghe');
\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'B không thấy ký ức của A' t, count(*) from ky_uc_nguoi_dung;
with x as (delete from ky_uc_nguoi_dung returning 1) select 'B không xoá được ký ức của A' t, count(*) from x;
insert into ky_uc_nguoi_dung (user_id, tru) values ('11111111-1111-1111-1111-111111111111', 'ban_than_tam_ly');
reset role;
select 'B ghi đứng tên A → máy chủ đổi chủ về B; A vẫn 2 mục' t,
    (select count(*) from ky_uc_nguoi_dung where user_id = '11111111-1111-1111-1111-111111111111') || '/' ||
    (select count(*) from ky_uc_nguoi_dung where user_id = '22222222-2222-2222-2222-222222222222');
update ky_uc_nguoi_dung set het_han = now() - interval '1 day' where ma_cau = 'tc_can_gi';
update thanso_phan_hoi set het_han = now() - interval '1 day' where dung;
set role service_role;
select 'dọn dữ liệu hết hạn' t, don_du_lieu_hoc();
reset role;
select 'authenticated gọi được don_du_lieu_hoc?' t, has_function_privilege('authenticated','don_du_lieu_hoc()','execute');
