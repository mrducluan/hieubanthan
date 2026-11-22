-- CRO-1 (2026-11-22, chủ dự án duyệt gói 59.000 ₫): gói "Lần đầu" 'lan_dau' — 59.000 ₫ / 59 Sao, MỖI TÀI KHOẢN MỘT LẦN.
-- Vì sao: ưu đãi báo cáo 69 Sao (99 −30 %) nhưng gói nhỏ nhất 99.000 ₫ → khách vẫn trả đủ 99.000 ₫, mức giảm không thành tiền
-- thật. 59 Sao + 10 Sao chào mừng = đúng 69 Sao. Sao vẫn là credit nội bộ: không đổi ra tiền, không chuyển nhượng.
--   · Gói được BÁN khi công tắc cau_hinh 'sao.goi_lan_dau.bat' bật (mặc định TẮT, bật ở /quan-tri/cai-dat) VÀ người gọi
--     chưa từng có đơn 'da_tra' / 'hoan' (cùng điều kiện "lần đầu" của nap_dau_thong_tin 0027). Khách chưa đăng nhập: gói
--     hiện trong danh sách (để biết có ưu đãi) — tạo đơn luôn cần đăng nhập nên điều kiện vẫn được kiểm lúc tạo đơn.
--   · Kiểm qua goi_sao_dang_ban() — một nguồn cho danh sách gói VÀ tao_don_nap (0027/0037 không cần sửa).
--   · goi_lan_dau_duoc_mua(): web hỏi "tài khoản này còn mua được gói Lần đầu không" (chỉ của chính mình).
-- Chạy SAU 0039. Rollback: 0040_goi_lan_dau.down.sql

insert into goi_sao (ma, ten, gia_vnd, sao, nhan, mo_ta, bat, thu_tu) values
    ('lan_dau', 'Lần đầu', 59000, 59, 'Lần đầu', 'Chỉ lần nạp đầu của mỗi tài khoản', false, 1)
on conflict (ma) do nothing;

create or replace function goi_lan_dau_duoc_mua() returns boolean
    language sql stable security definer set search_path = '' as $$
    select public.qt_bat_cau_hinh('sao.goi_lan_dau.bat')
       and ((select auth.uid()) is null
            or not exists (select 1 from public.don_nap
                           where user_id = (select auth.uid()) and trang_thai in ('da_tra', 'hoan')))
$$;

-- Thay bản 0027: thêm nhánh 'lan_dau'. Phần còn lại giữ nguyên.
create or replace function goi_sao_dang_ban() returns setof public.goi_sao
    language sql stable security definer set search_path = '' as $$
    select * from public.goi_sao g
    where (g.bat and g.ma <> 'lan_dau')
       or (g.ma = 'khoi_dau' and public.qt_bat_cau_hinh('sao.goi_khoi_dau.bat'))
       or (g.ma = 'lan_dau' and public.goi_lan_dau_duoc_mua())
    order by g.thu_tu, g.ma
$$;

insert into cau_hinh (khoa, gia_tri, mo_ta) values
    ('sao.goi_lan_dau.bat', 'false', 'CRO-1: bán gói Lần đầu 59.000 ₫ / 59 Sao (mỗi tài khoản một lần)')
on conflict (khoa) do nothing;

revoke all on function goi_lan_dau_duoc_mua() from public, anon, authenticated;
grant execute on function goi_lan_dau_duoc_mua() to anon, authenticated;
