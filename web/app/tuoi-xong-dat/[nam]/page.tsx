// SEO-L1 — "Tuổi xông đất Tết {năm}": bảng gia chủ sinh 1960–2005 → 3 tuổi hợp nhất (engine ghép từ đúng hàm của trang
// từng tuổi), tuổi nên tránh, giờ hoàng đạo mùng 1. Index cùng cửa sổ trang con (Tết năm nay + Tết tới).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang, urlDayDu } from "@/lib/seo";
import { NAM_BANG_TU, docNamBang, duongLamNhaNam, duongXongDat, duongXongDatNam, namAmHienTai, xongDatNamCongKhai } from "@/lib/tuoi-dan-gian";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { CHU_XONG_DAT_NAM } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const m = metaTrang({ tieuDe: `Tuổi xông đất Tết ${n} hợp gia chủ, tuổi nên tránh, giờ đẹp`,
    moTa: `Tết ${n}: tuổi nào hợp xông đất cho gia chủ sinh 1960–2005, tuổi nên tránh (xung năm, Tam tai), giờ hoàng đạo và hướng xuất hành mùng 1.`,
    duong: duongXongDatNam(n), anh: anhBai({ tieuDe: `Tuổi xông đất Tết ${n}`, mang: "lich" }) });
  const namAm = await namAmHienTai();
  return n === namAm || n === namAm + 1 ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const d = await xongDatNamCongKhai(n);
  if (!d) throw new Error("engine không phản hồi");
  const duong = duongXongDatNam(n), bien = { nam: String(n), can_chi: d.nam.can_chi };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_XONG_DAT_NAM, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        { ...ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: ["Xông đất", `Tết ${d.nam.can_chi}`] }),
          mainEntity: { "@type": "ItemList", numberOfItems: d.ds.length,
            itemListElement: d.ds.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(duongXongDat(n, x.nam_sinh)), name: `Gia chủ tuổi ${x.can_chi} ${x.nam_sinh}` })) } },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Tuổi xông đất", duong: "/tuoi-xong-dat" }, { ten: `Tết ${n}`, duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/tuoi-xong-dat" className="hover:underline">Tuổi xông đất</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line/70 p-4 text-sm">
          <p className="font-medium text-fg">Mùng 1 Tết: {dmy(d.mung_mot.ngay)} · ngày {d.mung_mot.can_chi}</p>
          <p className="mt-1 text-fg-muted">Giờ hoàng đạo: {d.mung_mot.gio_hoang_dao.map((g) => `${g.chi} (${g.khung})`).join(", ")}.</p>
          <p className="mt-1 text-fg-muted">Hỷ thần {d.mung_mot.huong.hy_than} · Tài thần {d.mung_mot.huong.tai_than}.</p>
        </div>
        <div className="rounded-xl border border-line/70 p-4 text-sm">
          <p className="font-medium text-fg">Nên tránh</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-fg-muted">{d.nen_tranh.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="bang-nam">
        <h2 id="bang-nam" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{c("bang.mo_ta", bien)}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Gia chủ sinh năm</th><th>Tuổi hợp xông đất</th></tr></thead>
            <tbody>
              {d.ds.map((x) => (
                <tr key={x.nam_sinh} className="border-t border-line/50">
                  <td className="py-2 pr-3"><Link href={duongXongDat(n, x.nam_sinh)} className="text-gold underline decoration-gold/40 underline-offset-2">{x.nam_sinh}</Link> <span className="text-fg-faint">{x.can_chi}</span></td>
                  <td className="text-fg-muted">{x.tuoi_hop.length ? x.tuoi_hop.map((h) => `${h.nam_sinh} (${h.can_chi})`).join(", ") : "Xem chi tiết"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-4">
          {d.hoi_dap.map((h) => (
            <div key={h.hoi} className="rounded-xl border border-line/70 p-4">
              <dt className="font-medium text-fg">{h.hoi}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd>
            </div>
          ))}
        </dl>
      </section>

      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href="/tuoi-xong-dat" className="text-gold underline">{c("cuoi.link", bien)}</Link></p>
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        {n > NAM_BANG_TU && <Link href={duongXongDatNam(n - 1)} className="text-gold underline">Tết {n - 1}</Link>}
        {n < 2099 && <Link href={duongXongDatNam(n + 1)} className="text-gold underline">Tết {n + 1}</Link>}
        <Link href={duongLamNhaNam(n)} className="text-gold underline">Tuổi làm nhà năm {n}</Link>
      </p>
      <p className="mt-6 text-xs text-fg-faint">{d.luu_y}</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
