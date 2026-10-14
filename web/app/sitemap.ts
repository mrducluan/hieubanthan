// sitemap.xml — trang công khai + mọi trang kiến thức có index=true (engine quyết theo chính sách).
import type { MetadataRoute } from "next";
import { CHU_DE, dsLaSoMau, dsTuoiHuong, duongTrang, duongTuoi, mucLuc } from "@/lib/kien-thuc";
import { dsBaiTongHop, duongBlog } from "@/lib/blog";
import { urlDayDu } from "@/lib/seo";
import { daHetHan, dsTrangDichCms } from "@/lib/cms";
import { THANG_SAU, THANG_TRUOC, duongThang, homNayVN } from "@/lib/hoang-lich";
import { NAM_SINH_SEO, duongHanNam, duongLamNha, duongXongDat, namAmHienTai } from "@/lib/tuoi-dan-gian";

export const revalidate = 21600;

const TINH: [string, number][] = [
  ["/", 1], ["/kien-thuc", 0.9], ["/tu-dien", 0.8], ["/la-so-mau", 0.8], ["/blog", 0.6], ["/kham-pha", 0.8], ["/than-so", 0.8], ["/hom-nay", 0.7], ["/xem-ngay-tot", 0.9], ["/xem-tuoi-lam-nha", 0.8], ["/tuoi-xong-dat", 0.8], ["/huong-xau-nam", 0.8], ["/hop-doi", 0.8],
  ["/tu-vi", 0.7], ["/bat-tu", 0.7], ["/kinh-dich", 0.7], ["/phong-thuy", 0.7],
  ["/gioi-thieu", 0.5], ["/tac-gia", 0.4], ["/tac-gia/duc-luan", 0.6], ["/lien-he", 0.4], ["/chinh-sach-rieng-tu", 0.3], ["/dieu-khoan", 0.3], ["/mien-tru-trach-nhiem", 0.3],
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
    ...Object.keys(CHU_DE).map((k) => ({ url: urlDayDu(`/kien-thuc/${k}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: urlDayDu("/phong-thuy/huong-hop-tuoi"), changeFrequency: "monthly" as const, priority: 0.8 },
    // HL-1: lịch ngày tốt theo tháng — đúng cửa sổ index của trang tháng (trang ngày được link từ lịch tháng).
    ...thangSitemap().map((d) => ({ url: urlDayDu(d), changeFrequency: "weekly" as const, priority: 0.6 })),
    // TDG-1: tuổi làm nhà (năm âm hiện tại + năm sau), xông đất (Tết năm nay + Tết tới), hướng xấu (−1…+2).
    ...[namAm, namAm + 1].flatMap((n) => NAM_SINH_SEO.map((ns) => ({ url: urlDayDu(duongLamNha(n, ns)), changeFrequency: "yearly" as const, priority: 0.5 }))),
    ...[namAm, namAm + 1].flatMap((n) => NAM_SINH_SEO.map((ns) => ({ url: urlDayDu(duongXongDat(n, ns)), changeFrequency: "yearly" as const, priority: 0.5 }))),
    ...[namAm - 1, namAm, namAm + 1, namAm + 2].map((n) => ({ url: urlDayDu(duongHanNam(n)), changeFrequency: "yearly" as const, priority: 0.6 })),
    ...tuoi.map((t) => ({ url: urlDayDu(duongTuoi(t.slug)), changeFrequency: "yearly" as const, priority: 0.6 })),
    ...mau.map((m) => ({ url: urlDayDu(`/la-so-mau/${m.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...ds.filter((t) => t.index).map((t) => ({
      url: urlDayDu(duongTrang(t.loai, t.slug)), lastModified: t.cap_nhat, changeFrequency: "monthly" as const,
      priority: t.loai === "so" ? 0.8 : 0.6,
    })),
    ...blog.filter((p) => !p.noindex).map((p) => ({
      url: urlDayDu(duongBlog(p.slug)), ...(p.capNhat ?? p.ngay ? { lastModified: (p.capNhat ?? p.ngay)! } : {}),
      changeFrequency: "monthly" as const, priority: p.nguon === "cms" ? 0.7 : 0.5,
    })),
    // Chuyên mục có ít nhất một bài (trang trống là noindex).
    ...[...new Set(blog.filter((p) => !p.noindex).flatMap((p) => (p.chuyenMuc ?? []).map((c) => c.slug)))].map((slug) => ({
      url: urlDayDu(`/blog/chuyen-muc/${encodeURIComponent(slug)}`), changeFrequency: "weekly" as const, priority: 0.5,
    })),
  ];
}
