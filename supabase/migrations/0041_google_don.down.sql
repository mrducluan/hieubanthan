-- Rollback cho 0041_google_don.sql: bỏ bảng mã lượt bấm quảng cáo Google theo đơn (dữ liệu đo quảng cáo ≤ 95 ngày, không phải tiền).
drop table if exists google_don;
