// An sao tử vi qua iztro (MIT, SylarLong) — CHẠY CỤC BỘ, không gọi mạng.
// Engine Python gọi file này qua subprocess (app/calc/tuvi_an_sao.py):
//   stdin : {"ngay":"YYYY-M-D","time_index":0..12,"gioi_tinh":"nam"|"nu","ngon_ngu":"vi-VN"|"zh-CN"}
//   stdout: JSON lá số thô của iztro (chỉ các trường dữ liệu, không hàm).
// Không viết lại logic an sao (quyết định 2026-08-15). iztro ghim trong package.json.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { astro } from 'iztro';

const require = createRequire(import.meta.url);
const IZTRO = require('iztro/package.json').version;

const vao = JSON.parse(readFileSync(0, 'utf8'));
const a = astro.bySolar(vao.ngay, vao.time_index, vao.gioi_tinh === 'nu' ? 'female' : 'male',
                        true, vao.ngon_ngu || 'vi-VN');

const sao = (s) => ({ name: s.name, type: s.type, brightness: s.brightness || '', mutagen: s.mutagen || '' });
const ra = {
  iztro: IZTRO,
  gender: a.gender, solarDate: a.solarDate, lunarDate: a.lunarDate, chineseDate: a.chineseDate,
  time: a.time, timeRange: a.timeRange, sign: a.sign, zodiac: a.zodiac,
  fiveElementsClass: a.fiveElementsClass, soul: a.soul, body: a.body,
  earthlyBranchOfSoulPalace: a.earthlyBranchOfSoulPalace,
  earthlyBranchOfBodyPalace: a.earthlyBranchOfBodyPalace,
  palaces: a.palaces.map((p) => ({
    index: p.index, name: p.name, isBodyPalace: p.isBodyPalace, isOriginalPalace: p.isOriginalPalace,
    heavenlyStem: p.heavenlyStem, earthlyBranch: p.earthlyBranch,
    majorStars: p.majorStars.map(sao), minorStars: p.minorStars.map(sao),
    adjectiveStars: p.adjectiveStars.map(sao),
    changsheng12: p.changsheng12, boshi12: p.boshi12, jiangqian12: p.jiangqian12, suiqian12: p.suiqian12,
    decadal: { range: p.decadal.range, heavenlyStem: p.decadal.heavenlyStem,
               earthlyBranch: p.decadal.earthlyBranch },
    ages: p.ages,
  })),
};
process.stdout.write(JSON.stringify(ra));
