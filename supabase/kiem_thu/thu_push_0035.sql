-- Kiểm thử 0035: mốc 'thang_hai_la_so' được nhận; mốc lạ vẫn bị chặn; hàng đợi v2 trả mốc này trong moc_lich (cờ cho cron
-- đọc hồ sơ); người chưa tích thì không có. Chạy SAU thu_push_0020.sql (B có thiết bị b2, tuỳ chọn {giao_tiet}).
\set B '''22222222-2222-2222-2222-222222222222'''
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
update push_tuy_chon set moc_lich = '{giao_tiet,thang_hai_la_so}' where user_id = :B;
select 'B tích mốc tháng hai lá số' t, 'thang_hai_la_so' = any (moc_lich) from push_tuy_chon where user_id = :B;
\set ON_ERROR_STOP 0
select 'mốc lạ vẫn bị chặn (phải lỗi check)' t;
update push_tuy_chon set moc_lich = '{thang_hai_la_so,xo_so}' where user_id = :B;
\set ON_ERROR_STOP 1
reset role;
set role service_role;
select 'hàng đợi 1/12: B mang cờ thang_hai_la_so' t, 'thang_hai_la_so' = any (moc_lich) from push_hang_doi_v2('2026-12-01') where user_id = :B;
select 'hàng đợi không lộ thêm cột nào (vẫn 6 cột của 0020: không năm sinh, không giờ sinh)' t,
    (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'push_tuy_chon') = 4
    and (select pronargs from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'push_hang_doi_v2') = 1;
select 'ràng buộc có mốc mới' t, pg_get_constraintdef(oid) like '%thang_hai_la_so%' from pg_constraint where conname = 'push_tuy_chon_moc_lich_check';
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
update push_tuy_chon set moc_lich = '{giao_tiet}' where user_id = :B;
reset role;
set role service_role;
select 'B bỏ tích → hàng đợi không còn cờ' t, not ('thang_hai_la_so' = any (moc_lich)) from push_hang_doi_v2('2026-12-01') where user_id = :B;
reset role;
