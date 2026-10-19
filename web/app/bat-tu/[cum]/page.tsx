// QH-URL — trang cụm kiến thức của mảng Bát tự (/bat-tu/{cụm}): dùng chung components/kien-thuc/TrangChuDe.tsx.
import type { Metadata } from "next";
import { metaChuDe, TrangChuDe } from "@/components/kien-thuc/TrangChuDe";
import { khoaTheoDuong } from "@/lib/kien-thuc";

export const revalidate = 21600;
type Props = { params: Promise<{ cum: string }> };
const khoa = async (p: Props["params"]) => khoaTheoDuong(`/bat-tu/${(await p).cum}`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metaChuDe(await khoa(params));
}

export default async function Page({ params }: Props) {
  return <TrangChuDe khoa={await khoa(params)} />;
}
