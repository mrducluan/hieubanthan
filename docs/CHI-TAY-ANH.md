# Chỉ tay từ ảnh bàn tay (CT-2) — thiết kế

Mục tiêu: người dùng chụp / tải ảnh lòng bàn tay của CHÍNH MÌNH → trang `/chi-tay` đặt **tám cung bát quái lên đúng bàn tay
của họ**, đo được hình dáng bàn tay – ngón tay, rồi đọc câu sách xưa (Thần Tướng Toàn Biên quyển 10) ứng với những gì đo được và
những gì họ tự xác nhận. Cùng nguyên tắc với ANH-3 (gương mặt): **ảnh không rời máy**, chỉ toạ độ điểm mốc lên engine.

## 1. Ba cách đã cân nhắc

| Cách | Làm gì | Vì sao chọn / không chọn |
|---|---|---|
| A. Máy tự dò ĐƯỜNG CHỈ (sinh đạo, trí đạo, tâm đạo) trên ảnh | lọc cạnh / mô hình phân đoạn đường chỉ | **Không chọn**: chưa có mô hình mở đáng tin; ảnh điện thoại (đèn, nếp da, vân tay) cho kết quả sai mà trông như thật → "độ chính xác giả". Dò đường chỉ trên máy chủ = đưa ảnh sinh trắc ra ngoài. |
| B. Gửi ảnh cho AI thị giác đọc | như ANH-1 | **Không chọn** (lúc này): ảnh lòng bàn tay là dữ liệu sinh trắc (Luật 91/2025), AI dễ bịa đường chỉ; lớp ANH-1 của gương mặt cũng đang tắt chờ luật sư. |
| **C. Điểm mốc bàn tay trên máy + người dùng tự xác nhận (chọn)** | MediaPipe Hand Landmarker (21 điểm, Apache-2.0, cùng gói `@mediapipe/tasks-vision` đã duyệt) chạy trong trình duyệt → engine đo tỉ lệ bàn tay / ngón + chiếu tám cung lên ảnh của người dùng → người dùng chạm từng cung, tự nói "gò đầy / trũng / có vân cắt", chọn hình vân giống tay mình | Thứ máy đo được (độ dài ngón so với bàn tay, ngón trỏ – ngón áp út) là hình học thật, kiểm được; thứ máy không đo được (gò dày mỏng, vân rối) thì người dùng tự nhìn trên ảnh đã có lưới cung. Ảnh không rời máy. |

## 2. Luồng trên trang `/chi-tay`

1. Khối "Chụp lòng bàn tay" đầu trang (trước đồ hình sách): chọn tay (trái / phải — sách xưa thường xem nam tay trái, nữ tay
   phải; người dùng chọn), nút **Chụp ảnh** (`<input capture="environment">`) / **Tải ảnh**; hướng dẫn hình: xoè tay, lòng bàn
   tay hướng vào máy, đủ sáng, cả cổ tay trong khung.
2. Ô đồng ý riêng (không tích sẵn) mã `ct1`: "Ảnh chỉ xử lý trên máy bạn; chỉ 21 toạ độ điểm mốc gửi lên để đo, không lưu".
   Rút được ở chỗ chụp và "Dữ liệu của tôi" (như `dm1`).
3. Trên máy: thu nhỏ ảnh (≤ 1280 px, bỏ EXIF) → Hand Landmarker chế độ IMAGE → 21 điểm. Không thấy tay / thấy mu bàn tay
   / tay nắm → nhắc chụp lại (lời do engine trả theo mã lỗi).
4. Gửi `POST /api/chi-tay/do-tay` → engine trả số đo, nhãn, câu sách theo số đo, **toạ độ tám cung + Minh Đường trên ảnh của
   người dùng**.
5. Web vẽ ảnh của họ + chấm 21 điểm mốc (mờ) + chín vòng cung có tên; bấm một cung → thẻ: cung nói về gì (sách), và 3–4 lựa
   chọn tự quan sát ("gò nổi đầy", "trũng / phẳng", "có vân cắt ngang, vết", "bình thường").
6. Nút **Xem sách xưa nói gì** gửi `POST /api/chi-tay/doc` gồm vân đã chọn (thư viện 67 hình) + lựa chọn từng cung + ngày sinh
   hồ sơ (để biết đủ 18 tuổi) → lời sách khuôn SX-C, như hiện tại.
7. Không lưu ảnh; nhớ trên máy CHỈ lựa chọn (mã) — không lưu toạ độ.

## 3. Hợp đồng API

### `POST /v1/chi-tay/do-tay`

```json
{ "dong_y": true, "tay": "trai" | "phai", "ty_le": 0.75,
  "diem": [[x, y], ... 21 cặp, thứ tự MediaPipe Hand: 0 cổ tay, 1–4 ngón cái, 5–8 trỏ, 9–12 giữa, 13–16 áp út, 17–20 út],
  "ngay_sinh": "1990-05-01" }
```

- `x, y` chuẩn hoá 0..1 theo khung ảnh; `ty_le` = rộng / cao ảnh (để đo bằng đơn vị thật). `dong_y` khác `true` → 422.
- Trả:

```json
{ "hop_le": true, "loi": null,
  "so_do": { "dai_long": 1.0, "rong_long": 0.86, "ngon": {"cai": 0.55, "tro": 0.72, "giua": 0.83, "ap_ut": 0.76, "ut": 0.6},
             "tro_ap_ut": 0.95 },
  "nhan": [ { "ma": "ngon_dai", "ten": "Ngón tay dài so với lòng bàn tay", "vua": false } ],
  "sach_ghi": [ { "ma": "...", "han": "...", "nhom": "A", "loi": "Sách xưa ghi «…» — …", "viec": "..." } ],
  "cung": [ { "ma": "ly", "han": "離", "ten": "Gò dưới ngón giữa (cung Ly)", "vt": [0.52, 0.41], "y": "...",
              "lua_chon": [ {"ma": "day", "ten": "Gò nổi đầy"}, ... ] } ],
  "bo_nhom_c": 0, "cau_ket": "..." }
```

- `hop_le: false` + `loi` (mã: `khong_du_diem`, `mu_ban_tay`, `tay_nam`, `nghieng_qua`) + `loi_nhac` (lời tiếng Việt nhắc chụp lại).
- `nhan[]` có thêm `truc`, `y`; `cung[]` có thêm `am` và `vai` (câu sách nói cung ấy là gì, «根基所屬»).
- Toạ độ phải lấy trên ảnh KHÔNG lật gương (camera sau hoặc ảnh tải lên); ảnh camera trước bị lật đọc thành tay kia → engine
  báo `mu_ban_tay` và lời nhắc gợi ý chọn đúng tay.
- Số đo: độ dài theo đơn vị "dài lòng bàn tay" (cổ tay → gốc ngón giữa = 1). Không đo độ dày, màu, đường chỉ.
- `cung[].vt` là toạ độ 0..1 TRÊN ẢNH người dùng, dựng từ khung bàn tay (cổ tay, gốc 5 ngón) — mỗi cung là một tổ hợp cố định
  của điểm mốc (bảng trong KB), không phụ thuộc tay trái / phải (bên ngón cái / bên ngón út).

### `POST /v1/chi-tay/doc` (mở rộng)

Thêm `cung: { "<ma cung>": "<ma lựa chọn>" }` (tuỳ chọn); `van` thành tuỳ chọn nhưng phải có ít nhất một trong `van`, `cung`.
Trả thêm `muc_cung` (riêng với `muc` của vân): câu sách theo cung + lựa chọn, lấy từ «根基所屬» (bài thơ từng cung trên BÀN
TAY, có cả vế gò đầy và vế trũng / vân phá) và «論手» cho Minh Đường, chung khuôn SX-C. Không dùng câu «玉掌記» cho cung: bản
Cổ Kim Đồ Thư chú nhỏ đặt tám cung trong câu ấy lên MẶT (乾〔右頤下〕…), trình bày như câu về bàn tay là không trung thực.

## 4. Câu sách theo số đo (đo được thật)

Từ «論手», «相指掌», «許負相手篇» (kho nguồn `than_tuong_toan_bien`): ngón dài thanh (指纖長者性慈… 聰俊), bàn tay dài
(掌長), «掌為虎指為龍只可龍吞虎不可虎吞龍» (ngón dài hơn lòng bàn tay là thuận), «二指長者平生近貴» (ngón trỏ dài),
«四指長者… 性不耐煩» (ngón áp út dài → nhóm B), «掌長指短…» (nhóm B/C). Ngưỡng là nhân trắc phổ biến, ghi
`can_doi_chieu`, có dải "vừa" (không gợi ý). Câu nặng nói giảm theo SX-C; chưa rõ tuổi / dưới 18 → không nhóm C.

## 5. Đã làm (15/11/2026)

- Engine `calc/chi_tay_do.py` (21 điểm → số đo, kiểm ảnh, chiếu chín cung), KB `do_tay` (ngưỡng `can_doi_chieu`, chưa hiệu
  chỉnh trên ảnh thật), `sach_do_tay` (8 câu «論手» / «相指掌»), `cung_tay` (chín cung × 4 lựa chọn).
- Web `ChupBanTay` (MediaPipe Hand Landmarker trên máy, đồng ý `ct1`, rút ở "Dữ liệu của tôi"), chính sách riêng tư `#anh-mat`.
- Chưa: thử trên điện thoại thật (CI không có camera; e2e dùng điểm giả), hiệu chỉnh ngưỡng bằng ảnh thật có đồng ý.

## 6. Ranh giới

- Chỉ tay của chính mình; không nhận dạng danh tính; không lưu ảnh / toạ độ; không điểm số; không "đọc đường đời / tuổi thọ".
- Thiếu mô hình / thiết bị yếu → vẫn dùng được phần tự chọn vân + chạm cung trên đồ hình sách (như hiện tại).
- Chính sách riêng tư mục ảnh (`#anh-mat`) thêm đoạn ảnh bàn tay.
