// HL-1 — trang một ngày (/xem-ngay-tot/2026-10-13) hoặc một tháng (/xem-ngay-tot/thang-10-2026).
// Ngày ngoài cửa sổ hữu ích (7 ngày trước → 400 ngày tới) vẫn xem được nhưng noindex; tháng index trong ±2 năm.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GioiThieuCongCu } from "@/components/seo/GioiThieuCongCu";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { LichThang, XemNgayTot } from "@/components/hoang-lich/XemNgayTot";
import { docDuong, duongNgay, homNayVN, ngayDangIndex, ngayTotCongKhai, thangCongKhai } from "@/lib/hoang-lich";
import { metaTrang } from "@/lib/seo";
import { ND_XEM_NGAY } from "../noi-dung";

type P = { params: Promise<{ duong: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");

function thangIndex(nam: number, thang: number): boolean {
  const h = homNayVN();
  const lech = (nam - Number(h.slice(0, 4))) * 12 + (thang - Number(h.slice(5, 7)));
  return lech >= -12 && lech <= 24;
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
    if (!d) return <p role="alert" className="mx-auto max-w-3xl text-sm text-fg-muted">Máy tính lịch đang bận, bạn tải lại trang sau ít phút nhé.</p>;
    return (
      <>
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/xem-ngay-tot" className="hover:underline">Xem ngày tốt</Link> ›{" "}
            <Link href={`/xem-ngay-tot/thang-${Number(x.iso.slice(5, 7))}-${x.iso.slice(0, 4)}`} className="hover:underline">Tháng {Number(x.iso.slice(5, 7))}/{x.iso.slice(0, 4)}</Link></nav>
          <TieuDeMuc cap={1} nho="Hoàng lịch"
            lon={`Ngày ${dmy(x.iso)} tốt hay xấu?`} mo_ta={`${d.thu}, âm lịch ${d.am.chu} — ngày ${d.can_chi.ngay}.`} />
          <XemNgayTot banDau={d} thang={t} />
        </div>
        <GioiThieuCongCu {...ND_XEM_NGAY} duong={duongNgay(x.iso)} ten={`Ngày ${dmy(x.iso)}`} />
      </>
    );
  }
  const t = await thangCongKhai(x.nam, x.thang);
  if (!t) return <p role="alert" className="mx-auto max-w-3xl text-sm text-fg-muted">Máy tính lịch đang bận, bạn tải lại trang sau ít phút nhé.</p>;
  const dep = t.ngay.filter((n) => n.hoang_dao && ["Thành", "Khai", "Định", "Mãn", "Trừ"].includes(n.truc) && !n.ky_dan_gian.length);
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
      <GioiThieuCongCu {...ND_XEM_NGAY} duong={`/xem-ngay-tot/thang-${x.thang}-${x.nam}`} ten={`Lịch ngày tốt tháng ${x.thang}/${x.nam}`} />
    </>
  );
}
