// TM-1 — số trang mỗi cụm cho thanh mảng, đếm từ dữ liệu engine (mục lục kiến thức, lá số mẫu, cung phi) — thêm trang ở
// engine là số tự đổi. Server Component, đặt trong <Suspense fallback={<ThanhMang />}> ở layout: thanh hiện ngay (không
// chờ engine), số điền vào khi có. Engine lỗi → không có số (thanh vẫn đủ).
import { ThanhMang } from "@/components/khung/ThanhMang";
import { CHU_DE, dsCungPhi, dsLaSoMau, mucLuc } from "@/lib/kien-thuc";

export async function demTrangThanh(): Promise<Record<string, number>> {
  const [ds, mau, cung] = await Promise.all([mucLuc(), dsLaSoMau(), dsCungPhi().then((d) => d.cung).catch(() => [])]);
  const dem: Record<string, number> = {};
  for (const [k, cd] of Object.entries(CHU_DE)) {
    const n = ds.filter((t) => t.loai === cd.loai).length;
    if (n) dem[k] = n;
  }
  if (mau.length) dem["la-so-mau"] = mau.length;
  if (cung.length) dem["cung-phi"] = cung.length;
  return dem;
}

export async function ThanhMangDem() {
  return <ThanhMang dem={await demTrangThanh()} />;
}
