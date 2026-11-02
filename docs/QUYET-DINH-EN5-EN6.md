# Quyết định EN-5 / EN-6 còn treo (2026-11-02)

Ba việc "chờ quyết" sau EN-5 / EN-6 (`docs/KE-HOACH-NANG-CAP-ENGINE.md`). Mỗi việc: ba phương án, đánh giá, phương án
chọn và những gì đã làm. Chủ dự án giao em chọn rồi làm luôn.

**Nguồn đối chiếu tìm được trong phiên này** (mạng ctext.org bị chặn): bản số hoá Tứ khố toàn thư của Kanseki Repository
(kanripo, chép cổ thư công cộng) — *Tam Mệnh Thông Hội* (`KR3g0042`) và *Khâm định Hiệp Kỷ Biện Phương Thư* (`KR3g0051`).
Oracle mã nguồn mở MIT chỉ để sinh golden (không chạy runtime, không chép mã): `shunshi-bazi-core` 0.2.0 + nạp âm
`lunar-typescript` 1.8.6. Các thư viện lịch MIT (`lunar-python`, `cnlunar`, `huangli-lite`, `shunshi-zeri-core`…) **không có**
bảng tháng gả cưới. Nguồn AGPL / không giấy phép: không mở.

---

## Việc 1 — Thần sát Bát tự: Học Đường · Thiên La Địa Võng · Kim Thần (EN-5.3)

### Sách khác nhau thế nào (đọc thẳng nguyên văn)

| Sao | *Tam Mệnh Thông Hội* (cách chính của sách) | Cách khác sách ghi / thư viện thời nay dùng |
|---|---|---|
| Học Đường | q.3 "Luận Học Đường Từ Quán": 長生乃學堂之正位，如金命見辛巳 — nơi Trường Sinh của **hành nạp âm năm** (Kim → Tỵ, Mộc → Hợi, Thủy/Thổ → Thân, Hỏa → Dần); can chi ở đó có nạp âm cùng hành = Chính Học Đường (Tân Tỵ, Kỷ Hợi, Giáp Thân, Mậu Thân, Bính Dần) | Cùng chương, đoạn "Tử Bình vân": 甲見亥乙見午 — nơi Trường Sinh của **can ngày**, một trụ tháng hoặc giờ có là đủ |
| Thiên La Địa Võng | q.3 "Luận Thiên La Địa Võng": 戌亥為天羅，辰巳為地網 … 火命人有天羅，水土命人有地網，餘金木二命無之; 男怕天羅女怕地網 | Chỉ xét chi, không xét mệnh (trụ nào có Tuất/Hợi, Thìn/Tỵ) — theo cách này phần lớn lá số "có" |
| Kim Thần | q.6 "Kim Thần": 止有三時乃癸酉己巳乙丑，此格六甲日為主 … 六己日見此三時亦作金神論 — **trụ giờ** Ất Sửu / Kỷ Tỵ / Quý Dậu, **ngày Giáp hoặc Kỷ** | Trụ ngày **hoặc** giờ là một trong ba can chi đó, không xét can ngày |

### Ba phương án

| | A. Một phái, vào luận như thần sát khác | B. Hiện song song mọi cách, gắn nhãn phái | C. Một phái gốc có trích dẫn + cách khác ghi chú, lớp tham khảo (CHỌN) |
|---|---|---|---|
| Làm gì | Thêm 4 sao vào `than_sat` (bảng đếm cát / hung của luận giải đời sống) | Mỗi sao 2–3 kết quả cạnh nhau ("theo nạp âm: có · theo can ngày: không …") | Danh sách riêng `than_sat_tham_khao`: cách *Tam Mệnh Thông Hội*, kèm câu "cách khác" + kết quả theo cách khác (`theo_cach_khac`) |
| Đúng sách | Đúng một phái, giấu chỗ sách khác | Đầy đủ nhất | Đúng một phái có trích dẫn, vẫn nói cách khác |
| Đổi kết quả cũ | **Có** — `battu_doi_song` đếm cát/hung (`loai_ts`) → mức chương đổi mà không có căn cứ | Không (nếu tách khỏi bảng đếm) | **Không** — test khoá: bốn sao không có trong `than_sat` |
| Người dùng đọc | Gọn nhưng "Thiên La Địa Võng" thành sao hung đếm vào mức — dễ doạ | Rối: 3 sao × 2–3 cách, người đọc không biết tin cách nào | Một câu trả lời rõ + một dòng "cách khác" |
| Đối chiếu | Oracle được | Oracle được | Oracle được |

**Chọn C.** Cùng nguồn với bảng thần sát hiện có (`THAN_SAT_NGUON` = *Tam Mệnh Thông Hội*) nên nhất quán; không đổi mức
nào (CLAUDE.md: thần sát không đổi mức đời sống khi chưa có căn cứ); vẫn trung thực việc sách khác nhau. Phương án B để
lại cho người đọc việc chọn phái — không giúp người mới; phương án A phá cam kết không doạ và đổi kết quả cũ.

### Đã làm

- CALC `battu_mo_rong.than_sat_tham_khao(tru)` — luôn đủ 4 mục (Học Đường, Thiên La, Địa Võng, Kim Thần), mỗi mục `co`,
  `tru`, `goc`, `phai`, `cach_khac`, `theo_cach_khac`; Học Đường thêm `chinh` / `chinh_tru`. Gốc ở nạp âm năm / can ngày
  nên không xét chính trụ năm (như các thần sát khác). `mo_rong` trả `than_sat_tham_khao` + `than_sat_tham_khao_nguon`.
- Lời trung tính: Thiên La / Địa Võng = "sách xưa ví như lúc thấy mình bị vây: việc dễ chậm, vướng thủ tục — hợp làm chắc
  từng bước, giấy tờ rõ ràng"; Kim Thần = "tính cương, quyết đoán … cần sự mềm mỏng tiết chế"; không chữ "tai hoạ", "ác tử"
  (nguyên văn sách có — không dùng).
- Hỏi đáp Bát tự: chủ đề mới `than_sat_tk` (gõ có dấu so trên chữ có dấu; không dấu cần ngữ cảnh — "học đường" là chữ
  thường, "kim thân", "thiện là" trùng khi bỏ dấu). Câu hỏi Thiên La / Địa Võng nói thêm đây khác hai hạn cùng tên trong
  Bát hạn (tập quán theo tuổi).
- Web `/bat-tu`: trong khung "Ý nghĩa các thần sát", khối "Học Đường · Thiên La Địa Võng · Kim Thần (tham khảo)".
- Golden: `fixtures/golden/than_sat_tham_khao_tay.json` (6 ca tính tay theo nguyên văn) + `than_sat_tham_khao.json`
  (5.000 tứ trụ của `battu_5000.json`, oracle `shunshi-bazi-core` ở các phần quy tắc trùng: Kim Thần cách phổ thông,
  Địa Võng trụ ngày, Chính Học Đường) — sinh lại bằng `fixtures/_generate_than_sat_tham_khao.mjs`. Khớp 5.000/5.000.
- Test: `engine/tests/test_en5_than_sat_tham_khao.py`; e2e `web/e2e/bat-tu.spec.ts`.

---

## Việc 2 — Tháng "đại lợi / tiểu lợi" theo tuổi cô dâu (EN-5.1)

### Tìm được gì

*Hiệp Kỷ Biện Phương Thư* (1741) chép **quy tắc** ở hai chỗ — q.36 "Biện ngoa · Nam nữ hợp hôn đại lợi nguyệt" và tờ tấu
ở quyển đầu:

> 其法以女命為主，子寅辰午申戌六陽年自本命前一月向前順數，丑卯巳未酉亥六陰年自本命後一月向後逆數，第一月為大利，
> 第二月妨媒氏首子，第三月妨翁姑，第四月妨女父母，第五月妨夫，第六月妨本身，至第七月又復一轉。

…và **bác** nó ngay sau đó: 所謂大利者固術士之揑造而無理之甚者也 … 今已奏准刪除 (thuyết thuật sĩ bịa, triều đình đã tâu
xin bỏ). Bảng (立成) trong bản số hoá bị mất chữ, nhưng quy tắc bằng lời đủ để tính tay 12 tuổi; bảng tính ra là một hình
vuông Latin (mỗi tháng đúng một nhóm mỗi tuổi) và khớp bảng lịch Việt dân gian em biết (Tý Ngọ: đại lợi tháng 6, 12;
tiểu lợi tháng 1, 7 …) — bản in lịch Việt không mở được trong phiên này để đối chiếu từng dòng. "Tiểu lợi" là tên lịch Việt đặt cho tháng thứ hai — sách gốc gọi tháng đó là "phương môi thị thủ
tử". Không thư viện lịch MIT nào có bảng này để làm oracle thứ hai.

### Ba phương án

| | A. Lưu ý xếp hạng (không loại ngày) | B. Chỉ thông tin tham khảo, có nguồn (CHỌN) | C. Chưa đưa vào |
|---|---|---|---|
| Làm gì | Ngày ngoài tháng đại / tiểu lợi xếp sau, như Kim lâu | Nhãn "tháng đại lợi (tập quán)" trên ngày + một khối giải thích; thứ tự ngày không đổi | Giữ dòng "chưa xét" |
| Đúng nguồn | **Trái** — chính sách lịch dự án dùng làm gốc nghi / kỵ (Hiệp Kỷ) đã bác thuyết này | Đúng: nêu quy tắc + nói rõ sách đã bác | Đúng nhưng bỏ trống điều người dùng tìm nhiều |
| Đối chiếu | Một nguồn gốc (2 chỗ cùng sách) + khớp bảng dân gian | như A | — |
| Giá trị người dùng | Cao nhưng đẩy gia đình theo một thuyết không căn cứ | Trả lời đúng câu người ta tìm ("tháng đại lợi tuổi …"), không ép | Thấp |
| Không doạ | Kéo theo 4 nhóm "phương …" (hại bố mẹ chồng, hại chồng…) | Chỉ hai nhóm tích cực; bốn nhóm "phương …" không đưa ra | — |

**Chọn B.** Có nguồn gốc đọc được nguyên văn, quy tắc tất định, tính tay kiểm được; người dùng hỏi nhiều. Nhưng chính
nguồn đó nói thuyết này không có căn cứ → không cho nó làm đổi thứ tự hay bỏ ngày, chỉ gắn nhãn tập quán và nói rõ điều
sách viết. Phương án C thua vì đã đối chiếu được quy tắc từ nguyên văn (điều kiện "chưa đối chiếu được" không còn).

### Đã làm

- CALC `tuoi_dan_gian.thang_gia_thu(chi_nam_co_dau)` → `dai_loi`, `tieu_loi` (tháng 1–12) + tên chi tháng; tháng theo
  **nguyệt kiến / tiết khí** (tháng Dần = Giêng) như sách — cùng cách `chon_ngay_nhieu` xét tháng xung tuổi.
- RULES `chon_ngay_nhieu.chon`: chỉ khi việc là cưới hỏi **và** có cô dâu → mỗi ngày thêm `gia_thu` (`dai_loi` /
  `tieu_loi` / null), kết quả thêm `thang_gia_thu` {nhãn, lời giải thích, nguồn}. **Không** vào khoá xếp, không thêm vào
  `luu_y` (test khoá thứ tự giống hệt khi không có nhãn). Bỏ dòng `chua_xet` (web chịu được khi engine cũ còn trả).
- Web `/xem-ngay-tot` (khối "Chọn ngày cho cả nhà"): khung gập "Tháng đại lợi / tiểu lợi theo tuổi cô dâu (tập quán)" +
  chip nhãn trên ngày nổi bật.
- Golden `fixtures/golden/thang_gia_thu.json` (12 tuổi, tính tay từ nguyên văn); test `engine/tests/test_en5_thang_gia_thu.py`
  (golden, hình vuông Latin, nhãn từng ngày theo tháng tiết, thứ tự không đổi, không có chữ doạ); e2e `xem-ngay-tot.spec.ts`.

---

## Việc 3 — Lưu múi giờ nơi sinh (`utc_noi_sinh`) vào hồ sơ tài khoản (EN-6 BI-3)

### Ba phương án

| | A. Cột mới `utc_noi_sinh numeric` + CHECK (CHỌN) | B. Lưu trong cột jsonb | C. Không lưu, suy từ nơi sinh |
|---|---|---|---|
| Hiện trạng | — | `ho_so` **không có** cột jsonb → vẫn phải thêm cột (jsonb "tùy chọn") | `noi_sinh` chỉ là `nuoc_ngoai`, không có nước / thành phố |
| Ràng buộc dữ liệu | CHECK trong DB: −12…14, bước 0,25, **chỉ khi** `noi_sinh = 'nuoc_ngoai'` | Kiểm trong JSON kém chặt, dễ thành túi chứa dữ liệu khác | Phải hỏi thêm nước / thành phố (thêm dữ liệu cá nhân) + bảng múi giờ lịch sử |
| Tối thiểu hoá dữ liệu | Một con số, không vị trí | như A nếu chỉ một khoá | Tăng (lưu nơi chốn cụ thể) |
| Migration chưa chạy | Web lùi như 0015: ghi lỗi thiếu cột → ghi lại không có cột; đọc lùi bộ cột 0007 | tương tự | không cần migration |
| Quản trị tự nhận diện | Dấu hiệu cột `ho_so.utc_noi_sinh` (OpenAPI) | cột jsonb | — |

**Chọn A.** Đúng một con số engine cần, DB tự chặn giá trị sai và chặn lưu múi giờ khi sinh trong nước; RLS 0006 giữ
nguyên (chủ sở hữu, xoá tài khoản → cascade). B không rẻ hơn (vẫn thêm cột) mà ràng buộc yếu hơn; C cần thu thêm nơi
chốn cụ thể — trái tối thiểu hoá dữ liệu.

### Đã làm

- Migration **0033** `supabase/migrations/0033_ho_so_utc_noi_sinh.sql` (+ `.down.sql`): cột `utc_noi_sinh numeric(4,2)`,
  ràng buộc `ho_so_utc_noi_sinh_check`. Kiểm thử `supabase/kiem_thu/thu_ho_so_0033.sql` (lưu / chặn giá trị lẻ, ngoài
  khoảng, sinh trong nước có múi giờ; B không đọc / sửa được hồ sơ A) — thêm vào `chay.sh`. Đã chạy trên Postgres 16
  cục bộ: lên 3 vòng, down rồi lên lại, thử chặn đúng.
- `supabase/kiem_thu/da_chay_chua.sql` + `web/lib/migration-qt.ts` nhận diện 0033 (cột `ho_so.utc_noi_sinh`).
- Web `web/lib/tai-khoan.ts`: ghi luôn gửi `utc_noi_sinh` (null khi sinh trong nước — đổi nơi sinh thì xoá múi giờ cũ);
  lỗi khác vi phạm check (0033 chưa chạy) → ghi lại không có cột, rồi chuỗi lùi cũ (0015, 0007). Đọc lùi 0033 → 0007 →
  0006; `cot_utc` báo tài khoản có cột để màn Tài khoản không coi "thiếu múi giờ" là khác máy khi migration chưa chạy.
  "Dùng bản trong tài khoản" ưu tiên múi giờ trong tài khoản, chỉ giữ của máy khi tài khoản chưa có.
- Lời đồng ý lưu (Tài khoản, hộp thoại Sao): "nơi sinh (kèm múi giờ nếu sinh ở nước ngoài)".
- Test: `web/e2e/tai-khoan.spec.ts` (ghi khi có / chưa có 0033, chưa có 0015 mà có 0033, giá trị lạ, đọc lại).

**Việc của chủ dự án:** chạy `0033_ho_so_utc_noi_sinh.sql` trong Supabase → SQL Editor (sau 0007) — `docs/VIEC-CUA-ANH.md`
mục 4s. Chưa chạy thì web vẫn như cũ (múi giờ chỉ trên máy).
