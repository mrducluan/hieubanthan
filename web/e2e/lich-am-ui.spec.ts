// LA-UI + CTA-NAM (2026-11-16) — component lịch năm âm (tháng / cả năm, thẻ ngày, tra theo ngày dương) trên /lich-am,
// /lich-am/{năm}, /nam/{năm} và khối mời "xem theo ngày giờ sinh" cuối các trang năm. Dữ kiện đối chiếu engine:
// Tết Đinh Mùi 06/02/2027 (thứ Bảy), Vũ thuỷ 19/02/2027 = 14 tháng Giêng, Giỗ Tổ 10/3 = 16/04/2027.
import { test, expect } from "@playwright/test";
import { napHoSo, HO_SO_MAU } from "./_hoso";

test("/lich-am/2027: lịch tháng âm trong HTML máy chủ, chọn ngày, cả năm, tra ngày dương", async ({ page, request }) => {
  const html = await (await request.get("/lich-am/2027")).text();
  expect(html).toContain("Lịch âm năm Đinh Mùi 2027");
  expect(html).toContain('data-ngay="2027-02-06"');           // tháng Giêng dựng sẵn (hôm nay ngoài năm 2027 → mở Tết)
  await page.goto("/lich-am/2027");
  const lich = page.getByTestId("lich-am-nam");
  // lịch đứng ngay sau "Trả lời nhanh", trước bảng tháng
  expect(await page.evaluate(() => {
    const a = document.querySelector('[aria-label="Trả lời nhanh"]')!, b = document.querySelector('[data-testid="lich-am-nam"]')!, c = document.getElementById("bang-thang")!;
    return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) && Boolean(b.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  await expect(lich.getByTestId("lich-am-luoi").locator("button")).toHaveCount(30);
  const the = lich.getByTestId("lich-am-the-ngay");
  await expect(the).toContainText("Thứ Bảy, 06/02/2027");
  await expect(the).toContainText("Tết Nguyên đán");
  await lich.locator('[data-ngay="2027-02-19"]').click();
  await expect(the).toContainText("Ngày 14 tháng Giêng");
  await expect(the).toContainText("Vũ thuỷ");
  await expect(lich.getByTestId("lich-am-mo-ngay")).toHaveAttribute("href", "/xem-ngay-tot/2027-02-19");
  // cả năm: 12 thẻ tháng, bấm tháng 3 → mở tờ lịch tháng 3 (thiếu, 29 ngày)
  await lich.getByTestId("lich-am-che-nam").click();
  await expect(lich.getByTestId("lich-am-the-thang")).toHaveCount(12);
  await lich.getByTestId("lich-am-the-thang").nth(2).click();
  await expect(lich.getByTestId("lich-am-luoi").locator("button")).toHaveCount(29);
  await expect(lich.locator("h3")).toContainText("Tháng 3");
  // tra theo ngày dương: 16/04/2027 = Giỗ Tổ 10/3
  await lich.getByTestId("lich-am-tra").fill("2027-04-16");
  await expect(the).toContainText("Mùng 10 tháng 3");
  await expect(the).toContainText("Giỗ Tổ Hùng Vương");
  await expect(lich.getByTestId("lich-am-hom-nay")).toHaveCount(0);   // hôm nay không thuộc năm âm 2027
});

test("/lich-am (năm đang đi) có nút Hôm nay; /nam/2027 có lịch; 390px không cuộn ngang, ô ngày ≥ 44px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/lich-am");
  const lich = page.getByTestId("lich-am-nam");
  await expect(lich.getByTestId("lich-am-hom-nay")).toBeVisible();
  await expect(lich.locator('[aria-current="date"]')).toHaveCount(1);
  await expect(lich.getByTestId("lich-am-the-ngay")).toContainText("Hôm nay");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  const o = await lich.getByTestId("lich-am-luoi").locator("button").first().boundingBox();
  expect(o!.width).toBeGreaterThanOrEqual(44);
  expect(o!.height).toBeGreaterThanOrEqual(44);
  await page.goto("/nam/2027");
  await expect(page.getByTestId("lich-am-nam")).toContainText("Lịch âm năm Đinh Mùi 2027");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test("CTA-NAM: cuối trang năm có khối mời — chưa hồ sơ thì có form, có hồ sơ thì hiện lối đi + đo lượt bấm", async ({ page }) => {
  for (const [duong, den] of [["/nam/2027/sinh-con", "/hop-doi"], ["/nam/2027/cuoi-hoi", "/xem-ngay-tot"], ["/nam/2027", "/bat-tu"], ["/lich-am/2027", "/thoi-gian-toi?nam=2027"]] as const) {
    await page.goto(duong);
    const k = page.getByTestId("moi-xem-rieng");
    await expect(k.locator("form")).toBeVisible();
    await expect(k.locator('a[href="/tu-vi"]')).toBeVisible();
    await expect(k.locator(`a[href="${den}"]`)).toBeVisible();
    expect(await k.innerText()).not.toMatch(/giải hạn|vật phẩm|xui|đại hung/i);
  }
  await napHoSo(page, HO_SO_MAU);
  await page.goto("/nam/2027/tuoi-1990");
  const k = page.getByTestId("moi-xem-rieng-co-ho-so");
  await expect(k).toBeVisible();
  await expect(page.getByTestId("moi-xem-rieng").locator("form")).toHaveCount(0);
  await k.locator('a[href="/nhan-tuong"]').click();
  await page.waitForURL("**/nhan-tuong");
});
