import type { Metadata } from "next";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { vanHanh } from "@/lib/van-hanh";
import { dichVuDangMo } from "@/lib/thanh-toan/dich-vu";
import { TaiKhoan } from "./TaiKhoan";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo({ title: "Tài khoản", robots: { index: false } }, await layNoiDungTrang("/tai-khoan"));
}

export default async function Page() {
  // ĐY-1: hộp thư nhận yêu cầu bản sao dữ liệu đọc từ env ở máy chủ (lib/van-hanh), truyền xuống khối "Dữ liệu của tôi".
  // Rà UX mục 17: Hội viên năm / Hỏi chuyên gia chỉ có lối vào ở đây khi đã MỞ thật (công tắc + cổng) — không vào menu.
  return <TaiKhoan emailDuLieu={vanHanh().emailDuLieu} dichVu={await dichVuDangMo()} />;
}
