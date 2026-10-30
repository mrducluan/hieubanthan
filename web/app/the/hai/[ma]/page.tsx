// TCS-1 — trang nhận thẻ "Điểm hai người": hiện thẻ từ mã đã ký (không ngày sinh) + lời mời "Xem điểm của bạn với
// người ấy" dẫn về khối "Xem lá số 2 người" ở /tu-vi, mang ?tu=hp.<…> để hồ sơ đầu tiên tính referral_signup.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { docMaHai, tuTuMa } from "@/lib/ma-moi";
import { MAU_MUC_HAI, NHAN_MUC_HAI, TEN_QUAN_HE_HAI, TEN_TIEU_CHI_HAI, tenHai } from "@/lib/the-chia-se";
import { QuaNguoiNhan } from "@/components/sao/QuaNguoiNhan";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { GhiTu } from "@/components/khung/GhiMoThe";

interface Props { params: Promise<{ ma: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const nd = docMaHai(ma);
  if (!nd) return { title: "Thẻ điểm hai người", robots: { index: false } };
  const [a, b] = tenHai(nd.a, nd.q);
  const title = `${a} & ${b}: ${nd.p}/100 — ${NHAN_MUC_HAI[nd.m]}`;
  const anh = [`/og/hai?ma=${encodeURIComponent(ma)}`];
  return {
    title,
    description: "Điểm tham khảo hợp – khắc theo mệnh, can chi và lá số Tử vi. Xem điểm của bạn với người ấy — không cần tài khoản.",
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

const R = 52;
const CHU_VI = 2 * Math.PI * R;

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const nd = docMaHai(ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn có thể tự xem điểm hai người.</p>
        <Button asChild className="mt-6"><Link href="/tu-vi#hop-tham">Xem lá số 2 người</Link></Button>
      </div>
    );
  }
  const tu = tuTuMa("hp", ma);
  const [a, b] = tenHai(nd.a, nd.q);
  const mau = MAU_MUC_HAI[nd.m];
  return (
    <div className="mx-auto max-w-md py-6 text-center" data-testid="the-hai">
      <GhiTu tu={tu} />
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--moon) / 0.35) 45%, rgb(var(--jade) / 0.5))" }}>
        <div className="rounded-2xl bg-surface px-6 py-8">
          <Logo className="mx-auto h-8 w-auto" />
          <p className="eyebrow mt-4">Xem lá số 2 người · {TEN_QUAN_HE_HAI[nd.q]}</p>
          <h1 className="mt-2 font-serif text-3xl">{a} <span className="text-gold">✦</span> {b}</h1>
          <div className="relative mx-auto mt-5 size-40" data-testid="the-hai-diem" data-diem={nd.p}>
            <svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label={`Điểm tham khảo ${nd.p} trên 100 — ${NHAN_MUC_HAI[nd.m]}`}>
              <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeWidth="9" className="text-line/60" />
              <circle cx="60" cy="60" r={R} fill="none" stroke={mau} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={CHU_VI} strokeDashoffset={CHU_VI * (1 - nd.p / 100)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
              <span className="font-serif text-5xl leading-none tabular-nums">{nd.p}</span>
              <span className="mt-1 text-xs text-fg-faint">/ 100</span>
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl" style={{ color: mau }} data-testid="the-hai-muc">{NHAN_MUC_HAI[nd.m]}</p>
          <ul className="mt-6 space-y-3 text-left">
            {nd.c.map(([k, pt]) => (
              <li key={k}>
                <div className="flex justify-between text-sm"><span className="text-fg-muted">{TEN_TIEU_CHI_HAI[k]}</span><span className="tabular-nums">{pt}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(pt, 3)}%`, backgroundColor: mau }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-fg-faint">Điểm tham khảo theo sách cổ và luật dân gian — mối quan hệ do hai người cư xử, vun đắp.</p>
        </div>
      </div>
      <p className="mt-8 font-serif text-2xl">Còn bạn với người ấy thì sao?</p>
      <Button asChild size="lg" className="mt-4">
        <Link href={`/tu-vi?tu=${tu}#hop-tham`} data-testid="the-hai-moi">Xem điểm của bạn với người ấy <ArrowRight aria-hidden /></Link>
      </Button>
      <QuaNguoiNhan className="mt-3" />
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Ngày sinh người ấy chỉ dùng để tính, không lưu lại.
      </p>
    </div>
  );
}
