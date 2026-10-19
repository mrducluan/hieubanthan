// TV-V2 — sinh golden PHI TINH TỨ HOÁ dùng hàm của iztro làm ORACLE độc lập (chỉ chạy khi phát triển):
//   cd engine/ziwei && node _generate_phi_hoa_golden.mjs
// → engine/fixtures/golden/tuvi_phi_hoa_golden.json
//
// Oracle = các hàm của FunctionalPalace iztro: `mutagedPlaces()` (4 cung nơi 4 sao hoá của can cung nằm),
// `fliesTo(cung, [hoá])` (xác nhận từng đường bay), `selfMutaged([hoá])` (tự hoá), cộng `heavenlyStem`
// (Ngũ Hổ Độn) và `isOriginalPalace` (Lai nhân cung). Python (calc/tuvi_phi_hoa.py) tự tính lại từ bảng tứ hoá
// + vị trí sao, không gọi các hàm này.
//
// ĐẦU VÀO: ngày giờ lấy từ golden sẵn có (lasotuvi_60.json + ziwei_golden.json). an_sao.mjs của dự án thay âm
// lịch bằng lịch VIỆT; script này để iztro tự đổi theo lịch Trung Quốc → CHỈ giữ các ngày mà lịch Việt = lịch
// Trung (cả ngày sinh lẫn ngày hôm sau cho ca Tý muộn). Đã lọc bằng app.calc.tuvi_an_sao.lich_khac: bỏ
// 1985-03-13 (lịch lệch). tests/test_tuvi_phi_hoa.py kiểm lại điều kiện này cho mọi ca.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { astro } from 'iztro';

const require = createRequire(import.meta.url);
const IZTRO = require('iztro/package.json').version;
const G = new URL('../fixtures/golden/', import.meta.url);

const BO = new Set(['1985-03-13']);            // lịch Việt ≠ lịch Trung — không dùng làm golden
const lst = JSON.parse(readFileSync(new URL('lasotuvi_60.json', G), 'utf8')).cases
  .map((c) => ({ ngay: c.ngay, ti: c.ti, gioi_tinh: c.gioi_tinh, nguon: 'lasotuvi_60' }));
const zw = Object.values(JSON.parse(readFileSync(new URL('ziwei_golden.json', G), 'utf8')).cases)
  .map((c) => {
    const [y, m, d] = c.input.d.split('-').map(Number);
    const ngay = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return { ngay, ti: c.input.ti, gioi_tinh: c.input.g === 'female' ? 'nu' : 'nam', nguon: 'ziwei_golden' };
  });

const HOA = [['Lộc', '禄'], ['Quyền', '权'], ['Khoa', '科'], ['Kỵ', '忌']];
const cases = [];
for (const c of [...lst, ...zw]) {
  if (BO.has(c.ngay)) continue;
  const [y, m, d] = c.ngay.split('-').map(Number);
  const a = astro.bySolar(`${y}-${m}-${d}`, c.ti, c.gioi_tinh === 'nu' ? 'female' : 'male', true, 'vi-VN');
  const cung = a.palaces.map((_, i) => {
    const p = a.palace(i);            // getPalace gắn astrolabe → các hàm phi hoá dùng được
    const den = p.mutagedPlaces().map((x) => (x ? x.name : null));
    const phi = {}, tu = {};
    HOA.forEach(([vi, zh], k) => {
      if (den[k] && !p.fliesTo(den[k], [zh])) throw new Error(`oracle mâu thuẫn ${c.ngay} ${p.name} ${vi}`);
      phi[vi] = den[k];
      tu[vi] = p.selfMutaged([zh]);
    });
    return { ten: p.name, chi: p.earthlyBranch, can: p.heavenlyStem, la_lai_nhan: p.isOriginalPalace,
             phi, tu_hoa: tu };
  });
  cases.push({ ...c, can_nam: a.chineseDate.split(' ')[0], cung });
}

writeFileSync(new URL('tuvi_phi_hoa_golden.json', G), JSON.stringify({
  _nguon: `iztro ${IZTRO} (MIT) — FunctionalPalace.mutagedPlaces / fliesTo / selfMutaged / heavenlyStem / `
    + 'isOriginalPalace, astro.bySolar(…, fixLeap=true, vi-VN). Sinh bằng ziwei/_generate_phi_hoa_golden.mjs.',
  _lich: 'Chỉ các ngày lịch Việt (UTC+7) = lịch Trung (UTC+8) cho cả ngày sinh và ngày hôm sau (bỏ 1985-03-13).',
  cases,
}, null, 1) + '\n');
console.log(`Đã ghi ${cases.length} lá`);
