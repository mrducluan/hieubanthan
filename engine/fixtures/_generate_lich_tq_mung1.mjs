// EN-6 — golden MỌI ngày mùng 1 âm lịch Trung Quốc (UTC+8) 1901–2099 + tháng / năm / nhuận.
// ORACLE lunar-typescript (6tail, MIT; có sẵn trong engine/ziwei/node_modules) — CHỈ sinh golden, không chạy runtime.
// Engine so bằng lunar.solar_to_lunar(..., tz=8) (thuật toán Hồ Ngọc Đức, kinh tuyến 120°Đ).
// Chạy: cd engine/ziwei && node ../fixtures/_generate_lich_tq_mung1.mjs > ../fixtures/golden/lich_tq_mung1.json
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url.replace('/fixtures/', '/ziwei/'));
const { LunarYear, Solar } = require('lunar-typescript');
const VER = JSON.parse(readFileSync(new URL('../ziwei/node_modules/lunar-typescript/package.json', import.meta.url))).version;
const thay = new Map();
for (let y = 1901; y <= 2099; y++) {
  for (const m of LunarYear.fromYear(y).getMonths()) {
    const s = Solar.fromJulianDay(m.getFirstJulianDay());
    if (s.getYear() < 1901 || s.getYear() > 2099) continue;
    thay.set(s.toYmd(), [s.toYmd(), m.getYear(), Math.abs(m.getMonth()), m.getMonth() < 0 ? 1 : 0]);
  }
}
const ds = [...thay.values()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
process.stdout.write(JSON.stringify({ _nguon: `lunar-typescript ${VER} (6tail, MIT) — mùng 1 âm lịch Trung Quốc`,
  _dang: '[ngày dương, năm âm, tháng âm, nhuận 0/1]', mung1: ds }) + '\n');
