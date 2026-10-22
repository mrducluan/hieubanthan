// HL-1 — trang một ngày (/xem-ngay-tot/2026-10-13) hoặc một tháng (/xem-ngay-tot/thang-10-2026).
// Ngày ngoài cửa sổ hữu ích (7 ngày trước → 400 ngày tới) vẫn xem được nhưng noindex; tháng index trong ±2 năm.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { LichThang, XemNgayTot } from "@/components/hoang-lich/XemNgayTot";
import { docDuong, duongNgay, ngayDangIndex, ngayTotCongKhai, thangCongKhai, thangIndex } from "@/lib/hoang-lich";
import { goiLd, ldDuongDan, metaTrang, siteUrl, urlDayDu } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang } from "@/lib/noi-dung-trang";
import { CHU_NGAY, CHU_THANG } from "@/lib/chu/trang-con";

type P = { params: Promise<{ duong: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");

/** Trang con: WebPage + breadcrumb đúng như đường dẫn hiển thị; giới thiệu + hỏi đáp chỉ ở trang chính /xem-ngay-tot
 *  (không lặp FAQ trên hàng trăm trang ngày/tháng). */
function LdTrangCon({ duong, ten, moTa, cap, cuoi }: { duong: string; ten: string; moTa: string; cap: { ten: string; duong: string }[]; cuoi: { chu: string; link: string } }) {
  return (
    <>
      <JsonLd data={goiLd(
        { "@type": "WebPage", "@id": `${urlDayDu(duong)}#trang`, url: urlDayDu(duong), name: ten, description: moTa,
          inLanguage: "vi-VN", isPartOf: { "@id": `${siteUrl()}/#website` } },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Xem ngày tốt", duong: "/xem-ngay-tot" }, ...cap]),
      )} />
      <p className="mx-auto mt-10 max-w-3xl border-t border-line/50 pt-6 text-sm text-fg-muted">
        {cuoi.chu} <Link href="/xem-ngay-tot" className="text-gold underline">{cuoi.link}</Link>.
      </p>
    </>
  );
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const x = docDuong((await params).duong);
  if (!x) return {};
  if (x.loai === "ngay") {
    const m = metaTrang({ tieuDe: `Ngày ${dmy(x.iso)} tốt hay xấu? Hoàng đạo, giờ tốt, việc nên làm`,
      moTa: `Xem ngày ${dmy(x.iso)}: âm lịch, can chi, hoàng đạo hay hắc đạo, trực, giờ hoàng đạo, việc nên làm và nên kiêng, tuổi xung, hướng xuất hành.`,
      duong: duongNgay(x.iso) });
    return ngayDangIndex(x.iso) ? m : { ...m, robots: { index: false, follow: true } };
  }
  const m = metaTrang({ tieuDe: `Lịch ngày tốt tháng ${x.thang}/${x.nam}: ngày hoàng đạo, ngày đẹp`,
    moTa: `Lịch tháng ${x.thang} năm ${x.nam} có ngày âm, ngày hoàng đạo/hắc đạo, trực từng ngày; tìm ngày đẹp cưới hỏi, khai trương, về nhà mới, động thổ trong tháng.`,
    duong: `/xem-ngay-tot/${(await params).duong}` });
  return thangIndex(x.nam, x.thang) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page({ params }: P) {
  const x = docDuong((await params).duong);
  if (!x) notFound();
  if (x.loai === "ngay") {
    const [d, t] = await Promise.all([ngayTotCongKhai(x.iso), thangCongKhai(Number(x.iso.slice(0, 4)), Number(x.iso.slice(5, 7)))]);
    if (!d) throw new Error("engine lịch không phản hồi");   // → error.tsx, mã 5xx (không index trang lỗi)
    const thangCua = { nam: Number(x.iso.slice(0, 4)), thang: Number(x.iso.slice(5, 7)) };
    // ND-7: mẫu cụm "/xem-ngay-tot/{ngay}" — khối CMS + chữ (tiêu đề, đoạn cuối) sửa được cho cả cụm hoặc riêng ngày.
    const duong = duongNgay(x.iso), bien = { ngay: dmy(x.iso), thu: d.thu, am: d.am.chu };
    const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_NGAY, nd.chu), tieuDe = c("dau.tieu_de", bien);
    return (
      <>
        <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mx-auto mb-6 max-w-3xl" />
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/xem-ngay-tot" className="hover:underline">Xem ngày tốt</Link> ›{" "}
            <Link href={`/xem-ngay-tot/thang-${Number(x.iso.slice(5, 7))}-${x.iso.slice(0, 4)}`} className="hover:underline">Tháng {Number(x.iso.slice(5, 7))}/{x.iso.slice(0, 4)}</Link></nav>
          <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
          <XemNgayTot banDau={d} thang={t} />
        </div>
        <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mx-auto mt-10 max-w-3xl" />
        <LdTrangCon duong={duong} ten={tieuDe} cuoi={{ chu: c("cuoi.chu"), link: c("cuoi.link") }}
          moTa={`${d.thu}, âm lịch ${d.am.chu}, ngày ${d.can_chi.ngay}: ${d.hoang_dao ? "hoàng đạo" : "hắc đạo"} (${d.than.ten}), trực ${d.truc.ten}.`}
          cap={[{ ten: `Tháng ${thangCua.thang}/${thangCua.nam}`, duong: `/xem-ngay-tot/thang-${thangCua.thang}-${thangCua.nam}` },
            { ten: `Ngày ${dmy(x.iso)}`, duong: duongNgay(x.iso) }]} />
        <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mx-auto mt-10 max-w-3xl" />
      </>
    );
  }
  const t = await thangCongKhai(x.nam, x.thang);
  if (!t) throw new Error("engine lịch không phản hồi");
  const dep = t.ngay.filter((n) => n.dep);
  const duong = `/xem-ngay-tot/thang-${x.thang}-${x.nam}`, bien = { thang: String(x.thang), nam: String(x.nam) };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_THANG, nd.chu), tieuDe = c("dau.tieu_de", bien);
  return (
    <>
      <div className="mx-auto max-w-3xl space-y-5">
        <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} mo_ta={c("dau.mo_ta", bien)} />
        <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" />
        <LichThang t={t} />
        <section aria-labelledby="ngay-dep" className="glass rounded-2xl p-5" data-testid="ngay-dep-thang">
          <h2 id="ngay-dep" className="text-xl">{c("dep.tieu_de", bien)}</h2>
          <p className="mt-1 text-sm text-fg-muted">{c("dep.mo_ta", bien)}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {dep.map((n) => (
              <li key={n.ngay}><Link href={duongNgay(n.ngay)} className="block rounded-xl border border-line/70 px-3 py-2 text-sm hover:border-gold/50">
                <b>{dmy(n.ngay)}</b> <span className="text-fg-muted">({n.am} âm · {n.can_chi}) · {n.than} · trực {n.truc}</span></Link></li>
            ))}
          </ul>
        </section>
        <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" />
      </div>
      <LdTrangCon duong={duong} ten={tieuDe} cuoi={{ chu: c("cuoi.chu"), link: c("cuoi.link") }}
        moTa={`Lịch tháng ${x.thang}/${x.nam}: ngày âm, hoàng đạo/hắc đạo, trực từng ngày và ${dep.length} ngày hoàng đạo có trực tốt.`}
        cap={[{ ten: `Tháng ${x.thang}/${x.nam}`, duong }]} />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mx-auto mt-10 max-w-3xl" />
    </>
  );
}
