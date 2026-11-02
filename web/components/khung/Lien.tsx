// SỰ CỐ-VERCEL (2026-11-02): link nội bộ của cả site — thay `next/link`, MẶC ĐỊNH KHÔNG prefetch.
//
// Vì sao: mọi trang render động (CSP-2: layout đọc nonce mỗi lượt), nên mỗi lượt Next tải trước một link đang hiện trên
// màn hình (menu, chân trang, thẻ…) là MỘT lần chạy hàm máy chủ + một lần chạy proxy trên Vercel. Đo bản build thật:
// mỗi lượt xem trang sinh 40–100 lượt prefetch → hạn mức gói Vercel cạn ~70 lần nhanh hơn số người xem thật, cả
// tài khoản bị tạm dừng (402 DEPLOYMENT_DISABLED, web + CMS cùng tắt).
// Không prefetch: bấm link vẫn chuyển trang kiểu SPA như cũ, chỉ tải lúc bấm. Chỗ thật sự cần tải trước (rất ít) thì
// truyền `prefetch` rõ ràng. Test `e2e/khong-prefetch.spec.ts` chặn import `next/link` trực tiếp.
import NextLink from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof NextLink>;

export default function Lien({ prefetch = false, ...props }: Props) {
  return <NextLink prefetch={prefetch} {...props} />;
}
