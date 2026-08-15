---
name: thanso-hoc
description: Tính và luận thần số học Pythagoras cho người Việt, kèm đo độ nhạy quy ước. Kích hoạt khi người dùng nói "thần số học", "numerology", "số chủ đạo", "đường đời", "sứ mệnh", "linh hồn", "nhân cách", "biểu đồ ngày sinh", "năm cá nhân", hoặc đưa tên và ngày sinh hỏi về con số của mình. Module anh em với `tuvi-vn` và `kinh-dich`; KHÔNG gộp chung một lượt luận. TUYỆT ĐỐI không dùng cho tuyển dụng, phân công nhân sự, hay đánh giá năng lực.
---

# Thần số học — khung tính và luận cho người Việt

## 0. Định vị: đây là hệ yếu nhất trong ba module

Ba module `tuvi-vn`, `kinh-dich`, `thanso-hoc` không ngang nhau về nền tảng. Phải nói rõ:

| | Đầu vào | Nguồn gốc | Số phạm trù |
|---|---|---|---|
| Tử Vi | Thiên văn (âm lịch, tiết khí, giờ sinh) | Nhiều thế kỷ, có văn bản, có tranh luận nội bộ | Rất lớn (tổ hợp 12 cung × 110+ sao) |
| Kinh Dịch | Ngẫu nhiên thật (thệ pháp / tiền) | Tây Chu, có phân tầng văn bản rõ | 64 × 64 quẻ biến |
| **Thần số học** | **Lịch Gregory + chính tả tên** | **Mỹ, 1905–1965** | **12** |

Ba điểm khiến nó yếu hơn hẳn, và không điểm nào là ý kiến cá nhân:

**1. "Pythagoras" là nhãn tiếp thị, không phải nguồn gốc.** Hệ đang dùng — Đường đời,
Sứ mệnh, Linh hồn, Nhân cách, Đỉnh cao, Chu kỳ — do ba phụ nữ Mỹ dựng nên trong khoảng
1905–1965: **L. Dow Balliett** (sách đầu 1905, *Philosophy of Numbers* 1908),
**Julia Seton Sears** (đặt ra chính chữ "Numerology"), và **Juno Jordan** (Viện Nghiên
cứu Số học California, *The Romance in Your Name* 1965). Ngay các trang chuyên về thần
số học cũng thừa nhận điều này — một trang viết thẳng rằng Pythagoras không liên quan gì
đến hệ mang tên ông, một trang khác gọi cái nhãn ấy là "một phần truyền thống, một phần
thương hiệu". Gốc triết học về ý nghĩa của số thì thật sự cổ; **bộ công cụ đang dùng thì
mới hơn xe hơi.**

**2. Đầu vào là quy ước hành chính, không phải hiện tượng tự nhiên.** Tử vi lấy vị trí
thiên thể; Kinh Dịch lấy ngẫu nhiên vật lý. Thần số học lấy **lịch Gregory** (một quyết
định của giáo hoàng năm 1582) và **cách viết tên trên giấy tờ**. Đổi quy ước là đổi kết
quả, mà quy ước thì do người đặt ra.

**3. Với tên tiếng Việt, con số gần như không xác định.** Xem Mục 2 — đây là phát hiện
quan trọng nhất của module này, và nó đo được bằng số.

Kết luận định vị: dùng như **gợi ý cho một cuộc trò chuyện về bản thân** thì được. Dùng
như **mô tả sự thật về một con người** thì không. Và dùng để **đánh giá người khác** thì
tuyệt đối không — xem Mục 6.

## 1. Cách tính

```bash
pip install --break-system-packages nothing   # script chỉ dùng thư viện chuẩn
python3 thanso.py --ten "Nguyễn Văn Đức Trường" --ngay 20 --thang 1 --nam 1990
```

Bảng Pythagoras: A–I = 1–9, J–R = 1–9, S–Z = 1–8.

- **Đường đời** — từ ngày sinh. Trọng số lớn nhất trong hệ.
- **Sứ mệnh** (Expression) — tổng mọi chữ cái trong tên.
- **Linh hồn** (Soul Urge) — nguyên âm.
- **Nhân cách** (Personality) — phụ âm.
- **Ngày sinh** — ngày trong tháng, rút gọn.

Số cái (master) 11, 22, 33 được giữ nguyên, không rút tiếp.

## 2. Độ nhạy quy ước — phần quan trọng nhất

Script không trả về **một** con số. Nó quét mọi quy ước hợp lý và trả về **khoảng** giá
trị có thể có. Lý do: với tên tiếng Việt, mỗi lựa chọn dưới đây đều có người dùng, và
mỗi lựa chọn cho một số khác:

- **Đ/đ xử lý ra sao?** Đ không phải D cộng dấu — nó là chữ cái riêng, không có trong
  bảng Latin gốc. Coi Đ = D (giá trị 4) hay bỏ hẳn? Không có câu trả lời có nguyên tắc.
- **Bỏ dấu thanh và dấu mũ** — ê, ơ, ư, ă, â đều biến thành e, o, u, a. Nghĩa là *Trường*
  và *Truong* cùng một số, dù là hai chữ khác nhau trong tiếng Việt.
- **Lấy tên nào?** Tên khai sinh đầy đủ, tên thường gọi, hay bỏ tên đệm?
- **Y là nguyên âm hay phụ âm?** Đổi cả Linh hồn lẫn Nhân cách.
- **Rút gọn Đường đời kiểu nào?** Cộng hết tất cả chữ số, hay rút từng phần ngày/tháng/năm
  rồi mới cộng? Hai cách cho kết quả khác nhau.
- **Có giữ số cái 11/22/33 không?**

Chạy thử một cái tên Việt hoàn toàn bình thường, sinh 20/01/1990:

| Chỉ số | Số giá trị khác nhau có thể ra | Các giá trị |
|---|---|---|
| Sứ mệnh | **6** | 2, 3, 6, 7, 8, 11 |
| Linh hồn | 4 | 1, 2, 3, 9 |
| **Nhân cách** | **7 / 12 phạm trù** | 2, 3, 5, 7, 8, 9, 11 |
| Đường đời | 2 | 4 hoặc **22** |

Riêng Đường đời: chỉ cần đổi quy ước số cái là nhảy từ **4** (người lao động cần cù)
sang **22** (Kiến trúc sư bậc thầy) — hai mô tả gần như trái ngược, cùng một người,
cùng một ngày sinh.

**Hệ quả bắt buộc:** không được đưa ra con số nào trước khi người dùng **tự chốt quy ước**
và quy ước đó được ghi lại. Nếu chưa chốt, chỉ được trình bày khoảng giá trị.

## 3. Bao nhiêu người trùng số với bạn

`python3 thanso.py --phan-bo` (khảo sát mọi ngày sinh 1950–2010):

| Đường đời | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tỷ lệ | 11,1% | **1,5%** | 11,1% | 9,1% | 11,1% | 5,3% | 11,1% | 11,1% | 11,1% | 9,6% | 2,0% | 5,8% |

Hai điều đọc ra từ bảng này:

1. **Khoảng 11% nhân loại cùng Đường đời với anh** — cỡ 900 triệu người. Bất kỳ mô tả nào
   đúng cho cả 900 triệu người thì nhất định là mô tả rất rộng.
2. **Phân bố lệch hẳn, và lệch vì một quy ước chứ không vì điều gì có thật.** Số 2 chỉ
   1,5% trong khi số 1 là 11,1% — không phải vì người "số 2" hiếm, mà vì quy ước giữ số
   cái 11 đã hút gần hết phần lẽ ra rút về 2. Tương tự 33 hút của 6, 22 hút của 4. Một
   đặc điểm nổi bật của hệ hoá ra là sản phẩm của một lựa chọn kỹ thuật.

## 3b. Bốn năng lực được yêu cầu — cái nào làm được, cái nào không

Đây là bảng đánh giá thẳng, không phải bảng tính năng quảng cáo.

| Yêu cầu | Skill làm được? | Lý do |
|---|---|---|
| **Hiểu rõ tính cách** | Một phần — như **đề tài phản tư**, không phải "nhận diện" | Chỉ 12 phạm trù, ~11% dân số mỗi nhóm; với tên Việt, Nhân cách ra tới 7 giá trị khác nhau (Mục 2) |
| **Định hướng nghề nghiệp** | **Không**, ở dạng khuyến nghị nghề | Không có hiệu lực dự báo hiệu suất; có công cụ khác đo được tốt hơn (xem Mục 3c) |
| **Cải thiện mối quan hệ** | **Không — ngoài phạm vi, và có hại** | Cần dữ liệu người thứ ba; tạo định kiến thay cho việc lắng nghe (xem Mục 3d) |
| **Dự báo chu kỳ** | Tính được, "dự báo" thì không — nhưng **kiểm chứng được** | Chu kỳ 9 năm tiền định từ ngày+tháng sinh; chính vì tiền định nên nó là phần DUY NHẤT của thần số học có thể kiểm chứng nghiêm túc (Mục 3e) |

Điều đáng chú ý: **năng lực thứ tư lại là năng lực mạnh nhất về mặt phương pháp**, đúng
vì nó cứng nhắc. Nó phát biểu một mẫu hình cố định, nên có thể đối chiếu với đời thực và
có thể sai. Ba năng lực kia mềm hơn, nghe hay hơn, và không bao giờ sai — nên không nói
lên điều gì.

## 3c. Về định hướng nghề nghiệp

Cho phép: **phản tư về sở thích và cách làm việc của chính mình**
("tôi thường bỏ dở khi nào", "tôi làm việc một mình hay theo nhóm thì bền hơn").

Không cho phép: **khuyến nghị nghề** ("số 8 nên làm kinh doanh"). Lý do đơn giản là số
học: mỗi số Đường đời ứng với khoảng 11% dân số. Một lời khuyên nghề đúng cho 900 triệu
người thì không phải lời khuyên.

Nếu người dùng thật sự cần định hướng nghề, nói rõ có những thứ được đo lường tốt hơn:
mô tả công việc cụ thể, bài thử việc thật, phỏng vấn có cấu trúc, bảng hỏi sở thích nghề
nghiệp kiểu Holland/RIASEC (có hiệu lực khiêm tốn với sự hài lòng và mức độ gắn bó, chứ
không phải với năng lực). Đừng bán con số làm giải pháp cho một câu hỏi lớn của đời người.

## 3d. Vì sao "hiểu người khác" bị loại khỏi phạm vi

Ba lý do, xếp theo mức nghiêm trọng tăng dần:

1. Cần tên và ngày sinh của người thứ ba, thường là **không có sự đồng ý của họ**.
2. Nó cho người dùng một niềm tin cố định về nội tâm người khác, dựng từ cách viết tên
   của họ. Niềm tin đó **thay thế cho việc lắng nghe** — và nó bền hơn bằng chứng, vì
   nó tự nhận là biết trước.
3. Trong xung đột thật, thứ làm giảm xung đột là hỏi người kia đang nghĩ gì, chứ không
   phải tra con số của họ. Skill này nếu làm việc đó sẽ **chủ động đứng chắn** trước cơ
   chế duy nhất thật sự có tác dụng.

Phiên bản hẹp được phép: dùng con số **của chính người dùng** để soi lại cách chính họ
ứng xử khi căng thẳng. Đó là tự phản tư, không phải đọc người khác.

Khi người dùng yêu cầu xem cho người khác: dừng ở cổng **G6** (`HUMAN-IN-LOOP.md`).

## 3e. Chu kỳ — phần đáng làm nhất

```bash
python3 thanso.py --ngay 20 --thang 1 --nam 1990 --chu-ky 2015 2030
```

Xuất ra: **Năm cá nhân** từng năm, **4 Đỉnh cao** kèm mốc tuổi (đỉnh 1 kết thúc ở
36 − số Đường đời), **4 Thử thách**, và bảng đối chiếu theo tuổi mụ.

Ba điều phải nói cùng lúc với kết quả:

1. **Chu kỳ là tiền định, không phải dự báo.** Năm cá nhân chạy 1→9 rồi lặp, tính thẳng
   từ ngày và tháng sinh. Biết ngày sinh là biết toàn bộ chuỗi tới cuối đời. Không có
   thông tin nào được thêm vào.
2. **~22 triệu người có chuỗi y hệt anh** (1/366 dân số — bất kỳ ai cùng ngày+tháng sinh),
   trùng khít suốt đời, không lệch một năm.
3. **Mốc đổi năm là một nhánh độ nhạy nữa**: có nhà đổi vào sinh nhật, có nhà đổi vào 1/1.
   Ở khoảng đầu năm, hai quy ước cho hai con số khác nhau.

Nhưng chính vì cứng nhắc mà nó kiểm chứng được — xem prompt Mục 5b.

## 4. Prompt — Luận thần số học

```
VAI TRÒ
Bạn luận thần số học Pythagoras. Bạn coi các con số là ĐỀ TÀI để người đọc soi lại
mình, không phải sự thật về người đó.

DỮ LIỆU
{{THANSO_JSON}}   (từ thanso.py, gồm cả khoảng độ nhạy)
Quy ước người dùng đã tự chốt: {{QUY_UOC}}

RÀNG BUỘC
1. Nếu {{QUY_UOC}} trống → DỪNG. Trình bày khoảng giá trị, hỏi người dùng chốt quy ước,
   KHÔNG luận. Tự chọn quy ước giùm họ là tạo ra một sự chắc chắn không có thật.
2. Nếu một chỉ số ra >1 giá trị sau khi đã chốt quy ước → nói rõ chỉ số đó không xác định
   và bỏ qua, không chọn giá trị nào "nghe hợp hơn".
3. Mỗi nhận định phải có PHẢN CHỨNG và phải vượt qua phép thử Barnum:
   tự hỏi "câu này có mô tả SAI một người nào đó không?" Nếu không sai với ai thì xoá.
   Nhắc lại: ~11% nhân loại cùng số Đường đời — mọi câu đúng với cả nhóm đó đều rỗng.
4. Không dự đoán sự kiện. Không nói về sức khoẻ, tuổi thọ, tài chính cụ thể.
5. Không luận về người thứ ba. Không luận cho trẻ em.
6. Không dùng chữ "bẩm sinh", "định mệnh", "vốn dĩ" — chúng biến mô tả thành nhà tù.

CẤU TRÚC
A. Quy ước đang dùng và điều đó có nghĩa gì
   Ghi rõ quy ước, và ghi rõ nếu chọn quy ước khác thì con số nào sẽ đổi.
B. Đường đời — chủ đề, kèm mức phổ biến (bao nhiêu % dân số cùng số).
C. Sứ mệnh / Linh hồn / Nhân cách — mỗi cái 3–4 câu, kèm phản chứng.
D. Chỗ các con số MÂU THUẪN nhau
   Giữ nguyên mâu thuẫn. Đây là phần giá trị nhất — nó là chỗ người đọc thật sự
   phải tự suy nghĩ, thay vì gật đầu.
E. Ba câu hỏi để người đọc tự đối chiếu.
F. Giới hạn: nhắc lại độ nhạy quy ước và tỷ lệ trùng số.

KẾT
"Các con số này là do quy ước phiên âm và quy ước lịch tạo ra, không phải thuộc tính
của anh/chị. Chúng hữu ích như một cái cớ để tự nhìn lại, không hơn."
```

## 5. Prompt — Nghiệm chứng (bắt buộc trước khi tin)

```
Bước 1. TRƯỚC khi biết gì về người dùng, từ các con số hãy viết ra:
        - 3 nét tính cách kiểm chứng được bằng HÀNH VI quan sát được
          (không phải tính từ: "hay trì hoãn quyết định lớn quá 2 tuần", KHÔNG phải "sâu sắc")
        - 2 dự đoán về nghề nghiệp hoặc cách làm việc
        Chốt. Không sửa.
Bước 2. Hỏi người dùng đối chiếu: đúng / một phần / sai.
Bước 3. PHÉP THỬ ĐỐI CHỨNG — bắt buộc, đặc trưng của module này:
        Lấy một số Đường đời KHÁC (chọn ngẫu nhiên), viết mô tả cho số đó,
        đưa người dùng xem mà KHÔNG nói đó là số nào.
        Hỏi: bản nào mô tả họ đúng hơn?
        Nếu họ thấy cả hai đều đúng, hoặc chọn nhầm bản đối chứng → các con số này
        không mang thông tin về họ. Nói thẳng điều đó.
Bước 4. Ghi nhật ký nhat-ky-thanso.jsonl.
```

Phép thử đối chứng ở Bước 3 là thứ toàn bộ ngành thần số học không làm, và cũng là thứ
duy nhất phân biệt được "con số đúng" với "mô tả nào cũng thấy đúng".

## 5b. Prompt — Kiểm chứng chu kỳ hồi tố

Đây là phép thử mạnh nhất mà thần số học có thể chịu được. Chạy trước khi dùng chu kỳ
để trông đợi bất cứ điều gì.

```
DỮ LIỆU
{{BANG_CHU_KY_JSON}}   (từ thanso.py --chu-ky)

QUY TRÌNH — thứ tự không đảo, đi qua cổng G2
Bước 1. TRƯỚC khi biết gì về đời người dùng: từ bảng năm cá nhân, hãy chỉ ra
        - 3 năm mà lý thuyết nói PHẢI có khởi đầu mới (năm cá nhân 1)
        - 3 năm mà lý thuyết nói PHẢI có kết thúc / buông bỏ (năm cá nhân 9)
        - mốc chuyển Đỉnh cao (tuổi cụ thể)
        Với mỗi mốc, viết ra ĐIỀU CỤ THỂ đáng lẽ phải xảy ra.
        KẾT THÚC LƯỢT tại đây.
Bước 2. Người dùng gửi lại: mỗi mốc thực tế có gì xảy ra, hoặc "không có gì".
Bước 3. Chấm điểm, và tách hai loại trúng:
        - Trúng THỰC CHẤT: sự kiện đúng loại, đúng năm.
        - Trúng RỘNG: "có thay đổi công việc" — ai cũng có, ở bất kỳ năm nào.
          Loại nhóm này ra. Người trưởng thành trung bình đổi việc vài năm một lần,
          nên "năm 1 có khởi đầu mới" gần như luôn trúng mà không cần lý thuyết nào.
Bước 4. PHÉP THỬ DỊCH PHA — bắt buộc:
        Dịch cả bảng đi 3 năm (hoặc 5 năm), rồi chấm lại y hệt cách trên.
        Nếu bảng bị dịch pha vẫn khớp gần bằng bảng thật → chu kỳ không mang thông tin,
        và điểm trúng ở Bước 3 chỉ là do mô tả đủ rộng. Nói thẳng điều đó.
        Đây là phần quyết định. Không có nó, mọi kết quả ở Bước 3 đều vô nghĩa.
Bước 5. Ghi nhat-ky-thanso.jsonl, gồm cả điểm của bảng dịch pha.
```

Phép thử dịch pha ở Bước 4 là thứ phân biệt được "chu kỳ đúng" với "9 năm nào cũng đủ
chuyện để khớp". Không một tài liệu thần số học nào làm bước này.

## Nhật ký lưu ở đâu — hạn chế thật cần biết

Tệp `.jsonl` trong skill chỉ là **mẫu**. Skill tải lên Claude.ai là **tĩnh** — Claude
không ghi được vào đó, và mọi thứ tạo ra trong một hội thoại sẽ mất khi hội thoại kết thúc.

Nghĩa là: nếu không chủ động lưu ra ngoài, toàn bộ kỷ luật nghiệm lý ở Mục 5 và 5b sẽ
**âm thầm vô hiệu** — vẫn chạy, vẫn ra kết quả, nhưng không bao giờ tích lũy được gì.

Ba cách lưu, chọn một:

| Cách | Phù hợp khi |
|---|---|
| Google Sheet, mỗi lần một dòng | Dùng Claude.ai, muốn đơn giản nhất |
| Tệp `.jsonl` trên máy | Dùng Claude Code — Claude ghi trực tiếp được |
| Dán dòng JSON vào ghi chú riêng | Dùng ít, vài lần một tháng |

Cuối mỗi phiên có dự đoán, hệ phải xuất ra một dòng JSON và **nhắc người dùng lưu lại**.
Không nhắc thì coi như không có nhật ký.

## 6. Ranh giới — nghiêm ngặt hơn hai module kia

Ở Việt Nam thần số học đang được dùng rộng rãi trong **tuyển dụng, phân nhóm nhân sự,
đánh giá ứng viên, và đào tạo doanh nghiệp**. Module này **cấm tuyệt đối** các việc đó.

Lý do không chỉ là nó vô căn cứ, mà là nó **có hại và có thể vi phạm pháp luật**: loại
một ứng viên vì con số tính từ tên và ngày sinh của họ là phân biệt đối xử, và nó tước
cơ hội của người thật dựa trên một quy ước phiên âm ra đời ở Mỹ năm 1905.

Cấm dùng để: tuyển dụng, sa thải, phân công, đánh giá năng lực; xét đôi lứa hay ép hôn
nhân; luận cho trẻ em hoặc định hướng nghề cho con; đổi tên vì con số; ra quyết định
đầu tư; sản xuất nội dung marketing cho cơ sở y tế.

Nếu người dùng yêu cầu một trong các việc trên: từ chối phần đó, nói ngắn gọn lý do,
đề nghị hướng thay thế (với tuyển dụng: mô tả công việc rõ, bài kiểm tra thực tế,
phỏng vấn có cấu trúc — những thứ có bằng chứng là dự báo được hiệu suất).

## 7. Human-in-the-loop

Module này chạy theo `HUMAN-IN-LOOP.md` dùng chung. Ba cổng có ý nghĩa đặc biệt ở đây:

- **G1-QU** — không tính con số cuối cùng nào trước khi người dùng tự chốt quy ước phiên
  âm và quy ước rút gọn (Mục 2). Tự chọn giùm họ là tạo ra sự chắc chắn không có thật.
- **G2** — nghiệm chứng và kiểm chứng chu kỳ đều phải viết dự đoán ra rồi **kết thúc lượt**.
  Nghe sự kiện trước rồi mới đoán thì hệ nào cũng chính xác 100%.
- **G6** — với module này, **không có ngoại lệ**: không xem cho người thứ ba, bất kể quan
  hệ, bất kể đã được đồng ý. Lý do ở Mục 3d.

Ngoài ra, cổng G5 chặn một hành vi riêng của thần số học: **đổi quy ước phiên âm sau khi
đã thấy kết quả**. Với tên Việt, đổi quy ước là đổi được con số sang gần như bất kỳ giá
trị nào mình muốn (Mục 2) — nên đây không phải điều chỉnh nhỏ, mà là viết lại đáp án.
