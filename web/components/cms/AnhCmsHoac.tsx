// ND-7 đợt 2 — "Hình trên trang": có ảnh thư viện CMS cho chỗ này thì hiện ảnh, không thì hiện hình gốc trong code
// (children — SVG có chuyển động). Ảnh luôn có alt (mô tả ảnh nhập ở Thư viện ảnh).
import type { ReactNode } from "react";
import { anhCms, type AnhCms } from "@/lib/cms";

export function AnhCmsHoac({ anh, co = "vua", className, uuTien = false, children }: {
  anh: AnhCms | null | undefined; co?: "og" | "vua" | "nho"; className?: string; /** ảnh đầu trang: tải ngay */ uuTien?: boolean; children: ReactNode;
}) {
  const a = anhCms(anh, co);
  if (!a) return <>{children}</>;
  return <img src={a.src} alt={a.alt} width={a.w} height={a.h} className={className} data-testid="anh-cms"
    loading={uuTien ? "eager" : "lazy"} {...(uuTien ? { fetchPriority: "high" as const } : {})} />;
}
