// Golden vận hạn (đại hạn / tiểu hạn / lưu niên) — iztro 2.6.0 chạy cục bộ, astro.horoscope().
// Chạy: cd engine/ziwei && node ../fixtures/_generate_ziwei_van_han.mjs > ../fixtures/golden/ziwei_van_han.json
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url.replace('/fixtures/', '/ziwei/'));
const { astro } = require('iztro');
const IZTRO = require('iztro/package.json').version;
const LA = [
  {id:'nam_1990_ngo', d:'1990-5-17', ti:6, g:'male'},
  {id:'nu_1992_dau',  d:'1992-8-21', ti:4, g:'female'},
  {id:'nam_1988_truoc_tet', d:'1988-2-5', ti:3, g:'male'},
  {id:'nu_2004_nhuan', d:'2004-3-21', ti:7, g:'female'},
];
const NGAY_XEM = ['2026-9-30', '2027-1-20', '2027-3-1', '2035-6-15'];
const hc = (o) => ({ chi_so: o.index, can: o.heavenlyStem, chi: o.earthlyBranch, tu_hoa: o.mutagen });
const out = { _nguon: `iztro ${IZTRO} astro.horoscope (vi-VN)`, cases: {} };
for (const c of LA) {
  const a = astro.bySolar(c.d, c.ti, c.g, true, 'vi-VN');
  for (const x of NGAY_XEM) {
    const h = a.horoscope(x);
    const dh = a.palaces[h.decadal.index].decadal;
    out.cases[`${c.id}@${x}`] = {
      input: { ...c, ngay_xem: x },
      expect: {
        tuoi_mu: h.age.nominalAge,
        dai_han: { ...hc(h.decadal), tu_tuoi: dh.range[0], den_tuoi: dh.range[1],
                   cung_goc: a.palaces[h.decadal.index].name },
        tieu_han: { chi_so: h.age.index, can: h.age.heavenlyStem, chi: h.age.earthlyBranch,
                    cung_goc: a.palaces[h.age.index].name },
        luu_nien: { ...hc(h.yearly), cung_goc: a.palaces[h.yearly.index].name },
      },
    };
  }
}
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
