// EN-ALL mục 3.1 — MỘT hàm đọc ngôn ngữ của lượt tải trang ở máy chủ (Server Component, generateMetadata, route handler).
// Nguồn: header `x-ngon-ngu` do proxy.ts đặt theo đường dẫn (/en/… → "en" hoặc biến thể "en-us"); không có → "vi".
import "server-only";
import { headers } from "next/headers";
import { LA_MA_EN } from "@/lib/ngon-ngu";
import type { NgonNgu } from "@/lib/duong-en";

export interface NgonNguTrang {
  /** Ngôn ngữ giao diện ("vi" | "en") — chọn catalog chữ, bảng đường dẫn. */ ngonNgu: NgonNgu;
  /** Mã gửi engine / ghi phiếu ("vi", "en", "en-us"). */ ma: string;
  /** URL người dùng đang thấy (trước rewrite) — dựng canonical, hreflang, nút đổi ngôn ngữ. */ duongHienThi: string;
}

export async function ngonNguMayChu(): Promise<NgonNguTrang> {
  const hd = await headers();
  const ma = (hd.get("x-ngon-ngu") ?? "vi").toLowerCase();
  const en = LA_MA_EN.test(ma);
  return { ngonNgu: en ? "en" : "vi", ma: en ? ma : "vi", duongHienThi: hd.get("x-duong-hien-thi") ?? hd.get("x-duong-dan") ?? "/" };
}
