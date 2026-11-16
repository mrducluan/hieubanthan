// NAM-1 — /lich-am trước đây 404 (chỉ có /lich-am/{năm}): mục lục các năm (năm âm hiện tại −2 … +3, cùng cửa sổ sitemap
// SEO-L5) + lối sang công cụ đổi lịch. Năm lấy từ engine (tự trượt sau Tết).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { namAmHienTai } from "@/lib/tuoi-dan-gian";
import { cacNamLich, duongLichAm, lichNgayCongKhai } from "@/lib/lich-am";
import { LichAmNam } from "@/components/lich-am/LichAmNam";
import { homNayVN } from "@/lib/hoang-lich";
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import { TraLoiNhanh, HoiDapHien } from "@/components/seo/TraLoiNhanh";
import { dmy } from "@/lib/nam";
import { duongNam } from "@/lib/nam";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { chuLichMayChu, voiHreflang } from "@/lib/en/lich";
import { ldDuongDanEn, metaEn } from "@/lib/en/seo";
import { urlDayDu } from "@/lib/seo";
import { CON_GIAP_EN } from "@/lib/chu/lich";
import { dinhNgay } from "@/lib/dinh-dang";

const DUONG = "/lich-am";
const MAC = { tieuDe: "Lịch âm các năm: Tết, tháng nhuận, mùng 1 và rằm",
  moTa: "Lịch âm Việt Nam từng năm: ngày Tết, năm có tháng nhuận không, mùng 1 và rằm từng tháng ứng với dương lịch, tháng đủ hay thiếu. Kèm công cụ đổi ngày âm dương." };

const DUONG_EN = "/en/lunar-calendar";

export async function generateMetadata(): Promise<Metadata> {
  const { en, c } = await chuLichMayChu();
  // EN-ALL GĐ 8: /en/lunar-calendar là rewrite của trang này.
  if (en) return metaEn({ title: `${c("la.seo")} · Hieuban`, description: c("la.seo_mo_ta"), path: DUONG_EN, vi: DUONG });
  return voiHreflang(apDungSeo(metaTrang({ ...MAC, duong: DUONG }), await layNoiDungTrang(DUONG)), DUONG, DUONG_EN);
}

export default async function Page() {
  if ((await chuLichMayChu()).en) return <TrangEn />;
  const [namAm, nd] = await Promise.all([namAmHienTai(), layNoiDungTrang(DUONG)]);
  const ds = Array.from({ length: 6 }, (_, i) => namAm - 2 + i);
  const h1 = nd.dau.h1 ?? "Lịch âm các năm: Tết ngày nào, năm nào nhuận?";
  // SEO-O: bảng Tết 15 năm (engine tính) + trả lời nhanh + hỏi đáp — trước trang chỉ có 6 ô năm (~190 chữ).
  const [bang, lich] = await Promise.all([cacNamLich(namAm - 2, namAm + 12), lichNgayCongKhai(namAm)]);
  const toi = bang?.find((x) => x.nam === namAm + 1);
  const tlNhanh = toi ? `Tết Nguyên đán ${toi.nam} (năm ${toi.can_chi}) rơi vào ngày ${dmy(toi.tet)} dương lịch; năm âm lịch ${toi.nam} `
    + (toi.thang_nhuan ? `có tháng ${toi.thang_nhuan} nhuận (13 tháng, ${toi.so_ngay} ngày).` : `có 12 tháng, ${toi.so_ngay} ngày.`) : null;
  const nhuan = bang?.filter((x) => x.thang_nhuan) ?? [];
  const hoiDap = bang ? [
    ...(toi ? [{ hoi: `Tết ${toi.nam} là ngày nào?`, dap: `Mùng 1 Tết ${toi.can_chi} là ngày ${dmy(toi.tet)} dương lịch, theo âm lịch Việt Nam.` }] : []),
    { hoi: `Những năm nào có tháng nhuận từ ${bang[0]!.nam} đến ${bang[bang.length - 1]!.nam}?`,
      dap: nhuan.length ? nhuan.map((x) => `${x.nam} (nhuận tháng ${x.thang_nhuan})`).join(", ") + "." : "Không có năm nhuận trong khoảng này." },
    { hoi: "Vì sao năm âm lịch có năm 13 tháng?", dap: "Mười hai tháng âm ngắn hơn năm dương khoảng 11 ngày; cứ khoảng 3 năm lịch thêm một tháng nhuận để Tết không trôi khỏi đầu mùa xuân. Tháng nhuận là tháng đầu tiên không chứa trung khí." },
  ] : [];
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: h1, tomTat: MAC.moTa, about: ["Âm lịch Việt Nam"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Lịch âm", duong: DUONG }]),
      )} />
      <TieuDeMuc cap={1} nho="Âm lịch Việt Nam" lon={h1}
        mo_ta={nd.dau.loiDan ?? "Tính theo giờ Hà Nội (thuật toán Hồ Ngọc Đức). Chọn một năm để xem Tết, tháng nhuận, mùng 1 và rằm từng tháng."} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mb-6" />
      {tlNhanh && <div className="mb-6"><TraLoiNhanh chu={tlNhanh} /></div>}
      {/* LA-UI: lịch năm âm ĐANG ĐI (có hôm nay) — năm khác chọn ở các ô bên dưới. */}
      {lich && <LichAmNam d={lich} homNay={homNayVN()} className="mb-6" />}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ds.map((n) => (
          <li key={n}><Link href={duongLichAm(n)} className="block rounded-xl border border-line/70 p-4 text-center hover:border-gold/50">
            <span className="font-serif text-xl text-fg">Lịch âm {n}</span>
            {n === namAm && <span className="mt-0.5 block text-xs text-gold">Năm âm lịch đang đi</span>}
          </Link></li>
        ))}
      </ul>
      {bang && (
        <section className="mt-8" aria-labelledby="bang-tet">
          <h2 id="bang-tet" className="text-2xl">Ngày Tết và tháng nhuận {bang[0]!.nam}–{bang[bang.length - 1]!.nam}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm" data-testid="bang-tet">
              <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Năm</th><th className="pr-3">Can chi</th><th className="pr-3">Mùng 1 Tết</th><th className="pr-3">Tháng nhuận</th><th>Số ngày</th></tr></thead>
              <tbody>{bang.map((x) => (
                <tr key={x.nam} className="border-t border-line/50">
                  <td className="py-2 pr-3"><Link href={duongLichAm(x.nam)} className="text-gold underline decoration-gold/40 underline-offset-2">Lịch âm {x.nam}</Link></td>
                  <td className="pr-3 text-fg">{x.can_chi} <span className="text-fg-faint">(tuổi {x.con_giap})</span></td>
                  <td className="pr-3 text-fg-muted">{dmy(x.tet)}</td>
                  <td className="pr-3 text-fg-muted">{x.thang_nhuan ? `Tháng ${x.thang_nhuan}` : "Không"}</td>
                  <td className="text-fg-muted">{x.so_ngay}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}
      <AnhTomTat kieu="lich_am" nam={namAm + 1} />
      <section className="mt-8" aria-labelledby="cach-tinh">
        <h2 id="cach-tinh" className="text-2xl">Âm lịch Việt Nam tính thế nào</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">Mùng 1 là ngày có điểm sóc (Mặt Trăng nằm giữa Trái Đất và Mặt Trời) tính theo giờ Hà Nội; tháng nào không chứa trung khí đầu tiên trong năm là tháng nhuận, nên năm nhuận có 13 tháng. Lịch Trung Quốc tính theo giờ Bắc Kinh (UTC+8), vì vậy có năm Tết hai nước lệch nhau một ngày, hiếm hơn là lệch cả tháng.</p>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">Mỗi trang năm ghi ngày Tết, tháng nhuận, mùng 1 và rằm từng tháng ứng với dương lịch, tháng đủ (30 ngày) hay thiếu (29 ngày) — bấm ngày mùng 1 để xem ngày tốt của cả tháng đó.</p>
      </section>
      <p className="mt-6 text-sm text-fg-muted">Đổi một ngày cụ thể: <Link href="/doi-lich-am-duong" className="text-gold underline">công cụ đổi lịch âm dương</Link>. Năm con gì, Tết, Tam tai: <Link href={duongNam(namAm + 1)} className="text-gold underline">năm {namAm + 1}</Link>.</p>
      {hoiDap.length > 0 && <div className="mt-8"><HoiDapHien ds={hoiDap} /><JsonLd data={goiLd(ldHoiDap(hoiDap))} /></div>}
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-8" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-10" />
    </div>
  );
}

/** EN-ALL GĐ 8 — /en/lunar-calendar: cùng dữ liệu engine (bản Anh), chữ lib/chu/lich.ts, không CMS, không ảnh tóm tắt. */
async function TrangEn() {
  const { c, ma } = await chuLichMayChu();
  const namAm = await namAmHienTai();
  const ds = Array.from({ length: 6 }, (_, i) => namAm - 2 + i);
  const bang = await cacNamLich(namAm - 2, namAm + 12);
  const ngay = (iso: string) => dinhNgay(iso, ma, "dai");
  const toi = bang?.find((x) => x.nam === namAm + 1);
  const tl = toi ? c("la.tl", { nam: String(toi.nam), can_chi: toi.can_chi, tet: ngay(toi.tet),
    sau: toi.thang_nhuan ? c("la.tl_nhuan", { thang: String(toi.thang_nhuan), so: String(toi.so_ngay) }) : c("la.tl_thuong", { so: String(toi.so_ngay) }) }) : null;
  const nhuan = bang?.filter((x) => x.thang_nhuan) ?? [];
  const hoiDap = bang ? [
    ...(toi ? [{ hoi: c("la.h_tet", { nam: String(toi.nam) }), dap: c("la.d_tet", { can_chi: toi.can_chi, tet: ngay(toi.tet) }) }] : []),
    { hoi: c("la.h_nhuan", { tu: String(bang[0]!.nam), den: String(bang[bang.length - 1]!.nam) }),
      dap: nhuan.length ? nhuan.map((x) => c("la.d_nhuan_mot", { nam: String(x.nam), thang: String(x.thang_nhuan) })).join(", ") + "." : c("la.d_nhuan_khong") },
    { hoi: c("la.h_13"), dap: c("la.d_13") },
  ] : [];
  const h1 = c("la.h1");
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", "@id": `${urlDayDu(DUONG_EN)}#trang`, url: urlDayDu(DUONG_EN), name: h1,
        description: c("la.seo_mo_ta"), inLanguage: "en", about: [{ "@type": "Thing", name: c("la.ld_about") }] }} />
      <JsonLd data={ldDuongDanEn([{ ten: c("la.nhan"), duong: DUONG_EN }])} />
      <TieuDeMuc cap={1} nho={c("la.nhan")} lon={h1} mo_ta={c("la.dan")} />
      {tl && <div className="mb-6"><TraLoiNhanh chu={tl} en /></div>}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ds.map((n) => (
          <li key={n}><Link href={duongLichAm(n, true)} className="block rounded-xl border border-line/70 p-4 text-center hover:border-gold/50">
            <span className="font-serif text-xl text-fg">{c("la.o", { nam: String(n) })}</span>
            {n === namAm && <span className="mt-0.5 block text-xs text-gold">{c("la.dang_di")}</span>}
          </Link></li>
        ))}
      </ul>
      {bang && (
        <section className="mt-8" aria-labelledby="bang-tet">
          <h2 id="bang-tet" className="text-2xl">{c("la.bang", { tu: String(bang[0]!.nam), den: String(bang[bang.length - 1]!.nam) })}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm" data-testid="bang-tet">
              <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">{c("la.c_nam")}</th><th className="pr-3">{c("la.c_can_chi")}</th><th className="pr-3">{c("la.c_tet")}</th><th className="pr-3">{c("la.c_nhuan")}</th><th>{c("la.c_so_ngay")}</th></tr></thead>
              <tbody>{bang.map((x) => (
                <tr key={x.nam} className="border-t border-line/50">
                  <td className="py-2 pr-3"><Link href={duongLichAm(x.nam, true)} className="text-gold underline decoration-gold/40 underline-offset-2">{c("la.o", { nam: String(x.nam) })}</Link></td>
                  <td className="pr-3 text-fg">{x.can_chi} <span className="text-fg-faint">{c("la.tuoi", { con: CON_GIAP_EN[x.con_giap] ?? x.con_giap })}</span></td>
                  <td className="pr-3 text-fg-muted">{ngay(x.tet)}</td>
                  <td className="pr-3 text-fg-muted">{x.thang_nhuan ? c("la.thang", { thang: String(x.thang_nhuan) }) : c("la.khong")}</td>
                  <td className="text-fg-muted">{x.so_ngay}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}
      <section className="mt-8" aria-labelledby="cach-tinh">
        <h2 id="cach-tinh" className="text-2xl">{c("la.cach_tieu_de")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{c("la.cach_1")}</p>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{c("la.cach_2")}</p>
      </section>
      <p className="mt-6 text-sm text-fg-muted">{c("la.doi")} <Link href="/en/lunar-converter" className="text-gold underline">{c("la.doi_link")}</Link>.</p>
      {hoiDap.length > 0 && <div className="mt-8"><HoiDapHienEn ds={hoiDap} tieuDe={c("con.hoi_dap")} /><JsonLd data={goiLd(ldHoiDap(hoiDap))} /></div>}
    </div>
  );
}

function HoiDapHienEn({ ds, tieuDe }: { ds: { hoi: string; dap: string }[]; tieuDe: string }) {
  return (
    <section aria-labelledby="hoi-dap" className="space-y-3">
      <h2 id="hoi-dap" className="text-xl">{tieuDe}</h2>
      <dl className="space-y-3">{ds.map((h) => (
        <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
      ))}</dl>
    </section>
  );
}
