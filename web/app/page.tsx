import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, ListChecks, Sparkles, Sun, Zap } from "lucide-react";
import { HinhBauTroi, HinhMang, type KieuMang } from "@/components/minh-hoa/TrangTri";
import { CuaVao } from "@/components/hoso/CuaVao";
import { DiemMuLuot } from "@/components/trang-chu/DiemMuLuot";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { taoChu } from "@/lib/chu-trang";
import { CHU_TRANG_CHU, SO_DIEM_MU } from "@/lib/chu/trang-chu";
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

// Chữ thẻ: bảng chữ trang chủ (mang.<khoa>_ten / _mo).
const MANG: { href: string; khoa: string; kieu: KieuMang }[] = [
  { href: "/tu-vi", khoa: "tu_vi", kieu: "tu-vi" },
  { href: "/kinh-dich", khoa: "kinh_dich", kieu: "kinh-dich" },
  { href: "/bat-tu", khoa: "bat_tu", kieu: "bat-tu" },
  { href: "/phong-thuy", khoa: "phong_thuy", kieu: "phong-thuy" },
];

export default async function TrangChu() {
  const nd = await layNoiDungTrang(DUONG);
  const c = taoChu(CHU_TRANG_CHU, nd.chu);
  return (
    <div className="space-y-14 md:space-y-20">
      {/* UI-HERO: cột trái = lời giới thiệu + ô vào (form/chào lại), cột phải = vòng số lớn có chuyển động → hai cột
          cao gần bằng nhau, không còn khoảng trống trên/dưới thẻ. Dưới lg (điện thoại, máy tính bảng dọc): một cột chữ → ô vào
          → hình (768px chia hai cột thì cột chữ quá hẹp, hình nhỏ giữa khoảng trống lớn). */}
      <section className="relative grid items-center gap-8 pt-2 md:pt-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10" data-testid="hero">
        <div>
          <p className="eyebrow flex items-center gap-2"><Sparkles className="size-3.5 text-gold" aria-hidden /> {c("dau.nhan_tren")}</p>
          <h1 className="mt-4 text-[2.6rem] leading-[1.08] sm:text-6xl">
            {nd.dau.h1 && nd.dau.h1 !== H1_MAC_DINH
              ? <ChuNhan chu={nd.dau.h1} lopNhan="text-gradient-gold italic" />
              : <>Bạn là <span className="text-gradient-gold italic">số mấy?</span></>}
          </h1>
          {/* TC-HOOK: 3 giây đầu — một điểm mù rất đời thường của từng con số → người xem nhận ra mình/người quen
              → muốn biết số của mình. Lời dẫn nói rõ nhận được gì, mất bao lâu. */}
          <DiemMuLuot className="mt-5 max-w-xl" nhan={c("diem_mu.nhan")}
            cau={Array.from({ length: SO_DIEM_MU }, (_, i) => c(`diem_mu.cau_${i + 1}`))} />
          <LoiDanCms nd={nd} className="mt-4 max-w-xl text-lg text-fg-muted" lopNhan="text-cinnabar" />
          <ul className="mt-5 flex flex-wrap gap-2 text-[0.8rem] text-fg-muted" aria-label="Điểm khác biệt" data-testid="hero-diem">
            {([[Zap, "text-jade", c("dau.chip_1")], [Eye, "text-gold", c("dau.chip_2")], [ListChecks, "text-moon", c("dau.chip_3")]] as const).map(([Icon, mau, chu]) => (
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
        <TieuDeMuc id="vi-sao-chon" nho={c("so_sanh.nho")} lon={c("so_sanh.lon")} mo_ta={c("so_sanh.mo_ta")} />
        <SoSanhChatbot c={c} />
      </section>

      <section aria-labelledby="kham-pha" className="hien-dan">
        <TieuDeMuc id="kham-pha" nho={c("mang.nho")} lon={c("mang.lon")} mo_ta={c("mang.mo_ta")} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {MANG.map(({ href, khoa, kieu }) => (
            <Link key={href} href={href} className="glass group flex flex-col rounded-2xl p-4 hover:border-gold/50 sm:p-5">
              <HinhMang kieu={kieu} className="h-14 self-start origin-left transition-transform duration-300 group-hover:scale-105 sm:h-16" />
              <p className="mt-3 font-serif text-lg sm:mt-4 sm:text-xl">{c(`mang.${khoa}_ten`)}</p>
              <p className="mt-1 text-sm text-fg-muted">{c(`mang.${khoa}_mo`)}</p>
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
          <b className="text-fg">{c("rieng_tu.dam")}</b> {c("rieng_tu.chu")}
        </p>
      </section>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" />
    </div>
  );
}
