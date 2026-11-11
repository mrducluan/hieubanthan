// IndexNow — báo Bing, Yandex, Seznam, Naver… (Bing cấp dữ liệu cho Copilot và ChatGPT tìm kiếm) có trang vừa đổi.
// Khoá công khai theo thiết kế giao thức (phục vụ ở /indexnow.txt), không phải bí mật.
// Google KHÔNG dùng IndexNow: Google đọc sitemap (lastmod) + nút "Yêu cầu lập chỉ mục" trong Search Console.
import { siteUrl } from "@/lib/seo";

export const INDEXNOW_KEY = "063b24c995f334e004c3d7de00cf0bbf";

// Một đường dẫn chỉ báo lại sau 10 phút (Chủ biên bấm lưu nhiều lần liền nhau → một lần báo). Bộ nhớ của tiến trình hàm.
const DA_BAO = new Map<string, number>();
const CACH_MS = 10 * 60_000;

/** Báo IndexNow các đường dẫn trong site ("/blog/abc"). Chỉ chạy ở bản production (bản xem trước không báo URL
 *  không có thật). Lỗi mạng chỉ ghi log — không bao giờ làm hỏng việc gọi nó. Trả số URL đã gửi. */
export async function baoIndexNow(duong: string[], bayGio = Date.now()): Promise<number> {
  if (process.env.VERCEL_ENV !== "production") return 0;
  const goc = siteUrl().replace(/\/$/, "");
  const urlList = [...new Set(duong)].filter((d) => /^\/[a-z0-9\-/]*$/.test(d))
    .filter((d) => bayGio - (DA_BAO.get(d) ?? 0) > CACH_MS).map((d) => `${goc}${d}`);
  if (!urlList.length) return 0;
  for (const u of urlList) DA_BAO.set(u.slice(goc.length), bayGio);
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST", headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(goc).host, key: INDEXNOW_KEY, keyLocation: `${goc}/indexnow.txt`, urlList }),
      signal: AbortSignal.timeout(8_000),
    });
    if (r.status !== 200 && r.status !== 202) console.warn(`[indexnow] HTTP ${r.status}`);
  } catch (e) {
    console.warn("[indexnow] không gửi được:", (e as Error).name);
  }
  return urlList.length;
}
