"use client";
// KC-2 — "Hồ sơ nhà" lưu TRÊN MÁY (localStorage), như hồ sơ người (lib/hoso.ts): hướng cửa / ban công, năm xây, người cùng ở,
// bố cục đã khai. Mọi khối Phong thuỷ (Nhà của bạn, Khảo sát nhà, Huyền Không, Đo hướng) đọc – ghi chung; thẻ "Tháng này
// nhà bạn" ở Hôm nay đọc từ đây. Không gửi máy chủ trừ lúc gọi engine tính; đồng bộ tài khoản là TUỲ CHỌN (lib/tai-khoan-nha.ts,
// migration 0018) khi người dùng tự bấm "Lưu nhà vào tài khoản".
import { useSyncExternalStore } from "react";
import { z } from "zod";
import { taoChu } from "@/lib/chu-trang";
import { CHU_PHONG_THUY_UI } from "@/lib/chu/phong-thuy";
import { tenTheo } from "@/lib/ten-hien";
import { luoiCuSangSoDo } from "@/lib/mat-bang-khung";

/** EN-ALL GĐ 5: chữ bản Anh của tên nhà / tên căn / loại nhà (bản Việt không dùng). */
const PT_EN = taoChu(CHU_PHONG_THUY_UI, null, "en");
const TEN_EN = tenTheo(null, true);
/** Tên loại nhà theo ngôn ngữ (bản Việt = TEN_LOAI_NHA). */
export const tenLoaiNha = (m: LoaiNha, en = false) => (en ? PT_EN(`hs.loai.${m}`) : TEN_LOAI_NHA[m]);

export const KHOA_HO_SO_NHA = "hbt.nha.v1";
const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] as const;

export const ThanhVienNha = z.object({
  vai: z.enum(["vo", "chong", "con", "cha_me", "khac"]),
  nam: z.number().int().min(1900).max(2100),
  gioi_tinh: z.enum(["nam", "nu"]),
});
export const LOAI_NHA = ["nha_pho", "can_ho", "biet_thu", "nha_cap4", "khac"] as const;
export type LoaiNha = (typeof LOAI_NHA)[number];
export const TEN_LOAI_NHA: Record<LoaiNha, string> = { nha_pho: "Nhà phố", can_ho: "Chung cư", biet_thu: "Biệt thự", nha_cap4: "Nhà cấp 4", khac: "Khác" };

/** VT-1: loại vật đo được khi "đứng giữa nhà, chĩa điện thoại" (khớp engine `/v1/phongthuy/vi-tri-vat`). */
export const LOAI_VAT = ["cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho", "cau_thang", "ban_cong"] as const;
export type LoaiVat = (typeof LOAI_VAT)[number];
/** Hướng cửa phòng / hướng nhìn của vật trong khung nhà (theo mặt bản vẽ: truoc = nhìn ra mặt tiền, phai = vách phải, sau = nhìn về hậu, trai = vách trái). */
export const HUONG_CUA_KHUNG = ["truoc", "phai", "sau", "trai"] as const;
export type HuongCuaKhung = (typeof HUONG_CUA_KHUNG)[number];
const MauDo = z.array(z.number().min(0).lt(360)).min(1).max(30);

export const HoSoNha = z.object({
  v: z.literal(1),
  /** UI-PT2 P5: mã căn khi đã "Lưu căn này để so" (khớp một mục trong danh sách căn). */
  id: z.string().min(4).max(24).optional(),
  /** Tên gọi tuỳ ý để phân biệt (vd "Nhà đang ở", "Căn định mua") — không bắt buộc, ≤ 40 ký tự. */
  ten_goi: z.string().trim().max(40).optional(),
  huong_do: z.number().min(0).lt(360).optional(),
  huong: z.enum(HUONG8).optional(),
  theo: z.enum(["cua", "ban_cong"]).default("cua"),
  nam_xay: z.number().int().min(1864).max(2150).optional(),
  toa: z.string().max(10).optional(),
  thanh_vien: z.array(ThanhVienNha).max(6).default([]),
  /** Loại nhà (Q6: căn hộ → luật thực hành căn hộ). */
  loai_nha: z.enum(LOAI_NHA).optional(),
  /** Bố cục đã khai ở Khảo sát nhà (schema BoCuc 0.2 của engine) — giữ nguyên để gửi lại; Q2: mặt bằng vẽ tay (lưới, ô phòng, ô ban công). */
  bo_cuc: z.object({
    vi_tri: z.record(z.string().max(30), z.string().max(12)).optional(),
    huong_do: z.record(z.string().max(30), z.number().min(0).lt(360)).optional(),
    dau_hieu: z.array(z.string().max(40)).optional(),
    /** PT-V2: mã trong `dau_hieu` mà người dùng đã bấm "Đúng" cho gợi ý máy đọc ảnh → gửi engine `nguon: "anh", xac_nhan: true`.
     *  CHỈ mã — ảnh (kể cả base64) không bao giờ vào hồ sơ nhà. */
    tu_anh: z.array(z.string().max(40)).max(40).optional(),
    /** PT-V2: mã người dùng bấm "Không" cho gợi ý máy đọc ảnh / hỏi nhanh — gửi engine `co: false, nguon: nguoi_dung` (thắng suy luận mặt bằng). */
    khai_khong: z.array(z.string().max(40)).max(40).optional(),
    /** UI-PT 4: dấu hiệu người dùng bấm "Tôi đã xử lý" — gửi engine `co: false` (thắng suy luận từ mặt bằng), Khảo sát không tích lại. */
    da_xu_ly: z.array(z.string().max(40)).optional(),
    /** SD-1: mã trong `dau_hieu` đến từ gợi ý của sơ đồ nhà theo tỉ lệ mà người dùng đã bấm "Có" — để khi sơ đồ đổi và gợi ý
     *  không còn, khối sơ đồ gỡ đúng các mã nó từng thêm (không đụng mã người dùng tích tay ở Khảo sát). */
    tu_so_do: z.array(z.string().max(40)).max(40).optional(),
    mat_bang: z.object({
      luoi: z.array(z.string().regex(/^[01]{3,12}$/)).min(3).max(12),
      phong: z.record(z.string().max(30), z.tuple([z.number().int().min(0).max(11), z.number().int().min(0).max(11)])).optional(),
      ban_cong: z.tuple([z.number().int().min(0).max(11), z.number().int().min(0).max(11)]).optional(),
    }).optional(),
  }).optional(),
  /** TY-2 đợt 3: nhà nhiều lớp (Tam Yếu) — số lớp từ cổng vào, lớp có dãy nhà chính, cổng lệch. Chỉ trên máy. */
  nhieu_lop: z.object({
    so_lop: z.number().int().min(1).max(15),
    lop_chu: z.number().int().min(1).max(15).optional(),
    cua_lech: z.boolean().optional(),
  }).optional(),
  /** TY-2: mã điều người dùng tự tích ở "Nhìn quanh nhà" (Dương Trạch Thập Thư) — chỉ mã, không chữ, không địa chỉ. */
  quan_sat: z.array(z.string().regex(/^[a-z_]{3,40}$/)).max(60).optional(),
  /** VT-1: "đứng giữa nhà, chĩa điện thoại" — mẫu la bàn thô (≤ 30 / vật) hoặc điểm trên khung tỉ lệ, theo tầng. Engine tính
   *  phương / sơn; web chỉ lưu số đo người dùng đã ghi (trên máy). */
  truc_mau: MauDo.optional(),
  khung: z.object({
    rong: z.number().positive().max(200),
    sau: z.number().positive().max(200),
    luoi: z.array(z.string().regex(/^[01]{3,12}$/)).min(3).max(12).optional(),
    /** TY-2 đợt 2: khung chuyển tự động từ lưới vẽ tay cũ (mỗi ô = 1 m, chưa phải số đo thật) — nhắc người dùng nhập số đo. */
    tu_luoi_cu: z.boolean().optional(),
    /** TY-2 gói 2: dải sân / giếng trời (y0, y1 theo chiều sâu, 0..1; 0 = mặt trước) — người dùng tự vẽ. Engine đếm lớp. */
    san: z.array(z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)])).max(14).optional(),
  }).optional(),
  tang_do: z.array(z.object({
    so: z.number().int().min(1).max(6),
    vat: z.partialRecord(z.enum(LOAI_VAT), z.object({
      mau: MauDo.optional(),
      diem: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).optional(),
      /** Kích thước khung phòng / vật (rộng × sâu, đơn vị mét) trên sơ đồ tỉ lệ. */
      kich_thuoc: z.tuple([z.number().min(0.4).max(100), z.number().min(0.4).max(100)]).optional(),
      /** Hướng cửa phòng / mặt nhìn của vật trên bản vẽ (truoc = mặt tiền, phai, sau, trai). */
      huong_cua: z.enum(HUONG_CUA_KHUNG).optional(),
      /** SD-1: người dùng TỰ chỉnh kích thước / TỰ xoay cửa (không phải giá trị máy tự điền). Chỉ khi cờ bật thì
       *  `kich_thuoc` / `huong_cua` mới được gửi đi tính; hồ sơ cũ không có cờ = coi như máy tự điền. */
      tu_dat_kt: z.boolean().optional(),
      tu_dat_cua: z.boolean().optional(),
    })),
  })).max(6).optional(),
  cap_nhat_luc: z.string(),
});
export type HoSoNha = z.infer<typeof HoSoNha>;
export type HoSoNhaVao = Partial<Omit<HoSoNha, "v" | "cap_nhat_luc">>;

// ---------------------------------------------------------------- TY-2 đợt 2: MỘT bản vẽ
/** Hồ sơ cũ có lưới vẽ tay (`bo_cuc.mat_bang`) → sơ đồ tỉ lệ dùng chung (hàm thuần `luoiCuSangSoDo`, lib/mat-bang-khung.ts). */
export function chuyenLuoiCu(h: HoSoNha): HoSoNha {
  return luoiCuSangSoDo(h as Parameters<typeof luoiCuSangSoDo>[0], LOAI_VAT) as HoSoNha;
}

/** Sơ đồ tầng trệt gửi engine (`bo_cuc.so_do`) — khung + điểm người dùng đã đặt; chưa có điểm nào → null. */
export function soDoGui(n: HoSoNha | null | undefined): { rong: number; sau: number; luoi?: string[]; vat: Record<string, [number, number]> } | null {
  if (!n?.khung) return null;
  const t1 = n.tang_do?.find((t) => t.so === 1);
  const vat = Object.fromEntries(Object.entries(t1?.vat ?? {}).flatMap(([k, v]) => (v?.diem ? [[k, v.diem]] : []))) as Record<string, [number, number]>;
  if (!Object.keys(vat).length) return null;
  return { rong: n.khung.rong, sau: n.khung.sau, ...(n.khung.luoi ? { luoi: n.khung.luoi } : {}), vat };
}

const nghe = new Set<() => void>();
let daDoc = false;
let hienTai: HoSoNha | null = null;

function doc(): HoSoNha | null {
  if (typeof window === "undefined") return null;
  if (!daDoc) {
    daDoc = true;
    try {
      const raw = window.localStorage.getItem(KHOA_HO_SO_NHA);
      const kq = raw ? HoSoNha.safeParse(JSON.parse(raw)) : null;
      hienTai = kq?.success ? chuyenLuoiCu(kq.data) : null;
    } catch { hienTai = null; }
  }
  return hienTai;
}
function bao() { nghe.forEach((f) => f()); }

/** Ghi đè / gộp vào hồ sơ nhà hiện có (gộp nông theo trường; `bo_cuc` thay cả khối). */
export function luuHoSoNha(them: HoSoNhaVao): HoSoNha {
  const cu = doc();
  const moi = chuyenLuoiCu(HoSoNha.parse({ ...(cu ?? { v: 1, theo: "cua", thanh_vien: [] }), ...them, v: 1, cap_nhat_luc: new Date().toISOString() }));
  hienTai = moi; daDoc = true;
  try { window.localStorage.setItem(KHOA_HO_SO_NHA, JSON.stringify(moi)); } catch { /* chế độ riêng tư */ }
  bao();
  return moi;
}
export function xoaHoSoNha(): void {
  hienTai = null; daDoc = true;
  try { window.localStorage.removeItem(KHOA_HO_SO_NHA); } catch { /* bỏ qua */ }
  bao();
}
/** ĐY-1 "Dữ liệu của tôi": xoá cả căn đang xem lẫn danh sách căn đã lưu trên máy. */
export function xoaMoiNhaTrenMay(): void {
  hienTai = null; daDoc = true; dsHienTai = []; dsDaDoc = true;
  try { window.localStorage.removeItem(KHOA_HO_SO_NHA); window.localStorage.removeItem(KHOA_DS_NHA); } catch { /* bỏ qua */ }
  bao();
}
function dangKy(f: () => void) {
  nghe.add(f);
  const onStorage = (e: StorageEvent) => { if (e.key === KHOA_HO_SO_NHA) { daDoc = false; f(); } if (e.key === KHOA_DS_NHA) { dsDaDoc = false; f(); } };
  window.addEventListener("storage", onStorage);
  return () => { nghe.delete(f); window.removeEventListener("storage", onStorage); };
}
/** `undefined` = đang hydrate · `null` = chưa có nhà. */
export function useHoSoNha(): HoSoNha | null | undefined {
  return useSyncExternalStore(dangKy, doc, () => undefined);
}
/** Đầu vào `nha` cho /api/phongthuy/luan-giai và /api/phongthuy/thang-nay từ hồ sơ nhà (null nếu chưa có hướng). */
export function nhaTuHoSo(n: HoSoNha | null | undefined): { huong_do?: number; huong?: string; nam_xay?: number; toa?: string; theo: "cua" | "ban_cong" } | null {
  if (!n || (n.huong_do == null && !n.huong)) return null;
  return { ...(n.huong_do != null ? { huong_do: n.huong_do } : { huong: n.huong }), ...(n.nam_xay ? { nam_xay: n.nam_xay } : {}), ...(n.toa ? { toa: n.toa } : {}), theo: n.theo };
}
export function tenNha(n: HoSoNha | null | undefined, en = false): string {
  if (en) {
    // EN-ALL GĐ 5: chữ bản Anh từ bảng lib/chu/phong-thuy.ts (hướng qua tên Anh). Bản Việt giữ đúng chữ cũ bên dưới.
    if (!n) return PT_EN("hs.nha_cua_ban");
    return n.ten_goi || (n.huong_do != null ? PT_EN("hs.nha_huong", { huong: `${n.huong_do}°` }) : n.huong ? PT_EN("hs.nha_huong", { huong: TEN_EN("huong", n.huong) }) : PT_EN("hs.nha_cua_ban"));
  }
  if (!n) return "nhà của bạn";
  return n.ten_goi || (n.huong_do != null ? `nhà hướng ${n.huong_do}°` : n.huong ? `nhà hướng ${n.huong}` : "nhà của bạn");
}

/** Bố cục gửi engine (BoCuc 0.2) từ hồ sơ nhà: vị trí, hướng vật dụng, dấu hiệu đã khai (co:true) + dấu hiệu đã xử lý
 *  (co:false — UI-PT 4), mặt bằng, loại nhà. null khi chưa khai gì. Dùng chung Nhà của bạn · So hai căn · thẻ chia sẻ. */
export function boCucGui(n: HoSoNha | null | undefined, huong?: { huong_do?: number; huong?: string }): Record<string, unknown> | null {
  const b = n?.bo_cuc;
  const daXuLy = [...new Set([...(b?.da_xu_ly ?? []), ...(b?.khai_khong ?? [])])].filter((m) => !(b?.dau_hieu ?? []).includes(m));
  const soDo = soDoGui(n);
  if (!((b?.vi_tri && Object.keys(b.vi_tri).length) || b?.dau_hieu?.length || b?.mat_bang || daXuLy.length || soDo)) return null;
  const h = huong ?? (n?.huong_do != null ? { huong_do: n.huong_do } : n?.huong ? { huong: n.huong } : {});
  return {
    ...(h.huong_do != null ? { huong_nha_do: h.huong_do } : h.huong ? { huong_nha: h.huong } : {}),
    ...(n?.loai_nha ? { loai_nha: n.loai_nha } : {}),
    vi_tri: b?.vi_tri ?? {}, huong_do: b?.huong_do ?? {},
    dau_hieu: Object.fromEntries([...(b?.dau_hieu ?? []).filter((m) => !daXuLy.includes(m))
      .map((m) => [m, b?.tu_anh?.includes(m) ? { co: true, nguon: "anh", xac_nhan: true } : { co: true, nguon: "nguoi_dung" }]),
      ...daXuLy.map((m) => [m, { co: false, nguon: "nguoi_dung" }])]),
    // TY-2 đợt 2: sơ đồ tỉ lệ là bản vẽ duy nhất; lưới cũ chỉ còn ở hồ sơ chưa kịp chuyển.
    ...(soDo ? { so_do: soDo } : b?.mat_bang ? { mat_bang: b.mat_bang } : {}),
  };
}
/** TY-2 gói 2: nhà nhiều lớp gửi engine (`nha.nhieu_lop` của /api/phongthuy/luan-giai) — chỉ số lớp + lớp nhà chính. */
export function nhieuLopGui(n: HoSoNha | null | undefined): { so_lop: number; lop_chu?: number } | null {
  const nl = n?.nhieu_lop;
  if (!nl || nl.so_lop < 2) return null;
  return { so_lop: nl.so_lop, ...(nl.lop_chu && nl.lop_chu <= nl.so_lop ? { lop_chu: nl.lop_chu } : {}) };
}
/** Toàn bộ đầu vào `nha` + `thanh_vien` cho /api/phongthuy/luan-giai từ một hồ sơ nhà (so hai căn, thẻ chia sẻ). */
export function nhaGui(n: HoSoNha): { nha: Record<string, unknown>; thanh_vien?: { vai: string; birth_year: number; gender: "nam" | "nu" }[] } {
  const bo_cuc = boCucGui(n);
  const nl = nhieuLopGui(n);
  const nha = { ...(nhaTuHoSo(n) ?? { theo: n.theo }), ...(bo_cuc ? { bo_cuc } : {}), ...(n.quan_sat?.length ? { quan_sat: n.quan_sat } : {}),
    ...(nl ? { nhieu_lop: nl } : {}) };
  const tv = n.thanh_vien.map((x) => ({ vai: x.vai, birth_year: x.nam, gender: x.gioi_tinh }));
  return { nha, ...(tv.length ? { thanh_vien: tv } : {}) };
}

// ---------------------------------------------------------------- UI-PT2 P5: nhiều căn để so (≤ 3), vẫn TRÊN MÁY
export const KHOA_DS_NHA = "hbt.nha.ds.v1";
const CanDaLuu = HoSoNha.extend({ id: z.string().min(4).max(24) });
export type CanDaLuu = z.infer<typeof CanDaLuu>;
const DanhSachNha = z.object({ v: z.literal(1), can: z.array(CanDaLuu).max(3) });
export const TOI_DA_CAN = 3;

let dsDaDoc = false;
let dsHienTai: CanDaLuu[] = [];
function docDs(): CanDaLuu[] {
  if (typeof window === "undefined") return [];
  if (!dsDaDoc) {
    dsDaDoc = true;
    try {
      const raw = window.localStorage.getItem(KHOA_DS_NHA);
      const kq = raw ? DanhSachNha.safeParse(JSON.parse(raw)) : null;
      dsHienTai = kq?.success ? kq.data.can.map((c) => ({ ...chuyenLuoiCu(c), id: c.id })) : [];
    } catch { dsHienTai = []; }
  }
  return dsHienTai;
}
function ghiDs(can: CanDaLuu[]) {
  dsHienTai = can; dsDaDoc = true;
  try { window.localStorage.setItem(KHOA_DS_NHA, JSON.stringify({ v: 1, can })); } catch { /* chế độ riêng tư */ }
  bao();
}
export function useDanhSachNha(): CanDaLuu[] | undefined {
  return useSyncExternalStore(dangKy, docDs, () => undefined);
}
/** Chụp căn đang xem vào danh sách (cập nhật nếu đã có id; thêm mới nếu còn chỗ). null = chưa có nhà hoặc đã đủ 3 căn. */
export function luuCanDeSo(ten?: string): CanDaLuu | null {
  const cu = doc();
  if (!cu) return null;
  const ds = docDs();
  const id = cu.id && ds.some((c) => c.id === cu.id) ? cu.id : `can_${Date.now().toString(36)}`;
  if (!ds.some((c) => c.id === id) && ds.length >= TOI_DA_CAN) return null;
  const moi = luuHoSoNha({ id, ...(ten !== undefined ? { ten_goi: ten.trim() || undefined } : {}) });
  const can = CanDaLuu.parse({ ...moi, id });
  ghiDs(ds.some((c) => c.id === id) ? ds.map((c) => (c.id === id ? can : c)) : [...ds, can]);
  return can;
}
/** Đổi căn đang xem: chép căn đã lưu vào hồ sơ nhà hiện tại (mọi khối đọc lại). */
export function chonCan(id: string): void {
  const c = docDs().find((x) => x.id === id);
  if (!c) return;
  const { v: _v, cap_nhat_luc: _c, ...phan } = c;
  void _v; void _c;
  hienTai = null; daDoc = true;
  try { window.localStorage.removeItem(KHOA_HO_SO_NHA); } catch { /* bỏ qua */ }
  luuHoSoNha(phan);
}
export function xoaCan(id: string): void {
  ghiDs(docDs().filter((c) => c.id !== id));
}
export function tenCan(c: Pick<HoSoNha, "ten_goi" | "huong_do" | "huong">, i: number, en = false): string {
  if (en) {
    const can = PT_EN("hs.can", { so: String(i + 1) });
    return c.ten_goi || (c.huong_do != null ? `${can} · ${c.huong_do}°` : c.huong ? `${can} · ${TEN_EN("huong", c.huong)}` : can);
  }
  return c.ten_goi || (c.huong_do != null ? `Căn ${i + 1} · ${c.huong_do}°` : c.huong ? `Căn ${i + 1} · ${c.huong}` : `Căn ${i + 1}`);
}
