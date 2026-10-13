// Golden giờ hoàng đạo — ORACLE lunar-typescript (MIT, có sẵn do iztro kéo theo). Chỉ sinh golden, không chạy runtime.
// 60 ngày liên tiếp (đủ 5 vòng 12 chi ngày) × 12 giờ: chi ngày, chi giờ, thần trực giờ (12 thần Hoàng/Hắc đạo), cát/hung.
// Giờ Tý lấy 00:30 (không lấy 23:xx để khỏi phụ thuộc quy ước đổi ngày).
// Chạy: cd engine/ziwei && node ../fixtures/_generate_gio_hoang_dao.mjs > ../fixtures/golden/gio_hoang_dao.json
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url.replace('/fixtures/', '/ziwei/'));
const { Solar } = require('lunar-typescript');
const VER = JSON.parse(readFileSync(new URL('../ziwei/node_modules/lunar-typescript/package.json', import.meta.url))).version;
const GIO = [[0, 30], [2, 0], [4, 0], [6, 0], [8, 0], [10, 0], [12, 0], [14, 0], [16, 0], [18, 0], [20, 0], [22, 0]];
const ngay = [];
const d0 = new Date(Date.UTC(2026, 9, 1));
for (let i = 0; i < 60; i++) {
  const d = new Date(d0.getTime() + i * 86400000);
  const [y, m, dd] = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
  const gio = GIO.map(([h, p]) => {
    const l = Solar.fromYmdHms(y, m, dd, h, p, 0).getLunar();
    return { chi: l.getTimeZhi(), than: l.getTimeTianShen(), cat: l.getTimeTianShenLuck() === '吉' };
  });
  const l = Solar.fromYmd(y, m, dd).getLunar();
  ngay.push({ ngay: `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`, chi_ngay: l.getDayZhi(), gio });
}
process.stdout.write(JSON.stringify({ _oracle: `lunar-typescript ${VER}`, ngay }, null, 1) + '\n');
