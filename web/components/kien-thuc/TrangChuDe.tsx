// Trang cụm kiến thức (vd /kinh-dich/que, /tu-vi/sao-o-cung): danh sách mọi bài, render phía server. Schema: CollectionPage +
// ItemList. QH-URL: cụm nằm dưới trang công cụ của mảng (trang trụ) — breadcrumb Trang chủ › {mảng} › {cụm}.
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHU_DE, HINH_CHU_DE, TEN_MANG_SILO, duongTrang, mucLuc, truCua } from "@/lib/kien-thuc";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { HinhMang } from "@/components/minh-hoa/TrangTri";
import { goiLd, ldDuongDan, ldThucThe, mangTheoDuong, metaTrang, siteUrl, urlDayDu } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

// Chủ đề kiến thức → mảng bài CMS, suy từ trang công cụ của chủ đề (CHU_DE[x].mang) — thêm chủ đề không phải sửa ở đây.
const MANG_CONG_CU: Record<string, string> = {
  "/than-so": "than_so", "/hop-doi": "than_so", "/tu-vi": "tu_vi", "/bat-tu": "bat_tu", "/kinh-dich": "kinh_dich", "/phong-thuy": "phong_thuy",
};

export async function metaChuDe(khoa: string | null): Promise<Metadata> {
  const cd = khoa ? CHU_DE[khoa] : undefined;
  if (!cd) return { title: "Không tìm thấy", robots: { index: false } };
  // SEO-K: metaTrang dựng đủ bộ OG + Twitter (trước đây twitter kế thừa tiêu đề trang chủ) + ảnh có hình theo mảng.
  return apDungSeo(metaTrang({ tieuDe: cd.ten, moTa: cd.mo_ta, duong: cd.duong, md: `${cd.duong}.md` }), await layNoiDungTrang(cd.duong));
}

export async function TrangChuDe({ khoa }: { khoa: string | null }) {
  const cd = khoa ? CHU_DE[khoa] : undefined;
  if (!khoa || !cd) notFound();
  const duong = cd.duong, tru = truCua(duong);
  const [tatCa, nd] = await Promise.all([mucLuc(), layNoiDungTrang(duong)]);
  const ds = tatCa.filter((t) => t.loai === cd.loai);
  // SEO-L3: cụm rỗng = engine chưa trả mục lục (lỗi) → 5xx thay vì trang 200 rỗng (soft-404).
  if (ds.length === 0) throw new Error("engine chưa trả mục lục kiến thức");
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        { "@type": "CollectionPage", "@id": `${urlDayDu(duong)}#trang`, name: cd.ten, description: cd.mo_ta, url: urlDayDu(duong), inLanguage: "vi-VN",
          isPartOf: { "@id": `${siteUrl()}/#website` }, publisher: { "@id": `${siteUrl()}/#to-chuc` },
          about: [ldThucThe(mangTheoDuong(duong))].filter(Boolean),
          mainEntity: { "@type": "ItemList", numberOfItems: ds.length,
            itemListElement: ds.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(duongTrang(t.loai, t.slug)), name: t.tieu_de })) } },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: TEN_MANG_SILO[tru] ?? "Kiến thức", duong: tru }, { ten: cd.ten, duong }]),
      )} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint"><Link href={tru} className="hover:text-fg">{TEN_MANG_SILO[tru] ?? "Kiến thức"}</Link> ›</nav>
      <HinhMang kieu={HINH_CHU_DE[khoa] ?? "than-so"} className="mt-4 h-20" />
      <h1 className="mt-3 text-4xl sm:text-5xl">{nd.dau.h1 ?? cd.ten}</h1>
      <LoiDanCms nd={nd} className="mt-3 max-w-2xl text-fg-muted">{cd.mo_ta}</LoiDanCms>
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mt-8" />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {ds.map((t) => (
          <li key={t.slug}>
            <Link href={duongTrang(t.loai, t.slug)} className="glass block h-full rounded-2xl p-5 transition-colors hover:border-gold/50">
              <h2 className="text-lg leading-snug">{t.tieu_de}</h2>
              <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{t.mo_ta}</p>
            </Link>
          </li>
        ))}
      </ul>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-12" />
      <Suspense fallback={null}><BaiLienQuanMang mang={MANG_CONG_CU[cd.mang] ?? null} className="mt-12" /></Suspense>
    </div>
  );
}
