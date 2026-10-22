// SEO-F → SEO-K (chủ dự án duyệt 2026-10-21): "Tuổi X hợp hướng nào?" — MỘT trang cho cả nam và nữ cùng năm sinh
// (46 trang 1960–2005), server-render từ engine (mệnh quái Bát trạch, du niên, KB). Bản cũ "tuoi-1990-nam|nu" 308 về
// đây (next.config.mjs; trang này tự chuyển khi ai gọi thẳng). Cấu trúc GEO: câu hỏi làm tiêu đề · trả lời nhanh ·
// hai la bàn nam/nữ · hướng chung vợ chồng cùng tuổi · bảng 8 hướng · bố trí · mốc đầu năm · hỏi đáp · cùng tuổi.
import { KhoiCms } from "@/components/cms/KhoiCms";
import { layNoiDungTrang } from "@/lib/noi-dung-trang";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { LaBan } from "@/components/huyen-hoc/LaBan";
import { CungTuoi } from "@/components/tuoi/CungTuoi";
import { duongTuoi, slugTuoiGop, tuoiHuong, type TuoiHuong, type TuoiTheoGioi } from "@/lib/kien-thuc";
import { anhBai, catMoTa, goiLd, ldAnh, ldDuongDan, ldHoiDap, siteUrl, TEN_SITE, tieuDeSeo, urlDayDu } from "@/lib/seo";
import { duongMoi } from "@/lib/duong-silo";
import { namAmHienTai } from "@/lib/tuoi-dan-gian";

export const revalidate = 21600;

type Props = { params: Promise<{ slug: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");
const GIOI = { nam: "Nam", nu: "Nữ" } as const;

/** Ảnh đại diện: la bàn tô hướng tốt chung (hoặc của nam khi hai người khác nhóm). */
const anhTuoi = (t: TuoiHuong) => anhBai({
  tieuDe: t.tieu_de, mang: "phong-thuy",
  tot: t.huong_chung.length ? t.huong_chung : t.gioi[0]!.huong_tot.map((h) => h.huong),
  nhan: `Nam ${t.gioi[0]!.menh_quai.quai} · Nữ ${t.gioi[1]!.menh_quai.quai} · ${t.can_chi}`,
});

export async function generateMetadata({ params: thamSo }: Props): Promise<Metadata> {
  const params = await thamSo;
  const t = await tuoiHuong(params.slug);
  if (!t) return { title: "Không tìm thấy", robots: { index: false } };
  const duong = duongTuoi(t.slug);
  const anh = anhTuoi(t);
  return {
    title: tieuDeSeo(t.tieu_de),
    description: catMoTa(t.mo_ta),
    keywords: [`tuổi ${t.can_chi.toLowerCase()} hợp hướng nào`, `sinh năm ${t.nam} hợp hướng nào`, `hướng nhà tuổi ${t.nam}`,
      `nam ${t.nam} hợp hướng nào`, `nữ ${t.nam} hợp hướng nào`, `mệnh ${t.gioi[0]!.menh_quai.quai.toLowerCase()}`],
    alternates: { canonical: duong, types: { "text/markdown": `${duong}.md` } },
    openGraph: { type: "article", title: t.tieu_de, description: catMoTa(t.mo_ta), url: duong, locale: "vi_VN", siteName: TEN_SITE,
      images: [{ url: anh, width: 1200, height: 630, alt: t.tieu_de }] },
    twitter: { card: "summary_large_image", title: t.tieu_de, description: catMoTa(t.mo_ta), images: [anh] },
  };
}

function The({ ten, h }: { ten: string; h: TuoiTheoGioi["huong_tot"][number] }) {
  return (
    <li className="rounded-xl border border-line/70 p-4">
      <p className="text-sm text-fg-faint">{ten}</p>
      <p className="mt-1 text-lg text-fg"><b>{h.huong}</b> · {h.du_nien}</p>
      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{h.y_nghia} <span className="text-fg-faint">Hợp cho: {h.dung_cho}.</span></p>
    </li>
  );
}

function PhanGioi({ t, g }: { t: TuoiHuong; g: TuoiTheoGioi }) {
  const id = `${g.gioi_tinh}-${t.nam}`;
  return (
    <section className="mt-12" aria-labelledby={id}>
      <h2 id={id} className="scroll-mt-24 text-2xl sm:text-3xl">{GIOI[g.gioi_tinh]} sinh năm {t.nam}: mệnh {g.menh_quai.quai} ({g.menh_quai.nhom})</h2>
      <p className="mt-2 leading-relaxed text-fg-muted">{g.tra_loi_nhanh}</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section aria-label={`4 hướng tốt của ${GIOI[g.gioi_tinh].toLowerCase()} ${t.nam}`}>
          <h3 className="text-xl">4 hướng tốt (xếp từ tốt nhất)</h3>
          <ol className="mt-3 grid gap-3">{g.huong_tot.map((h, i) => <The key={h.huong} ten={`Hướng tốt ${i + 1}`} h={h} />)}</ol>
        </section>
        <section aria-label={`4 hướng nên tránh của ${GIOI[g.gioi_tinh].toLowerCase()} ${t.nam}`}>
          <h3 className="text-xl">4 hướng nên tránh</h3>
          <ol className="mt-3 grid gap-3">{g.huong_xau.map((h, i) => <The key={h.huong} ten={`Hướng xấu ${i + 1}`} h={h} />)}</ol>
        </section>
      </div>
      <h3 className="mt-8 text-xl">Cửa, bếp, giường, bàn làm việc cho {GIOI[g.gioi_tinh].toLowerCase()} {t.nam}</h3>
      <div className="mt-3 space-y-3">
        {g.goi_y.map((x) => (
          <div key={x.ma} className="rounded-xl border border-line/70 p-4">
            <p className="font-medium text-fg">{x.tieu_de}: <span className="text-gold">{x.huong.join(" → ")}</span></p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{x.noi_dung}{x.nguon === "dan_gian" ? " (quan niệm dân gian)" : ""}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function Page({ params: thamSo }: Props) {
  const params = await thamSo;
  const cu = slugTuoiGop(params.slug);
  if (cu) permanentRedirect(duongTuoi(cu));            // SEO-K: bản một giới tính → bản gộp (308)
  const t = await tuoiHuong(params.slug);
  if (!t) notFound();
  const duong = duongTuoi(t.slug);
  const [nd, namAm] = await Promise.all([layNoiDungTrang(duong, { tieu_de: t.tieu_de }), namAmHienTai()]);  // ND-5: mẫu cụm "Tuổi hợp hướng"
  const [gNam, gNu] = t.gioi as [TuoiTheoGioi, TuoiTheoGioi];
  const anh = anhTuoi(t);
  const ld = goiLd(
    {
      "@type": "Article", "@id": `${urlDayDu(duong)}#bai`, headline: t.tieu_de, description: t.mo_ta, inLanguage: "vi-VN",
      mainEntityOfPage: { "@id": `${urlDayDu(duong)}#trang` }, image: ldAnh(anh, `La bàn 8 hướng tuổi ${t.can_chi} ${t.nam}`),
      // BM-1 / EEAT-1: bài chưa thẩm định ghi tác giả là ban biên tập; chủ biên = editor.
      author: { "@type": "Organization", name: `Ban biên tập ${TEN_SITE}`, url: siteUrl() },
      editor: { "@id": `${siteUrl()}/tac-gia/duc-luan#nguoi` },
      publisher: { "@id": `${siteUrl()}/#to-chuc` }, isPartOf: { "@id": `${siteUrl()}/#website` },
      isAccessibleForFree: true, citation: t.nguon, abstract: t.tra_loi_nhanh,
      ...(t.ngay_dang ? { datePublished: t.ngay_dang, dateModified: t.cap_nhat ?? t.ngay_dang } : {}),
      about: [
        { "@type": "Thing", name: "Phong thuỷ Bát trạch", sameAs: "https://en.wikipedia.org/wiki/Feng_shui" },
        { "@type": "Thing", name: `Mệnh ${gNam.menh_quai.quai}` }, { "@type": "Thing", name: `Mệnh ${gNu.menh_quai.quai}` },
      ],
      keywords: `tuổi ${t.can_chi} hợp hướng nào, sinh năm ${t.nam} hợp hướng nào, hướng nhà tuổi ${t.nam}, hướng bếp, hướng giường`,
      ...(t.trang_thai === "da_duyet" ? { creativeWorkStatus: "Published" } : {}),
    },
    { "@type": "WebPage", "@id": `${urlDayDu(duong)}#trang`, url: urlDayDu(duong), name: t.tieu_de, inLanguage: "vi-VN",
      isPartOf: { "@id": `${siteUrl()}/#website` }, primaryImageOfPage: ldAnh(anh, t.tieu_de) },
    ldHoiDap(t.hoi_dap),
    ldDuongDan([
      { ten: "Trang chủ", duong: "/" }, { ten: "Phong thuỷ", duong: "/phong-thuy" },
      { ten: "Hướng hợp tuổi", duong: "/phong-thuy/huong-hop-tuoi" }, { ten: t.tieu_de, duong },
    ]),
  );
  return (
    <article className="mx-auto max-w-3xl" data-testid="tuoi-huong">
      <JsonLd data={ld} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint">
        <Link href="/phong-thuy" className="hover:text-fg">Phong thuỷ</Link> › <Link href="/phong-thuy/huong-hop-tuoi" className="hover:text-fg">Hướng hợp tuổi</Link>
      </nav>
      <header className="mt-4">
        <h1 className="text-3xl leading-tight sm:text-5xl">{t.tieu_de}</h1>
        <p className="mt-3 text-sm text-fg-muted">
          Năm {t.can_chi} · nạp âm {t.trang_menh ? <Link href={duongMoi(t.trang_menh)} className="underline decoration-gold/50 underline-offset-2 hover:text-fg">{t.nap_am.ten}</Link> : t.nap_am.ten} ({t.nap_am.hanh}) ·
          nam mệnh quái <b className="text-gold">{gNam.menh_quai.quai}</b> · nữ mệnh quái <b className="text-gold">{gNu.menh_quai.quai}</b>
        </p>
        <p className="mt-2 flex flex-wrap gap-2 text-sm">
          <a href={`#nam-${t.nam}`} className="rounded-full border border-line px-3 py-1 text-fg-muted hover:border-gold/50 hover:text-fg">Nam {t.nam}</a>
          <a href={`#nu-${t.nam}`} className="rounded-full border border-line px-3 py-1 text-fg-muted hover:border-gold/50 hover:text-fg">Nữ {t.nam}</a>
        </p>
      </header>
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mt-6" />

      <section aria-label="Trả lời nhanh" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 text-lg leading-relaxed text-fg">{t.tra_loi_nhanh}</p>
      </section>

      <section className="mt-8" aria-labelledby="la-ban">
        <h2 id="la-ban" className="text-2xl">La bàn 8 hướng: nam và nữ sinh năm {t.nam}</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {t.gioi.map((g) => (
            <div key={g.gioi_tinh}>
              <p className="mb-2 text-center text-sm text-fg-muted">{GIOI[g.gioi_tinh]} · mệnh {g.menh_quai.quai}</p>
              <LaBan quai={g.menh_quai.quai} nhom={g.menh_quai.nhom} bang={g.bang_huong} huongCat={g.huong_tot.map((h) => h.huong)} />
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-line/70 p-4 text-sm leading-relaxed text-fg-muted">
          {t.huong_chung.length
            ? <>Vợ chồng cùng tuổi {t.can_chi} có hướng tốt chung: <b className="text-jade">{t.huong_chung.join(", ")}</b> — ưu tiên cho cửa chính và phòng chung.</>
            : <>Nam ({gNam.menh_quai.nhom}) và nữ ({gNu.menh_quai.nhom}) sinh cùng năm không có hướng tốt chung. Thường ưu tiên mệnh người trụ cột cho cửa chính, phòng riêng theo mệnh từng người.</>}
        </p>
      </section>

      <PhanGioi t={t} g={gNam} />
      <PhanGioi t={t} g={gNu} />

      <section className="mt-10 rounded-2xl border border-line/70 bg-surface/40 p-5" aria-labelledby="moc">
        <h2 id="moc" className="text-xl">Sinh đầu năm {t.nam}? Kiểm tra mốc đầu năm</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
          <li>Lập xuân {t.nam}: <b className="text-fg">{dmy(t.moc_dau_nam.lap_xuan)}</b> (mốc Bát trạch dùng mặc định).</li>
          <li>Tết âm lịch {t.can_chi}: <b className="text-fg">{dmy(t.moc_dau_nam.tet_viet)}</b> theo lịch Việt Nam{t.moc_dau_nam.tet_lech ? <>, <b className="text-fg">{dmy(t.moc_dau_nam.tet_trung)}</b> theo lịch Trung Quốc</> : null}.</li>
          <li>Sinh trước mốc thì tính theo năm {t.sinh_truoc_moc.nam_tinh}: nam mệnh <b className="text-fg">{gNam.sinh_truoc_moc.quai}</b>, nữ mệnh <b className="text-fg">{gNu.sinh_truoc_moc.quai}</b>
            {t.sinh_truoc_moc.slug && <> — <Link href={duongTuoi(t.sinh_truoc_moc.slug)} className="text-gold underline">xem trang tuổi {t.sinh_truoc_moc.nam_tinh}</Link></>}.</li>
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-4">
          {t.hoi_dap.map((h) => (
            <div key={h.hoi} className="rounded-xl border border-line/70 p-4">
              <dt className="font-medium text-fg">{h.hoi}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd>
            </div>
          ))}
        </dl>
      </section>

      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-10" />
      <aside className="glass mt-10 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <Compass className="size-6 shrink-0 text-gold" aria-hidden />
        <p className="flex-1 text-fg-muted">Tính theo <b className="text-fg">ngày sinh chính xác</b> của bạn (tự xét Lập xuân/Tết), đo hướng nhà bằng la bàn điện thoại, xem bố cục cả nhà.</p>
        <Button asChild><Link href="/phong-thuy">Mở công cụ <ArrowRight aria-hidden /></Link></Button>
      </aside>

      <CungTuoi namSinh={t.nam} canChi={t.can_chi} namAm={namAm} bo="huong" />
      <nav className="mt-8" aria-labelledby="tuoi-khac">
        <h2 id="tuoi-khac" className="text-xl">Năm sinh khác</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {[
            ...(t.nam > 1960 ? [[`tuoi-${t.nam - 1}`, `Tuổi ${t.nam - 1}`]] : []),
            ...(t.nam < 2005 ? [[`tuoi-${t.nam + 1}`, `Tuổi ${t.nam + 1}`]] : []),
            ["huong-hop-tuoi", "Tất cả năm sinh"],
          ].map(([s, chu]) => (
            <li key={s}><Link href={duongTuoi(s!)} className="inline-flex rounded-full border border-line px-3 py-1.5 text-fg-muted hover:border-gold/50 hover:text-fg">{chu}</Link></li>
          ))}
        </ul>
      </nav>

      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
      <footer className="mt-10 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        <p>Nguồn: {t.nguon}. Lời giải thích do Ban biên tập Hiểu Bản Thân biên soạn · Chủ biên Đức Luân duyệt xuất bản.</p>
        {t.luu_y.filter(Boolean).map((l) => <p key={l} className="mt-2">{l}</p>)}
      </footer>
    </article>
  );
}
