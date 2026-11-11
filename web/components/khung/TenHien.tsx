"use client";
// EN-ALL GĐ 3d — ngữ cảnh `ten_hien` của phản hồi engine đang vẽ (lá số, báo cáo). Component con gọi `useTen()` rồi
// `ten("thap_than", ma)` để HIỆN mã; bản Việt trả nguyên mã (HTML không đổi). Xem lib/ten-hien.ts.
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { gopTenHien, tenTheo, type DocTen, type TenHien } from "@/lib/ten-hien";

const Ctx = createContext<TenHien | null>(null);

/** Bọc phần vẽ một (hoặc vài) phản hồi engine; lồng nhau thì gộp với bảng của lớp ngoài. */
export function TenHienProvider({ ten, children }: { ten: (TenHien | null | undefined)[]; children: ReactNode }) {
  const ngoai = useContext(Ctx);
  const khoa = JSON.stringify(ten);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- khoá theo nội dung bảng
  const v = useMemo(() => gopTenHien(ngoai, ...ten), [ngoai, khoa]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useTen(): DocTen {
  const th = useContext(Ctx);
  const { ngonNgu } = useNgonNgu();
  return useMemo(() => tenTheo(th, ngonNgu === "en"), [th, ngonNgu]);
}
