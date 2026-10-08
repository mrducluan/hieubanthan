// Golden lưu nguyệt (TV-LN) — iztro 2.6.0 chạy cục bộ: astro.horoscope().monthly / .age / .yearly.
// iztro tính tháng hạn theo Đẩu Quân từ lưu niên Thái Tuế (流年地支逆数到生月，再顺数到生时 = 正月).
// Golden ghi cả âm lịch iztro dùng (của ngày sinh + ngày xem) để test Python so CÔNG THỨC, không so lịch.
// Chạy: cd engine/ziwei && node ../fixtures/_generate_luu_nguyet_golden.mjs > ../fixtures/golden/luu_nguyet_iztro.json
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url.replace('/fixtures/', '/ziwei/'));
const { astro } = require('iztro');
const IZTRO = require('iztro/package.json').version;
const conv = require('lunar-lite/lib/convertor');

// Bộ sinh giả ngẫu nhiên cố định (LCG) → golden tái lập được.
let s = 20261008;
const r = (n) => { s = (s * 1103515245 + 12345) % 2147483648; return s % n; };
const LA = [
  { id: 'nam_1990_ngo', d: '1990-5-17', ti: 6, g: 'male' },
  { id: 'nu_2004_nhuan_nua_sau', d: '2004-4-10', ti: 7, g: 'female' },   // 21/2 nhuận Giáp Thân (nửa sau)
  { id: 'nu_2004_nhuan_nua_dau', d: '2004-3-21', ti: 7, g: 'female' },   // 1/2 nhuận
  { id: 'nam_muon_ty', d: '1995-6-15', ti: 12, g: 'male' },
];
for (let i = 0; i < 36; i++) {
  LA.push({ id: `ngau_nhien_${i}`, d: `${1940 + r(70)}-${1 + r(12)}-${1 + r(28)}`, ti: r(13), g: r(2) ? 'male' : 'female' });
}
// Ngày xem: đủ tháng thường, đầu/cuối năm âm, năm có tháng nhuận (2025: nhuận 6; 2023: nhuận 2).
const NGAY_XEM = [...Array.from({ length: 12 }, (_, i) => `2026-${i + 1}-20`),
  '2027-1-20', '2025-7-30', '2025-8-20', '2023-3-25', '2023-4-15'];
const out = { _nguon: `iztro ${IZTRO} astro.horoscope (流月 = 斗君)`, cases: [] };
for (const c of LA) {
  const a = astro.bySolar(c.d, c.ti, c.g, true, 'zh-CN');
  const sinh = conv.solar2lunar(c.d);
  for (const x of NGAY_XEM) {
    const h = a.horoscope(x);
    const xem = conv.solar2lunar(x);
    out.cases.push({
      id: c.id, ngay: c.d, ti: c.ti, gioi_tinh: c.g, ngay_xem: x,
      sinh_am: { thang: sinh.lunarMonth, ngay: sinh.lunarDay, nhuan: sinh.isLeap },
      xem_am: { nam: xem.lunarYear, thang: xem.lunarMonth, ngay: xem.lunarDay, nhuan: xem.isLeap },
      // chỉ số iztro: 0 = cung Dần
      luu_nien: h.yearly.index, tieu_han: h.age.index, luu_nguyet: h.monthly.index,
      can_chi_thang: h.monthly.heavenlyStem + h.monthly.earthlyBranch, tu_hoa_thang: h.monthly.mutagen,
    });
  }
}
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
