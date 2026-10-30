// NAM-1 — "Sinh con năm {năm} hợp tuổi bố mẹ nào?": tuổi bố/mẹ (tuổi mụ 22–52) × tuổi con theo địa chi (nhóm hợp / bình
// thường / dân gian hay nhắc cân nhắc — không điểm số) + quan hệ nạp âm để đọc thêm. Engine `/v1/nam/{nam}/sinh-con`.
// Ranh giới: sức khoẻ của mẹ + lời bác sĩ đi trước con giáp; không khuyên chọn ngày sinh mổ theo tuổi.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNamBang, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { dmy, duongCuoiHoi, duongNam, duongSinhCon, namIndex, sinhConCongKhai } from "@/lib/nam";
import { duongTrang } from "@/lib/kien-thuc";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { CHU_NAM_SINH_CON } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string }> };
const MAU = { hop: "text-jade", binh: "text-fg-muted", luu_y: "text-gold" } as const;

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamBang((await p.params).nam);
  if (!n) return {};
  const m = metaTrang({ tieuDe: `Sinh con năm ${n} hợp tuổi bố mẹ nào? Mệnh gì?`,
    moTa: `Con sinh năm ${n} tuổi gì, mệnh gì, hợp và xung với tuổi bố mẹ nào theo địa chi; bảng từng năm sinh của bố mẹ kèm quan hệ mệnh nạp âm. Tập quán tham khảo, không thay lời bác sĩ.`,
    duong: duongSinhCon(n), anh: anhBai({ tieuDe: `Sinh con năm ${n}`, mang: "lich" }) });
  return namIndex(n, await namAmHienTai()) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamBang((await p.params).nam);
  if (!n) notFound();
  const d = await sinhConCongKhai(n);
  if (!d) throw new Error("engine không phản hồi");
  const duong = duongSinhCon(n), bien = { nam: String(n), can_chi: d.con.can_chi };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_NAM_SINH_CON, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  const nhom = (["hop", "binh", "luu_y"] as const).map((k) => ({ k, ds: d.ds.filter((x) => x.nhom === k) }));
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`Năm ${d.con.can_chi}`, "Tuổi hợp", "Sinh con"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Năm", duong: "/nam" }, { ten: `Năm ${n}`, duong: duongNam(n) }, { ten: "Sinh con", duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href={duongNam(n)} className="hover:underline">Năm {n}</Link></nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>
      <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([["Tuổi con", d.con.can_chi], ["Mệnh", d.con.nap_am], ["Sinh từ", dmy(d.con.tu)], ["Đến hết", dmy(d.con.den)]] as const).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line/70 p-3"><dt className="text-xs text-fg-faint">{k}</dt><dd className="mt-0.5 text-sm text-fg">{v}</dd></div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-fg-faint">Sinh trước Tết ({dmy(d.con.tu)}) thì con tuổi {d.truoc_tet.can_chi}, mệnh {d.truoc_tet.nap_am}.</p>

      <section className="mt-8" aria-labelledby="bang">
        <h2 id="bang" className="text-2xl">{c("bang.tieu_de", bien)}</h2>
        <p className="mt-1 text-sm text-fg-muted">{c("bang.mo_ta", bien)}</p>
        {nhom.map(({ k, ds }) => ds.length > 0 && (
          <div key={k} className="mt-5">
            <h3 className={`text-lg ${MAU[k]}`}>{ds[0]!.nhom_nhan}</h3>
            <p className="mt-0.5 text-sm text-fg-muted">{d.loi_nhom[k]}</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-sm" data-testid={`bang-${k}`}>
                <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Bố/mẹ sinh</th><th className="pr-3">Địa chi</th><th>Mệnh</th></tr></thead>
                <tbody>{ds.map((x) => (
                  <tr key={x.nam_sinh} className="border-t border-line/50">
                    <td className="py-2 pr-3 text-fg">{x.nam_sinh} <span className="text-fg-faint">{x.can_chi}</span></td>
                    <td className="pr-3 text-fg-muted">{x.chi_nhan}</td>
                    <td className="text-fg-muted">{x.nap_am} · {x.nap_am_nhan.toLowerCase()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
      <p className="mt-6 rounded-xl border border-line/70 p-4 text-sm leading-relaxed text-fg-muted">{d.ranh_gioi}</p>
      <p className="mt-4 text-sm text-fg-muted">Đọc thêm:{" "}
        {n <= 2027 && <><Link href={duongTrang("menh_nam", `sinh-nam-${n}-menh-gi`)} className="text-gold underline">sinh năm {n} mệnh gì</Link> · </>}
        <Link href={duongCuoiHoi(n)} className="text-gold underline">cưới năm {n} tuổi nào</Link> ·{" "}
        <Link href="/hop-doi" className="text-gold underline">hợp đôi theo thần số học</Link></p>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-4">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted">Xem mọi tra cứu khác của năm này: <Link href={duongNam(n)} className="text-gold underline">Năm {n} {d.con.can_chi}</Link>. <span data-nosnippet="">{d.luu_y}</span></p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
