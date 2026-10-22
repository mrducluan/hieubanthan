import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { Newsreader, Be_Vietnam_Pro, Noto_Serif_TC } from "next/font/google";
import { HopThoaiSao } from "@/components/sao/HopThoaiSao";
import { GhiVaoTrang } from "@/components/khung/GhiVaoTrang";
import { ChanTrang, KhungChanTrang } from "@/components/khung/ChanTrang";
import { COT_CHAN_TRANG } from "@/lib/menu-chan-trang";
import { ThanhTren, TabDuoi } from "@/components/khung/DieuHuong";
import { TabDuoiCms, ThanhTrenCms } from "@/components/khung/MenuCms";
import { JsonLd } from "@/components/seo/JsonLd";
import { GhiGioiThieu } from "@/components/khung/GhiGioiThieu";
import { GiamSat } from "@/components/khung/GiamSat";
import { GtmNoScript } from "@/components/khung/GoogleTagManager";
import { DoLuongGoogle } from "@/components/khung/DoLuongGoogle";
import { HoiDongYCookie } from "@/components/khung/HoiDongYCookie";
import { goiLd, ldToChuc, ldUngDung, ldWebsite, MO_TA_SITE, siteUrl, TEN_SITE, TU_KHOA_SITE } from "@/lib/seo";
import { ThongBaoSite } from "@/components/khung/ThongBaoSite";
import "./globals.css";
import { DaiXemNhap } from "@/components/cms/DaiXemNhap";
import { ChuChung } from "@/components/cms/ChuChung";
import { chuChungCms } from "@/lib/cms";
import { dangXemNhap } from "@/lib/noi-dung-trang";

// Display: Newsreader — serif, chữ số đẹp cho con số lớn. Body: Be Vietnam Pro — thiết kế cho tiếng Việt.
// PERF-1: tách nghiêng ra bản riêng KHÔNG preload — bản nghiêng (64 KB) chỉ dùng ở vài câu trích, trước đây
// được preload trên mọi trang. Bản thường vẫn preload. Dùng qua lớp .italic trong vùng font-serif (globals.css).
const display = Newsreader({
  subsets: ["vietnamese", "latin"],
  style: ["normal"],
  variable: "--font-display",
  display: "swap",
});
const displayNghieng = Newsreader({
  subsets: ["vietnamese", "latin"],
  style: ["italic"],
  variable: "--font-display-italic",
  display: "swap",
  preload: false,
});
const body = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// Chữ Hán trang trí trên lá số (紫微斗數, 八字…) — chỉ tải khi trang có dùng, không preload.
const han = Noto_Serif_TC({ weight: ["600"], subsets: ["latin"], variable: "--font-han", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Thần số học, Tử vi, Bát tự online miễn phí — Hiểu Bản Thân", template: "%s · Hiểu Bản Thân" },
  description: MO_TA_SITE,
  applicationName: TEN_SITE,
  keywords: TU_KHOA_SITE,
  category: "lifestyle",
  // KHÔNG đặt canonical ở layout (con kế thừa sẽ trỏ hết về "/"); mỗi trang tự khai canonical.
  alternates: { types: { "text/plain": [{ url: "/llms.txt", title: "llms.txt" }] } },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website", locale: "vi_VN", siteName: TEN_SITE, url: "/",
    title: "Hiểu Bản Thân — con số nói gì về bạn", description: MO_TA_SITE, images: ["/og"],
  },
  twitter: { card: "summary_large_image", title: "Hiểu Bản Thân — con số nói gì về bạn", description: MO_TA_SITE, images: ["/og"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  // Xác minh chủ sở hữu (Search Console / Bing Webmaster) bằng thẻ meta — đặt env trên Vercel, không cần sửa DNS.
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
  },
};

export const viewport: Viewport = { themeColor: "#0a0a17", width: "device-width", initialScale: 1 };

/** ND-6: dải "đang xem bản nháp" khi bật chế độ nháp từ CMS. */
async function XemNhap() {
  return (await dangXemNhap()) ? <DaiXemNhap /> : null;
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // CSP-2: nonce của lượt tải (proxy.ts) — đọc header cũng khiến mọi trang render động, bắt buộc để nonce khớp từng lượt.
  const [nonce, chuChung] = await Promise.all([(async () => (await headers()).get("x-nonce") ?? undefined)(), chuChungCms()]);
  return (
    <html lang="vi" className={`${display.variable} ${displayNghieng.variable} ${body.variable} ${han.variable}`}>
      <body>
        <GtmNoScript />
        <JsonLd data={goiLd(ldToChuc(), ldWebsite(), ldUngDung())} />
        <div className="star-field" aria-hidden />
        <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-bg">
          Bỏ qua điều hướng
        </a>
        {/* Nội dung từ CMS chạy song song, không chặn byte đầu của trang khi CMS chậm (audit 2026-10-12). */}
        <Suspense fallback={null}><XemNhap /></Suspense>
        <Suspense fallback={null}><ThongBaoSite /></Suspense>
        <Suspense fallback={<ThanhTren />}><ThanhTrenCms /></Suspense>
        <main id="noi-dung" className="container pb-12 pt-6 md:pb-16 md:pt-10">
          <ChuChung chu={chuChung}>{children}</ChuChung>
        </main>
        <Suspense fallback={<KhungChanTrang cot={COT_CHAN_TRANG} />}><ChanTrang /></Suspense>
        <Suspense fallback={<TabDuoi />}><TabDuoiCms /></Suspense>
        <GhiGioiThieu />
        <GiamSat />
        <HoiDongYCookie />
        <HopThoaiSao />
        <GhiVaoTrang />
        <DoLuongGoogle nonce={nonce} />
      </body>
    </html>
  );
}
