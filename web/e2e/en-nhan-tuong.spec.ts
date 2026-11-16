// EN-ALL GĐ 8 (web) — /en/face-reading, /en/face-reading/face-areas, /en/portrait, /en/year-ahead: rewrite của /nhan-tuong,
// /nhan-tuong/bo-vi, /chan-dung, /thoi-gian-toi (một cây component, ngôn ngữ là ngữ cảnh). Trang Anh không lộ chữ Việt (chữ
// hiển thị + aria/title/placeholder/alt + JSON-LD): đầu trang, bản đồ mặt, khảo sát sáu bước → bài đọc, đo trên ảnh (ảnh không
// rời máy, thoả thuận tiếng Anh trỏ /en/privacy), ma trận ba cách nhìn, thời gian tới; cụm bộ vị + trang con, 308 slug,
// hreflang hai chiều, sitemap-en, 404 tiếng Anh; không cuộn ngang ở 390px. Bản Anh KHÔNG có: máy AI gợi ý từ ảnh, khung hỏi đáp
// Nhân tướng (engine chưa hiểu câu tiếng Anh), lối sang Chỉ tay.
import { test, expect, type Page } from "@playwright/test";
import { CHU_NHAN_TUONG_UI } from "../lib/chu/nhan-tuong";
import { CHU_CHAN_DUNG_UI, CHU_THOI_GIAN_UI } from "../lib/chu/chan-dung";
import { CHU_CHAN_DUNG, CHU_NHAN_TUONG, CHU_THOI_GIAN_TOI } from "../lib/chu/cong-cu";
import { khoaThieuEn } from "../lib/chu-trang";
import { CUM_EN, SO_TRANG_EN } from "../lib/so-trang-en";
import { readFileSync } from "node:fs";
import path from "node:path";
import { napHoSo } from "./_hoso";

const VIET = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
// Hồ sơ tên không dấu (tên người dùng hiện nguyên văn trên trang — tên có dấu là dữ liệu người dùng, không phải chữ giao diện).
const HO_SO_EN = { v: 1, ho_ten: "Alex Morgan", ngay: 17, thang: 5, nam: 1990, gio: "12:30", gioi_tinh: "nam", noi_sinh: "ha-noi", tao_luc: "2026-09-30T00:00:00Z" };
const TL = { khuon_mat: "vuong", tam_dinh: "can_doi", sac_tong: "sang_nhuan", cot_nhuc: "san_chac", tran: "cao_rong_day", long_may: "thanh_dai",
  an_duong: "rong_sang", mat_than: "dinh_sang", le_duong: "tham_quang", son_can: "nep_ngang", chuan_dau: "tron_day", canh_mui: "day_kin" };

async function chuViet(page: Page, vung = "main"): Promise<string[]> {
  const chu = (await page.locator(vung).first().innerText()).split("\n").filter((l) => VIET.test(l));
  const thuocTinh = await page.$$eval(`${vung} [aria-label], ${vung} [title], ${vung} [placeholder], ${vung} [alt]`, (els) =>
    els.flatMap((e) => ["aria-label", "title", "placeholder", "alt"].map((a) => e.getAttribute(a) ?? "")));
  return [...chu, ...thuocTinh.filter((a) => VIET.test(a)).map((a) => `@${a}`)];
}
const ldTrang = async (page: Page) => (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
const ngang = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const linkViet = async (page: Page) => (await page.$$eval("main a[href]", (as) => as.map((a) => a.getAttribute("href") ?? "")))
  .filter((h) => h.startsWith("/") && !h.startsWith("/en"));
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
const napKhaoSat = (page: Page) => page.addInitScript((tl) =>
  localStorage.setItem("hbt.nhan_tuong.v1", JSON.stringify({ v: 1, tra_loi: tl, luc: new Date().toISOString() })), TL);

/** SEO + hreflang hai chiều + một H1 + JSON-LD tiếng Anh + không link sang trang Việt. */
async function kiemDau(page: Page, en: string, vi: string, h1: RegExp) {
  const r = await page.goto(en);
  expect(r!.status(), en).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
  expect((await page.title()).length).toBeLessThanOrEqual(70);
  expect(await page.title()).not.toMatch(VIET);
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(new RegExp(`${en}$`));
  expect(await page.locator('link[rel="alternate"][hreflang="vi"]').getAttribute("href")).toMatch(new RegExp(`${vi}$`));
  expect((await page.locator('meta[name="description"]').getAttribute("content"))!.length).toBeLessThanOrEqual(160);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toContainText(h1);
  const ld = await ldTrang(page);
  expect(ld).toContain('"inLanguage":"en"');
  expect(ld).not.toMatch(VIET);
  // chiều ngược: trang Việt khai hreflang en về đúng URL Anh
  const html = await (await page.request.get(vi)).text();
  expect(html).toMatch(new RegExp(`<link rel="alternate" hrefLang="en" href="[^"]*${en}"`));
}

test.describe("catalog GĐ 8 (Nhân tướng, Chân dung, Thời gian tới)", () => {
  test("mọi khoá bảng chữ có chữ tiếng Anh, không dấu Việt, {biến} hợp lệ", () => {
    const bang = [["CHU_NHAN_TUONG_UI", CHU_NHAN_TUONG_UI], ["CHU_CHAN_DUNG_UI", CHU_CHAN_DUNG_UI], ["CHU_THOI_GIAN_UI", CHU_THOI_GIAN_UI],
      ["CHU_NHAN_TUONG", CHU_NHAN_TUONG], ["CHU_CHAN_DUNG", CHU_CHAN_DUNG], ["CHU_THOI_GIAN_TOI", CHU_THOI_GIAN_TOI]] as const;
    for (const [ten, b] of bang) {
      expect(khoaThieuEn(b), ten).toEqual([]);
      for (const [k, m] of Object.entries(b) as [string, { en?: string; mac_dinh: string }][]) {
        expect(m.en ?? "", `${ten}.${k}`).not.toMatch(VIET);
        const bien = (s: string) => new Set(s.match(/\{[a-z_]+\}/g) ?? []);
        for (const x of bien(m.en ?? "")) expect(bien(m.mac_dinh).has(x), `${ten}.${k} ${x}`).toBe(true);
      }
    }
  });
  test("trang công cụ + cụm mở bản Anh có chữ máy chủ (title ≤ 70, description ≤ 160); bản Anh đọc miễn phí", () => {
    for (const d of ["/nhan-tuong", "/chan-dung", "/thoi-gian-toi"]) {
      const t = SO_TRANG_EN[d]!;
      expect(t.tieu_de_seo.length, d).toBeLessThanOrEqual(70);
      expect(t.mo_ta_seo.length, d).toBeLessThanOrEqual(160);
      expect(JSON.stringify(t), d).not.toMatch(VIET);
    }
    const x = CUM_EN["/nhan-tuong/bo-vi"]!;
    expect(x.tieu_de_seo.length).toBeLessThanOrEqual(70);
    expect(x.mo_ta.length).toBeLessThanOrEqual(160);
    expect(JSON.stringify(x)).not.toMatch(VIET);
    // lib/proxy.ts kéo theo next/server → đọc chữ nguồn thay vì import.
    const luan = readFileSync(path.join(__dirname, "../lib/proxy.ts"), "utf8").match(/luan_giai: new Set\(\[([^\]]*)\]/)?.[1] ?? "";
    expect(luan).toContain('"chan_dung"');
    expect(luan).toContain('"thoi_gian"');
  });
});

test.describe("/en/face-reading", () => {
  test("đầu trang tiếng Anh: SEO, hreflang hai chiều, bản đồ mặt, không chữ Việt, không lộ AI / chỉ tay / hỏi đáp", async ({ page, request }) => {
    const html = await (await request.get("/en/face-reading")).text();
    expect(html).toMatch(/<h1[^>]*>[^<]*Face reading/);
    expect(html).toContain('data-testid="ban-do-mat"');
    await kiemDau(page, "/en/face-reading", "/nhan-tuong", /Face reading/);
    await expect(page.getByTestId("khao-sat-guong")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("anh-chan-dung")).toBeVisible();
    await expect(page.getByTestId("anh-ai-khoi")).toHaveCount(0);
    await expect(page.getByTestId("nt-den-chi-tay")).toHaveCount(0);
    await expect(page.getByTestId("nt-hoi-chua-co")).toBeVisible();
    await expect(page.getByRole("textbox", { name: /question/i })).toHaveCount(0);
    expect(await chuViet(page)).toEqual([]);
    expect(await linkViet(page)).toEqual([]);
    // thoả thuận đo ảnh: tiếng Anh, trỏ /en/privacy#anh-mat (không trỏ trang Việt)
    await expect(page.getByTestId("do-thoa-thuan")).toContainText("never leaves your device");
    await expect(page.getByTestId("do-thoa-thuan").locator('a[href="/en/privacy#anh-mat"]')).toHaveCount(1);
    // bản Việt vẫn như cũ
    await page.goto("/nhan-tuong");
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(/\/en\/face-reading$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page.locator("h1")).toContainText("Xem tướng mặt");
    await expect(page.getByTestId("nt-den-chi-tay")).toBeVisible();
  });

  test("khảo sát sáu bước (bấm thật) → bài đọc tiếng Anh, bản đồ tô màu, sách xưa theo tuổi", async ({ page }) => {
    test.setTimeout(120_000);
    await napHoSo(page, HO_SO_EN);
    await page.goto("/en/face-reading");
    const ks = page.getByTestId("khao-sat-guong");
    await expect(ks).toBeVisible({ timeout: 20_000 });
    await expect(ks).toContainText("Step 1 of 6");
    for (let b = 1; b <= 6; b++) {
      const cau = ks.locator('li[data-testid^="cau-"]');
      const n = await cau.count();
      for (let i = 0; i < n; i++) await cau.nth(i).locator('[role="group"] button').first().click();
      expect(await chuViet(page, "[data-testid=khao-sat-guong]")).toEqual([]);
      if (b < 6) await ks.getByRole("button", { name: "Next step" }).click();
    }
    await page.getByTestId("nut-xem-bai-doc").click();
    const bc = page.getByTestId("bao-cao-nhan-tuong");
    await expect(bc).toBeVisible({ timeout: 30_000 });
    await expect(bc).toContainText("Face shape:");
    await expect(bc.getByTestId("ban-do-mat").locator("[data-muc]")).not.toHaveCount(0);
    await expect(bc.getByTestId("ban-do-mat")).toContainText("This year, look at");
    await bc.getByTestId("nut-bai-ca").click();
    await expect(bc.getByTestId("bai-ca-luu-nien")).toContainText("The old books");
    await expect(bc.getByTestId("chip-muc").first()).toBeVisible();
    expect(await chuViet(page)).toEqual([]);
    expect(await linkViet(page)).toEqual([]);
    expect(await ngang(page)).toBeLessThanOrEqual(0);
  });

  test("đo trên ảnh (engine thật, không AI): chấm 20 điểm → thoả thuận tiếng Anh → số đo + gợi ý tiếng Anh; thân gửi chỉ toạ độ", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 1400 });
    await napHoSo(page, HO_SO_EN);
    const than: unknown[] = [];
    page.on("request", (q) => { if (q.url().includes("/api/nhan-tuong/do-mat")) than.push(q.postDataJSON()); });
    // EN-ALL GĐ 8: dòng giải thích số đo (`goi_y[].do`) engine trả theo ngôn ngữ — trang Anh không còn chữ Việt nào.
    await page.goto("/en/face-reading");
    await expect(page.getByTestId("anh-chan-dung")).toBeVisible({ timeout: 20_000 });
    const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    await page.getByTestId("do-input").setInputFiles({ name: "portrait.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByTestId("do-dang-cham")).toContainText("Hairline");
    const r = 0.09 * 0.084;
    const MAT: [number, number][] = [
      [0.5, 0.10], [0.32, 0.37], [0.68, 0.37], [0.30, 0.47], [0.70, 0.47], [0.34, 0.66], [0.66, 0.66], [0.5, 0.75],
      [0.45, 0.37], [0.55, 0.37], [0.374, 0.42 - r], [0.458, 0.42], [0.542, 0.42], [0.626, 0.42 - r],
      [0.5, 0.56], [0.454, 0.55], [0.546, 0.55], [0.425, 0.63], [0.5, 0.625], [0.575, 0.63],
    ];
    const khung = page.getByTestId("do-khung");
    await expect(khung.locator("img")).toBeVisible();
    await khung.scrollIntoViewIfNeeded();
    const b = (await khung.boundingBox())!;
    for (const [x, y] of MAT) await page.mouse.click(b.x + x * b.width, b.y + y * b.height);
    const nut = page.getByTestId("do-tinh");
    await expect(nut).toBeDisabled();
    await page.getByTestId("do-dong-y").check();
    await nut.click();
    const gy = page.getByTestId("do-goi-y");
    await expect(gy).toBeVisible({ timeout: 20_000 });
    await expect(gy).toContainText("you confirm");
    await expect(page.getByTestId("do-so-do")).toContainText("Height / cheekbone width: 1.63");
    await expect(page.getByTestId("do-da-dong-y")).toContainText("Agreed on");
    expect(await chuViet(page)).toEqual([]);
    expect(than).toHaveLength(1);
    expect(Object.keys(than[0] as object).sort()).toEqual(["diem", "dong_y", "ti_le"]);
    await page.getByTestId("do-dung").click();
    await expect(page.getByTestId("do-da-dung")).toContainText("features filled in the survey");
    await page.getByTestId("do-xem-bai-doc").click();
    await expect(page.getByTestId("bao-cao-nhan-tuong")).toBeVisible({ timeout: 30_000 });
    expect(await chuViet(page)).toEqual([]);
  });

  test("điện thoại 390px: không cuộn ngang, không chữ Việt", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/face-reading");
    await expect(page.getByTestId("khao-sat-guong")).toBeVisible({ timeout: 20_000 });
    await page.waitForLoadState("networkidle");
    await expect.poll(async () => ({ ngang: Math.max(0, await ngang(page)), tho_ra: await thoRa(page) }), { timeout: 10_000 })
      .toEqual({ ngang: 0, tho_ra: [] });
    expect(await chuViet(page)).toEqual([]);
  });
});

test.describe("/en/face-reading/face-areas", () => {
  const CUM_A = "/en/face-reading/face-areas", CUM_V = "/nhan-tuong/bo-vi";
  const CON_A = `${CUM_A}/tian-zhong-upper-forehead`, CON_V = `${CUM_V}/thien-trung`;

  test("cụm + trang con tiếng Anh, SEO, JSON-LD, hreflang hai chiều, hình bản đồ mặt", async ({ page }) => {
    test.setTimeout(90_000);
    await kiemDau(page, CUM_A, CUM_V, /areas of the face/i);
    expect(await chuViet(page)).toEqual([]);
    await expect(page.locator(`main a[href="${CON_A}"]`).first()).toBeAttached();
    expect(await page.locator(`main a[href^="${CUM_A}/"]`).count()).toBeGreaterThanOrEqual(24);
    expect(await linkViet(page)).toEqual([]);

    await kiemDau(page, CON_A, CON_V, /Tian Zhong/);
    await expect(page.getByTestId("minh-hoa")).toBeVisible();
    await expect(page.getByTestId("minh-hoa").getByTestId("ban-do-mat")).toBeVisible();
    expect(await chuViet(page)).toEqual([]);
    expect(await linkViet(page)).toEqual([]);
    await expect(page.getByRole("link", { name: "Read my face" }).first()).toHaveAttribute("href", "/en/face-reading");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    expect(await ngang(page)).toBeLessThanOrEqual(0);
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto(CON_V);
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`${CON_A}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await page.goto(CUM_V);
    expect(await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute("href")).toMatch(new RegExp(`${CUM_A}$`));
  });

  test("308 slug: URL Anh mang slug Việt → slug Anh; URL Việt mang slug Anh → slug Việt", async ({ request }) => {
    const a = await request.get(`${CUM_A}/thien-trung`, { maxRedirects: 0 });
    expect(a.status()).toBe(308);
    expect(a.headers().location).toMatch(new RegExp(`${CON_A}$`));
    const b = await request.get(`${CUM_V}/tian-zhong-upper-forehead`, { maxRedirects: 0 });
    expect(b.status()).toBe(308);
    expect(b.headers().location).toMatch(new RegExp(`${CON_V}$`));
  });

  test("404 tiếng Anh: bộ vị không có", async ({ page }) => {
    const r = await page.goto(`${CUM_A}/khong-co-vung-nay`);
    expect(r!.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
    expect((await page.locator("body").innerText()).split("\n").filter((l) => VIET.test(l) && !l.includes("Tiếng Việt"))).toEqual([]);
  });
});

test.describe("/en/portrait + /en/year-ahead", () => {
  test("portrait: chưa có giờ sinh → mời lập lá số tiếng Anh; đủ hồ sơ + khảo sát → ma trận + báo cáo tiếng Anh, miễn phí", async ({ page }) => {
    test.setTimeout(120_000);
    await kiemDau(page, "/en/portrait", "/chan-dung", /combined portrait/i);
    await napHoSo(page, { ...HO_SO_EN, gio: undefined, noi_sinh: undefined });
    await page.goto("/en/portrait");
    await expect(page.getByTestId("moi-lap-la-so")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("moi-lap-la-so")).toContainText("birth time");
    expect(await chuViet(page)).toEqual([]);
    expect(await linkViet(page)).toEqual([]);

    const ctx = await page.context().browser()!.newContext({ timezoneId: "Asia/Ho_Chi_Minh", storageState: undefined });
    const p2 = await ctx.newPage();
    await napHoSo(p2, HO_SO_EN);
    await napKhaoSat(p2);
    await p2.goto(`${new URL(page.url()).origin}/en/portrait`);
    const mt = p2.getByTestId("ma-tran-ba-cach");
    await expect(mt).toBeVisible({ timeout: 40_000 });
    await expect(mt).toContainText("Three views, one person");
    await expect(mt.locator("tbody tr")).toHaveCount(6);
    await expect(p2.getByTestId("cd-trang-thai")).toContainText("12 features");
    await expect(p2.getByTestId("mt-cong_viec").getByTestId("chip-muc")).toHaveCount(3);
    await expect(p2.getByTestId("luan-giai-toan-bo")).toBeVisible();
    // bản Anh miễn phí: không có phần khoá chương
    await expect(p2.locator("[data-testid=lg-phan-khoa]")).toHaveCount(0);
    expect(await chuViet(p2)).toEqual([]);
    expect(await linkViet(p2)).toEqual([]);
    await ctx.close();
  });

  test("year ahead: chưa có hồ sơ → form tiếng Anh; có ngày sinh → chọn năm + báo cáo tiếng Anh, miễn phí", async ({ page }) => {
    test.setTimeout(120_000);
    await kiemDau(page, "/en/year-ahead", "/thoi-gian-toi", /year ahead/i);
    await expect(page.getByTestId("tgt-nhap")).toBeVisible({ timeout: 20_000 });
    expect(await chuViet(page)).toEqual([]);
    expect(await linkViet(page)).toEqual([]);

    const ctx = await page.context().browser()!.newContext({ timezoneId: "Asia/Ho_Chi_Minh" });
    const p2 = await ctx.newPage();
    await napHoSo(p2, { ...HO_SO_EN, gio: undefined, noi_sinh: undefined });
    await p2.goto(`${new URL(page.url()).origin}/en/year-ahead`);
    await expect(p2.getByTestId("thoi-gian-toi")).toBeVisible({ timeout: 20_000 });
    await expect(p2.getByRole("group", { name: "Choose the year" })).toContainText("Current lunar year");
    await expect(p2.getByTestId("tgt-bo-sung")).toContainText("Add these details");
    await expect(p2.getByTestId("luan-giai-toan-bo")).toBeVisible({ timeout: 40_000 });
    await expect(p2.locator("[data-testid=lg-phan-khoa]")).toHaveCount(0);
    expect(await chuViet(p2)).toEqual([]);
    expect(await linkViet(p2)).toEqual([]);
    await p2.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => ({ ngang: Math.max(0, await ngang(p2)), tho_ra: await thoRa(p2) }), { timeout: 10_000 })
      .toEqual({ ngang: 0, tho_ra: [] });
    await ctx.close();
  });
});

test("sitemap-en có ba trang công cụ, cụm bộ vị và trang con (hreflang về đúng trang Việt)", async ({ request }) => {
  const sm = await (await request.get("/sitemap-en.xml")).text();
  for (const u of ["/en/face-reading", "/en/portrait", "/en/year-ahead", "/en/face-reading/face-areas"]) expect(sm).toMatch(new RegExp(`<loc>[^<]*${u}</loc>`));
  expect(sm).toMatch(/\/en\/face-reading\/face-areas\/tian-zhong-upper-forehead<\/loc><lastmod>[^<]+<\/lastmod><xhtml:link rel="alternate" hreflang="en"[^>]*\/><xhtml:link rel="alternate" hreflang="vi" href="[^"]*\/nhan-tuong\/bo-vi\/thien-trung"/);
  expect(sm).toMatch(/\/en\/portrait<\/loc>(<lastmod>[^<]+<\/lastmod>)?<xhtml:link rel="alternate" hreflang="en"[^>]*\/><xhtml:link rel="alternate" hreflang="vi" href="[^"]*\/chan-dung"/);
});
