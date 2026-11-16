-- Hoàn tác GIA-99: về bảng giá 26/10/2026 (29 Sao/báo cáo, gói 29k/99k/199k) và TẮT thu Sao + tặng nạp đầu.
-- Đơn đã trả theo gói mới vẫn giữ nguyên (Sao đã cộng không đổi). Chạy lại không sao.
begin;
update public.goi_sao set bat = false where ma in ('le_1', 'doi_2', 'ba_3', 'ca_nha');
update public.goi_sao set bat = true  where ma in ('thu', 'pho_bien', 'gia_dinh');   -- khoi_dau vẫn theo công tắc riêng
delete from public.cau_hinh where khoa in (
    'luan_giai.gia_sao.thanso', 'sao.hoi.gia', 'sao.hoi_vien.gia_vnd', 'sao.chuyen_gia.gia_vnd',
    'sao.thuong.moi_ban', 'sao.thuong.duoc_moi', 'sao.goi_khoi_dau.bat', 'sao.nap_dau.bat', 'sao.nap_dau.phan_tram');
-- Mặc định trong mã web nay là 99 / 5 Sao → về giá cũ phải ghi rõ.
insert into public.cau_hinh (khoa, gia_tri, mo_ta) values
    ('luan_giai.gia_sao', '29', 'hoàn tác GIA-99'), ('luan_giai.gia_sao.thanso', '0', 'hoàn tác GIA-99'),
    ('sao.hoi.gia', '3', 'hoàn tác GIA-99'), ('luan_giai.thu_sao', 'false', 'hoàn tác GIA-99')
on conflict (khoa) do update set gia_tri = excluded.gia_tri, mo_ta = excluded.mo_ta, cap_nhat_luc = now();
commit;
