// QT-4 — kéo số liệu tăng trưởng từ Search Console, GA4 (tài khoản dịch vụ Google, CHỈ ĐỌC) và PostHog (khoá cá nhân
// CHỈ ĐỌC) cho /quan-tri/tang-truong. Chỉ chạy ở MÁY CHỦ, không thêm thư viện: ký JWT RS256 bằng node:crypto.
// Env (đều tuỳ chọn — thiếu thì mục đó báo "chưa kết nối"):
//   GOOGLE_SERVICE_ACCOUNT_JSON  nội dung file JSON khoá tài khoản dịch vụ (dán nguyên, hoặc base64)
//   GSC_SITE_URL                 mặc định "sc-domain:hieuban.com"
//   GA4_PROPERTY_ID              số property GA4 (vd 412345678)
//   POSTHOG_PERSONAL_API_KEY + POSTHOG_PROJECT_ID (+ POSTHOG_API_HOST, mặc định https://us.posthog.com)
// Kết quả cache 1 giờ (số liệu Google trễ 1–2 ngày, gọi dày không có ích, lại tốn hạn mức API).
import { createSign } from "node:crypto";
import { unstable_cache } from "next/cache";

export class ChuaKetNoi extends Error {}

const doiNgay = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

// ------------------------------------------------------------------ Google
interface KhoaDichVu { client_email: string; private_key: string; token_uri?: string }

export function docKhoaDichVu(tho = process.env.GOOGLE_SERVICE_ACCOUNT_JSON): KhoaDichVu | null {
  if (!tho?.trim()) return null;
  const s = tho.trim();
  try {
    const j = JSON.parse(s.startsWith("{") ? s : Buffer.from(s, "base64").toString("utf8")) as KhoaDichVu;
    return j.client_email && j.private_key ? j : null;
  } catch {
    return null;
  }
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

/** JWT ký RS256 để đổi lấy access token (OAuth 2.0 cho tài khoản dịch vụ). Xuất ra để kiểm thử. */
export function kyJwt(k: KhoaDichVu, scope: string, bayGio = Math.floor(Date.now() / 1000)): string {
  const dau = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const than = b64url(JSON.stringify({
    iss: k.client_email, scope, aud: k.token_uri ?? "https://oauth2.googleapis.com/token", iat: bayGio, exp: bayGio + 3600,
  }));
  const ky = createSign("RSA-SHA256").update(`${dau}.${than}`).sign(k.private_key.replace(/\\n/g, "\n"));
  return `${dau}.${than}.${b64url(ky)}`;
}

const PHAM_VI = "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly";
let veGoogle: { token: string; het: number } | null = null;

async function tokenGoogle(): Promise<string> {
  const k = docKhoaDichVu();
  if (!k) throw new ChuaKetNoi("Chưa đặt GOOGLE_SERVICE_ACCOUNT_JSON.");
  if (veGoogle && veGoogle.het > Date.now() + 60_000) return veGoogle.token;
  const r = await fetch(k.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(15_000),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: kyJwt(k, PHAM_VI) }),
  });
  const j = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!r.ok || !j.access_token) throw new Error(`Google từ chối khoá tài khoản dịch vụ (${r.status}).`);
  veGoogle = { token: j.access_token, het: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

async function goiGoogle<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(20_000),
    headers: { authorization: `Bearer ${await tokenGoogle()}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 403) throw new Error("Tài khoản dịch vụ chưa được thêm vào Search Console / GA4 (quyền Xem).");
  if (!r.ok) throw new Error(`Google API lỗi ${r.status}.`);
  return (await r.json()) as T;
}

export interface DongGsc { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }
export interface BaoCaoGsc {
  tong: { clicks: number; impressions: number; ctr: number; position: number } | null;
  theoNgay: DongGsc[]; truyVan: DongGsc[]; trang: DongGsc[]; coHoi: DongGsc[];
}

const gscSite = () => process.env.GSC_SITE_URL || "sc-domain:hieuban.com";

async function gsc(dimensions: string[], rowLimit: number): Promise<DongGsc[]> {
  const j = await goiGoogle<{ rows?: DongGsc[] }>(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSite())}/searchAnalytics/query`,
    { startDate: doiNgay(30), endDate: doiNgay(2), dimensions, rowLimit, dataState: "final" });
  return j.rows ?? [];
}

/** "Cơ hội": truy vấn đang ở trang 1–2 (vị trí 4–20), nhiều hiển thị nhưng ít nhấp → viết/sửa nội dung là lên. */
export function locCoHoi(ds: DongGsc[], toiDa = 20): DongGsc[] {
  return ds.filter((d) => d.position >= 4 && d.position <= 20 && d.impressions >= 20 && d.ctr < 0.05)
    .sort((a, b) => b.impressions * (1 - b.ctr) - a.impressions * (1 - a.ctr)).slice(0, toiDa);
}

async function baoCaoGscTho(): Promise<BaoCaoGsc> {
  const [ngay, truyVan, trang, cap, tong] = await Promise.all([
    gsc(["date"], 40), gsc(["query"], 25), gsc(["page"], 25), gsc(["query", "page"], 1000), gsc([], 1),
  ]);
  return { tong: tong[0] ?? null, theoNgay: ngay, truyVan, trang, coHoi: locCoHoi(cap) };
}

export interface BaoCaoGa4 { tong: Record<string, number>; kenh: { ten: string; phien: number; nguoi: number }[]; suKien: { ten: string; so: number }[] }

async function baoCaoGa4Tho(): Promise<BaoCaoGa4> {
  const id = process.env.GA4_PROPERTY_ID?.trim();
  if (!id || !/^\d+$/.test(id)) throw new ChuaKetNoi("Chưa đặt GA4_PROPERTY_ID.");
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`;
  const ky = [{ startDate: "28daysAgo", endDate: "yesterday" }];
  type Bc = { rows?: { dimensionValues?: { value: string }[]; metricValues: { value: string }[] }[] };
  const [tong, kenh, sk] = await Promise.all([
    goiGoogle<Bc>(url, { dateRanges: ky, metrics: [{ name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" }, { name: "engagedSessions" }] }),
    goiGoogle<Bc>(url, { dateRanges: ky, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "activeUsers" }], limit: 12 }),
    goiGoogle<Bc>(url, { dateRanges: ky, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }], limit: 25 }),
  ]);
  const t = tong.rows?.[0]?.metricValues.map((m) => Number(m.value)) ?? [];
  return {
    tong: { nguoi: t[0] ?? 0, nguoi_moi: t[1] ?? 0, phien: t[2] ?? 0, phien_tuong_tac: t[3] ?? 0 },
    kenh: (kenh.rows ?? []).map((r) => ({ ten: r.dimensionValues?.[0]?.value ?? "?", phien: Number(r.metricValues[0]?.value ?? 0), nguoi: Number(r.metricValues[1]?.value ?? 0) })),
    suKien: (sk.rows ?? []).map((r) => ({ ten: r.dimensionValues?.[0]?.value ?? "?", so: Number(r.metricValues[0]?.value ?? 0) })),
  };
}

// ------------------------------------------------------------------ PostHog
/** Phễu theo mục tiêu tăng trưởng (docs/MUC-TIEU-TANG-TRUONG.md) — tên sự kiện trong lib/do-luong.ts. */
export const PHEU: [string, string][] = [
  ["landing_viewed", "Vào trang"], ["reading_started", "Bắt đầu xem"], ["reading_completed", "Xem xong"],
  ["advisor_question_completed", "Hỏi đáp xong"], ["profile_created", "Lưu hồ sơ"], ["daily_viewed", "Mở Hôm nay"], ["share_clicked", "Bấm chia sẻ"],
  ["compatibility_created", "Tạo hợp đôi"], ["referral_signup", "Đăng ký qua lời mời"], ["credit_earned", "Nhận Sao"],
];

export interface BaoCaoPosthog { pheu: { su_kien: string; ten: string; luot: number; nguoi: number }[]; quayLai: { truoc: number; tro_lai: number } | null }

async function hogql<T>(query: string): Promise<T[]> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY, du_an = process.env.POSTHOG_PROJECT_ID?.trim();
  if (!key || !du_an) throw new ChuaKetNoi("Chưa đặt POSTHOG_PERSONAL_API_KEY + POSTHOG_PROJECT_ID.");
  if (!/^\d+$/.test(du_an)) throw new ChuaKetNoi("POSTHOG_PROJECT_ID phải là số.");
  const host = (process.env.POSTHOG_API_HOST || "https://us.posthog.com").replace(/\/$/, "");
  const r = await fetch(`${host}/api/projects/${du_an}/query/`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(30_000),
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  if (r.status === 401 || r.status === 403) throw new Error("PostHog từ chối khoá (cần khoá cá nhân có quyền query:read).");
  if (!r.ok) throw new Error(`PostHog lỗi ${r.status}.`);
  return ((await r.json()) as { results?: T[] }).results ?? [];
}

async function baoCaoPosthogTho(): Promise<BaoCaoPosthog> {
  const ds = PHEU.map(([e]) => `'${e}'`).join(", ");
  const [rows, ql] = await Promise.all([
    hogql<[string, number, number]>(
      `SELECT event, count(), count(DISTINCT distinct_id) FROM events WHERE timestamp > now() - INTERVAL 28 DAY AND event IN (${ds}) GROUP BY event`),
    // Quay lại: trình duyệt có hoạt động 8–14 ngày trước, bao nhiêu cái còn quay lại trong 7 ngày gần nhất.
    // PostHog chạy "identified_only" + localStorage → distinct_id ổn định theo trình duyệt, không cần cookie.
    hogql<[number, number]>(
      `SELECT count(), countIf(distinct_id IN (SELECT DISTINCT distinct_id FROM events WHERE timestamp > now() - INTERVAL 7 DAY))
       FROM (SELECT DISTINCT distinct_id FROM events WHERE timestamp > now() - INTERVAL 14 DAY AND timestamp <= now() - INTERVAL 7 DAY)`)
      .catch(() => []),
  ]);
  const theo = new Map(rows.map(([e, l, n]) => [e, { luot: Number(l), nguoi: Number(n) }]));
  return {
    pheu: PHEU.map(([e, ten]) => ({ su_kien: e, ten, luot: theo.get(e)?.luot ?? 0, nguoi: theo.get(e)?.nguoi ?? 0 })),
    quayLai: ql[0] ? { truoc: Number(ql[0][0]), tro_lai: Number(ql[0][1]) } : null,
  };
}

// ------------------------------------------------------------------ cache + kết quả an toàn
export type KetQua<T> = { ok: true; du: T } | { ok: false; chuaKetNoi: boolean; loi: string };

function anToan<T>(f: () => Promise<T>, khoa: string) {
  const c = unstable_cache(f, [khoa], { revalidate: 3600 });
  return async (): Promise<KetQua<T>> => {
    try { return { ok: true, du: await c() }; } catch (e) {
      return { ok: false, chuaKetNoi: e instanceof ChuaKetNoi, loi: e instanceof Error ? e.message : "Lỗi không rõ." };
    }
  };
}

// unstable_cache không giữ lỗi → vừa đặt env (hoặc Google vừa cấp quyền) là lần mở sau thấy ngay.
export const baoCaoGsc = anToan(baoCaoGscTho, "qt-gsc");
export const baoCaoGa4 = anToan(baoCaoGa4Tho, "qt-ga4");
export const baoCaoPosthog = anToan(baoCaoPosthogTho, "qt-posthog");
