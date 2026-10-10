-- QT-2/QT-3 (migration 0011): cổng vai trò + MFA trong DB, cài đặt site, chiến dịch thưởng mời, vai trò, sổ Sao.
-- Chạy SAU thu_sao.sql (dùng lại hai tài khoản A=1111…, B=2222…). Cột "t" mô tả, cột sau là kết quả mong đợi.
insert into auth.users (id, email) values ('33333333-3333-3333-3333-333333333333', 'c@vd.vn') on conflict do nothing;
update auth.users set email = 'a@vd.vn' where id = '11111111-1111-1111-1111-111111111111';
update auth.users set email = 'b@vd.vn' where id = '22222222-2222-2222-2222-222222222222';
insert into vai_tro_quan_tri (user_id, vai_tro) values ('11111111-1111-1111-1111-111111111111', 'chu_so_huu');
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
\set ON_ERROR_STOP 0
select 'A chủ sở hữu chưa MFA đặt cài đặt (phải lỗi khong_co_quyen)' t, dat_cau_hinh('sao.thuong.moi_ban', '40');
\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.aal','aal2',false);
select 'A aal2 đặt thưởng mời 40, được mời 500 (kẹp 100)' t, dat_cau_hinh('sao.thuong.moi_ban', '40'), dat_cau_hinh('sao.thuong.duoc_moi', '500');
\set ON_ERROR_STOP 0
select 'khoá ngoài tiền tố (phải lỗi khoa_khong_hop_le)' t, dat_cau_hinh('bi_mat.x', '1');
\set ON_ERROR_STOP 1
reset role;   -- sao_muc chỉ gọi nội bộ (không cấp cho authenticated)
select 'mức thưởng có hiệu lực 40 | 100 | 10' t, sao_muc('moi_ban'), sao_muc('duoc_moi'), sao_muc('chao_mung');
set role authenticated;
select 'cấp B biên tập' t, cap_vai_tro('B@vd.vn', 'bien_tap');
select 'cấp email chưa có' t, cap_vai_tro('khong@vd.vn', 'xem');
select 'tự đổi mình' t, cap_vai_tro('a@vd.vn', 'xem');
select 'điều chỉnh +15 cho C, bấm 2 lần' t, dieu_chinh_sao('c@vd.vn', 15, 'Bù lỗi hệ thống', 'qt-thu-1'), dieu_chinh_sao('c@vd.vn', 15, 'Bù lỗi hệ thống', 'qt-thu-1');
select 'trừ quá số dư' t, dieu_chinh_sao('c@vd.vn', -99, 'Thu hồi nhầm', 'qt-thu-2');
select 'tra cứu C số dư 15' t, tra_cuu_sao('c@vd.vn') ->> 'so_du';
select 'thống kê tuần (số tuần 4)' t, jsonb_array_length(thong_ke_tang_truong(4));
select 'thống kê hỏi có khoá tong' t, thong_ke_hoi(30) ? 'tong';
-- B biên tập: đọc thống kê được, không đặt cài đặt / không điều chỉnh Sao
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'B biên tập đọc thống kê' t, jsonb_array_length(thong_ke_tang_truong(2));
\set ON_ERROR_STOP 0
select 'B đặt cài đặt (phải lỗi)' t, dat_cau_hinh('site.thong_bao', '"x"');
select 'B điều chỉnh Sao (phải lỗi)' t, dieu_chinh_sao('c@vd.vn', 100, 'tự cộng cho bạn', 'qt-thu-3');
select 'B ghi thẳng cau_hinh (phải lỗi)' t;
insert into cau_hinh (khoa, gia_tri) values ('sao.thuong.moi_ban', '100');
\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select 'gỡ B; tự gỡ mình' t, go_vai_tro('22222222-2222-2222-2222-222222222222'), go_vai_tro('11111111-1111-1111-1111-111111111111');
reset role;
set role anon;
select 'anon đọc cài đặt công khai' t, cau_hinh_cong_khai();
\set ON_ERROR_STOP 0
select 'anon gọi thong_ke_hoi (phải lỗi quyền)' t, thong_ke_hoi(30);
\set ON_ERROR_STOP 1
reset role;
select 'nhật ký quản trị' t, string_agg(hanh_dong, ',' order by id) from nhat_ky_quan_tri;
