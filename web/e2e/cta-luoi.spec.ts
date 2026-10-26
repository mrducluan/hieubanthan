// CTA-2 — khối thẻ cuối trang không còn ô trống: lưới 3 cột kín hàng nhờ thẻ bù lối đi tiếp (lib/the-lap.ts) hoặc số cột
// theo số mục (lib/luoi.ts). Đo bằng TOẠ ĐỘ thật trên trình duyệt (máy tính 1280 + máy tính bảng 768), không chỉ đếm thẻ.
import { test, expect, type Locator, type Page } from "@playwright/test";
import { lopCot, lopOCuoi, soCanLap } from "../lib/luoi";
import { theLap, theLapBlog } from "../lib/the-lap";
import { dsCumTru } from "../lib/kien-thuc";

test("soCanLap / lopOCuoi / lopCot: số ô bù và số cột", () => {
  expect([0, 1, 2, 3, 4, 5, 6].map((n) => soCanLap(n))).toEqual([0, 2, 1, 0, 2, 1, 0]);
  expect(lopOCuoi(2, 3)).toBe("sm:col-span-2 lg:col-span-1");
  expect(lopOCuoi(1, 3)).toBe("");
  expect(lopOCuoi(3, 4)).toBe("");
  expect(lopCot(2)).toBe("sm:grid-cols-2");
  expect(lopCot(3)).toBe("sm:grid-cols-3");
  expect(lopCot(4, 4)).toBe("grid-cols-2 lg:grid-cols-4");
  expect(lopCot(3, 4)).toBe("grid-cols-1 sm:grid-cols-3");
});

test("theLap: đủ số, không trùng, không lặp link trang đã hiện, mọi link trong site", () => {
  for (const tru of ["/than-so", "/hop-doi", "/tu-vi", "/bat-tu", "/kinh-dich", "/phong-thuy"]) {
    const cum = dsCumTru(tru).map((c) => c.duong);
    const lap = theLap(soCanLap(cum.length), { tru, boQua: [tru, ...cum] });
    expect(lap.length, tru).toBe(soCanLap(cum.length));
    expect((cum.length + lap.length) % 3, tru).toBe(0);
    const goc = lap.map((t) => t.duong.split("#")[0]);
    expect(new Set(goc).size, tru).toBe(goc.length);
    for (const t of lap) {
      expect(t.duong, tru).toMatch(/^\/[a-z0-9-/#]*$/);
      expect([tru, ...cum], tru).not.toContain(t.duong.split("#")[0]);
    }
  }
  // Blog: không bài khác nào → vẫn 3 thẻ (khối "Đọc tiếp" không rỗng); đủ 3 bài → không bù.
  expect(theLapBlog(0, "kinh_dich", ["/kinh-dich/que"])).toHaveLength(3);
  expect(theLapBlog(3, "than_so", [])).toHaveLength(0);
  expect(theLapBlog(1, "than_so", ["/than-so/y-nghia-so"]).map((t) => t.duong)).not.toContain("/than-so/y-nghia-so");
});

/** Mọi hàng của lưới kín: số mục mỗi hàng (theo toạ độ top) bằng nhau, và mục cuối chạm mép phải như mục cuối hàng đầu. */
async function kiemKinHang(luoi: Locator, ten: string) {
  const o = await luoi.evaluate((el) => [...el.children].map((c) => { const r = c.getBoundingClientRect(); return { top: Math.round(r.top), right: Math.round(r.right) }; }));
  expect(o.length, ten).toBeGreaterThan(0);
  const hang = new Map<number, number[]>();
  for (const x of o) hang.set(x.top, [...(hang.get(x.top) ?? []), x.right]);
  const ds = [...hang.values()];
  const mepPhai = Math.max(...ds[0]!);
  for (const h of ds) expect(Math.abs(Math.max(...h) - mepPhai), `${ten}: hàng có ô trống`).toBeLessThanOrEqual(2);
}

async function moTrang(page: Page, duong: string) {
  await page.goto(duong);
  await page.waitForLoadState("domcontentloaded");
}

for (const w of [1280, 768]) {
  test(`${w}px — "Kiến thức {mảng}" ở 6 trang công cụ kín hàng, thẻ bù có chip và link sống`, async ({ page, request }) => {
    await page.setViewportSize({ width: w, height: 900 });
    for (const tru of ["/than-so", "/hop-doi", "/tu-vi", "/bat-tu", "/kinh-dich", "/phong-thuy"]) {
      await moTrang(page, tru);
      const k = page.getByTestId("cum-kien-thuc-tru");
      await expect(k, tru).toBeVisible();
      await kiemKinHang(k.locator("ul"), tru);
      const lap = k.locator("[data-the-lap]");
      expect(await lap.count(), tru).toBe(soCanLap(dsCumTru(tru).length));
      for (const href of await lap.locator("a").evaluateAll((a) => a.map((x) => x.getAttribute("href")!))) {
        const r = await request.get(href.split("#")[0]!, { maxRedirects: 0 });
        expect(r.status(), `${tru} → ${href}`).toBe(200);
      }
    }
  });
}

test("Hợp đôi + Kinh Dịch (1 cụm) có lối đi tiếp đúng chủ đề, không phải ô trống", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await moTrang(page, "/hop-doi");
  const hd = page.getByTestId("cum-kien-thuc-tru");
  await expect(hd.locator('[data-the-lap="/than-so/tinh-yeu"]')).toContainText("Kiến thức");
  await expect(hd.locator('[data-the-lap="/tu-vi#hop-tham"]')).toContainText("Xem lá số 2 người");
  await moTrang(page, "/kinh-dich");
  const kd = page.getByTestId("cum-kien-thuc-tru");
  await expect(kd.locator('[data-the-lap="/hom-nay#que-ngay"]')).toContainText("Quẻ đầu ngày");
  await expect(kd.locator("[data-the-lap]")).toHaveCount(2);
});

test("thư viện /kien-thuc: mỗi silo kín hàng 3 cột; silo ít cụm mời mở công cụ của mảng", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await moTrang(page, "/kien-thuc");
  const sec = page.locator("main section[aria-labelledby^='silo-']");
  await expect(sec).toHaveCount(6);
  for (let i = 0; i < 6; i++) await kiemKinHang(sec.nth(i).locator("div.grid"), `silo ${i}`);
  await expect(page.locator('section[aria-labelledby="silo-kinh-dich"] [data-the-lap="/kinh-dich"]')).toContainText("Gieo một quẻ");
  await expect(page.locator('section[aria-labelledby="silo-hop-doi"] [data-the-lap="/hop-doi"]')).toContainText("Xem hợp đôi");
});

test("blog NotFair: 'Đọc tiếp' kín hàng trên máy tính", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await moTrang(page, "/blog/phong-thuy-nha-o-cho-nguoi-moi");
  await kiemKinHang(page.getByTestId("doc-tiep").locator("ul"), "doc-tiep");
});

// ---- CTA-2: cấu hình "Lối đi tiếp" từ CMS + đo / tự xếp theo lượt bấm (hàm thuần) ----
import { readFileSync } from "node:fs";
import { cauHinhTuCms, CAU_HINH_MAC_DINH, locThe } from "../lib/loi-di-tiep";
import { xepTheoTiLe } from "../lib/the-lap";
import { tinhLoiDi } from "../lib/so-lieu-ngoai";
import { tinhTiLe } from "../lib/the-lap-cms";

test("bộ thẻ mặc định của web trùng HỆT bản mặc định trong CMS (global Lối đi tiếp)", () => {
  const web = JSON.parse(readFileSync("lib/loi-di-tiep-mac-dinh.json", "utf8"));
  const cms = JSON.parse(readFileSync("../cms/src/globals/loi-di-tiep-mac-dinh.json", "utf8"));
  expect(web).toEqual(cms);
  // Mọi thẻ mặc định qua được bộ lọc (không thẻ nào bị rơi âm thầm).
  for (const n of web.nhom) for (const t of n.the) expect(locThe(t), t.duong).not.toBeNull();
});

test("cauHinhTuCms: lọc link ngoài / chữ thừa; CMS trống → mặc định; nhóm có trong CMS thay hẳn nhóm đó", () => {
  expect(cauHinhTuCms(null)).toBe(CAU_HINH_MAC_DINH);
  expect(cauHinhTuCms({ nhom: [] }).nhom).toEqual(CAU_HINH_MAC_DINH.nhom);
  const c = cauHinhTuCms({ bat: false, tu_xep: true, nhom: [{ tru: "/tu-vi", the: [
    { duong: "//evil.example", ten: "x", mo_ta: "y" }, { duong: "javascript:alert(1)", ten: "x", mo_ta: "y" },
    { duong: "/hom-nay", ten: "  Hôm   nay ", mo_ta: "m".repeat(400), nhan: "la", hinh: "la" },
  ] }, { tru: "https://x", the: [] }] });
  expect(c.bat).toBe(false);
  expect(c.tu_xep).toBe(true);
  expect(Object.keys(c.nhom)).toEqual(["/tu-vi"]);
  expect(c.nhom["/tu-vi"]).toEqual([{ duong: "/hom-nay", ten: "Hôm nay", mo_ta: "m".repeat(180), nhan: "kien_thuc", hinh: "than-so" }]);
  expect(theLap(3, { cauHinh: c })).toEqual([]);   // tắt thẻ bù
});

test("tự xếp theo lượt bấm: chỉ thẻ đủ mẫu, làm mượt, giữ thứ tự biên tập khi chưa có số", () => {
  const tl = tinhTiLe([["/a", 100, 2], ["/b", 100, 20], ["/c", 10, 9], ["khong-phai-duong", 500, 400]]);
  expect(Object.keys(tl).sort()).toEqual(["/a", "/b"]);           // /c chưa đủ 30 lượt thấy
  expect(xepTheoTiLe([{ duong: "/c" }, { duong: "/a" }, { duong: "/b" }], tl).map((t) => t.duong)).toEqual(["/c", "/b", "/a"]);
  const c = cauHinhTuCms({ tu_xep: true, nhom: [{ tru: "chung", the: [
    { duong: "/a", ten: "A", mo_ta: "a" }, { duong: "/b", ten: "B", mo_ta: "b" }] }] });
  expect(theLap(2, { cauHinh: c, tiLe: tl }).map((t) => t.duong)).toEqual(["/b", "/a"]);
  expect(theLap(2, { cauHinh: { ...c, tu_xep: false }, tiLe: tl }).map((t) => t.duong)).toEqual(["/a", "/b"]);
});

test("tinhLoiDi: gom theo khối (thấy / bấm thật / bấm bù) và theo thẻ bù, thẻ đủ mẫu xếp trước", () => {
  const r = tinhLoiDi(
    [["doc_tiep", 0, "end_cta_viewed", 200], ["doc_tiep", 1, "end_cta_viewed", 380], ["doc_tiep", 0, "end_cta_clicked", 20],
     ["doc_tiep", 1, "end_cta_clicked", 9], ["", 0, "end_cta_viewed", 3]],
    [["/a", 100, 1], ["/b", 120, 8], ["/moi", 5, 3]]);
  expect(r.khoi[0]).toEqual({ khoi: "doc_tiep", thay: 200, bam_that: 20, bam_lap: 9 });
  expect(r.the.map((t) => t.den)).toEqual(["/b", "/a", "/moi"]);
  expect(r.the[2]).toMatchObject({ du_mau: false, ti_le: 0.6 });
});
