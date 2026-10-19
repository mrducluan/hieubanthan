// QH-URL — trang kiến thức /hop-doi/{cụm}/{trang} (mảng Hợp đôi): dùng chung components/kien-thuc/TrangKienThuc.tsx.
import type { Metadata } from "next";
import { metaKienThuc, TrangKienThucView } from "@/components/kien-thuc/TrangKienThuc";
import { khoaTheoDuong } from "@/lib/kien-thuc";

export const revalidate = 21600;
type Props = { params: Promise<{ slug: string }> };
const thamSo = async (p: Props["params"]) => { const x = await p; return { khoa: khoaTheoDuong("/hop-doi/cap-so"), slug: x.slug }; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metaKienThuc(await thamSo(params));
}

export default async function Page({ params }: Props) {
  return <TrangKienThucView {...await thamSo(params)} />;
}
