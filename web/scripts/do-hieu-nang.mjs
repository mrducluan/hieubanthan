// PERF-1 — đo "lab" kiểu điện thoại tầm trung: CPU chậm 4 lần, mạng 4G chậm (150 ms, 1,6 Mbps).
// Chạy trên bản build production: `next build && next start -p 3001` (cần engine), rồi
//   PW_CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/do-hieu-nang.mjs [http://127.0.0.1:3001]
// In FCP/LCP/TBT/CLS + số byte (chưa nén) JS/CSS/font từng trang. Số dao động ±30% giữa các lần — so cùng máy.
import { chromium } from "@playwright/test";
const goc = process.argv[2] ?? "http://127.0.0.1:3001";
const ds = ["/", "/kham-pha", "/kien-thuc", "/kien-thuc/tu-vi/sao-tu-vi", "/kien-thuc/hop-so/so-chu-dao-3-va-6",
  "/phong-thuy/tuoi-1985-nam", "/tu-dien", "/than-so", "/tu-vi", "/bat-tu", "/phong-thuy", "/la-so-mau"];
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH });
for (const d of ds) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 2, isMobile: true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.addInitScript(() => {
    window.__lcp = 0; window.__cls = 0; window.__tbt = 0;
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__tbt += Math.max(0, e.duration - 50); }).observe({ type: "longtask", buffered: true });
  });
  let js = 0, css = 0, font = 0, tong = 0;
  p.on("response", async r => { try { const len = Number((await r.headerValue("content-length")) ?? 0) || (await r.body()).length; const t = r.request().resourceType(); tong += len; if (t === "script") js += len; if (t === "stylesheet") css += len; if (t === "font") font += len; } catch {} });
  const t0 = Date.now();
  await p.goto(goc + d, { waitUntil: "load" });
  await p.waitForTimeout(2500);
  const m = await p.evaluate(() => { const n = performance.getEntriesByType("navigation")[0]; const fcp = performance.getEntriesByName("first-contentful-paint")[0]; return { ttfb: n.responseStart, fcp: fcp?.startTime ?? 0, lcp: window.__lcp, cls: window.__cls, tbt: window.__tbt, load: n.loadEventEnd }; });
  console.log([d.padEnd(38), `FCP ${m.fcp.toFixed(0)}`, `LCP ${m.lcp.toFixed(0)}`, `TBT ${m.tbt.toFixed(0)}`, `CLS ${m.cls.toFixed(3)}`, `load ${m.load.toFixed(0)}`, `JS ${(js/1024).toFixed(0)}k`, `CSS ${(css/1024).toFixed(0)}k`, `font ${(font/1024).toFixed(0)}k`, `tổng ${(tong/1024).toFixed(0)}k`].join("  "));
  await ctx.close();
}
await b.close();
