-- Q7 phiếu sau 30 ngày + hàng đợi đề xuất luật (migration 0022). Chạy SAU thu_tuvi_hoc_0017.sql. ASSERT: sai là lỗi → job đỏ.
\set k7 '''ffffffffffffffffffffffffffffffff'''
set role service_role;
select 'phiếu sau ghi được' t, ghi_kiem_chung_sau(:k7, null, 'doi_song', 'ds.phongthuy.tung_phong.luu_y.xa_ngang', 'bat_trach_huyen_khong', 'da_lam', 'tot_hon', 35);
select 'đổi ý → vẫn 1 phiếu' t, ghi_kiem_chung_sau(:k7, null, 'doi_song', 'ds.phongthuy.tung_phong.luu_y.xa_ngang', 'bat_trach_huyen_khong', 'mot_phan', 'nhu_cu', 40);
do $$
begin
    assert (select count(*) from public.kiem_chung_sau) = 1, 'cộng dồn';
    assert (select thay_khac from public.kiem_chung_sau) = 'nhu_cu', 'đổi ý';
    -- từ chối: mã sai loại, mức lạ, số ngày < 30, khoá sai
    assert not public.ghi_kiem_chung_sau(repeat('f', 32), null, 'doi_song', 'hn.chi.tam_hop.nguoi_yeu', 'x', 'da_lam', 'tot_hon', 35), 'mã sai loại';
    assert not public.ghi_kiem_chung_sau(repeat('f', 32), null, 'doi_song', 'ds.bt.van_han.a', 'tu_binh', 'xong', 'tot_hon', 35), 'mức lạ';
    assert not public.ghi_kiem_chung_sau(repeat('f', 32), null, 'doi_song', 'ds.bt.van_han.a', 'tu_binh', 'da_lam', 'tot_hon', 10), 'dưới 30 ngày';
    assert not public.ghi_kiem_chung_sau('zz', null, 'doi_song', 'ds.bt.van_han.a', 'tu_binh', 'da_lam', 'tot_hon', 35), 'khoá sai';
end $$;
-- gom đề xuất: ngưỡng thấp để thử (1 phiếu đúng 0%, 1 phiếu sau 100% như cũ)
select 'phiếu chưa đúng' t, ghi_kiem_chung(:k7, null, 'doi_song', 'ds.phongthuy.tung_phong.luu_y.xa_ngang', 'bat_trach_huyen_khong', 'chua_dung');
select 'gom' t, gom_de_xuat_luat(1, 0.5, 1, 0.5);
do $$
begin
    assert (select count(*) from public.de_xuat_luat where ly_do = 'ti_le_thap' and mau = 'ds.phongthuy.tung_phong.luu_y.xa_ngang') = 1, 'gom tỉ lệ thấp';
    assert (select count(*) from public.de_xuat_luat where ly_do = 'sau_30_nhu_cu') = 1, 'gom sau 30';
    assert (select trang_thai from public.de_xuat_luat limit 1) = 'cho_duyet', 'mặc định chờ duyệt';
    -- gom lại không nhân đôi
    perform public.gom_de_xuat_luat(1, 0.5, 1, 0.5);
    assert (select count(*) from public.de_xuat_luat) = 2, 'gom lại trùng';
    -- ngưỡng mặc định (100 phiếu / 30 phiếu sau) → không thêm gì
    perform public.gom_de_xuat_luat();
    assert (select count(*) from public.de_xuat_luat) = 2, 'ngưỡng mặc định';
end $$;
select 'tỉ lệ sau theo mã' t, count(*) from ty_le_kiem_chung_sau(1);
select 'dọn (chưa hết hạn → 0)' t, don_kiem_chung_sau();
reset role;
