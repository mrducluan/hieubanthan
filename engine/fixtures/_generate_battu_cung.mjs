// EN-5.3 — golden Thai nguyên · Mệnh cung · Thân cung · tiểu vận (tuổi mụ 1…12) cho CÙNG bộ ca của battu.json.
// ORACLE lunar-typescript (6tail, MIT; có sẵn trong engine/ziwei/node_modules do iztro kéo theo) — CHỈ sinh golden,
// không chạy runtime. Chạy: cd engine/ziwei && node ../fixtures/_generate_battu_cung.mjs > ../fixtures/golden/battu_cung.json
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url.replace('/fixtures/', '/ziwei/'));
const { Solar } = require('lunar-typescript');
const VER = JSON.parse(readFileSync(new URL('../ziwei/node_modules/lunar-typescript/package.json', import.meta.url))).version;
const goc = JSON.parse(readFileSync(new URL('./golden/battu.json', import.meta.url)));

const cases = goc.cases.map((c) => {
  const [y, m, d] = c.input.ngay.split('-').map(Number);
  const [h, mi] = c.input.gio.split(':').map(Number);
  const ec = Solar.fromYmdHms(y, m, d, h, mi, 0).getLunar().getEightChar(); ec.setSect(2);
  const yun = ec.getYun(c.input.gioi_tinh === 'nam' ? 1 : 0, 2);
  const tieu = yun.getDaYun(1)[0].getXiaoYun(12).map((x) => ({ tuoi_mu: x.getAge(), gz: x.getGanZhi() }));
  return { input: c.input, expect: { tru: c.expect.tru, thai_nguyen: ec.getTaiYuan(), menh_cung: ec.getMingGong(),
                                      than_cung: ec.getShenGong(), tieu_van: tieu } };
});
process.stdout.write(JSON.stringify({ _nguon: `lunar-typescript ${VER} (6tail, MIT) — oracle sinh golden, sect 2`, cases }, null, 1) + '\n');
