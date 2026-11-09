// QTE — một trang Life Path (tiếng Anh) từ `/v1/thanso/so/{n}`: nghĩa + chân dung 4 mặt + số × lĩnh vực + năm cá nhân.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Lien from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { engineEn } from "@/lib/en/engine";
import { metaEn } from "@/lib/en/seo";
import { urlDayDu } from "@/lib/seo";

export const revalidate = 21600;
const SO = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "22", "33"]);
interface TrangSo {
  so: number; nghia: { tu_khoa: string; mat_toi: string; phan_chung: string; so_cai: boolean; trich_nguon: string };
  chan_dung: Record<string, Record<string, unknown> | null>; ten_mat: Record<string, string>;
  linh_vuc: Record<string, { xu_huong: string; mat_toi: string; goi_y: string; cau_tu_soi?: string } | null>; ten_linh_vuc: Record<string, string>;
  nam_ca_nhan: { chu_de: string; y_nghia: string; nen: string; tranh: string; hay_gap?: string } | null;
}
async function lay(n: string) {
  if (!SO.has(n)) return null;
  const r = await engineEn<TrangSo>(`/v1/thanso/so/${n}`);
  if (!r.ok) { if (r.status === 404) return null; throw new Error("engine"); }
  return r.data;
}
export async function generateStaticParams() { return [...SO].map((n) => ({ n })); }
export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const d = await lay(n).catch(() => null);
  return metaEn({ title: `Life Path ${n} meaning: ${d?.nghia.tu_khoa ?? "numerology"}`,
    description: d ? `Life Path ${n} — ${d.nghia.tu_khoa}. Shadow side: ${d.nghia.mat_toi}. How it tends to show up in love, work and money, with a counter-question to test it.` : `Meaning of Life Path ${n} in Pythagorean numerology.`,
    path: `/en/numerology/life-path/${n}`, vi: "/than-so/y-nghia-so" });
}
const MAT_TRUONG: Record<string, [string, string][]> = {
  tong_quan: [["chan_dung", "Portrait"], ["dong_luc", "What drives them"], ["khi_cang_thang", "Under stress"], ["huong_lon", "Big direction"]],
  tinh_cam: [["cach_yeu", "How they love"], ["can_duoc", "What they need"], ["diem_mu", "Blind spot"], ["hop_kieu_nguoi", "Who suits them"], ["hon_nhan", "In marriage"]],
  cong_viec: [["the_manh", "Strengths"], ["moi_truong", "Environment"], ["cai_bay", "The trap"], ["tien_bac", "Money"]],
  bien_co: [["kieu_bien_co", "Typical turning points"], ["bai_hoc", "The lesson"], ["cach_di_qua", "How to get through"]],
};

export default async function Page({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const d = await lay(n);
  if (!d) notFound();
  const tq = d.chan_dung.tong_quan as Record<string, unknown> | null;
  return (
    <article className="mx-auto max-w-4xl">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: `Life Path ${n}: ${d.nghia.tu_khoa}`, inLanguage: "en", url: urlDayDu(`/en/numerology/life-path/${n}`),
        author: { "@type": "Organization", name: "Hieu Ban Than editorial team" }, publisher: { "@type": "Organization", name: "Hieu Ban Than" }, image: urlDayDu("/og") }} />
      <nav className="mb-4 text-sm text-fg-muted" aria-label="Breadcrumb"><Lien href="/en" className="hover:text-fg">English</Lien> › <Lien href="/en/numerology" className="hover:text-fg">Numerology</Lien> › <Lien href="/en/numerology/life-path" className="hover:text-fg">Life Path numbers</Lien> › {n}</nav>
      <header className="mb-6"><p className="eyebrow">Life Path {d.nghia.so_cai ? "· master number" : ""}</p><h1 className="mt-1 font-serif text-4xl sm:text-5xl">Life Path {n}: {d.nghia.tu_khoa}</h1></header>
      <section className="glass rounded-2xl p-5" data-testid="tra-loi-nhanh-en">
        <h2 className="text-lg">In short</h2>
        <p className="mt-2 text-fg-muted">{typeof tq?.chan_dung === "string" ? (tq.chan_dung as string) : d.nghia.tu_khoa}</p>
        <p className="mt-2 text-sm text-fg-muted"><span className="text-fg-faint">Shadow side: </span>{d.nghia.mat_toi}</p>
        <p className="mt-1 text-sm text-fg-muted"><span className="text-fg-faint">Counter-question: </span>{d.nghia.phan_chung}</p>
      </section>
      {Array.isArray(tq?.diem_manh) && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl p-5"><h2 className="text-lg">Strengths often named</h2><ul className="mt-2 list-disc pl-5 text-fg-muted">{(tq!.diem_manh as string[]).map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div className="glass rounded-2xl p-5"><h2 className="text-lg">Blind spots often named</h2><ul className="mt-2 list-disc pl-5 text-fg-muted">{((tq!.diem_mu as string[]) ?? []).map((x) => <li key={x}>{x}</li>)}</ul></div>
        </section>
      )}
      {(["tong_quan", "tinh_cam", "cong_viec", "bien_co"] as const).map((m) => {
        const c = d.chan_dung[m];
        if (!c) return null;
        return (
          <section key={m} className="mt-6"><h2 className="text-2xl">{d.ten_mat[m]}</h2>
            <dl className="mt-3 space-y-2">{MAT_TRUONG[m]!.map(([k, nhan]) => typeof c[k] === "string" && !(m === "tong_quan" && k === "chan_dung") ? <div key={k}><dt className="text-xs text-fg-faint">{nhan}</dt><dd className="text-fg-muted">{c[k] as string}</dd></div> : null)}
              {Array.isArray(c.nghe) && <div><dt className="text-xs text-fg-faint">Directions that fit</dt><dd className="text-fg-muted">{(c.nghe as string[]).join(" · ")}</dd></div>}</dl>
          </section>
        );
      })}
      <section className="mt-8"><h2 className="text-2xl">In each area of life</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {Object.entries(d.linh_vuc).map(([lv, x]) => x ? (
            <div key={lv} className="glass rounded-2xl p-4"><h3 className="font-medium text-fg">{d.ten_linh_vuc[lv]}</h3>
              <p className="mt-1 text-sm text-fg-muted">{x.xu_huong}</p><p className="mt-1 text-sm text-fg-muted"><span className="text-fg-faint">Shadow: </span>{x.mat_toi}</p>
              <p className="mt-1 text-sm text-fg"><span className="text-fg-faint">Try: </span>{x.goi_y}</p>{x.cau_tu_soi && <p className="mt-1 text-xs text-fg-faint">{x.cau_tu_soi}</p>}</div>
          ) : null)}
        </div>
      </section>
      {d.nam_ca_nhan && (
        <section className="mt-8 glass rounded-2xl p-5"><h2 className="text-2xl">When {n} is your personal year</h2>
          <p className="mt-2 text-fg-muted"><b className="text-fg">{d.nam_ca_nhan.chu_de}.</b> {d.nam_ca_nhan.y_nghia}</p>
          <p className="mt-1 text-sm text-fg-muted"><span className="text-fg-faint">Good to do: </span>{d.nam_ca_nhan.nen} <span className="text-fg-faint">Better to avoid: </span>{d.nam_ca_nhan.tranh}</p>
        </section>
      )}
      <p className="mt-8 text-sm text-fg-muted">Source: {d.nghia.trich_nguon}. Tendencies described in the tradition — a cultural reference, not a forecast. <Lien href="/en/numerology" className="text-gold hover:underline">Calculate your own numbers</Lien>.</p>
    </article>
  );
}
