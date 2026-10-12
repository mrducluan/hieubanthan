// Luồng thật của phòng biên tập, từ CMS tới hieuban.com:
// tài khoản đầu tiên (khoá theo email) → viết bài trong trình soạn Lexical, khung Kiểm định chấm khi gõ → lỗi chặn không
// cho xuất bản → xuất bản → web hiện bài (H1, Trả lời nhanh, mục lục, FAQ, JSON-LD, sitemap, llms.txt, .md) → sửa nháp
// + xem trước có ký → đổi slug giữ link cũ (308) → biên tập viên không có nút Xuất bản → tắt "blog" ở Tính năng.
import { createHmac } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { BI_MAT } from "../playwright.config";

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

test("CMS không cho index, có header bảo mật; trang gốc vào thẳng admin", async ({ request }) => {
  const r = await request.get(`${CMS}/admin/login`);
  expect(r.headers()["x-robots-tag"]).toContain("noindex");
  expect(r.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  expect(await (await request.get(`${CMS}/robots.txt`)).text()).toContain("Disallow: /");
  const goc = await request.get(`${CMS}/`, { maxRedirects: 0 });
  expect([307, 308]).toContain(goc.status());
});
