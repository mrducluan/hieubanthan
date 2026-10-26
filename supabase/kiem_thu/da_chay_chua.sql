-- Kiểm tra migration nào ĐÃ chạy trên Supabase. Dán cả file vào Supabase → SQL Editor → Run.
-- Chỉ ĐỌC, không sửa gì. Cột da_chay = true là đã chạy; false là chưa (chạy file đó theo thứ tự số).
select * from (values
  ('0001 KB thần số gốc',          to_regclass('public.thanso_so_meanings') is not null),
  ('0002 KB thần số chiều sâu',    to_regclass('public.thanso_dinh_cao') is not null),
  ('0003 KB thần số v2',           to_regclass('public.thanso_kb_khoi') is not null),
  ('0004 nhật ký hỏi thần số',     to_regclass('public.thanso_hoi_nhat_ky') is not null),
  ('0005 nhật ký hỏi huyền học',   to_regclass('public.huyenhoc_hoi_nhat_ky') is not null),
  ('0006 hồ sơ tài khoản',         to_regclass('public.ho_so') is not null),
  ('0007 nơi sinh trong hồ sơ',    exists (select 1 from information_schema.columns
                                           where table_schema = 'public' and table_name = 'ho_so'
                                             and column_name = 'noi_sinh')),
  ('0008 ví Sao + mời bạn',        to_regclass('public.so_cai_sao') is not null),
  ('0009 chân dung + quan hệ',     case when to_regclass('public.thanso_kb_khoi') is null then false
                                   else (xpath('/row/c/text()', query_to_xml(
                                     'select count(*) as c from public.thanso_kb_khoi where khoi = ''chan_dung''',
                                     false, true, '')))[1]::text::int > 0 end),
  ('0010 quản trị',                to_regclass('public.vai_tro_quan_tri') is not null),
  ('0011 quản trị 2 (cài đặt)',    to_regprocedure('public.dat_cau_hinh(text,jsonb,text)') is not null),
  ('0012 thanh toán nạp Sao',      to_regclass('public.don_nap') is not null),
  ('0013 hạn mức hỏi (SAO-2)',     to_regclass('public.luot_hoi') is not null),
  ('0014 nhiệm vụ kiếm Sao',       to_regclass('public.nhiem_vu_sao') is not null),
  ('0015 hồ sơ "Không biết giờ"',  exists (select 1 from pg_constraint where conname = 'ho_so_do_tin_gio_check'
                                             and pg_get_constraintdef(oid) like '%unknown%')),
  ('0016 tầng HỌC thần số (TS-V3)', to_regclass('public.thanso_phan_hoi') is not null),
  ('0017 tầng HỌC Tử vi (LG-ĐS)',  to_regclass('public.cau_hoi_vec') is not null),
  ('0018 hồ sơ nhà + nhắc việc',   to_regclass('public.nhac_viec') is not null),
  ('0019 Web Push (thiết bị nhắc)', to_regclass('public.push_dang_ky') is not null),
  ('0020 Web Push (sáng nay, mốc lịch)', to_regclass('public.push_tuy_chon') is not null),
  ('0021 kiểm chứng 2 người',      exists (select 1 from pg_constraint where conname = 'kiem_chung_phieu_loai_check'
                                             and pg_get_constraintdef(oid) like '%hai_nguoi%')),
  ('0022 phiếu sau 30 ngày + đề xuất luật', to_regclass('public.de_xuat_luat') is not null),
  ('0023 SEC-2 RLS bảng KB + siết quyền', exists (select 1 from pg_constraint where conname = 'ky_uc_chi_ma')),
  ('0024 SEC-2 hoàn Sao + mốc ghi chú', to_regprocedure('public.hoan_sao_hoi(uuid,text)') is not null),
  ('0025 Sao viral: số dư theo lô, hoa hồng, chuỗi ngày, tặng chương', to_regclass('public.hoa_hong') is not null),
  ('0026 chống gian lận lời mời', to_regclass('public.gian_lan_co') is not null),
  ('0027 gói khởi đầu + tặng lần nạp đầu', to_regprocedure('public.nap_dau_thong_tin()') is not null),
  ('0028 hội viên năm',             to_regclass('public.hoi_vien') is not null),
  ('0030 ngày nghỉ chuỗi + huy hiệu',  to_regprocedure('public.huy_hieu_cua_toi()') is not null)
) as t(migration, da_chay)
order by 1;
