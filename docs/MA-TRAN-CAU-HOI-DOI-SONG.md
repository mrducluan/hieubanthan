# MT-ĐS — Ma trận câu hỏi đời sống & lời luận không vướng mê tín

Trạng thái: **bản thiết kế chờ chủ dự án duyệt** (2026-10-28). Phạm vi: hỏi đáp + luận giải của Tử vi · Bát tự ·
Phong thuỷ (Kinh Dịch chỉ dùng chung bộ chặn). Thần số có vòng riêng, không đụng.

**Khâu của vòng tăng trưởng:** QUAY LẠI (câu người dùng hỏi nhiều nhất được trả lời thẳng, không né) + NẠP Sao
(chương Vận hạn, sao hạn → mở chương sâu). Đo: tỉ lệ `do_phu = khong` trong nhật ký hỏi đáp, `feedback_submitted`
"Đúng với mình" theo mã `ds.*`, lượt mở `/xem-sao-han`, `reading_completed{mo_dun}`.

## 0. Hiện trạng (rà 90 câu hay gặp, 2026-10-28)

| Nhóm | Tử vi | Bát tự | Phong thuỷ |
|---|---|---|---|
| Tai nạn | từ chối (chi_tiet: trả lời kèm lưu ý) | từ chối | từ chối |
| Bệnh gì / thọ bao nhiêu | từ chối (đúng) | từ chối (đúng) | từ chối (đúng) |
| Con cái (mấy con, con trai, hiếm muộn) | rơi về Mệnh | rơi về "tính cách" | — |
| Hôn nhân (mấy đời chồng, ly hôn, muộn chồng, phản bội) | Phu Thê / Mệnh lẫn lộn | "tính cách" | — |
| Kiện tụng, tù, tiểu nhân | Mệnh | "tính cách" | — |
| Công danh, sự nghiệp, làm quan | Quan Lộc (đúng) | "tính cách" (thiếu từ khoá) | — |
| Bao giờ / khi nào (thời điểm) | hạn (đúng) | không nhận là "vận" | — |
| Thi cử, nhà cửa, thừa kế, đi xa | Mệnh / Điền Trạch / Thiên Di | "tính cách" | — |
| Kim lâu / Tam tai | — | — | chỉ nhận khi kèm "năm nay" |
| Vong theo, căn đồng, nhà có ma, bùa, trùng tang | **luận cung Mệnh** (sai) | **"tính cách"** (sai) | từ chối bùa / vật phẩm |
| Sao hạn Cửu Diệu, 8 hạn | kho không có | kho không có | kho không có |
| "chắc chắn" (vd "có chắc chắn thăng chức") | **chặn nhầm** (nằm trong TU_CHOI) | chặn nhầm | chặn nhầm |

Điểm quan trọng: kho đã có sẵn lời không mê tín cho hầu hết nhóm trên (chương Vận hạn "Nên tránh / Nên làm", 40 câu
an toàn trong nhà, sức khoẻ phòng ngừa) — việc chính là **định tuyến đúng + mẫu lời dẫn hướng**, không phải viết lại.

## 1. Quyết định chủ dự án đã chốt (2026-10-28)

1. **Thuật ngữ chuẩn hoá** (bảng mục 2) áp vào **lời đời thường + tiêu đề hộp + lời khuyên**; từ gốc giữ ở "Vì sao nói
   vậy", URL, tiêu đề SEO, từ điển. Không đổi SEO.
2. **pgvector**: giữ vectơ băm trong engine (`bam512_v1`), **nạp sẵn** toàn bộ kho câu hỏi có nhãn vào `cau_hoi_vec`;
   không gửi câu ra ngoài. Anh chạy migration 0017.
3. **Câu tâm linh** (vong, căn, ma, bùa, trùng tang) + bệnh/thọ: **không luận nhưng dẫn hướng** — nói rõ hệ thống
   không xem, rồi chuyển sang điều lá số nói được về giai đoạn/cung liên quan. Bệnh/thọ vẫn chặn + câu đi khám.
4. **Sao hạn Cửu Diệu + 8 hạn**: công cụ `/xem-sao-han/{năm}` (+ trang tuổi) + hỏi đáp + chương Vận hạn, lời "dân
   gian xem…", không cúng giải, không vật phẩm.

## 2. Nguyên tắc lời

### 2.1 Bảng thuật ngữ (từ gốc → cách nói trên trang)

| Từ gốc (chỉ còn ở "Vì sao nói vậy" / SEO / từ điển) | Cách nói trong lời đời thường, tiêu đề hộp |
|---|---|
| xem bói, đoán vận mệnh | đọc bản đồ năng lực / nhịp phát triển của bạn |
| cải vận, chiêu tài, trấn trạch | sắp xếp lại không gian cho dễ sống, việc nên làm trong tháng này |
| đại hạn, tiểu hạn, lưu niên | giai đoạn 10 năm, nhịp của năm, chủ đề năm nay |
| tam tai, thái tuế, kim lâu | năm dân gian hay tránh làm việc lớn / năm nên đi chậm |
| hạn, hạn nặng, hạn xấu | năm cần lưu ý, chỗ nên cẩn thận |
| khắc khẩu, xung khắc tuổi | hai nhóm tính cách khác nhau · cách dung hoà |
| sát, hung tinh, sao xấu | sao gây áp lực, chỗ dễ vấp |
| phá tài, hao tài | tiền ra bất ngờ, năm nên giữ chặt tiền |
| tai nạn, tai hoạ | năm cẩn thận đi lại / việc tay chân, chuyện an toàn |
| kiện tụng, quan phù | vướng giấy tờ, hợp đồng, tranh chấp |
| sát chồng, khắc vợ, mấy đời chồng | chỗ hai người dễ va chạm; nhịp tình cảm theo giai đoạn |
| cúng giải hạn, dâng sao | (không dùng) — "nếu gia đình có lệ, giữ như một dịp sum họp" |

Cụm cấm giữ nguyên `cum_cam` (giọng AI, "bạn sẽ", "định mệnh", "số phận", "xui", "chết", "tai nạn", "ly hôn",
"phá sản"…); thêm vào test: "cúng", "giải hạn", "vật phẩm", "bùa", "trấn", "khắc chết", "đại kỵ".

### 2.2 Khuôn một câu trả lời cho nhóm nhạy cảm ("dẫn hướng")

```
[1 câu nói thật phạm vi]   Lá số không đoán được <X>; không ai đoán được <X> từ ngày sinh.
[1 câu chuyển]             Điều lá số nói được là <mảng> của bạn trong <giai đoạn> đang <mức>.
[Hộp]                      Nên để ý: … · Nên làm (0 đồng): … · Thời điểm: …
[Vì sao nói vậy]           <thuật ngữ, cung, sao, tứ hoá, trụ, du niên>
[Câu khép]                 Bạn vẫn là người quyết định; <câu không thay bác sĩ / luật sư / chuyên gia tài chính khi
                           chạm sức khoẻ / pháp lý / tiền>.
```

Khuôn này tái dùng hộp `doi_song_1` (KC-1) nên web không cần khối mới.

## 3. Ma trận ý định

### 3.1 Trục

- **Lĩnh vực** (14): bản thân · tiền bạc · công việc/công danh · tình cảm/hôn nhân · con cái · cha mẹ/anh em · sức
  khoẻ/năng lượng · an toàn/đi lại · pháp lý/giấy tờ · học hành/thi cử · nhà cửa/đất đai · quan hệ (quý nhân/tiểu
  nhân) · đi xa/định cư · tuổi già/hậu vận. Thêm trục **tập quán** (sao hạn, kim lâu, tam tai, xông đất, tuổi hợp).
- **Kiểu hỏi** (5): `mo_ta` ("tôi có số … không") · `thoi_diem` ("bao giờ", "năm nào") · `quyet_dinh` ("có nên") ·
  `lo_so` ("có bị … không") · `tap_quan` ("có phạm … không").

### 3.2 Ánh xạ dữ kiện tính được (một nguồn — CALC đã có)

| Lĩnh vực | Tử vi | Bát tự | Phong thuỷ |
|---|---|---|---|
| Bản thân | Mệnh, Thân, cách cục | nhật chủ, thân vượng/nhược | cung phi, nhóm Đông/Tây |
| Tiền bạc | Tài Bạch, Hoá Lộc/Kỵ, Lộc Tồn, hạn vào Tài | Chính/Thiên Tài, dụng thần hai cách, lưu niên | hướng Sinh Khí/Diên Niên, cửa, bếp, lưu niên Bát Bạch |
| Công việc / công danh | Quan Lộc, Thiên Di, Hoá Quyền/Khoa, Thái Tuế | Chính Quan/Thất Sát, Ấn, đại vận | bàn làm việc, hướng Diên Niên |
| Tình cảm / hôn nhân | Phu Thê, Đào Hoa/Hồng Loan/Thiên Hỷ, Hoá Kỵ Phu Thê | trụ ngày (chi = phối ngẫu), Tài/Quan tinh, Đào Hoa | phòng ngủ, giường, du niên hai người |
| Con cái | **Tử Nữ**, Thiên Hỷ, Hoá Kỵ Tử Nữ | trụ giờ, Thực Thương (nữ) / Quan Sát (nam) | phòng trẻ, Thiên Y |
| Cha mẹ / anh em | Phụ Mẫu, Huynh Đệ | trụ năm – tháng, Ấn | — |
| Sức khoẻ / năng lượng | Tật Ách (+ câu không thay bác sĩ) | hành thừa/thiếu, điều hậu | giường, Thiên Y, dấu hiệu an toàn |
| An toàn / đi lại | Thiên Di, Tật Ách, Kình/Đà/Hoả/Linh, Hoá Kỵ năm, **cờ dân gian** | năm xung chi ngày, Kiếp Sát/Vong Thần | 40 câu an toàn trong nhà, Ngũ Hoàng/Nhị Hắc năm |
| Pháp lý / giấy tờ | **Quan Phù** (vòng Thái Tuế), Quan Lộc, Nô Bộc, Hoá Kỵ | Thất Sát/Thương Quan lộ, năm hình | — |
| Học hành / thi cử | Quan Lộc, Hoá Khoa, Văn Xương/Khúc | Ấn tinh, Văn Xương | bàn học, Văn Xương vị |
| Nhà cửa / đất đai | **Điền Trạch**, Hoá Lộc Điền | Ấn (nhà), Tài | hướng, Kim lâu/Hoang ốc/Tam tai, năm sao |
| Quan hệ (quý nhân / tiểu nhân) | **Nô Bộc**, Thiên Khôi/Việt, Hoá Kỵ Nô Bộc | Thiên Ất Quý Nhân, Tỷ Kiếp | — |
| Đi xa / định cư | Thiên Di, Thiên Mã | Dịch Mã | — |
| Tuổi già / hậu vận | **Phúc Đức**, đại hạn sau 55 | đại vận cuối | — |
| Tập quán | cờ `co` (năm tuổi, xung, tam tai) + **sao hạn** mới | — | Kim lâu, Hoang ốc, Tam tai, sao hạn, xông đất |

Ô in đậm = dữ kiện **đã tính nhưng hỏi đáp chưa trỏ tới** (lỗi định tuyến hiện nay).

### 3.3 Kiểu hỏi → cách trả lời (áp mọi lĩnh vực)

| Kiểu | Trả lời | Không làm |
|---|---|---|
| `mo_ta` | nét của cung/trụ + điểm mạnh / dễ vấp + câu tự soi | gán nhãn số phận ("số giàu", "số khổ") |
| `thoi_diem` | giai đoạn/năm/tháng **thuận cho việc đó** theo đại hạn > lưu niên > tiểu hạn > lưu nguyệt (Bát tự: đại vận/lưu niên hai cách) | hứa năm X xảy ra |
| `quyet_dinh` | hai nhánh "nếu đi / nếu ở" + việc chuẩn bị, người hỏi tự quyết | khuyên mua/bán/đầu tư cụ thể |
| `lo_so` | khuôn dẫn hướng (2.2): năm/mảng cần lưu ý + việc 0 đồng | trả lời có/không biến cố |
| `tap_quan` | "dân gian xem…", mốc, cách người xưa làm (mượn tuổi, đi chậm) | cúng giải, vật phẩm, "đại kỵ" |

## 4. Nhóm nhạy cảm — phương án và lựa chọn

Mỗi nhóm 2–3 phương án; **in đậm = chọn**.

| Nhóm | A | B | C | Lý do chọn |
|---|---|---|---|---|
| Tai nạn, an toàn | từ chối (hiện nay) | **"năm/mảng nên cẩn thận ở đâu" + việc 0 đồng (khuôn 2.2), cả hai chế độ** | luận có/không như thị trường | B dùng dữ kiện có sẵn (Thiên Di, Tật Ách, sát tinh, cờ dân gian, an toàn trong nhà); C là phán |
| Tiền bạc: giàu không, bao giờ, mất tiền, đầu tư | kể cung Tài Bạch | **nhịp tiền theo giai đoạn + "tiền vào từ đâu" + việc giữ tiền; câu khép "không phải lời khuyên đầu tư"** | chấm "số giàu/nghèo" | B đúng Luật Quảng cáo / tư vấn tài chính; không gán nhãn |
| Công danh, thăng chức, làm quan | Quan Lộc như nay | **Quan Lộc + Thiên Di + năm Hoá Quyền/Khoa → "năm được ghi nhận", "việc nên làm để được thấy"** | — | thêm thời điểm, bỏ chữ "làm quan" |
| Hôn nhân: mấy đời chồng, ly hôn, phản bội, muộn chồng | Phu Thê | **Phu Thê + giai đoạn Hoá Kỵ/Lộc Phu Thê → "chỗ hai người dễ va chạm" + "giai đoạn tình cảm dễ mở"; không đếm số đời, không "khắc"** | từ chối | dân gian hỏi nhiều nhất; B trả lời được mà không nhãn |
| Con cái: bao giờ, mấy con, con trai, hiếm muộn | từ chối (sinh nở = y tế) | **Tử Nữ: quan hệ với con + giai đoạn nhiều việc liên quan con; nói rõ không đoán giới tính/số con; "hiếm muộn" → chuyển bác sĩ + lời hỗ trợ** | luận số con | B giữ ranh giới y tế, vẫn có nội dung |
| Pháp lý: kiện, tù, tiểu nhân | Mệnh (sai) | **Quan Phù/Nô Bộc/Hoá Kỵ → "năm dễ vướng giấy tờ, hợp đồng" + rà kỹ, hỏi luật sư** | — | B dùng vòng Thái Tuế đã an |
| Sức khoẻ: ốm nặng, bố mẹ khoẻ không | Tật Ách không câu bác sĩ (lỗi nay) | **Tật Ách/Phụ Mẫu + luôn `luu_y.tat_ach`; bệnh/thọ chặn + câu đi khám** | — | đúng quy tắc code |
| Tâm linh: vong, căn, ma, bùa, trùng tang | từ chối khô | **dẫn hướng: "hệ thống không xem vong/bùa" → giai đoạn đang bất an + việc nên làm; trùng tang thêm lời chia buồn** | luận | chủ dự án chốt B |
| Sao hạn Cửu Diệu, 8 hạn | không có | **tính + lời tập quán (mục 5)** | cúng giải | — |
| "chắc chắn" | chặn | **bỏ khỏi TU_CHOI, chỉ chặn "cho tôi biết chắc" + trả lời có câu "không ai chắc được"** | — | sửa chặn nhầm |

## 5. Sao hạn Cửu Diệu + Bát hạn (CALC mới, cần test + golden trước)

### 5.1 Phép tính (bảng lịch vạn niên Việt phổ biến — **chờ chủ dự án đối chiếu sách**)

Tuổi = tuổi mụ theo năm âm lịch Việt (`tuoi_dan_gian.tuoi_mu`). Chu kỳ 9 sao, bắt đầu từ tuổi 10:

| Tuổi mụ (và +9, +18…) | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 |
|---|---|---|---|---|---|---|---|---|---|
| Nam | La Hầu | Thổ Tú | Thuỷ Diệu | Thái Bạch | Thái Dương | Vân Hán | Kế Đô | Thái Âm | Mộc Đức |
| Nữ | Kế Đô | Vân Hán | Mộc Đức | Thái Âm | Thổ Tú | La Hầu | Thái Dương | Thái Bạch | Thuỷ Diệu |

Bát hạn, chu kỳ 8, từ tuổi 10:

| Tuổi mụ (và +8, +16…) | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 |
|---|---|---|---|---|---|---|---|---|
| Nam | Huỳnh Tuyền | Tam Kheo | Ngũ Mộ | Thiên Tinh | Toán Tận | Thiên La | Địa Võng | Diêm Vương |
| Nữ | Toán Tận | Thiên Tinh | Ngũ Mộ | Tam Kheo | Huỳnh Tuyền | Diêm Vương | Địa Võng | Thiên La |

Dưới 10 tuổi: dân gian không tính → engine trả `None` + ghi chú. Golden: bảng tay 2 giới × tuổi 10–99 chép từ
lịch vạn niên; gắn `chua_doi_chieu_oracle` cho tới khi chủ dự án xác nhận.

### 5.2 Lời (KB `sao_han_kb.json`, school `dan_gian_viet`, nháp ban biên tập)

Mỗi sao / hạn: tên Hán Việt, **nghĩa dân gian viết trung tính** (La Hầu: "dân gian xem là năm nên nói ít, giữ giấy
tờ, tránh tranh cãi" — không "tai nạn, tù tội"), tháng dân gian coi là rõ nhất, **3 việc 0 đồng**, câu tự soi, dòng
cố định: *"Sao hạn là tập quán xếp theo tuổi, không phải phép tính từ lá số của bạn; hệ thống không cúng giải, không
vật phẩm."* Tên bệnh, "chết", "tang" bị test chặn.

### 5.3 Hiện ở đâu

- Trang `/xem-sao-han/{năm}` (bảng 46 tuổi 1960–2005 như xông đất; SEO mùa Tết) + `/xem-sao-han/{năm}/tuoi-{năm sinh}`
  (sao + hạn + Kim lâu/Tam tai của tuổi, việc nên làm, link xem lá số). Engine `/v1/tuoi/sao-han/{năm}[/{năm sinh}]`.
- Hỏi đáp Tử vi / Bát tự: "sao La Hầu", "sao hạn năm nay", "Thái Bạch chiếu mệnh" → mục `sao_han` (tập quán) **đứng
  trước**, rồi phần lá số của năm. Phong thuỷ: `NAM_VIEC` thêm sao hạn, Kim lâu không cần kèm "năm nay".
- Chương Vận hạn (Tử vi + Bát tự): cờ `co` thêm `sao_han` (nhãn "sao La Hầu — tục lệ"), **không đổi mức**.
- Hôm nay: không (không doạ mỗi ngày).

## 6. pgvector — nạp sẵn kho câu

- Script `engine/scripts/nap_cau_hoi_vec.py`: đọc `fixtures/cau_hoi/huyenhoc_cau_hoi.jsonl` (+ kho mới), tạo vectơ
  `bam512_v1` (`app/nhung.py`), xuất JSONL `{cau_loc, vec, mo_dun, y_dinh}`; web route quản trị `/api/quan-tri/hoc/nap-kho`
  (chủ sở hữu, MFA) gọi `xac_nhan_y_dinh` với cờ `nguon = kho` để không đếm là người xác nhận.
- Ngưỡng `Y_DINH_NGUONG` giữ 0,82; đo tỉ lệ câu holdout được gợi ý đúng trước / sau nạp.
- Vẫn không gửi câu ra ngoài; không thêm nhà cung cấp.

## 7. Lộ trình từng bước (mỗi bước một PR, đo trước/sau)

| Bước | Việc | Đo |
|---|---|---|
| **B1** | Kho câu hỏi mới ≥ 300 câu (14 lĩnh vực × 5 kiểu × 3 mảng, viết TRƯỚC khi sửa router) + holdout 60 câu; đo mốc. Sửa định tuyến (chủ đề mới Bát tự, cung mới Tử vi, Kim lâu PT), bỏ chặn nhầm, mẫu dẫn hướng 2.2 cho tai nạn / tâm linh / sức khoẻ / pháp lý / con cái; thuật ngữ 2.1 vào lời template | `do_phu`, holdout lần đầu, test giọng văn |
| **B2** | Sao hạn Cửu Diệu + Bát hạn: CALC + golden + KB + route + trang + hỏi đáp + cờ Vận hạn | golden 180 ô, SEO 0 lỗi |
| **B3** | Lời luận bổ sung theo ma trận 3.2 (gói bằng chứng trỏ đúng cung/trụ; hộp cho `lo_so`/`quyet_dinh`; KB thêm câu đời thường chỗ mỏng: Tử Nữ, Nô Bộc, Phúc Đức, Quan Phù; Bát tự theo lĩnh vực) | `day_du_pct`, phần riêng |
| **B4** | pgvector nạp sẵn (mục 6) + web xác nhận | tỉ lệ gợi ý đúng holdout |
| **B5** | Luận giải toàn bộ: thuật ngữ 2.1 vào tiêu đề hộp/chương; chương Vận hạn thêm an toàn + pháp lý + sao hạn | `reading_completed`, "Đúng với mình" |

Không đổi phép tính cũ → không tăng `ENGINE_VERSION`; sao hạn là CALC mới (kết quả cũ không đổi). Không dependency.
Migration: không (0017 anh chạy để bật B4).

## 8. Còn chờ chủ dự án

1. Đối chiếu hai bảng mục 5.1 với sách anh dùng (mỗi lịch in một kiểu; sai một ô là sai cả trang SEO).
2. Hỏi đáp Phong thuỷ với câu "tiền tài / sự nghiệp / tình duyên" (không có hướng/phòng trong câu): trả lời bằng
   hướng + phòng hợp mệnh + lưu niên sao của năm — đúng ý anh không?
