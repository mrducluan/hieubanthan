import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Không tìm thấy trang", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl">Trang này không có trên bản đồ sao</h1>
      <p className="mt-3 text-fg-muted">Link có thể bị gõ sai hoặc trang đã đổi chỗ. Hồ sơ của bạn vẫn còn nguyên trên máy.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild><Link href="/ban-than">Về hồ sơ của tôi</Link></Button>
        <Button asChild variant="secondary"><Link href="/huyen-hoc">Huyền học</Link></Button>
      </div>
    </div>
  );
}
