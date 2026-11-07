// TM-1 (chủ dự án duyệt 2026-11-03, docs/audit-2026-11/H-de-xuat-dieu-huong.md phương án A + C-2): thanh mảng dính dưới
// menu chính, breadcrumb thật "Trang chủ › Huyền học › {mảng} › …", mục lục + lọc cho cụm dài, menu "Huyền học" đổi 3 mục,
// hub đủ cụm, lối vào "ngày tốt theo việc", /lich-am có link vào, Tử vi gom lớp hạn + trường phái vào "Hiển thị".
import { test, expect, type Page } from "@playwright/test";
import { THANH_MANG, khoaChu, mucDangXem, thanhCua } from "../lib/thanh-mang";
import { duongDanCongCu, duongDanCum } from "../lib/duong-dan";
import { CUM_CO_MUC_LUC, maChu, mucLucCum } from "../lib/nhom-cum";
import { CHU_CHUNG } from "../lib/chu/chung";
import { MENU_DAU_TRANG } from "../lib/menu-dau-trang";
import CHUYEN from "../lib/chuyen-huong.json";
import { napHoSo } from "./_hoso";

/** Chờ mọi phần tử đang hiện khớp `chon` đã được React gắn trình xử lý (tìm lại mỗi lần — Suspense có thể thay phần tử). */
async function choHydrate(page: Page, chon: string) {
  await page.waitForFunction((c) => {
    const ds = [...document.querySelectorAll(c)].filter((el) => (el as HTMLElement).offsetParent !== null);
    return ds.length > 0 && ds.every((el) => Object.keys(el).some((k) => k.startsWith("__reactProps")));
  }, chon, { timeout: 30_000 });
}

const ENGINE = `http://127.0.0.1:${Number(process.env.E2E_ENGINE_PORT) || 8000}`;
const breadcrumb = async (page: Page) => (await page.getByTestId("duong-dan").first().getByRole("listitem").allTextContents()).map((x) => x.replace("›", "").trim());
const ldBreadcrumb = (html: string) => {
  const m = [...html.matchAll(/"@type":"BreadcrumbList","itemListElement":(\[.*?\])\}/g)].map((x) => JSON.parse(x[1]!) as { name: string; item: string }[]);
  return m[0]?.map((x) => x.name) ?? [];
};

// ---------- thuần ----------

test("thanh mảng: tìm đúng thanh theo đoạn đầu đường dẫn, mục sáng là đường dài nhất khớp", () => {
  expect(thanhCua("/tu-vi")?.ma).toBe("tuvi");
  expect(thanhCua("/tu-vi/sao-o-cung/tu-vi-cung-menh")?.ma).toBe("tuvi");
  expect(thanhCua("/than-so/tinh-yeu")?.ma).toBe("thanso");          // tình yêu nằm dưới trụ Thần số (silo)
  expect(thanhCua("/xem-sao-han")).toBeNull();
  expect(thanhCua("/")).toBeNull();
  expect(thanhCua("/huyen-hoc")).toBeNull();
  const tv = thanhCua("/tu-vi")!;
  const ma = (p: string) => tv.muc[mucDangXem(tv, p)]?.ma ?? null;
  expect(ma("/tu-vi")).toBe("cong_cu");
  expect(ma("/tu-vi/")).toBe("cong_cu");
  expect(ma("/tu-vi?x=1#hop-tham")).toBe("cong_cu");
  expect(ma("/tu-vi/sao-o-cung")).toBe("sao_cung");
  expect(ma("/tu-vi/sao-o-cung/thai-duong-cung-menh")).toBe("sao_cung");
  expect(ma("/tu-vi/la-so-mau/a")).toBe("la_so_mau");
  const kd = thanhCua("/kinh-dich")!;
  expect(kd.muc[mucDangXem(kd, "/kinh-dich")]!.ma).toBe("cong_cu");
  expect(kd.muc[mucDangXem(kd, "/kinh-dich?cach=mai_hoa")]!.ma).toBe("mai_hoa");   // chế độ của công cụ thắng mục công cụ
  expect(kd.muc[mucDangXem(kd, "/kinh-dich?cach=mai_hoa_so&so=1,2")]!.ma).toBe("cong_cu");
  expect(kd.muc[mucDangXem(kd, "/kinh-dich/que?cach=mai_hoa")]!.ma).toBe("que");
  const hd = thanhCua("/hop-doi/abc")!;
  expect(mucDangXem(hd, "/hop-doi/abc")).toBe(-1);                    // trang nhận lời mời: không mục nào sáng
});

test("thanh mảng: mọi đường dẫn nằm trong silo đã khai (không link chết), mỗi mảng đúng một mục công cụ ở đầu", () => {
  const cum = new Set(Object.values(CHUYEN.chu_de));
  for (const t of THANH_MANG) {
    expect(t.muc[0]!.duong, t.ma).toBe(t.tru);
    expect(new Set(t.muc.map((m) => m.ma)).size).toBe(t.muc.length);
    for (const m of t.muc.slice(1)) {
      const p = m.duong.split(/[?#]/)[0]!;
      const hopLe = cum.has(p) || ["/tu-vi/la-so-mau", "/phong-thuy/huong-xau-nam", CHUYEN.tuoi_huong, "/tu-vi", "/kinh-dich", "/nhan-tuong", "/tarot"].includes(p);
      expect(hopLe, `${t.ma}.${m.ma} → ${m.duong}`).toBe(true);
    }
  }
});

test("thanh mảng: nhãn sửa được ở CMS 'Chữ dùng chung' — có khoá cho tên mảng và từng mục, mặc định = chữ trong code", () => {
  const bang = CHU_CHUNG as Record<string, { mac_dinh: string; nhom?: string }>;
  for (const t of THANH_MANG) {
    expect(bang[`thanh.${t.ma}.ten`]?.mac_dinh).toBe(t.ten);
    for (const m of t.muc) expect(bang[khoaChu(t, m)]?.mac_dinh, khoaChu(t, m)).toBe(m.nhan);
  }
});

test("breadcrumb: công cụ gốc dưới hub Huyền học, công cụ trong silo dưới trang trụ, cụm + trang con đủ cấp", () => {
  expect(duongDanCongCu("/tu-vi", "Tử vi").map((x) => x.ten)).toEqual(["Trang chủ", "Huyền học", "Tử vi"]);
  expect(duongDanCongCu("/phong-thuy/huong-xau-nam", "Hướng xấu theo năm").map((x) => x.duong))
    .toEqual(["/", "/huyen-hoc", "/phong-thuy", "/phong-thuy/huong-xau-nam"]);
  expect(duongDanCum({ ten: "Sao ở cung", duong: "/tu-vi/sao-o-cung" }, { ten: "X", duong: "/tu-vi/sao-o-cung/x" }).map((x) => x.ten))
    .toEqual(["Trang chủ", "Huyền học", "Tử vi", "Sao ở cung", "X"]);
});

test("mục lục cụm: nhóm đọc từ tiêu đề engine, không mất bài; tên quái phân biệt Càn / Cấn", () => {
  expect(maChu("Thủy Lôi Truân")).toBe("thuy-loi-truan");
  const b = (duong: string, tieu_de: string) => ({ duong, tieu_de, mo_ta: "" });
  const ml = mucLucCum("kinh-dich", [b("/a", "Quẻ 1 Thuần Càn (乾) — x"), b("/b", "Quẻ 52 Thuần Cấn (艮) — x"),
    b("/c", "Quẻ 11 Địa Thiên Thái (泰) — x"), b("/d", "Quẻ 99 lạ")])!;
  const theoNhom = Object.fromEntries(ml.nhom.map((n) => [n.ten, n.bai.map((x) => x.duong)]));
  expect(theoNhom).toEqual({ "Càn · Trời": ["/a"], "Khôn · Đất": ["/c"], "Cấn · Núi": ["/b"], "Khác": ["/d"] });
  expect(ml.nhom.at(-1)!.ma).toBe("khac");
  expect(mucLucCum("than-so", [b("/a", "x")])).toBeNull();          // cụm ngắn: giữ lưới phẳng
  expect(CUM_CO_MUC_LUC.sort()).toEqual(["hop-so", "kinh-dich", "menh-tuoi", "sao-cung", "so-kep", "tu-hoa"]);
});

test("mục lục cụm trên dữ liệu engine thật: đủ bài, đúng số nhóm", async ({ request }) => {
  const ds = (await (await request.get(`${ENGINE}/v1/kb/trang`)).json()).trang as { loai: string; slug: string; tieu_de: string; mo_ta: string }[];
  const loai: Record<string, string> = { "sao-cung": "sao_cung", "tu-hoa": "hoa_cung", "kinh-dich": "que", "menh-tuoi": "menh_nam", "so-kep": "so_kep", "hop-so": "cap_so" };
  const mong: Record<string, [number, number | null]> = { "sao-cung": [14, 12], "tu-hoa": [4, 12], "kinh-dich": [8, null], "menh-tuoi": [8, null], "so-kep": [4, null], "hop-so": [9, 9] };
  for (const k of CUM_CO_MUC_LUC) {
    const bai = ds.filter((t) => t.loai === loai[k]).map((t) => ({ duong: `/${t.slug}`, tieu_de: t.tieu_de, mo_ta: t.mo_ta }));
    const ml = mucLucCum(k, bai)!;
    expect(ml.nhom.reduce((s, n) => s + n.bai.length, 0), k).toBe(bai.length);
    expect(ml.nhom.some((n) => n.ma === "khac"), `${k}: có bài không nhận ra nhóm`).toBe(false);
    expect(ml.nhom.length, k).toBe(mong[k]![0]);
    expect(ml.loc?.ds.length ?? null, k).toBe(mong[k]![1]);
    if (k === "kinh-dich") expect(ml.nhom.every((n) => n.bai.length === 8)).toBe(true);   // mỗi quái trên đúng 8 quẻ
  }
});

test("menu Huyền học: 3 cụm kiến thức lớn thay 3 công cụ đã có bản theo năm ở menu Năm", () => {
  const hh = MENU_DAU_TRANG.find((m) => m.href === "/huyen-hoc")!.con.map((c) => c.href);
  expect(hh).toHaveLength(12);
  for (const h of ["/tu-vi/sao-o-cung", "/kinh-dich/que", "/bat-tu/menh-theo-nam"]) expect(hh).toContain(h);
  for (const h of ["/tuoi-xong-dat", "/xem-sao-han", "/phong-thuy/huong-xau-nam"]) expect(hh).not.toContain(h);
  const nam = MENU_DAU_TRANG.find((m) => m.href === "/nam/{nam}")!.con.map((c) => c.href);
  for (const h of ["/tuoi-xong-dat/{nam}", "/xem-sao-han/{nam}", "/phong-thuy/huong-xau-nam/{nam}"]) expect(nam).toContain(h);
});

// ---------- trang ----------
// Thanh nằm trong <Suspense> ở layout (số trang điền sau): lúc HTML còn đang truyền, bản đầy đủ đứng tạm trong <div hidden>
// chờ thay chỗ bản chờ → luôn nhắm thanh ĐANG HIỆN (:visible), không đếm bản ẩn.

test("trang cụm: thanh mảng sáng đúng mục + có số trang, breadcrumb đủ cấp (hiển thị = JSON-LD)", async ({ page }) => {
  await page.goto("/tu-vi/sao-o-cung");
  const tm = page.locator("[data-thanh-mang=tuvi]:visible");
  await expect(tm).toBeVisible();
  await expect(tm.getByRole("link", { name: /Sao ở cung/ })).toHaveAttribute("aria-current", "page");
  await expect(tm.locator("[data-muc=sao_cung]")).toContainText("168");
  await expect(tm.locator("[aria-current=page]")).toHaveCount(1);
  expect(await breadcrumb(page)).toEqual(["Trang chủ", "Huyền học", "Tử vi", "Chính tinh ở từng cung Tử vi"]);
  expect(ldBreadcrumb(await page.content())).toEqual(["Trang chủ", "Huyền học", "Tử vi", "Chính tinh ở từng cung Tử vi"]);
  await expect(page.getByTestId("duong-dan").getByRole("link", { name: "Huyền học" })).toHaveAttribute("href", "/huyen-hoc");
});

test("trang con: breadcrumb 5 cấp, thanh mảng vẫn sáng cụm cha; bấm thanh đổi trang và mục sáng", async ({ page }) => {
  await page.goto("/tu-vi/sao-o-cung/thai-duong-cung-menh");
  expect((await breadcrumb(page)).slice(0, 4)).toEqual(["Trang chủ", "Huyền học", "Tử vi", "Chính tinh ở từng cung Tử vi"]);
  const tm = page.locator("[data-thanh-mang=tuvi]:visible");
  await expect(tm.locator("[data-muc=sao_cung]")).toHaveAttribute("aria-current", "location");   // cụm cha, không phải chính trang
  // Chờ React gắn trình xử lý bấm (hydrate xong) vào ĐÚNG phần tử đang hiện — thanh hiện bản tạm trước rồi bản có số
  // trang (chờ engine) thay vào; bấm sớm / bám phần tử cũ thì trình duyệt tải lại trang thường, không có sự kiện đo.
  await choHydrate(page, "[data-thanh-mang=tuvi] [data-muc=tu_hoa]");
  await tm.locator("[data-muc=tu_hoa]").click();
  await expect(page).toHaveURL(/\/tu-vi\/tu-hoa$/);
  // đo lượt bấm thanh: chỉ mã mảng + mã mục + đường dẫn đang xem
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien?: string; event?: string; tu?: string; den?: string }[] }).__hbt_su_kien ?? []);
  expect(JSON.stringify(sk)).toContain("nav_bar_clicked");
  expect(JSON.stringify(sk)).toMatch(/"tu":"tuvi"[^}]*"den":"tu_hoa"|"den":"tu_hoa"[^}]*"tu":"tuvi"/);
  await expect(tm.locator("[data-muc=tu_hoa]")).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tứ hoá");
});

test("Kinh Dịch: mục 'Quẻ theo giờ' mở chế độ Mai Hoa và sáng khi đang ở chế độ đó", async ({ page }) => {
  await page.goto("/kinh-dich");
  const tm = page.locator("[data-thanh-mang=kinhdich]:visible");
  await tm.locator("[data-muc=mai_hoa]").click();
  await expect(page).toHaveURL(/\/kinh-dich\?cach=mai_hoa$/);
  await expect(tm.locator("[data-muc=mai_hoa]")).toHaveAttribute("aria-current", "page");
  await expect(tm.locator("[aria-current]")).toHaveCount(1);
});

test("trang công cụ: breadcrumb thật thay chữ 'Huyền học' tĩnh; dòng nhỏ nói mảng làm gì", async ({ page, request }) => {
  await page.goto("/bat-tu");
  expect(await breadcrumb(page)).toEqual(["Trang chủ", "Huyền học", "Bát tự"]);
  await expect(page.locator("[data-thanh-mang=battu]:visible [data-muc=cong_cu]")).toHaveAttribute("aria-current", "page");
  await expect(page.locator("header .eyebrow").first()).toHaveText(/tứ trụ/i);
  const html = await (await request.get("/phong-thuy/huong-xau-nam")).text();
  expect(ldBreadcrumb(html)).toEqual(["Trang chủ", "Huyền học", "Phong thuỷ", "Hướng xấu theo năm"]);
});

test("không có thanh mảng ngoài 6 mảng; mọi trang của 6 mảng đều có", async ({ page }) => {
  for (const p of ["/", "/xem-sao-han", "/huyen-hoc", "/nam"]) {
    await page.goto(p);
    await expect(page.locator("[data-thanh-mang]"), p).toHaveCount(0);
  }
  for (const [p, ma] of [["/than-so/y-nghia-so", "thanso"], ["/hop-doi/cap-so", "hopdoi"], ["/kinh-dich/que", "kinhdich"],
    ["/phong-thuy/huong-hop-tuoi", "phongthuy"], ["/phong-thuy/dau-hieu", "phongthuy"], ["/tu-vi/la-so-mau", "tuvi"]] as const) {
    await page.goto(p);
    await expect(page.locator(`[data-thanh-mang=${ma}]:visible`), p).toBeVisible();
    await expect(page.locator(`[data-thanh-mang=${ma}]:visible [aria-current]`), p).toHaveCount(1);
  }
});

test("thanh mảng điện thoại: cuộn xuống thì ẩn (neo không bị che), cuộn lên thì hiện; máy tính luôn hiện", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/kinh-dich/que");
  const tm = page.locator("[data-thanh-mang]:visible");
  const tmH = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--tm-h").trim());
  await expect(tm).toHaveAttribute("data-an", "0");
  expect(await tmH()).toBe("2.75rem");                                // CSS đặt ngay từ HTML máy chủ, không chờ JS
  // mục đang xem nằm trong khung nhìn của dải (đã tự cuộn ngang)
  await expect.poll(async () => { const r = await tm.locator("[aria-current]").boundingBox(); return r ? r.x >= 0 && r.x + r.width <= 390 : false; }).toBe(true);
  // Chờ trang hydrate (thanh đã nghe sự kiện cuộn) — mục lục cụm là client, xuất hiện ô lọc tương tác được.
  await expect(page.getByTestId("cum-tim")).toBeEditable();
  const cuon = async (y: number) => { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); };
  for (const y of [400, 800, 1600]) await cuon(y);
  await expect(tm).toHaveAttribute("data-an", "1");
  await expect.poll(tmH).toBe("0px");
  for (const y of [1400, 1200]) await cuon(y);                         // cuộn lên, vẫn xa đầu trang
  await expect(tm).toHaveAttribute("data-an", "0");
  await expect.poll(tmH).toBe("2.75rem");
  // Thanh đang ẩn mà bàn phím vào → hiện lại.
  for (const y of [2000, 2600]) await cuon(y);
  await expect(tm).toHaveAttribute("data-an", "1");
  await tm.locator("a").first().focus();
  await expect(tm).toHaveAttribute("data-an", "0");
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const y of [3000, 3600]) await cuon(y);
  await expect(tm).toHaveAttribute("data-an", "0");
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
});

test("mở thẳng link có #neo: tiêu đề nhóm nằm dưới menu + thanh mảng (không bị che)", async ({ page }) => {
  for (const w of [390, 1280]) {
    await page.setViewportSize({ width: w, height: 844 });
    await page.goto("/tu-vi/sao-o-cung#nhom-thai-duong");
    const h = page.locator("#nhom-thai-duong-h");
    await expect.poll(async () => { const a = await page.evaluate(() => scrollY); await page.waitForTimeout(150); return a === await page.evaluate(() => scrollY) && a > 0; }).toBe(true);
    const day = await page.evaluate(() => {
      const tm = [...document.querySelectorAll<HTMLElement>("[data-thanh-mang]")].find((e) => !e.closest("[hidden]"))!.getBoundingClientRect();
      return tm.bottom;
    });
    expect((await h.boundingBox())!.y, `rộng ${w}`).toBeGreaterThanOrEqual(day - 1);
  }
});

test("mục lục cụm 'Sao ở cung': 14 nhóm theo sao, lọc theo cung + gõ tên, bỏ lọc; HTML máy chủ đủ 168 link", async ({ page, request }) => {
  const html = await (await request.get("/tu-vi/sao-o-cung")).text();
  expect(new Set(html.match(/href="\/tu-vi\/sao-o-cung\/[a-z-]+"/g)).size).toBe(168);
  expect(html).toContain('id="nhom-thai-duong"');
  await page.goto("/tu-vi/sao-o-cung");
  const ds = page.getByTestId("danh-sach-cum");
  await expect(ds.locator("section")).toHaveCount(14);
  await expect(ds.getByRole("heading", { level: 2 }).first()).toContainText("Tử Vi");
  await ds.getByTestId("cum-chip-loc").filter({ hasText: /^Mệnh$/ }).click();
  await expect(ds.getByTestId("cum-dem")).toContainText("Đang hiện 14 trang");
  await expect(ds.locator("section li:visible")).toHaveCount(14);
  await ds.getByTestId("cum-tim").fill("thai duong");                 // gõ không dấu vẫn khớp
  await expect(ds.locator("section li:visible")).toHaveCount(1);
  await ds.getByRole("button", { name: "Bỏ lọc" }).click();
  await expect(ds.locator("section li:visible")).toHaveCount(168);
  await ds.getByTestId("cum-tim").fill("không có sao này");
  await expect(ds).toContainText("Không có trang nào khớp");
  await ds.getByTestId("cum-tim").fill("");
  await ds.getByTestId("cum-chip-nhom").filter({ hasText: "Thái Dương" }).click();
  await expect(page).toHaveURL(/#nhom-thai-duong$/);
});

test("mục lục 64 quẻ theo quái trên; cặp số lọc 'Có số 7' ra đủ 9 cặp", async ({ page }) => {
  await page.goto("/kinh-dich/que");
  await expect(page.getByTestId("danh-sach-cum").locator("section")).toHaveCount(8);
  await expect(page.locator("#nhom-thien li:visible")).toHaveCount(8);
  await page.goto("/hop-doi/cap-so");
  const ds = page.getByTestId("danh-sach-cum");
  await ds.getByTestId("cum-chip-loc").filter({ hasText: /^Số 7$/ }).click();
  await expect(ds.locator("section li:visible")).toHaveCount(9);
});

test("hub Huyền học: thẻ mảng đủ mọi cụm (không cắt còn 4)", async ({ page }) => {
  await page.goto("/huyen-hoc");
  const ts = page.getByTestId("the-mang-than_so");
  for (const h of ["/than-so/no-nghiep", "/than-so/so-kep"]) await expect(ts.locator(`a[href="${h}"]`)).toHaveCount(1);
  await expect(page.getByTestId("the-mang-tu_vi").locator('a[href="/tu-vi/la-so-mau"]')).toHaveCount(1);
});

test("menu đầu trang: bảng Huyền học có 3 cụm mới", async ({ page }) => {
  await page.goto("/");
  await choHydrate(page, '[data-testid="menu-dau-trang"] button');
  await page.getByTestId("menu-dau-trang").getByRole("button", { name: /Huyền học/ }).click();
  const menu = page.getByTestId("menu-dau-trang");
  for (const t of ["Sao ở từng cung Tử vi", "64 quẻ Kinh Dịch", "Sinh năm nào mệnh gì"]) await expect(menu.getByRole("link", { name: new RegExp(t) })).toBeVisible();
  await expect(menu.getByRole("link", { name: /Tuổi xông đất/ })).toHaveCount(0);
});

test("xem ngày tốt: lối vào ngày tốt theo việc tháng này + tháng sau (12 link, có số ngày)", async ({ page }) => {
  await page.goto("/xem-ngay-tot");
  const k = page.getByTestId("ngay-tot-theo-viec");
  await expect(k.getByRole("listitem")).toHaveCount(12);
  await expect(k).toContainText(/\d+ ngày tốt/);                       // số do engine đếm đã điền
  // tháng có ngày tốt = link; tháng 0 ngày (trang noindex) = chữ thường, không link
  const lk = await k.getByRole("link").count(), khong = await k.getByText("chưa có ngày đủ tốt").count();
  expect(lk + khong).toBe(12);
  await expect(k.getByRole("link").first()).toHaveAttribute("href", /^\/xem-ngay-tot\/[a-z-]+-thang-\d{1,2}-\d{4}$/);
});

test("lịch âm năm: breadcrumb có link về mục lục /lich-am", async ({ page }) => {
  await page.goto("/lich-am/2027");
  expect(await breadcrumb(page)).toEqual(["Trang chủ", "Lịch âm", "Lịch âm 2027"]);
  await expect(page.getByTestId("duong-dan").getByRole("link", { name: "Lịch âm" })).toHaveAttribute("href", "/lich-am");
  expect(ldBreadcrumb(await page.content())).toEqual(["Trang chủ", "Lịch âm", "Lịch âm 2027"]);
});

test("Tử vi: lớp hạn + trường phái trong 'Hiển thị'; điện thoại hàng điều khiển ≤ 2 hàng", async ({ page }) => {
  await napHoSo(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tu-vi");
  const mo = page.getByTestId("tv-hien-thi-mo");
  await expect(mo).toBeVisible();
  await expect(page.getByRole("button", { name: "Lớp đại hạn" })).toHaveCount(0);
  const hang = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="tv-hien-thi-mo"]')!.parentElement!;
    // số hàng = số cụm tâm dọc cách nhau > 12 px (nút cao thấp khác nhau trong cùng một hàng)
    const tam = [...el.children].map((c) => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; }).sort((a, b) => a - b);
    return tam.filter((y, i) => i === 0 || y - tam[i - 1]! > 12).length;
  });
  expect(hang).toBeLessThanOrEqual(2);
  await mo.click();
  await expect(mo).toHaveAttribute("aria-expanded", "true");
  const dh = page.getByRole("button", { name: "Lớp đại hạn" });
  await expect(dh).toHaveAttribute("aria-pressed", "false");
  await dh.click();
  await expect(dh).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("truong-phai")).toBeVisible();
  await page.getByTestId("truong-phai-mo").click();                    // "Thu gọn" trong khung trường phái đóng cả bảng
  await expect(page.getByTestId("tv-hien-thi")).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(mo).toContainText("Đại hạn + lưu niên");
});
