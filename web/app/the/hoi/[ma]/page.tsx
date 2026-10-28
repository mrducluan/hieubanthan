// HD-CS đợt 3 (ý 2) — trang nhận thẻ "một câu trả lời": câu hỏi chuẩn + hình vẽ lại từ mã đã ký (chính component TrucQuan
// của khung hỏi đáp) + lời mời "Hỏi câu này về chính bạn" → trang công cụ của mảng với ?cau= (khung hỏi đáp chỉ điền sẵn khi
// câu nằm trong danh mục engine) và ?tu=hq.<…> để đo referral_signup như các thẻ khác. Không index.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { docMaHoi, tuTuMa } from "@/lib/ma-moi";
import { DUONG_MANG, TEN_MANG, tieuDeThe, veKhoi } from "@/lib/the-hoi";
import { QuaNguoiNhan } from "@/components/sao/QuaNguoiNhan";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { GhiTu } from "@/components/khung/GhiMoThe";
import { TrucQuan } from "@/components/hoi/TrucQuan";

interface Props { params: Promise<{ ma: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const nd = docMaHoi(ma);
  if (!nd) return { title: "Thẻ hỏi đáp", robots: { index: false } };
  const title = `“${nd.c}” — ${TEN_MANG[nd.m]}`;
  const anh = [`/og/hoi?ma=${encodeURIComponent(ma)}`];
  return {
    title,
    description: `${tieuDeThe(nd.g)}. Hỏi câu này về chính bạn trong 1 phút — miễn phí, không cần tài khoản.`,
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const nd = docMaHoi(ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn có thể hỏi về chính mình.</p>
        <Button asChild className="mt-6"><Link href="/huyen-hoc">Chọn một môn để hỏi</Link></Button>
      </div>
    );
  }
  const tu = tuTuMa("hq", ma);
  const dich = `${DUONG_MANG[nd.m]}?cau=${encodeURIComponent(nd.c)}&tu=${tu}`;
  return (
    <div className="mx-auto max-w-md py-6" data-testid="the-hoi">
      <GhiTu tu={tu} />
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--jade) / 0.45) 55%, rgb(var(--moon) / 0.35))" }}>
        <div className="rounded-2xl bg-surface px-5 py-7">
          <Logo className="mx-auto size-8" />
          <p className="eyebrow mt-4 text-center">{TEN_MANG[nd.m]} · Hỏi đáp chuyên sâu</p>
          <h1 className="mt-2 text-center font-serif text-2xl leading-snug [text-wrap:balance]" data-testid="the-hoi-cau">“{nd.c}”</h1>
          <div className="mt-5"><TrucQuan ds={[veKhoi(nd.g)]} tinh /></div>
          <p className="mt-4 text-center text-xs text-fg-faint">Hình của câu trả lời người gửi nhận được. Lời trả lời đầy đủ là của riêng họ.</p>
        </div>
      </div>
      <p className="mt-8 text-center font-serif text-2xl">Câu này nói gì về bạn?</p>
      <div className="mt-4 text-center">
        <Button asChild size="lg">
          <Link href={dich} data-testid="the-hoi-moi">Hỏi câu này về chính bạn <ArrowRight aria-hidden /></Link>
        </Button>
      </div>
      <QuaNguoiNhan className="mt-3 text-center" />
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Thẻ không mang ngày sinh hay lời trả lời của người gửi.
      </p>
    </div>
  );
}
