-- Rollback cho 0038_meta_capi.sql: bỏ bảng tạm mã cookie Meta theo đơn (chỉ dữ liệu đo quảng cáo ≤ 8 ngày, không phải tiền).
drop table if exists meta_don;
