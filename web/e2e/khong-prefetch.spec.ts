// SỰ CỐ-VERCEL (2026-11-02): tài khoản Vercel bị tạm dừng (402 DEPLOYMENT_DISABLED) vì hạn mức cạn quá nhanh.
// Đo bản build thật: mỗi lượt xem trang sinh 40–100 lượt prefetch link — mỗi lượt là một lần render trang động + một lần
// chạy proxy. Ba chốt chặn để không tái phát:
//   1. không file nào import `next/link` trực tiếp (phải qua components/khung/Lien.tsx, mặc định không prefetch);
//   2. mở trang có menu + chân trang, cuộn hết → 0 yêu cầu prefetch tới máy chủ;
//   3. proxy chỉ chạy cho trang (+ /api/quan-tri) — ảnh, tệp tĩnh, /og, API thường không qua proxy.
import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const GOC = join(__dirname, "..");

function tep(thu: string): string[] {
  return readdirSync(thu).flatMap((ten) => {
    const p = join(thu, ten);
    if (ten === "node_modules" || ten.startsWith(".")) return [];
    return statSync(p).isDirectory() ? tep(p) : /\.(tsx?|mjs|jsx?)$/.test(ten) ? [p] : [];
  });
}

test("không file nào import next/link trực tiếp (trừ Lien)", () => {
  const sai = ["app", "components", "lib"].flatMap((d) => tep(join(GOC, d)))
    .filter((p) => !p.endsWith(join("components", "khung", "Lien.tsx")))
    .filter((p) => /from\s+["']next\/link["']/.test(readFileSync(p, "utf8")))
    .map((p) => p.slice(GOC.length + 1));
  expect(sai, "Dùng `import Link from \"@/components/khung/Lien\"` thay cho next/link").toEqual([]);
});

for (const duong of ["/", "/huyen-hoc", "/tu-vi/sao-o-cung"]) {
  test(`mở ${duong} + cuộn hết: không có yêu cầu prefetch nào tới máy chủ`, async ({ page }) => {
    const prefetch: string[] = [];
    page.on("request", (r) => {
      const h = r.headers();
      if (h["next-router-prefetch"] || h["purpose"] === "prefetch") prefetch.push(r.url());
    });
    await page.goto(duong);
    await page.waitForLoadState("networkidle");
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 2500);
      await page.waitForTimeout(400);
    }
    // rê chuột qua link menu: không prefetch khi hover
    const link = page.locator("header a[href^='/']").first();
    if (await link.count()) await link.hover().catch(() => {});
    await page.waitForTimeout(1200);
    expect(prefetch, prefetch.slice(0, 5).join("\n")).toEqual([]);
  });
}

test("bấm link vẫn chuyển trang (không prefetch không làm hỏng điều hướng)", async ({ page }) => {
  await page.goto("/huyen-hoc");
  const link = page.locator("main a[href='/tu-vi']").first();
  await link.click();
  await expect(page).toHaveURL(/\/tu-vi$/);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("proxy chỉ chạy cho trang: trang có CSP nonce, tệp tĩnh / API / ảnh og thì không", async ({ request }) => {
  expect((await request.get("/huyen-hoc")).headers()["content-security-policy"] ?? "").toContain("nonce-");
  for (const d of ["/robots.txt", "/sitemap.xml", "/api/dia-ly/tinh", "/thuong-hieu/avatar-512.png"]) {
    const r = await request.get(d);
    expect(r.status(), d).toBeLessThan(500);
    expect(r.headers()["content-security-policy"], d).toBeUndefined();
    // header bảo mật nền (next.config.mjs) vẫn còn
    expect(r.headers()["x-content-type-options"], d).toBe("nosniff");
  }
  // /api/quan-tri vẫn qua proxy (làm mới phiên + noindex)
  const qt = await request.post("/api/quan-tri/cai-dat", { data: {} });
  expect(qt.headers()["x-robots-tag"]).toContain("noindex");
});
