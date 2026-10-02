// An sao tử vi qua iztro (MIT, SylarLong) — CHẠY CỤC BỘ, không gọi mạng.
// Engine Python gọi file này qua subprocess (app/calc/tuvi_an_sao.py):
//   stdin : {"ngay":"YYYY-M-D","time_index":0..12,"gioi_tinh":"nam"|"nu","ngon_ngu":"vi-VN"|"zh-CN",
//            "ngay_xem":"YYYY-M-D" (tuỳ chọn → thêm khoá horoscope: đại hạn/tiểu hạn/lưu niên)}
//   stdout: JSON lá số thô của iztro (chỉ các trường dữ liệu, không hàm).
//            "am" / "am_xem": {"nam","thang","ngay","nhuan","so_ngay"} — âm lịch VIỆT NAM của ngày sinh / ngày xem
//            (engine Python tính bằng Hồ Ngọc Đức theo múi giờ lịch của vùng).
// Không viết lại logic an sao (quyết định 2026-08-15). iztro ghim trong package.json.
// LS60: iztro đổi dương → âm theo lịch Trung Quốc (UTC+8); 1930–2025 có 1.376 ngày lịch Việt khác (tháng lệch,
// ngày 30, tháng nhuận). Ta chỉ thay KẾT QUẢ ĐỔI LỊCH của đúng ngày sinh / ngày xem bằng âm lịch Việt —
// mọi quy tắc an sao vẫn là của iztro.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { astro } from 'iztro';

const require = createRequire(import.meta.url);
const IZTRO = require('iztro/package.json').version;

const vao = JSON.parse(readFileSync(0, 'utf8'));

const conv = require('lunar-lite/lib/convertor');
const gz = require('lunar-lite/lib/ganzhi');
const misc = require('lunar-lite/lib/misc');
const CAN = '甲乙丙丁戊己庚辛壬癸', CHI = '子丑寅卯辰巳午未申酉戌亥';
const khoa = (s) => { const [y, m, d] = conv.normalizeDateStr(s); return `${y}-${m}-${d}`; };
const amViet = {};
if (vao.am) amViet[khoa(vao.ngay)] = vao.am;
if (vao.am_xem && vao.ngay_xem) amViet[khoa(vao.ngay_xem)] = vao.am_xem;
const tim = (s) => { try { return amViet[khoa(s)]; } catch { return undefined; } };
const gocSolar2lunar = conv.solar2lunar;
const SO = '〇一二三四五六七八九', THANG = '正二三四五六七八九十冬腊';
const chuNgay = (d) => (d === 10 ? '初十' : d === 20 ? '二十' : d === 30 ? '三十'
  : ['初', '十', '廿'][Math.floor(d / 10)] + SO[d % 10]);
conv.solar2lunar = (s) => {
  const goc = gocSolar2lunar(s);
  const v = tim(s);
  if (!v || (goc.lunarYear === v.nam && goc.lunarMonth === v.thang && goc.lunarDay === v.ngay
             && goc.isLeap === !!v.nhuan)) return goc;          // lịch Việt trùng lịch Trung Quốc
  const chuoi = `${[...String(v.nam)].map((c) => SO[+c]).join('')}年${v.nhuan ? '闰' : ''}${THANG[v.thang - 1]}月${chuNgay(v.ngay)}`;
  return {
    lunarYear: v.nam, lunarMonth: v.thang, lunarDay: v.ngay, isLeap: !!v.nhuan,
    toString: (cn) => (cn ? chuoi : `${v.nam}-${v.thang}-${v.ngay}`),
  };
};
// Số ngày của tháng âm (29/30): iztro dùng để "gói" ngày 30 + Tý muộn; tháng Việt có thể 30 ngày khi bên kia 29.
const gocSoNgay = misc.getTotalDaysOfLunarMonth;
misc.getTotalDaysOfLunarMonth = (s) => { const v = tim(s); return v && v.so_ngay ? v.so_ngay : gocSoNgay(s); };
const gocGanZhi = gz.getHeavenlyStemAndEarthlyBranchBySolarDate;
gz.getHeavenlyStemAndEarthlyBranchBySolarDate = (s, t, o) => {
  const r = gocGanZhi(s, t, o);
  const v = tim(s);
  // Năm âm lịch đổi tại Tết: dùng năm âm Việt (Tết hai nước có năm lệch nhau, vd 1985, 2007).
  if (v && o && o.year === 'normal') r.yearly = [CAN[(v.nam - 4) % 10], CHI[(v.nam - 4) % 12]];
  return r;
};
// fix_leap: nửa sau tháng nhuận tính sang tháng sau (mặc định iztro) hay như tháng chính.
const a = astro.bySolar(vao.ngay, vao.time_index, vao.gioi_tinh === 'nu' ? 'female' : 'male',
                        vao.fix_leap !== false, vao.ngon_ngu || 'vi-VN');

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
if (vao.ngay_xem) {
  const h = a.horoscope(vao.ngay_xem);
  const hc = (o) => ({ index: o.index, heavenlyStem: o.heavenlyStem, earthlyBranch: o.earthlyBranch,
                       mutagen: o.mutagen || [], palaceNames: o.palaceNames || [],
                       stars: (o.stars || []).map((ds) => ds.map((x) => ({ name: x.name, type: x.type }))) });
  ra.horoscope = { decadal: hc(h.decadal), age: { ...hc(h.age), nominalAge: h.age.nominalAge },
                   yearly: hc(h.yearly) };
}
process.stdout.write(JSON.stringify(ra));
