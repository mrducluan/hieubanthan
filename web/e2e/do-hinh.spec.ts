// SX-C — lớp phủ đồ hình nhân tướng: ảnh khắc gỗ giữ nguyên, chấm chú giải bấm / chạm được, tắt được lớp phủ,
// danh sách chữ khắc có sẵn trong HTML máy chủ, không tràn ngang ở 390 px.
import { expect, test } from "@playwright/test";

test("đồ hình 12 cung: bấm một chấm hiện thẻ giải nghĩa, tắt lớp phủ thì hết chấm", async ({ page }) => {
  await page.goto("/nhan-tuong/do-hinh/muoi-hai-cung-ngu-quan");
  await expect(page.locator("h1")).toBeVisible();
  const nut = page.locator("[data-testid=do-hinh-diem][data-id=menh]");
  await nut.scrollIntoViewIfNeeded();
  const bb = (await nut.boundingBox())!;
  await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  const the = page.getByTestId("do-hinh-the");
  await expect(the).toContainText("命宮");
  await expect(the).toContainText("Mệnh");
  await page.getByTestId("do-hinh-ban-goc").click();
  await expect(page.locator("[data-testid=do-hinh-diem]")).toHaveCount(0);
  await expect(page.locator("img[src*='/anh/do-hinh/']")).toBeVisible();
});

test("danh sách chữ khắc nằm trong HTML máy chủ (đọc được không cần JS)", async ({ request }) => {
  const html = await (await request.get("/nhan-tuong/do-hinh/luu-nien-van-khi")).text();
  expect(html).toContain('data-testid="ds-diem-may-chu"');
  expect(html).toContain("天中");
  const muc = await (await request.get("/nhan-tuong/do-hinh")).text();
  expect(muc).toContain("/nhan-tuong/do-hinh/not-ruoi-nam");
});

test("điện thoại: phóng to rồi chạm trúng chấm nốt ruồi nằm sát nhau, không tràn ngang", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto("/nhan-tuong/do-hinh/not-ruoi-nam");
  await page.getByTestId("do-hinh-phong").click();
  for (const id of ["mat_p_trong", "mat_p_tren1"]) {
    const nut = page.locator(`[data-testid=do-hinh-diem][data-id=${id}]`);
    await nut.scrollIntoViewIfNeeded();
    const bb = (await nut.boundingBox())!;
    await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await expect(page.locator("[data-testid=do-hinh-diem][aria-pressed=true]")).toHaveAttribute("data-id", id);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await ctx.close();
});
