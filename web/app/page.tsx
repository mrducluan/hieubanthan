import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, ListChecks, Sparkles, Sun, Zap } from "lucide-react";
import { HinhBauTroi, HinhMang, type KieuMang } from "@/components/minh-hoa/TrangTri";
import { CuaVao } from "@/components/hoso/CuaVao";
import { DiemMuLuot } from "@/components/trang-chu/DiemMuLuot";
import { SoSanhChatbot } from "@/components/trang-chu/SoSanhChatbot";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { TEN_SITE } from "@/lib/seo";
import { BannerTrangChu } from "@/components/khung/BannerTrangChu";
import { BaiMoiTrangChu } from "@/components/blog/BaiLienQuanMang";
import { NgayTotTrangChu } from "@/components/hoang-lich/NgayTotTrangChu";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";

// Mô tả trang chủ ≤ 160 ký tự (mô tả site dài hơn vẫn dùng cho schema/llms.txt).
const TIEU_DE_CHU = "Hiểu Bản Thân — con số nói gì về bạn";
const MO_TA_CHU = "Thần số học và huyền học phương Đông (Tử vi, Bát tự, Kinh Dịch, Phong thuỷ): tính toán minh bạch, diễn giải có nguồn, câu hỏi để tự soi. Miễn phí.";
const META: Metadata = {
  description: MO_TA_CHU,
  alternates: { canonical: "/", types: { "text/markdown": "/index.md" } },
  // openGraph/twitter của trang thay hẳn bản ở layout (không gộp) → khai đủ trường.
  openGraph: { type: "website", locale: "vi_VN", siteName: TEN_SITE, url: "/", title: TIEU_DE_CHU, description: MO_TA_CHU, images: ["/og"] },
  twitter: { card: "summary_large_image", title: TIEU_DE_CHU, description: MO_TA_CHU, images: ["/og"] },
};

const DUONG = "/";
const H1_MAC_DINH = "Bạn là số mấy?";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG), { tuyetDoi: true });
}

const MANG: { href: string; ten: string; mo: string; kieu: KieuMang }[] = [
  { href: "/tu-vi", ten: "Tử vi", mo: "Lá số 12 cung, đại hạn, lưu niên", kieu: "tu-vi" },
  { href: "/kinh-dich", ten: "Kinh Dịch", mo: "Gieo một quẻ cho một việc đang cân nhắc", kieu: "kinh-dich" },
  { href: "/bat-tu", ten: "Bát tự", mo: "Tứ trụ, ngũ hành, đại vận", kieu: "bat-tu" },
  { href: "/phong-thuy", ten: "Phong thuỷ", mo: "Mệnh quái, hướng nhà hợp tuổi", kieu: "phong-thuy" },
];

export default async function TrangChu() {
  const nd = await layNoiDungTrang(DUONG);
  return (
    <div className="space-y-14 md:space-y-20">
      {/* UI-HERO: cột trái = lời giới thiệu + ô vào (form/chào lại), cột phải = vòng số lớn có chuyển động → hai cột
          cao gần bằng nhau, không còn khoảng trống trên/dưới thẻ. Dưới lg (điện thoại, máy tính bảng dọc): một cột chữ → ô vào
          → hình (768px chia hai cột thì cột chữ quá hẹp, hình nhỏ giữa khoảng trống lớn). */}
      <section className="relative grid items-center gap-8 pt-2 md:pt-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10" data-testid="hero">
        <div>
          <p className="eyebrow flex items-center gap-2"><Sparkles className="size-3.5 text-gold" aria-hidden /> Thần số học · Huyền học phương Đông</p>
          <h1 className="mt-4 text-[2.6rem] leading-[1.08] sm:text-6xl">
            {nd.dau.h1 && nd.dau.h1 !== H1_MAC_DINH ? nd.dau.h1 : <>Bạn là <span className="text-gradient-gold italic">số mấy?</span></>}
          </h1>
          {/* TC-HOOK: 3 giây đầu — một điểm mù rất đời thường của từng con số → người xem nhận ra mình/người quen
              → muốn biết số của mình. Lời dẫn nói rõ nhận được gì, mất bao lâu. */}
          <DiemMuLuot className="mt-5 max-w-xl" />
          <LoiDanCms nd={nd} className="mt-4 max-w-xl text-lg text-fg-muted">
            Gõ tên và ngày sinh. Nửa phút sau bạn có 4 con số của riêng mình, mỗi số kèm 3 điểm mạnh,
            3 <span className="text-cinnabar">điểm mù</span> — và bạn tự tích xem nó nói trúng mấy điều.
          </LoiDanCms>
          <ul className="mt-5 flex flex-wrap gap-2 text-[0.8rem] text-fg-muted" aria-label="Điểm khác biệt" data-testid="hero-diem">
            {([[Zap, "text-jade", "30 giây · không cần tài khoản"], [Eye, "text-gold", "Nói thật cả điểm mù"], [ListChecks, "text-moon", "Bạn tự chấm đúng – sai"]] as const).map(([Icon, mau, chu]) => (
              <li key={chu} className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-surface/50 px-3 py-1 backdrop-blur">
                <Icon className={`size-3.5 ${mau}`} aria-hidden />{chu}
              </li>
            ))}
          </ul>
          <div className="mt-7 max-w-xl"><CuaVao /></div>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-[8%] rounded-full bg-gold/10 blur-3xl" aria-hidden />
          <HinhBauTroi className="relative mx-auto max-w-[19rem] sm:max-w-[24rem] lg:max-w-[32rem]" />
        </div>
      </section>

      {/* HL-1: điểm nhấn thứ hai sau hồ sơ thần số — hoàng lịch hôm nay (người Việt mở xem mỗi ngày). */}
      <Suspense fallback={null}><NgayTotTrangChu className="hien-dan" /></Suspense>

      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" />

      <Suspense fallback={null}><BannerTrangChu /></Suspense>

      {/* TC-HOOK: thay "Ba lớp" — so với nhóm chatbot AI đa năng (không nêu tên hãng, xem SoSanhChatbot). */}
      <section aria-labelledby="vi-sao-chon">
        <TieuDeMuc id="vi-sao-chon" nho="Vì sao xem ở đây" lon="Chatbot trả lời rất trôi. Nhưng con số có đúng không?"
          mo_ta="Hỏi chatbot AI về thần số hay lá số, câu trả lời lúc nào cũng nghe hay. Cái khó là biết câu nào đúng, câu nào tự bịa." />
        <SoSanhChatbot />
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

      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" />

      <Suspense fallback={null}><BaiMoiTrangChu className="hien-dan" /></Suspense>

      <section className="glass flex items-start gap-4 rounded-2xl p-5 sm:items-center sm:p-6">
        <Sun className="size-7 shrink-0 text-gold sm:size-8" aria-hidden />
        <p className="text-sm text-fg-muted">
          <b className="text-fg">Riêng tư theo mặc định.</b> Tên và ngày sinh lưu trên máy của bạn. Chỉ khi bạn bấm
          “Lưu vào tài khoản” thì hồ sơ mới được lưu trên máy chủ — và bạn xoá được bất cứ lúc nào.
        </p>
      </section>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" />
    </div>
  );
}
