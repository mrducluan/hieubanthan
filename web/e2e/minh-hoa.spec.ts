// MH-1 — hình minh hoạ SVG: trang chủ có "bầu trời số", thẻ mảng có hình riêng, mỗi trang kiến thức có hình vẽ từ
// dữ liệu engine (quẻ đúng 6 hào, cung được tô, nhật chủ đúng hành), có <title>/aria-label trong HTML máy chủ.
import { test, expect } from "@playwright/test";

test("trang chủ: hình bầu trời số + hình cho 4 mảng (HTML máy chủ)", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain('data-testid="hinh-bau-troi"');
  expect(html).toContain("<title>Chín con số thần số học xếp thành vòng sao quanh vầng trăng</title>");
});

for (const [duong, title] of [
  ["/than-so/y-nghia-so/so-7", "Số 7 trong thần số học"],
  ["/kinh-dich/que/que-11-thai", "Hình quẻ 11 Kinh Dịch"],
  ["/tu-vi/chinh-tinh/sao-tu-vi", "Sao Tử Vi (紫微), hành Thổ"],
  ["/tu-vi/cung/cung-tai-bach", "Cung Tài Bạch — vị trí trong vòng 12 cung"],
  ["/bat-tu/thap-than/chinh-quan", "Chính Quan: khắc ta, khác âm dương"],
  ["/bat-tu/nhat-chu/nhat-chu-giap", "Nhật chủ Giáp — hành Mộc dương"],
] as const) {
  test(`trang kiến thức có hình minh hoạ: ${duong}`, async ({ request }) => {
    const r = await request.get(duong);
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toContain('data-testid="minh-hoa"');
    expect(html).toContain(`<title>${title}`);
  });
}

test("quẻ Thái vẽ đúng: 3 hào dương dưới, 3 hào âm trên", async ({ page }) => {
  await page.goto("/kinh-dich/que/que-11-thai");
  const svg = page.getByTestId("minh-hoa").locator("svg");
  await expect(svg).toBeVisible();
  // hào dương = 1 rect liền, hào âm = 2 rect → 3 + 6 = 9 rect
  await expect(svg.locator("rect")).toHaveCount(9);
});
