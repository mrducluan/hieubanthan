// QH-URL — trang kiến thức /hop-doi/{cụm}/{trang} (mảng Hợp đôi): dùng chung components/kien-thuc/TrangKienThuc.tsx.
import type { Metadata } from "next";
import { metaKienThuc, TrangKienThucView } from "@/components/kien-thuc/TrangKienThuc";
import { permanentRedirect } from "next/navigation";
import { khoaTheoDuong } from "@/lib/kien-thuc";

/** Cặp số chỉ có một chiều (a ≤ b, SEO-G). Người gõ ngược thứ tự ("7-va-2") → 308 về bản đúng thay vì 404 (rà soát 2026-11-03). */
const RE_CAP = /^so-chu-dao-(\d{1,2})-va-(\d{1,2})$/;
function veDungChieu(slug: string): void {
  const m = slug.match(RE_CAP);
  if (m && Number(m[1]) > Number(m[2])) permanentRedirect(`/hop-doi/cap-so/so-chu-dao-${m[2]}-va-${m[1]}`);
}

export const revalidate = 21600;
type Props = { params: Promise<{ slug: string }> };
const thamSo = async (p: Props["params"]) => { const x = await p; return { khoa: khoaTheoDuong("/hop-doi/cap-so"), slug: x.slug }; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metaKienThuc(await thamSo(params));
}

export default async function Page({ params }: Props) {
  veDungChieu((await params).slug);
  return <TrangKienThucView {...await thamSo(params)} />;
}
