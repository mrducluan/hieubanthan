-- PAY2S-1 (2026-11-12, chủ dự án giao "tích hợp Pay2S thay cho payOS"): cổng thanh toán nạp Sao / hội viên / hỏi chuyên
-- gia chuyển sang Pay2S (Collection Link — chuyển khoản VietQR vào tài khoản ngân hàng của chủ dự án). payOS chưa từng
-- bật (TT-b chưa làm) nên web bỏ hẳn mã payOS; DB vẫn NHẬN 'payos' để không làm hỏng dòng cũ nếu có.
--   · don_nap.cong nhận thêm 'pay2s'.
--   · tao_don_nap (0027) · tao_don_hoi_vien (0028) · tao_cau_hoi_chuyen_gia (0029) nhận p_cong = 'pay2s'.
--     Ba hàm dài nên KHÔNG chép lại thân hàm (dễ lệch bản): lấy định nghĩa đang chạy (pg_get_functiondef) rồi thay đúng
--     một cụm danh sách cổng ('payos', 'gia') → ('payos', 'pay2s', 'gia'). Không thấy cụm đó → báo lỗi (không âm thầm
--     bỏ qua). Đã thay rồi → bỏ qua (chạy lại được). Hàm chưa có (chưa chạy 0028/0029) → bỏ qua kèm NOTICE: chạy lại
--     0037 sau khi chạy migration đó.
--   · nap_sao_tu_cong không đổi: hàm so cổng của đơn với cổng máy chủ báo (web gửi 'pay2s').
-- Không thêm bảng, không thêm quyền. Chạy SAU 0036. Rollback: 0037_cong_pay2s.down.sql
alter table don_nap drop constraint if exists don_nap_cong_check;
alter table don_nap add constraint don_nap_cong_check check (cong in ('payos', 'pay2s', 'gia'));

do $$
declare
    v_ten text;
    v_oid oid;
    v_def text;
    v_cu  constant text := $c$('payos', 'gia')$c$;
    v_moi constant text := $c$('payos', 'pay2s', 'gia')$c$;
begin
    foreach v_ten in array array['tao_don_nap', 'tao_don_hoi_vien', 'tao_cau_hoi_chuyen_gia'] loop
        select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = v_ten;
        if v_oid is null then
            raise notice '0037: chưa có hàm % — chạy lại 0037 sau migration tạo hàm này', v_ten;
            continue;
        end if;
        v_def := pg_get_functiondef(v_oid);
        if position(v_moi in v_def) > 0 then continue; end if;
        if position(v_cu in v_def) = 0 then
            raise exception '0037: không thấy danh sách cổng % trong hàm % — kiểm tra lại trước khi chạy', v_cu, v_ten;
        end if;
        execute replace(v_def, v_cu, v_moi);
    end loop;
end $$;
