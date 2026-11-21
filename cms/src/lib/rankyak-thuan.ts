// RY-1 — phần THUẦN của bộ nhận bài RankYak (không Payload): kiểm bí mật webhook, đọc thân sự kiện, ngày đăng, bỏ H1.
import { createHash, timingSafeEqual } from "node:crypto";

export type BaiRankYak = {
  id: number | string; slug?: string | null; title?: string | null; excerpt?: string | null; meta_title?: string | null;
  meta_description?: string | null; html?: string | null; markdown?: string | null; header_image_url?: string | null;
  publish_at?: string | null; published_at?: string | null; updated_at?: string | null; archived_at?: string | null;
};

// ─── Bí mật webhook ────────────────────────────────────────────────────────────────────────────────────────────────

const bam = (s: string) => createHash("sha256").update(s).digest();

/** Header nào mang đúng bí mật (nguyên chuỗi hoặc "Bearer <bí mật>")? Thiếu env / bí mật < 16 ký tự → luôn sai. */
export function dungBiMatRankYak(headers: Headers, env: Record<string, string | undefined> = process.env): boolean {
  const bi = env.RANKYAK_WEBHOOK_SECRET?.trim();
  if (!bi || bi.length < 16) return false;
  const muc = bam(bi);
  let dung = false;
  headers.forEach((v) => {
    for (const ung of [v.trim(), v.trim().replace(/^bearer\s+/i, "")]) {
      if (ung && timingSafeEqual(bam(ung), muc)) dung = true;
    }
  });
  return dung;
}

/** Tên các header (không giá trị) — ghi log khi từ chối để biết RankYak gửi bí mật ở đâu. */
export const tenHeader = (h: Headers) => { const t: string[] = []; h.forEach((_, k) => t.push(k)); return t.sort(); };

// ─── Đọc thân webhook ──────────────────────────────────────────────────────────────────────────────────────────────

export type SuKien = { event: string; status: string | null; article: BaiRankYak | null };

const laBai = (x: unknown): x is BaiRankYak =>
  Boolean(x && typeof x === "object" && "id" in x && (typeof (x as BaiRankYak).html === "string" || typeof (x as BaiRankYak).title === "string"));

export function docSuKien(body: unknown): SuKien {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const event = typeof b.event === "string" ? b.event : typeof b.type === "string" ? b.type : "";
  const status = typeof b.status === "string" ? b.status : null;
  const article = laBai(b.article) ? b.article : laBai(b.data) ? b.data : laBai(b) ? (b as BaiRankYak) : null;
  return { event: event || (article ? "article.published" : "test"), status, article };
}

/** Bài đã tới ngày đăng (webhook cũng chỉ bắn khi bài đăng) — bài lên lịch tương lai chưa nhập. */
export function daToiNgay(a: BaiRankYak, bayGio = Date.now()): boolean {
  if (a.published_at) return true;
  const t = a.publish_at ? Date.parse(a.publish_at) : NaN;
  return Number.isFinite(t) && t <= bayGio;
}

/** Bỏ H1 đứng đầu thân bài (bản API không có exclude_h1 vẫn kèm tiêu đề — trang đã có H1 là tiêu đề bài). */
export function boH1Dau(html: string): string {
  return html.replace(/^\s*(<(?:div|article|section)[^>]*>\s*)?<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, "$1");
}
