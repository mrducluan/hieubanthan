-- 0042 LX-2027: Lì xì Tết 2027 — tạo đơn → trả tiền → nhận → dùng cho MỘT hồ sơ → hoàn. Mỗi dòng "kt" SAI là lỗi.
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(p_ten text, p_co anyelement, p_can anyelement) returns text language plpgsql as $$
begin
    if p_co is distinct from p_can then raise exception 'SAI % — có %, cần %', p_ten, p_co, p_can; end if;
    return 'ok ' || p_ten;
end $$;

insert into auth.users (id, email) values
    ('e0000000-0000-0000-0000-0000000000a1', 'lx-tang@x'),
    ('e0000000-0000-0000-0000-0000000000a2', 'lx-nhan@x'),
    ('e0000000-0000-0000-0000-0000000000a3', 'lx-khac@x')
on conflict do nothing;
insert into cau_hinh (khoa, gia_tri) values ('sao.li_xi.bat', 'false') on conflict (khoa) do update set gia_tri = excluded.gia_tri;

-- Quyền: bảng không đọc thẳng được; hoàn tiền không cấp cho tài khoản web.
select pg_temp.kt('bảng không có policy (chỉ qua hàm)', (select count(*) from pg_policies where tablename = 'li_xi_tet')::int, 0);
select pg_temp.kt('anon không gọi được nhận bao', has_function_privilege('anon', 'nhan_li_xi_tet(text)', 'execute'), false);
select pg_temp.kt('authenticated không gọi được hoàn', has_function_privilege('authenticated', 'hoan_don_li_xi(bigint,text)', 'execute'), false);

-- Bộ lọc chữ (giống web/lib/li-xi-tet.ts chuBiChan)
select pg_temp.kt('chặn số điện thoại', lx_chu_bi_chan('Gọi 0912 345 678 nhé'), true);
select pg_temp.kt('chặn số liền', lx_chu_bi_chan('Zl 0912345678'), true);
select pg_temp.kt('chặn link không http', lx_chu_bi_chan('vào hieuban-qua.top nhận quà'), true);
select pg_temp.kt('chặn chữ ngân hàng', lx_chu_bi_chan('Vui lòng chuyển khoản phí'), true);
select pg_temp.kt('chặn stk', lx_chu_bi_chan('stk của em'), true);
select pg_temp.kt('cho lời chúc thường', lx_chu_bi_chan('Chúc bạn năm Đinh Mùi 2027 vạn sự hanh thông, sức khoẻ dồi dào.'), false);
select pg_temp.kt('cho tên thường', lx_chu_bi_chan('Anh Minh & gia đình'), false);

-- (1) công tắc tắt → không tạo đơn
set role authenticated; select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000a1', false);
select pg_temp.kt('tắt: chưa mở', tao_don_li_xi('gia', 3)->>'ket_qua', 'chua_mo');
reset role;
insert into cau_hinh (khoa, gia_tri) values ('sao.li_xi.bat', 'true') on conflict (khoa) do update set gia_tri = excluded.gia_tri;

-- (2) bật: lọc chữ, tạo đơn đúng giá, đúng cột so_tien
set role authenticated; select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000a1', false);
select pg_temp.kt('tên có số bị chặn', tao_don_li_xi('gia', 1, 'do_son', 'Bank 0912', null)->>'ket_qua', 'ten_khong_hop_le');
select pg_temp.kt('lời chúc có SĐT bị chặn', tao_don_li_xi('gia', 1, 'do_son', 'Anh Minh', 'Gọi 0912345678')->>'ket_qua', 'loi_chuc_khong_hop_le');
select pg_temp.kt('gói lạ bị chặn', tao_don_li_xi('gia', 2)->>'ket_qua', 'goi_khong_hop_le');
select tao_don_li_xi('gia', 3, 'mai_vang', 'Anh Minh', 'Chúc năm mới bình an') as t \gset
select pg_temp.kt('tạo đơn 3 bao', :'t'::jsonb->>'ket_qua', 'da_tao');
select pg_temp.kt('giá 3 bao 249.000', (:'t'::jsonb->>'so_tien')::int, 249000);
select pg_temp.kt('3 mã 16 hex', jsonb_array_length(:'t'::jsonb->'ma_ds'), 3);
select (:'t'::jsonb->>'ma_don')::bigint as don, :'t'::jsonb->'ma_ds'->>0 as m1, :'t'::jsonb->'ma_ds'->>1 as m2 \gset
select pg_temp.kt('mã đúng dạng', :'m1' ~ '^[a-f0-9]{16}$', true);
select pg_temp.kt('chưa trả: không xem được', (xem_li_xi_tet(:'m1')->>'co')::boolean, false);
select pg_temp.kt('danh sách hiện bao chờ trả', jsonb_array_length(ds_li_xi_cua_toi()->'da_tang'), 3);
reset role;
select pg_temp.kt('đơn ghi đúng tiền', (select so_tien || '/' || loai || '/' || sao from don_nap where ma_don = :don), '249000/li_xi/0');

-- (3) cổng báo đã trả (đường thật: nap_sao_tu_cong) → bao sẵn sàng; gọi lại không đổi gì
set role service_role;
select pg_temp.kt('trả đúng tiền', nap_sao_tu_cong(:don, 249000, 'gia', 'LX1')->>'ket_qua', 'da_nap');
select pg_temp.kt('báo lại lần hai idempotent', nap_sao_tu_cong(:don, 249000, 'gia', 'LX1')->>'ket_qua', 'da_xu_ly');
reset role;
select pg_temp.kt('3 bao sẵn sàng', (select count(*) from li_xi_tet where ma_don = :don and trang_thai = 'san_sang')::int, 3);
select pg_temp.kt('không cộng Sao', (select count(*) from so_cai_sao where user_id = 'e0000000-0000-0000-0000-0000000000a1')::int, 0);

-- (4) người nhận nhận bao; người khác không nhận lại được
set role authenticated; select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000a2', false);
select pg_temp.kt('đã trả: xem được', (xem_li_xi_tet(:'m1')->>'co')::boolean, true);
select pg_temp.kt('xem không lộ người mua', xem_li_xi_tet(:'m1') ? 'nguoi_tang_id', false);
select pg_temp.kt('nhận bao 1', nhan_li_xi_tet(:'m1')->>'ket_qua', 'da_nhan');
select pg_temp.kt('nhận lại bao 1', nhan_li_xi_tet(:'m1')->>'ket_qua', 'da_nhan_boi_ban');
select pg_temp.kt('nhận bao 2', nhan_li_xi_tet(:'m2')->>'ket_qua', 'da_nhan');
select pg_temp.kt('còn 2 bao chưa dùng', (li_xi_trang_thai('lx:' || repeat('a', 40), 2027)->>'con')::int, 2);
select pg_temp.kt('năm khác: 0 bao', (li_xi_trang_thai('lx:' || repeat('a', 40), 2028)->>'con')::int, 0);
-- (5) dùng cho hồ sơ A: tốn 1 bao; mở lại A không tốn thêm; hồ sơ B tốn bao thứ 2; hồ sơ C hết bao
select pg_temp.kt('khoá sai dạng', li_xi_dung('abc', 2027)->>'ket_qua', 'khoa_khong_hop_le');
select pg_temp.kt('hồ sơ A dùng bao', li_xi_dung('lx:' || repeat('a', 40), 2027)->>'ket_qua', 'da_dung');
select pg_temp.kt('hồ sơ A mở lại', li_xi_dung('lx:' || repeat('a', 40), 2027)->>'ket_qua', 'da_gan');
select pg_temp.kt('A đã gắn', (li_xi_trang_thai('lx:' || repeat('a', 40), 2027)->>'da_gan')::boolean, true);
select pg_temp.kt('năm 2028 không dùng bao 2027', li_xi_dung('lx:' || repeat('a', 40), 2028)->>'ket_qua', 'khong_con');
select pg_temp.kt('hồ sơ B dùng bao 2', li_xi_dung('lx:' || repeat('b', 40), 2027)->>'ket_qua', 'da_dung');
select pg_temp.kt('hồ sơ C hết bao', li_xi_dung('lx:' || repeat('c', 40), 2027)->>'ket_qua', 'khong_con');
reset role;
set role authenticated; select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000a3', false);
select pg_temp.kt('người khác: bao đã có người nhận', nhan_li_xi_tet(:'m1')->>'ket_qua', 'da_co_nguoi_nhan');
select pg_temp.kt('người khác không mượn được quyền A', (li_xi_trang_thai('lx:' || repeat('a', 40), 2027)->>'da_gan')::boolean, false);
reset role;

-- (6) hoàn tiền: đơn đã có bao được nhận → không hoàn; đơn mới chưa ai nhận → hoàn, bao chuyển 'hoan'
select pg_temp.kt('đơn có bao đã nhận không hoàn', hoan_don_li_xi(:don, 'Khách đổi ý')->>'ket_qua', 'da_co_bao_duoc_nhan');
set role authenticated; select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000a1', false);
select tao_don_li_xi('gia', 1) as t2 \gset
reset role;
select (:'t2'::jsonb->>'ma_don')::bigint as don2 \gset
select pg_temp.kt('đơn chưa trả không hoàn', hoan_don_li_xi(:don2, 'Khách đổi ý')->>'ket_qua', 'khong_hoan_duoc');
set role service_role; select nap_sao_tu_cong(:don2, 99000, 'gia', 'LX2'); reset role;
select pg_temp.kt('hoàn đơn chưa ai nhận', hoan_don_li_xi(:don2, 'Khách đổi ý')->>'ket_qua', 'da_hoan');
select pg_temp.kt('bao của đơn hoàn = hoan', (select trang_thai from li_xi_tet where ma_don = :don2), 'hoan');

-- (7) trần 5 đơn chờ
set role authenticated; select set_config('request.jwt.claim.sub', 'e0000000-0000-0000-0000-0000000000a3', false);
select tao_don_li_xi('gia', 1) from generate_series(1, 5);
select pg_temp.kt('đơn chờ thứ 6 bị chặn', tao_don_li_xi('gia', 1)->>'ket_qua', 'qua_nhieu_don');
reset role;
select 'li_xi 0042: ok';
