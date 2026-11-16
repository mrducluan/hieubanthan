// EN-ALL GĐ 8 — đường dẫn Việt của các trang NĂM & TUỔI có index (ĐÚNG luật index + cửa sổ của sitemap.xml bản Việt), để
// sitemap-en khai bản Anh tương đương (cùng đuôi đường dẫn). Trang gốc công cụ (nhóm cong_cu) sitemap-en đã tự có.
import "server-only";
import { NAM_SINH_SEO, duongHanNam, duongLamNha, duongLamNhaNam, duongSaoHanNam, duongXongDat, duongXongDatNam, lamNhaIndex, namAmHienTai, xongDatIndex } from "@/lib/tuoi-dan-gian";
import { duongCuoiHoi, duongNam, duongNamTuoi, duongSinhCon, namTuoiIndex, namTuoiSeo } from "@/lib/nam";
import { DUONG_SINH_NN, dsNuocSitemap, duongSinhNN } from "@/lib/sinh-nuoc-ngoai";

export async function duongNamTuoiSitemap(): Promise<string[]> {
  const [namAm, namSeo, nuoc] = await Promise.all([namAmHienTai(), namTuoiSeo(), dsNuocSitemap()]);
  return [
    "/nam", DUONG_SINH_NN,
    ...NAM_SINH_SEO.filter((ns) => lamNhaIndex(namSeo, namSeo, ns)).map((ns) => duongLamNha(namSeo, ns)),
    ...NAM_SINH_SEO.filter((ns) => xongDatIndex(namAm + 1, namAm, ns)).map((ns) => duongXongDat(namAm + 1, ns)),
    ...[namAm - 1, namAm, namAm + 1, namAm + 2].map((n) => duongHanNam(n)),
    ...[namAm, namAm + 1].flatMap((n) => [duongLamNhaNam(n), duongXongDatNam(n), duongSaoHanNam(n)]),
    ...[namAm, namAm + 1].flatMap((n) => [duongNam(n), duongSinhCon(n), duongCuoiHoi(n)]),
    ...NAM_SINH_SEO.filter((ns) => namTuoiIndex(namSeo, namSeo, ns)).map((ns) => duongNamTuoi(namSeo, ns)),
    ...nuoc.map((ma) => duongSinhNN(ma)),
  ];
}
