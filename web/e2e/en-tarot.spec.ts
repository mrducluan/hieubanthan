// EN-ALL GĐ 7 — /en/tarot: rewrite của /tarot (một cây component, ngôn ngữ là ngữ cảnh). Trang Anh không lộ chữ Việt (chữ hiển
// thị + aria/title/placeholder/alt + JSON-LD): đầu trang, câu hỏi mẫu, hiểu câu, xáo, quạt, lật, ý nghĩa từng lá, bài đọc,
// lá của ngày, trải bài đã rút, hỏi đáp; cụm "The 78 tarot cards" + trang con, 308 slug, hreflang hai chiều, sitemap-en, 404
// tiếng Anh; không cuộn ngang ở 390px. Chưa có ở bản Anh: thẻ chia sẻ câu trả lời, hỏi lại sau 30 ngày.
import { test, expect, type Page } from "@playwright/test";
import { CHU_TAROT_UI } from "../lib/chu/tarot";
import { CHU_TAROT } from "../lib/chu/cong-cu";
import { khoaThieuEn } from "../lib/chu-trang";
import { CUM_EN, SO_TRANG_EN } from "../lib/so-trang-en";
import { CAP_DUONG } from "../lib/duong-en";
import { khoaTheoDuong } from "../lib/kien-thuc";

const VIET = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

async function chuViet(page: Page, vung = "main"): Promise<string[]> {
  const chu = (await page.locator(vung).first().innerText()).split("\n").filter((l) => VIET.test(l));
  const thuocTinh = await page.$$eval(`${vung} [aria-label], ${vung} [title], ${vung} [placeholder], ${vung} [alt]`, (els) =>
    els.flatMap((e) => ["aria-label", "title", "placeholder", "alt"].map((a) => e.getAttribute(a) ?? "")));
  return [...chu, ...thuocTinh.filter((a) => VIET.test(a)).map((a) => `@${a}`)];
}
const ldTrang = async (page: Page) => (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
const ngang = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
// Phần tử thò ra ngoài khung mà KHÔNG nằm trong vùng cuộn ngang nào — in ra khi test hỏng để biết đúng chỗ.
const thoRa = (page: Page) => page.evaluate(() => {
  const w = window.innerWidth;
  const trongVungCuon = (e: Element) => {
    for (let p = e.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") return true;
    }
    return false;
  };
  return [...document.querySelectorAll("body *")]
    .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > w + 0.5 && !trongVungCuon(e); })
    .slice(0, 8).map((e) => `${e.tagName}[${e.getAttribute("data-testid") ?? ""}] ${(e.className || "").toString().slice(0, 60)}`);
});

test.describe("catalog /en/tarot", () => {
  test("mọi khoá bảng chữ Tarot có chữ tiếng Anh, không dấu Việt, {biến} hợp lệ", () => {
    for (const [ten, bang] of [["CHU_TAROT_UI", CHU_TAROT_UI], ["CHU_TAROT", CHU_TAROT]] as const) {
      expect(khoaThieuEn(bang), ten).toEqual([]);
      for (const [k, m] of Object.entries(bang) as [string, { en?: string; mac_dinh: string }][]) {
        expect(m.en ?? "", `${ten}.${k}`).not.toMatch(VIET);
        const bien = (s: string) => new Set(s.match(/\{[a-z_]+\}/g) ?? []);
        for (const b of bien(m.en ?? "")) expect(bien(m.mac_dinh).has(b), `${ten}.${k} ${b}`).toBe(true);
      }
    }
  });
  test("trang công cụ + cụm mở bản Anh có chữ máy chủ (title ≤ 70, description ≤ 160)", () => {
    const t = SO_TRANG_EN["/tarot"]!;
    expect(t.tieu_de_seo.length).toBeLessThanOrEqual(70);
    expect(t.mo_ta_seo.length).toBeLessThanOrEqual(160);
    expect(JSON.stringify(t)).not.toMatch(VIET);
    const mo = CAP_DUONG.filter((x) => x.mo && !x.rieng && khoaTheoDuong(x.vi) && x.en.startsWith("/en/tarot"));
    expect(mo.map((x) => x.en)).toEqual(["/en/tarot/cards"]);
    const x = CUM_EN["/tarot/la-bai"]!;
    expect(x.tieu_de_seo.length).toBeLessThanOrEqual(70);
    expect(x.mo_ta.length).toBeLessThanOrEqual(160);
    expect(JSON.stringify(x)).not.toMatch(VIET);
  });
});

test.describe("/en/tarot trên trình duyệt", () => {
  test("đầu trang tiếng Anh: SEO, hreflang hai chiều, một H1, JSON-LD tiếng Anh, không chữ Việt", async ({ page }) => {
    const r = await page.goto("/en/tarot");
    expect(r!.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    const title = await page.title();
    expect(title).toContain("tarot");
    expect(title.length).toBeLessThanOrEqual(70);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/en\/tarot$/);
    expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(/\/tarot$/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Tarot reading");
    await expect(page.getByTestId("goi-y-hoi")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("la-ngay")).toBeVisible({ timeout: 15_000 });
    expect(await chuViet(page)).toEqual([]);
    const ld = await ldTrang(page);
    expect(ld).toContain('"inLanguage":"en"');
    expect(ld).not.toMatch(VIET);
    const hrefs = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);
    await page.goto("/tarot");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/tarot$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page.locator("h1")).toContainText("Xem Tarot");
  });

  test("câu hỏi mẫu → hiểu câu → xáo máy → rút giúp → lật → bài đọc tiếng Anh; trải bài đã rút; hỏi đáp", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/en/tarot");
    await page.getByTestId("nhom-hoi-nhay_viec").click();
    await page.getByTestId("cau-mau").first().click();
    await expect(page.getByTestId("o-cau-hoi")).toHaveValue(/company/i);
    await expect(page.getByTestId("goi-y-cau-hoi")).toContainText("I read this as", { timeout: 15_000 });
    await expect(page.getByTestId("trai-bai-dang-chon")).toContainText("Spread:");
    await page.getByTestId("nut-tuy-chinh").click();
    await expect(page.getByTestId("tuy-chinh")).toContainText("Read for one area");
    expect(await chuViet(page)).toEqual([]);
    await page.getByTestId("trai-bai-ba_la_loi_khuyen").click();
    await page.getByTestId("nut-bat-dau").click();
    await expect(page.getByTestId("xao-bai")).toContainText("Hold to shuffle");
    expect(await chuViet(page)).toEqual([]);
    await page.getByTestId("nut-may-xao").click();
    await expect(page.getByTestId("quat-bai")).toBeVisible({ timeout: 15_000 });
    expect(await chuViet(page)).toEqual([]);
    await page.getByTestId("nut-rut-giup").click();
    await page.getByTestId("nut-lat-het").click();
    await expect(page.getByTestId("y-nghia-la").first()).toContainText("The card you just flipped");
    const bc = page.getByTestId("luan-giai-toan-bo");
    await expect(bc).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("lg-chuong-tra_loi")).toBeVisible();
    await expect(page.getByTestId("cau-hoi-da-hoi")).toContainText("You asked:");
    await expect(page.getByTestId("bao-cao-tarot")).toContainText("Major Arcana");
    expect(await chuViet(page)).toEqual([]);
    // bản Anh chưa có thẻ chia sẻ câu trả lời
    await expect(page.getByTestId("nut-trai-bai-moi")).toBeVisible();
    await expect(page.locator("[data-testid=mo-chia-se-tarot]")).toHaveCount(0);
    // link "Full meaning of …" trỏ trang lá bản Anh
    const lk = page.getByTestId("link-la-day-du").first();
    await expect(lk).toHaveAttribute("href", /^\/en\/tarot\/cards\/[a-z0-9-]+$/);
    expect(await ngang(page)).toBeLessThanOrEqual(0);

    // hỏi về lá vừa rút
    await page.getByRole("textbox", { name: "Your question", exact: true }).fill("What does the advice card mean?");
    await page.getByRole("button", { name: "Send question" }).click();
    const luot = page.getByTestId("cau-tra-loi").first();
    await expect(luot).toBeVisible({ timeout: 20_000 });
    expect(await luot.innerText()).not.toMatch(VIET);

    // trải bài đã rút (chỉ trên máy) — chữ + tên lá tiếng Anh
    await page.reload();
    await expect(page.getByTestId("lich-su-tarot")).toContainText("Your spreads", { timeout: 20_000 });
    expect(await chuViet(page, "[data-testid=lich-su-tarot]")).toEqual([]);
  });

  test("điện thoại 390px: không cuộn ngang, không chữ Việt", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/tarot");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByTestId("goi-y-hoi")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("la-ngay")).toBeVisible({ timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    await expect.poll(async () => ({ ngang: Math.max(0, await ngang(page)), tho_ra: await thoRa(page) }), { timeout: 10_000 })
      .toEqual({ ngang: 0, tho_ra: [] });
    expect(await chuViet(page)).toEqual([]);
  });
});

test.describe("/en/tarot/cards", () => {
  const CUM_A = "/en/tarot/cards", CUM_V = "/tarot/la-bai";
  const CON_A = `${CUM_A}/the-fool`, CON_V = `${CUM_V}/chang-kho`;

  test("cụm + trang con tiếng Anh, SEO, JSON-LD, hreflang hai chiều, tranh lá", async ({ page }) => {
    test.setTimeout(90_000);
    const r = await page.goto(CUM_A);
    expect(r!.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    expect((await page.title()).length).toBeLessThanOrEqual(70);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(new RegExp(`${CUM_A}$`));
    expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${CUM_V}$`));
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await chuViet(page)).toEqual([]);
    const ld = await ldTrang(page);
    expect(ld).toContain('"inLanguage":"en"');
    expect(ld).not.toMatch(VIET);
    await expect(page.locator(`main a[href="${CON_A}"]`).first()).toBeAttached();
    expect(await page.locator(`main a[href^="${CUM_A}/"]`).count()).toBeGreaterThanOrEqual(78);

    await page.goto(CON_A);
    expect(new URL(page.url()).pathname).toBe(CON_A);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("The Fool");
    expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${CON_V}$`));
    await expect(page.getByTestId("minh-hoa")).toBeVisible();
    expect(await chuViet(page)).toEqual([]);
    expect(await ldTrang(page)).not.toMatch(VIET);
    const hrefCon = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefCon.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);
    await expect(page.getByRole("link", { name: "Draw my tarot cards" }).first()).toHaveAttribute("href", "/en/tarot");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    expect(await ngang(page)).toBeLessThanOrEqual(0);
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto(CON_V);
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`${CON_A}$`));
    await page.goto(CUM_V);
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`${CUM_A}$`));
  });

  test("308 slug: URL Anh mang slug Việt → slug Anh; URL Việt mang slug Anh → slug Việt", async ({ request }) => {
    const a = await request.get(`${CUM_A}/chang-kho`, { maxRedirects: 0 });
    expect(a.status()).toBe(308);
    expect(a.headers().location).toMatch(new RegExp(`${CON_A}$`));
    const b = await request.get(`${CUM_V}/the-fool`, { maxRedirects: 0 });
    expect(b.status()).toBe(308);
    expect(b.headers().location).toMatch(new RegExp(`${CON_V}$`));
  });

  test("sitemap-en có trang công cụ, cụm và trang con lá bài", async ({ request }) => {
    const sm = await (await request.get("/sitemap-en.xml")).text();
    expect(sm).toMatch(/<loc>[^<]*\/en\/tarot<\/loc>/);
    expect(sm).toMatch(new RegExp(`<loc>[^<]*${CUM_A}</loc>`));
    expect(sm).toMatch(new RegExp(`<loc>[^<]*${CON_A}</loc><lastmod>`));
    expect(sm).toMatch(new RegExp(`${CON_A}</loc><lastmod>[^<]+</lastmod><xhtml:link rel="alternate" hreflang="en"[^>]*/><xhtml:link rel="alternate" hreflang="vi" href="[^"]*${CON_V}"`));
  });

  test("404 tiếng Anh: lá không có", async ({ page }) => {
    const r = await page.goto(`${CUM_A}/khong-co-la-nay`);
    expect(r!.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    expect((await page.locator("body").innerText()).split("\n").filter((l) => VIET.test(l) && !l.includes("Tiếng Việt"))).toEqual([]);
  });
});
