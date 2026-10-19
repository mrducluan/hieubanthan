# Quy hoạch nhóm URL (URL Taxonomy) — hieuban.com

> Trạng thái: **ĐÃ DUYỆT phương án B và ĐÃ LÀM** (2026-10-19): tên cụm như mục 4, `/huong-xau-nam` chuyển vào
> `/phong-thuy/huong-xau-nam`, công cụ lịch & tuổi giữ URL gốc. Nguồn đường dẫn + 308: `web/lib/chuyen-huong.json`.
> Đẩy khâu: **1 Thu hút** (cụm chủ đề rõ → Google hiểu site là chuyên trang từng mảng) và **2 Quay lại** (đường đi
> từ bài đọc sang công cụ của đúng mảng ngắn hơn). Đo: số trang được index theo cụm, hiển thị/nhấp theo thư mục
> trong Search Console, tỉ lệ `landing_viewed` trang kiến thức → `reading_started` công cụ cùng mảng.

## 1. Hiện trạng (kiểm kê từ code, ≈ 1.300 URL công khai)

| Nhóm | Mẫu URL hiện tại | Số trang | Trang cha (breadcrumb) |
|---|---|---|---|
| Trang chủ, hub | `/`, `/kham-pha`, `/kien-thuc`, `/ban-than`, `/tu-dien`, `/blog` | 6 | — |
| Công cụ 5 mảng | `/than-so`, `/hop-doi`, `/hom-nay`, `/tu-vi`, `/bat-tu`, `/kinh-dich`, `/phong-thuy` | 7 | Khám phá |
| Công cụ lịch & tuổi | `/xem-ngay-tot`, `/xem-tuoi-lam-nha`, `/tuoi-xong-dat`, `/huong-xau-nam` | 4 | Khám phá |
| Trang con công cụ lịch | `/xem-ngay-tot/{yyyy-mm-dd}`, `/xem-ngay-tot/thang-{m}-{yyyy}` | ~420 | Xem ngày tốt |
| Trang con tuổi | `/xem-tuoi-lam-nha/{năm}/tuoi-{ns}`, `/tuoi-xong-dat/{năm}/tuoi-{ns}`, `/huong-xau-nam/{năm}` | ~190 | công cụ tương ứng |
| Kiến thức thần số | `/kien-thuc/{than-so, nghe-nghiep, tinh-yeu, nam-ca-nhan, no-nghiep, so-kep, hop-so}/{trang}` | 137 | Kiến thức › chủ đề |
| Kiến thức Tử vi | `/kien-thuc/{tu-vi, cung-tu-vi, sao-cung, tu-hoa}/{trang}` | 242 | Kiến thức › chủ đề |
| Kiến thức Bát tự | `/kien-thuc/{thap-than, nhat-chu, menh-tuoi}/{trang}` | 96 | Kiến thức › chủ đề |
| Kiến thức Kinh Dịch | `/kien-thuc/kinh-dich/{que}` | 64 | Kiến thức › chủ đề |
| Phong thuỷ theo tuổi | `/phong-thuy/huong-hop-tuoi` + `/phong-thuy/tuoi-{năm}-{nam|nu}` | 93 | Phong thuỷ › Hướng hợp tuổi |
| Lá số mẫu | `/la-so-mau`, `/la-so-mau/{slug}` | 7 | Lá số mẫu |
| Blog | `/blog/{slug}`, `/blog/chuyen-muc/{slug}`, `/su-kien/{slug}` | theo CMS | Blog |
| Tin cậy, pháp lý | `/gioi-thieu`, `/tac-gia/*`, `/lien-he`, `/chinh-sach-rieng-tu`, `/dieu-khoan`, `/mien-tru-trach-nhiem` | 7 | — |
| Tiện ích (không index) | `/tai-khoan`, `/dang-nhap`, `/nap-sao/*`, `/ung-ho`, `/the/{mã}`, `/hop-doi/{mã}`, `/chia-se` | — | — |

## 2. Vấn đề

1. **Kiến thức tách rời khỏi công cụ cùng mảng.** Trang công cụ `/tu-vi` và 242 trang kiến thức Tử vi nằm ở hai cây
   khác nhau (`/tu-vi` vs `/kien-thuc/...`). Google và người đọc không thấy `/tu-vi` là trang trụ (pillar) của cụm Tử vi;
   breadcrumb của bài đọc dẫn về "Kiến thức" chứ không về công cụ.
2. **Tên thư mục trùng tên mảng nhưng nghĩa hẹp hơn:** `/kien-thuc/tu-vi` là "14 chính tinh", `/kien-thuc/than-so` là
   "ý nghĩa 12 con số", `/kien-thuc/kinh-dich` là "64 quẻ" — một mảng bị chia nhiều thư mục ngang hàng
   (`tu-vi`, `cung-tu-vi`, `sao-cung`, `tu-hoa`) thay vì cha–con.
3. **Một cụm thuộc mảng khác nằm lệch:** `hop-so` (cặp số hợp nhau) thuộc hành trình **Hợp đôi** nhưng nằm dưới
   `/kien-thuc`; `menh-tuoi` (sinh năm X mệnh gì) thuộc Bát tự/nạp âm nhưng không nằm cạnh `/bat-tu`.
4. **Phong thuỷ không nhất quán:** trang tuổi nằm phẳng ở `/phong-thuy/tuoi-1990-nam` (không dưới
   `/phong-thuy/huong-hop-tuoi` dù breadcrumb ghi vậy); `/huong-xau-nam` là phong thuỷ nhưng nằm ở gốc.
5. **Lá số mẫu** (`/la-so-mau`) là nội dung Tử vi nhưng nằm ở gốc.
6. **Ba hub chồng vai:** `/kham-pha` (danh sách công cụ), `/kien-thuc` (thư viện), `/ban-than` (hồ sơ) — chưa ghi rõ
   vai trò; menu "Khám phá" gom cả công cụ lẫn thư viện.

Điểm đang **tốt, nên giữ**: URL công cụ ngắn, đúng từ khoá người Việt gõ (`/xem-ngay-tot`, `/tuoi-xong-dat`,
`/xem-tuoi-lam-nha`); slug không dấu, gạch ngang, chữ thường; trang con theo năm/ngày có quy luật; pháp lý ở gốc.

## 3. Nguyên tắc quy hoạch

1. **Mảng là silo; trang công cụ là trang trụ.** Mọi trang kiến thức của một mảng nằm dưới URL công cụ của mảng đó:
   `/{mảng}/{cụm}/{trang}`. Breadcrumb = đường dẫn (Trang chủ › Tử vi › Chính tinh › Tử Vi).
2. **Tối đa 3 tầng** sau tên miền; slug là từ khoá tiếng Việt không dấu, không lặp tên cha (tránh
   `/tu-vi/tu-vi-...`), không ID số.
3. **Cụm = câu hỏi người tìm**, tên cụm là danh từ ngắn: `chinh-tinh`, `cung`, `sao-o-cung`, `tu-hoa`, `que`,
   `thap-than`, `nhat-chu`, `menh-theo-nam`, `y-nghia-so`…
4. **Công cụ dân gian theo lịch giữ gốc** (từ khoá gõ trực tiếp, URL ngắn ăn điểm), trang con giữ quy luật năm/ngày.
5. **Một URL – một nội dung:** canonical tự trỏ, URL cũ **308** về URL mới (giữ thứ hạng), không để hai bản.
6. Hub giữ vai rõ: `/kham-pha` = mọi **công cụ**; `/kien-thuc` = **thư viện** (mục lục mọi cụm, trỏ về silo);
   `/ban-than` = hồ sơ cá nhân (không index nội dung riêng).

## 4. Cây URL đề xuất

```
/                                   Trang chủ
├─ /than-so                         Công cụ + trụ Thần số
│  ├─ /than-so/y-nghia-so/{so-1…}          ← /kien-thuc/than-so/*
│  ├─ /than-so/nghe-nghiep/{…}             ← /kien-thuc/nghe-nghiep/*
│  ├─ /than-so/tinh-yeu/{…}                ← /kien-thuc/tinh-yeu/*
│  ├─ /than-so/nam-ca-nhan/{…}             ← /kien-thuc/nam-ca-nhan/*
│  ├─ /than-so/no-nghiep/{…}               ← /kien-thuc/no-nghiep/*
│  └─ /than-so/so-kep/{…}                  ← /kien-thuc/so-kep/*
├─ /hop-doi                         Công cụ + trụ Hợp đôi
│  └─ /hop-doi/cap-so/{…}                  ← /kien-thuc/hop-so/*      (/hop-doi/{mã mời} giữ nguyên, noindex)
├─ /hom-nay                         Công cụ (không cụm con)
├─ /tu-vi                           Công cụ + trụ Tử vi
│  ├─ /tu-vi/chinh-tinh/{sao-…}            ← /kien-thuc/tu-vi/*
│  ├─ /tu-vi/cung/{cung-…}                 ← /kien-thuc/cung-tu-vi/*
│  ├─ /tu-vi/sao-o-cung/{…}                ← /kien-thuc/sao-cung/*
│  ├─ /tu-vi/tu-hoa/{…}                    ← /kien-thuc/tu-hoa/*
│  └─ /tu-vi/la-so-mau/{…}                 ← /la-so-mau/*
├─ /bat-tu                          Công cụ + trụ Bát tự
│  ├─ /bat-tu/thap-than/{…}                ← /kien-thuc/thap-than/*
│  ├─ /bat-tu/nhat-chu/{…}                 ← /kien-thuc/nhat-chu/*
│  └─ /bat-tu/menh-theo-nam/{sinh-nam-1990-menh-gi}   ← /kien-thuc/menh-tuoi/*
├─ /kinh-dich                       Công cụ + trụ Kinh Dịch
│  └─ /kinh-dich/que/{que-1-can…}          ← /kien-thuc/kinh-dich/*
├─ /phong-thuy                      Công cụ + trụ Phong thuỷ
│  ├─ /phong-thuy/huong-hop-tuoi           (giữ)
│  │  └─ /phong-thuy/huong-hop-tuoi/{tuoi-1990-nam}   ← /phong-thuy/tuoi-1990-nam
│  └─ /phong-thuy/huong-xau-nam[/{năm}]    ← /huong-xau-nam[/{năm}]
├─ /xem-ngay-tot[/{ngày}|/thang-{m}-{năm}] (giữ)
├─ /xem-tuoi-lam-nha[/{năm}/tuoi-{ns}]     (giữ)
├─ /tuoi-xong-dat[/{năm}/tuoi-{ns}]        (giữ)
├─ /kham-pha                        Hub công cụ
├─ /kien-thuc                       Hub thư viện: mục lục cụm của mọi mảng (link vào silo)
│  └─ /kien-thuc/{chủ đề cũ}               → 308 về trang cụm mới (vd /kien-thuc/sao-cung → /tu-vi/sao-o-cung)
├─ /tu-dien[#{thuật ngữ}]           (giữ)
├─ /blog, /blog/{slug}, /blog/chuyen-muc/{slug}, /su-kien/{slug}   (giữ)
├─ /gioi-thieu, /tac-gia[/{slug}], /lien-he   (giữ)
└─ /chinh-sach-rieng-tu, /dieu-khoan, /mien-tru-trach-nhiem        (giữ)
```

Trang **cụm** mới (vd `/tu-vi/sao-o-cung`) = trang chủ đề hiện nay (danh sách + mô tả), chỉ đổi chỗ. Trang công cụ
thêm khối "Kiến thức {mảng}" liệt kê các cụm con (liên kết trụ ↔ cụm hai chiều).

Số URL đổi: ≈ **640** (kiến thức 539 + 15 trang chủ đề + 93 phong thuỷ tuổi + 7 lá số mẫu + 5 hướng xấu năm).
Không đổi: công cụ, lịch, tuổi làm nhà, xông đất, blog, pháp lý, hub.

## 5. Phương án

| | A. Giữ URL, sửa cấu trúc bằng liên kết | B. Silo theo mảng (cây ở mục 4) — **khuyến nghị** |
|---|---|---|
| Làm gì | Breadcrumb trỏ về công cụ, công cụ liệt kê cụm, hub rõ vai | Đổi ≈ 640 URL + 308 + mọi phần của A |
| Rủi ro SEO | Không | Thấp–vừa: 2–6 tuần Google chuyển chỉ mục; 308 giữ phần lớn tín hiệu |
| Lợi ích | Một phần (liên kết nội bộ) | Đầy đủ: URL, breadcrumb, thư mục GSC theo mảng, cụm chủ đề rõ |
| Chi phí | ~1 ngày | ~3 ngày (code + test + tài liệu) |

**Khuyến nghị B, làm sớm**: site mới mở công khai 2026-10-08, chưa tích luỹ nhiều thứ hạng → đổi bây giờ rẻ nhất;
càng để lâu càng nhiều liên kết ngoài trỏ vào URL cũ. Nếu Search Console của hieuban.com cho thấy cụm nào đã có nhiều
nhấp (> 50/tuần), có thể để cụm đó lại đợt sau.

## 6. Cách triển khai B (khi được duyệt)

1. **Một nguồn đường dẫn:** `lib/kien-thuc.ts` → `duongTrang`, `duongTuoi`, `CHU_DE` (thêm `mang`/`cum`), sổ trang
   `lib/so-trang.ts` (`MAU_CUM.mau_duong`), `lib/hoang-lich`/`tuoi-dan-gian` không đổi.
2. **Route mới:** `app/{than-so,hop-doi,tu-vi,bat-tu,kinh-dich}/[cum]/[slug]` + `app/{…}/[cum]` (trang cụm),
   `app/phong-thuy/huong-hop-tuoi/[slug]`, `app/phong-thuy/huong-xau-nam`. Engine **không đổi** (chỉ web dựng URL).
3. **308:** bảng chuyển hướng theo mẫu trong `next.config.mjs` (`redirects()`, `permanent: true`) — cả bản `.md`.
   Test e2e: mỗi mẫu cũ → đúng URL mới, không chuỗi chuyển hướng 2 bước.
4. **Cập nhật:** sitemap, canonical, breadcrumb JSON-LD, llms.txt, menu mặc định, liên kết trong KB (`lien_quan`,
   `trang_con`, `lien_ket_ngoai` — engine trả `loai`+`slug`, web dựng URL nên tự đúng), CMS: `mau-cum.mau_duong` và
   `noi-dung-trang.duong` của 15 trang chủ đề (job đồng bộ tự đánh dấu URL cũ "đã gỡ" và tạo URL mới; script chuyển
   nội dung đã sửa sang URL mới).
5. **Sau deploy:** IndexNow gửi danh sách URL mới (workflow có sẵn), gửi lại sitemap ở Search Console, theo dõi
   báo cáo "Trang" 4 tuần. Không cần "Thay đổi địa chỉ" (cùng tên miền).
6. **Kiểm:** `kiem-tra-seo.mjs` 0 lỗi; e2e: URL cũ 308, URL mới 200 + đúng 1 H1 + breadcrumb khớp đường dẫn;
   e2e CMS: khối mẫu cụm áp đúng URL mới.
7. **Quay lui:** gỡ bảng 308 + route mới trong một PR revert (URL cũ vẫn còn code đến khi xoá ở đợt dọn sau 3 tháng).

## 7. Anh cần quyết

1. Chọn **A** hay **B** (khuyến nghị B, làm ngay).
2. Tên cụm như mục 4 có ổn không (vd `sao-o-cung` hay `sao-cung`, `menh-theo-nam` hay `menh-tuoi`)?
3. `/huong-xau-nam` chuyển vào `/phong-thuy/huong-xau-nam` hay giữ ở gốc như 3 công cụ lịch/tuổi?
4. Search Console đã có `sc-domain:hieuban.com` nhưng NotFair chưa chọn property này cho công cụ → vào NotFair
   **Manage accounts → Search Console** (trang `/manage-ads-accounts/search-console`), tích `hieuban.com`. Xong em đọc số
   nhấp/hiển thị theo thư mục để chốt cụm nào chuyển trước.
