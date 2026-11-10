// EN-ALL giai đoạn 1 việc 1–2 — khung ĐẦY ĐỦ cho bản Anh (cùng component với bản Việt): menu đầu trang + menu điện thoại,
// thanh mảng, chân trang, tab dưới, hộp cookie; "Chữ dùng chung" có chiều tiếng Anh. Kiểm:
//  - catalog đủ chữ: mọi mục menu / thanh mảng / Chữ dùng chung của bản Việt có bản Anh (thiếu = đỏ, không lộ chữ Việt);
//  - khung chỉ hiện mục có bản Anh đã mở, mọi link nội bộ nằm trong /en (trừ nút "Tiếng Việt");
//  - không chữ Việt trong phần nhìn thấy của khung, không cuộn ngang ở 390 px;
//  - bản Việt giữ nguyên khung cũ (chữ, không có nút đổi ngôn ngữ). So từng byte HTML: scripts/chup-html.mjs.
import { test, expect, type Page } from "@playwright/test";
import { MENU_DAU_TRANG } from "../lib/menu-dau-trang";
import { TEN_MENU_EN, cotChanTrangEn, menuEn } from "../lib/khung-en";
import { THANH_MANG } from "../lib/thanh-mang";
import { CHU_CHUNG } from "../lib/chu/chung";
import { khoaThieuEn } from "../lib/chu-trang";
import { banAnh } from "../lib/duong-en";

const VIET = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

test.describe("catalog khung", () => {
  test("mọi mục menu đầu trang bản Việt có chữ tiếng Anh", () => {
    const thieu: string[] = [];
    for (const m of MENU_DAU_TRANG) {
      if (!TEN_MENU_EN[`cha:${m.href}`]) thieu.push(`cha:${m.href}`);
      for (const c of m.con) if (!TEN_MENU_EN[c.href]) thieu.push(c.href);
    }
    expect(thieu).toEqual([]);
    for (const [k, v] of Object.entries(TEN_MENU_EN)) {
      expect(v.ten, k).not.toMatch(VIET);
      if (v.mo_ta) expect(v.mo_ta, k).not.toMatch(VIET);
    }
  });

  test("menu + chân trang bản Anh chỉ gồm URL /en đã mở, không trùng", () => {
    const menu = menuEn(MENU_DAU_TRANG);
    expect(menu.length).toBeGreaterThan(0);
    const hrefs = menu.flatMap((m) => [m.href, ...m.con.map((c) => c.href)]);
    for (const h of hrefs) expect(h, h).toMatch(/^\/en(\/|$|#)/);
    expect(new Set(menu.map((m) => m.href)).size).toBe(menu.length);
    expect(hrefs.some((h) => h.includes("{nam}"))).toBe(false);
    for (const c of cotChanTrangEn()) for (const [h, ten] of c.ds) { expect(h).toMatch(/^\/en(\/|$)/); expect(ten).not.toMatch(VIET); }
  });

  test("thanh mảng + Chữ dùng chung: mọi khoá có chữ tiếng Anh", () => {
    for (const t of THANH_MANG) {
      expect(t.en, t.ma).toBeTruthy();
      expect(t.en).not.toMatch(VIET);
      for (const m of t.muc) { expect(m.en, `${t.ma}.${m.ma}`).toBeTruthy(); expect(m.en).not.toMatch(VIET); }
    }
    expect(khoaThieuEn(CHU_CHUNG)).toEqual([]);
    for (const [k, m] of Object.entries(CHU_CHUNG)) {
      if (!m.en) continue;
      expect(m.en, k).not.toMatch(VIET);
      expect(m.en.length, k).toBeLessThanOrEqual(m.toi_da ?? 300);
    }
  });
});

/** Chữ nhìn thấy của KHUNG (thanh trên, thanh mảng, chân trang, tab dưới) — trừ nút "Tiếng Việt". */
async function chuKhung(page: Page): Promise<string> {
  return page.evaluate(() => [...document.querySelectorAll("[data-thanh-dau], [data-thanh-mang], [data-testid=chan-trang], [data-thanh-duoi]")]
    .map((e) => { const c = e.cloneNode(true) as HTMLElement; c.querySelectorAll("[data-testid=doi-tieng-viet]").forEach((x) => x.remove()); return c.innerText; })
    .join("\n"));
}

async function linkKhung(page: Page): Promise<string[]> {
  return page.evaluate(() => [...document.querySelectorAll<HTMLAnchorElement>("[data-thanh-dau] a, [data-thanh-mang] a, [data-testid=chan-trang] a, [data-thanh-duoi] a")]
    .filter((a) => a.dataset.testid !== "doi-tieng-viet" && a.origin === location.origin).map((a) => a.pathname + a.hash));
}

test.describe("trên trình duyệt", () => {
  test("máy tính: khung tiếng Anh, thanh mảng Tarot, chỉ link /en, không chữ Việt", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/en/tarot/cards/the-fool");
    const nav = page.getByTestId("menu-dau-trang");
    await expect(nav.getByRole("link", { name: "Numerology" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Tarot" })).toHaveAttribute("aria-current", "page");
    const thanh = page.locator("[data-thanh-mang=tarot]");
    await expect(thanh).toBeVisible();
    await expect(thanh.locator("[data-muc=la_bai]")).toHaveAttribute("aria-current", /page|location/);
    await expect(thanh.locator("[data-muc=la_bai]")).toHaveAttribute("href", "/en/tarot/cards");
    await expect(page.getByTestId("chan-trang")).toContainText("All rights reserved");
    expect(await chuKhung(page)).not.toMatch(VIET);
    for (const h of await linkKhung(page)) expect(h, h).toMatch(/^\/en(\/|$|#)/);
    for (const h of await linkKhung(page)) expect(banAnh(h) ?? h).toBeTruthy();
  });

  test("điện thoại: tab dưới + menu đầy đủ tiếng Anh, không cuộn ngang", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/numerology");
    const tab = page.locator("[data-thanh-duoi]");
    await expect(tab.getByRole("link", { name: "Numerology" })).toHaveAttribute("aria-current", "page");
    await page.getByTestId("nut-menu").click();
    const dd = page.getByTestId("menu-di-dong");
    await expect(dd.getByRole("link", { name: "Tarot" })).toBeVisible();
    expect(await dd.innerText()).not.toMatch(VIET);
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(await chuKhung(page)).not.toMatch(VIET);
  });

  test("bản Việt giữ khung cũ: chữ Việt, không có nút đổi ngôn ngữ trong khung", async ({ page }) => {
    await page.goto("/tarot");
    await expect(page.getByRole("banner")).toContainText("Hiểu Bản Thân");
    await expect(page.getByTestId("chan-trang")).toContainText("Bảo lưu mọi quyền");
    await expect(page.locator("[data-thanh-dau] [data-testid=doi-tieng-viet], [data-testid=chan-trang] [data-testid=doi-tieng-viet]")).toHaveCount(0);
    await expect(page.locator("[data-thanh-mang=tarot] [data-muc=la_bai]")).toHaveAttribute("href", "/tarot/la-bai");
  });
});

test.describe("hồ sơ chung giữa hai ngôn ngữ (việc 4)", () => {
  test("hồ sơ cũ hbt.en.profile.v1 chuyển MỘT lần sang hồ sơ chung, bản Việt đọc được", async ({ page }) => {
    await page.goto("/en/privacy");
    await page.evaluate(() => {
      localStorage.removeItem("hbt.hoso.v1");
      localStorage.setItem("hbt.en.profile.v1", JSON.stringify({ name: "Mary O'Brien", nickname: "Mo", day: 7, month: 3, year: 1990, method: "tong_het" }));
    });
    await page.goto("/en/numerology");
    await expect(page.getByTestId("dong-ho-so-en")).toContainText("Mary O'Brien");
    const may = await page.evaluate(() => ({ cu: localStorage.getItem("hbt.en.profile.v1"), moi: JSON.parse(localStorage.getItem("hbt.hoso.v1") ?? "null"), dd: localStorage.getItem("hbt.thanso_dd") }));
    expect(may.cu).toBeNull();
    expect(may.moi).toMatchObject({ ho_ten: "Mary O'Brien", ten_khac: "Mo", ngay: 7, thang: 3, nam: 1990 });
    expect(may.dd).toBe("tong_het");
  });

  test("hồ sơ chung có sẵn thắng hồ sơ cũ; hồ sơ nhập ở bản Việt hiện ở bản Anh", async ({ page }) => {
    await page.goto("/en/privacy");
    await page.evaluate(() => {
      localStorage.setItem("hbt.hoso.v1", JSON.stringify({ v: 1, ho_ten: "Nguyen An", ngay: 24, thang: 10, nam: 1988, gio: "09:30", tao_luc: new Date().toISOString() }));
      localStorage.setItem("hbt.en.profile.v1", JSON.stringify({ name: "Someone Else", day: 1, month: 1, year: 2000, method: "tung_phan" }));
    });
    await page.goto("/en/numerology");
    await expect(page.getByTestId("dong-ho-so-en")).toContainText("Nguyen An");
    const may = await page.evaluate(() => ({ cu: localStorage.getItem("hbt.en.profile.v1"), moi: JSON.parse(localStorage.getItem("hbt.hoso.v1") ?? "null") }));
    expect(may.cu).toBeNull();
    expect(may.moi).toMatchObject({ ho_ten: "Nguyen An", gio: "09:30" });   // trường bản Việt (giờ sinh) không mất
  });
});
