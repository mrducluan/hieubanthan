// CHANG-4 — trang nhận thẻ "Bản đồ sao của tôi": ba cung (Mặt Trời / Mặt Trăng / Mọc) từ mã đã ký (không ngày giờ, nơi sinh)
// + lời mời "Xem bản đồ sao của bạn" về /chiem-tinh, mang ?tu=st.<…> để đo referral_signup như các thẻ khác. Không index.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { ArrowRight, Lock } from "lucide-react";
import { docMaSao, tuTuMa } from "@/lib/ma-moi";
import { QuaNguoiNhan } from "@/components/sao/QuaNguoiNhan";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/khung/Logo";
import { GhiTu } from "@/components/khung/GhiMoThe";
import { MOI_SAO, tenTheSao } from "@/lib/the-sao";

interface Props { params: Promise<{ ma: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const nd = docMaSao(ma);
  if (!nd) return { title: "Thẻ bản đồ sao", robots: { index: false } };
  const title = `${tenTheSao(nd.t)} — Mặt Trời ${nd.s[1]}${nd.m ? `, Mặt Trăng ${nd.m[1]}` : ""}`;
  const anh = [`/og/sao?ma=${encodeURIComponent(ma)}`];
  return {
    title,
    description: "Ba điểm chính của một bản đồ sao: Mặt Trời, Mặt Trăng, cung Mọc. Xem bản đồ sao của bạn trong 1 phút, không cần tài khoản.",
    openGraph: { title, images: anh },
    twitter: { card: "summary_large_image", title, images: anh },
    robots: { index: false },
  };
}

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const nd = docMaSao(ma);
  if (!nd) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-3xl">Thẻ không còn hiệu lực</h1>
        <p className="mt-3 text-fg-muted">Link có thể đã hết hạn (90 ngày) hoặc bị chép thiếu. Bạn vẫn có thể xem bản đồ sao của riêng mình.</p>
        <Button asChild className="mt-6"><Link href="/chiem-tinh">Xem bản đồ sao của tôi</Link></Button>
      </div>
    );
  }
  const tu = tuTuMa("st", ma);
  const dong: [string, string, string | null, string][] = [
    ["Mặt Trời", "bg-gold", nd.s[1], "cách bạn muốn sống"],
    ["Mặt Trăng", "bg-moon", nd.m?.[1] ?? null, "điều làm bạn thấy yên"],
    ["Cung Mọc", "bg-jade", nd.a?.[1] ?? null, "ấn tượng đầu tiên với người khác"],
  ];
  return (
    <div className="mx-auto max-w-md py-6 text-center" data-testid="the-sao">
      <GhiTu tu={tu} />
      <div className="rounded-2xl p-[1px]" style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--jade) / 0.45) 55%, rgb(var(--moon) / 0.35))" }}>
        <div className="rounded-2xl bg-surface px-6 py-8">
          <Logo className="mx-auto h-8 w-auto" />
          <p className="eyebrow mt-4">Chiêm tinh · bản đồ sao</p>
          <h1 className="mt-2 font-serif text-3xl">{tenTheSao(nd.t)}</h1>
          <ul className="mx-auto mt-5 max-w-xs space-y-2.5 text-left">
            {dong.map(([nhan, mau, ten, y]) => (
              <li key={nhan} className="flex items-center gap-3">
                <span aria-hidden className={`size-3 shrink-0 rounded-full ${mau}`} />
                <span className="min-w-0 flex-1">
                  <span className="text-sm text-fg-muted">{nhan}</span>{" "}
                  <span className="font-serif text-lg text-fg" data-testid={`the-sao-${nhan === "Mặt Trời" ? "mt" : nhan === "Mặt Trăng" ? "mtr" : "moc"}`}>{ten ?? "—"}</span>
                  <span className="block text-xs text-fg-faint">{ten ? y : nhan === "Cung Mọc" ? "cần giờ sinh" : "chưa chắc khi chưa có giờ sinh"}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-fg-faint">Bản đồ sao là một cách tự soi theo chiêm tinh phương Tây, không phải lời đoán số phận.</p>
        </div>
      </div>
      <p className="mt-8 font-serif text-2xl">{MOI_SAO[nd.b]}</p>
      <Button asChild size="lg" className="mt-4">
        <Link href={`/chiem-tinh?tu=${tu}`} data-testid="the-sao-moi">Xem bản đồ sao của bạn <ArrowRight aria-hidden /></Link>
      </Button>
      <QuaNguoiNhan className="mt-3" />
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-fg-faint">
        <Lock className="size-3.5" aria-hidden /> Thẻ không mang ngày giờ sinh hay nơi sinh của người gửi.
      </p>
    </div>
  );
}
