// KV-THANG — trang nhận thẻ "Tháng N của tôi": lịch tháng với các ngày đã ghé (từ mã đã ký) + tháng cá nhân của người gửi,
// mời người nhận xem tháng này của họ ở /hom-nay, mang ?tu=tk.<…> để đo referral_signup như các thẻ khác. Không ngày sinh,
// không chuỗi, không huy hiệu, không hạng hội viên. Không index.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { docMaThang, tuTuMa } from "@/lib/ma-moi";
import { oLichThang, THU_NGAN } from "@/lib/lich-thang";
import { loiTheThang } from "@/lib/tong-ket-thang";
import { QuaNguoiNhan } from "@/components/sao/QuaNguoiNhan";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { GhiTu } from "@/components/khung/GhiMoThe";

interface Props { params: Promise<{ ma: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const nd = docMaThang(ma);
  if (!nd) return { title: "Thẻ Tháng của tôi", robots: { index: false } };
  const title = `Tháng ${nd.m} của ${nd.t} — ${nd.g.length} buổi sáng được thắp`;
  const anh = [`/og/thang?ma=${encodeURIComponent(ma)}`];
  return {
    title,
    description: `${loiTheThang({ thang: nd.m, so_ngay: nd.g.length, k: nd.k })} Xem ngày cá nhân, âm lịch và câu tự soi của chính bạn — miễn phí, không cần tài khoản.`,
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const nd = docMaThang(ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn xem được tháng này của riêng mình.</p>
        <Button asChild className="mt-6"><Link href="/hom-nay">Xem hôm nay của tôi</Link></Button>
      </div>
    );
  }
  const tu = tuTuMa("tk", ma);
  const ghe = new Set(nd.g);
  return (
    <div className="mx-auto max-w-md py-6 text-center" data-testid="the-thang" data-so-ngay={nd.g.length}>
      <GhiTu tu={tu} />
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--jade) / 0.45) 55%, rgb(var(--moon) / 0.35))" }}>
        <div className="rounded-2xl bg-surface px-6 py-8">
          <Logo className="mx-auto h-8 w-auto" />
          <p className="eyebrow mt-4">Tháng {nd.m}/{nd.y} của {nd.t}</p>
          <h1 className="mt-2 font-serif text-3xl">{nd.g.length} buổi sáng được thắp</h1>
          <p className="mt-2 text-sm text-fg-muted" data-testid="the-thang-k">Theo thần số, tháng {nd.m} là tháng cá nhân {nd.k} của {nd.t}.</p>
          <div className="mx-auto mt-5 grid w-full max-w-xs grid-cols-7 gap-1.5" role="img" aria-label={`Lịch tháng ${nd.m}: ${nd.g.length} ngày đã ghé`} data-testid="the-thang-lich">
            {THU_NGAN.map((t) => <span key={t} className="text-[0.65rem] uppercase tracking-wider text-fg-faint">{t}</span>)}
            {oLichThang(nd.y, nd.m).map((d, i) => (
              <span key={i} className={`grid aspect-square place-items-center rounded-full text-xs tabular-nums ${d === null ? "" : ghe.has(d) ? "bg-gold text-bg font-semibold shadow-[0_0_14px_rgb(var(--gold)/0.55)]" : "text-fg-faint"}`}
                data-ghe={d !== null && ghe.has(d) ? 1 : undefined}>{d ?? ""}</span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-8 font-serif text-2xl">Còn tháng này của bạn là tháng mấy?</p>
      <Button asChild size="lg" className="mt-4">
        <Link href={`/hom-nay?tu=${tu}`} data-testid="the-thang-moi">Xem hôm nay của bạn <ArrowRight aria-hidden /></Link>
      </Button>
      <QuaNguoiNhan className="mt-3" />
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Thẻ không mang ngày sinh hay thông tin riêng nào khác của người gửi.
      </p>
    </div>
  );
}
