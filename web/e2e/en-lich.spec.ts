// EN-ALL GĐ 8 (web) — lịch + Hôm nay bản Anh: /en/auspicious-dates (+ ngày, tháng, việc trong tháng), /en/lunar-calendar
// (+ năm), /en/lunar-converter, /en/today — rewrite của trang Việt (một cây component, ngôn ngữ là ngữ cảnh). Trang Anh không
// lộ chữ Việt (chữ hiển thị + aria/title/placeholder/alt + JSON-LD), SEO + hreflang hai chiều, sitemap-en, 404 tiếng Anh,
// không cuộn ngang ở 390px. Chưa có ở bản Anh: thẻ chia sẻ, Sao / tài khoản, ảnh tóm tắt (ảnh vẽ chữ Việt), khối CMS.
import { test, expect, type Page } from "@playwright/test";
import { CHU_LICH_UI } from "../lib/chu/lich";
import { CHU_HOM_NAY_UI } from "../lib/chu/hom-nay";
import { CHU_HOM_NAY, CHU_XEM_NGAY, CHU_DOI_LICH } from "../lib/chu/cong-cu";
import { khoaThieuEn } from "../lib/chu-trang";
import { SO_TRANG_EN } from "../lib/so-trang-en";
import { CAP_DUONG } from "../lib/duong-en";
import { docDuongEn, duoiEn, docDuong, homNayVN, congNgay } from "../lib/hoang-lich";
import { HO_SO_MAU, napHoSo } from "./_hoso";

const HO_SO_EN = { ...HO_SO_MAU, ho_ten: "Anna Smith" };

const VIET = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

async function chuViet(page: Page, vung = "main"): Promise<string[]> {
  const chu = (await page.locator(vung).first().innerText()).split("\n").filter((l) => VIET.test(l));
  const thuocTinh = await page.$$eval(`${vung} [aria-label], ${vung} [title], ${vung} [placeholder], ${vung} [alt]`, (els) =>
    els.flatMap((e) => ["aria-label", "title", "placeholder", "alt"].map((a) => e.getAttribute(a) ?? "")));
  return [...chu, ...thuocTinh.filter((a) => VIET.test(a)).map((a) => `@${a}`)];
}
const ldTrang = async (page: Page) => (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
const ngang = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
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
const linkViet = async (page: Page) => (await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? "")))
  .filter((h) => h.startsWith("/") && !h.startsWith("/en"));

/** Kiểm chung một trang /en: 200, lang en, title ≤ 70, description ≤ 160, canonical, hreflang vi, một H1, không chữ Việt,
 *  JSON-LD tiếng Anh, không link nội bộ sang trang Việt. */
async function kiemTrang(page: Page, en: string, vi: RegExp) {
  const r = await page.goto(en);
  expect(r!.status(), en).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
  const title = await page.title();
  expect(title.length, title).toBeLessThanOrEqual(70);
  expect(title).not.toMatch(VIET);
  const mo = await page.locator('meta[name="description"]').getAttribute("content");
  expect((mo ?? "").length, mo ?? "").toBeLessThanOrEqual(160);
  expect(mo).not.toMatch(VIET);
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(new RegExp(`${en}$`));
  expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(vi);
  await expect(page.locator("h1")).toHaveCount(1);
  await page.waitForLoadState("networkidle");
  expect(await chuViet(page)).toEqual([]);
  const ld = await ldTrang(page);
  expect(ld).not.toMatch(VIET);
  expect(await linkViet(page)).toEqual([]);
}

test.describe("catalog lịch + Hôm nay bản Anh", () => {
  test("mọi khoá có chữ tiếng Anh, không dấu Việt, {biến} hợp lệ", () => {
    for (const [ten, bang] of [["CHU_LICH_UI", CHU_LICH_UI], ["CHU_HOM_NAY_UI", CHU_HOM_NAY_UI], ["CHU_HOM_NAY", CHU_HOM_NAY],
      ["CHU_XEM_NGAY", CHU_XEM_NGAY], ["CHU_DOI_LICH", CHU_DOI_LICH]] as const) {
      expect(khoaThieuEn(bang), ten).toEqual([]);
      for (const [k, m] of Object.entries(bang) as [string, { en?: string; mac_dinh: string }][]) {
        expect(m.en ?? "", `${ten}.${k}`).not.toMatch(VIET);
        const bien = (s: string) => new Set(s.match(/\{[a-z_]+\}/g) ?? []);
        // Bản Anh có thể gộp {thang}/{nam} thành {thang_nam} (định dạng ngày Intl) — chỉ cấm biến lạ.
        const vi = bien(m.mac_dinh);
        for (const b of bien(m.en ?? "")) expect(vi.has(b) || (b === "{thang_nam}" && vi.has("{thang}")) || (b === "{thang_nam}" && k.startsWith("viec_thang")), `${ten}.${k} ${b}`).toBe(true);
      }
    }
  });
  test("trang công cụ mở bản Anh có chữ máy chủ (title ≤ 70, description ≤ 160), bảng đường dẫn mở", () => {
    for (const d of ["/xem-ngay-tot", "/doi-lich-am-duong", "/hom-nay"]) {
      const t = SO_TRANG_EN[d]!;
      expect(t, d).toBeTruthy();
      expect(t.tieu_de_seo.length, d).toBeLessThanOrEqual(70);
      expect(t.mo_ta_seo.length, d).toBeLessThanOrEqual(160);
      expect(JSON.stringify(t)).not.toMatch(VIET);
    }
    for (const en of ["/en/auspicious-dates", "/en/lunar-calendar", "/en/lunar-converter", "/en/today"])
      expect(CAP_DUONG.find((c) => c.en === en)?.mo, en).toBe(true);
  });
  test("đuôi URL bản Anh: ngày / tháng / việc đọc được và dựng lại đúng; đuôi Việt không lọt sang bản Anh", () => {
    expect(docDuongEn("2026-11-16")).toEqual({ loai: "ngay", iso: "2026-11-16" });
    expect(docDuongEn("2026-11")).toEqual({ loai: "thang", nam: 2026, thang: 11 });
    const v = docDuongEn("weddings-2026-12");
    expect(v && v.loai === "viec" && v.viec.ma).toBe("cuoi_hoi");
    expect(docDuongEn("thang-11-2026")).toBeNull();
    expect(docDuongEn("2026-13")).toBeNull();
    expect(docDuong("2026-11")).toBeNull();
    for (const s of ["2026-11-16", "2026-11", "weddings-2026-12", "buying-a-car-2027-01"]) expect(duoiEn(docDuongEn(s)!)).toBe(s);
    expect(duoiEn(docDuong("cuoi-hoi-thang-12-2026")!)).toBe("weddings-2026-12");
  });
});

test.describe("/en/auspicious-dates trên trình duyệt", () => {
  test("trang chính: SEO, hreflang hai chiều, thẻ ngày + tìm ngày + chọn ngày cả nhà + lịch tháng tiếng Anh", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await kiemTrang(page, "/en/auspicious-dates", /\/xem-ngay-tot$/);
    await expect(page.locator("h1")).toContainText("Auspicious dates");
    await expect(page.getByTestId("the-ngay")).toBeVisible();
    await expect(page.getByTestId("lich-thang")).toBeVisible();
    await expect(page.getByTestId("ngay-tot-theo-viec")).toContainText("Good days by task");
    await expect(page.locator(`main a[href^="/en/auspicious-dates/"]`).first()).toBeAttached();
    expect(await ldTrang(page)).toMatch(/"inLanguage":"en"/);
    // tìm ngày đẹp cho một việc
    await page.getByTestId("chon-ngay").getByRole("button", { name: "Find days" }).click();
    await expect(page.getByTestId("ket-qua-chon-ngay")).toBeVisible({ timeout: 20_000 });
    expect(await chuViet(page, "[data-testid=chon-ngay]")).toEqual([]);
    // chọn ngày cho cả nhà
    const nhieu = page.getByTestId("chon-ngay-nhieu");
    await nhieu.locator("#nam-0").fill("1996");
    await nhieu.locator("#nam-1").fill("1994");
    await nhieu.getByRole("button", { name: "Find days" }).click();
    await expect(page.getByTestId("ket-qua-nhieu")).toBeVisible({ timeout: 30_000 });
    expect(await chuViet(page, "[data-testid=chon-ngay-nhieu]")).toEqual([]);
    expect(await chuViet(page)).toEqual([]);
    expect(await linkViet(page)).toEqual([]);
    // trang Việt khai hreflang ngược lại
    await page.goto("/xem-ngay-tot");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/auspicious-dates$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page.locator("h1")).toContainText("Xem ngày tốt");
  });

  test("trang ngày, tháng, việc trong tháng bản Anh + hreflang về đúng trang Việt", async ({ page }) => {
    test.setTimeout(120_000);
    const iso = congNgay(homNayVN(), 3), y = iso.slice(0, 4), m = iso.slice(5, 7), mm = String(Number(m));
    await kiemTrang(page, `/en/auspicious-dates/${iso}`, new RegExp(`/xem-ngay-tot/${iso}$`));
    await expect(page.locator("h1")).toContainText("a good day?");
    await expect(page.getByTestId("gio-hoang-dao")).toBeVisible();
    await kiemTrang(page, `/en/auspicious-dates/${y}-${m}`, new RegExp(`/xem-ngay-tot/thang-${mm}-${y}$`));
    await expect(page.getByTestId("ngay-dep-thang")).toBeVisible();
    await kiemTrang(page, `/en/auspicious-dates/weddings-${y}-${m}`, new RegExp(`/xem-ngay-tot/cuoi-hoi-thang-${mm}-${y}$`));
    await expect(page.getByTestId("ngay-tot-viec")).toBeVisible();
    // ngược lại: trang Việt trỏ hreflang tới đuôi Anh
    await page.goto(`/xem-ngay-tot/cuoi-hoi-thang-${mm}-${y}`);
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`/en/auspicious-dates/weddings-${y}-${m}$`));
    await page.goto(`/xem-ngay-tot/thang-${mm}-${y}`);
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`/en/auspicious-dates/${y}-${m}$`));
  });

  test("đuôi Việt gõ ở bản Anh → 308 về đuôi Anh; đuôi Anh ở bản Việt → 404", async ({ request }) => {
    const a = await request.get("/en/auspicious-dates/thang-11-2026", { maxRedirects: 0 });
    expect(a.status()).toBe(308);
    expect(a.headers().location).toMatch(/\/en\/auspicious-dates\/2026-11$/);
    const b = await request.get("/en/xem-ngay-tot/2026-11-20", { maxRedirects: 0 });
    expect(b.status()).toBe(308);
    expect(b.headers().location).toMatch(/\/en\/auspicious-dates\/2026-11-20$/);
    expect((await request.get("/xem-ngay-tot/2026-11", { maxRedirects: 0 })).status()).toBe(404);
  });

  test("404 tiếng Anh: đuôi sai", async ({ page }) => {
    const r = await page.goto("/en/auspicious-dates/khong-co-ngay-nay");
    expect(r!.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    expect((await page.locator("body").innerText()).split("\n").filter((l) => VIET.test(l) && !l.includes("Tiếng Việt"))).toEqual([]);
  });
});

test.describe("/en/lunar-calendar + /en/lunar-converter", () => {
  test("mục lục + một năm: bảng Tết, tháng âm, ngày lễ tiếng Anh; hreflang hai chiều", async ({ page }) => {
    test.setTimeout(90_000);
    await kiemTrang(page, "/en/lunar-calendar", /\/lich-am$/);
    await expect(page.getByTestId("bang-tet")).toBeVisible();
    await expect(page.locator('main a[href="/en/lunar-calendar/2027"]').first()).toBeAttached();
    await kiemTrang(page, "/en/lunar-calendar/2027", /\/lich-am\/2027$/);
    await expect(page.getByTestId("bang-lich-am")).toBeVisible();
    await page.goto("/lich-am/2027");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/lunar-calendar\/2027$/);
    await page.goto("/lich-am");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/lunar-calendar$/);
  });

  test("đổi lịch: tiếng Anh từ đầu đến kết quả, link trỏ bản Anh", async ({ page }) => {
    await kiemTrang(page, "/en/lunar-converter", /\/doi-lich-am-duong$/);
    await page.getByRole("button", { name: "Convert" }).click();
    const kq = page.getByTestId("ket-qua-doi-lich");
    await expect(kq).toBeVisible({ timeout: 15_000 });
    await expect(kq).toContainText("lunar");
    expect(await chuViet(page)).toEqual([]);
    expect(await linkViet(page)).toEqual([]);
    await page.goto("/doi-lich-am-duong");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/lunar-converter$/);
  });

  test("404 tiếng Anh: năm ngoài phạm vi", async ({ page }) => {
    const r = await page.goto("/en/lunar-calendar/1800");
    expect(r!.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
  });
});

test.describe("/en/today", () => {
  test("chưa có hồ sơ → form tiếng Anh; có hồ sơ → thẻ ngày, ba lá, ý định, tuần, đọc thêm tiếng Anh", async ({ page }) => {
    test.setTimeout(150_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await kiemTrang(page, "/en/today", /\/hom-nay$/);
    await expect(page.locator("h1")).toContainText("Your day today");
    await napHoSo(page, HO_SO_EN);
    await page.goto("/en/today");
    await expect(page.getByTestId("the-hom-nay")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("ba-la")).toBeVisible();
    await expect(page.getByTestId("tuan-cua-toi")).toBeVisible({ timeout: 20_000 });
    // không có ở bản Anh
    await expect(page.locator("[data-testid=chia-se-the-hom-nay]")).toHaveCount(0);
    // lật ba lá
    for (const ma of ["tarot", "so", "thoi_khac"]) await page.getByTestId(`ba-la-${ma}`).click();
    await expect(page.getByTestId("ba-la-ghep")).toBeVisible();
    await expect(page.locator("[data-testid=ba-la-chia-se]")).toHaveCount(0);
    // ý định
    await page.locator("#y-dinh [aria-pressed]").first().click();
    await page.getByRole("button", { name: "See today's rhythm" }).click();
    await expect(page.getByTestId("y-dinh-ket-qua")).toBeVisible({ timeout: 20_000 });
    // mở mọi mục đọc thêm
    for (const el of await page.locator("[data-testid=doc-them] details").all()) await el.evaluate((d) => { (d as HTMLDetailsElement).open = true; });
    await page.waitForLoadState("networkidle");
    expect(await chuViet(page)).toEqual([]);
    expect(await linkViet(page)).toEqual([]);
    await page.goto("/hom-nay");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/today$/);
  });
});

test.describe("điện thoại 390px", () => {
  for (const u of ["/en/auspicious-dates", "/en/lunar-calendar/2027", "/en/lunar-converter", "/en/today"]) {
    test(`${u}: không cuộn ngang, không chữ Việt`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      if (u === "/en/today") await napHoSo(page, HO_SO_EN);
      await page.goto(u);
      if (u === "/en/today") await expect(page.getByTestId("the-hom-nay")).toBeVisible({ timeout: 30_000 });
      await expect(page.locator("h1")).toBeVisible();
      await page.waitForLoadState("networkidle");
      await expect.poll(async () => ({ ngang: Math.max(0, await ngang(page)), tho_ra: await thoRa(page) }), { timeout: 10_000 })
        .toEqual({ ngang: 0, tho_ra: [] });
      expect(await chuViet(page)).toEqual([]);
    });
  }
});

test.describe("sitemap-en", () => {
  test("có trang công cụ lịch, lịch âm, trang ngày / tháng / việc, hreflang về trang Việt", async ({ request }) => {
    const sm = await (await request.get("/sitemap-en.xml")).text();
    for (const u of ["/en/auspicious-dates", "/en/lunar-calendar", "/en/lunar-converter", "/en/today", "/en/lunar-calendar/2027"])
      expect(sm, u).toMatch(new RegExp(`<loc>[^<]*${u}</loc>`));
    const iso = homNayVN(), y = iso.slice(0, 4), m = iso.slice(5, 7), mm = String(Number(m));
    expect(sm).toMatch(new RegExp(`<loc>[^<]*/en/auspicious-dates/${iso}</loc>`));
    expect(sm).toMatch(new RegExp(`/en/auspicious-dates/${y}-${m}</loc><xhtml:link rel="alternate" hreflang="en"[^>]*/><xhtml:link rel="alternate" hreflang="vi" href="[^"]*/xem-ngay-tot/thang-${mm}-${y}"`));
    expect(sm).toMatch(/\/en\/auspicious-dates\/[a-z-]+-\d{4}-\d{2}<\/loc>/);
  });
});
