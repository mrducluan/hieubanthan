"use client";
// EN-ALL mục 3.1 — ngữ cảnh ngôn ngữ ở trình duyệt. Root layout bọc cả trang bằng <NgonNguProvider> với giá trị máy chủ đã
// đọc (`ngonNguMayChu`); component client đọc `useNgonNgu()` thay vì tự suy từ URL (URL Anh có thể là rewrite của trang Việt).
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { duongTheo, type NgonNgu } from "@/lib/duong-en";

interface GiaTri { ngonNgu: NgonNgu; ma: string }
const NguCanh = createContext<GiaTri>({ ngonNgu: "vi", ma: "vi" });

export function NgonNguProvider({ ngonNgu, ma, children }: GiaTri & { children: ReactNode }) {
  const v = useMemo(() => ({ ngonNgu, ma }), [ngonNgu, ma]);
  return <NguCanh.Provider value={v}>{children}</NguCanh.Provider>;
}

/** Ngôn ngữ giao diện của trang đang mở ("vi" | "en") + mã gửi engine ("en-us"…). */
export const useNgonNgu = (): GiaTri => useContext(NguCanh);

/** Hàm dựng link nội bộ theo ngôn ngữ trang: `const d = useDuong(); <Lien href={d("/bat-tu")}>`. */
export function useDuong(): (duongVi: string, duoi?: string) => string {
  const { ngonNgu } = useContext(NguCanh);
  return (duongVi, duoi) => duongTheo(ngonNgu, duongVi, duoi);
}
