// Meta Pixel (2026-11-16): tôn trọng lựa chọn cookie TRƯỚC init, không gửi gì ở trang mang mã thẻ / lời mời / quà,
// tắt autoConfig + pushState tự động. Chặn mọi yêu cầu tới Meta để đọc hàng đợi fbq (fbevents.js không chạy).
import { test, expect, type Page } from "@playwright/test";
import { metaPurchase, metaSuKien } from "../lib/meta-pixel";
import { nguonQc } from "../lib/nguon-qc";
import { coMaTrongUrl } from "../lib/lam-sach-url";
import { docCookie, duLieuKhop, goiPurchase } from "../lib/meta-capi";

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

test("META-QC: vào từ quảng cáo (?fbclid) → cookie _fbc ghi ngay + mọi sự kiện PostHog mang qc=meta; sự kiện chuẩn đi đúng tên", async ({ page, context }) => {
  await page.addInitScript(() => localStorage.removeItem("hbt.dong-y-cookie.v1"));
  await page.route(/facebook\.(net|com)/, (r) => r.abort());
  await page.goto("/tu-dien?fbclid=IwAR0abc_DEF-1");
  await hangDoi(page);
  const fbc = (await context.cookies()).find((c) => c.name === "_fbc")?.value ?? "";
  expect(fbc).toMatch(/^fb\.1\.\d{13}\.IwAR0abc_DEF-1$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.qc") ?? "{}").v)).toBe("meta");
  const sk = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { su_kien: string; qc?: string }[] }).__hbt_su_kien ?? []);
  expect(sk.find((x) => x.su_kien === "landing_viewed")?.qc).toBe("meta");
});

test("đã từ chối cookie: ?fbclid KHÔNG ghi cookie _fbc", async ({ page, context }) => {
  await page.route(/facebook\.(net|com)/, (r) => r.abort());
  await page.goto("/tu-dien?fbclid=IwAR0abc_DEF-2");
  await hangDoi(page);
  expect((await context.cookies()).some((c) => c.name === "_fbc")).toBe(false);
});

/** Cửa sổ giả cho hàm thuần chạy trong Node: fbq ghi lại lời gọi, storage trong bộ nhớ. */
function cuaSoGia(href: string): unknown[][] {
  const goi: unknown[][] = [];
  const kho = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
  Object.assign(globalThis, { window: { fbq: (...a: unknown[]) => goi.push(a), location: { href } }, localStorage: kho(), sessionStorage: kho() });
  return goi;
}

test("bảng nối PostHog → Meta: đúng tên sự kiện, chỉ mã mảng, một lần mỗi mảng mỗi phiên; trang mang mã không gửi", () => {
  const g = cuaSoGia("https://hieuban.com/tu-vi");
  metaSuKien("reading_started", { mo_dun: "tuvi" });
  metaSuKien("reading_started", { mo_dun: "tuvi" });
  metaSuKien("reading_completed", { mo_dun: "tuvi" });
  metaSuKien("checkout_started", { kind: "sao", goi: "pho_bien" });
  metaSuKien("unlock_succeeded", { mo_dun: "battu" });
  metaSuKien("profile_created", {});
  metaSuKien("profile_created", {});
  metaSuKien("share_created", { kind: "card" });
  expect(g).toEqual([
    ["track", "ViewContent", { content_category: "tuvi", content_type: "product" }],
    ["trackCustom", "ReadingCompleted", { mo_dun: "tuvi" }],
    ["track", "InitiateCheckout", { content_type: "sao", content_ids: ["pho_bien"], currency: "VND" }],
    ["trackCustom", "UnlockChapter", { mo_dun: "battu" }],
    ["track", "Lead"],
  ]);
  metaPurchase(399000, 100123, "hoi_vien");
  expect(g.slice(-2)).toEqual([
    ["track", "Purchase", { value: 399000, currency: "VND", content_type: "hoi_vien" }, { eventID: "don-100123" }],
    ["track", "Subscribe", { value: 399000, currency: "VND", predicted_ltv: 399000 }, { eventID: "hv-100123" }],
  ]);
  const g2 = cuaSoGia(`https://hieuban.com/the/hai/${MA}`);
  metaSuKien("reading_started", { mo_dun: "tuvi" });
  metaPurchase(19000, 1);
  expect(g2).toEqual([]);
  delete (globalThis as { window?: unknown }).window;
});

test("nguồn quảng cáo + URL mang mã", () => {
  expect(nguonQc("https://hieuban.com/?fbclid=abc")).toBe("meta");
  expect(nguonQc("/tu-vi?utm_source=Facebook&utm_medium=cpc")).toBe("meta");
  expect(nguonQc("/tu-vi?utm_source=ig")).toBe("meta");
  expect(nguonQc("/tu-vi?utm_source=google")).toBeNull();
  expect(coMaTrongUrl(`https://hieuban.com/hom-nay?the=${MA}`)).toBe(true);
  expect(coMaTrongUrl("https://hieuban.com/qua/abcd123456")).toBe(true);
  expect(coMaTrongUrl("https://hieuban.com/tu-vi/sao-o-cung/tu-vi-cung-menh?fbclid=x#a")).toBe(false);
});

test("API chuyển đổi: chỉ nhận cookie Meta đúng định dạng; gói Purchase cùng event_id với Pixel, không email / tên", () => {
  const req = new Request("https://hieuban.com/api/thanh-toan/tao-don", { headers: {
    cookie: "a=1; _fbp=fb.1.1700000000000.123456789; _fbc=fb.1.1700000000000.IwAR0abc_DEF-1",
    "x-real-ip": "203.0.113.5", "user-agent": "Mozilla/5.0 Test" } });
  expect(duLieuKhop(req)).toEqual({ fbp: "fb.1.1700000000000.123456789", fbc: "fb.1.1700000000000.IwAR0abc_DEF-1", ip: "203.0.113.5", ua: "Mozilla/5.0 Test" });
  const xau = new Request("https://hieuban.com/x", { headers: { cookie: "_fbp=<script>; _fbc=fb.1.1.x", "x-real-ip": "1.2.3.4; drop" } });
  expect(duLieuKhop(xau)).toMatchObject({ fbp: null, fbc: null, ip: null });
  expect(docCookie("x=1; _fbp=abc", "_fbp")).toBe("abc");
  const g = goiPurchase({ ma_don: 100123, so_tien: 49000, loai: "sao", trang_thai: "da_tra", tra_luc: "2026-11-16T03:00:00Z" },
    { ma_don: 100123, fbp: "fb.1.1700000000000.123456789", fbc: null, ip: "203.0.113.5", ua: "UA" }) as { data: Record<string, unknown>[] };
  expect(g.data[0]).toMatchObject({ event_name: "Purchase", event_id: "don-100123", event_time: 1794798000, action_source: "website",
    user_data: { fbp: "fb.1.1700000000000.123456789", client_ip_address: "203.0.113.5", client_user_agent: "UA" },
    custom_data: { value: 49000, currency: "VND", content_type: "sao" } });
  expect(JSON.stringify(g)).not.toMatch(/email|"em"|"fn"|"db"/);
});

test("xác minh tên miền Meta: thẻ meta nằm trong <head> của HTML máy chủ (trang chủ + bản /en)", async ({ request }) => {
  for (const duong of ["/", "/en"]) {
    const html = await (await request.get(duong)).text();
    const head = html.slice(0, html.indexOf("</head>"));
    expect(head).toContain('<meta name="facebook-domain-verification" content="yc7164ai9ptzswsj79rn9aen2eduk8"/>');
  }
});
