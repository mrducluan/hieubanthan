// EN-ALL GĐ 4 — /en/zi-wei-dou-shu: rewrite của /tu-vi (một cây component, ngôn ngữ là ngữ cảnh). Trang Anh không lộ chữ
// Việt (chữ hiển thị + aria/title/placeholder, trừ tên người dùng gõ), lá số SVG vẽ với nhãn Anh ở cả hai giao diện, báo cáo
// mở chương, cụm kiến thức + trang con, 308 slug, hreflang hai chiều, không cuộn ngang ở 390px.
import { test, expect, type Page } from "@playwright/test";
import { CHU_TU_VI_UI } from "../lib/chu/tu-vi";
import { CHU_TU_VI } from "../lib/chu/cong-cu";
import { CHU_KIEN_THUC } from "../lib/chu/kien-thuc";
import { khoaThieuEn } from "../lib/chu-trang";
import { CUM_EN, SO_TRANG_EN } from "../lib/so-trang-en";
import { CAP_DUONG } from "../lib/duong-en";
import { khoaTheoDuong } from "../lib/kien-thuc";

const VIET = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const TEN = "John O'Brien";

/** Chữ nhìn thấy + thuộc tính đọc được của <main> có chữ Việt (trả các dòng lỗi). */
async function chuViet(page: Page): Promise<string[]> {
  const chu = (await page.locator("main").innerText()).split("\n").filter((l) => VIET.test(l));
  const thuocTinh = await page.$$eval("main [aria-label], main [title], main [placeholder], main [alt]", (els) =>
    els.flatMap((e) => ["aria-label", "title", "placeholder", "alt"].map((a) => e.getAttribute(a) ?? "")));
  return [...chu, ...thuocTinh.filter((a) => VIET.test(a)).map((a) => `@${a}`)];
}

test.describe("catalog /en/zi-wei-dou-shu", () => {
  test("mọi khoá bảng chữ Tử vi có chữ tiếng Anh, không dấu Việt, trong giới hạn; {biến} hợp lệ", () => {
    for (const [ten, bang] of [["CHU_TU_VI_UI", CHU_TU_VI_UI], ["CHU_TU_VI", CHU_TU_VI], ["CHU_KIEN_THUC", CHU_KIEN_THUC]] as const) {
      expect(khoaThieuEn(bang), ten).toEqual([]);
      for (const [k, m] of Object.entries(bang) as [string, { en?: string; mac_dinh: string; toi_da?: number }][]) {
        expect(m.en ?? "", `${ten}.${k}`).not.toMatch(VIET);
        expect((m.en ?? "").length, `${ten}.${k}`).toBeLessThanOrEqual(m.toi_da ?? 300);
        for (const v of [m.en ?? "", m.mac_dinh]) expect(v.match(/\{[^}]*\}/g)?.filter((x) => !/^\{[a-z_]+\}$/.test(x)) ?? [], `${ten}.${k}`).toEqual([]);
        // Biến của bản Anh phải là biến bản Việt cũng có (trang cấp cùng một bộ biến).
        const bien = (s: string) => new Set(s.match(/\{[a-z_]+\}/g) ?? []);
        for (const b of bien(m.en ?? "")) expect(bien(m.mac_dinh).has(b), `${ten}.${k} ${b}`).toBe(true);
      }
    }
  });
  test("trang công cụ + 4 cụm mở bản Anh có chữ máy chủ (title ≤ 70, description ≤ 160)", () => {
    const t = SO_TRANG_EN["/tu-vi"]!;
    expect(t.tieu_de_seo.length).toBeLessThanOrEqual(70);
    expect(t.mo_ta_seo.length).toBeLessThanOrEqual(160);
    expect(JSON.stringify(t)).not.toMatch(VIET);
    const mo = CAP_DUONG.filter((x) => x.mo && !x.rieng && khoaTheoDuong(x.vi) && x.en.startsWith("/en/zi-wei-dou-shu"));
    expect(mo.map((x) => x.en).sort()).toEqual(["/en/zi-wei-dou-shu/four-transformations", "/en/zi-wei-dou-shu/palaces",
      "/en/zi-wei-dou-shu/star-in-palace", "/en/zi-wei-dou-shu/stars"]);
    for (const c of mo) {
      const x = CUM_EN[c.vi]!;
      expect(x, c.vi).toBeTruthy();
      expect(x.tieu_de_seo.length, c.vi).toBeLessThanOrEqual(70);
      expect(x.mo_ta.length, c.vi).toBeLessThanOrEqual(160);
      expect(JSON.stringify(x), c.vi).not.toMatch(VIET);
    }
  });
});

async function ldTrang(page: Page): Promise<string> {
  return (await page.locator('main script[type="application/ld+json"]').allTextContents()).join("\n");
}

const CUM: [string, string, string, string, string][] = [
  ["/en/zi-wei-dou-shu/stars", "/tu-vi/chinh-tinh", "/en/zi-wei-dou-shu/stars/zi-wei", "/tu-vi/chinh-tinh/sao-tu-vi", "Zi Wei"],
  ["/en/zi-wei-dou-shu/palaces", "/tu-vi/cung", "/en/zi-wei-dou-shu/palaces/life-palace", "/tu-vi/cung/cung-menh", "Life Palace"],
  ["/en/zi-wei-dou-shu/star-in-palace", "/tu-vi/sao-o-cung", "/en/zi-wei-dou-shu/star-in-palace/zi-wei-in-life-palace", "/tu-vi/sao-o-cung/tu-vi-cung-menh", "Zi Wei in the Life Palace"],
  ["/en/zi-wei-dou-shu/four-transformations", "/tu-vi/tu-hoa", "/en/zi-wei-dou-shu/four-transformations/hua-lu-in-life-palace", "/tu-vi/tu-hoa/hoa-loc-cung-menh", "Hua Lu in the Life Palace"],
];

test.describe("/en/zi-wei-dou-shu cụm kiến thức", () => {
  for (const [cumEn, cumVi, conEn, conVi, h1] of CUM) {
    test(`${cumEn}: cụm + trang con tiếng Anh, SEO, hreflang hai chiều`, async ({ page }) => {
      test.setTimeout(90_000);
      const r = await page.goto(cumEn);
      expect(r!.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
      expect((await page.title()).length).toBeLessThanOrEqual(70);
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(new RegExp(`${cumEn}$`));
      expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${cumVi}$`));
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await chuViet(page)).toEqual([]);
      const ld = await ldTrang(page);
      expect(ld).toContain('"inLanguage":"en"');
      expect(ld).not.toMatch(VIET);
      const hrefs = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
      expect(hrefs.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);
      await expect(page.locator(`main a[href="${conEn}"]`).first()).toBeAttached();

      await page.goto(conEn);
      expect(new URL(page.url()).pathname).toBe(conEn);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toContainText(h1);
      expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${conVi}$`));
      await expect(page.getByTestId("minh-hoa")).toBeVisible();
      expect(await chuViet(page)).toEqual([]);
      expect(await ldTrang(page)).not.toMatch(VIET);
      const hrefCon = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
      expect(hrefCon.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      await page.setViewportSize({ width: 1280, height: 900 });

      await page.goto(conVi);
      expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`${conEn}$`));
      await page.goto(cumVi);
      expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`${cumEn}$`));
    });
  }

  test("308 slug: URL Anh mang slug Việt → slug Anh; URL Việt mang slug Anh → slug Việt", async ({ request }) => {
    const a = await request.get("/en/zi-wei-dou-shu/star-in-palace/tu-vi-cung-menh", { maxRedirects: 0 });
    expect(a.status()).toBe(308);
    expect(a.headers().location).toMatch(/\/en\/zi-wei-dou-shu\/star-in-palace\/zi-wei-in-life-palace$/);
    const b = await request.get("/tu-vi/sao-o-cung/zi-wei-in-life-palace", { maxRedirects: 0 });
    expect(b.status()).toBe(308);
    expect(b.headers().location).toMatch(/\/tu-vi\/sao-o-cung\/tu-vi-cung-menh$/);
  });

  test("mục lục 168 trang sao ở cung bản Anh: nhóm theo sao + lọc theo cung", async ({ page }) => {
    await page.goto("/en/zi-wei-dou-shu/star-in-palace");
    await expect(page.getByTestId("muc-luc-cum")).toBeVisible();
    await expect(page.locator("main h2", { hasText: "Zi Wei in the 12 palaces" })).toBeVisible();
    expect(await chuViet(page)).toEqual([]);
  });

  test("cụm chưa mở bản Anh (cổ thư, lá số mẫu) trả 404 tiếng Anh; sitemap-en có cụm Tử vi", async ({ page, request }) => {
    expect((await page.goto("/en/zi-wei-dou-shu/classics"))!.status()).toBe(404);
    const sm = await (await request.get("/sitemap-en.xml")).text();
    for (const [cumEn, , conEn] of CUM) {
      expect(sm).toMatch(new RegExp(`<loc>[^<]*${cumEn}</loc>`));
      expect(sm).toMatch(new RegExp(`<loc>[^<]*${conEn}</loc>`));
    }
    expect(sm).toMatch(/<loc>[^<]*\/en\/zi-wei-dou-shu<\/loc>/);
  });
});

test.describe("/en/zi-wei-dou-shu trên trình duyệt", () => {
  test("đầu trang tiếng Anh: SEO, hreflang hai chiều, một H1, khối mời lập lá số, không chữ Việt", async ({ page }) => {
    const r = await page.goto("/en/zi-wei-dou-shu");
    expect(r!.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    const title = await page.title();
    expect(title).toContain("Zi Wei");
    expect(title.length).toBeLessThanOrEqual(70);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/en\/zi-wei-dou-shu$/);
    expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(/\/tu-vi$/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByTestId("moi-lap-la-so")).toBeVisible();
    expect(await chuViet(page)).toEqual([]);
    await page.goto("/tu-vi");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/zi-wei-dou-shu$/);
    await expect(page.locator("h1")).toContainText("Xem Tử vi: năm nay bạn nên chú ý gì?");
  });

  test("hồ sơ → lá số 12 cung nhãn Anh (hai giao diện) → chi tiết cung → chương đầu bài đọc", async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto("/en/zi-wei-dou-shu");
    await page.fill("#ho-ten", TEN);
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
    await page.getByRole("button", { name: "Agree and see my result" }).click();

    const ls = page.getByTestId("la-so-tu-vi").locator("svg").first();
    await expect(ls).toBeVisible({ timeout: 40_000 });
    const chuLs = (await ls.textContent()) ?? "";
    expect(chuLs).toContain("ZI WEI DOU SHU");
    expect(chuLs).toMatch(/LIFE\d|LIFE ·/);
    expect(chuLs.replaceAll(TEN, "")).not.toMatch(VIET);
    // Giao diện Giấy cổ cũng nhãn Anh
    await page.getByRole("tab", { name: "Old paper" }).click();
    expect(((await page.getByTestId("la-so-tu-vi").locator("svg").first().textContent()) ?? "").replaceAll(TEN, "")).not.toMatch(VIET);
    await page.getByRole("tab", { name: "Night sky" }).click();

    // Bảng Hiển thị (lớp hạn + trường phái) — chữ Anh
    await page.getByTestId("tv-hien-thi-mo").click();
    await expect(page.getByTestId("tv-hien-thi")).toContainText("Period layers on the chart");
    expect(await chuViet(page)).toEqual([]);
    await page.getByTestId("tv-hien-thi-mo").click();

    await expect(page.getByRole("heading", { name: /Life Palace/ }).first()).toBeVisible();
    expect((await chuViet(page)).filter((l) => !l.includes(TEN))).toEqual([]);

    // Khối mở lười: 3 tháng tới + đường bay tứ hoá — chữ Anh
    await page.getByRole("button", { name: /The next 3 months/ }).click();
    await expect(page.getByTestId("nhip-3-thang-noi-dung")).toBeVisible({ timeout: 40_000 });
    await page.getByRole("button", { name: /Flying Four Transformations/ }).click();
    await expect(page.getByTestId("phi-hoa-noi-dung")).toBeVisible({ timeout: 40_000 });
    expect((await chuViet(page)).filter((l) => !l.includes(TEN))).toEqual([]);

    // Bài đọc: chương đầu tiếng Anh, không Sao
    const nut = page.getByRole("button", { name: /Show my reading|Read/ }).first();
    if (await nut.isVisible().catch(() => false)) await nut.click();
    await expect(page.getByTestId("hop-noi-bat").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/\bSao\b/)).toHaveCount(0);
    expect((await chuViet(page)).filter((l) => !l.includes(TEN))).toEqual([]);

    for (const w of [390, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${w}px`).toBeLessThanOrEqual(0);
    }
  });

  test("điện thoại 390px: không cuộn ngang", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/zi-wei-dou-shu");
    await expect(page.getByTestId("moi-lap-la-so")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
