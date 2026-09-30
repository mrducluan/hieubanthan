"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NhapHoSo } from "./NhapHoSo";
import { tenGoi, useHoSo } from "@/lib/hoso";

// Ô nhập ở trang chủ: chưa có hồ sơ → form 2 trường; đã có → lối về trung tâm "Bản thân".
export function CuaVao() {
  const hoSo = useHoSo();
  const router = useRouter();
  if (hoSo === undefined) return <div className="h-[22rem] animate-pulse rounded-2xl bg-surface/50" />;
  if (hoSo) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="eyebrow">Chào lại</p>
        <p className="mt-2 font-serif text-3xl">{tenGoi(hoSo)}</p>
        <p className="mt-2 text-sm text-fg-muted">Hồ sơ của bạn đã sẵn sàng trên máy này.</p>
        <Button asChild size="lg" className="mt-5 w-full">
          <Link href="/ban-than">Mở hồ sơ bản thân <ArrowRight aria-hidden /></Link>
        </Button>
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
