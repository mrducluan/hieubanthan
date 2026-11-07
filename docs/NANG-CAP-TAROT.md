# TR-1 — Tarot: đánh giá bộ seed Drive, kiến trúc, kho tri thức nền và 3 phương án UI

**Ngày:** 2026-11-07 · Chủ dự án giao: "thêm module huyền học Xem bài Tarot; đọc seed Drive + tài liệu kế hoạch + prompt UI; hệ thống chưa đủ mạnh thì nâng cấp; tìm 3 phương án UI, chọn 1; rà tri thức các trường phái, chưa đủ thì nạp thêm".

Khâu của vòng tăng trưởng: **THU HÚT** (từ khoá "xem tarot online", "lá Tháp nghĩa gì", "The Tower ngược", 78 trang lá bài) + **QUAY LẠI** (lá của ngày đổi mỗi ngày, lịch sử trải bài trên máy, hỏi lại sau 30 ngày qua phiếu Q7 chung) + nền cho **NẠP Sao** sau (bài đọc 7 chương cùng khuôn `doi_song_1` — chương sâu gắn Sao như các mảng khác; chưa bật, hiện miễn phí). Đo: `reading_started/completed{mo_dun=tarot}`, `chart_interacted{mo_dun=tarot, kind=bat_dau|xao|rut|doc_bai|la_ngay}`, phiếu `ds.tarot.*`, hiển thị/nhấp Search Console `/tarot/*`.

## 1. Bộ seed Drive (6 tệp) — đọc hết, kết luận

| Tệp | Nội dung | Dùng được gì | Không dùng — vì sao |
|---|---|---|---|
| Tài liệu "Master Execution Blueprint" (6 bước) | pgvector 1536 + Apache AGE + Neuro-Symbolic + "Hermetic-to-Everyday" + Dual-Loop RLKGF + QC bằng LLM | Khung 4 trường phái (RWS · Thoth/GD · TdM · B.O.T.A.), 4 thuật toán lõi (phẩm giá nguyên tố, hướng nhìn, decan, lá đại diện), 5 chốt QC (không lộ thuật ngữ thô, có cả dự báo lẫn việc làm) | **Không** pgvector/AGE (đã quyết 2026-10-22, KB phải là JSON trong git); **không** Bayes tự cập nhật trọng số cạnh theo phiếu (= máy tự sửa luật, cấm LG-ĐS); **không** `episodic_golden_memories` lưu câu hỏi + bài đọc (trái riêng tư (c)/(d)); **không** DPO fine-tune (torch) — site không huấn luyện mô hình; **không** "dự báo sự kiện cụ thể + ngày dương lịch" (CY-1: nói "nên chú ý", decan chỉ là nhịp gợi ý) |
| `01_Canonical_Tarot_Physiognomy_Seed_Data.json` | 18 lá mẫu (Tháp, 3 Gậy, 16 lá hoàng gia) với vector tướng mạo 6 chiều | Ý "lá hoàng gia ↔ dáng người" → chương "Tướng và lá bài" chọn lá đại diện **cho chính người hỏi** từ ngũ hình Nhân tướng (bộ) × tuổi, giới tính (cấp) | Vector 6 chiều và "khớp cosine với người được hỏi" = đọc tướng người khác (NT-1 cấm) + số tự chế không nguồn; chỉ phủ 18/78 lá |
| `02_Hybrid_GraphRAG_Database_Schema.sql` | DDL pgvector + AGE + bảng feedback/DPO | Hình dáng dữ liệu một lá (số, nguyên tố, chiêm tinh, 4 trường phái) → khuôn `tarot_kb.json` | Không chạy SQL; không bảng mới (phiếu "Đúng với mình" đi qua `kiem_chung_phieu` 0017 có sẵn với mã `ds.tarot.*`) |
| `03_Tarot_Neuro_Symbolic_And_DPO_Engine.py` | Ma trận nguyên tố (+0,5 / −0,7 / +0,1 / Spirit 0,35), gaze, cosine, DPO loss | Ma trận → chuyển thành **quy tắc Book T** (cùng nguyên tố mạnh; Lửa–Nước / Khí–Đất xung, bốn cặp còn lại hợp (nguyên văn Book T "Of the Dignities"); Lửa–Nước, Khí–Đất xung; hai lá kề xung nhau → triệt tiêu) ở `calc/tarot.py`, có golden | Hệ số 0,5/−0,7/0,35 không có nguồn; "Spirit" không phải nguyên tố của lá nào trong Book T; `import torch` |
| `05_Orchestration_Guardrails_And_Bayesian_RLKGF.py` | Router 5 domain + guardrail regex + prompt "chuyên gia 50 năm" + Beta(α,β) | Ý "câu khủng hoảng → hỗ trợ" (đã có MỘT bộ chặn chung `luangiai/an_toan`), ý "zero hermetic leak" (thuật ngữ chỉ ở "Vì sao nói vậy" — quy tắc code sẵn) | Prompt LLM dựng bài đọc (tầng NARRATIVE chỉ diễn đạt gói RULES; TR-1 chưa bật AI — bản mẫu tất định); hệ số tin cậy người dùng + nhân 2,5 = tự sửa luật |
| `06_Celtic_Cross_2D_And_Weighted_DPO_Full_Engine.py` | Kề cận 10 vị trí Celtic Cross, 4 trục, major gravity, DPO phạt thuật ngữ | **Kề cận + trục** → `trai_bai.celtic.ke_can/truc` trong KB; tỉ lệ ẩn chính → chương Tổng quan; danh sách thuật ngữ cấm → `cum_cam` | Điểm hài hoà số (−0,5…+0,5) hiện ra người dùng → không điểm số; DPO |
| Prompt UI "Principal WebGL Engineer" (2 bản) | R3F + drei + three + use-gesture + GLSL gold foil, 5 trạng thái, radar nhân tướng, feedback 1–5 sao | **State machine 5 bước** (hỏi → xáo → rút → lật → đọc), nhấn giữ xáo lấy nhịp tay làm hạt giống, quạt bài, lật 3D, đường nối phẩm giá + mũi tên hướng nhìn trên bàn, 4 khối luận giải | 4 dependency mới + CSP wasm/eval + tải trên điện thoại → phương án B (CSS-3D); radar 6 trục tướng mạo người khác; chấm 1–5 sao → dùng "Đúng với mình / Chưa đúng" + hỏi lại 30 ngày (0022) có sẵn |

**Độ sâu seed: chưa đủ** — 18/78 lá, không có nghĩa xuôi/ngược, không có nghĩa theo lĩnh vực, không có decan đủ 36, không có trải bài 1/3/5 lá, không có câu tự soi / việc nên làm.

## 2. Kho tri thức nền đã nạp (`engine/app/kb/data/tarot_kb.json`, ~300 KB, nháp ban biên tập, `can_doi_chieu`)

Viết lại từ sách **phạm vi công cộng**: *The Pictorial Key to the Tarot* (Waite 1910 — nghĩa bói, mô tả hình), *Book T* (Golden Dawn — 36 decan, tên bí truyền lá số, hoàng gia theo YHVH), *The Tarot* (Mathers 1888), *Le Tarot des Bohémiens* (Papus 1889), hình bài **Marseille Conver 1760** (hướng nhìn nhân vật). *Book of Thoth* (Crowley 1944), *The Tarot* (Case 1947), *La Voie du Tarot* (Jodorowsky 2004) **chỉ tóm ý, không chép** (sách hiện đại — quy tắc kho tri thức). Mạng của phiên này chặn archive.org / sacred-texts / Wikipedia nên không tải PDF được — nội dung viết từ trí nhớ các bản in trên, gắn `can_doi_chieu` (bước sau: mở ctext/sacred-texts đối chiếu nguyên văn như Cốt Tuỷ Phú).

| Khối | Số lượng | Ghi chú |
|---|---|---|
| Lá bài | 78 | tên Việt + Anh + Pháp (TdM) + tên Thoth, số, bộ, nguyên tố, chiêm tinh (hành tinh / cung / nguyên tố), chữ Hebrew + con đường (22 ẩn chính), Sephirah + decan Book T (40 lá số), nguyên tố kép YHVH + nhân vật (16 hoàng gia), hướng nhìn Marseille (−1/0/+1/không), sắc thái xuôi & ngược (sáng / trung / nặng — không phải "tốt/xấu"), từ khoá xuôi & ngược, mô tả hình Waite, ý xuôi, ý ngược, 4 lĩnh vực (tình cảm · công việc · tiền bạc · sức khoẻ theo SK-1), 4 trường phái, việc 0 đồng, câu tự soi; 2 lá có trích Waite nguyên văn |
| Trường phái | 4 | RWS · Thoth/Golden Dawn · Marseille · B.O.T.A. — mỗi phái một "câu hỏi của phái" |
| Bộ · nguyên tố · phẩm giá | 4 · 4 · luật Book T | nhịp thời gian của bộ (Gậy/Kiếm ngày–tuần, Cốc tuần–tháng, Tiền tháng–quý) |
| Cung hoàng đạo · decan · hành tinh | 12 · 36 · 7 | mốc ngày dương lịch phổ biến (±1 ngày tuỳ năm) |
| Trải bài | 5 | 1 lá · 3 lá thời gian · 3 lá lời khuyên · 5 lá chữ thập · Celtic Cross 10 lá — vị trí (toạ độ vẽ), kề cận, trục, trục nhìn, vị trí nhịp thời gian / lời khuyên / trọng tâm |
| Chủ đề | 6 | tình cảm · công việc · tiền bạc · gia đình · sức khoẻ · bản thân (từ khoá nhận diện) |
| Chương bài đọc · mẫu · khái niệm · từ khoá hỏi đáp · `cum_cam` | 7 · ~40 · 7 · 78 lá × bí danh | tên Việt "Tử Thần", "Bánh Xe Vận Mệnh" để lớp đời thường không dính cụm cấm "chết", "số phận" |

**Bước sâu tiếp theo (chưa làm):** (a) đối chiếu nguyên văn Waite / Book T khi mở được mạng; (b) 384 "tổ hợp hai lá" hay gặp (lối Marseille đọc cặp) — chưa có nguồn công cộng đủ, để sau; (c) bài bổ sung SEO-M `bo_sung_la_bai.json` cho 78 trang (bảng thật đã có: decan / 4 trường phái).

## 3. Kiến trúc (giữ 5 tầng, không thêm hạ tầng, không dependency)

```
web: hỏi + chủ đề + trải bài ──► nhấn giữ xáo (SHA-256 cử chỉ → hạt giống hex, chỉ hex rời máy)
      ▼                                        ▼
POST /v1/tarot/xao-bai  CALC calc/tarot.py: blake2b(hạt giống) → Fisher–Yates 78 lá + cờ ngược (hoặc secrets CSPRNG)
      ▼ (web vẽ quạt, NGƯỜI DÙNG rút lá vào vị trí, lật)
POST /v1/tarot/doc-bai  CALC phan_tich: kề cận → phẩm giá Book T (hai lá kề xung nhau → triệt tiêu), sức từng lá, nguyên tố
                        trội/thiếu, tỉ lệ ẩn chính, nhịp số 1–10, hướng nhìn trên trục thời gian; decan → cửa sổ ngày (nhịp gợi ý)
                        RULES luangiai/tarot.py: 7 chương khuôn doi_song_1 — Trải bài nói gì · Từng vị trí (hộp mang lá, vị trí,
                        sức, 4 trường phái ở "Vì sao nói vậy") · Dòng chảy (phẩm giá + hướng nhìn) · Điều bên trong (B.O.T.A.,
                        Thoth) · Nhịp thời gian (decan, "gợi ý, không dự báo") · Việc nên làm 72 giờ (Marseille) · Tướng và lá bài
                        (lá đại diện từ ngũ hình Nhân tướng × tuổi × giới tính — chỉ cho chính mình); ma_mau ds.tarot.*; HỌC ap_hoc chung
POST /v1/tarot/hoi      hỏi đáp tất định: nghĩa lá (78 bí danh Việt/Anh/Pháp, xuôi/ngược, theo lĩnh vực), lá ở vị trí vừa rút,
                        trải bài, 7 khái niệm; an toàn MỘT bộ chặn chung; "người ấy có…?" → chuyển về việc chính mình làm được
GET|POST /v1/tarot/la-ngay   lá của ngày: blake2b(ngày [+ ngày sinh]) — tất định, luôn xuôi, không lưu
Trang KB: kb/trang_tarot.py loại la_bai — 78 trang /tarot/la-bai/{slug} (bảng thật: 4 trường phái, 9 decan của bộ)
```

Quyết định: **không điểm số** (sức lá = được tiếp sức / giữ nguyên / bị kìm; số chỉ ở "Vì sao nói vậy") · **không dự báo** (decan = nhịp gợi ý; không "sẽ xảy ra") · **không đọc người khác** · **không lá ngược là điềm xấu** (người dùng chọn dùng lá ngược hay không) · **câu hỏi không lưu, không trả lại** · **lịch sử chỉ trên máy** · phiếu kiểm chứng qua 0017 (mã `ds.tarot.*`, phái = trường phái của hộp) · không migration, không dependency, không đổi `ENGINE_VERSION`.

## 4. Ba phương án UI — chọn B

| | A. WebGL 3D (R3F + drei + three + use-gesture) | **B. Bàn trải bài CSS-3D (chọn)** | C. Danh sách phẳng |
|---|---|---|---|
| Cách làm | Scene 3D: riffle shuffle, quạt cong, lật mesh, shader gold foil | HTML/CSS: quạt 78 lá bằng `rotate/translate`, lật `rotateY` + `backface-visibility`, đường nối SVG phủ bàn, `motion` sẵn có cho giảm chuyển động | Chọn lá từ lưới, bài đọc ngay |
| Ưu | "Wow" nhất | Không dependency mới (CLAUDE.md), không mở CSP, ~0 KB JS thêm, 60 fps điện thoại, SEO/SSR giữ nguyên, lá vẽ SVG dùng lại cho trang KB + ảnh chia sẻ | Nhanh nhất |
| Nhược | 4 gói (~600 KB), CSP `wasm/eval`, pin + nhiệt điện thoại, không SSR, sập ở máy yếu; chưa xin duyệt dependency | Không có vật lý thật (riffle chỉ là keyframes) | Mất nghi thức xáo – rút – lật (lý do người ta ghé tarot) |
| Kết | Để sau nếu số đo cho thấy người dùng muốn (xin duyệt dependency) | **Làm** | Dùng làm chế độ "giảm chuyển động" bên trong B |

Thành phần: `LaBai` (SVG mặt trước/sau: ẩn chính 22 hình ký hiệu riêng, ẩn phụ xếp đúng số ký hiệu bộ, hoàng gia theo mũ/vương miện; màu theo nguyên tố — hình ký hiệu giản lược do Hiểu Bản Thân vẽ, không chép tranh bộ bài nào), `XaoBai` (nhấn giữ ≥ 0,8 s, gom nhịp tay → SHA-256 trên máy), `QuatBai` (78 lá úp, rê nhô, kéo xoay có quán tính, phím ← → Enter), `BanTraiBai` (ô theo toạ độ KB, lật từng lá, lớp SVG: vàng liền = hợp, hổ phách đứt = xung — không đỏ; mũi tên hướng nhìn), `BaoCaoTarot` (bàn đã lật + `BaoCaoDoiSongView` dùng chung: hộp nổi bật, "Đúng với mình", mục lục), `LaNgay`, `LichSuTarot`; hỏi đáp `KhungChat` nhận cả trải bài vừa rút ("lá thứ 2 nghĩa gì").

## 5. Kiểm

Engine `tests/test_tarot.py` (18 ca: KB đủ 78 / 36 decan không trùng / sạch cụm cấm + SK-1, CALC tất định với golden `fixtures/golden/tarot.json` (phẩm giá, decan, xáo theo hạt giống), phân tích trải bài, báo cáo khuôn + giọng văn, lá đại diện từ Nhân tướng, HỌC hạ hộp, hỏi đáp + an toàn, API, trang KB, BM-1); golden mã kiểm chứng +68 mã `tarot` (mã cũ không đổi); sổ ngày cập nhật +78 trang; toàn bộ engine **9.249 xanh**. Web: typecheck; e2e `tarot.spec.ts` (hỏi → máy xáo → rút 3 lá → lật → bài đọc → hỏi về lá; nhấn giữ xáo bằng cử chỉ; lá của ngày; cụm 78 lá, .md, sitemap, thanh mảng, hub bảy mảng).

## 6. Việc của chủ dự án

Ghi ở `docs/VIEC-CUA-ANH.md` mục TR-1: deploy engine trước web; menu Huyền học đã 12 mục — muốn `/tarot` vào menu thì chọn một mục nhường chỗ (CMS); Search Console yêu cầu lập chỉ mục `/tarot`, `/tarot/la-bai/thap`; (khi mở mạng) đối chiếu nguyên văn Waite / Book T; quyết có bật diễn đạt AI cho bài đọc tarot (hiện bản mẫu tất định, như Nhân tướng).

## 7. Đối chiếu nguyên văn (TR-1b, 2026-11-07)

Mạng của phiên chặn mọi host sách (DNS) kể cả tầng WebFetch → tạo môi trường cloud riêng `hieubanthan` mở đúng các host sách phạm vi công cộng (sacred-texts, archive.org, gutenberg.org, hermetic.com, en.wikisource.org, ctext.org — chủ dự án duyệt). Kết quả:

| Nguồn | Lấy được | Dùng |
|---|---|---|
| Waite, *The Pictorial Key to the Tarot* (1910) | Project Gutenberg #43548 (de Laurence 1918 in lại nguyên văn, qua kho GITenberg trên GitHub) | `engine/fixtures/nguon/tarot_waite_1910.json`: 78 lá — mô tả Part II, nghĩa bói xuôi/ngược (§3, Part II), nghĩa thêm §4, phương pháp Celtic |
| Book T (Golden Dawn, Mathers & Felkin, ~1888–96) | archive.org `book-t-the-tarot` (OCR), 2 bản | `tarot_book_t.json`: 36 lá số + 16 hoàng gia (tên, mô tả, nghĩa), luật phẩm giá, thứ tự decan |
| Papus, *The Tarot of the Bohemians* (bản dịch Anh 1896) | archive.org `tarotofbohemians00papu` | đã tải (`scratchpad`), chưa trích — bảng ý nghĩa OCR dạng cột, cần đọc tay |
| Paul Foster Case, *An Introduction to Tarot* (B.O.T.A., 1922) | archive.org `PaulFosterCase-Bota-IntroductionToTarot-1922` | đã tải, chưa trích (bài giảng 22 Key, OCR nhiễu) |
| Mathers, *The Tarot: Its Occult Signification* (1888) | sacred-texts / hermetic trả 403 với máy → chủ dự án lưu 5/6 chương từ trình duyệt vào Drive "Tarot nguon" (thiếu Introduction, không cần cho KB) | `tarot_mathers_1888.json`: 78 lá xuôi/ngược (Meanings of the Cards, Mathers đánh số 8 = Justice, 11 = Strength), biểu tượng 22 Key, ghi chú Etteilla, 3 cách trải bài; mọi lá có trích Mathers |
| Crowley *Book of Thoth* (1944), Jodorowsky (2004) | không phạm vi công cộng | chỉ tóm ý như cũ |

Test `engine/tests/test_tarot_nguon.py` khoá: mọi câu `trich` trong KB là chuỗi con nguyên văn của fixture (78 Waite + 52 Book T + 78 Mathers); tên Book T khớp; bảng 36 decan = vòng Chaldea từ Hoả tinh ở Bạch Dương decan 1, lá số = 2 + 3 × (thứ tự cung trong nhóm nguyên tố) + decan (đối chiếu độc lập với kho mã MIT `hampshirecottage-ai/ootk-thoth-engine`, chỉ đọc mã — không chép); luật phẩm giá đúng câu Book T.

**Sửa theo nguồn:** 10 tên Book T (`coc_10` "Perpetual" → "Perfected Success"; tên hoàng gia lấy đủ hai vế), 7 lời Waite ẩn chính (Pháp Sư ngược, Hoàng Hậu ngược, Hoàng Đế, Giáo Hoàng, Cỗ Xe, Ẩn Sĩ, Ác Quỷ), và **luật phẩm giá**: Book T viết "Swords are friendly with Cups and Wands; Wands are friendly with Swords and Pentacles" — tức mỗi nguyên tố hợp với HAI nguyên tố không đối nghịch; bản đầu ghi Lửa–Đất, Nước–Khí là trung tính (sai). Golden `tarot.json` và mã kiểm chứng `ds.tarot.dong_chay.*` đổi có chủ đích (chưa có phiếu nào trên production).
