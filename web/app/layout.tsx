import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hiểu Bản Thân",
  description:
    "Nội dung tham khảo văn hoá — thần số học, nhân tướng, tử vi, Kinh Dịch. Không phải dự báo, không thay thế ý kiến chuyên môn.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          background: "#f4f6f4",
          color: "#1d2721",
          lineHeight: 1.6,
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" }}>
          {children}
          <footer
            style={{
              marginTop: 56,
              paddingTop: 20,
              borderTop: "1px solid #d5ddd6",
              fontSize: 13,
              color: "#5b6a60",
            }}
          >
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
