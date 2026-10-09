// SEO-F — "Tuổi X (nam/nữ) hợp hướng nào?": 92 trang server-render từ engine (mệnh quái Bát trạch, du niên, KB).
// Cấu trúc GEO: câu hỏi làm tiêu đề · trả lời nhanh · la bàn + bảng 8 hướng · gợi ý bố trí · mốc đầu năm · hỏi đáp.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { LaBan } from "@/components/huyen-hoc/LaBan";
import { duongTuoi, tuoiHuong, type TuoiHuong } from "@/lib/kien-thuc";
import { catMoTa, goiLd, ldDuongDan, ldHoiDap, siteUrl, TEN_SITE, tieuDeSeo, urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

type Props = { params: Promise<{ slug: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");
const GIOI = { nam: "Nam", nu: "Nữ" } as const;

export async function generateMetadata({ params: thamSo }: Props): Promise<Metadata> {
  const params = await thamSo;
  const t = await tuoiHuong(params.slug);
  if (!t) return { title: "Không tìm thấy", robots: { index: false } };
  const duong = duongTuoi(t.slug);
  const anh = `/og?tieu_de=${encodeURIComponent(t.tieu_de)}`;
  return {
    title: tieuDeSeo(t.tieu_de),
    description: catMoTa(t.mo_ta),
    alternates: { canonical: duong, types: { "text/markdown": `${duong}.md` } },
    openGraph: { type: "article", title: t.tieu_de, description: catMoTa(t.mo_ta), url: duong, locale: "vi_VN", siteName: TEN_SITE, images: [anh] },
    twitter: { card: "summary_large_image", title: t.tieu_de, description: catMoTa(t.mo_ta), images: [anh] },
  };
}

function The({ ten, h }: { ten: string; h: TuoiHuong["huong_tot"][number] }) {
  return (
    <li className="rounded-xl border border-line/70 p-4">
      <p className="text-sm text-fg-faint">{ten}</p>
      <p className="mt-1 text-lg text-fg"><b>{h.huong}</b> · {h.du_nien}</p>
      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{h.y_nghia} <span className="text-fg-faint">Hợp cho: {h.dung_cho}.</span></p>
    </li>
  );
}

export default async function Page({ params: thamSo }: Props) {
  const params = await thamSo;
  const t = await tuoiHuong(params.slug);
  if (!t) notFound();
  const duong = duongTuoi(t.slug);
  const khac = t.gioi_tinh === "nam" ? "nu" : "nam";
  const ld = goiLd(
    {
      "@type": "Article", "@id": `${urlDayDu(duong)}#bai`, headline: t.tieu_de, description: t.mo_ta, inLanguage: "vi-VN",
      mainEntityOfPage: urlDayDu(duong), image: urlDayDu(`/og?tieu_de=${encodeURIComponent(t.tieu_de)}`),
      author: { "@type": "Organization", name: TEN_SITE, url: siteUrl() }, publisher: { "@id": `${siteUrl()}/#to-chuc` },
      isAccessibleForFree: true, about: ["Phong thuỷ Bát trạch", `Mệnh ${t.menh_quai.quai}`], citation: t.nguon,
      abstract: t.tra_loi_nhanh, creativeWorkStatus: t.trang_thai === "da_duyet" ? "Published" : "Draft",
    },
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
          {GIOI[t.gioi_tinh]} · năm {t.can_chi} · nạp âm {t.trang_menh ? <Link href={t.trang_menh} className="underline decoration-gold/50 underline-offset-2 hover:text-fg">{t.nap_am.ten}</Link> : t.nap_am.ten} ({t.nap_am.hanh}) · mệnh quái <b className="text-gold">{t.menh_quai.quai}</b> · {t.menh_quai.nhom}
        </p>
      </header>

      <section aria-label="Trả lời nhanh" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 text-lg leading-relaxed text-fg">{t.tra_loi_nhanh}</p>
      </section>

      <section className="mt-8" aria-labelledby="la-ban">
        <h2 id="la-ban" className="text-2xl">La bàn 8 hướng của mệnh {t.menh_quai.quai}</h2>
        <div className="mt-4"><LaBan quai={t.menh_quai.quai} nhom={t.menh_quai.nhom} bang={t.bang_huong} huongCat={t.huong_tot.map((h) => h.huong)} /></div>
      </section>

      <section className="mt-8" aria-labelledby="huong-tot">
        <h2 id="huong-tot" className="text-2xl">4 hướng tốt (xếp từ tốt nhất)</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">{t.huong_tot.map((h, i) => <The key={h.huong} ten={`Hướng tốt ${i + 1}`} h={h} />)}</ol>
      </section>
      <section className="mt-8" aria-labelledby="huong-xau">
        <h2 id="huong-xau" className="text-2xl">4 hướng nên tránh</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">{t.huong_xau.map((h, i) => <The key={h.huong} ten={`Hướng xấu ${i + 1}`} h={h} />)}</ol>
      </section>

      <section className="mt-8" aria-labelledby="bo-tri">
        <h2 id="bo-tri" className="text-2xl">Cửa, bếp, giường, bàn làm việc</h2>
        <div className="mt-4 space-y-3">
          {t.goi_y.map((g) => (
            <div key={g.ma} className="rounded-xl border border-line/70 p-4">
              <p className="font-medium text-fg">{g.tieu_de}: <span className="text-gold">{g.huong.join(" → ")}</span></p>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{g.noi_dung}{g.nguon === "dan_gian" ? " (quan niệm dân gian)" : ""}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-line/70 bg-surface/40 p-5" aria-labelledby="moc">
        <h2 id="moc" className="text-xl">Sinh đầu năm {t.nam}? Kiểm tra mốc đầu năm</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-fg-muted">
          <li>Lập xuân {t.nam}: <b className="text-fg">{dmy(t.moc_dau_nam.lap_xuan)}</b> (mốc Bát trạch dùng mặc định).</li>
          <li>Tết âm lịch {t.can_chi}: <b className="text-fg">{dmy(t.moc_dau_nam.tet_viet)}</b> theo lịch Việt Nam{t.moc_dau_nam.tet_lech ? <>, <b className="text-fg">{dmy(t.moc_dau_nam.tet_trung)}</b> theo lịch Trung Quốc</> : null}.</li>
          <li>Sinh trước mốc thì tính theo năm {t.sinh_truoc_moc.nam_tinh}: mệnh <b className="text-fg">{t.sinh_truoc_moc.quai}</b> ({t.sinh_truoc_moc.nhom})
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

      <aside className="glass mt-10 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <Compass className="size-6 shrink-0 text-gold" aria-hidden />
        <p className="flex-1 text-fg-muted">Tính theo <b className="text-fg">ngày sinh chính xác</b> của bạn (tự xét Lập xuân/Tết), đo hướng nhà bằng la bàn điện thoại, xem bố cục cả nhà.</p>
        <Button asChild><Link href="/phong-thuy">Mở công cụ <ArrowRight aria-hidden /></Link></Button>
      </aside>

      <nav className="mt-10" aria-labelledby="tuoi-khac">
        <h2 id="tuoi-khac" className="text-xl">Tuổi khác</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {[
            [`tuoi-${t.nam}-${khac}`, `${GIOI[khac]} ${t.nam}`],
            ...(t.nam > 1960 ? [[`tuoi-${t.nam - 1}-${t.gioi_tinh}`, `${GIOI[t.gioi_tinh]} ${t.nam - 1}`]] : []),
            ...(t.nam < 2005 ? [[`tuoi-${t.nam + 1}-${t.gioi_tinh}`, `${GIOI[t.gioi_tinh]} ${t.nam + 1}`]] : []),
            ["huong-hop-tuoi", "Tất cả năm sinh"],
          ].map(([s, chu]) => (
            <li key={s}><Link href={duongTuoi(s!)} className="inline-flex rounded-full border border-line px-3 py-1.5 text-fg-muted hover:border-gold/50 hover:text-fg">{chu}</Link></li>
          ))}
        </ul>
      </nav>

      <footer className="mt-10 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        <p>Nguồn: {t.nguon}. {t.trang_thai === "da_duyet" ? "" : "Lời giải thích biên soạn có AI hỗ trợ, đang chờ chuyên gia thẩm định. "}</p>
        {t.luu_y.filter(Boolean).map((l) => <p key={l} className="mt-2">{l}</p>)}
      </footer>
    </article>
  );
}
