import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HinhMang, type KieuMang } from "@/components/minh-hoa/TrangTri";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, metaTrang } from "@/lib/seo";

export const metadata: Metadata = metaTrang({
  tieuDe: "Khám phá: thần số học, Tử vi, Bát tự, Phong thuỷ, Kinh Dịch",
  moTa: "Năm lăng kính nhìn lại bản thân: thần số học, Tử vi, Bát tự, Phong thuỷ, Kinh Dịch — dùng chung một hồ sơ, cách tính minh bạch, diễn giải có nguồn.",
  duong: "/kham-pha",
});

const MANG = [
  { href: "/than-so", ten: "Thần số học", mo: "Bốn con số cốt lõi, dải đời, năm cá nhân, biểu đồ ngày sinh.", can: "Tên + ngày sinh", kieu: "than-so" as KieuMang },
  { href: "/tu-vi", ten: "Tử vi", mo: "Lá số 12 cung, đại hạn – lưu niên – tiểu hạn.", can: "+ giờ sinh, giới tính", kieu: "tu-vi" as KieuMang },
  { href: "/bat-tu", ten: "Bát tự", mo: "Tứ trụ theo tiết khí, ngũ hành, dụng thần hai cách, đại vận.", can: "+ giờ sinh, giới tính", kieu: "bat-tu" as KieuMang },
  { href: "/phong-thuy", ten: "Phong thuỷ", mo: "Mệnh quái, tám hướng du niên, cửa – chủ – bếp, sao năm.", can: "+ giới tính", kieu: "phong-thuy" as KieuMang },
  { href: "/kinh-dich", ten: "Kinh Dịch", mo: "Một quẻ cho một việc — Nghĩa Lý, Lục Hào, Mai Hoa.", can: "Chỉ cần câu hỏi", kieu: "kinh-dich" as KieuMang },
];

export default function KhamPha() {
  return (
    <div>
      <JsonLd data={goiLd(ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Khám phá", duong: "/kham-pha" }]))} />
      <p className="eyebrow">Khám phá</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Năm hệ thống, một hồ sơ</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        Mỗi hệ thống là một lăng kính khác nhau để nhìn lại chính mình. Hồ sơ bạn đã nhập được dùng chung — chỉ hỏi
        thêm giờ sinh hay giới tính khi mảng đó thật sự cần.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {MANG.map(({ href, ten, mo, can, kieu }, i) => (
          <Link key={href} href={href}
            className={`glass group flex flex-col rounded-2xl p-6 transition-colors hover:border-gold/50 ${i === 0 ? "sm:col-span-2" : ""}`}>
            <div className="flex items-center justify-between">
              <HinhMang kieu={kieu} className="h-14 shrink-0" />
              <span className="rounded-full border border-line px-3 py-1 text-xs text-fg-faint">{can}</span>
            </div>
            <h2 className="mt-5 text-2xl">{ten}</h2>
            <p className="mt-1 text-sm text-fg-muted">{mo}</p>
            <span className="mt-4 flex items-center gap-1 text-sm text-gold">Mở <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
          </Link>
        ))}
      </div>
      <Link href="/kien-thuc" className="mt-6 flex items-center justify-between rounded-2xl border border-line/70 p-5 text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">
        <span><b className="text-fg">Thư viện kiến thức</b> — ý nghĩa 12 con số, 64 quẻ, 14 chính tinh</span>
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
