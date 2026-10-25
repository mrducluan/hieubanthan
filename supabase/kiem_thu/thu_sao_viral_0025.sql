-- 0025 SAO-V: số dư theo lô (Sao mua không hết hạn, tiêu Sao tặng trước) · thưởng mời hướng A · hoa hồng nạp một tầng ·
-- chuỗi ngày · tặng một chương. Mỗi dòng "kt" SAI là lỗi ngay (ON_ERROR_STOP).
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
grant all on all tables in schema public to authenticated;
-- 0023 thu hồi quyền ghi trực tiếp; giữ nguyên (mọi ghi trong test đi qua hàm hoặc vai trò postgres).
-- Các tệp thử trước có thể để lại mức thưởng khác — đưa về mặc định cho tệp này.
delete from cau_hinh where khoa like 'sao.%';

-- Người dùng: F (ví), M (người mời, tài khoản cũ), N (được mời, tài khoản cũ 30 ngày), Q (nhận quà), R (nhận quà 2)
insert into auth.users (id, created_at, email) values
    ('a0000000-0000-0000-0000-00000000000f', now() - interval '400 days', 'f@x'),
    ('a0000000-0000-0000-0000-0000000000a1', now() - interval '200 days', 'm@x'),
    ('a0000000-0000-0000-0000-0000000000b2', now() - interval '30 days',  'n@x'),
    ('a0000000-0000-0000-0000-0000000000c3', now(), 'q@x'),
    ('a0000000-0000-0000-0000-0000000000d4', now(), 'r@x')
on conflict do nothing;

-- ================================================================ (1) số dư theo lô
-- F: 10 Sao tặng (còn hạn) + 100 Sao mua; tiêu 10 → số dư 100.
insert into so_cai_sao (user_id, so_luong, loai, khoa, het_han, tao_luc) values
    ('a0000000-0000-0000-0000-00000000000f', 10, 'chao_mung', 'f:tang', current_date + 1, now() - interval '3 days'),
    ('a0000000-0000-0000-0000-00000000000f', 100, 'mua', 'mua:9000001', null, now() - interval '3 days'),
    ('a0000000-0000-0000-0000-00000000000f', -10, 'dung', 'f:dung1', null, now() - interval '2 days');
select pg_temp.kt('F số dư 100', qt_so_du('a0000000-0000-0000-0000-00000000000f'), 100);
-- Lô tặng hết hạn: khoản tiêu đã trừ vào lô tặng → Sao mua còn nguyên 100 (bản 0008 sẽ ra 90).
update so_cai_sao set het_han = current_date - 1 where khoa = 'f:tang';
select pg_temp.kt('F Sao tặng hết hạn, Sao mua không mất', qt_so_du('a0000000-0000-0000-0000-00000000000f'), 100);
-- Lô đã hết hạn TRƯỚC lúc tiêu không bị lấy: thêm lô tặng 5 hết hạn hôm qua, tiêu 3 hôm nay → trừ vào Sao mua.
insert into so_cai_sao (user_id, so_luong, loai, khoa, het_han, tao_luc) values
    ('a0000000-0000-0000-0000-00000000000f', 5, 'dieu_chinh', 'f:tang_cu', current_date - 1, now() - interval '2 days'),
    ('a0000000-0000-0000-0000-00000000000f', -3, 'dung', 'f:dung2', null, now());
select pg_temp.kt('F tiêu hôm nay không lấy lô đã hết hạn', qt_so_du('a0000000-0000-0000-0000-00000000000f'), 97);
-- Hai lô tặng còn hạn lúc tiêu (2 ngày trước): lô sắp hết hạn (hết hạn hôm qua) bị trừ trước → lô hạn xa còn nguyên.
insert into so_cai_sao (user_id, so_luong, loai, khoa, het_han, tao_luc) values
    ('a0000000-0000-0000-0000-00000000000f', 4, 'dieu_chinh', 'f:han_xa', current_date + 300, now() - interval '3 days'),
    ('a0000000-0000-0000-0000-00000000000f', 4, 'dieu_chinh', 'f:han_gan', current_date - 1, now() - interval '3 days'),
    ('a0000000-0000-0000-0000-00000000000f', -4, 'dung', 'f:dung3', null, now() - interval '2 days');
select pg_temp.kt('F lô sắp hết hạn bị trừ trước', qt_so_du('a0000000-0000-0000-0000-00000000000f'), 101);
-- Hoàn tiền 'hoan:<đơn>' trừ đúng lô mua của đơn, phần thiếu thành số dư âm.
insert into so_cai_sao (user_id, so_luong, loai, khoa, tao_luc) values
    ('a0000000-0000-0000-0000-00000000000f', -100, 'dieu_chinh', 'hoan:9000001', now() + interval '2 seconds');
select pg_temp.kt('F sau hoàn đơn 100 (đã tiêu 3 từ Sao mua)', qt_so_du('a0000000-0000-0000-0000-00000000000f'), 1);
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-00000000000f',false);
select pg_temp.kt('F so_du_sao = qt_so_du', so_du_sao(), 1);
select pg_temp.kt('F ví chi tiết: không còn Sao mua', (vi_sao_chi_tiet()->>'sao_mua')::int, 0);
reset role;

-- ================================================================ (2) thưởng mời — hướng A
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc) values
    ('a0000000-0000-0000-0000-0000000000a1', 'M', '1990-01-01', now()) on conflict do nothing;
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000a1',false);
select lay_ma_gioi_thieu() as ma_m \gset
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select lay_ma_gioi_thieu() as ma_n \gset
select pg_temp.kt('N chưa lưu hồ sơ', nhan_thuong_gioi_thieu(:'ma_m')->>'ket_qua', 'chua_luu_ho_so');
reset role;
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc) values
    ('a0000000-0000-0000-0000-0000000000b2', 'N', '1992-02-02', now()) on conflict do nothing;
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select pg_temp.kt('N tài khoản 30 ngày vẫn nhận (bỏ 7 ngày)', nhan_thuong_gioi_thieu(:'ma_m')->>'ket_qua', 'da_thuong');
select pg_temp.kt('N nhận lần 2', nhan_thuong_gioi_thieu(:'ma_m')->>'ket_qua', 'da_nhan');
select pg_temp.kt('N số dư 20', so_du_sao(), 20);
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('M mời vòng (N đã nhận lời mời của M)', nhan_thuong_gioi_thieu(:'ma_n')->>'ket_qua', 'moi_vong');
select pg_temp.kt('M số dư 20 (thưởng mời)', so_du_sao(), 20);
select pg_temp.kt('M thấy 1 bạn đã mời', (hoa_hong_cua_toi()->>'ban_da_moi')::int, 1);
reset role;

-- ================================================================ (3) hoa hồng
-- Công tắc tắt: N nạp → M không nhận gì.
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select (tao_don_nap('thu', 'gia')->>'ma_don')::bigint as d0 \gset
reset role; set role service_role;
select pg_temp.kt('N nạp đơn 0 (công tắc tắt)', nap_sao_tu_cong(:d0, 29000, 'gia', 'G0')->>'ket_qua', 'da_nap');
reset role;
select pg_temp.kt('tắt: không có hoa hồng', (select count(*) from hoa_hong)::int, 0);
-- Bật: 20%, chỉ đơn đầu → đơn 0 đã là đơn đầu (lúc tắt) nên đơn tiếp không được tính. Mở 2 đơn để thử.
insert into cau_hinh (khoa, gia_tri) values ('sao.hoa_hong.bat', 'true'), ('sao.hoa_hong.so_don', '2')
    on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select (tao_don_nap('gia_dinh', 'gia')->>'ma_don')::bigint as d1 \gset
select (tao_don_nap('pho_bien', 'gia')->>'ma_don')::bigint as d2 \gset
reset role; set role service_role;
select pg_temp.kt('N nạp đơn 1 (đơn thứ 2 của N)', nap_sao_tu_cong(:d1, 199000, 'gia', 'G1')->>'ket_qua', 'da_nap');
select pg_temp.kt('webhook lặp không cộng 2 lần', nap_sao_tu_cong(:d1, 199000, 'gia', 'G1')->>'ket_qua', 'da_xu_ly');
select pg_temp.kt('N nạp đơn 2 (đơn thứ 3 — ngoài 2 đơn)', nap_sao_tu_cong(:d2, 99000, 'gia', 'G2')->>'ket_qua', 'da_nap');
reset role;
select pg_temp.kt('hoa hồng đơn 1 = 20% × 240', (select sao from hoa_hong where ma_don = :d1), 48);
select pg_temp.kt('đơn 2 không có hoa hồng', (select count(*) from hoa_hong where ma_don = :d2)::int, 0);
select pg_temp.kt('sổ cái M có lô hoa hồng hạn 365 ngày',
    (select het_han from so_cai_sao where khoa = 'hoa_hong:' || :d1), current_date + 365);
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('M số dư 20 + 48', so_du_sao(), 68);
select pg_temp.kt('M thấy tổng hoa hồng', (hoa_hong_cua_toi()->>'tong_sao')::int, 48);
select pg_temp.kt('M không đọc thẳng bảng hoa_hong', (select count(*) from hoa_hong)::int, 0);
-- M tiêu 30 (trừ vào lô sắp hết hạn trước: thưởng mời 365 ngày tạo trước → lô hoa hồng còn 48 − (30 − 20) = 38)
select pg_temp.kt('M tiêu 30', dung_sao(30, 'thu-m', 'x')->>'ket_qua', 'da_dung');
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select pg_temp.kt('N tự gọi hh_cho_don (phải bị chặn)', has_function_privilege('authenticated', 'hh_cho_don(bigint)', 'execute'), false);
reset role;
-- Hoàn đơn 1 → thu hồi đúng lô hoa hồng của M: còn 38 − 48 → số dư M = 38 − 48 = −10.
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select pg_temp.kt('chủ sở hữu hoàn đơn 1, thu hồi 48', (hoan_don_nap(:d1, 'Khách đổi ý')->>'thu_hoi_hoa_hong')::int, 48);
select pg_temp.kt('thống kê hoa hồng: 48 Sao bị thu hồi', (thong_ke_hoa_hong(30)->'tong'->>'sao_thu_hoi')::int, 48);
select set_config('request.jwt.claim.aal','aal1',false);
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('M số dư sau thu hồi', so_du_sao(), -10);
reset role;
select pg_temp.kt('trạng thái thu_hoi', (select trang_thai from hoa_hong where ma_don = :d1), 'thu_hoi');
-- Trần 30 ngày: đặt trần 10 → đơn mới chỉ cộng phần còn trong trần (đã cộng 48 nhưng thu hồi → không tính).
insert into cau_hinh (khoa, gia_tri) values ('sao.hoa_hong.so_don', '12'), ('sao.hoa_hong.tran_30_ngay', '10')
    on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select (tao_don_nap('gia_dinh', 'gia')->>'ma_don')::bigint as d3 \gset
select (tao_don_nap('gia_dinh', 'gia')->>'ma_don')::bigint as d4 \gset
reset role; set role service_role;
select nap_sao_tu_cong(:d3, 199000, 'gia', 'G3') is not null;
select nap_sao_tu_cong(:d4, 199000, 'gia', 'G4') is not null;
reset role;
select pg_temp.kt('trần: đơn 3 cộng 10/48', (select sao from hoa_hong where ma_don = :d3), 10);
select pg_temp.kt('trần: đơn 4 quá trần', (select trang_thai from hoa_hong where ma_don = :d4), 'qua_tran');
-- Người không được ai mời nạp → không có hoa hồng.
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000a1',false);
select (tao_don_nap('thu', 'gia')->>'ma_don')::bigint as d5 \gset
reset role; set role service_role;
select nap_sao_tu_cong(:d5, 29000, 'gia', 'G5') is not null;
reset role;
select pg_temp.kt('M (không được mời) nạp → không hoa hồng', (select count(*) from hoa_hong where ma_don = :d5)::int, 0);

-- ================================================================ (4) chuỗi ngày
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select pg_temp.kt('ngày đầu: chuỗi 1', (diem_danh()->>'chuoi')::int, 1);
select pg_temp.kt('gọi lại cùng ngày không cộng', (diem_danh()->>'moi')::boolean, false);
reset role;
update chuoi_ngay set ngay_cuoi = ngay_cuoi - 1, chuoi = 6 where user_id = 'a0000000-0000-0000-0000-0000000000b2';
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select pg_temp.kt('công tắc tắt: chạm mốc 7 không thưởng', (diem_danh()->>'sao')::int, 0);
reset role;
insert into cau_hinh (khoa, gia_tri) values ('sao.chuoi.bat', 'true'), ('sao.chuoi.tran_30_ngay', '3')
    on conflict (khoa) do update set gia_tri = excluded.gia_tri;
update chuoi_ngay set ngay_cuoi = ngay_cuoi - 1, chuoi = 13 where user_id = 'a0000000-0000-0000-0000-0000000000b2';
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select diem_danh() as dd \gset
select pg_temp.kt('chuỗi 14 = mốc → +2 Sao', (:'dd'::jsonb->>'sao')::int, 2);
select pg_temp.kt('dài nhất 14', (:'dd'::jsonb->>'dai_nhat')::int, 14);
reset role;
update chuoi_ngay set ngay_cuoi = ngay_cuoi - 1, chuoi = 20 where user_id = 'a0000000-0000-0000-0000-0000000000b2';
delete from so_cai_sao where khoa = 'chuoi:a0000000-0000-0000-0000-0000000000b2:' || (now() at time zone 'Asia/Ho_Chi_Minh')::date;
insert into so_cai_sao (user_id, so_luong, loai, khoa, het_han) values
    ('a0000000-0000-0000-0000-0000000000b2', 2, 'chuoi', 'chuoi:thu-cu', current_date + 365);
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select pg_temp.kt('trần 3/30 ngày: đã 2 → chỉ +1', (diem_danh()->>'sao')::int, 1);
reset role;
update chuoi_ngay set ngay_cuoi = ngay_cuoi - 3 where user_id = 'a0000000-0000-0000-0000-0000000000b2';
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000b2',false);
select diem_danh() as dd2 \gset
select pg_temp.kt('mất chuỗi → đếm lại 1', (:'dd2'::jsonb->>'chuoi')::int, 1);
select pg_temp.kt('dài nhất giữ 21', (:'dd2'::jsonb->>'dai_nhat')::int, 21);
with u as (update chuoi_ngay set chuoi = 999 returning 1) select pg_temp.kt('N sửa thẳng chuoi_ngay không tác dụng (RLS)', (select count(*) from u)::int, 0);
reset role;

-- ================================================================ (5) tặng một chương
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('công tắc tắt', tao_qua_chuong('tuvi')->>'ket_qua', 'chua_mo');
reset role;
insert into cau_hinh (khoa, gia_tri) values ('sao.qua.bat', 'true') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000c3',false);
select pg_temp.kt('chưa mở báo cáo thì chưa tặng được', tao_qua_chuong('tuvi')->>'ket_qua', 'chua_mo_bao_cao');
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000a1',false);
reset role;
-- M nạp thêm để chắc đủ Sao (số dư đang âm sau thu hồi)
insert into so_cai_sao (user_id, so_luong, loai, khoa) values ('a0000000-0000-0000-0000-0000000000a1', 50, 'mua', 'mua:9000002');
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('M mở luận giải bằng Sao', dung_sao(10, 'lg:abc', 'Luận giải toàn bộ Tử vi')->>'ket_qua', 'da_dung');
select tao_qua_chuong('tuvi') as q1 \gset
select pg_temp.kt('M tạo quà', :'q1'::jsonb->>'ket_qua', 'da_tao');
select :'q1'::jsonb->>'ma' as ma_q1 \gset
select pg_temp.kt('M tự nhận', nhan_qua_chuong(:'ma_q1')->>'ket_qua', 'tu_tang');
reset role; set role anon;
select pg_temp.kt('khách xem quà còn dùng được', (xem_qua_chuong(:'ma_q1')->>'con_dung')::boolean, true);
select pg_temp.kt('khách không nhận được quà', has_function_privilege('anon', 'nhan_qua_chuong(text)', 'execute'), false);
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000c3',false);
select pg_temp.kt('Q chưa có hồ sơ', nhan_qua_chuong(:'ma_q1')->>'ket_qua', 'chua_luu_ho_so');
reset role;
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc) values
    ('a0000000-0000-0000-0000-0000000000c3', 'Q', '1995-03-03', now()),
    ('a0000000-0000-0000-0000-0000000000d4', 'R', '1996-04-04', now()) on conflict do nothing;
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000c3',false);
select pg_temp.kt('Q chưa có quà Tử vi', chuong_duoc_tang('tuvi'), 0);
select pg_temp.kt('Q nhận quà', nhan_qua_chuong(:'ma_q1')->>'ket_qua', 'da_nhan');
select pg_temp.kt('Q nhận lại', nhan_qua_chuong(:'ma_q1')->>'ket_qua', 'da_nhan');
select pg_temp.kt('Q được tặng 1 chương Tử vi', chuong_duoc_tang('tuvi'), 1);
select pg_temp.kt('Q không được tặng Bát tự', chuong_duoc_tang('battu'), 0);
select pg_temp.kt('quà không phải Sao: số dư Q vẫn 0', so_du_sao(), 0);
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000d4',false);
select pg_temp.kt('R dùng link đã dùng', nhan_qua_chuong(:'ma_q1')->>'ket_qua', 'da_dung');
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000a1',false);
select tao_qua_chuong('tuvi')->>'ket_qua' = 'da_tao';
select (tao_qua_chuong('tuvi')->>'ma') as ma_q3 \gset
select pg_temp.kt('M quá 3 quà/30 ngày', tao_qua_chuong('battu')->>'ket_qua', 'het_luot');
select pg_temp.kt('M thấy 3 quà đã gửi', (qua_cua_toi()->>'da_gui_30_ngay')::int, 3);
select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000c3',false);
select pg_temp.kt('Q đã có quà Tử vi → không nhận thêm', nhan_qua_chuong(:'ma_q3')->>'ket_qua', 'da_co_qua');
reset role;
update qua_tang_chuong set het_han = now() - interval '1 minute' where ma = :'ma_q3';
set role authenticated; select set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-0000000000d4',false);
select pg_temp.kt('R dùng link hết hạn', nhan_qua_chuong(:'ma_q3')->>'ket_qua', 'het_han');
reset role;

update qua_tang_chuong set nhan_luc = now() - interval '31 days' where ma = :'ma_q1';
select pg_temp.kt('dọn quà quá 30 ngày (q1 đã nhận 31 ngày)', don_qua_tang_chuong(), 1);
select pg_temp.kt('authenticated không gọi hàm dọn', has_function_privilege('authenticated', 'don_qua_tang_chuong()', 'execute'), false);

-- ================================================================ quyền
select pg_temp.kt('anon không đọc ví', has_function_privilege('anon', 'vi_sao_chi_tiet()', 'execute'), false);
select pg_temp.kt('authenticated không gọi sao_so_du_cua', has_function_privilege('authenticated', 'sao_so_du_cua(uuid)', 'execute'), false);
select pg_temp.kt('authenticated không gọi qt_so_du', has_function_privilege('authenticated', 'qt_so_du(uuid)', 'execute'), false);
select pg_temp.kt('authenticated không gọi nap_sao_tu_cong', has_function_privilege('authenticated', 'nap_sao_tu_cong(bigint,integer,text,text)', 'execute'), false);
delete from cau_hinh where khoa like 'sao.hoa_hong.%' or khoa like 'sao.chuoi.%' or khoa like 'sao.qua.%';
select 'thu_sao_viral_0025: OK';
