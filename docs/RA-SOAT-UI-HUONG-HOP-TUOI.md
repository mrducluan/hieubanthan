# Rà soát UI "Hướng hợp tuổi" (UI-HHT, 2026-11-18)

Phạm vi: `/phong-thuy/huong-hop-tuoi` (mục lục 46 năm × nam/nữ) và 8 trang cung phi `/phong-thuy/huong-hop-tuoi/cung-*`.
Khâu tăng trưởng: **THU HÚT** (trang SEO có nội dung riêng, ảnh, công cụ ngay trên trang) → **trải nghiệm / QUAY LẠI**
(người đọc thấy la bàn của chính mình, đi tiếp sang công cụ đo hướng). Đo: `chart_interacted{mo_dun=phongthuy,
kind=tra_huong_tuoi|la_ban_tra_tuoi|la_ban_cung|hai_cung}`, `cross_cta_clicked{tu=tra_huong_tuoi}`, hiển thị / nhấp Search
Console của 9 URL, lượt vào `/phong-thuy` từ hai trang này.

## 1. Engine có gì mà trang chưa dùng (trước UI-HHT)

| Tri thức engine đã có | Trước | Sau |
|---|---|---|
| Thứ hạng 4 hướng tốt (Sinh Khí → Thiên Y → Diên Niên → Phục Vị) | có trong dữ liệu, la bàn tô cùng một màu | la bàn tô đậm nhạt theo hạng + số hạng |
| Câu đời thường từng du niên (`phongthuy_doi_song.du_nien_doi_thuong`) | không | bảng chi tiết + mục gập từng hướng |
| Câu sách xưa từng du niên (`du_nien.*.sach`) | không | bảng chi tiết |
| Khoảng độ + 3 sơn của từng hướng | không | bảng chi tiết, mục gập, bản .md |
| Chín điều sách dặn theo cung (`phongthuy_cung_menh.json`) | chỉ ở công cụ cá nhân | trang cung, **chỉ nhóm A/B** |
| Lệ vợ chồng khác nhóm (Dương Trạch Thập Thư) + cách làm phổ biến | không | trang cung + công cụ hai người |
| Quy tắc số 5 (nam gửi Khôn, nữ gửi Cấn), cùng năm nam nữ khác cung | không giải thích | khối "Vì sao cùng năm mà khác cung?" + ví dụ |
| Hướng kiêng của năm (`pt.sao_nam`) chồng lên hướng tốt | không | khối "Năm N: hướng tốt nào cần giữ yên" |
| Nhà vệ sinh, bàn thờ theo du niên (`bo_cuc.vi_tri_phong`) | không | thêm vào khối bố trí |
| `thong_tin.tinh_chat` của cung | engine trả, web bỏ | dòng giới thiệu cung |
| Hướng chung hai năm sinh khác nhau | không có route | `POST /v1/phongthuy/hai-cung` |

Không đưa lên trang: 64 cặp cửa – chủ / bếp – cửa của Dương Trạch Tam Yếu (nói về **ngôi nhà**, không về tuổi; đa số là
nhóm C — để ở Khảo sát nhà như hiện nay).

## 2. Ba hướng làm, đánh giá

| Hướng | Lợi cho người đọc | Rủi ro | Kết luận |
|---|---|---|---|
| **A. Tra một chạm + la bàn sống có thứ hạng** | trả lời "tôi sinh năm X hợp hướng nào" trong 5 giây, có hình | chỉ đẹp hơn mà không sâu hơn | **chọn làm khung** |
| B. Hồ sơ cung phi đầy đủ (mọi tri thức, chia tab) | sâu, nội dung riêng từng cung tốt cho SEO | bức tường chữ; nhóm C không lên được trang công khai | lấy phần tinh, **gập lại** |
| C. Nhà ảo kéo thả cửa / giường / bếp | hấp dẫn về hình | trùng Khảo sát nhà ở `/phong-thuy`, nặng JS, không cần cho SEO | loại |

## 3. Năm điểm em tự chốt (chủ dự án giao 2026-11-18)

1. **Tra năm sinh ở mục lục hiện la bàn ngay tại chỗ** (không chuyển trang), kèm link sang trang cung đúng dòng năm.
   Dữ liệu là bảng engine đã trả cho trang — trình duyệt không gọi engine, không tính.
2. **Chỉ nhóm A/B** của chín điều trên trang công khai (`sach_ghi_mon.phongthuy(tuoi=None)` tự bỏ nhóm C) — trang không
   biết tuổi người đọc (SX-C).
3. **Có** khối hướng kiêng của năm chồng lên hướng tốt, lời luôn ghi "chỉ nói thời điểm, thứ hạng bốn hướng không đổi"
   (Q1 "hình thế là nền, lý khí là nhịp"). Năm = năm menu (`namTuoiSeo`), engine nhận `?nam_xem=`.
4. **Thứ tự phổ biến** Sinh Khí > Thiên Y > Diên Niên > Phục Vị (đúng `THU_TU_CAT` engine đã dùng), kèm câu mỗi hướng
   hợp việc gì.
5. **Làm luôn** tra hướng chung hai người: chỉ năm sinh + giới tính, không lưu, không gửi lên đo lường; khác nhóm → lệ
   sách xưa + cách làm phổ biến + "không phải lý do để lo hai người hợp hay không".

## 4. Kỹ thuật

- Engine: `luangiai/phongthuy_cung_chi_tiet.py` (`chi_tiet`, `hai_cung`), trường `bo_sung_cung` của
  `/v1/phongthuy/cung-phi/{slug}` (chỉ bản Việt, bản khác `None`), `POST /v1/phongthuy/hai-cung` (có bản Anh của lời).
  Không phép tính mới → không tăng `ENGINE_VERSION`. Golden đầu ra bản Việt sinh lại có chủ đích (8 trang cung + 2 lượt
  hai người).
- Web: `components/phong-thuy/LaBanSong.tsx` (SVG, kim quay + bảng chi tiết, chỉ CSS transition, tắt khi giảm chuyển
  động; trạng thái đầu cố định nên không lệch hydrate), `TraHuongTuoi.tsx`, `HaiNguoiHuong.tsx` (la bàn hai vòng);
  bảng 46 năm có tiêu đề + cột năm dính, hết chữ khó "theo người trụ cột"; trang cung có ảnh tóm tắt `<img>` (Google
  Images), nút đo hướng ngay sau la bàn, mục gập từng hướng (lời vẫn trong HTML máy chủ). Engine cũ thiếu
  `bo_sung_cung` → trang giữ bố cục cũ.
- Test: `engine/tests/test_phongthuy_cung_chi_tiet.py`, `web/e2e/ui-hht.spec.ts`.
