// BLOG-4 — khung đọc bài blog (mục lục cột phải dính + tiến độ + scroll-spy), CTA chân bài đổi theo mảng của bài,
// bộ nhận mảng từ tiêu đề/thẻ, route web cho CMS đọc bài NotFair (BLOG-3b). Bài NotFair giả: e2e/notfair-gia.mjs.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { mangCuaBai } from "../lib/blog-mang";
import { dangHienMucLuc, ganIdMucLuc } from "../lib/muc-luc";
import { sanitizeNotFairArticleHtml } from "../lib/notfair-article";

const BAI_PT = "/blog/phong-thuy-nha-o-cho-nguoi-moi";
const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);

test("mangCuaBai: CMS chọn mảng thì theo đó; không có thì luật từ khoá trên tiêu đề/thẻ; không khớp → chung", () => {
  expect(mangCuaBai({ mang: "tu_vi", tieuDe: "Phong thuỷ phòng ngủ" })).toBe("tu_vi");
  expect(mangCuaBai({ mang: "chung", tieuDe: "Numerology là gì? Cách hiểu và sử dụng các con số" })).toBe("than_so");
  expect(mangCuaBai({ tieuDe: "Phong thuỷ nhà ở cho người mới", the: ["phong thuy"] })).toBe("phong_thuy");
  expect(mangCuaBai({ tieuDe: "Astrology là gì? Cách đọc bản đồ sao và hiểu giới hạn của chiêm tinh" })).toBe("tu_vi");
  expect(mangCuaBai({ tieuDe: "Bát tự là gì", slug: "bat-tu-la-gi" })).toBe("bat_tu");
  expect(mangCuaBai({ tieuDe: "Gieo quẻ Kinh Dịch khi nào", slug: "gieo-que-kinh-dich" })).toBe("kinh_dich");
  expect(mangCuaBai({ tieuDe: "Chọn ngày tốt cưới hỏi theo hoàng lịch" })).toBe("xem_ngay");
  expect(mangCuaBai({ tieuDe: "Self Discovery: Tự hiểu mình qua giá trị, thói quen và lựa chọn", the: ["self discovery"] })).toBe("chung");
});

test("ganIdMucLuc: gắn id cho H2/H3, giữ id sẵn có, không trùng; mục lục NotFair chèn sẵn bị bỏ khi lọc", () => {
  const { html, mucLuc } = ganIdMucLuc('<h2 id="co-san">Hướng nhà</h2><p>a</p><h3>Bếp &amp; cửa</h3><h2>Bếp</h2><h2>Bếp</h2>');
  expect(mucLuc).toEqual([{ id: "co-san", text: "Hướng nhà", cap: 2 }, { id: "bep-cua", text: "Bếp & cửa", cap: 3 },
    { id: "bep", text: "Bếp", cap: 2 }, { id: "bep-2", text: "Bếp", cap: 2 }]);
  expect(html).toContain('<h2 id="co-san">');
  expect(html).toContain('<h3 id="bep-cua">');
  expect(html).toContain('<h2 id="bep-2">');
  expect(dangHienMucLuc(mucLuc)).toBe(true);
  expect(dangHienMucLuc([{ id: "a", text: "a", cap: 2 }])).toBe(false);
  const sach = sanitizeNotFairArticleHtml('<nav class="nf-toc"><p class="nf-toc-title">Mục lục</p><ul><li class="nf-toc-l2"><a href="#x">x</a></li></ul></nav><h2>x</h2><p>b</p>');
  expect(sach).not.toContain("nf-toc");
  expect(sach).not.toContain("Mục lục");
  expect(sach).toContain("<h2>x</h2>");
});

test("bài NotFair dài: mục lục cột phải dính, mục đang đọc đổi khi cuộn, % tiến độ tăng, URL đổi #neo", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BAI_PT);
  await expect(page.locator("[data-khung-bai]")).toHaveAttribute("data-khung-bai", "hai-cot");
  const ml = page.getByTestId("muc-luc");
  await expect(ml).toBeVisible();
  // Không hiện hai mục lục: mục lục NotFair chèn sẵn đã bỏ.
  await expect(page.locator(".nf-toc")).toHaveCount(0);
  const muc = ml.locator("ol a");
  await expect(muc).toHaveCount(5);          // 4 H2 + 1 H3
  await expect(muc.first()).toHaveAttribute("aria-current", "location");
  await expect(page.getByTestId("tien-do")).toHaveText("0%");
  // Bấm mục cuối → cuộn tới đúng tiêu đề, URL mang #neo, mục đó thành "đang đọc".
  await muc.last().click();
  await expect(page).toHaveURL(/#ban-lam-viec$/);
  await expect(muc.last()).toHaveAttribute("aria-current", "location");
  await expect.poll(async () => Number(await page.getByTestId("muc-luc").getAttribute("data-tien-do"))).toBeGreaterThan(50);
  // Thanh dính: cuộn tiếp vẫn thấy mục lục trong khung nhìn.
  await page.mouse.wheel(0, 600);
  await expect(ml).toBeInViewport();
  // Phím K lùi về mục trước.
  await page.keyboard.press("k");
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("#giuong-ngu");
});

test("điện thoại: mục lục gập trên thân bài, cột phải ẩn", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BAI_PT);
  await expect(page.getByTestId("muc-luc-gon")).toBeVisible();
  await expect(page.getByTestId("muc-luc")).toBeHidden();
  await page.getByTestId("muc-luc-gon").locator("summary").click();
  await page.getByTestId("muc-luc-gon").locator("a", { hasText: "Giường ngủ" }).click();
  await expect(page).toHaveURL(/#giuong-ngu$/);
});

test("CTA chân bài đổi theo mảng: bài phong thuỷ mời xem nhà, bài thần số mời xem số; thẻ bên lề cùng mảng", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BAI_PT);
  const cta = page.getByTestId("cta-blog");
  await expect(cta).toHaveAttribute("data-mang", "phong_thuy");
  await expect(cta).toContainText("phong thuỷ");
  await expect(page.getByTestId("cta-blog-nut")).toHaveAttribute("href", "/phong-thuy");
  await expect(page.getByTestId("cta-ben")).toHaveAttribute("data-mang", "phong_thuy");
  await expect(page.getByTestId("cta-blog-kien-thuc").locator("a").first()).toHaveAttribute("href", "/phong-thuy/huong-hop-tuoi");
  await expect(page.getByTestId("cta-cuoi-bai")).toBeVisible();
  await cta.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await suKien(page)).some((e) => e.su_kien === "cross_cta_viewed" && e.tu === "blog" && e.den === "phong_thuy")).toBe(true);

  await page.goto("/blog/xem-than-so-hoc-numerology-cach-tinh-va-%C4%91oc-ho-so-tinh-tao");
  await expect(page.getByTestId("cta-blog")).toHaveAttribute("data-mang", "than_so");
  await expect(page.getByTestId("cta-blog-nut")).toHaveAttribute("href", "/than-so");
  // Bài ngắn (1 H2) → một cột, không mục lục.
  await expect(page.locator("[data-khung-bai]")).toHaveAttribute("data-khung-bai", "mot-cot");
});

test("có hồ sơ trên máy: CTA mang luận giải nhỏ cá nhân hoá của đúng mảng (engine), không lộ ngày sinh", async ({ page }) => {
  await napHoSo(page);
  await page.goto(BAI_PT);
  const cta = page.getByTestId("cta-blog");
  await expect(cta).toHaveAttribute("data-ca-nhan", "1");
  const rieng = await page.getByTestId("cta-blog-rieng").innerText();
  expect(rieng.length).toBeGreaterThan(20);
  for (const s of ["1990", "17/05", "17/5", "12:30"]) expect(rieng).not.toContain(s);
  await page.getByTestId("cta-blog-nut").click();
  await expect(page).toHaveURL(/\/phong-thuy/);
  await expect.poll(async () => (await suKien(page)).some((e) => e.su_kien === "cross_cta_clicked" && e.den === "phong_thuy" && e.ca_nhan === 1)).toBe(true);
});

test("route /api/cms/notfair: sai bí mật → 401; đúng bí mật → danh sách + bài NotFair cho CMS nhập", async ({ request }) => {
  expect((await request.get("/api/cms/notfair")).status()).toBe(401);
  expect((await request.get("/api/cms/notfair", { headers: { "x-cms-bi-mat": "sai" } })).status()).toBe(401);
  const ds = await request.get("/api/cms/notfair", { headers: { "x-cms-bi-mat": "e2e-cms-webhook" } });
  expect(ds.status()).toBe(200);
  const posts = (await ds.json()).posts as { slug: string }[];
  expect(posts.map((p) => p.slug)).toContain("phong-thuy-nha-o-cho-nguoi-moi");
  const bai = await request.get("/api/cms/notfair?slug=phong-thuy-nha-o-cho-nguoi-moi", { headers: { "x-cms-bi-mat": "e2e-cms-webhook" } });
  expect(bai.status()).toBe(200);
  expect((await bai.json()).post.content_html).toContain("Hướng nhà");
  expect((await request.get("/api/cms/notfair?slug=khong-co", { headers: { "x-cms-bi-mat": "e2e-cms-webhook" } })).status()).toBe(404);
});
