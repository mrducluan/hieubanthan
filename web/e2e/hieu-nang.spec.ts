// PERF-1 — chặn tái phát: trang công khai không kéo thư viện tài khoản (Supabase, ~70 KB nén) khi chưa đăng nhập;
// từ điển không tải phông chữ Hán (Noto Serif TC chia ~100 mảnh theo ký tự, trước đây ~1,2 MB).
import { test, expect } from "@playwright/test";

for (const duong of ["/", "/kien-thuc/tu-vi/sao-tu-vi", "/tu-dien", "/than-so"]) {
  test(`không tải thư viện tài khoản: ${duong}`, async ({ page }) => {
    const js: Promise<string>[] = [];
    page.on("response", (r) => { if (r.request().resourceType() === "script" && r.url().includes("/_next/")) js.push(r.text().catch(() => "")); });
    await page.goto(duong, { waitUntil: "networkidle" });
    const noi = await Promise.all(js);
    expect(noi.length).toBeGreaterThan(0);
    expect(noi.some((t) => t.includes("GoTrueClient"))).toBe(false);
  });
}

test("từ điển không tải phông chữ Hán", async ({ page }) => {
  const font: string[] = [];
  page.on("request", (r) => { if (r.resourceType() === "font") font.push(r.url()); });
  await page.goto("/tu-dien", { waitUntil: "networkidle" });
  // Latin + Việt của Be Vietnam Pro + Newsreader ≈ 14 tệp; trước PERF-1 thêm hàng chục mảnh Noto Serif TC.
  expect(font.length).toBeLessThanOrEqual(20);
});
