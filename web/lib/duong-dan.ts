// TM-1 — MỘT nguồn cho breadcrumb của silo mảng (hiển thị + BreadcrumbList JSON-LD): Trang chủ › Huyền học › {mảng} › {cụm}
// › {trang}. Công cụ gốc (Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Thần số, Hợp đôi) đứng dưới hub Huyền học (HH-1); công cụ
// nằm trong silo (vd /phong-thuy/huong-xau-nam) đứng dưới trang trụ của nó. Dùng được ở trình duyệt.
import { TEN_MANG_SILO } from "@/lib/duong-silo";
import { trangCongCuEn } from "@/lib/so-trang-en";
import { banAnh } from "@/lib/duong-en";

export type CapDuongDan = { ten: string; duong: string };

const GOC: CapDuongDan[] = [{ ten: "Trang chủ", duong: "/" }, { ten: "Huyền học", duong: "/huyen-hoc" }];
const truCua = (duong: string) => `/${duong.split(/[?#]/)[0]!.split("/")[1] ?? ""}`;

/** Breadcrumb của trang công cụ `duong` tên `ten`. */
export function duongDanCongCu(duong: string, ten: string): CapDuongDan[] {
  const tru = truCua(duong);
  const trongSilo = duong.split("/").length > 2 && TEN_MANG_SILO[tru];
  return [...GOC, ...(trongSilo ? [{ ten: TEN_MANG_SILO[tru]!, duong: tru }] : []), { ten, duong }];
}

/** Breadcrumb của trang dưới một trang trụ: cụm (`cum`) rồi trang con (`trang`, tuỳ chọn). */
export function duongDanCum(cum: CapDuongDan, trang?: CapDuongDan): CapDuongDan[] {
  const tru = truCua(cum.duong);
  const ten = TEN_MANG_SILO[tru];
  return [...GOC, ...(ten ? [{ ten, duong: tru }] : []), cum, ...(trang ? [trang] : [])];
}

/** EN-ALL GĐ 3d — breadcrumb bản Anh của trang dưới một trang trụ: Hieuban › {công cụ} › {cụm} › {trang}. Hub "Chinese
 *  metaphysics" chưa có bản Anh → bỏ cấp đó; tên trụ lấy từ lib/so-trang-en.ts (cùng tên breadcrumb trang công cụ). Đường
 *  dẫn nhận vào đã là URL Anh; tên trụ tra theo đường dẫn Việt `truVi`. */
export function duongDanCumEn(truVi: string, cum: CapDuongDan, trang?: CapDuongDan): CapDuongDan[] {
  const tru = trangCongCuEn(truVi), truEn = banAnh(truVi);
  return [{ ten: "Hieuban", duong: "/en" }, ...(tru && truEn ? [{ ten: tru.ten, duong: truEn }] : []), cum, ...(trang ? [trang] : [])];
}
