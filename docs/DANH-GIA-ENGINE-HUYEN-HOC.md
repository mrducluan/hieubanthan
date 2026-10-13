# Đánh giá engine huyền học — so với horosa-skill / aov.cc (2026-10-13)

Chủ dự án yêu cầu: tham khảo engine của aov.cc (mục Hoàng lịch) và repo `Horace-Maxwell/horosa-skill`, xem còn thiếu
gì để "clone, học hỏi, sao chép" bổ sung cho engine hieuban.com.

## 1. Giấy phép — được lấy gì, không được lấy gì

| Nguồn | Giấy phép | Cách dùng |
|---|---|---|
| `horosa-skill` (Horace-Maxwell) | **AGPL-3.0-only** | **Không chép mã/dữ liệu.** AGPL buộc công bố toàn bộ mã nguồn web/engine khi chạy dịch vụ. Chỉ đọc để biết danh mục kỹ thuật, chạy riêng làm oracle nếu cần (như quyết định 2026-10-01). |
| aov.cc (命语, lớp vỏ của mingyu-core + iztro + lunar) | dịch vụ, mingyu-core AGPL | Chỉ đối chiếu kết quả (ảnh 13/10/2026 của chủ dự án). |
| `lunar-python` / `lunar-javascript` (6tail) | **MIT** | Phần hoàng lịch của cả horosa lẫn aov.cc đều dựng trên thư viện này. Bảng nghi/kỵ, thần sát, tú, Bành Tổ **chép nguyên văn có ghi bản quyền** vào `engine/app/calc/hoang_lich_vendor.py`; thư viện chỉ làm oracle sinh golden (không chạy runtime, không thêm dependency). |
| `kinqimen` / `kintaiyi` / `kinjinkou` (kentang) | MIT | Engine Kỳ Môn / Thái Ất / Kim Khẩu Quyết mà horosa gọi. Dùng được làm oracle hoặc dependency **nếu chủ dự án duyệt** (CLAUDE.md: không thêm dependency khi chưa hỏi). |

## 2. Engine hieuban.com hiện có (sau PR này)

| Mảng | Có | Đối chiếu |
|---|---|---|
| Thần số | Pythagoras đầy đủ (+ biểu đồ, đỉnh cao, nợ nghiệp, chu kỳ) · Chaldea (số gốc + 43 số kép) | golden tính tay |
| Tử vi | an sao iztro + lịch Việt, độ sáng Nam phái, Hoả Linh, lưu niên, lưu nguyệt 5 phái, cách cục 62 | iztro, lasotuvi 60 lá |
| Bát tự | tứ trụ (VSOP87), thập thần, vượng suy, cách cục Tử Bình Chân Thuyên, đại vận, **lưu nhật (mới)** | lunar-typescript |
| Kinh Dịch | gieo cỏ thi/đồng xu, Mai Hoa thời gian, nạp giáp lục thân, **quẻ đầu ngày (mới)** | — |
| Phong thuỷ | Bát trạch, Huyền Không phi tinh, thế quái, bố cục nhà, tuổi hợp hướng | — |
| **Hoàng lịch (mới, HL-1)** | trực, 12 thần hoàng/hắc đạo, nghi/kỵ 142 việc, 151 thần sát, 28 tú, xung sát, Bành Tổ, hỷ/tài/phúc thần, thai thần, giờ hoàng đạo, giờ xuất hành Lý Thuần Phong, Tam nương / Nguyệt kỵ / Dương công, chọn ngày theo 12 việc + tuổi | **898/898 ngày** khớp oracle 1940–2080 |

## 3. Còn thiếu so với horosa (110 công cụ) — xếp theo giá trị cho người Việt

| Ưu tiên | Hạng mục | Vì sao | Công sức | Vòng tăng trưởng | Cần anh |
|---|---|---|---|---|---|
| **P1** | **Tuổi làm nhà / cưới: Kim lâu, Hoang ốc, Tam tai** + trang "tuổi X làm nhà năm Y" | Từ khoá tìm rất nhiều ở VN, quy tắc dân gian thuần, tất định | M | Thu hút (SEO) + Quay lại | Chốt phái Kim lâu (tính tuổi mụ, mốc Tết) |
| **P1** | **Hướng xấu theo năm**: Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng + phi tinh lưu niên/lưu nguyệt (Huyền Không theo năm) | Có sẵn lõi Huyền Không; trang "hướng xấu năm 2027" mùa cuối năm | S–M | Thu hút | — |
| **P1** | **Tuổi xông đất / chọn giờ xuất hành Tết** (ghép hoàng lịch + tuổi chủ nhà) | Mùa Tết, chia sẻ mạnh | S | Mời bạn | — |
| P2 | Chọn ngày theo **Bát tự cá nhân** (trạch cát: ngày không xung trụ ngày/năm, dụng thần) | Sâu hơn "không xung tuổi" | M | Nạp Sao (báo cáo chọn ngày) | Duyệt làm gói Sao |
| P2 | Tử vi **lưu nhật** | Nhịp Tử vi theo ngày (ý tưởng 2 phiên trước) — các phái an lưu nhật khác nhau, chưa có oracle | M | Quay lại | Chốt phái |
| P2 | Lục hào: vượng suy theo nguyệt kiến/nhật thần, tuần không | Đang gắn cờ "chưa tính" | M | — | — |
| P3 | Kỳ Môn Độn Giáp, Đại Lục Nhâm, Thái Ất, Kim Khẩu Quyết | Người dùng VN ít, khó diễn giải an toàn | L | — | Duyệt dependency `kinqimen` (MIT) hoặc tự viết |
| P3 | Hà Lạc lý số, Thiết bản thần số, Thất chính tứ dư, chiêm tinh phương Tây | Ngoài định vị "phương Đông + thần số" | L | — | Quyết định sản phẩm |

## 4. Đã làm trong PR này (từ ý tưởng phiên trước + yêu cầu mới)

1. **Giờ hoàng đạo + trực ngày trên thẻ Hôm nay** — có, cộng tuổi xung/hợp và đánh giá việc theo ý định trong ngày.
2. **Quẻ Kinh Dịch của ngày** — quẻ Mai Hoa đầu ngày (năm + tháng + ngày âm, giờ Tý). **Nhịp theo ngày**: thay Tử vi
   lưu nhật (chưa chốt phái) bằng **Bát tự lưu nhật** — thập thần của can ngày với nhật chủ, chỉ cần ngày sinh.
3. **43 trang số kép Chaldea** `/kien-thuc/so-kep/so-kep-{10…52}` (hỏi đáp theo phái Chaldea: PR sau).
4. **Đo ý định hôm nay**: PR sau (đếm mã ý định + câu không nhận ra, không lưu câu).
5. **Xem ngày tốt** `/xem-ngay-tot` + trang từng ngày + lịch tháng + khối nổi bật thứ hai ở trang chủ.

## 5. Tâm lý người dùng — cách trang giữ chân mà không doạ

- **Khoảng trống tò mò có thật**: "Hôm nay có xung tuổi bạn không?" ở trang chủ — chỉ trả lời khi có hồ sơ (một bước
  nhập), câu trả lời luôn đầy đủ, không khoá.
- **Vòng mở (open loop) mỗi ngày**: "Ngày mai: …", "Ngày đẹp gần nhất còn N ngày", giờ hoàng đạo kế tiếp đếm ngược
  theo giờ thật (không đếm ngược giả).
- **Cá nhân hoá nhẹ**: tuổi bạn, nhật chủ bạn, việc bạn định làm — thấy "nói về mình" nhưng câu chữ trung tính.
- **Thoả mãn ngay**: thẻ đầy đủ ở HTML máy chủ (không phải chờ), phần sâu (thần sát, Lý Thuần Phong) gập lại.
- **Không**: phán hung, "đại hung", vật phẩm giải hạn, khoá nội dung bằng sợ hãi — test engine chặn từ doạ.
