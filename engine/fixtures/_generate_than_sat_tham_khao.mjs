// EN-5.3 (2026-11-02) — golden đối chiếu cho thần sát THAM KHẢO Bát tự (Học Đường · Thiên La Địa Võng · Kim Thần).
// ORACLE shunshi-bazi-core 0.2.0 (MIT) + nạp âm lunar-typescript 1.8.6 (6tail, MIT) — CHỈ sinh golden, không chạy runtime,
// không chép mã. Chạy trên 5.000 tứ trụ của golden/battu_5000.json; chỉ ghi những phần quy tắc của oracle TRÙNG quy tắc
// engine (xem docs/QUYET-DINH-EN5-EN6.md):
//   kim = trụ ngày / giờ là Ất Sửu, Kỷ Tỵ, Quý Dậu (cách phổ thông — engine ghi ở `theo_cach_khac` của Kim Thần)
//   dv  = mệnh nạp âm năm Thủy / Thổ và chi NGÀY là Thìn / Tỵ (engine: Địa Võng ở trụ ngày)
//   chd = Chính Học Đường (Kim Tân Tỵ, Mộc Kỷ Hợi, Thủy Giáp Thân, Thổ Mậu Thân, Hỏa Bính Dần) ở tháng / ngày / giờ
// Chạy: mkdir /tmp/o && cd /tmp/o && npm i shunshi-bazi-core@0.2.0 lunar-typescript@1.8.6
//       ORACLE=/tmp/o node engine/fixtures/_generate_than_sat_tham_khao.mjs > engine/fixtures/golden/than_sat_tham_khao.json
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const O = process.env.ORACLE;
const require = createRequire(O + '/package.json');
const { LunarUtil } = require('lunar-typescript');
const { calcShenshaForPillars } = await import(pathToFileURL(O + '/node_modules/shunshi-bazi-core/dist/lib/shensha.js').href);
const VER = (p) => JSON.parse(readFileSync(O + '/node_modules/' + p + '/package.json')).version;
const G = JSON.parse(readFileSync(new URL('./golden/battu_5000.json', import.meta.url)));
const KEY = ['年柱', '月柱', '日柱', '时柱'];
const ca = [];
for (const c of G.ca) {
  const t = c[6];
  const nayin = LunarUtil.NAYIN[t.slice(0, 2)];
  const r = calcShenshaForPillars({ yearGan: t[0], yearZhi: t[1], monthGan: t[2], monthZhi: t[3], dayGan: t[4], dayZhi: t[5],
    timeGan: t[6], timeZhi: t[7], yearNayin: nayin, gender: c[5] });
  const idx = (name) => KEY.map((k, j) => (r[k].includes(name) ? j : -1)).filter((j) => j >= 0);
  ca.push([t, nayin.slice(-1), idx('金神'), r['日柱'].includes('地网') ? 1 : 0, idx('正学堂')]);
}
process.stdout.write(JSON.stringify({
  _nguon: `shunshi-bazi-core ${VER('shunshi-bazi-core')} (MIT) + nạp âm lunar-typescript ${VER('lunar-typescript')} (6tail, MIT)`,
  _dang: '[tứ trụ chữ Hán, hành nạp âm năm, trụ có Kim Thần (cách phổ thông), Địa Võng ở trụ ngày 1/0, trụ có Chính Học Đường]',
  ca }) + '\n');
