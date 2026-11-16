# Đề xuất: hồ sơ gia đình và "Bảng nhà mình" (GD-1)

Ngày 2026-11-16 · trạng thái: **đợt 1, 2, 3 đã làm** (2026-11-16; xem mục 7) (chủ dự án duyệt theo đề xuất: trần 8 người, danh mục vai mục 2, không điểm số, không ghép Bát tự chéo). Đợt 2–3 chưa làm · khâu QUAY LẠI + MỜI + NẠP Sao.
Đo: `family_member_added{vai, lop}`, `family_viewed{so_nguoi}`, `chart_interacted{kind=gia_dinh_viec, muc}`,
`share_clicked{gd}` → `referral_signup`.

## 1. Hiện trạng: phép tính đã đủ, thiếu lớp ghép nhiều người

| Đã có | Ở đâu | Dùng lại |
|---|---|---|
| Hồ sơ bản thân (lưu máy) | `web/lib/hoso.ts` | Người gốc của nhà |
| Người thân ≤ 5, chỉ trên máy, 8 vai chung chung | `web/lib/nguoi-than.ts` | Mở rộng thành "nhà"; **thiếu vai có chiều** |
| Bảng `ho_so` một dòng mỗi tài khoản | `supabase/migrations/0006_ho_so.sql` | Không chứa được người thân |
| Quan hệ con giáp, Tam tai, Kim lâu, sao hạn, xông đất | `engine/app/calc/tuoi_dan_gian.py` | Chạy từng cặp / từng người |
| Xem lá số 2 người (nạp âm, can, chi, cung phi, tứ hoá theo quan hệ) | `engine/app/luangiai/tuvi_hai_nguoi.py` | Lấy tiêu chí + lời, **không lấy điểm** |
| Hướng tốt chung hai mệnh, hành thông quan | `engine/app/calc/huyen_khong.py` | Nhiều người = giao các tập hướng |
| Hôm nay của hai người | `engine/app/luangiai/tuan_hai_nguoi.py` | Có |
| Chọn ngày cho cả nhà ≤ 8 người, 10 vai | `engine/app/luangiai/chon_ngay_nhieu.py` | Đã là nhiều người |
| Thần số hợp đôi theo 5 quan hệ | KB `thanso_quan_he.json` | Có |
| Năm nên chú ý sức khoẻ | `engine/app/luangiai/suc_khoe_nam.py` | Từng người |
| Dưới 18 tuổi: lời cho cha mẹ | `tuvi_doi_song.py`, `chu_y_nam.py`, `hoan_canh.py` | Có |

## 2. Dữ liệu

| | A. Chỉ trên máy | B. Bảng tài khoản mới | C. Lai (chọn) |
|---|---|---|---|
| Cách | `hbt.gia_dinh.v1`, ≤ 8 người | Bảng có RLS + đồng ý riêng | A mặc định; "Lưu nhà vào tài khoản" chỉ đẩy lớp cơ bản |
| Pháp lý | Thấp nhất | Cao: dữ liệu người thứ ba và trẻ em trên máy chủ | Vừa |
| Đổi máy | Mất | Giữ | Giữ lớp cơ bản |
| Migration | Không | Có | Có, ở đợt 3 |

- **Lớp cơ bản (bắt buộc)**: vai, năm sinh, giới tính, tên gọi tuỳ chọn ("Mẹ", "Bé Na"). Đủ cho con giáp, nạp âm,
  cung phi, Tam tai, sao hạn, Kim lâu, xông đất, chọn ngày.
- **Lớp đầy đủ (tuỳ chọn, chỉ trên máy)**: ngày giờ, nơi sinh. Mở thần số, Tử vi, Bát tự của người đó.
- Trẻ dưới 18 tuổi: không bao giờ đồng bộ ngày giờ sinh. Xoá được từng người hoặc tất cả.
- Luật 91/2025 đòi sự đồng ý của chính chủ thể dữ liệu; với trẻ em cần cha mẹ / người giám hộ. Cần luật sư xác nhận
  trước khi đồng bộ tài khoản (đợt 3).
- **Vai có chiều**, nhìn từ người dùng: vợ/chồng, con, bố, mẹ, anh/chị, em, ông/bà, cháu, bố mẹ bên kia, con dâu/rể,
  người cùng nhà. Mỗi vai ánh xạ về mã quan hệ engine đang có.

## 3. Liên kết giữa các người: chỉ dùng thứ đã có căn cứ

| Liên kết | Cần | Nguồn sẵn có | Ra lời gì |
|---|---|---|---|
| Con giáp từng cặp (tam hợp, lục hợp, xung, hình, hại) | Năm sinh | `quan_he_chi` | Cặp nào dễ gần, cặp nào hay trái nhịp + việc cụ thể |
| Nạp âm, can năm | Năm sinh | `tuvi_hai_nguoi` | Lời hành vi; không dùng chữ "khắc" ở phần hiển thị |
| Cung phi: nhóm Đông / Tây, hướng chung | Năm + giới tính | `huong_chung`, `thong_quan` | Đầu giường, bàn ăn, phòng chung theo ai |
| Tứ hoá năm sinh người này vào cung của người kia | Lá Tử vi | HN-2N | Vợ chồng → Phu Thê; con → Tử Nữ; bố mẹ → Phụ Mẫu |
| Cặp số thần số theo quan hệ | Ngày sinh | `luan_hop_doi` | Không điểm |
| Năm cá nhân từng người trong cùng năm | Ngày + tháng | thần số | "Nhà có người năm 1, người năm 9" |
| Lịch chung của nhà: Tam tai, năm tuổi, sao hạn, Kim lâu | Năm (+ giới) | `tuoi_dan_gian` | "Dân gian thường…", không đổi mức |
| Việc chung: ngày tốt không xung tuổi ai, tuổi làm nhà, xông đất | Năm sinh | công cụ có sẵn | Điền sẵn từ hồ sơ nhà |
| Ai có năm nên chú ý sức khoẻ | Lớp đầy đủ | `suc_khoe_nam` | Lời nhắc đi khám; trẻ nhỏ thì lời cho cha mẹ |
| Tháng xung tuổi từng người | Năm sinh | `thoi_gian_lop` | Lịch nhà 12 tháng |

**Không làm**: ghép Bát tự chéo hai người ("hành người này cần, người kia nhiều" — hệ thống không có phép hợp hôn
Bát tự nào có nguồn, dụng thần lại luôn trình bày hai cách); điểm "độ hợp cả nhà"; xếp hạng thành viên; đọc cung
Tử Nữ / Phụ Mẫu như lời nói về một người thân cụ thể.

## 4. Sản phẩm

| | A. "Bảng nhà mình" (theo năm) | B. "Từng cặp" | C. "Việc chung của nhà" |
|---|---|---|---|
| Giá trị | Mở ra thấy cả nhà năm nay ai cần để ý gì | Sâu, nhưng lặp Xem lá số 2 người | Thực dụng, theo mùa |
| Công làm | Vừa (gom hàm có sẵn) | Cao (nhiều KB theo vai) | Thấp |
| Rủi ro | Thấp | Cao (dễ thành phán người) | Thấp |
| Quay lại | Mạnh (mỗi năm, mỗi tháng) | Một lần | Theo dịp |
| Mời | "Gửi link để mẹ tự nhập giờ sinh" | Có | Yếu |
| Nạp Sao | Chương sâu từng người | Có | Khó |

**Chọn A làm xương sống**; C là lối tắt điền sẵn; B chỉ là một thẻ cặp gọn khi bấm vào hai người, không điểm.

### Lộ trình

- **Đợt 1 — không migration.** Engine `luangiai/gia_dinh.py` + `POST /v1/gia-dinh` (test viết trước): ≤ 8 người lớp cơ
  bản → bảng năm (mỗi người: con giáp, tuổi mụ, điều tập quán nhắc, một việc nên làm), cặp con giáp nổi bật, hướng chung
  cả nhà, lối sang công cụ. KB `gia_dinh_kb.json` (nháp). Web `/gia-dinh` (noindex), form thêm người hai trường + vai;
  chuyển danh sách người thân cũ sang một lần; chọn ngày, xông đất, làm nhà đọc từ đây.
- **Đợt 2 — lớp đầy đủ + mời.** Thẻ cặp (thần số theo quan hệ, tứ hoá hai chiều, hôm nay của hai người), lịch nhà
  12 tháng, link mời có ký "nhập giờ sinh của bạn vào nhà của X" (người nhận tự nhập trên máy họ), chương sâu mở bằng
  Sao, kiểm chứng `ds.gia_dinh.*` (cần thêm vào ràng buộc SQL).
- **Đợt 3 — migration.** Bảng `gia_dinh` (JSON ≤ 16 KB, RLS, chỉ lớp cơ bản, đồng ý riêng), Web Push "tháng này của
  nhà", cập nhật Chính sách riêng tư.

## 5. Ranh giới và mẫu lời

Không điểm, không xếp hạng; không "khắc chồng / khắc con"; không đoán thọ, bệnh của người thân; không khuyên chọn
hay bỏ người; không vật phẩm, cúng giải hạn; mọi hộp "nên để ý" phải có việc cụ thể; người dưới 18 chỉ có lời cho
cha mẹ; đang xem người thân thì ẩn Lưu / kiểm chứng; sự kiện đo chỉ mang mã.

**Vợ – chồng (Tý – Ngọ, khác nhóm cung phi)**
- Điểm sáng: "Hai bạn nhìn việc từ hai phía khác nhau, nên khi bàn chuyện lớn ít khi cùng bỏ sót một điều."
- Nên để ý: "Dân gian xếp hai tuổi này vào nhóm dễ trái nhịp: người muốn quyết nhanh, người muốn chờ."
- Việc nên làm: "Khoản chi lớn thì hẹn bàn sau một đêm. Hai bạn không có hướng tốt chung, nên xoay đầu giường theo
  người ngủ khó hơn; bàn làm việc mỗi người theo hướng riêng."

**Mẹ – con (con 9 tuổi, năm con vào Tam tai theo tập quán)**
- Điểm sáng: "Tuổi của mẹ và con thuộc nhóm dễ gần: con thường nghe khi mẹ giải thích lý do."
- Nên để ý (lời cho cha mẹ): "Dân gian coi đây là năm trẻ nên được để mắt hơn khi đi lại, chơi đùa. Đây là tập quán
  nhắc cẩn thận, không phải dự báo."
- Việc nên làm: "Rà lại đường con đi học, mũ bảo hiểm, chỗ chơi gần nước. Giữ lịch khám định kỳ của con."

## 6. Cần chủ dự án quyết

1. Trần số người: 8 (khớp công cụ chọn ngày) thay cho 5.
2. Danh mục vai ở mục 2.
3. Thẻ cặp có hiện điểm 0–100 của Xem lá số 2 người không. Đề xuất **không**, chỉ để link sang `/tu-vi#hop-tham`.
4. Chương nào mở bằng Sao.
5. Đồng bộ tài khoản (đợt 3) chờ ý kiến luật sư về dữ liệu trẻ em.
6. Bỏ hẳn ghép Bát tự chéo hai người.

## 7. Đợt 2 + 3 đã làm (2026-11-16, sau QC đợt 1)

QC đợt 1: bảng chỉ so **con giáp** nên mỏng, ai cùng tuổi cũng như nhau, không nói gì về tình cảm, tiền bạc, làm ăn.

**Đợt 2 — nhiều lớp, một nguồn với công cụ đã có**
- Mỗi cặp xem theo tới 6 lớp: con giáp · bản mệnh nạp âm · can năm · cung phi (cần giới tính) — mức và lời lấy đúng
  ở kho "Xem lá số 2 người" (`tuvi_hai_nguoi`, không lấy điểm); có ngày sinh thêm **trụ ngày Bát tự** (can ngày ngũ hợp,
  chi ngày hợp / xung — ghi rõ là nét phụ, sách xưa không có bảng riêng) và **nhịp năm thần số**.
- Nhịp gộp của cặp (đếm lớp, không điểm): Điểm sáng ~21 % · Hai mặt ~48 % · Nên để ý ~30 % (đo 2.500 cặp năm sinh).
- Từng mặt theo nhóm quan hệ: vợ chồng (tình cảm, tiền bạc, làm ăn chung) · cha mẹ – con (chuyện trò, học hành nghề
  nghiệp) · anh em (làm ăn chung, việc nhà chung) · ông bà – cháu · người cùng nhà.
- **Năm năm tới của nhà mình**: ai Tam tai, năm tuổi, xung với năm từng năm; gợi ý năm ít người lớn vướng nhất cho việc lớn.
- **Lá số của bạn nói gì về nhà mình** (hồ sơ có giờ sinh): mức + tóm tắt + hộp của chương Gia đình, Tình cảm, Công việc,
  Tiền bạc từ báo cáo đời sống Tử vi và Bát tự (mượn như hỏi đáp, một bộ tính); đường tứ hoá theo can năm sinh từng người
  nhà vào cung trọng tâm của lá số bạn (Phu Thê, Tử Nữ, Phụ Mẫu, Huynh Đệ…) bằng đúng hàm của Xem lá số 2 người.
- Web: sơ đồ nhà (nét lục / vàng đứt), thẻ cặp có chấm từng lớp + mục gập "từng mặt", ô ngày sinh tuỳ chọn.

**Đợt 3 — migration 0039 (chờ chủ dự án chạy)**: bảng `gia_dinh` chỉ nhận vai + năm sinh + giới tính (hàm
`gia_dinh_hop_le` chặn tên, ngày sinh ngay trong DB), ≤ 7 người, RLS chủ sở hữu; nút "Lưu nhà mình vào tài khoản" (tự tích
đồng ý) + "Tải từ tài khoản"; xoá ở Dữ liệu của tôi. Nên hỏi luật sư về dữ liệu trẻ em trước khi chạy.

**Vẫn không làm**: điểm "độ hợp cả nhà"; ghép dụng thần Bát tự chéo hai người (không nguồn, dụng thần luôn hai cách);
đọc cung Tử Nữ / Phụ Mẫu như lời về một người thân cụ thể. **Chưa làm**: link mời người nhà tự nhập giờ sinh, lịch nhà
12 tháng, chương mở bằng Sao, kiểm chứng `ds.gia_dinh.*` (cần sửa ràng buộc SQL), Web Push "tháng này của nhà".
