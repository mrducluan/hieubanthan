// sitemap.xml — trang công khai + mọi trang kiến thức có index=true (engine quyết theo chính sách).
import type { MetadataRoute } from "next";
import { CHU_DE, dsLaSoMau, dsTuoiHuong, duongTrang, duongTuoi, mucLuc } from "@/lib/kien-thuc";
import { dsBaiBlog, duongBlog } from "@/lib/blog";
import { urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

const TINH: [string, number][] = [
  ["/", 1], ["/kien-thuc", 0.9], ["/tu-dien", 0.8], ["/la-so-mau", 0.8], ["/blog", 0.6], ["/kham-pha", 0.8], ["/than-so", 0.8], ["/hom-nay", 0.7], ["/hop-doi", 0.8],
  ["/tu-vi", 0.7], ["/bat-tu", 0.7], ["/kinh-dich", 0.7], ["/phong-thuy", 0.7],
  ["/gioi-thieu", 0.5], ["/tac-gia", 0.4], ["/tac-gia/duc-luan", 0.6], ["/lien-he", 0.4], ["/chinh-sach-rieng-tu", 0.3], ["/dieu-khoan", 0.3], ["/mien-tru-trach-nhiem", 0.3],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ds, mau, tuoi, blog] = await Promise.all([mucLuc(), dsLaSoMau(), dsTuoiHuong(), dsBaiBlog()]);
  return [
    ...TINH.map(([d, p]) => ({ url: urlDayDu(d), changeFrequency: "weekly" as const, priority: p })),
    ...Object.keys(CHU_DE).map((k) => ({ url: urlDayDu(`/kien-thuc/${k}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: urlDayDu("/phong-thuy/huong-hop-tuoi"), changeFrequency: "monthly" as const, priority: 0.8 },
    ...tuoi.map((t) => ({ url: urlDayDu(duongTuoi(t.slug)), changeFrequency: "yearly" as const, priority: 0.6 })),
    ...mau.map((m) => ({ url: urlDayDu(`/la-so-mau/${m.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...ds.filter((t) => t.index).map((t) => ({
      url: urlDayDu(duongTrang(t.loai, t.slug)), lastModified: t.cap_nhat, changeFrequency: "monthly" as const,
      priority: t.loai === "so" ? 0.8 : 0.6,
    })),
    ...blog.map((p) => ({
      url: urlDayDu(duongBlog(p.slug)), ...(p.published_at ? { lastModified: p.published_at } : {}),
      changeFrequency: "monthly" as const, priority: 0.5,
    })),
  ];
}
