"use client";
// Danh sách nơi sinh (63 tỉnh) — bảng nằm ở engine, tải một lần mỗi phiên.
import { useEffect, useState } from "react";

export interface Tinh { ma: string; ten: string; vung: "north" | "south" | null }

let boNho: Promise<Tinh[]> | null = null;

function tai(): Promise<Tinh[]> {
  boNho ??= fetch("/api/dia-ly/tinh")
    .then(async (r) => {
      if (!r.ok) throw new Error("Chưa tải được danh sách tỉnh.");
      const d = (await r.json()) as { tinh: Tinh[] };
      return [...d.tinh].sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
    })
    .catch((e: unknown) => { boNho = null; throw e; });
  return boNho;
}

export function useDanhSachTinh(): { tinh: Tinh[] | null; loi: string | null; thuLai: () => void } {
  const [tinh, setTinh] = useState<Tinh[] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);
  useEffect(() => {
    let huy = false;
    setLoi(null);
    tai().then((t) => { if (!huy) setTinh(t); }).catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : "Lỗi"); });
    return () => { huy = true; };
  }, [lan]);
  return { tinh, loi, thuLai: () => setLan((n) => n + 1) };
}

// ---------------------------------------------------------------- QTE-1 tuần 1: người Việt ở nước ngoài
export interface ThanhPho { ten: string; mui_gio: string }
export interface NuocNgoai { ma: string; ten: string; thanh_pho: ThanhPho[] }
export interface KetQuaMuiGio {
  mui_gio: string; utc_chuan: number; utc_dong_ho: number; gio_mua_he: boolean; chenh_mua_he: number;
  doi_gio: "khong_ton_tai" | "lap_lai" | null; can_xem_lai: boolean;
}

let boNhoNuoc: Promise<NuocNgoai[]> | null = null;

function taiNuoc(): Promise<NuocNgoai[]> {
  boNhoNuoc ??= fetch("/api/dia-ly/nuoc-ngoai")
    .then(async (r) => {
      if (!r.ok) throw new Error("Chưa tải được danh sách nước.");
      return ((await r.json()) as { nuoc: NuocNgoai[] }).nuoc;
    })
    .catch((e: unknown) => { boNhoNuoc = null; throw e; });
  return boNhoNuoc;
}

/** Danh mục nước + thành phố; `bat` = false thì chưa tải (form chưa chọn "nước ngoài"). */
export function useDanhSachNuoc(bat: boolean): NuocNgoai[] | null {
  const [ds, setDs] = useState<NuocNgoai[] | null>(null);
  useEffect(() => {
    if (!bat) return;
    let huy = false;
    taiNuoc().then((d) => { if (!huy) setDs(d); }).catch(() => { /* lỗi: form vẫn cho tự chọn UTC như trước */ });
    return () => { huy = true; };
  }, [bat]);
  return ds;
}

/** Nước chứa múi giờ này (để form hiện lại đúng nước khi mở hồ sơ cũ). */
export const nuocCuaMuiGio = (ds: NuocNgoai[] | null, mg: string | undefined) =>
  mg && ds ? ds.find((n) => n.thanh_pho.some((t) => t.mui_gio === mg))?.ma ?? "" : "";

/** "+7", "−8", "+5:30" — chỉ để hiển thị con số engine trả. */
export const tenUtc = (h: number) => {
  const dau = h < 0 ? "−" : "+", a = Math.abs(h), gio = Math.floor(a), phut = Math.round((a - gio) * 60);
  return `UTC${dau}${gio}${phut ? `:${String(phut).padStart(2, "0")}` : ""}`;
};
