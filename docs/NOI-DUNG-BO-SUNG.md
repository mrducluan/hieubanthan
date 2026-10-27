# Nội dung bổ sung trang kiến thức mỏng (SEO-M, chủ dự án duyệt 2026-10-23)

Chủ dự án chốt: làm **cả đợt 1 + đợt 2** (~205 trang), nguồn = **kho tri thức + cổ thư công cộng**, 12 trang
"Ý nghĩa số" (chuyên gia đứng tên tác giả) thêm phần riêng ghi **"Ban biên tập bổ sung"**, hình = infographic vẽ bằng
code cho mọi trang (+ ảnh AI cho vài trang trụ — chờ có dịch vụ tạo ảnh).

| Họ trang (`loai`) | URL | Số trang | Tệp KB |
|---|---|---|---|
| `thap_than` | `/bat-tu/thap-than/*` | 10 | `bo_sung_thap_than.json` |
| `nhat_chu` | `/bat-tu/nhat-chu/*` | 10 | `bo_sung_nhat_chu.json` |
| `nam_ca_nhan` | `/than-so/nam-ca-nhan/*` | 9 | `bo_sung_nam_ca_nhan.json` |
| `no_nghiep` | `/than-so/no-nghiep/*` | 4 | `bo_sung_no_nghiep.json` |
| `tinh_yeu` | `/than-so/tinh-yeu/*` | 12 | `bo_sung_tinh_yeu.json` |
| `nghe` | `/than-so/nghe-nghiep/*` | 12 | `bo_sung_nghe.json` |
| `so` | `/than-so/y-nghia-so/*` | 12 | `bo_sung_so.json` (phần bổ sung ghi "Ban biên tập bổ sung") |
| `so_kep` | `/than-so/so-kep/*` | 43 | `bo_sung_so_kep.json` |
| `cap_so` | `/hop-doi/cap-so/*` | 45 | `bo_sung_cap_so.json` |
| `hoa_cung` | `/tu-vi/tu-hoa/*` | 48 | `bo_sung_hoa_cung.json` |
| `dau_hieu` | `/phong-thuy/dau-hieu/*` | 23 | `bo_sung_dau_hieu.json` (Y5, 2026-10-26; ảnh tóm tắt nền giấy sáng) |

## Khuôn một tệp

```json
{
 "source_id": "bo_sung_<loai>_v1", "school_id": "<pitago | chaldean_cheiro | tu_binh | nam_phai>",
 "trang_thai": "nhap_ai",
 "source": {"ten": "…", "mo_ta": "Ban biên tập Hiểu Bản Thân tổng hợp từ kho tri thức + cổ thư công cộng (nháp AI, chờ thẩm định)"},
 "trang": {
  "<slug>": {
   "muc": [{"tieu_de": "…", "doan": "Câu đầu trả lời thẳng (≤ 45 từ). Câu sau giải thích…"},
           {"tieu_de": "…", "danh_sach": ["…", "…"]}],
   "bang": {"tieu_de": "…", "chu_thich": "…", "cot": ["…", "…"], "dong": [["…", "…"], …]},
   "hoi_dap": [{"hoi": "…?", "dap": "…"}],
   "trich_dan": [{"sach": "Tử Bình Chân Thuyên", "chuong": "Luận …", "nguyen_van": "(tuỳ chọn, ≤ 2 câu)", "phien_am": "…", "nghia": "…"}],
   "y_chinh": ["3–5 ý ≤ 90 ký tự cho ảnh infographic"]
  }
 }
}
```

Engine ghép (`app/kb/bo_sung.py`): mục mới thêm sau nội dung gốc (trước "Câu hỏi tự soi" nếu mục đó đứng cuối), bảng thành một mục có `<table>`, trích dẫn thành
mục "Sách xưa nói gì" + `citation` trong schema, hỏi đáp nối thêm (trùng thì bỏ), `y_chinh` cho ảnh.

## Luật (test `engine/tests/test_kb_bo_sung.py` thực thi)

1. **Trả lời trước.** Câu đầu mỗi đoạn trả lời thẳng câu hỏi của tiêu đề mục, ≤ 45 từ. Tiêu đề mục là câu người ta
   gõ tìm (vd "Chính Tài trong lá số nữ nói gì?", "Năm cá nhân số 5 nên làm gì?").
2. **Một bảng thật** mỗi trang (≥ 2 cột, ≥ 3 dòng), dữ liệu đúng với engine/KB (vd thập thần theo 10 can ngày; năm cá
   nhân theo tháng; cặp số theo 5 quan hệ).
3. **≥ 250 chữ mới / trang**, **phần riêng ≥ 30 %** trong họ trang: viết RIÊNG cho từng trang, không lặp khuôn câu giữa
   các trang (đổi ví dụ, tình huống, câu hỏi).
4. **Giọng tham khảo, đời thường, câu ngắn.** "Thường", "sách xưa mô tả", "nhiều người…". Cấm "bạn sẽ", "định mệnh",
   "bẩm sinh", doạ, "đại kỵ", vật phẩm/giải hạn, giọng AI (`cum_cam`). Có mặt tối + gợi ý làm được trong tuần.
5. **Sức khoẻ** chỉ nói nhịp sinh hoạt / phòng ngừa, luôn kèm câu "không thay lời bác sĩ". Không tên bệnh, không
   chẩn đoán, không tiên đoán năm ốm.
6. **Nguồn thật, không bịa.** `trich_dan` ghi sách (+ chương) có thật, phạm vi công cộng: Tử Bình Chân Thuyên, Uyên Hải
   Tử Bình, Trích Thiên Tuỷ, Tam Mệnh Thông Hội, Tử Vi Đẩu Số Toàn Thư, Cheiro *Book of Numbers* (1926)… Nguyên văn
   **chỉ khi chắc chắn đúng chữ** (≤ 2 câu, kèm phiên âm + nghĩa); không chắc → bỏ `nguyen_van`, chỉ ghi sách + chương +
   tóm ý ở `nghia`. Thần số Pythagoras không có cổ thư → ghi truyền thống ("Thần số học Pythagoras — hệ thống phổ
   biến") và tóm ý. Không chép sách hiện đại còn bản quyền.
7. **BM-1:** không nêu thư viện, công cụ, bộ đối chiếu, tên tác giả hiện đại trong danh sách nội bộ (Balliett, Jordan…).
8. **Không mâu thuẫn** với nội dung trang hiện có (`trang.lay(loai, slug)`), không lặp lại nguyên câu của nó.
9. **EEAT:** nội dung là nháp của ban biên tập; không ghi tên chuyên gia vào nội dung.

Sau khi sửa KB: `python scripts/ngay_cap_nhat.py` (sổ ngày sửa), `python -m pytest -q tests/test_kb_bo_sung.py`.
