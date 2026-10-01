# Kế hoạch: Lá số trực quan + Kho tri thức chiều sâu (2026-10-01)

Chủ dự án chốt: lá số có **nút chuyển 2 giao diện** (Đêm sao / Giấy cổ) · nguồn = **cổ thư công cộng**
(ctext.org) + PDF chủ dự án gửi sau (sách hiện đại chỉ tóm ý + ghi nguồn, không chép nguyên văn) ·
**Luận giải toàn bộ** miễn phí trong 2 tháng thử nghiệm, sau đó trừ Sao · thứ tự **UI lá số trước, kho tri thức sau**.

## Đánh giá hiện trạng (trước kế hoạch)

| Mảng | Đã có | Thiếu |
|---|---|---|
| Tử vi | an sao iztro đủ 14 chính tinh, phụ tinh, tạp diệu, 3 vòng sao, đại/tiểu hạn | web chỉ vẽ chính tinh; **tô nhầm Lai nhân cung là Mệnh** (đã sửa VZ-1); thiếu nạp âm, âm dương lý, Mệnh–Cục, Tuần/Triệt trên lá số, lớp vận hạn; độ sáng theo bảng Trung (lệch Nam phái); chưa nhận diện cách cục |
| Bát tự | tứ trụ, tàng can, thập thần, điểm ngũ hành, dụng thần 2 cách, đại vận | nạp âm, trường sinh theo trụ, thần sát, không vong, hợp/xung/hình/hại, lưu niên; hình trực quan sơ sài |
| Kinh Dịch | 64 quẻ (ý chính) | **384 lời hào**, Thoán truyện, Đại tượng |
| Phong thuỷ | Bát trạch, cửa–chủ–bếp | Huyền Không phi tinh (Vận 9), 24 sơn |
| Thần số | đủ chỉ số + KB theo lĩnh vực | nguồn phương Tây cổ để đối chiếu |
| Chung | hỏi đáp từng câu | **Luận giải toàn bộ** theo chương; kho trích dẫn cổ thư có nguồn |

## Lộ trình (mỗi dòng một PR, test trước)

1. **VZ-1** engine: nạp âm 60 hoa giáp (golden lunar-typescript), âm dương lý, Mệnh–Cục, Tuần/Triệt lối Việt
   trong `/v1/tuvi/an-sao`, loại phụ tinh, `/v1/tuvi/van-han` (tên cung lưu, sao lưu, tứ hoá lưu). ✅
2. **VZ-2** lá số Tử vi SVG: 2 giao diện, màu ngũ hành, 2 cột cát/sát, Trường sinh, Tuần/Triệt giữa hai cung,
   tam phương tứ chính, lớp đại hạn/lưu niên theo năm xem, tải PNG, thẻ chi tiết cung, hỏi đáp chuyển xuống dưới. ✅
3. **VZ-3** Bát tự: engine nạp âm/trường sinh/thần sát/không vong/hợp xung hình hại/lưu niên + bảng tứ trụ chuẩn,
   vòng 12 địa chi, ngũ giác ngũ hành, dải đại vận.
4. **VZ-4** bố cục 5 mảng: hỏi đáp dưới, tab Lá số · Luận cung · Đại vận · Lưu niên · Chuyên đề.
5. **TV-NP** bảng độ sáng Nam phái (cần nguồn đối chiếu — xem câu hỏi mở).
6. **KB-1** 384 hào + Thoán + Đại tượng (Chu Dịch, ctext) kèm dịch nghĩa.
7. **KB-2** Tử vi: 14 chính tinh × 12 cung × miếu/hãm, ~100 phụ tinh, ~40 cách cục (engine nhận diện), tứ hoá phi.
8. **KB-3** Bát tự: 10 nhật chủ × 12 tháng (Cùng Thông Bảo Giám), cách cục Tử Bình Chân Thuyên.
9. **LG** Luận giải toàn bộ: RULES ghép chương → NARRATIVE diễn đạt, mỗi ý dẫn nguồn.
10. **PT-HK** Huyền Không phi tinh (CALC mới, golden trước).

## Câu hỏi mở

- Độ sáng sao: iztro dùng bảng phái Trung (vd Tử Vi tại Mão = Vượng); lá số Việt phổ biến ghi Bình. Cần chủ
  dự án chọn nguồn Nam phái làm chuẩn trước khi đổi (đổi = tăng `ENGINE_VERSION`).
