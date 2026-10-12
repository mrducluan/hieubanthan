// Luồng thật của phòng biên tập, từ CMS tới hieuban.com:
// tài khoản đầu tiên (khoá theo email) → viết bài trong trình soạn Lexical, khung Kiểm định chấm khi gõ → lỗi chặn không
// cho xuất bản → xuất bản → web hiện bài (H1, Trả lời nhanh, mục lục, FAQ, JSON-LD, sitemap, llms.txt, .md) → sửa nháp
// + xem trước có ký → đổi slug giữ link cũ (308) → biên tập viên không có nút Xuất bản → tắt "blog" ở Tính năng.
import { createHmac } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { BI_MAT } from "../playwright.config";
import { buocHienTai, maTotp, tuBase32 } from "../src/lib/totp";

const CMS = "http://localhost:3001";
const WEB = "http://localhost:3000";
const QT = { email: "quan-tri@vidu.vn", mk: "mat-khau-quan-tri-123" };
const BT = { email: "bien-tap@vidu.vn", mk: "mat-khau-bien-tap-123" };
const TIEU_DE = "Số chủ đạo 7 là gì? Tính cách, công việc và tình yêu";
const SLUG = "so-chu-dao-7-la-gi-tinh-cach-cong-viec-va-tinh-yeu";

test.describe.configure({ mode: "serial" });

/** Điền form Payload an toàn trên máy chậm: chờ form khởi tạo xong (ô hết disabled, mạng yên) rồi điền và KIỂM giá trị —
 *  Payload dựng lại trạng thái form sau khi hydrate, chữ điền quá sớm có thể bị xoá trước khi bấm gửi. */
async function dien(page: Page, o: Record<string, string>) {
  await page.waitForLoadState("networkidle");
  for (const [id, v] of Object.entries(o)) {
    const f = page.locator(`#${id}`);
    await expect(f).toBeEditable();
    await f.fill(v);
  }
  for (const [id, v] of Object.entries(o)) await expect(page.locator(`#${id}`)).toHaveValue(v);
}

async function dangNhap(page: Page, ai = QT) {
  await page.goto(`${CMS}/admin/login`);
  await dien(page, { "field-email": ai.email, "field-password": ai.mk });
  await page.click("button[type=submit]");
  await page.waitForURL(`${CMS}/admin`);
}

async function tokenQt(request: APIRequestContext): Promise<string> {
  const r = await request.post(`${CMS}/api/bien-tap-vien/login`, { data: { email: QT.email, password: QT.mk } });
  expect(r.ok()).toBeTruthy();
  return (await r.json()).token as string;
}

/** Chờ web thấy thay đổi (CMS gọi webhook → web xoá cache; dev server có thể biên dịch chậm lần đầu). */
async function choWeb(request: APIRequestContext, duong: string, kiem: (s: number, body: string) => boolean) {
  await expect.poll(async () => {
    const r = await request.get(`${WEB}${duong}`, { maxRedirects: 0 });
    return kiem(r.status(), await r.text());
  }, { timeout: 60_000, intervals: [1_000, 2_000, 3_000] }).toBe(true);
}

test("tài khoản đầu tiên: chỉ email quản trị đã khai báo", async ({ page }) => {
  await page.goto(`${CMS}/admin`);
  await page.waitForURL(/create-first-user/);
  await dien(page, { "field-email": "nguoi-la@vidu.vn", "field-password": QT.mk, "field-confirm-password": QT.mk,
    "field-ten_hien_thi": "Người lạ" });
  await page.click("button[type=submit]");
  await expect(page.getByText("Email này không phải email quản trị đã khai báo.")).toBeVisible();

  await dien(page, { "field-email": QT.email, "field-ten_hien_thi": "Quản trị thử" });
  await page.click("button[type=submit]");
  await page.waitForURL(`${CMS}/admin`);
  await expect(page.getByRole("heading", { name: "Phòng biên tập" })).toBeVisible();
  await expect(page.getByTestId("tq-viet-moi")).toBeVisible();
});

test("chuẩn bị: tài khoản Máy đọc (khoá API cho web) + biên tập viên", async ({ request }) => {
  const token = await tokenQt(request);
  const h = { Authorization: `JWT ${token}` };
  const md = await request.post(`${CMS}/api/bien-tap-vien`, { headers: h, data: {
    email: "may-doc@vidu.vn", password: "khong-dung-mat-khau-nay-1", ten_hien_thi: "Web hieuban.com", vai_tro: "may_doc",
    enableAPIKey: true, apiKey: BI_MAT.apiKey } });
  expect(md.ok(), await md.text()).toBeTruthy();
  const bt = await request.post(`${CMS}/api/bien-tap-vien`, { headers: h, data: {
    email: BT.email, password: BT.mk, ten_hien_thi: "Biên tập viên", vai_tro: "bien_tap" } });
  expect(bt.ok(), await bt.text()).toBeTruthy();
  // Khách không tạo được tài khoản
  expect((await request.post(`${CMS}/api/bien-tap-vien`, { data: { email: "x@vidu.vn", password: "mat-khau-du-dai-1", ten_hien_thi: "x" } })).status()).toBe(403);
});

test("viết bài: Kiểm định chấm khi gõ, lỗi chặn không cho xuất bản, sửa xong thì xuất bản", async ({ page }) => {
  await dangNhap(page);
  await page.getByTestId("tq-viet-moi").click();
  await expect(page.getByTestId("kiem-dinh")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#field-tieu_de")).toBeEditable();
  const diemDau = Number(await page.getByTestId("kiem-dinh-diem").textContent());

  await page.fill("#field-tieu_de", TIEU_DE);
  await page.fill("#field-mo_ta_ngan", "Số 7 trong thần số học: người thích tìm hiểu, sống nội tâm. Mặt sáng, mặt tối và câu hỏi tự soi.");
  await page.fill("#field-tra_loi_nhanh", "Số chủ đạo 7 là con số của người thích tìm hiểu, phân tích và chiêm nghiệm. Người số 7 thường cần thời gian riêng để nghĩ, tin vào điều tự mình kiểm chứng, giỏi đào sâu một vấn đề. Mặt cần để ý là dễ khép mình, hoài nghi và ngại chia sẻ cảm xúc với người thân.");

  const ed = page.locator('[data-lexical-editor="true"]').first();
  await ed.click();
  await page.keyboard.type("Số chủ đạo 7 là con số của người thích tìm hiểu và sống nội tâm.");
  await page.keyboard.press("Enter");
  await page.keyboard.type("## Số chủ đạo 7 là gì?");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Người số 7 thường đặt câu hỏi về bản chất sự việc. ".repeat(6));
  await page.keyboard.press("Enter");
  await page.keyboard.type("## Số 7 trong công việc");
  await page.keyboard.press("Enter");
  await page.keyboard.type("- Nghiên cứu");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Phân tích dữ liệu");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.type("## Số 7 trong tình yêu");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Cần người tôn trọng khoảng lặng. Muốn thử số của mình? Mua vé xổ số ngày số 7.");

  // Kiểm định chạy ngay trên form: điểm tăng, lỗi chặn hiện.
  await expect.poll(async () => Number(await page.getByTestId("kiem-dinh-diem").textContent())).toBeGreaterThan(diemDau);
  await expect(page.getByTestId("kiem-dinh-chan")).toBeVisible();
  await expect(page.locator('[data-ma="vung_cam"][data-muc-do="loi"]')).toBeVisible();

  // CG-6: nút Kiểm trùng gọi máy chủ, so với bài khác + kho tri thức.
  await page.getByTestId("kiem-trung").getByRole("button", { name: /Kiểm trùng nội dung/ }).click();
  await expect(page.locator('[data-testid="kiem-trung"] li[data-ma="trung_bai"][data-muc-do="dat"]')).toBeVisible();
  await expect(page.locator('[data-testid="kiem-trung"] li[data-ma="trung_kho_tri_thuc"]')).toBeVisible();

  // Tab SEO · GEO: từ khoá chính
  await page.locator(".tabs-field__tab-button", { hasText: "SEO · GEO" }).click();
  await page.fill("#field-tu_khoa_chinh", "số chủ đạo 7");
  await page.locator(".tabs-field__tab-button", { hasText: "Nội dung" }).click();

  // Hỏi đáp: 3 câu
  for (const [i, [hoi, dap]] of ([["Số 7 hợp nghề gì?", "Nghiên cứu, phân tích, viết."], ["Số 7 có khó gần không?", "Thường cần thời gian để mở lòng."], ["Cách tính số chủ đạo?", "Cộng các chữ số của ngày sinh."]] as const).entries()) {
    await page.getByRole("button", { name: "Thêm: Câu hỏi" }).click();
    await expect(page.getByRole("textbox", { name: "Câu hỏi *" })).toHaveCount(i + 1);
    await page.getByRole("textbox", { name: "Câu hỏi *" }).nth(i).fill(hoi);
    await page.getByRole("textbox", { name: "Trả lời *" }).nth(i).fill(dap);
  }

  // Xuất bản khi còn lỗi chặn → máy chủ từ chối, bài không lên.
  await page.locator("#action-save").click();
  await expect(page.getByText(/Chưa xuất bản được/).first()).toBeVisible();

  // Sửa câu cuối: bỏ cụm vùng cấm
  await ed.locator("p", { hasText: "xổ số" }).click({ clickCount: 3 });
  await page.keyboard.type("Cần người tôn trọng khoảng lặng. Hãy tự tính ở công cụ thần số.");
  await expect(page.getByTestId("kiem-dinh-chan")).toHaveCount(0);

  await page.locator("#action-save").click();
  await expect(page.getByText(/Đã xuất bản|thành công|Updated successfully|Published successfully/i).first()).toBeVisible();
  await expect(page.locator("#field-slug")).toHaveValue(SLUG);
});

test("web hiện bài: H1, Trả lời nhanh, mục lục, FAQ, JSON-LD, chữ ký Ban biên tập", async ({ page, request }) => {
  await choWeb(request, `/blog/${SLUG}`, (s, b) => s === 200 && b.includes(TIEU_DE));
  await page.goto(`${WEB}/blog/${SLUG}`);
  await expect(page.locator("h1")).toHaveText(TIEU_DE);
  await expect(page.getByTestId("tra-loi-nhanh")).toContainText("Số chủ đạo 7 là con số");
  await expect(page.getByTestId("muc-luc")).toContainText("Số 7 trong công việc");
  await expect(page.locator("h2#so-7-trong-cong-viec")).toBeVisible();
  await expect(page.locator("[data-dong-tac-gia]")).toContainText("Ban biên tập Hiểu Bản Thân biên soạn");
  await expect(page.getByRole("heading", { name: "Câu hỏi thường gặp" })).toBeVisible();
  await expect(page.getByTestId("keu-goi-cuoi-bai")).toBeVisible();
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const tat = ld.join("\n");
  expect(tat).toContain('"@type":"BlogPosting"');
  expect(tat).toContain('"@type":"FAQPage"');
  expect(tat).not.toContain("reviewedBy");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${WEB}/blog/${SLUG}`);
  expect(await page.locator("h1").count()).toBe(1);

  await page.goto(`${WEB}/blog`);
  await expect(page.getByRole("heading", { level: 2, name: TIEU_DE })).toBeVisible();
  expect(await (await request.get(`${WEB}/sitemap.xml`)).text()).toContain(`/blog/${SLUG}`);
  expect(await (await request.get(`${WEB}/llms.txt`)).text()).toContain(`/blog/${SLUG}`);
  const md = await request.get(`${WEB}/blog/${SLUG}.md`);
  expect(md.status()).toBe(200);
  expect(await md.text()).toContain("## Số 7 trong công việc");
});

test("chuyên mục + loại Tin tức: chip ở /blog, trang chuyên mục có ItemList, bài ghi NewsArticle + giờ đăng", async ({ page, request }) => {
  const token = await tokenQt(request);
  const h = { Authorization: `JWT ${token}` };
  const cm = await request.post(`${CMS}/api/chuyen-muc`, { headers: h, data: { ten: "Thần số ứng dụng", mo_ta: "Áp dụng thần số học vào đời sống." } });
  expect(cm.ok(), await cm.text()).toBeTruthy();
  const cmDoc = (await cm.json()).doc as { id: number; slug: string };
  expect(cmDoc.slug).toBe("than-so-ung-dung");
  const r = await request.get(`${CMS}/api/bai-viet?where[slug][equals]=${SLUG}`, { headers: h });
  const id = (await r.json()).docs[0].id;
  const u = await request.patch(`${CMS}/api/bai-viet/${id}`, { headers: h, data: { chuyen_muc: [cmDoc.id], loai_bai: "tin_tuc", _status: "published" } });
  expect(u.ok(), await u.text()).toBeTruthy();

  await choWeb(request, "/blog/chuyen-muc/than-so-ung-dung", (s, b) => s === 200 && b.includes(TIEU_DE));
  await page.goto(`${WEB}/blog`);
  await expect(page.getByTestId("chip-chuyen-muc").getByRole("link", { name: /Thần số ứng dụng/ })).toBeVisible();
  await expect(page.getByTestId("bai-noi-bat")).toContainText("Tin tức");
  await page.getByTestId("chip-chuyen-muc").getByRole("link", { name: /Thần số ứng dụng/ }).click();
  await expect(page).toHaveURL(/\/blog\/chuyen-muc\/than-so-ung-dung$/);
  await expect(page.locator("h1")).toHaveText("Thần số ứng dụng");
  const ldCm = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(ldCm).toContain('"@type":"CollectionPage"');
  expect(ldCm).toContain(`/blog/${SLUG}`);
  expect(await (await request.get(`${WEB}/sitemap.xml`)).text()).toContain("/blog/chuyen-muc/than-so-ung-dung");
  const rss = await request.get(`${WEB}/blog/rss.xml`);
  expect(rss.headers()["content-type"]).toContain("application/rss+xml");
  const rssText = await rss.text();
  expect(rssText).toContain(`/blog/${SLUG}</link>`);
  expect(rssText).toContain("<category>Thần số ứng dụng</category>");

  await page.goto(`${WEB}/blog/${SLUG}`);
  await expect(page.locator('nav[aria-label="Đường dẫn"]').getByRole("link", { name: "Thần số ứng dụng" })).toBeVisible();
  await expect(page.locator('[data-loai-bai="tin_tuc"]')).toBeVisible();
  const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(ld).toContain('"@type":"NewsArticle"');
  // Chuyên mục không tồn tại → 404.
  expect((await request.get(`${WEB}/blog/chuyen-muc/khong-co-that`)).status()).toBe(404);
});

test("nháp tạo mới chưa gõ tiêu đề → danh sách hiện '(Chưa đặt tiêu đề)', không '<No …>'", async ({ page }) => {
  await dangNhap(page);
  await page.goto(`${CMS}/admin/collections/bai-viet/create`);
  await expect(page.getByTestId("kiem-dinh")).toBeVisible();
  // Tự lưu nháp tạo bản ghi → chờ URL có id.
  await expect(page).toHaveURL(/\/bai-viet\/\d+/, { timeout: 20_000 });
  await page.goto(`${CMS}/admin/collections/bai-viet`);
  await expect(page.getByText("(Chưa đặt tiêu đề)").first()).toBeVisible();
  await expect(page.getByText(/<No /)).toHaveCount(0);
});

test("sửa nháp: người đọc vẫn thấy bản cũ; link xem trước có ký thấy bản nháp", async ({ page, request, browser }) => {
  await dangNhap(page);
  await page.goto(`${CMS}/admin/collections/bai-viet`);
  await page.getByRole("link", { name: TIEU_DE }).first().click();
  await page.fill("#field-mo_ta_ngan", "Bản nháp mới: sapo đang sửa, chưa xuất bản.");
  // Bài bật tự lưu nháp (2 giây) → không có nút "Lưu nháp"; chờ bản nháp xuất hiện qua API (khoá Máy đọc).
  await expect.poll(async () => {
    const r = await request.get(`${CMS}/api/bai-viet?where[slug][equals]=${SLUG}&draft=true`, { headers: { Authorization: `bien-tap-vien API-Key ${BI_MAT.apiKey}` } });
    return JSON.stringify(await r.json()).includes("Bản nháp mới");
  }, { timeout: 20_000 }).toBe(true);

  expect(await (await request.get(`${WEB}/blog/${SLUG}`)).text()).not.toContain("Bản nháp mới");
  const ma = createHmac("sha256", BI_MAT.preview).update(`xem-truoc:${SLUG}`).digest("base64url");
  const ctx = await browser.newContext();
  const xem = await ctx.newPage();
  await xem.goto(`${WEB}/api/cms/xem-truoc?slug=${SLUG}&ma=${ma}`);
  await expect(xem.getByTestId("dang-xem-nhap")).toBeVisible();
  await expect(xem.getByText("Bản nháp mới: sapo đang sửa")).toBeVisible();
  await expect(xem.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await ctx.close();
});

test("đổi slug bài đã xuất bản → link cũ chuyển hướng 308 sang link mới", async ({ request }) => {
  const token = await tokenQt(request);
  const r = await request.get(`${CMS}/api/bai-viet?where[slug][equals]=${SLUG}`, { headers: { Authorization: `JWT ${token}` } });
  const id = (await r.json()).docs[0].id;
  const u = await request.patch(`${CMS}/api/bai-viet/${id}`, { headers: { Authorization: `JWT ${token}` },
    data: { slug: "so-chu-dao-7", _status: "published", mo_ta_ngan: "Số 7 trong thần số học: người thích tìm hiểu, sống nội tâm." } });
  expect(u.ok(), await u.text()).toBeTruthy();
  await choWeb(request, `/blog/${SLUG}`, (s) => s === 308);
  const cu = await request.get(`${WEB}/blog/${SLUG}`, { maxRedirects: 0 });
  expect(cu.headers()["location"]).toMatch(/\/blog\/so-chu-dao-7$/);
  expect((await request.get(`${WEB}/blog/so-chu-dao-7`)).status()).toBe(200);
});

test("biên tập viên: lưu nháp được, không có nút Xuất bản; API xuất bản bị chặn", async ({ page, request }) => {
  await dangNhap(page, BT);
  await page.goto(`${CMS}/admin/collections/bai-viet/create`);
  await expect(page.getByTestId("kiem-dinh")).toBeVisible();
  await expect(page.locator("#action-save")).toHaveCount(0);
  const login = await request.post(`${CMS}/api/bien-tap-vien/login`, { data: { email: BT.email, password: BT.mk } });
  const token = (await login.json()).token;
  const r = await request.post(`${CMS}/api/bai-viet`, { headers: { Authorization: `JWT ${token}` }, data: {
    tieu_de: "Bài tự xuất bản", _status: "published", mang: "chung",
    noi_dung: { root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: "x", version: 1 }], version: 1 }], direction: null, format: "", indent: 0, version: 1 } } } });
  expect(r.status()).toBe(403);
});

test("Tính năng: tắt blog → bài CMS ẩn khỏi web; bật lại → hiện", async ({ request }) => {
  const token = await tokenQt(request);
  const h = { Authorization: `JWT ${token}` };
  expect((await request.post(`${CMS}/api/globals/tinh-nang`, { headers: h, data: { blog_bat: false } })).ok()).toBeTruthy();
  await choWeb(request, "/blog/so-chu-dao-7", (s) => s === 404);
  expect((await request.post(`${CMS}/api/globals/tinh-nang`, { headers: h, data: { blog_bat: true } })).ok()).toBeTruthy();
  await choWeb(request, "/blog/so-chu-dao-7", (s) => s === 200);
});

test("Giao diện website: menu chân trang, dải thông báo, banner, bài mới trang chủ, bài liên quan ở Khám phá — sửa ở CMS, web đổi theo", async ({ page, request }) => {
  const token = await tokenQt(request);
  const h = { Authorization: `JWT ${token}` };
  const bai = (await (await request.get(`${CMS}/api/bai-viet?where[slug][equals]=so-chu-dao-7&depth=0`, { headers: h })).json()).docs[0];
  expect(bai?.id).toBeTruthy();
  // link ngoài bị CMS từ chối
  expect((await request.post(`${CMS}/api/globals/dieu-huong`, { headers: h,
    data: { cot: [{ ten: "Xấu", lien_ket: [{ nhan: "x", loai: "duong_dan", duong_dan: "//evil.vn" }] }] } })).status()).toBe(400);
  expect((await request.post(`${CMS}/api/globals/dieu-huong`, { headers: h, data: { cot: [
    { ten: "Đọc gì hôm nay", lien_ket: [{ nhan: "Bài số 7 nổi bật", loai: "bai", bai: bai.id }, { nhan: "Tử vi", loai: "duong_dan", duong_dan: "/tu-vi" }] },
    { ten: "Pháp lý", lien_ket: [{ nhan: "Điều khoản", loai: "duong_dan", duong_dan: "/dieu-khoan" }] },
  ] } })).ok()).toBeTruthy();
  expect((await request.post(`${CMS}/api/globals/trang-chu`, { headers: h, data: {
    thong_bao: { bat: true, chu: "Tuần lễ ra mắt: mời bạn được thêm Sao", link: "/tai-khoan" },
    banner: { bat: true, nhan: "Mới", tieu_de: "Mùa thu tự soi cùng con số", mo_ta: "Chuỗi bài mới mỗi tuần.", nut_chu: "Đọc ngay", nut_link: "/blog" },
    bai_viet: { bat: true, tieu_de: "Đọc gì hôm nay", so_bai: 3, ghim: [bai.id] },
  } })).ok()).toBeTruthy();
  await choWeb(request, "/", (s, b) => s === 200 && b.includes("Mùa thu tự soi cùng con số") && b.includes("Bài số 7 nổi bật"));

  await page.goto(`${WEB}/`);
  await expect(page.getByTestId("thong-bao-site")).toContainText("Tuần lễ ra mắt");
  await expect(page.getByTestId("thong-bao-site").getByRole("link")).toHaveAttribute("href", "/tai-khoan");
  await expect(page.getByTestId("banner-trang-chu").getByRole("link", { name: /Đọc ngay/ })).toHaveAttribute("href", "/blog");
  await expect(page.getByTestId("bai-moi-trang-chu")).toContainText("Đọc gì hôm nay");
  await expect(page.getByTestId("bai-moi-trang-chu").locator('a[href="/blog/so-chu-dao-7"]')).toBeVisible();
  const chan = page.getByTestId("chan-trang");
  await expect(chan.getByText("Đọc gì hôm nay", { exact: true })).toBeVisible();
  await expect(chan.getByRole("link", { name: "Bài số 7 nổi bật" })).toHaveAttribute("href", "/blog/so-chu-dao-7");
  await expect(chan.getByText("Về chúng tôi", { exact: true })).toHaveCount(0);   // menu theo CMS, không trộn mặc định

  await page.goto(`${WEB}/kham-pha`);
  await expect(page.getByTestId("bai-lien-quan-mang").locator('a[href="/blog/so-chu-dao-7"]')).toBeVisible();

  // tắt hết → web quay về mặc định trong code, không còn dải/banner
  expect((await request.post(`${CMS}/api/globals/trang-chu`, { headers: h, data: {
    thong_bao: { bat: false }, banner: { bat: false }, bai_viet: { bat: false }, bai_theo_mang: { bat: false } } })).ok()).toBeTruthy();
  expect((await request.post(`${CMS}/api/globals/dieu-huong`, { headers: h, data: { cot: [] } })).ok()).toBeTruthy();
  await choWeb(request, "/", (s, b) => s === 200 && !b.includes("Mùa thu tự soi") && b.includes("Về chúng tôi"));
  await page.goto(`${WEB}/kham-pha`);
  await expect(page.getByTestId("bai-lien-quan-mang")).toHaveCount(0);
  await expect(page.getByTestId("thong-bao-site")).toHaveCount(0);
});

test("CMS-2 xác thực 2 bước: bật bằng mã → phiên mới thiếu mã bị đưa sang màn 2 bước → nhập mã → vào được", async ({ browser, request }) => {
  const token = await tokenQt(request);
  const TK = { email: "mfa@vidu.vn", mk: "mat-khau-mfa-0123456" };
  const tao = await request.post(`${CMS}/api/bien-tap-vien`, { headers: { Authorization: `JWT ${token}` },
    data: { email: TK.email, password: TK.mk, ten_hien_thi: "Người thử MFA", vai_tro: "bien_tap" } });
  expect(tao.ok()).toBeTruthy();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await dangNhap(page, TK);
  // Payload chỉ nhận cookie đăng nhập khi Origin nằm trong csrf (như trình duyệt gửi từ trang admin)
  const nguon = { headers: { Origin: CMS } };
  const bat = await page.request.post(`${CMS}/api/bien-tap-vien/mfa/bat-dau`, nguon);
  expect(bat.status(), await bat.text()).toBe(200);
  const bi = tuBase32((await bat.json()).bi_mat);
  expect((await page.request.post(`${CMS}/api/bien-tap-vien/mfa/xac-nhan`, { ...nguon, data: { ma: maTotp(bi, buocHienTai()) } })).ok()).toBeTruthy();
  // phiên khác (xoá cookie 2 bước, vẫn còn phiên mật khẩu) → không quyền gì cho tới khi nhập mã
  await ctx.clearCookies({ name: "cms-mfa" });
  const nhap = await page.request.get(`${CMS}/api/bai-viet?limit=1&draft=true&where[_status][equals]=draft`, nguon);
  expect((await nhap.json()).totalDocs).toBe(0);                     // thiếu mã → như khách: không thấy bản nháp
  await page.goto(`${CMS}/admin`);
  await expect(page).toHaveURL(/\/admin\/xac-thuc-2-buoc/);
  await expect(page.getByTestId("xac-thuc-2-buoc")).toBeVisible();
  await page.getByLabel("Mã 6 số").fill(maTotp(bi, buocHienTai() + 1));
  await page.getByRole("button", { name: "Xác nhận" }).click();
  await page.waitForURL(`${CMS}/admin`);
  await expect(page.getByRole("link", { name: /Bài viết/ }).first()).toBeVisible();
  await ctx.close();
});

test("CMS-3 trang đích: ghép khối trong CMS → /su-kien/{slug} có H1, thẻ công cụ, hỏi đáp (FAQPage), lời mời; hết hạn → noindex", async ({ page, request }) => {
  const token = await tokenQt(request);
  const h = { Authorization: `JWT ${token}` };
  const khoi = [
    { blockType: "dau_trang", nhan: "Mùa thi", tieu_de: "Chọn ngành hợp con số của bạn", mo_ta: "Xem số chủ đạo hợp nghề gì.", nut_chu: "Xem số của tôi", nut_link: "/than-so" },
    { blockType: "cong_cu", tieu_de: "Bắt đầu từ đây", ds: ["than_so", "tu_vi"] },
    { blockType: "hoi_dap", tieu_de: "Hỏi nhanh", ds: [{ cau_hoi: "Có mất phí không?", tra_loi: "Các công cụ đều miễn phí." }] },
    { blockType: "loi_moi", tieu_de: "Rủ bạn cùng xem", mo_ta: "Cả hai cùng nhận Sao." },
  ];
  expect((await request.post(`${CMS}/api/trang-dich`, { headers: h, data: { tieu_de: "Link xấu", _status: "published",
    khoi: [{ blockType: "dau_trang", tieu_de: "x", nut_chu: "y", nut_link: "https://evil.vn" }] } })).status()).toBe(400);
  const tao = await request.post(`${CMS}/api/trang-dich`, { headers: h, data: {
    tieu_de: "Mùa thi chọn ngành", mo_ta_seo: "Số chủ đạo hợp nghề gì — công cụ miễn phí cho mùa thi.", _status: "published", khoi } });
  expect(tao.status(), await tao.text()).toBe(201);
  const { doc } = await tao.json() as { doc: { id: number; slug: string } };
  expect(doc.slug).toBe("mua-thi-chon-nganh");
  await choWeb(request, "/su-kien/mua-thi-chon-nganh", (s) => s === 200);
  await page.goto(`${WEB}/su-kien/mua-thi-chon-nganh`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chọn ngành hợp con số của bạn");
  await expect(page.getByRole("link", { name: /Xem số của tôi/ })).toHaveAttribute("href", "/than-so");
  await expect(page.locator('[data-khoi="cong_cu"] a')).toHaveCount(2);
  await expect(page.locator('[data-khoi="loi_moi"] a')).toHaveAttribute("href", "/tai-khoan#moi");
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.join("")).toContain('"FAQPage"');
  expect(await (await request.get(`${WEB}/sitemap.xml`)).text()).toContain("/su-kien/mua-thi-chon-nganh");
  // hết hạn → còn xem được nhưng báo kết thúc + noindex, rời sitemap
  expect((await request.patch(`${CMS}/api/trang-dich/${doc.id}`, { headers: h, data: { het_han: "2020-01-01T00:00:00.000Z", _status: "published" } })).ok()).toBeTruthy();
  await choWeb(request, "/su-kien/mua-thi-chon-nganh", (s, b) => s === 200 && b.includes("đã kết thúc"));
  await page.goto(`${WEB}/su-kien/mua-thi-chon-nganh`);
  await expect(page.getByTestId("da-ket-thuc")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect((await request.get(`${WEB}/su-kien/khong-co-that`)).status()).toBe(404);
});

test("CMS-4 gợi ý liên kết nội bộ: bài viết + trang kiến thức gần nghĩa; bài có vectơ khi lưu", async ({ request }) => {
  const token = await tokenQt(request);
  const h = { Authorization: `JWT ${token}` };
  const bai = (await (await request.get(`${CMS}/api/bai-viet?where[slug][equals]=so-chu-dao-7&depth=0`, { headers: h })).json()).docs[0];
  expect(Object.keys(bai.vecto ?? {}).length).toBeGreaterThan(5);
  const r = await request.post(`${CMS}/api/bai-viet/goi-y-lien-ket`, { headers: h, data: {
    tieu_de: "Số chủ đạo 7 hợp nghề gì", tu_khoa_chinh: "số chủ đạo 7", the: ["thần số học"], tra_loi_nhanh: "Người số chủ đạo 7 hợp nghiên cứu." } });
  expect(r.ok()).toBeTruthy();
  const ds = (await r.json()).ds as { url: string; loai: string }[];
  expect(ds.some((m) => m.url === "/blog/so-chu-dao-7")).toBeTruthy();
  expect(ds.some((m) => m.loai === "trang" && m.url.startsWith("/kien-thuc"))).toBeTruthy();
  expect((await request.post(`${CMS}/api/bai-viet/goi-y-lien-ket`, { data: {} })).status()).toBe(403);
});

test("CMS không cho index, có header bảo mật; trang gốc vào thẳng admin", async ({ request }) => {
  const r = await request.get(`${CMS}/admin/login`);
  expect(r.headers()["x-robots-tag"]).toContain("noindex");
  expect(r.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  expect(await (await request.get(`${CMS}/robots.txt`)).text()).toContain("Disallow: /");
  const goc = await request.get(`${CMS}/`, { maxRedirects: 0 });
  expect([307, 308]).toContain(goc.status());
});
