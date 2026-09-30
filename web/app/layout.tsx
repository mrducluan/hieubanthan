import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Newsreader, Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import { ThanhTren, TabDuoi } from "@/components/khung/DieuHuong";
import { JsonLd } from "@/components/seo/JsonLd";
import { GhiGioiThieu } from "@/components/khung/GhiGioiThieu";
import { goiLd, ldToChuc, ldUngDung, ldWebsite, MO_TA_SITE, siteUrl, TEN_SITE } from "@/lib/seo";
import "./globals.css";

// Display: Newsreader — serif, chữ số đẹp cho con số lớn. Body: Be Vietnam Pro — thiết kế cho tiếng Việt.
const display = Newsreader({
  subsets: ["vietnamese", "latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const body = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Hiểu Bản Thân — con số nói gì về bạn", template: "%s · Hiểu Bản Thân" },
  description: MO_TA_SITE,
  applicationName: TEN_SITE,
  keywords: ["thần số học", "thần số học Pythagoras", "số chủ đạo", "số đường đời", "tử vi", "lá số tử vi",
    "bát tự", "tứ trụ", "kinh dịch", "64 quẻ", "phong thuỷ", "mệnh quái", "hợp đôi thần số", "khám phá bản thân"],
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
};

export const viewport: Viewport = { themeColor: "#0a0a17", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body>
        <JsonLd data={goiLd(ldToChuc(), ldWebsite(), ldUngDung())} />
        <div className="star-field" aria-hidden />
        <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-bg">
          Bỏ qua điều hướng
        </a>
        <ThanhTren />
        <main id="noi-dung" className="container pb-28 pt-6 md:pb-16 md:pt-10">
          {children}
        </main>
        <footer className="container pb-28 md:pb-10">
          <nav aria-label="Liên kết cuối trang" className="border-t border-line/60 pt-6 text-sm">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-fg-muted">
              <li><Link href="/kien-thuc" className="hover:text-fg">Thư viện kiến thức</Link></li>
              <li><Link href="/kien-thuc/than-so" className="hover:text-fg">Ý nghĩa các con số</Link></li>
              <li><Link href="/kien-thuc/kinh-dich" className="hover:text-fg">64 quẻ Kinh Dịch</Link></li>
              <li><Link href="/kien-thuc/tu-vi" className="hover:text-fg">14 chính tinh Tử vi</Link></li>
              <li><Link href="/kham-pha" className="hover:text-fg">Khám phá</Link></li>
              <li><Link href="/hop-doi" className="hover:text-fg">Hợp đôi</Link></li>
            </ul>
          </nav>
          <p className="mt-5 max-w-2xl text-xs leading-relaxed text-fg-faint">
            Nội dung được biên soạn từ các thư tịch văn hoá cổ điển, cung cấp để tham khảo văn hoá và tự
            suy ngẫm. Đây không phải dự báo, không phải lời khuyên, và không thay thế ý kiến chuyên môn về
            y tế, pháp lý, tài chính hoặc nghề nghiệp.
          </p>
        </footer>
        <TabDuoi />
        <GhiGioiThieu />
      </body>
    </html>
  );
}
