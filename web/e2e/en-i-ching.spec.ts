// EN-ALL GĐ 6 — /en/i-ching: rewrite của /kinh-dich (một cây component, ngôn ngữ là ngữ cảnh). Trang Anh không lộ chữ Việt
// (chữ hiển thị + aria/title/placeholder/alt + JSON-LD, trừ nguyên văn Hán): đầu trang, cách gieo, tự gieo từng hào, gieo đồng
// xu, đọc quẻ + ba cách đọc + lời kinh, lịch sử quẻ; cụm "The 64 hexagrams" + trang con, 308 slug, hreflang hai chiều,
// sitemap-en, 404 tiếng Anh; không cuộn ngang ở 390px. Chưa có ở bản Anh: thẻ chia sẻ quẻ, hỏi lại sau 30 ngày, nhắc ngày.
import { test, expect, type Page } from "@playwright/test";
import { CHU_KINH_DICH_UI } from "../lib/chu/kinh-dich";
import { CHU_HOI_DAP } from "../lib/chu/hoi-dap";
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

test.describe("catalog /en/i-ching", () => {
  test("mọi khoá bảng chữ Kinh Dịch có chữ tiếng Anh, không dấu Việt, {biến} hợp lệ", () => {
    for (const [ten, bang] of [["CHU_KINH_DICH_UI", CHU_KINH_DICH_UI], ["CHU_HOI_DAP", CHU_HOI_DAP]] as const) {
      expect(khoaThieuEn(bang), ten).toEqual([]);
      for (const [k, m] of Object.entries(bang) as [string, { en?: string; mac_dinh: string; toi_da?: number }][]) {
        expect(m.en ?? "", `${ten}.${k}`).not.toMatch(VIET);
        const bien = (s: string) => new Set(s.match(/\{[a-z_]+\}/g) ?? []);
        for (const b of bien(m.en ?? "")) expect(bien(m.mac_dinh).has(b), `${ten}.${k} ${b}`).toBe(true);
      }
    }
  });
  test("trang công cụ + cụm mở bản Anh có chữ máy chủ (title ≤ 70, description ≤ 160)", () => {
    const t = SO_TRANG_EN["/kinh-dich"]!;
    expect(t.tieu_de_seo.length).toBeLessThanOrEqual(70);
    expect(t.mo_ta_seo.length).toBeLessThanOrEqual(160);
    expect(JSON.stringify(t)).not.toMatch(VIET);
    const mo = CAP_DUONG.filter((x) => x.mo && !x.rieng && khoaTheoDuong(x.vi) && x.en.startsWith("/en/i-ching"));
    expect(mo.map((x) => x.en)).toEqual(["/en/i-ching/hexagrams"]);
    const x = CUM_EN["/kinh-dich/que"]!;
    expect(x.tieu_de_seo.length).toBeLessThanOrEqual(70);
    expect(x.mo_ta.length).toBeLessThanOrEqual(160);
    expect(JSON.stringify(x)).not.toMatch(VIET);
  });
});

test.describe("/en/i-ching trên trình duyệt", () => {
  test("đầu trang tiếng Anh: SEO, hreflang hai chiều, một H1, JSON-LD tiếng Anh, không chữ Việt", async ({ page }) => {
    const r = await page.goto("/en/i-ching");
    expect(r!.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    const title = await page.title();
    expect(title).toContain("I Ching");
    expect(title.length).toBeLessThanOrEqual(70);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/en\/i-ching$/);
    expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(/\/kinh-dich$/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("I Ching reading");
    // Hướng dẫn gieo xu (gập) cũng phải là tiếng Anh
    await page.getByTestId("cach-gieo-mo").click();
    await expect(page.getByTestId("hoi-dung")).toContainText("Good:");
    expect(await chuViet(page)).toEqual([]);
    const ld = await ldTrang(page);
    expect(ld).toContain('"inLanguage":"en"');
    expect(ld).not.toMatch(VIET);
    const hrefs = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);
    await page.goto("/kinh-dich");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/i-ching$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page.locator("h1")).toContainText("Gieo quẻ Kinh Dịch");
  });

  test("tự gieo từng hào → quẻ + lời đọc tiếng Anh (ba cách đọc, lời kinh), lịch sử quẻ, chưa có thẻ chia sẻ", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/en/i-ching");
    await page.getByRole("combobox", { name: "How to cast" }).selectOption("gieo_tay");
    const ch = page.getByTestId("chon-hao");
    await expect(ch).toContainText("Enter what you tossed");
    await ch.getByRole("textbox", { name: "Your six tossed lines" }).fill("7 7 8 7 9 8");
    await expect(ch).toContainText("(6/6 lines)");
    expect(await chuViet(page)).toEqual([]);
    await page.getByRole("textbox", { name: "Your I Ching question" }).fill("Should I accept the manager role this quarter?");
    await page.getByRole("button", { name: "Send question" }).click();
    const que = page.getByTestId("que").last();
    await expect(que).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("ten-que-ban").last()).toContainText("Dui");
    await expect(page.getByTestId("ten-que-ban").last()).toContainText("hexagram 58");
    await expect(page.getByTestId("giai-thich-dong").last()).toContainText("changing lines");
    await expect(page.getByTestId("mo-chia-se-que")).toHaveCount(0);
    const dq = page.getByTestId("doc-que").last();
    await expect(dq).toContainText("Topic:");
    await dq.getByTestId("goc-nhin").getByRole("button").first().click();
    await expect(dq.getByTestId("goc-nhin")).toContainText("Six Lines");
    await dq.getByTestId("loi-kinh").getByRole("button").first().click();
    await expect(dq.getByTestId("loi-kinh")).toContainText("original text");
    // Mở cả bảng Lục Hào để soát tên mã
    const dong = dq.locator("[data-phai] > button[aria-expanded=false]");
    while (await dong.count()) await dong.first().click();
    await expect(dq.locator("[data-phai=luc_hao] table")).toContainText("Relation");
    expect(await chuViet(page)).toEqual([]);
    expect(await ngang(page)).toBeLessThanOrEqual(0);

    // Lịch sử quẻ trên máy — tên quẻ tiếng Anh
    await page.reload();
    await page.getByTestId("lich-su-que-mo").click();
    await expect(page.getByTestId("lich-su-que")).toContainText("Hexagrams you've cast");
    await expect(page.getByTestId("lich-su-que-muc").first()).toContainText("Dui");
    expect(await chuViet(page, "[data-testid=lich-su-que]")).toEqual([]);

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await ngang(page)).toBeLessThanOrEqual(0);
  });

  test("máy gieo: nghi thức đồng xu tiếng Anh", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/en/i-ching");
    await page.getByRole("textbox", { name: "Your I Ching question" }).fill("Is next month a good time to move house?");
    await page.getByRole("button", { name: "Send question" }).click();
    const gx = page.getByTestId("gieo-dong-xu");
    await expect(gx).toContainText("Toss three coins", { timeout: 60_000 });
    expect(await chuViet(page, "[data-testid=gieo-dong-xu]")).toEqual([]);
    await page.getByTestId("bo-qua-gieo").click();
    await expect(page.getByTestId("que").last()).toBeVisible();
    await expect(gx).toContainText("Line 6");
  });

  test("điện thoại 390px: không cuộn ngang, không chữ Việt", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/i-ching");
    await expect(page.locator("h1")).toBeVisible();
    expect(await ngang(page)).toBeLessThanOrEqual(0);
    expect(await chuViet(page)).toEqual([]);
  });
});

test.describe("/en/i-ching/hexagrams", () => {
  const CUM_A = "/en/i-ching/hexagrams", CUM_V = "/kinh-dich/que";
  const CON_A = `${CUM_A}/1-qian`, CON_V = `${CUM_V}/que-1-can`;

  test("cụm + trang con tiếng Anh, SEO, JSON-LD, hreflang hai chiều, hình quẻ", async ({ page }) => {
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

    await page.goto(CON_A);
    expect(new URL(page.url()).pathname).toBe(CON_A);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${CON_V}$`));
    await expect(page.getByTestId("minh-hoa")).toBeVisible();
    expect(await page.getByTestId("minh-hoa").locator("[aria-label]").first().getAttribute("aria-label")).toContain("Hexagram 1");
    expect(await chuViet(page)).toEqual([]);
    expect(await ldTrang(page)).not.toMatch(VIET);
    const hrefCon = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefCon.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);
    await expect(page.getByRole("link", { name: "Cast a hexagram for my question" }).first()).toHaveAttribute("href", "/en/i-ching");

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
    const a = await request.get(`${CUM_A}/que-1-can`, { maxRedirects: 0 });
    expect(a.status()).toBe(308);
    expect(a.headers().location).toMatch(new RegExp(`${CON_A}$`));
    const b = await request.get(`${CUM_V}/1-qian`, { maxRedirects: 0 });
    expect(b.status()).toBe(308);
    expect(b.headers().location).toMatch(new RegExp(`${CON_V}$`));
  });

  test("sitemap-en có trang công cụ, cụm và trang con quẻ", async ({ request }) => {
    const sm = await (await request.get("/sitemap-en.xml")).text();
    expect(sm).toMatch(/<loc>[^<]*\/en\/i-ching<\/loc>/);
    expect(sm).toMatch(new RegExp(`<loc>[^<]*${CUM_A}</loc>`));
    expect(sm).toMatch(new RegExp(`<loc>[^<]*${CON_A}</loc>`));
  });

  test("404 tiếng Anh: quẻ không có", async ({ page }) => {
    const r = await page.goto(`${CUM_A}/khong-co-que-nay`);
    expect(r!.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    expect((await page.locator("body").innerText()).split("\n").filter((l) => VIET.test(l) && !l.includes("Tiếng Việt"))).toEqual([]);
  });
});
