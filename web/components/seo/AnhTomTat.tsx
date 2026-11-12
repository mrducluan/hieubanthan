// SEO-O — ảnh tóm tắt có chữ thật (<img>, Google Hình ảnh lấy được) + alt + chú thích + ImageObject, đặt trong trang
// năm / lịch âm / tuổi / ngày tốt. Ý chính do engine tính (lib/tom-tat-anh.ts), dùng chung với route vẽ ảnh /og/tom-tat
// nên alt luôn khớp chữ trong ảnh. Engine lỗi → không hiện gì (trang vẫn đủ nội dung chữ).
import { JsonLd } from "@/components/seo/JsonLd";
import { banQuyenAnh, goiLd, urlDayDu } from "@/lib/seo";
import { tomTatAnh, urlAnhTomTat, type ThamSoTomTat } from "@/lib/tom-tat-anh";

export async function AnhTomTat({ className = "mt-10", ...ts }: ThamSoTomTat & { className?: string }) {
  const t = await tomTatAnh(ts);
  if (!t) return null;
  const src = urlAnhTomTat(ts);
  return (
    <figure className={`${className} mx-auto max-w-md`} data-testid="anh-tom-tat">
      <JsonLd data={goiLd({ "@type": "ImageObject", contentUrl: urlDayDu(src), url: urlDayDu(src), width: 1080, height: 1350,
        name: t.tieuDe, caption: t.alt, encodingFormat: "image/png", ...banQuyenAnh() })} />
      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh do route của site vẽ, cần URL ổn định cho Google Hình ảnh */}
      <img src={src} alt={t.alt} width={1080} height={1350} loading="lazy" decoding="async"
        className="h-auto w-full rounded-2xl border border-line shadow-lg" />
      <figcaption className="mt-2 text-center text-sm text-fg-muted">{t.tieuDe} — tóm tắt từ dữ liệu trang, lưu ảnh để gửi người nhà.</figcaption>
    </figure>
  );
}
