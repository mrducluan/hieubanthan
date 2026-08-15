import { astro } from 'iztro';
const CA = [
  {id:'nam_1990_suu', d:'1990-5-15', ti:1, g:'male',   note:'ca nen gio Suu'},
  {id:'nu_1992_dau',  d:'1992-8-21', ti:4, g:'female', note:'ca nen nu'},
  {id:'nam_2000_ngo', d:'2000-1-1',  ti:6, g:'male',   note:'gio Ngo'},
  {id:'nam_1988_truoc_tet', d:'1988-2-5', ti:3, g:'male', note:'truoc Tet Mau Thin -> nam Dinh Mao'},
  {id:'nu_1970_thin', d:'1970-12-2', ti:5, g:'female', note:'1970 (aov khong nhan mui gio VN)'},
  {id:'nam_som_ty',   d:'1995-6-15', ti:0, g:'male',   note:'som Ty 00:00-01:00'},
  {id:'nam_muon_ty',  d:'1995-6-15', ti:12,g:'male',   note:'muon Ty 23:00 - iztro tinh sang ngay sau'},
  {id:'nu_2004_nhuan',d:'2004-3-21', ti:7, g:'female', note:'2004 co thang 2 nhuan'},
];
const out = {
  _nguon:'iztro (MIT, SylarLong) chay cuc bo - cung engine aov.cc dung',
  _doi_chieu:'khop tuyet doi voi la so chup tu aov.cc (full_1990.json)',
  _late_zi:'iztro: muon Ty 23:00 tinh sang ngay sau (SWITCH_AT_2300) - LECH voi chinh sach SWITCH_AT_0000 cua ta',
  cases:{},
};
for (const c of CA) {
  const a = astro.bySolar(c.d, c.ti, c.g, true, 'zh-CN');
  const palaces = a.palaces.map(p=>({
    ten_cung: p.name,
    chi: p.earthlyBranch,
    can: p.heavenlyStem,
    la_than: p.isBodyPalace,
    la_menh: p.isOriginalPalace,
    major: p.majorStars.map(s=>s.name+(s.mutagen?`(${s.mutagen})`:'')).sort(),
    minor: p.minorStars.map(s=>s.name).sort(),
    adj:   p.adjectiveStars.map(s=>s.name).sort(),
  }));
  out.cases[c.id] = {
    input:{...c},
    _ty_conflict: c.ti===12,
    expect:{
      solar:a.solarDate, lunar:a.lunarDate, chineseDate:a.chineseDate,
      timeRange:a.time, fiveElements:a.fiveElementsClass,
      soul:a.soul, body:a.body,
      soulPalaceBranch:a.earthlyBranchOfSoulPalace,
      bodyPalaceBranch:a.earthlyBranchOfBodyPalace,
      palaces,
    },
  };
  console.error(`  ${c.id.padEnd(20)} ${a.chineseDate}  ${a.fiveElementsClass}  menh=${a.soul}`);
}
process.stdout.write(JSON.stringify(out,null,2));
