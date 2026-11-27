// CHT-1 — trang một cung hoàng đạo /chiem-tinh/cung-hoang-dao/{slug}: dùng chung components/kien-thuc/TrangKienThuc.tsx.
import type { Metadata } from "next";
import { metaKienThuc, TrangKienThucView } from "@/components/kien-thuc/TrangKienThuc";

export const revalidate = 21600;
type Props = { params: Promise<{ slug: string }> };
const thamSo = async (p: Props["params"]) => ({ khoa: "cung-hoang-dao", slug: (await p).slug });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metaKienThuc(await thamSo(params));
}

export default async function Page({ params }: Props) {
  return <TrangKienThucView {...await thamSo(params)} />;
}
