// QH-URL — trang cụm kiến thức /kinh-dich/que (mảng Kinh Dịch): dùng chung components/kien-thuc/TrangChuDe.tsx.
import type { Metadata } from "next";
import { metaChuDe, TrangChuDe } from "@/components/kien-thuc/TrangChuDe";
import { khoaTheoDuong } from "@/lib/kien-thuc";

export const revalidate = 21600;
const KHOA = khoaTheoDuong("/kinh-dich/que");

export async function generateMetadata(): Promise<Metadata> {
  return metaChuDe(KHOA);
}

export default function Page() {
  return <TrangChuDe khoa={KHOA} />;
}
