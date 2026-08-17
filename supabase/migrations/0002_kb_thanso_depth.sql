-- KB tầng 2 — chiều sâu thần số: đỉnh cao, thử thách, năm cá nhân.
-- Mỗi bảng có source_id + school_id (CLAUDE.md). Rollback: 0002_...down.sql

create table if not exists thanso_dinh_cao (
    id          bigint generated always as identity primary key,
    gia_tri     smallint not null check (gia_tri in (1,2,3,4,5,6,7,8,9,11,22,33)),
    chu_de      text not null,
    y_nghia     text not null,
    bong_toi    text not null,          -- chống Barnum
    phan_chung  text not null,          -- chống Barnum
    so_cai      boolean not null default false,
    source_id   text not null references sources(id),
    school_id   text not null references schools(id),
    unique (gia_tri, source_id, school_id)
);

create table if not exists thanso_thu_thach (
    id          bigint generated always as identity primary key,
    gia_tri     smallint not null check (gia_tri between 0 and 8),
    mo_ta       text not null,
    y_nghia     text not null,
    cach_vuot   text not null,
    source_id   text not null references sources(id),
    school_id   text not null references schools(id),
    unique (gia_tri, source_id, school_id)
);

create table if not exists thanso_nam_ca_nhan (
    id          bigint generated always as identity primary key,
    gia_tri     smallint not null check (gia_tri between 1 and 9),
    chu_de      text not null,
    y_nghia     text not null,
    nen         text not null,
    tranh       text not null,
    source_id   text not null references sources(id),
    school_id   text not null references schools(id),
    unique (gia_tri, source_id, school_id)
);

comment on table thanso_dinh_cao is
    'Nghĩa đỉnh cao (giai đoạn đời theo tuổi). LLM chỉ ghép, cấm tự sinh.';
