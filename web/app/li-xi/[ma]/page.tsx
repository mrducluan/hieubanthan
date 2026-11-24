// LX-2027 — Trang nhận & mở Bao Lì Xì Tết Đinh Mùi 2027 (/li-xi/[ma]).
// noindex + chặn trong robots.ts; không nằm trong allowlist Q-I3; OG card /og/li-xi hoàn toàn Zero-PII.
import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";
import { docLiXi } from "@/lib/li-xi-may-chu";
import { MA_LI_XI_RE } from "@/lib/li-xi-tet";
import { MoLiXi } from "./MoLiXi";

interface Props { params: Promise<{ ma: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const d = MA_LI_XI_RE.test(ma) ? await docLiXi(ma) : { co: false };
  const tieuDe = d.co && d.ten_nguoi_tang
    ? `${d.ten_nguoi_tang} gửi bạn Bao Lì Xì Tết Đinh Mùi 2027`
    : "Bạn nhận được một Bao Lì Xì Báo Cáo Tết 2027";
  const moTa = d.co && d.loi_chuc
    ? `“${d.loi_chuc}” — Mở bao lì xì để đọc trọn Báo cáo Năm Đinh Mùi 2027 của riêng bạn.`
    : "Mở bao lì xì để đọc trọn Báo cáo Năm Đinh Mùi 2027 trên Hiểu Bản Thân.";
  const qs = new URLSearchParams({ mau: d.mau_thiep ?? "do_son" });
  if (d.ten_nguoi_tang) qs.set("ten", d.ten_nguoi_tang);
  if (d.loi_chuc) qs.set("chuc", d.loi_chuc);
  const og = `${siteUrl()}/og/li-xi?${qs.toString()}`;
  return {
    title: tieuDe,
    description: moTa,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      title: tieuDe,
      description: moTa,
      images: [{ url: og, width: 1200, height: 630, alt: tieuDe }],
    },
  };
}

export default async function NhanLiXiPage({ params }: Props) {
  const { ma } = await params;
  const hopLe = MA_LI_XI_RE.test(ma);
  const banDau = hopLe ? await docLiXi(ma) : { co: false };
  return <MoLiXi ma={hopLe ? ma : ""} banDau={banDau} />;
}
