import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { ArrowRight } from "lucide-react";
import { HinhMang, type KieuMang } from "@/components/minh-hoa/TrangTri";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, metaTrang } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { taoChu } from "@/lib/chu-trang";
import { CHU_KHAM_PHA } from "@/lib/chu/trang-tinh";

const META: Metadata = metaTrang({
  tieuDe: "Khám phá: thần số học, Tử vi, Bát tự, Phong thuỷ, Kinh Dịch",
  moTa: "Năm lăng kính nhìn lại bản thân: thần số học, Tử vi, Bát tự, Phong thuỷ, Kinh Dịch — dùng chung một hồ sơ, cách tính minh bạch, diễn giải có nguồn.",
  duong: "/kham-pha",
});

const DUONG = "/kham-pha";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

// Chữ thẻ: bảng chữ lib/chu/trang-tinh.ts (the.<khoa>_ten / _mo / _can) — sửa được ở CMS.
const MANG: { href: string; khoa: string; kieu: KieuMang }[] = [
  { href: "/than-so", khoa: "than_so", kieu: "than-so" },
  { href: "/tu-vi", khoa: "tu_vi", kieu: "tu-vi" },
  { href: "/bat-tu", khoa: "bat_tu", kieu: "bat-tu" },
  { href: "/phong-thuy", khoa: "phong_thuy", kieu: "phong-thuy" },
  { href: "/kinh-dich", khoa: "kinh_dich", kieu: "kinh-dich" },
];

export default async function KhamPha() {
  const nd = await layNoiDungTrang(DUONG);
  const c = taoChu(CHU_KHAM_PHA, nd.chu);
  return (
    <div>
      <JsonLd data={goiLd(ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Khám phá", duong: "/kham-pha" }]))} />
      <p className="eyebrow">{c("dau.nhan_tren")}</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">{nd.dau.h1 ?? "Năm hệ thống, một hồ sơ"}</h1>
      <LoiDanCms nd={nd} className="mt-3 max-w-2xl text-fg-muted">
        Mỗi hệ thống là một lăng kính khác nhau để nhìn lại chính mình. Hồ sơ bạn đã nhập được dùng chung — chỉ hỏi
        thêm giờ sinh hay giới tính khi mảng đó thật sự cần.
      </LoiDanCms>
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-8" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {MANG.map(({ href, khoa, kieu }, i) => (
          <Link key={href} href={href}
            className={`hien-dan glass group flex flex-col rounded-2xl p-5 hover:border-gold/50 sm:p-6 ${i === 0 ? "sm:col-span-2" : ""}`}>
            <div className="flex items-center justify-between">
              <HinhMang kieu={kieu} className="h-14 shrink-0 origin-left transition-transform duration-300 group-hover:scale-105" />
              <span className="rounded-full border border-line px-3 py-1 text-xs text-fg-faint">{c(`the.${khoa}_can`)}</span>
            </div>
            <h2 className="mt-5 text-2xl">{c(`the.${khoa}_ten`)}</h2>
            <p className="mt-1 text-sm text-fg-muted">{c(`the.${khoa}_mo`)}</p>
            <span className="mt-4 flex items-center gap-1 text-sm text-gold">{c("the.nut")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
          </Link>
        ))}
      </div>
      <Link href="/kien-thuc" className="mt-6 flex items-center justify-between rounded-2xl border border-line/70 p-5 text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">
        <span><b className="text-fg">{c("thu_vien.dam")}</b> {c("thu_vien.chu")}</span>
        <ArrowRight className="size-4" aria-hidden />
      </Link>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-12" />
      <Suspense fallback={null}><BaiLienQuanMang mang={null} tieuDe="Bài viết mới" className="mt-12" /></Suspense>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />
    </div>
  );
}
