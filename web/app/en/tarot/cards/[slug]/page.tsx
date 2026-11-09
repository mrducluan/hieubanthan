// QTE — một lá bài (tiếng Anh) từ `/v1/tarot/la/{id}`: nghĩa xuôi / ngược, bốn lĩnh vực, việc nên làm, nguyên văn Waite / Mathers.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Lien from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { MatTruoc } from "@/components/tarot/LaBai";
import { engineEn, slugLa } from "@/lib/en/engine";
import { metaEn } from "@/lib/en/seo";
import { urlDayDu } from "@/lib/seo";
import type { BoBai, LaGon } from "@/lib/tarot-chung";

export const revalidate = 21600;
interface TrangLa {
  la: LaGon & { tu_khoa: string[]; tu_khoa_nguoc: string[]; hinh_anh: string; y_xuoi: string; y_nguoc: string; linh_vuc: Record<string, string>; linh_vuc_nguoc?: Record<string, string> | null;
    viec: string; cau_tu_soi: string; tra_loi: { x: string; n: string }; nhan_vat?: string | null; ten_nguyen_to_phu?: string | null; thoth_ten?: string | null; tdm_ten?: string | null; huong_nhin: number | null };
  chiem_tinh: string | null; decan: { cung: string; so: number; hanh_tinh: string } | null;
  trich: { sach: string; nguyen_van: string | null; nguyen_van_nguoc: string | null }[];
  bo: { ten: string; mang: string; nhip: string; loi: string } | null; nguyen_to: { ten: string; tinh: string; loi: string }; thu_tu: string[];
}
const LV: [string, string][] = [["tinh_cam", "Love & relationships"], ["cong_viec", "Work & study"], ["tien_bac", "Money"], ["suc_khoe", "Health & daily rhythm"]];

async function timId(slug: string): Promise<string | null> {
  const r = await engineEn<BoBai>("/v1/tarot/bo-bai");
  if (!r.ok) throw new Error("engine");
  return Object.values(r.data.la).find((x) => slugLa(x.en) === slug)?.id ?? null;
}
async function lay(slug: string): Promise<TrangLa | null> {
  const id = await timId(slug);
  if (!id) return null;
  const r = await engineEn<TrangLa>(`/v1/tarot/la/${id}`);
  if (!r.ok) { if (r.status === 404) return null; throw new Error("engine"); }
  return r.data;
}
export async function generateStaticParams() {
  const r = await engineEn<BoBai>("/v1/tarot/bo-bai");
  return r.ok ? Object.values(r.data.la).map((x) => ({ slug: slugLa(x.en) })) : [];
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await lay(slug).catch(() => null);
  const ten = d?.la.en ?? slug.replace(/-/g, " ");
  return metaEn({ title: `${ten} tarot card meaning: upright and reversed, love, work, money`,
    description: d ? `${d.la.en} — ${d.la.tu_khoa.join(", ")}. Reversed: ${d.la.tu_khoa_nguoc.join(", ")}. Meaning in love, work, money and daily life, with one thing to do (Waite 1910, Mathers 1888).` : `Meaning of the ${ten} tarot card.`,
    path: `/en/tarot/cards/${slug}`, vi: "/tarot/la-bai" });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await lay(slug);
  if (!d) notFound();
  const l = d.la;
  const i = d.thu_tu.indexOf(l.id);
  const truoc = i > 0 ? d.thu_tu[i - 1] : null, sau = i >= 0 && i < d.thu_tu.length - 1 ? d.thu_tu[i + 1] : null;
  const bo = await engineEn<BoBai>("/v1/tarot/bo-bai");
  const ten = (id: string | null) => (id && bo.ok ? bo.data.la[id]?.en ?? null : null);
  return (
    <article className="mx-auto max-w-4xl">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: `${l.en} tarot card meaning`, inLanguage: "en", url: urlDayDu(`/en/tarot/cards/${slug}`),
        author: { "@type": "Organization", name: "Hieu Ban Than editorial team" }, publisher: { "@type": "Organization", name: "Hieu Ban Than" }, image: urlDayDu("/og") }} />
      <nav className="mb-4 text-sm text-fg-muted" aria-label="Breadcrumb"><Lien href="/en" className="hover:text-fg">English</Lien> › <Lien href="/en/tarot" className="hover:text-fg">Tarot</Lien> › <Lien href="/en/tarot/cards" className="hover:text-fg">78 cards</Lien> › {l.en}</nav>
      <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
        <div className="mx-auto w-40 sm:w-full"><MatTruoc la={l} /></div>
        <header>
          <p className="eyebrow">{l.loai === "an_chinh" ? "Major Arcana" : d.bo ? `${d.bo.ten} · ${d.nguyen_to.ten}` : d.nguyen_to.ten}{l.ten_nguyen_to_phu ? ` · ${l.ten_nguyen_to_phu}` : ""}</p>
          <h1 className="mt-1 font-serif text-4xl sm:text-5xl">{l.en}</h1>
          <p className="mt-2 text-fg-muted">{l.hinh_anh}</p>
          <p className="mt-3 text-sm"><span className="text-fg-faint">Upright: </span>{l.tu_khoa.join(" · ")}</p>
          <p className="mt-1 text-sm"><span className="text-fg-faint">Reversed: </span>{l.tu_khoa_nguoc.join(" · ")}</p>
          {(d.chiem_tinh || d.decan) && <p className="mt-2 text-xs text-fg-faint">{d.chiem_tinh ? `Golden Dawn attribution: ${d.chiem_tinh}` : ""}{l.thoth_ten && l.thoth_ten !== l.en ? ` · Thoth: ${l.thoth_ten}` : ""}{l.tdm_ten ? ` · Marseille: ${l.tdm_ten}` : ""}</p>}
        </header>
      </div>
      <section className="mt-8 grid gap-4 md:grid-cols-2" data-testid="nghia-la-en">
        <div className="glass rounded-2xl p-5"><h2 className="text-lg">Upright</h2><p className="mt-2 text-fg-muted">{l.y_xuoi}</p></div>
        <div className="glass rounded-2xl p-5"><h2 className="text-lg">Reversed</h2><p className="mt-2 text-fg-muted">{l.y_nguoc.replace(/^Reversed:\s*/, "")}</p></div>
      </section>
      {l.nhan_vat && <p className="mt-4 text-fg-muted"><span className="text-fg-faint">As a person: </span>{l.nhan_vat}</p>}
      <section className="mt-8"><h2 className="text-2xl">In each area of life</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {LV.map(([k, nhan]) => (
            <div key={k} className="glass rounded-2xl p-4"><h3 className="font-medium text-fg">{nhan}</h3><p className="mt-1 text-sm text-fg-muted">{l.linh_vuc[k]}</p>
              {l.linh_vuc_nguoc?.[k] && <p className="mt-2 text-sm text-fg-muted"><span className="text-fg-faint">Reversed: </span>{l.linh_vuc_nguoc[k]}</p>}
              {k === "suc_khoe" && <p className="mt-2 text-xs text-fg-faint">About pace and habits, not medical advice.</p>}</div>
          ))}
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-5"><h2 className="text-lg">If your question is “should I…?”</h2><p className="mt-2 text-sm text-fg-muted"><span className="text-fg-faint">Upright: </span>{l.tra_loi.x}</p><p className="mt-1 text-sm text-fg-muted"><span className="text-fg-faint">Reversed: </span>{l.tra_loi.n}</p></div>
        <div className="glass rounded-2xl p-5"><h2 className="text-lg">One thing to do</h2><p className="mt-2 text-fg">{l.viec}</p><p className="mt-3 text-sm text-fg-muted"><span className="text-fg-faint">Ask yourself: </span>{l.cau_tu_soi}</p></div>
      </section>
      {d.trich.length > 0 && (
        <section className="mt-8"><h2 className="text-2xl">What the old books say</h2>
          <ul className="mt-3 space-y-3">{d.trich.map((t) => <li key={t.sach} className="rounded-xl border border-line/60 p-4 text-sm"><p className="text-fg-faint">{t.sach}</p><p className="mt-1 text-fg-muted">“{t.nguyen_van}”</p>{t.nguyen_van_nguoc && <p className="mt-1 text-fg-muted"><span className="text-fg-faint">Reversed: </span>“{t.nguyen_van_nguoc}”</p>}</li>)}</ul>
        </section>
      )}
      {d.bo && <p className="mt-6 text-sm text-fg-muted">{d.bo.loi} Pace of the suit: {d.bo.nhip}.</p>}
      <nav className="mt-8 flex justify-between text-sm" aria-label="Neighbouring cards">
        <span>{truoc && ten(truoc) && <Lien href={`/en/tarot/cards/${slugLa(ten(truoc)!)}`} className="text-gold hover:underline">← {ten(truoc)}</Lien>}</span>
        <span>{sau && ten(sau) && <Lien href={`/en/tarot/cards/${slugLa(ten(sau)!)}`} className="text-gold hover:underline">{ten(sau)} →</Lien>}</span>
      </nav>
      <p className="mt-8 text-sm text-fg-muted">Meanings are a reference for reflection, not a prediction. <Lien href="/en/tarot" className="text-gold hover:underline">Draw this card in a reading of your own</Lien>.</p>
    </article>
  );
}
