// CHT-1 — trang cụm "12 cung hoàng đạo" (/chiem-tinh/cung-hoang-dao): khung chung TrangChuDe (danh sách 12 trang, schema
// CollectionPage + ItemList, breadcrumb) + bảng giờ Mặt Trời vào từng cung NĂM NAY + ô tra theo ngày sinh. Mọi mốc do engine
// tính (calc/cung_hoang_dao.py — cùng bộ tính với tiết khí); web chỉ hiển thị. SEO-1: trang này giữ từ khoá "cung hoàng đạo".
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { metaChuDe, TrangChuDe } from "@/components/kien-thuc/TrangChuDe";
import { TraCungHoangDao } from "@/components/chiem-tinh/TraCungHoangDao";
import { bangCungNamNay } from "@/lib/cung-hoang-dao";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";

export const revalidate = 21600;
const KHOA = "cung-hoang-dao";
const DUONG = "/chiem-tinh/cung-hoang-dao";

export async function generateMetadata(): Promise<Metadata> {
  return metaChuDe(KHOA);
}

export default async function Page() {
  // Cụm chỉ có bản Việt (không có /en/chiem-tinh) — bản Anh rơi về khung chung (404 vì cụm chưa mở tiếng Anh).
  if ((await ngonNguMayChu()).ngonNgu === "en") return <TrangChuDe khoa={KHOA} />;
  const bang = await bangCungNamNay();
  return (
    <TrangChuDe khoa={KHOA} traLoi={bang?.tra_loi ?? null} giua={<>
      {bang && (
        <section aria-labelledby="bang-nam" className="mt-8">
          <h2 id="bang-nam" className="text-2xl">Lịch 12 cung hoàng đạo năm {bang.nam}</h2>
          <p className="mt-1 text-sm text-fg-muted">Giờ đồng hồ Việt Nam (UTC+7) lúc Mặt Trời vào và rời từng cung trong năm {bang.nam}.
            Cột &ldquo;thường gặp&rdquo; là khoảng ngày hay gặp nhất qua nhiều năm.</p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-surface/50 text-fg-muted">
                <tr><th scope="col" className="px-3 py-2">Cung</th><th scope="col" className="px-3 py-2">Thường gặp</th>
                  <th scope="col" className="px-3 py-2">Bắt đầu năm {bang.nam}</th><th scope="col" className="px-3 py-2">Kết thúc</th></tr>
              </thead>
              <tbody>
                {bang.cung.map((c) => (
                  <tr key={c.ma} className="border-t border-line">
                    <th scope="row" className="px-3 py-2 font-normal">
                      <Link href={`${DUONG}/${c.slug}`} className="text-gold underline"><span aria-hidden>{c.ky_hieu} </span>{c.ten}</Link>
                    </th>
                    <td className="px-3 py-2">{c.khoang_thuong}</td>
                    <td className="px-3 py-2"><time dateTime={c.bat_dau}>{c.bat_dau_chu}</time></td>
                    <td className="px-3 py-2"><time dateTime={c.ket_thuc}>{c.ket_thuc_chu}</time></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <TraCungHoangDao />
      <p className="mt-6 text-sm text-fg-muted">Cung theo ngày sinh chỉ là cung Mặt Trời. Muốn biết cung Mặt Trăng, Cung Mọc và 12 nhà,{" "}
        <Link href="/chiem-tinh" className="text-gold underline">lập bản đồ sao theo ngày, giờ, nơi sinh</Link>.</p>
    </>} />
  );
}
