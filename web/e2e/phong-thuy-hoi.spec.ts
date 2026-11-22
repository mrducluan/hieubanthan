import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("Hỏi gì xem nấy: chọn intent, bật/tắt Bạch thoại, mở Vì sao & trạng thái Đang hoàn thiện", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");

  const box = page.getByTestId("hoi-gi-xem-nay");
  await expect(box).toBeVisible();
  await expect(page.getByTestId("hoi-gi-lazy-intake")).toBeVisible();

  await page.getByTestId("hoi-gi-intent-bo_cuc").click();
  await expect(page.getByTestId("hoi-gi-ket-qua")).toContainText("Veto");

  const viSao = page.getByTestId("hoi-gi-vi-sao");
  await viSao.locator("summary").click();
  await expect(viSao).toContainText("Táng Thư");

  await page.getByTestId("hoi-gi-bach-thoai").click();
  await expect(viSao).toContainText("dau_hieu_veto");

  await page.getByTestId("hoi-gi-intent-mo_quan").click();
  await expect(page.getByTestId("hoi-gi-ket-qua")).toContainText("đang hoàn thiện");
});

test("Hỏi gì xem nấy: mobile 375px & reduced-motion không tràn ngang", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await napHoSo(page);
  await page.goto("/phong-thuy");

  const box = page.getByTestId("hoi-gi-xem-nay");
  await expect(box).toBeVisible();
  const rect = await box.boundingBox();
  expect(rect?.width ?? 999).toBeLessThanOrEqual(375);
});

test("Hỏi gì xem nấy: bản tiếng Anh /en/feng-shui", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/en/feng-shui");
  await expect(page.getByTestId("hoi-gi-xem-nay")).toContainText("What do you want to check about this home?");
  await page.getByTestId("hoi-gi-intent-mo_quan").click();
  await expect(page.getByTestId("hoi-gi-intent-mo_quan")).toContainText("In progress");
  await expect(page.getByTestId("hoi-gi-ket-qua")).toContainText("being finalized");
});

test("Hỏi gì xem nấy: gọi API thật khi có HoSoNha, prefill KhungChat, giữ 1 H1 & thứ tự TRẢ LỜI NHANH", async ({ page }) => {
  await napHoSo(page);
  await page.addInitScript(() => {
    localStorage.setItem("hbt.nha.v1", JSON.stringify({ v: 1, huong_do: 180, nam_xay: 2024, loai_nha: "nha_pho", cap_nhat_luc: "2026-11-22T00:00:00Z" }));
  });
  await page.goto("/phong-thuy");

  await expect(page.getByTestId("hoi-gi-ket-qua-thuc")).toContainText("180°");
  await expect(page.getByTestId("hoi-gi-ket-qua-thuc")).toContainText("Nam");

  const seoCheck = await page.evaluate(() => {
    const h1s = document.querySelectorAll("h1").length;
    const html = document.body.innerHTML.toLowerCase();
    const quickIdx = html.indexOf("trả lời nhanh");
    const hoiIdx = html.indexOf("hoi-gi-xem-nay");
    return { h1s, quickBeforeHoi: quickIdx !== -1 && hoiIdx !== -1 && quickIdx < hoiIdx };
  });
  expect(seoCheck.h1s).toBe(1);
  expect(seoCheck.quickBeforeHoi).toBe(true);

  await page.getByTestId("hoi-gi-hoi-tiep").click();
  await expect(page.locator("#hoi-phong-thuy textarea")).toHaveValue(/Cửa chính nhà tôi/);
});

test("Phase 2: Huyền Không ▶ Khởi Bàn (reduced-motion) & 4 lớp sao + La bàn trung bình góc 359°/1° → 0°", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await napHoSo(page);
  await page.goto("/phong-thuy");

  // 1. Huyền Không Khởi Bàn + 4 layer toggles
  const hk = page.locator("#huyen-khong");
  await hk.getByRole("button", { name: "Lập bàn" }).click();
  await expect(hk.getByTestId("hk-khoi-ban")).toBeVisible();
  await hk.getByTestId("hk-khoi-ban").click();
  await expect(hk.getByTestId("hk-lop-van")).toBeChecked();
  await expect(hk.getByTestId("hk-lop-ln")).toBeChecked();
  await hk.getByTestId("hk-lop-ln").uncheck();
  await expect(hk.getByTestId("hk-lop-ln")).not.toBeChecked();

  // 2. La bàn cảm biến giả lập 359° và 1° → trung bình góc tuần hoàn phải ra 0° (không phải 180°)
  await page.getByTestId("do-huong").getByRole("button", { name: /Đo bằng la bàn điện thoại/i }).click();
  await expect(async () => {
    await page.evaluate(() => {
      const evName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
      const fire = (heading: number) => {
        const ev = new DeviceOrientationEvent(evName, { alpha: (360 - heading) % 360, absolute: true });
        window.dispatchEvent(ev);
      };
      fire(359);
      fire(1);
    });
    await expect(page.getByTestId("la-ban-do-so")).toContainText("0°", { timeout: 500 });
  }).toPass();
  await expect(page.getByTestId("la-ban-sai-so")).toContainText("±");
  await expect(page.getByTestId("la-ban-doi-chieu-ve-tinh")).toBeVisible();
});
