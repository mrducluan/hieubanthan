// SX-1 — "Sách xưa nói gì về lá số của bạn": engine chọn câu nguyên văn đã có trong kho tri thức ứng với lá số; web chỉ
// hiển thị. Lời Việt đứng trước, nguyên văn gập; hiện ngay cả khi "Lá số chi tiết" còn gập.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("Bát tự: khối sách xưa có câu về nhật chủ, mở được nguyên văn", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/bat-tu");
  const k = page.getByTestId("sach-xua");
  await expect(k.getByRole("heading", { name: "Sách xưa nói gì về lá số của bạn" })).toBeVisible();
  await expect(k).toContainText("Ngày sinh của bạn thuộc can Nhâm");
  await expect(k).toContainText("Sách ví Nhâm");
  await expect(page.getByTestId("tu-tru")).toHaveCount(0);                 // không cần mở lá số chi tiết
  await expect(k.getByTestId("sach-xua-han")).toHaveCount(0);
  await k.getByRole("button", { name: /Nguyên văn · Uyên Hải Tử Bình/ }).first().click();
  await expect(k.getByTestId("sach-xua-han")).toContainText("壬水");
  const n = await k.locator("ol > li").count();
  expect(n).toBeGreaterThanOrEqual(2);
  expect(n).toBeLessThanOrEqual(5);
});

test("Tử vi: khối sách xưa đứng sau cách cục", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const k = page.getByTestId("sach-xua");
  await expect(k).toBeVisible();
  await expect(k).toContainText(/Lá số của bạn có cách|Cung .+ của bạn có sao/);
  await k.getByRole("button", { name: /Nguyên văn/ }).first().click();
  await expect(k.getByTestId("sach-xua-han")).toBeVisible();
});

// SX-C — khối "Sách xưa ghi" (ba nhóm A / B / C đã nói giảm), gập theo nhóm; mở một nhóm thấy câu + chữ Hán + câu kết.
test("SX-C Tử vi: khối 'Sách xưa ghi gì về từng cung' gập sẵn, mở một cung thấy câu sách", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const k = page.getByTestId("sach-ghi");
  await expect(k).toBeVisible();
  await expect(k.getByRole("heading", { name: "Sách xưa ghi gì về từng cung của bạn" })).toBeVisible();
  await expect(k.locator("ol li")).toHaveCount(0);
  await k.getByTestId("sach-ghi-nhom").first().click();
  await expect(k.locator("ol li").first()).toContainText("Tử Vi Đẩu Số Toàn Thư");
  // SX-C3: câu kết "chỉ trích lại, không chịu trách nhiệm pháp lý"
  await expect(k).toContainText("không chịu trách nhiệm pháp lý");
  // nhóm C chỉ hiện phiên âm khi là câu trích sát nguyên văn (SX-C3)
  for (const li of await k.locator("li[data-nhom=C]").all()) {
    if (!/nguyên văn/.test(await li.innerText())) await expect(li.locator("span.italic")).toHaveCount(0);
  }
});

test("SX-C Bát tự + Phong thuỷ: khối sách xưa có ở lá số Bát tự và ở mệnh quái", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/bat-tu");
  await expect(page.getByTestId("sach-ghi").getByRole("heading", { name: "Sách xưa ghi gì về các sao và hành của bạn" })).toBeVisible();
  await page.goto("/phong-thuy");
  const pt = page.getByTestId("sach-ghi").first();
  await expect(pt).toContainText("Sách xưa dặn gì cho người cung");
  await pt.getByTestId("sach-ghi-nhom").first().click();
  await expect(pt.locator("ol li")).toHaveCount(9);
});
