// QH-URL — trang cụm kiến thức /hop-doi/cap-so (mảng Hợp đôi): dùng chung components/kien-thuc/TrangChuDe.tsx.
import type { Metadata } from "next";
import { metaChuDe, TrangChuDe } from "@/components/kien-thuc/TrangChuDe";
import { khoaTheoDuong } from "@/lib/kien-thuc";

export const revalidate = 21600;
const KHOA = khoaTheoDuong("/hop-doi/cap-so");

export async function generateMetadata(): Promise<Metadata> {
  return metaChuDe(KHOA);
}

export default function Page() {
  return <TrangChuDe khoa={KHOA} />;
}
