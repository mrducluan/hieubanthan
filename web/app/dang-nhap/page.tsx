import type { Metadata } from "next";
import { Suspense } from "react";
import { DangNhap } from "./DangNhap";

export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <DangNhap />
    </Suspense>
  );
}
