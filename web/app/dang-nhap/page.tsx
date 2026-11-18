import type { Metadata } from "next";
import { Suspense } from "react";
import { DangNhap } from "./DangNhap";
import { cauHinhGoogle } from "@/lib/google-dang-nhap";

export const metadata: Metadata = { title: "Đăng nhập", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      {/* DN-3: có GOOGLE_CLIENT_ID/SECRET → nút Google đi qua hieuban.com (không lộ tên miền Supabase). */}
      <DangNhap googleQuaSite={cauHinhGoogle() !== null} />
    </Suspense>
  );
}
