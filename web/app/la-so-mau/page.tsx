// MAU6 — mục lục 6 lá số minh hoạ (nhân vật hư cấu) đọc từng bước. Server Component cho SEO.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { dsLaSoMau } from "@/lib/kien-thuc";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Lá số Tử vi mẫu — đọc từng bước cho người mới",
  description: "6 lá số Tử vi minh hoạ (nhân vật hư cấu) được đọc từng bước: Mệnh–Thân, chính tinh và độ sáng, tam phương tứ chính, cách cục, tứ hoá, đại hạn, lưu niên — kèm giải nghĩa thuật ngữ.",
  alternates: { canonical: "/la-so-mau" },
};

export default async function Page() {
  const ds = await dsLaSoMau();
  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">Học đọc lá số</p>
      <h1 className="mt-2 text-3xl leading-tight sm:text-5xl">Lá số Tử vi mẫu — đọc từng bước</h1>
      <p className="mt-4 max-w-2xl text-fg-muted">
        Mỗi lá là một kiểu lá số tiêu biểu, đọc theo đúng thứ tự người xem tử vi vẫn làm: từ cung Mệnh, chính tinh, tam phương
        tứ chính, cách cục, tứ hoá cho tới đại hạn và lưu niên. Thuật ngữ nào cũng có lời giải nghĩa đời thường.
      </p>
      <p className="mt-2 text-sm text-fg-faint">Nhân vật và ngày sinh là hư cấu, chọn để minh hoạ — không phải người thật.</p>
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
    </div>
  );
}
