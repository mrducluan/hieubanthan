// TDG-1 — trang "Hướng xấu năm {năm}". Index năm âm hiện tại −1…+2.
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { BangHanNam } from "@/components/tuoi/KetQuaTuoi";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { NAM_BANG_TU, docNam, duongHanNam, duongLamNhaNam, duongXongDatNam, hanNamCongKhai, hanNamIndex, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { HoiDapHien, TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { duongLichAm } from "@/lib/lich-am";
import { taoChu } from "@/lib/chu-trang";
import { voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { CHU_HAN_NAM_CON } from "@/lib/chu/trang-con";
import { DuongDan } from "@/components/khung/DuongDan";
import { duongDanCum, duongDanCumEn } from "@/lib/duong-dan";

type P = { params: Promise<{ nam: string }> };

async function metaGoc(p: P): Promise<Metadata> {
  const n = docNam((await p.params).nam);
  if (!n) return {};
  const { ngonNgu } = await ngonNguMayChu(), { c } = chuNamTuoi(ngonNgu), b = { nam: n };
  const index = hanNamIndex(n, await namAmHienTai());
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: c("hxn.seo_tieu_de", b), moTa: c("hxn.seo_mo_ta", b), duongVi: duongHanNam(n), noindex: !index });
  const m = themHreflangVi(metaTrang({ tieuDe: c("hxn.seo_tieu_de", b), moTa: c("hxn.seo_mo_ta", b), duong: duongHanNam(n) }), duongHanNam(n));
  return index ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page(p: P) {
  const n = docNam((await p.params).nam);
  if (!n) notFound();
  const h = await hanNamCongKhai(n);
  if (!h) throw new Error("engine không phản hồi");
  const ten = (ma: string) => h.huong_tranh.find((x) => x.ma === ma)!;
  // ND-7: mẫu cụm "/phong-thuy/huong-xau-nam/{nam}" — khối + chữ sửa được ở CMS.
  const duong = duongHanNam(n), bien = { nam: String(n), can_chi: h.can_chi };
  const { ngonNgu } = await ngonNguMayChu(), { c: t, p: tp, en } = chuNamTuoi(ngonNgu);
  const nd = await noiDungTheo(en, duong, bien), c = taoChu(CHU_HAN_NAM_CON, nd.chu, ngonNgu);
  const L = (s: string) => lienNN(en, s);
  const dd = en ? duongDanCumEn("/phong-thuy", { ten: t("hxn.cum"), duong: L("/phong-thuy/huong-xau-nam")! }, { ten: String(n), duong: L(duongHanNam(n))! })
    : duongDanCum({ ten: "Hướng xấu theo năm", duong: "/phong-thuy/huong-xau-nam" }, { ten: `Năm ${n}`, duong: duongHanNam(n) });
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <JsonLd data={goiLd(
        en ? ldTrangWebEn({ duong: L(duongHanNam(n))!, ten: t("hxn.ten_ld", { nam: n }), about: ["Five Yellow", "Three Killings", "Grand Duke (Tai Sui)", `${h.can_chi} year`] })
          : ldTrangWeb({ duong: duongHanNam(n), ten: `Hướng xấu năm ${n}`, about: ["Ngũ Hoàng", "Tam Sát", "Thái Tuế", `Năm ${h.can_chi}`] }),
        ldDuongDan(dd),
        ldHoiDap(h.hoi_dap?.length || en ? h.hoi_dap ?? [] : [{ hoi: `Ngũ Hoàng năm ${n} ở hướng nào?`, dap: `Hướng ${ten("ngu_hoang").phuong}.` },
          { hoi: `Tam Sát năm ${n} ở đâu?`, dap: `Phía ${ten("tam_sat").phuong}.` },
          { hoi: `Thái Tuế năm ${n} ở hướng nào?`, dap: `Hướng ${ten("thai_tue").phuong}; Tuế Phá ở ${ten("tue_pha").phuong}.` }]),
      )} />
      <DuongDan ds={dd} nhan={t("c.duong_dan")} />
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={c("dau.tieu_de", bien)} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" />
      <TraLoiNhanh chu={h.tra_loi_nhanh} en={en} />
      <BangHanNam h={h} ngonNgu={ngonNgu} />
      <HoiDapHien ds={h.hoi_dap} tieuDe={t("c.hoi_dap")} />
      {/* SEO-O: ảnh tóm tắt có chữ thật (Google Hình ảnh) — alt cùng nguồn với chữ trong ảnh. */}
      {!en && <AnhTomTat kieu="huong_xau" nam={n} />}
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" />
      <p className="flex flex-wrap gap-3 text-sm">
        {n > 1901 && <Link href={L(duongHanNam(n - 1))!} className="text-gold underline">{tp("c.nam_n", { nam: n - 1 })}</Link>}
        {n < 2099 && <Link href={L(duongHanNam(n + 1))!} className="text-gold underline">{tp("c.nam_n", { nam: n + 1 })}</Link>}
        <Link href={L("/xem-tuoi-lam-nha")!} className="text-gold underline">{c("cuoi.lam_nha", bien)}</Link>
        {n >= NAM_BANG_TU && <Link href={L(duongLamNhaNam(n))!} className="text-gold underline">{c("cuoi.bang_lam_nha", bien)}</Link>}
        {n >= NAM_BANG_TU && <Link href={L(duongXongDatNam(n))!} className="text-gold underline">{c("cuoi.bang_xong_dat", bien)}</Link>}
        {n <= 2098 && L(duongLichAm(n)) && <Link href={L(duongLichAm(n))!} className="text-gold underline">{c("cuoi.lich_am", bien)}</Link>}
      </p>
      <p className="text-xs text-fg-muted">{h.luu_y}</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" />
    </div>
  );
}

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
