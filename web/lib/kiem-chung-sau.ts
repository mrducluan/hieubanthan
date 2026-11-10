"use client";
// Q7 — PHIẾU SAU 30 NGÀY (migration 0022). Khi người dùng bấm "Đúng với mình" ở một hộp Nên để ý / Lời khuyên, máy người dùng
// ghi lại MÃ hộp + phái + ngày (localStorage, không gửi đi). ≥ 30 ngày sau, Hôm nay hỏi lại hai câu ba mức → POST /api/kiem-chung/sau
// (chỉ mã + hai mức + số ngày). Mỗi ngày hỏi tối đa một hộp; mã hỏi rồi không hỏi lại. Không chữ, không nhà, không ngày sinh.
import { z } from "zod";

export const KHOA_KC_SAU = "hbt.kc_sau.v1";
const TOI_DA = 40;
export const NGAY_HOI = 30;
const Ghi = z.object({
  loai: z.enum(["doi_song", "hai_nguoi"]), mau: z.string().regex(/^[a-z0-9_.+-]{3,60}$/), phai: z.string().regex(/^[a-z0-9_]{2,32}$/),
  nhan: z.string().max(80), mo_dun: z.string().max(20), ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  da_hoi: z.boolean().optional(),
  /** KD-2d (P9): "que" = quẻ đã gieo (hỏi "việc đó ra sao?") thay vì hộp đã bấm Đúng. */
  /** TR-3: "tarot" = câu trả lời của lá bài cho một câu "có nên / có thành / khi nào" — hỏi "việc đó ra sao?". */
  /** Ý5 (HTT-2 mục 8): "giao_thoa" = hộp điểm giao thoa (mã ds.giao_thoa.*) — hỏi "điểm chung ấy có còn đúng về lâu dài không?". */
  loai_hoi: z.enum(["hop", "que", "tarot", "giao_thoa"]).optional(),
});
export type GhiNhan = z.infer<typeof Ghi>;

function doc(): GhiNhan[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KHOA_KC_SAU) ?? "[]");
    return Array.isArray(raw) ? raw.map((x) => Ghi.safeParse(x)).filter((k) => k.success).map((k) => k.data) : [];
  } catch { return []; }
}
function ghiXuong(ds: GhiNhan[]) {
  try { localStorage.setItem(KHOA_KC_SAU, JSON.stringify(ds.slice(-TOI_DA))); } catch { /* riêng tư */ }
}
/** BT-UI: mã các hộp người dùng đã bấm "Đúng với mình" còn nhớ trên máy (chỉ mã) — cho khối "Điều bạn đã xác nhận". */
export function maDaXacNhan(): string[] { return [...new Set(doc().filter((x) => x.loai === "doi_song").map((x) => x.mau))]; }
const homNayIso = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);   // ngày theo giờ VN

/** Người dùng bấm "Đúng với mình" một hộp đáng theo dõi (Nên để ý / Lời khuyên) → nhớ trên máy để hỏi lại sau 30 ngày. */
export function ghiNhanDung(g: Omit<GhiNhan, "ngay" | "da_hoi">): void {
  if (typeof window === "undefined") return;
  const ds = doc();
  if (ds.some((x) => x.mau === g.mau)) return;
  // Ý5: mã giao thoa luôn hỏi lại theo lời riêng của điểm giao thoa (một nguồn — dù nơi gọi có truyền loai_hoi hay không).
  const loai_hoi = g.mau.startsWith("ds.giao_thoa.") ? "giao_thoa" : g.loai_hoi;
  const k = Ghi.safeParse({ ...g, loai_hoi, ngay: homNayIso(), da_hoi: false });
  if (k.success) ghiXuong([...ds, k.data]);
}
/** Hộp đến hạn hỏi lại (≥ 30 ngày, chưa hỏi) — cũ nhất trước; null khi chưa có. */
export function denHanHoi(homNay: string, moDun?: string): (GhiNhan & { sau_ngay: number }) | null {
  const t0 = Date.parse(`${homNay}T00:00:00Z`);
  for (const x of doc()) {
    if (moDun && x.mo_dun !== moDun) continue;
    const sau = Math.floor((t0 - Date.parse(`${x.ngay}T00:00:00Z`)) / 86_400_000);
    if (!x.da_hoi && sau >= NGAY_HOI && sau <= 400) return { ...x, sau_ngay: sau };
  }
  return null;
}
export async function traLoiSau(g: GhiNhan & { sau_ngay: number }, da_lam: "da_lam" | "mot_phan" | "chua", thay_khac: "tot_hon" | "nhu_cu" | "kho_noi"): Promise<void> {
  ghiXuong(doc().map((x) => (x.mau === g.mau ? { ...x, da_hoi: true } : x)));
  await fetch("/api/kiem-chung/sau", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ loai: g.loai, mau: g.mau, phai: g.phai, da_lam, thay_khac, sau_ngay: g.sau_ngay }),
  }).catch(() => null);
}
export function boQuaHoi(mau: string): void { ghiXuong(doc().map((x) => (x.mau === mau ? { ...x, da_hoi: true } : x))); }
