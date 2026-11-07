// TR-3 — trang nhận thẻ "Câu trả lời của lá bài": các lá đã rút (vẽ lại bằng hình SVG của site), hướng nghiêng engine đã đọc
// và nhãn loại việc theo danh mục — từ mã đã ký (không câu hỏi, không ngày sinh) + lời mời "Rút bài cho việc của bạn" về
// /tarot, mang ?tu=ta.<…> để đo referral_signup như các thẻ khác. Không index.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { ArrowRight, Lock } from "lucide-react";
import { docMaTarot, tuTuMa } from "@/lib/ma-moi";
import { laGonTuMa } from "@/lib/tarot-chung";
import { QuaNguoiNhan } from "@/components/sao/QuaNguoiNhan";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { GhiTu } from "@/components/khung/GhiMoThe";
import { MatTruoc } from "@/components/tarot/LaBai";

interface Props { params: Promise<{ ma: string }> }

const tenThe = (t: string) => (t.trim() ? `Lá bài trả lời ${t.trim()}` : "Lá bài trả lời tôi");
const MAU_NG = { tien: "text-jade", dieu_kien: "text-gold", cho: "text-[#f0b35c]" } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const nd = docMaTarot(ma);
  if (!nd) return { title: "Thẻ trải bài Tarot", robots: { index: false } };
  const title = `${tenThe(nd.t)}: ${nd.h}`;
  const anh = [`/og/tarot?ma=${encodeURIComponent(ma)}`];
  return {
    title,
    description: "Một câu hỏi, vài lá bài và hướng nghiêng của chúng — có, có điều kiện hay chưa nên vội. Rút bài cho việc của bạn trong 1 phút, không cần tài khoản.",
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const nd = docMaTarot(ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn có thể rút bài cho việc của mình.</p>
        <Button asChild className="mt-6"><Link href="/tarot">Rút bài của tôi</Link></Button>
      </div>
    );
  }
  const tu = tuTuMa("ta", ma);
  const it = nd.l.length <= 5;
  return (
    <div className="mx-auto max-w-xl py-6 text-center" data-testid="the-tarot">
      <GhiTu tu={tu} />
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--moon) / 0.45) 55%, rgb(var(--jade) / 0.35))" }}>
        <div className="rounded-2xl bg-surface px-5 py-8">
          <Logo className="mx-auto h-8 w-auto" />
          <p className="eyebrow mt-4">Tarot{nd.w ? ` · ${nd.w}` : ""}</p>
          <h1 className="mt-2 font-serif text-3xl">{tenThe(nd.t)}</h1>
          <p className={`mt-2 font-serif text-2xl ${MAU_NG[nd.n]}`} data-testid="the-tarot-nghieng">{nd.h}</p>
          <div className={`mx-auto mt-5 grid gap-2 ${it ? "max-w-md" : ""}`} style={{ gridTemplateColumns: `repeat(${Math.min(nd.l.length, it ? 5 : 5)}, minmax(0, 1fr))` }}>
            {nd.l.map(([id, nguoc, ten, vt], i) => (
              <figure key={`${id}${i}`} className="space-y-1">
                <div className="overflow-hidden rounded-[9px] shadow-card" style={{ aspectRatio: "120 / 200" }}><MatTruoc la={laGonTuMa(id, ten)} nguoc={nguoc} /></div>
                <figcaption className="text-[11px] leading-tight text-fg-muted">{vt}{nguoc ? " · ngược" : ""}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-5 text-sm text-fg-muted">{nd.c}</p>
          <p className="mt-3 text-xs text-fg-faint">Lá bài cho hướng nghiêng và điều kiện, không phải lời phán — quyết định là của người hỏi.</p>
        </div>
      </div>
      <p className="mt-8 font-serif text-2xl">Bạn đang phân vân việc gì?</p>
      <Button asChild size="lg" className="mt-4">
        <Link href={`/tarot?tu=${tu}`} data-testid="the-tarot-moi">Rút bài cho việc của bạn <ArrowRight aria-hidden /></Link>
      </Button>
      <QuaNguoiNhan className="mt-3" />
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Thẻ không mang câu hỏi, ngày sinh hay lời đọc của người gửi.
      </p>
    </div>
  );
}
