-- KC-4 GĐ2 (migration 0020). Chạy SAU thu_push_0019.sql (A còn 3 thiết bị đã nhận ngày 2/11 hoặc lỗi; B hết thiết bị).
\set A '''11111111-1111-1111-1111-111111111111'''
\set B '''22222222-2222-2222-2222-222222222222'''
\set K '''BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4'''
\set S '''BTBZMqHH6r4Tts7J_aSIgg'''

set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select 'B đăng ký lại một thiết bị' t, dang_ky_push('https://fcm.googleapis.com/fcm/send/b2', :K, :S);
insert into push_tuy_chon (user_id, sang_nay, moc_lich) values (:B, true, '{giao_tiet}');
select 'B thấy tuỳ chọn của mình' t, sang_nay || '/' || array_to_string(moc_lich, ',') from push_tuy_chon;
\set ON_ERROR_STOP 0
select 'B ghi mốc lạ (phải lỗi check)' t;
update push_tuy_chon set moc_lich = '{xo_so}' where user_id = :B;
select 'B ghi tuỳ chọn cho A (phải lỗi RLS)' t;
insert into push_tuy_chon (user_id, sang_nay) values (:A, true);
select 'B gọi hàng đợi v2 (phải lỗi permission denied)' t, count(*) from push_hang_doi_v2('2026-11-10');
\set ON_ERROR_STOP 1
reset role;
set role anon;
\set ON_ERROR_STOP 0
select 'anon đọc tuỳ chọn (phải lỗi permission denied)' t, count(*) from push_tuy_chon;
\set ON_ERROR_STOP 1
reset role;

delete from ho_so where user_id = :B;   -- test trước đã lưu hồ sơ cho B; thử ca chưa lưu
set role service_role;
select 'ngày 10/11: B (sáng nay, chưa lưu hồ sơ → ngày sinh null); A không có gì để báo' t,
    string_agg(left(user_id::text, 1) || ':' || sang_nay || ':' || coalesce(ngay_sinh, '-') || ':' || jsonb_array_length(nhac), ',')
    from push_hang_doi_v2('2026-11-10');
reset role;
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc) values (:B, 'Thử B', '1990-05-12', now());
set role service_role;
select '→ có hồ sơ: chỉ ngày-tháng 12-05, không năm' t, ngay_sinh from push_hang_doi_v2('2026-11-10') where user_id = :B;
select '2/11: A có mốc tự đánh dấu nhưng mọi thiết bị đã nhận/lỗi?' t, count(*) from push_hang_doi_v2('2026-11-02') where user_id = :A;
select 'B nhận xong ngày 10/11' t, count(push_ket_qua(id, '2026-11-10', 'ok')) from push_dang_ky where user_id = :B;
select '→ hàng đợi 10/11 không còn B' t, count(*) from push_hang_doi_v2('2026-11-10') where user_id = :B;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
update push_tuy_chon set sang_nay = false, moc_lich = '{giao_tiet}';
reset role;
set role service_role;
select 'B tắt sáng nay → ngày sinh không còn đi kèm' t, coalesce(ngay_sinh, '-') from push_hang_doi_v2('2026-11-11') where user_id = :B;
reset role;
