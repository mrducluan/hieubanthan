// CTA-1 — trang nhận thẻ "Bản đồ 5 mảng": chòm sao 5 mảnh từ mã đã ký (không ngày sinh), trò "Đoán số" (đáp án trong
// mã), rồi mời tự xem bản đồ của mình — link mang ?tu=bd.<…> để hồ sơ đầu tiên tính referral_signup. Không index.
import type { Metadata } from "next";
import Link from "next/link";
import { docMaBanDo, tuTuMa } from "@/lib/ma-moi";
import { bienThe, dien } from "@/lib/the-ban-do";
import { Button } from "@/components/ui/button";
import { GhiTu } from "@/components/khung/GhiMoThe";
import { DoanSo } from "@/components/chia-se/DoanSo";

interface Props { params: Promise<{ ma: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const nd = docMaBanDo(ma);
  if (!nd) return { title: "Thẻ bản đồ 5 mảng", robots: { index: false } };
  const bt = bienThe(nd.b);
  const title = dien(bt.tieuDe, nd.t);
  const anh = [`/og/ban-do?ma=${encodeURIComponent(ma)}`];
  return {
    title,
    description: `${bt.loiMoi} Đoán đường đời của ${nd.t}, rồi xem bản đồ 5 mảng của chính bạn — 30 giây, không cần tài khoản.`,
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const nd = docMaBanDo(ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn có thể xem bản đồ 5 mảng của mình.</p>
        <Button asChild className="mt-6"><Link href="/">Xem bản đồ của tôi</Link></Button>
      </div>
    );
  }
  const tu = tuTuMa("bd", ma);
  return (
    <div className="mx-auto max-w-2xl py-6" data-testid="the-ban-do-nhan">
      <GhiTu tu={tu} />
      <h1 className="sr-only">{dien(bienThe(nd.b).tieuDe, nd.t)}</h1>
      <DoanSo nd={nd} tu={tu} />
    </div>
  );
}
