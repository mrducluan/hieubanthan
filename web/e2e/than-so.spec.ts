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

  // Biểu đồ ngày sinh (v2): 24101988 thiếu 3,5,7 → mũi tên trống 3-5-7.
  const bd = result.getByTestId("bieu-do");
  await expect(bd).toBeVisible();
  await expect(bd.getByText("Mũi tên trống Tâm linh (Hoài nghi)")).toBeVisible();
  await expect(bd.getByText("Số vắng trong ngày sinh: 3, 5, 6, 7")).toBeVisible();

  // Q&A: có gợi ý + ô nhập; engine chạy template (không LLM) nên bấm chip là có câu trả lời.
  await expect(result.getByText("Hỏi sâu hơn")).toBeVisible();
  await expect(result.locator(".qa-chip")).toHaveCount(9);
  await expect(result.getByRole("textbox", { name: "Câu hỏi của bạn" })).toBeVisible();
  await result.getByRole("button", { name: "Điểm mạnh cốt lõi của tôi là gì?" }).click();
  const ans = result.getByTestId("qa-answer");
  await expect(ans).toContainText("Mặt tối cần để ý");
  await expect(ans).toContainText("Ghép trực tiếp từ kho tri thức có nguồn.");

  await expect(result.locator(".engine-foot")).toContainText("Nguyễn Đức Luân");
});

test("hỏi hợp đôi: thiếu người thứ hai → nhập ngày sinh → có cặp số", async ({ page }) => {
  await page.goto("/than-so?ten1=Nguy%E1%BB%85n%20%C4%90%E1%BB%A9c%20Lu%C3%A2n&ngay=24&thang=10&nam=1988");
  const result = page.locator("section.result");
  const chip = result.getByRole("button", { name: "Tôi và người yêu có hợp nhau không?" });
  await chip.click();
  const ans = result.getByTestId("qa-answer");
  await expect(ans).toContainText("Người thứ hai");

  await result.getByLabel("Ngày sinh người thứ hai").fill("13");
  await result.getByLabel("Tháng sinh người thứ hai").fill("5");
  await result.getByLabel("Năm sinh người thứ hai").fill("1990");
  await chip.click();
  await expect(ans).toContainText("Cặp số chủ đạo 33 và 1");
});
