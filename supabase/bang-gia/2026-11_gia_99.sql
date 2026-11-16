-- GIA-99 (chủ dự án chốt 16/11/2026, docs/GOI-XEM-VA-GIA-2026-11.md) — BẢNG GIÁ MỚI + BẬT THU SAO.
-- Đây là DỮ LIỆU VẬN HÀNH (dòng goi_sao + cau_hinh), không đổi schema, không đổi hàm → không phải migration đánh số.
-- Chạy MỘT lần ở Supabase → SQL Editor, SAU các migration tới 0037. Chạy lại không sao (idempotent).
-- Hoàn tác: supabase/bang-gia/2026-11_gia_99.down.sql
--
--   Luận giải toàn bộ      29 → 99 Sao (Bản đồ con số 49 Sao — báo cáo ngắn, cửa vào)
--   Câu hỏi vượt lượt       3 → 5 Sao
--   Gói nạp (1 Sao ≈ 1.000 ₫ ở gói lẻ; chim mồi: gói Hai lần đứng cạnh gói Ba lần):
--       Một lần xem  99.000 ₫ /  99 Sao   (1 báo cáo)
--       Hai lần xem 199.000 ₫ / 200 Sao   (2 báo cáo — mồi)
--       Ba lần xem  249.000 ₫ / 300 Sao   (3 báo cáo — đích, nhãn "Phổ biến")
--       Cả nhà      499.000 ₫ / 620 Sao   (6 báo cáo — mồi cho hội viên)
--   Hội viên năm          399.000 → 599.000 ₫ (hạng Chuyên gia giữ 1.990.000 ₫)
--   Hỏi chuyên gia        199.000 → 299.000 ₫ / câu
--   Thưởng mời             20/20 → 33/33 Sao (mời 3 bạn = 1 báo cáo); chào mừng giữ 10
--   Tặng lần nạp đầu       BẬT, 20 % số Sao của gói (Sao tặng, hạn 365 ngày — hàm 0027)
--   Thu Sao Luận giải      BẬT (web chỉ khoá báo cáo khi cổng nạp đã sẵn sàng — chưa có khoá Pay2S thì vẫn miễn phí)
begin;

-- Gói cũ (cân theo giá 29 Sao) ngừng bán; đơn cũ vẫn giữ nguyên (don_nap ghi số tiền + số Sao của chính đơn).
update public.goi_sao set bat = false where ma in ('thu', 'pho_bien', 'gia_dinh', 'khoi_dau');

insert into public.goi_sao (ma, ten, gia_vnd, sao, nhan, mo_ta, bat, thu_tu) values
    ('le_1',   'Một lần xem',  99000,  99, null,       'Vừa đủ một Luận giải toàn bộ', true, 11),
    ('doi_2',  'Hai lần xem', 199000, 200, null,       'Của bạn và một người thân', true, 12),
    ('ba_3',   'Ba lần xem',  249000, 300, 'Phổ biến', 'Thêm 50.000 ₫ so với gói Hai lần là có lần xem thứ ba', true, 13),
    ('ca_nha', 'Cả nhà',      499000, 620, null,       'Sáu lần xem, dư Sao để hỏi thêm', true, 14)
on conflict (ma) do update set ten = excluded.ten, gia_vnd = excluded.gia_vnd, sao = excluded.sao, nhan = excluded.nhan,
    mo_ta = excluded.mo_ta, bat = excluded.bat, thu_tu = excluded.thu_tu;

insert into public.cau_hinh (khoa, gia_tri, mo_ta) values
    ('luan_giai.gia_sao',          '99',      'GIA-99'),
    ('luan_giai.gia_sao.thanso',   '49',      'GIA-99'),
    ('sao.hoi.gia',                '5',       'GIA-99'),
    ('sao.hoi_vien.gia_vnd',       '599000',  'GIA-99'),
    ('sao.chuyen_gia.gia_vnd',     '299000',  'GIA-99'),
    ('sao.thuong.moi_ban',         '33',      'GIA-99'),
    ('sao.thuong.duoc_moi',        '33',      'GIA-99'),
    ('sao.goi_khoi_dau.bat',       'false',   'GIA-99'),
    ('sao.nap_dau.bat',            'true',    'GIA-99'),
    ('sao.nap_dau.phan_tram',      '20',      'GIA-99'),
    ('luan_giai.thu_sao',          'true',    'GIA-99: chính thức thu Sao Luận giải toàn bộ')
on conflict (khoa) do update set gia_tri = excluded.gia_tri, mo_ta = excluded.mo_ta, cap_nhat_luc = now();

commit;

-- Kiểm nhanh sau khi chạy:
--   select ma, gia_vnd, sao, nhan from goi_sao_dang_ban();          -- 4 gói: le_1, doi_2, ba_3, ca_nha
--   select khoa, gia_tri from cau_hinh where mo_ta like 'GIA-99%';   -- 11 dòng
-- Muốn giới hạn hỏi đáp miễn phí mỗi ngày (khách 3 / tài khoản 10 câu, vượt thì 5 Sao/câu): bật "Giới hạn hỏi đáp miễn
-- phí mỗi ngày" ở /quan-tri/cai-dat (khoá sao.hoi.thu) — tệp này KHÔNG bật hộ.
