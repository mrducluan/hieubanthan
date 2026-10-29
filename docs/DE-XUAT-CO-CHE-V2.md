# Nâng cấp 4 cơ chế "thay gacha / cược chuỗi / token" — 3 phương án, chấm điểm, chọn (2026-10-29)

> Chủ dự án giao: "gacha, cược chuỗi, token em đã làm bản hợp pháp rồi (lá bài đầu ngày · ngày nghỉ chuỗi · hẹn với chính
> mình · huy hiệu · hạng hội viên), giờ làm hoàn hảo hơn — mục tiêu **tương tác, viral, nạp Sao**". Khâu vòng tăng trưởng:
> QUAY LẠI (chính) + MỜI + NẠP. Ranh giới giữ nguyên (`docs/CO-CHE-RUI-RO-VA-THAY-THE.md`): không trả giá trị lấy kết quả
> may rủi, không cược, không phạt khi mất chuỗi, huy hiệu không mua bán, Sao không đổi ra tiền, không doạ / không đếm ngược.

## 0. Hai đầu vào trước khi đề xuất

**Rà code (agent đọc, có file:dòng)** — 10 chỗ "cụt" của vòng hiện tại, xếp theo tác động:
1. Chuỗi chạm mốc → chỉ một dòng chữ, không link / nút / chia sẻ; công tắc `sao.chuoi.bat` tắt (mặc định) thì không có mục tiêu nào hiện (`web/lib/chuoi-ngay.ts:262-265`).
2. Lá bài lật xong là ngõ cụt: 2 nút chia sẻ / chép, không lối sang mảng khác, không nối chuỗi / huy hiệu, **không lịch sử** — máy chỉ nhớ lá hôm nay (`web/lib/la-bai.ts:67`).
3. Hẹn, huy hiệu máy, lá bài đều chỉ localStorage → đổi máy mất sạch; chuỗi máy không chuyển sang tài khoản.
4. Huy hiệu tĩnh 11 mã, không bậc, không huy hiệu cho lá bài / đọc báo cáo; `badge_earned` chỉ phát cho `hen_7/hen_30`.
5. Hạng hội viên không hiện ở Bản thân / thẻ danh tính / ảnh chia sẻ; Sao tháng chỉ cấp khi mở `/tai-khoan`.
6. **Không có tổng kết tuần / tháng nào** cho người dùng (grep "tổng kết|recap" = 0).
7. Chuỗi không có lịch; DB chỉ giữ `ngay_cuoi / chuoi / dai_nhat / nghi_cuoi` nên không dựng lịch được.
8. Hẹn 7/30 cấp huy hiệu một lần đời; vòng 30 thứ hai không có gì mới.
9. Không đo: huỷ / lỡ hẹn, mất chuỗi, "Sao chép câu", bấm tóm tắt huy hiệu; `share_clicked` của lá bài gộp vào `hn`.
10. Mọi công tắc Sao mặc định tắt → móc Sao của chuỗi / nhiệm vụ / hội viên đang là lời hứa chưa chạy.

Kho nội dung lá bài: 3 loại × (99 "việc nhỏ" + 36 câu hỏi + 12 giờ), xoay theo **số ngày cá nhân 1–9** (chu kỳ 9 ngày).

**Nghiên cứu (agent tìm, có nguồn; chi tiết trong phiên)** — số đáng tin nhất:
- Thẻ tổng kết kiểu Wrapped: Spotify Wrapped 2025 **>300 triệu người xem, >630 triệu lượt chia sẻ** (newsroom Q4/2025); Wordle **1,2 triệu** lưới chia sẻ trong 13 ngày đầu 2022. Đặc điểm làm chia sẻ được: không lộ đáp án / dữ liệu riêng, nói về **danh tính**, so với bạn bè **không xếp hạng**. Bằng chứng **cao**, pháp lý VN **thấp**.
- Streak: Duolingo CURR **84 %** (Q2/2026), **1/3 DAU có Friend Streak** (Q4/2024), Streak Revival một lần: 15,4 triệu người khôi phục. Không có mức tăng giữ chân công bố riêng cho Friend Streak. "Cược chuỗi" +14 % D7 là A/B chính thức nhưng là cá cược → loại. Bán "sửa chuỗi": EU Digital Fairness Act (dự kiến 2026) nêu đích danh streak phạt người nghỉ; 42 % thiếu niên muốn bỏ Snapstreak → **không làm**.
- Sưu tập theo bộ: Finch D1/D7 ≈ 54 % / 37 % (thứ cấp); Pokémon TCG Pocket: **đỉnh quay lại theo bộ mới, nền giảm** → sưu tập hợp cho "nhịp tháng", không hợp làm trụ duy nhất. Meta-phân tích: thưởng "theo hoàn thành" làm giảm động lực nội tại → phần thưởng phải nhỏ, nội dung là chính.
- Pháp lý VN 2025–2026: khuyến mại may rủi phải **đăng ký Bộ Công Thương** khi qua internet (NĐ 128/2024); NĐ 147/2024 Đ.57: vật phẩm ảo / điểm thưởng **không quy đổi, cấm mua bán** — Sao + huy hiệu hiện tại đã đúng tinh thần này; BVDLCN 91/2025: lời mời **không được chứa dữ liệu người thứ ba** (link / mã thì thấp); Luật Quảng cáo 75/2025: so sánh cần tài liệu chứng minh.

## 1. Ba phương án

### A. "Tháng của tôi" — bộ sưu tập 9 nhịp + tổng kết tháng chia sẻ được (Wrapped theo tháng)

Ý: nối 4 cơ chế rời rạc thành **một nhịp tháng** trùng với "tháng cá nhân" của thần số (nội dung có sẵn).
- **Album 9 nhịp**: mỗi lá bài đầu ngày thuộc một ô = số ngày cá nhân 1–9. Lật lá = thu lá vào album tháng này (máy + tài
  khoản). Đủ 9 ô trong một tháng → huy hiệu **"Đủ 9 nhịp"** (bậc: 1 tháng · 3 tháng · 12 tháng — thay "huy hiệu không bậc").
  Chu kỳ 9 ngày nên ~9 ngày ghé liền là đủ; không mua, không random (lá tất định theo ngày).
- **Nhật ký ngày ghé**: ghi ngày + số ngày cá nhân + lá đã lật (máy; tài khoản qua migration 0032 bảng nhỏ RLS). Từ đó có
  **lịch tháng** (chấm ngày ghé — lấp lỗ 7), hẹn / huy hiệu máy không còn mất khi đổi máy (lấp lỗ 3).
- **Tổng kết tháng** (hiện 7 ngày đầu tháng ở Hôm nay, luôn có ở Bản thân): ngày ghé, chuỗi dài nhất, lá đã thu x/9, số
  ngày cá nhân hay gặp, huy hiệu mới, hạng hội viên; **+ "Tháng này của bạn"**: tháng cá nhân mới (engine `/v1/thanso/nhip`
  đã có) với một câu miễn phí → nút **"Đọc kỹ 12 tháng tới"** (chương Sao có sẵn của Bản đồ con số, đi đúng luồng SAO-2;
  hội viên mở sẵn). Đây là móc NẠP tự nhiên: người vừa xem "tháng vừa rồi của mình" là người muốn biết "tháng tới".
- **Thẻ chia sẻ "Tháng N của tôi"** (OG + QR, mã HMAC `thang|`: tên hiển thị, tháng, ngày ghé, chuỗi dài nhất, lá x/9,
  số hay gặp — **không ngày sinh**), trang nhận `/the/thang/[mã]` noindex + "Xem tháng này của bạn" + `QuaNguoiNhan`.
- Vá lỗ nhỏ cùng lúc: chuỗi chạm mốc có nút chia sẻ; lá bài lật xong hiện "album x/9 · xem"; hạng hội viên hiện ở Bản
  thân + thẻ tháng; `badge_earned` phát cho mọi huy hiệu khi vừa đạt.
- Đo: `recap_viewed{thang, so_ngay}`, `album_viewed{du}`, `share_created{kind: thang}` → `share_clicked{tk}` →
  `referral_signup`, `sao_cta_clicked{tu: tong_ket}`, `badge_earned{ma: du_9_nhip*}`. Chạy được **cả khi tài khoản chưa
  bật** (máy), tài khoản bật thì đồng bộ.

### B. "Đôi bạn" — streak hai người + thẻ "Hôm nay hai người"

Ý: bản Friend Streak của Duolingo. Hai người nối với nhau qua link mời (cả hai có tài khoản, cùng đồng ý); mỗi ngày
thẻ "Hôm nay hai người": ngày cá nhân của cả hai + nhịp quan hệ (KB `thanso_quan_he` có sẵn); đếm **ngày cả hai cùng
ghé** (chỉ đếm, không mất gì), hẹn chung 7 ngày → huy hiệu "Đôi bạn"; thẻ chia sẻ đôi; móc Sao: "Hợp đôi chi tiết" /
"Tặng một chương". Đo: tỉ lệ cặp nối thành công, ngày cả hai ghé, `referral_signup`.
- Cần: migration bảng cặp (hai chiều, huỷ được), luồng đồng ý, API, 3–4 màn mới; **chỉ chạy khi tài khoản đã bật** và
  cả hai người đều có tài khoản.
- Rủi ro: "chuỗi chung tạo áp lực" (đã bị loại ở V1 §8.4 với "Thử thách 7 ngày với bạn"); phải viết rất kỹ để không
  thành phạt; dữ liệu người kia hiện cho mình (ngày cá nhân) = cần đồng ý rõ (BVDLCN).

### C. "Hành trình 9 bậc" — tiến trình có bậc + hạng hiện ở mọi nơi

Ý: bản "token" là **địa vị**, không phải giá trị. Mỗi người có bậc 1–9 (theo thần số) tính từ hoạt động có sẵn (ngày ghé,
đọc hết bài, hỏi, mời, huy hiệu); huy hiệu thêm bậc (chuỗi 7/30/100/365, mời 1/5/20, hỏi 3/30/100); lên bậc → thẻ chia
sẻ + mở khung thẻ (chỉ hình thức); hạng hội viên + bậc hiện ở thẻ danh tính và ảnh hồ sơ; +Sao nhỏ một lần mỗi bậc.
- Cần: hàm SQL tính bậc, 2–3 màn, OG; không bảng mới.
- Rủi ro: giọng "game hoá" lệch tinh thần tự soi của trang; meta-phân tích: thưởng theo hoàn thành làm giảm động lực nội
  tại; bậc tính từ "mời bạn" dễ bị đọc là điểm thưởng; **không có số liệu** nào cho thấy hệ bậc tự nó kéo viral / nạp.

## 2. Chấm điểm (0–5, có lý do)

| Tiêu chí | A. Tháng của tôi | B. Đôi bạn | C. Hành trình 9 bậc |
|---|---|---|---|
| Quay lại hằng ngày (bằng chứng) | **4** — album 9 ngày + lịch + nhịp tháng; sưu tập bằng chứng vừa, nhưng gắn nội dung thật (tháng cá nhân) | **4** — Friend Streak 1/3 DAU Duolingo, nhưng không có lift công bố | **3** — không số liệu; tiến trình chỉ là động lực ngoại sinh |
| Viral (MỜI) | **5** — thẻ tổng kết là mẫu viral mạnh nhất có số (Wrapped 630 M, Wordle 1,2 M); nói về danh tính, không lộ dữ liệu | **4** — bản chất cần mời; nhưng rớt ở "cả hai phải có tài khoản" | **2** — thẻ "lên bậc" ít ai chia sẻ |
| Nạp Sao (NẠP) | **4** — "tháng vừa rồi → đọc kỹ 12 tháng tới" là móc trực tiếp vào chương Sao có sẵn | **3** — hợp đôi chi tiết / tặng chương, gián tiếp | **2** — chỉ +Sao nhỏ, không kéo mua |
| Pháp lý + giọng trang | **5** — không may rủi, không quy đổi, không so sánh; ảnh chỉ số đếm | **4** — cần đồng ý hai chiều; nguy cơ áp lực xã hội (đã loại một lần) | **4** — hợp luật; lệch giọng tự soi |
| Công sức / rủi ro kỹ thuật | **3** — 1 migration nhỏ + OG + trang nhận + album + recap (~2 ngày) | **1** — migration cặp + đồng ý + nhiều màn (~5 ngày) | **3** — hàm SQL + OG (~2 ngày) |
| Chạy được khi tài khoản chưa bật (hiện trạng production) | **5** — máy trước, tài khoản sau | **0** — bằng 0 tới khi bật tài khoản | **3** — bậc máy được một phần |
| Đo được rõ | **5** | **4** | **4** |
| **Tổng** | **31** | **20** | **21** |

## 3. Chọn: **A — "Tháng của tôi"**, kèm một mảnh của C

Lý do: A là phương án duy nhất vừa có bằng chứng viral mạnh (artefact tổng kết), vừa có móc Sao tự nhiên (tháng tới),
vừa chạy ngay trên production hiện tại (chưa bật tài khoản), vừa vá đúng 7/10 lỗ hổng rà được (1 · 2 · 3 · 4 · 5 · 6 · 7).
B có tiềm năng nhưng phụ thuộc bật tài khoản và chạm đúng rủi ro "áp lực chuỗi" đã loại; để lại hàng đợi khi tài khoản
bật và có số D7. C mượn **một mảnh**: huy hiệu "Đủ 9 nhịp" có bậc 1 / 3 / 12 tháng (không XP, không bậc người).

**Không làm trong A**: bán "sửa chuỗi"; tổng kết chỉ cho hội viên (Strava bị phản ứng — bản cơ bản luôn miễn phí); so
"ngày ghé" của mình với người khác; đếm ngược "còn N ngày hết tháng"; thưởng Sao cho album (chỉ huy hiệu; Sao chuỗi giữ
như 0030).

## 4. Phạm vi làm (A)

| # | Việc | Nơi | Ghi chú |
|---|---|---|---|
| 1 | Nhật ký ngày ghé trên máy `hbt.nhat_ky.v1` (ngày, số ngày cá nhân, lá đã lật; ≤ 400 ngày) | `web/lib/nhat-ky-ngay.ts` | hàm thuần, e2e |
| 2 | Migration **0032** `nhat_ky_ghe` (user_id, ngay, so, la) RLS chủ sở hữu, RPC `ghi_nhat_ky_ghe` / `nhat_ky_ghe_cua_toi`, tự dọn > 400 ngày; `huy_hieu_cua_toi()` thêm `du_9_nhip*` | `supabase/migrations/0032_*` + `.down.sql` + `kiem_thu/thu_nhat_ky_ghe_0032.sql` | chờ chủ dự án chạy; web chạy được khi chưa có |
| 3 | Album 9 nhịp (`AlbumNhip`) ở Hôm nay (dưới lá bài) + Bản thân; lá bài lật xong hiện "x/9 · xem album" | `components/khung/AlbumNhip.tsx`, `LaBaiDauNgay.tsx` | lấp lỗ 2, 4 |
| 4 | Lịch tháng chấm ngày ghé trong khối chuỗi + nút chia sẻ khi chạm mốc | `ChuoiNgay.tsx` | lấp lỗ 1, 7 |
| 5 | Tổng kết tháng `TongKetThang` (Hôm nay ngày 1–7, Bản thân luôn) + "Tháng này của bạn" từ `/api/thanso/nhip` + CTA Sao qua `lib/cta-sao.ts` | `components/khung/TongKetThang.tsx`, `lib/tong-ket-thang.ts` | lấp lỗ 6; móc NẠP |
| 6 | Thẻ "Tháng N của tôi": `kyMaThang` (`thang\|`), `/og/thang`, `/the/thang/[ma]` (noindex, `QuaNguoiNhan`), `?tu=tk.` | `lib/ma-moi.ts`, `app/og/thang`, `app/the/thang` | lấp lỗ MỜI |
| 7 | Hạng hội viên ở thẻ danh tính Bản thân + thẻ tháng; `badge_earned` cho mọi huy hiệu vừa đạt | `BanThan.tsx`, `HuyHieu.tsx` | lấp lỗ 5, 9 |
| 8 | Sự kiện mới trong allowlist: `recap_viewed`, `album_viewed`; `share_created{kind: thang}`; khung đếm ở `/quan-tri/tang-truong` | `lib/do-luong.ts`, `pheu-the.ts` | |
| 9 | E2E: hàm thuần, album, recap (nhật ký giả), OG 200 PNG, trang nhận, không lộ ngày sinh, cụm cấm; chuỗi thật: nhật ký tài khoản + huy hiệu 9 nhịp | `e2e/thang-cua-toi.spec.ts`, `e2e-that/…` | |

## 5. Phản biện độc lập (agent thứ ba, chỉ đọc) và quyết định cuối

**Điểm bị bắn — em nhận:**
- Chấm quá tay: viral 5 → 3 (thẻ tháng ít "danh tính" hơn Wrapped; thẻ ngày đã mang tháng cá nhân), nạp 4 → 3 (không có "mở
  riêng chương 12 tháng tới" — chương thuộc gói Bản đồ con số, `cta-sao` chỉ sống khi báo cáo đang mount; `thu_sao` đang tắt),
  công sức 3 → 2, đo 5 → 4. Tổng sửa: **A ≈ 23 · C ≈ 21 · B ≈ 19** — A vẫn đứng đầu nhưng phần kéo điểm là phần yếu nhất.
- **Album 9 ô là "chuỗi đổi vỏ"**: số ngày cá nhân chạy 1→9 liên tiếp nên "đủ 9 ô" ≡ ~9 lượt ghé; lưới 7/9 cuối tháng
  thành cảm giác thất bại; không thêm nội dung (lá cũ không xem lại được). → **Bỏ lưới**, giữ MỘT huy hiệu "Đủ 9 nhịp một
  tháng" chỉ hiện khi đạt, một bậc (bỏ bậc 3 / 12 tháng).
- **"Số ngày cá nhân hay gặp" là bịa dữ kiện** (tháng 31 ngày số nào cũng 3–4 lần) → bỏ.
- **Hạng hội viên trên thẻ công khai** = tiết lộ tình trạng mua hàng; danh sách huy hiệu có `moi_5`, `da_luu_ho_so` vô nghĩa
  với người khác → thẻ **không mang** huy hiệu / hạng / chuỗi dài nhất; hạng chỉ hiện ở Bản thân (riêng tư).
- Tháng cá nhân + tháng xem lộ (ngày + tháng sinh) mod 9 — cùng lớp 1/9 thẻ ngày đã chấp nhận; ghi vào `THE-CHIA-SE.md`,
  không thêm trường nào cùng hàm ngày sinh.
- Kỹ thuật: nhật ký máy khoá theo băm hồ sơ (`xoaHoSo` vốn để sót chuỗi / hẹn / lá → nay xoá theo); **không đổ nhật ký máy
  lên máy chủ**; máy chủ ghi trong `diem_danh()` (không RPC mới), `so` nhận từ client (engine trả) — SQL chỉ đếm; tổng kết
  hiện tới khi bấm đóng, ngưỡng ≥ 3 ngày; "tháng này" đã có trong payload `/hom-nay` → không gọi `/api/thanso/nhip`; sự kiện
  dùng `so_thang` / `so_ngay` / `nguon` / `tu` có sẵn trong allowlist; `tk` vào `TEN_KIND_THE`.
- Giọng: thì quá khứ, không "mục tiêu / kỷ lục / còn N ngày / so %", test regex mở rộng.

**Điểm bị bắn — em không theo:**
- "Bỏ migration 0032, làm sau khi bật tài khoản": lỗ 3 ("đổi máy mất sạch") chỉ lấp được bằng bảng; migration nhỏ, có rollback,
  web chạy được khi chưa chạy; để cùng đợt đỡ một lượt chủ dự án vào SQL Editor.
- "Chỉ Link sang /than-so, không nói Sao": vẫn ghi rõ "Đang miễn phí" / "N Sao · hội viên mở sẵn" đọc từ `/api/luan-giai/phi`
  — nói thật trạng thái, không hứa, không đếm ngược.

**Chốt (đã làm):** nhật ký ngày ghé (máy + 0032) · lịch tháng này trong khối chuỗi + chia sẻ khi tròn 7 ngày · lá bài ghi
"lá thứ N của tháng" · tổng kết tháng trước (Hôm nay + Bản thân) + lối "12 tháng tới" · thẻ "Tháng N của tôi" (mã ký, OG,
trang nhận) · huy hiệu "Đủ 9 nhịp" · `badge_earned` cho mọi huy hiệu · hạng hội viên ở Bản thân · `xoaHoSo` xoá dấu mốc.
Đo sau 30 ngày (quản trị › tăng trưởng, phễu thẻ): `share_clicked{tk}/share_created{thang}` so với thẻ ngày; `recap_viewed`
có `so_ngay ≤ 4` chiếm đa số → ngưỡng; `sao_cta_clicked{tu: tong_ket}` → `paywall_viewed` khi bật thu Sao.

**Hàng đợi sau khi có số:** B "Đôi bạn" khi tài khoản bật và D7 có số; tổng kết NĂM (thẻ dịp 1/1 — bản cơ bản miễn phí, không
làm đặc quyền hội viên).
