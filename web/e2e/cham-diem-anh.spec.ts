// NT-1 + CodeQL js/xss-through-dom: ảnh chọn để đo ba đình được vẽ lại qua canvas (`urlAnhSach`) — ảnh hiện bằng URL blob:,
// chấm 4 điểm trên ảnh → engine trả tỉ lệ ba đình; chỉ toạ độ rời máy (không gửi ảnh).
import { test, expect } from "@playwright/test";

test("đo ba đình trên ảnh: ảnh vẽ lại (blob:), chấm 4 điểm, có kết quả, không gửi ảnh", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  // ảnh PNG thật (giải mã được) dựng bằng chính trình duyệt
  await page.setContent('<div style="width:200px;height:300px;background:linear-gradient(#caa,#987)"></div>');
  const png = await page.locator("div").screenshot();
  await page.goto("/nhan-tuong");
  const khoi = page.getByTestId("cham-diem-anh").first();
  await expect(khoi).toBeAttached({ timeout: 20_000 });
  await khoi.evaluate((d) => ((d as HTMLDetailsElement).open = true));
  const guiAnh: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/api/nhan-tuong/do-anh")) guiAnh.push(r.postData() ?? ""); });
  await khoi.locator('input[type="file"]').setInputFiles({ name: "mat.png", mimeType: "image/png", buffer: png });
  const anh = khoi.locator("img");
  await expect(anh).toHaveAttribute("src", /^blob:/, { timeout: 10_000 });
  await expect.poll(() => anh.evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await anh.scrollIntoViewIfNeeded();
  const hop = (await anh.boundingBox())!;
  for (const y of [0.1, 0.38, 0.66, 0.95]) await anh.click({ position: { x: hop.width / 2, y: hop.height * y } });
  await khoi.getByRole("button", { name: "Tính tỉ lệ ba đình" }).click();
  await expect.poll(() => guiAnh.length, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(guiAnh[0]).not.toMatch(/data:image|base64/);
});
