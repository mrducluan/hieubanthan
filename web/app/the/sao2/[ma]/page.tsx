// CHANG-4 — trang nhận thẻ "Hợp đôi chiêm tinh": cung Mặt Trời hai người + ≤ 3 chủ đề tương tác từ mã đã ký (không tên
// người kia, không ngày giờ / nơi sinh, không điểm số) + lời mời về /chiem-tinh#hop-doi, mang ?tu=sd.<…>. Không index.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { ArrowRight, Lock } from "lucide-react";
import { docMaSao2, tuTuMa } from "@/lib/ma-moi";
import { QuaNguoiNhan } from "@/components/sao/QuaNguoiNhan";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { GhiTu } from "@/components/khung/GhiMoThe";
import { tenTheSao2 } from "@/lib/the-sao";

interface Props { params: Promise<{ ma: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const nd = docMaSao2(ma);
  if (!nd) return { title: "Thẻ hợp đôi chiêm tinh", robots: { index: false } };
  const title = `${tenTheSao2(nd.a)} — hai bản đồ sao gặp nhau ở đâu`;
  const anh = [`/og/sao2?ma=${encodeURIComponent(ma)}`];
  return {
    title,
    description: "Chỗ hai bản đồ sao dễ đồng điệu và chỗ cần thoả thuận — không chấm điểm. Xem hai bản đồ sao của bạn trong 1 phút.",
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const nd = docMaSao2(ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn có thể xem hai bản đồ sao của riêng mình.</p>
        <Button asChild className="mt-6"><Link href="/chiem-tinh#hop-doi">Xem hai bản đồ sao</Link></Button>
      </div>
    );
  }
  const tu = tuTuMa("sd", ma);
  return (
    <div className="mx-auto max-w-md py-6 text-center" data-testid="the-sao2">
      <GhiTu tu={tu} />
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--jade) / 0.45) 55%, rgb(var(--moon) / 0.35))" }}>
        <div className="rounded-2xl bg-surface px-6 py-8">
          <Logo className="mx-auto h-8 w-auto" />
          <p className="eyebrow mt-4">Chiêm tinh · hai bản đồ sao</p>
          <h1 className="mt-2 font-serif text-3xl">{tenTheSao2(nd.a)}</h1>
          <p className="mt-2 text-sm" data-testid="the-sao2-mt">
            <span className="text-gold">Mặt Trời {nd.s[1]}</span>
            <span className="text-fg-faint"> · </span>
            <span className="text-jade">Mặt Trời {nd.k?.[1] ?? "—"}</span>
          </p>
          <p className="mt-5 text-xs uppercase tracking-wider text-fg-faint">Chỗ hai bản đồ sao gặp nhau</p>
          <ul className="mx-auto mt-2 max-w-xs space-y-1.5 text-left text-sm" data-testid="the-sao2-chu-de">
            {nd.c.map(([m, ten]) => <li key={m} className="flex gap-2"><span aria-hidden className="text-gold">•</span>{ten}</li>)}
          </ul>
          <p className="mt-5 text-xs text-fg-faint">Không chấm điểm hợp – khắc: chỉ chỉ ra chỗ dễ đồng điệu và chỗ cần thoả thuận.</p>
        </div>
      </div>
      <p className="mt-8 font-serif text-2xl">Bạn với người ấy gặp nhau ở đâu?</p>
      <Button asChild size="lg" className="mt-4">
        <Link href={`/chiem-tinh?tu=${tu}#hop-doi`} data-testid="the-sao2-moi">Xem hai bản đồ sao của bạn <ArrowRight aria-hidden /></Link>
      </Button>
      <QuaNguoiNhan className="mt-3" />
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Thẻ không mang tên người kia, ngày giờ hay nơi sinh của ai.
      </p>
    </div>
  );
}
