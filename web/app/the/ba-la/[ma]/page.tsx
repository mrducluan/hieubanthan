// BT-UI — trang nhận thẻ "Ba lá của {tên}": lá Tarot (vẽ lại bằng hình SVG của site; mã không mang lá thì vẽ lá úp), số ngày cá nhân, tên quẻ đầu
// ngày — từ mã đã ký (không ngày sinh, không lời đọc) + lời mời "Lật ba lá của bạn" về /hom-nay, mang ?tu=bl.<…> để đo
// referral_signup như các thẻ khác. Không index.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { ArrowRight, Lock } from "lucide-react";
import { docMaBaLa, tuTuMa } from "@/lib/ma-moi";
import { laGonTuMa } from "@/lib/tarot-chung";
import { QuaNguoiNhan } from "@/components/sao/QuaNguoiNhan";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { GhiTu } from "@/components/khung/GhiMoThe";
import { MatSau, MatTruoc } from "@/components/tarot/LaBai";

interface Props { params: Promise<{ ma: string }> }

const dm = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const nd = docMaBaLa(ma);
  if (!nd) return { title: "Ba lá của ngày", robots: { index: false } };
  const title = `Ba lá của ${nd.t} ngày ${dm(nd.d)}: ${nd.l ? `${nd.l[1]} · ` : ""}ngày cá nhân ${nd.n} — còn bạn?`;
  const anh = [`/og/ba-la?ma=${encodeURIComponent(ma)}`];
  return {
    title,
    description: "Mỗi ngày ba lá: một lá Tarot riêng theo ngày sinh, con số của ngày và giờ tốt sắp tới. Lật ba lá của bạn — miễn phí, không cần tài khoản.",
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const nd = docMaBaLa(ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn có thể lật ba lá của chính mình.</p>
        <Button asChild className="mt-6"><Link href="/hom-nay">Lật ba lá của tôi</Link></Button>
      </div>
    );
  }
  const tu = tuTuMa("bl", ma);
  const khung = "flex flex-col items-center justify-between rounded-[9px] border-2 border-gold/70 bg-[#f3ead6] p-2 text-[#2a2140] shadow-card";
  return (
    <div className="mx-auto max-w-xl py-6 text-center" data-testid="the-ba-la">
      <GhiTu tu={tu} />
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--moon) / 0.45) 55%, rgb(var(--jade) / 0.35))" }}>
        <div className="rounded-2xl bg-surface px-5 py-8">
          <Logo className="mx-auto h-8 w-auto" />
          <p className="eyebrow mt-4">Ba lá của ngày</p>
          <h1 className="mt-2 font-serif text-3xl">Ba lá của {nd.t} ngày {dm(nd.d)}</h1>
          <div className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3">
            <figure className="space-y-1.5">
              {/* Mã không mang lá (lá riêng chưa được phép lên thẻ) → vẽ lá úp: chỉ người lật mới thấy lá của mình. */}
              <div className="overflow-hidden rounded-[9px] shadow-card" style={{ aspectRatio: "120 / 200" }} data-testid="the-ba-la-tarot" data-up={nd.l ? 0 : 1}>
                {nd.l ? <MatTruoc la={laGonTuMa(nd.l[0], nd.l[1])} /> : <MatSau />}
              </div>
              <figcaption className="text-xs text-fg-muted">Lá Tarot</figcaption>
            </figure>
            <figure className="space-y-1.5">
              <div className={khung} style={{ aspectRatio: "120 / 200" }}>
                <span className="text-[0.6rem] uppercase tracking-widest opacity-70">Ngày cá nhân</span>
                <span className="font-serif text-6xl leading-none" data-testid="the-ba-la-so">{nd.n}</span>
                <span className="text-[0.65rem] opacity-70">số của ngày</span>
              </div>
              <figcaption className="text-xs text-fg-muted">Lá Con số</figcaption>
            </figure>
            <figure className="space-y-1.5">
              <div className={khung} style={{ aspectRatio: "120 / 200" }}>
                <span className="text-[0.6rem] uppercase tracking-widest opacity-70">Quẻ đầu ngày</span>
                <span className="font-serif text-lg leading-tight">{nd.q ?? "Giờ tốt"}</span>
                <span className="text-[0.65rem] opacity-70">giờ tốt trong ngày</span>
              </div>
              <figcaption className="text-xs text-fg-muted">Lá Thời khắc</figcaption>
            </figure>
          </div>
          <p className="mt-5 text-sm text-fg-muted">Lá Tarot và con số chọn theo ngày sinh của {nd.t} và ngày {dm(nd.d)}. Ba lá của bạn sẽ khác.</p>
          <p className="mt-2 text-xs text-fg-faint">Gợi ý để tự soi trong ngày, không phải dự báo.</p>
        </div>
      </div>
      <p className="mt-8 font-serif text-2xl">Còn ba lá của bạn hôm nay là gì?</p>
      <Button asChild size="lg" className="mt-4">
        <Link href={`/hom-nay?tu=${tu}#ba-la`} data-testid="the-ba-la-moi">Lật ba lá của bạn <ArrowRight aria-hidden /></Link>
      </Button>
      <QuaNguoiNhan className="mt-3" />
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Thẻ không mang ngày sinh hay lời đọc của người gửi.
      </p>
    </div>
  );
}
