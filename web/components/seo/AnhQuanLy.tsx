// QLNS-2 — hình minh hoạ có chữ thật cho trang /quan-ly-nhan-su: <img> PNG do route /og/quan-ly vẽ (Google Hình ảnh lấy được,
// khác SVG nội dòng) + alt + chú thích + ImageObject. Chữ trong ảnh, alt, chú thích cùng từ lib/quan-ly-hinh.ts (một nguồn).
// Kho engine bận → không hiện hình (trang vẫn đủ chữ).
import { JsonLd } from "@/components/seo/JsonLd";
import type { DanhMucQuanLy } from "@/lib/quan-ly-danh-muc";
import { hinhQL, urlHinhQL, type KieuHinhQL } from "@/lib/quan-ly-hinh";
import { banQuyenAnh, goiLd, urlDayDu } from "@/lib/seo";

export function AnhQuanLy({ kieu, dm, className = "my-6" }: { kieu: KieuHinhQL; dm: DanhMucQuanLy | null; className?: string }) {
  const h = hinhQL(kieu, dm);
  if (!h) return null;
  const src = urlHinhQL(kieu);
  return (
    <figure className={className} data-testid={`anh-ql-${kieu}`}>
      <JsonLd data={goiLd({ "@type": "ImageObject", contentUrl: urlDayDu(src), url: urlDayDu(src), width: 1200, height: 630,
        name: h.tieuDe, caption: h.alt, encodingFormat: "image/png", ...banQuyenAnh() })} />
      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh do route của site vẽ, cần URL ổn định cho Google Hình ảnh */}
      <img src={src} alt={h.alt} width={1200} height={630} loading="lazy" decoding="async"
        className="h-auto w-full rounded-2xl border border-line shadow-lg" />
      <figcaption className="mt-2 text-center text-sm text-fg-faint">{h.chuThich}</figcaption>
    </figure>
  );
}
