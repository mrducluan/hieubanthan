// ND — kiểm định chữ của "Trang website" / "Mẫu cụm trang" trước khi lưu (máy chủ): gom mọi ô chữ biên tập viên gõ,
// chạy luật ranh giới chung (kiem-dinh.ts kiemRanhGioi) + link trong site + biến mẫu. Không gọi AI.
import { docLexical, kiemRanhGioi, type MucKiem } from "../kiem-dinh/kiem-dinh";

type Dong = Record<string, unknown>;
const mang = (v: unknown): Dong[] => (Array.isArray(v) ? v.filter((x): x is Dong => Boolean(x) && typeof x === "object") : []);
const chu = (v: unknown) => (typeof v === "string" ? v : "");

// Khoá không phải chữ hiển thị (đường dẫn, mã, ngày) — không đưa vào kiểm ranh giới.
const BO_KHOA = new Set(["id", "blockType", "blockName", "url", "link", "nut_link", "ma_do", "tu_ngay", "den_ngay", "kieu", "co", "can", "nen"]);
const KHOI_MOI = new Set(["loi_moi", "nut_moi", "banner"]);

function chuTrongKhoi(v: unknown, khoa = ""): string[] {
  if (typeof v === "string") return BO_KHOA.has(khoa) ? [] : [v];
  if (Array.isArray(v)) return v.flatMap((x) => chuTrongKhoi(x, khoa));
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => (BO_KHOA.has(k) ? [] : chuTrongKhoi(x, k)));
  return [];
}

export const VI_TRI = ["khoi_tren", "khoi_duoi", "khoi_cuoi"] as const;

/** Gom chữ của một tài liệu. `mucNoiQuyTrinh`: mục văn bản được phép nói về quy trình thẩm định (giới thiệu, pháp lý). */
export function gomChu(d: Dong, { mucNoiQuyTrinh = false } = {}) {
  const tuDo: string[] = [chu(d.tieu_de_seo), chu(d.mo_ta_seo), chu(d.h1), chu(d.loi_dan),
    ...mang(d.doan).map((x) => chu(x.chu)),
    ...mang(d.hoi_dap).flatMap((x) => [chu(x.cau_hoi), chu(x.tra_loi)]),
    ...mang(d.lien_ket).map((x) => chu(x.nhan))];
  const muc: string[] = [];
  const lienKetNgoai: string[] = [];
  for (const m of mang(d.muc)) {
    const l = docLexical(m.noi_dung);
    muc.push(chu(m.tieu_de), l.van);
    lienKetNgoai.push(...l.lienKetNgoai);
  }
  const loiMoi: string[] = [];
  for (const vt of VI_TRI) for (const k of mang(d[vt])) {
    (KHOI_MOI.has(String(k.blockType)) ? loiMoi : tuDo).push(...chuTrongKhoi(k));
  }
  return { tuDo: tuDo.filter(Boolean).join("\n"), muc: muc.filter(Boolean).join("\n"), loiMoi: loiMoi.filter(Boolean).join("\n"),
    lienKetNgoai, mucNoiQuyTrinh };
}

/** Biến {x} trong chữ khối không thuộc danh sách biến của mẫu → cảnh báo (web giữ nguyên chữ "{x}"). */
export function bienLa(van: string, bien: string[]): string[] {
  const co = new Set(bien);
  return [...new Set([...van.matchAll(/\{([a-z_]+)\}/g)].map((m) => m[1]!))].filter((b) => !co.has(b));
}

export function kiemTrang(d: Dong, opt: { mucNoiQuyTrinh?: boolean; bien?: string[] } = {}): { muc: MucKiem[]; chan: MucKiem[] } {
  const g = gomChu(d, opt);
  const muc: MucKiem[] = [
    ...kiemRanhGioi(g.tuDo),
    ...kiemRanhGioi(g.muc, { choThamDinh: Boolean(opt.mucNoiQuyTrinh) }),
    ...kiemRanhGioi(g.loiMoi, { loiMoi: true }),
  ];
  if (g.lienKetNgoai.length) muc.push({ ma: "lien_ket_ngoai", nhom: "noi_dung", muc_do: "loi", chan: true,
    thong_diep: `Mục văn bản có link ra ngoài site (${g.lienKetNgoai.slice(0, 3).join(", ")}) — chỉ dùng đường dẫn trong site.` });
  if (opt.bien) {
    const la = bienLa([g.tuDo, g.loiMoi].join("\n"), opt.bien);
    if (la.length) muc.push({ ma: "bien_la", nhom: "noi_dung", muc_do: "canh_bao",
      thong_diep: `Biến không có trong mẫu: ${la.map((b) => `{${b}}`).join(", ")} — web sẽ giữ nguyên chữ này.` });
  }
  // Gộp trùng (cùng mã + thông điệp) khi một lỗi xuất hiện ở nhiều nhóm ô.
  const thay = new Set<string>();
  const gon = muc.filter((m) => !thay.has(m.ma + m.thong_diep) && Boolean(thay.add(m.ma + m.thong_diep)));
  return { muc: gon, chan: gon.filter((m) => m.chan) };
}
