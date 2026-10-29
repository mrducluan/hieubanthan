// MT-ĐS B3 — "Xem sao hạn theo tuổi": công cụ (năm sinh + giới tính từ hồ sơ trên máy) + link bảng theo năm. Tập quán,
// miễn phí, không nghi lễ, không vật phẩm; lời ở KB sao_han_kb.json (engine), web chỉ hiển thị.
import type { Metadata } from "next";
import Link from "next/link";
import { TieuDeTrang } from "@/components/cms/DauCms";
import { TrangCongCu } from "@/components/cms/TrangCongCu";
import { CongCuTuoi } from "@/components/tuoi/CongCuTuoi";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { metaTrang } from "@/lib/seo";
import { duongSaoHanNam, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { ND_SAO_HAN } from "../xem-tuoi-lam-nha/noi-dung";
import { CHU_SAO_HAN } from "@/lib/chu/cong-cu";
import { taoChu } from "@/lib/chu-trang";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: "Xem sao hạn năm nay theo tuổi: La Hầu, Kế Đô, Thái Bạch…", moTa: ND_SAO_HAN.moTa, duong: ND_SAO_HAN.duong }), await layNoiDungTrang(ND_SAO_HAN.duong));
}

export default async function Page() {
  const [nam, nd] = await Promise.all([namAmHienTai(), layNoiDungTrang(ND_SAO_HAN.duong)]);
  const c = taoChu(CHU_SAO_HAN, nd.chu);
  return (
    <TrangCongCu duong={ND_SAO_HAN.duong}>
      <div className="mx-auto max-w-3xl">
        <TieuDeTrang nho={CHU_SAO_HAN["dau.nhan_tren"]!.mac_dinh} lon="Xem sao hạn theo tuổi"
          mo_ta="Năm nay bạn gặp sao nào theo tục xếp theo tuổi — đọc bằng lời đời thường và việc nhỏ nên làm. Không cúng sao, không vật phẩm." />
        <CongCuTuoi kieu="sao_han" namMacDinh={nam} />
        <section aria-labelledby="theo-nam" className="mt-8">
          <h2 id="theo-nam" className="text-xl">{c("theo_nam.tieu_de")}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {[nam, nam + 1].map((n) => (
              <li key={n}>{c("theo_nam.dong", { nam: String(n) })}{" "}
                <Link href={duongSaoHanNam(n)} className="text-gold underline">bảng sao hạn năm {n} cho mọi tuổi, nam và nữ</Link></li>
            ))}
          </ul>
        </section>
      </div>
    </TrangCongCu>
  );
}
