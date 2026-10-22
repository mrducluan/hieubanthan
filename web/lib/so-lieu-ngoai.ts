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
import type { DongKiemChung } from "@/lib/kiem-chung";

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
  ["feedback_submitted", "Góp ý bài đọc"], ["advisor_question_completed", "Hỏi đáp xong"], ["profile_created", "Lưu hồ sơ"],
  ["daily_viewed", "Mở Hôm nay"], ["share_created", "Tạo link chia sẻ / mời"], ["share_clicked", "Bạn bè mở link"],
  ["compatibility_created", "Tạo hợp đôi"], ["referral_signup", "Đăng ký qua lời mời"], ["credit_earned", "Nhận Sao"],
  ["paywall_viewed", "Thấy phần khoá"], ["unlock_clicked", "Bấm mở khoá"], ["quota_reached", "Hết lượt hỏi miễn phí"],
  ["checkout_started", "Bắt đầu nạp"], ["payment_succeeded", "Nạp thành công"], ["unlock_succeeded", "Mở khoá thành công"],
];

// ------------------------------------------------------------------ Gate 1 / Gate 2 (docs/VIEC-CUA-ANH.md mục L)
/** Số người (trình duyệt) theo sự kiện trong 28 ngày; `co_giup` = góp ý "Có, khá trúng". */
export interface SoGate {
  landing: number; bat_dau: number; xong: number; gop_y: number; co_giup: number;
  /** profile_created kind=tai_khoan — "chủ động lưu hồ sơ" (lưu trên máy xảy ra TRƯỚC bài đọc nên không dùng). */
  ho_so: number; chia_se: number; dang_ky_moi: number;
}
export type DongGate = { ma: string; ten: string; cong: "Gate 1" | "Gate 2"; tu: number; mau: number; ti_le: number | null; nguong: number; dat: boolean | null };
/** Đủ mẫu để đọc số (dưới mức này tỉ lệ dao động quá mạnh). */
export const MAU_TOI_THIEU = 300;

/** Tỉ lệ cổng + ngưỡng ĐỀ XUẤT (anh chốt). null = chưa có mẫu số; dat null = chưa đủ mẫu để kết luận. */
export function tinhGate(s: SoGate, { taiKhoanBat = true }: { taiKhoanBat?: boolean } = {}): DongGate[] {
  const du = s.bat_dau >= MAU_TOI_THIEU;
  const d = (ma: string, ten: string, cong: DongGate["cong"], tu: number, mau: number, nguong: number, coThe = true): DongGate => {
    const ti_le = mau > 0 && coThe ? Math.min(1, tu / mau) : null;
    return { ma, ten, cong, tu, mau, ti_le, nguong, dat: ti_le === null || !du ? null : ti_le >= nguong };
  };
  return [
    d("G1", "Đọc hết / bắt đầu", "Gate 1", s.xong, s.bat_dau, 0.5),
    d("G4", "“Có giúp” / góp ý", "Gate 1", s.co_giup, s.gop_y, 0.6),
    d("LUU", "Lưu hồ sơ vào tài khoản / đọc hết", "Gate 1", s.ho_so, s.xong, 0.2, taiKhoanBat),
    d("G2", "Chia sẻ / đọc hết", "Gate 2", s.chia_se, s.xong, 0.08),
    d("G3", "K = đăng ký qua lời mời / chia sẻ", "Gate 2", s.dang_ky_moi, s.chia_se, 0.15),
  ];
}

export interface BaoCaoPosthog {
  pheu: { su_kien: string; ten: string; luot: number; nguoi: number }[];
  quayLai: { truoc: number; tro_lai: number } | null;
  gate: SoGate;
  /** Theo mảng: người bắt đầu / đọc hết / góp ý / "có giúp". */
  theoMang: { mo_dun: string; bat_dau: number; xong: number; gop_y: number; co_giup: number }[];
  /** Truy vấn Gate lỗi → bảng Gate hiện "lỗi", không kết luận sai. */
  gateLoi: string | null;
  /** HN-4: ý định hôm nay (mã) + nhóm việc chưa hỗ trợ trong câu gõ không nhận ra (mã cố định, không có câu). */
  yDinh: { top: { ma: string; n: number }[]; goTay: number; khongNhanRa: number; nhomMoi: { ma: string; n: number }[] } | null;
  /** KC-0: phiếu "Đúng với mình / Chưa đúng" trên thẻ Tử vi theo mã mẫu (90 ngày, mỗi trình duyệt tính một lần mỗi
   *  kết quả). null = truy vấn lỗi. Chỉ để người biên tập xem lại KB — không tự đổi luận giải. */
  kiemChung: DongKiemChung[] | null;
  /** CTA-1: khối "Đọc tiếp" cuối phần xem theo trang (người thấy / lượt bấm thẻ / bấm Sao / bấm ủng hộ) + biến thể câu
   *  mời (thẻ Bản đồ 5 mảng, tiêu đề khối) + trò đoán số. null = truy vấn lỗi. Chỉ mã. */
  cta: {
    theoTrang: { tu: string; thay: number; bam: number; sao: number; ung_ho: number }[];
    bienThe: { su_kien: string; bien_the: string; luot: number }[];
    doan: { dung: number; sai: number };
  } | null;
}

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
  const nguoi = (e: string) => theo.get(e)?.nguoi ?? 0;
  // Gate: chỉ sự kiện định nghĩa mới (feature_version gate_v1, lib/do-luong PHIEN_BAN) — không trộn số cũ.
  // countDistinctIf → mỗi người đếm một lần dù góp ý nhiều lần / nhiều mảng.
  const DK = `timestamp > now() - INTERVAL 28 DAY AND properties.feature_version = 'gate_v1'`;
  const COT = `countDistinctIf(distinct_id, event = 'reading_started'), countDistinctIf(distinct_id, event = 'reading_completed'),
    countDistinctIf(distinct_id, event = 'feedback_submitted'), countDistinctIf(distinct_id, event = 'feedback_submitted' AND properties.huu_ich = 'co')`;
  let gateLoi: string | null = null;
  const [tong, mang] = await Promise.all([
    hogql<number[]>(`SELECT countDistinctIf(distinct_id, event = 'landing_viewed'), ${COT},
      countDistinctIf(distinct_id, event = 'profile_created' AND properties.kind = 'tai_khoan'),
      countDistinctIf(distinct_id, event = 'share_created'), countDistinctIf(distinct_id, event = 'referral_signup')
      FROM events WHERE ${DK}`),
    hogql<[string | null, number, number, number, number]>(`SELECT properties.mo_dun, ${COT} FROM events
      WHERE ${DK} AND event IN ('reading_started', 'reading_completed', 'feedback_submitted') GROUP BY properties.mo_dun`),
  ]).catch((e: unknown) => { gateLoi = e instanceof Error ? e.message : "Truy vấn Gate lỗi."; return [[], []] as [number[][], [string | null, number, number, number, number][]]; });
  const t = (tong[0] ?? []).map(Number);
  const YD = `event = 'daily_intent_set' AND timestamp > now() - INTERVAL 28 DAY`;
  const yDinh = await Promise.all([
    hogql<[string, number]>(`SELECT ma, count() AS n FROM events ARRAY JOIN splitByChar(',', toString(properties.y_dinh)) AS ma
      WHERE ${YD} AND ma != '' GROUP BY ma ORDER BY n DESC LIMIT 11`),
    hogql<[number, number]>(`SELECT countIf(properties.go_tay = 1), countIf(properties.nhan_ra = 0) FROM events WHERE ${YD}`),
    hogql<[string, number]>(`SELECT ma, count() AS n FROM events ARRAY JOIN splitByChar(',', toString(properties.nhom_chua_ho_tro)) AS ma
      WHERE ${YD} AND properties.nhan_ra = 0 AND ma != '' GROUP BY ma ORDER BY n DESC LIMIT 12`),
  ]).then(([top, dem, moi]) => ({
    top: top.map(([ma, n]) => ({ ma, n: Number(n) })), goTay: Number(dem[0]?.[0] ?? 0), khongNhanRa: Number(dem[0]?.[1] ?? 0),
    nhomMoi: moi.map(([ma, n]) => ({ ma, n: Number(n) })),
  })).catch(() => null);
  // KC-0: chỉ mã (lib/kiem-chung) — sự kiện không mang chữ, lá số hay ngày giờ. 90 ngày vì phiếu thưa hơn sự kiện xem.
  const kiemChung = await hogql<[string | null, string | null, number, number]>(
    `SELECT properties.loai, properties.mau, countDistinctIf(distinct_id, properties.ket_qua = 'dung'),
       countDistinctIf(distinct_id, properties.ket_qua = 'chua_dung')
     FROM events WHERE event = 'tuvi_kiem_chung' AND timestamp > now() - INTERVAL 90 DAY
     GROUP BY properties.loai, properties.mau LIMIT 500`)
    .then((rows) => rows.filter(([l, m]) => l && m).map(([l, m, d, c]) => ({ loai: l!, mau: m!, dung: Number(d), chua_dung: Number(c) })))
    .catch(() => null);
  const CT = `timestamp > now() - INTERVAL 28 DAY`;
  const cta = await Promise.all([
    hogql<[string | null, string | null, number, number]>(
      `SELECT event, properties.tu, count(), count(DISTINCT distinct_id) FROM events
       WHERE ${CT} AND event IN ('cross_cta_viewed', 'cross_cta_clicked', 'sao_cta_clicked', 'donate_cta_clicked')
       GROUP BY event, properties.tu LIMIT 200`),
    hogql<[string, string | null, number]>(
      `SELECT event, properties.bien_the, count() FROM events
       WHERE ${CT} AND event IN ('cross_cta_viewed', 'cross_cta_clicked', 'share_created', 'guess_played')
         AND properties.bien_the != '' GROUP BY event, properties.bien_the LIMIT 200`),
    hogql<[number, number]>(`SELECT countIf(properties.dung = 1), countIf(properties.dung = 0) FROM events
       WHERE ${CT} AND event = 'guess_played'`),
  ]).then(([tt, bt, dd]) => {
    const theo = new Map<string, { tu: string; thay: number; bam: number; sao: number; ung_ho: number }>();
    for (const [e, tu, luot, nguoi] of tt) {
      const k = tu || "khac";
      const d = theo.get(k) ?? { tu: k, thay: 0, bam: 0, sao: 0, ung_ho: 0 };
      if (e === "cross_cta_viewed") d.thay += Number(nguoi);
      else if (e === "cross_cta_clicked") d.bam += Number(luot);
      else if (e === "sao_cta_clicked") d.sao += Number(luot);
      else d.ung_ho += Number(luot);
      theo.set(k, d);
    }
    return {
      theoTrang: [...theo.values()].sort((a, b) => b.thay - a.thay),
      bienThe: bt.filter(([, b]) => b).map(([e, b, n]) => ({ su_kien: e, bien_the: b!, luot: Number(n) })),
      doan: { dung: Number(dd[0]?.[0] ?? 0), sai: Number(dd[0]?.[1] ?? 0) },
    };
  }).catch(() => null);
  return {
    yDinh, kiemChung, cta,
    pheu: PHEU.map(([e, ten]) => ({ su_kien: e, ten, luot: theo.get(e)?.luot ?? 0, nguoi: nguoi(e) })),
    quayLai: ql[0] ? { truoc: Number(ql[0][0]), tro_lai: Number(ql[0][1]) } : null,
    gate: {
      landing: t[0] ?? 0, bat_dau: t[1] ?? 0, xong: t[2] ?? 0, gop_y: t[3] ?? 0, co_giup: t[4] ?? 0,
      ho_so: t[5] ?? 0, chia_se: t[6] ?? 0, dang_ky_moi: t[7] ?? 0,
    },
    theoMang: mang.map(([md, bd, x, g, c]) => ({ mo_dun: md || "khac", bat_dau: Number(bd), xong: Number(x), gop_y: Number(g), co_giup: Number(c) }))
      .sort((a, b) => b.bat_dau - a.bat_dau),
    gateLoi,
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
