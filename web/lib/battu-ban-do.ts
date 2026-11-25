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
  nam: { nam: number; can: string; chi: string; loai: LoaiNoi; muc: MucCach | null; cau: string }[];
  vi_sao: string[]; chuong: string;
}
export interface TruBanDo {
  i: number; ten: string; tang: string; tuoi_tu: number; tuoi_den: number | null; nam_tu: number; nam_den: number | null;
  dang_o: boolean; da_qua: boolean;
}
export interface ChamNam { o: MaO; loai: LoaiNoi }
export interface NamBanDo {
  nam: number; can: string; chi: string; thap_than: string; tuoi: number; dai_van: number | null; qua: boolean;
  hanh_can: string; hanh_chi: string;
  /** Năm nay + chín năm tới: đúng mức chương "Mười năm tới" (một nguồn). */
  muc?: MucCach; nhan_muc?: string; mang?: string;
  /** Cách a: chỉ năm nay có lời nên tránh / nên làm; năm sau `khoa` = lời nằm trong chương trả Sao. */
  y?: string; nen_tranh?: string; nen_lam?: string; khoa?: boolean;
  cham: ChamNam[]; cau: string; chi_tiet: string[]; ma?: string; dc?: [MucCach, MucCach]; hoi?: string;
}
export interface VanBanDo {
  i: number; can: string; chi: string; thap_than: string; tu_nam: number; den_nam: number; tu_tuoi: number; hien_tai: boolean;
  nhan: string;
  cham: ChamNam[]; chi_tiet: string[]; cau: string;
}
export interface HanhBanDo {
  hanh: string; phan_tram: number; so_chu: number; dung: Dung; nhat_chu: boolean; nhieu: boolean; thieu: boolean;
  nhom: string; y: string; cau_dung: string | null;
}
export interface BanDoBatTu {
  phien_ban: string; tuoi: number; nguoi_lon: boolean; tru: TruBanDo[]; o: OBanDo[]; suc: number; ngu_hanh: HanhBanDo[];
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

/** Điểm trên vòng tròn: góc tính theo độ, 0 = đỉnh, chiều kim đồng hồ (hệ SVG tâm 0, 0). */
export function diemTron(r: number, goc: number): [number, number] {
  const t = ((goc - 90) * Math.PI) / 180;
  return [r * Math.cos(t), r * Math.sin(t)];
}

/** Hình quạt vành khăn r0..r1 từ góc a0 tới a1 (độ). */
export function quat(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = diemTron(r1, a0), [x1, y1] = diemTron(r1, a1), [x2, y2] = diemTron(r0, a1), [x3, y3] = diemTron(r0, a0);
  const l = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${r1} ${r1} 0 ${l} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${l} 0 ${x3} ${y3}Z`;
}

/** Góc giữa của ô trên bánh xe: trụ i chiếm góc phần tư i (năm ở góc trên phải, theo chiều kim đồng hồ). */
export const gocO = (o: { tru: number }) => o.tru * 90 + 45;
/** Tuổi → góc trên vòng đời (0–90 tuổi = một vòng). */
export const gocTuoi = (t: number) => (Math.max(0, Math.min(90, t)) / 90) * 360;

/** Các cặp ô có quan hệ (không lặp hai chiều). */
export function capNoi(ds: Pick<OBanDo, "ma" | "noi_voi">[]): { a: MaO; b: MaO; loai: LoaiNoi }[] {
  const thay = new Set<string>(), ra: { a: MaO; b: MaO; loai: LoaiNoi }[] = [];
  for (const o of ds) for (const n of o.noi_voi) {
    const k = [o.ma, n.o].sort().join("|") + n.loai;
    if (!thay.has(k)) { thay.add(k); ra.push({ a: o.ma, b: n.o, loai: n.loai }); }
  }
  return ra;
}
