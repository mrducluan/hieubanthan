# Nâng cấp Phong thuỷ + Kinh Dịch (PT-KD-ĐS, 2026-10-21)

Chủ dự án giao: đọc hai bộ tài liệu/codebase ở Google Drive (Phong thuỷ `1kMFqK5d5c8dhfL3ZcBmzuKhPLvT6arfy`, Kinh Dịch
`1GJoVmNFst3qnGhemY7n4a289VkfcoR5k`), rà engine hiện có, **bổ sung phép tính còn thiếu**, làm lại UI theo hướng **lời đời
thường, không giọng AI, có hook, phần học thuật thu gọn bấm mới mở**, QC/E2E kỹ, và đề xuất kiến trúc.

Khâu trong vòng tăng trưởng: **THU HÚT** (hook + lời đọc dễ hiểu ở hai trang công cụ có từ khoá tìm kiếm lớn) và **QUAY LẠI**
("3 tháng tới" của nhà, "hỏi tiếp" của quẻ, chủ đề/chip). Đo: `reading_started`/`reading_completed` mảng `phongthuy`,
`kinhdich`; `chart_interacted{kind=nha_cua_ban}`; `pain_point_clicked{mo_dun=kinhdich, ma}`.

## 1. Tài liệu Drive — lấy gì, bỏ gì

Đã tải được toàn bộ qua connector Google Drive (Phong thuỷ 6 tệp SQL + các tệp thiết kế; Kinh Dịch 15 tệp Python/SQL/JSON/TS).
Nguyên tắc: **chuyển phần tất định vào engine Python (một bộ tính), không chạy SQL/PLpgSQL tính toán, không chép mã TS.**

| Ý trong tài liệu | Quyết định | Vì sao |
|---|---|---|
| Lục Hào đầy đủ: lục thú theo can ngày, phục thần, nguyên/kỵ/cừu thần, hoá tiến/thoái, hồi đầu sinh/khắc, nhật/nguyệt phá, ám động, nhập mộ, ứng kỳ | **Làm** — `engine/app/calc/luc_hao.py` (test tính tay) | Thiếu thật trong engine (trước chỉ có vượng suy rút gọn) |
| Mai Hoa theo số / phương vị, toàn cục (thể–dụng–hỗ–biến), ứng kỳ số | **Làm** — `kinhdich_maihoa.py` (KD-V2) | Số/phương do NGƯỜI DÙNG đưa vào theo phép Mai Hoa — không phải trường chọn quẻ theo ý |
| Taxonomy 36 chủ đề → dụng thần; "pre-check clarifier" hỏi lại khi câu mơ hồ; schema 2 lớp (đời thường theo phái + học thuật gập + 3 nhóm hành động + chip hỏi tiếp) | **Làm, rút về 20 chủ đề Việt Nam** — KB `kinhdich_doi_song.json`, RULES `luangiai/kinhdich_doi_song.py` | Phần giá trị nhất; làm rõ TRƯỚC khi gieo (mua/bán, người ấy nữ/nam, hai việc) là luật tất định |
| LLM "Đại sư" nhân cách hoá, hội đồng nhiều LLM, what-if gieo lại | **Không** | Trái NARRATIVE (LLM chỉ diễn đạt), "một quẻ một việc", tốn hạn mức RL-1 |
| Phong thuỷ: 81 tổ hợp sơn–hướng tinh có điểm số, domain impacts, "trigger years" | **Đã làm đủ 81 tổ hợp CÓ THỨ TỰ (PT-81, 2026-10-22)** — KB `to_hop_81` (lĩnh vực tiền bạc / công việc / gia đạo / sức khoẻ / tâm lý, chỗ hợp, cách xử lý, sao kích hoạt), CALC `to_hop_cung` + `nam_chu_y` (năm tính từ lưu niên theo cung); câu từ chỉnh lại: "cực hung" → "cần chủ động", tên bệnh → bộ phận sách xưa gắn + chăm sóc phòng ngừa + khám định kỳ | Bảng Drive chỉ có **7 dòng mẫu** và năm kích hoạt ghi tay → không chép; điểm số vẫn không dùng (quy tắc không doạ). Lần trước mới làm 45 cặp |
| Lưu nguyệt phi tinh (bảng tháng theo năm) | **Làm theo quy tắc chuẩn** `huyen_khong.luu_nguyet` | **Bảng trong tài liệu lệch một nhóm** (2024 Thìn ghi tháng Dần nhập trung 8; Thẩm thị: Thìn Tuất Sửu Mùi → 5, Tý Ngọ Mão Dậu → 8, Dần Thân Tỵ Hợi → 2). Giữ quy tắc chuẩn, ghi chú ở đây để anh biết |
| Lịch tiết khí Lập xuân cố định 2024–2030 | **Không** (engine đã tính VSOP87) | Một bộ tính |
| PostGIS/Apache AGE/pgvector cho phong thuỷ, 4 toggle UI, 70/30 hình thế/lý khí "veto" | **Đã đánh giá đầy đủ** → `docs/DANH-GIA-KIEN-TRUC-PHONG-THUY-DRIVE.md`: không thay nền 5 tầng; 5 ý đáng lấy (trần mức theo dấu hiệu lớn, hình học mặt bằng thuần Python, hướng từ bản đồ, việc nên làm theo chi phí, phiếu sau 30 ngày); bảng quyết định Q1–Q8 chờ chủ dự án | Mode 1B (không gian / thời gian) khớp cách làm của mình; 70/30 và điểm số không dùng; AGE không có trên Supabase |
| RLHF patch rules, user_feedback có ngày sinh | **Chuyển thành vòng tự cải thiện của mình cho MỌI mảng (HỌC-ĐS, 2026-10-22)** — hộp Phong thuỷ / Kinh Dịch có mã kiểm chứng, hạ hộp theo tỉ lệ, gom theo mảng ở `/quan-tri/hoc`; quy tắc riêng tư mở rộng (`docs/VONG-TU-CAI-THIEN.md`) | Không lưu ngày sinh / tên / câu hỏi / ảnh nhà cùng phiếu; luật vá không tự bật — người duyệt viết luật qua PR |

## 2. Đã làm

### Engine (CALC → KB → RULES → API)
- `calc/luc_hao.py` (mới, 29 test), `calc/kinhdich_maihoa.py` thêm `khoi_que_tu_so`, `khoi_que_phuong_vi`, `toan_cuc`, `ung_ky_so` (23 test).
- `luangiai/kinhdich_doi_song.py` + KB `kinhdich_doi_song.json`: `doc_que` → mức Thuận lợi / Cân bằng / Cần chủ động theo phái
  đang đọc (lời kinh làm chủ bằng chữ đoán 吉亨利无咎 / 凶吝厲悔; thể–dụng Mai Hoa; dụng thần Lục Hào vượng suy + hoá + nguyên/kỵ thần),
  hộp nổi bật, ba nhóm việc theo 20 chủ đề, câu tự soi, "Vì sao nói vậy", **ba cách đọc cùng một quẻ**, lời kinh (gập), ứng kỳ, chip hỏi tiếp
  (không gieo lại cùng việc). `can_lam_ro` hỏi lại trước khi gieo. Lớp đời thường có test cấm giọng AI / từ doạ (`cum_cam`).
  `/v1/kinhdich/hoi` thêm `chu_de`, `so_mai_hoa`, `phuong_mai_hoa`, `cach_ra_que` = `mai_hoa_so` / `mai_hoa_phuong`; `GET /v1/kinhdich/chu-de`.
  `cau_tra_loi` cũ giữ nguyên (LLM, nhật ký, test cũ).
- `calc/huyen_khong.py` thêm `luu_nguyet`, `luu_nguyet_tai`, `to_hop_cung` (81 cặp từ 45 nghĩa), `thong_quan`, `huong_chung` (test tay).
  KB `phongthuy_huyen_khong.json` thêm `cap_sao` 45, `sao_doi_thuong` 9, `luu_nguyet`. (Y8, 2026-10-26: `cap_sao` đã gỡ — `to_hop_81` là nguồn duy nhất.)
- `luangiai/phongthuy_doi_song.py` + KB `phongthuy_doi_song.json`: báo cáo **"Nhà của bạn"** 5 chương (khuôn `doi_song_1` dùng chung
  với Luận giải Tử vi): Bạn hợp hướng nào · Ngôi nhà này với bạn (hình thế trước lý khí, Huyền Không cung cửa, người cùng ở khác nhóm →
  chia hướng, hành thông quan) · Từng phòng (du niên người ở quyết định, cặp sao chỉ hạ bậc; chưa khai bố cục → gợi ý đặt phòng) · Năm nay
  và 3 tháng tới (5 phương tránh, sao tháng vào cung cửa theo tiết khí, tuổi làm nhà) · Việc nên làm (làm ngay / chờ lúc / tránh).
  Route `POST /v1/phongthuy/luan-giai` (miễn phí, không lưu; thành viên chỉ năm sinh + giới tính).
- Sửa 7 câu "nôm na" trong `kinhdich_hao.json` trùng cụm giọng AI.

### Web
- Kinh Dịch: chip chủ đề, Mai Hoa theo số / phương vị, chip làm rõ, `DocQue` hai tầng (đời thường hiện ngay; "Vì sao nói vậy", ba cách đọc,
  lời kinh, bản theo sách gập). Lời chính trong khung chat = kết luận đời thường.
- Phong thuỷ: khối **Nhà của bạn** (`NhaCuaBan.tsx`) ngay dưới Đo hướng, nhận độ hướng vừa đo; người cùng ở; mục lục chương, hộp nổi bật,
  3 tháng, 3 nhóm việc; thuật ngữ chỉ trong "Vì sao nói vậy".
- Hook đầu trang (`lib/so-trang.ts` + `DauMang`) viết lại theo nỗi băn khoăn thật của người dùng (CMS vẫn phủ được).
- E2E: `kinh-dich.spec.ts` viết lại (6 ca), `phong-thuy.spec.ts` thêm ca Nhà của bạn.

## 3. Đề xuất kiến trúc (anh duyệt từng mục)

1. **Một khuôn "bài đọc đời sống" cho mọi mảng** (`doi_song_1`: mức · hộp · doan · can_cu · câu tự soi · hành động 3 nhóm). Tử vi, Phong
   thuỷ đã dùng; Kinh Dịch dùng `doc_que` cùng từ vựng. Nên đưa Thần số "Bản đồ con số" và Bát tự về cùng khuôn → một component hiển thị,
   một bộ test giọng văn, một chỗ gắn kiểm chứng "x% thấy đúng". Lợi: UI nhất quán, đo được chương nào người ta đọc hết.
2. **"Hồ sơ nhà" lưu trên máy** (như hồ sơ người): hướng cửa, năm xây, bố cục đã khai, người cùng ở → mọi khối Phong thuỷ (Nhà của bạn,
   Khảo sát, Huyền Không) đọc chung, và **"3 tháng tới" đổi mỗi tháng** → lý do quay lại; thẻ "Tháng này nhà bạn" trên Hôm nay. Không gửi
   server, không migration.
3. **Chip ý định dùng chung giữa các mảng**: 20 chủ đề Kinh Dịch ≈ 11 ý định Hôm nay ≈ 5 trụ nỗi đau thần số. Gộp thành một từ điển ý định
   (mã chung, mỗi mảng ánh xạ sang dụng thần / cung / chỉ số) → người hỏi "chuyển việc" ở Kinh Dịch được mời xem cung Quan lộc Tử vi, năm cá
   nhân thần số cùng một mã; đo `pain_point_clicked` một chiều. Đây cũng là nhãn cho kho vectơ ý định (LG-ĐS) thay vì mỗi mảng một bộ.
4. **Ứng kỳ → nhắc việc opt-in**: Lục Hào ra ngày cụ thể ("ngày Tuất 24/5"). Cho người dùng bấm "Nhắc tôi hôm đó" (lưu trên máy, hiện ở
   Hôm nay) → vòng quay lại tự nhiên, không doạ. Nếu có tài khoản: bảng nhắc nhỏ, RLS chủ sở hữu, không nội dung câu hỏi.
5. **Tín hiệu ngầm thay bình chọn**: người dùng mở "Ba cách đọc" và dừng ở phái nào, mở "Lời kinh" hay không → gửi PostHog mã (không chữ).
   Đủ mẫu thì mặc định phái đọc chính theo thói quen từng người (lưu máy), không cần hỏi.
6. **Không làm**: hội đồng nhiều LLM mỗi lượt, LLM chọn quẻ/sao, điểm số nhà, "trigger year" theo năm cụ thể, vật phẩm.

## 4. Kiểm thử
- Engine: toàn bộ suite xanh (có iztro cài cục bộ); test mới: `test_luc_hao.py`, `test_kinhdich_maihoa_v2.py`, `test_kinhdich_doi_song.py`,
  `test_huyen_khong_v2.py`, `test_phongthuy_doi_song.py`.
- Web: `npm run typecheck`, eslint, Playwright `kinh-dich.spec.ts`, `phong-thuy.spec.ts`.
- Không đổi phép tính cũ, không migration, không dependency → không tăng `ENGINE_VERSION`.

## 5. Đợt 2 (cùng ngày) — chủ dự án duyệt 5 đề xuất mục 3 + CTA cuối bài

| Mục | Đã làm | Tệp chính |
|---|---|---|
| KC-1 khuôn chung | `doi_song_khuon.py` (hộp · chương · mã kiểm chứng `ds.*` · `kiem_giong_van` dùng cho MỌI mảng); **Bản đồ con số** và **Bát tự** trả `phien_ban doi_song_1` (hộp, tóm tắt, căn cứ, câu tự soi; `doan` cũ giữ cho SAO-2 / diễn đạt AI); web dùng một `BaoCaoDoiSongView` (phái kiểm chứng theo `bc.phai`: pitago · tu_binh · nam_phai_viet) | `engine/app/luangiai/{doi_song_khuon,battu_doi_song,ban_do_con_so}.py`, `tests/test_doi_song_khuon.py` |
| KC-2 hồ sơ nhà | `lib/ho-so-nha.ts` (localStorage `hbt.nha.v1`): Đo hướng, Nhà của bạn, Khảo sát, Huyền Không đọc–ghi chung; **migration 0018** `ho_so_nha` (JSON ≤ 16 KB, RLS, đồng ý rõ ràng) + nút "Lưu nhà vào tài khoản"; thẻ **"Tháng này nhà bạn"** ở Hôm nay (`/v1/phongthuy/thang-nay`, đổi theo tiết khí) | `web/lib/{ho-so-nha,tai-khoan-nha}.ts`, `components/huyen-hoc/{ThangNayNha,LuuNhaTaiKhoan}.tsx` |
| KC-3 ý định chung | KB `y_dinh_chung.json` 11 mã ↔ chủ đề Kinh Dịch / ý định Tử vi / trụ nỗi đau thần số / ý định Hôm nay / phòng / chương Bát tự; `GET /v1/y-dinh/goi-mo`; `doc_que.goi_mo`, báo cáo nhà `goi_mo`; web `GoiMoCheo` + link mang `?chu_de=` / `?y_dinh=` / `#noi-dau` chọn sẵn | `engine/app/kb/y_dinh_chung.py`, `app/y_dinh_api.py`, `web/components/khung/GoiMoCheo.tsx` |
| KC-4 nhắc việc | "Nhắc tôi hôm đó" + "Vào lịch" (.ics) ở ứng kỳ và tháng thuận sửa nhà; lưu máy, hiện ở Hôm nay; tài khoản qua `nhac_viec` (0018). Web Push: nghiên cứu + lộ trình GĐ1 (cần duyệt `web-push`, migration 0019, VAPID) — `docs/NHAC-VIEC-VA-WEB-PUSH.md` | `web/lib/nhac-viec.ts`, `components/khung/{NhacToi,NhacHomNay}.tsx` |
| KC-5 tín hiệu ngầm + CTA | mở "Ba cách đọc"/từng phái/lời kinh/bản đầy đủ → PostHog mã + đếm máy (`thoi-quen-doc.ts`, ≥ 5 lần → chế độ mặc định theo phái, người dùng chọn tay thì thôi); `CtaCuoiBai` ở mọi mảng (gợi mở chéo · đọc trọn luận giải / Sao · rủ một người · nạp Sao hoặc ủng hộ). Ý tưởng lan truyền + nạp Sao: `docs/Y-TUONG-VIRAL-VA-NAP-SAO.md` | `web/components/khung/CtaCuoiBai.tsx`, `web/lib/thoi-quen-doc.ts` |

## 6. Đợt 4 (2026-10-22) — Q1–Q7 kiến trúc Drive, đồ thị theo ý định, lưu ý lửa điện

Chi tiết từng việc và trạng thái: `docs/DANH-GIA-KIEN-TRUC-PHONG-THUY-DRIVE.md` mục 6 (bảng Q1–Q8) và mục 7 (ý tưởng mới).
Tệp chính: `engine/app/calc/mat_bang.py` (Q2/Q3), `engine/app/kb/phongthuy_do_thi.py` + `kb/data/phongthuy_do_thi.json` (đồ thị),
`luangiai/phongthuy_bo_cuc.py` (BoCuc 0.2, veto, hai lối, việc theo chi phí, luật căn hộ), `luangiai/phongthuy_doi_song.py`
(trần mức, an toàn, chi phí, theo ý định), `supabase/migrations/0022_*` (Q7), web `KhaoSatNha.tsx` (vẽ mặt bằng), `NhaCuaBan.tsx`
(ý định, góc nhìn, trần mức), `DoHuongDienThoai.tsx` (bản đồ), `components/khung/HoiSau30Ngay.tsx`, `/quan-tri/hoc` (đề xuất luật).
Test: `engine/tests/test_mat_bang.py`, `test_phongthuy_q.py`; e2e `phong-thuy.spec.ts` (2 test mới), `hom-nay.spec.ts` (Q7);
SQL `supabase/kiem_thu/thu_kiem_chung_sau_0022.sql`.
