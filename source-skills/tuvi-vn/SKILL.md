---
name: tuvi-vn
description: Lập và luận lá số Tử Vi theo phái Việt Nam (Nam phái) với kỷ luật lập luận có kiểm chứng. Kích hoạt khi người dùng nói "xem tử vi", "lập lá số", "luận lá số", "an sao", "cung mệnh", "đại vận", "tiểu vận", "lưu niên", "xem vận hạn", "Tuần Triệt", "chính tinh", "cách cục", hoặc đưa ngày giờ sinh và hỏi về sự nghiệp, tài lộc, gia đạo, con cái, thời vận. KHÔNG dùng cho chẩn đoán y tế, không dùng để sản xuất nội dung quảng cáo y tế, không dùng làm căn cứ tuyển dụng hay sa thải.
---

# Tử Vi Việt Nam — khung luận giải có kỷ luật

## 0. Định vị công cụ (đọc trước, không bỏ qua)

Tử Vi là một hệ thống diễn giải văn hoá, **không phải công cụ dự báo đã được kiểm chứng
thực nghiệm**. Các nghiên cứu đối chứng mù về chiêm tinh (tiêu biểu: Carlson, *Nature*
1985) và các tổng quan sau đó đều cho kết quả không khác ngẫu nhiên. Kết luận đúng đắn
không phải "tử vi vô giá trị" mà là: **giá trị của nó nằm ở chỗ làm khung phản tư, đặt
câu hỏi, hệ thống hoá tự nhận thức — chứ không nằm ở năng lực tiên đoán.**

Hệ quả bắt buộc cho mọi output của skill này:

- Không viết câu khẳng định tương lai tuyệt đối ("năm 2027 anh sẽ thăng chức").
  Viết theo dạng khuynh hướng + điều kiện + phản chứng.
- Không phán bệnh, không phán thọ yểu, không phán sinh tử, kể cả khi hỏi thẳng cung Tật Ách.
- Không dùng để ra quyết định có hệ quả pháp lý hoặc đạo đức lên người khác
  (tuyển dụng theo tuổi, ép cưới hỏi, từ chối điều trị).
- Mọi báo cáo kết thúc bằng dòng: *"Đây là diễn giải theo hệ thống văn hoá Tử Vi,
  mang tính tham khảo và phản tư, không phải dự báo khoa học."*

## 1. Vì sao không dùng thẳng engine Trung Quốc

Tử Vi Việt Nam (Nam phái) **không đồng nhất** với Tử Vi Đẩu Số Trung Quốc. Khác biệt
đủ lớn để một lá số dựng bằng engine Trung Quốc bị người luận Việt Nam coi là sai:

| Điểm | Tử Vi Việt Nam | Tử Vi Đẩu Số TQ (Tam Hợp / Trung Châu / Phi Tinh) |
|---|---|---|
| Tuần – Triệt | Trụ cột luận giải, quyết định cách cục | Có khái niệm tương đương (旬空/截空) nhưng trọng số thấp hơn nhiều |
| Tứ Hoá | Dùng **tứ hoá sinh niên** (theo can năm sinh) như sao thường. **Không** dùng kỹ thuật phi tinh (tứ hoá theo can từng cung, cung lai nhân, tự hoá) | Phái Phi Tinh lấy tứ hoá cung can làm trung tâm |
| Vòng Thái Tuế | Trọng yếu, phái Thiên Lương lấy làm gốc luận tính cách và tư cách | Ít dùng như một vòng luận độc lập |
| Cung Phúc Đức | Trọng số rất cao — nền phúc ấm, dòng họ | Trọng số thấp hơn |
| Xem hạn | Tiểu hạn + đại hạn + lưu niên song hành | Thiên về đại hạn + lưu niên theo cung Thái Tuế |
| Bộ phụ tinh | ~110–118 sao, nhiều sao thuần Việt (Lưu Hà, Thiên Trù, Thiên Y…) | Bộ sao khác, một số sao không tồn tại ở bảng Việt |
| Vòng sao | Thái Tuế, Lộc Tồn, Tràng Sinh theo an sao Việt | Quy tắc an một số sao lệch |
| Đại vận | Nhiều nhà dùng cách tính riêng | Chuẩn hoá theo cục |

**Đính chính so với bản trước của tài liệu này:** bản đầu tôi viết "Việt Nam dùng Tứ Hoá
hạn chế" — nói vậy là sai. Tử Vi Việt Nam dùng tứ hoá sinh niên đầy đủ; phái Thiên Lương
thậm chí coi Hoá Lộc/Quyền/Khoa/Kỵ **không phải sao riêng** mà là chính diệu biến thái
theo thập can. Cái Việt Nam không dùng là **kỹ thuật phi tinh** — bay tứ hoá theo can
của từng cung. Khác biệt này quan trọng vì skill Trung Quốc được làm tốt nhất hiện nay
(`weizeW/mingli-skills`) chính là phái Phi Tinh: nó có bảng 12 cung phi hoá, tuần hoàn kỵ,
cung lai nhân. Dùng nó cho lá số Việt là **áp nhầm phái**, không chỉ nhầm bảng sao.

**Quy tắc cứng:** engine Trung Quốc (iztro…) chỉ được dùng làm **lá số đối chiếu**, và
phải ghi rõ "theo phái Trung Quốc". Không bao giờ trình bày nó như lá số Việt Nam.

## 2. Kiến trúc 5 lớp

```
Lớp 0  CHUẨN HOÁ THỜI GIAN   → giờ sinh đúng là gốc của mọi thứ
Lớp 1  AN SAO BẰNG SCRIPT    → LLM tuyệt đối không tự tính can chi
Lớp 2  TRI THỨC LUẬN         → bảng sao, cách cục, quy tắc
Lớp 3  LUẬN GIẢI CÓ KỶ LUẬT  → mỗi luận điểm phải neo bằng chứng
Lớp 4  QA / GUARDRAIL        → kiểm trước khi giao cho người dùng
```

### Lớp 0 — Chuẩn hoá thời gian (nơi 80% lá số sai ra đời)

Bốn thứ phải xử lý, theo thứ tự:

1. **Lịch sử múi giờ Việt Nam.** Việt Nam không phải lúc nào cũng UTC+7. Có giai đoạn
   dùng UTC+8, và giai đoạn 1954–1975 hai miền dùng múi giờ khác nhau (miền Nam từng
   ở UTC+8). Người sinh trước 1975, đặc biệt ở miền Nam, **phải** tra `tzdata`
   (`Asia/Ho_Chi_Minh`, `Asia/Hanoi`) theo đúng ngày sinh. Bỏ qua bước này có thể lệch
   nguyên một giờ → sai cả cung Mệnh.
2. **Giờ mặt trời thực.** Kinh tuyến chuẩn của UTC+7 là 105°E. TP.HCM ≈ 106,7°E
   → lệch ~+7 phút. Hà Nội ≈ 105,85°E → ~+3,4 phút. Cà Mau ≈ 105,15°E → gần như 0.
   Cộng thêm phương trình thời gian (equation of time) dao động ±16 phút theo mùa.
   Tổng lệch có thể trên 20 phút — chỉ quan trọng khi giờ sinh **sát biên giờ**.
3. **Giờ Tý sớm / giờ Tý muộn.** 23:00–00:00 là giờ Tý nhưng thuộc **ngày hôm sau** theo
   một số nhà, ngày hiện tại theo nhà khác. Nếu rơi vào khung này, phải lập **cả hai lá số**
   và nói rõ với người dùng, không tự chọn.
4. **Giờ sinh không rõ.** Không được bịa. Xử lý theo Mục 6.

### Lớp 1 — An sao bằng script

Engine Việt Nam khả dụng, giấy phép MIT (dùng thương mại được):

```bash
pip install lasotuvi          # doanguyen/lasotuvi — an sao phái Việt
# đối chiếu (không bắt buộc):
npm install iztro             # SylarLong/iztro — Tử Vi Đẩu Số TQ, MIT
npm install lunar-javascript  # 6tail — lịch âm, tứ trụ, MIT
```

Script phải xuất **JSON**, gồm tối thiểu: can chi năm/tháng/ngày/giờ, âm dương nam/nữ,
cục, vị trí 12 cung, chính tinh + phụ tinh từng cung kèm miếu/vượng/đắc/hãm, Tuần, Triệt,
danh sách đại vận, tiểu vận, lưu niên.

**LLM không được tự tính can chi, không tự an sao, không tự đổi âm–dương lịch.**
Đây là lỗi phổ biến nhất và cũng là lỗi âm thầm nhất: mô hình xuất ra bảng trông rất
thuyết phục nhưng sai từ trụ ngày.

### Lớp 2 — Tri thức luận

Đặt trong `references/`, đọc theo nhu cầu chứ không nạp hết:

- `an-sao-viet.md` — bảng an sao chuẩn phái Việt
- `chinh-tinh.md` — 14 chính tinh, miếu vượng đắc hãm theo cung
- `phu-tinh.md` — lục cát, lục sát, quý tinh, sao đơn lẻ
- `tuan-triet.md` — quy tắc Tuần Triệt và ảnh hưởng lên cách cục
- `cach-cuc.md` — các cách nổi tiếng và điều kiện thành cách / phá cách
- `12-cung.md` — phạm vi ngữ nghĩa từng cung, **và ranh giới cung không nói được gì**

Mục cuối quan trọng: mỗi cung phải ghi rõ *nó không trả lời câu hỏi nào*. Cung Tử Tức
không trả lời được "con tôi có bệnh gì". Cung Tật Ách không chẩn đoán bệnh.

### Lớp 3 — Kỷ luật lập luận

Mọi nhận định phải là một **nút bằng chứng** có cấu trúc:

```
NHẬN ĐỊNH   : (một câu, cụ thể, có thể sai)
NEO         : cung nào, sao nào, thế tam hợp/xung chiếu nào, Tuần Triệt ra sao
QUY TẮC     : trích quy tắc từ references/, ghi rõ nguồn
PHẢN CHỨNG  : yếu tố nào trong chính lá số này chống lại nhận định trên
ĐỘ TIN CẬY  : cao / trung bình / thấp — kèm lý do
BIÊN THỰC TẾ: điều gì ngoài lá số quyết định nhiều hơn (nghề, vốn, sức khoẻ, thị trường)
```

Không có `PHẢN CHỨNG` thì không được xuất nhận định. Đây là cơ chế duy nhất chặn được
**hiệu ứng Barnum** — kiểu câu đúng với ai cũng đúng ("anh bề ngoài cứng rắn nhưng bên
trong nhạy cảm"). Tự kiểm bằng câu hỏi: *câu này có mô tả sai một người nào đó không?*
Nếu không sai với ai thì nó rỗng, xoá đi.

Cấm dùng: "chắc chắn", "nhất định", "trời cho", "số đã định", "không thể tránh".

### Lớp 4 — QA trước khi giao

Checklist chạy trên bản nháp cuối:

- [ ] Có nêu rõ giờ sinh đã hiệu chỉnh thế nào, và độ nhạy nếu sát biên giờ?
- [ ] Mọi nhận định đều có neo + phản chứng?
- [ ] Không có câu tiên đoán tuyệt đối?
- [ ] Không chẩn đoán bệnh, không phán thọ, không phán tai nạn?
- [ ] Không quy trách nhiệm cho người thứ ba (vợ/chồng/con "khắc" mình)?
- [ ] Có disclaimer cuối bài?
- [ ] Dữ liệu sinh của người dùng không bị ghi ra nơi chia sẻ được?

## 3. Prompt chuẩn — Luận tổng quan

Dùng sau khi đã có JSON lá số từ Lớp 1. Dán JSON vào `{{LA_SO_JSON}}`.

```
VAI TRÒ
Bạn là người luận Tử Vi phái Việt Nam, làm việc theo lối khảo cứu: thận trọng,
nêu bằng chứng, chấp nhận nói "lá số này không cho biết".

DỮ LIỆU
{{LA_SO_JSON}}
Giờ sinh đã hiệu chỉnh: {{GIO_HIEU_CHINH}} (gốc: {{GIO_GOC}}, múi giờ áp dụng:
{{TZ}}, hiệu chỉnh mặt trời thực: {{DELTA_PHUT}} phút)
Trạng thái biên giờ: {{SAT_BIEN | KHONG_SAT_BIEN}}

RÀNG BUỘC TUYỆT ĐỐI
1. Chỉ dùng số liệu trong JSON. Không tự an thêm sao, không tự tính can chi.
2. Nếu JSON thiếu trường nào, nói thiếu, không suy đoán bù.
3. Mỗi nhận định phải có: NEO (cung/sao/thế) — QUY TẮC — PHẢN CHỨNG — ĐỘ TIN CẬY.
4. Không tiên đoán tuyệt đối. Viết theo dạng khuynh hướng + điều kiện.
5. Không chẩn đoán bệnh, không phán thọ yểu, không phán tai nạn, không phán sinh tử.
6. Không quy kết vận xấu cho người thân trong lá số.
7. Nếu {{SAT_BIEN}} = SAT_BIEN, mở đầu bằng cảnh báo lá số có thể đổi cung Mệnh
   và trình bày song song hai khả năng.

CẤU TRÚC BÁO CÁO

A. Nền lá số
   Cục, âm dương nam/nữ, Mệnh – Thân, chính tinh thủ Mệnh và thế tam hợp,
   Tuần Triệt đóng đâu và làm gì. Tối đa 250 từ.

B. Con người
   3–5 nét tính cách. Mỗi nét phải kèm một biểu hiện *quan sát được*
   ("thường trì hoãn ra quyết định lớn quá 2 tuần"), không phải tính từ trừu tượng.
   Kèm phản chứng từ chính lá số.

C. Sự nghiệp & nghề nghiệp
   Cung Quan Lộc, Tài Bạch, Mệnh – Thân. Nêu 2–3 dạng công việc hợp thế sao
   và 1–2 dạng dễ hao tổn. Nói rõ: đây là mô tả khuynh hướng làm việc,
   không phải chỉ định nghề.

D. Gia đạo & con cái
   Cung Phu Thê, Tử Tức, Phụ Mẫu. Chỉ mô tả *động lực quan hệ*
   (cách người này thường ứng xử trong quan hệ), tuyệt đối không phán
   số con, giới tính con, hay tương lai sức khoẻ của con.

E. Thời vận
   Đại vận hiện tại và kế tiếp, lưu niên 2 năm tới. Mỗi giai đoạn:
   chủ đề chính — việc nên làm — việc nên hoãn — dấu hiệu nào cho thấy
   luận đoán này SAI (để người dùng tự kiểm chứng về sau).

F. Giới hạn của bản luận này
   Ba điều lá số không nói được. Ba yếu tố thực tế ảnh hưởng mạnh hơn lá số
   trong trường hợp cụ thể này.

G. Câu hỏi ngược
   3 câu hỏi để người xem tự đối chiếu với đời mình, giúp họ kiểm định
   thay vì tiếp nhận thụ động.

VĂN PHONG
Tiếng Việt, gọn, không sáo ngữ huyền bí, không doạ. Người đọc phải kết thúc
bài với cảm giác hiểu mình rõ hơn và tự chủ hơn — không phải lo sợ hay lệ thuộc.

KẾT BÀI
"Đây là diễn giải theo hệ thống văn hoá Tử Vi, mang tính tham khảo và phản tư,
không phải dự báo khoa học."
```

## 4. Quan hệ với module `kinh-dich`

Hai hệ trả lời hai loại câu hỏi khác nhau và **không được gộp chung một lượt luận**:

| | Tử Vi | Kinh Dịch |
|---|---|---|
| Đầu vào | Giờ sinh — cố định cả đời | Thời điểm gieo — mỗi lần một khác |
| Đơn vị thời gian | Đại vận 10 năm, lưu niên | Một sự việc, một quyết định |
| Câu hỏi hợp | "Tôi là kiểu người thế nào, khuynh hướng dài hạn ra sao" | "Việc cụ thể này nên xử lý thế nào" |
| Lặp lại | Lá số không đổi | Gieo lại cho quẻ khác — và đó là cái bẫy |

Nếu người dùng đưa một quyết định cụ thể → chuyển sang `kinh-dich`.
Nếu đưa ngày giờ sinh và hỏi về con người, thời vận → ở lại `tuvi-vn`.

## 5. Prompt phụ — Đối chiếu chéo (tuỳ chọn)

Chỉ chạy khi người dùng chủ động muốn so sánh nhiều hệ. **Không tự động gộp.**

```
Bạn có {{N}} bản luận từ các hệ khác nhau (Tử Vi VN / Tứ Trụ / Tử Vi Đẩu Số TQ).
Nhiệm vụ: KHÔNG hoà giải chúng thành một câu chuyện trơn tru.
Thay vào đó:
1. Liệt kê điểm trùng khớp — và giải thích vì sao trùng
   (cùng gốc lý thuyết? hay thực sự độc lập?).
2. Liệt kê điểm MÂU THUẪN, giữ nguyên mâu thuẫn, không dàn xếp.
3. Chỉ ra chỗ nào là trùng lặp giả — hai hệ dùng chung dữ liệu đầu vào
   nên tất yếu ra kết quả giống nhau, không phải "hai nguồn xác nhận lẫn nhau".
4. Kết luận: các hệ này có thực sự hội tụ không, hay chỉ đang cùng
   mô tả một cách mơ hồ đủ để không bao giờ sai?
```

## 6. Xử lý giờ sinh không rõ

Không bịa giờ. Làm theo thứ tự:

1. Hỏi khoảng ("sáng sớm", "giữa trưa", "khuya") → thu hẹp còn 2–4 giờ có thể.
2. Lập lá số cho **từng** giờ khả dĩ.
3. Trình bày phần **giao nhau** (những gì đúng ở mọi lá số) như nội dung tin cậy được.
4. Phần khác nhau: trình bày như các nhánh, kèm mốc thực tế trong quá khứ để
   người dùng tự chọn nhánh khớp với đời mình.
5. Ghi rõ độ tin cậy tổng thể bị hạ vì thiếu giờ.

## 7. Các hình thức xem tử vi

Sáu hình thức, đầu vào và câu hỏi hợp lệ khác nhau. Chọn sai hình thức là lỗi
thường gặp ngang với chọn sai trường phái.

| Hình thức | Đầu vào thêm | Trả lời được | Prompt |
|---|---|---|---|
| **Luận mệnh tổng quát** | không | Con người, khuynh hướng dài hạn | Mục 3 |
| **Luận hạn** (đại hạn / tiểu hạn / lưu niên) | năm cần xem | Chủ đề của một giai đoạn | Mục 10 |
| **Luận chuyên đề** | cung cần xem | Một mặt đời sống, sâu hơn | Mục 3, rút gọn còn 1 cung + tam phương |
| **Nghiệm lý** | mốc đời thực đã xảy ra | **Hiệu chuẩn** — lá số này đọc đúng tới đâu | Mục 11 |
| **Hợp hôn / so lá số** | lá số thứ hai + người kia đồng ý | Động lực quan hệ | Mục 12 |
| **Xem lưu nguyệt / lưu nhật** | tháng, ngày | (không khuyến nghị) | — |

Về mục cuối: lưu nguyệt và lưu nhật là nơi tử vi mỏng nhất về căn cứ và dày nhất
về mê tín ứng dụng. Càng chia nhỏ đơn vị thời gian, tỷ lệ tín hiệu trên nhiễu càng
tệ, mà cảm giác chính xác lại càng tăng — vì mỗi ngày ai cũng có đủ chuyện để khớp
vào bất kỳ mô tả nào. Skill này không cung cấp prompt cho lưu nhật.

**Nghiệm lý là hình thức quan trọng nhất và bị bỏ qua nhiều nhất.** Cố tử vi gia
Thiên Lương đặt nó làm gốc của cả môn: không nghiệm lý thì luận đoán không có cách
nào biết đúng sai. Đây cũng đúng theo tiêu chuẩn nhận thức thông thường, nên Mục 11
là phần tôi đặt trọng số cao nhất trong toàn bộ skill.

## 8. Khai báo trường phái — bắt buộc trước khi luận

Các nhà tử vi Việt Nam **bất đồng thật sự** ở một số điểm, và những điểm đó đổi
hẳn kết luận. Không được im lặng chọn giùm người dùng. Đầu mỗi phiên, khai báo:

```yaml
# ---- Cấu hình đã chốt (cập nhật 2026-07-29) ----
truong_phai:          Nguyễn Phát Lộc
tuan_triet_pham_vi:   ⚠ XUNG ĐỘT — xem 8.0
tuan_triet_am_duong:  cung thuận tuổi 70% / cung nghịch tuổi 30%   # xem 8.2
tuan_triet_thoi_gian: CÓ PHÂN KỲ — Triệt tiền vận / Tuần hậu vận   # xem 8.5
xem_han_chinh:        song hành (đại hạn + tiểu hạn + lưu niên)
xem_han_don_vi_tuoi:  TUỔI ÂM LỊCH (tuổi mụ)                       # xem 8.4
uu_tien_khi_mau_thuan: đại hạn > lưu niên > tiểu hạn   # ĐÃ KHOÁ 2026-07-29
nghiem_ly:            BẮT BUỘC
```

### 8.0 Xung đột phải giải quyết trước khi luận

Hai lựa chọn hiện tại không đứng cùng nhau được:

- `truong_phai: Nguyễn Phát Lộc`
- `tuan_triet_pham_vi: rộng (lan cả tam hợp)`

**Nguyễn Phát Lộc là người bác bỏ dứt khoát quan điểm rộng.** Quan điểm rộng là của
Việt Viêm Tử. Chọn cả hai tương đương với việc nói "tôi theo trường phái A, trừ cái
điểm mà trường phái A dùng để tự phân biệt với trường phái B".

Script phát hiện xung đột này và sẽ từ chối im lặng:

```bash
python3 tuan_triet.py --can Đinh --chi Tỵ --truong-phai npl --che-do tam_hop
# → canh_bao: "XUNG ĐỘT CẤU HÌNH: trường phái Nguyễn Phát Lộc dùng chế độ 'hep'…"
```

Ba đường ra, chọn một và ghi vào cấu hình:

1. **Theo NPL trọn gói** → `--che-do hep`. Nhất quán, số cung bị phủ trung bình 3,67/12,
   quy tắc còn khả năng phân biệt. Đây là mặc định script dùng khi khai báo `npl`.
2. **Giữ phạm vi rộng** → đổi `truong_phai` thành `Việt Viêm Tử` hoặc `hỗn hợp`. Thành
   thật hơn là mượn tên NPL cho một lập trường ông phản đối.
3. **Chưa quyết** → chạy `--ab`, luận song song hai chế độ trên cùng lá số, rồi nghiệm lý
   (Mục 11 Bước 5) để số liệu quyết định. Đây là đường tôi khuyến nghị.

Trong lúc chưa giải quyết: mọi bản luận phải mở đầu bằng dòng cảnh báo xung đột,
và phần cách cục bị hạ độ tin cậy.

### 8.1 Ngân sách bậc tự do — cái giá phải trả cho cấu hình rộng

Chạy `python3 tuan_triet.py --thong-ke` cho kết quả trên toàn bộ 60 hoa giáp:

| Chế độ | Số cung bị Tuần/Triệt phủ (TB) | Thấp nhất | Cao nhất | Số năm phủ **cả 12/12 cung** |
|---|---|---|---|---|
| Hẹp (chỉ cung đóng) | 3,67 / 12 | 2 | 4 | 0 |
| Rộng + tam hợp | **9,00 / 12** | 6 | 12 | **30 / 60** |
| Rộng + tam phương tứ chính | 10,67 / 12 | 8 | 12 | 30 / 60 |

Đọc con số cuối cùng cho kỹ: với **đúng một nửa số năm sinh**, quan điểm rộng khiến
Tuần Triệt phủ **toàn bộ 12 cung**. Ví dụ tuổi Đinh Tỵ — không còn một cung nào sạch.
Một quy tắc kích hoạt ở mọi cung thì **không phân biệt được gì cả**: nó không còn là
thông tin, nó thành nền.

Cộng thêm `xem_han_chinh: song hành`, mỗi năm có 3 cung hạn × tam phương tứ chính
= gần như cả lá số đều "đang động". Hai lựa chọn rộng chồng lên nhau tạo ra tình
trạng mà thống kê gọi là **quá khớp**: luôn tìm được một sao, một cung, một thế nào
đó giải thích bất cứ chuyện gì đã xảy ra. Cảm giác chính xác tăng vọt, lượng thông
tin thật giảm về gần không.

Điều này **không có nghĩa là anh chọn sai.** Nhiều thầy hành nghề lâu năm giữ quan
điểm rộng, và họ luận được — vì họ có thứ bù lại: hàng nghìn lá số đã nghiệm, cho họ
trực giác về việc khi nào Tuần Triệt thật sự cắn và khi nào không. Cái trực giác đó
không viết ra thành prompt được. Nên bản khung này phải trả giá bằng ba ràng buộc:

1. **Chốt phạm vi bằng script trước khi đọc câu hỏi.**
   `python3 tuan_triet.py --can <can> --chi <chi> --che-do tam_hop`
   Danh sách cung xuất ra là cố định. Người luận không được thêm bớt giữa chừng.
2. **Chốt quy tắc ưu tiên khi ba lớp hạn mâu thuẫn — trước, không phải theo từng ca.**
   Mặc định đề xuất: **đại hạn > lưu niên > tiểu hạn** (lớp dài quyết định bối cảnh,
   lớp ngắn quyết định thời điểm). Nếu chọn khác thì ghi vào cấu hình và giữ nguyên.
   Được đổi quy tắc giữa chừng đồng nghĩa với không có quy tắc.
3. **Nghiệm lý (Mục 11) là bắt buộc, không phải tuỳ chọn.** Với cấu hình rộng, đây là
   cơ chế duy nhất còn lại để phát hiện luận sai. Chạy trước khi tin bất kỳ điều gì.

### 8.2 Đặc tả tham số âm/dương tuổi — và giới hạn của nó

Cổ thư có nêu một con số cụ thể: **người dương nam / dương nữ khi gặp Tuần Triệt thì
cung dương chịu 70% cường độ, cung âm chịu 30%.** Đã đưa vào script.

```bash
python3 tuan_triet.py --can Đinh --chi Tỵ --che-do tam_hop
# tuổi Tỵ → tuổi âm → cung âm (Sửu, Mão, Tỵ, Mùi, Dậu, Hợi) chịu 70%, cung dương 30%
```

Hai điều phải nói cho rõ, vì chính người trong nghề cũng nêu ra:

1. **Chiều cho tuổi âm là suy ra theo đối xứng**, không phải trích dẫn. Cổ thư nói về
   dương nam dương nữ; phần âm nam âm nữ tôi đảo lại cho cân. Nếu anh có nguồn nói khác,
   sửa hàm `cuong_do()` trong script.
2. **Con số 70/30 không kiểm chứng được.** Cổ thư không định nghĩa "100% cường độ" là gì,
   nên không có cách nào biết 70% khác 30% ở đâu trên một lá số thật. Dùng nó để **xếp
   thứ tự ưu tiên** giữa các cung thì được; dùng như một đại lượng đo được thì không.
   Script tự động in cảnh báo này mỗi lần chạy chế độ rộng.

**Đính chính về con số 70/30.** Đối chiếu nhiều nguồn thì các tỷ lệ này KHÔNG ổn định:
có nơi ghi 70/30, nơi khác 80/20, nơi khác nữa 70/20. Chiều thì các nguồn thống nhất —
nguyên tắc **đồng khí tương ứng**: người tuổi dương chịu nặng ở cung dương, người tuổi
âm chịu nặng ở cung âm (điều này xác nhận suy luận đối xứng ở trên là đúng chiều).
Nhưng độ lớn thì mỗi sách một khác. Kết luận: dùng để xếp **thứ tự** (cung nào nặng hơn
cung nào), tuyệt đối không dùng để **cộng trừ định lượng**.

### 8.3 Chế độ giao thoa (không còn dùng — đã chốt trường phái)

Giữ lại để tham chiếu. Kích hoạt khi `truong_phai: chưa xác định`:

- Luận trên phần **các phái đều đồng ý**: chính diệu, miếu vượng đắc hãm, tam phương
  tứ chính, Mệnh–Thân, tứ hoá sinh niên, tứ đại cách cục.
- Chỗ các phái đọc khác nhau → **trình bày cả hai cách đọc**, không tự chọn một cách
  rồi im lặng.
- Ghi cuối bài: những kết luận nào sẽ đổi nếu chuyển sang phái khác.

Nay đã chốt `Nguyễn Phát Lộc`, chế độ này không còn áp dụng — trừ phần
"ghi rõ kết luận nào sẽ đổi nếu chuyển phái", vẫn nên giữ trong mọi bản luận.
Vấn đề nhất quán chuyển sang Mục 8.0.

### 8.4 Đơn vị tuổi khi xem hạn — tuổi âm lịch

Đã chốt: **mọi lớp hạn (đại hạn, tiểu hạn, lưu niên) đếm theo tuổi âm lịch — tuổi mụ**,
tức tính 1 tuổi từ lúc sinh, và tăng vào **Tết Nguyên đán**, không phải sinh nhật dương
lịch, cũng không phải 1/1 dương lịch.

```
tuổi mụ = (năm âm lịch hiện tại) − (năm âm lịch sinh) + 1
```

Ba cái bẫy, đều là lỗi lệch một tuổi và đều làm sai cả cung hạn:

1. **Sinh trước Tết nhưng sau 1/1 dương lịch.** Ví dụ sinh 20/01/1990 — theo dương lịch
   là năm 1990, nhưng Tết Canh Ngọ năm ấy rơi vào 27/01, nên người này vẫn thuộc năm âm
   lịch **Kỷ Tỵ**. Lấy nhầm can chi năm sinh là sai từ gốc, sai luôn cả Tuần và Triệt.
2. **Sinh cuối năm âm lịch.** Người sinh tháng Chạp lên 2 tuổi chỉ sau vài tuần. Không
   phải lỗi tính toán — đó là bản chất của hệ đếm này, nhưng phải nói rõ với người xem,
   nếu không họ tưởng thầy tính nhầm.
3. **Giờ Tý 23h–1h.** Theo lịch can chi đã sang ngày mới, nên có thể sang cả tháng và
   năm âm lịch khác. Kết hợp với bẫy 1 thì một người sinh 23h30 đêm giao thừa có thể
   ra hai can chi năm hoàn toàn khác nhau. Trường hợp này bắt buộc lập cả hai lá số
   theo quy trình Mục 6.

Bảng khởi tiểu hạn (Dần Ngọ Tuất khởi Thìn, Thân Tý Thìn khởi Tuất, Tỵ Dậu Sửu khởi Mùi,
Hợi Mão Mùi khởi Sửu; nam thuận nữ nghịch) **không được để LLM tự tính** — lấy từ engine
an sao ở Lớp 1, theo đúng nguyên tắc Mục 2.

### 8.5 Phân kỳ thời gian — đã chốt: CÓ phân kỳ

Bản chất hai sao khác nhau, và điều đó dẫn tới thời điểm phát tác khác nhau:
**Triệt là cắt** — dứt khoát, tức thì, nên phát tác sớm rồi yếu dần.
**Tuần là ngăn, là treo** — giữ nguyên không cho phát triển, nên tác dụng chậm và bền.

Ba lập trường tồn tại trong sách vở Việt Nam:

| | Triệt | Tuần |
|---|---|---|
| **A. Phân kỳ đối xứng** (phổ biến nhất) | Mạnh tiền vận, sau đó yếu dần | Yếu tiền vận, mạnh từ hậu vận |
| **B. Phân kỳ một phía** | Mạnh tiền vận rồi yếu dần | Đều đặn, bền bỉ **suốt đời**, không có kỳ mạnh yếu |
| **C. Không phân kỳ** | Suốt đời | Suốt đời |

Các nguồn **đồng thuận về Triệt** (mạnh tiền vận rồi yếu) và **bất đồng về Tuần**.
Có tác giả nói thẳng: *"nói đến Tuần thì hơi khó trả lời, vì Tuần ảnh hưởng suốt cả đời,
hoặc mạnh mẽ từ 30 tuổi trở đi."* Tức là chỗ này chưa ngã ngũ trong chính truyền thống.

**Ranh giới không phải con số 30 tròn.** Cổ thư nói *"tuỳ theo cục"* — ví dụ Thuỷ nhị cục
thì 32 năm đầu. Quy tắc tái lập đúng ví dụ đó: **ranh giới = đại hạn đầu tiên bắt đầu từ
tuổi mụ 30 trở lên**, tức Thuỷ nhị cục 32, Mộc tam cục 33, Kim tứ cục 34, Thổ ngũ cục 35,
Hoả lục cục 36. Đặt ranh giới ở biên đại hạn tránh được câu hỏi vô nghĩa "29 tuổi khác gì
31 tuổi". Riêng Hoả lục cục ra 36 là hơi xa 30 — nếu anh quen dùng 26, ghi vào nhật ký
là đã dùng biên nào, đừng đổi giữa chừng.

**Vì sao chốt A.** Không phải vì tôi biết A đúng — không ai biết. Mà vì phân kỳ là tham số
duy nhất trong cả hệ **làm giảm** bậc tự do thay vì tăng:

| Cấu hình (chế độ rộng) | Số cung bị phủ (TB) | Số năm sinh bị phủ ≥10/12 |
|---|---|---|
| Không phân kỳ | 9,00 / 12 | **30 / 60** |
| Có phân kỳ (mỗi giai đoạn) | 6,00 / 12 | **0 / 60** |

Phân kỳ một mình nó xoá sạch trường hợp hỏng nhất — cái tình trạng Tuần Triệt phủ cả
12 cung nên không phân biệt được gì. Với chế độ hẹp của Nguyễn Phát Lộc thì còn chặt hơn:
3,67 → **2,00/12 mỗi giai đoạn**.

Quan trọng hơn con số: phân kỳ tạo ra **điều cấm**. Sau ranh giới, người luận **không được**
viện Triệt để giải thích bất cứ chuyện gì. Đó là một dự đoán có thể sai — và một quy tắc
có thể sai là quy tắc duy nhất đáng giữ. Lựa chọn C không cấm điều gì, nên không bao giờ
sai, nên không nói lên điều gì.

```bash
python3 tuan_triet.py --can Đinh --chi Tỵ --che-do tam_hop --giai-doan tien_van --cuc 2
# → ranh_gioi_tuoi_mu 32, chỉ tính Triệt, 6/12 thay vì 12/12
```

**Nếu nghiệm lý bác bỏ A** — tức các mốc biến động sau ranh giới vẫn khớp Triệt hơn Tuần —
thì chuyển sang B, và ghi lại lý do. Đó là cách một tham số được quyết bằng dữ liệu chứ
không bằng việc ai viết sách hay hơn ai.

## 9. Bộ khung Việt Nam — bổ sung bắt buộc cho Mục 3

Phần A của prompt Mục 3 phải phủ đủ năm trục sau, thiếu trục nào là luận thiếu:

1. **Mệnh – Thân.** Mệnh là bản chất, Thân là cái phát lộ ra và đậm dần từ trung niên.
   Thân cư Mệnh / Phúc / Quan / Tài / Thiên Di / Phu Thê — mỗi vị trí đổi hẳn trọng tâm
   đời người. Bỏ qua Thân là lỗi phổ biến của các bản luận do AI viết.
2. **Tam phương tứ chính.** Mệnh + Tài + Quan (tam hợp) + Thiên Di (xung chiếu).
   Không bao giờ đọc một cung đơn lẻ. Thêm nhị hợp khi cần.
3. **Vòng Thái Tuế.** Thái Tuế – Thiếu Dương – Tang Môn – Thiếu Âm – Quan Phù – Tử Phù –
   Tuế Phá – Long Đức – Bạch Hổ – Phúc Đức – Điếu Khách – Trực Phù. Phái Thiên Lương
   dùng vòng này để luận **tư cách và cách ứng xử** — người thuộc nhóm Thái Tuế, nhóm
   Tuế Phá, nhóm Thiếu Âm hành xử khác nhau. Nếu khai báo trường phái là Thiên Lương,
   trục này phải đứng trước cả chính diệu.
4. **Tứ đại cách cục.** Sát Phá Tham / Cơ Nguyệt Đồng Lương / Tử Phủ Vũ Tướng / Cự Nhật.
   Nói rõ lá số thuộc nhóm nào và **điều kiện thành cách hay phá cách**, không chỉ gọi tên.
5. **Cung Phúc Đức.** Trong tử vi Việt Nam đây là nền của cả lá số, không phải một cung
   phụ. Luận trước khi kết luận về Mệnh.

## 10. Prompt — Luận hạn

```
VAI TRÒ
Bạn luận hạn theo trường phái đã khai báo ở {{TRUONG_PHAI}}.

DỮ LIỆU
{{LA_SO_JSON}}
Năm cần xem: {{NAM}} (âm lịch)   Tuổi mụ: {{TUOI_MU}}   Can chi năm sinh: {{CAN_CHI}}
Đại hạn đang đi: cung {{DAI_HAN}} (từ {{TU_TUOI}} đến {{DEN_TUOI}})
Tiểu hạn năm {{NAM}}: cung {{TIEU_HAN}}
Cung lưu niên (Thái Tuế năm {{NAM}}): cung {{LUU_NIEN}}
Cách xem hạn đã chốt: song hành (đại hạn + tiểu hạn + lưu niên)
Quy tắc ưu tiên khi mâu thuẫn, ĐÃ KHOÁ: đại hạn > lưu niên > tiểu hạn
Phạm vi Tuần Triệt, do tuan_triet.py xuất ra, KHÓA: {{DS_CUNG_TUAN_TRIET}}

RÀNG BUỘC
1. Ba lớp hạn phải luận TÁCH BẠCH rồi mới hợp tham. Không trộn ngay từ đầu.
2. Khi ba lớp mâu thuẫn: áp thứ tự đã khoá (đại hạn > lưu niên > tiểu hạn). KHÔNG được chọn lớp nào
   thắng theo từng ca — đó là điều chỉnh quy tắc cho khớp kết luận mong muốn.
   Nêu rõ mâu thuẫn, không dàn xếp thành câu chuyện trơn tru, và HẠ độ tin cậy.
3. Chỉ được coi một cung là bị Tuần/Triệt nếu cung đó nằm trong {{DS_CUNG_TUAN_TRIET}}.
   Không thêm, không bớt, không "cung này tuy không bị nhưng chịu ảnh hưởng gián tiếp".
4. Nếu {{DS_CUNG_TUAN_TRIET}} phủ từ 10/12 cung trở lên: mở đầu bản luận bằng cảnh báo
   rằng ở cấu hình này Tuần Triệt gần như không còn khả năng phân biệt, và mọi kết luận
   dựa vào Tuần Triệt phải bị hạ độ tin cậy xuống thấp.
5. Không phán bệnh, tai nạn, tang sự, kiện tụng, thọ yểu — kể cả khi hạn đi vào
   Tật Ách hay gặp bộ sát tinh. Nói về áp lực và cách ứng phó, không nói về biến cố.
6. Không phán con số tài chính cụ thể.
7. Mọi lớp hạn đếm theo TUỔI MỤ (Mục 8.4). Nếu người dùng đưa tuổi dương lịch,
   quy đổi và nói rõ đã quy đổi; nếu sinh gần Tết, cảnh báo khả năng lệch một tuổi.

CẤU TRÚC

A. Ba lớp, tách bạch
   - Đại hạn: cung nào, chính diệu, tam phương tứ chính của cung đại hạn,
     Tuần Triệt có đóng vào không. Chủ đề 10 năm trong một câu.
   - Tiểu hạn: cung nào, gặp gì.
   - Lưu niên: cung Thái Tuế năm đó, các lưu tinh.

B. Hợp tham
   Chỗ ba lớp CÙNG chỉ về một hướng → độ tin cậy cao hơn.
   Chỗ ba lớp NGƯỢC nhau → nêu ra, không hoà giải, hạ độ tin cậy.

C. Ba việc nên làm trong năm — cụ thể, làm được, có thời hạn.
D. Ba việc nên hoãn — kèm lý do neo vào cung/sao.
E. Dấu hiệu luận đoán này SAI
   Điều gì xảy ra trong 12 tháng tới chứng minh bản luận này sai?
   Ghi lại để cuối năm đối chiếu (xem Mục 11).
F. Biên thực tế
   Ba yếu tố ngoài lá số ảnh hưởng mạnh hơn hạn trong năm này.
```

## 11. Prompt — Nghiệm lý (hiệu chuẩn)

Đây là phần quan trọng nhất của skill. Chạy **trước** khi tin bất kỳ luận đoán nào.

```
VAI TRÒ
Bạn đang NGHIỆM LÝ, không phải đoán. Mục tiêu là tìm chỗ lá số đọc SAI,
không phải tìm chỗ nó đọc đúng.

QUY TRÌNH BẮT BUỘC — thứ tự không được đảo
Bước 1. Người dùng CHƯA cung cấp sự kiện đời thực. Từ lá số, bạn ĐOÁN TRƯỚC:
        - 3 giai đoạn có biến động lớn (ghi khoảng tuổi)
        - tính chất mỗi biến động (nghề nghiệp / nơi ở / quan hệ / tài chính)
        - 2 nét tính cách dễ kiểm chứng bằng hành vi quan sát được
        Viết ra. Chốt. Không sửa sau.
Bước 2. Hỏi người dùng đối chiếu, cho phép trả lời "sai", "một phần", "đúng".
Bước 3. Chấm điểm THẲNG THẮN:
        - Số dự đoán trúng / tổng số
        - Trong số trúng, bao nhiêu cái trúng vì lá số, bao nhiêu cái trúng vì
          MÔ TẢ QUÁ RỘNG (ai cũng có biến động nghề nghiệp tuổi 28–32)?
          Loại nhóm thứ hai ra — nó không phải bằng chứng.
        - Bao nhiêu cái trật hoàn toàn?
Bước 4. Kết luận hiệu chuẩn:
        - Nếu tỷ lệ trúng thực chất thấp → nói thẳng: lá số này (hoặc giờ sinh này,
          hoặc trường phái đang dùng) không đọc được người này. Đề nghị kiểm tra lại
          giờ sinh trước khi làm gì khác.
        - Nếu trúng cao → vẫn nêu rõ số mẫu quá nhỏ để kết luận, và tiếp tục ghi nhật ký.

BƯỚC 5 — SO SÁNH A/B HAI CHẾ ĐỘ TUẦN TRIỆT  (bắt buộc với cấu hình rộng)
        Lặp lại Bước 1–3 HAI LẦN trên cùng lá số, cùng bộ sự kiện đời thực:
          Lần A: --che-do hep     (chỉ cung Tuần/Triệt đóng)
          Lần B: --che-do tam_hop (lan cả tam hợp)
        Quan trọng: Bước 1 của lần B phải viết ra TRƯỚC khi nhìn kết quả lần A.
        Rồi so:
          - Chế độ nào đoán trúng nhiều hơn về mặt THỰC CHẤT (đã loại các câu quá rộng)?
          - Chế độ rộng có đoán trúng thêm điều gì mà chế độ hẹp bỏ sót không,
            hay nó chỉ giải thích được nhiều hơn SAU KHI đã biết đáp án?
          Đây là câu hỏi phân định. Một quy tắc chỉ giỏi giải thích hồi tố mà không
          đoán trước được gì thêm thì không phải quy tắc, mà là ngôn ngữ mô tả.
        Ghi kết quả so sánh vào nhật ký. Sau 10–15 lá số, số liệu sẽ tự trả lời
        câu hỏi "hẹp hay rộng" — thay vì phải chọn theo uy tín tác giả.

CẤM
- Không được hỏi sự kiện đời thực TRƯỚC rồi mới "đoán". Đó là đọc ngược, và nó
  làm mọi lá số trông chính xác.
- Không làm mềm kết quả nghiệm lý để người dùng đỡ thất vọng.

XUẤT
Một dòng vào nhat-ky-tuvi.jsonl:
{"ngay":"...","gio_sinh":"...","truong_phai":"...","du_doan":[...],
 "ket_qua":[...],"trung_thuc_chat":0,"trung_do_mo_ho":0,"trat":0}
```

## 12. Prompt — Hợp hôn / so lá số

```
ĐIỀU KIỆN TIÊN QUYẾT
Người thứ hai đã ĐỒNG Ý cho xem lá số của họ chưa? Nếu chưa hoặc không rõ — DỪNG.
Xem lá số người khác sau lưng họ là việc không nên làm, bất kể quan hệ là gì.

DỮ LIỆU
Lá số A: {{LA_SO_A}}   Lá số B: {{LA_SO_B}}

RÀNG BUỘC
1. KHÔNG kết luận "hợp" hay "không hợp". Không xếp hạng phần trăm.
2. KHÔNG khuyên cưới, chia tay, hay hoãn cưới.
3. KHÔNG dùng chữ "khắc". Không quy trách nhiệm một người cho vận của người kia —
   đây là chỗ tử vi gây hại thật cho người thật, nhiều hơn mọi chỗ khác.
4. Chỉ mô tả ĐỘNG LỰC QUAN HỆ: hai người này thường phản ứng thế nào khi
   căng thẳng, khi ra quyết định, khi tiền bạc có vấn đề.

CẤU TRÚC
A. Hai kiểu người: mỗi bên một đoạn, dựa trên Mệnh – Thân – Phúc Đức.
B. Ba điểm dễ hiểu nhau. C. Ba điểm dễ va nhau — kèm cách nói chuyện cụ thể để gỡ.
D. Cung Phu Thê của mỗi bên nói gì về KỲ VỌNG của chính người đó trong hôn nhân
   (không phải nói về người kia).
E. Điều lá số không nói được: ít nhất ba điều. Nêu rõ rằng tương hợp thật sự
   phụ thuộc vào hành vi hằng ngày, không phụ thuộc lá số.
```

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

## 13. Ranh giới nghề nghiệp

Skill này **không** được dùng để:

- Sản xuất nội dung marketing cho cơ sở y tế (vi phạm quy định quảng cáo y tế
  Việt Nam khi gắn yếu tố tâm linh vào dịch vụ khám chữa bệnh).
- Sàng lọc, tuyển dụng, phân công hay sa thải nhân sự theo tuổi/lá số.
- Tư vấn cho khách hàng, bệnh nhân, hay bên thứ ba chưa đồng ý.
- Ra quyết định đầu tư, vay nợ, hoặc điều trị y tế.

Nếu người dùng yêu cầu một trong các việc trên: từ chối phần đó, giải thích lý do
ngắn gọn, và đề nghị hướng thay thế phù hợp.

## Human-in-the-loop

Module này chạy theo các cổng kiểm soát dùng chung trong `HUMAN-IN-LOOP.md`.
Quy tắc tối cao: không đi qua hai cổng liên tiếp trong một lượt trả lời.
