// EN-ALL GĐ 3d — tên HIỂN THỊ của trường MÃ trong phản hồi engine. Engine giữ giá trị mã bằng chữ Việt (web dùng làm khoá:
// tô màu theo hành, đặt chi trên vòng, so cách cục) và ở bản Anh kèm `ten_hien` = { nhóm: { mã: tên Anh } } cho mọi mã
// có trong phản hồi (kb/ten.KHOA_MA). Mọi chỗ HIỆN một mã đi qua `tenTheo(...)`: bản Việt không có `ten_hien` → trả đúng mã
// (HTML bản Việt không đổi). Thuần hàm — dùng được ở máy chủ, trình duyệt, test.

export type TenHien = Readonly<Record<string, Readonly<Record<string, string>>>>;

/** Dự phòng cho ba nhóm có tập mã CỐ ĐỊNH và nhỏ (10 can, 12 chi, 5 hành) — vòng 12 địa chi, ngũ giác ngũ hành vẽ đủ mọi
 *  mã kể cả mã không có trong phản hồi. Cùng tên với engine `kb/data/ten_en.json` (pinyin, không dịch nghĩa). */
const DU_PHONG_EN: TenHien = {
  can: { "Giáp": "Jia", "Ất": "Yi", "Bính": "Bing", "Đinh": "Ding", "Mậu": "Wu", "Kỷ": "Ji", "Canh": "Geng", "Tân": "Xin", "Nhâm": "Ren", "Quý": "Gui" },
  chi: { "Tý": "Zi", "Sửu": "Chou", "Dần": "Yin", "Mão": "Mao", "Thìn": "Chen", "Tỵ": "Si", "Ngọ": "Wu", "Mùi": "Wei", "Thân": "Shen", "Dậu": "You", "Tuất": "Xu", "Hợi": "Hai" },
  hanh: { "Kim": "Metal", "Thủy": "Water", "Mộc": "Wood", "Hỏa": "Fire", "Thổ": "Earth" },
  am_duong: { "Âm": "Yin", "Dương": "Yang" },
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
    return DU_PHONG_EN[nhom]?.[ma] ?? DU_PHONG_EN.can?.[ma] ?? DU_PHONG_EN.chi?.[ma] ?? DU_PHONG_EN.hanh?.[ma] ?? ma;
  };
}
export type DocTen = ReturnType<typeof tenTheo>;
