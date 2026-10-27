// SAO-HH — trang nhận thẻ huy hiệu: dấu mốc (danh mục công khai) + một lối thử ngay đúng với huy hiệu đó, mang ?tu=hh.<…>
// để đo share_clicked → referral_signup như các thẻ khác (GhiVaoTrang đọc ?tu trên URL). Không tên, không ngày đạt → không
// cần ký mã. Không index.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Award, Lock } from "lucide-react";
import { CAU_BAN_CHAT, DANH_MUC, maTuDuongHuyHieu, THE_HUY_HIEU } from "@/lib/huy-hieu";
import { MAU_TU } from "@/lib/the-chia-se";
import { QuaNguoiNhan } from "@/components/sao/QuaNguoiNhan";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";

interface Props { params: Promise<{ ma: string }>; searchParams: Promise<{ tu?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const ma = maTuDuongHuyHieu((await params).ma);
  if (!ma) return { title: "Huy hiệu", robots: { index: false } };
  const tu = (await searchParams).tu;
  const title = `Huy hiệu “${DANH_MUC[ma].ten}”`;
  const anh = [`/og/huy-hieu?ma=${ma}${tu && MAU_TU.test(tu) ? `&tu=${tu}` : ""}`];
  return {
    title,
    description: `${THE_HUY_HIEU[ma].cau} ${THE_HUY_HIEU[ma].moi}`,
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const ma = maTuDuongHuyHieu((await params).ma);
  if (!ma) notFound();
  const tuTho = (await searchParams).tu;
  const tu = tuTho && MAU_TU.test(tuTho) ? tuTho : null;
  const the = THE_HUY_HIEU[ma];
  const den = `${the.den}${tu ? `?tu=${tu}` : ""}`;
  return (
    <div className="mx-auto max-w-md py-6 text-center" data-testid="the-huy-hieu" data-ma={ma}>
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--jade) / 0.45) 55%, rgb(var(--moon) / 0.35))" }}>
        <div className="rounded-2xl bg-surface px-6 py-8">
          <Logo className="mx-auto size-8" />
          <p className="eyebrow mt-4">Một dấu mốc mới</p>
          <span className="mx-auto mt-4 grid size-16 place-items-center rounded-full bg-gold/20 text-gold" aria-hidden>
            <Award className="size-8" />
          </span>
          <h1 className="mt-4 font-serif text-3xl">{DANH_MUC[ma].ten}</h1>
          <p className="mt-3 text-fg-muted">{the.cau}</p>
        </div>
      </div>
      <p className="mt-8 font-serif text-2xl">{the.moi}</p>
      <Button asChild size="lg" className="mt-4">
        <Link href={den} data-testid="the-huy-hieu-moi">{the.nut} <ArrowRight aria-hidden /></Link>
      </Button>
      <QuaNguoiNhan className="mt-3" />
      <p className="mt-6 inline-flex items-start gap-1.5 text-left text-xs text-fg-faint">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {CAU_BAN_CHAT} Thẻ không mang tên hay ngày sinh của người gửi.
      </p>
    </div>
  );
}
