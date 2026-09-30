-- Nhật ký hỏi đáp Huyền học (Tử vi · Kinh Dịch · Bát tự · Phong thuỷ) — nguyên liệu cho vòng
-- tự cải thiện đa module (skill huyenhoc-tu-cai-thien). Cùng nguyên tắc với 0004 (thần số):
--   * KHÔNG user_id, họ tên, ngày sinh; câu hỏi đã lọc (ngày, năm, SĐT, email, họ tên) trong engine.
--   * Khi câu hỏi dùng ngày giờ sinh (lá số / tứ trụ / mệnh quái), engine KHÔNG gửi câu trả lời
--     (cau_tra_loi = null) vì tứ trụ, lá số gần như suy ngược được ngày giờ sinh.
-- RLS: anon chỉ INSERT, không đọc. Đọc bằng service role.
-- Rollback: 0005_huyenhoc_hoi_nhat_ky.down.sql

create table if not exists huyenhoc_hoi_nhat_ky (
    id              bigint generated always as identity primary key,
    created_at      timestamptz not null default now(),
    mo_dun          text not null check (mo_dun in ('tuvi', 'kinhdich', 'battu', 'phongthuy')),
    cau_hoi_da_loc  text not null check (length(cau_hoi_da_loc) <= 400),
    loai            text not null,
    xu_ly           text not null,
    che_do          text,
    do_phu          text not null,
    co_du_lieu_sinh boolean not null default false,
    khoi            text[] not null default '{}',
    can_them        text[] not null default '{}',
    loi_kiem_tra    text[] not null default '{}',
    cau_tra_loi     text check (cau_tra_loi is null or length(cau_tra_loi) <= 4000),
    engine_version  text not null,
    huu_ich         boolean
);

alter table huyenhoc_hoi_nhat_ky enable row level security;
create policy "anon insert huyenhoc_hoi_nhat_ky" on huyenhoc_hoi_nhat_ky
    for insert to anon with check (true);

create index if not exists huyenhoc_hoi_nhat_ky_created on huyenhoc_hoi_nhat_ky (created_at desc);
create index if not exists huyenhoc_hoi_nhat_ky_mo_dun on huyenhoc_hoi_nhat_ky (mo_dun, do_phu, loai);

comment on table huyenhoc_hoi_nhat_ky is
    'Hỏi đáp Huyền học đã ẩn danh. Không user_id / họ tên / ngày sinh; không lưu câu trả lời khi có dữ liệu sinh.';
