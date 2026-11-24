"use client";
// GĐ 2 — lời mời "Hỏi chuyên gia" trong khung hỏi đáp: chỉ hiện khi công tắc Hỏi chuyên gia bật, người dùng đã nhận ≥ 2 câu
// trả lời thường (hoặc máy chưa chắc hiểu câu — `hoiLai`), và TRONG PHIÊN KHÔNG có câu khủng hoảng / từ chối / dẫn hướng
// (KhungChat tính `kichHoat`). Không giá, không thúc ép; hạn trả lời lấy từ cấu hình máy chủ.
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
type CongTac = { bat: boolean; hanGio: number };
let _cgCache: CongTac | null = null;
let _cgPromise: Promise<CongTac> | null = null;

/** Lỗi mạng không được nhớ (lần sau thử lại); kết quả thật nhớ trong phiên trang. */
function kiemCongTacChuyenGia(): Promise<CongTac> {
  if (_cgCache) return Promise.resolve(_cgCache);
  _cgPromise ??= fetch("/api/chuyen-gia/thong-tin", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
    .then((d: { bat?: boolean; han_gio?: number }) => {
      _cgCache = { bat: d?.bat === true, hanGio: Number(d?.han_gio) > 0 ? Number(d.han_gio) : 48 };
      return _cgCache;
    })
    .catch(() => { _cgPromise = null; return { bat: false, hanGio: 48 }; });
  return _cgPromise;
}

export function LoiMoiChuyenGia({ mang, bat, goiYCau, nguon, hanGio = 48 }: { mang: MangCg; bat: boolean; goiYCau?: string; nguon?: string; hanGio?: number }) {
  useEffect(() => { if (bat) ghi("chart_interacted", { kind: "escalate_expert_viewed", mo_dun: mang, ...(nguon ? { nguon } : {}) }); }, [bat, mang, nguon]);
  if (!bat) return null;
  const href = `/hoi-chuyen-gia?mang=${encodeURIComponent(mang)}`;

  const bam = () => {
    // Chỉ gợi câu khi người dùng CHƯA có bản nháp đang viết dở (không ghi đè câu dài họ đã soạn).
    if (goiYCau && goiYCau.trim().length >= 10) {
      try { if (!sessionStorage.getItem(KHOA_NHAP)) sessionStorage.setItem(KHOA_NHAP, JSON.stringify({ mang, cau: goiYCau.trim().slice(0, 240) })); } catch { /* bỏ qua */ }
    }
    ghi("chart_interacted", { kind: "escalate_expert", mo_dun: mang, ...(nguon ? { nguon } : {}) });
  };

  return (
    <div
      data-testid="loi-moi-chuyen-gia"
      className="flex flex-col gap-3 rounded-2xl border border-gold/25 bg-gold/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium text-fg">
          <UserCheck className="size-4 text-gold" aria-hidden />
          Muốn một người đọc kỹ trường hợp của bạn?
        </p>
        <p className="text-xs text-fg-muted">
          Gửi một câu hỏi cụ thể về {TEN_MANG_CG[mang]}, chuyên gia trả lời bằng văn bản trong {hanGio} giờ. Quá hạn thì hoàn tiền đủ.
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
  const [ct, setCt] = useState<CongTac | null>(null);

  useEffect(() => {
    if (!kichHoat || !mang) return;
    let huy = false;
    void kiemCongTacChuyenGia().then((x) => { if (!huy) setCt(x); });
    return () => { huy = true; };
  }, [kichHoat, mang]);

  if (!kichHoat || !mang || !ct?.bat) return null;
  return <LoiMoiChuyenGia mang={mang} bat goiYCau={goiYCau} nguon={nguon} hanGio={ct.hanGio} />;
}
