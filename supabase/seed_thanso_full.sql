-- Seed KB than so vao Supabase — sinh tu data/thanso_meanings.json
-- Dan CA FILE nay vao Supabase SQL Editor roi bam Run.
-- (Da bao gom tao bang + RLS chi-doc + nap du lieu co dau tieng Viet.)

-- === 1. Tao bang ===
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

-- === 2. Bat RLS + cho phep DOC cong khai ===
alter table sources enable row level security;
drop policy if exists "public read sources" on sources;
create policy "public read sources" on sources for select using (true);
alter table schools enable row level security;
drop policy if exists "public read schools" on schools;
create policy "public read schools" on schools for select using (true);
alter table thanso_so_meanings enable row level security;
drop policy if exists "public read thanso_so_meanings" on thanso_so_meanings;
create policy "public read thanso_so_meanings" on thanso_so_meanings for select using (true);
alter table thanso_vi_tri enable row level security;
drop policy if exists "public read thanso_vi_tri" on thanso_vi_tri;
create policy "public read thanso_vi_tri" on thanso_vi_tri for select using (true);

-- === 3. Nap du lieu ===
insert into sources(id,ten,mo_ta,luu_y) values ('balliett_jordan','Dòng Balliett → Jordan','Thần số học Pythagoras hiện đại, Mỹ 1905–1965 (L. Dow Balliett, Juno Jordan).','Các mô tả khác nhau tuỳ tác giả — không có bản chuẩn. Dùng như đề tài tham khảo, không như sự thật.') on conflict(id) do nothing;
insert into schools(id,ten) values ('pythagoras_vn','Pythagoras (bản Việt, biên soạn bởi chủ dự án)') on conflict(id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (1,'Khởi đầu, độc lập, dẫn dắt','Áp đặt, khó hợp tác, sợ bị lu mờ','Có bao nhiêu lần bạn chủ động nhường quyền quyết định mà không thấy khó chịu?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (2,'Hợp tác, nhạy cảm, hoà giải','Né xung đột đến mức để việc mưng mủ','Lần gần nhất bạn nói "không" thẳng, không giải thích dài dòng?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (3,'Diễn đạt, sáng tạo, giao tiếp','Tản mạn, bỏ giữa, nói nhiều hơn làm','Bạn có dự án nào theo tới cùng dù đã hết hứng?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (4,'Nền tảng, kỷ luật, xây dựng','Cứng nhắc, sợ đổi, cày mà không hỏi để làm gì','Lần gần nhất bạn phá bỏ một hệ thống mình đã dựng?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (5,'Tự do, biến động, trải nghiệm','Bốc, thiếu bền, đổi hướng khi vừa khó','Bạn đã ở đâu đủ lâu để thấy hậu quả dài hạn của việc mình làm?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (6,'Trách nhiệm, chăm sóc, gia đình','Kiểm soát dưới vỏ quan tâm, tự hy sinh rồi oán','Bạn có để người khác tự xử lý việc của họ mà không can vào?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (7,'Phân tích, chiều sâu, độc lập tư tưởng','Xa cách, hoài nghi thành lười tin, phân tích thay hành động','Lần gần nhất bạn quyết mà chưa đủ dữ liệu, và ổn với điều đó?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (8,'Quyền lực, tổ chức, vật chất','Đo người bằng kết quả, khó nghỉ, lẫn giá trị với giá cả','Bạn có việc gì làm mà không tính tới lợi ích?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (9,'Bao dung, lý tưởng, cho đi','Cứu người để tránh nhìn mình, kỳ vọng rồi thất vọng','Bạn có nhận giúp đỡ mà không thấy mắc nợ?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (11,'Trực giác, cảm nhận, truyền cảm hứng','Lo lắng nền, lý tưởng quá đà, dễ kiệt','Trực giác của bạn đã sai lần nào, và bạn có ghi lại không?',true,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (22,'Kiến tạo lớn, biến tầm nhìn thành hệ thống','Gánh quá sức, hoãn vì "chưa đủ lớn"','Bạn đã hoàn thành cái gì nhỏ, gần đây?',true,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_so_meanings(gia_tri,tu_khoa,mat_toi,phan_chung,so_cai,source_id,school_id) values (33,'Dẫn dắt bằng phụng sự','Hoà tan bản thân vào vai trò','Bạn muốn gì cho riêng mình, không liên quan tới ai?',true,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_vi_tri(id,ten,khung) values ('duong_doi','Đường đời','mạch chủ đạo của cả đời — hướng đi và bài học trung tâm') on conflict(id) do nothing;
insert into thanso_vi_tri(id,ten,khung) values ('su_menh','Sứ mệnh','mục tiêu cần vun đắp, cái bạn hướng tới') on conflict(id) do nothing;
insert into thanso_vi_tri(id,ten,khung) values ('linh_hon','Linh hồn','động lực bên trong, điều bạn thực sự mong muốn') on conflict(id) do nothing;
insert into thanso_vi_tri(id,ten,khung) values ('nhan_cach','Nhân cách','vẻ ngoài người khác cảm nhận trước khi hiểu bạn') on conflict(id) do nothing;
