// UI-PT2 P7 — trang nhận thẻ "Nhà của bạn": sơ đồ 3×3 tô màu từ mã đã ký (không địa chỉ, không năm sinh) + lời mời
// "Đọc nhà của bạn" về /phong-thuy, mang ?tu=nh.<…> để hồ sơ đầu tiên tính referral_signup. Không index.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { docMaNha, tuTuMa } from "@/lib/ma-moi";
import { MAU_MUC_THE, NHAN_MUC_THE, TEN_LOAI_NHA_THE, TEN_PHONG_THE, tenNhaThe } from "@/lib/the-chia-se";
import { QuaNguoiNhan } from "@/components/sao/QuaNguoiNhan";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { GhiTu } from "@/components/khung/GhiMoThe";
import { SoDoNha } from "@/components/huyen-hoc/SoDoNha";

interface Props { params: Promise<{ ma: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const nd = docMaNha(ma);
  if (!nd) return { title: "Thẻ nhà của bạn", robots: { index: false } };
  const title = `${tenNhaThe(nd.t)} — ${TEN_LOAI_NHA_THE[nd.l ?? "khac"]} hướng ${nd.h}${nd.m ? ` · ${NHAN_MUC_THE[nd.m]}` : ""}`;
  const anh = [`/og/nha?ma=${encodeURIComponent(ma)}`];
  return {
    title,
    description: "Sơ đồ nhà đọc theo Bát trạch: phòng nào đang hợp, phòng nào nên để ý. Đọc nhà của bạn trong 2 phút — không cần tài khoản.",
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const nd = docMaNha(ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn có thể tự đọc nhà của mình.</p>
        <Button asChild className="mt-6"><Link href="/phong-thuy#nha-cua-ban">Đọc nhà của tôi</Link></Button>
      </div>
    );
  }
  const tu = tuTuMa("nh", ma);
  const mau = nd.m ? MAU_MUC_THE[nd.m] : undefined;
  return (
    <div className="mx-auto max-w-md py-6 text-center" data-testid="the-nha">
      <GhiTu tu={tu} />
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--jade) / 0.45) 55%, rgb(var(--moon) / 0.35))" }}>
        <div className="rounded-2xl bg-surface px-6 py-8">
          <Logo className="mx-auto size-8" />
          <p className="eyebrow mt-4">{TEN_LOAI_NHA_THE[nd.l ?? "khac"]} hướng {nd.h}</p>
          <h1 className="mt-2 font-serif text-3xl">{tenNhaThe(nd.t)}</h1>
          {nd.m && <p className="mt-2 font-serif text-xl" style={{ color: mau }} data-testid="the-nha-muc">Với người ở: {NHAN_MUC_THE[nd.m]}</p>}
          <div className="mx-auto mt-5 flex justify-center">
            <SoDoNha tieuDe="Sơ đồ nhà" huongNha={nd.h} phong={nd.p.map(([ph, c, m]) => ({ cung: c, ten: TEN_PHONG_THE[ph] ?? ph, muc: m }))} />
          </div>
          {nd.p.length === 0 && <p className="mt-3 text-sm text-fg-muted">Thẻ này chưa có phòng — người gửi mới đọc theo hướng nhà.</p>}
          <p className="mt-5 text-xs text-fg-faint">Bát trạch đọc theo hướng và vị trí phòng — chỗ hợp giữ nguyên, chỗ cần để ý đổi cách dùng trước, không cần mua gì.</p>
        </div>
      </div>
      <p className="mt-8 font-serif text-2xl">Còn nhà bạn thì sao?</p>
      <Button asChild size="lg" className="mt-4">
        <Link href={`/phong-thuy?tu=${tu}#nha-cua-ban`} data-testid="the-nha-moi">Đọc nhà của bạn <ArrowRight aria-hidden /></Link>
      </Button>
      <QuaNguoiNhan className="mt-3" />
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Thẻ không có địa chỉ, toạ độ hay ngày sinh của người gửi.
      </p>
    </div>
  );
}
