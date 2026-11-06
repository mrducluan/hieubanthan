# NT-1 — Nhân tướng học: đánh giá bộ seed Drive, kiến trúc, kho tri thức nền và 3 phương án UI

**Ngày:** 2026-11-06 · Chủ dự án giao: "thêm module huyền học Nhân tướng học; đọc seed Drive + tài liệu kế hoạch; hệ thống chưa đủ mạnh thì nâng cấp; tìm 3 phương án UI, chọn 1; kho PDF chưa sâu thì tự nghiên cứu nạp thêm nền móng".

Khâu của vòng tăng trưởng: **THU HÚT** (từ khoá "xem tướng mặt", "nốt ruồi ở…", "Ấn Đường", 25 trang bộ vị) + **QUAY LẠI** (bài đọc riêng, "năm nay nhìn vào đâu" đổi theo tuổi, việc 0 đồng soi lại sau 3 tháng) + nền cho **NẠP Sao** sau (chương sâu gắn Sao như các mảng khác — chưa bật). Đo: `reading_started/completed{mo_dun=nhantuong}`, `chart_interacted{mo_dun=nhantuong, kind=khao_sat_xong|bai_doc|do_tam_dinh|doc_anh}`, phiếu `ds.nhantuong.*`, hiển thị/nhấp Search Console `/nhan-tuong/*`.

## 1. Bộ seed Drive (10 tệp) — đọc hết, kết luận

| Tệp | Nội dung | Dùng được gì | Không dùng — vì sao |
|---|---|---|---|
| `01_init_hybrid_physiognomy_schema.sql` | pgvector 1536 + Apache AGE + bảng luật + `fn_update…weight` (EMA) | Ý tưởng 5 trường phái, cấu trúc "điều kiện → lời đời thường → giải pháp" | **Không chạy**: trái 5 tầng (KB phải là JSON trong git, không bảng SQL; không AGE — đã quyết 2026-10-22; không pgvector khi chưa có nguồn embedding); bảng `feedback_logs` lưu `user_id` + snapshot đặc trưng → trái quy tắc riêng tư (d); trọng số tự cập nhật theo phiếu = máy tự sửa luật (cấm, LG-ĐS) |
| `02_…master_seed_data.sql`, `02b_…32_rules.sql`, `02_seed_physiognomy_data.py` | 37 câu phú + 37 luật, 5 trường phái | **Đối chiếu + viết lại** thành đặc điểm KB (ghi nguồn `seed_chu_du_an` nội bộ, hiển thị "Ban biên tập") | Lời sức khoẻ nêu "huyết áp, mỡ máu, Frank sign…" → viết lại theo SK-1; một số câu phú ghi nguồn gộp ("Ma Y & Toàn Biên") chưa đối chiếu → `can_doi_chieu` |
| `03_multimodal_intake_engine.py` | 468 điểm MediaPipe + CIELAB + 3 câu trắc nghiệm | Ý "tỉ lệ ba đình từ 4 điểm" → `calc.tam_dinh_tu_diem` (người dùng tự chấm, ảnh không rời máy) | MediaPipe/OpenCV = dependency mới + nhận diện khuôn mặt tự động trên máy chủ (dữ liệu sinh trắc) — không làm khi chưa có quyết định pháp lý; ngưỡng CIELAB không có nguồn đối chiếu |
| `04_05_multi_agent_orchestrator.py` | 5 sub-agent LLM + điểm tổng hợp 0,35/0,25/0,20/0,20 + Δ Mệnh–Tướng | Ý "hình × hành lá số cần bù" → chương "Tướng và lá số" (quan hệ sinh/khắc, không điểm) | **Không điểm số** (quy tắc mọi mảng); không LLM ở tầng luận; "bucket 78 + 8×w" là số tự chế |
| `06_fastapi_router…` | `/analyze`, `/feedback` ghi EMA | Hình dáng route | Phiếu đi qua `kiem_chung_phieu` (0017) có sẵn — không bảng mới |
| `pdf_to_hybrid_rag_ingestor.py` | PyMuPDF → LLM structured output → DB | — | KB do người viết/duyệt; không "LLM đọc PDF sinh luật" |
| `03_06_…guide.md` + tài liệu kế hoạch 6 phase | Kế hoạch tổng | Khung 5 trường phái, lớp 2 tầng (đời thường / học thuật) | — |

**Độ sâu kho PDF/seed: chưa đủ.** 37 luật phủ ~20 % tri thức nền: thiếu 13 bộ vị trung tâm, 100 vị trí lưu niên, Ngũ hình, các kiểu mắt/mày/mũi/miệng/tai, khí sắc 5 màu × 5 tạng, nốt ruồi, và không có câu hỏi tự quan sát cho từng lựa chọn (chỉ có ngưỡng máy đo).

## 2. Kho tri thức nền đã nạp (`engine/app/kb/data/nhan_tuong_kb.json`, nháp ban biên tập, `can_doi_chieu`)

Viết lại từ cổ thư **phạm vi công cộng**: Ma Y Thần Tướng, Thần Tướng Toàn Biên, Liễu Trang Thần Tướng, Băng Giám, Thuỷ Kính Tập, Hoàng Đế Nội Kinh (Linh Khu Ngũ Sắc), Tâm Tướng Thiên + quan niệm dân gian Việt Nam. Không chép sách hiện đại.

| Khối | Số lượng | Ghi chú |
|---|---|---|
| Trường phái | 5 | Tam đình–Ngũ quan–12 cung · Tàng thần–Khí sắc · Cốt pháp–Nhục pháp · Y tướng · Tâm/Động/Thanh tướng |
| Bộ vị (vùng vẽ) | 25 | 13 bộ vị trung tâm + ngũ quan + 12 cung + gò má/hàm/tai; mỗi bộ vị: vị trí, cung, hệ cơ quan Nội Kinh, tuổi lưu niên |
| Lưu niên vận khí | 100 vị | tuổi 1–100, nam tả nữ hữu (`calc.luu_nien`), 76–99 vòng 12 chi |
| Khảo sát tự quan sát | 31 câu / 6 bước | mỗi câu có hướng dẫn soi gương; mọi lựa chọn đều có ít nhất một đặc điểm (test khoá) |
| Đặc điểm (luật) | 123 | đơn + tổ hợp; mỗi cái: mức (thuận/cân bằng/cần lưu ý/none), chương, lời 2–3 câu, việc 0 đồng, hệ cơ quan (SK-1), trích Hán Việt + nguồn |
| Ngũ hình | 5 + pha | bảng điểm công khai `ngu_hinh_luat` (trội ≥ 2, hơn hành nhì ≥ 1) |
| Khí sắc | 6 | 5 màu × tạng (Nội Kinh) + sắc nhuận — chỉ lời phòng ngừa |
| Nốt ruồi | 13 vị trí | trung tính, luôn kèm "đổi màu/cỡ → da liễu" |
| Hỏi đáp | từ khoá bộ vị / cung / nốt ruồi / tuổi + từ chối xem người khác, tuyển dụng, sửa tướng | an toàn dùng MỘT bộ chặn chung (`luangiai/an_toan`) |

**Bước sâu tiếp theo (chưa làm, cần chủ dự án duyệt nguồn):** nạp **nguyên văn** chương "Lưu niên vận khí bộ vị ca", "Thập nhị cung" của Thần Tướng Toàn Biên từ bản số hoá Wikisource/kanripo (như Cốt Tuỷ Phú TV-ZW) thành cụm cổ thư có phiên âm + nghĩa — trang hiện mới trích câu ngắn.

## 3. Kiến trúc (giữ 5 tầng, không thêm hạ tầng)

```
tra_loi {mã câu: mã lựa chọn}  ──►  CALC calc/nhan_tuong.py   (khớp luật, ngũ hình, lưu niên, tam đình từ 4 điểm, gộp mức)
      (lưu trên máy)                 ▼
                                RULES luangiai/nhan_tuong.py  (8 chương khuôn doi_song_1, hộp có ma_mau ds.nhantuong.*, phai = trường phái)
                                     ▼                          + hỏi đáp tất định; HỌC: ap_hoc dùng chung (≥100 phiếu & <40 % → hạ hộp)
                                NARRATIVE narrative/doc_anh_mat.py (MẶC ĐỊNH TẮT: chỉ gắn nhãn lựa chọn, can_xac_nhan)
Web: /nhan-tuong (TrangCongCu) · /nhan-tuong/bo-vi/{25 slug} (loại trang bo_vi, kb/trang_nhan_tuong.py) · API proxy /api/nhan-tuong/*
```

Quyết định: **không điểm số** · **không "hung/xấu/hình khắc/thọ yểu"** (test cụm cấm chung + riêng) · **chỉ tướng của chính người tự quan sát** (từ chối sếp/nhân viên/người yêu, tuyển dụng, chọn đối tác) · **sức khoẻ theo SK-1** (hệ cơ quan + đi khám + miễn trừ) · **ảnh không rời máy** (chấm 4 điểm trên trình duyệt; máy đọc ảnh mặt chỉ khi `NHAN_TUONG_DOC_ANH=1` và người dùng tích từng lượt — dữ liệu sinh trắc) · **Tướng và lá số** chỉ đọc hành dụng thần hai cách của Bát tự, nói quan hệ sinh/khắc, không chọn cách. Không migration, không dependency, không đổi `ENGINE_VERSION`.

## 4. Ba phương án UI — chọn A

| | A. Gương soi có hướng dẫn (chọn) | B. Chấm điểm trên ảnh | C. Thẻ lật theo bộ vị |
|---|---|---|---|
| Cách nhập | 31 câu / 6 bước, chip chọn một, bản đồ mặt sáng đúng vùng đang hỏi | Ảnh trên máy, kéo 9–11 điểm → máy đo tỉ lệ | Mỗi bộ vị một thẻ vuốt (kiểu TikTok) |
| Ưu | Không ảnh → không lo sinh trắc; tự quan sát = "được hiểu" (THIET-KE-UI §2); hoạt động trên mọi máy; dễ CMS hoá chữ | "Wow", có số đo | Vui, chia sẻ được |
| Nhược | Hơi dài (5 phút) | Tự đặt điểm sai nhiều; người dùng ngại ảnh mặt; chỉ đo được hình, không đo thần/sắc/giọng | Khó biểu đạt câu hỏi có hướng dẫn; 31 thẻ còn dài hơn |
| Kết | **Làm**, lấy phần tốt của B: "Đo ba đình trên ảnh (ảnh không rời máy)" 4 điểm, điền sẵn câu tam đình | Ghép vào A | Để sau nếu số đo bỏ dở giữa khảo sát cao |

Thành phần: `BanDoMat` (SVG 22 vùng, tô theo mức, vùng lưu niên năm nay sáng, bấm → cuộn tới chương; vẽ tĩnh cho trang kiến thức), `KhaoSatGuong` (6 bước, lưu máy, "Xem bài đọc ngay" từ 6 câu), `ChamDiemAnh`, `DocAnhMat` (ẩn khi tắt), `BaoCaoNhanTuong` (dùng lại `BaoCaoDoiSongView`: hộp nổi bật, "Đúng với mình", mục lục), hỏi đáp `KhungChat` (vùng vừa hỏi sáng trên bản đồ).

## 5. Kiểm

Engine `tests/test_nhan_tuong.py` (18 ca: KB đủ/khớp, cụm cấm + SK-1, CALC tất định, báo cáo khuôn, HỌC hạ hộp, hỏi đáp, an toàn, đọc ảnh tắt + không log ảnh, API, trang KB, BM-1); golden mã kiểm chứng thêm 92 mã `nhantuong` (mã cũ không đổi); sổ ngày cập nhật +25 trang; toàn bộ engine 9.157 xanh. Web: typecheck; e2e `nhan-tuong.spec.ts` (khảo sát → bài đọc → hỏi đáp; cụm, .md, sitemap, hub, thanh mảng) + hub/menu/minh hoạ.
