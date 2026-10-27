"use client";
// App đã cài (mở từ biểu tượng màn hình chính) → đăng ký service worker để mất mạng vẫn có trang "Bạn đang ngoại tuyến"
// thay vì trang lỗi của trình duyệt (public/sw.js). Trình duyệt thường không đăng ký gì (site chạy như không có service
// worker), trừ khi người dùng đã bấm "Bật nhắc". sw.js không cache trang nên không có bản cũ nào bị kẹt.
import { useEffect } from "react";
import { dangChayApp } from "@/lib/che-do-app";

export function DangKyApp() {
  useEffect(() => {
    if (!dangChayApp() || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* trình duyệt chặn: app vẫn chạy bình thường */ });
  }, []);
  return null;
}
