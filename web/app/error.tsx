"use client";
// Lỗi khi hiển thị một trang: báo thân thiện + thử lại, và gửi lỗi về Sentry (nếu bật).
import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { baoLoi } from "@/lib/giam-sat";

export default function LoiTrang({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { baoLoi(error, { noi: "trang", ...(error.digest ? { digest: error.digest } : {}) }); }, [error]);
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="eyebrow">Có lỗi</p>
      <h1 className="mt-2 text-3xl">Trang này vừa gặp trục trặc</h1>
      <p className="mt-3 text-fg-muted">Lỗi đã được ghi lại để sửa. Hồ sơ của bạn vẫn còn nguyên trên máy.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={reset}><RotateCw aria-hidden /> Thử lại</Button>
        <Button asChild variant="secondary"><Link href="/ban-than">Về hồ sơ</Link></Button>
      </div>
    </div>
  );
}
