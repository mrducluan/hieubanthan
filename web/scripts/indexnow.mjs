#!/usr/bin/env node
// Báo IndexNow (Bing, Yandex, Seznam, Naver…) toàn bộ URL trong sitemap — chạy sau mỗi lần deploy (workflow
// .github/workflows/indexnow.yml). Khoá đọc từ chính trang /indexnow.txt nên luôn khớp bản đang chạy.
//   node scripts/indexnow.mjs https://hieuban.com
const goc = (process.argv[2] ?? "https://hieuban.com").replace(/\/$/, "");
const khoa = (await (await fetch(`${goc}/indexnow.txt`)).text()).trim();
if (!/^[a-f0-9]{32}$/.test(khoa)) { console.error("Không đọc được khoá /indexnow.txt"); process.exit(1); }
const sm = await (await fetch(`${goc}/sitemap.xml`)).text();
const urlList = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.startsWith(goc));
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(goc).host, key: khoa, keyLocation: `${goc}/indexnow.txt`, urlList }),
});
console.log(`IndexNow: gửi ${urlList.length} URL → HTTP ${r.status}`);
process.exit(r.status === 200 || r.status === 202 ? 0 : 1);
