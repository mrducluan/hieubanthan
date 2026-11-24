// CSP-2 — Content-Security-Policy đầy đủ: script chỉ chạy khi mang nonce của lượt tải trang (hoặc do script có nonce
// nạp — 'strict-dynamic'). Script lạ chèn vào trang (XSS) hay từ tên miền lạ đều bị chặn; dữ liệu chỉ gửi được tới
// các máy chủ trong connect-src. Kiểm: header có nonce mới mỗi lượt, script của Next mang nonce, các trang chính chạy
// không có vi phạm CSP nào, GTM (nạp mọi trang) vẫn chạy, và một script chèn không nonce thì bị chặn thật.
import { test, expect, type Page } from "@playwright/test";

function ghiViPham(page: Page): string[] {
  const vp: string[] = [];
  page.on("console", (m) => { if (/Content Security Policy|Content-Security-Policy/i.test(m.text())) vp.push(m.text()); });
  return vp;
}

test("trang công cụ/tài khoản giữ CSP-2: nonce mới mỗi lượt + strict-dynamic, không CDN cache, script mang đúng nonce", async ({ request }) => {
  const a = await request.get("/than-so");
  const b = await request.get("/than-so");
  const csp = a.headers()["content-security-policy"] ?? "";
  const nonce = /'nonce-([A-Za-z0-9+/=]+)'/.exec(csp)?.[1];
  expect(nonce).toBeTruthy();
  expect(csp).toContain("'strict-dynamic'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'self'");
  expect(csp).toMatch(/connect-src [^;]*'self'/);
  expect(a.headers()["cdn-cache-control"]).toBeUndefined();
  expect(a.headers()["vercel-cdn-cache-control"]).toBeUndefined();
  expect(b.headers()["content-security-policy"]).not.toContain(nonce!);      // mỗi lượt một nonce
  const html = await a.text();
  const scripts = [...html.matchAll(/<script(?![^>]*application\/ld\+json)([^>]*)>/g)].map((m) => m[1]!);
  expect(scripts.length).toBeGreaterThan(0);
  for (const s of scripts) expect(s).toContain(`nonce="${nonce}"`);
});

test("Q-I3: trang SEO công khai dùng CSP tĩnh (không nonce) + CDN-Cache-Control + không Set-Cookie; nháp/query tự thoát cache", async ({ request }) => {
  for (const duong of ["/than-so/y-nghia-so/so-7", "/phong-thuy/huong-hop-tuoi/cung-kham-bac", "/tu-dien", "/blog"]) {
    const r = await request.get(duong);
    expect(r.status()).toBe(200);
    const csp = r.headers()["content-security-policy"] ?? "";
    expect(csp).not.toMatch(/'nonce-/);
    expect(csp).not.toContain("'strict-dynamic'");
    expect(csp).not.toMatch(/script-src [^;]*\shttps:(?:\s|;|$)/);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toMatch(/connect-src [^;]*'self'/);
    expect(r.headers()["cdn-cache-control"]).toContain("public, s-maxage=3600");
    expect(r.headers()["vercel-cdn-cache-control"]).toContain("public, s-maxage=3600");
    expect(r.headers()["set-cookie"]).toBeUndefined();
  }
  // Chế độ xem nháp (__prerender_bypass / hbt-xem-truoc) hoặc có query string → thoát CDN cache, quay về nonce CSP-2
  for (const ck of ["__prerender_bypass=1", "hbt-xem-truoc=1"]) {
    const nhap = await request.get("/than-so/y-nghia-so/so-7", { headers: { cookie: ck } });
    expect(nhap.headers()["cdn-cache-control"]).toBeUndefined();
    expect(nhap.headers()["content-security-policy"]).toMatch(/'nonce-/);
  }

  const coQuery = await request.get("/than-so/y-nghia-so/so-7?utm_source=test");
  expect(coQuery.headers()["cdn-cache-control"]).toBeUndefined();
  expect(coQuery.headers()["content-security-policy"]).toMatch(/'nonce-/);
});

for (const duong of ["/", "/than-so", "/tu-vi", "/bat-tu", "/kinh-dich", "/phong-thuy", "/than-so/y-nghia-so/so-7",
  "/phong-thuy/huong-hop-tuoi/cung-kham-bac", "/tu-dien"]) {
  test(`không vi phạm CSP: ${duong}`, async ({ page }) => {
    const vp = ghiViPham(page);
    await page.goto(duong);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 60_000 });
    await page.waitForLoadState("networkidle");
    expect(vp).toEqual([]);
  });
}

test("GTM nạp khi người dùng tương tác (PERF-2; không chờ đồng ý): đoạn khởi động có nonce + gtm.js chạy được, không vi phạm CSP", async ({ page }) => {
  const vp = ghiViPham(page);
  await page.route(/googletagmanager\.com/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "window.__gtm_da_tai=1;" }));
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("hbt.dong-y-cookie.v1"));
  await page.reload();
  // PERF-2: gtm.js chờ tương tác đầu tiên (hoặc 8 giây) để không nằm trong Total Blocking Time.
  expect(await page.evaluate(() => (window as unknown as { __gtm_da_tai?: number }).__gtm_da_tai)).toBeUndefined();
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __gtm_da_tai?: number }).__gtm_da_tai)).toBe(1);
  expect(vp).toEqual([]);
});

test("CSP mở cho hệ Google mà thẻ GTM hay gọi (Analytics, Ads, DoubleClick, Tag Assistant)", async ({ request }) => {
  const csp = (await request.get("/")).headers()["content-security-policy"] ?? "";
  for (const mien of ["https://*.google-analytics.com", "https://*.googletagmanager.com", "https://*.doubleclick.net",
    "https://*.googleadservices.com", "https://tagassistant.google.com"]) expect(csp).toContain(mien);
  expect(csp).toMatch(/frame-src [^;]*tagassistant\.google\.com/);
});

test("script chèn không có nonce (giả lập XSS) bị trình duyệt chặn", async ({ page }) => {
  await page.goto("/");
  const chay = await page.evaluate(async () => {
    const w = window as unknown as { __xss?: number };
    const s = document.createElement("div");
    s.innerHTML = "<img src=x onerror=\"window.__xss=1\">";
    document.body.appendChild(s);
    await new Promise((r) => setTimeout(r, 300));
    return w.__xss ?? 0;
  });
  expect(chay).toBe(0);
});
