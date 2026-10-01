// Golden nạp âm 60 hoa giáp — ORACLE lunar-typescript (MIT, có sẵn do iztro kéo theo). Chỉ sinh golden.
// Chạy: cd engine/ziwei && node ../fixtures/_generate_can_chi_golden.mjs > ../fixtures/golden/can_chi.json
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url.replace('/fixtures/', '/ziwei/'));
const { Lunar } = require('lunar-typescript');
const VER = JSON.parse(readFileSync(new URL('../ziwei/node_modules/lunar-typescript/package.json', import.meta.url))).version;
const nap_am = [];
for (let i = 0; i < 60; i++) {
  const l = Lunar.fromYmd(1984 + i, 6, 1);   // 1984 = Giáp Tý
  nap_am.push({ chi_so: i, can_chi: l.getYearInGanZhi(), nap_am: l.getYearNaYin() });
}
process.stdout.write(JSON.stringify({ _oracle: `lunar-typescript ${VER}`, nap_am }, null, 1) + '\n');
