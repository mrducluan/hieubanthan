// sitemap.xml — trang công khai + mọi trang kiến thức có index=true (engine quyết theo chính sách).
import type { MetadataRoute } from "next";
import { CHU_DE, dsLaSoMau, dsTuoiHuong, duongTrang, duongTuoi, mucLuc } from "@/lib/kien-thuc";
import { dsBaiTongHop, duongBlog } from "@/lib/blog";
import { urlDayDu } from "@/lib/seo";
import { daHetHan, dsTrangDichCms } from "@/lib/cms";
import { duongTrangSo, soTrang } from "@/lib/phan-trang";
import { THANG_SAU, THANG_TRUOC, VIEC_SEO, duongThang, duongViecThang, homNayVN } from "@/lib/hoang-lich";
import { duongLichAm } from "@/lib/lich-am";
import { NAM_SINH_SEO, duongHanNam, duongLamNha, duongLamNhaNam, duongSaoHanNam, duongXongDat, duongXongDatNam, namAmHienTai } from "@/lib/tuoi-dan-gian";

export const revalidate = 21600;

const TINH: [string, number][] = [
  ["/", 1], ["/kien-thuc", 0.9], ["/tu-dien", 0.8], ["/tu-vi/la-so-mau", 0.8], ["/blog", 0.6], ["/huyen-hoc", 0.8], ["/than-so", 0.8], ["/hom-nay", 0.7], ["/xem-ngay-tot", 0.9], ["/xem-ngay-tot/gio-hoang-dao", 0.7], ["/xem-tuoi-lam-nha", 0.8], ["/tuoi-xong-dat", 0.8], ["/xem-sao-han", 0.7], ["/phong-thuy/huong-xau-nam", 0.8], ["/hop-doi", 0.8],
  ["/tu-vi", 0.7], ["/bat-tu", 0.7], ["/kinh-dich", 0.7], ["/phong-thuy", 0.7],
  ["/doi-lich-am-duong", 0.7], ["/gioi-thieu", 0.5], ["/bao-chi", 0.4], ["/tac-gia", 0.4], ["/tac-gia/duc-luan", 0.6], ["/lien-he", 0.4], ["/chinh-sach-rieng-tu", 0.3], ["/dieu-khoan", 0.3], ["/mien-tru-trach-nhiem", 0.3],
];

function thangSitemap(): string[] {
  const h = homNayVN();
  const goc = Number(h.slice(0, 4)) * 12 + Number(h.slice(5, 7)) - 1;
  return Array.from({ length: THANG_TRUOC + THANG_SAU + 1 }, (_, i) => goc - THANG_TRUOC + i)
    .map((k) => duongThang(Math.floor(k / 12), (k % 12) + 1));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ds, mau, tuoi, blog, suKien, namAm] = await Promise.all([mucLuc(), dsLaSoMau(), dsTuoiHuong(), dsBaiTongHop(), dsTrangDichCms(), namAmHienTai()]);
  return [
    // CMS-3: trang đích còn hạn, không noindex
    ...suKien.filter((t) => !t.noindex && !daHetHan(t)).map((t) => ({
      url: urlDayDu(`/su-kien/${t.slug}`), lastModified: t.updatedAt, changeFrequency: "weekly" as const, priority: 0.6,
    })),
    ...TINH.map(([d, p]) => ({ url: urlDayDu(d), changeFrequency: "weekly" as const, priority: p })),
    ...Object.values(CHU_DE).map((c) => ({ url: urlDayDu(c.duong), changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: urlDayDu("/phong-thuy/huong-hop-tuoi"), changeFrequency: "monthly" as const, priority: 0.8 },
    // HL-1: lịch ngày tốt theo tháng — đúng cửa sổ index của trang tháng (trang ngày được link từ lịch tháng).
    ...thangSitemap().map((d) => ({ url: urlDayDu(d), changeFrequency: "weekly" as const, priority: 0.6 })),
    // TDG-1: tuổi làm nhà (năm âm hiện tại + năm sau), xông đất (Tết năm nay + Tết tới), hướng xấu (−1…+2).
    ...[namAm, namAm + 1].flatMap((n) => NAM_SINH_SEO.map((ns) => ({ url: urlDayDu(duongLamNha(n, ns)), changeFrequency: "yearly" as const, priority: 0.5 }))),
    ...[namAm, namAm + 1].flatMap((n) => NAM_SINH_SEO.map((ns) => ({ url: urlDayDu(duongXongDat(n, ns)), changeFrequency: "yearly" as const, priority: 0.5 }))),
    ...[namAm - 1, namAm, namAm + 1, namAm + 2].map((n) => ({ url: urlDayDu(duongHanNam(n)), changeFrequency: "yearly" as const, priority: 0.6 })),
    // SEO-L1: bảng theo năm (cùng cửa sổ trang con).
    ...[namAm, namAm + 1].flatMap((n) => [duongLamNhaNam(n), duongXongDatNam(n), duongSaoHanNam(n)]).map((d) => ({ url: urlDayDu(d), changeFrequency: "monthly" as const, priority: 0.7 })),
    // SEO-L2: ngày tốt theo việc — tháng này → 12 tháng tới (trang ngoài khoảng vẫn index trong cửa sổ tháng nhưng không đưa sitemap).
    ...thangSitemap().slice(THANG_TRUOC, THANG_TRUOC + 13).flatMap((d) => {
      const [, m, y] = d.match(/thang-(\d+)-(\d{4})$/)!;
      return VIEC_SEO.map((v) => ({ url: urlDayDu(duongViecThang(v.slug, Number(y), Number(m))), changeFrequency: "weekly" as const, priority: 0.6 }));
    }),
    // SEO-L5: lịch âm năm nay −2 … +3.
    ...Array.from({ length: 6 }, (_, i) => namAm - 2 + i).map((n) => ({ url: urlDayDu(duongLichAm(n)), changeFrequency: "yearly" as const, priority: 0.6 })),
    ...tuoi.map((t) => ({ url: urlDayDu(duongTuoi(t.slug)), changeFrequency: "yearly" as const, priority: 0.6 })),
    ...mau.map((m) => ({ url: urlDayDu(`/tu-vi/la-so-mau/${m.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...ds.filter((t) => t.index).map((t) => ({
      url: urlDayDu(duongTrang(t.loai, t.slug)), lastModified: t.cap_nhat, changeFrequency: "monthly" as const,
      priority: t.loai === "so" ? 0.8 : 0.6,
    })),
    ...blog.filter((p) => !p.noindex).map((p) => ({
      url: urlDayDu(duongBlog(p.slug)), ...(p.capNhat ?? p.ngay ? { lastModified: (p.capNhat ?? p.ngay)! } : {}),
      changeFrequency: "monthly" as const, priority: p.nguon === "cms" ? 0.7 : 0.5,
    })),
    // Chuyên mục có ít nhất một bài (trang trống là noindex) + trang 2…n của chuyên mục (SEO-K phân trang).
    ...[...new Set(blog.filter((p) => !p.noindex).flatMap((p) => (p.chuyenMuc ?? []).map((c) => c.slug)))].flatMap((slug) => {
      const tong = soTrang(blog.filter((p) => p.chuyenMuc?.some((c) => c.slug === slug)).length);
      return Array.from({ length: tong }, (_, i) => ({
        url: urlDayDu(duongTrangSo(`/blog/chuyen-muc/${encodeURIComponent(slug)}`, i + 1)), changeFrequency: "weekly" as const, priority: i ? 0.3 : 0.5,
      }));
    }),
    // SEO-K: /blog/trang/2…n (trang 1 = /blog nằm trong TINH).
    ...Array.from({ length: soTrang(blog.length) - 1 }, (_, i) => ({ url: urlDayDu(duongTrangSo("/blog", i + 2)), changeFrequency: "weekly" as const, priority: 0.3 })),
  ];
}
