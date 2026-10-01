// Golden Bát tự MỞ RỘNG (VZ-3): nạp âm, trường sinh nhật chủ theo 4 chi, tuần không — cùng bộ ca với battu.json.
// Gốc: Golden Bát tự + tiết khí — ORACLE lunar-typescript 1.8.6 (6tail, MIT; có sẵn trong
// engine/ziwei/node_modules do iztro kéo theo). CHỈ dùng để sinh golden, không chạy runtime.
// Chạy: cd engine/ziwei && node ../fixtures/_generate_battu_mo_rong.mjs > ../fixtures/golden/battu_mo_rong.json
//
// lunar-typescript tính theo giờ Bắc Kinh (UTC+8). Để so công bằng với engine (UTC+7):
//  - tiết khí: đổi về UTC (trừ 8 giờ) rồi so với sai số cho phép;
//  - tứ trụ: chỉ lấy ca cách tiết (节) ≥ 2 ngày, nên trụ năm/tháng không phụ thuộc múi giờ;
//    trụ ngày/giờ lấy theo giờ đồng hồ nhập vào (giống nhau ở cả hai bên).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url.replace('/fixtures/', '/ziwei/'));
const { Solar, Lunar } = require('lunar-typescript');
import { readFileSync } from 'node:fs';
const VER = JSON.parse(readFileSync(new URL('../ziwei/node_modules/lunar-typescript/package.json', import.meta.url))).version;

const TEN = ['春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露',
             '秋分','寒露','霜降','立冬','小雪','大雪','冬至','小寒','大寒','立春','雨水','惊蛰'];
const pad = (n) => String(n).padStart(2, '0');
const utc = (s) => { const d = new Date(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour() - 8, s.getMinute(), s.getSecond()));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`; };

const tiet = [];
for (let y = 1901; y <= 2099; y += 7) {
  const t = Lunar.fromYmd(y, 6, 1).getJieQiTable();
  TEN.forEach((n, i) => { const s = t[n]; if (s && s.getYear() === y) tiet.push({ nam: y, kinh_do: i * 15, utc: utc(s) }); });
}

// Bộ ca: ngày giả ngẫu nhiên tất định (LCG), giờ HH:30 hoặc HH:10, bỏ ca sát tiết.
let seed = 20260930;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const JIE = ['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒'];
function satTiet(y, m, d) {
  const x = Date.UTC(y, m - 1, d);
  for (const yy of [y - 1, y, y + 1]) {
    const t = Lunar.fromYmd(yy, 6, 1).getJieQiTable();
    for (const n of JIE) { const s = t[n]; if (!s) continue;
      if (Math.abs(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay()) - x) <= 2 * 86400000) return true; }
  }
  return false;
}
const ca = [];
while (ca.length < 40) {
  const y = 1925 + rnd(100), m = 1 + rnd(12), d = 1 + rnd(28), h = rnd(23), mi = [10, 30, 50][rnd(3)];
  if (satTiet(y, m, d)) continue;
  ca.push({ y, m, d, h, mi, gioi_tinh: rnd(2) ? 'nam' : 'nu' });
}
ca.push({ y: 1990, m: 5, d: 17, h: 12, mi: 30, gioi_tinh: 'nam' });
ca.push({ y: 1995, m: 6, d: 15, h: 23, mi: 30, gioi_tinh: 'nam', ghi_chu: 'dạ Tý: trụ ngày hôm đó, trụ giờ theo ngày sau (sect 2)' });

const cases = ca.map((c) => {
  const s = Solar.fromYmdHms(c.y, c.m, c.d, c.h, c.mi, 0);
  const ec = s.getLunar().getEightChar(); ec.setSect(2);
  return {
    input: { ngay: `${c.y}-${pad(c.m)}-${pad(c.d)}`, gio: `${pad(c.h)}:${pad(c.mi)}`, gioi_tinh: c.gioi_tinh },
    expect: {
      tru: [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()],
      nap_am: [ec.getYearNaYin(), ec.getMonthNaYin(), ec.getDayNaYin(), ec.getTimeNaYin()],
      truong_sinh: [ec.getYearDiShi(), ec.getMonthDiShi(), ec.getDayDiShi(), ec.getTimeDiShi()],
      khong_vong_ngay: ec.getDayXunKong(),
      khong_vong_nam: ec.getYearXunKong(),
    },
  };
});
process.stdout.write(JSON.stringify({ _nguon: `lunar-typescript ${VER} (6tail, MIT) — oracle sinh golden, sect 2`, cases }, null, 1) + '\n');
