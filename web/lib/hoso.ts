"use client";
// Hồ sơ bản thân (Metaphysics ID) — lưu TRÊN MÁY người dùng (localStorage), nhập một lần dùng mọi mảng.
// Không gửi lên server ngoài lúc gọi engine tính. Đồng bộ tài khoản là tuỳ chọn (UI-4).
// Xem docs/THIET-KE-UI.md §8.
import { useSyncExternalStore } from "react";
import { z } from "zod";

export const KHOA_HO_SO = "hbt.hoso.v1";

export const HoSo = z.object({
  v: z.literal(1),
  ho_ten: z.string().trim().min(1).max(80),
  ten_khac: z.string().trim().max(80).optional(),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  gio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
  vung: z.enum(["north", "south"]).optional(),
  tao_luc: z.string(),
});
export type HoSo = z.infer<typeof HoSo>;

const nghe = new Set<() => void>();
let daDoc = false;
let hienTai: HoSo | null = null;

function doc(): HoSo | null {
  if (typeof window === "undefined") return null;
  if (!daDoc) {
    daDoc = true;
    try {
      const raw = window.localStorage.getItem(KHOA_HO_SO);
      const kq = raw ? HoSo.safeParse(JSON.parse(raw)) : null;
      hienTai = kq?.success ? kq.data : null;
    } catch {
      hienTai = null;
    }
  }
  return hienTai;
}

function bao() {
  nghe.forEach((f) => f());
}

export function luuHoSo(h: Omit<HoSo, "v" | "tao_luc"> & { tao_luc?: string }): HoSo {
  const moi = HoSo.parse({ ...h, v: 1, tao_luc: h.tao_luc ?? new Date().toISOString() });
  hienTai = moi;
  daDoc = true;
  try {
    window.localStorage.setItem(KHOA_HO_SO, JSON.stringify(moi));
  } catch {
    /* chế độ riêng tư chặn storage: vẫn dùng được trong phiên */
  }
  bao();
  return moi;
}

export function capNhatHoSo(them: Partial<Omit<HoSo, "v" | "tao_luc">>): HoSo | null {
  const cu = doc();
  if (!cu) return null;
  return luuHoSo({ ...cu, ...them });
}

export function xoaHoSo(): void {
  hienTai = null;
  daDoc = true;
  try {
    window.localStorage.removeItem(KHOA_HO_SO);
  } catch {
    /* bỏ qua */
  }
  bao();
}

function dangKy(f: () => void) {
  nghe.add(f);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KHOA_HO_SO) {
      daDoc = false;
      f();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    nghe.delete(f);
    window.removeEventListener("storage", onStorage);
  };
}

/** `undefined` = chưa đọc xong (đang hydrate) · `null` = chưa có hồ sơ. */
export function useHoSo(): HoSo | null | undefined {
  return useSyncExternalStore(dangKy, doc, () => undefined);
}

export function ngaySinhIso(h: Pick<HoSo, "ngay" | "thang" | "nam">): string {
  return `${h.nam}-${String(h.thang).padStart(2, "0")}-${String(h.ngay).padStart(2, "0")}`;
}

export function hoTenList(h: Pick<HoSo, "ho_ten" | "ten_khac">): string[] {
  return h.ten_khac ? [h.ho_ten, h.ten_khac] : [h.ho_ten];
}

export function tenGoi(h: Pick<HoSo, "ho_ten">): string {
  const phan = h.ho_ten.trim().split(/\s+/);
  return phan[phan.length - 1] ?? h.ho_ten;
}

/** Ngày có tồn tại không (31/2 → false). Kiểm tra định dạng, không phải tính toán huyền học. */
export function ngayHopLe(ngay: number, thang: number, nam: number): boolean {
  const d = new Date(Date.UTC(nam, thang - 1, ngay));
  return d.getUTCFullYear() === nam && d.getUTCMonth() === thang - 1 && d.getUTCDate() === ngay;
}

/** Đầu vào lá số (Tử vi / Bát tự) từ hồ sơ — null nếu thiếu giờ sinh hoặc giới tính. */
export function laSoTuHoSo(h: HoSo | null | undefined): { birth_date: string; birth_time: string; gender: "nam" | "nu"; vung?: "north" | "south" } | null {
  if (!h?.gio || !h.gioi_tinh) return null;
  const iso = ngaySinhIso(h);
  const truoc1975 = iso < "1975-06-13";
  if (truoc1975 && !h.vung) return null;
  return { birth_date: iso, birth_time: h.gio, gender: h.gioi_tinh, ...(truoc1975 && h.vung ? { vung: h.vung } : {}) };
}
