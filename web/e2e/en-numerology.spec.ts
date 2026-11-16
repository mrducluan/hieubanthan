// EN-ALL GĐ 7 — /en/numerology: rewrite của /than-so (một cây component, ngôn ngữ là ngữ cảnh). Trang Anh không lộ chữ Việt
// (chữ hiển thị + aria/title/placeholder/alt + JSON-LD): form hồ sơ, nghi thức, bốn số cốt lõi (thẻ kiểm chứng, cách tính),
// chân dung, bản đồ con số (miễn phí ở bản Anh), chiều sâu (dải đời, bước ngoặt + đối chiếu năm, năm cá nhân, biểu đồ, chỉ số
// phụ), phái Chaldea + tổng hợp, nỗi đau, hỏi đáp + góp ý + "phái nào đúng"; sáu cụm kiến thức Thần số + cặp số (trang cụm +
// trang con, 308 slug, hreflang hai chiều, sitemap-en, 404 tiếng Anh). Không cuộn ngang ở 390px.
import { test, expect, type Page } from "@playwright/test";
import { CHU_THAN_SO_UI } from "../lib/chu/than-so";
import { CHU_THAN_SO } from "../lib/chu/cong-cu";
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
async function datHoSo(page: Page) {
  await page.goto("/en/privacy");
  await page.evaluate(() => {
    localStorage.setItem("hbt.hoso.v1", JSON.stringify({ v: 1, ho_ten: "Mary Ann Lee", ngay: 24, thang: 10, nam: 1988, tao_luc: new Date().toISOString() }));
  });
}

test.describe("catalog /en/numerology", () => {
  test("mọi khoá bảng chữ Thần số có chữ tiếng Anh, không dấu Việt, {biến} hợp lệ", () => {
    for (const [ten, bang] of [["CHU_THAN_SO_UI", CHU_THAN_SO_UI], ["CHU_THAN_SO", CHU_THAN_SO]] as const) {
      expect(khoaThieuEn(bang), ten).toEqual([]);
      for (const [k, m] of Object.entries(bang) as [string, { en?: string; mac_dinh: string }][]) {
        expect(m.en ?? "", `${ten}.${k}`).not.toMatch(VIET);
        const bien = (s: string) => new Set(s.match(/\{[a-z_]+\}/g) ?? []);
        for (const b of bien(m.en ?? "")) expect(bien(m.mac_dinh).has(b), `${ten}.${k} ${b}`).toBe(true);
      }
    }
  });
  test("trang công cụ + 7 cụm mở bản Anh có chữ máy chủ (title ≤ 70, description ≤ 160)", () => {
    const t = SO_TRANG_EN["/than-so"]!;
    expect(t.tieu_de_seo.length).toBeLessThanOrEqual(70);
    expect(t.mo_ta_seo.length).toBeLessThanOrEqual(160);
    expect(JSON.stringify(t)).not.toMatch(VIET);
    const mo = CAP_DUONG.filter((x) => x.mo && !x.rieng && khoaTheoDuong(x.vi) && (x.en.startsWith("/en/numerology") || x.en.startsWith("/en/compatibility")));
    expect(mo.map((x) => x.en).sort()).toEqual(["/en/compatibility/number-pairs", "/en/numerology/careers", "/en/numerology/compound-numbers",
      "/en/numerology/karmic-debt", "/en/numerology/life-path", "/en/numerology/love", "/en/numerology/personal-year"]);
    for (const x of mo) {
      const c = CUM_EN[x.vi]!;
      expect(c, x.vi).toBeTruthy();
      expect(c.tieu_de_seo.length, x.vi).toBeLessThanOrEqual(70);
      expect(c.mo_ta.length, x.vi).toBeLessThanOrEqual(160);
      expect(JSON.stringify(c)).not.toMatch(VIET);
    }
  });
});

test.describe("/en/numerology trên trình duyệt", () => {
  test("chưa có hồ sơ: SEO, hreflang hai chiều, một H1, JSON-LD tiếng Anh, form tiếng Anh", async ({ page }) => {
    const r = await page.goto("/en/numerology");
    expect(r!.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    const title = await page.title();
    expect(title).toContain("numerology");
    expect(title.length).toBeLessThanOrEqual(70);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/en\/numerology$/);
    expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(/\/than-so$/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Enter your name and date of birth");
    expect(await chuViet(page)).toEqual([]);
    const ld = await ldTrang(page);
    expect(ld).toContain('"inLanguage":"en"');
    expect(ld).not.toMatch(VIET);
    const hrefs = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);
    await page.goto("/than-so");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/numerology$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  });

  test("nhập form → nghi thức → bốn số, chân dung, bản đồ, chiều sâu tiếng Anh", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/en/privacy");
    await page.evaluate(() => { localStorage.removeItem("hbt.hoso.v1"); });
    await page.goto("/en/numerology");
    await page.fill("#ho-ten", "Mary Ann Lee");
    await page.getByLabel("Day", { exact: true }).fill("24");
    await page.getByLabel("Month", { exact: true }).fill("10");
    await page.getByLabel("Year", { exact: true }).fill("1988");
    await page.getByRole("button", { name: /Agree and see my result|Show/ }).first().click();
    await expect(page.getByTestId("so-duong-doi")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("ten-chinh")).toContainText("Mary Ann Lee", { timeout: 30_000 });
    await expect(page.getByTestId("the-duong_doi")).toContainText("Life Path");
    await expect(page.getByTestId("chan-dung")).toBeVisible();
    await expect(page.getByTestId("ban-do-con-so")).toBeVisible();
    await expect(page.getByTestId("noi-dau")).toBeVisible({ timeout: 20_000 });
    // kiểm chứng + cách tính
    await page.getByTestId("kiem-chung-duong_doi").getByRole("checkbox").first().click();
    await expect(page.getByTestId("ket-qua-kiem-chung-duong_doi")).toContainText("fit");
    await page.getByTestId("the-duong_doi").getByTestId("mo-cach-tinh").click();
    // chân dung — đủ bốn mặt
    for (const m of ["tinh_cam", "cong_viec", "bien_co"]) await page.getByTestId(`mat-${m}`).click();
    // chiều sâu — đủ các tab
    const sau = page.locator("#dong-doi");
    for (const tab of ["Turning points", "Personal years", "Birth chart grid", "More numbers", "Life stages"]) {
      await sau.getByRole("tab", { name: tab }).click();
    }
    await sau.getByRole("tab", { name: "Turning points" }).click();
    await page.getByRole("textbox", { name: "A year that mattered" }).fill("2015");
    await page.getByRole("button", { name: "Add year" }).click();
    await page.getByRole("button", { name: "Place on my timeline" }).click();
    await expect(page.getByTestId("ket-qua-doi-chieu")).toContainText("personal year", { timeout: 20_000 });
    expect(await chuViet(page)).toEqual([]);
    expect(await ngang(page)).toBeLessThanOrEqual(0);
  });

  test("Chaldea + tổng hợp hai phái tiếng Anh", async ({ page }) => {
    test.setTimeout(120_000);
    await datHoSo(page);
    await page.goto("/en/numerology");
    await expect(page.getByTestId("ten-chinh")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("truong-phai-than-so-mo").click();
    await page.getByRole("tab", { name: "Chaldean", exact: true }).click();
    await expect(page.getByTestId("bai-chaldea")).toBeVisible({ timeout: 20_000 });
    expect(await chuViet(page)).toEqual([]);
    await page.getByRole("tab", { name: "Both schools", exact: true }).click();
    await expect(page.getByTestId("bai-tong-hop")).toBeVisible({ timeout: 20_000 });
    expect(await chuViet(page)).toEqual([]);
    await page.getByRole("tab", { name: "Pythagorean", exact: true }).click();
  });

  test("nỗi đau → hỏi đáp tiếng Anh, góp ý, phái nào đúng", async ({ page }) => {
    test.setTimeout(120_000);
    await datHoSo(page);
    await page.goto("/en/numerology");
    const nd = page.getByTestId("noi-dau");
    await expect(nd).toBeVisible({ timeout: 30_000 });
    await nd.getByRole("button", { name: "Ask this" }).first().click();
    const luot = page.getByTestId("cau-tra-loi").first();
    await expect(luot).toBeVisible({ timeout: 30_000 });
    expect(await luot.innerText()).not.toMatch(VIET);
    await page.getByRole("textbox", { name: "Your question", exact: true }).fill("What are my core strengths?");
    await page.getByRole("button", { name: "Send question" }).click();
    await expect(page.getByTestId("cau-tra-loi").nth(1)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("phai-nao-dung").first()).toContainText("Which school describes you better?", { timeout: 20_000 });
    expect(await chuViet(page)).toEqual([]);
  });

  test("điện thoại 390px: không cuộn ngang, không chữ Việt", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await datHoSo(page);
    await page.goto("/en/numerology");
    await expect(page.getByTestId("the-duong_doi")).toBeVisible({ timeout: 30_000 });
    expect(await ngang(page)).toBeLessThanOrEqual(0);
    expect(await chuViet(page)).toEqual([]);
  });
});

const CUM: [string, string, string, string][] = [
  // [cụm Anh, cụm Việt, trang con Anh, trang con Việt]
  ["/en/numerology/life-path", "/than-so/y-nghia-so", "7", "so-7"],
  ["/en/numerology/careers", "/than-so/nghe-nghiep", "life-path-1", "so-1-hop-nghe-gi"],
  ["/en/numerology/love", "/than-so/tinh-yeu", "life-path-1", "so-1-trong-tinh-yeu"],
  ["/en/numerology/personal-year", "/than-so/nam-ca-nhan", "1", "nam-ca-nhan-1"],
  ["/en/numerology/karmic-debt", "/than-so/no-nghiep", "13", "no-nghiep-13"],
  ["/en/numerology/compound-numbers", "/than-so/so-kep", "10", "so-kep-10"],
  ["/en/compatibility/number-pairs", "/hop-doi/cap-so", "1-and-1", "so-chu-dao-1-va-1"],
];

test.describe("cụm kiến thức Thần số + cặp số bản Anh", () => {
  for (const [cumA, cumV, conA, conV] of CUM) {
    test(`${cumA}: cụm + trang con tiếng Anh, SEO, JSON-LD, hreflang hai chiều`, async ({ page }) => {
      test.setTimeout(90_000);
      const r = await page.goto(cumA);
      expect(r!.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
      expect((await page.title()).length).toBeLessThanOrEqual(70);
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(new RegExp(`${cumA}$`));
      expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${cumV}$`));
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await chuViet(page)).toEqual([]);
      const ld = await ldTrang(page);
      expect(ld).toContain('"inLanguage":"en"');
      expect(ld).not.toMatch(VIET);
      await expect(page.locator(`main a[href="${cumA}/${conA}"]`).first()).toBeAttached();

      await page.goto(`${cumA}/${conA}`);
      expect(new URL(page.url()).pathname).toBe(`${cumA}/${conA}`);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${cumV}/${conV}$`));
      expect((await page.title()).length).toBeLessThanOrEqual(70);
      expect(await chuViet(page)).toEqual([]);
      expect(await ldTrang(page)).not.toMatch(VIET);
      const hrefCon = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
      expect(hrefCon.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);

      await page.goto(`${cumV}/${conV}`);
      expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`${cumA}/${conA}$`));
    });
  }

  test("nút mời cuối trang trỏ công cụ bản Anh; điện thoại không cuộn ngang", async ({ page }) => {
    await page.goto("/en/numerology/life-path/7");
    await expect(page.getByRole("link", { name: "Work out my numbers" }).first()).toHaveAttribute("href", "/en/numerology");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/compatibility/number-pairs/3-and-7");
    expect(await ngang(page)).toBeLessThanOrEqual(0);
  });

  test("308 slug: URL Anh mang slug Việt → slug Anh; URL Việt mang slug Anh → slug Việt", async ({ request }) => {
    const a = await request.get("/en/numerology/life-path/so-7", { maxRedirects: 0 });
    expect(a.status()).toBe(308);
    expect(a.headers().location).toMatch(/\/en\/numerology\/life-path\/7$/);
    const b = await request.get("/than-so/so-kep/10", { maxRedirects: 0 });
    expect(b.status()).toBe(308);
    expect(b.headers().location).toMatch(/\/than-so\/so-kep\/so-kep-10$/);
  });

  test("sitemap-en có trang công cụ, cụm và trang con", async ({ request }) => {
    const sm = await (await request.get("/sitemap-en.xml")).text();
    expect(sm).toMatch(/<loc>[^<]*\/en\/numerology<\/loc>/);
    for (const [cumA, cumV, conA, conV] of CUM) {
      expect(sm).toMatch(new RegExp(`<loc>[^<]*${cumA}</loc>`));
      expect(sm).toMatch(new RegExp(`${cumA}/${conA}</loc><lastmod>[^<]+</lastmod><xhtml:link rel="alternate" hreflang="en"[^>]*/><xhtml:link rel="alternate" hreflang="vi" href="[^"]*${cumV}/${conV}"`));
    }
  });

  test("404 tiếng Anh: số không có", async ({ page }) => {
    for (const u of ["/en/numerology/life-path/10", "/en/numerology/careers/khong-co"]) {
      const r = await page.goto(u);
      expect(r!.status(), u).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
      expect((await page.locator("body").innerText()).split("\n").filter((l) => VIET.test(l) && !l.includes("Tiếng Việt"))).toEqual([]);
    }
  });
});
