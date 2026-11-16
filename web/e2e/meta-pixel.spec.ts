// Meta Pixel (2026-11-16): tôn trọng lựa chọn cookie TRƯỚC init, không gửi gì ở trang mang mã thẻ / lời mời / quà,
// tắt autoConfig + pushState tự động. Chặn mọi yêu cầu tới Meta để đọc hàng đợi fbq (fbevents.js không chạy).
import { test, expect, type Page } from "@playwright/test";

const MA = "eyJ0IjoiQW4ifQ.abcdEFGH1234";

async function hangDoi(page: Page): Promise<unknown[][]> {
  await page.waitForFunction(() => Boolean((window as unknown as { fbq?: unknown }).fbq));
  return page.evaluate(() => ((window as unknown as { fbq: { queue: IArguments[] } }).fbq.queue).map((a) => Array.from(a)));
}

function demMeta(page: Page): string[] {
  const ds: string[] = [];
  page.on("request", (q) => { if (/facebook\.(net|com)/.test(q.url())) ds.push(q.url()); });
  return ds;
}

test("chưa chọn (site không hỏi): init + PageView, autoConfig tắt, pushState tự động tắt", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("hbt.dong-y-cookie.v1"));
  await page.route(/facebook\.(net|com)/, (r) => r.abort());
  await page.goto("/tu-dien");
  const q = await hangDoi(page);
  expect(q.map((a) => a[0])).toEqual(["set", "init", "track"]);
  expect(q[0]).toEqual(["set", "autoConfig", false, expect.any(String)]);
  expect(q[2]).toEqual(["track", "PageView"]);
  expect(await page.evaluate(() => (window as unknown as { fbq: { disablePushState?: boolean } }).fbq.disablePushState)).toBe(true);
});

test("đã từ chối cookie: revoke trước init, không tải fbevents.js, không gọi Meta; Đồng ý sau đó mới tải", async ({ page }) => {
  const ds = demMeta(page);
  await page.route(/facebook\.(net|com)/, (r) => r.abort());
  await page.goto("/tu-dien");   // storageState mặc định đã "từ chối"
  const q = await hangDoi(page);
  expect(q[0]).toEqual(["consent", "revoke"]);
  await page.mouse.click(5, 5);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(500);
  expect(ds).toEqual([]);
  await page.evaluate(() => { localStorage.setItem("hbt.dong-y-cookie.v1", "dong_y"); window.dispatchEvent(new CustomEvent("hbt:dong-y-cookie", { detail: "dong_y" })); });
  await expect.poll(() => ds.some((u) => u.includes("fbevents.js"))).toBe(true);
});

for (const duong of [`/hom-nay?the=${MA}`, `/the/hai/${MA}`, "/qua/abcd123456"]) {
  test(`trang mang mã (${duong.split("?")[0]}): không PageView`, async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("hbt.dong-y-cookie.v1"));
    await page.route(/facebook\.(net|com)/, (r) => r.abort());
    await page.goto(duong);
    const q = await hangDoi(page);
    expect(q.some((a) => a[0] === "track")).toBe(false);
  });
}
