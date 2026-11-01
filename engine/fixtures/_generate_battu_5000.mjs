// EN-6 — golden 5.000 TỨ TRỤ (năm · tháng · ngày · giờ) + chiều đại vận, ngày giờ giả ngẫu nhiên tất định 1901–2099,
// GỒM ca 23:xx (dạ Tý, sect 2). ORACLE lunar-typescript (6tail, MIT) — CHỈ sinh golden, không chạy runtime.
// Giờ nhập là giờ Bắc Kinh (UTC+8) → engine so bằng battu.la_so(..., utc_lich=8) (EN-6 BI-3): cùng thời điểm tuyệt đối
// để so mốc tiết, cùng giờ đồng hồ cho trụ ngày / giờ. Bỏ ca cách giao tiết < 3 phút (sai số tiết khí của engine ≤ 0,63').
// Chạy: cd engine/ziwei && node ../fixtures/_generate_battu_5000.mjs > ../fixtures/golden/battu_5000.json
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url.replace('/fixtures/', '/ziwei/'));
const { Solar, Lunar } = require('lunar-typescript');
const VER = JSON.parse(readFileSync(new URL('../ziwei/node_modules/lunar-typescript/package.json', import.meta.url))).version;
const JIE = ['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒'];
let seed = 20261101;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const ms = (s) => Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond());
const satTiet = (y, x) => {
  for (const yy of [y - 1, y, y + 1]) {
    const t = Lunar.fromYmd(yy, 6, 1).getJieQiTable();
    for (const n of JIE) { const s = t[n]; if (s && Math.abs(ms(s) - x) < 3 * 60000) return true; }
  }
  return false;
};
const ca = [];
while (ca.length < 5000) {
  const y = 1901 + rnd(199), m = 1 + rnd(12), d = 1 + rnd(28);
  const h = rnd(10) === 0 ? 23 : rnd(24), mi = rnd(60), gt = rnd(2);
  if (satTiet(y, Date.UTC(y, m - 1, d, h, mi))) continue;
  const ec = Solar.fromYmdHms(y, m, d, h, mi, 0).getLunar().getEightChar(); ec.setSect(2);
  const fw = ec.getYun(gt, 2).isForward() ? 1 : 0;
  ca.push([y, m, d, h, mi, gt, ec.getYear() + ec.getMonth() + ec.getDay() + ec.getTime(), fw]);
}
process.stdout.write(JSON.stringify({ _nguon: `lunar-typescript ${VER} (6tail, MIT) — sect 2, giờ Bắc Kinh`,
  _dang: '[năm, tháng, ngày, giờ, phút, nam=1/nữ=0, tứ trụ chữ Hán, đại vận thuận 1/0]', ca }) + '\n');
