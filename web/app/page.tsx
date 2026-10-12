import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Sun } from "lucide-react";
import { HinhBauTroi, HinhMang, type KieuMang } from "@/components/minh-hoa/TrangTri";
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

const MANG: { href: string; ten: string; mo: string; kieu: KieuMang }[] = [
  { href: "/tu-vi", ten: "Tử vi", mo: "Lá số 12 cung, đại hạn, lưu niên", kieu: "tu-vi" },
  { href: "/kinh-dich", ten: "Kinh Dịch", mo: "Gieo một quẻ cho một việc đang cân nhắc", kieu: "kinh-dich" },
  { href: "/bat-tu", ten: "Bát tự", mo: "Tứ trụ, ngũ hành, đại vận", kieu: "bat-tu" },
  { href: "/phong-thuy", ten: "Phong thuỷ", mo: "Mệnh quái, hướng nhà hợp tuổi", kieu: "phong-thuy" },
];

export default function TrangChu() {
  return (
    <div className="space-y-14 md:space-y-20">
      <section className="grid items-center gap-8 pt-2 md:grid-cols-[1.15fr_1fr] md:gap-x-10 md:gap-y-6 md:pt-8">
        <div className="md:self-end">
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
        {/* Điện thoại: form ngay sau lời giới thiệu (không bắt cuộn qua hình); máy tính: hình nằm dưới chữ, form cột phải. */}
        <div className="md:col-start-2 md:row-span-2 md:row-start-1"><CuaVao /></div>
        <HinhBauTroi className="mx-auto max-w-[17rem] sm:max-w-[20rem] md:mx-0 md:max-w-[22rem] md:self-start" />
      </section>

      <section aria-labelledby="ba-lop" className="hien-dan">
        <TieuDeMuc id="ba-lop" nho="Vì sao tin được" lon="Ba lớp, không trộn lẫn"
          mo_ta="Bạn luôn biết câu nào là toán, câu nào là truyền thống, và câu nào là để chính bạn trả lời." />
        <ChuThichLop />
      </section>

      <section aria-labelledby="kham-pha" className="hien-dan">
        <TieuDeMuc id="kham-pha" nho="Khám phá sâu hơn" lon="Bốn mảng huyền học, một hồ sơ"
          mo_ta="Sau thần số, bạn có thể đi tiếp vào các hệ thống phương Đông — dùng luôn hồ sơ đã nhập, chỉ hỏi thêm giờ sinh khi cần." />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {MANG.map(({ href, ten, mo, kieu }) => (
            <Link key={href} href={href} className="glass group flex flex-col rounded-2xl p-4 hover:border-gold/50 sm:p-5">
              <HinhMang kieu={kieu} className="h-14 self-start origin-left transition-transform duration-300 group-hover:scale-105 sm:h-16" />
              <p className="mt-3 font-serif text-lg sm:mt-4 sm:text-xl">{ten}</p>
              <p className="mt-1 text-sm text-fg-muted">{mo}</p>
              <span className="mt-auto block pt-4"><ArrowRight className="size-4 text-fg-faint transition-transform group-hover:translate-x-1 group-hover:text-gold" aria-hidden /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="glass flex items-start gap-4 rounded-2xl p-5 sm:items-center sm:p-6">
        <Sun className="size-7 shrink-0 text-gold sm:size-8" aria-hidden />
        <p className="text-sm text-fg-muted">
          <b className="text-fg">Riêng tư theo mặc định.</b> Tên và ngày sinh lưu trên máy của bạn. Chỉ khi bạn bấm
          “Lưu vào tài khoản” thì hồ sơ mới được lưu trên máy chủ — và bạn xoá được bất cứ lúc nào.
        </p>
      </section>
    </div>
  );
}
