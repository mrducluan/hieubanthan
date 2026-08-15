---
name: kinh-dich
description: Khởi quẻ và luận quẻ Kinh Dịch (Chu Dịch) theo ba trường phái tách bạch — Nghĩa Lý, Lục Hào nạp giáp, Mai Hoa Dịch Số. Kích hoạt khi người dùng nói "gieo quẻ", "xem quẻ", "bói dịch", "Kinh Dịch", "Chu Dịch", "lục hào", "mai hoa dịch số", "quẻ này nghĩa gì", "hào động", "thể dụng", "dụng thần", "ứng kỳ", hoặc đưa ra một câu hỏi quyết định và muốn tham chiếu Dịch. Module anh em với skill `tuvi-vn`; hai hệ KHÔNG được gộp chung một lượt luận.
---

# Kinh Dịch — khung khởi quẻ và luận quẻ

## 0. Định vị (giữ nguyên tinh thần của `tuvi-vn`)

Kinh Dịch không có năng lực tiên đoán đã được kiểm chứng. Cơ chế thật khiến nó
hữu ích — trong chừng mực nó hữu ích — là: **một tín hiệu ngẫu nhiên đủ giàu hình
ảnh sẽ phá thế bế tắc cân nhắc, buộc người hỏi phát lộ thứ tự ưu tiên mà họ vốn đã
có nhưng chưa dám gọi tên.** Đó là giá trị thật, và nó không cần phép màu nào cả.

Vì vậy khung này được thiết kế để **giữ lại giá trị phản tư** và **chặn phần dự
báo giả**. Ba cơ chế chặn, mô tả ở Mục 3, 4, 7.

## 1. Phân tầng văn bản — phải biết mình đang đọc lớp nào

Gọi chung "Kinh Dịch" là gộp năm lớp văn bản cách nhau cả nghìn năm, mục đích
khác nhau, và **mâu thuẫn nhau ở nhiều chỗ**:

| Lớp | Niên đại | Bản chất |
|---|---|---|
| Chu Dịch cổ kinh (quái từ, hào từ) | Tây Chu | Sổ tay bói, ngôn ngữ hình ảnh, nhiều lời hung |
| Thập Dực / Dịch Truyện (Thoán, Tượng, Hệ Từ, Văn Ngôn…) | Chiến Quốc – Hán | Đọc lại theo hướng luân lý, đạo đức hoá bản gốc |
| Kinh Phòng dịch, nạp giáp | Hán | Gắn can chi ngũ hành vào hào → nền của Lục Hào |
| Hoả Châu Lâm | Tống | Lục hào dân gian, dự đoán sự việc cụ thể |
| Mai Hoa Dịch Số (gán cho Thiệu Ung) | Tống về sau | Thể dụng ngũ hành, ít dùng hào từ |

Hệ quả: **Thập Dực không phải chú giải trung lập của cổ kinh, nó là một cách đọc
lại.** Một prompt nhét cả năm lớp vào rồi bảo "luận đi" sẽ cho ra thứ nghe rất
sâu sắc mà không nhất quán với bất kỳ truyền thống nào.

**Quy tắc cứng: chốt một trường phái TRƯỚC khi gieo, và nói rõ trong output.**

## 2. Ba trường phái, ba loại câu hỏi

| Phái | Trả lời được | KHÔNG trả lời được | Đọc gì |
|---|---|---|---|
| **Nghĩa Lý** | "Nên ứng xử thế nào?", "Tôi đang bỏ sót góc nhìn nào?" | Sự việc cụ thể, thời điểm | Quái từ, hào từ, Thoán, Tượng |
| **Lục Hào (nạp giáp)** | "Việc này thành hay bại?", "Bao giờ?" | Nên hay không nên về mặt đạo đức | Dụng thần, thế ứng, lục thân, vượng suy, ứng kỳ |
| **Mai Hoa** | Đọc nhanh một tình huống trước mắt | Việc dài hạn, nhiều biến số | Thể–dụng sinh khắc, quái khí, ứng kỳ ngắn |

Chọn sai phái là lỗi thường gặp nhất: hỏi "có nên ly hôn không" rồi luận bằng
Lục Hào — Lục Hào chỉ nói được "kết quả nếu làm", không nói được "có nên".

## 3. Khởi quẻ — chốt chặn thứ nhất

**LLM tuyệt đối không được tự chọn quẻ.** Đây không phải chuyện hình thức. Khi
mô hình "chọn" quẻ sau khi đã đọc câu hỏi, nó sẽ chọn quẻ khớp với sắc thái câu
hỏi — tức là tệ hơn ngẫu nhiên, vì nó phản chiếu lại chính kỳ vọng của người hỏi.
Toàn bộ giá trị phản tư biến mất.

Dùng script kèm theo:

```bash
python3 gieoque.py --method thi \
  --question "Có nên mở chi nhánh thứ 37 trong quý 4 không?" \
  --dung-than "Thê Tài" \
  --tieu-chi-sai "Sau 6 tháng doanh thu chi nhánh dưới 60% điểm hoà vốn"
```

Ba phương pháp, phân phối **khác nhau** — phải khai báo:

| Phương pháp | Lão dương 9 | Thiếu dương 7 | Thiếu âm 8 | Lão âm 6 |
|---|---|---|---|---|
| Thệ pháp (cỏ thi) `--method thi` | 3/16 | 5/16 | 7/16 | 1/16 |
| Tam tiền (3 đồng) `--method tien` | 1/8 | 3/8 | 3/8 | 1/8 |

Tổng xác suất có hào động đều là 25%, nhưng thệ pháp cho **lão dương nhiều gấp 3
lão âm**, còn tam tiền thì cân bằng. Nói cách khác hai phương pháp mã hoá hai giả
định khác nhau về thế giới. Không có "phương pháp đúng" — chỉ có việc phải nói rõ
đã dùng cái nào, vì nó đổi phân bố hào động và do đó đổi cách đọc.

Script còn có `--method thi-vatly` mô phỏng thao tác chia bó 49 cọng. Phân phối
thực tế của nó lệch ~1% so với bảng kinh điển, vì số dư mod 4 của bó chia không
hoàn toàn đều. Giữ lại để đối chiếu, không dùng mặc định.

## 4. Chốt trước khi gieo — chốt chặn thứ hai

Trước khi nhìn thấy quẻ, phải ghi ra và **không được sửa về sau**:

1. **Câu hỏi** — một câu, cụ thể, có phạm vi thời gian.
2. **Dụng thần** (nếu dùng Lục Hào) — hào nào đại diện điều đang hỏi.
   Cầu tài → Thê Tài. Việc quan, kiện tụng, bệnh → Quan Quỷ. Hợp đồng, giấy tờ,
   nhà cửa, thầy → Phụ Mẫu. Nhân viên, hoá giải, con cái → Tử Tôn.
   Đối tác ngang hàng, cạnh tranh, hao tài → Huynh Đệ.
3. **Tiêu chí sai** — sự kiện quan sát được nào, trong thời hạn nào, chứng minh
   luận đoán này sai.

Vì sao bắt buộc: nếu chọn dụng thần **sau** khi thấy quẻ, người luận sẽ vô thức
chọn hào nào đang vượng để khớp với điều mình mong. Đây là thủ thuật tự lừa cổ
điển nhất của nghề, và nó xảy ra ngay cả với người thành thật.

## 5. Cấu trúc quẻ

Script xuất sẵn: quẻ bản, quẻ biến (chi quái), **hỗ quái** (hào 2-3-4 làm hạ,
3-4-5 làm thượng — nội tình ẩn), **thác quái** (đảo âm dương toàn bộ — mặt đối
lập), **tống quái** (lật ngược — góc nhìn của bên kia), bát cung, thế ứng,
nạp giáp địa chi, lục thân.

Vị trí hào: sơ – nhị – tam – tứ – ngũ – thượng.
- **Đắc vị**: hào dương ở vị lẻ (1,3,5), hào âm ở vị chẵn (2,4,6).
- **Đắc trung**: hào 2 (trung của nội quái), hào 5 (trung của ngoại quái).
- **Ứng**: 1–4, 2–5, 3–6. Một âm một dương là "hữu ứng", cùng tính là "vô ứng".
- **Thừa / thặng**: hào âm ở dưới hào dương là thừa (thuận), ở trên là thặng (nghịch).

## 6. Quy tắc biến chiếm (Chu Hy, *Dịch Học Khải Mông*)

Số hào động quyết định **đọc lời nào** — nhiều người bỏ qua bước này rồi luận
tuỳ hứng:

| Hào động | Đọc |
|---|---|
| 0 | Quái từ quẻ bản |
| 1 | Hào từ hào động của quẻ bản |
| 2 | Hào từ hai hào động, **lấy hào trên làm chủ** |
| 3 | Quái từ quẻ bản (trinh) + quẻ biến (hối) |
| 4 | Hào từ hai hào **tĩnh** của **quẻ biến**, lấy hào dưới làm chủ |
| 5 | Hào từ hào tĩnh duy nhất của quẻ biến |
| 6 | Quái từ quẻ biến; riêng Càn dùng "Dụng Cửu", Khôn dùng "Dụng Lục" |

**Đính chính một hiểu lầm phổ biến:** quẻ biến không phải "tương lai" còn quẻ bản
là "hiện tại". Theo Chu Hy đó là quan hệ **trinh – hối**: tình thế và hệ quả của
tình thế. Đọc thành trục thời gian là cách hiểu hiện đại, tiện nhưng không có
căn cứ trong bản văn.

## 7. Kỷ luật luận giải — chốt chặn thứ ba

Giữ nguyên cấu trúc nút bằng chứng của `tuvi-vn`:
NHẬN ĐỊNH – NEO – QUY TẮC – PHẢN CHỨNG – ĐỘ TIN CẬY – BIÊN THỰC TẾ.

Thêm hai điều riêng cho Dịch:

**Không được làm mềm quẻ hung.** Chu Dịch có lời hung thật: "hung", "lận",
"vô du lợi", "凶". Một bản luận biến mọi quẻ thành tích cực là bản luận **không
chứa thông tin** — nếu mọi kết quả đều dẫn tới cùng một lời khuyên thì việc gieo
quẻ vô nghĩa. Nói thẳng lời hung, rồi bàn cách ứng phó.

**Lục Hào phải cho ứng kỳ.** Truyền thống Lục Hào cho được thời điểm (theo địa
chi của dụng thần, nguyệt kiến, nhật thần, tuần không). Một luận đoán có ứng kỳ
là luận đoán kiểm chứng được. Bắt buộc nêu, và ghi vào nhật ký ở Mục 9.

## 8. Prompt cụ thể

### 8.1 — Nghĩa Lý (quyết định, phản tư)

```
VAI TRÒ
Bạn luận Chu Dịch theo phái Nghĩa Lý (Trình Di, Chu Hy). Bạn đọc quẻ như một
tấm gương soi tình thế, không như một lời tiên tri.

DỮ LIỆU  (từ gieoque.py, không tự chế)
{{QUE_JSON}}

RÀNG BUỘC
1. Chỉ dùng quẻ trong JSON. Không đổi quẻ, không gieo lại vì "quẻ xấu".
2. Trích quái từ / hào từ đúng theo bảng ở Mục 6 (số hào động quyết định đọc lời nào).
3. Nếu lời quẻ là hung — nói rõ là hung. Không làm mềm, không tô hồng.
4. Không nói về sức khoẻ, bệnh tật, tuổi thọ, tai nạn.
5. Không dự đoán tài chính cụ thể, không khuyên đầu tư.

CẤU TRÚC

A. Tượng quẻ
   Thượng quái / hạ quái là gì, quan hệ giữa hai quái, đại tượng nói gì.
   Tối đa 120 từ, không sáo ngữ.

B. Lời quẻ áp dụng
   Trích lời theo đúng quy tắc biến chiếm. Dịch nghĩa gọn.
   Nói rõ: đây là lớp văn bản nào (cổ kinh hay Thập Dực).

C. Soi vào tình thế
   3 nhận định. Mỗi nhận định:
   NEO (hào nào / tượng nào) — PHẢN CHỨNG (hỗ quái hoặc thác quái nói ngược lại
   ra sao) — ĐỘ TIN CẬY.

D. Ba góc nhìn cấu trúc
   - Hỗ quái: điều gì đang diễn ra bên dưới mà người hỏi chưa thấy?
   - Thác quái: nếu giả định nền của người hỏi bị lật ngược thì sao?
   - Tống quái: nhìn từ phía bên kia bàn, việc này trông thế nào?

E. Việc nên làm / nên hoãn
   Cụ thể, làm được trong 30 ngày. Không nói "hãy giữ tâm an".

F. Điều quẻ này KHÔNG nói được
   Ít nhất ba điều.

G. Câu hỏi ngược
   Hai câu để người hỏi tự đối chiếu.

KẾT
"Quẻ là công cụ soi chiếu suy nghĩ của chính anh/chị, không phải dự báo về thế
giới bên ngoài. Quyết định vẫn là của anh/chị."
```

### 8.2 — Lục Hào nạp giáp (dự đoán có ứng kỳ)

```
VAI TRÒ
Bạn luận Lục Hào theo Hoả Châu Lâm / Kinh Phòng.

DỮ LIỆU
{{QUE_JSON}}
Nguyệt kiến: {{NGUYET}}   Nhật thần: {{NHAT}}   Tuần không: {{TUAN_KHONG}}
Dụng thần đã chốt TRƯỚC khi gieo: {{DUNG_THAN}}
Tiêu chí sai đã chốt: {{TIEU_CHI_SAI}}

RÀNG BUỘC
1. Nếu {{DUNG_THAN}} trống → DỪNG. Yêu cầu chốt dụng thần rồi gieo lại từ đầu.
   Không được chọn dụng thần sau khi đã thấy quẻ.
2. Nếu nguyệt kiến / nhật thần trống → nói rõ luận đoán bị hạ độ tin cậy, vì
   vượng suy không xác định được.
3. Không luận bệnh tật, không luận thọ yểu, không luận kiện tụng thay luật sư.
4. Không đưa khuyến nghị đầu tư hay vay nợ.

CẤU TRÚC

A. Định vị
   Thế – ứng ở hào nào, quan hệ sinh khắc thế–ứng. Dụng thần nằm ở hào nào,
   hay phục thần dưới hào nào.

B. Vượng suy của dụng thần
   Theo nguyệt kiến (vượng / tướng / hưu / tù / tử), theo nhật thần
   (sinh, khắc, hợp, xung), có tuần không hay không, có động biến hay không
   (hoá tiến / hoá thoái / hoá hồi đầu khắc / phản ngâm / phục ngâm).
   Mỗi kết luận ghi rõ dựa vào chi nào.

C. Nguyên thần – Kỵ thần – Cừu thần
   Ai sinh dụng thần, ai khắc, tình trạng từng bên.

D. Phán đoán
   Một câu duy nhất: THÀNH / BẠI / TRẮC TRỞ RỒI THÀNH / CHƯA ĐỦ DỮ LIỆU.
   Kèm PHẢN CHỨNG: yếu tố nào trong chính quẻ này chống lại phán đoán trên.
   Kèm ĐỘ TIN CẬY và lý do.

E. Ứng kỳ
   Nêu mốc thời gian theo địa chi (tháng/ngày ứng), quy ra khoảng dương lịch.
   Nói rõ đây là mốc để KIỂM CHỨNG, không phải lời hứa.

F. Biên thực tế
   Ba yếu tố ngoài quẻ có ảnh hưởng lớn hơn quẻ trong việc này.

G. Ghi nhật ký
   Xuất một dòng JSON theo mẫu ở Mục 9 để lưu lại đối chiếu sau.
```

### 8.3 — Mai Hoa Dịch Số (đọc nhanh)

```
VAI TRÒ
Bạn luận theo Mai Hoa Dịch Số: trọng thể–dụng và ngũ hành, KHÔNG lấy hào từ
làm căn cứ chính.

DỮ LIỆU
{{QUE_JSON}}
Ngoại ứng quan sát được lúc khởi quẻ: {{NGOAI_UNG}}   (nếu không có, ghi "không")

CẤU TRÚC
A. Thể – Dụng: quái nào là thể (chứa hào động → là dụng, quái kia là thể),
   ngũ hành hai quái, quan hệ sinh khắc, và điều đó nghĩa gì.
B. Hỗ quái: diễn biến giữa chừng. Biến quái: kết cục.
C. Ngoại ứng: nếu có, đối chiếu; nếu không, nói rõ là không có và độ tin cậy giảm.
D. Kết luận một câu + PHẢN CHỨNG + ứng kỳ ngắn (trong bao nhiêu ngày).
E. Giới hạn: Mai Hoa chỉ hợp việc trước mắt, đơn biến. Nếu câu hỏi là việc dài
   hạn nhiều biến số → nói thẳng là dùng sai công cụ, đề nghị chuyển phái.
```

## 9. Nhật ký kiểm chứng — thứ khiến khung này khác đồ chơi

Mỗi lần gieo, ghi một dòng vào `nhat-ky-que.jsonl`:

```json
{"ngay":"2026-07-29","cau_hoi":"...","phai":"luc-hao","phuong_phap":"thi",
 "que_ban":26,"hao_dong":[3,6],"que_bien":41,"dung_than":"Thê Tài",
 "phan_doan":"trắc trở rồi thành","ung_ky":"tháng Hợi",
 "tieu_chi_sai":"...","ket_qua_thuc_te":null,"ngay_doi_chieu":"2026-11-30"}
```

Sau mốc `ngay_doi_chieu`, quay lại điền `ket_qua_thuc_te`. Sau 20–30 lần, tự
tính tỷ lệ trúng và so với ngẫu nhiên.

Nói trước cho thẳng: **khả năng cao là không khác ngẫu nhiên.** Nếu vậy, giá trị
còn lại — việc bị buộc phải phát biểu câu hỏi cho rõ, chốt tiêu chí thành bại,
và rà soát mặt đối lập — vẫn là giá trị thật, và không nhỏ. Cái mất đi chỉ là ảo
tưởng tiên tri. Còn nếu kết quả lại khác ngẫu nhiên một cách đáng kể, thì đó là
phát hiện đáng theo đuổi nghiêm túc — nhưng chỉ biết được nếu có ghi chép.

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

## 10. Ranh giới

Không dùng module này để: chẩn đoán hay quyết định điều trị y tế; ra quyết định
đầu tư, vay nợ, mua bán tài sản; tuyển dụng, sa thải, phân công nhân sự; xem hộ
người thứ ba chưa đồng ý; sản xuất nội dung marketing cho cơ sở y tế.

Không gieo lại vì quẻ xấu. Không gieo cùng một câu hỏi lần thứ hai trong 30
ngày — nếu chấp nhận gieo lại, kết quả chỉ còn là lọc nhiễu cho tới khi ra thứ
mình muốn nghe.

Nếu người hỏi đang trong khủng hoảng thật (mất người thân, nợ nần, ý nghĩ tự
hại), dừng gieo quẻ, chuyển sang lắng nghe và gợi ý nguồn hỗ trợ phù hợp.

## Human-in-the-loop

Module này chạy theo các cổng kiểm soát dùng chung trong `HUMAN-IN-LOOP.md`.
Quy tắc tối cao: không đi qua hai cổng liên tiếp trong một lượt trả lời.
