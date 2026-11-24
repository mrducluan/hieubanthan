import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("Sơ đồ mặt bằng Mini-CAD v2: vẽ hộp phòng, xoay hướng cửa 90°, chỉnh kích thước, xoá chip ×, hoàn tác & tự phát hiện lỗi bố cục", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "hbt.nha.v1",
      JSON.stringify({ v: 1, huong_do: 180, theo: "cua", thanh_vien: [], cap_nhat_luc: "2026-11-24T00:00:00.000Z" }),
    );
  });
  await page.goto("/phong-thuy");
  const vt = page.getByTestId("vi-tri-vat");
  await vt.scrollIntoViewIfNeeded();
  await vt.getByTestId("vi-tri-cach-khung").click();

  const khung = vt.getByTestId("vi-tri-khung");
  const bam = async (loai: string, x: number, y: number) => {
    await vt.getByTestId(`vi-tri-dat-${loai}`).click();
    await khung.scrollIntoViewIfNeeded();
    const b = (await khung.boundingBox())!;
    await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
  };

  // 1. Đặt Cửa chính, Phòng chính, WC trong vùng Trung cung (0.56, 0.52)
  await bam("cua_chinh", 0.5, 0.05);
  await bam("phong_ngu_chinh", 0.25, 0.35);
  await bam("ve_sinh", 0.56, 0.52);

  await expect(vt.getByTestId("vi-tri-hop-cua_chinh")).toBeVisible();
  await expect(vt.getByTestId("vi-tri-hop-phong_ngu_chinh")).toBeVisible();
  await expect(vt.getByTestId("vi-tri-hop-ve_sinh")).toBeVisible();

  // 2. Tự động gợi ý WC giữa nhà (KHÔNG tích sẵn — người dùng phải tự tích mới lưu)
  await expect(vt.getByTestId("vi-tri-phat-hien")).toContainText("Trung cung");
  await expect(vt.getByTestId("vi-tri-xn-wc_giua_nha")).not.toBeChecked();
  await vt.getByTestId("vi-tri-xn-wc_giua_nha").check();

  // 3. Chỉnh Phòng chính: xoay hướng cửa 90°, tăng kích thước (m) & kéo dời vị trí bằng chuột
  await vt.getByTestId("vi-tri-dat-phong_ngu_chinh").click();
  await expect(vt.getByTestId("vi-tri-chinh-phong")).toBeVisible();
  const huongTruoc = await vt.getByTestId("vi-tri-huong-cua-nhan").innerText();
  await vt.getByTestId("vi-tri-xoay-cua").click();
  await expect(vt.getByTestId("vi-tri-huong-cua-nhan")).not.toHaveText(huongTruoc);

  const rongTruoc = await vt.getByTestId("vi-tri-phong-rong").innerText();
  await vt.getByTestId("vi-tri-phong-rong-tang").click();
  await expect(vt.getByTestId("vi-tri-phong-rong")).not.toHaveText(rongTruoc);

  // Kéo dời Phòng chính xuống dưới trên canvas
  const hopBox = (await vt.getByTestId("vi-tri-hop-phong_ngu_chinh").boundingBox())!;
  await page.mouse.move(hopBox.x + hopBox.width / 2, hopBox.y + hopBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(hopBox.x + hopBox.width / 2, hopBox.y + hopBox.height / 2 + 40, { steps: 4 });
  await page.mouse.up();
  const hopSau = (await vt.getByTestId("vi-tri-hop-phong_ngu_chinh").boundingBox())!;
  expect(hopSau.y).toBeGreaterThan(hopBox.y + 15);

  // 4. Xem kết quả -> Lưu vào hồ sơ nhà -> reload vẫn giữ kích thước, hướng cửa & dấu hiệu đã xác nhận
  await vt.getByTestId("vi-tri-xem").click();
  await expect(vt.getByTestId("vi-tri-ket-qua")).toBeVisible();
  await vt.getByTestId("vi-tri-luu").click();
  const saved = await page.evaluate(() => JSON.parse(window.localStorage.getItem("hbt.nha.v1") || "{}"));
  expect(saved.tang_do?.[0]?.vat?.phong_ngu_chinh?.kich_thuoc).toBeTruthy();
  expect(saved.tang_do?.[0]?.vat?.phong_ngu_chinh?.huong_cua).toBeTruthy();
  expect(saved.bo_cuc?.dau_hieu).toContain("wc_giua_nha");

  // 5. Xoá Nhà vệ sinh bằng nút × ngay trên chip -> biến mất khỏi sơ đồ -> Hoàn tác -> hiện lại
  await vt.getByTestId("vi-tri-xoa-chip-ve_sinh").click();
  await expect(vt.getByTestId("vi-tri-hop-ve_sinh")).toHaveCount(0);
  await vt.getByTestId("vi-tri-hoan-tac").click();
  await expect(vt.getByTestId("vi-tri-hop-ve_sinh")).toBeVisible();

  // 6. Xoá tầng -> sạch toàn bộ hộp phòng
  await vt.getByTestId("vi-tri-xoa-tang").click();
  await expect(vt.getByTestId("vi-tri-hop-cua_chinh")).toHaveCount(0);
  await expect(vt.getByTestId("vi-tri-hop-phong_ngu_chinh")).toHaveCount(0);
});



