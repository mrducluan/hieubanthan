"use client";
// ND-7 đợt 2 — "Chữ dùng chung": layout đọc global CMS "chu-chung" (đã lọc theo bảng CHU_CHUNG ở máy chủ) và đặt vào đây;
// form hồ sơ, ô vào trang chủ, khung hỏi đáp, nút Thử lại đọc bằng useChuChung(). Không có provider / CMS trống → chữ gốc.
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { taoChu, type ChuCms } from "@/lib/chu-trang";
import { CHU_CHUNG } from "@/lib/chu/chung";
import { useNgonNgu } from "@/components/khung/NgonNgu";

const Ctx = createContext<ChuCms>({});

export function ChuChung({ chu, children }: { chu: ChuCms; children: ReactNode }) {
  return <Ctx.Provider value={chu}>{children}</Ctx.Provider>;
}

/** EN-ALL: đọc theo ngôn ngữ của trang (bản Anh đọc chiều `en` của bảng — không bao giờ rơi về chữ Việt). */
export function useChuChung() {
  const chu = useContext(Ctx);
  const { ngonNgu } = useNgonNgu();
  return useMemo(() => taoChu(CHU_CHUNG, chu, ngonNgu), [chu, ngonNgu]);
}
