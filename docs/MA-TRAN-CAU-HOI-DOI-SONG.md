# MT-ĐS — Ma trận câu hỏi đời sống & lời luận không vướng mê tín

Trạng thái: **bản thiết kế v2, chờ chủ dự án duyệt** (2026-10-28; v1 đã qua ba agent: phản biện pháp lý + người dùng,
holdout 360 câu viết độc lập, đối chiếu bảng sao hạn với 8 nguồn). Phạm vi: hỏi đáp + luận giải Tử vi · Bát tự ·
Phong thuỷ (Kinh Dịch chỉ dùng chung bộ chặn). Thần số có vòng riêng, không đụng.

**Khâu của vòng tăng trưởng:** QUAY LẠI (câu người dùng hỏi nhiều nhất được trả lời thẳng, không né) + NẠP Sao
(chương Vận hạn → mở chương sâu). Đo: tỉ lệ `do_phu = khong` trong nhật ký hỏi đáp, "Đúng với mình" theo mã `ds.*`,
`reading_completed{mo_dun}`, lượt `/xem-sao-han`.

## 0. Hiện trạng — hai thước đo

**Kho 2.328 câu (đo 2026-10-28, engine 0.1.5):** 4 module 100% có căn cứ, khủng hoảng 100%, chặn nhầm 0 — kho đã bão
hoà (kho và router cùng người viết).

**Holdout 360 câu viết độc lập** (`engine/fixtures/cau_hoi/holdout_mt_ds.jsonl`, agent đóng vai 30 người dùng, viết
TRƯỚC khi nhìn router; 14 lĩnh vực × 5 kiểu hỏi × 3 mảng + tập quán + tâm linh + phải chặn), **lần chạy đầu**:

| Module | Xử lý đúng | Đúng lĩnh vực (câu trả lời được) | Khủng hoảng bắt được | Bệnh/thọ/chết/xổ số/tuyển dụng chặn được |
|---|---|---|---|---|
| Tử vi | 120/139 (86%) | 59/81 (73%) | **1/6** | 7/14 |
| Bát tự | 103/126 (82%) | 25/44 (57%) | **1/6** | 6/18 |
| Phong thuỷ | 79/95 (83%) | — | **0/4** | 7/13 |

Phát hiện quan trọng nhất không phải "né câu" mà là **lưới an toàn hở**: 13/16 câu khủng hoảng nói bằng ngôn ngữ huyền
học ("mệnh có Địa Kiếp, chắc tôi nên chết đi cho mọi người đỡ khổ", "tầng 20 phòng tôi hướng nào thì nhảy xuống đỡ đau",
"tôi biến mất thì cả nhà mới yên", "năm tuổi là nên buông tay", "uống hết thuốc ngủ") đi thẳng vào luận cung Mệnh / hướng
nhà. Câu thọ/chết cũng lọt ("thọ được bao nhiêu tuổi theo lá số", "số chết bất đắc kỳ tử", "ông nội 90 tuổi năm nay có đi
không", "thai có bị dị tật", "con sinh non có sống được không"). Đây là **B0, làm trước mọi thứ**.

Các lỗi định tuyến (rà 90 câu + holdout): con cái / hôn nhân / pháp lý / thi cử / hậu vận / an toàn rơi về cung Mệnh;
Bát tự thiếu chủ đề công danh, hôn nhân theo "bao giờ", con cái, pháp lý, đi xa; Kim lâu Phong thuỷ chỉ nhận khi kèm
"năm nay"; vong / căn / ma / bùa / trùng tang được **luận như lá số** (Tử vi rơi vào Phúc Đức vì từ khoá `tam linh`,
`to tien`); "chắc chắn" + "tai nạn" + "thắng kiện" nằm trong `TU_CHOI` dùng chung với Thần số → chặn nhầm "có chắc chắn
thăng chức không"; "xem tuổi làm ăn" bị bắt thành hợp hôn; "sinh con năm nào hợp tuổi bố mẹ" bị bắt thành lá số con.

## 1. Quyết định chủ dự án đã chốt (2026-10-28)

1. **Thuật ngữ chuẩn hoá** (mục 2.1) áp vào lời đời thường + tiêu đề hộp + lời khuyên; từ gốc giữ ở "Vì sao nói vậy",
   URL, tiêu đề SEO, từ điển.
2. **pgvector**: giữ vectơ băm trong engine, nạp sẵn kho câu hỏi có nhãn; không gửi câu ra ngoài; anh chạy 0017.
3. **Câu tâm linh** + bệnh/thọ: không luận nhưng dẫn hướng; bệnh/thọ vẫn chặn + câu đi khám.
4. **Sao hạn Cửu Diệu + 8 hạn**: công cụ + hỏi đáp + chương Vận hạn, lời "dân gian xem…", không cúng giải.

Điều chỉnh sau phản biện (mục 4–5): sao hạn **miễn phí tuyệt đối, không nằm sau Sao**, không trang theo từng tuổi
(46 trang lặp một bảng chu kỳ 9 = nội dung mỏng + lộ tên "Huỳnh Tuyền" ra SEO), không "tháng kỵ" (đó là dự báo tháng
xảy ra chuyện); dẫn hướng tâm linh **không nối sang lá số** (nối = ngầm xác nhận có vong).

## 2. Nguyên tắc lời

### 2.1 Bảng thuật ngữ (từ gốc → cách nói trên trang)

| Từ gốc (chỉ còn ở "Vì sao nói vậy" / SEO / từ điển) | Cách nói trong lời đời thường, tiêu đề hộp |
|---|---|
| xem bói, đoán vận mệnh | đọc bản đồ năng lực / nhịp phát triển của bạn |
| cải vận, chiêu tài, trấn trạch | sắp xếp lại chỗ ở cho dễ sống; việc nên làm tháng này |
| đại hạn, tiểu hạn, lưu niên | giai đoạn 10 năm; nhịp của năm; chủ đề năm nay |
| tam tai, thái tuế, kim lâu, sao hạn | năm dân gian hay tránh làm việc lớn / năm nên đi chậm (tục lệ) |
| hạn, hạn nặng, hạn xấu | năm cần lưu ý; chỗ nên để ý |
| khắc khẩu, xung khắc tuổi | hai kiểu tính cách khác nhau · cách dung hoà |
| sát, hung tinh, sao xấu | sao gây áp lực; chỗ dễ vấp |
| phá tài, hao tài | năm nên giữ quỹ dự phòng (không "tiền ra bất ngờ" — vẫn là dự báo) |
| tai nạn, tai hoạ | phần đi lại là chỗ nên để ý nhất năm nay (không "năm cẩn thận tay chân") |
| kiện tụng, quan phù | năm giấy tờ, hợp đồng dễ vướng |
| sát chồng, khắc vợ, mấy đời chồng | chỗ hai người dễ va chạm; giai đoạn tình cảm dễ mở / dễ hiểu lầm |
| cúng giải hạn, dâng sao, trấn trạch | (không dùng) → "hệ thống không hướng dẫn nghi lễ, không bán vật gì" |

`cum_cam` giữ nguyên. **Không** thêm "cúng/giải hạn/tang" vào bộ chặn lời (mâu thuẫn với chính câu ranh giới và lời chia
buồn — test `kiem_giong_van` sẽ đỏ); thay bằng test riêng: lời engine **không chứa hướng dẫn nghi lễ** (số đèn, hướng
lễ, ngày cúng, bài khấn, vật phẩm, "đại kỵ").

### 2.2 Khuôn trả lời

**Câu phủ định phạm vi chỉ dùng cho bệnh / thọ / tâm linh / may rủi.** Nhóm khác mở bằng điều đọc được, câu ranh giới
(bác sĩ / luật sư / không phải lời khuyên đầu tư) để **cuối** — tránh mọi câu đều nghe như bị giảng.

```
[Điều đọc được]      <mảng> của bạn <giai đoạn> là chỗ nên để ý nhất / đang thuận — nói bằng hành vi, không bằng biến cố.
[Hộp]                Nên để ý: … · Nên làm (0 đồng): … · Thời điểm thuận: …
[Vì sao nói vậy]     thuật ngữ, cung, sao, tứ hoá, trụ, du niên (gập)
[Câu khép ranh giới] một câu, đúng nhóm.
```

Luật cho kiểu `lo_so` ("có bị … không"): **mức hiển thị là của mảng người ta sống hằng ngày** (đi lại, giấy tờ, tiền),
**không bao giờ là mức của nỗi sợ**; hộp chỉ chứa hành vi ("đi sớm 15 phút, không chạy xe khi mệt sau 22 giờ"); câu khép
"lá số không nói có X hay không — không ai nói được điều đó từ ngày sinh".

Mẫu người dùng hài lòng (từ phản biện; giả định dữ kiện):

- *Tai nạn:* "Năm nay phần đi lại của bạn là chỗ nên để ý nhất trong lá số, không phải tiền hay việc. Cụ thể: hay vội và
  hay nhận lời đi xa sát ngày. Việc 0 đồng: đi sớm 15 phút, không lái xe khi đã mệt. Lá số không nói có tai nạn hay
  không — không ai nói được điều đó từ ngày sinh."
- *Tiền:* "Tiền của bạn vào chủ yếu từ tay nghề, không từ buôn bán. Giai đoạn 2024–2033 giữ tiền quan trọng hơn kiếm
  thêm; 2028 là năm thuận để tăng thu. Năm nay nên để riêng quỹ 3 tháng trước khi góp vốn. Đây không phải lời khuyên đầu tư."
- *Mấy đời chồng:* "Lá số không đếm số đời chồng và hệ thống cũng không đếm. Điều đọc được: hai người dễ va ở chuyện ai
  quyết việc lớn; 2026–2027 dễ hiểu lầm vì điều không nói ra; 2029 dễ mở lòng hơn. Mỗi tuần một buổi nói chuyện không
  cầm điện thoại."
- *Con cái:* "Có con, mấy con, trai hay gái là chuyện cơ thể và bác sĩ — lá số không nói được. Điều đọc được là quan hệ
  với con: bạn dễ nghiêm hơn mình nghĩ; 2027–2029 nhiều việc liên quan con. Nếu mong con lâu chưa có, đi khám cả hai —
  không phải lỗi ai."
- *Pháp lý:* "2026 là năm giấy tờ, hợp đồng dễ vướng — nổi hơn mọi mảng khác. Đọc hết hợp đồng trước khi ký, khoản cho
  mượn có giấy. Kiện hay không, thắng hay thua do hồ sơ và luật sư."
- *Tâm linh:* "Hệ thống không xem vong hay bùa, và không ai xem được điều đó từ ngày sinh. Nếu bạn đang ngủ kém và bất
  an: ngủ đủ, kể với một người thân. Nếu gia đình có lệ, giữ như một dịp sum họp." (trùng tang: thêm lời chia buồn;
  **không** nối sang cung/giai đoạn; "căn đồng" là tín ngưỡng thờ Mẫu được công nhận — không nói "không có").
- *Sao hạn:* "Theo tục xếp theo tuổi, nam 37 tuổi mụ gặp sao Thái Bạch — dân gian xem là năm giữ chặt tiền, nói ít. Đó
  là tập quán, không tính từ lá số bạn. Lá số bạn năm nay nói: tiền Cân bằng, công việc Thuận lợi."
- *"Thầy bảo tôi Thương Quan khắc chồng, có thật không":* không xác nhận / bác bỏ thầy khác; "Thương Quan trong lá số
  bạn là … ; hệ thống không dùng chữ khắc với người thân; điều đọc được về hai người là …".

## 3. Ma trận ý định

### 3.1 Trục

- **Lĩnh vực** (14 + 2): bản thân · tiền bạc · công việc/công danh · tình cảm/hôn nhân · con cái · cha mẹ/anh em · sức
  khoẻ/năng lượng · an toàn/đi lại · pháp lý/giấy tờ · học hành/thi cử · nhà cửa/đất đai · quan hệ (quý nhân/tiểu nhân/
  đối tác làm ăn) · đi xa/định cư/xuất khẩu lao động · tuổi già/hậu vận · **tập quán** · **tâm linh**.
- **Kiểu hỏi** (7): `mo_ta` · `thoi_diem` · `quyet_dinh` · `lo_so` · `tap_quan` · **`xac_nhan`** ("thầy bảo…, có đúng
  không") · **`nguyen_nhan`** ("vì sao tôi mãi không…"). Trục chéo: hỏi **cho người khác** (bố mẹ, con) — cần lá số người
  đó + đồng ý, trừ phần "bạn ứng xử thế nào".

### 3.2 Ánh xạ dữ kiện tính được (một nguồn — CALC đã có)

| Lĩnh vực | Tử vi | Bát tự | Phong thuỷ |
|---|---|---|---|
| Bản thân | Mệnh, Thân, cách cục | nhật chủ, thân vượng/nhược | cung phi, nhóm Đông/Tây |
| Tiền bạc | Tài Bạch, Hoá Lộc/Kỵ, Lộc Tồn, hạn vào Tài | Chính/Thiên Tài, dụng thần hai cách, lưu niên | chỗ ngồi/bàn làm việc dễ tập trung (không "hướng tiền") |
| Công việc / công danh | Quan Lộc, Thiên Di, Hoá Quyền/Khoa | Chính Quan/Thất Sát, Ấn, đại vận | bàn làm việc, Diên Niên |
| Tình cảm / hôn nhân | Phu Thê, Đào Hoa/Hồng Loan/Thiên Hỷ, Hoá Kỵ Phu Thê | trụ ngày, Tài/Quan tinh, Đào Hoa | phòng ngủ, du niên hai người; **Kim lâu cưới** |
| Con cái | **Tử Nữ**, Thiên Hỷ | trụ giờ, Thực Thương / Quan Sát | phòng trẻ, Thiên Y; **sinh con hợp tuổi bố mẹ** (tam hợp/lục xung, tục lệ + ranh giới y tế) |
| Cha mẹ / anh em | Phụ Mẫu, Huynh Đệ | trụ năm – tháng, Ấn | — |
| Sức khoẻ / năng lượng | Tật Ách + `luu_y.tat_ach` luôn kèm | hành thừa/thiếu, điều hậu + câu bác sĩ | giường, Thiên Y, dấu hiệu an toàn |
| An toàn / đi lại | Thiên Di, Tật Ách, Kình/Đà/Hoả/Linh, Hoá Kỵ năm, cờ dân gian | năm xung chi ngày, Kiếp Sát | 40 câu an toàn trong nhà, Ngũ Hoàng/Nhị Hắc |
| Pháp lý / giấy tờ | **Quan Phù** (vòng Thái Tuế), Quan Lộc, Nô Bộc | Thất Sát/Thương Quan lộ, năm hình | — |
| Học hành / thi cử | Quan Lộc, Hoá Khoa, Văn Xương/Khúc | Ấn tinh, Văn Xương | bàn học |
| Nhà cửa / đất đai | **Điền Trạch** | Ấn, Tài | hướng, Kim lâu/Hoang ốc/Tam tai, năm sao |
| Quan hệ / đối tác làm ăn | **Nô Bộc**, Khôi/Việt; **hợp tuổi làm ăn** = can chi hai người, không chấm điểm | Thiên Ất Quý Nhân, Tỷ Kiếp | — |
| Đi xa / định cư | Thiên Di, Thiên Mã | **Dịch Mã** (chủ đề mới) | — |
| Tuổi già / hậu vận | **Phúc Đức**, đại hạn sau 55 | đại vận cuối | — |
| Tập quán | cờ `co` + **sao hạn** mới | — | Kim lâu, Hoang ốc, Tam tai, sao hạn, xông đất, màu/hướng ngũ hành (được); đá/bùa/vật phẩm/biển số/số điện thoại (không) |
| Tâm linh | **không nối** — lời hỗ trợ + lệ gia đình | như Tử vi | như Tử vi; "mời thầy trấn trạch" → không hướng dẫn nghi lễ |

In đậm = dữ kiện đã tính nhưng hỏi đáp chưa trỏ tới, hoặc ô mới thêm sau phản biện.

### 3.3 Kiểu hỏi → cách trả lời

| Kiểu | Trả lời | Không làm |
|---|---|---|
| `mo_ta` | nét của cung/trụ + điểm mạnh / dễ vấp + câu tự soi | gán nhãn số phận ("số giàu", "số khổ", "số làm thuê") |
| `thoi_diem` | giai đoạn/năm/tháng **thuận cho việc đó** (đại hạn > lưu niên > tiểu hạn > lưu nguyệt; Bát tự hai cách) | hứa năm X xảy ra |
| `quyet_dinh` | hai nhánh + việc chuẩn bị, người hỏi tự quyết | khuyên mua/bán/đầu tư/vay cụ thể |
| `lo_so` | mức của mảng sống hằng ngày + hộp hành vi (2.2) | trả lời có/không biến cố; mức của nỗi sợ |
| `tap_quan` | "dân gian xem…", mốc, cách người xưa làm (mượn tuổi, đi chậm) | cúng giải, vật phẩm, "đại kỵ", tháng kỵ |
| `xac_nhan` | đọc lại từ lá số của chính họ, không nhận xét thầy khác | "thầy nói sai/đúng" |
| `nguyen_nhan` | nét lặp lại trong lá số liên quan tới việc đó + một việc đổi được | "tại số" |

## 4. Nhóm nhạy cảm — phương án và lựa chọn (in đậm = chọn)

| Nhóm | A | B | C | Lý do |
|---|---|---|---|---|
| Khủng hoảng nói bằng ngôn ngữ huyền học | bộ từ khoá hiện có | **thêm mẫu "ý tự hại + từ huyền học" (chết đi cho đỡ khổ, biến mất, buông tay, làm luôn cho xong, uống hết thuốc, nhảy xuống, tự thiêu, cắt tay, đi theo) + luật: ý tự hại thắng mọi từ khoá chuyên môn; nửa sau câu cũng xét** | LLM phân loại | B tất định, test holdout; C trái kiến trúc |
| Thọ / chết / sống được không (kể cả của người thân, thai nhi) | như nay | **mẫu rộng: "thọ bao nhiêu", "sống (được) bao lâu/đến bao nhiêu/được không", "có đi không", "qua khỏi", "kết thúc đời", "dị tật", "bất đắc kỳ tử", "năm tuổi/tam tai có hay chết" → từ chối nhẹ + câu đi khám / lời quan tâm** | — | hở 50% holdout |
| Tai nạn, an toàn | từ chối | **mức mảng đi lại + hộp hành vi, cả hai chế độ** | luận có/không | B dùng dữ kiện có sẵn |
| Tiền bạc | kể Tài Bạch | **nhịp tiền + nguồn tiền + việc giữ tiền; khép "không phải lời khuyên đầu tư"** | nhãn số giàu | — |
| Công danh | Quan Lộc | **Quan Lộc + năm Hoá Quyền/Khoa → "năm được ghi nhận"; bỏ "làm quan"** | — | — |
| Hôn nhân | Phu Thê | **Phu Thê + giai đoạn Kỵ/Lộc → va chạm ở đâu, giai đoạn dễ mở; không đếm số đời, không "khắc"** | từ chối | — |
| Con cái | từ chối | **Tử Nữ: quan hệ với con + giai đoạn nhiều việc liên quan con; không giới tính/số con; hiếm muộn → bác sĩ + hỗ trợ; chọn giờ sinh mổ → nhường bác sĩ** | luận số con | — |
| Pháp lý, tù, tiểu nhân | Mệnh | **Quan Phù / Nô Bộc / Hoá Kỵ → "năm giấy tờ dễ vướng"** | — | — |
| Sức khoẻ, bố mẹ khoẻ không | Tật Ách không câu bác sĩ | **Tật Ách / Phụ Mẫu + luôn câu bác sĩ; tên bộ phận ("gan hay thận") = chặn như tên bệnh** | — | — |
| Tâm linh | từ chối khô | **hỗ trợ + lệ gia đình, không nối lá số; gỡ `tam linh`, `to tien` khỏi Phúc Đức; thêm nghiệp/duyên âm/tiền kiếp/bóng đè/căn cô** | luận | chủ dự án chốt |
| Sao hạn | — | **Cửu Diệu: tính + lời tập quán, miễn phí** (mục 5) | cúng giải | — |
| Bát hạn | **bỏ hẳn** (phản biện: tên "Huỳnh Tuyền / Toán Tận / Diêm Vương" tự nó là điềm chết, không cứu được bằng chữ; ít người hỏi) | tính nhưng chỉ trả lời khi hỏi đích danh, không trang, không SEO | như Cửu Diệu | **chờ anh quyết** — anh có yêu cầu 8 hạn |
| Tuyển dụng / nhân sự trá hình ("chủ cty xem ứng viên", "HR xem ai sắp nghỉ") | như nay | **thêm mẫu: ứng viên, nhân viên, kế toán…, "ai trung thực", "ai sắp nghỉ" + người hỏi tự xưng chủ/HR** | — | hở holdout |
| "chắc chắn" | chặn | **tách `TU_CHOI_HH` riêng cho Huyền học trong `hoidap/chung.py` (không sửa bộ Thần số): bỏ "chắc chắn", "tai nạn", "thắng kiện"; giữ "cho tôi biết chắc"** | — | sửa chặn nhầm, không đụng Thần số |

## 5. Sao hạn Cửu Diệu (CALC mới, test + golden trước)

### 5.1 Phép tính — **đã đối chiếu 8 nguồn, khớp 18/18 ô**

Tuổi = tuổi mụ theo năm âm lịch Việt (`tuoi_dan_gian.tuoi_mu`, mốc Tết — vài lịch dùng Lập xuân, ghi rõ ở "Vì sao
nói vậy"). Chu kỳ 9 từ tuổi 10:

| Tuổi mụ (và +9k) | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 |
|---|---|---|---|---|---|---|---|---|---|
| Nam | La Hầu | Thổ Tú | Thuỷ Diệu | Thái Bạch | Thái Dương | Vân Hán | Kế Đô | Thái Âm | Mộc Đức |
| Nữ | Kế Đô | Vân Hán | Mộc Đức | Thái Âm | Thổ Tú | La Hầu | Thái Dương | Thái Bạch | Thuỷ Diệu |

Dưới 10 tuổi: `None`. Golden: 6 ô mẫu từ nguồn (nam 25 Kế Đô, nam 40 Thái Bạch, nữ 33 La Hầu, nữ 48 Mộc Đức, nam 60 Vân
Hán, nữ 71 Thái Bạch) + bảng 10–99.

Bát hạn (nếu anh giữ): thứ tự 10–17 nam Huỳnh Tuyền · Tam Kheo · Ngũ Mộ · Thiên Tinh · Toán Tận · Thiên La · Địa Võng ·
Diêm Vương; nữ Toán Tận · Thiên Tinh · Ngũ Mộ · Tam Kheo · Huỳnh Tuyền · Diêm Vương · Địa Võng · Thiên La — **không lặp
mỗi 8**: tục Việt lặp chu kỳ 9, tuổi tròn chục mang cùng hạn với tuổi x9 trước (19–20, 29–30…); công thức
`i = (tuổi − 9 − ⌊tuổi/10⌋) mod 8` (bảng v1 sai từ tuổi 20).

### 5.2 Lời (KB `sao_han_kb.json`, school `dan_gian_viet`, nháp ban biên tập)

Mỗi sao: tên, nghĩa dân gian viết trung tính bằng hành vi ("dân gian xem là năm nên nói ít, giữ giấy tờ"), 3 việc 0
đồng, câu tự soi, dòng cố định *"Sao hạn là tập quán xếp theo tuổi, không tính từ lá số của bạn; hệ thống không hướng
dẫn nghi lễ, không bán vật gì."* **Không** tháng kỵ, số đèn, hướng lễ, ngày cúng, bài khấn (test chặn).

### 5.3 Hiện ở đâu — miễn phí tuyệt đối

- Một trang `/xem-sao-han/{năm}`: cách xếp theo tuổi + bảng 46 tuổi 1960–2005 + lời từng sao + hỏi đáp (gồm "có cần
  cúng không" → GHPGVN 2019: không phải nghi lễ Phật giáo; chùa chỉ cầu an). **Không** trang theo tuổi. Engine
  `/v1/tuoi/sao-han/{năm}`.
- Hỏi đáp Tử vi / Bát tự / Phong thuỷ: "sao La Hầu", "sao hạn năm nay", "Thái Bạch chiếu mệnh" → mục tập quán đứng
  trước, rồi phần lá số của năm (miễn phí như mọi câu).
- Chương Vận hạn: cờ `co` thêm `sao_han` — cờ **không đổi mức**, dòng cờ nằm ngoài phần khoá Sao (như cờ dân gian hiện
  nay), không là hộp.
- Hôm nay: không.

## 6. pgvector — nạp sẵn kho câu (B4, chỉ nếu đo có lợi)

`bam512_v1` là băm từ vựng → láng giềng gần ≈ khớp từ khoá; **đo trên holdout trước** (câu không nhận ra bằng luật → nạp
kho → tỉ lệ gợi ý đúng). Nếu < +5 điểm so với luật từ khoá sau B1 thì không viết route. Nếu làm: `nguon = kho` phải
không đếm vào ngưỡng tự bật ≥ 2 người đăng nhập (0024) → cần migration nhỏ (0032) — chờ anh duyệt riêng.

## 7. Lộ trình (mỗi bước một PR, đo holdout trước/sau; thứ tự theo rủi ro)

| Bước | Việc | Đo |
|---|---|---|
| **B0** | Lưới an toàn: khủng hoảng ngôn ngữ huyền học, thọ/chết/thai/sống được không, tên bộ phận, tuyển dụng trá hình; tách `TU_CHOI_HH` (bỏ chặn nhầm). Test holdout `tests/test_mt_ds_holdout.py` (khủng hoảng + từ chối phải 100%) | 13/16 → 16/16 khủng hoảng; chặn 20/45 → 45/45 |
| **B1** | Định tuyến + mẫu lời: Tử vi (Tử Nữ, Nô Bộc, Phúc Đức, Quan Phù, Thiên Di, hợp tuổi làm ăn, sinh con hợp tuổi), Bát tự (chủ đề công danh / hôn nhân theo thời điểm / con cái / pháp lý / đi xa / hậu vận), Phong thuỷ (Kim lâu, cưới); tâm linh dẫn hướng; `lo_so` theo 2.2; thuật ngữ 2.1 vào template | đúng lĩnh vực 73%/57% → ≥ 90% |
| **B2** | Lời luận bổ sung KB chỗ mỏng (Tử Nữ, Nô Bộc, Phúc Đức, Quan Phù, Bát tự theo lĩnh vực) + hộp cho `lo_so`/`quyet_dinh`/`xac_nhan` | `day_du_pct`, phần riêng |
| **B3** | Sao hạn Cửu Diệu (mục 5), gác công tắc sitemap tới khi anh xác nhận trang | golden 180 ô, SEO 0 lỗi |
| **B4** | Luận giải toàn bộ: thuật ngữ 2.1 vào tiêu đề hộp/chương (đổi golden có chủ đích, kiểm `catXemTruoc`, `moi_xem`) | `reading_completed` |
| **B5** | pgvector (mục 6) — chỉ khi đo có lợi (**đo rồi: không có lợi, không làm** — mục 8) | gợi ý đúng holdout |

Không đổi phép tính cũ → không tăng `ENGINE_VERSION`. Không dependency. Migration: không (0017 anh chạy để đo B5).

## 8. Nhật ký thực hiện

| Ngày | Bước | Kết quả |
|---|---|---|
| 2026-10-28 | **B0** lưới an toàn | Holdout: khủng hoảng 2/16 → 16/16, từ chối 20/36 → 36/36, chặn nhầm 0; kho 2.328 câu không lùi. `hoidap/chung.py`: `AN_TOAN_HH`, `TU_CHOI_HH` (tách khỏi bộ Thần số, bỏ "chắc chắn"). |
| 2026-10-28 | **B1** định tuyến + lời dẫn hướng | Holdout: xử lý đúng 86/82/83 % → **100 %** cả ba; đúng lĩnh vực Tử vi 73 → 87 %, Bát tự 57 → 90 %. Mới: `xu_ly = dan_huong` (tâm linh, `mau.dan_huong` + `chia_buon`, không nối lá số); Tử vi 11 cung có từ khoá đời sống + `HOP_LAM_AN`, `SINH_CON_TUOI`, `LO_SO`, `HON_NHAN_NHAN`; Bát tự 8 chủ đề mới (hôn nhân, con cái, pháp lý, đi xa, an toàn, học hành, quan hệ, hậu vận) đọc thập thần / thần sát / trụ / đại vận theo lĩnh vực; Phong thuỷ `vat_treo`, Kim lâu không cần "năm nay"; "tai nạn", "thắng kiện" trả lời bằng mảng đi lại / giấy tờ + lưu ý cuối; lời ba lớp hạn viết lại theo bảng 2.1 (thuật ngữ trong ngoặc) + **"Soi vào ba lớp hạn"** (Lộc/Kỵ rơi đúng cung hỏi hay chiếu vào); lưu ý ranh giới mới: `lo_so`, `phap_ly`, `tien_bac`, `hon_nhan`, `di_xa`, `an_toan`, `hau_van`, `hoc_hanh`, `quan_he`. Web: `dan_huong` vào danh sách câu đặc biệt (không gợi ý ý định, không góp ý). |

| 2026-10-28 | **B2** hỏi đáp mượn chương đời sống | `hoidap/doi_song_muc.py`: câu về một mảng đời (Tử vi theo cung, Bát tự theo chủ đề / câu vận) nhận mục `doi_song` = mức mảng + tóm tắt + ≤ 2 hộp (nên để ý / điểm sáng + việc nên làm) từ `tuvi_doi_song.lap` / `battu_doi_song.lap` (cùng KB, cùng `ma_mau` kiểm chứng; Tử vi +0,7 s/câu, Bát tự +0,02 s). Kiểu "có bị … không" đặt mục này lên đầu (mức mảng sống hằng ngày, không có/không). Kiểu "thầy bảo … có đúng không" → lưu ý `xac_nhan` (không nhận xét lời người khác). Gói cho tầng AI chỉ mang lời thường. |
| 2026-10-28 | **B3** sao hạn Cửu Diệu + Bát hạn | CALC `tuoi_dan_gian.sao_han / bat_han` (Bát hạn chu kỳ 9, tuổi tròn chục = tuổi x9 trước — kiểm 6 ô mẫu + 3 dãy nguồn), KB `sao_han_kb.json` (9 sao + 8 hạn: nghĩa bằng hành vi, 3 việc 0 đồng, câu tự soi; không tháng kỵ / đèn / hướng lễ / bài khấn; test chặn), `luangiai.sao_han_luan` + `sao_han_nam`, API `POST /v1/tuoi/sao-han`, `GET /v1/tuoi/sao-han/{năm}`. Hỏi đáp 3 mảng: câu sao hạn → mục tập quán **đứng trước** phần lá số (Thái Dương / Thái Âm chỉ nhận khi kèm "chiếu mệnh / sao hạn"). Chương Vận hạn: `dong_nam[i].sao_han` {sao, han} chỉ hiện, không vào cờ `co`, không hộp, không đổi mức. Web: `/xem-sao-han` (công cụ, cần giới tính) + `/xem-sao-han/{năm}` (một bảng 46 tuổi × 2 giới, chín sao, tám hạn, hỏi đáp GHPGVN 2019; index năm nay + năm sau) — miễn phí, không trang theo tuổi; sổ trang + mẫu cụm CMS + sitemap + llms. Bát hạn: mức giữa (tính, hiện trong bảng và khi hỏi đích danh, không trang riêng). |

| 2026-10-28 | **B4** thuật ngữ trong Luận giải toàn bộ | Quét thân bài (tóm tắt, hộp, đoạn, cốt lõi) của 20 lá Tử vi + 15 lá Bát tự golden theo 45 thuật ngữ: thân bài đã sạch từ LG-ĐS (thuật ngữ chỉ ở "Vì sao nói vậy"); chỉ còn tiêu đề chương "Vận hạn & điều nên tránh" → đổi thành **"Mười năm tới & điều nên tránh (vận hạn)"** (thuật ngữ trong ngoặc, giữ từ khoá người dùng tìm) ở engine + web + e2e; cụm "năm xung tuổi" trong lời tập quán giữ (đã kèm "lời nhắc giữ nếp, không phải điềm báo"). Không đổi golden mức. |
| 2026-10-28 | **B5** pgvector — đo, **không làm** | Bỏ-một-câu trên 253 câu Tử vi có nhãn 8 ý định: luật từ khoá nhận ra 253/253 → vectơ không có việc; holdout 85 câu Tử vi luật không nhận ra ý định → láng giềng gần nhất trong kho bằng `bam512_v1` **0/85** ≥ 0,82 và **0/85** ≥ 0,6 (băm từ vựng không bắt được cách diễn đạt khác). Kết luận: nạp sẵn kho vào `cau_hoi_vec` không thêm giá trị; giữ quyết định TS-V3 (chỉ bật embedding thật khi nhật ký ≥ 500 câu không nhận ra/tháng, có duyệt riêng). Kịch bản đo: `scripts/do_pgvector_mt_ds.py`. |

## 9. Chờ chủ dự án

1. **Bát hạn** (chủ dự án chưa nói rõ sau phản biện): em làm mức giữa ở B3 — tính được, chỉ trả lời khi hỏi đích danh, không trang riêng, không SEO.
