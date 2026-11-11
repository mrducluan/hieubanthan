// EN-ALL GĐ 3d — /en/bazi: rewrite của /bat-tu (một cây component, ngôn ngữ là ngữ cảnh). Trang Anh không lộ chữ Việt
// (chữ hiển thị + aria/title/placeholder), luồng hồ sơ → tứ trụ → chương đầu bài đọc bằng tiếng Anh, SEO (canonical,
// hreflang hai chiều, một H1), nút "Tiếng Việt" về /bat-tu, và trang Việt /bat-tu không đổi chữ.
import { test, expect, type Page } from "@playwright/test";
import { CHU_BAT_TU_UI } from "../lib/chu/bat-tu";
import { CHU_GIAO_DIEN } from "../lib/chu/giao-dien";
import { CHU_BAT_TU } from "../lib/chu/cong-cu";
import { khoaThieuEn } from "../lib/chu-trang";
import { SO_TRANG_EN } from "../lib/so-trang-en";
import { CAP_DUONG } from "../lib/duong-en";
import { mucSoTrang } from "../lib/so-trang";
import { CHU_KIEN_THUC } from "../lib/chu/kien-thuc";
import { CUM_EN } from "../lib/so-trang-en";
import { khoaTheoDuong } from "../lib/kien-thuc";

const VIET = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

/** Chữ nhìn thấy + thuộc tính đọc được của <main> có chữ Việt (trả các dòng lỗi). */
async function chuViet(page: Page): Promise<string[]> {
  const chu = (await page.locator("main").innerText()).split("\n").filter((l) => VIET.test(l));
  const thuocTinh = await page.$$eval("main [aria-label], main [title], main [placeholder], main [alt]", (els) =>
    els.flatMap((e) => ["aria-label", "title", "placeholder", "alt"].map((a) => e.getAttribute(a) ?? "")));
  return [...chu, ...thuocTinh.filter((a) => VIET.test(a)).map((a) => `@${a}`)];
}

test.describe("catalog /en/bazi", () => {
  test("mọi khoá bảng chữ của trang có chữ tiếng Anh, không dấu Việt, trong giới hạn", () => {
    for (const [ten, bang] of [["CHU_BAT_TU_UI", CHU_BAT_TU_UI], ["CHU_GIAO_DIEN", CHU_GIAO_DIEN], ["CHU_BAT_TU", CHU_BAT_TU], ["CHU_KIEN_THUC", CHU_KIEN_THUC]] as const) {
      expect(khoaThieuEn(bang), ten).toEqual([]);
      for (const [k, m] of Object.entries(bang) as [string, { en?: string; toi_da?: number }][]) {
        expect(m.en ?? "", `${ten}.${k}`).not.toMatch(VIET);
        expect((m.en ?? "").length, `${ten}.${k}`).toBeLessThanOrEqual(m.toi_da ?? 300);
        // `{bien}` chỉ nhận chữ thường + gạch dưới (thayBienChu) — `{c1}` sẽ hiện nguyên văn trên trang.
        for (const v of [m.en ?? "", (m as { mac_dinh?: string }).mac_dinh ?? ""]) expect(v.match(/\{[^}]*\}/g)?.filter((x) => !/^\{[a-z_]+\}$/.test(x)) ?? [], `${ten}.${k}`).toEqual([]);
      }
    }
  });
  test("mọi trang công cụ mở bản Anh qua rewrite có chữ máy chủ tiếng Anh (title ≤ 70, description ≤ 160)", () => {
    for (const c of CAP_DUONG.filter((x) => x.mo && !x.rieng && mucSoTrang(x.vi)?.nhom === "cong_cu")) {
      const t = SO_TRANG_EN[c.vi];
      expect(t, c.vi).toBeTruthy();
      expect(t!.tieu_de_seo.length, c.vi).toBeLessThanOrEqual(70);
      expect(t!.mo_ta_seo.length, c.vi).toBeLessThanOrEqual(160);
      expect(JSON.stringify(t), c.vi).not.toMatch(VIET);
    }
  });
});

test.describe("catalog cụm kiến thức /en/bazi/*", () => {
  test("mọi cụm kiến thức mở bản Anh qua rewrite có chữ máy chủ tiếng Anh (title ≤ 70, description ≤ 160)", () => {
    const mo = CAP_DUONG.filter((x) => x.mo && !x.rieng && khoaTheoDuong(x.vi) && x.en.startsWith("/en/bazi"));
    expect(mo.map((x) => x.en).sort()).toEqual(["/en/bazi/day-masters", "/en/bazi/element-by-birth-year", "/en/bazi/ten-gods"]);
    for (const c of mo) {
      const t = CUM_EN[c.vi];
      expect(t, c.vi).toBeTruthy();
      expect(t!.tieu_de_seo.length, c.vi).toBeLessThanOrEqual(70);
      expect(t!.mo_ta.length, c.vi).toBeLessThanOrEqual(160);
      expect(JSON.stringify(t), c.vi).not.toMatch(VIET);
    }
  });
});

/** JSON-LD riêng của trang (bỏ khối Organization/WebSite chung của layout — tên Việt của thương hiệu là chủ ý). */
async function ldTrang(page: Page): Promise<string> {
  const ds = await page.locator('main script[type="application/ld+json"]').allTextContents();
  return ds.join("\n");
}

const CUM: [string, string, string, string, string][] = [
  // [cụm Anh, cụm Việt, trang con Anh, trang con Việt tương đương, chữ phải có trong H1 trang con]
  ["/en/bazi/ten-gods", "/bat-tu/thap-than", "/en/bazi/ten-gods/friend", "/bat-tu/thap-than/ty-kien", "Friend"],
  ["/en/bazi/day-masters", "/bat-tu/nhat-chu", "/en/bazi/day-masters/jia-yang-wood", "/bat-tu/nhat-chu/nhat-chu-giap", "Jia"],
  ["/en/bazi/element-by-birth-year", "/bat-tu/menh-theo-nam", "/en/bazi/element-by-birth-year/born-1988", "/bat-tu/menh-theo-nam/sinh-nam-1988-menh-gi", "1988"],
];

test.describe("/en/bazi cụm kiến thức trên trình duyệt", () => {
  for (const [cumEn, cumVi, conEn, conVi, h1] of CUM) {
    test(`${cumEn}: trang cụm + một trang con tiếng Anh, SEO, hreflang hai chiều, đổi ngôn ngữ`, async ({ page }) => {
      test.setTimeout(90_000);
      // ---- trang cụm
      const r = await page.goto(cumEn);
      expect(r!.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
      const title = await page.title();
      expect(title.length).toBeLessThanOrEqual(70);
      expect(title).not.toMatch(VIET);
      expect((await page.locator('meta[name="description"]').getAttribute("content"))!.length).toBeLessThanOrEqual(160);
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(new RegExp(`${cumEn}$`));
      expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${cumVi}$`));
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByTestId("tra-loi-nhanh")).toContainText("Quick answer");
      expect(await chuViet(page)).toEqual([]);
      const ld = await ldTrang(page);
      expect(ld).toContain('"inLanguage":"en"');
      expect(ld).toContain("CollectionPage");
      expect(ld).toContain("BreadcrumbList");
      expect(ld).not.toMatch(VIET);
      // mọi link trong <main> là URL Anh (hoặc #neo)
      const hrefs = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
      expect(hrefs.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);
      await expect(page.locator(`main a[href="${conEn}"]`).first()).toBeVisible();

      // ---- trang con
      await page.goto(conEn);
      expect(new URL(page.url()).pathname).toBe(conEn);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toContainText(h1);
      expect((await page.title()).length).toBeLessThanOrEqual(70);
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(new RegExp(`${conEn}$`));
      expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${conVi}$`));
      await expect(page.locator("[data-dong-tac-gia]")).toContainText("Hieuban editorial team");
      await expect(page.getByTestId("minh-hoa-qr")).toContainText("Scan to open this page");
      expect(await chuViet(page)).toEqual([]);
      const ldCon = await ldTrang(page);
      expect(ldCon).toContain('"@type":"Article"');
      expect(ldCon).toContain('"inLanguage":"en"');
      expect(ldCon).toContain("Hieuban editorial team");
      expect(ldCon).toContain("FAQPage");
      expect(ldCon).not.toMatch(VIET);
      const hrefCon = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
      expect(hrefCon.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);

      // ---- 390px không cuộn ngang
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      await page.setViewportSize({ width: 1280, height: 900 });

      // ---- nút đổi ngôn ngữ → trang Việt CÙNG mục; trang Việt khai hreflang về bản Anh
      await page.getByTestId("doi-tieng-viet").first().click();
      await expect(page).toHaveURL(new RegExp(`${conVi}$`));
      await expect(page.locator("html")).toHaveAttribute("lang", "vi");
      expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`${conEn}$`));
      await page.goto(cumVi);
      expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`${cumEn}$`));
    });
  }

  test("URL Anh mang slug Việt → 308 về slug Anh; URL Việt mang slug Anh → 308 về slug Việt", async ({ request }) => {
    const a = await request.get("/en/bazi/ten-gods/ty-kien", { maxRedirects: 0 });
    expect(a.status()).toBe(308);
    expect(a.headers().location).toMatch(/\/en\/bazi\/ten-gods\/friend$/);
    const b = await request.get("/bat-tu/thap-than/friend", { maxRedirects: 0 });
    expect(b.status()).toBe(308);
    expect(b.headers().location).toMatch(/\/bat-tu\/thap-than\/ty-kien$/);
  });

  test("/en/bazi có khối Learn BaZi với 3 cụm; sitemap-en có cụm + trang con kèm hreflang", async ({ page, request }) => {
    await page.goto("/en/bazi");
    const khoi = page.getByTestId("cum-kien-thuc-tru");
    for (const [cumEn] of CUM) await expect(khoi.locator(`a[href="${cumEn}"]`)).toBeVisible();
    const sm = await (await request.get("/sitemap-en.xml")).text();
    for (const [cumEn, cumVi, conEn, conVi] of CUM) {
      expect(sm).toContain(`<loc>http`);
      expect(sm).toMatch(new RegExp(`<loc>[^<]*${cumEn}</loc>`));
      expect(sm).toMatch(new RegExp(`<loc>[^<]*${conEn}</loc>(<lastmod>[^<]*</lastmod>)?<xhtml:link rel="alternate" hreflang="en" href="[^"]*${conEn}"/><xhtml:link rel="alternate" hreflang="vi" href="[^"]*${conVi}"/>`));
      expect(sm).toContain(cumVi);
    }
  });

  test("mục lục cụm dài bản Anh: nhóm theo thập niên + lọc nhanh bằng chữ Anh", async ({ page }) => {
    await page.goto("/en/bazi/element-by-birth-year");
    await expect(page.getByTestId("muc-luc-cum")).toContainText("Quick filter across 78 pages");
    await page.getByTestId("cum-tim").fill("Great Forest");
    await expect(page.getByTestId("cum-dem")).toContainText("Showing 2 pages.");
    await expect(page.locator('main a[href="/en/bazi/element-by-birth-year/born-1988"]')).toBeVisible();
  });
});

test.describe("/en/bazi trên trình duyệt", () => {
  test("đầu trang tiếng Anh: SEO, hreflang hai chiều, một H1, không chữ Việt", async ({ page }) => {
    const r = await page.goto("/en/bazi");
    expect(r!.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/en/bazi");
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    const title = await page.title();
    expect(title).toContain("BaZi");
    expect(title.length).toBeLessThanOrEqual(70);
    expect(title).not.toMatch(VIET);
    const moTa = await page.locator('meta[name="description"]').getAttribute("content");
    expect(moTa!.length).toBeLessThanOrEqual(160);
    expect(moTa).not.toMatch(VIET);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/en\/bazi$/);
    expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(/\/bat-tu$/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("BaZi");
    await expect(page.getByTestId("moi-lap-la-so")).toBeVisible();
    expect(await chuViet(page)).toEqual([]);
    // JSON-LD bản Anh: FAQPage + WebApplication inLanguage en, không chữ Việt
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
    expect(ld).toContain('"inLanguage":"en"');
    expect(ld).toContain("FAQPage");
    // Trang Việt trỏ lại bản Anh
    await page.goto("/bat-tu");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/bazi$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page.locator("h1")).toContainText("Xem Bát tự: mệnh bạn thiếu hành gì?");
  });

  test("hồ sơ → tứ trụ → chương đầu bằng tiếng Anh; đổi ngôn ngữ về /bat-tu giữ hồ sơ", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/en/bazi");
    await page.fill("#ho-ten", "John O'Brien");
    await page.getByLabel("Day", { exact: true }).fill("15");
    await page.getByLabel("Month", { exact: true }).fill("05");
    await page.getByLabel("Year", { exact: true }).fill("1990");
    await page.fill("#gio-sinh", "08:30");
    await page.selectOption("#gioi-tinh", "nam");
    await expect(page.locator("#noi-sinh")).toBeEnabled({ timeout: 20_000 });
    await page.selectOption("#noi-sinh", "nuoc_ngoai");
    await expect(page.locator("#nuoc-sinh")).toBeEnabled({ timeout: 20_000 });
    await page.selectOption("#nuoc-sinh", "us");
    await page.selectOption("#thanh-pho-sinh", "us-new_york");
    await expect(page.locator("#nuoc-sinh option:checked")).toHaveText("United States");
    await page.getByRole("button", { name: "Agree and see my result" }).click();

    const lt = page.getByTestId("bat-tu-loi-thuong");
    await expect(lt).toContainText("your element is Metal", { timeout: 30_000 });
    await page.getByTestId("bat-tu-chi-tiet-mo").click();
    const tt = page.getByTestId("tu-tru");
    await expect(tt).toContainText("Useful God · strength balance");
    await expect(page.getByRole("table", { name: "Four Pillars table" })).toContainText("Geng");
    await expect(tt).toContainText("Self-punishment");
    expect(await chuViet(page)).toEqual([]);

    // Chương đầu bài đọc (bản Anh: miễn phí, không Sao)
    await page.getByRole("button", { name: "Show my reading" }).click();
    await expect(page.getByTestId("hop-noi-bat").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Your BaZi reading")).toBeVisible();
    await expect(page.getByText(/Sao\b/)).toHaveCount(0);
    expect(await chuViet(page)).toEqual([]);
    const ngang = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(ngang).toBeLessThanOrEqual(0);

    // Hỏi đáp bằng tiếng Anh (engine /v1/battu/hoi trả lời theo ngôn ngữ lượt gọi — header do trình duyệt gửi kèm)
    await page.getByRole("textbox", { name: "Your BaZi question" }).fill("What is my Useful God?");
    await page.getByRole("button", { name: "Send question" }).click();
    const tl = page.getByTestId("cau-tra-loi").last();
    await expect(tl).toContainText(/Useful God|Water/, { timeout: 30_000 });
    expect((await tl.innerText()).split("\n").filter((l) => VIET.test(l))).toEqual([]);
    // Lưới an toàn bản Anh: dòng đường dây hỗ trợ + số cấp cứu dưới mọi câu trả lời
    await expect(tl.getByTestId("luoi-an-toan")).toContainText("988");

    // Nút đổi ngôn ngữ → trang tương đương, hồ sơ dùng chung
    await page.getByRole("link", { name: "Tiếng Việt" }).first().click();
    await expect(page).toHaveURL(/\/bat-tu$/);
    await expect(page.getByTestId("bat-tu-loi-thuong")).toContainText("bạn thuộc hành Kim", { timeout: 30_000 });
  });

  test("điện thoại 390px: không cuộn ngang", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/bazi");
    await expect(page.getByTestId("moi-lap-la-so")).toBeVisible();
    const ngang = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(ngang).toBeLessThanOrEqual(0);
  });
});
