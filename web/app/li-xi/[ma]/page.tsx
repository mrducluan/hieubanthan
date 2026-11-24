// LX-2027 — Trang nhận & mở Bao Lì Xì Tết Đinh Mùi 2027 (/li-xi/[ma]).
// noindex + chặn trong robots.ts; không nằm trong allowlist Q-I3; OG card /og/li-xi hoàn toàn Zero-PII.
import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";
import { docLiXi } from "@/lib/li-xi-may-chu";
import { hoaTietTheoMa, laLoiChucMau, MA_LI_XI_RE } from "@/lib/li-xi-tet";
import { MoLiXi } from "./MoLiXi";

interface Props {
  params: Promise<{ ma: string }>;
  searchParams: Promise<{ hoa?: string; gam?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { ma } = await params;
  const sp = await searchParams;
  const d = MA_LI_XI_RE.test(ma) ? await docLiXi(ma) : { co: false };
  const tieuDe = d.co && d.ten_nguoi_tang
    ? `${d.ten_nguoi_tang} gửi bạn lì xì Tết 2027`
    : "Bạn nhận được một bao lì xì Tết 2027";
  // Mô tả link (Zalo / Messenger hiện cho người chưa mở) chỉ dùng lời chúc MẪU; lời tự viết hiện trong trang.
  const moTa = d.co && laLoiChucMau(d.loi_chuc)
    ? `“${d.loi_chuc}” — Mở bao để đọc báo cáo năm 2027 của riêng bạn.`
    : "Mở bao lì xì để đọc báo cáo năm 2027 của riêng bạn trên Hiểu Bản Thân.";
  const qs = new URLSearchParams();
  if (d.co && MA_LI_XI_RE.test(ma)) qs.set("ma", ma);
  else qs.set("mau", "do_son");
  if (sp.hoa) qs.set("hoa", hoaTietTheoMa(sp.hoa, d.mau_thiep));
  if (sp.gam === "0") qs.set("gam", "0");
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

export default async function NhanLiXiPage({ params, searchParams }: Props) {
  const { ma } = await params;
  const sp = await searchParams;
  const hopLe = MA_LI_XI_RE.test(ma);
  const banDau = hopLe ? await docLiXi(ma) : { co: false };
  const hoaUrl = sp.hoa ? hoaTietTheoMa(sp.hoa, banDau.mau_thiep) : undefined;
  const nenGamUrl = sp.gam === "0" ? false : true;
  return <MoLiXi ma={hopLe ? ma : ""} banDau={banDau} hoaTiet={hoaUrl} nenGam={nenGamUrl} />;
}
