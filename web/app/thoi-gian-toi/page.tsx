// NAM-2 (hướng B, chủ dự án duyệt 2026-10-30) — "Thời gian tới của bạn": 3 tháng tới · 12 tháng tới · năm âm đang đi /
// năm tới, ghép thần số + Tử vi + Bát tự + tập quán theo tuổi (engine `/v1/thoi-gian-toi`). Trang công cụ: H1 + giới
// thiệu + hỏi đáp dựng sẵn trên máy chủ (SEO), phần riêng dựng ở trình duyệt từ hồ sơ trên máy.
import type { Metadata } from "next";
import Link from "next/link";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { duongNam, namThoiGianToi } from "@/lib/nam";
import { CHU_THOI_GIAN_TOI } from "@/lib/chu/cong-cu";
import { ND_THOI_GIAN_TOI } from "./noi-dung";
import { ThoiGianToi } from "./ThoiGianToi";

type P = { searchParams: Promise<{ nam?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: "3 tháng tới, 12 tháng tới và năm tới của bạn", moTa: ND_THOI_GIAN_TOI.moTa,
    duong: ND_THOI_GIAN_TOI.duong }), await layNoiDungTrang(ND_THOI_GIAN_TOI.duong));
}

export default async function Page(p: P) {
  const [{ nam }, n] = await Promise.all([p.searchParams, namThoiGianToi()]);
  const hoi = /^\d{4}$/.test(nam ?? "") ? Number(nam) : null;
  const banDau = hoi && n.cac_nam.includes(hoi) ? hoi : n.mac_dinh;
  return (
    <TrangCongCu duong={ND_THOI_GIAN_TOI.duong}>
      <div className="mx-auto max-w-3xl">
        <TieuDeTrang nho={CHU_THOI_GIAN_TOI["dau.nhan_tren"]!.mac_dinh} lon="Thời gian tới của bạn"
          mo_ta="3 tháng tới, 12 tháng tới và cả năm — đọc từ ngày sinh của chính bạn theo thần số, Tử vi, Bát tự và tập quán theo tuổi. Lời đời thường, nói rõ tháng nào nên đẩy mạnh, tháng nào nên đi chậm." />
        <ThoiGianToi cacNam={n.cac_nam} namBanDau={banDau} />
        <p className="mt-8 text-sm text-fg-muted">Thông tin chung của từng năm (Tết, Tam tai, tuổi làm nhà, xông đất):{" "}
          {n.cac_nam.map((x, i) => <span key={x}>{i > 0 && " · "}<Link href={duongNam(x)} className="text-gold underline">năm {x}</Link></span>)}.</p>
      </div>
    </TrangCongCu>
  );
}
