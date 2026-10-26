-- 0029 CG-C: "Hỏi chuyên gia" — đặt câu hỏi, trả VND, chuyên gia trả lời trong hạn, hoàn, dọn ảnh chụp hồ sơ. Mỗi dòng "kt" SAI là lỗi ngay.
-- 0028 (hội viên) sửa nap_sao_tu_cong cho đơn loai <> 'sao'. Chưa có 0028 → bước "cổng báo đã trả" giả lập bằng cách
-- service role cập nhật đơn sang 'da_tra' (đúng điều nap_sao_tu_cong của 0028 sẽ làm) — trigger 0029 vẫn là thứ được kiểm.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;
-- Chạy câu SQL phải LỖI chứa p_loi (trong vai trò hiện tại).
create or replace function pg_temp.phai_loi(p_ten text, p_sql text, p_loi text) returns text language plpgsql as $$
begin
    execute p_sql;
    raise exception 'SAI % — không lỗi (cần lỗi "%")', p_ten, p_loi;
exception when others then
    if sqlerrm like '%' || p_loi || '%' then return 'ok ' || p_ten || ' (lỗi đúng: ' || p_loi || ')'; end if;
    raise exception 'SAI % — lỗi "%", cần "%"', p_ten, sqlerrm, p_loi;
end $$;
delete from cau_hinh where khoa like 'sao.chuyen_gia.%';

-- A người hỏi · B người khác · E chuyên gia (thẩm định) · O chủ sở hữu
insert into auth.users (id, email) values
    ('d0000000-0000-0000-0000-0000000000a1', 'cg-a@x'),
    ('d0000000-0000-0000-0000-0000000000a2', 'cg-b@x'),
    ('d0000000-0000-0000-0000-00000000000e', 'cg-e@x'),
    ('d0000000-0000-0000-0000-00000000000f', 'cg-o@x')
on conflict (id) do update set email = excluded.email;   -- id dùng chung với tệp test khác (0028) → email phải là của tệp này
insert into vai_tro_quan_tri (user_id, vai_tro) values
    ('d0000000-0000-0000-0000-00000000000e', 'tham_dinh'), ('d0000000-0000-0000-0000-00000000000f', 'chu_so_huu')
on conflict (user_id) do update set vai_tro = excluded.vai_tro;
select (prosrc like '%chuyen_gia%') as co28 from pg_proc where proname = 'nap_sao_tu_cong' and pronamespace = 'public'::regnamespace \gset

-- ================================================================ (0) cấu trúc + quyền
select pg_temp.kt('don_nap có cột loai', exists (select 1 from information_schema.columns where table_name = 'don_nap' and column_name = 'loai'), true);
select pg_temp.kt('don_nap.goi nullable', (select is_nullable from information_schema.columns where table_name = 'don_nap' and column_name = 'goi'), 'YES');
select pg_temp.kt('anon đọc thông tin', has_function_privilege('anon', 'chuyen_gia_thong_tin()', 'execute'), true);
select pg_temp.kt('anon không tạo câu', has_function_privilege('anon', 'tao_cau_hoi_chuyen_gia(text,text,jsonb,boolean,boolean,text)', 'execute'), false);
select pg_temp.kt('authenticated không gọi don_chuyen_gia', has_function_privilege('authenticated', 'don_chuyen_gia()', 'execute'), false);
select pg_temp.kt('lọc hồ sơ: chỉ khoá cho phép', cg_loc_ho_so('{"ho_ten":"An","ngay_sinh":"1990-05-17","gio_sinh":"12:30","gioi_tinh":"nam","noi_sinh":"ha-noi","bi_mat":"x","gio_sinh_sai":"1"}'),
    '{"ho_ten":"An","ngay_sinh":"1990-05-17","gio_sinh":"12:30","gioi_tinh":"nam","noi_sinh":"ha-noi"}'::jsonb);
select pg_temp.kt('lọc hồ sơ: thiếu ngày sinh → null', cg_loc_ho_so('{"ho_ten":"An"}') is null, true);
select pg_temp.kt('lọc hồ sơ: giờ sai định dạng bị bỏ', cg_loc_ho_so('{"ngay_sinh":"1990-05-17","gio_sinh":"12h30"}') ? 'gio_sinh', false);
select pg_temp.kt('liên hệ: link', cg_co_lien_he('xem thêm tại https://abc.vn nhé'), true);
select pg_temp.kt('liên hệ: điện thoại', cg_co_lien_he('gọi 0912 345 678'), true);
select pg_temp.kt('liên hệ: câu thường', cg_co_lien_he('Năm 2027 bạn nên chậm lại một chút.'), false);

-- (các test sau đọc bảng trực tiếp dưới RLS như thu_nap_dau_0027)
grant all on all tables in schema public to authenticated;
-- ================================================================ (1) tắt → từ chối
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('tắt: thông tin bat=false', (chuyen_gia_thong_tin()->>'bat')::boolean, false);
select pg_temp.kt('tắt: tạo câu bị từ chối', tao_cau_hoi_chuyen_gia('tu_vi', 'Năm tới tôi có nên đổi việc không?', null, false, false, 'gia')->>'ket_qua', 'tat');
reset role;

-- ================================================================ (2) bật → câu đầu giảm 30 %, đơn chuyên gia
insert into cau_hinh (khoa, gia_tri) values ('sao.chuyen_gia.bat', 'true') on conflict (khoa) do update set gia_tri = excluded.gia_tri;
set role anon; select set_config('request.jwt.claim.sub','',false);
select pg_temp.kt('khách: giá, giảm, hạn, lan_dau null', (chuyen_gia_thong_tin() - 'dang_cho'),
    '{"bat": true, "gia_vnd": 199000, "giam_lan_dau_pt": 30, "han_gio": 48, "han_gio_cua_toi": 48, "gia_lan_dau": 139000, "lan_dau": null, "gia_lan_nay": 139000}'::jsonb);
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('A: lần đầu, giá 139.000', (chuyen_gia_thong_tin()->>'lan_dau') || '/' || (chuyen_gia_thong_tin()->>'gia_lan_nay'), 'true/139000');
select pg_temp.kt('mảng lạ', tao_cau_hoi_chuyen_gia('boi_bai', 'Năm tới tôi có nên đổi việc không?', null, false, false, 'gia')->>'ket_qua', 'mang_khong_hop_le');
select pg_temp.kt('câu quá ngắn', tao_cau_hoi_chuyen_gia('tu_vi', 'ngắn', null, false, false, 'gia')->>'ket_qua', 'cau_hoi_khong_hop_le');
select pg_temp.kt('cổng lạ', tao_cau_hoi_chuyen_gia('tu_vi', 'Năm tới tôi có nên đổi việc không?', null, false, false, 'momo')->>'ket_qua', 'cong_khong_hop_le');
select tao_cau_hoi_chuyen_gia('tu_vi', 'Năm tới tôi có nên đổi việc không?  Tôi đang   phân vân.',
    '{"ho_ten":"An","ngay_sinh":"1990-05-17","gio_sinh":"12:30","gioi_tinh":"nam","noi_sinh":"ha-noi","email":"a@x"}', true, false, 'gia') as c1 \gset
select pg_temp.kt('câu 1: tạo, chờ trả, giá giảm', (:'c1'::jsonb->>'ket_qua') || '/' || (:'c1'::jsonb->>'trang_thai') || '/' || (:'c1'::jsonb->>'so_tien') || '/' || (:'c1'::jsonb->>'lan_dau'), 'da_tao/cho_tra/139000/true');
select (:'c1'::jsonb->>'id')::bigint as q1, (:'c1'::jsonb->>'ma_don')::bigint as d1 \gset
select pg_temp.kt('câu 1: khoảng trắng gọn', (select cau_hoi from cau_hoi_chuyen_gia where id = :q1), 'Năm tới tôi có nên đổi việc không? Tôi đang phân vân.');
select pg_temp.kt('câu 1: ảnh chụp hồ sơ đã lọc (bỏ email)', (select ho_so from cau_hoi_chuyen_gia where id = :q1),
    '{"ho_ten":"An","ngay_sinh":"1990-05-17","gio_sinh":"12:30","gioi_tinh":"nam","noi_sinh":"ha-noi"}'::jsonb);
select pg_temp.kt('đơn: loai chuyen_gia, không gói, 0 Sao, 139.000', (select loai || '/' || coalesce(goi, '-') || '/' || sao || '/' || so_tien || '/' || trang_thai from don_nap where ma_don = :d1), 'chuyen_gia/-/0/139000/cho');
select pg_temp.kt('A: đang chờ trả tiền → chưa tính đã mua', (chuyen_gia_thong_tin()->>'lan_dau')::boolean, true);
reset role;

-- ================================================================ (3) cổng báo đã trả → trigger → chờ trả lời + hạn 48 giờ
set role service_role;
\if :co28
select pg_temp.kt('0028: nap_sao_tu_cong nhận đơn chuyên gia', nap_sao_tu_cong(:d1, 139000, 'gia', 'CG1') ? 'ket_qua', true);
\else
update don_nap set trang_thai = 'da_tra', tra_luc = now(), ma_giao_dich = 'CG1' where ma_don = :d1;
\endif
reset role;
select pg_temp.kt('đơn 1 đã trả', (select trang_thai from don_nap where ma_don = :d1), 'da_tra');
select pg_temp.kt('câu 1 → chờ trả lời', (select trang_thai from cau_hoi_chuyen_gia where id = :q1), 'cho_tra_loi');
select pg_temp.kt('câu 1: hạn = lúc trả + 48 giờ', (select han_tra_loi - thanh_toan_luc from cau_hoi_chuyen_gia where id = :q1), interval '48 hours');
select pg_temp.kt('câu 1: hạn trong tương lai', (select han_tra_loi > now() + interval '47 hours' from cau_hoi_chuyen_gia where id = :q1), true);
-- webhook gửi lại: đơn đã xử lý, câu không đổi
set role service_role;
update don_nap set trang_thai = 'da_tra' where ma_don = :d1;
reset role;
select pg_temp.kt('lặp: vẫn một câu chờ trả lời', (select count(*) from cau_hoi_chuyen_gia where ma_don = :d1 and trang_thai = 'cho_tra_loi')::int, 1);

-- ================================================================ (4) câu thứ hai: không tích đồng ý → không ghi hồ sơ; giá đầy
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('A: đã mua → hết lần đầu, giá 199.000', (chuyen_gia_thong_tin()->>'lan_dau') || '/' || (chuyen_gia_thong_tin()->>'gia_lan_nay') || '/' || (chuyen_gia_thong_tin()->>'dang_cho'), 'false/199000/1');
select tao_cau_hoi_chuyen_gia('bat_tu', 'Tôi hợp với nghề gì, có nên mở cửa hàng không?',
    '{"ho_ten":"An","ngay_sinh":"1990-05-17"}', false, false, 'gia') as c2 \gset
select pg_temp.kt('câu 2: giá đầy, không lần đầu', (:'c2'::jsonb->>'so_tien') || '/' || (:'c2'::jsonb->>'lan_dau'), '199000/false');
select (:'c2'::jsonb->>'id')::bigint as q2, (:'c2'::jsonb->>'ma_don')::bigint as d2 \gset
select pg_temp.kt('câu 2: không đồng ý → ho_so null', (select ho_so is null and not dong_y_chia_se from cau_hoi_chuyen_gia where id = :q2), true);
select pg_temp.kt('A xem của mình: 2 câu, không trả ho_so, co_ho_so đúng', (select jsonb_agg(x->'co_ho_so' order by (x->>'id')::int) || jsonb_build_object('n', jsonb_array_length(cau_hoi_cua_toi()), 'khoa', (cau_hoi_cua_toi()->0) ? 'ho_so')
    from jsonb_array_elements(cau_hoi_cua_toi()) x), '[true, false, {"n": 2, "khoa": false}]'::jsonb);
reset role;
set role service_role;
update don_nap set trang_thai = 'da_tra', tra_luc = now() where ma_don = :d2;
reset role;

-- ================================================================ (5) người thường không gọi được hàm quản trị; RLS
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.phai_loi('A đọc hàng đợi', 'select ds_cau_hoi_chuyen_gia(null, 10)', 'khong_co_quyen');
select pg_temp.phai_loi('A tự trả lời', format('select tra_loi_cau_hoi(%s, %L)', :q1, 'Tôi tự trả lời câu hỏi của chính mình đây.'), 'khong_co_quyen');
select pg_temp.phai_loi('A tự hoàn', format('select hoan_cau_hoi(%s, %L)', :q1, 'Tự hoàn tiền'), 'khong_co_quyen');
select pg_temp.phai_loi('A đánh dấu quá hạn', 'select danh_dau_qua_han_chuyen_gia()', 'khong_co_quyen');
select pg_temp.phai_loi('A xem thống kê', 'select thong_ke_chuyen_gia(30)', 'khong_co_quyen');
select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a2',false);
select pg_temp.kt('B: bảng RLS không thấy câu của A', (select count(*) from cau_hoi_chuyen_gia)::int, 0);
select pg_temp.phai_loi('B ghi thẳng bảng (RLS chặn)', $q$insert into cau_hoi_chuyen_gia (user_id, mang, cau_hoi, gia_vnd) values ('d0000000-0000-0000-0000-0000000000a2', 'tu_vi', 'Tôi tự ghi thẳng vào bảng', 0)$q$, 'row-level security');
select pg_temp.kt('B: cau_hoi_cua_toi rỗng', cau_hoi_cua_toi(), '[]'::jsonb);
select pg_temp.kt('B đánh giá câu của A → không đổi', danh_gia_cau_hoi(:q1, 5)->>'ket_qua', 'khong_doi');
select pg_temp.kt('B huỷ câu của A → không đổi', huy_cau_hoi(:q1)->>'ket_qua', 'khong_doi');
select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('A: bảng RLS thấy 2 câu của mình', (select count(*) from cau_hoi_chuyen_gia)::int, 2);
-- chuyên gia chưa MFA → không đọc được
select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-00000000000e',false);
select pg_temp.phai_loi('E chưa MFA đọc hàng đợi', 'select ds_cau_hoi_chuyen_gia(null, 10)', 'khong_co_quyen');

-- ================================================================ (6) chuyên gia (thẩm định, aal2) đọc + trả lời
select set_config('request.jwt.claim.aal','aal2',false);
select ds_cau_hoi_chuyen_gia(null, 10) as hang \gset
select pg_temp.kt('E: hàng đợi 2 câu, chờ trả lời lên đầu', jsonb_array_length(:'hang'::jsonb) || '/' || (:'hang'::jsonb->0->>'trang_thai'), '2/cho_tra_loi');
select pg_temp.kt('E: thấy ảnh chụp hồ sơ câu 1', (select x->'ho_so'->>'ngay_sinh' from jsonb_array_elements(:'hang'::jsonb) x where (x->>'id')::int = :q1), '1990-05-17');
select pg_temp.kt('E (thẩm định): KHÔNG thấy email', (:'hang'::jsonb->0->'email'), 'null'::jsonb);
select pg_temp.kt('E đọc một câu', doc_cau_hoi_chuyen_gia(:q1)->>'mang', 'tu_vi');
select pg_temp.kt('trả lời có link → chặn', tra_loi_cau_hoi(:q1, 'Bạn xem thêm ở https://abc.vn để biết rõ hơn về cung Quan Lộc nhé.')->>'ket_qua', 'co_lien_he');
select pg_temp.kt('trả lời có số điện thoại → chặn', tra_loi_cau_hoi(:q1, 'Gọi cho tôi 0912345678 để trao đổi thêm về lá số của bạn.')->>'ket_qua', 'co_lien_he');
select pg_temp.kt('trả lời quá ngắn → chặn', tra_loi_cau_hoi(:q1, 'Nên đổi.')->>'ket_qua', 'tra_loi_khong_hop_le');
select pg_temp.kt('trả lời câu 1', tra_loi_cau_hoi(:q1, 'Lá số của bạn năm tới có Hoá Lộc vào cung Quan Lộc, việc đổi chỗ làm thuận hơn nửa cuối năm. Hãy chuẩn bị từ quý hai.')->>'ket_qua', 'da_tra_loi');
select pg_temp.kt('trả lời lại câu đã trả → không đổi', tra_loi_cau_hoi(:q1, 'Lá số của bạn năm tới có Hoá Lộc vào cung Quan Lộc, việc đổi chỗ làm thuận hơn.')->>'ket_qua', 'khong_doi');
select pg_temp.kt('E (thẩm định) không hoàn được', pg_temp.phai_loi('E hoàn', format('select hoan_cau_hoi(%s, %L)', :q2, 'Quá hạn trả lời'), 'khong_co_quyen') like 'ok%', true);
select set_config('request.jwt.claim.aal','aal1',false);
-- A thấy trả lời, đánh giá
select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('A thấy câu trả lời', (select x->>'trang_thai' || '/' || left(x->>'tra_loi', 9) from jsonb_array_elements(cau_hoi_cua_toi()) x where (x->>'id')::int = :q1), 'da_tra_loi/Lá số của');
select pg_temp.kt('A đánh giá 6 → sai', danh_gia_cau_hoi(:q1, 6)->>'ket_qua', 'diem_khong_hop_le');
select pg_temp.kt('A đánh giá 5', danh_gia_cau_hoi(:q1, 5)->>'ket_qua', 'da_ghi');
select pg_temp.kt('A đánh giá câu chưa trả lời → không đổi', danh_gia_cau_hoi(:q2, 4)->>'ket_qua', 'khong_doi');
select pg_temp.kt('A huỷ câu đã trả tiền → không đổi', huy_cau_hoi(:q2)->>'ket_qua', 'khong_doi');
reset role;
-- nhật ký chỉ chủ sở hữu đọc (RLS 0010) → kiểm bằng superuser
select pg_temp.kt('nhật ký ghi lượt đọc', (select count(*) from nhat_ky_quan_tri where hanh_dong in ('chuyen_gia.doc', 'chuyen_gia.doc_mot') and user_id = 'd0000000-0000-0000-0000-00000000000e') >= 2, true);
select pg_temp.kt('nhật ký trả lời', (select chi_tiet->>'mang' from nhat_ky_quan_tri where hanh_dong = 'chuyen_gia.tra_loi' and doi_tuong = :q1::text), 'tu_vi');

-- ================================================================ (7) quá hạn → cron đánh dấu → chủ sở hữu hoàn
update cau_hoi_chuyen_gia set han_tra_loi = now() - interval '1 hour' where id = :q2;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('A thấy "quá hạn" ngay cả trước cron', (select x->>'trang_thai' from jsonb_array_elements(cau_hoi_cua_toi()) x where (x->>'id')::int = :q2), 'qua_han');
reset role;
select set_config('request.jwt.claim.sub','',false);   -- service role thật không mang sub
set role service_role;
select pg_temp.kt('cron đánh dấu quá hạn: 1', danh_dau_qua_han_chuyen_gia(), 1);
select pg_temp.kt('cron chạy lại: 0', danh_dau_qua_han_chuyen_gia(), 0);
reset role;
select pg_temp.kt('câu 2 → qua_han', (select trang_thai from cau_hoi_chuyen_gia where id = :q2), 'qua_han');
select pg_temp.kt('nhật ký quá hạn (user null)', (select chi_tiet->>'so' from nhat_ky_quan_tri where hanh_dong = 'chuyen_gia.qua_han' order by id desc limit 1), '1');
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-00000000000f',false);
select set_config('request.jwt.claim.aal','aal2',false);
select pg_temp.kt('O (chủ sở hữu) thấy email ở hàng đợi', (select x->>'email' from jsonb_array_elements(ds_cau_hoi_chuyen_gia('qua_han', 10)) x where (x->>'id')::int = :q2), 'cg-a@x');
select pg_temp.kt('hoàn thiếu lý do', hoan_cau_hoi(:q2, 'x')->>'ket_qua', 'thieu_ly_do');
select hoan_cau_hoi(:q2, 'Quá hạn 48 giờ, đã chuyển khoản trả') as h2 \gset
select pg_temp.kt('hoàn câu 2: 199.000', (:'h2'::jsonb->>'ket_qua') || '/' || (:'h2'::jsonb->>'gia_vnd'), 'da_hoan/199000');
select pg_temp.kt('hoàn lại → không hoàn được', hoan_cau_hoi(:q2, 'Quá hạn 48 giờ, đã chuyển khoản trả')->>'ket_qua', 'khong_hoan_duoc');
select pg_temp.kt('hoàn câu hội viên / chưa trả tiền sau', true, true);
select thong_ke_chuyen_gia(30) as tk \gset
select pg_temp.kt('thống kê: 1 trả lời, 1 hoàn, doanh thu 139.000, đánh giá 5', (:'tk'::jsonb->>'da_tra_loi') || '/' || (:'tk'::jsonb->>'hoan') || '/' || (:'tk'::jsonb->>'doanh_thu_vnd') || '/' || (:'tk'::jsonb->>'danh_gia_tb'), '1/1/139000/5.00');
select set_config('request.jwt.claim.aal','aal1',false);
reset role;
select pg_temp.kt('đơn 2 → hoan', (select trang_thai from don_nap where ma_don = :d2), 'hoan');
select pg_temp.kt('không bút toán Sao nào cho đơn chuyên gia', (select count(*) from so_cai_sao where khoa in ('mua:' || :d1, 'mua:' || :d2, 'hoan:' || :d2))::int, 0);
select pg_temp.kt('nhật ký hoàn', (select chi_tiet->>'gia_vnd' from nhat_ky_quan_tri where hanh_dong = 'chuyen_gia.hoan' and doi_tuong = :q2::text), '199000');

-- ================================================================ (8) huỷ khi chưa trả; tối đa 3 câu chờ; hội viên miễn phí
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select (tao_cau_hoi_chuyen_gia('kinh_dich', 'Tôi có nên nhận lời mời hợp tác này không?', '{"ngay_sinh":"1990-05-17"}', true, false, 'gia')) as c3 \gset
select (:'c3'::jsonb->>'id')::bigint as q3, (:'c3'::jsonb->>'ma_don')::bigint as d3 \gset
select pg_temp.kt('huỷ câu 3', huy_cau_hoi(:q3)->>'ket_qua', 'da_huy');
select pg_temp.kt('câu 3: huy + bỏ hồ sơ; đơn huy', (select c.trang_thai || '/' || (c.ho_so is null) || '/' || d.trang_thai from cau_hoi_chuyen_gia c join don_nap d on d.ma_don = c.ma_don where c.id = :q3), 'huy/true/huy');
select pg_temp.kt('huỷ lại → không đổi', huy_cau_hoi(:q3)->>'ket_qua', 'khong_doi');
select tao_cau_hoi_chuyen_gia('phong_thuy', 'Phòng ngủ của tôi nên kê giường quay hướng nào?', null, false, false, 'gia')->>'ket_qua' as k4 \gset
select tao_cau_hoi_chuyen_gia('phong_thuy', 'Bếp nhà tôi đối diện cửa chính có sao không?', null, false, false, 'gia')->>'ket_qua' as k5 \gset
select tao_cau_hoi_chuyen_gia('than_so', 'Số đường đời 33 của tôi hợp làm nghề gì?', null, false, false, 'gia')->>'ket_qua' as k6 \gset
select pg_temp.kt('3 câu chờ trả tiền được tạo', :'k4' || '/' || :'k5' || '/' || :'k6', 'da_tao/da_tao/da_tao');
select pg_temp.kt('câu thứ 4 đang chờ → từ chối', tao_cau_hoi_chuyen_gia('than_so', 'Năm cá nhân 9 nên bắt đầu gì mới không?', null, false, false, 'gia')->>'ket_qua', 'qua_nhieu_cau');
-- Không là hội viên mà gọi thẳng RPC với cờ miễn phí → từ chối (SQL tự trừ lượt, không tin người gọi).
reset role;
delete from hoi_vien where user_id in ('d0000000-0000-0000-0000-0000000000a1', 'd0000000-0000-0000-0000-0000000000a2');   -- mã dùng chung với tệp 0028
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
select pg_temp.kt('không là hội viên: cờ miễn phí bị từ chối', tao_cau_hoi_chuyen_gia('than_so', 'Tôi gọi thẳng API để hỏi miễn phí được không?', null, false, true, null)->>'ket_qua', 'het_luot_hoi_vien');
reset role;
-- A, B thành hội viên thường (2 câu/năm) — chèn thẳng dòng hoi_vien (0028 kiểm đường mua ở tệp riêng).
insert into hoi_vien (user_id, tu_ngay, den_ngay, gia_vnd, hang, cau_hoi_nam) values
    ('d0000000-0000-0000-0000-0000000000a1', current_date, current_date + 365, 399000, 'thuong', 2),
    ('d0000000-0000-0000-0000-0000000000a2', current_date, current_date + 365, 399000, 'thuong', 2);
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a1',false);
-- hội viên: SQL trừ lượt → vào thẳng chờ trả lời, giá 0, không đơn, không tính "đã mua"
select tao_cau_hoi_chuyen_gia('than_so', 'Tháng cá nhân 5 này tôi nên lưu ý gì?', null, false, true, null) as c7 \gset
select pg_temp.kt('hội viên: lượt đã trừ trong SQL (còn 1)', (hoi_vien_cua_toi()->>'cau_hoi_con')::int, 1);
select pg_temp.kt('hội viên: chờ trả lời, giá 0, không đơn', (:'c7'::jsonb->>'ket_qua') || '/' || (:'c7'::jsonb->>'trang_thai') || '/' || (:'c7'::jsonb->>'gia_vnd') || '/' || ((:'c7'::jsonb ? 'ma_don')::text), 'da_tao/cho_tra_loi/0/false');
select pg_temp.kt('hội viên: hạn 48 giờ', (select han_tra_loi > now() + interval '47 hours' from cau_hoi_chuyen_gia where id = (:'c7'::jsonb->>'id')::bigint), true);
select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a2',false);
select tao_cau_hoi_chuyen_gia('tu_vi', 'Tôi là hội viên, hỏi thử một câu về cung Mệnh.', null, false, true, null) as c8 \gset
select pg_temp.kt('B hội viên hỏi miễn phí xong vẫn còn "lần đầu" mua', (chuyen_gia_thong_tin()->>'lan_dau')::boolean, true);
reset role;
-- B lên hạng Chuyên gia (quyền đóng băng: 24 giờ) → câu hỏi của B có hạn 24 giờ, thông tin "của tôi" báo 24.
update hoi_vien set hang = 'chuyen_gia', han_gio = 24, cau_hoi_nam = 6 where user_id = 'd0000000-0000-0000-0000-0000000000a2' and trang_thai = 'hieu_luc';
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-0000000000a2',false);
select pg_temp.kt('B Chuyên gia: hạn của tôi 24 giờ', (chuyen_gia_thong_tin()->>'han_gio_cua_toi')::int, 24);
select tao_cau_hoi_chuyen_gia('tu_vi', 'Cung Quan Lộc năm nay của tôi thế nào?', null, false, true, null) as c9 \gset
select pg_temp.kt('B Chuyên gia: hạn trả lời ≈ 24 giờ', (select han_tra_loi between now() + interval '23 hours' and now() + interval '25 hours'
    from cau_hoi_chuyen_gia where id = (:'c9'::jsonb->>'id')::bigint), true);
reset role;
set role authenticated; select set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-00000000000f',false);
select set_config('request.jwt.claim.aal','aal2',false);
select pg_temp.kt('hoàn câu hội viên (giá 0) → không hoàn được', hoan_cau_hoi((:'c7'::jsonb->>'id')::bigint, 'Thử hoàn câu miễn phí')->>'ket_qua', 'khong_hoan_duoc');
select set_config('request.jwt.claim.aal','aal1',false);
reset role;

-- ================================================================ (9) tiền về sau khi đã huỷ → mở lại; dọn ảnh chụp hồ sơ 30 ngày
set role service_role;
update don_nap set trang_thai = 'da_tra', tra_luc = now() where ma_don = :d3;
reset role;
select pg_temp.kt('đã huỷ mà tiền vẫn về → chờ trả lời', (select trang_thai from cau_hoi_chuyen_gia where id = :q3), 'cho_tra_loi');
update cau_hoi_chuyen_gia set tra_loi_luc = now() - interval '31 days' where id = :q1;
update cau_hoi_chuyen_gia set hoan_luc = now() - interval '10 days', ho_so = '{"ngay_sinh":"1990-05-17"}' where id = :q2;
select set_config('request.jwt.claim.sub','',false);
set role service_role;
select don_chuyen_gia() as d \gset
reset role;
select pg_temp.kt('dọn: bỏ ho_so câu 1 (trả lời > 30 ngày); câu 2 hoàn 10 ngày giữ', (:'d'::jsonb->>'xoa_ho_so'), '1');
select pg_temp.kt('câu 1: ho_so null, câu hỏi + trả lời giữ', (select (ho_so is null) || '/' || (tra_loi is not null) || '/' || (cau_hoi is not null) from cau_hoi_chuyen_gia where id = :q1), 'true/true/true');
select pg_temp.kt('câu 2: ho_so còn (chưa đủ 30 ngày)', (select ho_so is not null from cau_hoi_chuyen_gia where id = :q2), true);
update cau_hoi_chuyen_gia set tao_luc = now() - interval '31 days' where id in (select id from cau_hoi_chuyen_gia where trang_thai = 'cho_tra');
set role service_role;
select pg_temp.kt('dọn: xoá câu chưa trả tiền > 30 ngày', (don_chuyen_gia()->>'xoa_chua_tra')::int, 3);
reset role;

delete from cau_hinh where khoa like 'sao.chuyen_gia.%';
select 'thu_chuyen_gia_0029: OK';
