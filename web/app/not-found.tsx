import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import NotFoundEn from "@/app/en/not-found";

// EN-ALL GĐ 5: trang Việt được rewrite từ URL Anh (vd /en/feng-shui/home-signs/<slug lạ> → notFound() trong route Việt) dùng
// 404 này — bản Anh hiện đúng trang 404 tiếng Anh (app/en/not-found.tsx). Bản Việt không đổi.
export async function generateMetadata(): Promise<Metadata> {
  if ((await ngonNguMayChu()).ngonNgu === "en") return { title: { absolute: "Page not found — Hieuban" }, robots: { index: false, follow: true } };
  return { title: "Không tìm thấy trang", robots: { index: false } };
}

export default async function NotFound() {
  if ((await ngonNguMayChu()).ngonNgu === "en") return <NotFoundEn />;
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
