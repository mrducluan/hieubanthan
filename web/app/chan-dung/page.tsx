// CD-1 — "Chân dung tổng hợp": ba cách nhìn (Tử vi · Bát tự · Nhân tướng) cùng một con người, theo mảng đời (engine
// `/v1/chan-dung` chỉ đọc mức ba báo cáo đã chấm). Trang công cụ: H1 + giới thiệu + hỏi đáp dựng sẵn trên máy chủ (SEO),
// phần riêng dựng ở trình duyệt từ hồ sơ + câu trả lời khảo sát trên máy.
import type { Metadata } from "next";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { apDungSeo, kemHreflang, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { CHU_CHAN_DUNG } from "@/lib/chu/cong-cu";
import { ND_CHAN_DUNG } from "./noi-dung";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { metaCongCuEn } from "@/lib/en/seo";
import { ChanDung } from "./ChanDung";

export async function generateMetadata(): Promise<Metadata> {
  // EN-ALL GĐ 8: /en/portrait là rewrite của trang này — metadata bản Anh từ lib/so-trang-en.ts.
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaCongCuEn(ND_CHAN_DUNG.duong);
  return apDungSeo(kemHreflang(metaTrang({ tieuDe: "Chân dung tổng hợp: Tử vi, Bát tự, nhân tướng", moTa: ND_CHAN_DUNG.moTa,
    duong: ND_CHAN_DUNG.duong }), ND_CHAN_DUNG.duong), await layNoiDungTrang(ND_CHAN_DUNG.duong));
}

export default async function Page() {
  // EN-ALL GĐ 8: chữ đầu trang theo ngôn ngữ (bản Việt giữ đúng chữ cũ).
  const en = (await ngonNguMayChu()).ngonNgu === "en";
  return (
    <TrangCongCu duong={ND_CHAN_DUNG.duong}>
      <div className="mx-auto max-w-5xl">
        {en ? <TieuDeTrang nho={CHU_CHAN_DUNG["dau.nhan_tren"]!.en!} lon="Your combined portrait"
          mo_ta="Your Zi Wei Dou Shu chart, your BaZi chart and what you see in your own face, side by side for each area of life: where all three agree, where they see different sides, and why. No scores, no ranking." />
          : <TieuDeTrang nho={CHU_CHAN_DUNG["dau.nhan_tren"]!.mac_dinh} lon="Chân dung tổng hợp của bạn"
          mo_ta="Lá số Tử vi, lá số Bát tự và điều bạn tự thấy trên gương mặt — đặt cạnh nhau theo từng mảng đời. Mảng nào ba cách cùng thấy, mảng nào nhìn khác nhau và vì sao. Không cộng điểm, không xếp hạng." />}
        <ChanDung />
      </div>
    </TrangCongCu>
  );
}
