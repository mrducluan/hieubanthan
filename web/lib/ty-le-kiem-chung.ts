"use client";
// LG-ĐS mục 5 — "x% thấy đúng" công khai trên thẻ có mã kiểm chứng. Thuần trình duyệt: gom MỌI mã của một bài thành
// MỘT lời gọi GET /api/kiem-chung/ty-le?mau=a,b,c (route có cache), lỗi → coi như chưa có số (chỉ hỏi, không hiện %).
// Số từ engine (ty_le_dung + so_phieu gắn sẵn trên hộp) được ưu tiên hơn số tải về.
import { useEffect, useState } from "react";
import { MAU_KIEM_CHUNG } from "@/lib/kiem-chung";

export interface TyLe { dung: number; chua_dung: number }
export type BangTyLe = Record<string, TyLe>;

/** Chấp nhận `{ty_le: {mã: {dung, chua_dung}}}` hoặc `{ds: [{mau, dung, chua_dung}]}` — bỏ mọi dòng hỏng. */
export function docBangTyLe(d: unknown): BangTyLe {
  const kq: BangTyLe = {};
  const so = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.floor(x) : null);
  const them = (mau: unknown, v: unknown) => {
    if (typeof mau !== "string" || !v || typeof v !== "object") return;
    const dung = so((v as TyLe).dung), chua = so((v as TyLe).chua_dung);
    if (dung !== null && chua !== null) kq[mau] = { dung, chua_dung: chua };
  };
  if (!d || typeof d !== "object") return kq;
  const o = d as { ty_le?: unknown; ds?: unknown };
  if (o.ty_le && typeof o.ty_le === "object") for (const [k, v] of Object.entries(o.ty_le)) them(k, v);
  if (Array.isArray(o.ds)) for (const v of o.ds) them((v as { mau?: unknown })?.mau, v);
  return kq;
}

/** Một lời gọi cho cả danh sách mã (đổi danh sách → gọi lại). Rỗng → không gọi. */
export function useTyLe(maus: string[]): BangTyLe {
  const khoa = [...new Set(maus)].sort().join(",");
  const [bang, setBang] = useState<BangTyLe>({});
  useEffect(() => {
    if (!khoa) { setBang({}); return; }
    let huy = false;
    fetch(`/api/kiem-chung/ty-le?mau=${encodeURIComponent(khoa)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!huy) setBang(docBangTyLe(d)); })
      .catch(() => { /* chưa có số → chỉ hỏi */ });
    return () => { huy = true; };
  }, [khoa]);
  return bang;
}

/** Tỉ lệ để HIỆN: engine trước, rồi bảng tải về; dưới ngưỡng → null (không hiện số). */
export function tyLeHien(
  engine: { ty_le_dung?: number; so_phieu?: number } | undefined,
  tai: TyLe | undefined,
  nguong = MAU_KIEM_CHUNG,
): { phanTram: number; tong: number } | null {
  if (engine && typeof engine.ty_le_dung === "number" && typeof engine.so_phieu === "number" && engine.so_phieu >= nguong) {
    return { phanTram: Math.round(Math.min(1, Math.max(0, engine.ty_le_dung)) * 100), tong: engine.so_phieu };
  }
  const tong = tai ? tai.dung + tai.chua_dung : 0;
  if (!tai || tong < nguong) return null;
  return { phanTram: Math.round((tai.dung / tong) * 100), tong };
}
