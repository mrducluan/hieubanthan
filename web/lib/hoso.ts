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
  /** Mã tỉnh nơi sinh (engine /v1/dia-ly/tinh) hoặc "nuoc_ngoai". Cần cho Tử vi, Bát tự. */
  noi_sinh: z.string().regex(/^[a-z0-9_-]{2,40}$/).optional(),
  /** Chỉ khi sinh ở nước ngoài: đồng hồ nơi sinh lúc đó đang là giờ mùa hè. */
  gio_mua_he: z.boolean().optional(),
  /** TV-V2: "unknown" = không biết giờ → `gio` là giờ đại diện 12:00 chỉ để an tạm lá số; Tử vi mở khối định giờ 12 canh. */
  do_tin_gio: z.enum(["exact", "approx", "unknown"]).optional(),
  /** Người dùng nhập theo lịch nào; ngày/tháng/năm ở trên LUÔN là dương lịch (engine đổi). */
  lich_nhap: z.enum(["duong", "am"]).optional(),
  /** TP-LICH: ngày âm nhập theo âm lịch Việt Nam (mặc định) hay Trung Quốc (sổ tử vi / lịch Trung Quốc). */
  lich_am: z.enum(["viet", "trung"]).optional(),
  /** Ngày âm tương ứng (engine trả về) — để người dùng đối chiếu giấy tờ. */
  am: z.object({ ngay: z.number().int(), thang: z.number().int(), nam: z.number().int(), nhuan: z.boolean() }).optional(),
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

export const NUOC_NGOAI = "nuoc_ngoai";

/** Đầu vào lá số (Tử vi / Bát tự) từ hồ sơ — null nếu thiếu giờ sinh, giới tính hoặc nơi sinh. */
export function laSoTuHoSo(h: HoSo | null | undefined): {
  birth_date: string; birth_time: string; gender: "nam" | "nu"; noi_sinh: string;
  vung?: "north" | "south"; gio_mua_he?: boolean; do_tin_gio?: "exact" | "approx" | "unknown";
} | null {
  if (!h?.gio || !h.gioi_tinh || !h.noi_sinh) return null;
  const nuocNgoai = h.noi_sinh === NUOC_NGOAI;
  return {
    birth_date: ngaySinhIso(h), birth_time: h.gio, gender: h.gioi_tinh, noi_sinh: h.noi_sinh,
    // Vùng chỉ còn cần cho tỉnh vắt ngang vĩ tuyến 17 (Quảng Trị) sinh trước 1975 — engine tự suy từ tỉnh.
    ...(!nuocNgoai && h.vung && ngaySinhIso(h) < "1975-06-13" ? { vung: h.vung } : {}),
    ...(nuocNgoai && h.gio_mua_he ? { gio_mua_he: true } : {}),
    ...(h.do_tin_gio ? { do_tin_gio: h.do_tin_gio } : {}),
  };
}

/** TV-V2: giờ đại diện khi người dùng chọn "Không biết giờ" (giữa giờ Ngọ) — chỉ để an tạm, luôn gắn do_tin_gio=unknown. */
export const GIO_DAI_DIEN_KHONG_BIET = "12:00";

/** Giờ sinh để HIỂN THỊ — không biết giờ thì không hiện giờ đại diện như thể là giờ thật. */
export function gioHienThi(h: Pick<HoSo, "gio" | "do_tin_gio"> | null | undefined): string | undefined {
  return h?.do_tin_gio === "unknown" ? undefined : h?.gio;
}

/** "14/9 (nhuận) Mậu Thìn" — chỉ định dạng dữ liệu engine đã trả. */
export function moTaAm(am: NonNullable<HoSo["am"]>, canChi?: string): string {
  return `${am.ngay}/${am.thang}${am.nhuan ? " nhuận" : ""}/${am.nam}${canChi ? ` (${canChi})` : ""}`;
}
