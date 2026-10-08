import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Hexagon, Layers, Orbit, Sparkles, Sun } from "lucide-react";
import { CuaVao } from "@/components/hoso/CuaVao";
import { ChuThichLop } from "@/components/than-so/LopNoiDung";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { TEN_SITE } from "@/lib/seo";

// Mô tả trang chủ ≤ 160 ký tự (mô tả site dài hơn vẫn dùng cho schema/llms.txt).
const TIEU_DE_CHU = "Hiểu Bản Thân — con số nói gì về bạn";
const MO_TA_CHU = "Thần số học và huyền học phương Đông (Tử vi, Bát tự, Kinh Dịch, Phong thuỷ): tính toán minh bạch, diễn giải có nguồn, câu hỏi để tự soi. Miễn phí.";
export const metadata: Metadata = {
  description: MO_TA_CHU,
  alternates: { canonical: "/", types: { "text/markdown": "/index.md" } },
  // openGraph/twitter của trang thay hẳn bản ở layout (không gộp) → khai đủ trường.
  openGraph: { type: "website", locale: "vi_VN", siteName: TEN_SITE, url: "/", title: TIEU_DE_CHU, description: MO_TA_CHU, images: ["/og"] },
  twitter: { card: "summary_large_image", title: TIEU_DE_CHU, description: MO_TA_CHU, images: ["/og"] },
};

const MANG = [
  { href: "/tu-vi", ten: "Tử vi", mo: "Lá số 12 cung, đại hạn, lưu niên", Icon: Orbit },
  { href: "/kinh-dich", ten: "Kinh Dịch", mo: "Gieo một quẻ cho một việc đang cân nhắc", Icon: Hexagon },
  { href: "/bat-tu", ten: "Bát tự", mo: "Tứ trụ, ngũ hành, đại vận", Icon: Layers },
  { href: "/phong-thuy", ten: "Phong thuỷ", mo: "Mệnh quái, hướng nhà hợp tuổi", Icon: Compass },
];

export default function TrangChu() {
  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 pt-2 md:grid-cols-[1.15fr_1fr] md:pt-8">
        <div>
          <p className="eyebrow flex items-center gap-2"><Sparkles className="size-3.5 text-gold" aria-hidden /> Thần số học · Huyền học phương Đông</p>
          <h1 className="mt-4 text-[2.6rem] leading-[1.08] sm:text-6xl">
            Con số nói gì <span className="text-gradient-gold italic">về bạn?</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-fg-muted">
            Từ tên và ngày sinh, xem bốn con số cốt lõi của bạn — phép tính minh bạch, ý nghĩa có nguồn,
            và cả những <span className="text-cinnabar">mặt tối</span> mà hầu hết trang khác giấu đi.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-fg-muted">
            <li className="flex gap-2"><span className="text-jade">✦</span> Kết quả trong chưa đầy 30 giây, không cần tài khoản</li>
            <li className="flex gap-2"><span className="text-gold">✦</span> Mỗi con số kèm câu hỏi để bạn tự kiểm, không phán thay bạn</li>
            <li className="flex gap-2"><span className="text-moon">✦</span> Một hồ sơ dùng cho cả hợp đôi, Tử vi, Kinh Dịch, Bát tự, Phong thuỷ</li>
          </ul>
        </div>
        <CuaVao />
      </section>

      <section aria-labelledby="ba-lop">
        <TieuDeMuc id="ba-lop" nho="Vì sao tin được" lon="Ba lớp, không trộn lẫn"
          mo_ta="Bạn luôn biết câu nào là toán, câu nào là truyền thống, và câu nào là để chính bạn trả lời." />
        <ChuThichLop />
      </section>

      <section aria-labelledby="kham-pha">
        <TieuDeMuc id="kham-pha" nho="Khám phá sâu hơn" lon="Bốn mảng huyền học, một hồ sơ"
          mo_ta="Sau thần số, bạn có thể đi tiếp vào các hệ thống phương Đông — dùng luôn hồ sơ đã nhập, chỉ hỏi thêm giờ sinh khi cần." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MANG.map(({ href, ten, mo, Icon }) => (
            <Link key={href} href={href} className="glass group rounded-2xl p-5 transition-colors hover:border-gold/50">
              <Icon className="size-6 text-gold" aria-hidden />
              <p className="mt-4 font-serif text-xl">{ten}</p>
              <p className="mt-1 text-sm text-fg-muted">{mo}</p>
              <ArrowRight className="mt-4 size-4 text-fg-faint transition-transform group-hover:translate-x-1 group-hover:text-gold" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <section className="glass flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <Sun className="size-8 shrink-0 text-gold" aria-hidden />
        <p className="text-sm text-fg-muted">
          <b className="text-fg">Riêng tư theo mặc định.</b> Tên và ngày sinh lưu trên máy của bạn. Chỉ khi bạn bấm
          “Lưu vào tài khoản” thì hồ sơ mới được lưu trên máy chủ — và bạn xoá được bất cứ lúc nào.
        </p>
      </section>
    </div>
  );
}
