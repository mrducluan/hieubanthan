// SEO-N (mục 5): ảnh lá số Tử vi mẫu dạng <img> (Google Hình ảnh không lấy SVG nội dòng) — chụp từ lá số minh hoạ
// /tu-vi/la-so-mau/tu-phu-dong-cung (nhân vật giả định "Minh An", không phải người thật). Chụp lại khi đổi giao diện lá số.
import Lien from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, urlDayDu } from "@/lib/seo";

const ANH = "/anh/la-so-tu-vi-mau.webp";
const ALT = "Lá số Tử vi mẫu 12 cung: Tử Vi – Thiên Phủ đồng cung ở Mệnh, Can chi Mậu Ngọ, Thuỷ Nhị Cục";

export function AnhLaSoMau() {
  return (
    <section aria-labelledby="anh-la-so-mau" className="mx-auto mt-12 max-w-3xl">
      <JsonLd data={goiLd({ "@type": "ImageObject", contentUrl: urlDayDu(ANH), url: urlDayDu(ANH), width: 1024, height: 1127,
        name: "Lá số Tử vi mẫu", caption: ALT, encodingFormat: "image/webp", creditText: "Hiểu Bản Thân", copyrightNotice: "Hiểu Bản Thân",
        representativeOfPage: false })} />
      <h2 id="anh-la-so-mau" className="text-2xl text-fg">Lá số Tử vi trông thế nào?</h2>
      <figure className="mt-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tĩnh cố định, muốn URL ổn định cho Google Hình ảnh */}
        <img src={ANH} alt={ALT} width={1024} height={1127} loading="lazy" decoding="async" className="h-auto w-full rounded-2xl border border-line" />
        <figcaption className="mt-2 text-sm text-fg-muted">
          Một lá số Tử vi mẫu (nhân vật minh hoạ): 12 cung xếp quanh ô giữa ghi can chi, bản mệnh, cục. Cung sáng viền vàng là cung Mệnh.{" "}
          <Lien href="/tu-vi/la-so-mau/tu-phu-dong-cung" className="text-gold underline-offset-4 hover:underline">Đọc lá số này từng bước →</Lien>
        </figcaption>
      </figure>
    </section>
  );
}
