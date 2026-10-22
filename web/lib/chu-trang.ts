// ND-7 — "Chữ trên trang": mỗi đoạn chữ cố định của một trang (nhãn, tiêu đề mục, chip, bảng so sánh…) có một KHOÁ và
// chữ mặc định trong BẢNG CHỮ của trang (web/lib/chu/*.ts — nguồn duy nhất, trang đọc chữ qua bảng này). Sổ trang gửi bảng
// chữ cho CMS (mac_dinh.chu) để hiện chữ gốc; CMS lưu chữ thay ở ô `chu` = { khoá: chữ }. Web: chữ CMS > chữ mặc định.
// Chữ thuần (React tự thoát ký tự); `*đoạn*` = đoạn nhấn (màu nhấn của chỗ đó); `{bien}` = giá trị trang cấp (vd tên mảng).
// Thuần dữ liệu — dùng được ở máy chủ lẫn trình duyệt. Thiết kế: docs/KIEN-TRUC-NOI-DUNG-TRANG.md mục 10.

export type MucChu = {
  /** Mô tả cho người sửa (vd "Chip 1 dưới lời dẫn"). */ nhan: string;
  mac_dinh: string;
  /** Giới hạn ký tự (mặc định 300). */ toi_da?: number;
  /** Nhóm hiển thị trong CMS (vd "Đầu trang", "Bảng so sánh"). */ nhom?: string;
};
export type BangChu = Readonly<Record<string, MucChu>>;
/** Chữ CMS đã lưu: khoá → chữ thay. */
export type ChuCms = Readonly<Record<string, string>>;

export const TOI_DA_CHU = 300;
const KHOA = /^[a-z0-9_]+(\.[a-z0-9_]+)*$/;

/** Gộp nhiều bảng (bảng sau thắng khi trùng khoá). */
export const gopBang = (...ds: BangChu[]): BangChu => Object.assign({}, ...ds);

/** Lọc chữ CMS theo bảng: chỉ khoá có trong bảng, chuỗi không rỗng, bỏ thẻ HTML, cắt theo giới hạn. Không tin dữ liệu từ
 *  CMS (CMS cũng lọc khi lưu — đây là lớp thứ hai). */
export function locChu(bang: BangChu, cms: unknown): Record<string, string> {
  if (!cms || typeof cms !== "object" || Array.isArray(cms)) return {};
  const ra: Record<string, string> = {};
  for (const [k, v] of Object.entries(cms as Record<string, unknown>)) {
    const muc = bang[k];
    if (!muc || !KHOA.test(k) || typeof v !== "string") continue;
    const s = v.replace(/<[^>]*>/g, "").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, " ").trim().slice(0, muc.toi_da ?? TOI_DA_CHU).trim();
    if (s && s !== muc.mac_dinh) ra[k] = s;
  }
  return ra;
}

/** Thay {bien} bằng giá trị; biến không có giữ nguyên chữ. */
export const thayBienChu = (s: string, bien: Record<string, string> = {}) =>
  s.replace(/\{([a-z_]+)\}/g, (m, k: string) => (Object.hasOwn(bien, k) ? bien[k]! : m));

/** Hàm đọc chữ của một trang: `c("hero.chip_1")` → chữ CMS hoặc mặc định. Khoá lạ → chuỗi rỗng (bảng là nguồn duy nhất). */
export function taoChu<B extends BangChu>(bang: B, cms?: ChuCms | null) {
  const da = locChu(bang, cms);
  // Khoá sinh theo vòng lặp (vd `diem_mu.cau_${i}`) không suy được kiểu literal → nhận cả string; khoá sai thì chuỗi rỗng
  // (e2e/chu-trang.spec.ts kiểm mọi khoá trang dùng đều có trong bảng).
  return (k: (keyof B & string) | (string & {}), bien?: Record<string, string>): string => {
    if (!bang[k] && process.env.NODE_ENV !== "production") console.warn(`[chu-trang] khoá không có trong bảng: ${k}`);
    return thayBienChu(da[k] ?? bang[k]?.mac_dinh ?? "", bien);
  };
}
export type DocChu<B extends BangChu> = ReturnType<typeof taoChu<B>>;

/** "Bạn là *số mấy?*" → [{ chu: "Bạn là ", nhan: false }, { chu: "số mấy?", nhan: true }]. Dấu * lẻ giữ nguyên chữ. */
export function tachNhan(s: string): { chu: string; nhan: boolean }[] {
  const ra: { chu: string; nhan: boolean }[] = [];
  const re = /\*([^*\n]+)\*/g;
  let i = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > i) ra.push({ chu: s.slice(i, m.index), nhan: false });
    ra.push({ chu: m[1]!, nhan: true });
    i = m.index + m[0].length;
  }
  if (i < s.length) ra.push({ chu: s.slice(i), nhan: false });
  return ra;
}
/** Bỏ dấu nhấn (cho metadata, aria, chỗ chỉ nhận chữ thuần). */
export const boNhan = (s: string) => tachNhan(s).map((p) => p.chu).join("");

// ---------------------------------------------------------------- ND-7 đợt 2: "Hình trên trang"
/** Một chỗ đặt hình của trang: hình gốc là hình vẽ trong code (SVG, có chuyển động) — CMS cho thay bằng ảnh thư viện. */
export type MucHinh = {
  nhan: string;
  /** Mô tả hình gốc trong code (CMS hiện cho người sửa biết đang thay cái gì). */ mac_dinh: string;
  /** Gợi ý kích thước / tỉ lệ ảnh nên tải lên. */ goi_y: string;
  nhom?: string;
};
export type BangHinh = Readonly<Record<string, MucHinh>>;

/** Bảng chữ gửi CMS: chỉ nhãn + mặc định + giới hạn + nhóm (đúng dạng CMS đọc). */
export const bangChoCms = (bang: BangChu) =>
  Object.fromEntries(Object.entries(bang).map(([k, m]) => [k, { nhan: m.nhan, mac_dinh: m.mac_dinh, toi_da: m.toi_da ?? TOI_DA_CHU, ...(m.nhom ? { nhom: m.nhom } : {}) }]));
