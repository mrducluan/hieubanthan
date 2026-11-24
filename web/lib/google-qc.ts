"use client";
// QC-G — đo chuyển đổi Google Ads (chủ dự án quyết 2026-11-23). Chỉ MÃ sự kiện + mã mảng / gói + giá trị đơn đi vào
// dataLayer (GTM gắn thẻ chuyển đổi Google Ads / GA4 theo tên sự kiện) — không tên, ngày giờ sinh, email, câu hỏi.
// Consent Mode (components/khung/DoLuongGoogle.tsx) quyết Google có được ghi cookie quảng cáo hay không.
//
// Bảng sự kiện dataLayer (trigger GTM "Sự kiện tuỳ chỉnh" theo tên):
//   profile_created            → hbt_lead                 (một lần mỗi thiết bị)
//   reading_started{mo_dun}    → hbt_xem      {mo_dun}     (một lần mỗi mảng mỗi phiên)
//   unlock_clicked{kind=bam}   → hbt_mo_khoa  {mo_dun, value, currency}   (một lần mỗi mảng mỗi phiên)
//   checkout_started{goi}      → hbt_thanh_toan {goi, value, currency}
//   unlock_succeeded{mo_dun}   → hbt_da_mo    {mo_dun}
//   trang kết quả đơn đã trả   → purchase (chuẩn GA4: ecommerce.transaction_id = don-<mã>, value, currency) + hbt_nap
import { HOI_DONG_Y, KHOA_DONG_Y, KHOA_GCLID } from "@/lib/ma-google";

type CuaSo = { dataLayer?: unknown[] };
const HAN_GCLID = 90 * 86_400_000;
const MA_BAM = /^[A-Za-z0-9_-]{10,200}$/;
const MA = /^[a-z0-9_]{1,30}$/;
const ma = (v: unknown): string | null => (typeof v === "string" && MA.test(v) ? v : null);

/** Người dùng chưa tắt cookie đo lường (cùng luật Consent Mode). */
export function googleDongY(): boolean {
  if (typeof window === "undefined") return false;
  let c: string | null = null;
  try { c = localStorage.getItem(KHOA_DONG_Y); } catch { /* riêng tư */ }
  return c === "dong_y" || (c === null && !HOI_DONG_Y);
}

export type MaGoogle = { gclid?: string; gbraid?: string; wbraid?: string };

/** Hàm thuần: giá trị đã lưu → mã lượt bấm còn hạn (90 ngày) hoặc null. */
export function docMaGoogle(tho: string | null, now: number = Date.now()): MaGoogle | null {
  try {
    const x = JSON.parse(tho ?? "null") as { k?: string; v?: string; t?: number } | null;
    if (!x || typeof x.v !== "string" || !MA_BAM.test(x.v) || typeof x.t !== "number" || now - x.t > HAN_GCLID || now < x.t - 60_000) return null;
    if (x.k !== "gclid" && x.k !== "gbraid" && x.k !== "wbraid") return null;
    return { [x.k]: x.v };
  } catch { return null; }
}

/** Mã lượt bấm quảng cáo để gửi kèm đơn nạp — chỉ khi người dùng chưa tắt cookie đo lường. */
export function layMaGoogle(): MaGoogle | null {
  if (!googleDongY()) return null;
  try { return docMaGoogle(localStorage.getItem(KHOA_GCLID)); } catch { return null; }
}

function day(o: Record<string, unknown>): void {
  const w = typeof window === "undefined" ? undefined : (window as unknown as CuaSo);
  if (!w) return;
  w.dataLayer ??= [];
  w.dataLayer.push(o);
}

function motLan(k: string, kho: "phien" | "may"): boolean {
  try {
    const s = kho === "may" ? localStorage : sessionStorage;
    const kk = `hbt.gg.${k}`;
    if (s.getItem(kk)) return false;
    s.setItem(kk, "1");
  } catch { /* vẫn gửi */ }
  return true;
}

/** Nối sự kiện (đã qua bộ lọc thuộc tính) sang dataLayer. `vnd`: giá trị đơn (chỉ cho Google / Meta, PostHog không nhận). */
export function googleSuKien(suKien: string, p: Record<string, string | number | boolean>, vnd: number | null): void {
  const gt = typeof vnd === "number" && vnd > 0 ? { value: Math.round(vnd), currency: "VND" } : {};
  const mang = ma(p.mo_dun);
  switch (suKien) {
    case "profile_created":
      if (motLan("lead", "may")) day({ event: "hbt_lead" });
      return;
    case "reading_started":
      if (mang && motLan(`xem.${mang}`, "phien")) day({ event: "hbt_xem", mo_dun: mang });
      return;
    case "unlock_clicked":
      if (p.kind === "bam" && mang && motLan(`mo.${mang}`, "phien")) day({ event: "hbt_mo_khoa", mo_dun: mang, ...gt });
      return;
    case "checkout_started": {
      const goi = ma(p.goi);
      day({ event: "hbt_thanh_toan", ...(goi ? { goi } : {}), ...gt });
      return;
    }
    case "unlock_succeeded":
      day({ event: "hbt_da_mo", ...(mang ? { mo_dun: mang } : {}) });
      return;
  }
}

/** Đơn nạp đã trả (trang kết quả) — một lần mỗi đơn. transaction_id trùng chuyển đổi offline (máy chủ) → Google khử trùng. */
export function googlePurchase(soTien: number, maDon: number, loai = "sao"): void {
  if (!Number.isFinite(soTien) || soTien <= 0 || !motLan(`don.${maDon}`, "may")) return;
  const kieu = ma(loai) ?? "sao";
  day({ ecommerce: null });
  day({ event: "purchase", ecommerce: { transaction_id: `don-${maDon}`, value: soTien, currency: "VND",
    items: [{ item_id: kieu, item_name: kieu, price: soTien, quantity: 1 }] } });
  day({ event: "hbt_nap", value: soTien, currency: "VND", transaction_id: `don-${maDon}`, loai: kieu });
}
