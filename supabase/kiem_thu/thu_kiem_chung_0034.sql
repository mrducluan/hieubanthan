-- Kiểm thử 0034: phiếu kiểm chứng mang ngôn ngữ; gọi 6 tham số vẫn chạy (= 'vi'); đổi ý đổi ngôn ngữ; ngôn ngữ lạ → 'vi';
-- tỉ lệ theo (mã, ngôn ngữ); anon / authenticated không gọi được hàm ghi.
\set k1 '''' `printf 'a%.0s' $(seq 1 40)` ''''
\set k2 '''' `printf 'b%.0s' $(seq 1 40)` ''''
\set k3 '''' `printf 'c%.0s' $(seq 1 40)` ''''
select 'cột ngon_ngu có, mặc định vi' t, (select column_default from information_schema.columns
    where table_schema = 'public' and table_name = 'kiem_chung_phieu' and column_name = 'ngon_ngu') like '%vi%';
select 'gọi 6 tham số vẫn ghi' t, ghi_kiem_chung(:k1, null, 'doi_song', 'ds.giao_thoa.cong_viec.mon.thuan.2', 'giao_thoa_1', 'dung');
select 'phiếu 6 tham số mang vi' t, (select ngon_ngu from kiem_chung_phieu where khoa = :k1 and mau = 'ds.giao_thoa.cong_viec.mon.thuan.2') = 'vi';
select 'ghi phiếu en' t, ghi_kiem_chung(:k2, null, 'doi_song', 'ds.giao_thoa.cong_viec.mon.thuan.2', 'giao_thoa_1', 'chua_dung', 'en');
select 'đổi ý → vẫn 1 phiếu, đổi ngôn ngữ' t, ghi_kiem_chung(:k1, null, 'doi_song', 'ds.giao_thoa.cong_viec.mon.thuan.2', 'giao_thoa_1', 'dung', 'en')
    and (select count(*) from kiem_chung_phieu where mau = 'ds.giao_thoa.cong_viec.mon.thuan.2') = 2
    and (select ngon_ngu from kiem_chung_phieu where khoa = :k1 and mau = 'ds.giao_thoa.cong_viec.mon.thuan.2') = 'en';
select 'ngôn ngữ lạ → vi' t, ghi_kiem_chung(:k3, null, 'doi_song', 'ds.giao_thoa.cong_viec.mon.thuan.2', 'giao_thoa_1', 'dung', 'EN-us; drop')
    and (select ngon_ngu from kiem_chung_phieu where khoa = :k3) = 'vi';
select 'tỉ lệ theo ngôn ngữ' t, (select array_agg(ngon_ngu || ':' || dung || '/' || chua_dung order by ngon_ngu)
    from ty_le_kiem_chung_ngon_ngu(1) where mau = 'ds.giao_thoa.cong_viec.mon.thuan.2') = array['en:1/1', 'vi:1/0'];
select 'tỉ lệ cũ gộp mọi ngôn ngữ' t, (select dung from ty_le_kiem_chung(array['ds.giao_thoa.cong_viec.mon.thuan.2'], 1)) = 2;
do $$
begin
    assert not exists (select 1 from information_schema.routine_privileges
                       where routine_schema = 'public' and routine_name in ('ghi_kiem_chung', 'ty_le_kiem_chung_ngon_ngu')
                         and grantee in ('anon', 'authenticated')), 'anon/authenticated gọi được hàm phiếu';
    assert (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname = 'ghi_kiem_chung') = 1, 'còn hai bản ghi_kiem_chung (mơ hồ)';
end $$;
select 'ràng buộc ngôn ngữ chặn chữ lạ' t, not exists (
    select 1 from pg_constraint where conname = 'kiem_chung_phieu_ngon_ngu_check') is false;
delete from kiem_chung_phieu where khoa in (:k1, :k2, :k3);
