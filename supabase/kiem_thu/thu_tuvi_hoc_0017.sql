-- LG-ĐS tầng HỌC Tử vi (migration 0017). Chạy SAU thu_thanso_hoc.sql (đã có người dùng 1111… chủ sở hữu, 2222…).
-- Vectơ thử: pg_temp.v(i, j, w) = mảng 512 số, 1 ở vị trí i, w ở vị trí j (cos(v(1,2,.1), v(1,2,.12)) ≈ 0,9998).
create function pg_temp.v(i int, j int default 2, w real default 0) returns jsonb language sql immutable as $$
    select jsonb_agg(case when k = i then 1 when k = j then w else 0 end order by k) from generate_series(1, 512) k $$;
\set k1 '''aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'''
\set k2 '''bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'''
\set k3 '''cccccccccccccccccccccccccccccccc'''
\set k4 '''dddddddddddddddddddddddddddddddd'''

-- ---------------------------------------------------------------- kiểm chứng
set role service_role;
select 'phiếu phi hoá hợp lệ' t, ghi_kiem_chung(:k1, null, 'phi_hoa', 'mau.quan_loc.ky.menh', 'phi_tinh', 'dung');
select 'phiếu nhịp hợp lệ' t, ghi_kiem_chung(:k1, null, 'nhip_3_thang', 'thuan.ln+sl', 'dau_quan_thai_tue', 'dung');
select 'phiếu đời sống (A đăng nhập)' t, ghi_kiem_chung(:k2, '11111111-1111-1111-1111-111111111111', 'doi_song', 'ds.su_nghiep.thien_co.sang.manh', 'nam_phai_viet', 'dung');
select 'mã lạ phi hoá (false)' t, ghi_kiem_chung(:k1, null, 'phi_hoa', 'mau.quan_loc.ky.sao_hoa', 'phi_tinh', 'dung');
select 'đời sống không bắt đầu ds. (false)' t, ghi_kiem_chung(:k1, null, 'doi_song', 'su_nghiep.manh', 'nam_phai_viet', 'dung');
select 'mã có chữ hoa / dấu cách (false)' t, ghi_kiem_chung(:k1, null, 'doi_song', 'ds.Su nghiep', 'nam_phai_viet', 'dung');
select 'mã quá 60 ký tự (false)' t, ghi_kiem_chung(:k1, null, 'doi_song', 'ds.' || repeat('a', 60), 'nam_phai_viet', 'dung');
select 'mã có 4 số kiểu năm sinh vẫn theo mẫu — loại lạ (false)' t, ghi_kiem_chung(:k1, null, 'khac', 'ds.a.b', 'x_y', 'dung');
select 'khoá không phải HMAC (false)' t, ghi_kiem_chung('192.168.1.1', null, 'phi_hoa', 'mau.quan_loc.ky.menh', 'phi_tinh', 'dung');
select 'kết quả lạ (false)' t, ghi_kiem_chung(:k1, null, 'phi_hoa', 'mau.quan_loc.ky.menh', 'phi_tinh', 'co_le');
select 'đổi ý 3 lần cùng mã' t, ghi_kiem_chung(:k1, null, 'phi_hoa', 'mau.quan_loc.ky.menh', 'phi_tinh', 'chua_dung')
    and ghi_kiem_chung(:k1, null, 'phi_hoa', 'mau.quan_loc.ky.menh', 'phi_tinh', 'dung')
    and ghi_kiem_chung(:k1, null, 'phi_hoa', 'mau.quan_loc.ky.menh', 'phi_tinh', 'chua_dung');
select '→ vẫn 1 phiếu, là chưa đúng (không cộng dồn)' t, count(*) || '/' || max(ket_qua) from kiem_chung_phieu
    where khoa = :k1 and mau = 'mau.quan_loc.ky.menh';
-- 30 khoá khác nhau cho một mã: 21 đúng, 9 chưa đúng
select '30 người bấm' t, count(*) from generate_series(1, 30) i
    where ghi_kiem_chung(md5(i::text), null, 'doi_song', 'ds.tinh_cam.thai_am.ham.de_vap', 'nam_phai_viet',
                         case when i <= 21 then 'dung' else 'chua_dung' end);
select 'tỉ lệ ≥ 30 phiếu: chỉ mã đủ mẫu' t, string_agg(mau || '=' || dung || '/' || chua_dung, ',') from ty_le_kiem_chung(null, 30);
select 'tỉ lệ theo danh sách mã (ngưỡng 1)' t, count(*) from ty_le_kiem_chung(array['mau.quan_loc.ky.menh', 'thuan.ln+sl', 'khong_co'], 1);
reset role;
select 'anon gọi được ghi_kiem_chung?' t, has_function_privilege('anon', 'ghi_kiem_chung(text,uuid,text,text,text,text)', 'execute');
select 'authenticated gọi được ty_le_kiem_chung?' t, has_function_privilege('authenticated', 'ty_le_kiem_chung(text[],integer)', 'execute');
set role anon;
\set ON_ERROR_STOP 0
select 'anon đọc bảng phiếu (phải lỗi permission denied)' t, count(*) from kiem_chung_phieu;
select 'anon đọc bài đã lưu (phải lỗi permission denied)' t, count(*) from luan_giai_luu;
select 'anon đọc kho vectơ (phải lỗi permission denied)' t, count(*) from cau_hoi_vec;
\set ON_ERROR_STOP 1
reset role;

-- ---------------------------------------------------------------- bài luận đã lưu + tuỳ chọn
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select set_config('request.jwt.claim.aal', 'aal2', false);
select 'A thấy phiếu của mình (1)' t, count(*) from kiem_chung_phieu;
insert into luan_giai_luu (mo_dun, tieu_de, noi_dung, engine_version) values ('tuvi', 'Lá số của tôi', '{"chuong":[]}', '0.1.4');
insert into luan_giai_luu (mo_dun, tieu_de, noi_dung, het_han) values ('battu', 'Tứ trụ', '{"a":1}', '2100-01-01');
select 'A thấy 2 bài của mình; hạn bị ép ≤ 365 ngày' t, count(*) || '/' || (max(het_han) < now() + interval '366 days') from luan_giai_luu;
\set ON_ERROR_STOP 0
select 'A lưu bài > 256 KB (phải lỗi bai_qua_lon)' t;
insert into luan_giai_luu (mo_dun, tieu_de, noi_dung) values ('tuvi', 'To', jsonb_build_object('x', repeat('a', 270000)));
\set ON_ERROR_STOP 1
-- (thu_sao.sql đã grant all cho authenticated như mặc định Supabase; migration revoke update — dù vậy RLS không có
-- policy update nên vẫn 0 dòng)
with x as (update luan_giai_luu set tieu_de = 'đổi' returning 1) select 'A sửa bài → 0 dòng (không có policy update)' t, count(*) from x;
insert into tuy_chon_hoc (tu_luu_luan_giai, dong_y_luc) values (true, '2000-01-01');
select 'A bật tự lưu → mốc đồng ý do máy chủ đặt' t, tu_luu_luan_giai || '/' || (dong_y_luc > now() - interval '1 minute') from tuy_chon_hoc;
update tuy_chon_hoc set tu_luu_luan_giai = false;
select 'A tắt tự lưu → mốc đồng ý null' t, tu_luu_luan_giai || '/' || coalesce(dong_y_luc::text, 'null') from tuy_chon_hoc;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select 'B không thấy bài/phiếu/tuỳ chọn của A' t, (select count(*) from luan_giai_luu) || '/' || (select count(*) from kiem_chung_phieu)
    || '/' || (select count(*) from tuy_chon_hoc);
with x as (delete from luan_giai_luu returning 1) select 'B không xoá được bài của A' t, count(*) from x;
insert into luan_giai_luu (user_id, mo_dun, tieu_de, noi_dung) values ('11111111-1111-1111-1111-111111111111', 'tuvi', 'giả A', '{}');
select 'B ghi đứng tên A → chủ đổi về B' t, count(*) from luan_giai_luu;
\set ON_ERROR_STOP 0
select 'B gọi thong_ke_hoc_tuvi (phải lỗi khong_co_quyen)' t, thong_ke_hoc_tuvi();
\set ON_ERROR_STOP 1
reset role;
-- B lưu 99 bài nữa (đủ 100) → bài thứ 101 bị từ chối
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
insert into luan_giai_luu (mo_dun, tieu_de, noi_dung) select 'tuvi', 'Bài ' || i, '{}' from generate_series(1, 99) i;
select 'B có 100 bài' t, count(*) from luan_giai_luu;
\set ON_ERROR_STOP 0
select 'B lưu bài 101 (phải lỗi qua_100_bai)' t;
insert into luan_giai_luu (mo_dun, tieu_de, noi_dung) values ('tuvi', 'Bài 101', '{}');
\set ON_ERROR_STOP 1
delete from luan_giai_luu where tieu_de = 'Bài 1';
insert into luan_giai_luu (mo_dun, tieu_de, noi_dung) values ('tuvi', 'Bài 101', '{}');
select 'B xoá 1 bài rồi lưu được lại' t, count(*) from luan_giai_luu;
reset role;

-- ---------------------------------------------------------------- kho vectơ ý định
set role service_role;
select 'nạp kho 3 câu (1 câu ý định lạ bị bỏ)' t, nap_kho_vec('tuvi', 'bam512_v1', jsonb_build_array(
    jsonb_build_object('y_dinh', 'di_hay_o', 'cau', 'Có nên nghỉ việc năm nay không?', 'vec', pg_temp.v(1)),
    jsonb_build_object('y_dinh', 'tai_van', 'cau', 'Tiền bạc năm nay thế nào?', 'vec', pg_temp.v(3)),
    jsonb_build_object('y_dinh', 'xo_so', 'cau', 'Số nào trúng?', 'vec', pg_temp.v(5))));
select 'nạp lại không nhân đôi' t, nap_kho_vec('tuvi', 'bam512_v1', jsonb_build_array(
    jsonb_build_object('y_dinh', 'di_hay_o', 'cau', 'Có nên nghỉ việc năm nay không?', 'vec', pg_temp.v(1)))) || '/' || (select count(*) from cau_hoi_vec);
select 'tìm gần: câu gần "nghỉ việc"' t, y_dinh || ' ' || round(do_gan::numeric, 3) from tim_y_dinh_gan('tuvi', pg_temp.v(1, 2, 0.3), 'bam512_v1', 0.82);
select 'tìm gần dưới ngưỡng → 0 dòng' t, count(*) from tim_y_dinh_gan('tuvi', pg_temp.v(1, 2, 2), 'bam512_v1', 0.82);
select 'mô hình khác → 0 dòng' t, count(*) from tim_y_dinh_gan('tuvi', pg_temp.v(1), 'mo_hinh_khac', 0.5);
select 'vectơ sai chiều → 0 dòng' t, count(*) from tim_y_dinh_gan('tuvi', '[1,2,3]', 'bam512_v1', 0);
select 'xác nhận câu mới (khoá 1) → chờ duyệt' t, xac_nhan_y_dinh('tuvi', 'phan_van', 'Mình nên chọn A hay B?', pg_temp.v(7, 8, 0.1), 'bam512_v1', :k1) ->> 'trang_thai';
select 'chưa hoạt động → tìm không thấy' t, count(*) from tim_y_dinh_gan('tuvi', pg_temp.v(7, 8, 0.1), 'bam512_v1', 0.82);
select 'khoá 1 bấm lại → không cộng' t, xac_nhan_y_dinh('tuvi', 'phan_van', 'Mình nên chọn A hay B nhỉ?', pg_temp.v(7, 8, 0.12), 'bam512_v1', :k1) ->> 'da_co';
select 'khoá 2, câu gần trùng (cos ≥ 0,95) → gộp, vẫn chờ' t, xac_nhan_y_dinh('tuvi', 'phan_van', 'Nên chọn A hay B?', pg_temp.v(7, 8, 0.12), 'bam512_v1', :k2) ->> 'trang_thai';
select 'khoá 3 (khách) → đủ 3 khoá nhưng chưa ai đăng nhập → vẫn chờ' t, xac_nhan_y_dinh('tuvi', 'phan_van', 'Chọn A hay B đây?', pg_temp.v(7, 8, 0.11), 'bam512_v1', :k3) ->> 'trang_thai';
select 'khoá 4 (đăng nhập) → hoạt động' t, xac_nhan_y_dinh('tuvi', 'phan_van', 'Chọn A hay B nhé?', pg_temp.v(7, 8, 0.11), 'bam512_v1', :k4, true) ->> 'trang_thai';
select '→ 1 dòng, 4 xác nhận' t, count(*) || '/' || max(so_xac_nhan) from cau_hoi_vec where y_dinh = 'phan_van';
select 'giờ tìm thấy' t, y_dinh from tim_y_dinh_gan('tuvi', pg_temp.v(7, 8, 0.1), 'bam512_v1', 0.82);
select 'cùng vectơ nhưng ý định khác → câu mới, không gộp' t, xac_nhan_y_dinh('tuvi', 'tai_van', 'Chọn A hay B về tiền?', pg_temp.v(7, 8, 0.1), 'bam512_v1', :k1) ->> 'gop';
select 'trùng nguyên câu, ý định khác → không ghi' t, xac_nhan_y_dinh('tuvi', 'hieu_ban_than', 'Chọn A hay B về tiền?', pg_temp.v(13), 'bam512_v1', :k2) ->> 'ly_do';
select 'ý định lạ → từ chối' t, xac_nhan_y_dinh('tuvi', 'xo_so', 'Số nào trúng hôm nay?', pg_temp.v(9), 'bam512_v1', :k1) ->> 'ly_do';
select 'câu có số điện thoại → từ chối' t, xac_nhan_y_dinh('tuvi', 'tai_van', 'Gọi 0912345678 hỏi tiền', pg_temp.v(11), 'bam512_v1', :k1) ->> 'ly_do';
reset role;
select 'bảng vectơ không có cột user_id' t, not exists (select 1 from information_schema.columns
    where table_name = 'cau_hoi_vec' and column_name in ('user_id', 'ip'));
select 'anon / authenticated gọi được tim_y_dinh_gan?' t, has_function_privilege('anon', 'tim_y_dinh_gan(text,jsonb,text,real,integer)', 'execute')
    || '/' || has_function_privilege('authenticated', 'xac_nhan_y_dinh(text,text,text,jsonb,text,text,boolean)', 'execute');
select 'chỉ mục HNSW cosine có' t, indexdef ~ 'hnsw.*vector_cosine_ops' from pg_indexes where indexname = 'cau_hoi_vec_hnsw';

-- ---------------------------------------------------------------- quản trị
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select set_config('request.jwt.claim.aal', 'aal2', false);
select 'A chủ sở hữu: thống kê — mã tỉ lệ thấp nhất đứng đầu' t, thong_ke_hoc_tuvi() -> 'kiem_chung' -> 0 ->> 'mau';
select 'A: hàng chờ vectơ (câu người dùng)' t, jsonb_array_length(thong_ke_hoc_tuvi('cho_duyet') -> 'vec');
select 'A: số bài lưu / người' t, thong_ke_hoc_tuvi() -> 'luan_giai_luu';
select duyet_cau_hoi_vec((select (e ->> 'id')::bigint from jsonb_array_elements(thong_ke_hoc_tuvi('hoat_dong') -> 'vec') e limit 1), 'tat');
select set_config('request.jwt.claim.aal', 'aal1', false);
\set ON_ERROR_STOP 0
select 'A chưa MFA (aal1) duyệt (phải lỗi khong_co_quyen)' t, duyet_cau_hoi_vec(1, 'tat');
\set ON_ERROR_STOP 1
reset role;
set role service_role;
select 'A tắt câu → tìm không thấy nữa' t, count(*) from tim_y_dinh_gan('tuvi', pg_temp.v(7, 8, 0.1), 'bam512_v1', 0.82);
select 'câu đã tắt: xác nhận thêm không bật lại' t, xac_nhan_y_dinh('tuvi', 'phan_van', 'Chọn A hay B?', pg_temp.v(7, 8, 0.1), 'bam512_v1', md5('x')) ->> 'trang_thai';
reset role;

-- ---------------------------------------------------------------- dọn hết hạn
update kiem_chung_phieu set het_han = now() - interval '1 day' where khoa = :k1;
update luan_giai_luu set het_han = now() - interval '1 day' where tieu_de = 'Tứ trụ';
set role service_role;
select 'dọn dữ liệu hết hạn' t, don_du_lieu_hoc_tuvi();
reset role;
select 'authenticated gọi được don_du_lieu_hoc_tuvi?' t, has_function_privilege('authenticated', 'don_du_lieu_hoc_tuvi()', 'execute');
insert into auth.users (id) values ('77777777-7777-7777-7777-777777777777') on conflict do nothing;
set role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-7777-7777-777777777777', false);
insert into luan_giai_luu (mo_dun, tieu_de, noi_dung) values ('tuvi', 'Bài của G', '{}');
reset role;
delete from auth.users where id = '77777777-7777-7777-7777-777777777777';
select 'xoá tài khoản G → bài của G mất (cascade)' t, count(*) from luan_giai_luu where user_id = '77777777-7777-7777-7777-777777777777';
