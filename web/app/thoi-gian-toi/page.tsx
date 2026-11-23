// NAM-2 (hướng B, chủ dự án duyệt 2026-10-30) — "Thời gian tới của bạn": 3 tháng tới · 12 tháng tới · năm âm đang đi /
// năm tới, ghép thần số + Tử vi + Bát tự + tập quán theo tuổi (engine `/v1/thoi-gian-toi`). Trang công cụ: H1 + giới
// thiệu + hỏi đáp dựng sẵn trên máy chủ (SEO), phần riêng dựng ở trình duyệt từ hồ sơ trên máy.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { apDungSeo, kemHreflang, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { duongNam, namThoiGianToi } from "@/lib/nam";
import { CHU_THOI_GIAN_TOI } from "@/lib/chu/cong-cu";
import { ND_THOI_GIAN_TOI } from "./noi-dung";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { metaCongCuEn } from "@/lib/en/seo";
import { NutXuongForm } from "@/components/huyen-hoc/NutXuongForm";
import { ThoiGianToi } from "./ThoiGianToi";

type P = { searchParams: Promise<{ nam?: string; kw?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  // EN-ALL GĐ 8: /en/year-ahead là rewrite của trang này — metadata bản Anh từ lib/so-trang-en.ts.
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaCongCuEn(ND_THOI_GIAN_TOI.duong);
  return apDungSeo(kemHreflang(metaTrang({ tieuDe: "3 tháng tới, 12 tháng tới và năm tới của bạn", moTa: ND_THOI_GIAN_TOI.moTa,
    duong: ND_THOI_GIAN_TOI.duong }), ND_THOI_GIAN_TOI.duong), await layNoiDungTrang(ND_THOI_GIAN_TOI.duong));
}

export default async function Page(p: P) {
  const [{ nam, kw }, n, { ngonNgu }] = await Promise.all([p.searchParams, namThoiGianToi(), ngonNguMayChu()]);
  const en = ngonNgu === "en";
  const hoi = /^\d{4}$/.test(nam ?? "") ? Number(nam) : null;
  const banDau = hoi && n.cac_nam.includes(hoi) ? hoi : n.mac_dinh;
  return (
    <TrangCongCu duong={ND_THOI_GIAN_TOI.duong} kw={en ? undefined : kw}
      gia={en ? undefined : { moDun: "thoi_gian", mienPhi: "3 tháng tới và tóm tắt năm" }}>
      <div className="mx-auto max-w-5xl">
        {en ? <TieuDeTrang nho={CHU_THOI_GIAN_TOI["dau.nhan_tren"]!.en!} lon="Your year ahead"
          mo_ta="The next 3 months, the next 12 months and the whole year — read from your own birth date through numerology, Zi Wei Dou Shu, BaZi and the customs tied to your age. Plain words on which months to push ahead and which to take slowly." />
          : <TieuDeTrang nho={CHU_THOI_GIAN_TOI["dau.nhan_tren"]!.mac_dinh} lon="Thời gian tới của bạn"
          mo_ta="3 tháng tới, 12 tháng tới và cả năm — đọc từ ngày sinh của chính bạn theo thần số, Tử vi, Bát tự và tập quán theo tuổi. Lời đời thường, nói rõ tháng nào nên đẩy mạnh, tháng nào nên đi chậm." />}
        {/* CRO-2: điện thoại chưa có hồ sơ — một nút đưa xuống ô nhập (tự ẩn khi đã có hồ sơ). */}
        {!en && <div className="-mt-5 mb-5"><NutXuongForm moDun="thoi_gian" nhan="Nhập ngày sinh · xem ngay" chon={'[data-testid="tgt-nhap"]'} /></div>}
        <ThoiGianToi cacNam={n.cac_nam} namBanDau={banDau} />
        {/* EN-ALL GĐ 8: trang năm (/nam) chưa mở bản Anh → bản Anh không có dòng link này. */}
        {!en && <p className="mt-8 text-sm text-fg-muted">Thông tin chung của từng năm (Tết, Tam tai, tuổi làm nhà, xông đất):{" "}
          {n.cac_nam.map((x, i) => <span key={x}>{i > 0 && " · "}<Link href={duongNam(x)} className="text-gold underline">năm {x}</Link></span>)}.</p>}
      </div>
    </TrangCongCu>
  );
}
