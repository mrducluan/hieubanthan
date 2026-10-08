import type { Metadata } from "next";
import Link from "next/link";
import { docMa } from "@/lib/ma-moi";
import { Button } from "@/components/ui/button";
import { NhanLoiMoi } from "./NhanLoiMoi";

interface Props { params: Promise<{ ma: string }> }

export async function generateMetadata({ params: thamSo }: Props): Promise<Metadata> {
  const params = await thamSo;
  const nd = docMa(params.ma);
  if (!nd) return { title: "Lời mời hợp đôi" };
  const title = `${nd.t} mời bạn xem hợp đôi`;
  return {
    title,
    description: "Con số của bạn và của người ấy hoà ở đâu, va ở đâu? Nhập ngày sinh để xem — không cần tài khoản.",
    openGraph: { title, images: [`/og?ma=${encodeURIComponent(params.ma)}&kieu=moi`] },
    robots: { index: false },
  };
}

// Trang người được mời (docs/THIET-KE-UI.md §6.2): teaser từ mã đã ký → nhập ngày sinh → kết quả đầy đủ.
export default async function Page({ params: thamSo }: Props) {
  const params = await thamSo;
  const nd = docMa(params.ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Lời mời không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn có thể tự xem con số của mình.</p>
        <Button asChild className="mt-6"><Link href="/">Xem con số của tôi</Link></Button>
      </div>
    );
  }
  return <NhanLoiMoi ma={params.ma} tenMoi={nd.t} soMoi={nd.so[0] ?? 0} tuKhoa={nd.k ?? null} />;
}
