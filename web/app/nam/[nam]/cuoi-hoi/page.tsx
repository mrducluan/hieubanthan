// NAM-1 — "Cưới năm {năm}: tuổi nào không phạm Kim lâu?" — Kim lâu theo tuổi mụ CÔ DÂU (chủ dự án chốt 2026-10-30),
// cô dâu tuổi mụ 20–45. Engine `/v1/nam/{nam}/cuoi-hoi`; web hiển thị + lối sang ngày tốt cưới hỏi từng tháng.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNamBang, duongLamNhaNam, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { cuoiHoiCongKhai, duongCuoiHoi, duongNam, namIndex } from "@/lib/nam";
import { duongViecThang } from "@/lib/hoang-lich";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { CHU_NAM_CUOI_HOI } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const m = metaTrang({ tieuDe: `Cưới năm ${n} tuổi nào? Kim lâu theo tuổi cô dâu`,
    moTa: `Năm ${n} cô dâu tuổi nào cưới không phạm Kim lâu: bảng tuổi mụ từng năm sinh, Kim lâu Thân, Thê, Tử, Lục súc, năm gần nhất không phạm và ngày tốt cưới hỏi từng tháng.`,
    duong: duongCuoiHoi(n), anh: anhBai({ tieuDe: `Cưới năm ${n}`, mang: "lich" }) });
  return namIndex(n, await namAmHienTai()) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const d = await cuoiHoiCongKhai(n);
  if (!d) throw new Error("engine không phản hồi");
  const duong = duongCuoiHoi(n), bien = { nam: String(n), can_chi: d.can_chi };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_NAM_CUOI_HOI, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  // Năm âm {n} trải từ tháng Tết (năm n) tới tháng 1 năm n + 1 — lối sang ngày tốt cưới hỏi 12 tháng dương lịch từ tháng Tết.
  const t0 = Number(d.tet.slice(5, 7));
  const thang = Array.from({ length: 12 }, (_, i) => { const k = t0 - 1 + i; return { y: n + Math.floor(k / 12), m: (k % 12) + 1 }; });
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`Năm ${d.can_chi}`, "Kim lâu", "Cưới hỏi"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Năm", duong: "/nam" }, { ten: `Năm ${n}`, duong: duongNam(n) }, { ten: "Cưới hỏi", duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href={duongNam(n)} className="hover:underline">Năm {n}</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>

      <section className="mt-8" aria-labelledby="bang">
        <h2 id="bang" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{d.cach_tinh}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm" data-testid="bang-cuoi">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Cô dâu sinh</th><th className="pr-3">Tuổi mụ</th><th className="pr-3">Kim lâu</th><th>Năm gần nhất không phạm</th></tr></thead>
            <tbody>{d.ds.map((x) => (
              <tr key={x.nam_sinh} className="border-t border-line/50">
                <td className="py-2 pr-3 text-fg">{x.nam_sinh} <span className="text-fg-faint">{x.can_chi}</span></td>
                <td className="pr-3 tabular-nums text-fg-muted">{x.tuoi_mu}</td>
                <td className={`pr-3 ${x.duoc ? "text-jade" : "text-gold"}`}>{x.kim_lau ?? "Không phạm"}</td>
                <td className="tabular-nums text-fg-muted">{x.nam_khong_pham ?? "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{d.muon_tuoi}</p>
      </section>

      <section className="mt-8" aria-labelledby="ngay">
        <h2 id="ngay" className="text-2xl">{c("ngay.tieu_de", bien)}</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {thang.map(({ y, m }) => (
            <li key={`${y}-${m}`}><Link href={duongViecThang("cuoi-hoi", y, m)} className="inline-flex rounded-full border border-line/70 px-3 py-1.5 hover:border-gold/50">Tháng {m}/{y}</Link></li>
          ))}
        </ul>
      </section>
      <p className="mt-6 rounded-xl border border-line/70 p-4 text-sm leading-relaxed text-fg-muted">{d.ranh_gioi}</p>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-4">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted">Làm nhà cũng xét Kim lâu, Hoang ốc, Tam tai: <Link href={duongLamNhaNam(n)} className="text-gold underline">tuổi làm nhà năm {n}</Link>. Mọi tra cứu khác: <Link href={duongNam(n)} className="text-gold underline">năm {n}</Link>.</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
