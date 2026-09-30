import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Newsreader, Be_Vietnam_Pro } from "next/font/google";
import { ThanhTren, TabDuoi } from "@/components/khung/DieuHuong";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Hiểu Bản Thân — con số nói gì về bạn", template: "%s · Hiểu Bản Thân" },
  description:
    "Khám phá bản thân qua thần số học và huyền học phương Đông — có tính toán minh bạch, diễn giải có nguồn, và câu hỏi để bạn tự soi. Tham khảo văn hoá, không phải dự báo.",
};

export const viewport: Viewport = { themeColor: "#0a0a17", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="star-field" aria-hidden />
        <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-bg">
          Bỏ qua điều hướng
        </a>
        <ThanhTren />
        <main id="noi-dung" className="container pb-28 pt-6 md:pb-16 md:pt-10">
          {children}
        </main>
        <footer className="container pb-28 md:pb-10">
          <p className="max-w-2xl border-t border-line/60 pt-6 text-xs leading-relaxed text-fg-faint">
            Nội dung được biên soạn từ các thư tịch văn hoá cổ điển, cung cấp để tham khảo văn hoá và tự
            suy ngẫm. Đây không phải dự báo, không phải lời khuyên, và không thay thế ý kiến chuyên môn về
            y tế, pháp lý, tài chính hoặc nghề nghiệp.
          </p>
        </footer>
        <TabDuoi />
      </body>
    </html>
  );
}
