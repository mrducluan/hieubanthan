// Tầng CALC — an sao tử vi bằng iztro (MIT, SylarLong) chạy CỤC BỘ.
//
// Hợp đồng: đọc MỘT object JSON từ stdin, ghi MỘT object JSON ra stdout.
//   vào: {"solar_date": "YYYY-M-D", "time_index": 0..12, "gender": "male"|"female"}
//   ra : lá số chuẩn hoá (tên zh-CN làm khoá đối chiếu golden + bản dịch vi-VN)
// Lỗi → JSON {"error": "..."} ra stdout, exit code 2.
//
// Không mạng, không đọc/ghi file, không trạng thái: mỗi lần gọi là một tiến
// trình mới. KHÔNG sửa/hậu xử lý kết quả iztro (quyết định 2026-08-15) — chỉ
// đổi hình dạng JSON. Giờ Tý: time_index 12 = Tý muộn, iztro tự tính sang ngày
// sau (SWITCH_AT_2300) — Python gắn cờ `_ty_conflict`.
import { astro } from 'iztro';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const IZTRO_VERSION = require('iztro/package.json').version;

function fail(msg) {
  process.stdout.write(JSON.stringify({ error: String(msg) }));
  process.exit(2);
}

function star(zh, vi) {
  return {
    ten: zh.name,
    ten_vi: vi.name,
    loai: zh.type,
    do_sang: zh.brightness || null,
    do_sang_vi: vi.brightness || null,
    tu_hoa: zh.mutagen || null,
    tu_hoa_vi: vi.mutagen || null,
  };
}

function stars(zhList, viList) {
  if (zhList.length !== viList.length) fail('iztro zh/vi lech so sao');
  return zhList.map((s, i) => star(s, viList[i]));
}

function pair(zh, vi) {
  return { zh, vi };
}

function build({ solar_date, time_index, gender }) {
  if (typeof solar_date !== 'string' || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(solar_date)) {
    fail('solar_date phai dang YYYY-M-D');
  }
  if (!Number.isInteger(time_index) || time_index < 0 || time_index > 12) {
    fail('time_index phai la so nguyen 0..12');
  }
  if (gender !== 'male' && gender !== 'female') fail('gender phai la male|female');

  // fixLeap=true giống hệt generator golden.
  const zh = astro.bySolar(solar_date, time_index, gender, true, 'zh-CN');
  const vi = astro.bySolar(solar_date, time_index, gender, true, 'vi-VN');
  if (zh.palaces.length !== 12 || vi.palaces.length !== 12) fail('iztro khong tra 12 cung');

  const ld = zh.rawDates.lunarDate;
  return {
    iztro_version: IZTRO_VERSION,
    duong_lich: zh.solarDate,
    am_lich: { ngay: ld.lunarDay, thang: ld.lunarMonth, nam: ld.lunarYear, nhuan: ld.isLeap },
    am_lich_zh: zh.lunarDate,
    can_chi_zh: zh.chineseDate,
    can_chi_vi: vi.chineseDate,
    gio: { zh: zh.time, vi: vi.time, khoang: zh.timeRange },
    cuc: pair(zh.fiveElementsClass, vi.fiveElementsClass),
    menh_chu: pair(zh.soul, vi.soul),
    than_chu: pair(zh.body, vi.body),
    chi_cung_menh: pair(zh.earthlyBranchOfSoulPalace, vi.earthlyBranchOfSoulPalace),
    chi_cung_than: pair(zh.earthlyBranchOfBodyPalace, vi.earthlyBranchOfBodyPalace),
    cung: zh.palaces.map((p, i) => {
      const q = vi.palaces[i];
      return {
        index: p.index,
        ten_cung: pair(p.name, q.name),
        can: pair(p.heavenlyStem, q.heavenlyStem),
        chi: pair(p.earthlyBranch, q.earthlyBranch),
        la_menh: p.name === '命宫',
        la_than: p.isBodyPalace,
        // isOriginalPalace của iztro = cung Lai Nhân (来因宫), KHÔNG phải cung Mệnh.
        la_lai_nhan: p.isOriginalPalace,
        chinh_tinh: stars(p.majorStars, q.majorStars),
        phu_tinh: stars(p.minorStars, q.minorStars),
        tap_tinh: stars(p.adjectiveStars, q.adjectiveStars),
        truong_sinh_12: pair(p.changsheng12, q.changsheng12),
        bac_si_12: pair(p.boshi12, q.boshi12),
        tuong_tien_12: pair(p.jiangqian12, q.jiangqian12),
        tue_tien_12: pair(p.suiqian12, q.suiqian12),
        dai_han: {
          tu_tuoi: p.decadal.range[0],
          den_tuoi: p.decadal.range[1],
          can: pair(p.decadal.heavenlyStem, q.decadal.heavenlyStem),
          chi: pair(p.decadal.earthlyBranch, q.decadal.earthlyBranch),
        },
        tieu_han_tuoi: p.ages,
      };
    }),
  };
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  let inp;
  try {
    inp = JSON.parse(raw);
  } catch (e) {
    fail('stdin khong phai JSON');
  }
  let out;
  try {
    out = build(inp || {});
  } catch (e) {
    fail(e && e.message ? e.message : e);
  }
  process.stdout.write(JSON.stringify(out));
});
