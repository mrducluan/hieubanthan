// UI-KD 6 — trang nhận thẻ "Quẻ của tôi": sáu vạch quẻ bản (+ quẻ biến) từ mã đã ký (không câu hỏi, không giờ gieo, không
// lời đọc) + lời mời "Gieo quẻ của bạn" về /kinh-dich, mang ?tu=qu.<…> để đo referral_signup như các thẻ khác. Không index.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { docMaQue, tuTuMa } from "@/lib/ma-moi";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { GhiTu } from "@/components/khung/GhiMoThe";
import { VeQueNho } from "@/components/huyen-hoc/VeQue";

interface Props { params: Promise<{ ma: string }> }

const tenThe = (t: string) => (t.trim() ? `Quẻ của ${t.trim()}` : "Quẻ của tôi");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const nd = docMaQue(ma);
  if (!nd) return { title: "Thẻ quẻ Kinh Dịch", robots: { index: false } };
  const title = `${tenThe(nd.t)} — ${nd.q}${nd.b ? ` biến ${nd.b}` : ""}`;
  const anh = [`/og/que?ma=${encodeURIComponent(ma)}`];
  return {
    title,
    description: "Một quẻ Kinh Dịch cho một việc đang cân nhắc: vạch vàng là hào động — chỗ việc đang chuyển. Gieo quẻ của bạn trong 1 phút, không cần tài khoản.",
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const nd = docMaQue(ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn có thể gieo quẻ của riêng mình.</p>
        <Button asChild className="mt-6"><Link href="/kinh-dich">Gieo quẻ của tôi</Link></Button>
      </div>
    );
  }
  const tu = tuTuMa("qu", ma);
  const bien = nd.b ? nd.g.map((v) => (v === 9 ? 8 : v === 6 ? 7 : v)) : null;   // vạch quẻ biến: chỉ đổi vạch động (hình vẽ)
  return (
    <div className="mx-auto max-w-md py-6 text-center" data-testid="the-que">
      <GhiTu tu={tu} />
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--jade) / 0.45) 55%, rgb(var(--moon) / 0.35))" }}>
        <div className="rounded-2xl bg-surface px-6 py-8">
          <Logo className="mx-auto size-8" />
          <p className="eyebrow mt-4">Kinh Dịch{nd.c ? ` · ${nd.c}` : ""}</p>
          <h1 className="mt-2 font-serif text-3xl">{tenThe(nd.t)}</h1>
          <p className="mt-2 font-serif text-xl text-gold" data-testid="the-que-ten">{nd.q}{nd.b ? <span className="text-fg-muted"> biến {nd.b}</span> : <span className="text-sm text-fg-faint"> · không hào động</span>}</p>
          <div className="mx-auto mt-5 flex items-end justify-center gap-6">
            <VeQueNho giaTri={nd.g} nhan={`Quẻ bản: ${nd.q}`} rong="w-20" />
            {bien && nd.b && (<>
              <ArrowRight className="mb-7 size-5 text-fg-faint" aria-hidden />
              <VeQueNho giaTri={bien} nhan={`Quẻ biến: ${nd.b}`} rong="w-20" />
            </>)}
          </div>
          <p className="mt-5 text-xs text-fg-faint">Vạch vàng là hào động — chỗ việc đang chuyển. Quẻ do máy tính toán gieo hoặc người gửi tự gieo; lời đọc là của riêng người gửi.</p>
        </div>
      </div>
      <p className="mt-8 font-serif text-2xl">Bạn đang phân vân việc gì?</p>
      <Button asChild size="lg" className="mt-4">
        <Link href={`/kinh-dich?tu=${tu}`} data-testid="the-que-moi">Gieo quẻ của bạn <ArrowRight aria-hidden /></Link>
      </Button>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Thẻ không mang câu hỏi, giờ gieo hay lời đọc của người gửi.
      </p>
    </div>
  );
}
