// GĐ 3 — Trang chi tiết một Tình huống Hỏi–Đáp Đa Hệ Thống (/hoi-dap/[slug]).
// Schema: Article + FAQPage (ldHoiDap) + BreadcrumbList (KHÔNG dùng QAPage vì đây là bài biên tập tổng hợp).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/khung/Lien";
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldHoiDap, metaTrang, siteUrl, urlDayDu } from "@/lib/seo";
import { duongHoiDap, TINH_HUONG_HOI_DAP, tinhHuongTheoSlug } from "@/lib/hoi-dap-mau";

interface Props { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return TINH_HUONG_HOI_DAP.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = tinhHuongTheoSlug(slug);
  if (!t) return {};
  return metaTrang({
    tieuDe: t.cauHoi,
    moTa: t.tomTat,
    duong: duongHoiDap(t.slug),
  });
}

export default async function ChiTietHoiDapPage({ params }: Props) {
  const { slug } = await params;
  const t = tinhHuongTheoSlug(slug);
  if (!t) notFound();

  const duong = duongHoiDap(t.slug);
  const lienQuan = TINH_HUONG_HOI_DAP.filter((x) => x.slug !== t.slug && (x.mang === t.mang || x.chuDe === t.chuDe)).slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <JsonLd
        data={goiLd(
          {
            "@type": "Article",
            headline: t.cauHoi,
            description: t.tomTat,
            inLanguage: "vi-VN",
            url: urlDayDu(duong),
            dateModified: t.ngayCapNhat,
            datePublished: t.ngayCapNhat,
            author: { "@id": `${siteUrl()}/#to-chuc` },
            publisher: { "@id": `${siteUrl()}/#to-chuc` },
            about: [t.tenMang, t.tenChuDe],
          },
          ldHoiDap(t.hoiDapNgan),
          ldDuongDan([
            { ten: "Trang chủ", duong: "/" },
            { ten: "Hỏi – Đáp tình huống", duong: "/hoi-dap" },
            { ten: t.tenMang, duong },
          ]),
        )}
      />

      <nav aria-label="Đường dẫn" className="text-sm text-fg-muted">
        <Link href="/hoi-dap" className="inline-flex items-center gap-1 hover:text-gold">
          <ArrowLeft className="size-3.5" aria-hidden /> Về thư viện Hỏi – Đáp tình huống
        </Link>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-gold/15 px-3 py-0.5 font-medium text-gold">{t.tenMang}</span>
          <span className="rounded-full border border-line px-3 py-0.5 text-fg-muted">{t.tenChuDe}</span>
          <span className="text-fg-faint">Tình huống minh hoạ tổng hợp · Ban biên tập Hiểu Bản Thân</span>
        </div>
        <h1 className="font-serif text-2xl font-semibold leading-snug text-fg sm:text-4xl">{t.cauHoi}</h1>
        <p className="text-sm leading-relaxed text-fg-muted sm:text-base">{t.tomTat}</p>
      </header>

      {/* Phần 1: Bối cảnh ẩn danh */}
      <Card className="space-y-2 border-gold/25 bg-gold/[0.04]">
        <p className="text-xs font-medium uppercase tracking-widest text-gold">Phần 1 · Bối cảnh tình huống</p>
        <p className="text-sm leading-relaxed text-fg">{t.boiCanhAnDanh}</p>
      </Card>

      {/* Phần 2: Đối chiếu đa hệ thống */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-fg">
          <Layers className="size-5 text-gold" aria-hidden /> Phần 2 · Đối chiếu đa hệ thống
        </h2>
        <div className="space-y-3">
          {t.doiChieuDaHeThong.map((d) => (
            <Card key={d.heThong} className="space-y-1.5 border-line/70">
              <h3 className="text-sm font-semibold text-gold">{d.heThong}</h3>
              <p className="text-sm leading-relaxed text-fg-muted">{d.nhanDinh}</p>
            </Card>
          ))}
        </div>
        <p className="rounded-xl border border-line/60 bg-bg-2/40 p-4 text-sm leading-relaxed text-fg">
          <b className="text-gold">Điểm trùng & điểm khác:</b> {t.diemTrungVaKhac}
        </p>
      </section>

      {/* Phần 3: Gợi ý hành động thực tế */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-fg">
          <CheckCircle2 className="size-5 text-jade" aria-hidden /> Phần 3 · Gợi ý hành động thực tế
        </h2>
        <ul className="space-y-2.5">
          {t.hanhDongThucTe.map((h, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-line/70 bg-bg-2/30 p-3.5 text-sm leading-relaxed text-fg">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold">{i + 1}</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Hỏi đáp ngắn (khớp FAQPage JSON-LD) */}
      {t.hoiDapNgan.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-fg">Câu hỏi thường gặp kèm theo</h2>
          <div className="space-y-3">
            {t.hoiDapNgan.map((q) => (
              <Card key={q.hoi} className="space-y-1.5 border-line/70">
                <h3 className="text-sm font-semibold text-fg">{q.hoi}</h3>
                <p className="text-sm leading-relaxed text-fg-muted">{q.dap}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CTA công cụ miễn phí + Hỏi chuyên gia */}
      <Card className="space-y-3 border-gold/30 bg-gold/[0.05]">
        <p className="flex items-center gap-2 text-sm font-medium text-fg">
          <Compass className="size-4 text-gold" aria-hidden /> Tự đối chiếu trên lá số của chính bạn
        </p>
        <p className="text-xs leading-relaxed text-fg-muted">
          Mỗi người có cấu trúc lá số và bối cảnh sống khác nhau. Bạn có thể tự tra cứu miễn phí ngay hoặc gửi câu hỏi cụ thể cho chuyên gia khi cần đọc sâu.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Button asChild size="sm">
            <Link href={t.duongCongCu}>
              {t.tenCongCu} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/hoi-chuyen-gia?mang=${t.mang}`}>Gửi câu hỏi cho chuyên gia</Link>
          </Button>
        </div>
      </Card>

      {lienQuan.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="font-serif text-lg font-semibold text-fg">Tình huống liên quan</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {lienQuan.map((x) => (
              <Link key={x.slug} href={duongHoiDap(x.slug)} className="rounded-xl border border-line/70 p-3 text-xs hover:border-gold/50">
                <span className="text-[11px] font-medium text-gold">{x.tenMang}</span>
                <p className="mt-1 line-clamp-3 font-medium text-fg">{x.cauHoi}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-fg-faint">
        Ghi chú: Đây là tình huống minh hoạ tổng hợp mang tính văn hoá tham khảo, không thay thế tư vấn y tế, pháp lý hay đầu tư tài chính.
      </p>
    </article>
  );
}
