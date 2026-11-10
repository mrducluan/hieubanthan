// CD-1 — "Chân dung tổng hợp": ba cách nhìn (Tử vi · Bát tự · Nhân tướng) cùng một con người, theo mảng đời (engine
// `/v1/chan-dung` chỉ đọc mức ba báo cáo đã chấm). Trang công cụ: H1 + giới thiệu + hỏi đáp dựng sẵn trên máy chủ (SEO),
// phần riêng dựng ở trình duyệt từ hồ sơ + câu trả lời khảo sát trên máy.
import type { Metadata } from "next";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { CHU_CHAN_DUNG } from "@/lib/chu/cong-cu";
import { ND_CHAN_DUNG } from "./noi-dung";
import { ChanDung } from "./ChanDung";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: "Chân dung tổng hợp: Tử vi, Bát tự, nhân tướng", moTa: ND_CHAN_DUNG.moTa,
    duong: ND_CHAN_DUNG.duong }), await layNoiDungTrang(ND_CHAN_DUNG.duong));
}

export default function Page() {
  return (
    <TrangCongCu duong={ND_CHAN_DUNG.duong}>
      <div className="mx-auto max-w-5xl">
        <TieuDeTrang nho={CHU_CHAN_DUNG["dau.nhan_tren"]!.mac_dinh} lon="Chân dung tổng hợp của bạn"
          mo_ta="Lá số Tử vi, lá số Bát tự và điều bạn tự thấy trên gương mặt — đặt cạnh nhau theo từng mảng đời. Mảng nào ba cách cùng thấy, mảng nào nhìn khác nhau và vì sao. Không cộng điểm, không xếp hạng." />
        <ChanDung />
      </div>
    </TrangCongCu>
  );
}
