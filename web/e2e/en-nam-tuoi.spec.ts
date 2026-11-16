// EN-ALL GĐ 8 (web) — năm & tuổi (tập quán Việt) bản Anh: /en/year (+ năm, sinh con, cưới hỏi, theo tuổi),
// /en/vietnamese-customs/{yearly-star,house-building-age,first-footer} (+ năm, theo tuổi), /en/feng-shui/annual-afflictions
// (+ năm), /en/born-abroad (+ nước). Một cây component (rewrite của trang Việt): trang Anh không lộ chữ Việt (chữ hiển thị +
// aria/title/placeholder/alt + JSON-LD), SEO + hreflang hai chiều, link nội bộ chỉ /en, sitemap-en, 404 tiếng Anh, luật index
// giống bản Việt, không cuộn ngang ở 390px. Ảnh tóm tắt (/og/tom-tat, chữ Việt) và thẻ chia sẻ xông đất không có ở bản Anh.
import { test, expect, type Page } from "@playwright/test";
import { CHU_NAM_TUOI_UI, CHU_NAM_TUOI_EN } from "../lib/chu/nam-tuoi";
import * as TC from "../lib/chu/trang-con";
import { CHU_HAN_NAM, CHU_LAM_NHA, CHU_SAO_HAN, CHU_XONG_DAT } from "../lib/chu/cong-cu";
import { khoaThieuEn, type BangChu } from "../lib/chu-trang";
import { SO_TRANG_EN } from "../lib/so-trang-en";

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

// Năm 2027: trang năm / bảng theo năm / theo tuổi đều trong cửa sổ index (năm âm hiện tại hoặc năm sau; năm theo tuổi = năm
// mặc định của menu) khi test chạy trong năm âm 2026. Ngoài cửa sổ thì chỉ đổi robots, các kiểm khác vẫn đúng.
const TRANG: [en: string, vi: string][] = [
  ["/en/year", "/nam"],
  ["/en/year/2027", "/nam/2027"],
  ["/en/year/2027/sinh-con", "/nam/2027/sinh-con"],
  ["/en/year/2027/cuoi-hoi", "/nam/2027/cuoi-hoi"],
  ["/en/year/2027/tuoi-1990", "/nam/2027/tuoi-1990"],
  ["/en/vietnamese-customs/yearly-star", "/xem-sao-han"],
  ["/en/vietnamese-customs/yearly-star/2027", "/xem-sao-han/2027"],
  ["/en/vietnamese-customs/house-building-age", "/xem-tuoi-lam-nha"],
  ["/en/vietnamese-customs/house-building-age/2027", "/xem-tuoi-lam-nha/2027"],
  ["/en/vietnamese-customs/house-building-age/2027/tuoi-1990", "/xem-tuoi-lam-nha/2027/tuoi-1990"],
  ["/en/vietnamese-customs/first-footer", "/tuoi-xong-dat"],
  ["/en/vietnamese-customs/first-footer/2027", "/tuoi-xong-dat/2027"],
  ["/en/vietnamese-customs/first-footer/2027/tuoi-1990", "/tuoi-xong-dat/2027/tuoi-1990"],
  ["/en/feng-shui/annual-afflictions", "/phong-thuy/huong-xau-nam"],
  ["/en/feng-shui/annual-afflictions/2027", "/phong-thuy/huong-xau-nam/2027"],
  ["/en/born-abroad", "/sinh-o-nuoc-ngoai"],
  ["/en/born-abroad/us", "/sinh-o-nuoc-ngoai/us"],
];

test.describe("catalog năm & tuổi bản Anh", () => {
  test("mọi khoá có chữ tiếng Anh, không dấu Việt, {biến} hợp lệ", () => {
    const bangs: Record<string, BangChu> = {
      CHU_NAM_TUOI_UI, CHU_LAM_NHA, CHU_XONG_DAT, CHU_SAO_HAN, CHU_HAN_NAM,
      CHU_LAM_NHA_CON: TC.CHU_LAM_NHA_CON, CHU_XONG_DAT_CON: TC.CHU_XONG_DAT_CON, CHU_HAN_NAM_CON: TC.CHU_HAN_NAM_CON,
      CHU_LAM_NHA_NAM: TC.CHU_LAM_NHA_NAM, CHU_XONG_DAT_NAM: TC.CHU_XONG_DAT_NAM, CHU_SAO_HAN_NAM: TC.CHU_SAO_HAN_NAM, CHU_NAM: TC.CHU_NAM,
      CHU_NAM_SINH_CON: TC.CHU_NAM_SINH_CON, CHU_NAM_CUOI_HOI: TC.CHU_NAM_CUOI_HOI, CHU_NAM_TUOI: TC.CHU_NAM_TUOI, CHU_SINH_NN: TC.CHU_SINH_NN,
    };
    const bien = (s: string) => new Set(s.match(/\{[a-z_]+\}/g) ?? []);
    for (const [ten, bang] of Object.entries(bangs)) {
      expect(khoaThieuEn(bang), ten).toEqual([]);
      for (const [k, m] of Object.entries(bang)) {
        expect(m.en ?? "", `${ten}.${k}`).not.toMatch(VIET);
        for (const b of bien(m.en ?? "")) expect(bien(m.mac_dinh).has(b), `${ten}.${k} ${b}`).toBe(true);
      }
    }
    for (const [k, v] of Object.entries(CHU_NAM_TUOI_EN)) expect(v, k).not.toMatch(VIET);
  });

  test("trang công cụ mở bản Anh có chữ máy chủ (title ≤ 70, description ≤ 160)", () => {
    for (const d of ["/xem-sao-han", "/xem-tuoi-lam-nha", "/tuoi-xong-dat", "/phong-thuy/huong-xau-nam"]) {
      const t = SO_TRANG_EN[d]!;
      expect(t, d).toBeTruthy();
      expect(t.tieu_de_seo.length, d).toBeLessThanOrEqual(70);
      expect(t.mo_ta_seo.length, d).toBeLessThanOrEqual(160);
      expect(JSON.stringify(t), d).not.toMatch(VIET);
    }
  });
});

test.describe("năm & tuổi bản Anh trên trình duyệt", () => {
  for (const [en, vi] of TRANG) {
    test(`${en}: tiếng Anh, SEO, hreflang hai chiều, JSON-LD, link chỉ /en`, async ({ page }) => {
      test.setTimeout(90_000);
      const r = await page.goto(en);
      expect(r!.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
      const title = await page.title();
      expect(title.length, title).toBeLessThanOrEqual(70);
      expect(title).not.toMatch(VIET);
      expect(await page.locator('meta[name="description"]').getAttribute("content")).not.toMatch(VIET);
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(new RegExp(`${en}$`));
      expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${vi}$`));
      await expect(page.locator("h1")).toHaveCount(1);
      await page.waitForLoadState("networkidle");
      expect(await chuViet(page)).toEqual([]);
      const ld = await ldTrang(page);
      expect(ld).toContain('"inLanguage":"en"');
      expect(ld).not.toMatch(VIET);
      const hrefs = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
      expect(hrefs.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);
      // ảnh tóm tắt chỉ có chữ Việt → không ở bản Anh
      await expect(page.getByTestId("anh-tom-tat")).toHaveCount(0);
      await page.goto(vi);
      await expect(page.locator("html")).toHaveAttribute("lang", "vi");
      expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`${en}$`));
    });
  }

  test("luật index giống bản Việt: năm ngoài cửa sổ noindex ở cả hai bản", async ({ page }) => {
    for (const [en, vi] of [["/en/year/2040", "/nam/2040"], ["/en/vietnamese-customs/house-building-age/2040/tuoi-1990", "/xem-tuoi-lam-nha/2040/tuoi-1990"]] as const) {
      await page.goto(vi);
      const rvi = await page.locator('meta[name="robots"]').getAttribute("content");
      await page.goto(en);
      expect(await page.locator('meta[name="robots"]').getAttribute("content")).toBe(rvi);
      expect(rvi).toContain("noindex");
    }
    await page.goto("/en/year/2027");
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).not.toContain("noindex");
  });

  test("công cụ: nhập năm sinh → kết quả tiếng Anh (sao hạn, làm nhà, xông đất)", async ({ page }) => {
    test.setTimeout(120_000);
    for (const [duong, kq] of [["/en/vietnamese-customs/yearly-star", "ket-qua-sao-han"], ["/en/vietnamese-customs/house-building-age", "ket-qua-lam-nha"],
      ["/en/vietnamese-customs/first-footer", "ket-qua-xong-dat"]] as const) {
      await page.goto(duong);
      const form = page.getByTestId("form-tuoi");
      await form.getByLabel("Birth year").fill("1990");
      if (kq === "ket-qua-sao-han") await form.getByText("Female", { exact: true }).click();
      await form.getByRole("button", { name: "Read now" }).click();
      await expect(page.getByTestId(kq)).toBeVisible({ timeout: 20_000 });
      expect(await chuViet(page), duong).toEqual([]);
      const hrefs = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
      expect(hrefs.filter((h) => h.startsWith("/") && !h.startsWith("/en")), duong).toEqual([]);
    }
    // bản Anh không có thẻ chia sẻ xông đất
    await expect(page.getByRole("button", { name: /share/i })).toHaveCount(0);
  });

  test("sitemap-en có trang năm, theo tuổi, sinh ở nước ngoài, kèm hreflang về trang Việt tương đương", async ({ request }) => {
    const sm = await (await request.get("/sitemap-en.xml")).text();
    for (const [en, vi] of TRANG) {
      expect(sm, en).toMatch(new RegExp(`<loc>[^<]*${en}</loc>(<lastmod>[^<]+</lastmod>)?<xhtml:link rel="alternate" hreflang="en"[^>]*/><xhtml:link rel="alternate" hreflang="vi" href="[^"]*${vi}"`));
    }
    expect(sm).not.toMatch(/\/en\/year\/2040/);
  });

  test("404 tiếng Anh: năm không hợp lệ, nước không có", async ({ page }) => {
    for (const u of ["/en/year/abcd", "/en/born-abroad/zz"]) {
      const r = await page.goto(u);
      expect(r!.status(), u).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
      expect((await page.locator("body").innerText()).split("\n").filter((l) => VIET.test(l) && !l.includes("Tiếng Việt")), u).toEqual([]);
    }
  });

  test("điện thoại 390px: không cuộn ngang, không chữ Việt", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const u of ["/en/year/2027", "/en/year/2027/tuoi-1990", "/en/vietnamese-customs/yearly-star/2027", "/en/born-abroad/us", "/en/feng-shui/annual-afflictions/2027"]) {
      await page.goto(u);
      await expect(page.locator("h1")).toBeVisible();
      await page.waitForLoadState("networkidle");
      await expect.poll(async () => ({ ngang: Math.max(0, await ngang(page)), tho_ra: await thoRa(page) }), { timeout: 10_000, message: u })
        .toEqual({ ngang: 0, tho_ra: [] });
      expect(await chuViet(page), u).toEqual([]);
    }
  });
});
