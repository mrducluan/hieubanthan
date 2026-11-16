-- 0038 META-CAPI (chủ dự án duyệt 2026-11-16): API chuyển đổi của Meta cho đơn nạp Sao / hội viên.
-- Khi người mua bấm nạp (và CHƯA tắt cookie đo lường), máy chủ web ghi kèm đơn: mã cookie Meta của trình duyệt (_fbp, _fbc),
-- IP + trình duyệt (user agent) — đúng những gì Meta cần để khớp lượt mua với lượt bấm quảng cáo. Khi Pay2S báo đã trả tiền,
-- máy chủ gửi sự kiện Purchase cho Meta (cùng event_id với Pixel → Meta không đếm hai lần) rồi XOÁ IP + user agent.
-- Không email, không họ tên, không ngày sinh. Mọi dòng tự xoá sau 8 ngày (Meta chỉ nhận sự kiện ≤ 7 ngày tuổi).
-- Chỉ service_role (máy chủ web) đọc / ghi: RLS bật, không policy, thu hồi quyền của anon + authenticated.
create table if not exists meta_don (
    ma_don   bigint primary key references don_nap (ma_don) on delete cascade,
    fbp      text check (fbp is null or fbp ~ '^fb\.[0-9]\.[0-9]{10,16}\.[0-9]{1,30}$'),
    fbc      text check (fbc is null or (char_length(fbc) <= 440 and fbc ~ '^fb\.[0-9]\.[0-9]{10,16}\.[A-Za-z0-9_-]+$')),
    ip       text check (ip is null or char_length(ip) <= 64),
    ua       text check (ua is null or char_length(ua) <= 400),
    tao_luc  timestamptz not null default now(),
    da_gui   timestamptz
);
create index if not exists meta_don_tao_luc_idx on meta_don (tao_luc);

alter table meta_don enable row level security;
revoke all on meta_don from anon, authenticated;
grant all on meta_don to service_role;
