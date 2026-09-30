// Luồng thần số từ trình duyệt → web → engine. Ca đã chốt trong
// docs/NHAT-KY-DU-AN.md: Nguyễn Đức Luân 24/10/1988 → DD33/SM9/LH6/NC3.
import { test, expect } from "@playwright/test";

const CA_CHOT = {
  ten: "Nguyễn Đức Luân",
  ngay: "24",
  thang: "10",
  nam: "1988",
  chi_so: [
    ["Đường đời", "33"],
    ["Sứ mệnh", "9"],
    ["Linh hồn", "6"],
    ["Nhân cách", "3"],
  ],
} as const;

test("trang chủ thấy engine đang hoạt động", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hiểu Bản Thân" })).toBeVisible();
  await expect(page.getByText(/Engine: v.+ — hoạt động/)).toBeVisible();
});

test("nhập họ tên + ngày sinh → bốn chỉ số, luận giải và gợi ý hỏi", async ({ page }) => {
  await page.goto("/than-so");

  await page.getByLabel("Họ tên (bản chính)").fill(CA_CHOT.ten);
  await page.getByLabel("Ngày", { exact: true }).fill(CA_CHOT.ngay);
  await page.getByLabel("Tháng", { exact: true }).fill(CA_CHOT.thang);
  await page.getByLabel("Năm", { exact: true }).fill(CA_CHOT.nam);
  await page.getByRole("button", { name: "Xem con số" }).click();

  const result = page.locator("section.result");
  await expect(result).toBeVisible();
  await expect(result.locator(".who")).toHaveText(CA_CHOT.ten);
  await expect(result.locator(".meta")).toContainText("Sinh 24/10/1988");

  // Bốn con số cốt lõi — đúng giá trị đã chốt.
  const cards = result.locator(".card");
  await expect(cards).toHaveCount(4);
  for (const [viTri, giaTri] of CA_CHOT.chi_so) {
    const card = cards.filter({ has: page.locator(".pos", { hasText: viTri }) });
    await expect(card.locator(".numeral")).toHaveText(giaTri);
    // Mỗi số phải kèm luận giải: mặt tối + câu tự kiểm + nguồn.
    await expect(card.locator(".shadow-line")).toContainText("Mặt tối:");
    await expect(card.locator(".probe")).toContainText("Tự kiểm");
    await expect(card.locator(".src")).toContainText("Nguồn:");
  }
  await expect(cards.filter({ hasText: "Đường đời" }).locator(".seal")).toHaveText("số cái");

  // Chiều sâu: dải đời, thử thách, năm cá nhân.
  await expect(result.getByRole("img", { name: "Dải đời đỉnh cao theo tuổi" })).toBeVisible();
  await expect(result.locator(".phase").first()).toBeVisible();
  await expect(result.locator(".challenge")).toBeVisible();
  await expect(result.locator(".year").first()).toBeVisible();

  // Q&A: chỉ kiểm tra UI gợi ý — KHÔNG bấm chip (không gọi LLM).
  await expect(result.getByText("Hỏi sâu hơn")).toBeVisible();
  await expect(result.locator(".qa-chip")).toHaveCount(8);
  await expect(result.getByRole("button", { name: "Điểm mạnh cốt lõi của tôi là gì?" })).toBeEnabled();
  await expect(result.getByRole("textbox", { name: "Câu hỏi của bạn" })).toBeVisible();

  await expect(result.locator(".engine-foot")).toContainText("Nguyễn Đức Luân");
});
