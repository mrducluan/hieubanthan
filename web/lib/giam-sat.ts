// Giám sát lỗi (Sentry) — hạ tầng GĐ1, docs/KIEN-TRUC-VAN-HANH.md. Chỉ bật khi có DSN; nạp động nên
// không có DSN thì không tải thêm byte nào. KHÔNG gửi dữ liệu cá nhân: bỏ body, query, cookie, user, IP;
// không replay, không tracing (NĐ 13/2023 — ngày giờ sinh, tên nằm trong body/URL).
import type { ErrorEvent, EventHint } from "@sentry/nextjs";

type SentryMod = typeof import("@sentry/nextjs");

export function locSuKien(e: ErrorEvent, _h?: EventHint): ErrorEvent {
  if (e.request) {
    delete e.request.data;
    delete e.request.cookies;
    delete e.request.query_string;
    if (e.request.url) e.request.url = e.request.url.split("?")[0];
    if (e.request.headers) {
      const giu = ["user-agent", "content-type", "referer"];
      e.request.headers = Object.fromEntries(Object.entries(e.request.headers).filter(([k]) => giu.includes(k.toLowerCase())));
    }
  }
  delete e.user;
  delete e.extra;
  if (e.breadcrumbs) {
    e.breadcrumbs = e.breadcrumbs.map((b) => (b.data?.url ? { ...b, data: { ...b.data, url: String(b.data.url).split("?")[0] } } : b));
  }
  return e;
}

function dsn(): string | undefined {
  return typeof window === "undefined" ? process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN : process.env.NEXT_PUBLIC_SENTRY_DSN;
}

let nap: Promise<SentryMod | null> | null = null;

export function khoiTaoGiamSat(): Promise<SentryMod | null> {
  const d = dsn();
  if (!d) return Promise.resolve(null);
  nap ??= import("@sentry/nextjs").then((m) => {
    // Phía server (Node) gói CJS nằm dưới `default`; phía trình duyệt là namespace ESM đầy đủ.
    const S = (typeof m.captureException === "function" ? m : (m as unknown as { default: SentryMod }).default);
    S.init({
      dsn: d,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? "production",
      // v11 mặc định thu MỌI THỨ (body, header, cookie, query, user) → tắt tường minh từng loại.
      dataCollection: {
        userInfo: false, cookies: false, urlQueryParams: false, httpBodies: [],
        httpHeaders: { allow: ["user-agent", "content-type", "referer"] },
      },
      tracesSampleRate: 0,
      beforeSend: locSuKien,
    });
    return S;
  }).catch(() => null);
  return nap;
}

/** Ghi một lỗi kèm ngữ cảnh ngắn (tên tính năng, mã trạng thái) — không bao giờ kèm dữ liệu người dùng. */
export function baoLoi(loi: unknown, ngu_canh: Record<string, string | number> = {}): void {
  void khoiTaoGiamSat().then((S) => S?.withScope((sc) => { sc.setTags(ngu_canh); S.captureException(loi); }));
}
