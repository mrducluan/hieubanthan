-- KC-4 GĐ1 Web Push (migration 0019). Chạy SAU thu_sao.sql (đã có người dùng 1111…, 2222…; thu_sao grant all bảng
-- cho authenticated như mặc định Supabase — RLS vẫn phải chặn).
\set A '''11111111-1111-1111-1111-111111111111'''
\set B '''22222222-2222-2222-2222-222222222222'''
\set K '''BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4'''
\set S '''BTBZMqHH6r4Tts7J_aSIgg'''
insert into nhac_viec (user_id, ngay, ma, mo_dun, nhan, duong) values
    (:A, '2026-11-02', 'ung_ky.que_1', 'kinhdich', 'Ứng kỳ quẻ Càn', '/kinh-dich'),
    (:A, '2026-11-02', 'sua_nha.thang_10', 'phongthuy', 'Tháng hợp sửa nhà', '/phong-thuy'),
    (:B, '2026-11-02', 'ung_ky.que_2', 'kinhdich', 'Ứng kỳ quẻ Khôn', '/kinh-dich'),
    (:B, '2026-11-03', 'ung_ky.que_3', 'kinhdich', 'Mốc khác ngày', null);

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select 'A đăng ký Chrome' t, dang_ky_push('https://fcm.googleapis.com/fcm/send/abc:def', :K, :S);
select 'A đăng ký Firefox' t, dang_ky_push('https://updates.push.services.mozilla.com/wpush/v2/gAAA', :K, :S);
select 'A đăng ký lại Chrome (không nhân đôi)' t, dang_ky_push('https://fcm.googleapis.com/fcm/send/abc:def', :K, :S);
select 'A thấy 2 thiết bị' t, count(*) from push_dang_ky;
select 'A thêm 5 thiết bị Apple → còn 5 (bỏ cũ nhất)' t, count(dang_ky_push('https://web.push.apple.com/Q' || i, :K, :S))
    from generate_series(1, 5) i;
select '→ A có đúng 5' t, count(*) from push_dang_ky;
\set ON_ERROR_STOP 0
select 'endpoint lạ (phải lỗi check)' t, dang_ky_push('https://evil.example.com/fcm.googleapis.com/x', :K, :S);
select 'endpoint http (phải lỗi check)' t, dang_ky_push('http://fcm.googleapis.com/fcm/send/x', :K, :S);
select 'endpoint nội bộ (phải lỗi check)' t, dang_ky_push('https://169.254.169.254/latest', :K, :S);
select 'khoá p256dh sai (phải lỗi check)' t, dang_ky_push('https://fcm.googleapis.com/fcm/send/zz', 'ngan', :S);
select 'A tự insert thẳng (phải lỗi RLS)' t;
insert into push_dang_ky (user_id, endpoint, p256dh, auth) values (:A, 'https://fcm.googleapis.com/fcm/send/q', :K, :S);
select 'A gọi hàng đợi cron (phải lỗi permission denied)' t, count(*) from push_hang_doi('2026-11-02');
\set ON_ERROR_STOP 1
reset role;
set role anon;
\set ON_ERROR_STOP 0
select 'anon đăng ký (phải lỗi permission denied)' t, dang_ky_push('https://fcm.googleapis.com/fcm/send/an', :K, :S);
select 'anon đọc bảng (phải lỗi permission denied)' t, count(*) from push_dang_ky;
\set ON_ERROR_STOP 1
reset role;

-- B đăng nhập trên một trình duyệt của A (cùng máy) → thiết bị chuyển sang B.
set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select 'B đăng ký lại trình duyệt của A' t, dang_ky_push('https://web.push.apple.com/Q5', :K, :S);
select 'B thấy 1 thiết bị (không thấy của A)' t, count(*) from push_dang_ky;
with x as (delete from push_dang_ky where endpoint like '%/Q1' returning 1) select 'B xoá thiết bị của A → 0 dòng' t, count(*) from x;
reset role;
select 'A còn 4 thiết bị' t, count(*) from push_dang_ky where user_id = :A;

set role service_role;
select 'hàng đợi 2/11: A (2 mốc, 4 thiết bị), B (1 mốc, 1 thiết bị)' t,
    string_agg(left(user_id::text, 1) || ':' || jsonb_array_length(nhac) || '/' || jsonb_array_length(thiet_bi), ',' order by user_id)
    from push_hang_doi('2026-11-02');
select 'hàng đợi 3/11: B' t, count(*) from push_hang_doi('2026-11-03');
select 'hàng đợi 4/11: rỗng' t, count(*) from push_hang_doi('2026-11-04');
select 'gửi được 1 thiết bị của A' t, push_ket_qua((select id from push_dang_ky where user_id = :A order by tao_luc limit 1), '2026-11-02', 'ok');
select 'thiết bị B báo 410 → xoá' t, push_ket_qua((select id from push_dang_ky where user_id = :B), '2026-11-02', 'het_han');
select '→ hàng đợi 2/11 hết (A đã gửi, B hết thiết bị)' t, count(*) from push_hang_doi('2026-11-02');
select 'lỗi 5 lần liền → xoá' t, count(push_ket_qua(x.id, '2026-11-05', 'loi')) from
    (select id from push_dang_ky where user_id = :A order by tao_luc desc limit 1) x, generate_series(1, 5);
select '→ A còn 3 thiết bị' t, count(*) from push_dang_ky where user_id = :A;
\set ON_ERROR_STOP 0
select 'kết quả lạ (phải lỗi)' t, push_ket_qua(gen_random_uuid(), '2026-11-02', 'co_le');
\set ON_ERROR_STOP 1
reset role;
select 'bảng không có cột nội dung/tên/ngày sinh' t, not exists (select 1 from information_schema.columns
    where table_name = 'push_dang_ky' and column_name in ('nhan', 'noi_dung', 'ho_ten', 'ngay_sinh'));
