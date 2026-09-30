---
name: thanso-kb
description: Chuẩn viết và sửa KHO TRI THỨC thần số học của HieuBanThan (engine/app/kb/data/thanso_*.json). Dùng khi thêm/sửa nghĩa số theo lĩnh vực, cặp số hợp đôi, mũi tên biểu đồ ngày sinh, chỉ số phụ, nợ nghiệp, giải thích kỹ thuật, mẫu trả lời cố định; khi duyệt bản nháp AI; khi nạp KB lên Supabase. Kích hoạt khi nghe "kho tri thức", "KB thần số", "viết thêm nội dung số", "thiếu nghĩa", "duyệt nháp", "seed Supabase thần số".
---

# Kho tri thức thần số — chuẩn nội dung và quy trình

KB là **tầng 2** trong 4 tầng (CLAUDE.md). Tầng NARRATIVE (template hoặc LLM) chỉ
được diễn đạt lại những gì có ở đây. KB thiếu → câu trả lời im lặng; KB sai →
sản phẩm nói sai. Vì vậy mọi thay đổi KB đi qua đúng quy trình dưới đây.

## 1. Bản đồ file (nguồn chân lý là JSON, không phải SQL)

| File | Nội dung | Ai đọc |
|---|---|---|
| `thanso_meanings.json`, `thanso_depth.json` | v1: nghĩa chung 12 số, đỉnh cao, thử thách, năm cá nhân | `app/kb/store.py` (có Supabase) |
| `thanso_linh_vuc.json` | 12 số × 11 lĩnh vực: `xu_huong` · `mat_toi` · `goi_y` · `cau_tu_soi` | `app/kb/thanso_v2.py` |
| `thanso_cap_so.json` | 45 cặp 1–9: `hoa` · `va` · `cung_lam` | như trên |
| `thanso_bieu_do.json` | ô số 1–9 (thiếu/1/2/3+ lần), 8 mũi tên đủ, 8 mũi tên trống | như trên |
| `thanso_chi_so_phu.json` | số ngày sinh 1–31, thái độ, trưởng thành, tháng/ngày cá nhân, nợ nghiệp, bài học nghiệp | như trên |
| `thanso_giai_thich.json` | giải thích kỹ thuật + `tu_khoa` (không dấu) để bộ định tuyến khớp | như trên + `app/luangiai/hoi.py` |
| `thanso_xu_ly.json` | mẫu cố định (khủng hoảng, từ chối, cần thêm dữ liệu) + lời lưu ý theo lĩnh vực | như trên |

Lĩnh vực nội dung: `ban_than, tinh_yeu, gia_dinh, con_cai (làm cha mẹ), tre_em (tính cách trẻ),
su_nghiep, tai_chinh, hoc_tap, suc_khoe (tinh thần), ban_be_xa_hoi, cuoc_song`.

## 2. Luật nội dung (test `engine/tests/test_kb_v2.py` thực thi)

1. **Có nguồn.** Mỗi file có `source_id`, `school_id`, `trang_thai` (`nhap_ai` | `da_duyet`).
   Nguồn mới → thêm vào `source` của file VÀ vào bảng `sources` (migration).
2. **Chống Barnum.** Mỗi mục số × lĩnh vực bắt buộc có `mat_toi` và `cau_tu_soi` (kết
   thúc bằng dấu `?`). Câu tự soi phải hỏi về HÀNH VI cụ thể có thể trả lời "có/không",
   không hỏi cảm nhận mơ hồ.
3. **Giọng tham khảo.** `xu_huong` phải là mô tả truyền thống: "thường…", "được mô tả là…".
   Không khẳng định con người.
4. **Cấm** (test chặn): "bạn sẽ", "chắc chắn sẽ", "định mệnh", "số phận", "không thể tránh",
   "bẩm sinh", "vốn dĩ", "lời nguyền", "xui xẻo", "tai hoạ", "chết", "phá sản"… Không dự đoán
   sự kiện, không khuyên đầu tư cụ thể, không nói về bệnh.
5. **Cụ thể hơn chung chung.** Phép thử: câu này có mô tả SAI một người nào không? Nếu
   không sai với ai → viết lại. Gợi ý phải là một việc làm được trong tuần này.
6. **Không sao chép sách.** Viết lại bằng lời mình; tên mũi tên/thuật ngữ phổ biến được
   dùng nhưng không chép đoạn văn của tác giả còn bản quyền (David A. Phillips, v.v.).
7. **Không số lạ.** Nội dung không chứa con số ngoài con số của chính mục đó (bộ kiểm tra
   đầu ra chặn số không có trong gói bằng chứng).
8. **Số cái** (11, 22, 33): viết riêng như bản "cường độ cao" của 2/4/6, kèm mặt tối về áp
   lực — không tô vẽ "người được chọn".

## 3. Quy trình thêm/sửa

1. Sửa JSON (giữ khoá, thứ tự, `ensure_ascii=False`, thụt 1).
2. `cd engine && python -m pytest -q` — phải xanh (gồm `test_kb_v2.py`, `test_hoi_*`).
3. `python scripts/vong_cai_thien.py do` — không được lùi chỉ số (xem skill `thanso-tu-cai-thien`).
4. `python scripts/sinh_seed_thanso_v2.py` → cập nhật `supabase/seed_thanso_v2.sql`.
5. Commit cả JSON + seed trong cùng PR.

## 4. Duyệt bản nháp AI → `da_duyet`

Quyết định 2026-09-30: bản nháp **được hiển thị**. Duyệt dần:
- Người có nghề đọc từng mục theo checklist mục 2; sửa trực tiếp.
- Khi cả file đạt → đổi `trang_thai` của file thành `da_duyet` (hoặc tách mục đã duyệt ra
  nguồn mới nếu chỉ duyệt một phần) và ghi tên người duyệt vào `source.luu_y`.
- Web tự bỏ nhãn "bản nháp" khi `trang_thai = da_duyet`.

## 5. Nạp lên Supabase

Chỉ chủ dự án làm (cần quyền SQL Editor): chạy `supabase/migrations/0003_kb_thanso_v2.sql`
rồi `supabase/seed_thanso_v2.sql`. Engine hiện đọc KB v2 từ FILE; bật đọc Supabase cho
v2 là việc riêng (cần sửa `app/kb/thanso_v2.py` theo mẫu `store.py`, có cache + dự phòng file).
