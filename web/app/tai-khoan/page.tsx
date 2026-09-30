import type { Metadata } from "next";
import { TaiKhoan } from "./TaiKhoan";

export const metadata: Metadata = { title: "Tài khoản", robots: { index: false } };

export default function Page() {
  return <TaiKhoan />;
}
