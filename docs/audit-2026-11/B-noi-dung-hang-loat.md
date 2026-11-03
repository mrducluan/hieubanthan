# B — Rà nội dung hàng loạt (scaled content abuse) · hieuban.com · 2026-11-03

Đo trên site thật, không đoán. Chỉ đọc repo, không sửa.

## 0. Cách đo (tái lập được)

| Bước | Tệp |
|---|---|
| Chọn mẫu + tải HTML (≤ 4 song song, ~360 lượt) | `/tmp/claude-0/-home-user-hieubanthan/24ede8e4-e763-53a1-a994-5f35fdd29dd3/scratchpad/audit/B/lay_mau.py` → `mau.json`, `html/` |
| Đo từng cụm (từ, cụm 5 từ chung/riêng, câu mẫu, Jaccard, sáo AI) | `/tmp/claude-0/-home-user-hieubanthan/24ede8e4-e763-53a1-a994-5f35fdd29dd3/scratchpad/audit/B/phan_tich.py` → `ket_qua.json` |
| Tải thêm: đủ 46 trang hướng hợp tuổi, cặp cùng tuổi 2026↔2027, cùng con giáp | `/tmp/claude-0/-home-user-hieubanthan/24ede8e4-e763-53a1-a994-5f35fdd29dd3/scratchpad/audit/B/lay_them.py`, `phan_tich2.py` |
| Phần riêng theo ĐỦ cụm bằng chính `do_rieng.py` của engine | `/tmp/claude-0/-home-user-hieubanthan/24ede8e4-e763-53a1-a994-5f35fdd29dd3/scratchpad/audit/B/do_rieng_engine.py` (chạy trong `engine/`, venv `/tmp/claude-0/-home-user-hieubanthan/24ede8e4-e763-53a1-a994-5f35fdd29dd3/scratchpad/audit/venv`) |

- Chữ đo = chữ trong `<main>`, đã bỏ `nav`, `aside`, `footer`, `form`, `button`, `svg`, `script`.
- "Chung" = tỉ lệ cụm 5 từ của trang có ở ít nhất một trang khác trong mẫu cùng cụm. "Riêng" = 1 − chung.
- "Câu mẫu" = câu ≥ 6 từ (đã thay số bằng #) lặp ở ≥ 50 % trang trong mẫu.
- "Gần trùng" = cặp trang có Jaccard cụm 5 từ > 0,6.
- **Lưu ý thiên lệch:** đo trên mẫu thì "riêng" bị thổi lên (ít trang để trùng). Ví dụ: hướng hợp tuổi mẫu 12 trang = 21,3 %
  riêng, đủ 46 trang = 16,9 %. Sao ở cung mẫu = 61 %, engine đo đủ 168 trang = 39,4 %. Vì vậy với cụm lớn, tin số "đủ cụm".
- Sáo AI: danh sách `cum_cam` trong KB (`tuvi_doi_song_kb.json`, `kinhdich_doi_song.json`, `phongthuy_doi_song.json`)
  + sáo thường gặp ("hành trình", "không chỉ… mà còn", "bức tranh", "chìa khoá", "thực sự"…). Bỏ chữ trùng thuật ngữ
  (số "Sứ mệnh", "khắc", "hung", "tâm hồn") để không đếm nhầm.

## 1. Số đo theo cụm

| Cụm | URL | Mẫu | Từ TB (min) | Chung | Riêng (mẫu) | Riêng đủ cụm (engine) | Câu mẫu ≥50% | Cặp gần trùng | J max | Sáo AI /1000 từ |
|---|---|---|---|---|---|---|---|---|---|---|
| sao-o-cung | 168 | 16 | 888 (730) | 39 % | 61 % | **39,4 % (min 32,8 %)** | 6 | 0/120 | 0,30 | 0,00 |
| tu-hoa | 48 | 12 | 1341 (1296) | 47 % | 53 % | 53,8 % (min 50,2 %) | 9 | 0/66 | 0,29 | 0,00 |
| chinh-tinh | 14 | 8 | 702 | 35 % | 65 % | — (không đo) | 5 | 0/28 | 0,19 | 0,00 |
| cung | 12 | 8 | 681 | 19 % | 81 % | 95,6 % | 5 | 0/28 | 0,11 | 0,18 |
| que | 64 | 12 | 789 (665) | 16 % | 84 % | — (không đo) | 5 | 0/66 | 0,09 | 0,32 |
| menh-theo-nam | 78 | 12 | 980 (972) | 54 % | 46 % | **34,3 % (min 31,4 %; 36/78 dưới 35 %)** | 21 | 0/66 | 0,35 | 0,26 |
| so-kep | 43 | 12 | 1175 | 44 % | 57 % | 59,0 % | 22 | 0/66 | 0,29 | 0,21 |
| cap-so | 45 | 12 | 1125 | 36 % | 64 % | 69,3 % | 19 | 0/66 | 0,18 | 0,07 |
| y-nghia-so | 12 | 12 | 1093 | 26 % | 74 % | — (chuyên gia viết) | 21 | 0/66 | 0,17 | **1,37** |
| tinh-yeu | 12 | 12 | 1147 | 19 % | 81 % | 94,2 % | 13 | 0/66 | 0,10 | 0,22 |
| nghe-nghiep | 12 | 12 | 1030 | 22 % | 78 % | 91,9 % | 15 | 0/66 | 0,12 | **1,46** |
| nam-ca-nhan | 9 | 9 | 1061 | 30 % | 71 % | 83,0 % | 19 | 0/36 | 0,17 | 0,00 |
| no-nghiep | 4 | 4 | 1036 | 27 % | 73 % | 84,8 % | 28 | 0/6 | 0,15 | 0,00 |
| thap-than | 10 | 10 | 903 | 23 % | 77 % | 93,0 % | 7 | 0/45 | 0,12 | 0,22 |
| nhat-chu | 10 | 10 | 1312 | 32 % | 68 % | 76,8 % | 17 | 0/45 | 0,16 | 0,23 |
| dau-hieu | 23 | 23 | 1143 (944) | 31 % | 69 % | 78,5 % | 17 | 0/253 | 0,22 | 0,87 |
| **huong-hop-tuoi** | 46 | **46** | 1368 | **83 %** | **16,9 %** | — (không đo) | 37 | **146/1035** | **0,71** | 0,00 |
| **nam/*/tuoi-*** | 92 | 12 | 890 (800) | **78 %** | **21,6 %** | — (không đo) | 23 | 0/66 | 0,56 | **1,12** |
| **xem-tuoi-lam-nha/*/tuoi-*** | 92 | 12 | **438 (379)** | **84 %** | **16,3 %** | — (không đo) | 17 | 6/66 | **0,71** | 0,00 |
| **tuoi-xong-dat/*/tuoi-*** | 92 | 12 | **445 (416)** | **85 %** | **15,2 %** | — (không đo) | 10 | 2/66 | 0,61 | 0,00 |
| la-so-mau | 6 | 6 | 4132 | 73 % | 27 % | — (không đo) | **123** | 0/15 | 0,49 | 0,00 |
| xem-ngay-tot ngày | 406 | 14 | 1114 (1015) | 68 % | 32 % (đủ cụm sẽ thấp hơn) | — (không đo) | 28 | 0/91 | 0,38 | 0,00 |
| xem-ngay-tot tháng + việc-tháng | 187 | 10 | 518 (**340**) | 49 % | 52 % | — | 9 | 0/45 | 0,35 | 0,00 |
| huong-xau-nam | 4 | 4 | 443 | 51 % | 49 % | — | 15 | 0/6 | 0,34 | 0,00 |
| blog | 22 | 22 | 2843 (2047) | 18 % | 82 % | — | 9 | 0/231 | 0,09 | 0,51 |

Đo thêm (`phan_tich2.py`):

| Phép đo | Kết quả |
|---|---|
| Hướng hợp tuổi, đủ 46 trang | riêng TB 16,9 %, min 15,7 %; **14 % số cặp gần trùng**; cặp giống nhất 1962↔1998 (J 0,708), 1963↔1999, 1967↔2003, 1980↔1989 |
| Làm nhà, cùng con giáp (Sửu 1961/1973/1985/1997, năm 2026) | **6/6 cặp gần trùng**, J TB 0,65, riêng 17,5 % |
| Xông đất, cùng con giáp | 0/6 gần trùng nhưng J TB 0,52, riêng 24 % |
| Tử vi năm theo tuổi, cùng con giáp | J TB 0,46, riêng 31 %, 41 câu mẫu |
| Cùng tuổi, 2026 ↔ 2027 | làm nhà J 0,30–0,43 · xông đất J 0,47–0,57 · năm J ~0,31 |
| Ngày tốt cưới hỏi theo tháng (10 trang) | riêng 48 %, 0/45 gần trùng |
| Trang `noindex` trong ~356 trang đã tải | **0** |

Vì sao hướng hợp tuổi trùng: cung phi lặp mỗi 9 năm, con giáp lặp mỗi 12 năm. Năm cách nhau 9 năm có cùng cặp cung phi
nam–nữ; cách nhau 36 năm thì trùng cả con giáp. Thực chất chỉ có ~9 "bài" khác nhau trải ra 46 URL.

Vì sao làm nhà trùng: khối "Hướng nên giữ yên năm …" (bàn sao bay cả năm) và đoạn giải thích Kim lâu / Hoang ốc / Tam
tai giống hệt mọi tuổi trong cùng năm. Phần riêng chỉ là 1–2 câu kết luận + 3 năm thuận.

## 2. Giọng AI và chữ độn

- Tổng thể **thấp**: 0–0,9 lần / 1000 từ ở hầu hết cụm. Không thấy "hãy cùng", "đóng vai trò quan trọng", "năng lượng
  tích cực", "điều thú vị", "nhìn chung".
- Chỗ cao hơn đều là **một nhãn lặp trên mọi trang**, không phải văn AI rải rác:

| Cụm | Lượt | Nguồn |
|---|---|---|
| nghe-nghiep 1,46/1000 | "toả sáng" 12/12 trang | nhãn cố định "Vai trò dễ toả sáng" |
| y-nghia-so 1,37/1000 | "thực sự" 12/12, "kiến tạo" 4 | câu khung vị trí "điều bạn thực sự mong muốn"; KB số 22 "Kiến tạo lớn" |
| nam/*/tuoi-* 1,12/1000 | "điều quan trọng là" 12/12 | câu khung "với riêng bạn, điều quan trọng là Lộc, Kỵ rơi vào cung nào" — cụm này nằm trong `cum_cam` |
| dau-hieu 0,87/1000 | "bạn sẽ" 23/23 | câu mời "bài đọc nhà của bạn sẽ xếp việc…" — "bạn sẽ" nằm trong `cum_cam` |
| blog 0,51/1000 | "thực sự" 14, "định mệnh" 5, "không chỉ là" 4, "bức tranh" 2 | bài NotFair; đây là cụm có giọng AI rõ nhất |

- Kết luận: giọng AI **không** phải rủi ro chính. Rủi ro chính là **khuôn trang lặp** (phần 1).

## 3. Trạng thái duyệt và nguồn

| Chỉ số | Số đo |
|---|---|
| Tệp KB có `trang_thai` | 51 tệp, **51/51 = `nhap_ai`** (riêng `thanso_meanings.json` không có trường — nguồn chủ dự án tự viết) |
| Trang đã thẩm định trong `tham_dinh.json` → `trang` | **0** |
| Trang chuyên gia tự viết | 12 (y-nghia-so; byline "Tác giả") |
| Mọi trang còn lại | byline "Ban biên tập … · Chủ biên duyệt xuất bản" (`duyet_xuat_ban` 2026-10-09, quyết định chung) |
| `can_doi_chieu: true` (chưa đối chiếu nguyên văn) | `tuvi_kb.json`, `battu_kb.json` |

Mục KB **không có `source_id` riêng từng mục** (chỉ có `source` cấp tệp), trái CLAUDE.md "mọi mục bắt buộc có source_id + school_id":

| Tệp | Mục | Có source_id |
|---|---|---|
| tuvi_kb.json | cung / chinh_tinh / sao_cung / tu_hoa / tu_hoa_cung / phu_tinh | 0/12 · 0/14 · 0/14 (×12 cung) · 0/4 · 0/4 · 0/26 |
| battu_kb.json | nhat_chu / thap_than / ngu_hanh / nap_am | 0/10 · 0/10 · 0/5 · 0/30 |
| phongthuy_kb.json | du_nien / quai / quy_tac_thuc_hanh | 0/8 · 0/8 · 0/7 (bo_tri 42/42 có) |
| kinhdich_kb.json | que | 64/64 có |
| thanso_chaldean, thanso_cap_so, thanso_chan_dung, tuvi_doi_song_kb, bo_sung_* | mọi mục | chỉ `source_id` cấp tệp |

→ Các trang sao ở cung (168), Hoá ở cung (48), thập thần, nhật chủ, mệnh theo năm (nạp âm) đang nêu dữ kiện từ mục
không gắn nguồn riêng; dòng "Nguồn" cuối trang là nguồn chung của cả tệp.

**Lỗ hổng lưới an toàn:** `do_rieng.py` (tự `noindex` khi riêng < 30 %) chỉ đo 13 họ trang KB. **Không đo**: hướng hợp tuổi,
năm theo tuổi, làm nhà, xông đất, lá số mẫu, ngày tốt (ngày + tháng), quẻ, chính tinh — tức ~**900 URL** đang index mà
không có ngưỡng nào. Đúng các cụm này lại có số riêng thấp nhất (15–22 %). Ngoài ra `do_rieng` chỉ đếm chữ engine trả
(tiêu đề, trả lời nhanh, mục, hỏi đáp); chữ trang thật còn có khung tác giả, khối CMS → riêng thật thấp hơn số engine.

## 4. Kết luận theo cụm

| Cụm | Mức | Bằng chứng | Cách sửa |
|---|---|---|---|
| **tuoi-xong-dat/*/tuoi-*** (92) | **HIGH-RISK** | 445 từ, riêng 15 %, chung 85 %, cùng tuổi hai năm J ~0,5 | Đưa khối chung (hạn năm, cách tính, giờ hoàng đạo) lên trang năm `/tuoi-xong-dat/{năm}`, trang tuổi chỉ giữ danh sách tuổi hợp + lý do riêng; thêm dữ kiện riêng tuổi (tuổi mụ, xung/hợp với gia chủ, Tam tai của chính tuổi). Hoặc chỉ index năm âm sắp tới (2027), `noindex` năm đã qua Tết |
| **xem-tuoi-lam-nha/*/tuoi-*** (92) | **HIGH-RISK** | 438 từ (min 379), riêng 16 %, cùng con giáp 6/6 cặp gần trùng | Bỏ bàn "Hướng nên giữ yên năm" khỏi trang tuổi (link về trang năm); gộp giải thích Kim lâu/Hoang ốc/Tam tai thành 1 câu + link; thêm phần riêng: 10 năm tới tuổi này từng năm phạm/không, năm mượn tuổi, tuổi cô dâu. Đặt `do_rieng` cho cụm này |
| **phong-thuy/huong-hop-tuoi** (46) | **HIGH-RISK** | đủ cụm: riêng 16,9 %, 146/1035 cặp gần trùng, J max 0,71 | Cấu trúc thật chỉ ~9 bài. Hai hướng: (a) gộp theo cặp cung phi (9 trang, mỗi trang liệt kê các năm), giữ trang năm làm trang ngắn trỏ về; (b) giữ 46 trang nhưng dời giải thích quái/du niên sang trang quái, thêm phần riêng theo năm (nạp âm, con giáp, hạn năm nay, tuổi làm nhà). (a) an toàn hơn |
| **nam/*/tuoi-*** (92) | **HIGH-RISK** | riêng 21,6 % (mẫu; đủ cụm thấp hơn), 23 câu mẫu, chính trang ghi "mọi người cùng năm sinh đều giống nhau"; câu `cum_cam` "điều quan trọng là" trên 12/12 trang | Trang mới (NAM-3, 2026-11-01), chưa có lượt hiển thị: chỉ index năm âm sắp tới; dời bốn sao hoá chung + Cửu Diệu giải thích lên `/nam/{năm}`; bỏ cụm cấm |
| xem-ngay-tot ngày (406) | AT-RISK | 1114 từ, chung 68 %, 28 câu mẫu; số lượng lớn nhất site | Rút cửa sổ index (−7…+400 → −7…+120 ngày); khối chung (Bành Tổ, cảnh báo "không phải tiên đoán", giải thích giờ) làm gọn 1 câu + link; trang ngày chỉ giữ dữ kiện ngày |
| xem-ngay-tot tháng + việc-tháng (187) | AT-RISK | 518 từ, min 340, riêng 52 %; tới tháng 11/2028 | Cắt sitemap việc-tháng còn +6 tháng; trang việc-tháng không có ngày hợp → `noindex` |
| menh-theo-nam (78) | AT-RISK | engine đủ cụm 34,3 %, min 31,4 %, 36/78 trang chỉ trên ngưỡng 30 % chưa tới 5 điểm; 21 câu mẫu | Viết `bo_sung_menh_nam.json` (hiện không có) theo chuẩn SEO-M: mỗi năm một bảng riêng (tháng sinh → trụ tháng, năm tuổi), "Sách xưa nói gì" theo nạp âm |
| sao-o-cung (168) | AT-RISK | engine đủ cụm 39,4 %, min 32,8 %; cụm lớn nhất KB; 0 trang thẩm định; mục KB không source_id | Thẩm định theo số GSC (hàng đợi đã có); thêm `bo_sung_sao_cung` cho 30 trang có hiển thị; gắn `source_id` từng mục `sao_cung` |
| la-so-mau (6) | AT-RISK (ít trang) | 4132 từ, riêng 27 %, **123 câu mẫu** ("Bước này là gì?" lặp mọi trang) | Dời giải thích từng bước sang một trang hướng dẫn; trang mẫu chỉ giữ lời đọc của chính lá số |
| blog (22) | AT-RISK (giọng) | riêng 82 %, nhưng giọng AI cao nhất (0,51/1000; "thực sự", "định mệnh", "không chỉ là"), bài đối tác | Chủ biên đọc + sửa giọng trước khi xuất bản lại bản CMS |
| huong-xau-nam (4) | SAFE | 443 từ, riêng 49 %, chỉ 4 trang | Giữ |
| tu-hoa (48) | SAFE (sát) | đủ cụm 53,8 %, 1341 từ | Gắn `source_id` từng mục `tu_hoa_cung` |
| so-kep (43), cap-so (45) | SAFE | đủ cụm 59 % / 69 % | Giữ; thẩm định dần |
| que (64), cung, chinh-tinh, thap-than, nhat-chu, tinh-yeu, nghe-nghiep, nam-ca-nhan, no-nghiep, dau-hieu | SAFE | riêng 65–96 %, 0 cặp gần trùng | Sửa nhãn "toả sáng" (nghe), câu "bạn sẽ" (dau-hieu); gắn `source_id` cho thap_than, nhat_chu, nap_am |
| y-nghia-so (12) | SAFE | chuyên gia viết, riêng 74 % | Sửa câu khung "thực sự mong muốn" |

Tóm lại: **322 URL HIGH-RISK** (46 + 92 + 92 + 92), tất cả là trang "theo tuổi" sinh từ một khuôn, không có ngưỡng
`do_rieng`, đang index. Thêm ~600 URL ngày/tháng AT-RISK do số lượng.

## 5. 15 URL tệ nhất

| # | URL | Từ | Riêng | Lý do |
|---|---|---|---|---|
| 1 | /tuoi-xong-dat/2027/tuoi-2005 | 439 | 10,3 % | thấp nhất mẫu; gần như toàn chữ chung của năm |
| 2 | /tuoi-xong-dat/2026/tuoi-1993 | 464 | 12,6 % | như trên; năm 2026 đã qua Tết sắp tới vẫn index |
| 3 | /tuoi-xong-dat/2026/tuoi-2001 | 466 | 12,7 % | như trên |
| 4 | /xem-tuoi-lam-nha/2027/tuoi-1988 | 382 | 13,1 % | mỏng + khung chung |
| 5 | /tuoi-xong-dat/2027/tuoi-1988 | 457 | 13,4 % | như #1 |
| 6 | /tuoi-xong-dat/2026/tuoi-1985 | 460 | 13,6 % | như #1 |
| 7 | /xem-tuoi-lam-nha/2027/tuoi-2005 | 456 | 13,9 % | như #4 |
| 8 | /xem-tuoi-lam-nha/2026/tuoi-1993 | 379 | 14,6 % | trang mỏng nhất mẫu |
| 9 | /nam/2027/tuoi-1988 | 807 | 14,5 % | khuôn năm; câu `cum_cam` |
| 10 | /nam/2026/tuoi-1977 | 915 | 14,5 % | như #9 |
| 11 | /xem-tuoi-lam-nha/2026/tuoi-1973 | ~485 | ~16 % | gần trùng (J 0,65–0,70) với 1961, 1985, 1997 |
| 12 | /phong-thuy/huong-hop-tuoi/tuoi-1998 | 1380 | 15,7 % | gần trùng 1962 (J 0,708) |
| 13 | /phong-thuy/huong-hop-tuoi/tuoi-1999 | ~1380 | ~16 % | gần trùng 1963 (J 0,707) |
| 14 | /tu-vi/la-so-mau/nhat-le-trung-thien | 4033 | 21,7 % | 123 câu mẫu lặp ở mọi lá số mẫu |
| 15 | /xem-ngay-tot/mua-xe-thang-11-2028 | 340 | 35,2 % | mỏng nhất cụm tháng, xa 2 năm, ít người tìm |

Gần ngưỡng tự `noindex` (engine): /bat-tu/menh-theo-nam/sinh-nam-1961-menh-gi và sinh-nam-2012 (31,4 %),
/tu-vi/sao-o-cung/liem-trinh-cung-phu-mau (32,8 %).

## 6. Việc nên làm, theo thứ tự

1. Mở rộng `do_rieng` (hoặc một bộ đo tương tự ở web) cho 4 cụm theo tuổi + lá số mẫu + ngày/tháng; đo trên **chữ trang thật**.
2. Trang theo tuổi: dời khối chung lên trang năm, chỉ index năm âm sắp tới (2027), `noindex` năm đã qua.
3. Hướng hợp tuổi: gộp theo cặp cung phi (9 trang) hoặc làm giàu phần riêng theo năm.
4. Rút cửa sổ index trang ngày và việc-tháng.
5. Viết `bo_sung_menh_nam.json`; thêm `bo_sung` cho sao ở cung có hiển thị.
6. Bắt đầu thẩm định thật (hiện 0 trang) theo hàng đợi GSC; gắn `source_id` từng mục cho `tuvi_kb`, `battu_kb`.
7. Sửa 3 câu khung dính `cum_cam` / sáo ("điều quan trọng là", "bạn sẽ", "toả sáng").
