// Phong thuỷ (HH-4): hồ sơ → mệnh quái + la bàn → hỏi.
import { test, expect } from "@playwright/test";
import { hoi, napHoSo } from "./_hoso";

test("mệnh quái + la bàn + hướng hợp tuổi", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");
  await expect(page.getByTestId("menh-quai")).toContainText("Khảm");
  await expect(page.getByRole("img", { name: /La bàn 8 hướng/ })).toBeVisible();
  const ans = await hoi(page, "Nhà hướng Tây Nam có hợp với tôi không?");
  await expect(ans).toContainText("Mệnh quái (cung phi) của bạn: Khảm");
  await expect(ans).toContainText("Tuyệt Mệnh");
});

test("bố trí dân gian ghi rõ nguồn", async ({ page }) => {
  await page.goto("/phong-thuy");
  const ans = await hoi(page, "Gương đối diện giường có sao không?");
  await expect(ans).toContainText("quan niệm dân gian");
});

test("Huyền Không: năm 2008, toạ Tý → Song tinh đáo hướng, Thất tinh chân đả kiếp", async ({ page }) => {
  await page.goto("/phong-thuy");
  await page.getByLabel("Năm xây hoặc nhập trạch").fill("2008");
  await page.getByLabel("Toạ sơn (lưng nhà)").selectOption("Tý");
  await page.getByRole("button", { name: "Lập bàn" }).click();
  const ban = page.getByTestId("ban-huyen-khong");
  await expect(ban).toContainText("Song tinh đáo hướng");
  await expect(ban).toContainText("Thất tinh chân đả kiếp");
  await expect(ban.getByRole("cell", { name: /^Ly Nam: sơn tinh 8, hướng tinh 8, vận tinh 3/ })).toBeVisible();
});

test("Huyền Không: nhập độ la bàn sát ranh giới → cảnh báo kiêm hướng; năm sai → báo rõ, không gửi", async ({ page }) => {
  await page.goto("/phong-thuy");
  await page.getByLabel("Năm xây hoặc nhập trạch").fill("1800");
  await page.getByRole("button", { name: "Lập bàn" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "1864–2150" })).toBeVisible();
  await page.getByLabel("Năm xây hoặc nhập trạch").fill("2008");
  await page.getByLabel("Nhập độ la bàn").check();
  await page.getByLabel("Độ la bàn của toạ").fill("350");
  await page.getByRole("button", { name: "Lập bàn" }).click();
  const ban = page.getByTestId("ban-huyen-khong");
  await expect(ban).toContainText("kiêm hướng");
  await expect(ban).toContainText("tính từ Lập xuân");
  await expect(ban.getByRole("row")).toHaveCount(3);
});
