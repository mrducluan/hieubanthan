// Hằng + dựng JSON-LD dùng chung (schema.org). Chỉ định dạng dữ liệu — không tính gì.
import { vanHanh } from "@/lib/van-hanh";

export const TEN_SITE = "Hiểu Bản Thân";
export const MO_TA_SITE =
  "Khám phá bản thân qua thần số học và huyền học phương Đông (Tử vi, Bát tự, Kinh Dịch, Phong thuỷ) — tính toán minh bạch, diễn giải có nguồn, câu hỏi để tự soi. Tham khảo văn hoá, không phải dự báo.";

/** SEO-K (mục 7): cụm từ người Việt hay tìm quanh các công cụ của site — gồm cả kiểu bỏ dấu cũ ("thủy", "hỏa") vì
 *  người dùng gõ cả hai kiểu. Dùng cho WebSite/WebApplication.keywords (JSON-LD; SEO-M bỏ thẻ meta keywords — Google bỏ qua). Đối chiếu lại bằng số Search
 *  Console (VIEC-CUA-ANH mục M7) — thêm cụm mới khi thấy trang có hiển thị mà chưa có ở đây. */
export const TU_KHOA_SITE = [
  "thần số học", "thần số học Pythagoras", "thần số học online", "số chủ đạo", "con số chủ đạo", "số đường đời", "xem thần số học",
  "tử vi", "xem tử vi", "lá số tử vi", "lập lá số tử vi", "tử vi trọn đời", "xem tử vi năm nay",
  "bát tự", "tứ trụ", "xem bát tự", "kinh dịch", "gieo quẻ kinh dịch", "64 quẻ kinh dịch",
  "phong thuỷ", "phong thủy", "hướng nhà hợp tuổi", "xem hướng nhà", "mệnh quái", "cung mệnh",
  "xem ngày tốt", "xem ngày tốt xấu", "lịch âm", "lịch vạn niên", "giờ hoàng đạo", "xem tuổi làm nhà", "tuổi xông đất",
  "sinh năm bao nhiêu mệnh gì", "mệnh ngũ hành", "hợp đôi thần số", "xem tuổi vợ chồng", "khám phá bản thân",
];

// Bản chạy thật mặc định hieuban.com (kể cả khi quên đặt NEXT_PUBLIC_SITE_URL) để canonical/sitemap/OG
// không bao giờ trỏ về localhost; dev/E2E (next dev) vẫn là localhost.
export const SITE_CHINH = "https://hieuban.com";

export function siteUrl(): string {
  const mac = process.env.NODE_ENV === "production" ? SITE_CHINH : "http://localhost:3000";
  return (process.env.NEXT_PUBLIC_SITE_URL || mac).replace(/\/$/, "");
}

export function urlDayDu(duong: string): string {
  return `${siteUrl()}${duong.startsWith("/") ? duong : `/${duong}`}`;
}

/** SEO-K (mục 7): thực thể chủ đề có liên kết Wikipedia (sameAs) — giúp Google/AI nối trang với đúng khái niệm.
 *  Chỉ ghi URL đã chắc chắn tồn tại; thêm mục mới phải mở thử link trước. */
export const THUC_THE = {
  "than-so": { name: "Thần số học", alternateName: "Numerology", sameAs: ["https://en.wikipedia.org/wiki/Numerology"] },
  "tu-vi": { name: "Tử vi Đẩu Số", alternateName: "Zi Wei Dou Shu", sameAs: ["https://en.wikipedia.org/wiki/Ziwei_doushu"] },
  "bat-tu": { name: "Bát tự (Tứ trụ)", alternateName: "Four Pillars of Destiny", sameAs: ["https://en.wikipedia.org/wiki/Four_Pillars_of_Destiny"] },
  "kinh-dich": { name: "Kinh Dịch", alternateName: "I Ching", sameAs: ["https://en.wikipedia.org/wiki/I_Ching", "https://vi.wikipedia.org/wiki/Kinh_D%E1%BB%8Bch"] },
  "phong-thuy": { name: "Phong thuỷ", alternateName: "Feng shui", sameAs: ["https://en.wikipedia.org/wiki/Feng_shui", "https://vi.wikipedia.org/wiki/Phong_th%E1%BB%A7y"] },
  lich: { name: "Âm lịch", alternateName: "Chinese calendar", sameAs: ["https://en.wikipedia.org/wiki/Chinese_calendar"] },
} as const satisfies Record<MangAnh, { name: string; alternateName: string; sameAs: readonly string[] }>;

export function ldThucThe(mang: MangAnh | null | undefined, ten?: string) {
  if (!mang) return ten ? { "@type": "Thing", name: ten } : undefined;
  const t = THUC_THE[mang];
  return { "@type": "Thing", name: t.name, alternateName: t.alternateName, sameAs: [...t.sameAs] };
}

/** WebPage cho trang công cụ/tra cứu không có Article (làm nhà, xông đất, hướng xấu năm, ngày tốt…). */
export function ldTrangWeb(o: { duong: string; ten: string; tomTat?: string; about?: string[]; ngaySua?: string }) {
  const mang = mangTheoDuong(o.duong);
  return {
    "@type": "WebPage",
    "@id": `${urlDayDu(o.duong)}#trang`,
    url: urlDayDu(o.duong),
    name: o.ten,
    inLanguage: "vi-VN",
    isPartOf: { "@id": `${siteUrl()}/#website` },
    publisher: { "@id": `${siteUrl()}/#to-chuc` },
    ...(o.tomTat ? { abstract: o.tomTat } : {}),
    ...(o.ngaySua ? { dateModified: o.ngaySua } : {}),
    about: [ldThucThe(mang), ...(o.about ?? []).map((x) => ({ "@type": "Thing", name: x }))].filter(Boolean),
    primaryImageOfPage: ldAnh(anhBai({ tieuDe: o.ten, mang }), o.ten),
  };
}

export function ldToChuc() {
  const vh = vanHanh();
  return {
    "@type": "Organization",
    "@id": `${siteUrl()}/#to-chuc`,
    name: TEN_SITE,
    ...(vh.chuSoHuu ? { legalName: vh.chuSoHuu } : {}),
    url: siteUrl(),
    logo: { "@type": "ImageObject", url: urlDayDu("/thuong-hieu/avatar-512.png"), width: 512, height: 512 },
    description: MO_TA_SITE,
    ...(vh.email ? {
      email: vh.email,
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: vh.email, availableLanguage: ["vi"] },
    } : {}),
    ...(vh.diaChi ? { address: vh.diaChi } : {}),
    ...(vh.mangXaHoi.length ? { sameAs: vh.mangXaHoi.map((m) => m.url) } : {}),
    // EEAT-1: người sáng lập / chủ biên (Person đầy đủ ở /tac-gia/duc-luan).
    founder: { "@type": "Person", "@id": `${siteUrl()}/tac-gia/duc-luan#nguoi`, name: "Đức Luân", url: urlDayDu("/tac-gia/duc-luan") },
    knowsAbout: [
      ...(["than-so", "tu-vi", "bat-tu", "kinh-dich", "phong-thuy", "lich"] as const).map((m) => ldThucThe(m)),
      "Thần số học Pythagoras", "Thần số học Chaldea", "Phong thuỷ Bát trạch", "Huyền Không phi tinh", "Xem ngày tốt", "Tuổi làm nhà",
    ],
    slogan: "Con số nói gì về bạn",
    areaServed: "VN",
  };
}

export function ldWebsite() {
  return {
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    name: TEN_SITE,
    alternateName: ["hieuban.com", "Hieu Ban Than"],
    keywords: TU_KHOA_SITE.join(", "),
    url: siteUrl(),
    inLanguage: "vi-VN",
    description: MO_TA_SITE,
    publisher: { "@id": `${siteUrl()}/#to-chuc` },
  };
}

export function ldUngDung() {
  return {
    "@type": "WebApplication",
    "@id": `${siteUrl()}/#ung-dung`,
    name: TEN_SITE,
    keywords: TU_KHOA_SITE.join(", "),
    url: siteUrl(),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    inLanguage: "vi-VN",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
    featureList: [
      "Thần số học: đường đời, sứ mệnh, linh hồn, nhân cách, năm cá nhân, biểu đồ ngày sinh",
      "Tử vi: lá số 12 cung, đại hạn, lưu niên, tiểu hạn",
      "Bát tự: tứ trụ, ngũ hành, dụng thần, đại vận",
      "Kinh Dịch: gieo quẻ, 64 quẻ",
      "Phong thuỷ: mệnh quái, tám hướng, hướng nhà hợp tuổi, hướng xấu theo năm",
      "Xem ngày tốt: hoàng lịch, giờ hoàng đạo, ngày kiêng; xem tuổi làm nhà, tuổi xông đất",
      "Hợp đôi theo thần số (không chấm điểm hợp khắc)",
    ],
    publisher: { "@id": `${siteUrl()}/#to-chuc` },
  };
}

export function ldDuongDan(cap: { ten: string; duong: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: cap.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.ten, item: urlDayDu(c.duong) })),
  };
}

export function ldHoiDap(hd: { hoi: string; dap: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: hd.map((h) => ({ "@type": "Question", name: h.hoi, acceptedAnswer: { "@type": "Answer", text: h.dap } })),
  };
}

export function goiLd(...nut: object[]) {
  return { "@context": "https://schema.org", "@graph": nut };
}

/** Google cắt tiêu đề ~60 ký tự: tiêu đề dài thì bỏ hậu tố " · Hiểu Bản Thân" (dùng title.absolute). */
export function tieuDeSeo(t: string): string | { absolute: string } {
  // SEO-M: tiêu đề nguồn ngoài (bài NotFair, CMS) dài > 70 ký tự → cắt ở ranh giới từ (rà site thật 2026-10-23).
  if (t.length > 70) return { absolute: catMoTa(t, 68) };
  return t.length > 52 ? { absolute: t } : t;
}

/** Mô tả meta ≤ 160 ký tự, cắt ở ranh giới từ. */
export function catMoTa(s: string, toiDa = 160): string {
  if (s.length <= toiDa) return s;
  const cat = s.slice(0, toiDa - 1);
  return `${cat.slice(0, cat.lastIndexOf(" ")).replace(/[,;:—–-]\s*$/, "")}…`;
}

/** SEO-K: ảnh đại diện bài 1200×630 có hình theo mảng (la bàn, 12 cung, quẻ, tứ trụ, vòng số, lịch) — /og vẽ. */
export type MangAnh = "than-so" | "tu-vi" | "bat-tu" | "kinh-dich" | "phong-thuy" | "lich";
export function anhBai(o: { tieuDe: string; mang?: MangAnh | null; nhan?: string; tot?: string[]; so?: string | number; hao?: number[] }): string {
  const q = new URLSearchParams({ tieu_de: o.tieuDe });
  if (o.mang) {
    q.set("mang", o.mang);
    if (o.nhan) q.set("nhan", o.nhan);
    if (o.tot?.length) q.set("tot", o.tot.join(","));
    if (o.so !== undefined) q.set("so", String(o.so));
    if (o.hao?.length === 6) q.set("hao", o.hao.join(""));
  }
  return `/og?${q.toString()}`;
}

/** Mảng của ảnh theo đoạn đầu đường dẫn silo (/tu-vi/…, /hop-doi/… → thần số). */
export function mangTheoDuong(duong: string): MangAnh | null {
  const d = duong.split("/")[1] ?? "";
  if (d === "hop-doi" || d === "than-so" || d === "hom-nay") return "than-so";
  if (d === "xem-ngay-tot" || d === "xem-tuoi-lam-nha" || d === "tuoi-xong-dat" || d === "xem-sao-han" || d === "lich-am" || d === "doi-lich-am-duong") return "lich";
  return (["tu-vi", "bat-tu", "kinh-dich", "phong-thuy"] as const).find((m) => m === d) ?? null;
}

/** ImageObject đủ kích thước + chú thích (Google Discover/ảnh tìm kiếm cần ảnh ≥ 1200 px rộng). */
export function ldAnh(duong: string, chuThich: string) {
  return { "@type": "ImageObject", url: urlDayDu(duong), contentUrl: urlDayDu(duong), width: 1200, height: 630, caption: chuThich };
}

/** Metadata chuẩn cho trang tĩnh: title, description, canonical, Open Graph + Twitter có ảnh. */
export function metaTrang({ tieuDe, moTa, duong, md, anh: anhRieng }: { tieuDe: string; moTa: string; duong: string; md?: string; anh?: string }) {
  const d = catMoTa(moTa);
  const anh = anhRieng ?? anhBai({ tieuDe, mang: mangTheoDuong(duong) });
  return {
    title: tieuDeSeo(tieuDe),
    description: d,
    alternates: { canonical: duong, ...(md ? { types: { "text/markdown": md } } : {}) },
    openGraph: { type: "website" as const, title: tieuDe, description: d, url: duong, locale: "vi_VN", siteName: TEN_SITE,
      images: [{ url: anh, width: 1200, height: 630, alt: tieuDe }] },
    twitter: { card: "summary_large_image" as const, title: tieuDe, description: d, images: [anh] },
  };
}
