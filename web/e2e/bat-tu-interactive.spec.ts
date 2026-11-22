import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test.describe("Bát tự interactive UI", () => {
  test("4 summary cards, Bạch thoại toggle, và Vòng địa chi inspector", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/bat-tu");

    // 1 H1 + quick-answer order preserved
    await expect(page.locator("h1")).toHaveCount(1);
    const lt = page.getByTestId("bat-tu-loi-thuong");
    await expect(lt).toBeVisible();

    // 4 Summary Cards ("Nhìn phát hiểu ngay")
    const tomTat = page.getByTestId("battu-tom-tat");
    await expect(tomTat).toContainText("Nhìn phát hiểu ngay");
    await expect(tomTat.getByTestId("the-nhat-chu")).toContainText("Nhâm");
    await expect(tomTat.getByTestId("the-mua-vuong")).toContainText("Hạ");
    const theNh = tomTat.getByTestId("the-ngu-hanh");
    await expect(theNh).toContainText("Khuyết hành ≠ tự động phải bù");
    const theDt = tomTat.getByTestId("the-dung-than");
    await expect(theDt).toHaveAttribute("data-chon", "none");
    await expect(theDt).toContainText("Không tự chọn 1 trường phái");
    await expect(theDt).toContainText("Phù ức");
    await expect(theDt).toContainText("Điều hậu");
    await expect(theDt).toContainText("Cách cục");

    // Bạch thoại toggle
    const btBtn = page.getByTestId("battu-bach-thoai");
    await expect(btBtn).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("battu-bach-thoai-noi-dung")).toHaveCount(0);
    await btBtn.click();
    await expect(btBtn).toHaveAttribute("aria-pressed", "true");
    const btPanel = page.getByTestId("battu-bach-thoai-noi-dung");
    await expect(btPanel).toBeVisible();
    await expect(btPanel).toContainText("Nhật chủ là gì?");
    await expect(btPanel).toContainText("Thập thần nói nôm na");

    // Mở Lá số chi tiết để test VongDiaChi inspector
    await page.getByTestId("bat-tu-chi-tiet-mo").click();
    await expect(page.getByTestId("tu-tru")).toBeVisible();
    await expect(page.getByTestId("vong-inspector")).toHaveCount(0);

    // Click Địa chi Ngọ trên vòng SVG
    await page.getByTestId("vong-chi-Ngọ").click();
    const inspector = page.getByTestId("vong-inspector");
    await expect(inspector).toBeVisible();
    await expect(inspector).toContainText("Địa chi Ngọ");
    await expect(inspector).toContainText("Tự hình");

    // Click nút Đóng
    await inspector.getByRole("button", { name: "Đóng" }).click();
    await expect(page.getByTestId("vong-inspector")).toHaveCount(0);

    // Click một relation pill bên dưới vòng
    await page.getByRole("button", { name: /Tự hình/ }).first().click();
    await expect(page.getByTestId("vong-inspector")).toBeVisible();
    await expect(page.getByTestId("vong-inspector")).toContainText("Tương hình / Tự hình");
  });

  test("375px viewport + reduced-motion: không cuộn ngang, interactive hoạt động", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await napHoSo(page);
    await page.goto("/bat-tu");

    await expect(page.getByTestId("battu-4-the")).toBeVisible();
    await page.getByTestId("battu-bach-thoai").click();
    await expect(page.getByTestId("battu-bach-thoai-noi-dung")).toBeVisible();

    await page.getByTestId("bat-tu-chi-tiet-mo").click();
    await page.getByTestId("vong-chi-Ngọ").click();
    await expect(page.getByTestId("vong-inspector")).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
