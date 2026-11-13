// EN-ALL GĐ 3d — tên HIỂN THỊ của trường MÃ trong phản hồi engine. Engine giữ giá trị mã bằng chữ Việt (web dùng làm khoá:
// tô màu theo hành, đặt chi trên vòng, so cách cục) và ở bản Anh kèm `ten_hien` = { nhóm: { mã: tên Anh } } cho mọi mã
// có trong phản hồi (kb/ten.KHOA_MA). Mọi chỗ HIỆN một mã đi qua `tenTheo(...)`: bản Việt không có `ten_hien` → trả đúng mã
// (HTML bản Việt không đổi). Thuần hàm — dùng được ở máy chủ, trình duyệt, test.

export type TenHien = Readonly<Record<string, Readonly<Record<string, string>>>>;

/** Dự phòng cho ba nhóm có tập mã CỐ ĐỊNH và nhỏ (10 can, 12 chi, 5 hành) — vòng 12 địa chi, ngũ giác ngũ hành vẽ đủ mọi
 *  mã kể cả mã không có trong phản hồi. Cùng tên với engine `kb/data/ten_en.json` (pinyin, không dịch nghĩa). */
const DU_PHONG_EN: TenHien = {
  can: { "Giáp": "Jia", "Ất": "Yi", "Bính": "Bing", "Đinh": "Ding", "Mậu": "Wu", "Kỷ": "Ji", "Canh": "Geng", "Tân": "Xin", "Nhâm": "Ren", "Quý": "Gui" },
  chi: { "Tý": "Zi", "Sửu": "Chou", "Dần": "Yin", "Mão": "Mao", "Thìn": "Chen", "Tỵ": "Si", "Ngọ": "Wu", "Mùi": "Wei", "Thân": "Shen", "Dậu": "You (Rooster)", "Tuất": "Xu", "Hợi": "Hai" },
  hanh: { "Kim": "Metal", "Thủy": "Water", "Mộc": "Wood", "Hỏa": "Fire", "Thổ": "Earth" },
  am_duong: { "Âm": "Yin", "Dương": "Yang" },
  // EN-ALL GĐ 5: Phong thuỷ — 8 hướng, 8 quái, 8 du niên, nhóm Đông/Tây (la bàn, ô chọn hướng vẽ đủ 8 kể cả mã không có
  // trong phản hồi). Cùng tên với engine `ten_en.json` mục `phongthuy`.
  huong: { "Bắc": "North", "Đông Bắc": "North-East", "Đông": "East", "Đông Nam": "South-East", "Nam": "South", "Tây Nam": "South-West",
    "Tây": "West", "Tây Bắc": "North-West", "Trung cung": "Centre", "Trung tâm": "Middle" },
  quai: { "Khảm": "Kan", "Khôn": "Kun", "Chấn": "Zhen", "Tốn": "Xun", "Càn": "Qian", "Đoài": "Dui", "Cấn": "Gen", "Ly": "Li" },
  du_nien: { "Sinh Khí": "Sheng Qi (Vitality)", "Thiên Y": "Tian Yi (Health)", "Diên Niên": "Yan Nian (Harmony)",
    "Phục Vị": "Fu Wei (Stability)", "Hoạ Hại": "Huo Hai (Minor Mishaps)", "Lục Sát": "Liu Sha (Friction)", "Ngũ Quỷ": "Wu Gui (Setbacks)",
    "Tuyệt Mệnh": "Jue Ming (Depletion)" },
  nhom_trach: { "Đông tứ mệnh": "East Group", "Tây tứ mệnh": "West Group", "Đông tứ trạch": "East-group house", "Tây tứ trạch": "West-group house" },
  // 24 sơn (ô chọn toạ sơn Huyền Không liệt kê đủ 24) + 9 sao bay.
  son: { "Nhâm": "Ren (N1)", "Tý": "Zi (N2)", "Quý": "Gui (N3)", "Sửu": "Chou (NE1)", "Cấn": "Gen (NE2)", "Dần": "Yin (NE3)", "Giáp": "Jia (E1)",
    "Mão": "Mao (E2)", "Ất": "Yi (E3)", "Thìn": "Chen (SE1)", "Tốn": "Xun (SE2)", "Tỵ": "Si (SE3)", "Bính": "Bing (S1)", "Ngọ": "Wu (S2)",
    "Đinh": "Ding (S3)", "Mùi": "Wei (SW1)", "Khôn": "Kun (SW2)", "Thân": "Shen (SW3)", "Canh": "Geng (W1)", "Dậu": "You (W2)", "Tân": "Xin (W3)",
    "Tuất": "Xu (NW1)", "Càn": "Qian (NW2)", "Hợi": "Hai (NW3)" },
  sao_bay: { "Nhất Bạch": "1 White", "Nhị Hắc": "2 Black", "Tam Bích": "3 Jade", "Tứ Lục": "4 Green", "Ngũ Hoàng": "5 Yellow", "Lục Bạch": "6 White",
    "Thất Xích": "7 Red", "Bát Bạch": "8 White", "Cửu Tử": "9 Purple" },
};

/** Gộp nhiều bảng `ten_hien` (lá số + lưu niên + báo cáo…); bảng sau thắng khi trùng. */
export function gopTenHien(...ds: (TenHien | null | undefined)[]): TenHien | null {
  const co = ds.filter((x): x is TenHien => Boolean(x));
  if (!co.length) return null;
  const ra: Record<string, Record<string, string>> = {};
  for (const t of co) for (const [nhom, bang] of Object.entries(t)) ra[nhom] = { ...(ra[nhom] ?? {}), ...bang };
  return ra;
}

/** Hàm đọc tên: `ten("chi", "Tý")`. `en = false` (bản Việt) → luôn trả nguyên mã. Bản Anh: nhóm đúng → nhóm khác có cùng
 *  mã → bảng dự phòng → nguyên mã (thiếu tên là lỗi của engine — bộ soát chữ bản Anh bắt). */
export function tenTheo(th: TenHien | null | undefined, en: boolean) {
  return (nhom: string, ma: string | null | undefined): string => {
    if (!ma) return ma ?? "";
    if (!en) return ma;
    const thang = th?.[nhom]?.[ma];
    if (thang) return thang;
    if (th) for (const b of Object.values(th)) if (b[ma]) return b[ma]!;
    return DU_PHONG_EN[nhom]?.[ma] ?? DU_PHONG_EN.can?.[ma] ?? DU_PHONG_EN.chi?.[ma] ?? DU_PHONG_EN.hanh?.[ma]
      ?? Object.values(DU_PHONG_EN).find((b) => b[ma])?.[ma] ?? ma;
  };
}
export type DocTen = ReturnType<typeof tenTheo>;

/** Bỏ chú giải trong ngoặc ở CUỐI tên ("Lu (Prosperity)" → "Lu"). Không dùng regex `\s*\(.*\)$` (CodeQL: polynomial ReDoS). */
export function boChuGiai(s: string): string {
  const t = s.trimEnd();
  if (!t.endsWith(")")) return s;
  const i = t.lastIndexOf("(");
  return i > 0 ? t.slice(0, i).trimEnd() : s;
}
