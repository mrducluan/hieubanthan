"use client";
// GĐ 2 — Nối luồng AI → Escalate to Expert (Smart Escalation): chỉ hiện khi công tắc Hỏi chuyên gia đang bật (`bat = true`)
// và người dùng đã hỏi sâu (≥ 2 câu) hoặc AI gặp câu phức tạp (`hoiLai`).
// Nội dung gợi ý câu hỏi đi qua sessionStorage trên máy, KHÔNG bao giờ đưa lên URL (Luật 91/2025).
import { useEffect, useState } from "react";
import Link from "@/components/khung/Lien";
import { ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { TEN_MANG_CG, type MangCg } from "@/lib/chuyen-gia-hoi";

const KHOA_NHAP = "cg:nhap";

const BAN_DO_MANG: Record<string, MangCg> = {
  thanso: "than_so",
  than_so: "than_so",
  tuvi: "tu_vi",
  tu_vi: "tu_vi",
  battu: "bat_tu",
  bat_tu: "bat_tu",
  kinhdich: "kinh_dich",
  kinh_dich: "kinh_dich",
  phongthuy: "phong_thuy",
  phong_thuy: "phong_thuy",
};

export function mangCgTuMoDun(moDun: string): MangCg | null {
  return BAN_DO_MANG[moDun] ?? null;
}

// Cache một lần theo phiên trình duyệt để không gọi lặp /api/chuyen-gia/thong-tin trên mỗi lượt chat.
let _cgBatCache: boolean | null = null;
let _cgBatPromise: Promise<boolean> | null = null;

function kiemCongTacChuyenGia(): Promise<boolean> {
  if (_cgBatCache !== null) return Promise.resolve(_cgBatCache);
  if (!_cgBatPromise) {
    _cgBatPromise = fetch("/api/chuyen-gia/thong-tin", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { bat?: boolean } | null) => {
        _cgBatCache = d?.bat === true;
        return _cgBatCache;
      })
      .catch(() => false);
  }
  return _cgBatPromise;
}

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

/** Chỉ kiểm công tắc chuyên gia KHI điều kiện Smart Escalation đã thoả (`kichHoat = true`), không gọi mạng lúc mới mở trang. */
export function LoiMoiChuyenGiaTuDong({ moDun, kichHoat, goiYCau, nguon }: { moDun: string; kichHoat: boolean; goiYCau?: string; nguon?: string }) {
  const mang = mangCgTuMoDun(moDun);
  const [bat, setBat] = useState(false);

  useEffect(() => {
    if (!kichHoat || !mang) return;
    let huy = false;
    void kiemCongTacChuyenGia().then((ok) => { if (!huy) setBat(ok); });
    return () => { huy = true; };
  }, [kichHoat, mang]);

  if (!kichHoat || !mang || !bat) return null;
  return <LoiMoiChuyenGia mang={mang} bat={bat} goiYCau={goiYCau} nguon={nguon} />;
}
