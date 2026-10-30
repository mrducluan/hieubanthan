// NAM-1 — mục lục "Xem theo năm": năm âm lịch đang đi + năm tới (trang trụ /nam/{năm}) và lối sang "Thời gian tới của
// bạn". Năm lấy từ engine (namAmHienTai) → tự trượt sau Tết, không sửa tay mỗi năm.
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang } from "@/lib/seo";
import { namAmHienTai } from "@/lib/tuoi-dan-gian";
import { duongNam, namCongKhai, dmy } from "@/lib/nam";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

const DUONG = "/nam";
const MAC = { tieuDe: "Xem theo năm: năm con gì, Tết, Tam tai, tuổi làm nhà, xông đất",
  moTa: "Tra từng năm âm lịch: can chi, mệnh nạp âm, ngày Tết, tuổi Tam tai, năm tuổi, sao hạn, tuổi làm nhà, cưới hỏi, xông đất, sinh con — và xem 3 tháng, 12 tháng tới của riêng bạn." };

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ ...MAC, duong: DUONG }), await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const namAm = await namAmHienTai();
  const [nd, ...nam] = await Promise.all([layNoiDungTrang(DUONG), namCongKhai(namAm), namCongKhai(namAm + 1)]);
  if (!nam.some(Boolean)) throw new Error("engine không phản hồi");   // SEO-L3: engine lỗi → 5xx, không trang rỗng 200
  const h1 = nd.dau.h1 ?? "Xem theo năm";
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: h1, tomTat: MAC.moTa }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Xem theo năm", duong: DUONG }]),
      )} />
      <TieuDeMuc cap={1} nho="Lịch · tuổi · tập quán" lon={h1}
        mo_ta={nd.dau.loiDan ?? "Mỗi năm âm lịch một trang: năm con gì, Tết ngày nào, tuổi nào Tam tai, xung năm — kèm mọi bảng tra theo tuổi của năm đó."} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mb-6" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {nam.map((d, i) => d && (
          <li key={d.nam}><Link href={duongNam(d.nam)} className="block rounded-2xl border border-line/70 p-5 hover:border-gold/50" data-testid="the-nam">
            <span className="eyebrow">{i === 0 ? "Năm âm lịch đang đi" : "Năm tới"}</span>
            <span className="mt-1 block font-serif text-2xl text-fg">Năm {d.nam} {d.can_chi}</span>
            <span className="mt-1 block text-sm text-fg-muted">Mệnh {d.nap_am.ten} · Tết {dmy(d.tet)}</span>
          </Link></li>
        ))}
      </ul>
      <section className="mt-8" aria-labelledby="moi-nam">
        <h2 id="moi-nam" className="text-2xl">Mỗi trang năm có gì</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg-muted">
          <li>Năm con gì, mệnh nạp âm, ngày Tết và ngày cuối năm âm lịch, Lập xuân, năm có tháng nhuận không.</li>
          <li>Bảng 12 con giáp: năm tuổi, tuổi xung, tuổi hợp với năm, năm thứ mấy của Tam tai — kèm năm sinh của từng con giáp.</li>
          <li>Các mốc lễ trong năm: rằm tháng Giêng, Giỗ Tổ, Đoan ngọ, Vu Lan, Trung thu, ông Công ông Táo.</li>
          <li>Lối tra theo tuổi của năm đó: sao hạn, tuổi làm nhà, cưới năm đó tuổi nào (Kim lâu theo tuổi cô dâu), sinh con hợp tuổi bố mẹ, tuổi xông đất, hướng nên tránh động thổ, lịch âm cả năm.</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">Năm âm lịch tính từ Tết Nguyên đán theo âm lịch Việt Nam (giờ Hà Nội); người sinh tháng 1 hoặc đầu tháng 2 trước Tết vẫn thuộc năm trước. Mọi điều về tuổi là tập quán dân gian để tham khảo, không định sẵn chuyện tốt xấu.</p>
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-surface/40 p-5" aria-labelledby="ca-nhan">
        <h2 id="ca-nhan" className="text-xl">Thời gian tới của riêng bạn</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">3 tháng tới, 12 tháng tới và cả năm theo thần số, Tử vi, Bát tự của chính bạn.</p>
        <Link href="/thoi-gian-toi" className="mt-3 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg">Xem thời gian tới của tôi</Link>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-8" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-10" />
    </div>
  );
}
