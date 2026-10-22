// SEO-L5 — "Lịch âm năm {năm}": các tháng âm lịch Việt (mùng 1 dương lịch, đủ/thiếu, nhuận), Tết, rằm — engine tính
// (Hồ Ngọc Đức UTC+7). Index ±10 năm quanh năm nay; năm khác vẫn xem được, noindex.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { duongThang, homNayVN } from "@/lib/hoang-lich";
import { docNamLich, duongLichAm, lichAmIndex, lichNamCongKhai } from "@/lib/lich-am";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { CHU_LICH_AM_NAM } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamLich((await p.params).nam);
  if (!n) return {};
  const m = metaTrang({ tieuDe: `Lịch âm ${n}: Tết, tháng nhuận, các tháng âm lịch`,
    moTa: `Lịch âm năm ${n} theo âm lịch Việt Nam: ngày Tết, có tháng nhuận không, mùng 1 và rằm từng tháng ứng với dương lịch, tháng đủ hay thiếu.`,
    duong: duongLichAm(n), anh: anhBai({ tieuDe: `Lịch âm ${n}`, mang: "lich" }) });
  return lichAmIndex(n, Number(homNayVN().slice(0, 4))) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamLich((await p.params).nam);
  if (!n) notFound();
  const d = await lichNamCongKhai(n);
  if (!d) throw new Error("engine lịch không phản hồi");
  const duong = duongLichAm(n), bien = { nam: String(n), can_chi: d.can_chi };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_LICH_AM_NAM, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: ["Âm lịch Việt Nam", `Năm ${d.can_chi}`, "Tết Nguyên đán"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Đổi lịch âm dương", duong: "/doi-lich-am-duong" }, { ten: `Lịch âm ${n}`, duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/doi-lich-am-duong" className="hover:underline">Đổi lịch âm dương</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>
      <section className="mt-8" aria-labelledby="bang-thang">
        <h2 id="bang-thang" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm" data-testid="bang-lich-am">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Tháng âm</th><th className="pr-3">Can chi</th><th className="pr-3">Mùng 1 (dương lịch)</th><th className="pr-3">Rằm</th><th>Số ngày</th></tr></thead>
            <tbody>
              {d.thang.map((t) => (
                <tr key={`${t.thang}${t.nhuan ? "n" : ""}`} className="border-t border-line/50">
                  <td className="py-2 pr-3 text-fg">{`Tháng ${t.thang === 1 ? "Giêng" : t.thang === 12 ? "Chạp" : t.thang}${t.nhuan ? " (nhuận)" : ""}`}</td>
                  <td className="pr-3 text-fg-muted">{t.can_chi}</td>
                  <td className="pr-3"><Link href={duongThang(Number(t.mung_mot.slice(0, 4)), Number(t.mung_mot.slice(5, 7)))} className="text-gold underline decoration-gold/40 underline-offset-2">{dmy(t.mung_mot)}</Link></td>
                  <td className="pr-3 text-fg-muted">{dmy(t.ram)}</td>
                  <td className="text-fg-muted">{t.so_ngay === 30 ? "30 (đủ)" : "29 (thiếu)"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-fg-faint">{d.cach_tinh}</p>
      </section>
      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-4">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href="/doi-lich-am-duong" className="text-gold underline">{c("cuoi.link", bien)}</Link></p>
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        {n > 1901 && <Link href={duongLichAm(n - 1)} className="text-gold underline">Lịch âm {n - 1}</Link>}
        {n < 2098 && <Link href={duongLichAm(n + 1)} className="text-gold underline">Lịch âm {n + 1}</Link>}
      </p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
