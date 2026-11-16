// SEO-L5 — "Lịch âm năm {năm}": các tháng âm lịch Việt (mùng 1 dương lịch, đủ/thiếu, nhuận), Tết, rằm — engine tính
// (Hồ Ngọc Đức UTC+7). Index ±10 năm quanh năm nay; năm khác vẫn xem được, noindex.
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import { MoiXemRieng } from "@/components/nam/MoiXemRieng";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { duongNgay, duongThang, homNayVN } from "@/lib/hoang-lich";
import { cacNamLich, docNamLich, duongLichAm, lichAmIndex, lichNamCongKhai, lichNgayCongKhai } from "@/lib/lich-am";
import { LichAmNam } from "@/components/lich-am/LichAmNam";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { CHU_LICH_AM_NAM } from "@/lib/chu/trang-con";
import { DuongDan } from "@/components/khung/DuongDan";
import { chuLichMayChu, voiHreflang } from "@/lib/en/lich";
import { ldDuongDanEn, metaEn } from "@/lib/en/seo";
import { urlDayDu } from "@/lib/seo";
import { dinhNgay } from "@/lib/dinh-dang";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";

type P = { params: Promise<{ nam: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNamLich((await p.params).nam);
  if (!n) return {};
  const l = await chuLichMayChu();
  // EN-ALL GĐ 8: /en/lunar-calendar/{năm} là rewrite của trang này.
  if (l.en) return metaEn({ title: `${l.c("lan.seo", { nam: String(n) })} · Hieuban`, description: l.c("lan.seo_mo_ta", { nam: String(n) }),
    path: duongLichAm(n, true), vi: duongLichAm(n), noindex: !lichAmIndex(n, Number(homNayVN().slice(0, 4))) });
  // SEO-P: Search Console — "năm 2027 có nhuận không" (nhiều biến thể) là truy vấn chính của cụm này → tiêu đề là đúng câu hỏi,
  // mô tả mở bằng câu trả lời (số tháng nhuận, ngày Tết do engine tính).
  const d = await lichNamCongKhai(n);
  const cauNhuan = d ? (d.thang_nhuan ? `Năm ${n} có nhuận tháng ${d.thang_nhuan} âm lịch (13 tháng).` : `Năm ${n} không có tháng nhuận (12 tháng âm).`) : "";
  const m0 = metaTrang({ tieuDe: `Năm ${n} có nhuận không? Lịch âm ${n}, Tết ngày nào`,
    moTa: d ? `${cauNhuan} Tết ${d.can_chi} ngày ${dmy(d.tet)}. Lịch âm ${n} đủ mùng 1, rằm, ngày lễ, tháng đủ hay thiếu theo âm lịch Việt Nam.`
      : `Lịch âm năm ${n} theo âm lịch Việt Nam: ngày Tết, có tháng nhuận không, mùng 1 và rằm từng tháng ứng với dương lịch, tháng đủ hay thiếu.`,
    duong: duongLichAm(n), anh: anhBai({ tieuDe: `Lịch âm ${n}`, mang: "lich" }) });
  const m = voiHreflang(m0, duongLichAm(n), duongLichAm(n, true));
  return lichAmIndex(n, Number(homNayVN().slice(0, 4))) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNamLich((await p.params).nam);
  if (!n) notFound();
  const [d, gan, lich] = await Promise.all([lichNamCongKhai(n), cacNamLich(Math.max(1901, n - 3), Math.min(2098, n + 5)), lichNgayCongKhai(n)]);
  if (!d) throw new Error("engine lịch không phản hồi");
  const l = await chuLichMayChu();
  if (l.en) return <TrangNamEn n={n} d={d} l={l} />;
  const duong = duongLichAm(n), bien = { nam: String(n), can_chi: d.can_chi };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_LICH_AM_NAM, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  const dd = [{ ten: "Trang chủ", duong: "/" }, { ten: "Lịch âm", duong: "/lich-am" }, { ten: `Lịch âm ${n}`, duong }];
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: ["Âm lịch Việt Nam", `Năm ${d.can_chi}`, "Tết Nguyên đán"] }),
        ldDuongDan(dd),
        ldHoiDap(d.hoi_dap),
      )} />
      {/* TM-1: mục lục /lich-am trước không có link nào trỏ vào (breadcrumb cũ về công cụ đổi lịch). Hiển thị = JSON-LD. */}
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
      </section>
      {/* LA-UI: lịch cả năm âm (tháng / cả năm) ngay dưới câu trả lời nhanh — engine cũ / bận thì bỏ khối, bảng dưới vẫn đủ. */}
      {lich && <LichAmNam d={lich} homNay={homNayVN()} className="mt-6" />}
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
      {/* SEO-O: ngày lễ âm lịch của năm — engine tính (lunar_to_solar), engine cũ không có → ẩn. */}
      {d.le?.length ? (
        <section className="mt-10" aria-labelledby="ngay-le">
          <h2 id="ngay-le" className="text-2xl">Ngày lễ, ngày rằm năm {n} theo âm lịch</h2>
          <p className="mt-2 text-sm text-fg-muted">Ngày dương lịch của các ngày lễ, ngày giỗ hay được hỏi trong năm {d.can_chi}, tính theo âm lịch Việt Nam.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[26rem] text-left text-sm" data-testid="bang-le">
              <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Ngày lễ</th><th className="pr-3">Âm lịch</th><th>Dương lịch</th></tr></thead>
              <tbody>{d.le.map((x) => (
                <tr key={x.ma} className="border-t border-line/50">
                  <td className="py-2 pr-3 text-fg">{x.ten}</td>
                  <td className="pr-3 text-fg-muted">{x.am}</td>
                  <td><Link href={`/xem-ngay-tot/${x.duong}`} className="text-gold underline decoration-gold/40 underline-offset-2">{x.thu}, {dmy(x.duong)}</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      ) : null}
      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-4">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      {/* SEO-O: ảnh tóm tắt có chữ thật (Google Hình ảnh) — alt cùng nguồn với chữ trong ảnh. */}
      <AnhTomTat kieu="lich_am" nam={n} />
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <p className="mt-8 text-sm text-fg-muted">{c("cuoi.chu", bien)} <Link href="/doi-lich-am-duong" className="text-gold underline">{c("cuoi.link", bien)}</Link></p>
      {/* SEO-P: Search Console — người ta hỏi "năm 2028/2029 có nhuận không" cho nhiều năm liền → khối link các năm gần,
          mỗi năm kèm câu trả lời nhuận (engine tính). Engine lỗi → về hai link năm trước / sau như cũ. */}
      {gan && gan.length > 0 ? (
        <section aria-labelledby="nam-gan" className="mt-8" data-testid="nam-gan">
          <h2 id="nam-gan" className="text-xl">Các năm gần {n}: năm nào có tháng nhuận?</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {gan.filter((x) => x.nam !== n).map((x) => (
              <li key={x.nam}>
                <Link href={duongLichAm(x.nam)} className="block rounded-xl border border-line/70 px-3 py-2 text-sm hover:border-gold/50">
                  <b>Lịch âm {x.nam}</b> <span className="text-fg-muted">({x.can_chi})</span>
                  <span className="mt-0.5 block text-xs text-fg-muted">{x.thang_nhuan ? `Nhuận tháng ${x.thang_nhuan}` : "Không nhuận"} · Tết {dmy(x.tet)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-3 flex flex-wrap gap-3 text-sm">
          {n > 1901 && <Link href={duongLichAm(n - 1)} className="text-gold underline">Lịch âm {n - 1}</Link>}
          {n < 2098 && <Link href={duongLichAm(n + 1)} className="text-gold underline">Lịch âm {n + 1}</Link>}
        </p>
      )}
      <MoiXemRieng trang="lich_am" nam={n} className="mt-10" />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));

/** EN-ALL GĐ 8 — /en/lunar-calendar/{năm}: dữ liệu engine bản Anh, chữ lib/chu/lich.ts, không CMS, không ảnh tóm tắt. */
function TrangNamEn({ n, d, l }: { n: number; d: NonNullable<Awaited<ReturnType<typeof lichNamCongKhai>>>; l: Awaited<ReturnType<typeof chuLichMayChu>> }) {
  const { c, ma } = l;
  const ngay = (iso: string) => dinhNgay(iso, ma, "dai");
  const duong = duongLichAm(n, true), nam = String(n);
  const tieuDe = c("lan.h1", { nam });
  const dd = [{ ten: c("la.nhan"), duong: "/en/lunar-calendar" }, { ten: c("la.o", { nam }), duong }];
  const tenThang = (t: number) => (t === 1 ? c("lan.gieng") : t === 12 ? c("lan.chap") : String(t));
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", "@id": `${urlDayDu(duong)}#trang`, url: urlDayDu(duong), name: tieuDe,
        description: d.tra_loi_nhanh, inLanguage: "en", about: [{ "@type": "Thing", name: c("la.ld_about") }] }} />
      <JsonLd data={ldDuongDanEn(dd)} />
      <JsonLd data={goiLd(ldHoiDap(d.hoi_dap))} />
      <DuongDan nhan="Breadcrumb" ds={[{ ten: "Hieuban", duong: "/en" }, ...dd]} className="mb-2" />
      <TieuDeMuc cap={1} nho={c("lan.nhan", { can_chi: d.can_chi })} lon={tieuDe} />
      <TraLoiNhanh chu={d.tra_loi_nhanh} en />
      <section className="mt-8" aria-labelledby="bang-thang">
        <h2 id="bang-thang" className="text-2xl">{c("lan.bang", { nam })}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm" data-testid="bang-lich-am">
            <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">{c("lan.c_thang")}</th><th className="pr-3">{c("la.c_can_chi")}</th><th className="pr-3">{c("lan.c_mung_mot")}</th><th className="pr-3">{c("lan.c_ram")}</th><th>{c("la.c_so_ngay")}</th></tr></thead>
            <tbody>
              {d.thang.map((t) => (
                <tr key={`${t.thang}${t.nhuan ? "n" : ""}`} className="border-t border-line/50">
                  <td className="py-2 pr-3 text-fg">{`${tenThang(t.thang)}${t.nhuan ? c("the.nhuan") : ""}`}</td>
                  <td className="pr-3 text-fg-muted">{t.can_chi}</td>
                  <td className="pr-3"><Link href={duongThang(Number(t.mung_mot.slice(0, 4)), Number(t.mung_mot.slice(5, 7)), true)} className="text-gold underline decoration-gold/40 underline-offset-2">{ngay(t.mung_mot)}</Link></td>
                  <td className="pr-3 text-fg-muted">{ngay(t.ram)}</td>
                  <td className="text-fg-muted">{t.so_ngay === 30 ? c("lan.du") : c("lan.thieu")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-fg-faint">{d.cach_tinh}</p>
      </section>
      {d.le?.length ? (
        <section className="mt-10" aria-labelledby="ngay-le">
          <h2 id="ngay-le" className="text-2xl">{c("lan.le_tieu_de", { nam })}</h2>
          <p className="mt-2 text-sm text-fg-muted">{c("lan.le_dan", { can_chi: d.can_chi })}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[26rem] text-left text-sm" data-testid="bang-le">
              <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">{c("lan.c_le")}</th><th className="pr-3">{c("lan.c_am")}</th><th>{c("lan.c_duong")}</th></tr></thead>
              <tbody>{d.le.map((x) => (
                <tr key={x.ma} className="border-t border-line/50">
                  <td className="py-2 pr-3 text-fg">{x.ten}</td>
                  <td className="pr-3 text-fg-muted">{x.am}</td>
                  <td><Link href={duongNgay(x.duong, true)} className="text-gold underline decoration-gold/40 underline-offset-2">{dinhNgay(x.duong, ma, "day_du")}</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      ) : null}
      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">{c("con.hoi_dap")}</h2>
        <dl className="mt-4 space-y-4">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <p className="mt-8 text-sm text-fg-muted">{c("lan.cuoi_chu")} <Link href="/en/lunar-converter" className="text-gold underline">{c("lan.cuoi_link")}</Link></p>
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        {n > 1901 && <Link href={duongLichAm(n - 1, true)} className="text-gold underline">{c("la.o", { nam: String(n - 1) })}</Link>}
        {n < 2098 && <Link href={duongLichAm(n + 1, true)} className="text-gold underline">{c("la.o", { nam: String(n + 1) })}</Link>}
      </p>
    </div>
  );
}
