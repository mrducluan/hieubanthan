// Hình học HIỂN THỊ cho sơ đồ nhà theo tỉ lệ (DoViTriVat.tsx) — tệp thuần, nạp được trong Node (test), không import `@/`.
// Web chỉ VẼ: hộp phòng mặc định, kẹp hộp trong tường, phía cửa trên bản vẽ, dời điểm bằng bàn phím.
// Tâm nhà, phương của từng chỗ và mọi dấu hiệu bố cục do MÁY CHỦ TÍNH TOÁN trả (`khung.tam`, `dau_hieu_goi_y`) — không tính ở đây.
// `diem` (0..1) là thứ duy nhất gửi đi; `kich_thuoc` / `huong_cua` chỉ gửi khi người dùng TỰ chỉnh.

export type LoaiVatKhung = "cua_chinh" | "phong_ngu_chinh" | "bep" | "ve_sinh" | "ban_tho" | "cau_thang" | "ban_cong";
export type HuongCua = "truoc" | "phai" | "sau" | "trai";

export const THU_TU_HUONG_CUA: readonly HuongCua[] = ["truoc", "phai", "sau", "trai"] as const;
/** Chỗ có "cửa phòng" để vẽ ký hiệu cửa (bàn thờ, cầu thang, cửa chính không có). */
export const PHONG_CO_CUA: readonly LoaiVatKhung[] = ["phong_ngu_chinh", "bep", "ve_sinh"] as const;

/** Kích thước chuẩn (rộng × sâu, mét) theo loại phòng/vật — tự co theo khung nhà nếu nhà hẹp. */
const KICH_THUOC_CHUAN: Record<LoaiVatKhung, [number, number]> = {
  cua_chinh: [1.4, 0.55],
  phong_ngu_chinh: [3.2, 3.6],
  bep: [2.4, 2.6],
  ve_sinh: [1.6, 2.0],
  ban_tho: [1.3, 1.0],
  cau_thang: [1.8, 2.4],
  ban_cong: [2.4, 1.0],
};

/** Kích thước mặc định hợp lý theo khung nhà (rộng × sâu, mét). */
export function kichThuocMacDinh(loai: LoaiVatKhung, rongNha: number, sauNha: number): [number, number] {
  const [w0, h0] = KICH_THUOC_CHUAN[loai] ?? [2.0, 2.0];
  const maxW = Math.max(0.6, Math.round(rongNha * (loai === "cua_chinh" ? 0.5 : 0.72) * 10) / 10);
  const maxH = Math.max(0.5, Math.round(sauNha * (loai === "cua_chinh" ? 0.25 : 0.45) * 10) / 10);
  return [
    Math.round(Math.min(w0, maxW) * 10) / 10,
    Math.round(Math.min(h0, maxH) * 10) / 10,
  ];
}

/** Hướng cửa mặc định thông minh theo loại phòng & vị trí chấm (x, y trong 0..1):
 *  - Cửa chính: luôn mở hướng ra Mặt trước (`truoc`) nếu ở nửa trước, hoặc hướng ra biên gần nhất.
 *  - Các phòng khác: cửa mặc định mở hướng về phía trục giữa nhà (hành lang trung tâm) để tự nhiên nhất. */
export function huongCuaMacDinh(loai: LoaiVatKhung, diem: [number, number]): HuongCua {
  const [x, y] = diem;
  if (loai === "cua_chinh") {
    if (y <= 0.25) return "truoc";
    if (y >= 0.85) return "sau";
    return x < 0.5 ? "trai" : "phai";
  }
  if (loai === "ban_tho") return "truoc";
  // Phòng ngủ / Bếp / WC / Cầu thang: nếu nằm sát vách trái (x < 0.38) thì cửa mở sang phải; sát vách phải (x > 0.62) thì mở sang trái; ở cuối nhà (y > 0.6) thì mở ra trước.
  if (x < 0.35) return "phai";
  if (x > 0.65) return "trai";
  return y > 0.5 ? "truoc" : "sau";
}

export function xoayHuongCua(h: HuongCua, buoc = 1): HuongCua {
  const idx = THU_TU_HUONG_CUA.indexOf(h);
  return THU_TU_HUONG_CUA[(idx + buoc + 4) % 4]!;
}

export interface HopPhongKhung {
  /** Toạ độ góc trên-trái và kích thước hiển thị (đơn vị mét trong viewBox `0..rong × 0..sau`). */
  x0: number;
  y0: number;
  w: number;
  h: number;
  /** Tâm hộp hiển thị (mét). */
  cx: number;
  cy: number;
  /** Điểm tâm chuẩn hoá 0..1 gửi lên engine (`diem` gốc). */
  diem: [number, number];
  huongCua: HuongCua;
  /** Toạ độ điểm giữa của cánh cửa trên cạnh phòng (mét). */
  cuaX: number;
  cuaY: number;
}

/** Tính hộp hiển thị của phòng trên mặt bằng `rong × sau` (mét):
 *  - Giữ nguyên `diem` (0..1) để gửi engine tính góc phương vị chính xác.
 *  - Kẹp hộp hiển thị `[x0, y0, w, h]` nằm gọn trong khung `0..rong × 0..sau` để người dùng chấm sát mép (vd 0.98, 0.98) thì phòng không bị tràn ra ngoài tường nhà. */
export function tinhHopPhong(
  loai: LoaiVatKhung,
  diem: [number, number],
  rongNha: number,
  sauNha: number,
  kichThuoc?: [number, number],
  huongCua?: HuongCua,
): HopPhongKhung {
  const [mw, mh] = kichThuoc ?? kichThuocMacDinh(loai, rongNha, sauNha);
  const w = Math.min(rongNha, Math.max(0.5, mw));
  const h = Math.min(sauNha, Math.max(0.45, mh));
  const px = diem[0] * rongNha;
  const py = diem[1] * sauNha;
  const x0 = Math.min(Math.max(0, px - w / 2), Math.max(0, rongNha - w));
  const y0 = Math.min(Math.max(0, py - h / 2), Math.max(0, sauNha - h));
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  const hc = huongCua ?? huongCuaMacDinh(loai, diem);
  const cuaX = hc === "trai" ? x0 : hc === "phai" ? x0 + w : cx;
  const cuaY = hc === "truoc" ? y0 : hc === "sau" ? y0 + h : cy;
  return { x0, y0, w, h, cx, cy, diem, huongCua: hc, cuaX, cuaY };
}

const lam3 = (n: number) => Math.round(n * 1000) / 1000;

/** Dời điểm (0..1) đi `dxM` × `dyM` mét trên khung `rong × sau`, kẹp trong khung. Dùng cho phím mũi tên. */
export function dichDiem(diem: [number, number], dxM: number, dyM: number, rongNha: number, sauNha: number): [number, number] {
  const x = Math.min(1, Math.max(0, diem[0] + dxM / rongNha));
  const y = Math.min(1, Math.max(0, diem[1] + dyM / sauNha));
  return [lam3(x), lam3(y)];
}

/** Vị trí tương đối trên bản vẽ (chỉ để ĐỌC nhãn cho người dùng bàn phím / trình đọc màn hình — không phải phương la bàn). */
export function viTriTuongDoi(diem: [number, number]): { doc: "truoc" | "giua" | "sau"; ngang: "trai" | "giua" | "phai" } {
  const ba = <A, B, C>(v: number, a: A, b: B, c: C): A | B | C => (v < 1 / 3 ? a : v < 2 / 3 ? b : c);
  return { doc: ba(diem[1], "truoc", "giua", "sau"), ngang: ba(diem[0], "trai", "giua", "phai") };
}

// ---------------------------------------------------------------- TY-2 đợt 2: MỘT bản vẽ
type DiemOV = [number, number];
interface HoSoLuoiCu {
  bo_cuc?: { mat_bang?: { luoi: string[]; phong?: Record<string, DiemOV>; ban_cong?: DiemOV }; [k: string]: unknown };
  khung?: { rong: number; sau: number; luoi?: string[]; tu_luoi_cu?: boolean };
  tang_do?: { so: number; vat: Record<string, { mau?: number[]; diem?: DiemOV; [k: string]: unknown } | undefined> }[];
  [k: string]: unknown;
}
/** Hồ sơ nhà cũ có lưới vẽ tay (`bo_cuc.mat_bang`, ô (hàng, cột)) → sơ đồ tỉ lệ của "Đứng giữa nhà": khung rộng = số cột,
 *  sâu = số hàng (mỗi ô tạm 1 m — cùng giả định ô vuông của lưới cũ, nên phương các phòng engine tính không đổi), lưới giữ
 *  phần không xây, ô phòng → tâm ô (0..1) của tầng trệt. Chỉ đổi cách GHI dữ kiện người dùng đã vẽ — không tính phương.
 *  Đã có sơ đồ → chỉ bỏ lưới cũ. Chỗ không có trên sơ đồ (phòng làm việc) bỏ; chỗ đã đo bằng la bàn (mau) giữ nguyên. */
export function luoiCuSangSoDo<T extends HoSoLuoiCu>(h: T, loaiVat: readonly string[]): T {
  const mb = h.bo_cuc?.mat_bang;
  if (!mb || !h.bo_cuc) return h;
  const { mat_bang: _bo, ...boCuc } = h.bo_cuc;
  void _bo;
  const coSoDo = Boolean(h.khung) || (h.tang_do ?? []).some((t) => Object.values(t.vat).some((v) => v?.diem));
  if (coSoDo) return { ...h, bo_cuc: boCuc };
  const hang = mb.luoi.length, cot = mb.luoi[0]?.length ?? 0;
  if (hang < 3 || cot < 3) return { ...h, bo_cuc: boCuc };
  const o: Record<string, DiemOV> = { ...(mb.phong ?? {}), ...(mb.ban_cong ? { ban_cong: mb.ban_cong } : {}) };
  const tang1 = h.tang_do?.find((t) => t.so === 1);
  const vat: Record<string, { mau?: number[]; diem?: DiemOV; [k: string]: unknown } | undefined> = { ...(tang1?.vat ?? {}) };
  for (const [ma, [r, c]] of Object.entries(o)) {
    if (!loaiVat.includes(ma) || r >= hang || c >= cot || vat[ma]?.mau) continue;
    vat[ma] = { diem: [Math.round(((c + 0.5) / cot) * 1000) / 1000, Math.round(((r + 0.5) / hang) * 1000) / 1000] };
  }
  const luoi = mb.luoi.map((r) => r.replace(/[#xX]/g, "1").replace(/[^1]/g, "0"));
  const kin = luoi.every((row) => !row.includes("0"));
  return {
    ...h,
    bo_cuc: boCuc,
    khung: { rong: cot, sau: hang, ...(kin ? {} : { luoi }), tu_luoi_cu: true },
    ...(Object.keys(vat).length ? { tang_do: [...(h.tang_do ?? []).filter((t) => t.so !== 1), { so: 1, vat }].sort((a, b) => a.so - b.so) } : {}),
  };
}
