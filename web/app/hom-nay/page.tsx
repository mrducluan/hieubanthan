// HN-1 — "Hôm nay của bạn" (khâu QUAY LẠI, docs/MUC-TIEU-TANG-TRUONG.md): mỗi ngày một thẻ từ hồ sơ trên máy.
// Chữ trang (SEO, đầu trang, giới thiệu + hỏi đáp, khối) sửa được ở CMS "Trang website"; mặc định: lib/so-trang.ts.
import type { Metadata } from "next";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { apDungSeo, layNoiDungTrang, metaMacDinh } from "@/lib/noi-dung-trang";
import { HomNay } from "./HomNay";
import { docMaNgay } from "@/lib/ma-moi";
import { MAU_TU } from "@/lib/the-chia-se";

const DUONG = "/hom-nay";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** NHIP-1: link chia sẻ mang ?the=<mã ký> → ảnh xem trước "Hôm nay {tên} là Ngày cá nhân N". Canonical vẫn /hom-nay. */
async function theNgay(sp: Props["searchParams"]) {
  const v = (await sp).the;
  return typeof v === "string" ? docMaNgay(v) : null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const META = apDungSeo(metaMacDinh(DUONG), await layNoiDungTrang(DUONG));
  const nd = await theNgay(searchParams);
  const ma = nd ? ((await searchParams).the as string) : null;
  if (!nd || !ma) return META;
  const tieuDe = `Hôm nay ${nd.t} là Ngày cá nhân ${nd.n} — còn bạn?`;
  // TCS-1: mã QR trên ảnh mang đúng ?tu= của link (gán nguồn người quét ảnh).
  const tu = (await searchParams).tu;
  const anh = [`/og/ngay?ma=${encodeURIComponent(ma)}${typeof tu === "string" && MAU_TU.test(tu) ? `&tu=${tu}` : ""}`];
  return {
    ...META,
    openGraph: { ...META.openGraph, title: tieuDe, images: anh },
    twitter: { ...META.twitter, card: "summary_large_image", title: tieuDe, images: anh },
  };
}

export default async function Page({ searchParams }: Props) {
  const nd = await theNgay(searchParams);
  return (
    <TrangCongCu duong={DUONG} mang="than_so" truoc={nd && (
      <p className="mx-auto mb-6 max-w-xl rounded-2xl border border-gold/30 bg-gold/[0.06] px-4 py-3 text-center text-sm" data-testid="loi-moi-ngay">
        Hôm nay <b className="text-gold">{nd.t}</b> là Ngày cá nhân <b className="text-gold">{nd.n}</b>{nd.k ? ` — ${nd.k.toLowerCase()}` : ""}. Còn bạn?
      </p>
    )}>
      <HomNay />
    </TrangCongCu>
  );
}
