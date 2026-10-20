// ORACLE PHÁT TRIỂN — chạy các hàm của engine TypeScript v2.2 trên đầu vào do sinh_golden.py dựng từ lá số iztro
// của dự án (tên đã đổi sang mã bằng app/kb/tuvi_ma_chuan.py). Không chạy runtime.
//   node --experimental-strip-types sinh_golden.ts <dau_vao.json>   → JSON kết quả ra stdout
// Thường không gọi trực tiếp: cd engine && PYTHONPATH=. .venv/bin/python ziwei/oracle_v22/sinh_golden.py
import { readFileSync } from 'node:fs';
import {
  assignPalaceStemsAndLaiNhan,
  calculateFlyingStarMatrix,
  calculate90DayRadar,
  calculateMultiChartSynergy,
  buildBirthTimeCalibrationTest,
  calculateBaZhaiGua,
} from './astroEngine_v2_2.ts';
import type { EarthlyBranch, PalaceInput } from './astroEngine_v2_2.ts';

// Nguyên văn hàm `calculateDouJunJanuaryBranch` của 04_legacyChartAdapter_and_Seeder.ts (adapter import JSON KB
// v2.2 không có trong git nên không import cả tệp).
export function calculateDouJunJanuaryBranch(
  annualYearBranch: EarthlyBranch,
  birthLunarMonth: number,
  birthHourBranch: EarthlyBranch
): EarthlyBranch {
  const BRANCH_RING: EarthlyBranch[] = ['TY', 'SUU', 'DAN', 'MAO', 'THIN', 'TI', 'NGO', 'MUI', 'THAN', 'DAU', 'TUAT', 'HOI'];
  const taiSuiIdx = BRANCH_RING.indexOf(annualYearBranch);
  const hourIdx = BRANCH_RING.indexOf(birthHourBranch);
  const janIndex = (taiSuiIdx - (birthLunarMonth - 1) + hourIdx + 24) % 12;
  return BRANCH_RING[janIndex];
}

const vao = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const boSao = (ps: PalaceInput[]) => ps.map(({ stem, ...p }) => p);   // để TS tự tính can (Ngũ Hổ Độn)

const cases = vao.cases.map((c: any) => {
  const assign = assignPalaceStemsAndLaiNhan(c.birthYearStem, boSao(c.palaces));
  const matrix = calculateFlyingStarMatrix(assign.updatedPalaces);
  const radar = c.radar.map((r: any) => {
    const janBranch = calculateDouJunJanuaryBranch(r.viewingYearBranch, c.birthLunarMonth, c.birthHourBranch);
    return {
      ...r,
      janBranch,
      items: r.startMonths.flatMap((m: number) =>
        calculate90DayRadar(r.viewingYearStem, m, janBranch, assign.updatedPalaces)),
    };
  });
  const s = c.synergy;
  const kia = assignPalaceStemsAndLaiNhan(s.partnerBirthYearStem, boSao(s.partnerPalaces)).updatedPalaces;
  const synergy = {
    ...s,
    forward: calculateMultiChartSynergy(assign.updatedPalaces, {
      role: s.role, partnerBirthYearStem: s.partnerBirthYearStem, partnerMenhPalaceStem: s.partnerMenhPalaceStem,
    }),
    reverse: calculateMultiChartSynergy(kia, { role: s.role, partnerBirthYearStem: c.birthYearStem }),
  };
  const k = c.calibration;
  const calibration = {
    ...k,
    result: buildBirthTimeCalibrationTest(k.candidates, k.years),
    resultDefaultYears: buildBirthTimeCalibrationTest(k.candidates),
  };
  return { ...c, assign, matrix, radar, synergy, calibration };
});

const bazhai = vao.bazhai.map((b: any) => ({ ...b, result: calculateBaZhaiGua(b.year, b.gender) }));
const thieuSao = vao.thieuSao.map((t: any) => {
  const ps = assignPalaceStemsAndLaiNhan(t.birthYearStem, boSao(t.palaces)).updatedPalaces;
  return {
    ...t,
    matrix: calculateFlyingStarMatrix(ps),
    radar: calculate90DayRadar(t.viewingYearStem, t.currentLunarMonth, t.janBranch, ps),
    calibration: buildBirthTimeCalibrationTest([{ label: 'EXACT_HOUR_CHART', hourBranch: 'TY', palaces: ps }],
      t.years),
  };
});

process.stdout.write(JSON.stringify({ cases, bazhai, thieuSao }));
