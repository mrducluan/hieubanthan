// BLOG-3b — nguồn đọc bài NotFair của CMS (tách riêng, không import gì để test bằng node --test).
const API = () => process.env.NOTFAIR_SEO_API_URL ?? "https://notfair.co/api/seo/content";

/** Nguồn đọc bài NotFair của CMS (BLOG-3b): khoá riêng của CMS → gọi thẳng NotFair; chưa có khoá riêng nhưng có bí mật
 *  chung với web (`CMS_WEBHOOK_SECRET` + `WEB_URL`) → đọc QUA web (`GET /api/cms/notfair`, web dùng khoá của nó).
 *  Trước đây thiếu khoá ở dự án CMS là bảng NotFair trống → Chủ biên không nhập/sửa được bài (sự cố 2026-10-24). */
export type NguonNotFair = "truc_tiep" | "qua_web";
export function nguonNotFair(env: NodeJS.ProcessEnv = process.env): NguonNotFair | null {
  if (env.NOTFAIR_SEO_API_KEY) return "truc_tiep";
  if (env.CMS_WEBHOOK_SECRET && env.WEB_URL) return "qua_web";
  return null;
}

/** Địa chỉ + header cho một lượt gọi (tách ra để test không cần mạng). */
export function cauHinhGoi(duong: string, env: NodeJS.ProcessEnv = process.env): { url: string; headers: Record<string, string> } {
  const nguon = nguonNotFair(env);
  if (nguon === "truc_tiep") return { url: `${API()}${duong}`, headers: { authorization: `Bearer ${env.NOTFAIR_SEO_API_KEY}` } };
  if (nguon === "qua_web") {
    return { url: `${(env.WEB_URL || "").replace(/\/+$/, "")}/api/cms/notfair${duong}`, headers: { "x-cms-bi-mat": env.CMS_WEBHOOK_SECRET! } };
  }
  throw new Error("Chưa đặt NOTFAIR_SEO_API_KEY cho CMS (hoặc CMS_WEBHOOK_SECRET + WEB_URL để đọc qua web).");
}

