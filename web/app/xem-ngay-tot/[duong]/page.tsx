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

type P = { params: Promise<{ duong: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");

/** Trang con: WebPage + breadcrumb đúng như đường dẫn hiển thị; giới thiệu + hỏi đáp chỉ ở trang chính /xem-ngay-tot
 *  (không lặp FAQ trên hàng trăm trang ngày/tháng). */
function LdTrangCon({ duong, ten, moTa, cap }: { duong: string; ten: string; moTa: string; cap: { ten: string; duong: string }[] }) {
  return (
    <>
      <JsonLd data={goiLd(
        { "@type": "WebPage", "@id": `${urlDayDu(duong)}#trang`, url: urlDayDu(duong), name: ten, description: moTa,
          inLanguage: "vi-VN", isPartOf: { "@id": `${siteUrl()}/#website` } },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Xem ngày tốt", duong: "/xem-ngay-tot" }, ...cap]),
      )} />
      <p className="mx-auto mt-10 max-w-3xl border-t border-line/50 pt-6 text-sm text-fg-muted">
        Hoàng lịch tính theo giờ Việt Nam, bảng nghi/kỵ theo sách Hiệp kỷ biện phương thư, kèm ngày kiêng dân gian Việt.
        Cách đọc, giờ hoàng đạo, ngày Tam nương và câu hỏi thường gặp: <Link href="/xem-ngay-tot" className="text-gold underline">Xem ngày tốt hôm nay</Link>.
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
    return (
      <>
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/xem-ngay-tot" className="hover:underline">Xem ngày tốt</Link> ›{" "}
            <Link href={`/xem-ngay-tot/thang-${Number(x.iso.slice(5, 7))}-${x.iso.slice(0, 4)}`} className="hover:underline">Tháng {Number(x.iso.slice(5, 7))}/{x.iso.slice(0, 4)}</Link></nav>
          <TieuDeMuc cap={1} nho="Hoàng lịch" lon={`Ngày ${dmy(x.iso)} tốt hay xấu?`} />
          <XemNgayTot banDau={d} thang={t} />
        </div>
        <LdTrangCon duong={duongNgay(x.iso)} ten={`Ngày ${dmy(x.iso)} tốt hay xấu?`}
          moTa={`${d.thu}, âm lịch ${d.am.chu}, ngày ${d.can_chi.ngay}: ${d.hoang_dao ? "hoàng đạo" : "hắc đạo"} (${d.than.ten}), trực ${d.truc.ten}.`}
          cap={[{ ten: `Tháng ${thangCua.thang}/${thangCua.nam}`, duong: `/xem-ngay-tot/thang-${thangCua.thang}-${thangCua.nam}` },
            { ten: `Ngày ${dmy(x.iso)}`, duong: duongNgay(x.iso) }]} />
      </>
    );
  }
  const t = await thangCongKhai(x.nam, x.thang);
  if (!t) throw new Error("engine lịch không phản hồi");
  const dep = t.ngay.filter((n) => n.dep);
  return (
    <>
      <div className="mx-auto max-w-3xl space-y-5">
        <TieuDeMuc cap={1} nho="Xem ngày tốt" lon={`Lịch ngày tốt tháng ${x.thang}/${x.nam}`}
          mo_ta="Bấm vào một ngày để xem giờ hoàng đạo, việc nên làm và nên kiêng." />
        <LichThang t={t} />
        <section aria-labelledby="ngay-dep" className="glass rounded-2xl p-5" data-testid="ngay-dep-thang">
          <h2 id="ngay-dep" className="text-xl">Ngày hoàng đạo có trực tốt trong tháng</h2>
          <p className="mt-1 text-sm text-fg-muted">Hoàng đạo, trực Thành/Khai/Định/Mãn/Trừ, không rơi vào Tam nương, Nguyệt kỵ, Dương công. Việc cụ thể (cưới hỏi, khai trương…) nên bấm vào ngày để xem mục nên/kiêng.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {dep.map((n) => (
              <li key={n.ngay}><Link href={duongNgay(n.ngay)} className="block rounded-xl border border-line/70 px-3 py-2 text-sm hover:border-gold/50">
                <b>{dmy(n.ngay)}</b> <span className="text-fg-muted">({n.am} âm · {n.can_chi}) · {n.than} · trực {n.truc}</span></Link></li>
            ))}
          </ul>
        </section>
      </div>
      <LdTrangCon duong={`/xem-ngay-tot/thang-${x.thang}-${x.nam}`} ten={`Lịch ngày tốt tháng ${x.thang}/${x.nam}`}
        moTa={`Lịch tháng ${x.thang}/${x.nam}: ngày âm, hoàng đạo/hắc đạo, trực từng ngày và ${dep.length} ngày hoàng đạo có trực tốt.`}
        cap={[{ ten: `Tháng ${x.thang}/${x.nam}`, duong: `/xem-ngay-tot/thang-${x.thang}-${x.nam}` }]} />
    </>
  );
}
