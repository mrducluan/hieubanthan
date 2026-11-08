// QTE-2 — liệt kê MỌI tên tiếng Việt iztro (vi-VN) có thể trả ra (sao, vòng, cung, độ sáng, hoá, cục) để test bảng tên
// tiếng Anh `kb/data/ten_en.json` phủ đủ. Chạy: node ziwei/_generate_ten_vi.mjs > fixtures/golden/iztro_ten_vi.json
// Không dùng tên en-US của iztro ("emperor", "spark", "considery(Y)") — không phải cách gọi của cộng đồng nói tiếng Anh.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { astro } = require('iztro');
const S = { chinh_tinh: new Set(), phu_tinh: new Set(), tap_dieu: new Set(), truong_sinh: new Set(), bac_si: new Set(),
  tuong_tien: new Set(), tue_tien: new Set(), cung: new Set(), do_sang: new Set(), hoa: new Set(), cuc: new Set(), sao_luu: new Set() };
for (let y = 1950; y <= 2010; y += 3) for (let m = 1; m <= 12; m += 2) for (const d of [3, 17]) for (const t of [0, 5, 11])
  for (const g of ['male', 'female']) {
    const a = astro.bySolar(`${y}-${m}-${d}`, t, g, true, 'vi-VN');
    S.cuc.add(a.fiveElementsClass);
    for (const p of a.palaces) {
      S.cung.add(p.name);
      p.majorStars.forEach((s) => { S.chinh_tinh.add(s.name); if (s.brightness) S.do_sang.add(s.brightness); if (s.mutagen) S.hoa.add(s.mutagen); });
      p.minorStars.forEach((s) => { S.phu_tinh.add(s.name); if (s.brightness) S.do_sang.add(s.brightness); });
      p.adjectiveStars.forEach((s) => S.tap_dieu.add(s.name));
      S.truong_sinh.add(p.changsheng12); S.bac_si.add(p.boshi12); S.tuong_tien.add(p.jiangqian12); S.tue_tien.add(p.suiqian12);
    }
    if (y % 9 === 0 && m === 1 && d === 3 && t === 0) {
      const h = a.horoscope(`${y + 30}-3-1`);
      for (const k of ['decadal', 'yearly', 'monthly', 'daily', 'hourly']) (h[k]?.stars || []).flat().forEach((s) => S.sao_luu.add(s.name.replace(/\(.\)$/, '')));
    }
  }
const ra = { _nguon: 'iztro vi-VN (ghim theo ziwei/package-lock.json) — sinh bằng ziwei/_generate_ten_vi.mjs' };
for (const k in ra === null ? {} : S) ra[k] = [...S[k]].sort((x, y) => x.localeCompare(y, 'vi'));
process.stdout.write(JSON.stringify(ra, null, 1) + '\n');
