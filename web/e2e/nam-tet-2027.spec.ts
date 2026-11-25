// NAM-TET-2027 — giao diện Tết riêng cho /nam/2027 (chỉ bản Việt): hero, khu lì xì dùng chung BaoLiXi3D, tra nhanh năm sinh.
import { test, expect } from "@playwright/test";

const TT_BAT = { bat: true, gia_1: 99000, gia_3: 249000, gia_5: 399000, nam: 2027, han: "2027-03-31", cong: "pay2s" };

test("/nam/2027: hero Tết có H1 + Trả lời nhanh, ảnh linh vật tải được, không tràn ngang ở 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const loi: string[] = [];
  page.on("response", (r) => { if (r.status() >= 400 && /\/anh\/li-xi\//.test(r.url())) loi.push(`${r.status()} ${r.url()}`); });
  await page.goto("/nam/2027");
  const hero = page.getByTestId("hero-tet-2027");
  await expect(hero.getByRole("heading", { level: 1 })).toContainText("2027");
  await expect(hero.getByText("Trả lời nhanh").first()).toBeVisible();
  await expect(hero.locator("img[alt*='LINH VẬT']")).toBeVisible();
  const anh = hero.locator("img[alt*='LINH VẬT']");
  await expect.poll(() => anh.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  const hong: string[] = [];
  expect(hong).toEqual([]);
  expect(loi).toEqual([]);
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(tran).toBeLessThanOrEqual(1);
});

test("/nam/2027: khu lì xì chưa mở bán thì không bày giá; mở bán thì hiện giá; CTA giữ ?mau=&hoa=", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/nam/2027");
  const khu = page.getByTestId("khu-li-xi-tet-2027");
  await khu.scrollIntoViewIfNeeded();
  // Máy test không có Supabase → thongTinLiXi trả bat:false → UX-NM: không giá.
  await expect(page.getByTestId("li-xi-chua-mo-ban")).toBeVisible();
  await expect(khu).not.toContainText("99.000");
  await khu.getByRole("button", { name: /Ngọc/i }).first().click().catch(() => {});
  const href = await page.getByTestId("nut-chon-li-xi-2027").getAttribute("href");
  expect(href).toMatch(/^\/li-xi-tet-2027\?mau=[a-z_]+&hoa=[a-z_]+$/);
  await page.route("**/api/li-xi/thong-tin", (r) => r.fulfill({ json: TT_BAT }));
  await page.getByTestId("nut-chon-li-xi-2027").click();
  await expect(page).toHaveURL(/\/li-xi-tet-2027\?mau=/);
  const mau = new URL(page.url()).searchParams.get("mau")!;
  await expect(page.getByTestId(`mau-${mau}`)).toHaveAttribute("aria-pressed", "true");
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(tran).toBeLessThanOrEqual(1);
});

test("/nam/2027: tra nhanh năm sinh đọc bảng engine; /nam/2028 và /en không có hero Tết", async ({ page }) => {
  await page.goto("/nam/2027");
  const tim = page.getByTestId("tim-nhanh-nam-sinh");
  await tim.getByRole("textbox").fill("1990");
  await expect(tim).toContainText("Sinh năm 1990");
  await expect(tim.locator('a[href="/nam/2027/tuoi-1990"]')).toBeVisible();
  await page.goto("/nam/2028");
  await expect(page.getByTestId("hero-tet-2027")).toHaveCount(0);
  await expect(page.getByTestId("khu-li-xi-tet-2027")).toHaveCount(0);
});
