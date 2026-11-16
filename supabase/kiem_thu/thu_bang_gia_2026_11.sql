-- GIA-99: áp bảng giá → kiểm → hoàn tác → kiểm. Chạy CUỐI chay.sh (sau mọi test dùng gói cũ).
\set ON_ERROR_STOP 1
create or replace function pg_temp.kt(ten text, co anyelement, mong anyelement) returns text language plpgsql as $$
begin
    if co is distinct from mong then raise exception 'SAI: % — có %, mong %', ten, co, mong; end if;
    return 'ok ' || ten;
end $$;
\i bang-gia/2026-11_gia_99.sql
\i bang-gia/2026-11_gia_99.sql
select pg_temp.kt('4 gói đang bán', (select string_agg(ma, ',' order by thu_tu) from goi_sao_dang_ban()), 'le_1,doi_2,ba_3,ca_nha');
select pg_temp.kt('gói lẻ đúng 1 báo cáo', (select gia_vnd || '/' || sao from goi_sao where ma = 'le_1'), '99000/99');
select pg_temp.kt('chỉ một gói có nhãn (gói đích)', (select string_agg(ma, ',') from goi_sao_dang_ban() where nhan is not null), 'ba_3');
-- Chim mồi phải là số thật: gói Ba rẻ hơn mỗi Sao so với gói Hai, gói Hai không đắt hơn 2 gói lẻ.
select pg_temp.kt('Ba rẻ hơn Hai mỗi Sao', (select (select gia_vnd::numeric / sao from goi_sao where ma = 'ba_3') < (select gia_vnd::numeric / sao from goi_sao where ma = 'doi_2')), true);
select pg_temp.kt('Hai không đắt hơn mỗi Sao so với gói lẻ', (select (select gia_vnd::numeric / sao from goi_sao where ma = 'doi_2') <= (select gia_vnd::numeric / sao from goi_sao where ma = 'le_1')), true);
select pg_temp.kt('đơn giá không tăng theo cỡ gói', (select bool_and(dg <= truoc) from (select gia_vnd::numeric / sao dg, lag(gia_vnd::numeric / sao) over (order by gia_vnd) truoc from goi_sao_dang_ban()) x where truoc is not null), true);
select pg_temp.kt('gói cũ ngừng bán', (select count(*)::int from goi_sao_dang_ban() where ma in ('thu', 'pho_bien', 'gia_dinh', 'khoi_dau')), 0);
select pg_temp.kt('thu Sao bật', qt_bat_cau_hinh('luan_giai.thu_sao'), true);
select pg_temp.kt('giá hội viên SQL đọc', qt_so_cau_hinh('sao.hoi_vien.gia_vnd', 399000, 100000, 50000000), 599000);
select pg_temp.kt('giá chuyên gia SQL đọc', qt_so_cau_hinh('sao.chuyen_gia.gia_vnd', 199000, 20000, 5000000), 299000);
select pg_temp.kt('thưởng mời SQL đọc', sao_muc('moi_ban') || '/' || sao_muc('duoc_moi') || '/' || sao_muc('chao_mung'), '33/33/10');
select pg_temp.kt('khoá cấu hình công khai đọc được', (cau_hinh_cong_khai() ->> 'luan_giai.gia_sao'), '99');
\i bang-gia/2026-11_gia_99.down.sql
\i bang-gia/2026-11_gia_99.down.sql
select pg_temp.kt('hoàn tác: gói cũ bán lại', (select string_agg(ma, ',' order by thu_tu) from goi_sao_dang_ban()), 'thu,pho_bien,gia_dinh');
select pg_temp.kt('hoàn tác: thu Sao tắt', qt_bat_cau_hinh('luan_giai.thu_sao'), false);
select pg_temp.kt('hoàn tác: thưởng mời về mặc định', sao_muc('moi_ban'), 20);
