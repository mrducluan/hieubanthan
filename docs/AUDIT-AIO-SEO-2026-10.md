# Audit AIO · GEO · SEO kỹ thuật — hieuban.com (2026-10-19)

Hai agent chuyên biệt rà **mã nguồn** (site thật không mở được từ máy rà): (A) AIO/GEO + "agent-ready web",
(B) SEO kỹ thuật + URL + nội dung. Báo cáo gốc đầy đủ ở hai phần dưới; bảng này là trạng thái xử lý.

## Trạng thái

| Mục | Mức | Trạng thái |
|---|---|---|
| robots.txt chặn `/hop-doi/` → chặn luôn 46 URL cụm cặp số (`/hop-doi/cap-so`) đang có trong sitemap | P0 | **Đã sửa** (BLOG-3): `Allow: /hop-doi/cap-so` cho `*` và bot AI trả lời; link mời `/hop-doi/{mã}` vẫn chặn |
| Bộ rà SEO không đối chiếu robots ↔ sitemap | P0 | **Đã sửa**: `scripts/kiem-tra-seo.mjs` báo LỖI khi URL trong sitemap bị Disallow |
| Bài NotFair có 2 thẻ H1 (hero + H1 trong thân bài) | P1 | **Đã sửa**: bộ lọc hạ `h1` → `h2` |
| BlogPosting bài NotFair thiếu `author`, `dateModified` | P1 | **Đã sửa**: author = Ban biên tập (Organization, đúng BM-1/EEAT-1) |
| Bài CMS luôn khai link `.md` kể cả khi tắt bản Markdown / noindex → link 404 | P1 | **Đã sửa** |
| Schema công khai ghi `creativeWorkStatus: "Draft"` (lá số mẫu, tuổi hợp hướng) — lệch BM-1 | P1 | **Đã sửa**: chỉ khai `Published` khi đã thẩm định |
| H2 trang kiến thức (~600 URL) không có neo → AI không dẫn link tới từng mục | P1 | **Đã sửa**: `id` ổn định từ tiêu đề mục |
| Thiếu bản `.md` cho `/xem-ngay-tot/*`, làm nhà, xông đất, hướng xấu năm, blog, công cụ, pháp lý | P1 | Chưa — việc tiếp theo (dữ liệu có sẵn, thêm nhánh vào `app/md/[...duong]`) |
| Ngày cập nhật cả kho dùng chung hằng `CAP_NHAT` | P1 | **Cần chủ dự án quyết** cách sinh ngày thật |
| Trang lập trình gần trùng (sao-ở-cung 9 % phần riêng, tuổi hợp hướng 8 %…) | P1 | **Đã làm (SEO-K)** — xem bảng quyết định dưới |
| Engine lỗi → trang KB trả 404 thay vì 5xx | P1 | Chưa — đề xuất trả 503 khi engine lỗi |
| Link trao đổi NotFair không gắn `rel="sponsored"` | P1 | **Đã làm (SEO-K)**: `rel="sponsored nofollow"` cho link ra ngoài |
| Slug NotFair có dấu | P1 | **Cần quyết**: bí danh ASCII / đề nghị NotFair đổi |
| Mọi trang render động vì nonce CSP (không cache HTML) | P1 | Bộ rà đã đo TTFB (SEO-K); **chờ số production** rồi mới quyết (đụng CSP-2) |
| Danh sách bot AI (thêm YouBot, Amzn-SearchBot…; chặn thêm AI2Bot, Webzio-Extended…) | P1 | Cần đối chiếu tài liệu nhà cung cấp rồi mới thêm |
| Form công cụ không có trong HTML máy chủ; ô ngày sinh thiếu `name`/`autocomplete` | P1 | Chưa — việc tiếp theo |
| P2 (twitter:title kế thừa, sitemap thiếu trang ngày, DefinedTerm `@id`, `sameAs` rỗng, RSS `length="0"`…) | P2 | Xem chi tiết dưới |

### Quyết định của chủ dự án (2026-10-21) → SEO-K đã làm

| Mục chờ quyết | Đã làm |
|---|---|
| (1) Nội dung lập trình mỏng | Khối dùng chung → câu + link `xem_them`; lời đời thường riêng từng ô sao × cung / hoá × cung (KB có sẵn `tuvi_doi_song_kb.json`); 12 vị trí theo chi dời về trang sao; mệnh theo năm thêm mốc riêng theo năm sinh. Phần riêng: sao-ở-cung 0,09 → 0,39 · tứ-hoá 0,10 → 0,24 · mệnh-năm 0,19 → 0,36. `index=false` tự động cho nháp < 20 % (`engine/app/kb/do_rieng.py`) — hiện 0 trang. Viết thêm KB theo hàng đợi GSC: chờ số Search Console (M7). |
| (2) Gộp tuổi hướng nam/nữ + ảnh minh hoạ | 46 trang `/phong-thuy/huong-hop-tuoi/tuoi-{năm}`, 308 một bước từ `-nam/-nu` (cả URL trước QH-URL); CMS migration `seo_k_tuoi_gop`; khối "Cùng tuổi". Ảnh đại diện 1200×630 theo mảng (`/og?mang=`) cho mọi trang kiến thức, tuổi, lá số mẫu, công cụ + `ImageObject`. |
| (3) `rel="sponsored nofollow"` NotFair | Link ra ngoài trong thân bài; link về hieuban.com giữ follow. |
| (4) Bộ nhớ đệm HTML | Chưa đổi CSP (đúng điều kiện "đo TTFB trước"); bộ rà đo TTFB p50/p90/p99 + byte gzip. Chờ số production. |
| (5) Tiêu đề trang chủ, `/blog` | "Thần số học, Tử vi, Bát tự online miễn phí — Hiểu Bản Thân"; "Blog thần số học, Tử vi, phong thuỷ, Kinh Dịch". |
| (6) Phân trang blog, sitemap trang ngày | `/blog/trang/{n}`, `/blog/chuyen-muc/{slug}/trang/{n}` (24 bài/trang); `/sitemap-ngay.xml` (−7…+400 ngày) khai trong robots. |
| (7) Schema E-E-A-T, sameAs, từ khoá | `about` nối Wikipedia; WebApplication từng công cụ; WebPage cho làm nhà/xông đất/hướng xấu/ngày tốt; DefinedTerm `@id`; lá số mẫu author = ban biên tập; cụm kiến thức đủ OG/Twitter; sameAs qua env (chờ link thật — VIEC-CUA-ANH 4i); `TU_KHOA_SITE`. Bộ rà báo lỗi Article thiếu author/publisher/image hoặc "Draft". |

---

## Phần A — AIO / GEO / agent-ready web

# Rà AIO/GEO và độ sẵn sàng cho agent — hieuban.com (theo mã nguồn, 2026-10-19)

Phạm vi: chỉ đọc mã `web/`, `engine/`, `cms/` (bản chạy thật không truy cập được từ container). Không sửa tệp nào trong repo.
Các quyết định đã chốt được giữ nguyên (BM-1, BM-2, SEO-D, QH-URL, EEAT-1, GN-1, CSP-2, BLOG-1). Chỗ nào nên xem lại thì ghi rõ là **đề xuất**.

Ghi chú: `web/package.json:25` đang dùng `next` **16.3.8** (proxy.ts thay middleware.ts), còn CLAUDE.md vẫn ghi "Next 15.5.27". Tài liệu đã cũ, nên sửa lại cho khớp.

---

## 1. Bảng điểm

| # | Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | robots.txt tách bot trả lời / bot huấn luyện (BM-2) | Một phần | `web/app/robots.ts:9-20`: đã tách nhóm. **Nhưng** `CHAN` có `"/hop-doi/"`, chặn luôn cụm silo `/hop-doi/cap-so/*` (P0-1). Danh sách bot thiếu vài UA của năm 2025–26 (P1-6) |
| 2 | Sitemap phủ đủ, lastmod đúng | Một phần | `web/app/sitemap.ts`: phủ tốt (kiến thức, blog, chuyên mục, sự kiện, lịch). `lastModified` của trang KB đều là hằng `CAP_NHAT = "2026-10-07"` (`engine/app/kb/trang.py:23,359`). Trang tĩnh, trang cụm, trang tuổi và lá số mẫu không có lastmod (P1-4) |
| 3 | llms.txt | Đạt (có lỗ hổng) | `web/lib/llms.ts`: đúng tinh thần BM-2, có mục công cụ, "trả lời nhanh", mẫu URL cho cụm lớn. Nhưng llms.txt đang dẫn bot tới `/hop-doi/cap-so`, chỗ robots lại chặn (P0-1). Chưa có `/blog`, RSS, `/su-kien` (P2) |
| 4 | Bản Markdown `.md` (SEO-D) | Một phần | Có cho: `/index.md`, `/kien-thuc`, `/tu-dien`, mọi cụm/trang KB theo silo, `/phong-thuy/huong-hop-tuoi[/…]`, bài blog CMS (`web/app/md/[...duong]/route.ts`). **Chưa có** cho: bài NotFair, `/blog`, chuyên mục, `/xem-ngay-tot` (ngày/tháng), `/xem-tuoi-lam-nha/*`, `/tuoi-xong-dat/*`, `/phong-thuy/huong-xau-nam/*`, `/tu-vi/la-so-mau/*`, `/su-kien/*`, trang công cụ, `/hom-nay`, `/tac-gia`, trang pháp lý (P1-1) |
| 5 | `<link rel=alternate type=text/markdown>` khớp với bản .md có thật | Một phần | Bài CMS luôn khai `.md` (`web/app/blog/[slug]/page.tsx:35`), kể cả khi CMS tắt `ban_markdown`. Lúc đó link trả 404 (P1-2) |
| 6 | Header HTTP `Link` + content negotiation `Accept: text/markdown` | Chưa | `web/proxy.ts`: không xét `Accept`, HTML không có header `Link: <…md>; rel="alternate"`. Bản .md có `Link: rel=canonical` (`web/lib/markdown.ts:85-92`), phần này tốt |
| 7 | Khối trả lời trước ("Trả lời nhanh") | Đạt / Một phần | Có ở trang KB (`TrangKienThuc.tsx:124-127`), trang tuổi hợp hướng, bài CMS. Chưa có ở trang làm nhà, xông đất, hướng xấu năm, lá số mẫu, ngày tốt (P2-1) |
| 8 | Neo `id` trên H2 để deep-link | Một phần | Bài CMS có (`lib/cms-html.ts:73-82`). Trang tuổi có. **Trang KB, loại trang nhiều nhất, thì H2 nội dung không có id** (`TrangKienThuc.tsx:137`); trang cụm cũng không (`TrangChuDe.tsx`) (P1-3) |
| 9 | Ngày đăng / sửa (hiển thị + schema) | Một phần | Trang KB: `datePublished = dateModified = cap_nhat`, cùng một hằng (`TrangKienThuc.tsx:66-67`). Lá số mẫu và tuổi hợp hướng: Article **không có ngày** (`la-so-mau/[slug]/page.tsx:42-45`, `huong-hop-tuoi/[slug]/page.tsx:56-61`). NotFair: thiếu `dateModified` (`blog/[slug]/page.tsx:80-92`) |
| 10 | E-E-A-T tác giả / thẩm định (EEAT-1, BM-1) | Đạt / Một phần | Trang KB, bài CMS: đúng vai trò, có `reviewedBy`/`lastReviewed`. Còn sót: `creativeWorkStatus: "Draft"` công khai ở lá số mẫu và tuổi hợp hướng (P1-5). Bài NotFair không có author. Person `sameAs: []` (`lib/chuyen-gia.ts:34`) |
| 11 | JSON-LD toàn site (Organization, WebSite, WebApplication) | Đạt | `web/app/layout.tsx:81`, `web/lib/seo.ts:21-80`: dùng `@id` thống nhất, URL tuyệt đối |
| 12 | JSON-LD theo khuôn trang | Một phần | Article+WebPage+FAQ+Breadcrumb (KB) ✓ · CollectionPage+ItemList (cụm) ✓ · DefinedTermSet ✓ nhưng DefinedTerm không có `url`/`@id` (P2-3) · làm nhà / xông đất chỉ có Breadcrumb+FAQ, không có WebPage/Article (P2-2) · công cụ: WebPage + `UseAction` không có EntryPoint, không có WebApplication riêng (P2-4) |
| 13 | Agent "Operator": form công cụ | Một phần | Có nhãn (`NhapHoSo.tsx:143-165`), nút `type=submit`, `role=alert`. Nhưng: form **không có trong HTML máy chủ** (`lib/hoso.ts:105` server snapshot = `undefined` → khung chờ, `CuaVao.tsx:18`), ô ngày/tháng/năm thiếu `name`/`autocomplete`, không có URL hay tham số nào để mở thẳng kết quả (P1-7, P2-5) |
| 14 | Render: metadata trong `<head>` cho bot (`htmlLimitedBots`) | Đạt | `web/next.config.mjs:47`: regex `bot|crawl|spider|…|claude|perplexity` khớp mọi UA trả lời đang mở (ChatGPT-User có "openai.com/bot", MistralAI-User có ".../robots", meta-externalfetcher có "crawler") |
| 15 | H1 + nội dung chính trong HTML máy chủ | Đạt | Trang KB, tuổi, lịch là Server Component hoặc client có `banDau` từ máy chủ. Trang công cụ có H1 + `GioiThieuCongCu` dựng ở máy chủ |
| 16 | Kích thước phản hồi / TTFB khi mọi trang động (nonce CSP) | Chưa đo | Không chạy được bản build. `scripts/do-hieu-nang.mjs` chỉ đo JS/CSS/font, chưa đo byte HTML + payload RSC. Mọi trang render động (CSP-2), nên HTML không có cache CDN (P2-7) |
| 17 | RSS | Đạt | `web/app/blog/rss.xml/route.ts`, có khai `application/rss+xml` ở `/blog` (`blog/page.tsx:15`) |
| 18 | Công cụ rà tự động bắt lỗi AIO | Một phần | `scripts/kiem-tra-seo.mjs` chưa đối chiếu sitemap với robots.txt (đó là lý do P0-1 lọt), chưa kiểm alternate `.md` → 200 |

---

## 2. Phát hiện theo mức ưu tiên

### P0-1 — robots.txt chặn cả cụm silo `/hop-doi/cap-so` (45+ trang "cặp số"), sitemap và llms.txt lại trỏ vào đó

- Bằng chứng: `web/app/robots.ts:9` `CHAN = [..., "/hop-doi/", ...]`. Danh sách này áp cho cả `*` lẫn nhóm `BOT_AI_TRA_LOI` (`robots.ts:25-26`). Sau QH-URL (2026-10-19), cụm `hop-so` dời sang `/hop-doi/cap-so` (`web/lib/chuyen-huong.json`, khoá `"hop-so"`). `Disallow: /hop-doi/` khớp tiền tố `/hop-doi/cap-so`, `/hop-doi/cap-so/*` và `/hop-doi/cap-so.md`.
- Hậu quả: Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot đều không được vào cụm này. Sitemap vẫn nộp các URL đó (`app/sitemap.ts:33,43`), nên GSC sẽ báo "Đã gửi URL bị robots.txt chặn". llms.txt (`lib/llms.ts`, dòng "Số chủ đạo X … hợp số mấy?" → `/hop-doi/cap-so`) hướng AI tới một chỗ AI không được đọc. Redirect 308 từ `/kien-thuc/hop-so/*` cũng dẫn về đích bị chặn, nên tín hiệu xếp hạng cũ mất luôn.
- Mục đích ban đầu của `/hop-doi/` là chặn link mời `/hop-doi/[ma]`. Trang này đã có `robots: { index: false }` (`app/hop-doi/[ma]/page.tsx:18`), nên không cần chặn bằng robots nữa. Chặn bằng robots còn làm Google không đọc được thẻ noindex.
- Cách sửa (nhỏ, an toàn): trong `robots.ts`, bỏ `"/hop-doi/"` khỏi `CHAN`. Nếu vẫn muốn chặn, thêm `allow: ["/", "/hop-doi/cap-so"]` (luật dài hơn thắng theo RFC 9309 / Google). Thêm kiểm tra vào `scripts/kiem-tra-seo.mjs`: mỗi URL trong sitemap không được khớp `Disallow` nào của nhóm `*`. Thêm một assert vào `e2e/quy-hoach-url.spec.ts` hoặc `e2e/seo.spec.ts`.

### P1-1 — Nhiều họ URL có giá trị cho câu trả lời AI chưa có bản `.md`

- Bằng chứng: `web/app/md/[...duong]/route.ts:26-65` chỉ xử lý index, tu-dien, huong-hop-tuoi, blog (CMS), kien-thuc, `{mảng}/{cụm}[/{trang}]` theo `khoaTheoDuong`. Còn lại đều 404.
- Thiếu và đáng làm (xếp theo lượng câu hỏi "trả lời nhanh"):
  1. `/xem-ngay-tot/{yyyy-mm-dd}` và `/xem-ngay-tot/thang-M-YYYY`: câu "hôm nay tốt hay xấu" là loại AI hay trích nhất. Dữ liệu đã có sẵn (`ngayTotCongKhai`, `thangCongKhai` trong `lib/hoang-lich.ts`).
  2. `/xem-tuoi-lam-nha/{năm}/tuoi-{ns}`, `/tuoi-xong-dat/{năm}/tuoi-{ns}`, `/phong-thuy/huong-xau-nam[/{năm}]`: dữ liệu đã có (`lamNhaCongKhai`… trong `lib/tuoi-dan-gian.ts`).
  3. `/tu-vi/la-so-mau[/{slug}]`.
  4. Bài NotFair `/blog/{slug}`: route chỉ nhận bài CMS (`route.ts:34-48`). Có thể dùng `sanitizeNotFairArticleHtml` + `htmlSangMd`.
  5. `/blog`, `/blog/chuyen-muc/{slug}` (dạng danh sách), `/su-kien/{slug}`, `/tac-gia/duc-luan`, `/gioi-thieu` và 3 trang pháp lý (agent cần đọc Điều khoản / Miễn trừ).
  6. Trang trụ công cụ (`/than-so`, `/tu-vi`…): mirror phần `GioiThieuCongCu` + `CumKienThucTru` (giới thiệu, hỏi đáp, link cụm).
- Cách sửa: thêm nhánh vào `route.ts` + hàm `mdNgay`, `mdLamNha`… vào `lib/markdown.ts` (chỉ định dạng lại dữ liệu engine, không viết nghĩa mới). Thêm `alternates.types["text/markdown"]` qua tham số `md` của `metaTrang()` (`lib/seo.ts:111-120`, đã có sẵn). Mở rộng `GOC_MD` trong `scripts/kiem-tra-seo.mjs:12`.

### P1-2 — Alternate `.md` của bài CMS có thể trỏ tới 404; bản .md bài blog thiếu URL / tác giả / ngày

- `web/app/blog/[slug]/page.tsx:35` luôn khai `types: {"text/markdown": …}`, trong khi `route.ts:37` trả 404 khi `!tn.ban_markdown || c.bai.noindex`. Sửa: trong `generateMetadata`, gọi `tinhNangCms()` và chỉ khai khi `ban_markdown && !noindex`.
- Bản .md bài blog (`route.ts:39-46`) không có dòng `URL:`, tác giả/chủ biên, ngày đăng/cập nhật như bản .md KB (`lib/markdown.ts:31-33`). Agent trích sẽ thiếu ngữ cảnh và không biết dẫn link nào. Sửa: thêm `URL: …`, dòng ký tên theo BM-1 (giống `BaiCms.tsx:136-150`), `Đăng: …  · Cập nhật: …`.
- `htmlSangMd` (`lib/cms-html.ts:90`) làm vỡ bảng: `</tr>` thành xuống dòng, các ô `<td>` dính liền nhau, mất cấu trúc. Bảng lại là dạng AI trích tốt nhất. Sửa: chuyển `<table>` sang bảng Markdown GFM (`| a | b |`, dòng `|---|`).

### P1-3 — Trang KB (loại trang nhiều nhất, khoảng 600 URL) không có neo trên H2 nội dung

- `web/components/kien-thuc/TrangKienThuc.tsx:137` `<h2 className="text-2xl">{m.tieu_de}</h2>` không có `id`. Chỉ `hoi-dap`, `lien-quan`, `trang-con` có. Hệ quả: AI không dẫn được `…#tinh-cam`, Google không tạo được link "Chuyển tới" hay đánh dấu đoạn trích.
- Sửa: dùng lại hàm `idTu` của `lib/cms-html.ts:21` (tách ra `lib/utils.ts` hoặc export), gắn `id={idTu(m.tieu_de)}` + `className="scroll-mt-24"`, chống trùng như `locHtmlCms`. Bản .md có thể giữ nguyên. Nên gắn thêm id cho câu hỏi FAQ (`<dt id=…>`) và H2 của `TrangChuDe.tsx`.

### P1-4 — Ngày cập nhật và lastmod không phản ánh thay đổi thật

- `engine/app/kb/trang.py:23` `CAP_NHAT = "2026-10-07"`; `:359` lấy `max(CAP_NHAT, ngày thẩm định)`. Kết quả: cả kho cùng hiện "Cập nhật 07/10/2026", JSON-LD `datePublished = dateModified` (`TrangKienThuc.tsx:66-67`), sitemap lastmod giống hệt nhau. Google bỏ qua lastmod khi thấy nó không đáng tin; AI không phân biệt được trang mới sửa. Khối CMS ghi đè (ND-5) đổi nội dung mà ngày vẫn không đổi.
- Sửa (dữ liệu, không đổi phép tính nên không tăng `ENGINE_VERSION`): mỗi mục KB có `ngay_dang` / `cap_nhat` riêng, tính từ băm nội dung lúc dựng hoặc ghi vào sổ như `tham_dinh.json`. Web lấy `max(cap_nhat KB, updatedAt khối CMS)`. Trang tĩnh, trang cụm, trang tuổi và lá số mẫu trong `sitemap.ts` cũng nên có `lastModified`. Đây là việc thêm trường vào JSON KB, **cần chủ dự án duyệt** cách sinh ngày.

### P1-5 — Schema công khai báo "Draft", lệch BM-1

- `app/tu-vi/la-so-mau/[slug]/page.tsx:44` `creativeWorkStatus: "Draft"`; `app/phong-thuy/huong-hop-tuoi/[slug]/page.tsx:60` `"Draft"` khi chưa duyệt. BM-1 đã bỏ nhãn nháp/AI trên bài, và `TrangKienThuc.tsx:79` đã làm đúng: chưa duyệt thì không khai. Hiện máy đọc được nhãn "bản nháp", nên dễ bị hạ độ tin khi trích.
- Sửa: bỏ hẳn `creativeWorkStatus` khi chưa duyệt (giống TrangKienThuc). Ở hai trang này cũng thêm `datePublished`/`dateModified`, `image` (la-so-mau thiếu), và `author` theo khuôn BM-1 (`name: "Ban biên tập Hiểu Bản Thân"`, hiện đang là `name: TEN_SITE`) + `editor` = chủ biên.

### P1-6 — Danh sách bot cần cập nhật cho 2026 (giữ đúng tinh thần BM-2)

Hiện có: trả lời = OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, DuckAssistBot, MistralAI-User, meta-externalfetcher; huấn luyện = GPTBot, ClaudeBot, anthropic-ai, Google-Extended, Applebot-Extended, CCBot, Bytespider, meta-externalagent, cohere-ai, cohere-training-data-crawler, Diffbot, Omgilibot, Timpibot, ImagesiftBot, PanguBot, Amazonbot.

Đề xuất bổ sung. Tên UA cần đối chiếu lại với tài liệu nhà cung cấp trước khi merge; container không mở mạng nên chưa kiểm được:
- Nhóm trả lời (mở): `YouBot` (You.com), `Amzn-SearchBot` và `Amzn-User` (Amazon tách khỏi Amazonbot từ 2025: tìm kiếm/Alexa+ và do người dùng gọi), `Gemini-Deep-Research` (do người dùng gọi), `PhindBot`, `Applebot` (thật ra đã được mở qua `*`).
- Nhóm huấn luyện (chặn): `Claude-Web` (UA cũ của Anthropic), `AI2Bot` / `Ai2Bot-Dolma`, `FacebookBot`, `Webzio-Extended`, `img2dataset`, `VelenPublicWebCrawler`, `Kangaroo Bot`, `ICC-Crawler`, `TikTokSpider`, `YandexAdditional` / `YandexAdditionalBot`, `Brightbot`.
- Cần chủ dự án chọn: `GoogleOther` (Google dùng cho nghiên cứu/sản phẩm khác, không phải Search). Chặn thì an toàn với mục tiêu BM-2 và không ảnh hưởng Googlebot. `Google-CloudVertexBot` chỉ chạy khi chính chủ site cấu hình Vertex AI Search, nên bỏ qua.
- Ghi chú: `"google-extended"` trong `htmlLimitedBots` vô hại nhưng thừa (Google-Extended chỉ là token robots, không phải UA). `host:` trong robots chỉ Yandex đọc, vô hại.
- Sửa: cập nhật hai mảng trong `web/app/robots.ts:11-20`. Có thể thêm test liệt kê UA bắt buộc.

### P1-7 — Agent "Operator": form không có trong HTML máy chủ và không có cách mở thẳng kết quả

- `web/lib/hoso.ts:105` `useSyncExternalStore(dangKy, doc, () => undefined)`, nên trên máy chủ và lúc chưa hydrate, `CuaVao` chỉ render khung chờ (`components/hoso/CuaVao.tsx:18`). Agent đọc HTML thô (Claude-User / ChatGPT-User fetch không chạy JS), hoặc trình duyệt tắt JS, sẽ không thấy form.
- Ô ngày/tháng/năm (`components/hoso/NhapHoSo.tsx:161-165`) chỉ có `aria-label`, không có `name` hay `autoComplete="bday-day|bday-month|bday-year"`. Ô họ tên có `name`. Agent và trình điền tự động dựa vào các thuộc tính này. Việc tự nhảy focus khi đủ 2 chữ số có thể làm agent gõ lệch ô.
- Sửa nhỏ: thêm `name="ngay-sinh-ngay"…` + `autoComplete`. Trang công cụ: render sẵn form ở máy chủ (server snapshot trả `null` thay vì `undefined`, chấp nhận chớp một nhịp với người đã có hồ sơ), hoặc dùng `<noscript>` giải thích.
- Việc lớn (cần duyệt): xem mục 3b.

### P2

- **P2-1 — "Trả lời nhanh" chưa có ở trang làm nhà, xông đất, hướng xấu năm, lá số mẫu, trang ngày tốt.** Câu kết luận đã có trong dữ liệu (`d.ket_luan.chu` dùng cho FAQ ở `xem-tuoi-lam-nha/[nam]/[tuoi]/page.tsx:39`). Nên đặt nó thành khối `section aria-label="Trả lời nhanh"` ngay dưới H1, đúng câu hỏi trong tiêu đề.
- **P2-2 — Trang làm nhà / xông đất / hướng xấu năm không có node WebPage/Article** (chỉ Breadcrumb + FAQ). Nên thêm `WebPage` có `@id`, `dateModified`, `isPartOf`, `about`. Thêm dòng "Cập nhật"/"Năm áp dụng" hiển thị trên trang.
- **P2-3 — DefinedTerm không có `url`/`@id`** (`app/tu-dien/page.tsx:40`) dù trang đã có neo `id={m.ma}` (`:70`). Thêm `"@id": `${urlDayDu("/tu-dien")}#${m.ma}``, `url` cùng giá trị.
- **P2-4 — Schema công cụ:** `GioiThieuCongCu.tsx` dùng `potentialAction: UseAction` với `target` là chuỗi. Nên đổi thành `WebApplication` riêng cho từng công cụ (`@id` = `{url}#ung-dung`, `applicationCategory`, `isAccessibleForFree`, `featureList`, `offers` 0đ) và `EntryPoint` (`urlTemplate`) khi có URL tham số (mục 3b). `ldUngDung()` toàn site giữ nguyên.
- **P2-5 — Nút radio tự làm** (`NhapHoSo.tsx:151-157`): `role=radio` trên `<button>` chưa có phím mũi tên / `tabIndex` vòng. Dùng `<input type=radio>` + label hoặc Radix RadioGroup (đã có shadcn/Radix trong danh sách được duyệt, nên kiểm có sẵn gói chưa trước khi thêm).
- **P2-6 — Link `llms.txt` trong `<head>` mất trên hầu hết trang.** `app/layout.tsx:57` khai `alternates.types["text/plain"]`, nhưng metadata Next ghi đè nông: trang nào khai `alternates` (canonical) là mất link này. Sửa: thêm `"text/plain": "/llms.txt"` vào `metaTrang()` và các `alternates` tự viết, hoặc phát header `Link: </llms.txt>; rel="describedby"` (đặt ở `next.config.mjs` headers, tiện hơn). llms.txt cũng nên có `/blog`, `/blog/rss.xml`, `/su-kien` (khi có trang còn hạn).
- **P2-7 — Kích thước phản hồi và TTFB:** mọi trang render động do nonce (CSP-2), nên HTML không được CDN cache; payload RSC cũng nhân đôi chữ trong HTML. Bot trả lời có ngưỡng thời gian ngắn. Nên thêm vào `scripts/kiem-tra-seo.mjs`: đo byte HTML (gzip), TTFB, cảnh báo khi > ~300 KB hoặc > 1,5 s, và cảnh báo khi chữ "Trả lời nhanh" nằm sau byte ~100 KB.
- **P2-8 — Bài NotFair:** BlogPosting không có `author`, `dateModified` (thư viện không có `updated_at`, nên dùng `published_at`), breadcrumb hiển thị thiếu "Trang chủ" (`blog/[slug]/page.tsx:93-97`). Ai là `author` thì cần chủ dự án quyết (xem 3b).
- **P2-9 — Person `sameAs: []`** (`web/lib/chuyen-gia.ts:34`), Organization `sameAs` chỉ có khi đặt env (`lib/van-hanh.ts:41`). Thiếu liên kết thực thể thì AI khó nhận diện "Đức Luân". Đây là việc của chủ dự án: cung cấp hồ sơ công khai (Facebook/YouTube/LinkedIn…) và đặt env mạng xã hội.
- **P2-10 — Bản .md trả 404 dạng text cho trang không có mirror.** Có thể trả `404` kèm `Link: <html>; rel="alternate"` hoặc một dòng "Xem bản HTML: …" để agent không bị cụt. Không bắt buộc.

---

## 3. Phân loại hành động

### (a) Sửa nhỏ, an toàn, làm ngay được trong code (không đụng quyết định đã chốt)

1. `web/app/robots.ts`: bỏ `"/hop-doi/"` khỏi `CHAN` hoặc thêm allow `/hop-doi/cap-so` (P0-1). Bổ sung UA đã xác minh (P1-6).
2. `web/scripts/kiem-tra-seo.mjs`: đối chiếu sitemap ↔ robots, kiểm alternate `.md` → 200, đo byte HTML (P0-1, P1-2, P2-7).
3. `web/components/kien-thuc/TrangKienThuc.tsx` (+ `TrangChuDe.tsx`): gắn `id` cho H2/FAQ (P1-3).
4. `web/app/blog/[slug]/page.tsx`: chỉ khai alternate `.md` khi `ban_markdown && !noindex`. NotFair: thêm `dateModified`, breadcrumb "Trang chủ" (P1-2, P2-8).
5. `web/app/md/[...duong]/route.ts`: bản .md bài blog thêm `URL:`, ký tên BM-1, ngày (P1-2). `web/lib/cms-html.ts` `htmlSangMd`: bảng sang GFM.
6. `app/tu-vi/la-so-mau/[slug]/page.tsx`, `app/phong-thuy/huong-hop-tuoi/[slug]/page.tsx`: bỏ `creativeWorkStatus: "Draft"`, thêm ngày/ảnh/author "Ban biên tập…" (P1-5).
7. `app/tu-dien/page.tsx`: `@id`/`url` cho DefinedTerm (P2-3).
8. `components/hoso/NhapHoSo.tsx`: `name` + `autoComplete` cho ô ngày sinh (P1-7).
9. Bản .md cho `/xem-ngay-tot/*`, `/xem-tuoi-lam-nha/*`, `/tuoi-xong-dat/*`, `/phong-thuy/huong-xau-nam/*`, `/tu-vi/la-so-mau/*`, bài NotFair, trang pháp lý (P1-1). Chỉ định dạng lại dữ liệu đã có, đúng khuôn SEO-D. Đây là mở rộng SEO-D chứ không phải quyết định mới, nhưng diện rộng, nên báo chủ dự án trước khi làm.
10. "Trả lời nhanh" + WebPage cho trang tuổi / hướng xấu năm (P2-1, P2-2). Câu đã có trong dữ liệu engine.
11. Link llms.txt trong `metaTrang()` hoặc header `Link` (P2-6). Sửa CLAUDE.md dòng "Next 15.5.27" cho khớp `next@16.3.8`.

### (b) Việc lớn cần chủ dự án quyết

1. **Content negotiation `Accept: text/markdown`** trong `web/proxy.ts`: khi `Accept` ưu tiên `text/markdown` (không có `text/html`) và đường dẫn có mirror, rewrite sang `/md/…` + `Vary: Accept`. Thêm header HTTP `Link: <…md>; rel="alternate"; type="text/markdown"` vào HTML. Đây là mở rộng SEO-D. Rủi ro thấp nhưng chạm proxy (CSP-2) và cache, nên cần duyệt.
2. **Agent mở thẳng kết quả công cụ (Operator):** ví dụ `/than-so?ngay=1990-05-12&ten=…`, `/xem-ngay-tot/2026-10-20?tuoi=1990`. Đụng nguyên tắc riêng tư: ngày sinh lọt vào URL thì cũng lọt vào log, GTM/GA (2026-10-09 đã bật GA mặc định) và lịch sử chia sẻ. Có ba phương án: (i) chỉ cho tham số **không định danh** (năm sinh, giới tính: trang tuổi/hướng đã làm vậy, mở rộng cho `/xem-ngay-tot`); (ii) tham số ngày sinh đầy đủ nhưng `noindex`, không ghi analytics, đọc ở client qua `#fragment` (không gửi lên máy chủ hay GA); (iii) WebMCP / công cụ khai báo (`navigator.modelContext`, form `toolname`), để agent gọi hàm tính mà không cần URL. Cần chủ dự án chọn.
3. **API công khai cho agent** (OpenAPI read-only cho thần số, lịch ngày): hiện `/api/` bị chặn robots, không tài liệu. Phải tính hạn mức (SEC-1, RL-1), BM-1 (không lộ engine/thư viện) và chi phí. Đề xuất ở mức thử: chỉ `/api/lich` (không dữ liệu cá nhân).
4. **Ngày đăng/cập nhật thật cho KB** (P1-4): thêm trường vào JSON KB hoặc sổ ngày theo băm nội dung. Không đổi phép tính, nhưng là thay đổi dữ liệu KB.
5. **Bài NotFair (BLOG-1):** ghi `author` là ai (bên đối tác? "Ban biên tập" thì không đúng sự thật theo tinh thần EEAT-1), có cho bản .md không, có vào llms.txt không. Đề xuất: không đưa vào llms.txt, author = Organization nguồn bài như thoả thuận đối tác, có bản .md (vì HTML đã công khai).
6. **Hiệu năng HTML cho bot** (P2-7): đề xuất xem lại một phần CSP-2. Với trang kiến thức tĩnh có thể dùng CSP theo hash hoặc `'strict-dynamic'` + script tĩnh để bật ISR/CDN. Chỉ làm sau khi đo, vì đổi CSP là quyết định đã chốt.
7. **`GoogleOther`**: chặn hay mở (P1-6). Và đã cân nhắc có nên chặn `Amazonbot` không, khi Alexa+ lấy câu trả lời qua Amzn-SearchBot (cần xác minh).
8. **E-E-A-T:** cung cấp `sameAs` cho Đức Luân và Organization (P2-9). Tiếp tục hàng đợi thẩm định GN-1 theo GSC để nhiều trang có `reviewedBy` hơn.

---

## 4. Điểm đã làm tốt (giữ nguyên)

- Tách bot trả lời / bot huấn luyện rõ ràng, có chú thích lý do (BM-2). Chỉ cần sửa lỗi P0-1.
- llms.txt viết đúng mục đích "dẫn người dùng bấm về": có mục công cụ, câu hỏi hay gặp, mẫu URL cho cụm lớn, phần Optional.
- Bản .md có `Link: rel=canonical` về HTML, cache `s-maxage`, nội dung trùng khớp HTML (kể cả khối CMS ND-5).
- `htmlLimitedBots` phủ rộng, nên metadata nằm trong `<head>` cho mọi bot. H1 và nội dung chính dựng ở máy chủ.
- `@graph` dùng `@id` nhất quán (`#to-chuc`, `#website`, `#ung-dung`, `#bai`, `#trang`, `#nguoi`). EEAT-1 áp đúng: tác giả là người chỉ khi chuyên gia viết hoặc thẩm định, có `reviewedBy`/`lastReviewed`.
- Bài CMS: H2 có id + mục lục, "Trả lời nhanh", FAQPage, `citation`, ngày đăng/cập nhật hiển thị đúng, RSS.
- Redirect 308 QH-URL đi kèm cả bản `.md`, chỉ một bước.


---

## Phần B — SEO kỹ thuật, URL, nội dung

# Rà soát SEO kỹ thuật hieuban.com — URL & chuẩn hoá nội dung

Ngày rà: 2026-10-19 · Bản mã: `1e1b73f` (QH-URL + ND-2…ND-5) · Cách làm: **chỉ đọc mã nguồn**, không truy cập được site thật (container chặn mạng ra ngoài). Số liệu nội dung lấy bằng cách gọi trực tiếp hàm dựng trang của engine (`app/kb/trang.py`, `luangiai/phongthuy_tuoi.py`) trong một venv nháp, không sửa repo. Kích thước JS lấy từ `.next/` có sẵn trong repo (bản build **09/10**, trước NX16/QH-URL → chỉ để tham khảo thứ bậc).

Tôn trọng các quyết định đã chốt (QH-URL, SEO-E, BM-1/2, EEAT-1, BLOG-1/2, ND, CSP-2). Chỗ nào tôi nghĩ nên đổi thì ghi rõ là **ĐỀ XUẤT cần chủ dự án duyệt**.

---

## 1. Bảng điểm

| Hạng mục | Kết quả | Bằng chứng chính |
|---|---|---|
| robots.txt khớp sitemap | **Chưa** | `web/app/robots.ts:9` chặn `/hop-doi/` → chặn luôn 46 URL `/hop-doi/cap-so[/…]` đang nằm trong sitemap (`web/app/sitemap.ts:30,47`) |
| Bảng 308 QH-URL (một bước, không vòng) | Đạt | `web/next.config.mjs:6-18`, `web/lib/chuyen-huong.json`; không còn link nội bộ nào trỏ URL cũ (grep `web/app`, `web/components`, `engine/app`) |
| Canonical = sitemap = link nội bộ | Đạt (KB, tuổi, lịch) · Một phần (blog) | KB: `duongTrang` dùng chung ở `TrangKienThuc.tsx:34,53`, `sitemap.ts:47`; blog CMS: JSON-LD dùng `/blog/${slug}` thô (`components/blog/BaiCms.tsx:62`) còn canonical dùng `duongBlog` mã hoá |
| Chuẩn hoá slug (ASCII, chữ thường, không dấu) | Đạt (engine, CMS) · Chưa (NotFair) | engine `_slug` bỏ dấu + `đ→d` (`engine/app/kb/trang.py:36-39`); NotFair giữ dấu, chỉ giải mã/NFC (`web/lib/blog-gop.ts:57-62`) |
| Dấu `/` cuối, chữ hoa | Đạt | Next mặc định 308 bỏ `/`; engine tra slug khớp tuyệt đối → chữ hoa = 404, không sinh bản trùng |
| noindex đúng chỗ | Đạt | cửa sổ ngày/tháng/tuổi (`xem-ngay-tot/[duong]/page.tsx:40,45`, `xem-tuoi-lam-nha/[nam]/[tuoi]/page.tsx:26`, `tuoi-xong-dat/[nam]/[tuoi]/page.tsx:25`), chuyên mục trống, trang cá nhân |
| Trang mồ côi / thiếu trong sitemap | Một phần | ~407 trang ngày index nhưng không có trong sitemap; 46 trang xông đất năm 2026 chỉ có trong sitemap, không có link; `/ban-than`, `/ung-ho` index nhưng thiếu trong sitemap |
| Title/description (SEO-E) | Đạt | 539 trang KB: không trùng title, không trùng description; title 32–70 ký tự; mô tả 61–158 |
| OG/Twitter đủ bộ | Một phần | `TrangChuDe.tsx:24-25` (15 trang cụm) và `ban-than`, `hop-doi/[ma]`, `the/[ma]`: không khai `twitter` → **kế thừa twitter của layout** (tiêu đề trang chủ); og thiếu `type/locale/site_name` |
| Đúng 1 H1 | Đạt (KB, CMS) · Rủi ro (NotFair) | `lib/notfair-article.ts:12,18` cho phép `<h1>` trong thân bài, `NotFairPostHero` đã có H1 → 2 H1; CSS còn định kiểu sẵn `.articleContent h1` (`notfair-article.module.css:14,25`) |
| Nội dung lập trình (programmatic) đủ khác biệt | **Chưa** | tỷ lệ cụm 6 từ riêng của từng trang: sao-ở-cung **9 %**, tứ-hoá-ở-cung **10 %**, tuổi-hợp-hướng **8 %**, mệnh-theo-năm **19 %**, số kép 27 %, cặp số 30 % (chi tiết mục 3) |
| Silo, breadcrumb theo URL | Đạt · Một phần | KB/cụm/trụ: breadcrumb = đường dẫn (`TrangKienThuc.tsx:96-111`, `TrangChuDe.tsx:40-42`); `/xem-tuoi-lam-nha/{năm}` và `/tuoi-xong-dat/{năm}` không có trang → lỗ trong cây URL |
| Link chéo theo năm sinh | Chưa | trang làm nhà / xông đất không link sang mệnh theo năm + hướng hợp tuổi cùng năm sinh (grep `components/tuoi`, `app/xem-tuoi-lam-nha`) |
| Engine lỗi → mã HTTP đúng | **Chưa** | `lib/kien-thuc.ts:251-262` gộp "engine sập" và "không có trang" thành `null` → `notFound()` (404) cho ~600 trang; trang cụm trả 200 rỗng (`TrangChuDe.tsx:47`) |
| Blog: schema, ảnh, phân trang | Một phần | BlogPosting NotFair thiếu `author`, `dateModified` (`app/blog/[slug]/page.tsx:79-92`); ảnh hero không `priority` (`:101-103`); `/blog` không phân trang |
| Hiệu năng / bộ nhớ đệm HTML | Một phần | `layout.tsx:76` đọc `headers()` → mọi trang render động, HTML không cache CDN; `revalidate` ở trang chỉ còn tác dụng cho fetch |
| lang / vi-VN / hreflang | Đạt | `<html lang="vi">`, `og:locale vi_VN`, JSON-LD `inLanguage: vi-VN`, RSS `vi-VN`; một ngôn ngữ → không cần hreflang |
| Dữ liệu có cấu trúc | Đạt · lưu ý nhỏ | JSON-LD hợp lệ về cú pháp; `dateModified`/`datePublished` của 539 trang KB đều là `2026-10-07`; logo Organization là SVG |
| Bộ rà `kiem-tra-seo.mjs` | Một phần | không kiểm robots.txt có chặn URL trong sitemap (dòng 93-96 chỉ kiểm HTTP 200) → lỗi P0 dưới đây lọt qua |

---

## 2. Kiểm kê URL

| Họ route (`web/app`) | Số URL trong sitemap | Nguồn | Ghi chú |
|---|---|---|---|
| Trang tĩnh + công cụ (`TINH`) | 24 | `sitemap.ts:12-16` | thiếu `/ban-than`, `/ung-ho` (đang index) |
| Cụm kiến thức (`CHU_DE`) | 15 | `sitemap.ts:30` | gồm `/hop-doi/cap-so` (**bị robots chặn**) |
| `/phong-thuy/huong-hop-tuoi` | 1 | `sitemap.ts:31` | |
| Trang KB `/{mảng}/{cụm}/{trang}` | 539 (index=true cả 539; 527 nháp AI, 12 đã duyệt) | engine `/v1/kb/trang` | so 12 · que 64 · sao 14 · cung 12 · thập thần 10 · nhật chủ 10 · số kép 43 · **cặp số 45 (bị chặn)** · nghề 12 · tình yêu 12 · năm cá nhân 9 · nợ nghiệp 4 · sao-ở-cung 168 · tứ-hoá 48 · mệnh-năm 76 |
| Tuổi hợp hướng | 92 | engine `/v1/phongthuy/tuoi` | |
| Lá số mẫu | 6 | engine | |
| Lịch tháng `/xem-ngay-tot/thang-M-YYYY` | 37 (−12…+24 tháng) | `sitemap.ts:18-23` | |
| Trang ngày `/xem-ngay-tot/YYYY-MM-DD` | 0 (≈407 trang index) | `lib/hoang-lich.ts:116` | chỉ tìm thấy qua lịch tháng |
| Tuổi làm nhà `/{năm}/tuoi-{ns}` | 92 (2 năm × 46) | `sitemap.ts:35` | |
| Tuổi xông đất | 92 (2 năm × 46) | `sitemap.ts:36` | năm 2026 (Tết đã qua) không có link nội bộ |
| Hướng xấu năm | 4 | `sitemap.ts:37` | |
| Blog bài / chuyên mục / sự kiện | theo CMS + NotFair | `sitemap.ts:48-55`, `:26-28` | |
| **Tổng cố định** | **≈ 902** + blog + sự kiện | | 46 URL nằm trong sitemap nhưng bị robots chặn |

Bảng 308 (`next.config.mjs:6-18`): 15 cụm + 2 trang + mẫu tuổi, mỗi mẫu có bản `.md` và `/:trang`. Không thấy chuỗi hai bước hay vòng lặp. Ngoại lệ nhỏ: URL cũ có `/` cuối (`/kien-thuc/tu-vi/`) đi **hai** bước (Next bỏ `/` rồi mới tới 308 QH-URL), mức độ thấp.

---

## 3. Phát hiện theo mức ưu tiên

### P0 — robots.txt chặn cả cụm "Số chủ đạo nào hợp nhau" (46 URL)

- **Bằng chứng:** `web/app/robots.ts:9` có `"/hop-doi/"` trong `CHAN` (để chặn link mời `/hop-doi/{mã}`). QH-URL (#97) dời cụm `hop-so` sang `/hop-doi/cap-so` (`lib/chuyen-huong.json:10`). Theo khớp tiền tố của robots, `Disallow: /hop-doi/` chặn `/hop-doi/cap-so` và cả 45 trang con, kể cả bản `.md`.
- **Hậu quả:** Search Console sẽ báo "URL đã gửi bị robots.txt chặn" cho 46 URL. Các URL cũ `/kien-thuc/hop-so/*` đã có thứ hạng giờ 308 về một đích Google không được thu thập → mất hẳn tín hiệu xếp hạng. Liên kết nội bộ từ `/than-so/tinh-yeu/*` và `/hop-doi` sang cụm cũng không truyền được giá trị.
- **Vì sao lọt qua:** e2e `seo.spec.ts:25-32` không kiểm chuyện này, còn `kiem-tra-seo.mjs` tải trang bằng fetch (bỏ qua robots).
- **Cách sửa (an toàn, nhỏ):** trong `robots.ts` thêm `allow: ["/", "/hop-doi/cap-so"]` cho nhóm `*` và nhóm `BOT_AI_TRA_LOI` (Google/Bing lấy luật khớp dài nhất, nên Allow `/hop-doi/cap-so` thắng `Disallow: /hop-doi/`). Gọn hơn nữa là bỏ hẳn `/hop-doi/` khỏi `CHAN`, vì `hop-doi/[ma]/page.tsx:18` đã có noindex (bị robots chặn thì Google lại không đọc được thẻ noindex này). Thêm vào e2e: sitemap không được chứa URL nào khớp một dòng Disallow. Thêm vào `kiem-tra-seo.mjs`: đọc `/robots.txt` nhóm `*` rồi báo LỖI cho URL sitemap bị chặn.

### P1

1. **Nội dung lập trình gần trùng (rủi ro bị coi là "scaled content")**
   Đo bằng tỷ lệ cụm 6 từ chỉ có ở một trang trong cùng họ trang:

   | Họ | Số trang | Số từ (trung vị) | Phần riêng (trung vị) | Văn diễn giải riêng của KB |
   |---|---|---|---|---|
   | sao-ở-cung | 168 | 850 | **0,09** | `sao_cung` trung vị **15 từ**/trang (9–23) |
   | tứ-hoá-ở-cung | 48 | 439 | **0,10** | `tu_hoa_cung` trung vị **8 từ** |
   | tuổi-hợp-hướng | 92 | 763 | **0,08** | chỉ có **8 mệnh quái** cho 92 trang |
   | mệnh-theo-năm | 76 | 549 | 0,19 | 30 nạp âm cho 76 năm |
   | số kép | 43 | 494 | 0,27 | |
   | cặp số | 45 | 394 | 0,30 | |
   | quẻ, sao, cung, nghề, tình yêu | | | 0,88–0,97 | ổn |

   Trang sao-ở-cung lặp lại nguyên khối "Tính chất sao" (giống nhau ở 12 trang của cùng một sao), "Cung … nói về điều gì" (giống nhau ở 14 trang của cùng một cung) và "Tam phương tứ chính" (`engine/app/kb/trang_tuvi.py:110-130`). Thêm vào đó 527/539 trang là nháp AI, cùng `cap_nhat` 2026-10-07.
   - Sửa nhỏ làm ngay được: đưa khối dùng chung ra thành **một câu + link** tới trang sao / trang cung thay cho việc chép nguyên đoạn. Trang ngắn đi nhưng tỷ lệ phần riêng tăng mạnh. Đây là thay đổi nội dung engine, cần test golden và cần duyệt.
   - **ĐỀ XUẤT cần chủ dự án duyệt:** (a) bổ sung KB `sao_cung` lên ≥ 120–200 từ riêng mỗi trang, ưu tiên theo hàng đợi GSC (`scripts/tham_dinh.py hang-doi`); (b) trong lúc chờ, đặt `index=false` cho các trang sao-ở-cung / tứ-hoá có phần riêng < 20 % và chưa có hiển thị GSC (vẫn giữ link, vẫn giữ .md). Việc này nới quyết định "index cả nháp AI" (2026-09-30); (c) với 92 trang tuổi hướng: gộp hai giới tính cùng năm vào một trang `/tuoi-1990` có hai cột nam/nữ (46 trang, 308 từ bản `-nam`/`-nu`), hoặc thêm dữ kiện riêng theo năm sinh (nạp âm, tuổi xung, năm hạn, link làm nhà/xông đất).

2. **Engine lỗi thì trả 404 / 200 rỗng thay cho 5xx** — `web/lib/kien-thuc.ts:251-262` (`lay` trả `null` cả khi lỗi mạng), `TrangKienThuc.tsx:50-51` gọi `notFound()`. Mỗi lần Render khởi động lại hay deploy lệch, Googlebot thấy 404 trên ~600 URL, và `sitemap.ts:26` dựng sitemap thiếu 539 URL (có `noStore` nên không bị cache, nhưng lượt Googlebot đọc đúng lúc đó vẫn nhận bản thiếu). `TrangChuDe.tsx:47` trả 200 với "Thư viện đang được tải lại" → soft-404.
   **Sửa nhỏ:** `lay()` phân biệt `r.status === 404` (→ `null`) với lỗi mạng / 5xx (→ `throw`, để error.tsx trả 500, Google giữ chỉ mục rồi thử lại). Trang cụm: danh sách rỗng thì `throw`. Sitemap: engine lỗi thì trả lỗi 503 thay cho bản thiếu.

3. **Blog NotFair: 2 thẻ H1** — `lib/notfair-article.ts:12` cho `h1` qua lọc, hero của thư viện đã render `<h1>` (`node_modules/notfair-nextjs-blog/dist/react.js:12`). **Sửa nhỏ:** thêm `transformTags: { h1: "h2", … }` (giữ `id`), bỏ `.articleContent h1` trong CSS.

4. **Blog NotFair: ảnh LCP tải lười + schema thiếu** — `app/blog/[slug]/page.tsx:101-103` không truyền `priority` cho `NotFairPostHero` → ảnh 1600×900 trên màn đầu tải `loading=lazy`. BlogPosting (`:79-92`) thiếu `author` và `dateModified`. **Sửa nhỏ:** thêm `priority`, `author: { "@id": "#to-chuc" }` (đúng BM-1 / EEAT-1: bài không phải chuyên gia viết thì tác giả là tổ chức), `dateModified: p.published_at ?? p.created_at`.

5. **Hình thức trao đổi link NotFair** — bài trao đổi kèm dòng `nf-attribution` và link ra ngoài, nhưng link vẫn `rel="noopener noreferrer"` (`notfair-article.ts:29`), không có `nofollow` / `sponsored`. Chính sách spam của Google nêu đích danh "trao đổi link quá mức". **ĐỀ XUẤT cần chủ dự án duyệt** (BLOG-1 có chủ ý giữ attribution): thêm `rel="sponsored nofollow"` cho link ra ngoài trong thân bài NotFair (link nội bộ hieuban.com thì giữ follow), hoặc ít nhất cho link nằm trong `nf-attribution`. Nên hỏi lại bên trao đổi xem điều khoản có cho phép không.

6. **Slug blog NotFair có dấu / "đ"** — `blog-gop.ts:57-62` giải mã + NFC rồi tra. URL kiểu `/blog/c%C3%A1ch-t%C3%ADnh-%C4%91%C6%B0%E1%BB%9Dng-%C4%91%E1%BB%9Di` hiển thị chạy được, nhưng: dán vào Zalo/FB/email bị mã hoá phần trăm, dài và xấu; một trang có nhiều biến thể (NFC/NFD, chữ hoa) đều trả 200 → trùng (canonical cứu được phần nào, nhưng tốn ngân sách thu thập). Phần còn lại của site toàn ASCII.
   - Sửa nhỏ làm ngay được: trong `app/blog/[slug]/page.tsx`, nếu tham số đã giải mã khác `p.slug` (ví dụ NFD, chữ hoa) thì `permanentRedirect(duongBlog(p.slug))`.
   - **ĐỀ XUẤT cần chủ dự án duyệt:** đề nghị NotFair sinh slug ASCII, hoặc web tự dùng bí danh ASCII (`slugViet`), 308 từ bản có dấu và đặt canonical về bản ASCII.

7. **Không có link chéo theo năm sinh** — với mỗi năm sinh (ví dụ 1990) có 7 trang: mệnh, hướng nam, hướng nữ, làm nhà ×2 năm, xông đất ×2 năm. Trang làm nhà / xông đất không link sang mệnh và hướng (grep `components/tuoi`, `app/xem-tuoi-lam-nha/[nam]/[tuoi]/page.tsx:41-45`). Anchor ở trang trụ chỉ là con số "1990" (`app/tuoi-xong-dat/page.tsx:27`). **Sửa nhỏ:** thêm khối "Cùng tuổi {can chi} {năm}" dùng `duongTuoi` / `duongTrang('menh_nam', …)`, anchor "Tuổi 1990 Canh Ngọ".

8. **TTFB: HTML không cache được** — `layout.tsx:76` đọc `headers()` (nonce) → mọi trang, kể cả ~900 trang kiến thức tĩnh, SSR mỗi lượt và có `cache-control: private, no-store`; `export const revalidate = 21600` ở trang chỉ còn tác dụng cho fetch. Mỗi lượt crawl = một lần chạy hàm ở `sin1` + Suspense CMS. **ĐỀ XUẤT cần chủ dự án duyệt** (đụng CSP-2): (a) giữ nonce cho trang công cụ, còn trang KB / blog / lịch dùng CSP theo **hash/SRI** (`experimental.sri`) để được prerender/ISR; hoặc (b) thử Next 16 `cacheComponents` / PPR: vỏ tĩnh, chỉ phần cần nonce là động. Cần đo TTFB thật trên Vercel trước (`scripts/do-hieu-nang.mjs`).

### P2

- **Cụm kiến thức + trang chia sẻ: twitter kế thừa trang chủ** — `components/kien-thuc/TrangChuDe.tsx:24-25` (15 trang), `app/ban-than/page.tsx`, `app/hop-doi/[ma]/page.tsx`, `app/the/[ma]/page.tsx` khai `openGraph` mà không khai `twitter`. Next chỉ tự điền twitter từ og khi chưa có twitter, nhưng ở đây layout đã có (`layout.tsx:63`) nên `twitter:title` = "Hiểu Bản Thân — con số nói gì về bạn". og cũng thiếu `type/locale/siteName` (og của trang thay hẳn og của layout). Riêng thẻ chia sẻ (`/the/[ma]`) ảnh hưởng tới vòng lan truyền. **Sửa nhỏ:** dựng bằng `metaTrang()` rồi ghi đè ảnh.
- **`dateModified` giống nhau cho 539 trang** (`2026-10-07`) → `lastmod` sitemap và Article không phản ánh lần sửa thật; `datePublished = cap_nhat` (`TrangKienThuc.tsx:66-67`). Đề xuất engine trả `cap_nhat` theo từng mục (ngày thẩm định / ngày sửa KB).
- **Ảnh trong thân bài NotFair** từ host khác `notfair.co` bị CSP `img-src` chặn (`lib/csp.ts:37`) nhưng vẫn qua lọc (`notfair-article.ts:27`) → ảnh vỡ, thiếu alt. Nên lọc `img` theo cùng danh sách host với CSP (như `cms-html.ts:41`). Ảnh hero dùng `next/image` với `remotePatterns` `/api/seo/**` (`next.config.mjs:51-55`): nếu NotFair đổi đường dẫn ảnh thì trang 500.
- **`/blog` không phân trang**: JSON-LD `blogPost` liệt kê mọi bài (`app/blog/page.tsx:30`). Khi > 30–50 bài nên có `/blog/trang/{n}` (canonical tự trỏ chính nó, không noindex), tương tự cho chuyên mục. Tiêu đề `/blog` là "Blog · Hiểu Bản Thân" (`lib/so-trang.ts:207`) → nên có từ khoá. Sửa được qua CMS ND, không cần code.
- **CTA bài NotFair luôn trỏ `/than-so`** (`app/blog/[slug]/page.tsx:116`), không xét chủ đề; nên chọn công cụ theo `tags`.
- **RSS**: `enclosure length="0"` và đoán MIME `webp` cho URL không có đuôi (`app/blog/rss.xml/route.ts:126`). Nên bỏ enclosure hoặc dùng `media:content`.
- **Lỗ trong cây URL**: `/xem-tuoi-lam-nha/2026`, `/tuoi-xong-dat/2027` 404. Nên thêm trang năm (danh sách 46 tuổi) hoặc 308 về trang trụ. Breadcrumb hiện bỏ qua cấp năm.
- **Xông đất năm âm hiện tại** (Tết 2026 đã qua) vẫn có 46 URL trong sitemap nhưng không có link (`sitemap.ts:36` và `tuoi-xong-dat/page.tsx:16` chỉ link `namAm+1`). Bỏ khỏi sitemap sau Tết, hoặc thêm link "năm trước".
- **Trang ngày (≈407 URL index)** không có trong sitemap. Nên thêm 30–60 ngày tới vào sitemap (hoặc sitemap riêng `sitemap-ngay.xml`) để Google biết sớm.
- `/ban-than`, `/ung-ho` index nhưng thiếu trong sitemap (`sitemap.ts:12-16`). `/ung-ho` có nên index không là việc chủ dự án quyết.
- `BaiCms.tsx:62,112` dùng `/blog/${bai.slug}` thô, còn metadata dùng `duongBlog` → nên dùng `duongBlog` cho đồng nhất (slug CMS hiện là ASCII qua `cms/src/lib/slug.ts`, nhưng biên tập viên vẫn gõ tay được).
- Logo Organization là SVG (`lib/seo.ts:29`) → nên có PNG ≥ 112×112.
- Font: Be Vietnam Pro 4 độ đậm × 2 subset + Newsreader được preload trên mọi trang (`layout.tsx:25-43`) → cân nhắc 3 độ đậm và preload chỉ subset `vietnamese`.
- JS client (bản build 09/10, gzip): layout ≈ 120 KB, trang KB ≈ 105–130 KB, trang công cụ Tử vi ≈ 218 KB; thêm GTM + PostHog + Sentry trên mọi trang. Đo lại INP sau khi build NX16.
- `CHU_DE['tinh-yeu'].mang = "/hop-doi"` trong khi URL nằm dưới `/than-so` (`lib/kien-thuc.ts:142`): CTA "Xem của tôi" đưa sang `/hop-doi`, nằm ngoài silo `/than-so`. Nếu cố ý thì ghi chú lại.
- robots `host:` chỉ Yandex hiểu, vô hại. Cần kiểm trên Vercel: `www.hieuban.com` → `hieuban.com` 308 (trong mã không xử lý, `proxy.ts:37-40` chỉ xử lý `*.vercel.app`).
- Có thể trùng ý định tìm kiếm (cannibalization) quanh "số chủ đạo N": `/than-so/y-nghia-so/so-N`, `/than-so/nghe-nghiep/so-N-…`, `/than-so/tinh-yeu/so-N-…`. Title đã tách ý định; nên theo dõi trong GSC, trang chính nên link rõ sang ba trang con.

---

## 4. Tách việc

### (a) Sửa nhỏ, an toàn, làm ngay được (không đổi quyết định nào)

1. `web/app/robots.ts`: cho phép `/hop-doi/cap-so` (hoặc bỏ `/hop-doi/` khỏi `CHAN`) + e2e "sitemap ∩ Disallow = ∅" + kiểm robots trong `scripts/kiem-tra-seo.mjs`. **(P0)**
2. `web/lib/kien-thuc.ts` `lay()`: phân biệt 404 với lỗi; `TrangChuDe` rỗng / sitemap thiếu → 5xx. **(P1)**
3. `web/lib/notfair-article.ts`: `h1→h2`; lọc `img` theo host trong CSP. **(P1/P2)**
4. `web/app/blog/[slug]/page.tsx`: `priority` cho hero, `author` (Organization), `dateModified`; 308 về slug chuẩn khi tham số khác dạng. **(P1)**
5. `TrangChuDe.tsx`, `ban-than`, `hop-doi/[ma]`, `the/[ma]`: dựng metadata đầy đủ bằng `metaTrang()`. **(P2)**
6. Khối "Cùng tuổi {năm}" link chéo mệnh / hướng / làm nhà / xông đất; anchor có can chi. **(P1)**
7. `BaiCms.tsx`: dùng `duongBlog`; sitemap thêm `/ban-than` (và `/ung-ho` nếu muốn index); bỏ xông đất năm đã qua Tết khỏi sitemap. **(P2)**
8. RSS: bỏ `length="0"`; CTA blog theo chủ đề. **(P2)**

### (b) Cần chủ dự án quyết

1. **Nội dung lập trình mỏng**: viết thêm KB sao-ở-cung / tứ-hoá theo hàng đợi GSC; tạm `index=false` cho trang có phần riêng < 20 % (nới quyết định "index cả nháp AI" 2026-09-30); thay khối lặp bằng link (đổi nội dung engine).
2. **Gộp trang tuổi hướng nam/nữ** (92 → 46, có 308) hoặc làm giàu theo năm.
3. **`rel="sponsored nofollow"` cho link ra ngoài trong bài NotFair** (đụng BLOG-1; hỏi điều khoản bên trao đổi).
4. **Slug ASCII cho bài NotFair** (bí danh + 308) hoặc yêu cầu NotFair đổi.
5. **Bộ nhớ đệm HTML**: CSP hash/SRI hoặc PPR cho trang nội dung (đụng CSP-2) — đo TTFB trước.
6. Tiêu đề trang chủ thêm từ khoá ("Thần số học, Tử vi, Bát tự online miễn phí — Hiểu Bản Thân"); tiêu đề `/blog` (sửa qua CMS ND).
7. Phân trang blog khi vượt ~30 bài; sitemap riêng cho trang ngày.
8. `/ung-ho` có nên index không.

---

## 5. Ghi chú phương pháp

- Số liệu nội dung: script nháp `sim2.py` / `sim3.py` trong thư mục nháp này, gọi `app.kb.trang.danh_sach()` / `lay()` và `phongthuy_tuoi.tuoi()`; "phần riêng" = tỷ lệ cụm 6 từ (shingle) chỉ xuất hiện ở một trang trong cùng họ. Đây là chỉ số tương đối, không phải con số Google dùng.
- Không chạy `kiem-tra-seo.mjs` vì cần engine + CMS + mạng; lỗi P0 đằng nào bộ rà hiện tại cũng không bắt được.
- Không sửa tệp nào trong repo, không commit.

---

## GoogleOther — chặn (2026-10-22, chủ dự án giao em quyết)

| | Mở | Chặn (đã chọn) |
|---|---|---|
| Google Search, AI Overviews, Discover | Không đổi | **Không đổi** — chỉ Googlebot quyết định; Google ghi rõ luật cho GoogleOther không ảnh hưởng Search |
| GoogleOther làm gì | Bot "đa dụng" cho các nhóm sản phẩm Google lấy nội dung công khai để **nghiên cứu, phát triển** (crawl một lần, ngoài Search) | — |
| Lợi | Không có lợi ích đo được cho hieuban.com (không đem lượt truy cập, không ghi nguồn) | Bớt tải máy chủ (mọi trang render động, mỗi lượt bot = một lần chạy hàm `sin1`); đúng tinh thần BM-2: nội dung không bị lấy ngoài mục đích tìm kiếm/trích dẫn |
| Hại | Tốn tài nguyên; nội dung có thể dùng cho mục đích ta không kiểm soát | Gần như không — nếu sau này Google dùng GoogleOther cho một sản phẩm đem traffic thì mở lại một dòng |

Làm: `web/app/robots.ts` thêm `GoogleOther`, `GoogleOther-Image`, `GoogleOther-Video` vào nhóm `Disallow: /` (e2e `seo-k.spec.ts`).

## SEO-L — đề xuất tiếp theo (chờ chủ dự án chọn)

Xếp theo lợi ích ước tính cho khâu THU HÚT. Mục ★ là nhạy thời vụ (Tết Đinh Mùi 2027 = 06/02/2027 — Google cần 6–10 tuần
để xếp hạng trang mới, nên làm trong tháng 11/2026).

| # | Đề xuất | Vì sao | Công |
|---|---|---|---|
| 1 ★ | **Trang trụ theo năm**: `/tuoi-xong-dat/2027` (bảng 46 tuổi gia chủ → tuổi hợp), `/xem-tuoi-lam-nha/2027` (tuổi nào làm nhà, cưới hỏi được năm 2027: Kim lâu/Hoang ốc/Tam tai cho 1960–2005) | Lấp lỗ cây URL (audit P2: `/xem-tuoi-lam-nha/2026` đang 404); bắt cụm "tuổi xông đất 2027", "tuổi làm nhà 2027" — lượng tìm rất lớn quanh Tết; link xuống 46 trang con | Engine thêm route gộp năm (tính sẵn có), web 2 trang |
| 2 ★ | **Xem ngày tốt theo việc**: `/xem-ngay-tot/{viec}-thang-{m}-{yyyy}` cho cưới hỏi, động thổ, nhập trạch, khai trương, xuất hành, mua xe (6 việc × 13 tháng) | Cụm "ngày tốt cưới hỏi tháng 12", "ngày đẹp khai trương 2027" lượng tìm lớn; dữ liệu nghi/kỵ từng ngày đã có → mỗi trang khác nhau thật, không mỏng | Engine lọc ngày theo mã việc (có sẵn), web 1 khuôn |
| 3 | **Đổi lịch âm ↔ dương** `/doi-lich-am-duong` + `/lich-am/{yyyy}` (bảng 12 tháng, Tết, tháng nhuận) | "lịch âm hôm nay", "đổi ngày âm sang dương" thuộc nhóm tìm nhiều nhất VN; engine có Hồ Ngọc Đức; dẫn sang ngày tốt + hồ sơ | Nhỏ |
| 4 | **Engine lỗi → 503 thay 404** (audit P1 còn mở) | Mỗi lần Render khởi động lại, ~600 trang KB trả 404 → Google có thể gỡ chỉ mục; 503 giữ chỉ mục | Nhỏ (`lib/kien-thuc.ts` `lay`) |
| 5 | **Ngày cập nhật thật cho KB** (audit P1 chờ quyết): sổ `ngay_cap_nhat.json` sinh tự động trong CI = ngày đổi băm nội dung từng trang | Hiện ~600 trang cùng một ngày 07/10 → Google bỏ qua lastmod; trang vừa sửa ở SEO-K không được báo "mới" | Nhỏ–vừa |
| 6 | **Bản .md cho họ trang còn thiếu** (ngày tốt, làm nhà, xông đất, hướng xấu năm, lá số mẫu, pháp lý) | AI trả lời trích theo .md; đúng khuôn SEO-D | Vừa |
| 7 | **Ảnh trong sitemap** (`<image:image>` trỏ ảnh `/og?mang=…`) | Ảnh minh hoạ mới vào Google Hình ảnh nhanh hơn | Nhỏ |
| 8 | **IndexNow hằng ngày cho trang ngày mới** (cron) | Bing/Cốc Cốc… biết trang ngày sắp tới ngay | Nhỏ |
| 9 | **Form công cụ có trong HTML máy chủ + `autocomplete`** (audit P1-7) | Agent AI (ChatGPT/Claude đọc HTML) dùng được công cụ; trình duyệt tự điền ngày sinh | Nhỏ |
| 10 | **CTA bài blog theo chủ đề** + metadata đủ cho `/ban-than`, `/the/[ma]`, `/hop-doi/[ma]` (audit P2) | Bài blog dẫn đúng công cụ; thẻ chia sẻ hiện đúng tiêu đề trên Zalo/Facebook (khâu MỜI) | Nhỏ |

Đề xuất làm trước: **1 + 2 (★, trước Tết)**, rồi 4, 5, 3.
