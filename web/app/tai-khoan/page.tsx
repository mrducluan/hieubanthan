import type { Metadata } from "next";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { vanHanh } from "@/lib/van-hanh";
import { TaiKhoan } from "./TaiKhoan";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo({ title: "Tài khoản", robots: { index: false } }, await layNoiDungTrang("/tai-khoan"));
}

export default function Page() {
  // ĐY-1: hộp thư nhận yêu cầu bản sao dữ liệu đọc từ env ở máy chủ (lib/van-hanh), truyền xuống khối "Dữ liệu của tôi".
  return <TaiKhoan emailDuLieu={vanHanh().emailDuLieu} />;
}
