import { expect, test } from "@playwright/test";

test.describe("Chặng 3 — Hợp nhất 9 môn: Sự vụ Kỳ Môn · Lục Hào, Tướng–Mệnh & Đa phái", () => {
  test("/co-van và /co-van-kinh-doanh mở tab Sự vụ tức thời (Kỳ Môn · Lục Hào) và trả đủ 2 góc nhìn độc lập", async ({ page }) => {
    await page.goto("/co-van");
    await page.getByTestId("tab-co-van-su-vu").click();
    await expect(page.getByTestId("su-vu-tuc-thoi")).toBeVisible();
    await page.getByTestId("su-vu-chip-ky_ket_hop_dong").click();
    await page.getByTestId("su-vu-nut-xem").click();
    await expect(page.getByTestId("su-vu-ket-qua")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("su-vu-goc-ky-mon")).toContainText("Kỳ Môn");
    await expect(page.getByTestId("su-vu-goc-luc-hao")).toContainText("Phụ Mẫu");

    await page.goto("/co-van-kinh-doanh");
    await page.getByTestId("tab-cvkd-su-vu").click();
    await expect(page.getByTestId("su-vu-tuc-thoi")).toBeVisible();
  });

  test("/chi-tay hiển thị khung Đối chiếu Tướng–Chỉ tay × Nhịp năm lá số (Saint-Germain 1897)", async ({ page }) => {
    await page.goto("/chi-tay");
    const box = page.getByTestId("doi-chieu-tuong-menh");
    await expect(box).toBeVisible();
    await box.getByTestId("dctm-ngay-sinh").fill("1990-05-15");
    await box.getByTestId("dctm-nut-xem").click();
    await expect(box.getByTestId("dctm-ket-qua")).toBeVisible({ timeout: 15_000 });
    await expect(box.getByTestId("dctm-ket-qua")).toContainText("Saint-Germain");
  });

  test("API /api/tarot/chieu-sau và /api/thanso/doi-chieu-phai hoạt động chuẩn xác song ngữ", async ({ request }) => {
    const resTs = await request.post("/api/thanso/doi-chieu-phai", {
      data: { ngay_sinh: "1988-11-22", ho_ten: "Nguyen Van Minh" },
    });
    expect(resTs.status()).toBe(200);
    const bodyTs = await resTs.json();
    expect(bodyTs.nam_phai).toHaveLength(5);

    const resTr = await request.post("/api/tarot/chieu-sau", {
      data: { la: [{ id: "gay_1", nguoc: true }, { id: "kiem_3", nguoc: false }, { id: "coc_2", nguoc: true }] },
    });
    expect(resTr.status()).toBe(200);
    const bodyTr = await resTr.json();
    expect(bodyTr.so_la_nguoc).toBe(2);
    expect(bodyTr.pham_gia_nguyen_to).toHaveLength(2);
  });
});
