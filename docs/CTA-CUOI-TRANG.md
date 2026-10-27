# CTA-2 — Khối thẻ cuối trang: lối đi tiếp, quản trị, đo lường

Chủ dự án giao 2026-10-26: (1) không còn ô trống ở khối thẻ cuối trang; (2) đo lượt bấm thẻ bù để biết lối đi tiếp nào
hiệu quả, xếp lại theo số thật; (3) quy hoạch riêng khối CTA để cài đặt theo từng URL trong quản trị.
Khâu tăng trưởng: **THU HÚT → công cụ** (người đọc bài/kiến thức luôn có lối sang công cụ / trang kế tiếp), nền móng cho
**QUAY LẠI** (Hôm nay, quẻ đầu ngày). Chỉ số: tỉ lệ đi tiếp của khối = (bấm thẻ thật + bấm thẻ bù) / lượt thấy khối.

## 1. Khối nào, ở đâu

| Mã khối (`khoi`) | Nơi đặt | Thẻ thật | Thẻ bù khi thiếu |
|---|---|---|---|
| `kien_thuc_tru` | 6 trang công cụ (trang trụ silo) | cụm kiến thức của silo | lối chéo mảng → chung |
| `bai_lien_quan` | trang công cụ, trang chủ đề kiến thức | bài CMS cùng mảng | như trên, bỏ thẻ đã hiện ở khối trên |
| `bai_moi` | trang chủ, /kham-pha, /kien-thuc | bài CMS mới nhất | nhóm "Chung" |
| `doc_tiep` | cuối bài blog (CMS + NotFair) | bài khác | cụm cùng mảng CtaBlog chưa nêu → chung |
| `thu_vien` | /kien-thuc (mỗi silo một lưới) | cụm của silo | thẻ công cụ của mảng → lối chéo |
| `trang_dich` | khối "Bài viết" của trang đích CMS | bài biên tập chọn | nhóm "Chung" |

Thứ tự lấy thẻ bù (`lib/the-lap.ts` `theLap`): **thẻ ưu tiên của URL** → (thư viện: thẻ công cụ) → **cụm kiến thức cùng
mảng** (công tắc `cum_truoc`) → **nhóm của mảng** → **nhóm Chung**. Bỏ link đã hiện trên trang (`boQua`, so phần trước
`#`/`?`), không trùng nhau. Lưới không bù được (thống kê tác giả, gói Sao, thẻ công cụ trang đích) → số cột theo số mục
(`lib/luoi.ts` `lopCot`).

## 2. Ba hướng quản trị đã cân nhắc

| | A. CMS (Payload) — **đã chọn** | B. /quan-tri (Supabase `cau_hinh`) | C. Chỉ code + tự xếp theo số |
|---|---|---|---|
| Đúng ranh giới CMS-GD | ✅ chữ/link hiển thị → CMS | ❌ /quan-tri dành cho số + công tắc tiền/Sao/AI | — |
| Giao diện sửa | Form có sẵn: kéo thả thứ tự, chọn chip/hình, kiểm link trong site, ghi đè từng URL ngay trong "Trang website" | Phải tự xây form JSON + kiểm định | Không có — mỗi lần đổi là một PR |
| Lọc an toàn | Luật ranh giới chung (vùng cấm, liên hệ, tên nội bộ) khi lưu + web lọc lại | Tự viết lại | Code review |
| Xoá cache khi sửa | Webhook có sẵn (`lamMoiGlobal`, thẻ "cms") | Tự thêm | Deploy |
| Rủi ro | 1 migration Payload (chỉ thêm bảng) | Đổi schema Supabase + RLS + migration chờ chạy tay | Chủ dự án không tự chỉnh được |
| Dữ liệu dẫn đường | Bảng ở /quan-tri/tang-truong + công tắc "Tự xếp" | như A | tự xếp, không người duyệt |

**Chọn A + đo lường từ C**: biên tập viên quyết danh sách và thứ tự; số thật (PostHog) hiện ở /quan-tri để quyết, và khi
bật "Tự xếp theo lượt bấm" thì web chỉ **xếp lại trong từng nhóm** do biên tập chọn — máy không thêm/bớt thẻ (giống tinh
thần tầng HỌC: máy chỉ xếp lại, người mới đổi nội dung).

## 3. Cài đặt (CMS)

- **Giao diện website → Lối đi tiếp cuối trang** (global `loi-di-tiep`): công tắc *Bù thẻ khi khối thiếu ô* (tắt = co
  cột), *Cụm kiến thức cùng mảng đứng trước*, *Tự xếp theo lượt bấm*; **Nhóm theo mảng** (/than-so … /phong-thuy + Chung),
  mỗi thẻ: đường dẫn trong site, tên ≤ 60, mô tả ≤ 180, chip (Kiến thức/Công cụ/Thư viện), hình (5 mảng). Bản mặc định
  = `cms/src/globals/loi-di-tiep-mac-dinh.json` = `web/lib/loi-di-tiep-mac-dinh.json` (e2e so hai tệp).
- **Trang website → tab Lối đi tiếp** (từng URL, trừ pháp lý): ≤ 6 thẻ ưu tiên, đứng trước nhóm mảng.
- CMS lỗi/trống → web dùng bản mặc định trong code; web lọc lại mọi thẻ (link ngoài, `//x`, `javascript:` bị bỏ).

## 4. Đo lường — có ích thật đến đâu

Sự kiện (chỉ mã, không chữ người dùng; `components/khung/DoKhoiCuoi.tsx`):
`end_cta_viewed{khoi, trang, lap:0, so_lap}` khi khối hiện ≥ 40% · `end_cta_viewed{khoi, trang, lap:1, den, thu_tu}`
cho từng thẻ bù · `end_cta_clicked{khoi, trang, lap, den, thu_tu}` (`den = "_that"` với thẻ thật).

Bảng ở **/quan-tri/tang-truong → "Khối thẻ cuối trang · lối đi tiếp"**: theo khối (thấy / bấm thật / bấm bù / tỉ lệ đi
tiếp) và theo thẻ bù (thấy / bấm / tỉ lệ, đánh dấu chưa đủ mẫu), xếp đúng thứ tự web dùng khi tự xếp.

Đánh giá thẳng:
- **Có ích**: (a) biết thẻ bù có kéo người đi tiếp không — nếu tỉ lệ bấm thẻ bù ≈ thẻ thật, khối cuối trang đang làm việc
  thay vì chỉ lấp chỗ; (b) chọn lối đi tiếp tốt nhất cho từng mảng (vd /hop-doi: "Xem lá số 2 người" hay "Số chủ đạo trong
  tình yêu") để đẩy người đọc kiến thức sang **công cụ** — nơi có hồ sơ, lời mời, Sao; (c) phát hiện khối không ai bấm →
  sửa chữ / đổi thẻ ở CMS mà không cần PR.
- **Giới hạn**: lượng truy cập hiện thấp → mỗi thẻ cần ≥ 30 lượt thấy mới xếp (làm mượt Laplace (bấm+1)/(thấy+20) để 1
  cú bấm may mắn không đẩy thẻ mới lên đầu); vị trí ảnh hưởng tỉ lệ (ô 3 được bấm ít hơn ô 1) nên so thẻ trong cùng vị trí
  khi có thể (`thu_tu`). Không phải A/B test ngẫu nhiên — đủ để loại thẻ tệ, chưa đủ để kết luận khác biệt nhỏ.
- **Khuyến nghị**: để "Tự xếp" TẮT tới khi bảng có ≥ 3 thẻ đủ mẫu trong cùng nhóm; rà bảng 2 tuần/lần cùng lúc rà Gate.

## 5. Kiểm thử

- `web/e2e/cta-luoi.spec.ts` (bộ chính): toạ độ từng hàng 1280/768px, link thẻ bù trả 200, hàm thuần (lọc CMS, tự xếp,
  gom số, hai bản mặc định khớp).
- `web/e2e-cms/` + `playwright.cms.config.ts` (`npm run e2e:cms`, job CI `e2e` bước "Chạy E2E có CMS giả"): CMS giả trả
  bài viết + cấu hình; kiểm thẻ bù kín hàng, cấu hình global / ghi đè URL áp dụng, tắt thẻ bù co cột, sự kiện đo đúng mã.
