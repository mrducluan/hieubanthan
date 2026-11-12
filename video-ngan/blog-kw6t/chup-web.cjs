// KW-6T — chụp trang công cụ thật trên hieuban.com (khổ điện thoại 390 px ×2, locale vi-VN, ẩn thanh tab dưới) làm hình cho
// video HyperFrames. Thần số: nhập ví dụ trong bài (tên mẫu "Nguyễn Minh Anh", 24/10/1988 — không phải người thật).
//   cd web && node ../video-ngan/blog-kw6t/chup-web.cjs <thư mục tài sản>
const { chromium } = require("playwright");
const ra = process.argv[2];
const AN = `nav[class*="fixed"], [class*="fixed"][class*="bottom-0"], [class*="fixed"][class*="inset-x-0"][class*="bottom"] { display:none !important }`;
const TRANG = [
  ["xd-1988", "/tuoi-xong-dat/2027/tuoi-1988"], ["xd-nam", "/tuoi-xong-dat/2027"],
  ["ln-nam", "/xem-tuoi-lam-nha/2027"], ["ln-1988", "/xem-tuoi-lam-nha/2027/tuoi-1988"],
  ["ln-1986", "/xem-tuoi-lam-nha/2027/tuoi-1986"], ["sh-nam", "/xem-sao-han/2027"], ["ch-nam", "/nam/2027/cuoi-hoi"],
];
async function chup(p, ten) {
  await p.addStyleTag({ content: AN });
  await p.waitForTimeout(800);
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.screenshot({ path: `${ra}/web-${ten}.png`, clip: { x: 0, y: 0, width: 390, height: Math.min(h, 3600) }, fullPage: true });
  console.log(ten, h);
}
(async () => {
  const b = await chromium.launch(require("fs").existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "vi-VN", extraHTTPHeaders: { "accept-language": "vi-VN,vi;q=0.9" } });
  for (const [ten, d] of TRANG) {
    await p.goto("https://hieuban.com" + d, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
    await chup(p, ten);
  }
  // Thần số: nhập ví dụ trong bài (tên mẫu, không phải người thật)
  await p.goto("https://hieuban.com/than-so", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await p.fill('input[name="ho-ten"]', "Nguyễn Minh Anh");
  await p.fill('input[name="ngay-sinh-ngay"]', "24");
  await p.fill('input[name="ngay-sinh-thang"]', "10");
  await p.fill('input[name="ngay-sinh-nam"]', "1988");
  await p.click('button[type="submit"]');
  await p.waitForTimeout(6000);
  await p.waitForLoadState("networkidle").catch(() => {});
  await chup(p, "ts-ket-qua");
  await b.close();
})();
