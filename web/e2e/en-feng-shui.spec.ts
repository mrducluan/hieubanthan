// EN-ALL GĐ 5 — /en/feng-shui: rewrite của /phong-thuy (một cây component, ngôn ngữ là ngữ cảnh). Trang Anh không lộ chữ
// Việt (chữ hiển thị + aria/title/placeholder/alt + JSON-LD, trừ tên người dùng gõ): đầu trang, hồ sơ → Kua → đo hướng → Nhà
// của bạn → Khảo sát nhà → Huyền Không → hỏi đáp; cụm "Home signs" + trang con, 308 slug, hreflang hai chiều, sitemap-en,
// 404 tiếng Anh; không cuộn ngang ở 390px. Tính năng chưa có ở bản Anh (gửi ảnh cho AI, lưu nhà vào tài khoản, thẻ chia sẻ,
// nhắc việc, gợi mở chéo) không hiện.
import { test, expect, type Page } from "@playwright/test";
import { CHU_PHONG_THUY_UI } from "../lib/chu/phong-thuy";
import { CHU_KIEN_THUC } from "../lib/chu/kien-thuc";
import { CHU_GIAO_DIEN } from "../lib/chu/giao-dien";
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
  return [...chu, ...thuocTinh.filter((a) => VIET.test(a)).map((a) => `@${a}`)].filter((l) => !l.includes(TEN));
}
async function ldTrang(page: Page): Promise<string> {
  return (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
}
const ngang = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test.describe("catalog /en/feng-shui", () => {
  test("mọi khoá bảng chữ Phong thuỷ có chữ tiếng Anh, không dấu Việt, trong giới hạn; {biến} hợp lệ", () => {
    for (const [ten, bang] of [["CHU_PHONG_THUY_UI", CHU_PHONG_THUY_UI], ["CHU_KIEN_THUC", CHU_KIEN_THUC], ["CHU_GIAO_DIEN", CHU_GIAO_DIEN]] as const) {
      expect(khoaThieuEn(bang), ten).toEqual([]);
      for (const [k, m] of Object.entries(bang) as [string, { en?: string; mac_dinh: string; toi_da?: number }][]) {
        expect(m.en ?? "", `${ten}.${k}`).not.toMatch(VIET);
        expect((m.en ?? "").length, `${ten}.${k}`).toBeLessThanOrEqual(m.toi_da ?? 300);
        const bien = (s: string) => new Set(s.match(/\{[a-z_]+\}/g) ?? []);
        for (const b of bien(m.en ?? "")) expect(bien(m.mac_dinh).has(b), `${ten}.${k} ${b}`).toBe(true);
      }
    }
  });
  test("trang công cụ + cụm mở bản Anh có chữ máy chủ (title ≤ 70, description ≤ 160)", () => {
    const t = SO_TRANG_EN["/phong-thuy"]!;
    expect(t.tieu_de_seo.length).toBeLessThanOrEqual(70);
    expect(t.mo_ta_seo.length).toBeLessThanOrEqual(160);
    expect(JSON.stringify(t)).not.toMatch(VIET);
    const mo = CAP_DUONG.filter((x) => x.mo && !x.rieng && khoaTheoDuong(x.vi) && x.en.startsWith("/en/feng-shui"));
    expect(mo.map((x) => x.en)).toEqual(["/en/feng-shui/home-signs"]);
    for (const c of mo) {
      const x = CUM_EN[c.vi]!;
      expect(x, c.vi).toBeTruthy();
      expect(x.tieu_de_seo.length, c.vi).toBeLessThanOrEqual(70);
      expect(x.mo_ta.length, c.vi).toBeLessThanOrEqual(160);
      expect(JSON.stringify(x), c.vi).not.toMatch(VIET);
    }
  });
});

test.describe("/en/feng-shui trên trình duyệt", () => {
  test("đầu trang tiếng Anh: SEO, hreflang hai chiều, một H1, JSON-LD tiếng Anh, không chữ Việt", async ({ page }) => {
    const r = await page.goto("/en/feng-shui");
    expect(r!.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    const title = await page.title();
    expect(title).toContain("feng shui");
    expect(title.length).toBeLessThanOrEqual(70);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/en\/feng-shui$/);
    expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(/\/phong-thuy$/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Feng shui for your home");
    expect(await chuViet(page)).toEqual([]);
    const ld = await ldTrang(page);
    expect(ld).toContain('"inLanguage":"en"');
    expect(ld).not.toMatch(VIET);
    const hrefs = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);
    await page.goto("/phong-thuy");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/feng-shui$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page.locator("h1")).toContainText("Xem phong thuỷ: nhà này có hợp bạn không?");
  });

  test("hồ sơ → Kua + la bàn → đo hướng → Nhà của bạn → Khảo sát → Huyền Không → hỏi đáp, tất cả tiếng Anh", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/en/feng-shui");
    await page.getByRole("button", { name: "Create a profile" }).click();
    await page.fill("#ho-ten", TEN);
    await page.getByLabel("Day", { exact: true }).fill("15");
    await page.getByLabel("Month", { exact: true }).fill("05");
    await page.getByLabel("Year", { exact: true }).fill("1990");
    await page.selectOption("#gioi-tinh", "nam");
    await page.getByRole("dialog").getByRole("button", { name: /Save and show|Agree/ }).click();

    // Kua + la bàn 8 hướng (tên hướng, du niên, quái bằng tiếng Anh)
    const mq = page.getByTestId("menh-quai");
    await expect(mq).toContainText("Your Kua: Kan", { timeout: 30_000 });
    await expect(mq).toContainText("East Group");
    const laBan = mq.locator("svg").first();
    await expect(laBan).toContainText("South-East");
    await expect(laBan).toContainText("Sheng Qi");
    await expect(page.getByTestId("hanh-trinh-nha")).toContainText("Your home, step by step");

    // Khung trường phái (mốc đầu năm) — chữ Anh
    await page.getByTestId("truong-phai-phong-thuy-mo").click();
    await expect(page.getByTestId("truong-phai-phong-thuy")).toContainText("Start of Spring");

    // Đo hướng: gõ độ → kết quả engine (hướng, sơn, trạch, du niên) tiếng Anh
    const dh = page.getByTestId("do-huong");
    await dh.getByRole("textbox", { name: "Home direction in degrees", exact: true }).fill("135");
    await dh.getByRole("button", { name: "Show", exact: true }).click();
    const kq = page.getByTestId("ket-qua-do-huong");
    await expect(kq).toContainText("South-East", { timeout: 30_000 });
    await expect(kq).toContainText("Xun (SE2)");
    await expect(kq).toContainText("Sheng Qi");

    // Nhà của bạn: bài đọc 5 chương (khung báo cáo chung), sơ đồ nhà; không lưu tài khoản / thẻ chia sẻ / nhắc việc ở bản Anh
    const nc = page.getByTestId("nha-cua-ban");
    await nc.getByRole("textbox", { name: "Year built or moved in" }).fill("2008");
    await nc.getByRole("button", { name: "Read my home" }).click();
    await expect(page.getByTestId("bao-cao-nha")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("bao-cao-nha")).toContainText("What matters most");
    await expect(page.getByTestId("hop-noi-bat").first()).toBeVisible();
    await expect(page.getByText(/\bSao\b/)).toHaveCount(0);
    await expect(nc.getByRole("button", { name: /Nhắc|Remind/ })).toHaveCount(0);

    // Khảo sát nhà: danh mục tiếng Anh, tích một dấu hiệu → kết quả; không có "Để máy đọc ảnh" (gửi ảnh cho AI)
    const ks = page.getByTestId("khao-sat-nha");
    await expect(ks.getByText(/overhead beam/).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("doc-anh-nha")).toHaveCount(0);
    await ks.getByText(/overhead beam/).first().click();
    await ks.getByRole("button", { name: "Read my layout" }).click();
    const kqbc = page.getByTestId("ket-qua-bo-cuc");
    await expect(kqbc).toContainText("Worked out", { timeout: 30_000 });
    await expect(kqbc.getByTestId("dau-hieu-veto").first()).toContainText("Deal with first");
    const docKy = kqbc.getByRole("link", { name: "Read more about this sign" }).first();
    expect(await docKy.getAttribute("href")).toMatch(/^\/en\/feng-shui\/home-signs\//);

    // Huyền Không: lập bàn từ độ toạ gợi ý → bàn 3×3 tiếng Anh
    await page.getByRole("button", { name: "Use 315° for the Flying Star chart" }).click();
    await page.getByRole("button", { name: "Set up the chart" }).click();
    const hk = page.getByTestId("ban-huyen-khong");
    await expect(hk).toContainText("Period", { timeout: 30_000 });
    await expect(hk).toContainText("Mountain star");

    expect(await chuViet(page)).toEqual([]);
    expect(await ngang(page)).toBeLessThanOrEqual(0);

    // Hỏi đáp tiếng Anh: chip điền câu, câu tự gõ, lưới an toàn
    const chip = page.getByRole("button", { name: "Which way should my desk face?", exact: true });
    await expect(chip).toBeVisible();
    await page.getByRole("textbox", { name: "Your feng shui question" }).fill("Is a mirror facing the bed a problem?");
    await page.getByRole("button", { name: "Send question" }).click();
    const tl = page.getByTestId("cau-tra-loi").last();
    await expect(tl).toContainText(/mirror/i, { timeout: 30_000 });
    expect((await tl.innerText()).split("\n").filter((l) => VIET.test(l))).toEqual([]);
    await expect(tl.getByTestId("luoi-an-toan")).toContainText("988");
    const aria = await page.locator('section[aria-label="Ask about feng shui"]').locator("[aria-label], [title]").evaluateAll((els) =>
      els.flatMap((e) => [e.getAttribute("aria-label") ?? "", e.getAttribute("title") ?? ""]));
    expect(aria.filter((x) => VIET.test(x))).toEqual([]);

    // Điện thoại 390px: không cuộn ngang khi đã có kết quả
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await ngang(page)).toBeLessThanOrEqual(0);
  });

  test("điện thoại 390px (chưa có hồ sơ): không cuộn ngang, không chữ Việt", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/feng-shui");
    await expect(page.getByTestId("do-huong")).toBeVisible();
    expect(await ngang(page)).toBeLessThanOrEqual(0);
    expect(await chuViet(page)).toEqual([]);
  });
});

test.describe("/en/feng-shui/home-signs", () => {
  const CUM_A = "/en/feng-shui/home-signs", CUM_V = "/phong-thuy/dau-hieu";
  const CON_A = `${CUM_A}/bed-or-desk-under-a-beam`, CON_V = `${CUM_V}/giuong-ban-duoi-xa-ngang`;

  test("cụm + trang con tiếng Anh, SEO, JSON-LD, hreflang hai chiều, hình minh hoạ", async ({ page }) => {
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
    await expect(page.locator("h1")).toContainText("overhead beam");
    expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${CON_V}$`));
    await expect(page.getByTestId("minh-hoa")).toBeVisible();
    await expect(page.getByTestId("minh-hoa")).toContainText("front door");
    expect(await chuViet(page)).toEqual([]);
    expect(await ldTrang(page)).not.toMatch(VIET);
    const hrefCon = await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefCon.filter((h) => h.startsWith("/") && !h.startsWith("/en"))).toEqual([]);
    await expect(page.getByRole("link", { name: "Check my home" })).toHaveAttribute("href", "/en/feng-shui");

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
    const a = await request.get(`${CUM_A}/giuong-ban-duoi-xa-ngang`, { maxRedirects: 0 });
    expect(a.status()).toBe(308);
    expect(a.headers().location).toMatch(new RegExp(`${CON_A}$`));
    const b = await request.get(`${CUM_V}/bed-or-desk-under-a-beam`, { maxRedirects: 0 });
    expect(b.status()).toBe(308);
    expect(b.headers().location).toMatch(new RegExp(`${CON_V}$`));
  });

  test("sitemap-en có trang công cụ, cụm và trang con dấu hiệu nhà", async ({ request }) => {
    const sm = await (await request.get("/sitemap-en.xml")).text();
    expect(sm).toMatch(/<loc>[^<]*\/en\/feng-shui<\/loc>/);
    expect(sm).toMatch(new RegExp(`<loc>[^<]*${CUM_A}</loc>`));
    expect(sm).toMatch(new RegExp(`<loc>[^<]*${CON_A}</loc>`));
    expect(sm).not.toMatch(/\/en\/feng-shui\/(best-directions|annual-afflictions)/);
  });

  test("404 tiếng Anh: trang con không có, cụm chưa mở bản Anh", async ({ page }) => {
    for (const u of [`${CUM_A}/khong-co-dau-hieu-nay`, "/en/feng-shui/best-directions", "/en/feng-shui/annual-afflictions"]) {
      const r = await page.goto(u);
      expect(r!.status(), u).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
      expect((await page.locator("body").innerText()).split("\n").filter((l) => VIET.test(l) && !l.includes("Tiếng Việt")), u).toEqual([]);
    }
  });
});
