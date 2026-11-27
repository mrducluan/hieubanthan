import { expect, test } from "@playwright/test";

test.describe("Chặng 4 — Chiêm tinh phương Tây (NASA JPL DE441), Cầu nối Đông–Tây & Trạch Nhật Hiệp Kỷ", () => {
  test("/chiem-tinh dựng Vòng tròn Bản đồ sao SVG Đêm sao, Vận hạn Saturn Return, Cầu nối Đông–Tây & bắt buộc đồng ý ở Synastry", async ({ page }) => {
    await page.goto("/chiem-tinh");
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
    await expect(page.locator("h1")).toHaveCount(1);
    await page.getByTestId("ct-ngay-sinh").fill("1997-03-15");
    await page.getByTestId("ct-gio-sinh").fill("09:30");
    await page.getByTestId("ct-chon-noi").selectOption("ha-noi");
    await page.getByTestId("ct-nut-lap").click();

    await expect(page.getByTestId("ban-do-sao-svg")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("ct-van-han")).toContainText("Thổ tinh");

    // Bấm chọn một hành tinh trên vòng tròn SVG để đổi thẻ chi tiết
    await page.getByTestId("svg-ht-mat_trang").click();
    await expect(page.getByTestId("ct-chi-tiet-hanh-tinh")).toContainText("Mặt Trăng");

    // Chuyển sang tab Cầu nối Đông – Tây
    await page.getByTestId("tab-ct-cau-noi").click();
    await expect(page.getByTestId("ct-cau-noi-dong-tay")).toContainText("Nhật chủ Bát tự");
    await expect(page.getByTestId("ct-cau-noi-dong-tay")).toContainText("cung Mệnh Tử vi");

    // Chuyển sang tab Synastry: chưa tích đồng ý phải chặn, tích đồng ý mới chạy và không chấm điểm
    await page.getByTestId("tab-ct-hop-doi").click();
    await page.getByTestId("syn-ngay-sinh-b").fill("1996-09-22");
    await page.getByTestId("syn-b-chon-noi").selectOption("tp-ho-chi-minh");
    await page.getByTestId("syn-nut-soi").click();
    await expect(page.getByTestId("syn-ket-qua")).toHaveCount(0);

    await page.getByTestId("syn-dong-y").check();
    await page.getByTestId("syn-nut-soi").click();
    await expect(page.getByTestId("syn-ket-qua")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("syn-ket-qua")).toContainText("không chấm điểm");
  });

  test("/xem-ngay-tot hiển thị và tra cứu Khung Đối chiếu Trạch Nhật Hiệp Kỷ Biện Phương Thư 7 ngày", async ({ page }) => {
    await page.goto("/xem-ngay-tot");
    const box = page.getByTestId("doi-chieu-hiep-ky");
    await expect(box).toBeVisible();
    await box.getByTestId("hk-nut-soi").click();
    await expect(box.getByTestId("hk-ket-qua")).toBeVisible({ timeout: 15_000 });
    await expect(box.getByTestId("hk-ket-qua")).toContainText("nhật");
  });
});
