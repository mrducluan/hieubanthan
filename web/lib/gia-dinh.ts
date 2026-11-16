"use client";
// GD-1 đợt 1 (2026-11-16, chủ dự án duyệt) — hồ sơ gia đình: tối đa 7 người nhà (+ chính người dùng từ hồ sơ = 8), CHỈ
// trên máy này (`hbt.gia_dinh.v1`). Lớp cơ bản: vai + năm sinh + giới tính (tuỳ chọn) + tên gọi (chỉ để người dùng tự
// nhận ra, KHÔNG gửi engine). Lưu cần ô "người này đồng ý / tôi là cha mẹ, người giám hộ" do người dùng TỰ TÍCH (không
// tích sẵn). Không đồng bộ tài khoản (đợt 3, chờ luật sư); `xoaHoSo()` xoá luôn khoá này. Engine nhận mã ngắn `id`.
import { useSyncExternalStore } from "react";
import { z } from "zod";
import { KHOA_GIA_DINH, SU_KIEN_NGUOI_THAN, laSoTuHoSo, type HoSo } from "@/lib/hoso";

export const TOI_DA_GIA_DINH = 7;
export const VAI_GIA_DINH = ["vo_chong", "con", "bo", "me", "anh_chi", "em", "ong_ba", "chau", "bo_me_ben_kia", "con_dau_re", "nguoi_cung_nha"] as const;
export type VaiGiaDinh = (typeof VAI_GIA_DINH)[number] | "ban_than";
export const TEN_VAI: Record<VaiGiaDinh, string> = {
  ban_than: "Bạn", vo_chong: "Vợ / chồng", con: "Con", bo: "Bố", me: "Mẹ", anh_chi: "Anh / chị", em: "Em",
  ong_ba: "Ông / bà", chau: "Cháu", bo_me_ben_kia: "Bố / mẹ bên kia", con_dau_re: "Con dâu / rể", nguoi_cung_nha: "Người cùng nhà",
};
export const CAM_KET_GIA_DINH = "Lưu trên máy này. Tên gọi và ngày sinh của người nhà không rời máy. Xoá bất cứ lúc nào.";

const Nguoi = z.object({
  id: z.string().regex(/^g[a-z0-9]{3,10}$/),
  vai: z.enum(VAI_GIA_DINH),
  ten_goi: z.string().trim().max(30).optional(),
  nam_sinh: z.number().int().min(1901).max(2098),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
  /** Có khi thêm từ "Lá số người thân" (dương lịch) — để engine biết sinh trước hay sau Tết. */
  ngay_sinh: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type NguoiNha = z.infer<typeof Nguoi>;
const Kho = z.object({ v: z.literal(1), ds: z.array(Nguoi).max(TOI_DA_GIA_DINH) });

const nghe = new Set<() => void>();
let daDoc = false;
let hienTai: NguoiNha[] = [];

function doc(): NguoiNha[] {
  if (typeof window === "undefined") return hienTai;
  if (!daDoc) {
    daDoc = true;
    try {
      const raw = window.localStorage.getItem(KHOA_GIA_DINH);
      const kq = raw ? Kho.safeParse(JSON.parse(raw)) : null;
      hienTai = kq?.success ? kq.data.ds : [];
    } catch { hienTai = []; }
  }
  return hienTai;
}

function ghiKho(ds: NguoiNha[]) {
  hienTai = ds; daDoc = true;
  try {
    if (ds.length) window.localStorage.setItem(KHOA_GIA_DINH, JSON.stringify({ v: 1, ds }));
    else window.localStorage.removeItem(KHOA_GIA_DINH);
  } catch { /* storage bị chặn: vẫn dùng trong phiên */ }
  nghe.forEach((f) => f());
}

function dangKy(f: () => void) {
  nghe.add(f);
  const lai = () => { daDoc = false; f(); };
  const onStorage = (e: StorageEvent) => { if (e.key === KHOA_GIA_DINH || e.key === null) lai(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(SU_KIEN_NGUOI_THAN, lai);
  return () => { nghe.delete(f); window.removeEventListener("storage", onStorage); window.removeEventListener(SU_KIEN_NGUOI_THAN, lai); };
}

/** `undefined` = đang hydrate · `[]` = chưa thêm ai. */
export function useGiaDinh(): NguoiNha[] | undefined {
  return useSyncExternalStore<NguoiNha[] | undefined>(dangKy, doc, () => undefined);
}

export type KetQuaThem = { ok: true } | { ok: false; ly_do: "chua_dong_y" | "day" | "khong_hop_le" | "trung_vai" };

export function themNguoiNha(vao: Omit<NguoiNha, "id">, dongY: boolean): KetQuaThem {
  if (dongY !== true) return { ok: false, ly_do: "chua_dong_y" };
  const ds = doc();
  if (ds.length >= TOI_DA_GIA_DINH) return { ok: false, ly_do: "day" };
  if (vao.vai === "vo_chong" && ds.some((x) => x.vai === "vo_chong")) return { ok: false, ly_do: "trung_vai" };
  const id = `g${Math.random().toString(36).slice(2, 8).padEnd(4, "0")}`;
  const p = Nguoi.safeParse({ ...vao, id, ten_goi: vao.ten_goi?.trim() || undefined });
  if (!p.success || p.data.nam_sinh > new Date().getFullYear()) return { ok: false, ly_do: "khong_hop_le" };
  ghiKho([...ds, p.data]);
  return { ok: true };
}

/** GD-1 đợt 3: nhập người nhà tải từ tài khoản (chỉ vai + năm sinh + giới tính) — bỏ người trùng vai + năm sinh đã có
 *  trên máy (giữ bản trên máy vì có tên gọi / ngày sinh). → số người vừa thêm. */
export function nhapTuTaiKhoan(vao: Pick<NguoiNha, "vai" | "nam_sinh" | "gioi_tinh">[]): number {
  let ds = doc(), them = 0;
  for (const x of vao) {
    if (ds.length >= TOI_DA_GIA_DINH) break;
    if (ds.some((y) => y.vai === x.vai && y.nam_sinh === x.nam_sinh)) continue;
    if (x.vai === "vo_chong" && ds.some((y) => y.vai === "vo_chong")) continue;
    const p = Nguoi.safeParse({ ...x, id: `g${Math.random().toString(36).slice(2, 8).padEnd(4, "0")}` });
    if (p.success) { ds = [...ds, p.data]; them++; }
  }
  if (them) ghiKho(ds);
  return them;
}

export function xoaNguoiNha(id: string) { ghiKho(doc().filter((x) => x.id !== id)); }
export function xoaCaNha() { ghiKho([]); }

/** Thân yêu cầu `/api/gia-dinh`: người dùng (từ hồ sơ) + người nhà — KHÔNG gửi tên gọi. */
export function thanYeuCau(hoSo: HoSo | null, ds: NguoiNha[], nam?: number) {
  const nguoi = [
    ...(hoSo ? [{ id: "ban", vai: "ban_than" as const, nam_sinh: hoSo.nam, ngay_sinh: `${hoSo.nam}-${String(hoSo.thang).padStart(2, "0")}-${String(hoSo.ngay).padStart(2, "0")}`,
      ...(hoSo.gioi_tinh ? { gioi_tinh: hoSo.gioi_tinh } : {}) }] : []),
    ...ds.map((x) => ({ id: x.id, vai: x.vai, nam_sinh: x.nam_sinh, ...(x.gioi_tinh ? { gioi_tinh: x.gioi_tinh } : {}), ...(x.ngay_sinh ? { ngay_sinh: x.ngay_sinh } : {}) })),
  ];
  // GD-2: hồ sơ của chính người dùng đủ giờ sinh (không phải "không biết giờ") → gửi kèm để engine đọc lá số của họ.
  const laSo = hoSo?.do_tin_gio === "unknown" ? null : laSoTuHoSo(hoSo);
  return { ...(nam ? { nam } : {}), nguoi, ...(laSo ? { la_so: laSo } : {}) };
}
