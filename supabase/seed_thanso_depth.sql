-- Seed CHIEU SAU vao Supabase — dan CA FILE vao SQL Editor roi Run.
-- (Tao bang + RLS chi-doc + nap du lieu. Chay SAU khi da chay seed so co ban.)

-- === 1. Tao bang ===
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

-- === 2. RLS chi-doc cong khai ===
alter table thanso_dinh_cao enable row level security;
drop policy if exists "public read thanso_dinh_cao" on thanso_dinh_cao;
create policy "public read thanso_dinh_cao" on thanso_dinh_cao for select using (true);
alter table thanso_thu_thach enable row level security;
drop policy if exists "public read thanso_thu_thach" on thanso_thu_thach;
create policy "public read thanso_thu_thach" on thanso_thu_thach for select using (true);
alter table thanso_nam_ca_nhan enable row level security;
drop policy if exists "public read thanso_nam_ca_nhan" on thanso_nam_ca_nhan;
create policy "public read thanso_nam_ca_nhan" on thanso_nam_ca_nhan for select using (true);

-- === 3. Nap du lieu ===
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (1,'Giai đoạn tự lập và khẳng định mình','Bài học trung tâm là đứng trên đôi chân mình, tự quyết, mở đường. Cơ hội đến khi bạn dám dẫn dắt thay vì chờ.','Cô độc, áp đặt, hoặc ngược lại — trốn tránh việc phải tự chịu trách nhiệm.','Trong giai đoạn này, bạn thật sự tự quyết, hay vẫn dựa vào người khác quyết hộ?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (2,'Giai đoạn hợp tác và kiên nhẫn','Việc đến qua quan hệ, qua chờ đợi đúng lúc. Bài học là phối hợp, lắng nghe, xây lòng tin — không phải ép tiến độ.','Phụ thuộc, mờ nhạt, né va chạm đến mức đánh mất tiếng nói riêng.','Bạn có giữ được chính kiến khi phải hoà hợp với người khác không?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (3,'Giai đoạn sáng tạo và thể hiện','Năng lượng của diễn đạt, giao tiếp, niềm vui. Thời điểm tốt để nói ra, làm ra, kết nối.','Tản mạn, hời hợt, nói nhiều hơn làm, phân tán sức vào quá nhiều thứ.','Bạn có theo tới cùng một việc sáng tạo, hay bỏ khi vừa hết hứng?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (4,'Giai đoạn xây nền và kỷ luật','Thời của làm việc bền bỉ, dựng hệ thống, tích luỹ. Thành quả đến từ kiên trì, không từ may mắn.','Gò bó, cứng nhắc, cày mà quên hỏi để làm gì.','Bạn xây nền cho mục tiêu của mình, hay chỉ bận rộn cho có?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (5,'Giai đoạn thay đổi và tự do','Biến động, cơ hội mới, mở rộng trải nghiệm. Bài học là thích ứng linh hoạt mà vẫn giữ hướng.','Bất ổn, buông thả, đổi hướng liên tục khiến không gì đủ sâu.','Bạn đã ở với lựa chọn nào đủ lâu để thấy nó ra sao chưa?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (6,'Giai đoạn trách nhiệm và chăm sóc','Trọng tâm là gia đình, cam kết, chăm lo cho người khác. Việc và tình thường gắn với bổn phận.','Ôm đồm, kiểm soát dưới vỏ quan tâm, tự hy sinh rồi oán.','Bạn để người mình chăm tự quyết việc của họ, hay can thiệp quá?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (7,'Giai đoạn nội tâm và chiều sâu','Thời của học hỏi, chiêm nghiệm, đi vào bên trong. Chất lượng hơn số lượng; hiểu hơn là chạy.','Cô lập, hoài nghi thành lười tin, phân tích thay vì sống.','Bạn dùng thời gian một mình để hiểu mình, hay để trốn người khác?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (8,'Giai đoạn sự nghiệp và vật chất','Năng lượng của quyền lực, tổ chức, tài chính. Thời điểm gặt hái nếu đã gieo đúng — và học dùng nguồn lực có trách nhiệm.','Đo mọi thứ bằng kết quả, lẫn giá trị với giá cả, khó dừng.','Bạn có việc gì làm trong giai đoạn này mà không tính tới lợi ích?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (9,'Giai đoạn cho đi và hoàn tất','Khép lại một chương, buông những gì đã xong, cho đi rộng lượng. Bài học là kết thúc tử tế để mở đầu mới.','Cứu người để tránh nhìn mình, kỳ vọng rồi thất vọng, níu cái đã hết.','Bạn có buông được điều đã xong mà không thấy tiếc nuối dai dẳng?',false,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (11,'Giai đoạn trực giác và cảm hứng','Nhạy cảm cao, trực giác mạnh, có thể truyền cảm hứng cho người khác. Thử thách là giữ vững tinh thần giữa áp lực.','Lo lắng nền, lý tưởng quá đà, dễ kiệt sức vì căng thẳng.','Trực giác của bạn giai đoạn này đã đúng mấy lần — bạn có ghi lại để biết?',true,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_dinh_cao(gia_tri,chu_de,y_nghia,bong_toi,phan_chung,so_cai,source_id,school_id) values (22,'Giai đoạn kiến tạo lớn','Khả năng biến tầm nhìn thành hệ thống thật, để lại dấu ấn lâu dài. Cần nền tảng thực tế đỡ cho tham vọng.','Gánh quá sức, hoãn mãi vì thấy ''chưa đủ lớn'', áp lực tự đặt.','Bạn đã hoàn thành cái gì nhỏ và cụ thể gần đây chưa?',true,'balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_thu_thach(gia_tri,mo_ta,y_nghia,cach_vuot,source_id,school_id) values (0,'Ô trống — không mang thông tin cụ thể','Thử thách 0 KHÔNG có nghĩa ''không có thử thách'', mà là ''thử thách của mọi số''. Trong hệ này 0 là ô trống, diễn giải kiểu gì cũng được — nên nói thẳng: mục này không chỉ ra một bài học riêng.','Không ép một ý nghĩa vào đây. Đọc các thử thách khác thay vì cố luận số 0.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_thu_thach(gia_tri,mo_ta,y_nghia,cach_vuot,source_id,school_id) values (1,'Học tự tin mà không áp đặt','Bài học là dám đứng riêng, tự quyết, mà không lấn át người khác — và vượt nỗi sợ bị lu mờ.','Chủ động một việc nhỏ mỗi tuần, và tập nhường quyền quyết khi không cần thiết.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_thu_thach(gia_tri,mo_ta,y_nghia,cach_vuot,source_id,school_id) values (2,'Học nhạy cảm mà không mất mình','Khó khăn nằm ở việc quá để ý cảm xúc người khác, né xung đột đến mức đánh mất tiếng nói riêng.','Tập nói ''không'' thẳng, ngắn, không giải thích dài dòng.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_thu_thach(gia_tri,mo_ta,y_nghia,cach_vuot,source_id,school_id) values (3,'Học thể hiện thật lòng','Thử thách là tự nghi ngờ khả năng sáng tạo, hoặc tản mạn nói nhiều mà không làm.','Chọn MỘT việc sáng tạo, làm tới xong, kể cả khi đã hết hứng.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_thu_thach(gia_tri,mo_ta,y_nghia,cach_vuot,source_id,school_id) values (4,'Học kỷ luật linh hoạt','Khó khăn ở sự cứng nhắc, ngại thay đổi, hoặc ngại bắt tay vào việc bền bỉ.','Chia việc lớn thành bước nhỏ có hạn; cho phép mình sửa kế hoạch khi cần.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_thu_thach(gia_tri,mo_ta,y_nghia,cach_vuot,source_id,school_id) values (5,'Học tự do có trách nhiệm','Thử thách là bốc đồng, thiếu bền, đổi hướng khi vừa gặp khó.','Cam kết một việc trong khoảng thời gian đủ dài để thấy hậu quả dài hạn.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_thu_thach(gia_tri,mo_ta,y_nghia,cach_vuot,source_id,school_id) values (6,'Học yêu thương không kiểm soát','Khó khăn ở việc ôm đồm trách nhiệm, kiểm soát người thân dưới danh nghĩa quan tâm.','Để người khác tự xử việc của họ; phân biệt giúp đỡ với can thiệp.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_thu_thach(gia_tri,mo_ta,y_nghia,cach_vuot,source_id,school_id) values (7,'Học tin và mở lòng','Thử thách là hoài nghi, cô lập, dùng phân tích để tránh cảm xúc và con người.','Chia sẻ một điều thật với một người tin cậy, thay vì tự phân tích một mình.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_thu_thach(gia_tri,mo_ta,y_nghia,cach_vuot,source_id,school_id) values (8,'Học cân bằng vật chất và tinh thần','Khó khăn ở ám ảnh quyền lực, tiền bạc, đo giá trị con người bằng kết quả.','Làm một việc có ý nghĩa mà không tính lợi ích; tập dừng đúng lúc.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_nam_ca_nhan(gia_tri,chu_de,y_nghia,nen,tranh,source_id,school_id) values (1,'Năm khởi đầu','Gieo hạt, quyết định mới, đặt nền cho chu kỳ 9 năm. Năng lượng độc lập, chủ động.','Bắt đầu việc mới, đặt mục tiêu dài hạn.','Chần chừ, chờ người khác quyết.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_nam_ca_nhan(gia_tri,chu_de,y_nghia,nen,tranh,source_id,school_id) values (2,'Năm vun đắp','Kiên nhẫn, xây quan hệ, chờ thời. Việc thường tiến chậm và đến qua người khác.','Hợp tác, nuôi dưỡng những gì đã gieo năm 1.','Ép tiến độ, nôn nóng thấy kết quả.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_nam_ca_nhan(gia_tri,chu_de,y_nghia,nen,tranh,source_id,school_id) values (3,'Năm thể hiện','Sáng tạo, giao tiếp, xã giao, niềm vui. Cơ hội mở rộng qua kết nối và biểu đạt.','Nói ra, làm ra, mở rộng mạng lưới.','Tản mạn, phân tán sức vào quá nhiều thứ.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_nam_ca_nhan(gia_tri,chu_de,y_nghia,nen,tranh,source_id,school_id) values (4,'Năm làm việc','Xây nền, kỷ luật, tích luỹ bền bỉ. Không phải năm hoa mỹ mà là năm cày.','Củng cố, dựng hệ thống, làm việc đều.','Bỏ dở nền tảng để chạy theo cái mới.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_nam_ca_nhan(gia_tri,chu_de,y_nghia,nen,tranh,source_id,school_id) values (5,'Năm thay đổi','Biến động, tự do, cơ hội bất ngờ. Nhịp nhanh, nhiều lựa chọn mở ra.','Linh hoạt, đón cơ hội, thử cái mới.','Buông thả, mất tập trung, quyết vội.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_nam_ca_nhan(gia_tri,chu_de,y_nghia,nen,tranh,source_id,school_id) values (6,'Năm trách nhiệm','Gia đình, cam kết, chăm lo. Trọng tâm dời về tổ ấm và bổn phận.','Cam kết, chăm sóc, ổn định quan hệ.','Ôm đồm đến kiệt, kiểm soát người thân.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_nam_ca_nhan(gia_tri,chu_de,y_nghia,nen,tranh,source_id,school_id) values (7,'Năm nội tâm','Học hỏi, chiêm nghiệm, nghỉ ngơi bên trong. Năm của chất lượng hơn số lượng.','Học sâu, nghỉ ngơi, nhìn lại.','Ép mình xã giao, hoặc cô lập hoàn toàn.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_nam_ca_nhan(gia_tri,chu_de,y_nghia,nen,tranh,source_id,school_id) values (8,'Năm gặt hái','Sự nghiệp, tài chính, quyền lực. Nếu đã gieo đúng, đây là năm thu hoạch — kèm áp lực.','Đẩy mạnh sự nghiệp, quản lý nguồn lực.','Để tiền/quyền lấn át giá trị, làm quá sức.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
insert into thanso_nam_ca_nhan(gia_tri,chu_de,y_nghia,nen,tranh,source_id,school_id) values (9,'Năm hoàn tất','Khép chu kỳ, buông bỏ, dọn dẹp để chuẩn bị khởi đầu mới. Năm của kết thúc tử tế.','Hoàn tất việc dở, buông cái đã xong, cho đi.','Khởi sự lớn mới, níu giữ cái đã hết.','balliett_jordan','pythagoras_vn') on conflict(gia_tri,source_id,school_id) do nothing;
