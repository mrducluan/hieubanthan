-- HN-2N kiểm chứng "Xem lá số 2 người" (migration 0019). Chạy SAU thu_tuvi_hoc_0017.sql. Dùng ASSERT: sai là lỗi → job đỏ.
-- Danh mục đầy đủ mã engine sinh được đối chiếu ở engine/tests/test_kiem_chung_ma.py (đọc chính tệp migration).
\set k5 '''eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'''
-- Hàm kiểm mã chỉ gọi được bởi chủ sở hữu / hàm security definer (đã revoke public) → kiểm bằng vai trò chủ.
do $$
begin
    -- hợp lệ: mỗi tiêu chí một mã, mọi quan hệ
    assert public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.menh.tuong_sinh.nguoi_yeu', 'hai_nguoi_1'), 'menh tuong_sinh';
    assert public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.can.tuong_xung.sep', 'hai_nguoi_1'), 'can tuong_xung';
    assert public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.chi.tu_hanh_xung.gia_dinh', 'hai_nguoi_1'), 'chi tu_hanh_xung';
    assert public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.cung_phi.dien_nien.cha_me_con', 'hai_nguoi_1'), 'cung_phi';
    assert public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.tu_vi.can_dung_hoa.doi_tac', 'hai_nguoi_2'), 'tu_vi, phiên bản luật sau';
    -- từ chối: loại chỉ ra "Bình hoà" (không bao giờ là hộp), tiêu chí/quan hệ lạ, năm/số, phái khác, sai số đoạn
    assert not public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.menh.binh_hoa.nguoi_yeu', 'hai_nguoi_1'), 'binh_hoa';
    assert not public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.cung_phi.phuc_vi.nguoi_yeu', 'hai_nguoi_1'), 'phuc_vi';
    assert not public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.chi.trung.nguoi_yeu', 'hai_nguoi_1'), 'chi trung';
    assert not public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.ten.tam_hop.nguoi_yeu', 'hai_nguoi_1'), 'tiêu chí lạ';
    assert not public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.chi.tam_hop.ke_thu', 'hai_nguoi_1'), 'quan hệ lạ';
    assert not public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.chi.tam_hop.1990', 'hai_nguoi_1'), 'năm sinh';
    assert not public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.chi.tam_hop.nguoi_yeu.ty', 'hai_nguoi_1'), 'thêm đoạn';
    assert not public.kiem_chung_ma_hop_le('hai_nguoi', 'hn.chi.tam_hop.nguoi_yeu', 'nam_phai_viet'), 'phái lạ';
    assert not public.kiem_chung_ma_hop_le('hai_nguoi', 'ds.tong_quan.x', 'hai_nguoi_1'), 'mã đời sống';
    assert not public.kiem_chung_ma_hop_le('doi_song', 'hn.chi.tam_hop.nguoi_yeu', 'nam_phai_viet'), 'hn sai loại';
    -- loại cũ giữ nguyên hành vi 0017
    assert public.kiem_chung_ma_hop_le('phi_hoa', 'mau.quan_loc.ky.menh', 'phi_tinh'), 'phi_hoa';
    assert public.kiem_chung_ma_hop_le('nhip_3_thang', 'thuan.ln+sl', 'dau_quan_thai_tue'), 'nhip';
    assert public.kiem_chung_ma_hop_le('doi_song', 'ds.bt.van_han.can.tre', 'tu_binh'), 'doi_song';
    assert not public.kiem_chung_ma_hop_le('doi_song', 'ds.thanso', 'pitago'), 'ds một đoạn';
end $$;
set role service_role;
select 'phiếu hai người ghi được' t, ghi_kiem_chung(:k5, null, 'hai_nguoi', 'hn.chi.tam_hop.nguoi_yeu', 'hai_nguoi_1', 'dung');
select 'đổi ý → vẫn 1 phiếu' t, ghi_kiem_chung(:k5, null, 'hai_nguoi', 'hn.chi.tam_hop.nguoi_yeu', 'hai_nguoi_1', 'chua_dung');
do $$
begin
    assert (select count(*) from public.kiem_chung_phieu where mau = 'hn.chi.tam_hop.nguoi_yeu') = 1, 'cộng dồn';
    assert (select ket_qua from public.kiem_chung_phieu where mau = 'hn.chi.tam_hop.nguoi_yeu') = 'chua_dung', 'đổi ý';
    assert not public.ghi_kiem_chung(repeat('e', 32), null, 'hai_nguoi', 'hn.menh.binh_hoa.nguoi_yeu', 'hai_nguoi_1', 'dung'),
        'ghi mã ngoài danh mục';
end $$;
reset role;
do $$
begin
    assert not has_function_privilege('anon', 'kiem_chung_ma_hop_le(text,text,text)', 'execute'), 'anon gọi hàm kiểm mã';
    assert not has_function_privilege('anon', 'ghi_kiem_chung(text,uuid,text,text,text,text)', 'execute'), 'anon ghi phiếu';
end $$;
select 'kiểm chứng 2 người (0019): OK' t;
