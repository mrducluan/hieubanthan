// Q-I1 + Q-I2 (chủ dự án duyệt 2026-11-05, docs/AUDIT-INDEX-2026-11.md): thu cửa sổ index trang ngày (−7…+90) và
// trang "ngày tốt {việc} tháng" (tháng này…+6); Googlebot nhận trang dạng luồng (không chờ metadata) như mặc định Next,
// các bot không chạy JS vẫn nhận <title>/canonical ngay trong <head>.
import { expect, test } from "@playwright/test";
import { NGAY_SAU, VIEC_THANG_SAU, ngayDangIndex, viecThangIndex } from "../lib/hoang-lich";

const UA = {
  googlebot: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  googlebotMay: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/130.0.0.0 Safari/537.36",
  kiemTraUrl: "Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)",
  gpt: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
  bing: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  claude: "Mozilla/5.0 (compatible; Claude-SearchBot/1.0)",
  zalo: "Mozilla/5.0 Zalo/1.0",
  ads: "AdsBot-Google (+http://www.google.com/adsbot.html)",
  nguoi: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
};

test("Q-I1: cửa sổ index trang ngày −7…+90, việc-tháng tháng này…+6", () => {
  expect(NGAY_SAU).toBe(90);
  expect(VIEC_THANG_SAU).toBe(6);
  expect(ngayDangIndex("2027-02-03", "2026-11-05")).toBe(true);   // +90
  expect(ngayDangIndex("2027-02-04", "2026-11-05")).toBe(false);  // +91
  expect(ngayDangIndex("2026-10-29", "2026-11-05")).toBe(true);   // −7
  expect(viecThangIndex(2026, 11, 5, "2026-11-05")).toBe(true);
  expect(viecThangIndex(2027, 5, 5, "2026-11-05")).toBe(true);    // +6 tháng
  expect(viecThangIndex(2027, 6, 5, "2026-11-05")).toBe(false);   // +7 tháng
  expect(viecThangIndex(2027, 5, 0, "2026-11-05")).toBe(false);   // 0 ngày tốt (AUD-Q3)
});

test("Q-I2: Googlebot + Kiểm tra URL không nằm trong htmlLimitedBots; bot không chạy JS vẫn nằm trong", async () => {
  // @ts-expect-error — next.config.mjs không có tệp khai kiểu
  const { default: c } = (await import("../next.config.mjs")) as { default: { htmlLimitedBots: RegExp } };
  const re = new RegExp(c.htmlLimitedBots.source, "i");                // đúng cách Next đọc cấu hình
  for (const k of ["googlebot", "googlebotMay", "kiemTraUrl", "nguoi"] as const) expect(re.test(UA[k]), k).toBe(false);
  for (const k of ["gpt", "bing", "claude", "zalo", "ads"] as const) expect(re.test(UA[k]), k).toBe(true);
});

test("Q-I2: bot không chạy JS nhận <title> + canonical trong <head>; Googlebot vẫn có đủ hai thẻ", async ({ request }) => {
  const duong = "/than-so/y-nghia-so/so-7";
  const gpt = await (await request.get(duong, { headers: { "user-agent": UA.gpt } })).text();
  const dau = gpt.slice(0, gpt.indexOf("</head>"));
  expect(dau).toMatch(/<title>[^<]+<\/title>/);
  expect(dau).toContain(`rel="canonical"`);
  const r = await request.get(duong, { headers: { "user-agent": UA.googlebot } });
  expect(r.status()).toBe(200);
  const gb = await r.text();
  expect(gb).toMatch(/<title>[^<]+<\/title>/);
  expect(gb).toContain(`rel="canonical"`);
  expect(gb).toMatch(/<meta name="robots" content="index/);
});
