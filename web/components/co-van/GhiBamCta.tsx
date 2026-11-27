"use client";
// Link có đo lượt bấm (`cross_cta_clicked{tu, den: co_van}`) — chỉ mã trang nguồn, không có chữ nào của người dùng.
import type { ReactNode } from "react";
import Link from "@/components/khung/Lien";
import { ghi } from "@/lib/do-luong";

export function GhiBamCta({ tu, href, className, children }: { tu: string; href: string; className?: string; children: ReactNode }) {
  return <Link href={href} className={className} onClick={() => ghi("cross_cta_clicked", { tu, den: "co_van", ca_nhan: 0 })}>{children}</Link>;
}
