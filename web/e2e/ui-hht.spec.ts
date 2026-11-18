// UI-HHT (chủ dự án 2026-11-18) — trang "hướng hợp tuổi": tra một chạm ở mục lục, la bàn sống có thứ hạng trên trang
// cung, hướng kiêng của năm, chín điều sách dặn (chỉ nhóm A/B), vợ chồng khác nhóm, tra hướng chung hai người.
import { test, expect } from "@playwright/test";

test("mục lục: chọn năm sinh + giới tính → la bàn của chính người đó, có thứ hạng và link trang cung", async ({ page }) => {
  await page.goto("/phong-thuy/huong-hop-tuoi");
  const tra = page.getByTestId("tra-huong-tuoi");
  await tra.getByTestId("tra-nam").selectOption("1990");
  const kq = tra.getByTestId("tra-ket-qua");
  await expect(kq).toContainText("cung Khảm");
  await expect(kq).toContainText("Hướng tốt nhất Đông Nam");
  await expect(kq.getByTestId("la-ban-chi-tiet")).toContainText("Hướng tốt hạng 1");
  await expect(kq.locator('a[href="/phong-thuy/huong-hop-tuoi/cung-kham-bac#nam-1990"]')).toBeVisible();
  await expect(kq.getByTestId("ky-mon-huong-hop")).toContainText("các hướng tốt của bạn thuận vào giờ nào");
  // đổi giới tính → la bàn vẽ lại theo cung mới, hướng chọn là hạng 1 của cung mới
  await tra.locator('[role=radio]:has-text("Nữ")').click();
  await expect(kq).toContainText("cung Cấn");
  await expect(kq.getByTestId("la-ban-chi-tiet")).toContainText("Tây Nam");
  // sinh trước Lập xuân → tính theo năm trước
  await tra.getByRole("checkbox").check();
  await expect(kq).toContainText("sinh năm 1989");
});

test("mục lục: hướng chung hai người do engine tính — khác nhóm có lệ sách xưa", async ({ page }) => {
  await page.goto("/phong-thuy/huong-hop-tuoi");
  const hn = page.getByTestId("hai-nguoi-huong");
  await hn.locator("input").nth(0).fill("1990");
  await hn.locator("input").nth(1).fill("1990");
  await hn.getByTestId("hai-nguoi-xem").click();
  const kq = hn.getByTestId("hai-nguoi-ket-qua");
  await expect(kq).toContainText("cung Khảm");
  await expect(kq).toContainText("cung Cấn");
  await expect(kq).toContainText("không có hướng tốt chung");
  await expect(kq).toContainText("大抵夫婦");
  await expect(kq.locator("tbody tr")).toHaveCount(8);
});

test("trang cung Khảm: la bàn sống, hướng kiêng năm, chín điều chỉ nhóm A/B, vợ chồng khác nhóm — có trong HTML máy chủ", async ({ page, request }) => {
  const html = (await (await request.get("/phong-thuy/huong-hop-tuoi/cung-kham-bac")).text()).replace(/<!-- -->/g, "");
  expect(html).toContain('data-testid="la-ban-song"');
  expect(html).toMatch(/Năm \d{4}: hướng tốt nào của cung Khảm cần giữ yên\?/);
  expect(html).toContain("Những điều sách dặn người cung Khảm");
  expect(html).toContain("Vợ chồng khác nhóm với cung Khảm thì chọn hướng theo ai?");
  expect(html).toContain("337,5°");                                      // khoảng độ hướng Bắc trong mục gập
  expect(html).not.toContain("Ghi chép xưa");                             // nhóm C không lên trang công khai
  await page.goto("/phong-thuy/huong-hop-tuoi/cung-kham-bac");
  const lb = page.getByTestId("la-ban-song");
  await expect(lb.getByTestId("la-ban-chi-tiet")).toContainText("Đông Nam");   // mặc định hạng 1 (Sinh Khí)
  await lb.locator('button:has-text("Bắc")').first().click();
  await expect(lb.getByTestId("la-ban-chi-tiet")).toContainText("Phục Vị");
  await expect(lb.getByTestId("la-ban-chi-tiet")).toContainText("Nhâm, Tý, Quý");
  // UI-HHT × KM-3: giờ thuận hôm nay của 4 hướng tốt (Kỳ Môn chỉ đánh dấu, không đổi thứ hạng)
  await expect(page.getByTestId("ky-mon-huong-hop")).toContainText("4 hướng tốt của cung Khảm thuận vào giờ nào");
});
