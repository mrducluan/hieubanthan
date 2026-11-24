// CSP-2 + Q-I3 (Phương án C — 2 vùng bảo mật):
// - Vùng 1 (public-edge): allowlist trang công khai cho khách vãng lai & bot tìm kiếm/AI → Edge CDN Cache
//   (Vercel-CDN-Cache-Control / CDN-Cache-Control: public, s-maxage=300, stale-while-revalidate=3600) + CSP host-allowlist
//   (không nonce, vẫn chặn object-src/frame-ancestors/connect-src).
// - Vùng 2 (private-nonce): tài khoản, thanh toán (/nap-sao, /hoi-vien, /tai-khoan, /ban-than, /quan-tri), ?kw=, /en,
//   hoặc request có cookie đăng nhập / chế độ nháp → nonce 128-bit mới mỗi lượt + 'strict-dynamic' + chặn XSS chèn tay.
import { test, expect, type Page } from "@playwright/test";
import { coTheCacheCongKhai, laDuongCongKhaiCache } from "../lib/vung-cache-cong-khai";

function ghiViPham(page: Page): string[] {
  const vp: string[] = [];
  page.on("console", (m) => { if (/Content Security Policy|Content-Security-Policy/i.test(m.text())) vp.push(m.text()); });
  return vp;
}

test("Q-I3 phân vùng thuần: allowlist trang công khai, loại trừ /goi-xem & trang theo giờ/ngày, bypass cookie đăng nhập / nháp / ?kw=", () => {
  for (const ok of ["/", "/than-so", "/tu-vi", "/than-so/y-nghia-so/so-7", "/phong-thuy/huong-hop-tuoi/cung-kham-bac", "/hop-doi", "/hop-doi/cap-so/so-chu-dao-1-va-2", "/ban-do-doi-ngu", "/tu-dien"]) {
    expect(laDuongCongKhaiCache(ok), ok).toBe(true);
    expect(coTheCacheCongKhai({ method: "GET", pathname: ok, search: "", cookieNames: [] }), ok).toBe(true);
  }
  for (const no of ["/quan-tri", "/quan-tri/cai-dat", "/tai-khoan", "/nap-sao", "/hoi-vien", "/ban-than", "/goi-xem", "/hom-nay", "/xem-ngay-tot", "/ky-mon", "/thoi-gian-toi", "/hoi-chuyen-gia", "/dang-nhap", "/hop-doi/abc123", "/ban-do-doi-ngu/moi", "/en", "/en/numerology"]) {
    expect(laDuongCongKhaiCache(no), no).toBe(false);
    expect(coTheCacheCongKhai({ method: "GET", pathname: no, search: "", cookieNames: [] }), no).toBe(false);
  }
  // Bypass khi có query (?kw=), cookie Supabase, draftMode, trình duyệt chỉ tiếng Anh hoặc non-GET.
  expect(coTheCacheCongKhai({ method: "GET", pathname: "/than-so", search: "?kw=ngay-sinh", cookieNames: [] })).toBe(false);
  expect(coTheCacheCongKhai({ method: "GET", pathname: "/than-so", search: "", cookieNames: ["sb-xyz-auth-token.0"] })).toBe(false);
  expect(coTheCacheCongKhai({ method: "GET", pathname: "/than-so", search: "", cookieNames: ["__prerender_bypass"] })).toBe(false);
  expect(coTheCacheCongKhai({ method: "GET", pathname: "/than-so", search: "", cookieNames: ["hbt-nhap-pham-vi"] })).toBe(false);
  expect(coTheCacheCongKhai({ method: "GET", pathname: "/than-so", search: "", cookieNames: ["hbt-goi-y-en"] })).toBe(true);
  expect(coTheCacheCongKhai({ method: "GET", pathname: "/than-so", search: "", cookieNames: [], acceptLanguage: "en-US,en;q=0.9" })).toBe(false);
  expect(coTheCacheCongKhai({ method: "GET", pathname: "/than-so", search: "", cookieNames: [], acceptLanguage: "en-US,vi;q=0.8" })).toBe(true);
  expect(coTheCacheCongKhai({ method: "POST", pathname: "/than-so", search: "", cookieNames: [] })).toBe(false);
});

test("Vùng 1 (public-edge & public-bypass): trang công khai vãng lai có Edge CDN Cache; bypass giữ CSP đồng nhất không nonce + private, no-store", async ({ request }) => {
  for (const duong of ["/", "/than-so", "/tu-vi", "/than-so/y-nghia-so/so-7"]) {
    const r = await request.get(duong, { headers: { "accept-language": "vi-VN,vi;q=0.9" } });
    expect(r.status(), duong).toBe(200);
    expect(r.headers()["x-hbt-cache-zone"], duong).toBe("public-edge");
    expect(r.headers()["vercel-cdn-cache-control"], duong).toContain("s-maxage=300");
    expect(r.headers()["cdn-cache-control"], duong).toContain("stale-while-revalidate=3600");
    const csp = r.headers()["content-security-policy"] ?? "";
    expect(csp, duong).not.toContain("'nonce-");
    expect(csp, duong).toContain("object-src 'none'");
    expect(csp, duong).toContain("frame-ancestors 'self'");
    expect(csp, duong).toMatch(/connect-src [^;]*'self'/);
  }
  // Bypass (cookie đăng nhập / ?kw=): không cache Edge (private, no-store) và vẫn giữ CSP đồng nhất theo đường dẫn (tránh lệch nonce vs HTML cache).
  for (const [duong, headers] of [
    ["/than-so/y-nghia-so/so-7", { cookie: "sb-test-auth-token=1" }],
    ["/than-so?kw=ngay-sinh", {}],
  ] as const) {
    const r = await request.get(duong, { headers });
    expect(r.headers()["x-hbt-cache-zone"], duong).toBe("public-bypass");
    expect(r.headers()["vercel-cdn-cache-control"], duong).toBe("private, no-store");
    expect(r.headers()["content-security-policy"] ?? "", duong).not.toContain("'nonce-");
  }
});

test("Vùng 2 (private-nonce): trang nhạy cảm & bảng giá có nonce mới mỗi lượt + strict-dynamic, script Next mang đúng nonce", async ({ request }) => {
  for (const duong of ["/nap-sao", "/goi-xem", "/hoi-vien"]) {
    const a = await request.get(duong);
    const b = await request.get(duong);
    expect(a.headers()["x-hbt-cache-zone"], duong).toBe("private-nonce");
    expect(a.headers()["vercel-cdn-cache-control"], duong).toBeUndefined();
    const csp = a.headers()["content-security-policy"] ?? "";
    const nonce = /'nonce-([A-Za-z0-9+/=]+)'/.exec(csp)?.[1];
    expect(nonce, duong).toBeTruthy();
    expect(csp, duong).toContain("'strict-dynamic'");
    expect(csp, duong).toContain("object-src 'none'");
    expect(csp, duong).toContain("frame-ancestors 'self'");
    expect(csp, duong).toMatch(/connect-src [^;]*'self'/);
    expect(b.headers()["content-security-policy"], duong).not.toContain(nonce!);
    const html = await a.text();
    const scripts = [...html.matchAll(/<script(?![^>]*application\/ld\+json)([^>]*)>/g)].map((m) => m[1]!);
    expect(scripts.length, duong).toBeGreaterThan(0);
    for (const s of scripts) expect(s, duong).toContain(`nonce="${nonce}"`);
  }
});

for (const duong of ["/", "/than-so", "/tu-vi", "/bat-tu", "/kinh-dich", "/phong-thuy", "/than-so/y-nghia-so/so-7",
  "/phong-thuy/huong-hop-tuoi/cung-kham-bac", "/tu-dien", "/nap-sao"]) {
  test(`không vi phạm CSP: ${duong}`, async ({ page }) => {
    const vp = ghiViPham(page);
    await page.goto(duong);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 60_000 });
    await page.waitForLoadState("networkidle");
    expect(vp).toEqual([]);
  });
}

test("GTM nạp khi người dùng tương tác (PERF-2; không chờ đồng ý): gtm.js chạy được, không vi phạm CSP", async ({ page }) => {
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

test("Vùng 2 (private-nonce): script chèn không có nonce (giả lập XSS) bị trình duyệt chặn", async ({ page }) => {
  await page.goto("/nap-sao");
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
