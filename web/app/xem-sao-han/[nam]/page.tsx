// MT-ĐS B3 — "Sao hạn năm {năm}": MỘT trang cho mọi tuổi sinh 1960–2005, hai giới (không trang theo tuổi — bảng chu kỳ
// 9 lặp lại, tránh nội dung mỏng). Lời từng sao từ KB; câu cố định + hỏi đáp (có cần cúng không → GHPGVN 2019).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNamBang, duongSaoHanNam, namAmHienTai, saoHanIndex, saoHanNamCongKhai } from "@/lib/tuoi-dan-gian";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang } from "@/lib/noi-dung-trang";
import { CHU_SAO_HAN_NAM } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, "-");

export async function generateMetadata(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const m = metaTrang({ tieuDe: `Sao hạn năm ${n} theo tuổi — nam và nữ, lời đời thường`,
    moTa: `Bảng sao hạn năm ${n} cho tuổi sinh 1960–2005 (nam, nữ): La Hầu, Thổ Tú, Thuỷ Diệu, Thái Bạch, Thái Dương, Vân Hán, Kế Đô, Thái Âm, Mộc Đức — mỗi sao đọc bằng việc nên làm, không cúng sao.`,
    duong: duongSaoHanNam(n) });
  return saoHanIndex(n, await namAmHienTai()) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const d = await saoHanNamCongKhai(n);
  if (!d) throw new Error("engine không phản hồi");
  const duong = duongSaoHanNam(n), bien = { nam: String(n), can_chi: d.can_chi };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_SAO_HAN_NAM, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: ["Sao hạn", `Năm ${d.can_chi}`] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Sao hạn theo tuổi", duong: "/xem-sao-han" }, { ten: `Năm ${n}`, duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/xem-sao-han" className="hover:underline">Sao hạn theo tuổi</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
        <p className="mt-2 text-sm text-fg-muted" data-nosnippet="">{d.cau_co_dinh}</p>
      </section>

      <section className="mt-8" aria-labelledby="bang-nam">
        <h2 id="bang-nam" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{c("bang.mo_ta", bien)}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Năm sinh</th><th className="pr-3">Tuổi mụ</th><th className="pr-3">Nam</th><th>Nữ</th></tr></thead>
            <tbody>
              {d.ds.map((x) => (
                <tr key={x.nam_sinh} className="border-t border-line/50">
                  <td className="py-2 pr-3 text-fg">{x.nam_sinh} <span className="text-fg-faint">{x.can_chi}</span></td>
                  <td className="pr-3 tabular-nums text-fg-muted">{x.tuoi_mu}</td>
                  <td className="pr-3">{x.nam ? <a href={`#sao-${slug(x.nam)}`} className="text-gold underline decoration-gold/40 underline-offset-2">{x.nam}</a> : "—"}
                    {x.han_nam && <span className="block text-xs text-fg-faint">hạn {x.han_nam}</span>}</td>
                  <td>{x.nu ? <a href={`#sao-${slug(x.nu)}`} className="text-gold underline decoration-gold/40 underline-offset-2">{x.nu}</a> : "—"}
                    {x.han_nu && <span className="block text-xs text-fg-faint">hạn {x.han_nu}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="chin-sao">
        <h2 id="chin-sao" className="text-2xl">Chín sao đọc bằng lời đời thường</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {d.sao.map((s) => (
            <article key={s.ten} id={`sao-${slug(s.ten)}`} className="glass scroll-mt-24 rounded-2xl p-4">
              <h3 className="font-serif text-xl text-gold">{s.ten}</h3>
              <p className="mt-1 text-sm leading-relaxed">{s.nghia}</p>
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-fg-muted">{s.viec.map((v) => <li key={v}>{v}</li>)}</ul>
              <p className="mt-2 text-xs italic text-fg-muted">Tự soi: {s.tu_soi}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="tam-han">
        <h2 id="tam-han" className="text-2xl">Tám hạn đi kèm, hiểu theo đời thường</h2>
        <p className="mt-1 text-sm text-fg-muted">Tên gọi cổ nghe nặng, nghĩa đời thường chỉ là chỗ nên để ý trong năm; hệ thống không dùng chúng để đoán chuyện gì.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {d.han.map((h) => <li key={h.ten} className="rounded-xl border border-line/70 p-3"><b className="text-fg">{h.ten}:</b> <span className="text-fg-muted">{h.nghia}</span></li>)}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <div className="mt-3 space-y-3">
          {d.hoi_dap.map((h) => <details key={h.hoi} className="glass rounded-xl p-4"><summary className="cursor-pointer font-medium">{h.hoi}</summary><p className="mt-2 text-sm leading-relaxed text-fg-muted">{h.dap}</p></details>)}
        </div>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-6 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href="/xem-sao-han" className="text-gold underline">{c("cuoi.link", bien)}</Link>. {d.cach_tinh} {d.luu_y}</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-6" />
    </div>
  );
}
