-- 0041 QC-G (chủ dự án duyệt 2026-11-23): chuyển đổi offline Google Ads cho đơn nạp Sao / hội viên.
-- Khi người mua bấm nạp (và CHƯA tắt cookie đo lường), máy chủ web ghi kèm đơn MÃ LƯỢT BẤM quảng cáo Google mà trình duyệt
-- đã giữ (gclid / gbraid / wbraid — chuỗi ngẫu nhiên Google gắn vào link quảng cáo). Khi đơn đã trả, Google Ads tải tệp
-- chuyển đổi (/api/qc/google-offline, có mật khẩu) → Google ghép lượt nạp với lượt bấm quảng cáo, kể cả khi người mua đóng
-- tab trước khi trang kết quả kịp báo. Không họ tên, không ngày sinh; email (băm SHA-256) chỉ tính lúc xuất tệp, không lưu ở đây.
-- Dòng tự xoá sau 95 ngày (Google chỉ nhận chuyển đổi ≤ 90 ngày sau lượt bấm). Chỉ service_role đọc / ghi.
create table if not exists google_don (
    ma_don   bigint primary key references don_nap (ma_don) on delete cascade,
    gclid    text check (gclid is null or gclid ~ '^[A-Za-z0-9_-]{10,200}$'),
    gbraid   text check (gbraid is null or gbraid ~ '^[A-Za-z0-9_-]{10,200}$'),
    wbraid   text check (wbraid is null or wbraid ~ '^[A-Za-z0-9_-]{10,200}$'),
    tao_luc  timestamptz not null default now(),
    check (gclid is not null or gbraid is not null or wbraid is not null)
);
create index if not exists google_don_tao_luc_idx on google_don (tao_luc);

alter table google_don enable row level security;
revoke all on google_don from anon, authenticated;
grant all on google_don to service_role;
