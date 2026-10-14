-- SAO-3 (migration 0014): nhiệm vụ kiếm Sao. Chạy SAU thu_sao.sql (A, B có hồ sơ; B nhận lời mời của A).
-- Dòng "phải bị chặn" PHẢI báo lỗi.
\set ON_ERROR_STOP 1
grant all on all tables in schema public to authenticated;
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select 'A công tắc tắt: vẫn xem tiến độ (bat=false)' t, nhiem_vu_cua_toi() ->> 'bat';
select 'A công tắc tắt: nhận → chua_mo' t, nhan_thuong_nhiem_vu('luu_ho_so') ->> 'ket_qua';
reset role;
insert into cau_hinh (khoa, gia_tri) values ('sao.nhiem_vu.bat', 'true')
    on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select 'A số dư trước' t, so_du_sao() as du_truoc \gset
select 'A mã lạ → khong_hop_le' t, nhan_thuong_nhiem_vu('x') ->> 'ket_qua';
select 'A lưu hồ sơ → da_thuong 5' t, nhan_thuong_nhiem_vu('luu_ho_so');
select 'A lưu hồ sơ lần 2 → da_nhan' t, nhan_thuong_nhiem_vu('luu_ho_so') ->> 'ket_qua';
select 'A hỏi 3 câu khi chưa hỏi → chua_dat' t, nhan_thuong_nhiem_vu('hoi_3_cau');
select 'A mời 1 bạn (B đã nhận lời mời) → da_thuong' t, nhan_thuong_nhiem_vu('moi_1_ban') ->> 'ket_qua';
select 'A tự cộng lượt hỏi (phải bị chặn)' t;
\set ON_ERROR_STOP 0
select ghi_cau_hoi_tai_khoan('11111111-1111-1111-1111-111111111111');
\set ON_ERROR_STOP 1
select 'A tự ghi đã nhận (phải bị chặn)' t;
\set ON_ERROR_STOP 0
insert into nhiem_vu_sao (user_id, ma, so_sao) values ('11111111-1111-1111-1111-111111111111', 'hoi_3_cau', 5);
\set ON_ERROR_STOP 1
select 'A tự sửa bộ đếm (phải bị chặn)' t;
\set ON_ERROR_STOP 0
insert into dem_hoi_tai_khoan (user_id, so) values ('11111111-1111-1111-1111-111111111111', 99);
\set ON_ERROR_STOP 1
reset role;
set role service_role;
select 'máy chủ đếm câu 1..3' t, ghi_cau_hoi_tai_khoan('11111111-1111-1111-1111-111111111111'),
    ghi_cau_hoi_tai_khoan('11111111-1111-1111-1111-111111111111'), ghi_cau_hoi_tai_khoan('11111111-1111-1111-1111-111111111111');
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select 'A hỏi 3 câu → da_thuong' t, nhan_thuong_nhiem_vu('hoi_3_cau') ->> 'ket_qua';
select 'A cả 3 đã nhận' t, (select bool_and((x ->> 'da_nhan')::boolean) from jsonb_array_elements(nhiem_vu_cua_toi() -> 'nhiem_vu') x);
select 'A số dư tăng đúng 15' t, so_du_sao() - :du_truoc;
select 'A sổ cái 3 dòng nhiem_vu' t, count(*) from so_cai_sao where user_id = '11111111-1111-1111-1111-111111111111' and loai = 'nhiem_vu';
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'B (người được mời) mời 1 bạn → chua_dat' t, nhan_thuong_nhiem_vu('moi_1_ban') ->> 'ket_qua';
select 'B không thấy nhiệm vụ của A' t, count(*) from nhiem_vu_sao where user_id = '11111111-1111-1111-1111-111111111111';
reset role;
insert into cau_hinh (khoa, gia_tri) values ('sao.nhiem_vu.luu_ho_so', '999'), ('sao.nhiem_vu.hoi_3_cau', '0')
    on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'B mức kẹp 999 → 50' t, nhan_thuong_nhiem_vu('luu_ho_so');
reset role;
set role service_role;
select ghi_cau_hoi_tai_khoan('22222222-2222-2222-2222-222222222222'), ghi_cau_hoi_tai_khoan('22222222-2222-2222-2222-222222222222'),
    ghi_cau_hoi_tai_khoan('22222222-2222-2222-2222-222222222222');
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select 'B mức 0 → chua_mo, chưa ghi đã nhận' t, nhan_thuong_nhiem_vu('hoi_3_cau') ->> 'ket_qua',
    (select count(*) from nhiem_vu_sao where user_id = '22222222-2222-2222-2222-222222222222' and ma = 'hoi_3_cau');
reset role;
select 'anon gọi được nhan_thuong_nhiem_vu?' t, has_function_privilege('anon','nhan_thuong_nhiem_vu(text)','execute');
select 'authenticated gọi được ghi_cau_hoi_tai_khoan?' t, has_function_privilege('authenticated','ghi_cau_hoi_tai_khoan(uuid)','execute');
