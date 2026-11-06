# CD-1 — Chân dung tổng hợp: Tử vi · Bát tự · Nhân tướng cùng nhìn một con người

**Ngày:** 2026-11-06 · Chủ dự án giao: "sự liên kết dữ liệu tổng hợp giữa Tử vi, Bát tự, Nhân tướng để có đánh giá tổng quan về con người — suy nghĩ sâu, 3 phương án, chọn phương án tốt nhất và làm".

Khâu của vòng tăng trưởng: **QUAY LẠI** (một bài đọc ghép mọi thứ đã có của chính người dùng — lý do quay về sau khi đã xem từng môn) + **NẠP Sao** (chương sau mở bằng Sao, cùng luồng Luận giải toàn bộ) + **THU HÚT** (từ khoá "tử vi bát tự nhân tướng kết hợp", trang `/chan-dung`). Đo: `reading_started/completed{mo_dun=chan_dung}`, `paywall_viewed/unlock_succeeded{mo_dun=chan_dung}`, phiếu `ds.chan_dung.*` + phiếu về môn gốc, Search Console `/chan-dung`.

## 1. Những gì đã có trước (không làm lại)

| Lớp | Ở đâu | Giới hạn |
|---|---|---|
| Nhất quán năm Tử vi ↔ Bát tự | `luangiai/nhat_quan.py` (EN-2), dùng ở Thời gian tới | chỉ cấp **năm**, chỉ hai môn |
| Khung "Cần lưu ý ở từng mảng" | `luangiai/luu_y_mang.py` (MT-ĐS B6) | trong **từng** báo cáo, không so giữa môn |
| Tướng và lá số | chương 7 báo cáo Nhân tướng (NT-1) | chỉ ngũ hình × dụng thần Bát tự |
| Tổng hợp ba phái thần số | `luangiai/tong_hop.py` + đồ thị `thanso_do_thi.json` | thần số, không phải ba môn phương Đông |
| Thẻ "Bản đồ 5 mảng" | CTA-1 | nhãn rời, không ghép |

Thiếu: một chỗ đặt **ba môn phương Đông cạnh nhau theo mảng đời** và nói rõ cùng / khác.

## 2. Ba phương án tiếp cận

| | A. Đồng thuận theo mảng đời (chọn) | B. Đồ thị "nét người" liên môn | C. Trục ngũ hành làm xương sống |
|---|---|---|---|
| Cách làm | Ma trận **mảng đời × môn**: mức mỗi ô lấy đúng từ chương đã chấm của báo cáo môn đó; luật tất định "N cách cùng thấy / nhìn khác nhau"; mượn nguyên hộp từng môn | Bảng ánh xạ KB: sao Mệnh (sáng/hãm), thập thần trội, 123 đặc điểm tướng, số chủ đạo → ~30 "nét người" (quyết đoán, giữ của, hay lo…); đếm nét được ≥ 2 môn độc lập chỉ ra | Lấy ngũ hành làm ngôn ngữ chung: hành Bát tự cần bù (hai cách), ngũ hình gương mặt, hành cục Mệnh Tử vi, hành của năm → bảng sinh / khắc + dòng thời gian "năm hành X tới" |
| Ưu | Đúng kiến trúc 5 tầng (chỉ RULES đọc RULES, một bộ tính); không điểm số; mọi hộp có mã kiểm chứng sẵn → phiếu về đúng môn; KB mới nhỏ (~40 câu); người đọc hiểu ngay "ba cách cùng thấy tiền bạc cần lưu ý" | Chân dung ở cấp **tính cách**, giàu nhất; cùng tinh thần `tong_hop.so_noi_bat` của thần số | Có cơ sở cổ điển một phần (NT-1 đã làm tướng × dụng thần); KB chỉ 5 × 5 quan hệ |
| Nhược | Độ phân giải 3 mức; "con người" không có mức nên chỉ xếp cạnh nhau | Cần KB ánh xạ ~300 mục do ban biên tập viết — nhãn "nét" là diễn giải, dễ **tạo độ chính xác giả** (sao Mệnh → "quyết đoán" không có nguồn tất định); duyệt lâu; mã kiểm chứng mới toàn bộ | Chỉ phủ mặt "năng lượng", không phủ mảng đời; cục Mệnh Tử vi × dáng mặt **không có trong cổ thư** → tự bịa luật; thần số không có hành |
| Kết | **Làm** (cả bài), lấy phần đã có của C làm chương "Hành lá số cần và dáng mặt" | Để sau khi có ≥ 30 phiếu/hộp ở A (biết nét nào người dùng xác nhận) | Chỉ phần đã có nguồn (chương 7 NT-1), không mở rộng sang cục Tử vi |

Thần số **chưa** vào chân dung: dùng dương lịch, không chấm mức theo mảng đời; ghép sau khi Bản đồ con số có mức theo mảng (hiện chỉ có chương, không có mức).

## 3. Kiến trúc (giữ 5 tầng)

```
la_so (giờ + giới tính + nơi sinh)  ──► tuvi_doi_song.lap  ─┐
                                    ──► battu_doi_song.lap ─┤  chỉ ĐỌC mức chương + mượn hộp (giữ ma_mau gốc)
tra_loi khảo sát NT (tuỳ chọn)      ──► nhan_tuong.bao_cao ─┘
                                            ▼
          RULES luangiai/chan_dung_tong_hop.py  (ma trận 6 mảng × 3 môn · dong_thuan() · 8 chương khuôn doi_song_1)
                                            ▼
          POST /v1/chan-dung  →  web /api/chan-dung (luanGiaiCoSao, mô-đun chan_dung)  →  /chan-dung (MaTranBaCach + BaoCaoDoiSongView)
```

- `dong_thuan(mảng, {môn: mức})`: ≥ 2 môn có mức. Cùng mức → hộp mang mức, mã `ds.chan_dung.<mảng>.cung.<mức>.<số môn>`; khác → hộp `loi_khuyen` không mức, nêu mặt từng môn nhìn (KB `mon.*.mat`) + "hai trong ba cách thấy…" khi có đa số, việc nên làm theo mức dè dặt nhất, mã `ds.chan_dung.<mảng>.khac.<tbc theo thứ tự tuvi·battu·nhantuong, x = thiếu>`.
- Hộp mượn: ≤ 1–2 hộp / môn / mảng, mỗi mã chỉ dùng một lần trong bài, `nhan = "Theo Tử vi"`…, `phai` của môn → phiếu "Đúng với mình" ghi về môn gốc (0017, không migration).
- Tám chương: Ba cách nhìn một con người (ma trận + mảng cùng thấy — **miễn phí**) · Con người bạn (hộp nổi nhất từng cách) · Công việc & tiền · Tình cảm & gia đình · Sức khoẻ (SK-1, miễn trừ) · Hành lá số cần và dáng mặt (mượn chương 7 NT-1) · Năm nay (`nhat_quan.nam` + hộp năm từng cách) · Việc nên làm (từ hộp tổng hợp, mảng cùng nhắc chậm trước).
- Thiếu Nhân tướng → hai môn, cột trống + mời khảo sát; thiếu giờ sinh → trang mời lập lá số (không gọi engine).
- Không điểm số, không đổi mức môn nào, không phán môn nào đúng (test cấm cụm), KB `chan_dung_kb.json` nháp ban biên tập. Không migration, không dependency, không đổi phép tính → không tăng `ENGINE_VERSION`. **Deploy engine trước web.**

## 4. Kiểm

Engine `tests/test_chan_dung_tong_hop.py` 20 ca (luật đồng thuận thuần + tất định, khuôn, mức đọc đúng từ báo cáo môn, mã không lặp + giữ mã gốc, chương 1 tự đứng, hai môn khi thiếu tướng, cấm điểm số/từ doạ, HỌC hạ hộp, API 200/422); golden mã kiểm chứng +85 mã `chan_dung` (mã cũ giữ). Web: typecheck; e2e `chan-dung.spec.ts` (mời lập lá số → hai cách → ba cách, ma trận 6 dòng × 3 chip, hub/sitemap/llms); QC ảnh 1280/390.

## 5. Bước sau (chưa làm)

- Phương án B khi đủ phiếu; thần số vào ma trận khi Bản đồ con số có mức theo mảng.
- Menu Huyền học đang đủ 12 mục con — `/chan-dung` vào từ hub, /ban-than, sổ trang; thêm vào menu khi bỏ một mục khác (chủ dự án quyết).
