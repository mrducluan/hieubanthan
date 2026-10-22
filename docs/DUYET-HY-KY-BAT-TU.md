# Duyệt bảng "hành nên thêm / nên bớt" theo cách cục — Bát tự (BT-HK)

> Tình trạng: **chờ người rành Tử Bình duyệt** (2026-10-22). Bảng đang chạy là nháp AI, chưa đối chiếu nguyên văn.
> Không sửa bảng khi chưa có ý kiến chuyên gia — mỗi dòng đổi kéo theo 15–30% nhãn đại vận của các lá thuộc cách đó.

## 1. Bảng này là gì, vì sao quan trọng

Bát tự đời sống luôn đọc **hai cách** và không tự chọn:

- **Cách 1 — cân sức** (phù ức + điều hậu, Trích Thiên Tuỷ): thân yếu thì thêm hành sinh/giúp thân, thân mạnh thì
  thêm hành tiết/khắc thân, sinh mùa hạ cần Thuỷ, mùa đông cần Hoả. Phần này engine **tính** từ điểm ngũ hành.
- **Cách 2 — theo tháng sinh** (cách cục, Tử Bình Chân Thuyên): mỗi cách cục có nhóm thập thần "nên có" (hỷ) và "nên
  tránh" (kỵ). Phần này engine **tra bảng** `engine/app/kb/data/battu_doi_song_kb.json` → `cach.<mã>.hy / ky`
  (+ bản riêng khi thân nhược `than_nhuoc` / thân vượng `than_vuong`).

Cách 2 quyết định một nửa nhãn Thuận lợi / Cân bằng / Cần lưu ý của: 6 mảng đời (tổng quan, năng lượng, công việc,
tiền, tình cảm, gia đình), 8 đại vận, 10 năm trong chương Vận hạn, 12 tháng tới. Nếu bảng sai, nhãn sai theo hàng loạt.

Số đo trên 300 lá ngẫu nhiên 1950–2008 (`engine/scripts/thong_ke_hy_ky.py`, ngày xem 21/10/2026):

| Cách cục | Số lá | Thân yếu / cân / mạnh | Mảng đời hai cách khác nhau | Đại vận hai cách khác nhau |
|---|---|---|---|---|
| Thiên Ấn (`thien_an`) | 39 (13%) | 4 / 10 / 25 | 20% | 54% |
| Nguyệt Kiếp (`nguyet_kiep`) | 37 (12%) | 12 / 12 / 13 | 24% | 59% |
| Chính Ấn (`chinh_an`) | 34 (11%) | 4 / 13 / 17 | 18% | 43% |
| Chính Quan (`chinh_quan`) | 31 (10%) | 21 / 5 / 5 | 24% | 52% |
| Thương Quan (`thuong_quan`) | 28 (9%) | 15 / 7 / 6 | 20% | 62% |
| Thất Sát (`that_sat`) | 27 (9%) | 18 / 5 / 4 | 15% | 55% |
| Chính Tài (`chinh_tai`) | 27 (9%) | 18 / 6 / 3 | 19% | 67% |
| Thực Thần (`thuc_than`) | 25 (8%) | 17 / 6 / 2 | 19% | 66% |
| Thiên Tài (`thien_tai`) | 23 (8%) | 14 / 4 / 5 | 24% | 58% |
| Kiến Lộc (`kien_loc`) | 21 (7%) | 3 / 9 / 9 | 18% | 54% |
| Dương Nhận (`duong_nhan`) | 8 (3%) | 3 / 1 / 4 | 17% | 67% |

Hai cách đọc khác nhau ở **43–67% số đại vận** → bảng cách 2 là chỗ ảnh hưởng lớn nhất tới điều người dùng đọc.

## 2. Vì sao phải nhờ người rành Tử Bình (không để AI tự sửa)

1. **Bảng do AI soạn** từ nguyên lý chung của Tử Bình Chân Thuyên, chưa ai đối chiếu nguyên văn từng thiên
   (Luận Chính Quan, Luận Tài, Luận Ấn thụ, Luận Thực thần, Luận Thiên quan, Luận Thương quan, Luận Dương nhận, Luận
   Kiến lộc nguyệt kiếp…).
2. **Sách nói theo điều kiện** ("thân nhược thì dùng Ấn", "Sát nặng mà không chế thì kỵ Tài", "Kim Thuỷ Thương Quan
   thích gặp Quan"…), bảng chỉ có 3 nhánh: chung / thân nhược / thân vượng. Chọn nhánh nào, điều kiện nào đáng thêm là
   việc của người đã luận nhiều lá thật.
3. **Giới hạn của cách chấm theo hành**: engine chấm theo ngũ hành nên hai sao cùng hành (Thực Thần / Thương Quan,
   Chính Ấn / Thiên Ấn, Chính Quan / Thất Sát, Tỷ Kiên / Kiếp Tài) luôn đi chung một nhóm. Sách phân biệt rõ (Chính Quan
   kỵ **Thương Quan**, Thực Thần kỵ **Kiêu** = Thiên Ấn), bảng không phân biệt được. Chuyên gia cần quyết: chấp nhận gộp,
   hay cần thêm luật riêng theo can lộ (việc kỹ thuật lớn hơn).
4. **Chưa có cách cục đặc biệt** (tòng cách, hoá khí): lá thân cực nhược / cực vượng thì hỷ kỵ đảo ngược. Trên mẫu 300 lá
   có 6 lá (2%) tỉ lệ trợ lực < 0,20 hoặc > 0,80 — nhóm cần chuyên gia nói có nên tách riêng không.

## 3. Bảng hiện hành + ghi chú rà trước của AI (để chuyên gia quyết)

Nhóm: Tỷ Kiếp · Thực Thương · Tài · Quan Sát · Ấn. "—" = không có bản riêng (dùng bản chung).

| Cách cục | Hỷ (chung) | Kỵ (chung) | Thân nhược | Thân vượng | Ghi chú rà trước (AI — CHƯA phải kết luận) | Ý kiến chuyên gia |
|---|---|---|---|---|---|---|
| Chính Quan | Tài, Ấn | Thực Thương | — | — | **Nghi vấn 1.** Sách: thân mạnh dùng Tài sinh Quan, thân yếu dùng Ấn hộ thân. Gộp "Tài, Ấn" cho mọi lá có thể sai một nửa: 21/31 lá thân nhược. Đề xuất thử: nhược hỷ Ấn / kỵ Thực Thương, Tài; vượng hỷ Tài / kỵ Thực Thương. Kỵ Quan Sát hỗn tạp không biểu diễn được (cùng hành). | |
| Thất Sát | Thực Thương, Ấn | — | hỷ Ấn, kỵ Tài | — | Sách: Sát dùng Thực chế là trên, Ấn hoá cũng đẹp; Tài sinh Sát khi thân yếu là kỵ. Thân vượng mà Sát nhẹ có sách dùng Tài sinh Sát — chưa có nhánh `than_vuong`. | |
| Chính Tài | Thực Thương, Quan Sát | Tỷ Kiếp | hỷ Ấn, kỵ Tỷ Kiếp | — | **Nghi vấn 2.** Thân nhược mà kỵ Tỷ Kiếp ngược với cách 1 (thân yếu cần bạn ngang hàng đỡ). Sách có "Tài cách bội Ấn" và cũng nói Tỷ Kiếp đoạt Tài — cần chuyên gia chọn. Đề xuất thử: nhược hỷ Tỷ Kiếp, Ấn / kỵ Thực Thương, Quan Sát. | |
| Thiên Tài | Thực Thương, Quan Sát | Tỷ Kiếp | hỷ Ấn, kỵ Tỷ Kiếp | — | Như Chính Tài (Nghi vấn 2). | |
| Chính Ấn | Quan Sát | Tài | — | hỷ Tài, Thực Thương; kỵ Ấn | Khớp nguyên lý (Quan sinh Ấn, Tài phá Ấn; Ấn quá vượng thì cần Tài / Thực Thương). | |
| Thiên Ấn | Quan Sát | Tài | — | hỷ Tài; kỵ Ấn | Sách: Kiêu nặng thì dùng Tài chế Kiêu — bản chung kỵ Tài có thể quá chặt với lá Kiêu nặng mà chưa đủ ngưỡng "thân vượng". | |
| Thực Thần | Tài | Ấn | hỷ Tỷ Kiếp, kỵ Ấn | — | **Nghi vấn 3.** Sách kỵ **Kiêu** đoạt Thực (Thiên Ấn), bảng kỵ cả nhóm Ấn. Thân nhược mà kỵ Ấn ngược cách 1. Đề xuất thử: nhược hỷ Tỷ Kiếp, Ấn / kỵ Quan Sát. | |
| Thương Quan | Tài | Quan Sát | hỷ Ấn, kỵ Quan Sát | — | Khớp "Thương Quan sinh Tài", "Thương Quan bội Ấn", "Thương Quan kiến Quan". Chưa có ngoại lệ Kim Thuỷ Thương Quan thích gặp Quan (mùa đông). | |
| Kiến Lộc | Quan Sát, Tài, Thực Thương | Tỷ Kiếp | — | — | Khớp nguyên lý (thân đã vững, cần chỗ phát). | |
| Dương Nhận | Quan Sát | Tỷ Kiếp | — | — | Khớp "Dương Nhận dùng Quan Sát". Có nên kỵ Thực Thương (chế mất Quan Sát) không? | |
| Nguyệt Kiếp | Quan Sát, Thực Thương | Tỷ Kiếp | — | — | Văn bản KB nói thêm "Thực Thương tiết khí rồi sinh Tài" — có nên thêm Tài vào hỷ không? | |

Tác động nếu áp đề xuất thử (cùng mẫu 300 lá, chỉ các lá thuộc cách đó):

| Đề xuất thử | Số lá | Đại vận đổi nhãn | Đại vận "Cần lưu ý" trước → sau | Mảng đời đổi nhãn nhiều nhất |
|---|---|---|---|---|
| Nghi vấn 1 — Chính Quan tách theo thân | 31 | 19% | 25% → 40% | Năng lượng 16% |
| Nghi vấn 2 — Tài cách thân nhược hỷ Tỷ Kiếp, Ấn | 50 | 21% | 35% → 36% (Thuận lợi 37% → 52%) | Tổng quan 12% |
| Nghi vấn 3 — Thực Thần thân nhược hỷ Tỷ Kiếp, Ấn | 25 | 30% | 34% → 30% (Thuận lợi 32% → 47%) | Gia đình 8% |

Đo lại bất kỳ đề xuất nào: viết tệp JSON chỉ chứa các cách cục muốn đổi rồi chạy
`cd engine && .venv/bin/python scripts/thong_ke_hy_ky.py --de-xuat <tệp>.json` (script chỉ đọc engine, không sửa KB).

## 4. Cách làm đề xuất

1. **Tìm người duyệt.** Một người đã luận Bát tự theo Tử Bình nhiều năm (lộ trình chuyên gia cộng đồng `docs/EEAT-VA-CHUYEN-GIA.md`, bậc "chuyên gia khách" của `docs/KE-HOACH-CHUYEN-GIA.md`). Ước lượng 1–2 giờ: đọc bảng mục 3, điền cột "Ý kiến chuyên gia" (Đồng ý / Sửa thành … / Cần thêm điều kiện …), nêu thiên sách làm căn cứ.
2. **Kỹ thuật áp ý kiến** (một PR): sửa `cach.*` trong KB; chạy script `--de-xuat` trước khi sửa để ghi tác động vào PR; cập nhật golden `engine/fixtures/golden/battu_doi_song.json` + test chấm tay; ghi người duyệt + ngày vào KB (`cach.<mã>.tham_dinh`); thêm dòng vào bảng quyết định CLAUDE.md. Không đổi phép tính tứ trụ → không tăng `ENGINE_VERSION`.
3. **Ý kiến cần thêm luật** (phân biệt Thực/Thương, Chính/Thiên Ấn theo can lộ; tòng cách; Kim Thuỷ Thương Quan) → tách thành việc riêng, có test trước, báo lại chủ dự án vì đổi nhãn nhiều.
4. **Dữ liệu thật hỗ trợ chuyên gia** — khối "Cách nào đúng với bạn?" trên `/bat-tu` (BT-DC, 2026-10-22): người dùng kể lại những năm đã qua mà hai cách đọc khác nhau, máy người dùng đếm cách nào khớp. PostHog nhận sự kiện `chart_interacted` `kind=battu_doi_chieu` chỉ gồm `cach_cuc`, `than`, `khop_1`, `khop_2`, `so_cau`, `ket_qua` (không năm, không ngày sinh). Khi một cách cục có ≥ 100 lượt mà cách 2 khớp kém rõ (< 35% số câu), ưu tiên chuyên gia xem lại dòng đó trước. Đây là tín hiệu tham khảo (trí nhớ người dùng có thiên lệch), không thay ý kiến chuyên gia.

## 5. Không làm

- AI tự sửa bảng theo "đề xuất thử" khi chưa có người duyệt.
- Tự chọn một cách thay người dùng: hai cách vẫn hiện song song; "cách chính" chỉ do người dùng chọn sau khi tự đối chiếu (BT-DC), và chỉ đổi chỗ nhấn trong báo cáo, không đổi nhãn chung.
