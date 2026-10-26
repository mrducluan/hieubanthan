-- 0027 SAO-ND: gói khởi đầu + tặng Sao lần nạp đầu. Mỗi dòng "kt" SAI là lỗi ngay.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
grant all on all tables in schema public to authenticated;
delete from cau_hinh where khoa like 'sao.%';

-- P1 nạp khi công tắc tắt; P2 được M mời, nạp khi bật; P3, P4 thử mức kẹp.
insert into auth.users (id, email) values
    ('c0000000-0000-0000-0000-0000000000a1', 'nd-p1@x'),
    ('c0000000-0000-0000-0000-0000000000a2', 'nd-p2@x'),
    ('c0000000-0000-0000-0000-0000000000a3', 'nd-m@x'),
    ('c0000000-0000-0000-0000-0000000000a4', 'nd-p3@x'),
    ('c0000000-0000-0000-0000-0000000000a5', 'nd-p4@x')
on conflict do nothing;
insert into ho_so (user_id, ho_ten, ngay_sinh, dong_y_luc)
select id, 'T', '1990-01-01', now() from auth.users where email in ('nd-p2@x', 'nd-m@x')
on conflict do nothing;

-- ================================================================ (0) quyền
select pg_temp.kt('anon đọc gói đang bán', has_function_privilege('anon', 'goi_sao_dang_ban()', 'execute'), true);
select pg_temp.kt('anon đọc thông tin nạp đầu', has_function_privilege('anon', 'nap_dau_thong_tin()', 'execute'), true);
select pg_temp.kt('authenticated không gọi nd_tang_cho_don', has_function_privilege('authenticated', 'nd_tang_cho_don(bigint)', 'execute'), false);
select pg_temp.kt('anon không gọi nd_tang_cho_don', has_function_privilege('anon', 'nd_tang_cho_don(bigint)', 'execute'), false);
select pg_temp.kt('authenticated không gọi nap_sao_tu_cong', has_function_privilege('authenticated', 'nap_sao_tu_cong(bigint,integer,text,text)', 'execute'), false);
select pg_temp.kt('anon không tạo đơn', has_function_privilege('anon', 'tao_don_nap(text,text)', 'execute'), false);
select pg_temp.kt('gói khởi đầu: bat = false trong bảng', (select bat from goi_sao where ma = 'khoi_dau'), false);
select pg_temp.kt('gói khởi đầu: 12.000 ₫ / 12 Sao', (select gia_vnd || '/' || sao from goi_sao where ma = 'khoi_dau'), '12000/12');

-- ================================================================ (1) gói khởi đầu theo công tắc
set role anon;
select pg_temp.kt('tắt: không bán gói khởi đầu', (select count(*) from goi_sao_dang_ban() where ma = 'khoi_dau')::int, 0);
select pg_temp.kt('tắt: vẫn bán 3 gói cũ', (select count(*) from goi_sao_dang_ban())::int, 3);
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('tắt: tạo đơn gói khởi đầu bị từ chối', tao_don_nap('khoi_dau', 'gia')->>'ket_qua', 'goi_khong_hop_le');
reset role;
insert into cau_hinh (khoa, gia_tri) values ('sao.goi_khoi_dau.bat', 'true') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role anon;
select pg_temp.kt('bật: gói khởi đầu đứng đầu', (select ma from goi_sao_dang_ban() limit 1), 'khoi_dau');
select pg_temp.kt('bật: 4 gói', (select count(*) from goi_sao_dang_ban())::int, 4);
reset role;

-- ================================================================ (2) công tắc nạp đầu TẮT → không tặng
set role authenticated; select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a1',false);
select tao_don_nap('khoi_dau', 'gia') as t1 \gset
select pg_temp.kt('đơn khởi đầu lấy giá từ bảng', (:'t1'::jsonb->>'so_tien')::int || '/' || (:'t1'::jsonb->>'sao'), '12000/12');
select (:'t1'::jsonb->>'ma_don')::bigint as d1 \gset
select pg_temp.kt('P1 trước khi nạp: lan_dau, công tắc tắt',
    (nap_dau_thong_tin()->>'lan_dau')::boolean || '/' || (nap_dau_thong_tin()->>'bat'), 'true/false');
reset role; set role service_role;
select pg_temp.kt('tắt: nạp đơn đầu, không tặng', nap_sao_tu_cong(:d1, 12000, 'gia', 'ND1')->>'sao_tang', '0');
reset role;
select pg_temp.kt('tắt: không có lô nap_dau', (select count(*) from so_cai_sao where khoa = 'nap_dau:c0000000-0000-0000-0000-0000000000a1')::int, 0);
select pg_temp.kt('tắt: đơn không ghi sao_tang_dau', (select sao_tang_dau from don_nap where ma_don = :d1) is null, true);

-- Bật sau khi P1 đã nạp → đơn kế của P1 KHÔNG phải lần đầu.
insert into cau_hinh (khoa, gia_tri) values ('sao.nap_dau.bat', 'true') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('P1 đã nạp → không còn lần đầu', (nap_dau_thong_tin()->>'lan_dau')::boolean, false);
select (tao_don_nap('thu', 'gia')->>'ma_don')::bigint as d1b \gset
reset role; set role service_role;
select pg_temp.kt('bật nhưng P1 đã có đơn đã trả → không tặng', nap_sao_tu_cong(:d1b, 29000, 'gia', 'ND1B')->>'sao_tang', '0');
reset role;

-- ================================================================ (3) bật: đơn đầu tặng 20%, hoa hồng tính trên Sao gói
insert into cau_hinh (khoa, gia_tri) values ('sao.hoa_hong.bat', 'true') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a3',false);
select lay_ma_gioi_thieu() as ma_m \gset
select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a2',false);
select pg_temp.kt('P2 nhận lời mời của M', nhan_thuong_gioi_thieu(:'ma_m')->>'ket_qua', 'da_thuong');
select nap_dau_thong_tin() as tt \gset
select pg_temp.kt('P2 thấy: bật, 20%, lần đầu',
    (:'tt'::jsonb->>'bat') || '/' || (:'tt'::jsonb->>'phan_tram') || '/' || (:'tt'::jsonb->>'lan_dau'), 'true/20/true');
select (tao_don_nap('gia_dinh', 'gia')->>'ma_don')::bigint as d2 \gset
select (tao_don_nap('thu', 'gia')->>'ma_don')::bigint as d3 \gset
reset role;
set role anon; select set_config('request.jwt.claim.sub','',false);
select pg_temp.kt('khách: lan_dau = null', nap_dau_thong_tin()->'lan_dau', 'null'::jsonb);
reset role;
set role service_role;
select nap_sao_tu_cong(:d2, 199000, 'gia', 'ND2') as n2 \gset
select pg_temp.kt('đơn đầu P2: nạp', :'n2'::jsonb->>'ket_qua', 'da_nap');
select pg_temp.kt('đơn đầu P2: tặng 20% × 240 = 48', (:'n2'::jsonb->>'sao_tang')::int, 48);
select pg_temp.kt('webhook lặp: đã xử lý', nap_sao_tu_cong(:d2, 199000, 'gia', 'ND2')->>'ket_qua', 'da_xu_ly');
select pg_temp.kt('đơn hai P2: không tặng', (nap_sao_tu_cong(:d3, 29000, 'gia', 'ND3')->>'sao_tang')::int, 0);
reset role;
select pg_temp.kt('một lô nap_dau duy nhất', (select count(*) from so_cai_sao
    where user_id = 'c0000000-0000-0000-0000-0000000000a2' and loai = 'nap_dau')::int, 1);
select pg_temp.kt('lô nap_dau: 48 Sao, hạn 365 ngày',
    (select so_luong || '@' || (het_han - current_date) from so_cai_sao where khoa = 'nap_dau:c0000000-0000-0000-0000-0000000000a2'), '48@365');
select pg_temp.kt('đơn đầu ghi sao_tang_dau 48', (select sao_tang_dau from don_nap where ma_don = :d2), 48);
select pg_temp.kt('đơn hai không ghi sao_tang_dau', (select sao_tang_dau from don_nap where ma_don = :d3) is null, true);
select pg_temp.kt('Sao mua của đơn đầu vẫn 240 (không gộp quà)', (select so_luong from so_cai_sao where khoa = 'mua:' || :d2), 240);
select pg_temp.kt('hoa hồng M = 20% × 240 (Sao gói, không tính 48 tặng)', (select sao_don || ':' || sao from hoa_hong where ma_don = :d2), '240:48');
select pg_temp.kt('P2 số dư 20 + 240 + 48 + 30', qt_so_du('c0000000-0000-0000-0000-0000000000a2'), 338);
set role authenticated; select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a2',false);
select pg_temp.kt('P2 sau khi nạp: hết lần đầu', (nap_dau_thong_tin()->>'lan_dau')::boolean, false);
select pg_temp.kt('P2 không tự gọi nd_tang_cho_don', has_function_privilege('authenticated', 'nd_tang_cho_don(bigint)', 'execute'), false);
reset role;

-- ================================================================ (4) hoàn đơn đầu → thu hồi đúng lô tặng (+ hoa hồng)
set role authenticated; select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a2',false);
\set ON_ERROR_STOP 0
select 'người thường hoàn đơn (phải lỗi khong_co_quyen)' t, hoan_don_nap(:d2, 'Tự hoàn tiền');
\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select hoan_don_nap(:d2, 'Khách nạp nhầm gói') as h2 \gset
select pg_temp.kt('hoàn đơn đầu: thu hồi 48 Sao tặng', (:'h2'::jsonb->>'thu_hoi_nap_dau')::int, 48);
select pg_temp.kt('hoàn đơn đầu: thu hồi hoa hồng 48', (:'h2'::jsonb->>'thu_hoi_hoa_hong')::int, 48);
select pg_temp.kt('hoàn lại lần hai bị từ chối', hoan_don_nap(:d2, 'Khách nạp nhầm gói')->>'ket_qua', 'khong_hoan_duoc');
select pg_temp.kt('hoàn đơn hai: không có gì để thu hồi', (hoan_don_nap(:d3, 'Khách nạp trùng')->>'thu_hoi_nap_dau')::int, 0);
select set_config('request.jwt.claim.aal','aal1',false);
reset role;
select pg_temp.kt('bút toán thu hồi có đích', (select so_luong from so_cai_sao where khoa = 'thu_hoi:nap_dau:c0000000-0000-0000-0000-0000000000a2'), -48);
select pg_temp.kt('P2 còn 20 Sao được mời', qt_so_du('c0000000-0000-0000-0000-0000000000a2'), 20);
select pg_temp.kt('nhật ký hoàn ghi thu hồi nạp đầu', (select (chi_tiet->>'thu_hoi_nap_dau')::int from nhat_ky_quan_tri
    where hanh_dong = 'don_nap.hoan' and doi_tuong = :d2::text order by id desc limit 1), 48);
-- Đã hoàn đơn đầu → không còn "lần đầu": nạp lại không được tặng lần nữa.
set role authenticated; select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a2',false);
select pg_temp.kt('sau hoàn: không còn lần đầu', (nap_dau_thong_tin()->>'lan_dau')::boolean, false);
select (tao_don_nap('khoi_dau', 'gia')->>'ma_don')::bigint as d4 \gset
reset role; set role service_role;
select pg_temp.kt('nạp lại sau hoàn: không tặng', (nap_sao_tu_cong(:d4, 12000, 'gia', 'ND4')->>'sao_tang')::int, 0);
reset role;

-- ================================================================ (5) mức kẹp 0–100
insert into cau_hinh (khoa, gia_tri) values ('sao.nap_dau.phan_tram', '150') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a4',false);
select pg_temp.kt('150% hiển thị kẹp 100', (nap_dau_thong_tin()->>'phan_tram')::int, 100);
select (tao_don_nap('thu', 'gia')->>'ma_don')::bigint as d5 \gset
reset role; set role service_role;
select pg_temp.kt('150% → tặng 100% × 30', (nap_sao_tu_cong(:d5, 29000, 'gia', 'ND5')->>'sao_tang')::int, 30);
reset role;
insert into cau_hinh (khoa, gia_tri) values ('sao.nap_dau.phan_tram', '0') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a5',false);
select pg_temp.kt('0% → coi như tắt', (nap_dau_thong_tin()->>'bat')::boolean, false);
select (tao_don_nap('khoi_dau', 'gia')->>'ma_don')::bigint as d6 \gset
reset role; set role service_role;
select pg_temp.kt('0% → vẫn nạp, không tặng', nap_sao_tu_cong(:d6, 12000, 'gia', 'ND6'),
    '{"sao": 12, "ket_qua": "da_nap", "sao_tang": 0}'::jsonb);
reset role;
select pg_temp.kt('0%: không có lô', (select count(*) from so_cai_sao where khoa = 'nap_dau:c0000000-0000-0000-0000-0000000000a5')::int, 0);
-- Sai số tiền: không tặng, không đổi trạng thái thành da_tra.
insert into cau_hinh (khoa, gia_tri) values ('sao.nap_dau.phan_tram', '20') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
insert into auth.users (id, email) values ('c0000000-0000-0000-0000-0000000000a6', 'nd-p5@x') on conflict do nothing;
set role authenticated; select set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-0000000000a6',false);
select (tao_don_nap('khoi_dau', 'gia')->>'ma_don')::bigint as d7 \gset
reset role; set role service_role;
select pg_temp.kt('sai tiền: không cộng', nap_sao_tu_cong(:d7, 1000, 'gia', 'ND7')->>'ket_qua', 'sai_tien');
reset role;
select pg_temp.kt('sai tiền: không có lô tặng', (select count(*) from so_cai_sao where khoa = 'nap_dau:c0000000-0000-0000-0000-0000000000a6')::int, 0);

delete from cau_hinh where khoa like 'sao.%';
select 'thu_nap_dau_0027: OK';
