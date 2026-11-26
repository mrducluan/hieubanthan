// TV-BD1 — "Bản đồ 12 cung" Tử vi tương tác: engine THẬT dựng 12 cung + tam phương tứ chính + đường bay tứ hoá +
// chuỗi chuyển Kỵ 2 chặng + dòng thời gian 0–90 tuổi; web chỉ vẽ.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

const LA_SO = { birth_date: "1990-05-17", birth_time: "12:30", gender: "nam", noi_sinh: "ha-noi" };
const VIET_RX = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: false, gia: 10 } }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => r.fulfill({ json: {} }));
  await napHoSo(page);
});

test("12 cung bấm được, tam phương tứ chính sáng, bảng 4 lớp, Esc đóng", async ({ page, request }) => {
  const bd = await (await request.post("/api/tuvi/ban-do", { data: { la_so: LA_SO } })).json();
  expect(bd.phien_ban).toBe("tuvi_ban_do_1");
  expect(bd.o).toHaveLength(12);

  await page.goto("/tu-vi");
  const khoi = page.getByTestId("ban-do-tu-vi");
  await expect(khoi).toBeVisible();
  await expect(khoi.getByTestId("bd-tam-phuong")).toBeVisible();

  await khoi.getByTestId("bd-o-quan_loc").click();
  const bang = page.getByTestId("bd-bang-o");
  await expect(bang).toBeVisible();
  await expect(bang).toContainText("Vì sao nói vậy");
  await page.keyboard.press("Escape");
  await expect(bang).toHaveCount(0);

  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
  const ev = sk.filter((x) => String(x.kind).startsWith("ban_do"));
  expect(ev.length).toBeGreaterThan(0);
  expect(JSON.stringify(ev)).not.toMatch(/19\d\d|20\d\d/);
});

test("mạng đường bay tứ hoá & chuỗi chuyển Kỵ 2 chặng (① → ②) chỉ gọi ty-le khi mở thẻ chuỗi", async ({ page, request }) => {
  const luotTyLe: string[] = [];
  await page.route("**/api/kiem-chung/ty-le**", (r) => {
    luotTyLe.push(r.request().url());
    return r.fulfill({ json: { ty_le: {} } });
  });
  const bd = await (await request.post("/api/tuvi/ban-do", { data: { la_so: LA_SO } })).json();
  expect(bd.duong_bay.chuoi_chuyen_ky.length).toBeGreaterThan(0);
  expect(bd.duong_bay.chuoi_chuyen_ky[0].ma_mau).toMatch(/^ds\.duong_bay\.(kck|lck)\.[a-z_]+\+[a-z_]+\+[a-z_]+$/);

  await page.goto("/tu-vi");
  const khoi = page.getByTestId("ban-do-tu-vi");
  await expect(khoi).toBeVisible();
  await expect(page.getByTestId("luan-giai-toan-bo")).toBeVisible();
  // Khi mới mở trang (tab Bánh xe 12 cung), chỉ có đúng 1 lượt gọi ty-le của BaoCaoDoiSong, chưa có mã chuỗi 2 chặng kck/lck
  expect(luotTyLe.some((u) => /ds\.duong_bay\.(kck|lck)\./.test(decodeURIComponent(u)))).toBe(false);
  expect(new Set(luotTyLe).size).toBe(1);

  await khoi.getByTestId("bd-che-duong_bay").click();
  await expect(khoi.getByTestId("bd-bo-loc-bay")).toBeVisible();

  await khoi.getByTestId("bd-loc-chuoi").click();
  await expect(khoi.getByTestId("bd-ds-chuoi")).toBeVisible();
  await khoi.getByTestId("bd-the-chuoi-0").click();
  await expect(page.getByTestId("bd-chuoi-3-tram")).toBeVisible();
  await expect.poll(() => luotTyLe.some((u) => /ds\.duong_bay\.(kck|lck)\./.test(decodeURIComponent(u)))).toBe(true);
});

test("kim năm & khoá SAO-2: năm nay mở lời khuyên, năm sau mang khoa=true không lộ nen_tranh", async ({ page, request }) => {
  const bd = await (await request.post("/api/tuvi/ban-do", { data: { la_so: LA_SO } })).json();
  const ds = bd.thoi_gian.nam as { nam: number; nhan_muc?: string; nen_tranh?: string; khoa?: boolean }[];
  const nam0 = bd.thoi_gian.nam_xem as number;
  const sau = ds.find((n) => n.nam === nam0 + 1)!;
  expect(sau.khoa).toBe(true);
  expect(sau.nen_tranh).toBeUndefined();

  await page.goto("/tu-vi");
  const khoi = page.getByTestId("ban-do-tu-vi");
  const kim = khoi.getByTestId("bd-kim");
  await expect(kim).toHaveAttribute("aria-valuenow", String(nam0));
  await expect(khoi.getByTestId("bd-nam-khoa")).toHaveCount(0);

  await khoi.getByTestId("bd-nam-truot").fill(String(sau.nam));
  await expect(khoi.getByTestId("bd-nam-khoa")).toContainText(String(sau.nam));
  await expect(khoi.getByTestId("bd-nen-tranh")).toHaveCount(0);
});

test("điện thoại 360px không tràn ngang & bản tiếng Anh /en/zi-wei-dou-shu sạch chữ Việt", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/tu-vi");
  const khoi = page.getByTestId("ban-do-tu-vi");
  await expect(khoi).toBeVisible();
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(tran).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/en/zi-wei-dou-shu");
  const khoiEn = page.getByTestId("ban-do-tu-vi");
  await expect(khoiEn).toBeVisible();
  const textEn = await khoiEn.innerText();
  expect(textEn).not.toMatch(VIET_RX);
});
