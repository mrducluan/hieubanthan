// Thuật toán hình học thuần cho Sơ đồ nhà tỉ lệ (Mini-CAD Blueprint — DoViTriVat.tsx):
// 1. Kích thước phòng mặc định (rộng × sâu bằng mét, tự co theo khung nhà), kẹp hộp hiển thị trong biên nhà nhưng giữ nguyên tâm `diem` (0..1) để tương thích 100% với engine `/v1/phongthuy/vi-tri-vat`.
// 2. Hướng mở cửa phòng (`truoc` | `phai` | `sau` | `trai`) -> toạ độ bản lề, cánh cửa + cung mở cửa 90°, và quy đổi ra độ la bàn thật khi biết `huongNhaDo`.
// 3. Tâm nhà (trọng tâm phần diện tích xây dựng khi bỏ ô chữ L) + 8 phương la bàn.
// 4. Suy luận tự động dấu hiệu bố cục trên mặt bằng (`wc_giua_nha`, `cua_doi_nhau`, `bep_doi_cua`, `bep_wc`, `nha_chu_l`).

export type LoaiVatKhung = "cua_chinh" | "phong_ngu_chinh" | "bep" | "ve_sinh" | "ban_tho" | "cau_thang";
export type HuongCua = "truoc" | "phai" | "sau" | "trai";

export const THU_TU_HUONG_CUA: readonly HuongCua[] = ["truoc", "phai", "sau", "trai"] as const;

export const GOC_CUC_BO_CUA: Record<HuongCua, number> = {
  truoc: 0,
  phai: 90,
  sau: 180,
  trai: 270,
};

const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] as const;

/** Kích thước chuẩn (rộng × sâu, mét) theo loại phòng/vật — tự co theo khung nhà nếu nhà hẹp. */
const KICH_THUOC_CHUAN: Record<LoaiVatKhung, [number, number]> = {
  cua_chinh: [1.4, 0.55],
  phong_ngu_chinh: [3.2, 3.6],
  bep: [2.4, 2.6],
  ve_sinh: [1.6, 2.0],
  ban_tho: [1.3, 1.0],
  cau_thang: [1.8, 2.4],
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

/** Đổi hướng cửa trên bản vẽ (`truoc/phai/sau/trai`) + độ hướng mặt tiền nhà (`huongNhaDo`) sang độ la bàn (0..360) và tên 8 hướng. */
export function doLaBanCua(huongCua: HuongCua, huongNhaDo: number | null): { do: number | null; phuong: string | null } {
  if (huongNhaDo == null) return { do: null, phuong: null };
  const d = (huongNhaDo + GOC_CUC_BO_CUA[huongCua] + 360) % 360;
  const phuong = HUONG8[Math.floor(((d + 22.5) % 360) / 45)]!;
  return { do: Math.round(d), phuong };
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

/** Tâm nhà chuẩn hoá (0..1) theo lưới `luoi` (true = phần có xây). Nếu không bỏ ô nào thì tâm = (0.5, 0.5). */
export function tamNhaKhung(luoi: boolean[][] | null): [number, number] {
  if (!luoi || !luoi.length) return [0.5, 0.5];
  const nH = luoi.length;
  const nC = luoi[0]?.length || 1;
  let sx = 0, sy = 0, dem = 0;
  for (let r = 0; r < nH; r++) {
    for (let c = 0; c < nC; c++) {
      if (luoi[r]?.[c]) {
        sx += (c + 0.5) / nC;
        sy += (r + 0.5) / nH;
        dem++;
      }
    }
  }
  return dem > 0 ? [Math.round((sx / dem) * 1000) / 1000, Math.round((sy / dem) * 1000) / 1000] : [0.5, 0.5];
}

export interface VatTrenKhung {
  diem?: [number, number];
  kich_thuoc?: [number, number];
  huong_cua?: HuongCua;
}

/** Tự động suy luận dấu hiệu phong thuỷ từ sơ đồ khung phòng + hướng cửa đã vẽ:
 *  - `wc_giua_nha`: Tâm hoặc vùng nhà vệ sinh rơi vào vùng Trung cung (1/3 giữa nhà).
 *  - `nha_chu_l`: Bỏ bớt từ 2 ô góc trở lên trên lưới 4×4 (khuyết góc ≥ 12.5% diện tích).
 *  - `cua_doi_nhau`: Hai phòng có cửa mở đối diện trực tiếp nhau (cùng trục ngang hoặc dọc và nhìn vào nhau).
 *  - `bep_doi_cua`: Cửa chính và Bếp nhìn thẳng vào nhau trên cùng trục.
 *  - `bep_wc`: Bếp và Nhà vệ sinh nằm sát vách nhau hoặc cửa mở thẳng vào nhau. */
export function suyDauHieuTuKhung(
  doHienTai: Partial<Record<LoaiVatKhung, VatTrenKhung>>,
  rongNha: number,
  sauNha: number,
  luoi: boolean[][] | null,
): string[] {
  const kq = new Set<string>();
  const hop: Partial<Record<LoaiVatKhung, HopPhongKhung>> = {};
  for (const [k, v] of Object.entries(doHienTai) as [LoaiVatKhung, VatTrenKhung][]) {
    if (v?.diem) {
      hop[k] = tinhHopPhong(k, v.diem, rongNha, sauNha, v.kich_thuoc, v.huong_cua);
    }
  }

  // 1. Nhà chữ L / khuyết góc
  if (luoi) {
    const bo = luoi.flat().filter((v) => !v).length;
    if (bo >= 2) kq.add("nha_chu_l");
  }

  // 2. WC giữa nhà (Trung cung: x trong [1/3, 2/3] và y trong [1/3, 2/3])
  const wc = hop.ve_sinh;
  if (wc) {
    const nx = wc.diem[0], ny = wc.diem[1];
    if (nx >= 1 / 3 && nx <= 2 / 3 && ny >= 1 / 3 && ny <= 2 / 3) {
      kq.add("wc_giua_nha");
    }
  }

  // Hàm kiểm tra hai cửa a và b đối diện nhau
  const doiCua = (a: HopPhongKhung, b: HopPhongKhung): boolean => {
    const dungSai = Math.max(0.9, Math.min(rongNha, sauNha) * 0.22);
    // Trục trái - phải: a mở sang phải, b ở bên phải mở sang trái, cùng tầm y
    if (a.huongCua === "phai" && b.huongCua === "trai" && a.cuaX <= b.cuaX + 0.3 && Math.abs(a.cuaY - b.cuaY) <= dungSai) return true;
    if (a.huongCua === "trai" && b.huongCua === "phai" && b.cuaX <= a.cuaX + 0.3 && Math.abs(a.cuaY - b.cuaY) <= dungSai) return true;
    // Trục trước - sau: a mở ra sau, b ở phía sau mở ra trước, cùng tầm x
    if (a.huongCua === "sau" && b.huongCua === "truoc" && a.cuaY <= b.cuaY + 0.3 && Math.abs(a.cuaX - b.cuaX) <= dungSai) return true;
    if (a.huongCua === "truoc" && b.huongCua === "sau" && b.cuaY <= a.cuaY + 0.3 && Math.abs(a.cuaX - b.cuaX) <= dungSai) return true;
    return false;
  };

  // 3. Hai cửa phòng đối thẳng nhau
  const dsPhong = (["phong_ngu_chinh", "bep", "ve_sinh", "ban_tho"] as LoaiVatKhung[])
    .map((k) => hop[k])
    .filter((x): x is HopPhongKhung => Boolean(x));
  for (let i = 0; i < dsPhong.length; i++) {
    for (let j = i + 1; j < dsPhong.length; j++) {
      if (doiCua(dsPhong[i]!, dsPhong[j]!)) {
        kq.add("cua_doi_nhau");
      }
    }
  }

  // 4. Bếp nhìn thẳng ra cửa chính (`bep_doi_cua`)
  const cua = hop.cua_chinh;
  const bep = hop.bep;
  if (cua && bep) {
    const cungTrucX = Math.abs(cua.cx - bep.cx) <= Math.max(1.0, rongNha * 0.24);
    if ((cungTrucX && bep.huongCua === "truoc" && cua.cy < bep.cy) || doiCua(cua, bep)) {
      kq.add("bep_doi_cua");
    }
  }

  // 5. Bếp sát / chung vách nhà vệ sinh hoặc cửa bếp đối cửa WC (`bep_wc`)
  if (bep && wc) {
    const gapX = Math.max(0, Math.max(bep.x0 - (wc.x0 + wc.w), wc.x0 - (bep.x0 + bep.w)));
    const gapY = Math.max(0, Math.max(bep.y0 - (wc.y0 + wc.h), wc.y0 - (bep.y0 + bep.h)));
    const chungVach = (gapX <= 0.35 && gapY <= 0.2) || (gapY <= 0.35 && gapX <= 0.2);
    if (chungVach || doiCua(bep, wc)) {
      kq.add("bep_wc");
    }
  }

  return [...kq];
}
