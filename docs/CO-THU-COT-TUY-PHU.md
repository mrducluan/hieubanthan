# Cổ thư Tử vi — Đẩu Số Cốt Tuỷ Phú (TV-CTP, 2026-11-04)

Đề xuất 1 của `docs/HOC-TU-ZIWEI-DOUSHU.md` mục 5. Khâu THU HÚT (trang trụ cổ thư, liên kết vào ~55 trang sao / sao ở cung /
Hoá ở cung) · đo bằng hiển thị / nhấp Search Console của `/tu-vi/co-thu/*` và lượt bấm từ mục "Đẩu Số Cốt Tuỷ Phú nói gì".

## 1. Nguồn nguyên văn (cổng PHASE 1)

| Đã thử | Kết quả |
|---|---|
| Kanripo (Tục Đạo Tạng, `KR5h0055` = DZ1485 《紫微斗數》) | Có, nhưng là bộ **"thập bát phi tinh"** khác hẳn, **không có** 骨髓賦 → không dùng |
| zh.wikisource.org, archive.org (ảnh quét bản khắc Nam Dương Đường 1600) | Môi trường cloud chặn |
| Kho 殆知閣 (daizhige) | Không có 紫微斗數全書 |
| `ziwei-doushu/lib/classics` | **Không dùng** — văn hiện đại giả cổ |
| **Wikisource 紫微斗數全書/全覽, bản sửa `oldid=850734`** — ảnh chụp cố định trong repo `maker-luder/aion-governance-framework` (Apache-2.0), có mã băm sha256 `760c3a8e…31b1` khớp sổ tải của repo đó | **Bản chính.** Mục 斗数骨髓赋, 84 dòng, viết giản thể. Văn bản đời Minh là công cộng; lớp trình bày Wikisource CC BY-SA (ta không chép trình bày, chỉ chữ) |
| `SylarLong/iztro-docs` (MIT) `zh_TW/learn/ancientBook-1.md` | **Bản phồn thể đối chiếu.** Trùng bản chính 1.522/1.522 chữ; mọi chỗ khác là cặp giản–phồn chuẩn, trừ 罗/陀 ở câu 52 |
| `zaoxu001/tianzhi-classics` (MIT mã + metadata) | Cùng gốc Wikisource (giản thể) — xác nhận lại, không độc lập |

Chữ phồn thể lấy theo vị trí từ bản đối chiếu, rồi sửa lỗi chuyển chữ một-nhiều: 鬥→斗, 幹→乾, 呂後→呂后, 誌→志, 兇→凶,
萬鐘→萬鍾. Giữ nguyên chữ của bản chính và ghi chú công khai ở 3 chỗ nghi: câu 27 汲 (văn cảnh gợi 級), câu 71 稿 (gợi 槁),
câu 52 羅 (bản khác chép 陀). Không tự dựng lại chữ nào theo trí nhớ.

**Việc còn lại (chủ dự án / người duyệt):** đối chiếu 84 câu với ảnh quét bản khắc Nam Dương Đường 1600 (Internet Archive
`20260506_20260506_1217`) hoặc một bản in giấy; xong thì đổi `can_doi_chieu` của từng câu. Phiên âm, nghĩa, dòng "khi" là
nháp ban biên tập, chờ chuyên gia đọc (EEAT-1 — trang ghi "Ban biên tập", không ghi tên chuyên gia là tác giả).

## 2. Dữ liệu và trang

- KB `engine/app/kb/data/tuvi_co_thu.json` (`source_id` `cot_tuy_phu`, `school_id` `tu_vi_dau_so`): 84 câu × {nguyên văn,
  phiên âm, nghĩa đời thường, `sao`, `cung`, `hoa`, `cach_cuc`, `khi`, `chu_thich`, `ban_doi_chieu`}, 12 phần. Nguồn nội bộ
  chỉ ở KB, engine không trả ra (BM-1).
- 37 cách cục trong `tuvi_cach_cuc.json` được điền `co_ca` (chỉ phiên âm, quyết định 2026-10-02) + `co_ca_nguon`.
- Trang trụ `/tu-vi/co-thu/cot-tuy-phu` (cụm `/tu-vi/co-thu`, loại `co_thu`, `engine/app/kb/trang_co_thu.py`): một trang
  cho cả bài (không tách trang từng phần — tránh trang mỏng), mỗi phần một H2, mỗi câu neo `#cau-n`, bảng cách cục lấy
  điều kiện từ KB cách cục, schema Article + citation + FAQPage + breadcrumb, bản `.md`, sitemap, thanh mảng "Cổ thư".
- Trang sao (14), sao ở cung (31), Hoá ở cung (10) có mục "Đẩu Số Cốt Tuỷ Phú nói gì": tối đa 2 câu, mỗi câu ≤ 2 câu nguyên
  văn (SEO-M), link về trang trụ. Chưa có trang cách cục riêng nên chưa có link từ cách cục.
- Lời phán nặng (nghèo khó, mất sớm, câu phê phụ nữ) giữ nguyên văn, phần nghĩa đọc lại theo cách sống ngày nay. Sức khoẻ
  (chủ dự án 2026-11-04): được nêu cơ quan / hệ cơ thể và khuyên khám định kỳ; cấm tên bệnh, chẩn đoán, đoán ốm, đoán thọ;
  luôn kèm "không thay lời bác sĩ" (`engine/tests/test_tuvi_co_thu.py`).

Đợt sau có thể: Nữ mệnh Cốt Tuỷ Phú, Thái Vi Phú (cùng bản chép, cùng khuôn `co_thu`).
