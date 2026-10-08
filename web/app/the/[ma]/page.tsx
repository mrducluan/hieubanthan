import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { docMa } from "@/lib/ma-moi";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { GhiMoThe } from "@/components/khung/GhiMoThe";

interface Props { params: Promise<{ ma: string }> }
const TEN = ["Đường đời", "Sứ mệnh", "Linh hồn", "Nhân cách"];

export async function generateMetadata({ params: thamSo }: Props): Promise<Metadata> {
  const params = await thamSo;
  const nd = docMa(params.ma);
  if (!nd) return { title: "Thẻ hồ sơ" };
  const title = `Con số đường đời của ${nd.t} là ${nd.so[0]}`;
  return {
    title,
    description: `${nd.k ?? ""} — xem con số của bạn trong 30 giây.`,
    openGraph: { title, images: [`/og?ma=${encodeURIComponent(params.ma)}`] },
    robots: { index: false },
  };
}

// Thẻ công khai (người nhận link thấy) → lối vào luồng Phase 1 cho người mới.
export default async function Page({ params: thamSo }: Props) {
  const params = await thamSo;
  const nd = docMa(params.ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <Button asChild className="mt-6"><Link href="/">Xem con số của tôi</Link></Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-md py-6 text-center">
      <GhiMoThe ma={params.ma} />
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--moon) / 0.35) 45%, rgb(var(--jade) / 0.5))" }}>
        <div className="rounded-2xl bg-surface px-6 py-8">
          <Logo className="mx-auto size-8" />
          <p className="eyebrow mt-4">Hồ sơ bản thân</p>
          <h1 className="mt-2 text-3xl">{nd.t}</h1>
          <p className="text-gradient-gold mt-4 font-serif text-8xl leading-none" data-testid="so-the">{nd.so[0]}</p>
          {nd.k && <p className="mt-2 font-serif text-xl">{nd.k}</p>}
          <dl className="mt-6 grid grid-cols-4 gap-2">
            {nd.so.map((s, i) => (
              <div key={i} className="rounded-xl bg-bg/50 py-3">
                <dd className="font-serif text-2xl text-gold">{s}</dd>
                <dt className="mt-1 text-[0.6rem] uppercase tracking-wider text-fg-faint">{TEN[i]}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="mt-8 font-serif text-2xl">Còn bạn — con số nào?</p>
      <Button asChild size="lg" className="mt-4"><Link href="/">Xem con số của tôi <ArrowRight aria-hidden /></Link></Button>
      <p className="mt-3 text-xs text-fg-faint">Chưa đầy 30 giây · không cần tài khoản</p>
    </div>
  );
}
