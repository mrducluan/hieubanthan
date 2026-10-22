// EEAT-1 — hồ sơ chuyên gia: ai đứng sau nội dung, làm vai trò gì, đã viết / thẩm định những bài nào, quy trình ra sao.
// Schema ProfilePage + Person (Google: trang hồ sơ tác giả là tín hiệu "Who" của E-E-A-T). Chỉ ghi điều đã công bố.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenCheck, Feather, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHUYEN_GIA, duongChuyenGia, ldNguoi, ngayVN } from "@/lib/chuyen-gia";
import { duongTrang, soTrangChuyenGia } from "@/lib/kien-thuc";
import { catMoTa, goiLd, ldDuongDan, siteUrl, urlDayDu } from "@/lib/seo";
import { vanHanh } from "@/lib/van-hanh";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { layNoiDungTrang } from "@/lib/noi-dung-trang";

export const revalidate = 21600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(CHUYEN_GIA).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cg = CHUYEN_GIA[(await params).slug];
  if (!cg) return { title: "Không tìm thấy", robots: { index: false } };
  const duong = duongChuyenGia(cg.slug);
  const tieuDe = `${cg.ten} — ${cg.vaiTro}`;
  return {
    title: tieuDe,
    description: catMoTa(`${cg.ten}: ${cg.tomTat} Chủ biên Hiểu Bản Thân — bài đã viết, đã thẩm định, quy trình biên soạn.`),
    alternates: { canonical: duong },
    openGraph: { type: "profile", title: tieuDe, description: cg.tomTat, url: duong, locale: "vi_VN",
      images: [`/og?tieu_de=${encodeURIComponent(cg.ten)}`] },
    twitter: { card: "summary_large_image", title: tieuDe, description: cg.tomTat },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const cg = CHUYEN_GIA[slug];
  if (!cg) notFound();
  const duong = duongChuyenGia(slug);
  // ND-7: hồ sơ giữ trong code (E-E-A-T) — CMS chỉ thêm khối cuối trang (Trang website của URL hoặc mẫu cụm /tac-gia/{slug}).
  const [so, nd] = await Promise.all([soTrangChuyenGia(slug), layNoiDungTrang(duong, { slug })]);
  const vh = vanHanh();

  const ld = goiLd(
    {
      "@type": "ProfilePage",
      "@id": `${urlDayDu(duong)}#trang`,
      url: urlDayDu(duong),
      name: `${cg.ten} — ${cg.vaiTro}`,
      inLanguage: "vi-VN",
      isPartOf: { "@id": `${siteUrl()}/#website` },
      mainEntity: { "@id": `${urlDayDu(duong)}#nguoi` },
    },
    ldNguoi(cg),
    ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Đội ngũ", duong: "/tac-gia" }, { ten: cg.ten, duong }]),
  );

  const the = so ? [
    { so: so.so_trang.chu_bien, nhan: "bài do anh làm chủ biên" },
    { so: so.so_trang.tac_gia, nhan: "bài anh tự biên soạn" },
    // BM-1: chỉ hiện số bài đã thẩm định khi đã có (con số 0 trên hồ sơ công khai không giúp người đọc).
    ...(so.so_trang.tham_dinh > 0 ? [{ so: so.so_trang.tham_dinh, nhan: "bài anh đã thẩm định" }] : []),
  ] : [];

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={ld} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint">
        <ol className="flex flex-wrap gap-1.5"><li><Link href="/tac-gia" className="hover:text-fg">Đội ngũ</Link> ›</li></ol>
      </nav>

      <header className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
        <span aria-hidden className="grid size-24 shrink-0 place-items-center rounded-full border border-gold/60 bg-gold/10 font-serif text-4xl text-gold">
          {cg.ten.split(" ").map((w) => w[0]).join("")}
        </span>
        <div>
          <p className="eyebrow">{cg.vaiTro}</p>
          <h1 className="mt-1 text-4xl leading-tight sm:text-5xl">{cg.ten}</h1>
          <p className="mt-2 text-fg-muted">{cg.tomTat}</p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Lĩnh vực">
            {cg.linhVuc.map((l) => <li key={l} className="rounded-full border border-line px-3 py-1 text-xs text-fg-muted">{l}</li>)}
          </ul>
        </div>
      </header>

      <section className="mt-10" aria-labelledby="gioi-thieu">
        <h2 id="gioi-thieu" className="text-2xl">Giới thiệu</h2>
        <div className="mt-3 space-y-3 leading-relaxed text-fg-muted">{cg.gioiThieu.map((p) => <p key={p}>{p}</p>)}</div>
      </section>

      {the.length > 0 && (
        <section className="mt-10" aria-labelledby="dong-gop">
          <h2 id="dong-gop" className="text-2xl">Đóng góp trên Hiểu Bản Thân</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {the.map((x) => (
              <div key={x.nhan} className="glass rounded-2xl p-4">
                <dt className="text-xs text-fg-faint">{x.nhan}</dt>
                <dd className="mt-1 font-serif text-3xl text-gold">{x.so}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {so && so.tac_gia.length > 0 && (
        <nav className="mt-10" aria-labelledby="bai-viet">
          <h2 id="bai-viet" className="flex items-center gap-2 text-2xl"><Feather className="size-5 text-gold" aria-hidden /> Bài anh biên soạn</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {so.tac_gia.map((t) => (
              <li key={t.slug}><Link href={duongTrang(t.loai, t.slug)} className="glass flex items-center justify-between rounded-xl px-4 py-3 text-sm text-fg-muted hover:border-gold/50 hover:text-fg">{t.tieu_de}<ArrowRight className="size-4 shrink-0 text-gold/70" aria-hidden /></Link></li>
            ))}
          </ul>
        </nav>
      )}

      {so && so.tham_dinh_gan_day.length > 0 && (
        <nav className="mt-10" aria-labelledby="tham-dinh">
          <h2 id="tham-dinh" className="flex items-center gap-2 text-2xl"><ShieldCheck className="size-5 text-jade" aria-hidden /> Thẩm định gần đây</h2>
          <ul className="mt-4 space-y-2">
            {so.tham_dinh_gan_day.map((t) => (
              <li key={t.slug}><Link href={duongTrang(t.loai, t.slug)} className="flex justify-between gap-3 rounded-xl border border-line/70 px-4 py-3 text-sm text-fg-muted hover:border-gold/50 hover:text-fg">
                <span>{t.tieu_de}</span><time dateTime={t.tham_dinh.ngay} className="shrink-0 text-fg-faint">{ngayVN(t.tham_dinh.ngay)}</time></Link></li>
            ))}
          </ul>
        </nav>
      )}

      <section className="mt-10" aria-labelledby="quy-trinh">
        <h2 id="quy-trinh" className="flex items-center gap-2 text-2xl"><BookOpenCheck className="size-5 text-gold" aria-hidden /> Cách một bài được làm ra</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed text-fg-muted">
          <li><b className="text-fg">Tính toán chính xác:</b> con số, lá số, tứ trụ, quẻ, hướng do hệ thống tính toán riêng thực hiện, đã đối chiếu với các lá số mẫu.</li>
          <li><b className="text-fg">Ban biên tập biên soạn:</b> phần diễn giải được soạn từ cổ thư (nguyên văn công cộng) và tài liệu tham khảo, ghi nguồn và trường phái, theo bộ quy tắc biên tập của chủ biên (không phán định mệnh, luôn có mặt tối và câu tự soi).</li>
          <li><b className="text-fg">Chuyên gia thẩm định:</b> {cg.ten} đọc, sửa và duyệt từng bài. Bài đã duyệt ghi tên người thẩm định và ngày.</li>
        </ol>
      </section>

      <section className="mt-10 rounded-2xl border border-line/70 p-5 text-sm leading-relaxed text-fg-muted" aria-labelledby="lien-he">
        <h2 id="lien-he" className="text-xl text-fg">Góp ý nội dung</h2>
        <p className="mt-2">Thấy một bài chưa đúng hoặc thiếu nguồn? Xin gửi qua trang <Link href="/lien-he" className="text-gold underline">Liên hệ</Link>
          {vh.email ? <> hoặc email <a href={`mailto:${vh.email}`} className="text-gold underline">{vh.email}</a></> : null} — bài được sửa sẽ cập nhật ngày thẩm định.</p>
      </section>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </article>
  );
}
