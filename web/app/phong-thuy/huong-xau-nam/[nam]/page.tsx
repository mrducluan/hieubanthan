// TDG-1 — trang "Hướng xấu năm {năm}". Index năm âm hiện tại −1…+2.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { BangHanNam } from "@/components/tuoi/KetQuaTuoi";
import { goiLd, ldDuongDan, ldHoiDap, metaTrang } from "@/lib/seo";
import { docNam, duongHanNam, hanNamCongKhai, hanNamIndex, namAmHienTai } from "@/lib/tuoi-dan-gian";

type P = { params: Promise<{ nam: string }> };

export async function generateMetadata(p: P): Promise<Metadata> {
  const n = docNam((await p.params).nam);
  if (!n) return {};
  const m = metaTrang({ tieuDe: `Hướng xấu năm ${n}: Thái Tuế, Tam Sát, Ngũ Hoàng ở đâu?`,
    moTa: `Năm ${n}: phương Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng, Nhị Hắc và bàn phi tinh 9 cung — các phía truyền thống khuyên không động thổ, sửa chữa lớn.`,
    duong: duongHanNam(n) });
  return hanNamIndex(n, await namAmHienTai()) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNam((await p.params).nam);
  if (!n) notFound();
  const h = await hanNamCongKhai(n);
  if (!h) throw new Error("engine không phản hồi");
  const ten = (ma: string) => h.huong_tranh.find((x) => x.ma === ma)!;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <JsonLd data={goiLd(
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Phong thuỷ", duong: "/phong-thuy" }, { ten: "Hướng xấu theo năm", duong: "/phong-thuy/huong-xau-nam" }, { ten: `Năm ${n}`, duong: duongHanNam(n) }]),
        ldHoiDap([{ hoi: `Ngũ Hoàng năm ${n} ở hướng nào?`, dap: `Hướng ${ten("ngu_hoang").phuong}.` },
          { hoi: `Tam Sát năm ${n} ở đâu?`, dap: `Phía ${ten("tam_sat").phuong}.` },
          { hoi: `Thái Tuế năm ${n} ở hướng nào?`, dap: `Hướng ${ten("thai_tue").phuong}; Tuế Phá ở ${ten("tue_pha").phuong}.` }]),
      )} />
      <nav aria-label="Đường dẫn" className="text-sm text-fg-muted"><Link href="/phong-thuy" className="hover:underline">Phong thuỷ</Link> › <Link href="/phong-thuy/huong-xau-nam" className="hover:underline">Hướng xấu theo năm</Link></nav>
      <TieuDeMuc cap={1} nho={`Năm ${h.can_chi}`} lon={`Hướng xấu năm ${n}`} />
      <BangHanNam h={h} />
      <p className="flex flex-wrap gap-3 text-sm">
        {n > 1901 && <Link href={duongHanNam(n - 1)} className="text-gold underline">Năm {n - 1}</Link>}
        {n < 2099 && <Link href={duongHanNam(n + 1)} className="text-gold underline">Năm {n + 1}</Link>}
        <Link href="/xem-tuoi-lam-nha" className="text-gold underline">Xem tuổi làm nhà năm {n}</Link>
      </p>
      <p className="text-xs text-fg-muted">{h.luu_y}</p>
    </div>
  );
}
