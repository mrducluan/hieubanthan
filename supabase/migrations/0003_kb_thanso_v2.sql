-- KB tầng 2 — thần số v2: nghĩa theo lĩnh vực, cặp số, các khối nhỏ (biểu đồ,
-- chỉ số phụ, giải thích, mẫu xử lý). Thiết kế: docs/KIEN-TRUC-THANSO-V2.md.
-- CLAUDE.md: mọi bảng nghĩa có source_id + school_id. Rollback: 0003_...down.sql
-- trang_thai: 'nhap_ai' (bản nháp AI, được hiển thị theo quyết định 2026-09-30)
--             | 'da_duyet' (người có nghề đã duyệt).

insert into sources (id, ten, mo_ta, luu_y) values
  ('nhap_ai_2026',
   'Bản biên soạn tham khảo (AI nháp, 2026) theo truyền thống Balliett–Jordan và sách thần số phổ biến',
   'Nội dung thần số v2 do AI soạn nháp.',
   'Hiển thị theo quyết định chủ dự án 2026-09-30; duyệt dần qua cột trang_thai.')
on conflict (id) do nothing;

create table if not exists thanso_linh_vuc_nghia (
    id          bigint generated always as identity primary key,
    gia_tri     smallint not null check (gia_tri in (1,2,3,4,5,6,7,8,9,11,22,33)),
    linh_vuc    text not null,
    xu_huong    text not null,
    mat_toi     text not null,          -- chống Barnum
    goi_y       text not null,
    cau_tu_soi  text not null,          -- chống Barnum
    trang_thai  text not null default 'nhap_ai' check (trang_thai in ('nhap_ai','da_duyet')),
    source_id   text not null references sources(id),
    school_id   text not null references schools(id),
    unique (gia_tri, linh_vuc, source_id, school_id)
);

create table if not exists thanso_cap_so (
    id          bigint generated always as identity primary key,
    cap         text not null check (cap ~ '^[1-9]-[1-9]$'),
    hoa         text not null,
    va          text not null,
    cung_lam    text not null,
    trang_thai  text not null default 'nhap_ai' check (trang_thai in ('nhap_ai','da_duyet')),
    source_id   text not null references sources(id),
    school_id   text not null references schools(id),
    unique (cap, source_id, school_id)
);

-- Khối nhỏ, cấu trúc khác nhau → jsonb. khoi: o_so | mui_ten_du | mui_ten_trong |
-- ngay_sinh | thai_do | truong_thanh | thang_ca_nhan | ngay_ca_nhan | no_nghiep |
-- bai_hoc_nghiep | giai_thich | mau | luu_y
create table if not exists thanso_kb_khoi (
    id          bigint generated always as identity primary key,
    khoi        text not null,
    ma          text not null,
    noi_dung    jsonb not null,
    trang_thai  text not null default 'nhap_ai' check (trang_thai in ('nhap_ai','da_duyet')),
    source_id   text not null references sources(id),
    school_id   text not null references schools(id),
    unique (khoi, ma, source_id, school_id)
);

alter table thanso_linh_vuc_nghia enable row level security;
drop policy if exists "public read thanso_linh_vuc_nghia" on thanso_linh_vuc_nghia;
create policy "public read thanso_linh_vuc_nghia" on thanso_linh_vuc_nghia for select using (true);
alter table thanso_cap_so enable row level security;
drop policy if exists "public read thanso_cap_so" on thanso_cap_so;
create policy "public read thanso_cap_so" on thanso_cap_so for select using (true);
alter table thanso_kb_khoi enable row level security;
drop policy if exists "public read thanso_kb_khoi" on thanso_kb_khoi;
create policy "public read thanso_kb_khoi" on thanso_kb_khoi for select using (true);

comment on table thanso_linh_vuc_nghia is
    'Nghĩa số theo lĩnh vực đời sống. LLM tầng NARRATIVE chỉ được diễn đạt, cấm tự sinh.';
