// BD-1 — kiểu dữ liệu "Bản đồ lá số" Bát tự (engine /v1/battu/ban-do) + hàm thuần cho phần đối chiếu năm đã qua.
// Web chỉ vẽ: mọi lời, mức, quan hệ, tuổi, năm do engine tính.
import type { MucCach, TraLoi } from "@/lib/cach-chinh-battu";
import type { TenHien } from "@/lib/ten-hien";

export type MaO = "c0" | "c1" | "c2" | "c3" | "z0" | "z1" | "z2" | "z3";
export type LoaiNoi = "hop" | "xung" | "hinh" | "hai" | "pha" | "trung";
export type Dung = "them" | "bot" | "mot_them" | "mot_bot" | "nguoc" | null;

export interface OBanDo {
  ma: MaO; tru: number; hang: "can" | "chi"; can?: string; chi?: string; hanh: string; thap_than?: string; nhom?: string;
  la_ban: boolean; dung: Dung; nguoi?: string;
  la_gi: string[]; o_dau: string[]; noi_voi: { o: MaO; loai: LoaiNoi; cau: string }[];
  nam: { nam: number; can: string; chi: string; loai: LoaiNoi; cau: string }[];
  vi_sao: string[]; chuong: string;
}
export interface TruBanDo {
  i: number; ten: string; tang: string; tuoi_tu: number; tuoi_den: number | null; nam_tu: number; nam_den: number | null;
  dang_o: boolean; da_qua: boolean;
}
export interface ChamNam { o: MaO; loai: LoaiNoi }
export interface NamBanDo {
  nam: number; can: string; chi: string; thap_than: string; tuoi: number; dai_van: number | null; qua: boolean;
  cham: ChamNam[]; cau: string; chi_tiet: string[]; ma?: string; dc?: [MucCach, MucCach]; hoi?: string;
}
export interface VanBanDo {
  i: number; can: string; chi: string; thap_than: string; tu_nam: number; den_nam: number; tu_tuoi: number; hien_tai: boolean;
  cham: ChamNam[]; chi_tiet: string[]; cau: string;
}
export interface BanDoBatTu {
  phien_ban: string; tuoi: number; nguoi_lon: boolean; tru: TruBanDo[]; o: OBanDo[];
  noi_bat: { ma: string; o: MaO[]; cau: string }[]; trich: { sach: string; thien: string; han: string; y: string }[]; tuoi_ghi_chu?: string;
  thoi_gian: {
    nam_xem: number; nam: NamBanDo[]; dai_van: VanBanDo[]; hoi_dan: string; nam_toi: string;
    cach: Record<"cach_1" | "cach_2", { ten: string; mo_ta: string; hanh: string[] }>;
    lua_chon: { ma: TraLoi; nhan: string }[]; luat: { toi_thieu: number; chenh: number };
    ket_luan: Record<"cach_1" | "cach_2" | "nghieng_1" | "nghieng_2" | "chua_ro", string>;
  };
  ten_hien?: TenHien | null;
}

/** Năm đã qua có câu hỏi đối chiếu → câu theo khuôn `ketQua` của BT-DC (cùng mã `nam.YYYY`, dùng chung câu trả lời). */
export function cauDoiChieu(bd: Pick<BanDoBatTu, "thoi_gian">) {
  return bd.thoi_gian.nam.filter((n) => n.ma && n.dc).map((n) => ({ ma: n.ma!, cach_1: n.dc![0], cach_2: n.dc![1] }));
}

/** Toạ độ tâm ô trên lưới 4 cột × 2 hàng (hệ 400 × 200) — để vẽ đường nối. */
export function tamO(ma: MaO): [number, number] {
  const i = Number(ma[1]);
  return [50 + 100 * i, ma[0] === "c" ? 50 : 150];
}

/** Đường nối hai ô (hệ 400 × 200, lưới cao 200): cùng hàng thì cong ra NGOÀI lưới (trên hàng can, dưới hàng chi) để
 *  không đè chữ; khác hàng thì thẳng tâm–tâm (đi dưới nền ô bán trong suốt). */
export function duongNoi(a: MaO, b: MaO): string {
  const [x1, y1] = tamO(a), [x2, y2] = tamO(b);
  if (y1 !== y2) return `M${x1} ${y1} L${x2} ${y2}`;
  const xa = Math.abs(x2 - x1) / 100 - 1;
  if (y1 === 50) return `M${x1} 4 Q${(x1 + x2) / 2} ${-30 - 10 * xa} ${x2} 4`;
  return `M${x1} 196 Q${(x1 + x2) / 2} ${230 + 10 * xa} ${x2} 196`;
}

/** Các cặp ô có quan hệ (không lặp hai chiều). */
export function capNoi(ds: Pick<OBanDo, "ma" | "noi_voi">[]): { a: MaO; b: MaO; loai: LoaiNoi }[] {
  const thay = new Set<string>(), ra: { a: MaO; b: MaO; loai: LoaiNoi }[] = [];
  for (const o of ds) for (const n of o.noi_voi) {
    const k = [o.ma, n.o].sort().join("|") + n.loai;
    if (!thay.has(k)) { thay.add(k); ra.push({ a: o.ma, b: n.o, loai: n.loai }); }
  }
  return ra;
}

const SLUG: Record<string, string> = { "Kim": "kim", "Mộc": "moc", "Thủy": "thuy", "Hỏa": "hoa", "Thổ": "tho" };
export const slugHanh = (h: string) => SLUG[h] ?? "";
