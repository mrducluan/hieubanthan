// NAM-1 — /lich-am trước đây 404 (chỉ có /lich-am/{năm}): mục lục các năm (năm âm hiện tại −2 … +3, cùng cửa sổ sitemap
// SEO-L5) + lối sang công cụ đổi lịch. Năm lấy từ engine (tự trượt sau Tết).
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang } from "@/lib/seo";
import { namAmHienTai } from "@/lib/tuoi-dan-gian";
import { duongLichAm } from "@/lib/lich-am";
import { duongNam } from "@/lib/nam";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

const DUONG = "/lich-am";
const MAC = { tieuDe: "Lịch âm các năm: Tết, tháng nhuận, mùng 1 và rằm",
  moTa: "Lịch âm Việt Nam từng năm: ngày Tết, năm có tháng nhuận không, mùng 1 và rằm từng tháng ứng với dương lịch, tháng đủ hay thiếu. Kèm công cụ đổi ngày âm dương." };

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ ...MAC, duong: DUONG }), await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const [namAm, nd] = await Promise.all([namAmHienTai(), layNoiDungTrang(DUONG)]);
  const ds = Array.from({ length: 6 }, (_, i) => namAm - 2 + i);
  const h1 = nd.dau.h1 ?? "Lịch âm các năm";
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: h1, tomTat: MAC.moTa, about: ["Âm lịch Việt Nam"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Lịch âm", duong: DUONG }]),
      )} />
      <TieuDeMuc cap={1} nho="Âm lịch Việt Nam" lon={h1}
        mo_ta={nd.dau.loiDan ?? "Tính theo giờ Hà Nội (thuật toán Hồ Ngọc Đức). Chọn một năm để xem Tết, tháng nhuận, mùng 1 và rằm từng tháng."} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mb-6" />
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ds.map((n) => (
          <li key={n}><Link href={duongLichAm(n)} className="block rounded-xl border border-line/70 p-4 text-center hover:border-gold/50">
            <span className="font-serif text-xl text-fg">Lịch âm {n}</span>
            {n === namAm && <span className="mt-0.5 block text-xs text-gold">Năm âm lịch đang đi</span>}
          </Link></li>
        ))}
      </ul>
      <section className="mt-8" aria-labelledby="cach-tinh">
        <h2 id="cach-tinh" className="text-2xl">Âm lịch Việt Nam tính thế nào</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">Mùng 1 là ngày có điểm sóc (Mặt Trăng nằm giữa Trái Đất và Mặt Trời) tính theo giờ Hà Nội; tháng nào không chứa trung khí đầu tiên trong năm là tháng nhuận, nên năm nhuận có 13 tháng. Lịch Trung Quốc tính theo giờ Bắc Kinh (UTC+8), vì vậy có năm Tết hai nước lệch nhau một ngày, hiếm hơn là lệch cả tháng.</p>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">Mỗi trang năm ghi ngày Tết, tháng nhuận, mùng 1 và rằm từng tháng ứng với dương lịch, tháng đủ (30 ngày) hay thiếu (29 ngày) — bấm ngày mùng 1 để xem ngày tốt của cả tháng đó.</p>
      </section>
      <p className="mt-6 text-sm text-fg-muted">Đổi một ngày cụ thể: <Link href="/doi-lich-am-duong" className="text-gold underline">công cụ đổi lịch âm dương</Link>. Năm con gì, Tết, Tam tai: <Link href={duongNam(namAm + 1)} className="text-gold underline">năm {namAm + 1}</Link>.</p>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-8" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-10" />
    </div>
  );
}
