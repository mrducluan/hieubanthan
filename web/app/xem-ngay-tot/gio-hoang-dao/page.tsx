// KH-BL đợt 1 (2026-10-29) — "Giờ hoàng đạo": bảng 6 nhóm ngày (Tý–Ngọ, Sửu–Mùi…) × 6 giờ hoàng đạo + 12 thần + giờ hoàng
// đạo hôm nay. Engine tính mọi thứ (`/v1/lich/gio-hoang-dao`, `/v1/lich/ngay-tot/{ngày}`) — web chỉ hiển thị.
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { duongNgay, gioHoangDaoCongKhai, homNayVN, ngayTotCongKhai } from "@/lib/hoang-lich";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

const DUONG = "/xem-ngay-tot/gio-hoang-dao";
const TIEU_DE = "Giờ hoàng đạo là gì? Bảng giờ hoàng đạo theo ngày";
const dmy = (iso: string) => iso.split("-").reverse().join("/");

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ tieuDe: TIEU_DE, duong: DUONG, anh: anhBai({ tieuDe: "Giờ hoàng đạo", mang: "lich" }),
    moTa: "Giờ hoàng đạo hôm nay và bảng giờ hoàng đạo cho 12 ngày Tý đến Hợi: khung giờ đồng hồ, thần trực giờ, cách tự tra theo địa chi ngày." }),
  await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const [d, hn, nd] = await Promise.all([gioHoangDaoCongKhai(), ngayTotCongKhai(homNayVN()), layNoiDungTrang(DUONG)]);
  if (!d) throw new Error("engine lịch không phản hồi");
  const h1 = nd.dau.h1 ?? "Giờ hoàng đạo";
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: TIEU_DE, tomTat: d.tra_loi_nhanh, about: ["Giờ hoàng đạo", "Hoàng lịch", "Âm lịch Việt Nam"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Xem ngày tốt", duong: "/xem-ngay-tot" }, { ten: "Giờ hoàng đạo", duong: DUONG }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/xem-ngay-tot" className="hover:underline">Xem ngày tốt</Link></nav>
      <TieuDeMuc cap={1} nho="Hoàng lịch" lon={h1} />
      <LoiDanCms nd={nd} className="mt-3 text-fg-muted">Sáu canh giờ tốt trong ngày theo lịch vạn niên — tra theo địa chi của ngày, khung giờ đồng hồ Việt Nam.</LoiDanCms>
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-6" />
      <section aria-label="Trả lời nhanh" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>

      {hn && (
        <section className="mt-8" aria-labelledby="hom-nay" data-testid="gio-hom-nay">
          <h2 id="hom-nay" className="text-2xl">Giờ hoàng đạo hôm nay ({dmy(hn.ngay)})</h2>
          <p className="mt-2 text-fg-muted">Ngày {hn.can_chi.ngay}, {hn.am.chu}. Sáu giờ hoàng đạo:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {hn.gio_hoang_dao.map((g) => (
              <li key={g.chi} className="rounded-xl border border-line/60 px-4 py-2">
                <span className="text-fg">Giờ {g.chi}</span> <span className="text-fg-muted">{g.khung}</span>
                <span className="block text-sm text-fg-faint">{g.than}</span>
              </li>
            ))}
          </ul>
          {hn.ghi_chu_gio_ty && <p className="mt-2 text-xs text-fg-faint">{hn.ghi_chu_gio_ty}</p>}
          <p className="mt-3 text-sm"><Link href={duongNgay(hn.ngay)} className="text-gold underline decoration-gold/40 underline-offset-2">Xem đủ hoàng lịch hôm nay</Link></p>
        </section>
      )}

      <section className="mt-10" aria-labelledby="bang">
        <h2 id="bang" className="text-2xl">Bảng giờ hoàng đạo theo ngày</h2>
        <p className="mt-2 text-fg-muted">Hai ngày có địa chi xung nhau dùng chung một bảng. Xem địa chi của ngày trên lịch âm, rồi tra dòng tương ứng.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm" data-testid="bang-gio-hoang-dao">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Ngày</th><th>Giờ hoàng đạo</th></tr></thead>
            <tbody>
              {d.nhom.map((n) => (
                <tr key={n.ngay[0]} className="border-t border-line/50 align-top">
                  <td className="whitespace-nowrap py-2 pr-3 text-fg">{`Ngày ${n.ngay[0]}, ${n.ngay[1]}`}</td>
                  <td className="py-2 text-fg-muted">{n.gio.map((g) => `${g.chi} (${g.khung})`).join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="than">
        <h2 id="than" className="text-2xl">12 thần trực giờ</h2>
        <p className="mt-2 text-fg-muted">Mỗi canh giờ có một thần trực theo vòng 12 thần: sáu thần hoàng đạo (giờ tốt) và sáu thần hắc đạo.</p>
        <ul className="mt-4 space-y-2">
          {d.than.map((t) => (
            <li key={t.ten}><strong className={t.loai === "hoàng đạo" ? "text-gold" : "text-fg"}>{t.ten}</strong>
              <span className="text-fg-faint"> · {t.loai}</span> — <span className="text-fg-muted">{t.nghia}</span></li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="cach-tinh">
        <h2 id="cach-tinh" className="text-2xl">Cách tính</h2>
        <p className="mt-2 text-fg-muted">{d.cach_tinh}</p>
        <p className="mt-2 text-sm text-fg-faint">{d.luu_y} Nguồn: {d.nguon}.</p>
      </section>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Hỏi đáp</h2>
        <dl className="mt-4 space-y-4">
          {d.hoi_dap.map((h) => (<div key={h.hoi}><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1 text-fg-muted">{h.dap}</dd></div>))}
        </dl>
      </section>

      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-10" />
      <p className="mt-10 text-sm text-fg-muted">Xem thêm: <Link href="/bat-tu/tiet-khi" className="text-gold underline decoration-gold/40 underline-offset-2">24 tiết khí</Link> ·{" "}
        <Link href="/doi-lich-am-duong" className="text-gold underline decoration-gold/40 underline-offset-2">Đổi lịch âm dương</Link></p>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-10" />
    </div>
  );
}
