import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

// Display: Newsreader — serif học thuật, chữ số đẹp, hợp "sách số / lịch cổ".
// Body: Be Vietnam Pro — sans thiết kế riêng cho tiếng Việt.
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
  title: "Hiểu Bản Thân",
  description:
    "Nội dung tham khảo văn hoá — thần số học, nhân tướng, tử vi, Kinh Dịch. Không phải dự báo, không thay thế ý kiến chuyên môn.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="shell">
          {children}
          <footer className="site-disclaimer">
            Nội dung trên trang được biên soạn từ các thư tịch văn hoá cổ điển,
            cung cấp với mục đích tham khảo văn hoá và giải trí. Đây không phải
            dự báo, không phải lời khuyên, và không thay thế ý kiến chuyên môn
            về y tế, pháp lý, tài chính hoặc nghề nghiệp.
          </footer>
        </div>
      </body>
    </html>
  );
}
