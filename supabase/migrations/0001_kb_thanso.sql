-- KB tầng 2 — kho quy tắc luận giải thần số.
-- Nguyên tắc CLAUDE.md: mọi bảng nghĩa BẮT BUỘC có source_id + school_id.
-- Chống Barnum: mỗi nghĩa số bắt buộc có mat_toi + phan_chung (NOT NULL).
-- Rollback: xem 0001_kb_thanso.down.sql

create table if not exists sources (
    id          text primary key,
    ten         text not null,
    mo_ta       text,
    luu_y       text,
    created_at  timestamptz not null default now()
);

create table if not exists schools (
    id          text primary key,
    ten         text not null,
    created_at  timestamptz not null default now()
);

-- Nghĩa của MỘT con số (1-9, 11, 22, 33) theo MỘT trường phái + nguồn.
create table if not exists thanso_so_meanings (
    id          bigint generated always as identity primary key,
    gia_tri     smallint not null check (gia_tri in (1,2,3,4,5,6,7,8,9,11,22,33)),
    tu_khoa     text not null,
    mat_toi     text not null,          -- bắt buộc: chống lời khen mơ hồ
    phan_chung  text not null,          -- bắt buộc: chống hiệu ứng Barnum
    so_cai      boolean not null default false,
    source_id   text not null references sources(id),
    school_id   text not null references schools(id),
    created_at  timestamptz not null default now(),
    unique (gia_tri, source_id, school_id)
);

-- Khung của từng vị trí chỉ số (Đường đời / Sứ mệnh / Linh hồn / Nhân cách).
create table if not exists thanso_vi_tri (
    id          text primary key,       -- duong_doi | su_menh | linh_hon | nhan_cach
    ten         text not null,
    khung       text not null
);

comment on table thanso_so_meanings is
    'Nghĩa số thần số. LLM tầng NARRATIVE chỉ được ghép nội dung từ đây, cấm tự sinh.';
