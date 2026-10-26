-- 0028 SAO-HV: hội viên năm — đơn VND một lần, kích hoạt 365 ngày, Sao tháng không cộng dồn, câu hỏi chuyên gia, hoàn tiền
-- theo chính sách, gia hạn ≤ 30 ngày, quyền. Mỗi dòng "kt" SAI là lỗi ngay.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
grant all on all tables in schema public to authenticated;
delete from cau_hinh where khoa like 'sao.%';

-- H1 mua + Sao tháng + câu hỏi; H2 hoàn trong 14 ngày; H3 hoàn sau khi đã dùng; H4 gia hạn; K không là hội viên.
insert into auth.users (id, email) values
    ('d0000000-0000-0000-0000-0000000000a1', 'hv-h1@x'),
    ('d0000000-0000-0000-0000-0000000000a2', 'hv-h2@x'),
    ('d0000000-0000-0000-0000-0000000000a3', 'hv-h3@x'),
    ('d0000000-0000-0000-0000-0000000000a4', 'hv-h4@x'),
    ('d0000000-0000-0000-0000-0000000000a5', 'hv-k@x')
on conflict do nothing;

-- ================================================================ (0) quyền + ràng buộc
select pg_temp.kt('anon không tạo đơn hội viên', has_function_privilege('anon', 'tao_don_hoi_vien(text)', 'execute'), false);
select pg_temp.kt('authenticated tạo đơn hội viên', has_function_privilege('authenticated', 'tao_don_hoi_vien(text)', 'execute'), true);
select pg_temp.kt('authenticated không gọi hv_kich_hoat', has_function_privilege('authenticated', 'hv_kich_hoat(bigint)', 'execute'), false);
select pg_temp.kt('authenticated không cấp Sao tất cả', has_function_privilege('authenticated', 'hoi_vien_cap_sao_thang_tat_ca()', 'execute'), false);
select pg_temp.kt('authenticated không gọi hv_cap_sao_thang_cho', has_function_privilege('authenticated', 'hv_cap_sao_thang_cho(uuid)', 'execute'), false);
select pg_temp.kt('authenticated không gọi nap_sao_tu_cong', has_function_privilege('authenticated', 'nap_sao_tu_cong(bigint,integer,text,text)', 'execute'), false);
select pg_temp.kt('anon không ghi mở', has_function_privilege('anon', 'hoi_vien_ghi_mo(text)', 'execute'), false);
select pg_temp.kt('anon đọc hoi_vien_cua_toi (công tắc + giá)', has_function_privilege('anon', 'hoi_vien_cua_toi()', 'execute'), true);
select pg_temp.kt('service_role cấp Sao tất cả', has_function_privilege('service_role', 'hoi_vien_cap_sao_thang_tat_ca()', 'execute'), true);
select pg_temp.kt('đơn cũ mặc định loai = sao', (select count(*) from don_nap where loai <> 'sao')::int, 0);
\set ON_ERROR_STOP 0
select 'đơn sao không gói (phải lỗi ràng buộc)' t;
insert into don_nap (user_id, goi, so_tien, sao, cong, loai) values ('d0000000-0000-0000-0000-0000000000a1', null, 1000, 1, 'gia', 'sao');
select 'đơn hội viên có Sao (phải lỗi ràng buộc)' t;
insert into don_nap (user_id, goi, so_tien, sao, cong, loai) values ('d0000000-0000-0000-0000-0000000000a1', null, 1000, 5, 'gia', 'hoi_vien');
\set ON_ERROR_STOP 1

-- ================================================================ (1) công tắc tắt → không tạo đơn; khách thấy công tắc
set role anon; select set_config('request.jwt.claim.sub','',false);
select pg_temp.kt('khách: tắt, giá mặc định, không là hội viên',
    (hoi_vien_cua_toi()->>'bat') || '/' || (hoi_vien_cua_toi()->>'gia_vnd') || '/' || (hoi_vien_cua_toi()->>'dang_la'), 'false/3990000/false');
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('tắt: tạo đơn bị từ chối', tao_don_hoi_vien('gia')->>'ket_qua', 'chua_mo');
select pg_temp.kt('cổng lạ', tao_don_hoi_vien('stripe')->>'ket_qua', 'cong_khong_hop_le');
select pg_temp.kt('chưa là hội viên', hoi_vien_hieu_luc(), false);
select pg_temp.kt('chưa là hội viên: không ghi mở', hoi_vien_ghi_mo('lg:thu'), false);
select pg_temp.kt('chưa là hội viên: không cấp Sao tháng', hoi_vien_cap_sao_thang(), 0);
select pg_temp.kt('chưa là hội viên: không dùng câu hỏi', hoi_vien_dung_cau_hoi(), '{"ok": false, "con": 0}'::jsonb);
reset role;

-- ================================================================ (2) bật → đơn hội viên trả xong → hiệu lực 365 ngày
insert into cau_hinh (khoa, gia_tri) values ('sao.hoi_vien.bat', 'true') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select tao_don_hoi_vien('gia') as t1 \gset
select pg_temp.kt('đơn hội viên: giá từ cài đặt, 0 Sao, không gói',
    (:'t1'::jsonb->>'ket_qua') || '/' || (:'t1'::jsonb->>'so_tien') || '/' || (:'t1'::jsonb->>'sao') || '/' || (:'t1'::jsonb->>'gia_han'),
    'da_tao/3990000/0/false');
select (:'t1'::jsonb->>'ma_don')::bigint as d1 \gset
select pg_temp.kt('đơn ghi loai hoi_vien, goi null', (select loai || '/' || coalesce(goi, 'null') from don_nap where ma_don = :d1), 'hoi_vien/null');
select pg_temp.kt('H1 thấy đơn của mình', (select count(*) from don_nap where ma_don = :d1)::int, 1);
reset role; set role service_role; select set_config('request.jwt.claim.sub','',false);
select pg_temp.kt('sai tiền: không kích hoạt', nap_sao_tu_cong(:d1, 1000, 'gia', 'HV0')->>'ket_qua', 'sai_tien');
reset role;
select pg_temp.kt('sai tiền: không có hội viên', (select count(*) from hoi_vien)::int, 0);
update don_nap set trang_thai = 'cho' where ma_don = :d1;   -- quản trị sửa tay rồi cổng báo lại đúng tiền
set role service_role; select set_config('request.jwt.claim.sub','',false);
select nap_sao_tu_cong(:d1, 3990000, 'gia', 'HV1') as n1 \gset
select pg_temp.kt('trả đúng: da_nap, loai hoi_vien, kích hoạt',
    (:'n1'::jsonb->>'ket_qua') || '/' || (:'n1'::jsonb->>'sao') || '/' || (:'n1'::jsonb->>'loai') || '/' || (:'n1'::jsonb->'hoi_vien'->>'ket_qua'),
    'da_nap/0/hoi_vien/kich_hoat');
select pg_temp.kt('webhook lặp: đã xử lý', nap_sao_tu_cong(:d1, 3990000, 'gia', 'HV1')->>'ket_qua', 'da_xu_ly');
-- Đơn loai khác 'sao' (vd chuyên gia 0029) qua cùng hàm: chỉ ghi đã trả, 0 Sao, không nạp đầu / hoa hồng.
reset role;
insert into don_nap (user_id, goi, so_tien, sao, cong, loai) values ('d0000000-0000-0000-0000-0000000000a1', null, 199000, 0, 'gia', 'chuyen_gia')
    returning ma_don as dcg \gset
set role service_role; select set_config('request.jwt.claim.sub','',false);
select nap_sao_tu_cong(:dcg, 199000, 'gia', 'CG1') as ncg \gset
select pg_temp.kt('đơn chuyên gia: da_nap, 0 Sao, loai chuyen_gia', (:'ncg'::jsonb->>'ket_qua') || '/' || (:'ncg'::jsonb->>'sao') || '/' || (:'ncg'::jsonb->>'loai'), 'da_nap/0/chuyen_gia');
reset role;
select pg_temp.kt('đơn chuyên gia đã trả, không bút toán Sao', (select trang_thai from don_nap where ma_don = :dcg) || '/' || (select count(*) from so_cai_sao where khoa = 'mua:' || :dcg), 'da_tra/0');
-- Đơn hội viên + chuyên gia đã trả KHÔNG làm mất "lần nạp đầu" của lần nạp Sao thật.
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('H1 vẫn còn lần nạp đầu sau đơn hội viên + chuyên gia', nap_dau_thong_tin()->>'lan_dau', 'true');
reset role; set role service_role; select set_config('request.jwt.claim.sub','',false);
select pg_temp.kt('service_role hỏi hiệu lực của H1', hoi_vien_hieu_luc('d0000000-0000-0000-0000-0000000000a1'), true);
select pg_temp.kt('service_role hỏi hiệu lực của K', hoi_vien_hieu_luc('d0000000-0000-0000-0000-0000000000a5'), false);
reset role;
select pg_temp.kt('một dòng hội viên hiệu lực', (select count(*) from hoi_vien where user_id = 'd0000000-0000-0000-0000-0000000000a1' and trang_thai = 'hieu_luc')::int, 1);
select pg_temp.kt('hiệu lực đúng 365 ngày từ hôm nay (VN)',
    (select (tu_ngay = hv_hom_nay()) || '/' || (den_ngay - tu_ngay) from hoi_vien where ma_don = :d1), 'true/365');
select pg_temp.kt('không cộng Sao, không bút toán mua', (select count(*) from so_cai_sao where user_id = 'd0000000-0000-0000-0000-0000000000a1')::int, 0);
select pg_temp.kt('không hoa hồng trên đơn hội viên', (select count(*) from hoa_hong where ma_don = :d1)::int, 0);
-- Giá đổi ở cài đặt (kẹp 100.000–50.000.000) → đơn sau lấy giá mới.
insert into cau_hinh (khoa, gia_tri) values ('sao.hoi_vien.gia_vnd', '2990000') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a5',false);
select pg_temp.kt('K thấy giá mới', (hoi_vien_cua_toi()->>'gia_vnd')::int, 2990000);
reset role;
insert into cau_hinh (khoa, gia_tri) values ('sao.hoi_vien.gia_vnd', '3990000') on conflict (khoa) do update set gia_tri = excluded.gia_tri;

-- ================================================================ (3) H1: quyền lợi — hiệu lực, ghi mở, Sao tháng, câu hỏi
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('H1 là hội viên', hoi_vien_hieu_luc(), true);
\set ON_ERROR_STOP 0
select 'H1 hỏi hiệu lực của người khác (phải lỗi khong_co_quyen)' t, hoi_vien_hieu_luc('d0000000-0000-0000-0000-0000000000a5');
\set ON_ERROR_STOP 1
select hoi_vien_cua_toi() as c1 \gset
select pg_temp.kt('hoi_vien_cua_toi: đang là, 365 ngày, 2 câu, 15 Sao/tháng, chưa cấp',
    (:'c1'::jsonb->>'dang_la') || '/' || (:'c1'::jsonb->>'con_ngay') || '/' || (:'c1'::jsonb->>'cau_hoi_con') || '/'
    || (:'c1'::jsonb->>'sao_thang') || '/' || (:'c1'::jsonb->>'sao_thang_da_cap') || '/' || (:'c1'::jsonb->>'gia_han_duoc'),
    'true/365/2/15/false/false');
select pg_temp.kt('đang là hội viên còn > 30 ngày: không bán chồng', tao_don_hoi_vien('gia')->>'ket_qua', 'da_la_hoi_vien');
-- Sao tháng: cấp một lần, không cộng dồn, hết hạn cuối tháng.
select pg_temp.kt('cấp Sao tháng lần đầu: 15', hoi_vien_cap_sao_thang(), 15);
select pg_temp.kt('gọi lại trong tháng: 0 (không cộng dồn)', hoi_vien_cap_sao_thang(), 0);
select pg_temp.kt('số dư 15', so_du_sao(), 15);
select pg_temp.kt('hoi_vien_cua_toi: đã cấp tháng này', (hoi_vien_cua_toi()->>'sao_thang_da_cap')::boolean, true);
reset role;
select pg_temp.kt('một lô hoi_vien, hết hạn ngày cuối tháng',
    (select count(*) || '@' || min(het_han)::text from so_cai_sao where loai = 'hoi_vien' and user_id = 'd0000000-0000-0000-0000-0000000000a1'),
    '1@' || (date_trunc('month', hv_hom_nay()) + interval '1 month - 1 day')::date::text);
select pg_temp.kt('khoá lô theo tháng', (select khoa from so_cai_sao where loai = 'hoi_vien' and user_id = 'd0000000-0000-0000-0000-0000000000a1'),
    'hoi_vien:d0000000-0000-0000-0000-0000000000a1:' || to_char(hv_hom_nay(), 'YYYY-MM'));
-- Lô tháng trước đã hết hạn (giả lập) không còn trong số dư → "không cộng dồn".
insert into so_cai_sao (user_id, so_luong, loai, khoa, het_han, tao_luc)
values ('d0000000-0000-0000-0000-0000000000a1', 15, 'hoi_vien', 'hoi_vien:d0000000-0000-0000-0000-0000000000a1:' || to_char(hv_hom_nay() - interval '1 month', 'YYYY-MM'),
        (date_trunc('month', hv_hom_nay()) - interval '1 day')::date, now() - interval '40 days');
select pg_temp.kt('lô tháng trước hết hạn: số dư vẫn 15', qt_so_du('d0000000-0000-0000-0000-0000000000a1'), 15);
-- Cron: cấp cho mọi hội viên → H1 đã nhận tháng này → 0 người.
set role service_role; select set_config('request.jwt.claim.sub','',false);
select pg_temp.kt('cron: không ai cần cấp thêm', hoi_vien_cap_sao_thang_tat_ca(), 0);
reset role;
-- Mức 0 → không cấp (H4 sẽ kiểm sau khi là hội viên). Câu hỏi chuyên gia.
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('ghi mở báo cáo', hoi_vien_ghi_mo('lg:bao-cao-1'), true);
select pg_temp.kt('ghi mở lại cùng khoá: không đếm thêm', hoi_vien_ghi_mo('lg:bao-cao-1'), false);
select pg_temp.kt('dùng câu hỏi 1', hoi_vien_dung_cau_hoi(), '{"ok": true, "con": 1}'::jsonb);
select pg_temp.kt('dùng câu hỏi 2', hoi_vien_dung_cau_hoi(), '{"ok": true, "con": 0}'::jsonb);
select pg_temp.kt('hết lượt', hoi_vien_dung_cau_hoi(), '{"ok": false, "con": 0}'::jsonb);
select pg_temp.kt('hoi_vien_cua_toi: 0 câu còn', (hoi_vien_cua_toi()->>'cau_hoi_con')::int, 0);
reset role;
select pg_temp.kt('hoi_vien_mo chỉ có khoá + lúc', (select count(*) from hoi_vien_mo where user_id = 'd0000000-0000-0000-0000-0000000000a1')::int, 1);
-- Nâng số câu hỏi / năm ở cài đặt → còn thêm ngay.
insert into cau_hinh (khoa, gia_tri) values ('sao.hoi_vien.cau_hoi_nam', '3') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('nâng lên 3 câu: còn 1', (hoi_vien_cua_toi()->>'cau_hoi_con')::int, 1);
reset role;
insert into cau_hinh (khoa, gia_tri) values ('sao.hoi_vien.cau_hoi_nam', '2') on conflict (khoa) do update set gia_tri = excluded.gia_tri;

-- ================================================================ (4) hoàn tiền — H2 trong 14 ngày chưa dùng → 100 %
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a2',false);
select (tao_don_hoi_vien('gia')->>'ma_don')::bigint as d2 \gset
reset role; set role service_role; select set_config('request.jwt.claim.sub','',false);
select pg_temp.kt('H2 trả', nap_sao_tu_cong(:d2, 3990000, 'gia', 'HV2')->>'ket_qua', 'da_nap');
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a2',false);
\set ON_ERROR_STOP 0
select 'người thường hoàn đơn (phải lỗi khong_co_quyen)' t, hoan_don_nap(:d2, 'Tự hoàn tiền');
\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select hoan_don_nap(:d2, 'Khách đổi ý trong 14 ngày') as h2 \gset
select pg_temp.kt('hoàn H2: gợi ý 100 %',
    (:'h2'::jsonb->>'ket_qua') || '/' || (:'h2'::jsonb->>'loai') || '/' || (:'h2'::jsonb->>'so_tien_hoan_goi_y') || '/' || (:'h2'::jsonb->>'ly_do'),
    'da_hoan/hoi_vien/3990000/trong_14_ngay_chua_dung');
select pg_temp.kt('hoàn lại lần hai bị từ chối', hoan_don_nap(:d2, 'Khách đổi ý trong 14 ngày')->>'ket_qua', 'khong_hoan_duoc');
select set_config('request.jwt.claim.aal','aal1',false);
select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a2',false);
select pg_temp.kt('H2 hết quyền hội viên', hoi_vien_hieu_luc(), false);
reset role;
select pg_temp.kt('hội viên H2 → hoan; đơn → hoan',
    (select trang_thai from hoi_vien where ma_don = :d2) || '/' || (select trang_thai from don_nap where ma_don = :d2), 'hoan/hoan');
select pg_temp.kt('không bút toán Sao khi hoàn đơn hội viên', (select count(*) from so_cai_sao where user_id = 'd0000000-0000-0000-0000-0000000000a2')::int, 0);
select pg_temp.kt('nhật ký hoàn ghi loai + gợi ý', (select (chi_tiet->>'loai') || '/' || (chi_tiet->>'so_tien_hoan_goi_y') from nhat_ky_quan_tri
    where hanh_dong = 'don_nap.hoan' and doi_tuong = :d2::text order by id desc limit 1), 'hoi_vien/3990000');
-- H2 mua lại sau khi hoàn: dòng cũ 'hoan' không cản dòng mới.
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a2',false);
select (tao_don_hoi_vien('gia')->>'ma_don')::bigint as d2b \gset
reset role; set role service_role; select set_config('request.jwt.claim.sub','',false);
select pg_temp.kt('H2 mua lại: kích hoạt mới', nap_sao_tu_cong(:d2b, 3990000, 'gia', 'HV2B')->'hoi_vien'->>'ket_qua', 'kich_hoat');
reset role;
select pg_temp.kt('H2: 2 dòng (hoan + hieu_luc)', (select string_agg(trang_thai, ',' order by id) from hoi_vien where user_id = 'd0000000-0000-0000-0000-0000000000a2'), 'hoan,hieu_luc');

-- ================================================================ (5) hoàn sau 14 ngày, đã mở 1 chương + 1 câu hỏi → theo tháng tròn còn lại
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a3',false);
select (tao_don_hoi_vien('gia')->>'ma_don')::bigint as d3 \gset
reset role; set role service_role; select set_config('request.jwt.claim.sub','',false);
select pg_temp.kt('H3 trả', nap_sao_tu_cong(:d3, 3990000, 'gia', 'HV3')->>'ket_qua', 'da_nap');
reset role;
-- Giả lập: trả cách đây 45 ngày (đang ở tháng thứ 2), còn 320 ngày.
update don_nap set tra_luc = now() - interval '45 days' where ma_don = :d3;
update hoi_vien set tu_ngay = hv_hom_nay() - 45, den_ngay = hv_hom_nay() + 320 where ma_don = :d3;
select hv_thang_tron(hv_hom_nay(), hv_hom_nay() + 320) as thang3 \gset
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a3',false);
select pg_temp.kt('H3 mở 1 chương tháng 2', hoi_vien_ghi_mo('lg:bao-cao-h3'), true);
select pg_temp.kt('H3 dùng 1 câu hỏi', (hoi_vien_dung_cau_hoi()->>'ok')::boolean, true);
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select hoan_don_nap(:d3, 'Khách xin hoàn sau khi dùng') as h3 \gset
select pg_temp.kt('hoàn H3: theo tháng tròn còn lại', :'h3'::jsonb->>'ly_do', 'theo_thang_tron_con_lai');
select pg_temp.kt('hoàn H3: tháng còn = tháng tròn tới hạn (10)', (:'h3'::jsonb->>'thang_con')::int, :thang3);
select pg_temp.kt('hoàn H3: 10 tháng', :thang3, 10);
select pg_temp.kt('hoàn H3: gợi ý = 3.990.000 × tháng/12 − 199.000 (1 câu hỏi)',
    (:'h3'::jsonb->>'so_tien_hoan_goi_y')::int, round(3990000 * :thang3 / 12.0)::int - 199000);
select pg_temp.kt('hoàn H3: ghi đã mở 1, câu hỏi 1', (:'h3'::jsonb->>'da_mo') || '/' || (:'h3'::jsonb->>'cau_hoi_da_dung'), '1/1');
select set_config('request.jwt.claim.aal','aal1',false);
reset role;
-- Giá câu hỏi lẻ đổi ở cài đặt (dùng chung mảng chuyên gia) → trừ theo giá mới. Trường hợp trừ quá → kẹp 0.
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a3',false);
select (tao_don_hoi_vien('gia')->>'ma_don')::bigint as d3b \gset
reset role; set role service_role; select set_config('request.jwt.claim.sub','',false);
select nap_sao_tu_cong(:d3b, 3990000, 'gia', 'HV3B');
reset role;
update don_nap set tra_luc = now() - interval '360 days' where ma_don = :d3b;
update hoi_vien set tu_ngay = hv_hom_nay() - 360, den_ngay = hv_hom_nay() + 5 where ma_don = :d3b;
insert into cau_hinh (khoa, gia_tri) values ('sao.chuyen_gia.gia_vnd', '500000') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a3',false);
select pg_temp.kt('H3 (lần 2) còn 5 ngày: gia hạn được', (hoi_vien_cua_toi()->>'gia_han_duoc')::boolean, true);
select hoi_vien_dung_cau_hoi();
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select pg_temp.kt('hoàn khi còn < 1 tháng tròn + 1 câu hỏi: gợi ý 0 (không âm)',
    (hoan_don_nap(:d3b, 'Khách xin hoàn cuối kỳ')->>'so_tien_hoan_goi_y')::int, 0);
select set_config('request.jwt.claim.aal','aal1',false);
reset role;
delete from cau_hinh where khoa = 'sao.chuyen_gia.gia_vnd';

-- ================================================================ (6) gia hạn chỉ khi ≤ 30 ngày; nối tiếp hạn cũ; lượt câu hỏi về 0
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a4',false);
select (tao_don_hoi_vien('gia')->>'ma_don')::bigint as d4 \gset
reset role; set role service_role; select set_config('request.jwt.claim.sub','',false);
select nap_sao_tu_cong(:d4, 3990000, 'gia', 'HV4');
reset role;
update hoi_vien set tu_ngay = hv_hom_nay() - 334, den_ngay = hv_hom_nay() + 31 where ma_don = :d4;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a4',false);
select pg_temp.kt('còn 31 ngày: chưa gia hạn được', tao_don_hoi_vien('gia')->>'ket_qua', 'da_la_hoi_vien');
select pg_temp.kt('hoi_vien_cua_toi: gia_han_duoc = false', (hoi_vien_cua_toi()->>'gia_han_duoc')::boolean, false);
select hoi_vien_dung_cau_hoi();
reset role;
update hoi_vien set den_ngay = hv_hom_nay() + 30 where ma_don = :d4;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a4',false);
select tao_don_hoi_vien('gia') as t4 \gset
select pg_temp.kt('còn 30 ngày: đơn gia hạn', (:'t4'::jsonb->>'ket_qua') || '/' || (:'t4'::jsonb->>'gia_han') || '/' || (:'t4'::jsonb->>'ten_goi'), 'da_tao/true/Gia hạn hội viên năm');
select (:'t4'::jsonb->>'ma_don')::bigint as d4b \gset
reset role; set role service_role; select set_config('request.jwt.claim.sub','',false);
select nap_sao_tu_cong(:d4b, 3990000, 'gia', 'HV4B') as n4b \gset
select pg_temp.kt('gia hạn: nối tiếp hạn cũ', :'n4b'::jsonb->'hoi_vien'->>'ket_qua', 'gia_han');
select pg_temp.kt('webhook lặp đơn gia hạn: không nối thêm', nap_sao_tu_cong(:d4b, 3990000, 'gia', 'HV4B')->>'ket_qua', 'da_xu_ly');
reset role;
select pg_temp.kt('gia hạn: den_ngay = hạn cũ + 365, vẫn một dòng, tiền cộng dồn, câu hỏi về 0',
    (select (den_ngay = hv_hom_nay() + 30 + 365) || '/' || gia_vnd || '/' || cau_hoi_da_dung || '/' || array_length(don_gia_han, 1)
     from hoi_vien where ma_don = :d4), 'true/7980000/0/1');
select pg_temp.kt('H4 vẫn một dòng hiệu lực', (select count(*) from hoi_vien where user_id = 'd0000000-0000-0000-0000-0000000000a4')::int, 1);
-- Hoàn đơn gia hạn trong 14 ngày chưa dùng → gợi ý 100 %, lùi 365 ngày, hội viên vẫn hiệu lực.
set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select hoan_don_nap(:d4b, 'Khách gia hạn nhầm') as h4b \gset
select pg_temp.kt('hoàn đơn gia hạn: 100 %', (:'h4b'::jsonb->>'so_tien_hoan_goi_y')::int || '/' || (:'h4b'::jsonb->>'ly_do'), '3990000/trong_14_ngay_chua_dung');
select set_config('request.jwt.claim.aal','aal1',false);
reset role;
select pg_temp.kt('hoàn gia hạn: lùi 365, vẫn hiệu lực, bỏ mã đơn gia hạn',
    (select (den_ngay = hv_hom_nay() + 30) || '/' || trang_thai || '/' || coalesce(array_length(don_gia_han, 1), 0) from hoi_vien where ma_don = :d4), 'true/hieu_luc/0');
-- Mức Sao tháng 0 → không cấp.
insert into cau_hinh (khoa, gia_tri) values ('sao.hoi_vien.sao_thang', '0') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a4',false);
select pg_temp.kt('mức 0: không cấp Sao tháng', hoi_vien_cap_sao_thang(), 0);
reset role;
insert into cau_hinh (khoa, gia_tri) values ('sao.hoi_vien.sao_thang', '20') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role service_role; select set_config('request.jwt.claim.sub','',false);
select pg_temp.kt('cron cấp cho hội viên chưa nhận (H2 mới, H4): 2 người', hoi_vien_cap_sao_thang_tat_ca(), 2);
select pg_temp.kt('cron chạy lại: 0', hoi_vien_cap_sao_thang_tat_ca(), 0);
reset role;
select pg_temp.kt('H4 nhận 20 Sao theo mức mới', qt_so_du('d0000000-0000-0000-0000-0000000000a4'), 20);

-- ================================================================ (7) hết hạn → không còn quyền; thống kê quản trị
update hoi_vien set tu_ngay = hv_hom_nay() - 400, den_ngay = hv_hom_nay() - 1 where ma_don = :d4;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a4',false);
select pg_temp.kt('quá hạn: không còn là hội viên', hoi_vien_hieu_luc(), false);
select pg_temp.kt('quá hạn: mua mới được (không phải gia hạn)', (tao_don_hoi_vien('gia')->>'gia_han')::boolean, false);
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select set_config('request.jwt.claim.aal','aal2',false);
select thong_ke_hoi_vien(30) as tk \gset
select pg_temp.kt('thống kê: hiệu lực 2 (H1, H2 mới; H3 đã hoàn, H4 quá hạn), hoàn trong kỳ 2 (d2, d4b — d3/d3b trả ngoài kỳ), bật',
    (:'tk'::jsonb->>'hieu_luc') || '/' || (:'tk'::jsonb->>'hoan') || '/' || (:'tk'::jsonb->>'bat'), '2/2/true');
select pg_temp.kt('thống kê: doanh thu = 3 đơn hội viên còn da_tra (d1, d2b, d4) × 3.990.000', (:'tk'::jsonb->>'doanh_thu')::bigint, 11970000::bigint);
select pg_temp.kt('thống kê: Sao tháng đã cấp 15 + 20 + 20', (:'tk'::jsonb->>'sao_thang_da_cap')::int, 55);
select set_config('request.jwt.claim.aal','aal1',false);
\set ON_ERROR_STOP 0
select 'chưa MFA xem thống kê (phải lỗi khong_co_quyen)' t, thong_ke_hoi_vien(30);
\set ON_ERROR_STOP 1
reset role;
select pg_temp.kt('đơn Sao vẫn chạy như cũ (hồi quy)', (select count(*) from don_nap where loai = 'sao' and trang_thai = 'da_tra') > 0, true);

delete from cau_hinh where khoa like 'sao.%';
select 'thu_hoi_vien_0028: OK';
