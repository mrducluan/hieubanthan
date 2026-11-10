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

Ghi ở `docs/VIEC-CUA-ANH.md` mục TR-1: deploy engine trước web; menu Huyền học: "Xem Tarot" thay "64 quẻ Kinh Dịch" + "Thư viện kiến thức" (chủ dự án chốt 2026-11-07, migration CMS `tr_1_menu_tarot`); Search Console yêu cầu lập chỉ mục `/tarot`, `/tarot/la-bai/thap`; (khi mở mạng) đối chiếu nguyên văn Waite / Book T; quyết có bật diễn đạt AI cho bài đọc tarot (hiện bản mẫu tất định, như Nhân tướng).

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

## 8. TR-2 — trả lời đúng câu hỏi (2026-11-07)

**Ca chủ dự án báo**: "Tôi có nên thay đổi công việc mới không?", trải 3 lá Quá khứ – Hiện tại – Sắp tới = 6 Tiền ngược · Pháp Sư ·
Hiệp sĩ Kiếm ngược → bài đọc chung chung, không trả lời; hai lá xoay ngược làm "6" trông thành "9". Audit tìm ra:

| # | Lỗ hổng | Sửa |
|---|---|---|
| 1 | Câu hỏi chỉ dùng để đoán lĩnh vực; không có lớp nhận ra "có nên / khi nào / A hay B / làm sao / vì sao" | RULES `luangiai/tarot_cau_hoi.py` (9 ý định + 22 loại việc + lĩnh vực + hai lựa chọn), chương mới **"Câu trả lời cho câu hỏi của bạn"** đứng đầu |
| 2 | Lá ngược in nghĩa lĩnh vực của lá XUÔI ("6 Tiền ngược… Trong công việc: thưởng, tăng lương, sếp công bằng") | KB `linh_vuc_nguoc` 78 lá × 4 lĩnh vực |
| 3 | Mức hộp = sức lá bên cạnh → Hiệp sĩ Kiếm NGƯỢC được chip "Thuận" | Mức theo **nghiêng** của lá (KB `nghieng` x/n, lối có–không Waite); sức chỉ làm nặng/nhẹ ¼ |
| 4 | "Lá bên cạnh tiếp sức — mặt sáng dễ hiện" cho cả lá ngược; hộp dòng chảy "lá này bị kìm" không nói lá nào, ngược hộp lá giữa | Lời riêng cho lá ngược; dòng chảy nêu đúng lá, nói lá giữa triệt tiêu |
| 5 | Lá hoàng gia ghép ngược Book T: "King" cưỡi ngựa của Golden Dawn = **Hiệp sĩ** Waite (trường `la_rws` của chính bản Book T) — KB gán cho Vua | Đổi lớp Thoth / Book T / nguyên tố phụ giữa Hiệp sĩ ↔ Vua (4 bộ); test tra Book T theo `la_rws` |
| 6 | Nhịp thời gian lá hoàng gia chỉ "ngày tới tuần" | Vùng 30° Book T (20° cung này → 20° cung sau, nguyên văn trong bản chép; test kiểm tên hai cung) |
| 7 | Hướng nhìn không lật khi lá ngược | Lá ngược → nhân vật quay mặt ngược lại (`lat`) |
| 8 | Câu hỏi không qua bộ chặn an toàn ở bài đọc | `_chan` dùng MỘT bộ chặn chung; khủng hoảng → lời hỗ trợ, không nghiêng |
| 9 | Hiện lá ngược bằng xoay cả lá → số, tên lộn ngược | Chỉ xoay HÌNH, chữ giữ chiều đọc, nhãn **NGƯỢC** + "· ngược" dưới lá |

**Ba cách tiếp cận đã cân**: (A, **chọn**) lớp hiểu câu hỏi tất định + vai trò vị trí theo trải bài + nghiêng từng lá có trọng số;
(B) đếm lá xuôi/ngược kiểu "yes/no tarot" — nhanh nhưng phán, bỏ vị trí và lĩnh vực; (C) để LLM viết câu trả lời — trái
tầng NARRATIVE (không được thêm dữ kiện), tốn hạn mức, vẫn cần lớp A làm gói ngữ cảnh. A làm nền; bật diễn đạt AI sau vẫn dùng A.

**Cách tính nghiêng** (`calc.nghieng_tong`): mỗi trải bài có `vai_tra_loi` trong KB (vị trí trả lời + trọng số, vị trí điều
kiện, lời khuyên, kết cục). Lá "tiến" +1, "có điều kiện" 0, "chưa nên vội" −1; lá được tiếp sức ×1,25, bị kìm ×0,75; trung bình
≥ +0,34 → nghiêng có, ≤ −0,34 → chưa nên vội. Hai lựa chọn: đường B − đường A, chênh ≥ 0,5 mới nói đường nào nghiêng hơn.
Ca của anh: (Pháp Sư +1 ×1 + Hiệp sĩ Kiếm ngược −1 ×2 ×1,25) / 3 = −0,5 → **Chưa nên vội**, kèm "có hợp đồng mới trên giấy
trước khi nộp đơn nghỉ · viết 3 lý do đi / ở · quỹ 3–6 tháng".

**Trải bài mới "Hai lựa chọn"** (5 lá: bạn lúc này · đường A giữ như cũ · đường B thay đổi · điều chưa thấy · lời khuyên) — web
gợi ý khi gõ câu "có nên" / "A hay B" (`/v1/tarot/hieu-cau`, chỉ trả mã + nhãn danh mục, không trả lại câu).

**Bộ câu hỏi**: `fixtures/cau_hoi/tarot_y_dinh_dev.jsonl` (260 câu, agent viết độc lập — dùng để chỉnh luật) và
`tarot_y_dinh_holdout.jsonl` (150 câu, agent khác viết, **đóng băng**, chỉ xem tổng). Ý định: dev 99,2 % · holdout 83,3 % → 89,3 %
(sửa lỗi tổng quát "liệu … có … không" bị xếp thành "có nên", câu dạng hỏi không khớp mẫu thì vẫn đọc như câu hỏi); lĩnh vực:
dev 95,8 % · holdout 83,3 %. Sàn trong test: dev ≥ 97 % / 92 %, holdout ≥ 87 % / 80 %.

**Nội dung mới (nháp ban biên tập, chờ chuyên gia duyệt)**: `linh_vuc_nguoc` (312 câu), `tra_loi` x/n (156), `nghieng` x/n,
`viec_truoc_khi_quyet` theo 22 loại việc, mẫu `mau.tra_loi`. Mã kiểm chứng: thêm 15 mã `ds.tarot.tra_loi.*`, không mất mã cũ.

**Ý tưởng tiếp**: chủ dự án duyệt cả 4 → đã làm ở TR-3 (mục 9).

## 9. TR-3 — bốn ý tưởng sau TR-2 (chủ dự án duyệt 2026-11-07)

| # | Ý tưởng | Làm thế nào | Khâu / đo |
|---|---|---|---|
| 1 | **AI diễn đạt chương trả lời** | `tarot.dien_dat_tra_loi`: AI chỉ viết lại CHƯƠNG "Câu trả lời" thành đoạn liền mạch; nguồn = chính các hộp của chương (lớp A tất định) + đoạn chương — **không câu người dùng gõ** (test khoá), không ngày sinh. Đi qua `luan_giai_van._mot_chuong` → `ai_goi.goi_chat` (RL-1, nhớ theo băm) + bộ kiểm chung `kiem_ai` (số lạ, thuật ngữ lạ, cụm cấm, câu ý mới, độ dài). Thiếu khoá / hết lượt / không qua kiểm → bản mẫu. Chỉ khi có câu hỏi và không bị bộ chặn an toàn; web gửi `dien_dat: true`, đầu bài ghi "Phần trả lời câu hỏi được diễn đạt tự động…". Các chương khác không gọi AI. | QUAY LẠI · `che_do_van` |
| 2 | **Hỏi lại sau 30 ngày** | Đọc bài xong với câu "có nên / A hay B / có thành / khi nào / làm sao" → máy người dùng nhớ MÃ hộp trả lời `ds.tarot.tra_loi.<ý định>.<nghiêng>` + phái + nhãn "Chưa nên vội — đổi sang công việc mới" (không câu hỏi, không lá) vào hàng Q7 (`loai_hoi: tarot`); ≥ 30 ngày sau Hôm nay và `/tarot` hỏi "Bạn có làm theo hướng lá bài nghiêng về không? · Việc đó giờ ra sao?" → phiếu `kiem_chung_sau` (0022, không migration mới). Xem lại trải bài cũ không ghi lại. | QUAY LẠI + HỌC · `feedback_submitted{sau_30, loai_hoi: tarot}` |
| 3 | **Thẻ "Câu trả lời của lá bài"** | Mã HMAC miền `tarot|` (`kyMaTarot`): máy chủ gọi `/v1/tarot/the` (chỉ MÃ ý định / loại việc / lĩnh vực theo danh mục + lá đã rút; mã lạ → 422) để đọc lại nghiêng + tên lá + vị trí rồi ký — client không tự khai. Trang `/the/tarot/[mã]` (noindex) vẽ lại các lá bằng SVG của site + lời mời "Rút bài cho việc của bạn" `?tu=ta.`; ảnh `/og/tarot` 1200×630 + dọc 1080×1350, QR + hieuban.com. | MỜI · `share_created{tarot}` → `share_clicked{ta}` → `referral_signup` |
| 4 | **Trải bài "Khi nào"** (3 lá) | Điều cần xong trước · Dấu hiệu đã tới lúc · Lá nhịp thời gian. Câu "khi nào / bao giờ / bao lâu" gợi trải bài này. Hộp nhịp: lá kết cục trước, không có khoảng ngày thì lá trả lời kế tiếp; khoảng theo decan (lá 2–10, ~10 ngày), vùng 30° Book T (Hiệp sĩ / Hoàng hậu / Vua, ~1 tháng), cung của ẩn chính; không có (Át, Tiểu đồng, ẩn chính theo hành tinh) → nói rõ "không gắn khoảng ngày", không bịa ngày. Trải bài này luôn đọc như câu thời điểm. | QUAY LẠI |

Kèm: web bỏ qua trải bài engine chưa có (deploy lệch — bản web mới đọc bộ bài cũ không còn vỡ trang). Engine 9.383 test + e2e Tarot / Kinh Dịch / Hôm nay 30/30.

## 10. TR-4 — bài đọc bám câu hỏi từ đầu tới cuối (chủ dự án giao 2026-11-08)

Sau TR-3, chương 1 đã trả lời đúng câu hỏi, nhưng từ chương 2 bài đọc quay về lời chung: "Nguyên tố trội: Khí", "Việc nên
làm: trước cuộc tranh luận gần nhất…" cho câu hỏi đổi việc; nhiều thuật ngữ (decan, 20° Kim Ngưu, phẩm giá nguyên tố,
"triệt tiêu") ở chữ hiển thị; một ý lặp hai lần; hai lá "đẩy nhau mạnh lên" được gọi là "chỗ chảy dễ" dù một lá đang ngược.

**Ba cách tiếp cận đã cân** (tiêu chí: người đọc thấy đúng mình, hiểu ngay, muốn đọc hết):

| | Cách | Được | Mất | Kết luận |
|---|---|---|---|---|
| A | AI diễn đạt cả bài | Văn liền mạch | Nguồn vẫn là lời chung → AI chỉ làm lời chung trơn hơn; mỗi bài nhiều lượt AI (hạn mức RL-1, chi phí); bộ kiểm `kiem_ai` loại nhiều chương → bài nửa AI nửa mẫu; trái tinh thần "AI chỉ diễn đạt" khi phải "nối" ý | Loại |
| B | **Bài đọc kể theo câu hỏi, tất định** | Mọi chương gắn với điều được hỏi bằng nghĩa có sẵn của lá trong đúng lĩnh vực; lời thường; không tốn lượt AI; kiểm chứng được từng hộp | Cần thêm KB việc theo lĩnh vực (624 câu nháp) | **Chọn** |
| C | Cá nhân hoá theo ngày sinh ("lá bản mệnh") | Cảm giác "của riêng tôi" | Công thức hiện đại không có trong sách phạm vi công cộng; lệch khỏi câu hỏi; CLAUDE.md đã từ chối lấy số từ ngày sinh khi không có nguồn (P8) | Loại |

**Đã làm (cách B):**
1. **Chương mới "Câu chuyện các lá kể"** (`luangiai/tarot._chuong_cau_chuyen`, ngay sau "Câu trả lời", web mở sẵn): kể các lá
   theo thứ tự trên bàn bằng nghĩa của lá TRONG lĩnh vực được hỏi, đúng chiều xuôi / ngược (Celtic Cross chỉ kể 5 vị trí
   cốt truyện `trai_bai.celtic.cau_chuyen`); một **câu nối** theo nghiêng lá đầu → lá cuối (9 mẫu, `mau.cau_chuyen.noi`;
   trải bài Hai lựa chọn theo phép so đường B − A dùng chung với câu trả lời — `_so_hai_duong`); **Điểm tựa** (lá "tiến"
   nặng nhất) và **Chỗ cần canh** (lá "chưa nên vội" nặng nhất), mỗi hộp kèm câu tự hỏi của CHÍNH lá (lá ngược dùng câu
   "Hỏi mình" của nghĩa ngược) + việc theo lĩnh vực. Không có lá "tiến" thì không bịa điểm tựa. Câu nối vào "Điều quan
   trọng nhất". Câu bị bộ chặn an toàn → không có chương này. Mã `ds.tarot.cau_chuyen.<trải bài>.noi.<đầu>_<cuối>` /
   `.tua.<lá>.<chiều>` / `.canh.<lá>.<chiều>` (chỉ thêm mã, không mất mã cũ).
2. **Việc nên làm trong 72 giờ theo lĩnh vực**: KB `la.<id>.viec_lv.{x,n}.{tinh_cam,cong_viec,tien_bac,suc_khoe}` (624 câu,
   nháp ban biên tập, mỗi câu một việc làm được trong 3 ngày, đúng nghĩa lá trong lĩnh vực và chiều lá; tiền bạc không
   khuyên mua bán / đầu tư; sức khoẻ không tên bệnh). Có lĩnh vực → dùng `viec_lv` (mã thêm đuôi lĩnh vực); không có →
   việc chung như cũ.
3. **Lời thường**: chữ hiển thị không còn decan / độ hoàng đạo / Golden Dawn / Book T / phẩm giá / Marseille / Thoth /
   B.O.T.A. / "triệt tiêu" — tất cả ở "Vì sao nói vậy" (test quét 5 trải bài × xuôi / ngược). Dòng chảy: "kéo hai hướng /
   đẩy nhau mạnh lên / đỡ nhau"; hai lá cùng sức mà một lá đang lệch → "mặt lệch cũng được đẩy theo, dựa vào lá kia để kéo
   về" (không còn gọi là chỗ chảy dễ). Nhịp thời gian: "Lá X đi theo nhịp ngày tới tuần. Trong năm, khoảng 11/05–10/06 là
   lúc chuyện kiểu này dễ rõ nhất." Bỏ đoạn lặp ý "ẩn chính".
4. **Nghiêng đã xét lại theo Waite 1910** (3 chỗ agent ghi cần xem ở TR-2): Ác Quỷ ngược → **có điều kiện** (Waite: "Evil
   fatality, weakness, pettiness, blindness"; lối hiện đại đọc là nới xích → giữa hai cách là "được, nếu đi từng bước");
   4 Gậy ngược giữ **tiến** (Waite: "The meaning remains unaltered"); 8 Cốc xuôi giữ **có điều kiện** (Waite: "the decline
   of a matter"). Test khoá theo nguyên văn fixture.

5. **Web**: chương kể chuyện mở sẵn (`BaoCaoDoiSongView moSan`) và đặt lời kể TRƯỚC các hộp (cờ chương `doan_truoc`).
6. **Sửa kèm**: hỏi đáp Tarot "lá X ngược trong công việc" trả nghĩa XUÔI của lĩnh vực — nay đọc `linh_vuc_nguoc` như bài đọc,
   "Việc nên làm" theo `viec_lv`.

**Mã kiểm chứng**: thêm `ds.tarot.cau_chuyen.*` và `ds.tarot.viec.<lá>.<chiều>.<lĩnh vực>`. Mã `ds.tarot.viec.<lá>.<chiều>`
(không đuôi) chỉ còn ở bài không có lĩnh vực — bài có lĩnh vực đổi sang mã có đuôi **có chủ đích**: chữ trong hộp đã khác,
phiếu cũ không nên gắn vào câu mới (golden sinh lại, 7 mã mẫu đổi).

AI vẫn chỉ diễn đạt chương "Câu trả lời" (TR-3). Không migration, không dependency, không đổi phép tính → không tăng
`ENGINE_VERSION`; **deploy engine trước web** (web cũ hiện chương mới như mọi chương khác; web mới mở sẵn nó).

## 11. TR-5 — học flow đối thủ: tranh lá thật, hỏi dễ hơn, lật là thấy nghĩa (chủ dự án giao 2026-11-10)

Chủ dự án gửi ảnh flow Tarot của meobeostudio.com (khung chat: chip chủ đề có sẵn câu hỏi → chọn trải bài → rút → hàng lá
có tranh + vị trí → danh sách "Ý nghĩa các lá bài" từng lá có link xem đầy đủ → mở khoá luận giải AI).

**Đánh giá**: phần hay của đối thủ là ba chỗ GIẢM MA SÁT và TĂNG CẢM XÚC — (1) không phải nghĩ ra câu hỏi (bấm chip là có câu),
(2) lá có tranh Rider–Waite quen mắt, (3) rút xong thấy ngay nghĩa từng lá theo vị trí (miễn phí) trước khi tới bài luận.
Phần mình hơn: bài đọc mở bằng câu trả lời cho đúng câu hỏi (TR-2…TR-4, tất định, miễn phí), không phán, không đọc hộ người
khác. Chỗ mình thua trước TR-5: ô hỏi trống + 6 chủ đề + lưới 7 trải bài bắt người mới quyết ba việc; lá là ký hiệu trừu
tượng; lật xong lá không nói gì cho tới khi bấm "Đọc bài"; nghĩa từng lá nằm ở chương thứ tư, gập sẵn.

**Chủ dự án chốt** (hỏi 3 câu): tranh **Rider–Waite 1909 màu** · flow **dẫn từng bước trên trang** (không làm lại thành khung
chat) · **chưa đụng Kinh Dịch** (làm Tarot trước, xem số đo).

| # | Đã làm | Ở đâu |
|---|---|---|
| 1 | **Tranh lá thật**: 78 tranh Pamela Colman Smith in năm 1909 (tác giả mất 1951, Waite mất 1942 → hết bản quyền ở VN và Mỹ; KHÔNG dùng bản tô lại 1971 của U.S. Games), 360 px webp, 4,1 MB, tự lưu `web/public/tarot/rws/{mã lá}.webp` (không ảnh ngoài, hợp CSP). Lá ngược xoay cả tranh như lá thật + nhãn NGƯỢC giữ chiều đọc; tên Việt nằm dưới lá. **Thay** quyết định TR-1 "hình ký hiệu tự vẽ, không chép tranh bộ bài nào" và phần "chỉ xoay hình, chữ giữ chiều đọc" của TR-2 (tranh thật có tên tiếng Anh in sẵn nên xoay theo). Mọi nơi vẽ lá đều đồng bộ: 7 trải bài, lá của ngày, Ba lá hôm nay, 78 trang lá, trang nhận thẻ, bản `/en`, và ảnh thẻ chia sẻ `/og/tarot`, `/og/ba-la` (JPEG 240 px trong `web/assets/tarot` — bộ dựng ảnh không đọc webp). | `components/tarot/LaBai.tsx` (`MatTruoc`, `anhLa`) |
| 2 | **Chip "chuyện hay hỏi" + câu mẫu** (12 chip × 2 câu, KB `goi_y_hoi`, engine trả trong `/v1/tarot/bo-bai`): bấm chip → hai câu mẫu → bấm là ĐIỀN vào ô (sửa được). Câu mẫu đều hỏi về việc của chính mình (không "người ấy nghĩ gì"); test engine khoá: không bị bộ chặn, engine nhận ra kiểu câu, đúng chủ đề. Bản tiếng Anh tắt bằng `null`. | `tarot_kb.json`, `test_tarot_tra_loi.py` |
| 3 | **Máy tự chọn trải bài** theo câu hỏi (`hieu-cau` có sẵn từ TR-2 — trước chỉ gợi, phải bấm "Dùng"); nhãn "hợp câu bạn hỏi"; lưới 7 trải bài + 6 mảng dời vào "Đổi trải bài". Người dùng tự chọn thì máy không đè, có nút quay về gợi ý. | `app/tarot/Tarot.tsx` |
| 4 | **Thanh 5 bước** (Hỏi · Xáo · Rút · Lật · Đọc); qua bước Hỏi thì khung hỏi thu thành một dòng "Bạn hỏi … · Trải bài …". | như trên |
| 5 | **"Rút giúp tôi"**: lấy các lá trên cùng của bộ engine đã xáo (web không random) — Celtic Cross 10 lá không còn phải chạm 10 lần. | như trên |
| 6 | **Lật lá nào, nghĩa lá đó hiện ngay** (tranh lớn, vị trí + câu hỏi của vị trí, tên lá, từ khoá ĐÚNG CHIỀU — bộ bài thêm `tu_khoa_nguoc`, link "Xem đầy đủ ý nghĩa lá"); lật đủ → **tự vào bài đọc** sau 1,5 giây. | `components/tarot/YNghiaLa.tsx` |
| 7 | **"Ý nghĩa từng lá" trong bài đọc**: dải tranh các lá ngay dưới bàn bài, chạm một lá (hoặc lá trên bàn) → lời đọc của lá ở đúng vị trí (hộp chương "Từng vị trí" engine đã viết theo lĩnh vực được hỏi) + việc nhỏ nên làm + câu tự hỏi + link trang lá. Mở sẵn lá trọng tâm. Chú giải đường nối / chấm dời vào "Cách đọc bàn bài". | `BaoCaoTarot.tsx` |

**Không lấy của đối thủ**: khoá bài luận sau tiền mặt + giá gạch đếm ngược (bài đọc của mình miễn phí, chương sâu theo SAO-2 khi
bật), câu mẫu đọc hộ người khác ("người ấy có quay lại không"), linh vật, "x bạn mới ghé nhà mình".

**Đo** (khâu THU HÚT → QUAY LẠI): `chart_interacted{mo_dun=tarot, kind=chon_nhom_hoi|goi_y_dien_san{nhom}|rut_giup|xem_nghia_la}`,
tỉ lệ `bat_dau` → `doc_bai` (trước/sau), `reading_completed{mo_dun=tarot}`.

**Kinh Dịch (chưa làm, chờ số Tarot)**: áp được (a) chip việc hay hỏi có câu mẫu dùng chung khuôn `goi_y_hoi`; (b) sau khi gieo
hiện ngay thẻ "Quẻ của bạn nói gì" — quẻ chính · hào động · quẻ biến, mỗi thứ một dòng "Hiểu đơn giản" — trước bài đọc chi tiết;
(c) thanh bước Hỏi · Gieo · Đọc.

Không migration, không dependency, không đổi phép tính → không tăng `ENGINE_VERSION`; **deploy engine trước web** (web mới với
engine cũ: hàng chip tự ẩn, từ khoá lá ngược lúc lật để trống — không vỡ trang).
