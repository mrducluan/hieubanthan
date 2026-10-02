// sitemap.xml — trang công khai + mọi trang kiến thức có index=true (engine quyết theo chính sách).
import type { MetadataRoute } from "next";
import { CHU_DE, duongTrang, mucLuc } from "@/lib/kien-thuc";
import { urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

const TINH: [string, number][] = [
  ["/", 1], ["/kien-thuc", 0.9], ["/tu-dien", 0.8], ["/kham-pha", 0.8], ["/than-so", 0.8], ["/hop-doi", 0.8],
  ["/tu-vi", 0.7], ["/bat-tu", 0.7], ["/kinh-dich", 0.7], ["/phong-thuy", 0.7],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ds = await mucLuc();
  return [
    ...TINH.map(([d, p]) => ({ url: urlDayDu(d), changeFrequency: "weekly" as const, priority: p })),
    ...Object.keys(CHU_DE).map((k) => ({ url: urlDayDu(`/kien-thuc/${k}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...ds.filter((t) => t.index).map((t) => ({
      url: urlDayDu(duongTrang(t.loai, t.slug)), lastModified: t.cap_nhat, changeFrequency: "monthly" as const,
      priority: t.loai === "so" ? 0.8 : 0.6,
    })),
  ];
}
