"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarHeart, Heart, Hash, Orbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NhapHoSo } from "./NhapHoSo";
import { tenGoi, useHoSo } from "@/lib/hoso";

// Ô nhập ở trang chủ: chưa có hồ sơ → form 2 trường; đã có → lối về trung tâm "Bản thân".
export function CuaVao() {
  const hoSo = useHoSo();
  const router = useRouter();
  if (hoSo === undefined) return <div className="h-[15rem] animate-pulse rounded-2xl bg-surface/50" />;
  if (hoSo) {
    // Người quay lại: ngoài nút chính có lối tắt tới việc hay làm mỗi ngày (khâu QUAY LẠI) — chỉ là link, không tính gì.
    return (
      <div className="glass rounded-2xl p-5 sm:p-6" data-testid="chao-lai">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div>
            <p className="eyebrow">Chào lại</p>
            <p className="mt-1 font-serif text-3xl">{tenGoi(hoSo)}</p>
          </div>
          <p className="text-sm text-fg-muted">Hồ sơ đã sẵn sàng trên máy này.</p>
        </div>
        <Button asChild size="lg" className="mt-4 w-full">
          <Link href="/ban-than">Mở hồ sơ bản thân <ArrowRight aria-hidden /></Link>
        </Button>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {([["/hom-nay", "Hôm nay", CalendarHeart], ["/than-so", "Thần số", Hash], ["/hop-doi", "Hợp đôi", Heart], ["/tu-vi", "Tử vi", Orbit]] as const).map(([href, ten, Icon]) => (
            <li key={href}>
              <Link href={href} className="flex items-center justify-center gap-1.5 rounded-xl border border-line/70 bg-bg/30 px-2 py-2 text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">
                <Icon className="size-4 text-gold" aria-hidden />{ten}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="glass rounded-2xl p-6">
      <p className="mb-5 font-serif text-xl">Bắt đầu — chỉ cần 2 thông tin</p>
      <NhapHoSo onXong={() => router.push("/ban-than?moi=1")} />
    </div>
  );
}
