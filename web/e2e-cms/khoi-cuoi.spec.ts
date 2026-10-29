// CTA-2 — khối thẻ cuối trang với CMS GIẢ (playwright.cms.config.ts): bài viết CMS ít hơn số cột → thẻ bù kín hàng;
// cấu hình "Lối đi tiếp cuối trang" + thẻ ưu tiên từng URL đọc từ CMS (lọc link ngoài); tắt thẻ bù → co cột; đo end_cta_*.
import { test, expect, type Locator, type Page } from "@playwright/test";

const CMS = "http://127.0.0.1:4666";
const BI_MAT = "e2e-cms-webhook";

async function datCms(page: Page, trangThai: Record<string, unknown>, duong?: string) {
  await fetch(`${CMS}/__dat`, { method: "POST", body: JSON.stringify(trangThai) });
  // Webhook thật của web: xoá cache thẻ "cms" (+ "trang:<duong>") như khi Chủ biên bấm lưu ở CMS.
  const r = await page.request.post("/api/cms/lam-moi", { headers: { "x-cms-bi-mat": BI_MAT }, data: duong ? { duong } : {} });
  expect(r.ok()).toBe(true);
}

/** Mọi hàng của lưới kín (mép phải hàng nào cũng bằng hàng đầu). Khối nằm trong <Suspense>: React gửi nó trước trong một
 *  vùng ẩn rồi mới chuyển vào chỗ → đếm `li` đã đủ nhưng chưa hiển thị; CHỜ cho tới khi ô hiển thị rồi mới đo (CI chậm lộ ra). */
async function kinHang(luoi: Locator, ten: string) {
  const do_ = () => luoi.evaluate((el) => [...el.children].filter((c) => (c as HTMLElement).offsetParent !== null)
    .map((c) => { const r = c.getBoundingClientRect(); return { top: Math.round(r.top), right: Math.round(r.right) }; }));
  await expect.poll(async () => (await do_()).length, { message: ten }).toBeGreaterThan(0);
  const o = await do_();
  const hang = new Map<number, number[]>();
  for (const x of o) hang.set(x.top, [...(hang.get(x.top) ?? []), x.right]);
  const ds = [...hang.values()], mep = Math.max(...ds[0]!);
  for (const h of ds) expect(Math.abs(Math.max(...h) - mep), `${ten}: hàng lủng ô`).toBeLessThanOrEqual(2);
}

const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await datCms(page, { datLai: true });
});

test("trang chủ: 2 bài CMS + 1 thẻ bù (Thư viện) → hàng 3 ô kín, thẻ bù có chip", async ({ page }) => {
  await page.goto("/");
  const k = page.getByTestId("bai-moi-trang-chu");
  await expect(k.locator("li")).toHaveCount(3);
  await expect(k.locator("[data-the-lap]")).toHaveCount(1);
  await expect(k.locator('[data-the-lap="/kien-thuc"]')).toContainText("Thư viện");
  await kinHang(k.locator("ul"), "bài viết mới");
});

test("/hop-doi: bài liên quan (1 bài thần số) bù 2 lối đi tiếp, không lặp link 'Kiến thức Hợp đôi' ngay trên", async ({ page }) => {
  await page.goto("/hop-doi");
  const k = page.getByTestId("bai-lien-quan-mang");
  await expect(k.locator("li")).toHaveCount(3);
  await kinHang(k.locator("ul"), "bài liên quan");
  const kien = await page.getByTestId("cum-kien-thuc-tru").locator("a").evaluateAll((a) => a.map((x) => x.getAttribute("href")));
  const bu = await k.locator("[data-the-lap]").evaluateAll((a) => a.map((x) => x.getAttribute("data-the-lap")));
  expect(bu).toHaveLength(2);
  for (const d of bu) expect(kien.includes(d)).toBe(false);
});

test("CMS global 'Lối đi tiếp': thẻ của nhóm mảng thay mặc định; link ngoài bị web lọc bỏ", async ({ page }) => {
  await datCms(page, { loiDi: { bat: true, cum_truoc: true, nhom: [
    { tru: "/hop-doi", the: [
      { duong: "https://evil.example/x", ten: "Link ngoài", mo_ta: "Không được hiện", nhan: "cong_cu", hinh: "tu-vi" },
      { duong: "/xem-ngay-tot", ten: "Thẻ thử từ CMS", mo_ta: "Mô tả thẻ thử từ CMS.", nhan: "cong_cu", hinh: "bat-tu" },
    ] },
    { tru: "chung", the: [{ duong: "/tu-dien", ten: "Từ điển (CMS)", mo_ta: "Giải nghĩa thuật ngữ.", nhan: "thu_vien", hinh: "kinh-dich" }] },
  ] } });
  await page.goto("/hop-doi");
  const k = page.getByTestId("cum-kien-thuc-tru");
  const bu = k.locator("[data-the-lap]");
  await expect(bu).toHaveCount(2);
  await expect(bu.nth(0)).toContainText("Thẻ thử từ CMS");
  await expect(bu.nth(1)).toContainText("Từ điển (CMS)");
  await expect(page.locator('a[href^="https://evil.example"]')).toHaveCount(0);
  await kinHang(k.locator("ul"), "kiến thức hợp đôi");
});

test("thẻ ưu tiên của URL (Trang website → Lối đi tiếp) đứng trước nhóm mảng", async ({ page }) => {
  await datCms(page, { trang: { "/kinh-dich": { loi_di_tiep: [
    { duong: "/than-so", ten: "Ưu tiên riêng trang này", mo_ta: "Thẻ ưu tiên đặt cho /kinh-dich.", nhan: "cong_cu", hinh: "than-so" },
  ] } } }, "/kinh-dich");
  await page.goto("/kinh-dich");
  const bu = page.getByTestId("cum-kien-thuc-tru").locator("[data-the-lap]");
  await expect(bu).toHaveCount(2);
  await expect(bu.first()).toContainText("Ưu tiên riêng trang này");
  await expect(bu.nth(1)).toHaveAttribute("data-the-lap", "/hom-nay#que-ngay");
});

test("tắt thẻ bù ở CMS → không thẻ bù, lưới co theo số mục (1 cụm chiếm cả hàng, không lủng ô)", async ({ page }) => {
  await datCms(page, { loiDi: { bat: false, nhom: [] } });
  await page.goto("/kinh-dich");
  const k = page.getByTestId("cum-kien-thuc-tru");
  await expect(k.locator("[data-the-lap]")).toHaveCount(0);
  const [o, ul] = await Promise.all([k.locator("li").first().boundingBox(), k.locator("ul").boundingBox()]);
  expect(Math.abs(o!.width - ul!.width)).toBeLessThanOrEqual(2);
});

test("đo: thấy khối → end_cta_viewed (khối + từng thẻ bù); bấm thẻ bù → end_cta_clicked{lap:1, den, thu_tu}", async ({ page }) => {
  await page.goto("/hop-doi");
  const k = page.getByTestId("cum-kien-thuc-tru");
  await k.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await suKien(page)).filter((e) => e.su_kien === "end_cta_viewed" && e.khoi === "kien_thuc_tru").length).toBe(3);
  const thay = (await suKien(page)).filter((e) => e.su_kien === "end_cta_viewed" && e.khoi === "kien_thuc_tru");
  expect(thay.find((e) => e.lap === 0)).toMatchObject({ so_lap: 2, trang: "/hop-doi" });
  expect(thay.filter((e) => e.lap === 1).map((e) => e.den)).toEqual(["/than-so/tinh-yeu", "/tu-vi#hop-tham"]);
  // Chặn điều hướng (Next Link bỏ qua khi defaultPrevented) để đọc sự kiện ngay trên trang.
  await page.evaluate(() => document.addEventListener("click", (e) => e.preventDefault(), true));
  await k.locator('[data-the-lap="/tu-vi#hop-tham"] a').click();
  await k.locator("li").first().locator("a").click();
  const bam = (await suKien(page)).filter((e) => e.su_kien === "end_cta_clicked");
  expect(bam[0]).toMatchObject({ khoi: "kien_thuc_tru", lap: 1, den: "/tu-vi#hop-tham", thu_tu: 3 });
  expect(bam[1]).toMatchObject({ khoi: "kien_thuc_tru", lap: 0, den: "_that", thu_tu: 1 });
});

test("đo khối bài viết: trang chủ ghi khoi=bai_moi, không lộ chữ bài", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("bai-moi-trang-chu").scrollIntoViewIfNeeded();
  await expect.poll(async () => (await suKien(page)).some((e) => e.su_kien === "end_cta_viewed" && e.khoi === "bai_moi" && e.lap === 0)).toBe(true);
  const ds = (await suKien(page)).filter((e) => String(e.su_kien).startsWith("end_cta"));
  expect(JSON.stringify(ds)).not.toMatch(/Thần số học là gì|Self Discovery/);
});
