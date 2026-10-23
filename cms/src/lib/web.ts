// Nối CMS ↔ web hieuban.com (web chỉ ĐỌC CMS qua REST; CMS chỉ báo web "có thay đổi").
//   WEB_URL               địa chỉ web (vd https://hieuban.com)
//   CMS_WEBHOOK_SECRET    bí mật chung để web xoá cache khi bài/tính năng đổi (POST /api/cms/lam-moi)
//   CMS_PREVIEW_SECRET    bí mật chung ký link xem trước nháp (GET /api/cms/xem-truoc?slug=&ma=)
import { createHmac } from "node:crypto";

export const webUrl = () => (process.env.WEB_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Mã ký link xem trước — web kiểm lại bằng cùng công thức (web/lib/cms.ts `maXemTruoc`). SEC-2: ký kèm hạn `het`
 *  (giây unix) → link chuyển tiếp / lộ ra ngoài chỉ dùng được trong 1 giờ. */
export const HAN_XEM_TRUOC_GIAY = 60 * 60;
export function maXemTruoc(slug: string, het: number, bi = process.env.CMS_PREVIEW_SECRET): string | null {
  if (!bi) return null;
  return createHmac("sha256", bi).update(`xem-truoc:${slug}:${het}`).digest("base64url");
}
const hetMoi = () => Math.floor(Date.now() / 1000) + HAN_XEM_TRUOC_GIAY;

export function linkXemTruoc(slug: string | undefined | null): string | null {
  if (!slug) return null;
  const het = hetMoi(), ma = maXemTruoc(slug, het);
  if (!ma) return null;
  return `${webUrl()}/api/cms/xem-truoc?slug=${encodeURIComponent(slug)}&het=${het}&ma=${ma}`;
}

/** ND-6: nút "Xem trước" của Trang website / Mẫu cụm → web bật chế độ nháp rồi mở URL (mẫu cụm: web mở một trang ví dụ
 *  của cụm). Mã ký trên "trang:<đường dẫn hoặc mẫu>" — cùng bí mật CMS_PREVIEW_SECRET, khác miền với link bài viết. */
export function linkXemTrang(duong: string | undefined | null): string | null {
  if (!duong || !duong.startsWith("/")) return null;
  const het = hetMoi(), ma = maXemTruoc(`trang:${duong}`, het);
  if (!ma) return null;
  return `${webUrl()}/api/cms/xem-truoc?duong=${encodeURIComponent(duong)}&het=${het}&ma=${ma}`;
}

/** Báo web xoá cache (thẻ "cms"; ND: kèm `duong` → web xoá thêm thẻ "trang:<duong>"). Không chặn lưu bài khi web
 *  chậm/lỗi: chờ tối đa 4 giây, lỗi thì ghi log. */
export async function baoWebLamMoi(ly_do: string, slug?: string | null, duong?: string | null): Promise<void> {
  const bi = process.env.CMS_WEBHOOK_SECRET;
  if (!bi || !process.env.WEB_URL) return;
  try {
    const r = await fetch(`${webUrl()}/api/cms/lam-moi`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-cms-bi-mat": bi },
      body: JSON.stringify({ ly_do, slug: slug ?? null, ...(duong ? { duong } : {}) }),
      signal: AbortSignal.timeout(4_000),
    });
    if (!r.ok) console.warn(`[cms] web làm mới trả ${r.status}`);
  } catch (e) {
    console.warn("[cms] không báo được web làm mới:", (e as Error).name);
  }
}
