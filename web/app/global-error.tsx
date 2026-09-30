"use client";
// Lỗi ở chính layout gốc (hiếm): trang tối giản không phụ thuộc layout/CSS của app.
import { useEffect } from "react";
import { baoLoi } from "@/lib/giam-sat";

export default function LoiToanCuc({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { baoLoi(error, { noi: "layout" }); }, [error]);
  return (
    <html lang="vi">
      <body style={{ background: "#0a0a17", color: "#ecebf7", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1 style={{ fontSize: "1.75rem" }}>Hiểu Bản Thân đang gặp trục trặc</h1>
        <p style={{ opacity: 0.75 }}>Lỗi đã được ghi lại. Bạn thử tải lại trang nhé.</p>
        <button onClick={reset} style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem", borderRadius: 999, border: 0, background: "#e9c46a", color: "#0a0a17", fontWeight: 600 }}>
          Thử lại
        </button>
      </body>
    </html>
  );
}
