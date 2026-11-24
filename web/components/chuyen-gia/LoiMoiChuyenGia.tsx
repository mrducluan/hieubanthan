"use client";
// GĐ 2 — Nối luồng AI → Escalate to Expert: đặt cuối báo cáo hoặc khung hỏi đáp để người dùng chuyển câu hỏi phức tạp
// sang chuyên gia thật với mảng đã chọn sẵn (?mang=...). Chỉ hiện khi `bat = true` (công tắc Hỏi chuyên gia đang mở).
// Nội dung gợi ý câu hỏi (nếu có) đi qua sessionStorage trên máy, KHÔNG bao giờ đưa lên URL (Luật 91/2025).
import Link from "@/components/khung/Lien";
import { ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { TEN_MANG_CG, type MangCg } from "@/lib/chuyen-gia-hoi";

const KHOA_NHAP = "cg:nhap";

export function LoiMoiChuyenGia({ mang, bat, goiYCau, nguon }: { mang: MangCg; bat: boolean; goiYCau?: string; nguon?: string }) {
  if (!bat) return null;
  const href = `/hoi-chuyen-gia?mang=${encodeURIComponent(mang)}`;

  const bam = () => {
    if (goiYCau && goiYCau.trim().length >= 10) {
      try { sessionStorage.setItem(KHOA_NHAP, JSON.stringify({ mang, cau: goiYCau.trim().slice(0, 240) })); } catch { /* bỏ qua */ }
    }
    ghi("chart_interacted", { kind: "escalate_expert", mang, ...(nguon ? { nguon } : {}) });
  };

  return (
    <div
      data-testid="loi-moi-chuyen-gia"
      className="flex flex-col gap-3 rounded-2xl border border-gold/25 bg-gold/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium text-fg">
          <UserCheck className="size-4 text-gold" aria-hidden />
          Tình huống riêng phức tạp hơn bản luận tự động?
        </p>
        <p className="text-xs text-fg-muted">
          Gửi một câu hỏi cụ thể về {TEN_MANG_CG[mang]} để chuyên gia thẩm định trả lời bằng văn bản trong 48 giờ — thanh toán trực tiếp bằng VND, hoàn 100% nếu quá hạn.
        </p>
      </div>
      <Button asChild size="sm" variant="secondary" className="shrink-0" onClick={bam}>
        <Link href={href}>
          Hỏi chuyên gia <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
