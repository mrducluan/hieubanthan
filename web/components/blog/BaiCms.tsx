// Bài blog từ CMS. Bố cục theo trang kiến thức: H1 → sapo → chữ ký E-E-A-T → Trả lời nhanh → mục lục → thân bài →
// hỏi đáp (FAQPage) → nguồn → mời dùng công cụ → đọc tiếp. Thân bài là HTML CMS đã lọc lại ở web (lib/cms-html.ts).
// Chữ ký theo EEAT-1 / BM-1 / DX-1: chưa có chuyên gia đọc → "Ban biên tập … · Chủ biên duyệt xuất bản" (author =
// Organization); chỉ khi CMS ghi "tác giả"/"thẩm định" (có xác nhận, có ngày) mới đứng tên người.
import { duongBlog } from "@/lib/blog-gop";
import Link from "next/link";
import { BookOpen, CalendarDays, Clock, Eye, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { CtaBen, CtaBlog } from "@/components/blog/CtaBlog";
import { KhungBaiDoc, MucLucGon, THAN_BAI_ID } from "@/components/blog/KhungBaiDoc";
import { mangCuaBai } from "@/lib/blog-mang";
import { MocDocXong } from "@/components/khung/CuoiBaiDoc";
import { CHUYEN_GIA, duongChuyenGia, idChuyenGia, ldNguoi, ngayVN } from "@/lib/chuyen-gia";
import { anhCms, cacChuyenMuc, KIEU_LD, NHAN_LOAI, phutDoc, type BaiCms as Bai, type BaiCmsTomTat, type NguoiCms, type TinhNangCms } from "@/lib/cms";
import { locHtmlCms } from "@/lib/cms-html";
import { goiLd, ldDuongDan, ldHoiDap, siteUrl, urlDayDu } from "@/lib/seo";
import nf from "@/app/blog/notfair-article.module.css";
import st from "@/app/blog/cms-bai.module.css";

const CHU_BIEN = "duc-luan";

const TEN_MANG: Record<string, string> = {
  than_so: "Thần số học", tu_vi: "Tử vi", bat_tu: "Bát tự", kinh_dich: "Kinh Dịch", phong_thuy: "Phong thuỷ", chung: "Hiểu bản thân",
};

const ngayIso = (s?: string | null) => (s ? s.slice(0, 10) : null);

function TenNguoi({ n }: { n: NguoiCms }) {
  const cg = n.slug ? CHUYEN_GIA[n.slug] : undefined;
  const href = cg ? duongChuyenGia(cg.slug) : n.trang_ho_so;
  return href
    ? <Link href={href} rel="author" className="font-medium text-fg underline decoration-gold/40 underline-offset-2 hover:decoration-gold">{cg?.ten ?? n.ten}</Link>
    : <span className="font-medium text-fg">{n.ten}</span>;
}

/** Người đứng tên trên bài (null = Ban biên tập). */
export function nguoiKy(bai: Bai): { vai: "tac_gia" | "tham_dinh"; n: NguoiCms } | null {
  if (bai.ky_ten === "tac_gia" && bai.tac_gia && typeof bai.tac_gia === "object") return { vai: "tac_gia", n: bai.tac_gia };
  if (bai.ky_ten === "tham_dinh" && bai.nguoi_tham_dinh && typeof bai.nguoi_tham_dinh === "object" && bai.ngay_tham_dinh) {
    return { vai: "tham_dinh", n: bai.nguoi_tham_dinh };
  }
  return null;
}

function ldNguoiCms(n: NguoiCms) {
  const cg = n.slug ? CHUYEN_GIA[n.slug] : undefined;
  if (cg) return { "@id": idChuyenGia(cg.slug) };
  return {
    "@type": "Person", name: n.ten, ...(n.chuc_danh ? { jobTitle: n.chuc_danh } : {}),
    ...(n.trang_ho_so ? { url: urlDayDu(n.trang_ho_so) } : {}),
    ...(n.lien_ket?.length ? { sameAs: n.lien_ket.map((l) => l.url) } : {}),
  };
}

export function BaiCms({ bai, tn, lienQuan, nhap }: { bai: Bai; tn: TinhNangCms; lienQuan: BaiCmsTomTat[]; nhap: boolean }) {
  const duong = duongBlog(bai.slug);       // cùng dạng với canonical (audit P2)
  const { html, mucLuc } = locHtmlCms(bai.noi_dung_html);
  const anh = anhCms(bai.anh_bia, "vua");
  const anhOg = anhCms(bai.meta?.image ?? bai.anh_bia, "og");
  const ky = nguoiKy(bai);
  const cg = CHUYEN_GIA[ky?.n.slug ?? CHU_BIEN] ?? CHUYEN_GIA[CHU_BIEN];
  const hd = (bai.hoi_dap ?? []).filter((h) => h.cau_hoi && h.tra_loi);
  const nguon = (bai.nguon ?? []).filter((n) => n.ten);
  // CTA chân bài + thẻ bên lề đổi theo mảng: ban biên tập chọn `mang` thì theo đó; "chung" → đoán theo tiêu đề/thẻ.
  const mang = mangCuaBai({ mang: bai.mang, tieuDe: bai.tieu_de, slug: bai.slug, the: bai.the, moTa: bai.mo_ta_ngan });
  const xb = ngayIso(bai.publishedAt), sua = ngayIso(bai.updatedAt);
  const coChuyenGiaNoiBo = ky && ky.n.slug && CHUYEN_GIA[ky.n.slug];
  const cm = cacChuyenMuc(bai)[0];
  const loai = bai.loai_bai ?? "bai_viet";
  const duongCm = cm ? `/blog/chuyen-muc/${encodeURIComponent(cm.slug)}` : null;
  // Tin tức ghi kèm giờ đăng (giờ Việt Nam) — người đọc và Google News cần biết tin mới tới đâu.
  const gioVN = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

  return (
    <KhungBaiDoc mucLuc={tn.muc_luc ? mucLuc : []} tieuDe={bai.tieu_de} nguon="cms" phut={phutDoc(bai.noi_dung_html)} ben={tn.keu_goi_cong_cu ? <CtaBen mang={mang} /> : undefined}>
    <article data-mang-bai={mang}>
      {!nhap && <JsonLd data={goiLd(
        {
          "@type": KIEU_LD[bai.loai_bai ?? "bai_viet"] ?? "BlogPosting",
          "@id": `${urlDayDu(duong)}#bai`,
          headline: bai.tieu_de,
          ...(bai.meta?.description || bai.mo_ta_ngan ? { description: bai.meta?.description || bai.mo_ta_ngan } : {}),
          ...(anhOg ? { image: anhOg.src } : {}),
          inLanguage: "vi-VN",
          ...(bai.publishedAt ? { datePublished: bai.publishedAt } : {}),
          dateModified: bai.updatedAt,
          mainEntityOfPage: urlDayDu(duong),
          author: ky ? ldNguoiCms(ky.n) : { "@id": `${siteUrl()}/#to-chuc` },
          ...(ky?.vai === "tham_dinh" ? { reviewedBy: ldNguoiCms(ky.n) } : {}),
          publisher: { "@id": `${siteUrl()}/#to-chuc` },
          isPartOf: { "@id": `${siteUrl()}/#website` },
          articleSection: TEN_MANG[bai.mang ?? "chung"],
          ...(bai.tu_khoa_chinh || bai.the?.length
            ? { keywords: [bai.tu_khoa_chinh, ...(bai.tu_khoa_phu ?? []), ...(bai.the ?? [])].filter(Boolean).join(", ") } : {}),
          ...(nguon.length ? { citation: nguon.map((n) => (n.url ? { "@type": "CreativeWork", name: n.ten, url: n.url } : n.ten)) } : {}),
          wordCount: html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length,
        },
        ...(coChuyenGiaNoiBo ? [ldNguoi(CHUYEN_GIA[ky!.n.slug!]!)] : []),
        ...(hd.length ? [ldHoiDap(hd.map((h) => ({ hoi: h.cau_hoi, dap: h.tra_loi })))] : []),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Blog", duong: "/blog" },
          ...(cm && duongCm ? [{ ten: cm.ten, duong: duongCm }] : []), { ten: bai.tieu_de, duong }]),
      )} />}

      {nhap && (
        <div role="status" data-testid="dang-xem-nhap"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/50 bg-gold/10 p-4 text-sm">
          <span className="inline-flex items-center gap-2"><Eye className="size-4" aria-hidden /> Đang xem <b>bản nháp</b> — người đọc chưa thấy bản này.</span>
          <a href={`/api/cms/thoat-xem-truoc?slug=${bai.slug}`} className="text-gold underline">Thoát xem trước</a>
        </div>
      )}

      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/blog" className="hover:text-fg">Blog</Link> ›</li>
          {cm && duongCm ? <li><Link href={duongCm} className="hover:text-fg">{cm.ten}</Link></li> : <li>{TEN_MANG[bai.mang ?? "chung"]}</li>}
        </ol>
      </nav>
      {loai !== "bai_viet" && (
        <p className="mt-4"><span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-medium text-gold" data-loai-bai={loai}>{NHAN_LOAI[loai]}</span></p>
      )}

      <h1 className="mt-4 text-3xl leading-tight sm:text-5xl">{bai.tieu_de}</h1>
      {bai.mo_ta_ngan && <p className="mt-4 text-lg text-fg-muted">{bai.mo_ta_ngan}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-fg-faint">
        {xb && <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />
          Đăng <time dateTime={bai.publishedAt!}>{loai === "tin_tuc" ? `${gioVN(bai.publishedAt!)} · ` : ""}{ngayVN(xb)}</time></span>}
        {sua && sua !== xb && <span>· Cập nhật <time dateTime={bai.updatedAt}>{ngayVN(sua)}</time></span>}
        <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{phutDoc(bai.noi_dung_html)} phút đọc</span>
      </div>

      {/* Chữ ký E-E-A-T */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line/70 p-4" data-dong-tac-gia data-ky={ky?.vai ?? "ban_bien_tap"}>
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/50 bg-gold/10 font-serif text-base text-gold">
          {(ky ? (CHUYEN_GIA[ky.n.slug ?? ""]?.ten ?? ky.n.ten) : cg!.ten).split(" ").map((w) => w[0]).join("").slice(0, 3)}
        </span>
        <div className="min-w-0 text-sm leading-relaxed text-fg-muted">
          {ky?.vai === "tac_gia" ? <p>Tác giả: <TenNguoi n={ky.n} /></p>
            : ky?.vai === "tham_dinh" ? <p>Biên soạn &amp; thẩm định: <TenNguoi n={ky.n} /></p>
              : <p>Ban biên tập Hiểu Bản Thân biên soạn · Chủ biên <Link href={duongChuyenGia(CHU_BIEN)} rel="author" className="font-medium text-fg underline decoration-gold/40 underline-offset-2 hover:decoration-gold">{CHUYEN_GIA[CHU_BIEN]!.ten}</Link> duyệt xuất bản</p>}
          {ky && !CHUYEN_GIA[ky.n.slug ?? ""] ? (ky.n.chuc_danh && <p className="text-xs text-fg-faint">{ky.n.chuc_danh}</p>)
            : cg && <p className="text-xs text-fg-faint">{cg.vaiTro} · {cg.tomTat}</p>}
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {ky?.vai === "tac_gia" ? <span className="inline-flex items-center gap-1 text-jade"><ShieldCheck className="size-3.5" aria-hidden /> Chuyên gia tự biên soạn</span>
              : ky?.vai === "tham_dinh" ? <span className="inline-flex items-center gap-1 text-jade"><ShieldCheck className="size-3.5" aria-hidden />
                Đã thẩm định · <time dateTime={bai.ngay_tham_dinh!}>{ngayVN(ngayIso(bai.ngay_tham_dinh)!)}</time></span>
                : <span className="inline-flex items-center gap-1 text-fg-faint"><BookOpen className="size-3.5" aria-hidden /> Biên soạn từ sách và tài liệu tham khảo, ghi rõ nguồn</span>}
            <Link href="/gioi-thieu#quy-trinh" className="text-fg-faint underline underline-offset-2 hover:text-fg">Quy trình biên soạn</Link>
          </p>
        </div>
      </div>

      {anh && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={anh.src} alt={anh.alt} width={anh.w} height={anh.h} fetchPriority="high"
          className="mt-6 aspect-video w-full rounded-2xl border border-line/80 object-cover" />
      )}

      {bai.tra_loi_nhanh && (
        <section aria-label="Trả lời nhanh" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5" data-testid="tra-loi-nhanh">
          <p className="eyebrow">Trả lời nhanh</p>
          <p className="mt-2 leading-relaxed text-fg">{bai.tra_loi_nhanh}</p>
        </section>
      )}

      {tn.muc_luc && <MucLucGon mucLuc={mucLuc} tieuDe={bai.tieu_de} phut={phutDoc(bai.noi_dung_html)} />}

      <div id={THAN_BAI_ID} className={`mt-8 ${nf.articleContent} ${st.noiDung}`} dangerouslySetInnerHTML={{ __html: html }} />
      {!nhap && <MocDocXong moDun="blog" them={{ mang }} />}

      {hd.length > 0 && (
        <section aria-labelledby="hoi-dap" className="mt-12">
          <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
          <div className="mt-4 space-y-3">
            {hd.map((h) => (
              <details key={h.cau_hoi} className="group rounded-2xl border border-line/70 p-4 open:border-gold/40">
                <summary className="cursor-pointer list-none font-medium text-fg marker:hidden">{h.cau_hoi}</summary>
                <p className="mt-2 whitespace-pre-line text-fg-muted">{h.tra_loi}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {nguon.length > 0 && (
        <section aria-labelledby="nguon" className="mt-10 text-sm text-fg-muted">
          <h2 id="nguon" className="text-lg text-fg">Nguồn tham khảo</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {nguon.map((n) => (
              <li key={n.ten}>{n.url ? <a href={n.url} rel="noopener noreferrer" target="_blank" className="underline underline-offset-2">{n.ten}</a> : n.ten}</li>
            ))}
          </ul>
        </section>
      )}

      {tn.keu_goi_cong_cu && <CtaBlog mang={mang} className="mt-12" />}

      {tn.bai_lien_quan && lienQuan.length > 0 && (
        <section aria-labelledby="doc-tiep" className="mt-12">
          <h2 id="doc-tiep" className="text-2xl">Đọc tiếp</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {lienQuan.map((b) => (
              <li key={b.slug}>
                <Link href={`/blog/${b.slug}`} className="glass block h-full rounded-2xl p-4 text-sm hover:border-gold/50">
                  <span className="font-medium text-fg">{b.tieu_de}</span>
                  {b.mo_ta_ngan && <span className="mt-1 line-clamp-2 block text-fg-faint">{b.mo_ta_ngan}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        <p>Nội dung mang tính tham khảo văn hoá, giúp tự soi — không phải lời phán định mệnh, không thay lời khuyên y tế, pháp lý, tài chính.</p>
        <Link href="/blog" className="mt-2 inline-block text-gold hover:underline">← Tất cả bài viết</Link>
      </footer>
    </article>
    </KhungBaiDoc>
  );
}
