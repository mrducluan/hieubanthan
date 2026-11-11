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
    for (const [ten, bang] of [["CHU_BAT_TU_UI", CHU_BAT_TU_UI], ["CHU_GIAO_DIEN", CHU_GIAO_DIEN], ["CHU_BAT_TU", CHU_BAT_TU]] as const) {
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
