// SEO-F → SEO-K → AUD-Q2 (chủ dự án duyệt 2026-11-03): trang "Cung X hợp hướng nào?" — 8 trang theo CUNG PHI (mệnh quái
// Bát trạch), server-render từ engine (bảng du niên, KB, danh sách năm sinh có cung đó). Thay 46 trang năm sinh gần trùng
// (cung phi lặp 9 năm). Trang năm cũ "tuoi-1990(-nam|-nu)" 308 về dòng năm trên mục lục (next.config.mjs; trang này tự
// chuyển khi ai gọi thẳng). Cấu trúc GEO: câu hỏi làm tiêu đề · trả lời nhanh tự đứng · la bàn · 4 tốt / 4 xấu ·
// bố trí · năm sinh có cung này · cung cùng nhóm · hỏi đáp.
import { KhoiCms } from "@/components/cms/KhoiCms";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { LaBan } from "@/components/huyen-hoc/LaBan";
import { cungPhi, dsCungPhi, duongTuoi, type CungPhi, type HuongDuNien } from "@/lib/kien-thuc";
import { anhBai, catMoTa, goiLd, ldAnh, ldDuongDan, ldHoiDap, siteUrl, TEN_SITE, tieuDeSeo, urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

type Props = { params: Promise<{ slug: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");
const GIOI = { nam: "Nam", nu: "Nữ" } as const;

const anhCung = (c: CungPhi) => anhBai({
  tieuDe: c.tieu_de, mang: "phong-thuy", tot: c.huong_tot.map((h) => h.huong), nhan: `Cung ${c.quai} · ${c.nhom}`,
});

async function metaGoc({ params: thamSo }: Props): Promise<Metadata> {
  const params = await thamSo;
  const c = await cungPhi(params.slug);
  if (!c) return { title: "Không tìm thấy", robots: { index: false } };
  const duong = duongTuoi(c.slug);
  const anh = anhCung(c);
  return {
    title: tieuDeSeo(c.tieu_de),
    description: catMoTa(c.mo_ta),
    alternates: { canonical: duong, types: { "text/markdown": `${duong}.md` } },
    openGraph: { type: "article", title: c.tieu_de, description: catMoTa(c.mo_ta), url: duong, locale: "vi_VN", siteName: TEN_SITE,
      images: [{ url: anh, width: 1200, height: 630, alt: c.tieu_de }] },
    twitter: { card: "summary_large_image", title: c.tieu_de, description: catMoTa(c.mo_ta), images: [anh] },
  };
}

function The({ ten, h }: { ten: string; h: HuongDuNien }) {
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
  // Trang năm cũ một giới tính (tuoi-1990-nu): biết giới tính → 308 thẳng tới trang cung của người đó, đúng dòng năm sinh.
  const g = params.slug.match(/^tuoi-(\d{4})-(nam|nu)$/);
  if (g) {
    const dong = (await dsCungPhi()).tuoi.find((t) => t.nam === Number(g[1]));
    if (!dong) notFound();
    permanentRedirect(`${duongTuoi((g[2] === "nam" ? dong.nam_gioi : dong.nu_gioi).slug)}#${g[2]}-${g[1]}`);
  }
  // Trang năm gộp cũ (next.config.mjs đã 308 về dòng năm; đây là lưới an toàn khi gọi thẳng route).
  const m = params.slug.match(/^(tuoi-\d{4})$/);
  if (m) permanentRedirect(duongTuoi(m[1]!));
  const c = await cungPhi(params.slug);
  if (!c) notFound();
  const duong = duongTuoi(c.slug);
  const nd = await layNoiDungTrang(duong, { tieu_de: c.tieu_de });   // ND-5: mẫu cụm "Hướng hợp tuổi theo cung phi"
  const anh = anhCung(c);
  const theoGioi = (g: "nam" | "nu") => c.nam_sinh.filter((x) => x.gioi_tinh === g);
  const ld = goiLd(
    {
      "@type": "Article", "@id": `${urlDayDu(duong)}#bai`, headline: c.tieu_de, description: c.mo_ta, inLanguage: "vi-VN",
      mainEntityOfPage: { "@id": `${urlDayDu(duong)}#trang` }, image: ldAnh(anh, `La bàn 8 hướng cung ${c.quai}`),
      // BM-1 / EEAT-1: bài chưa thẩm định ghi tác giả là ban biên tập; chủ biên = editor.
      author: { "@type": "Organization", name: `Ban biên tập ${TEN_SITE}`, url: siteUrl() },
      editor: { "@id": `${siteUrl()}/tac-gia/duc-luan#nguoi` },
      publisher: { "@id": `${siteUrl()}/#to-chuc` }, isPartOf: { "@id": `${siteUrl()}/#website` },
      isAccessibleForFree: true, citation: c.nguon, abstract: c.tra_loi_nhanh,
      datePublished: c.ngay_dang, dateModified: c.cap_nhat,
      about: [
        { "@type": "Thing", name: "Phong thuỷ Bát trạch", sameAs: "https://en.wikipedia.org/wiki/Feng_shui" },
        { "@type": "Thing", name: `Cung ${c.quai}` },
      ],
      keywords: `cung ${c.quai} hợp hướng nào, mệnh quái ${c.quai}, ${c.nhom}, hướng nhà cung ${c.quai}, hướng bếp, hướng giường`,
      ...(c.trang_thai === "da_duyet" ? { creativeWorkStatus: "Published" } : {}),
    },
    { "@type": "WebPage", "@id": `${urlDayDu(duong)}#trang`, url: urlDayDu(duong), name: c.tieu_de, inLanguage: "vi-VN",
      isPartOf: { "@id": `${siteUrl()}/#website` }, primaryImageOfPage: ldAnh(anh, c.tieu_de) },
    ldHoiDap(c.hoi_dap),
    ldDuongDan([
      { ten: "Trang chủ", duong: "/" }, { ten: "Phong thuỷ", duong: "/phong-thuy" },
      { ten: "Hướng hợp tuổi", duong: "/phong-thuy/huong-hop-tuoi" }, { ten: `Cung ${c.quai}`, duong },
    ]),
  );
  return (
    <article className="mx-auto max-w-3xl" data-testid="cung-phi">
      <JsonLd data={ld} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint">
        <Link href="/phong-thuy" className="hover:text-fg">Phong thuỷ</Link> › <Link href="/phong-thuy/huong-hop-tuoi" className="hover:text-fg">Hướng hợp tuổi</Link>
      </nav>
      <header className="mt-4">
        <h1 className="text-3xl leading-tight sm:text-5xl">{c.tieu_de}</h1>
        <p className="mt-3 text-sm text-fg-muted">
          Mệnh quái số {c.so} · {c.nhom}
          {c.thong_tin.ngu_hanh && <> · hành {c.thong_tin.ngu_hanh}</>}
          {c.thong_tin.phuong && <> · phương gốc {c.thong_tin.phuong}</>}
          {" · "}Cập nhật <time dateTime={c.cap_nhat}>{dmy(c.cap_nhat)}</time>
        </p>
      </header>

      <section aria-label="Trả lời nhanh" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Trả lời nhanh</p>
        <p className="mt-2 text-lg leading-relaxed text-fg">{c.tra_loi_nhanh}</p>
      </section>
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mt-6" />

      <section className="mt-8" aria-labelledby="la-ban">
        <h2 id="la-ban" className="text-2xl">La bàn 8 hướng của cung {c.quai}</h2>
        <div className="mt-4"><LaBan quai={c.quai} nhom={c.nhom} bang={c.bang_huong} huongCat={c.huong_tot.map((h) => h.huong)} /></div>
      </section>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="huong-tot">
          <h2 id="huong-tot" className="text-xl">4 hướng tốt (xếp từ tốt nhất)</h2>
          <ol className="mt-3 grid gap-3">{c.huong_tot.map((h, i) => <The key={h.huong} ten={`Hướng tốt ${i + 1}`} h={h} />)}</ol>
        </section>
        <section aria-labelledby="huong-xau">
          <h2 id="huong-xau" className="text-xl">4 hướng nên tránh</h2>
          <ol className="mt-3 grid gap-3">{c.huong_xau.map((h, i) => <The key={h.huong} ten={`Hướng xấu ${i + 1}`} h={h} />)}</ol>
        </section>
      </div>

      <section className="mt-10" aria-labelledby="bo-tri">
        <h2 id="bo-tri" className="text-2xl">Cửa, bếp, giường, bàn làm việc cho người cung {c.quai}</h2>
        <div className="mt-3 space-y-3">
          {c.goi_y.map((x) => (
            <div key={x.ma} className="rounded-xl border border-line/70 p-4">
              <p className="font-medium text-fg">{x.tieu_de}: <span className="text-gold">{x.huong.join(" → ")}</span></p>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{x.noi_dung}{x.nguon === "dan_gian" ? " (quan niệm dân gian)" : ""}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="nam-sinh">
        <h2 id="nam-sinh" className="text-2xl">Năm sinh có cung {c.quai} (1960–2005)</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Cung phi tính theo năm sinh và giới tính, mốc đầu năm là Lập xuân: sinh trước ngày Lập xuân của năm đó thì tính theo
          năm trước — xem cả bảng ở <Link href="/phong-thuy/huong-hop-tuoi" className="text-gold underline">mục lục hướng hợp tuổi</Link>.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {(["nam", "nu"] as const).map((g) => (
            <div key={g}>
              <h3 className="text-lg">{GIOI[g]} giới</h3>
              {theoGioi(g).length ? (
                <ul className="mt-2 space-y-1.5 text-sm">
                  {theoGioi(g).map((x) => (
                    <li key={x.nam} id={`${g}-${x.nam}`} className="text-fg-muted">
                      <b className="text-fg">{x.nam}</b> ({x.can_chi}) — sinh từ Lập xuân {dmy(x.lap_xuan)}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-fg-muted">Không có năm nào trong khoảng 1960–2005.</p>}
            </div>
          ))}
        </div>
      </section>

      <nav className="mt-10" aria-labelledby="cung-khac">
        <h2 id="cung-khac" className="text-xl">Cung cùng nhóm {c.nhom} (chung 4 hướng tốt)</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {c.cung_cung_nhom.map((x) => (
            <li key={x.slug}><Link href={duongTuoi(x.slug)} className="inline-flex min-h-10 items-center rounded-full border border-jade/40 px-3.5 py-2 text-fg-muted hover:text-fg">Cung {x.quai}</Link></li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-fg-muted">Nhóm còn lại:{" "}
          {c.cung_khac_nhom.map((x, i) => (
            <span key={x.slug}>{i ? ", " : ""}<Link href={duongTuoi(x.slug)} className="underline decoration-line underline-offset-2 hover:text-fg">cung {x.quai}</Link></span>
          ))}.
        </p>
      </nav>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-4">
          {c.hoi_dap.map((h) => (
            <div key={h.hoi} className="rounded-xl border border-line/70 p-4">
              <dt className="font-medium text-fg">{h.hoi}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd>
            </div>
          ))}
        </dl>
      </section>

      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-10" />
      <aside className="glass mt-10 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center" data-nosnippet="">
        <Compass className="size-6 shrink-0 text-gold" aria-hidden />
        <p className="flex-1 text-fg-muted">Tính theo <b className="text-fg">ngày sinh chính xác</b> của bạn (tự xét Lập xuân/Tết), đo hướng nhà bằng la bàn điện thoại, xem bố cục cả nhà.</p>
        <Button asChild><Link href="/phong-thuy">Mở công cụ <ArrowRight aria-hidden /></Link></Button>
      </aside>

      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
      <footer className="mt-10 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        <p>Nguồn: {c.nguon}. Lời giải thích do Ban biên tập Hiểu Bản Thân biên soạn · Chủ biên Đức Luân duyệt xuất bản.</p>
        {c.luu_y.filter(Boolean).map((l) => <p key={l} className="mt-2">{l}</p>)}
      </footer>
    </article>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
