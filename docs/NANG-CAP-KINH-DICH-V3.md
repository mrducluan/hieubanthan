# Nâng cấp Kinh Dịch V3 (KD-V3, 2026-11-08) — "trả lời theo việc" + UI hỏi quẻ

Khâu vòng tăng trưởng: **QUAY LẠI** (người hỏi thấy câu trả lời bám đúng việc của mình → quay lại gieo cho việc khác) +
**THU HÚT** (ô hỏi dùng được ngay, không rối). Đo: `advisor_question_completed{mo_dun=kinhdich}`, tỉ lệ "Đúng với mình" của
mã mới `ds.kinhdich.*.nguoi_kia.*` / `.can_go.*`, `chart_interacted{mo_dun=kinhdich, kind=goi_y_dien_san | hieu_cau}`,
phiếu `kiem_chung_sau` loại `que` (quẻ có ứng không, 30 ngày sau).

## 1. Rà soát engine (vai một người đọc Dịch lâu năm)

Chạy cùng MỘT quẻ (Ký Tế, hào 3 động) cho bốn câu hỏi khác nhau — bản trước KD-V3:

| Câu hỏi | Điều engine trả | Chỗ sai / mỏng |
|---|---|---|
| "Có nên nhận lời làm quản lý?" | "Quẻ Ký Tế nghiêng về mức cần lưu ý… Hiểu đơn giản: như vừa hoàn thành việc lớn" | Lời hào chủ 高宗伐鬼方 (việc lớn, ba năm mới xong, đừng giao người kém) **không được áp vào việc** "nhận làm quản lý" |
| "Vợ chồng hay cãi nhau, có nên ly thân?" | chủ đề **Cưới hỏi, hôn nhân**; việc nên làm "bàn rõ ba chuyện: tiền, con cái, nhà hai bên" | Lời cho người SẮP CƯỚI đưa cho người đang muốn ly thân |
| "Con tôi thi đại học có đậu?" | chủ đề **Con cái**, dụng thần Tử Tôn; việc nên làm "dành thời gian riêng với con" | Việc được hỏi là **bài thi** (Phụ Mẫu); con là người được hỏi hộ |
| "Bạn thân nợ 50 triệu, có đòi được?" | chủ đề **Bạn bè**, dụng thần **Huynh Đệ**, lĩnh vực công việc; "Điều dễ vấp: buông lơi sau thành công" | Trong Lục Hào, khoản tiền là **Thê Tài**; Huynh Đệ là người làm hao tiền — chọn ngược |

Kết luận: tầng CALC vững (ba phái, quy tắc Chu Hy, lục thú · phục thần · ứng kỳ), KB 64 quẻ + 384 hào có nôm na; nhưng
**tầng luận chỉ tra quẻ rồi dán nhóm việc của chủ đề** — cùng quẻ ra gần như cùng bài cho mọi câu (độ giống nhau giữa
8 câu khác nhau trên cùng quẻ: 0,51–0,56 Jaccard cụm 4 chữ), dụng thần chọn theo NGƯỜI được nhắc chứ không theo VIỆC, câu
"người kia thế nào" không đọc Thế–Ứng, không có "điều cần gỡ trước" từ cấu trúc quẻ. Bộ chấm holdout cũ (93 % định tuyến,
95 % trả lời thẳng) không bắt được vì chỉ chấm lĩnh vực + đoạn đầu có nhắc chủ đề.

## 2. Ba hướng tiếp cận (engine)

| Hướng | Cách làm | Được | Mất | Quyết |
|---|---|---|---|---|
| A. Ma trận quẻ × việc | Viết 64 quẻ × ~20 chủ đề (1.280 mục) + hào × việc | Lời sát việc nhất khi viết tốt | Toàn nháp AI, 7.680 mục nếu tới hào; vẫn là tra bảng, không dùng được phần CALC đã có (dụng thần, Thế–Ứng, ứng kỳ); duyệt chuyên gia bất khả thi | ✗ |
| **B. Lớp luận theo cấu trúc + vai** | Hiểu câu (kiểu · vai · việc) → dụng thần theo VIỆC + VAI → nghiêng từ xu hướng hào chủ (KB 384 tag) / dụng thần theo ngày tháng / thể–dụng → lời theo kiểu câu + MỘT lý do riêng của lần gieo + Thế–Ứng cho người kia + điều cần gỡ | Đúng cách thầy Lục Hào đọc; tất định, có golden; KB nhỏ (~60 mục + 384 tag); mọi dữ kiện đã tính được dùng | Tag 384 hào là biên tập (duyệt dần); lời vẫn là khuôn + ghép | **✓ chọn** |
| C. AI diễn đạt theo gói bằng chứng | Như TR-3 Tarot: LLM viết đoạn trả lời từ gói, qua `kiem_ai` | Nhanh, lời mềm | Gói đang sai dụng thần / chủ đề thì AI viết hay vẫn sai; "áp hào vào việc" là suy luận mới = thêm dữ kiện (trái tầng NARRATIVE); tốn hạn mức RL-1; không tất định | ✗ (có thể làm sau B, chỉ diễn đạt) |

## 3. Đã làm (engine)

- KB mới `engine/app/kb/data/kinhdich_tra_loi.json` (+ `kb/kinhdich_tra_loi_kb.py`): **xu hướng 384 hào** (8 nhãn: nên
  tiến · làm được nhưng giữ đúng · giữ nguyên · cần người cùng làm · chưa tới lúc · cẩn thận · nên dừng/rút · việc tới cuối —
  tự rút từ chữ đoán 吉凶厲吝悔无咎利勿用往征 rồi biên tập duyệt tay từng hào, nhất là 70 hào không có chữ đoán); khuôn câu theo
  6 kiểu câu × 4 nghiêng; **dụng thần theo việc** 21 chủ đề (chính · phụ · kỵ; vai → lục thân); lời Thế–Ứng (5 quan hệ) +
  trạng thái hào người kia (không · phá · động · vượng · suy · phục); 9 "điều cần gỡ" từ cấu trúc quẻ. Nháp, `can_doi_chieu`.
- RULES `luangiai/kinhdich_tra_loi.py`: `hieu_cau` (kiểu: có nên · có thành không · người kia thế nào · khi nào · làm thế
  nào · thế của việc; vai: tôi · con · bố mẹ · vợ/chồng · người ấy · sếp · đối tác · bạn bè), `dung_than` (việc quyết hào chính,
  người được hỏi hộ là hào phụ; chủ đề biến thể nữ/nam giữ dụng thần KB), `tag_hao_chu` (lời làm chủ theo quy tắc Chu Hy),
  nghiêng theo phái chính **kẹp theo mức** (mức + mã hộp cũ không đổi → phiếu "Đúng với mình" cũ còn nguyên), `nguoi_kia`
  (Thế–Ứng, hào người kia ưu tiên Ứng → động → không phải Thế), `can_go` (kỵ thần động · không/phá/mộ · hào động hoá xấu ·
  quẻ biến khó · thể sinh dụng / dụng khắc thể), `tra_loi` ghép câu đầu.
- `luangiai/kinhdich_doi_song.doc_que`: `ket_luan` = câu trả lời theo việc; hộp mới **"Phía {người kia}"** (mã
  `ds.kinhdich.<cd>.nguoi_kia.q<n>.<quan hệ>_<trạng thái>`) và **"Điều cần gỡ trước"** (`…can_go.q<n>.<mã>`); "Điều dễ vấp"
  = chỗ vấp theo xu hướng hào + mặt tối quẻ; "Điểm đang có lợi" khi đọc Lục Hào / Mai Hoa = lý do riêng; đoạn ghi "hai cách
  đọc nhìn hai mặt" khi lời kinh và dụng thần khác CHIỀU; trường `tra_loi` trả ra cho web. Golden mã kiểm chứng sinh lại
  có chủ đích: **chỉ thêm 2 mã** (hộp mới), không mã cũ nào đổi.
- `hoidap/kinhdich`: dụng thần Lục Hào lấy từ bảng việc + vai (trước: theo chủ đề / từ khoá người); `hoidap/mo_dau.que_mo`
  dùng câu đầu mới (nghiêng + lý do riêng, phía người kia, điều cần gỡ, việc nên làm — "cùng con, …" khi hỏi hộ con).
- Chủ đề: thêm **"Vợ chồng lục đục, ly thân"** (`hon_nhan_tt` + biến thể nữ/nam; việc nên làm riêng, ưu tiên an toàn), từ
  khoá đòi nợ / cất nhắc / mua được nhà / mổ, nhập viện; **việc thắng người** khi câu có cả hai (con thi → thi cử, bố mẹ bán
  nhà → bán nhà); vụ kiện → tranh chấp (không bắt "kiện hàng"); **chồng / anh ấy / cô ấy → tự chọn biến thể**, không hỏi lại
  giới người kia; "có ổn / có thuận không" cho việc mình định làm = câu có nên.
- Route mới `POST /v1/kinhdich/hieu-cau` (chỉ mã + nhãn danh mục; không trả lại câu, không ghi nhật ký) cho UI.
- Đo: `scripts/do_kinhdich_v3.py` — bộ dev 50 câu nhãn viết trước (`fixtures/cau_hoi/kinhdich_hieu_cau_dev.jsonl`) + độ
  giống nhau giữa 8 câu trên cùng quẻ; test `tests/test_kinhdich_tra_loi.py` (KB đủ 384 tag, cụm cấm, ngưỡng bộ dev, nghiêng
  kẹp mức, cùng quẻ khác câu → khác trả lời, hộp người kia, không lộ chữ người dùng).

### Số đo

| Thước đo | Trước | Sau |
|---|---|---|
| Hiểu câu (bộ dev 50): kiểu · vai · chủ đề · dụng thần | — (chưa có lớp) | 50 · 50 · 50 · 50 / 50 |
| Độ giống nhau 8 câu cùng quẻ (Jaccard cụm 4 chữ, 4 quẻ) | 0,51 · 0,51 · 0,51 · 0,56 | 0,43 · 0,41 · 0,45 · 0,45 |
| Holdout v2 Kinh Dịch (định tuyến / trả lời thẳng) | 41/44 · 95 % | 41/44 · 95 % (giữ) |
| Bộ dev EN-3d Kinh Dịch (định tuyến) | 42/60 | 42/60 (giữ; đổi 1 câu "kiện hàng" đã sửa lại) |

Phần còn giống nhau là lớp DIỄN GIẢI quẻ (hình ảnh quẻ, điểm rơi, quẻ biến, lời khuyên chung) — đúng vai của nó; lớp
TRẢ LỜI (câu đầu, phía người kia, điều cần gỡ, điều dễ vấp) khác nhau theo câu.

## 4. Ba hướng tiếp cận (UI trang `/kinh-dich`)

Lỗi anh báo: bấm câu gợi ý → câu KHÔNG xuống ô (khung chat dùng chung gửi luôn câu gợi ý; với "Tôi gieo đồng xu thật" còn
báo lỗi vì chưa đủ 6 hào). Thêm: 24 chip chủ đề xếp 5 hàng + 2 ô chọn + hướng dẫn đứng TRƯỚC ô hỏi → ô hỏi ở tận đáy.

| Hướng | Cách làm | Quyết |
|---|---|---|
| U1. Chip điền sẵn + Gửi | Chip chỉ điền vào ô, người dùng tự gửi; bố cục giữ nguyên | Sửa đúng lỗi nhưng ô hỏi vẫn ở đáy, chủ đề vẫn phải tự chọn |
| U2. Trình tự 3 bước | Bước hỏi → bước xác nhận chủ đề (engine hiểu câu) → bước gieo | Rõ nghi thức nhưng thêm màn hình, chậm hơn cho người quen; đổi nhiều e2e |
| **U3. Ô hỏi lên đầu + chủ đề tự nhận + điều khiển gọn** | Lời chào → chip gợi ý (điền vào ô) → **ô hỏi** → dòng "Câu hỏi dạng *có nên* · Bạn đang hỏi về **X** (tự nhận — bấm chip để đổi)" + hàng chip MỘT dòng cuộn ngang (chip tự nhận đứng đầu) → hai ô chọn cách đọc / cách gieo → hướng dẫn gập | **✓ chọn** — sửa lỗi, bớt rối, dùng được lớp hiểu câu mới; e2e cũ giữ được (ô chọn vẫn có nhãn cũ) |

Đã làm: `KhungChat` thêm `chipDienSan` (chip điền + đưa con trỏ vào ô), `dieuKhienDuoi` (điều khiển dưới ô), `onCauDoi`
(trang debounce 500 ms gọi `/api/kinhdich/hieu-cau` khi ≥ 8 ký tự; chỉ đổi dòng gợi ý, không lưu câu); trang Kinh Dịch:
chủ đề = chip chọn tay ?? chủ đề engine tự nhận; câu người ấy chưa rõ giới → ba nút làm rõ hiện ngay dưới ô (trước gieo);
câu kiến thức → báo "không cần gieo quẻ". `DocQue` thêm nhãn "Lời hào làm chủ: {xu hướng}". Khung chat các mảng khác giữ
hành vi cũ (chip hỏi luôn). E2E mới `e2e/kinh-dich-v3.spec.ts`.

## 5. Chưa làm / chờ chủ dự án

- 384 nhãn xu hướng hào + 108 câu lời mới là nháp ban biên tập — cần người rành Dịch duyệt (`kinhdich_tra_loi.json`, trường
  `hao_xu_huong`); đổi nhãn không đổi mức / mã cũ, chỉ đổi câu đầu.
- Hướng C (AI diễn đạt riêng chương trả lời như Tarot TR-3) chỉ nên làm sau khi anh thấy lớp B đúng hướng.
- Deploy **engine trước web** (route `/v1/kinhdich/hieu-cau`, trường `tra_loi`; web cũ bỏ qua trường mới; web mới gặp engine
  cũ → dòng tự nhận không hiện, chip vẫn chọn tay được).
