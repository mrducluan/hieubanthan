"use client";
// TR-1 — Tarot phía trình duyệt: hạt giống xáo bài từ cử chỉ người dùng (băm SHA-256 trên máy, không gửi toạ độ), lịch sử
// trải bài CHỈ trên máy (`hbt.tarot.v1`, ≤ 20 — chỉ mã lá + trải bài + chủ đề; câu hỏi cắt ≤ 200 ký tự, không gửi đi), bộ bài
// nhớ trong phiên. Web không tính gì: thứ tự lá, phẩm giá, lời đọc đều của engine.
import { useEffect, useState } from "react";
import { MA_LA, laMaTraiBai, type BoBai, type LaRut, type MaTraiBai } from "@/lib/tarot-chung";
import { maNgonNguTrang, urlTheoNgonNgu } from "@/lib/ngon-ngu";
import { kemNgonNgu } from "@/lib/sao-client";

export const KHOA_LICH_SU = "hbt.tarot.v1";
export const TOI_DA_LICH_SU = 20;
const TOI_DA_CAU = 200;

export interface TraiBaiDaLuu {
  id: string; luc: string; trai_bai: MaTraiBai; la: LaRut[]; cau: string; chu_de: string | null;
  /** Tên lá tâm điểm để hiện trong danh sách (engine đã trả). */ tom_tat: string;
}

function docLs(): TraiBaiDaLuu[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KHOA_LICH_SU) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((q): q is TraiBaiDaLuu => {
      const x = q as TraiBaiDaLuu;
      return !!x && typeof x === "object" && typeof x.id === "string" && laMaTraiBai(x.trai_bai) && Array.isArray(x.la)
        && x.la.every((l) => l && typeof l.id === "string" && MA_LA.test(l.id)) && typeof x.tom_tat === "string";
    });
  } catch { return []; }
}
function ghiLs(ds: TraiBaiDaLuu[]) {
  try { localStorage.setItem(KHOA_LICH_SU, JSON.stringify(ds.slice(0, TOI_DA_LICH_SU))); } catch { /* trình duyệt chặn lưu */ }
}
export function docLichSu(): TraiBaiDaLuu[] { return docLs(); }
export function luuTraiBai(q: Omit<TraiBaiDaLuu, "id" | "luc">): TraiBaiDaLuu {
  const moi: TraiBaiDaLuu = { ...q, cau: q.cau.trim().slice(0, TOI_DA_CAU), id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, luc: new Date().toISOString() };
  ghiLs([moi, ...docLs()]);
  return moi;
}
export function xoaTraiBai(id: string) { ghiLs(docLs().filter((x) => x.id !== id)); }
export function xoaHetTraiBai() { try { localStorage.removeItem(KHOA_LICH_SU); } catch { /* bỏ qua */ } }

/** Băm cử chỉ (toạ độ + thời điểm + câu hỏi) thành hạt giống hex — chỉ hex đi lên engine; engine xáo tất định theo nó. */
export async function hatGiong(cuChi: string): Promise<string> {
  const data = new TextEncoder().encode(`${cuChi}|${Date.now()}|${Math.random()}`);
  try {
    const h = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Trình duyệt cũ không có SubtleCrypto → để engine dùng CSPRNG (trả về rỗng → không gửi hạt giống).
    return "";
  }
}

// EN-ALL GĐ 7: bộ bài theo ngôn ngữ trang (tên lá, trải bài, vị trí do engine trả) — nhớ riêng từng ngôn ngữ.
const boNho = new Map<string, BoBai>();
const dangTai = new Map<string, Promise<BoBai | null>>();
/** Bộ bài (78 lá rút gọn + trải bài) — tải một lần mỗi phiên. `loiThuLai`: câu lỗi theo ngôn ngữ trang. */
export function useBoBai(loiThuLai = "Chưa tải được bộ bài — thử lại sau ít phút."): { bo: BoBai | null; loi: string | null; thuLai: () => void } {
  const [bo, setBo] = useState<BoBai | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);
  useEffect(() => {
    const nn = maNgonNguTrang();
    const co = boNho.get(nn);
    if (co) { setBo(co); return; }
    let p = dangTai.get(nn);
    if (!p) {
      p = fetch(urlTheoNgonNgu("/api/tarot/bo-bai"), kemNgonNgu("/api/tarot/bo-bai")).then((r) => (r.ok ? (r.json() as Promise<BoBai>) : null)).catch(() => null);
      dangTai.set(nn, p);
    }
    let huy = false;
    void p.then((d) => {
      dangTai.delete(nn);
      if (huy) return;
      if (d && d.la && Object.keys(d.la).length === 78) { boNho.set(nn, d); setBo(d); setLoi(null); } else setLoi(loiThuLai);
    });
    return () => { huy = true; };
  }, [lan, loiThuLai]);
  return { bo, loi, thuLai: () => setLan((n) => n + 1) };
}

/** Lịch sử trên máy, `undefined` lúc chưa đọc (SSR). */
export function useLichSuTarot(): [TraiBaiDaLuu[] | undefined, () => void] {
  const [ds, setDs] = useState<TraiBaiDaLuu[] | undefined>(undefined);
  const doc = () => setDs(docLs());
  useEffect(doc, []);
  return [ds, doc];
}
