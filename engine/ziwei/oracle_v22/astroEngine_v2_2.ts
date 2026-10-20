// ============================================================================
// ORACLE PHÁT TRIỂN — KHÔNG CHẠY RUNTIME, KHÔNG IMPORT TỪ ENGINE/WEB.
// Bản sao nguyên văn `03_astroEngine_v2_2.ts` chủ dự án gửi 2026-10-19 (bộ tài liệu v2.2), giữ để CHỨNG MINH
// phần viết lại bằng Python (calc/tuvi_phi_hoa.py, luangiai/tuvi_nhip_3_thang.py, tuvi_hop_tham.py,
// tuvi_dinh_gio.py, calc/phongthuy.menh_quai) trùng khít hoặc khác CÓ CHỦ Ý. Chỉ sinh golden:
//   cd engine && PYTHONPATH=. .venv/bin/python ziwei/oracle_v22/sinh_golden.py
// → engine/fixtures/golden/tuvi_v22_oracle.json (kiểm bởi tests/test_tuvi_v22_oracle.py).
// Mọi chỗ khác nhau và lý do: docs/NANG-CAP-TUVI-V2.md mục "Bảng chuyển đổi TS → Python".
// Không sửa phần dưới (sửa = oracle không còn là bản gốc).
// ============================================================================
// ============================================================================
// FILE: 03_astroEngine_v2_2.ts
// HIEUBAN.COM - DETERMINISTIC DUAL-SCHOOL ENGINE (RENDER.COM BACKEND)
// Tính năng:
//   1. Ngũ Hổ Độn Can 12 cung & Lai Nhân Cung (Bắc Phái)
//   2. Ma trận Phi Tinh Tứ Hóa 12 cung (Tự Hóa & Xung Chiếu)
//   3. Radar Chiến lược 90 Ngày tới (3 Tháng Lưu Nguyệt)
//   4. Cung Phi Bát Trạch (Đông/Tây Tứ Mệnh & 8 Hướng)
//   5. [NEW] Time-Machine Calibration (Định chuẩn giờ sinh ngược +-1 canh giờ)
//   6. [NEW] Multi-Chart Synergy (Hợp tham 2 lá số Đối tác / Vợ chồng / Con cái)
// ============================================================================

export type HeavenlyStem = 'GIAP' | 'AT' | 'BINH' | 'DINH' | 'MAU' | 'KY' | 'CANH' | 'TAN' | 'NHAM' | 'QUY';
export type EarthlyBranch = 'TY' | 'SUU' | 'DAN' | 'MAO' | 'THIN' | 'TI' | 'NGO' | 'MUI' | 'THAN' | 'DAU' | 'TUAT' | 'HOI';
export type PalaceCode =
  | 'MENH' | 'PHU_MAU' | 'PHUC_DUC' | 'DIEN_TRACH' | 'QUAN_LOC' | 'NO_BOC'
  | 'THIEN_DI' | 'TAT_ACH' | 'TAI_BACH' | 'TU_TUC' | 'PHU_THE' | 'HUYNH_DE';
export type SiHuaType = 'LOC' | 'QUYEN' | 'KHOA' | 'KY';

export interface PalaceInput {
  palaceCode: PalaceCode;
  branch: EarthlyBranch;
  stem?: HeavenlyStem;
  stars: string[];
  hasTuan?: boolean;
  hasTriet?: boolean;
}

export interface FlyingStarTransition {
  sourcePalace: PalaceCode;
  sourceStem: HeavenlyStem;
  siHuaType: SiHuaType;
  transformedStar: string;
  targetPalace: PalaceCode;
  clashedPalace: PalaceCode;
  isSelfTransformation: boolean;
  isCircuitBrokenByVN: boolean;
}

export interface MonthlyRadarItem {
  lunarMonth: number;
  monthStem: HeavenlyStem;
  monthBranch: EarthlyBranch;
  palaceAtMonth: PalaceCode;
  monthlySiHua: Record<SiHuaType, { star: string; targetPalace: PalaceCode; clashedPalace: PalaceCode }>;
  alertLevel: 'GREEN_GOLDEN_WINDOW' | 'YELLOW_CAUTION' | 'RED_CRITICAL_ALERT';
  alertReason: string[];
}

export interface SynergyInteraction {
  partnerRole: 'BUSINESS_PARTNER' | 'SPOUSE' | 'CHILD';
  triggerSource: 'PARTNER_YEAR_STEM' | 'PARTNER_MENH_STEM';
  stemUsed: HeavenlyStem;
  siHuaType: SiHuaType;
  starTriggered: string;
  landedOnUserPalace: PalaceCode;
  clashedUserPalace: PalaceCode;
  impactVerdict: 'BENEFACTOR_BOOST' | 'STRATEGIC_CONTROL' | 'SAFE_SUPPORT' | 'TOXIC_DRAIN_ALERT';
  strategicMeaning: string;
}

export interface CalibrationCandidate {
  candidateLabel: 'PREV_HOUR_CHART' | 'EXACT_HOUR_CHART' | 'NEXT_HOUR_CHART';
  hourBranch: EarthlyBranch;
  menhMainStars: string[];
  pastVerificationQuestions: {
    yearToCheck: number;
    yearStem: HeavenlyStem;
    expectedEventSummary: string;
    clashedPalace: PalaceCode;
  }[];
}

const STEMS_ORDER: HeavenlyStem[] = ['GIAP', 'AT', 'BINH', 'DINH', 'MAU', 'KY', 'CANH', 'TAN', 'NHAM', 'QUY'];
const BRANCHES_FROM_DAN: EarthlyBranch[] = ['DAN', 'MAO', 'THIN', 'TI', 'NGO', 'MUI', 'THAN', 'DAU', 'TUAT', 'HOI', 'TY', 'SUU'];
const BRANCH_RING: EarthlyBranch[] = ['TY', 'SUU', 'DAN', 'MAO', 'THIN', 'TI', 'NGO', 'MUI', 'THAN', 'DAU', 'TUAT', 'HOI'];

export const SI_HUA_TABLE: Record<HeavenlyStem, Record<SiHuaType, string>> = {
  GIAP: { LOC: 'LIEM_TRINH', QUYEN: 'PHA_QUAN', KHOA: 'VU_KHUC', KY: 'THAI_DUONG' },
  AT:   { LOC: 'THIEN_CO',   QUYEN: 'THIEN_LUONG', KHOA: 'TU_VI', KY: 'THAI_AM' },
  BINH: { LOC: 'THIEN_DONG', QUYEN: 'THIEN_CO', KHOA: 'VAN_XUONG', KY: 'LIEM_TRINH' },
  DINH: { LOC: 'THAI_AM',    QUYEN: 'THIEN_DONG', KHOA: 'THIEN_CO', KY: 'CU_MON' },
  MAU:  { LOC: 'THAM_LANG',  QUYEN: 'THAI_AM', KHOA: 'HUU_BAT', KY: 'THIEN_CO' },
  KY:   { LOC: 'VU_KHUC',    QUYEN: 'THAM_LANG', KHOA: 'THIEN_LUONG', KY: 'VAN_KHUC' },
  CANH: { LOC: 'THAI_DUONG', QUYEN: 'VU_KHUC', KHOA: 'THAI_AM', KY: 'THIEN_DONG' },
  TAN:  { LOC: 'CU_MON',     QUYEN: 'THAI_DUONG', KHOA: 'VAN_KHUC', KY: 'VAN_XUONG' },
  NHAM: { LOC: 'THIEN_LUONG',QUYEN: 'TU_VI', KHOA: 'TA_PHU', KY: 'VU_KHUC' },
  QUY:  { LOC: 'PHA_QUAN',   QUYEN: 'CU_MON', KHOA: 'THAI_AM', KY: 'THAM_LANG' },
};

export const PALACE_CLASH_MAP: Record<PalaceCode, PalaceCode> = {
  MENH: 'THIEN_DI',     THIEN_DI: 'MENH',
  HUYNH_DE: 'NO_BOC',   NO_BOC: 'HUYNH_DE',
  PHU_THE: 'QUAN_LOC',  QUAN_LOC: 'PHU_THE',
  TU_TUC: 'DIEN_TRACH', DIEN_TRACH: 'TU_TUC',
  TAI_BACH: 'PHUC_DUC', PHUC_DUC: 'TAI_BACH',
  TAT_ACH: 'PHU_MAU',   PHU_MAU: 'TAT_ACH',
};

export function assignPalaceStemsAndLaiNhan(
  birthYearStem: HeavenlyStem,
  palaces: PalaceInput[]
): { updatedPalaces: PalaceInput[]; laiNhanPalace: PalaceCode | null } {
  const startStemMap: Record<HeavenlyStem, HeavenlyStem> = {
    GIAP: 'BINH', KY: 'BINH',
    AT: 'MAU',    CANH: 'MAU',
    BINH: 'CANH', TAN: 'CANH',
    DINH: 'NHAM', NHAM: 'NHAM',
    MAU: 'GIAP',  QUY: 'GIAP',
  };
  const danStem = startStemMap[birthYearStem];
  const startIndex = STEMS_ORDER.indexOf(danStem);
  let laiNhanPalace: PalaceCode | null = null;

  const updatedPalaces = palaces.map((p) => {
    const branchOffset = BRANCHES_FROM_DAN.indexOf(p.branch);
    const calculatedStem = STEMS_ORDER[(startIndex + branchOffset) % 10];
    if (calculatedStem === birthYearStem && p.branch !== 'TY' && p.branch !== 'SUU') {
      laiNhanPalace = p.palaceCode;
    }
    return { ...p, stem: p.stem || calculatedStem };
  });

  return { updatedPalaces, laiNhanPalace };
}

export function calculateFlyingStarMatrix(palaces: PalaceInput[]) {
  const starToPalaceMap = new Map<string, PalaceInput>();
  for (const p of palaces) {
    for (const star of p.stars) {
      starToPalaceMap.set(star, p);
    }
  }

  const allTransitions: FlyingStarTransition[] = [];
  const selfTransformations: FlyingStarTransition[] = [];
  const criticalClashes: FlyingStarTransition[] = [];

  for (const source of palaces) {
    if (!source.stem) continue;
    const fourTransforms = SI_HUA_TABLE[source.stem];

    (['LOC', 'QUYEN', 'KHOA', 'KY'] as SiHuaType[]).forEach((siHuaType) => {
      const targetStar = fourTransforms[siHuaType];
      const targetPalaceObj = starToPalaceMap.get(targetStar);
      if (!targetPalaceObj) return;

      const isSelf = source.palaceCode === targetPalaceObj.palaceCode;
      const clashedPalace = PALACE_CLASH_MAP[targetPalaceObj.palaceCode];
      const isCircuitBroken = Boolean(targetPalaceObj.hasTuan || targetPalaceObj.hasTriet);

      const transition: FlyingStarTransition = {
        sourcePalace: source.palaceCode,
        sourceStem: source.stem!,
        siHuaType,
        transformedStar: targetStar,
        targetPalace: targetPalaceObj.palaceCode,
        clashedPalace,
        isSelfTransformation: isSelf,
        isCircuitBrokenByVN: isCircuitBroken,
      };

      allTransitions.push(transition);
      if (isSelf) selfTransformations.push(transition);
      if (siHuaType === 'KY' && ['MENH', 'TAI_BACH', 'QUAN_LOC', 'DIEN_TRACH', 'PHU_THE'].includes(clashedPalace)) {
        criticalClashes.push(transition);
      }
    });
  }

  return { allTransitions, selfTransformations, criticalClashes };
}

export function calculate90DayRadar(
  annualYearStem: HeavenlyStem,
  currentLunarMonth: number,
  januaryLunarPalaceBranch: EarthlyBranch,
  palaces: PalaceInput[]
): MonthlyRadarItem[] {
  const radarResults: MonthlyRadarItem[] = [];
  const startStemMap: Record<HeavenlyStem, HeavenlyStem> = {
    GIAP: 'BINH', KY: 'BINH', AT: 'MAU', CANH: 'MAU', BINH: 'CANH', TAN: 'CANH', DINH: 'NHAM', NHAM: 'NHAM', MAU: 'GIAP', QUY: 'GIAP',
  };
  const month1StemIndex = STEMS_ORDER.indexOf(startStemMap[annualYearStem]);
  const janBranchIndex = BRANCHES_FROM_DAN.indexOf(januaryLunarPalaceBranch);

  const starToPalace = new Map<string, PalaceCode>();
  const branchToPalace = new Map<EarthlyBranch, PalaceInput>();
  palaces.forEach((p) => {
    branchToPalace.set(p.branch, p);
    p.stars.forEach((s) => starToPalace.set(s, p.palaceCode));
  });

  const annualKyStar = SI_HUA_TABLE[annualYearStem].KY;
  const annualKyPalace = starToPalace.get(annualKyStar);
  const annualKyClashedPalace = annualKyPalace ? PALACE_CLASH_MAP[annualKyPalace] : null;

  for (let offset = 0; offset < 3; offset++) {
    const targetMonth = ((currentLunarMonth - 1 + offset) % 12) + 1;
    const monthStem = STEMS_ORDER[(month1StemIndex + targetMonth - 1) % 10];
    const monthBranch = BRANCHES_FROM_DAN[(janBranchIndex + targetMonth - 1) % 12];
    const activePalaceObj = branchToPalace.get(monthBranch);
    const activePalaceCode = activePalaceObj ? activePalaceObj.palaceCode : 'MENH';

    const transforms = SI_HUA_TABLE[monthStem];
    const monthlySiHua = {} as MonthlyRadarItem['monthlySiHua'];

    (['LOC', 'QUYEN', 'KHOA', 'KY'] as SiHuaType[]).forEach((type) => {
      const star = transforms[type];
      const tPalace = starToPalace.get(star) || 'MENH';
      monthlySiHua[type] = { star, targetPalace: tPalace, clashedPalace: PALACE_CLASH_MAP[tPalace] };
    });

    const reasons: string[] = [];
    let alertLevel: MonthlyRadarItem['alertLevel'] = 'YELLOW_CAUTION';
    const mKyTarget = monthlySiHua.KY.targetPalace;
    const mKyClash = monthlySiHua.KY.clashedPalace;
    const mLocTarget = monthlySiHua.LOC.targetPalace;

    if (mKyTarget === annualKyPalace || mKyClash === annualKyClashedPalace) {
      alertLevel = 'RED_CRITICAL_ALERT';
      reasons.push(`Lưu Nguyệt Hóa Kỵ (${monthlySiHua.KY.star}) chồng lên Lưu Niên Hóa Kỵ tại trục ${mKyTarget} - ${mKyClash}.`);
    } else if (['MENH', 'TAI_BACH', 'QUAN_LOC', 'TAT_ACH'].includes(mKyClash)) {
      alertLevel = 'RED_CRITICAL_ALERT';
      reasons.push(`Lưu Nguyệt Hóa Kỵ xung thẳng cung trọng yếu (${mKyClash}), cảnh báo đứt gãy dòng tiền hoặc xung đột hợp đồng.`);
    }

    if (alertLevel !== 'RED_CRITICAL_ALERT' && ['MENH', 'TAI_BACH', 'QUAN_LOC', 'DIEN_TRACH'].includes(mLocTarget)) {
      alertLevel = 'GREEN_GOLDEN_WINDOW';
      reasons.push(`Lưu Nguyệt Hóa Lộc (${monthlySiHua.LOC.star}) nhập thẳng cung ${mLocTarget}, thuận lợi bung lực chốt doanh số, ký kết.`);
    }

    if (reasons.length === 0) {
      reasons.push(`Vận trình cân bằng tại cung ${activePalaceCode}, ưu tiên dùng Hóa Khoa (${monthlySiHua.KHOA.star}) tại ${monthlySiHua.KHOA.targetPalace} để chuẩn hóa quy trình.`);
    }

    radarResults.push({
      lunarMonth: targetMonth, monthStem, monthBranch, palaceAtMonth: activePalaceCode, monthlySiHua, alertLevel, alertReason: reasons,
    });
  }

  return radarResults;
}

// ----------------------------------------------------------------------------
// [NEW MODULE 5]: MULTI-CHART SYNASTRY ENGINE (HỢP THAM 2 LÁ SỐ ĐỐI TÁC / VỢ CHỒNG)
// ----------------------------------------------------------------------------

export function calculateMultiChartSynergy(
  userPalaces: PalaceInput[],
  partnerInfo: {
    role: 'BUSINESS_PARTNER' | 'SPOUSE' | 'CHILD';
    partnerBirthYearStem: HeavenlyStem;
    partnerMenhPalaceStem?: HeavenlyStem;
  }
): SynergyInteraction[] {
  const starToUserPalace = new Map<string, PalaceCode>();
  userPalaces.forEach((p) => p.stars.forEach((s) => starToUserPalace.set(s, p.palaceCode)));

  const interactions: SynergyInteraction[] = [];
  const stemsToEvaluate: { source: 'PARTNER_YEAR_STEM' | 'PARTNER_MENH_STEM'; stem: HeavenlyStem }[] = [
    { source: 'PARTNER_YEAR_STEM', stem: partnerInfo.partnerBirthYearStem },
  ];
  if (partnerInfo.partnerMenhPalaceStem) {
    stemsToEvaluate.push({ source: 'PARTNER_MENH_STEM', stem: partnerInfo.partnerMenhPalaceStem });
  }

  for (const item of stemsToEvaluate) {
    const transforms = SI_HUA_TABLE[item.stem];
    (['LOC', 'QUYEN', 'KHOA', 'KY'] as SiHuaType[]).forEach((type) => {
      const star = transforms[type];
      const landedPalace = starToUserPalace.get(star);
      if (!landedPalace) return;
      const clashedPalace = PALACE_CLASH_MAP[landedPalace];

      let verdict: SynergyInteraction['impactVerdict'] = 'SAFE_SUPPORT';
      let meaning = '';

      if (type === 'LOC' && ['MENH', 'TAI_BACH', 'DIEN_TRACH', 'QUAN_LOC'].includes(landedPalace)) {
        verdict = 'BENEFACTOR_BOOST';
        meaning = `Người này mang Hóa Lộc (${star}) bơm trực tiếp vào cung ${landedPalace} của bạn -> Quý nhân vượng tài thực chất, hợp tác sinh lời nhanh.`;
      } else if (type === 'KHOA' && ['MENH', 'QUAN_LOC', 'PHU_MAU', 'PHUC_DUC'].includes(landedPalace)) {
        verdict = 'SAFE_SUPPORT';
        meaning = `Người này mang Hóa Khoa (${star}) nhập cung ${landedPalace} -> Cố vấn bình ổn, giúp bạn tháo gỡ khủng hoảng pháp lý và giữ chữ tín.`;
      } else if (type === 'QUYEN') {
        verdict = 'STRATEGIC_CONTROL';
        meaning = `Người này mang Hóa Quyền (${star}) tác động vào cung ${landedPalace} -> Thúc đẩy mở rộng quy mô nhưng họ muốn nắm quyền quyết định.`;
      } else if (type === 'KY' && ['MENH', 'TAI_BACH', 'DIEN_TRACH', 'QUAN_LOC'].includes(clashedPalace)) {
        verdict = 'TOXIC_DRAIN_ALERT';
        meaning = `CẢNH BÁO ĐỎ: Người này phóng Hóa Kỵ (${star}) nhập ${landedPalace} xung thẳng vào cung ${clashedPalace} của bạn -> Tuyệt đối không đứng tên chung tài sản hoặc giao quyền kiểm soát két tiền cho họ!`;
      } else {
        meaning = `Tương tác ${type} (${star}) tại trục ${landedPalace} - ${clashedPalace}.`;
      }

      interactions.push({
        partnerRole: partnerInfo.role,
        triggerSource: item.source,
        stemUsed: item.stem,
        siHuaType: type,
        starTriggered: star,
        landedOnUserPalace: landedPalace,
        clashedUserPalace: clashedPalace,
        impactVerdict: verdict,
        strategicMeaning: meaning,
      });
    });
  }

  return interactions;
}

// ----------------------------------------------------------------------------
// [NEW MODULE 6]: TIME-MACHINE CALIBRATION (ĐỊNH CHUẨN GIỜ SINH NGƯỢC +-1 CANH GIỜ)
// ----------------------------------------------------------------------------

export function buildBirthTimeCalibrationTest(
  candidates: {
    label: 'PREV_HOUR_CHART' | 'EXACT_HOUR_CHART' | 'NEXT_HOUR_CHART';
    hourBranch: EarthlyBranch;
    palaces: PalaceInput[];
  }[],
  pastCheckYears: { solarYear: number; yearStem: HeavenlyStem }[] = [
    { solarYear: 2022, yearStem: 'NHAM' },
    { solarYear: 2023, yearStem: 'QUY' },
    { solarYear: 2024, yearStem: 'GIAP' },
  ]
): CalibrationCandidate[] {
  return candidates.map((cand) => {
    const starToPalace = new Map<string, PalaceCode>();
    let menhStars: string[] = [];
    cand.palaces.forEach((p) => {
      if (p.palaceCode === 'MENH') menhStars = p.stars;
      p.stars.forEach((s) => starToPalace.set(s, p.palaceCode));
    });

    const pastVerificationQuestions = pastCheckYears.map((yr) => {
      const kyStar = SI_HUA_TABLE[yr.yearStem].KY;
      const kyPalace = starToPalace.get(kyStar) || 'MENH';
      const clashed = PALACE_CLASH_MAP[kyPalace];

      const eventMap: Record<PalaceCode, string> = {
        TAI_BACH: `Năm ${yr.solarYear}, bạn có khoản hao hụt tiền mặt lớn, kẹt vốn hoặc thay đổi nguồn thu chính.`,
        QUAN_LOC: `Năm ${yr.solarYear}, công việc của bạn có sự xáo trộn mạnh, đổi việc, xung đột định hướng hoặc chịu áp lực KPI cực gắt.`,
        DIEN_TRACH: `Năm ${yr.solarYear}, bạn có biến động về nhà cửa, chuyển chỗ ở, sửa nhà hoặc phát sinh việc lớn trong gia đình.`,
        PHU_THE: `Năm ${yr.solarYear}, chuyện tình cảm/hôn nhân hoặc quan hệ với đối tác làm ăn thân cận có sóng gió, căng thẳng.`,
        MENH: `Năm ${yr.solarYear}, bản thân bạn trải qua một cú sốc tâm lý, thay đổi hoàn toàn góc nhìn sống hoặc sức khỏe suy giảm.`,
        THIEN_DI: `Năm ${yr.solarYear}, việc đi xa, xuất ngoại hoặc mở rộng thị trường bên ngoài gặp trục trặc, kế hoạch bị dời lại.`,
        NO_BOC: `Năm ${yr.solarYear}, bạn bị bạn bè/nhân sự dưới quyền làm phiền lòng hoặc gây thiệt hại tiền bạc.`,
        HUYNH_DE: `Năm ${yr.solarYear}, dòng tiền mặt trong tài khoản biến động mạnh hoặc anh chị em có việc cần hỗ trợ.`,
        PHU_MAU: `Năm ${yr.solarYear}, có vấn đề liên quan đến giấy tờ pháp lý, hợp đồng, ngân hàng hoặc sức khỏe cha mẹ.`,
        TAT_ACH: `Năm ${yr.solarYear}, cơ thể phát sinh bệnh lý cần điều trị hoặc tinh thần mất ngủ kéo dài.`,
        TU_TUC: `Năm ${yr.solarYear}, lo lắng nhiều cho con cái hoặc một dự án đầu tư nhánh bị đình trệ.`,
        PHUC_DUC: `Năm ${yr.solarYear}, tâm trí bất an, phải lo toan việc họ hàng hoặc hao tiền vì những việc không tên.`,
      };

      return {
        yearToCheck: yr.solarYear,
        yearStem: yr.yearStem,
        expectedEventSummary: eventMap[clashed],
        clashedPalace: clashed,
      };
    });

    return {
      candidateLabel: cand.label,
      hourBranch: cand.hourBranch,
      menhMainStars: menhStars,
      pastVerificationQuestions,
    };
  });
}

export function calculateBaZhaiGua(birthSolarYear: number, gender: 'MALE' | 'FEMALE') {
  const lastTwoDigits = birthSolarYear % 100;
  let sum = Math.floor(lastTwoDigits / 10) + (lastTwoDigits % 10);
  while (sum > 9) sum = Math.floor(sum / 10) + (sum % 10);

  let kua: number;
  if (birthSolarYear < 2000) {
    if (gender === 'MALE') {
      kua = 10 - sum;
      if (kua === 5) kua = 2;
    } else {
      kua = sum + 5;
      while (kua > 9) kua = Math.floor(kua / 10) + (kua % 10);
      if (kua === 5) kua = 8;
    }
  } else {
    if (gender === 'MALE') {
      kua = 9 - sum;
      if (kua <= 0) kua += 9;
      if (kua === 5) kua = 2;
    } else {
      kua = sum + 6;
      while (kua > 9) kua = Math.floor(kua / 10) + (kua % 10);
      if (kua === 5) kua = 8;
    }
  }

  const BAZHAI_MAP: Record<number, any> = {
    1: { kuaName: 'Khảm', element: 'THUY', group: 'DONG_TU_MENH', auspiciousDirections: { sinhKhi: 'Đông Nam', thienY: 'Đông', dienNien: 'Nam', phucVi: 'Bắc' } },
    2: { kuaName: 'Khôn', element: 'THO', group: 'TAY_TU_MENH', auspiciousDirections: { sinhKhi: 'Đông Bắc', thienY: 'Tây', dienNien: 'Tây Bắc', phucVi: 'Tây Nam' } },
    3: { kuaName: 'Chấn', element: 'MOC', group: 'DONG_TU_MENH', auspiciousDirections: { sinhKhi: 'Nam', thienY: 'Bắc', dienNien: 'Đông Nam', phucVi: 'Đông' } },
    4: { kuaName: 'Tốn', element: 'MOC', group: 'DONG_TU_MENH', auspiciousDirections: { sinhKhi: 'Bắc', thienY: 'Nam', dienNien: 'Đông', phucVi: 'Đông Nam' } },
    6: { kuaName: 'Càn', element: 'KIM', group: 'TAY_TU_MENH', auspiciousDirections: { sinhKhi: 'Tây', thienY: 'Đông Bắc', dienNien: 'Tây Nam', phucVi: 'Tây Bắc' } },
    7: { kuaName: 'Đoài', element: 'KIM', group: 'TAY_TU_MENH', auspiciousDirections: { sinhKhi: 'Tây Bắc', thienY: 'Tây Nam', dienNien: 'Đông Bắc', phucVi: 'Tây' } },
    8: { kuaName: 'Cấn', element: 'THO', group: 'TAY_TU_MENH', auspiciousDirections: { sinhKhi: 'Tây Nam', thienY: 'Tây Bắc', dienNien: 'Tây', phucVi: 'Đông Bắc' } },
    9: { kuaName: 'Ly', element: 'HOA', group: 'DONG_TU_MENH', auspiciousDirections: { sinhKhi: 'Đông', thienY: 'Đông Nam', dienNien: 'Bắc', phucVi: 'Nam' } }
  };

  return { kuaNumber: kua, ...BAZHAI_MAP[kua] };
}
