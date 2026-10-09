---
name: huyenhoc-kb
description: Chuẩn viết, sửa và duyệt KHO TRI THỨC Huyền học của HieuBanThan — Tử vi (tuvi_kb.json), Kinh Dịch (kinhdich_kb.json), Bát tự (battu_kb.json), Phong thuỷ (phongthuy_kb.json). Dùng khi thêm/sửa nghĩa sao × cung, tứ hoá, quẻ, thập thần, nhật chủ, du niên, tình huống bố trí nhà; khi duyệt bản nháp AI hoặc đối chiếu nguyên văn cổ thư. Kích hoạt khi nghe "kho tri thức tử vi / kinh dịch / bát tự / phong thuỷ", "thiếu nghĩa sao", "sửa lời quẻ", "duyệt nháp huyền học", "đối chiếu ctext", "cổ thư".
---

# Kho tri thức Huyền học — chuẩn nội dung và quy trình

KB là **tầng 2** (CLAUDE.md). NARRATIVE (template hoặc LLM) chỉ diễn đạt lại những gì có ở đây.
Kiến trúc và nhật ký thực hiện: `docs/KIEN-TRUC-HUYEN-HOC.md`. Thần số có skill riêng `thanso-kb`.

## 1. Bản đồ file (nguồn chân lý là JSON)

| File | Nội dung chính | Đọc qua |
|---|---|---|
| `engine/app/kb/data/tuvi_kb.json` | 12 cung (`xem_duoc`, **`khong_tra_loi`**, `cau_tu_soi`), 14 chính tinh, `sao_cung` 14×12, `do_sang`, `tu_hoa` + `tu_hoa_cung` 4×12, `phu_tinh`, `nhom_cach`, `chu_de_han`, `giai_thich`, `mau`, `luu_y` | `app/kb/tuvi_kb.py` |
| `engine/app/kb/data/kinhdich_kb.json` | 64 quẻ (ý chính, lời khuyên, mặt tối, câu tự soi, 5 lĩnh vực, trích dẫn), bát quái, thể–dụng, dụng thần, giải thích, mẫu | `app/kb/kinhdich_kb.py` |
| `engine/app/kb/data/battu_kb.json` | 10 nhật chủ × 4 mùa, 10 thập thần (khi nhiều/thiếu, nam/nữ), 4 trụ, 5 hành (`ung_dung` = dân gian), 10 cách cục, giải thích | `app/kb/battu_kb.py` |
| `engine/app/kb/data/phongthuy_kb.json` | 8 du niên, 8 quái, `bo_tri` (mỗi mục có `nguon` = `co_thu` / `dan_gian`), `am_trach`, giải thích | `app/kb/phongthuy_kb.py` |

Mỗi file có gốc: `source` (mã sách → tên), `trang_thai` (`nhap_ai` | `da_duyet`), `can_doi_chieu`.
Mục `giai_thich` bắt buộc `tu_khoa` (không dấu, dùng cho bộ định tuyến), `source_id`, `school_id`.

## 2. Luật nội dung (thực thi bởi `scripts/vong_cai_thien_huyenhoc.py kiem-kb` + `tests/test_huyenhoc_kho.py`)

1. **Giọng tham khảo, không phán.** Cấm: "bạn sẽ", "chắc chắn sẽ", "định mệnh", "số phận đã",
   "không thể tránh", "bẩm sinh", "vốn dĩ", "tiền định", "khắc chết", "phá sản"… (danh sách `CAM_KB`
   + `hoi_van.CAM`). Kể cả dùng để phủ định — viết lại câu.
2. **Mặt tối + câu tự soi** cho mọi mục mô tả con người (chính tinh, quẻ, nhật chủ, thập thần). Câu tự
   soi hỏi về hành vi cụ thể, kết thúc bằng `?`.
3. **Ranh giới cứng:** không chẩn đoán bệnh, không phán thọ/tai nạn/kiện tụng/con số tiền, không "khắc"
   người thân, không chọn giờ sinh/đặt tên cho con, không bán vật phẩm "hoá giải". Cung/khối nào hay bị
   hỏi sai (Tật Ách, Tử Nữ) phải có `khong_tra_loi`.
4. **Hai trường phái → trình bày cả hai.** Bát tự: dụng thần phù ức/điều hậu (Trích Thiên Tuỷ) và cách
   cục nguyệt lệnh (Tử Bình Chân Thuyên) — không tự chọn. Tử vi: lá số iztro là khung Trung Quốc, luôn
   có cờ `nam_phai`. Phong thuỷ: quan niệm dân gian gắn `nguon: dan_gian` + lý do thực tế + gợi ý làm được.
5. **Không chép bản dịch còn bản quyền.** Nguyên văn chữ Hán cổ là công cộng; bản dịch Việt hiện đại tự
   diễn giải, chỉ trích dẫn tới sách/chương. Không dùng nội dung GPL/AGPL (iching-shifa, horosa).
6. **Không số lạ.** Nội dung không chứa con số ngoài con số của chính mục (bộ kiểm tra đầu ra chặn số
   không có trong gói bằng chứng). Số thập phân phải đi vào gói dưới dạng chuỗi hiển thị.

## 3. Quy trình thêm/sửa

1. Sửa JSON (`ensure_ascii=False`, thụt 1, giữ khoá).
2. `cd engine && python scripts/vong_cai_thien_huyenhoc.py kiem-kb` → OK cả 4.
3. `python -m pytest -q` (gồm `test_huyenhoc_kho.py`, `test_*_hoi.py`) → xanh.
4. `python scripts/vong_cai_thien_huyenhoc.py do` → không lùi (skill `huyenhoc-tu-cai-thien`).
5. Thêm khoá mới mà RULES cần đọc → sửa accessor trong `app/kb/<module>_kb.py` + `app/hoidap/<module>.py`.

## 4. Duyệt bản nháp AI và đối chiếu nguyên văn

- Toàn bộ 4 file đang `nhap_ai`, `can_doi_chieu: true`, và **được hiển thị** (quyết định 2026-09-30).
- `python scripts/vong_cai_thien_huyenhoc.py doi-chieu > docs/DOI-CHIEU-HUYEN-HOC.md` sinh danh sách
  mục cần kiểm theo sách/chương cho người duyệt.
- **ctext.org cấm cào tự động** (Cloudflare Turnstile + điều khoản; có thể cố ý trả dữ liệu hỏng cho
  scraper). Không bypass. Đường đúng: chủ dự án mua gói đăng ký → dùng JSON API chính thức (api.ctext.org
  — hiện môi trường cloud còn chặn host này) hoặc người duyệt tra tay trên trình duyệt.
- **Duyệt từng trang kiến thức** (EEAT-1): chuyên gia đọc trang trên web → `python scripts/tham_dinh.py danh-dau <url>`
  (sổ `app/kb/data/tham_dinh.json`). Trang hiện "đã thẩm định · ngày", schema `reviewedBy`. Không bao giờ ghi tên
  chuyên gia là **tác giả** của nội dung AI soạn — chỉ chủ biên / thẩm định (`docs/EEAT-VA-CHUYEN-GIA.md`).
- Duyệt xong một file → đổi `trang_thai` thành `da_duyet`, ghi tên người duyệt vào `source`, giữ
  `can_doi_chieu` = false. Duyệt một phần → tách mục đã duyệt ra khoá riêng hoặc ghi chú trong PR.
