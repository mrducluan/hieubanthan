import type { Metadata } from "next";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { TaiKhoan } from "./TaiKhoan";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo({ title: "Tài khoản", robots: { index: false } }, await layNoiDungTrang("/tai-khoan"));
}

export default function Page() {
  return <TaiKhoan />;
}
