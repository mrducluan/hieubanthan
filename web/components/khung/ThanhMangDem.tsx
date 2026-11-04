// TM-1 — số trang mỗi cụm cho thanh mảng, đếm từ dữ liệu engine (mục lục kiến thức, lá số mẫu, cung phi) — thêm trang ở
// engine là số tự đổi. Server Component, đặt trong <Suspense fallback={<ThanhMang />}> ở layout: thanh hiện ngay (không
// chờ engine), số điền vào khi có. Engine lỗi / chậm → không có số (thanh vẫn đủ).
// Layout chạy ở MỌI trang (kể cả trang không có thanh — root layout không dựng lại khi chuyển trang phía trình duyệt, nên
// không bỏ qua được theo đường dẫn) → số giữ trong bộ nhớ tiến trình 6 giờ: đọc + phân tích mục lục (~270 KB) một lần mỗi
// tiến trình, không mỗi lượt xem; chờ engine tối đa 2,5 giây, quá hạn thì lượt này không có số (không ghi nhớ bản rỗng).
import { ThanhMang } from "@/components/khung/ThanhMang";
import { CHU_DE, dsCungPhi, dsLaSoMau, mucLuc } from "@/lib/kien-thuc";

const GIU_MS = 6 * 60 * 60 * 1000, CHO_MS = 2500;
let nho: { luc: number; dem: Record<string, number> } | null = null;
let dang: Promise<Record<string, number>> | null = null;

async function dem(): Promise<Record<string, number>> {
  const [ds, mau, cung] = await Promise.all([mucLuc(), dsLaSoMau(), dsCungPhi().then((d) => d.cung).catch(() => [])]);
  const kq: Record<string, number> = {};
  for (const [k, cd] of Object.entries(CHU_DE)) {
    const n = ds.filter((t) => t.loai === cd.loai).length;
    if (n) kq[k] = n;
  }
  if (mau.length) kq["la-so-mau"] = mau.length;
  if (cung.length) kq["cung-phi"] = cung.length;
  return kq;
}

export async function demTrangThanh(): Promise<Record<string, number>> {
  if (nho && Date.now() - nho.luc < GIU_MS) return nho.dem;
  dang ??= dem().then((d) => {
    if (Object.keys(d).length) nho = { luc: Date.now(), dem: d };   // engine lỗi (rỗng) → không nhớ, lượt sau thử lại
    return d;
  }).finally(() => { dang = null; });
  const quaHan = new Promise<Record<string, number>>((ok) => setTimeout(() => ok(nho?.dem ?? {}), CHO_MS));
  return Promise.race([dang, quaHan]);
}

export async function ThanhMangDem() {
  return <ThanhMang dem={await demTrangThanh()} />;
}
