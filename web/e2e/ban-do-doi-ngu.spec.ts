import { expect, test } from "@playwright/test";

// Rà soát 2026-11-20: engine trả muc_phoi_hop "bo_tro_tot", web từng lọc theo "bo_tro_on_dinh" → chip luôn 0 người.
test("Bản đồ đội ngũ mẫu: chip 'Bổ trợ ổn định' đếm đúng người và lọc ra danh sách", async ({ page }) => {
  await page.goto("/ban-do-doi-ngu");
  await page.getByRole("button", { name: /Xem thử đội ngũ mẫu/ }).click();
  const chip = page.getByRole("tab", { name: /^Bổ trợ ổn định \(\d+\)$/ });
  await expect(chip).toBeVisible({ timeout: 20_000 });
  const so = Number((await chip.textContent())?.match(/\((\d+)\)/)?.[1] ?? "0");
  expect(so).toBeGreaterThan(0);
  await chip.click();
  await expect(page.getByRole("button", { name: /Bổ trợ ổn định/ })).toHaveCount(so);
});
