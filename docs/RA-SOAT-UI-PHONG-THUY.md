# Rà soát UI Phong thuỷ (UI-PT, 2026-10-22)

Chủ dự án giao sau Q1–Q7: "rà soát UI front end với codebase mới, có ý tưởng hữu dụng giải quyết nhu cầu / insight /
pain point người xem phong thuỷ thì đề xuất, vẽ phác thảo, chọn ý tốt nhất và nâng cấp". Tài liệu này ghi (1) hiện trạng,
(2) nỗi đau thật của người xem nhà, (3) bảy phác thảo, (4) bốn ý đã làm, (5) ý chờ duyệt, (6) cách đo.

## 1. Hiện trạng trang `/phong-thuy` (sau PR #120, #121)

Năm khối rời, mỗi khối một ô nhập hướng, không có đường đi:

```
[Đầu trang: H1, lời dẫn]
[Mệnh quái + Trường phái (mốc đầu năm) + la bàn 8 hướng tĩnh]
[Đo hướng nhà: la bàn điện thoại · nhập độ · bản đồ hai điểm]        ← hướng #1
[Nhà của bạn: hướng #2, năm xây, người cùng ở, ý định → 5 chương]
[Khảo sát nhà: hướng #3, loại nhà, mặt bằng 6×6, 9 phương, 20 dấu hiệu, hướng vật dụng]
[Huyền Không: toạ #4, năm xây → bàn 3×3]
[Góp ý cuối bài] [Hỏi đáp]
```

Điểm được: dữ liệu đã đi chung qua **hồ sơ nhà trên máy** (KC-2) nên điền sẵn tốt; bài đọc đã hai tầng đời thường / học
thuật; không doạ, không vật phẩm. Điểm chưa được, nhìn bằng mắt người lần đầu vào:

| # | Quan sát trong mã | Người dùng cảm thấy |
|---|---|---|
| H1 | 4 ô nhập hướng / toạ ở 4 khối (`DoHuongDienThoai`, `NhaCuaBan`, `KhaoSatNha`, `HuyenKhong`) | "Sao phải nhập hướng mãi?" — dù đã điền sẵn, vẫn thấy lặp |
| H2 | Trang mở đầu bằng **mệnh quái + la bàn tĩnh** (khái niệm), việc người dùng cần làm (đo cửa) nằm ở khối 2 | "Bắt đầu từ đâu?" — không có trình tự, không biết khối nào bắt buộc |
| H3 | La bàn điện thoại chỉ hiện kim + số độ; màu cát/hung chỉ ở la bàn tĩnh phía trên | Người **thuê nhà / ở căn hộ** không đổi được cửa; việc họ cần là "xoay bàn, kê đầu giường về hướng tốt" — chưa có công cụ trực tiếp |
| H4 | Chương "Từng phòng" là danh sách thẻ; `KhaoSatNha` trả bảng 5 cột | Không "thấy" được nhà mình; bảng du niên là chữ học thuật |
| H5 | `veto` → trần mức + hộp "Trước hết", nhưng sau khi người dùng sửa nhà thật thì không có cách báo lại | "Tôi che xà rồi, giờ sao?" — vòng Q1 → Q5 → Q7 chưa đóng về phía người dùng |
| H6 | Hồ sơ nhà chỉ một nhà, không tên, không xoá được từ giao diện (`xoaHoSoNha` chưa ai gọi) | Người đi mua nhà xem 2–3 căn không có cách "đổi căn" rõ ràng |
| H7 | Chữ trần mức: "trần Cân bằng — còn xà ngang" | Khó hiểu với người thường |

## 2. Insight người xem phong thuỷ (từ ma trận nỗi đau, câu hỏi hỏi đáp, persona "cô Hạnh 45" trong `THIET-KE-UI.md`)

1. **Ba câu hỏi gốc**: *Nhà này có hợp tôi không?* → *Kê gì ở đâu?* → *Khi nào sửa?* Mọi khối hiện có đều trả lời một trong
   ba câu, nhưng trang không nói ra ba câu đó.
2. **Hai kiểu người**: người **đi mua / xây** (cần hướng, năm, so căn) và người **đang ở / đi thuê** (không đổi được cửa,
   cần việc 0 đồng, hướng kê đồ, nhịp tháng). Trang đang viết cho kiểu một.
3. **Niềm tin đến từ thấy ngay kết quả của việc mình làm**: việc 0 đồng (Q5) chỉ có giá trị khi người dùng thấy "làm rồi
   thì bài đọc đổi thế nào" — đó là lý do phiếu sau 30 ngày (Q7) mới có người trả lời.
4. **Nhìn bằng hình trước, đọc chữ sau**: la bàn tô màu được dùng nhiều hơn bảng du niên (sự kiện `chart_interacted`).

## 3. Bảy phác thảo

Chấm 1–3 theo: giá trị với người dùng (G) · đẩy khâu vòng tăng trưởng (V) · công sức (C, 3 = ít) · rủi ro quy tắc
(R, 3 = không đụng riêng tư / tính toán ở web).

### P1 — La bàn sống (G3 V2 C3 R3) ✅ đã làm
```
┌ Đo hướng nhà ─────────────── [Đo hướng nhà] [Tìm hướng kê bàn, đầu giường] ┐
│      ╭───────╮        Đang quay về **Đông Nam** · Sinh Khí (hướng tốt với bạn)│
│   ▒▒│ B     │▒▒      Hướng tốt nhất: sinh sôi, phát triển. Hợp đặt: cửa     │
│  ▒▒▒│T  ⬆  Đ│░░░      chính, bàn làm việc.                                   │
│   ▒▒│   N   │░░      [Đo bằng la bàn điện thoại]  [hoặc nhập độ ▢] Xem      │
│      ╰───────╯        ▒ hướng tốt với mệnh Khảm  ░ hướng xấu                 │
│            135°                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```
Cùng một la bàn phục vụ hai việc: đo cửa (chốt → engine → hồ sơ nhà) và **xoay người tìm hướng tốt** để kê bàn / đầu
giường (chỉ đọc sống, không lưu). Mặt la bàn tô 8 cung theo `huong_cat` engine trả; dòng đọc sống lấy tên du niên từ
`bang_huong` + nghĩa / "dùng cho" từ trường mới `du_nien_y` (KB `du_nien`). Web chỉ chọn ô 45° để tô; hướng NHÀ vẫn do
engine đổi khi bấm Chốt (sơn, toạ, cảnh báo ranh giới).

### P2 — Sơ đồ nhà tô màu (G3 V1 C3 R3) ✅ đã làm
```
 Bắc ở trên            ┌──────────┬──────────┬──────────┐
                       │ TÂY BẮC  │ BẮC      │ ĐÔNG BẮC │
                       │ Lục Sát  │ Thiên Y  │ Ngũ Quỷ  │
                       │ Bàn thờ ▲│          │          │   ▲ = cần lưu ý (hổ phách)
                       ├──────────┼──────────┼──────────┤   ● = thuận lợi (lục)
                       │ TÂY      │ GIỮA NHÀ │ ĐÔNG     │   ○ = cân bằng
                       │ Hoạ Hại  │          │ Sinh Khí │
                       │ Bếp ▲    │ WC ▲     │ Ngủ ●    │
                       ├──────────┼──────────┼──────────┤
                       │ TÂY NAM  │ NAM  🚪  │ ĐÔNG NAM │
                       │ Tuyệt M. │ Diên Niên│ Phục Vị  │
                       │          │ Cửa ●    │ Làm việc●│
                       └──────────┴──────────┴──────────┘
```
Một thành phần `SoDoNha` dùng ở chương "Từng phòng" (Nhà của bạn) và kết quả Khảo sát: phòng đặt theo **phương engine
đã tính**, ô tô theo **mức engine chấm** (màu `chip-muc`, không đỏ), ô mặt trước gắn nhãn "cửa", du niên chữ nhỏ.

### P3 — Hành trình nhà bạn (G2 V2 C3 R3) ✅ đã làm
```
┌ Hành trình nhà bạn 2/5        Đang lưu trên máy: Căn định mua · 22/10  [✎ Đặt tên] [🗑 Xem nhà khác] ┐
│ [✓ Bạn hợp phía nào] [✓ Hướng nhà   ] [2 Nhà này với bạn] [3 Kê gì ở đâu ] [4 Khi nào sửa      ]   │
│   mệnh Khảm·Đông tứ    180° (ban công)   bài đọc 5 chương    phòng, dấu hiệu   cần năm xây          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
Thẻ đầu trang nối 5 khối thành một đường đi có trạng thái (đã có / sẵn sàng / chưa đủ dữ liệu) đọc từ hồ sơ nhà trên
máy; tên bước là **ba câu hỏi gốc**. Có đặt tên nhà và "Xem nhà khác" (xoá hồ sơ nhà, hỏi lại trước khi xoá) — bước đệm
cho P5.

### P4 — "Tôi đã xử lý" → xem trước – sau (G3 V3 C2 R2) ✅ đã làm (Y7)
```
┌ 🔧 Đã xử lý rồi? Xem bài đọc đổi thế nào ───────────────────────────────┐
│ Sau khi xử lý nhà vệ sinh ở giữa nhà:                                      │
│   Ngôi nhà này với bạn:  [Cân bằng] → [Thuận lợi]  không còn trần mức      │
│   Từng phòng:            [Cần lưu ý] → [Cân bằng]                          │
│   ↶ Chưa xử lý xong, hoàn tác                                              │
│ Bấm vào dấu hiệu bạn đã xử lý — bài đọc tính lại ngay, so với trước:       │
│   (Đã xử lý: Giường, bàn dưới xà ngang) (Đã xử lý: Cửa chính nhìn thẳng…) │
└────────────────────────────────────────────────────────────────────────────┘
```
Đóng vòng Q1 → Q5 → Q7 về phía người dùng: bấm một nút, hồ sơ nhà ghi `da_xu_ly`, web gửi engine `{co: false,
nguon: nguoi_dung}` → **engine đổi một luật nhỏ**: người dùng khai rõ "không có / đã xử lý" thắng dấu hiệu máy suy từ
mặt bằng hoặc vị trí (trước đây suy luận từ mặt bằng không gỡ được). Trần mức gỡ, chương đổi mức hiện cạnh nhau.
Khảo sát nhà giữ `da_xu_ly` khi lưu lại và tích lại = chưa xử lý nữa. Không migration (hồ sơ nhà là JSON trên máy; bảng
`ho_so_nha` 0018 là JSON tự do ≤ 16 KB).

### P5 — So hai căn khi đi mua (G3 V2 C1 R3) ⏳ chờ duyệt
```
┌ Căn A: hướng 180°, 2008 ─┬─ Căn B: hướng 45°, 2015 ─┐
│ Với bạn: Thuận lợi        │ Với bạn: Cân bằng         │
│ Bếp ● Ngủ ● WC ▲          │ Bếp ▲ Ngủ ● WC ●          │
│ Năm nay: giữ yên phía Nam │ Năm nay: thuận sửa        │
└───────────────────────────┴───────────────────────────┘  [Chọn căn A làm nhà chính]
```
Cần hồ sơ nhà nhiều căn (`hbt.nha.v1` → danh sách, ≤ 3 căn) và một màn so sánh chỉ hiện mức + sơ đồ, **không điểm
số**. Công sức ~1,5 ngày (đổi schema lưu máy + mọi khối đọc `useHoSoNha`).

### P6 — Chụp một góc, hỏi 3 câu (G2 V2 C2 R3) ⏳ chờ duyệt (= Y1)
Ảnh chỉ hiển thị trên máy người dùng để họ nhìn mà trả lời 3–5 câu có / không do đồ thị chọn theo ý định; ảnh không gửi
đi, không cần mô hình thị giác. Rút ngắn form 20 ô dấu hiệu cho người lười điền.

### P7 — Thẻ chia sẻ "Nhà của bạn" (G2 V3 C3 R2) ⏳ chờ duyệt (= Y2)
Ảnh OG = sơ đồ 3×3 của P2 phủ màu theo mức + QR về `/phong-thuy?tu=nha.…`; chỉ 8 hướng + mức, **không địa chỉ, không
toạ độ, không năm sinh**. Có P2 rồi nên chỉ còn vẽ bản OG + mã HMAC miền `nha|` như TCS-1.

## 4. Vì sao chọn P1–P4

P1 + P2 giải nỗi đau **H3, H4** bằng dữ liệu engine đã có (không thêm phép tính ở web, không riêng tư). P3 giải **H2,
H6, H1** (không gộp 4 ô nhập — gộp sẽ làm e2e / hồ sơ nhà đổi nhiều; thay vào đó cho người dùng thấy các ô ấy là một
chuỗi). P4 giải **H5** và là mảnh còn thiếu để Q7 có phiếu "đã làm" thật. P5–P7 cần quyết định về lưu nhiều nhà / thẻ
mới nên để chủ dự án tích.

## 5. Đo lường

| Sự kiện (PostHog, chỉ mã) | Đọc gì |
|---|---|
| `chart_interacted{kind=la_ban_ke_do, nhap_tay?}` | bao nhiêu người dùng la bàn để kê đồ (kiểu người đang ở / thuê) |
| `chart_interacted{kind=hanh_trinh_buoc, buoc, trang_thai}` | bước nào được bấm từ thẻ hành trình → bước nào rối |
| `chart_interacted{kind=da_xu_ly, ma}` | dấu hiệu nào người dùng xử lý thật → đối chiếu với phiếu sau 30 ngày (0022) |
| `chart_interacted{kind=dat_ten_nha | xoa_nha}` | nhu cầu nhiều căn (P5) có thật không |
| `reading_completed{mo_dun=phongthuy}` | tỉ lệ đọc hết sau khi có sơ đồ nhà |

## 6. Kiểm thử

- Engine: `tests/test_phongthuy.py::test_api_menh_quai_kem_nghia_du_nien_cho_la_ban_song`,
  `tests/test_phongthuy_q.py::test_da_xu_ly_co_false_thang_dau_hieu_suy_tu_mat_bang`.
- E2E `web/e2e/phong-thuy.spec.ts`: la bàn 8 cung tô (4 cát của Khảm), chế độ kê đồ không gọi engine / không lưu nhà,
  đọc sống "Diên Niên" khi cảm biến trả 180°; sơ đồ nhà ở Khảo sát + chương Từng phòng; bấm "Đã xử lý" ba dấu hiệu →
  hết trần mức, hoàn tác → trần quay lại; hành trình trạng thái + đặt tên + xoá nhà.
- Deploy **engine trước web** (web gửi `co: false` và đọc `du_nien_y`; engine cũ bỏ qua hai thứ này không lỗi nhưng
  nút "Đã xử lý" sẽ không gỡ được dấu hiệu suy từ mặt bằng cho tới khi engine mới lên).
