// MAU6 — mục lục 6 lá số minh hoạ (nhân vật hư cấu) đọc từng bước. Server Component cho SEO.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { dsLaSoMau } from "@/lib/kien-thuc";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, metaTrang } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

export const revalidate = 21600;

const META: Metadata = metaTrang({
  tieuDe: "Lá số Tử vi mẫu — đọc từng bước cho người mới",
  moTa: "6 lá số Tử vi minh hoạ được đọc từng bước: Mệnh–Thân, chính tinh, độ sáng, tam phương tứ chính, cách cục, tứ hoá, đại hạn, lưu niên — kèm giải nghĩa thuật ngữ.",
  duong: "/la-so-mau",
});

const DUONG = "/la-so-mau";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const [ds, nd] = await Promise.all([dsLaSoMau(), layNoiDungTrang(DUONG)]);
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Lá số mẫu", duong: "/la-so-mau" }]))} />
      <p className="eyebrow">Học đọc lá số</p>
      <h1 className="mt-2 text-3xl leading-tight sm:text-5xl">{nd.dau.h1 ?? "Lá số Tử vi mẫu — đọc từng bước"}</h1>
      <LoiDanCms nd={nd} className="mt-4 max-w-2xl text-fg-muted">
        Mỗi lá là một kiểu lá số tiêu biểu, đọc theo đúng thứ tự người xem tử vi vẫn làm: từ cung Mệnh, chính tinh, tam phương
        tứ chính, cách cục, tứ hoá cho tới đại hạn và lưu niên. Thuật ngữ nào cũng có lời giải nghĩa đời thường.
      </LoiDanCms>
      <p className="mt-2 text-sm text-fg-faint">Nhân vật và ngày sinh là hư cấu, chọn để minh hoạ — không phải người thật.</p>
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-8" />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2" data-testid="ds-la-so-mau">
        {ds.map((m) => (
          <li key={m.slug}>
            <Link href={`/la-so-mau/${m.slug}`} className="glass group block h-full rounded-2xl p-5 transition-colors hover:border-gold/50">
              <p className="text-xs uppercase tracking-[0.15em] text-gold">{m.ten}</p>
              <h2 className="mt-1 font-serif text-xl">{m.tieu_de}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{m.mo_ta}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-gold">Đọc từng bước <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
      {!ds.length && <p className="mt-8 text-fg-faint">Chưa tải được danh sách — thử lại sau ít phút.</p>}
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-12" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />
    </div>
  );
}
