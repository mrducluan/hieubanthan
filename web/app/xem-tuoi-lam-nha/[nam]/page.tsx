// SEO-L1 — "Tuổi nào làm nhà, cưới hỏi năm {năm}?": bảng 46 tuổi 1960–2005 (Kim lâu, Hoang ốc, Tam tai) do engine ghép
// từ đúng hàm của từng tuổi; link xuống trang từng tuổi. Index cùng cửa sổ với trang con (năm âm hiện tại + năm sau).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang, urlDayDu } from "@/lib/seo";
import { NAM_BANG_TU, docNamBang, duongHanNam, duongLamNha, duongLamNhaNam, duongXongDatNam, lamNhaNamCongKhai, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang } from "@/lib/noi-dung-trang";
import { CHU_LAM_NHA_NAM } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };

export async function generateMetadata(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const m = metaTrang({ tieuDe: `Tuổi nào làm nhà năm ${n}? Bảng Kim lâu, Hoang ốc, Tam tai`,
    moTa: `Năm ${n}: tuổi sinh 1960–2005 nào làm nhà, cưới hỏi được, tuổi nào phạm Kim lâu, Hoang ốc, Tam tai — tính theo tuổi mụ âm lịch.`,
    duong: duongLamNhaNam(n), anh: anhBai({ tieuDe: `Tuổi nào làm nhà năm ${n}?`, mang: "lich" }) });
  const namAm = await namAmHienTai();
  return n === namAm || n === namAm + 1 ? m : { ...m, robots: { index: false, follow: true } };   // cùng cửa sổ trang con
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const [d, namAm] = await Promise.all([lamNhaNamCongKhai(n), namAmHienTai()]);
  if (!d) throw new Error("engine không phản hồi");   // → error.tsx (5xx), không để Google index trang lỗi
  const duong = duongLamNhaNam(n), bien = { nam: String(n), can_chi: d.can_chi };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_LAM_NHA_NAM, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        { ...ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: ["Kim lâu", "Hoang ốc", "Tam tai", `Năm ${d.can_chi}`] }),
          mainEntity: { "@type": "ItemList", numberOfItems: d.ds.length,
            itemListElement: d.ds.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(duongLamNha(n, x.nam_sinh)), name: `Tuổi ${x.can_chi} ${x.nam_sinh}` })) } },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Xem tuổi làm nhà", duong: "/xem-tuoi-lam-nha" }, { ten: `Năm ${n}`, duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/xem-tuoi-lam-nha" className="hover:underline">Xem tuổi làm nhà</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>

      <section className="mt-8" aria-labelledby="bang-nam">
        <h2 id="bang-nam" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{c("bang.mo_ta", bien)}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-xs text-fg-faint">
              <tr><th className="py-2 pr-3">Năm sinh</th><th className="pr-3">Tuổi mụ</th><th className="pr-3">Kim lâu</th><th className="pr-3">Hoang ốc</th><th className="pr-3">Tam tai</th><th>Kết luận</th></tr>
            </thead>
            <tbody>
              {d.ds.map((x) => (
                <tr key={x.nam_sinh} className="border-t border-line/50">
                  <td className="py-2 pr-3"><Link href={duongLamNha(n, x.nam_sinh)} className="text-gold underline decoration-gold/40 underline-offset-2">{x.nam_sinh}</Link> <span className="text-fg-faint">{x.can_chi}</span></td>
                  <td className="pr-3">{x.tuoi_mu}</td>
                  <td className="pr-3">{x.kim_lau ?? "—"}</td>
                  <td className={`pr-3 ${x.hoang_oc_xau ? "text-cinnabar" : ""}`}>{x.hoang_oc}</td>
                  <td className="pr-3">{x.tam_tai ? `năm thứ ${x.tam_tai}` : "—"}</td>
                  <td className={x.thuan ? "text-jade" : "text-fg-muted"}>{x.thuan ? "Thuận" : "Nên cân nhắc"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-fg-faint">{d.cach_tinh}</p>
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
      <p className="mt-8 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href="/xem-tuoi-lam-nha" className="text-gold underline">{c("cuoi.link", bien)}</Link></p>
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        {n > NAM_BANG_TU && <Link href={duongLamNhaNam(n - 1)} className="text-gold underline">Năm {n - 1}</Link>}
        {n < 2099 && <Link href={duongLamNhaNam(n + 1)} className="text-gold underline">Năm {n + 1}</Link>}
        <Link href={duongHanNam(n)} className="text-gold underline">Hướng xấu năm {n}</Link>
        {n >= namAm && <Link href={duongXongDatNam(n)} className="text-gold underline">Tuổi xông đất Tết {n}</Link>}
      </p>
      <p className="mt-6 text-xs text-fg-faint">{d.luu_y}</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}
