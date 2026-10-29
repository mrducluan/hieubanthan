"use client";
// HD-CS đợt 3 (ý 3) — chữ trong câu trả lời ↔ hình. Engine gắn cho mỗi mục hình danh sách `khop` (cụm chữ lời trả lời dùng
// để nói về nó: "Tài Bạch", "tiền bạc", "Hào Cửu Nhị"…). Web gạch chân các cụm đó; bấm → mục hình tương ứng sáng lên kèm
// lời giải thích và hình cuộn vào màn hình. Mỗi câu trả lời một vùng riêng (không sáng nhầm câu khác).
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { KhoiTrucQuan } from "@/components/hoi/TrucQuan";

export type Sang = { id: string; lan: number } | null;
const Ctx = createContext<{ sang: Sang; chieu: (id: string) => void }>({ sang: null, chieu: () => {} });

export function VungChieuSang({ children }: { children: ReactNode }) {
  const [sang, setSang] = useState<Sang>(null);
  const chieu = useCallback((id: string) => setSang((s) => ({ id, lan: (s?.lan ?? 0) + 1 })), []);
  const v = useMemo(() => ({ sang, chieu }), [sang, chieu]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export const useChieuSang = () => useContext(Ctx);

/** cụm chữ → "khối:mục" (cụm đầu tiên giữ chỗ, không ghi đè). */
export function banDoKhop(ds?: KhoiTrucQuan[]): Map<string, string> {
  const ra = new Map<string, string>();
  ds?.forEach((k, ki) => {
    if (!("muc" in k)) return;
    k.muc.forEach((m, mi) => {
      for (const c of m.khop ?? []) if (c.length >= 3 && !ra.has(c)) ra.set(c, `${ki}:${mi}`);
    });
  });
  return ra;
}
