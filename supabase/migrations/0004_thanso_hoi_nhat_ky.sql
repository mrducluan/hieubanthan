-- Nhật ký hỏi đáp thần số — nguyên liệu cho vòng tự cải thiện.
-- Quyết định chủ dự án 2026-09-30: lưu câu hỏi ĐÃ LỌC + phân loại + câu trả lời.
-- KHÔNG có user_id, họ tên, ngày sinh (engine lọc trước khi ghi: app/nhat_ky.py).
-- RLS: anon chỉ được INSERT, không được đọc. Đọc bằng service role (dashboard / skill).
-- Rollback: 0004_...down.sql

create table if not exists thanso_hoi_nhat_ky (
    id              bigint generated always as identity primary key,
    created_at      timestamptz not null default now(),
    cau_hoi_da_loc  text not null check (length(cau_hoi_da_loc) <= 400),
    linh_vuc        text not null,
    y_dinh          text not null,
    doi_tuong       text not null,
    xu_ly           text not null,
    do_phu          text not null,
    khoi            text[] not null default '{}',
    can_them        text[] not null default '{}',
    che_do          text not null,
    loi_kiem_tra    text[] not null default '{}',
    cau_tra_loi     text not null check (length(cau_tra_loi) <= 4000),
    engine_version  text not null,
    huu_ich         boolean              -- 👍/👎 (chưa bật trên web)
);

alter table thanso_hoi_nhat_ky enable row level security;
drop policy if exists "anon insert thanso_hoi_nhat_ky" on thanso_hoi_nhat_ky;
create policy "anon insert thanso_hoi_nhat_ky" on thanso_hoi_nhat_ky
    for insert to anon with check (true);

create index if not exists thanso_hoi_nhat_ky_created on thanso_hoi_nhat_ky (created_at desc);
create index if not exists thanso_hoi_nhat_ky_do_phu on thanso_hoi_nhat_ky (do_phu, linh_vuc);

comment on table thanso_hoi_nhat_ky is
    'Hỏi đáp thần số đã ẩn danh. Không user_id / họ tên / ngày sinh. Xoá sau 12 tháng (việc định kỳ, chưa bật).';
