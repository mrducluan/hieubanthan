"use client";
// CRO-1 — nút "Nhập ngày giờ sinh · xem ngay" ngay dưới lời dẫn, CHỈ trên điện thoại và CHỈ khi khối mời lập lá số
// (MoiLapLaSo) đang có trên trang: ô nhập đầu tiên nằm dưới màn đầu (thanh mảng + breadcrumb + H1 + lời dẫn chiếm hết
// màn hình), khách từ quảng cáo không thấy chỗ nhập. Bấm → cuộn tới khối và đặt con trỏ vào ô đầu tiên.
import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { caoDinhTren } from "@/lib/thanh-mang";

const CHON = '[data-testid="moi-lap-la-so"]';

/** `chon`: khối ô nhập cần đưa tới (mặc định khối mời lập lá số; Thời gian tới dùng khung nhập hồ sơ riêng — CRO-2). */
export function NutXuongForm({ moDun, nhan = "Nhập ngày giờ sinh · xem ngay", chon = CHON }: { moDun: string; nhan?: string; chon?: string }) {
  const [co, setCo] = useState(false);
  useEffect(() => {
    const xet = () => setCo(Boolean(document.querySelector(chon)));
    xet();
    const mo = new MutationObserver(xet);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [chon]);
  if (!co) return null;
  const bam = () => {
    const el = document.querySelector<HTMLElement>(chon);
    if (!el) return;
    ghi("chart_interacted", { mo_dun: moDun, kind: "nut_xuong_form" });
    const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const y = el.getBoundingClientRect().top + window.scrollY - caoDinhTren() - 8;
    window.scrollTo({ top: Math.max(0, y), behavior: giam ? "auto" : "smooth" });
    window.setTimeout(() => el.querySelector<HTMLInputElement>("input:not([type=hidden]), select")?.focus({ preventScroll: true }), giam ? 0 : 450);
  };
  return (
    <Button onClick={bam} className="nut-sang mt-5 w-full sm:w-auto lg:hidden" data-testid="nut-xuong-form">
      {nhan} <ArrowDown aria-hidden />
    </Button>
  );
}
