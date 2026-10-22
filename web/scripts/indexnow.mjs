#!/usr/bin/env node
// Báo IndexNow (Bing, Yandex, Seznam, Naver…) toàn bộ URL trong sitemap — chạy sau mỗi lần deploy (workflow
// .github/workflows/indexnow.yml). Khoá đọc từ chính trang /indexnow.txt nên luôn khớp bản đang chạy.
//   node scripts/indexnow.mjs https://hieuban.com
//   node scripts/indexnow.mjs https://hieuban.com --ngay   # SEO-L6: hằng ngày — trang ngày tốt 30 ngày tới + trang hôm nay
const goc = (process.argv[2] ?? "https://hieuban.com").replace(/\/$/, "");
const chiNgay = process.argv.includes("--ngay");
const khoa = (await (await fetch(`${goc}/indexnow.txt`)).text()).trim();
if (!/^[a-f0-9]{32}$/.test(khoa)) { console.error("Không đọc được khoá /indexnow.txt"); process.exit(1); }
const loc = async (duong) => [...(await (await fetch(`${goc}${duong}`)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
let urlList;
if (chiNgay) {
  const homNay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const den = new Date(Date.parse(`${homNay}T00:00:00Z`) + 30 * 86_400_000).toISOString().slice(0, 10);
  urlList = [`${goc}/xem-ngay-tot`, `${goc}/hom-nay`, ...(await loc("/sitemap-ngay.xml")).filter((u) => {
    const d = u.match(/(\d{4}-\d{2}-\d{2})$/)?.[1];
    return d && d >= homNay && d <= den;
  })];
} else {
  urlList = [...(await loc("/sitemap.xml")), ...(await loc("/sitemap-ngay.xml"))];
}
urlList = urlList.filter((u) => u.startsWith(goc)).slice(0, 10_000);   // giới hạn một lần gửi của IndexNow
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(goc).host, key: khoa, keyLocation: `${goc}/indexnow.txt`, urlList }),
});
console.log(`IndexNow: gửi ${urlList.length} URL → HTTP ${r.status}`);
process.exit(r.status === 200 || r.status === 202 ? 0 : 1);
