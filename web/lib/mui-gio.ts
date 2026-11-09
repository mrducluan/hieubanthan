"use client";
// QTE-2 giai đoạn 0 — danh sách nước + thành phố cho người sinh ở nước ngoài (bảng nằm ở engine, tải một lần mỗi phiên).
// Web chỉ hiển thị và gửi lại MÃ (thành phố hoặc vùng IANA); múi giờ chuẩn / giờ mùa hè do engine suy từ tzdata.
import { useEffect, useState } from "react";

/** Ý6: cờ engine tính sẵn (`/v1/dia-ly/mui-gio`) để form gợi ý công tắc Trường phái — engine cũ không có → không gợi ý. */
export interface ThanhPho { ma: string; ten: string; ten_en: string; zone: string; utc_chuan?: number; lech_mat_troi_phut?: number | null; canh_bao_mat_troi?: boolean; nam_ban_cau_kha_dung?: boolean }
export interface Nuoc { ma: string; ten: string; ten_en: string; thanh_pho: ThanhPho[] }
export interface KetQuaMuiGio { zone: string; utc_chuan: number; gio_mua_he: boolean; lech: number; lam_tron: boolean; gio_mo_ho: boolean }

let boNho: Promise<Nuoc[]> | null = null;

function tai(): Promise<Nuoc[]> {
  boNho ??= fetch("/api/dia-ly/mui-gio")
    .then(async (r) => {
      if (!r.ok) throw new Error("Chưa tải được danh sách nước.");
      return ((await r.json()) as { nuoc: Nuoc[] }).nuoc;
    })
    .catch((e: unknown) => { boNho = null; throw e; });
  return boNho;
}

export function useDanhSachNuoc(bat: boolean): { nuoc: Nuoc[] | null; loi: string | null; thuLai: () => void } {
  const [nuoc, setNuoc] = useState<Nuoc[] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);
  useEffect(() => {
    if (!bat) return;
    let huy = false;
    setLoi(null);
    tai().then((n) => { if (!huy) setNuoc(n); }).catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : "Lỗi"); });
    return () => { huy = true; };
  }, [bat, lan]);
  return { nuoc, loi, thuLai: () => setLan((n) => n + 1) };
}

/** Mã vùng IANA của trình duyệt (để chọn sẵn "Khác: múi giờ" khi thành phố không có trong danh sách). */
export function vungMay(): string | null {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null; } catch { return null; }
}

/** Mọi mã vùng IANA trình duyệt biết (fallback cho thành phố không có trong danh sách); trình duyệt cũ → []. */
export function cacVungIana(): string[] {
  try {
    const f = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    return f ? f.call(Intl, "timeZone").filter((z) => z.includes("/")) : [];
  } catch { return []; }
}

/** "UTC−8" / "UTC+5:30" từ số giờ lệch. */
export function nhanUtc(gio: number): string {
  const dau = gio < 0 ? "−" : "+";
  const a = Math.abs(gio), h = Math.floor(a), m = Math.round((a - h) * 60);
  return `UTC${dau}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

/** Tên hiển thị của mã đã lưu trong hồ sơ: thành phố trong danh sách → "Thành phố · Nước"; mã IANA → chính mã đó. */
export function tenMuiGio(ma: string | undefined, nuoc: Nuoc[] | null): string | null {
  if (!ma) return null;
  for (const n of nuoc ?? []) {
    const t = n.thanh_pho.find((x) => x.ma === ma);
    if (t) return `${t.ten} · ${n.ten}`;
  }
  return ma.includes("/") ? ma.replace(/_/g, " ") : null;
}
