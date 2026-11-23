// QC-G (2026-11-23): đo chuyển đổi Google Ads — Consent Mode quảng cáo theo lựa chọn cookie, bắt gclid ngay khi vào trang,
// dataLayer chỉ mã + giá trị, tệp chuyển đổi offline, tiêu đề theo ?kw= (danh sách cố định), email băm cho Meta / Google.
import { createHash } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { nguonQc } from "../lib/nguon-qc";
import { docMaGoogle, googlePurchase, googleSuKien } from "../lib/google-qc";
import { bamEmail, dungMatKhau, gioVn, locMaGoogle, taoCsv } from "../lib/google-offline";
import { goiPurchase } from "../lib/meta-capi";
import { dauTheoKw } from "../lib/kw-qc";

const GCLID = "Cj0KCQiA_test-GCLID123";

async function consentMacDinh(page: Page): Promise<Record<string, string> | null> {
  await page.waitForFunction(() => Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer));
  return page.evaluate(() => {
    for (const x of (window as unknown as { dataLayer: unknown[] }).dataLayer) {
      const a = Array.from(x as ArrayLike<unknown>);
      if (a[0] === "consent" && a[1] === "default") return a[2] as Record<string, string>;
    }
    return null;
  });
}

test("chưa chọn cookie: quảng cáo đo lường granted, cá nhân hoá denied; lưu gclid 90 ngày", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("hbt.dong-y-cookie.v1"));
  await page.route(/google|doubleclick/, (r) => r.abort());
  await page.goto(`/tu-dien?gclid=${GCLID}`);
  const c = await consentMacDinh(page);
  expect(c).toMatchObject({ analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" });
  const luu = await page.evaluate(() => localStorage.getItem("hbt.gclid"));
  expect(docMaGoogle(luu)).toEqual({ gclid: GCLID });
});

test("đã từ chối cookie: mọi quảng cáo denied, KHÔNG lưu gclid", async ({ page }) => {
  await page.route(/google|doubleclick/, (r) => r.abort());
  await page.goto(`/tu-dien?gclid=${GCLID}`);   // storageState mặc định đã "từ chối"
  const c = await consentMacDinh(page);
  expect(c).toMatchObject({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  expect(await page.evaluate(() => localStorage.getItem("hbt.gclid"))).toBeNull();
});

test("gclid sai định dạng không được lưu", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("hbt.dong-y-cookie.v1"));
  await page.route(/google|doubleclick/, (r) => r.abort());
  await page.goto(`/tu-dien?gclid=${encodeURIComponent("<script>x</script>")}`);
  await consentMacDinh(page);
  expect(await page.evaluate(() => localStorage.getItem("hbt.gclid"))).toBeNull();
});

test("docMaGoogle: hết hạn 90 ngày, khoá lạ, mã sai → null", () => {
  const now = 1_800_000_000_000;
  expect(docMaGoogle(JSON.stringify({ k: "gbraid", v: GCLID, t: now - 1000 }), now)).toEqual({ gbraid: GCLID });
  expect(docMaGoogle(JSON.stringify({ k: "gclid", v: GCLID, t: now - 91 * 86_400_000 }), now)).toBeNull();
  expect(docMaGoogle(JSON.stringify({ k: "fbclid", v: GCLID, t: now }), now)).toBeNull();
  expect(docMaGoogle(JSON.stringify({ k: "gclid", v: "ngắn", t: now }), now)).toBeNull();
  expect(docMaGoogle("không phải json", now)).toBeNull();
});

test("nguonQc nhận quảng cáo Google (gclid / gbraid / utm cpc), không nhận link google thường", () => {
  expect(nguonQc(`/tu-vi?gclid=${GCLID}`)).toBe("google");
  expect(nguonQc(`/tu-vi?wbraid=${GCLID}`)).toBe("google");
  expect(nguonQc("/tu-vi?utm_source=google&utm_medium=cpc")).toBe("google");
  expect(nguonQc("/tu-vi?utm_source=google")).toBeNull();
  expect(nguonQc("/?fbclid=abc")).toBe("meta");
});

test("locMaGoogle chỉ nhận mã đúng định dạng", () => {
  expect(locMaGoogle({ gclid: GCLID })).toEqual({ gclid: GCLID, gbraid: null, wbraid: null });
  expect(locMaGoogle({ gclid: "a b" })).toBeNull();
  expect(locMaGoogle(null)).toBeNull();
  expect(locMaGoogle({ gclid: 123 })).toBeNull();
});

test("bamEmail: chuẩn hoá + SHA-256; bỏ email đại diện Zalo và chuỗi không phải email", () => {
  const h = createHash("sha256").update("ban@gmail.com").digest("hex");
  expect(bamEmail("  Ban@Gmail.com ")).toBe(h);
  expect(bamEmail("zalo-123456@hieuban.com")).toBeNull();
  expect(bamEmail("khong-phai-email")).toBeNull();
  expect(bamEmail(null)).toBeNull();
});

test("taoCsv: đúng mẫu Google Ads, giờ Việt Nam, bỏ dòng không có gclid / không có tiền", () => {
  const csv = taoCsv([
    { gclid: GCLID, email: "a".repeat(64), tra_luc: "2026-12-01T03:04:05Z", so_tien: 99000 },
    { gclid: "sai", email: null, tra_luc: "2026-12-01T03:04:05Z", so_tien: 99000 },
    { gclid: GCLID, email: null, tra_luc: "2026-12-01T03:04:05Z", so_tien: 0 },
  ], "Nap Sao", true);
  const dong = csv.trim().split("\r\n");
  expect(dong[0]).toBe("Parameters:TimeZone=Asia/Ho_Chi_Minh");
  expect(dong[1]).toBe("Google Click ID,Email,Conversion Name,Conversion Time,Conversion Value,Conversion Currency");
  expect(dong.slice(2)).toEqual([`${GCLID},${"a".repeat(64)},Nap Sao,2026-12-01 10:04:05,99000,VND`]);
  expect(taoCsv([], "Nap, \"Sao\"", false).split("\r\n")[1]).not.toContain("Email");
  expect(gioVn("2026-12-31T20:00:00Z")).toBe("2027-01-01 03:00:00");
});

test("dungMatKhau: chưa đặt env / mật khẩu ngắn → luôn từ chối; đúng cặp → nhận", () => {
  const cu = { u: process.env.GOOGLE_OFFLINE_USER, p: process.env.GOOGLE_OFFLINE_PASS };
  try {
    delete process.env.GOOGLE_OFFLINE_USER; delete process.env.GOOGLE_OFFLINE_PASS;
    expect(dungMatKhau(`Basic ${Buffer.from(":").toString("base64")}`)).toBe(false);
    process.env.GOOGLE_OFFLINE_USER = "gads"; process.env.GOOGLE_OFFLINE_PASS = "ngan";
    expect(dungMatKhau(`Basic ${Buffer.from("gads:ngan").toString("base64")}`)).toBe(false);
    process.env.GOOGLE_OFFLINE_PASS = "mat-khau-dai-hon-16-ky-tu";
    expect(dungMatKhau(`Basic ${Buffer.from("gads:mat-khau-dai-hon-16-ky-tu").toString("base64")}`)).toBe(true);
    expect(dungMatKhau(`Basic ${Buffer.from("gads:sai").toString("base64")}`)).toBe(false);
    expect(dungMatKhau(null)).toBe(false);
  } finally {
    if (cu.u === undefined) delete process.env.GOOGLE_OFFLINE_USER; else process.env.GOOGLE_OFFLINE_USER = cu.u;
    if (cu.p === undefined) delete process.env.GOOGLE_OFFLINE_PASS; else process.env.GOOGLE_OFFLINE_PASS = cu.p;
  }
});

test("Meta CAPI: email băm vào user_data.em; chuỗi không phải băm hex bị bỏ", () => {
  const don = { ma_don: 7, so_tien: 59000, trang_thai: "da_tra", tra_luc: "2026-12-01T00:00:00Z" };
  const dong = { ma_don: 7, fbp: null, fbc: null, ip: null, ua: null };
  const h = "b".repeat(64);
  expect((goiPurchase(don, dong, undefined, h).data as { user_data: Record<string, unknown> }[])[0]!.user_data.em).toEqual([h]);
  expect((goiPurchase(don, dong, undefined, "ban@gmail.com").data as { user_data: Record<string, unknown> }[])[0]!.user_data.em).toBeUndefined();
});

test("dauTheoKw: chỉ mã cố định của đúng trang; mã lạ / chữ có ký tự đặc biệt → null", () => {
  expect(dauTheoKw("/bat-tu", "thieu-hanh")?.h1).toBe("Mệnh bạn thiếu hành gì?");
  expect(dauTheoKw("/tu-vi", "thieu-hanh")).toBeNull();
  expect(dauTheoKw("/tu-vi", "<b>x</b>")).toBeNull();
  expect(dauTheoKw("/tu-vi", undefined)).toBeNull();
});

test("?kw= đổi H1 theo danh sách cố định, canonical giữ nguyên; mã lạ giữ H1 gốc", async ({ page }) => {
  await page.goto("/bat-tu?kw=thieu-hanh");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mệnh bạn thiếu hành gì?");
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/bat-tu$/);
  await page.goto("/bat-tu?kw=%3Cscript%3E");
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Mệnh bạn thiếu hành gì?");
  await expect(page.locator("body")).not.toContainText("<script>");
});

test("googleSuKien / googlePurchase: dataLayer chỉ mã + giá trị VND, không tên / ngày sinh", () => {
  const g = globalThis as unknown as { window?: { dataLayer: Record<string, unknown>[] } };
  const cu = g.window;
  g.window = { dataLayer: [] };
  try {
    googleSuKien("unlock_clicked", { kind: "bam", mo_dun: "tuvi", ten: "Nguyễn Văn A" } as never, 69000);
    googleSuKien("checkout_started", { kind: "sao", goi: "lan_dau" }, 59000);
    googleSuKien("advisor_question_completed", { mo_dun: "tuvi" }, null);   // không có trong bảng → không đẩy
    googlePurchase(59000, 42, "sao");
    const dl = g.window.dataLayer;
    expect(dl[0]).toEqual({ event: "hbt_mo_khoa", mo_dun: "tuvi", value: 69000, currency: "VND" });
    expect(dl[1]).toEqual({ event: "hbt_thanh_toan", goi: "lan_dau", value: 59000, currency: "VND" });
    expect(dl[2]).toEqual({ ecommerce: null });
    expect(dl[3]).toMatchObject({ event: "purchase", ecommerce: { transaction_id: "don-42", value: 59000, currency: "VND" } });
    expect(dl[4]).toMatchObject({ event: "hbt_nap", value: 59000, transaction_id: "don-42" });
    expect(JSON.stringify(dl)).not.toContain("Nguyễn");
    expect(dl).toHaveLength(5);
  } finally {
    if (cu === undefined) delete g.window; else g.window = cu;
  }
});
