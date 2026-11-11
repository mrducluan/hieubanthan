// TM-1 (C-2) — mục lục cho các cụm kiến thức dài: chia bài thành NHÓM (mỗi nhóm một tiêu đề H2 + neo, chip nhảy tới nhóm)
// và tuỳ chọn một bộ LỌC phụ (vd lọc 168 trang "sao ở cung" theo cung). Chỉ đọc tiêu đề / slug engine đã trả — không tính gì.
// Nhóm sai định dạng (engine đổi tiêu đề) → bài vào nhóm "Khác", không mất bài nào. Thuần dữ liệu, dùng được ở trình duyệt.

export type BaiCum = { duong: string; tieu_de: string; mo_ta: string };
export type NhomCum = { ma: string; ten: string; tieuDe: string; bai: (BaiCum & { phu: string[] })[] };
export type BoLoc = { nhan: string; ds: { ma: string; ten: string }[] };
export type MucLucCum = { nhanNhom: string; viDu: string; nhom: NhomCum[]; loc: BoLoc | null };

/** "Thủy" / "Thuỷ", "Hỏa" / "Hoả" → một mã; bỏ dấu, chữ thường, gạch nối. */
export function maChu(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Tach = { nhom: [string, string] | null; phu: [string, string][] };
/** `tieuDe`: chữ H2 của nhóm — câu tự đứng được khi máy tìm kiếm / AI trích riêng một mục (AEO), khác `ten` ngắn của chip. */
type Luat = { nhanNhom: string; viDu: string; tach: (b: BaiCum) => Tach; tieuDe: (ten: string) => string; loc?: { nhan: string; thuTu?: string[] }; thuTuNhom?: string[] };

const cap = (ten: string): [string, string] => [maChu(ten), ten];

/** "Tử Vi ở cung Mệnh: …" → sao = Tử Vi, cung = Mệnh. */
const SAO_CUNG = /^(.+?) ở cung (.+?)\s*[:：—-]/;
/** Thứ tự 12 cung trên lá số (Mệnh → Phụ Mẫu) cho chip lọc. */
const THU_TU_CUNG = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Quan Lộc", "Điền Trạch", "Phúc Đức", "Phụ Mẫu"].map(maChu);

/** Quẻ "Thuần X" = quái X chồng lên chính nó; quẻ khác: chữ đầu là hình tượng quái trên. */
const QUAI: Record<string, string> = {
  thien: "Càn · Trời", dia: "Khôn · Đất", loi: "Chấn · Sấm", phong: "Tốn · Gió",
  thuy: "Khảm · Nước", hoa: "Ly · Lửa", son: "Cấn · Núi", trach: "Đoài · Đầm",
};
const THUAN: Record<string, string> = { can: "thien", khon: "dia", chan: "loi", ton: "phong", kham: "thuy", ly: "hoa", doai: "trach" };
const QUE = /^Quẻ \d+ (\S+) (\S+)/;
function quaiTren(tieuDe: string): string | null {
  const m = tieuDe.match(QUE);
  if (!m) return null;
  const a = maChu(m[1]!), b = maChu(m[2]!);
  if (a !== "thuan") return QUAI[a] ? a : null;
  // "Thuần Cấn" và "Thuần Càn" cùng bỏ dấu thành "can" — phân biệt bằng chữ gốc.
  const goc = m[2]!.normalize("NFC");
  if (goc.startsWith("Cấn")) return "son";
  return THUAN[b] ?? null;
}

const LUAT: Record<string, Luat> = {
  "sao-cung": { nhanNhom: "Theo sao", tieuDe: (t) => `Sao ${t} ở 12 cung`, viDu: "Thái Dương, Phu Thê…", loc: { nhan: "Theo cung", thuTu: THU_TU_CUNG },
    tach: (b) => { const m = b.tieu_de.match(SAO_CUNG); return m ? { nhom: cap(m[1]!), phu: [cap(m[2]!)] } : { nhom: null, phu: [] }; } },
  "tu-hoa": { nhanNhom: "Theo hoá", tieuDe: (t) => `${t} ở 12 cung`, viDu: "Hoá Kỵ, Tài Bạch…", loc: { nhan: "Theo cung", thuTu: THU_TU_CUNG },
    tach: (b) => { const m = b.tieu_de.match(SAO_CUNG); return m ? { nhom: cap(m[1]!), phu: [cap(m[2]!)] } : { nhom: null, phu: [] }; } },
  "kinh-dich": { nhanNhom: "Theo quái trên", tieuDe: (t) => `Quẻ có quái trên ${t.replace(" · ", " (")})`, viDu: "Càn, Thái, Vị Tế…", thuTuNhom: Object.keys(QUAI),
    tach: (b) => { const q = quaiTren(b.tieu_de); return { nhom: q ? [q, QUAI[q]!] : null, phu: [] }; } },
  "menh-tuoi": { nhanNhom: "Theo thập niên", tieuDe: (t) => `Sinh năm ${t} mệnh gì`, viDu: "1990, Canh Ngọ, Lộ Bàng Thổ…",
    tach: (b) => { const n = Number(b.duong.match(/sinh-nam-(\d{4})/)?.[1]); if (!n) return { nhom: null, phu: [] };
      const d = Math.floor(n / 10) * 10; return { nhom: [`thap-nien-${d}`, `${d}–${d + 9}`], phu: [] }; } },
  "so-kep": { nhanNhom: "Theo hàng chục", tieuDe: (t) => `Ý nghĩa số kép ${t.replace(/^Số /, "")}`, viDu: "19, ngôi sao…",
    tach: (b) => { const n = Number(b.duong.match(/so-kep-(\d+)/)?.[1]); if (!n) return { nhom: null, phu: [] };
      const d = Math.min(40, Math.floor(n / 10) * 10); return { nhom: [`so-${d}`, d === 40 ? "Số 40–52" : `Số ${d}–${d + 9}`], phu: [] }; } },
  "hop-so": { nhanNhom: "Theo số nhỏ hơn", tieuDe: (t) => `${t.replace(" với…", "")} hợp với số nào`, viDu: "3 và 7…", loc: { nhan: "Có số" },
    tach: (b) => { const m = b.duong.match(/so-chu-dao-(\d+)-va-(\d+)/); if (!m) return { nhom: null, phu: [] };
      const a = m[1]!, c = m[2]!;
      return { nhom: [`so-${a}`, `Số ${a} với…`], phu: [...new Set([a, c])].map((x) => [`so-${x}`, `Số ${x}`] as [string, string]) }; } },
};

/** Khoá chủ đề có mục lục (cụm ≥ 40 trang). */
export const CUM_CO_MUC_LUC = Object.keys(LUAT);

/** Chia cụm thành nhóm theo thứ tự xuất hiện (hoặc thứ tự cố định của luật). Cụm không có luật → null (giữ lưới phẳng). */
export function mucLucCum(khoa: string, ds: BaiCum[]): MucLucCum | null {
  const l = LUAT[khoa];
  if (!l) return null;
  const nhom = new Map<string, NhomCum>(), loc = new Map<string, string>();
  for (const b of ds) {
    const t = l.tach(b);
    const [ma, ten] = t.nhom ?? ["khac", "Khác"];
    if (!nhom.has(ma)) nhom.set(ma, { ma, ten, tieuDe: ma === "khac" ? "Các trang khác" : l.tieuDe(ten), bai: [] });
    nhom.get(ma)!.bai.push({ ...b, phu: t.phu.map(([m]) => m) });
    for (const [m, n] of t.phu) if (!loc.has(m)) loc.set(m, n);
  }
  const xep = <T,>(ds: [string, T][], thuTu?: string[]) => thuTu
    ? ds.sort(([a], [b]) => (thuTu.indexOf(a) + 1 || 99) - (thuTu.indexOf(b) + 1 || 99)) : ds;
  const dsNhom = xep([...nhom.entries()], l.thuTuNhom).map(([, n]) => n);
  // "Khác" luôn cuối.
  dsNhom.sort((a, b) => Number(a.ma === "khac") - Number(b.ma === "khac"));
  const dsLoc = l.loc && loc.size ? { nhan: l.loc.nhan, ds: xep([...loc.entries()], l.loc.thuTu).map(([ma, ten]) => ({ ma, ten })) } : null;
  return { nhanNhom: l.nhanNhom, viDu: l.viDu, nhom: dsNhom, loc: dsLoc };
}
