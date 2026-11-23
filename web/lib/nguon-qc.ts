// META-QC + QC-G: người vào từ quảng cáo Meta hoặc Google (Facebook / Instagram) — nhận ra ở trang vào đầu tiên (fbclid hoặc utm_source),
// nhớ trên máy 30 ngày để MỌI sự kiện PostHog sau đó mang `qc: "meta"` → /quan-tri/tang-truong so phễu
// vào trang → đọc → hồ sơ → nạp của người đến từ quảng cáo với tiền quảng cáo. Chỉ là MÃ nguồn, không mã lượt bấm.
const KHOA = "hbt.qc";
const HAN = 30 * 86_400_000;
const UTM_META = /^(facebook|fb|ig|instagram|meta|messenger)$/i;
// QC-G: quảng cáo Google — gclid / gbraid / wbraid (Google tự gắn) hoặc utm_source=google|adwords|google_ads.
const UTM_GOOGLE = /^(google|adwords|google_ads|googleads)$/i;
export type NguonQc = "meta" | "google";

/** Hàm thuần: URL trang vào → "meta" | "google" | null. */
export function nguonQc(url: string): NguonQc | null {
  try {
    const u = new URL(url, "https://hieuban.com");
    if (u.searchParams.has("fbclid")) return "meta";
    if (u.searchParams.has("gclid") || u.searchParams.has("gbraid") || u.searchParams.has("wbraid")) return "google";
    const src = (u.searchParams.get("utm_source") ?? "").trim();
    // utm_source=google không kèm utm_medium=cpc/paid… vẫn có thể là link tự đặt — chỉ tính Google khi là quảng cáo.
    if (UTM_GOOGLE.test(src) && /^(cpc|ppc|paid|paidsearch|paid_search|sem)$/i.test((u.searchParams.get("utm_medium") ?? "").trim())) return "google";
    return UTM_META.test(src) ? "meta" : null;
  } catch {
    return null;
  }
}

export function nhoNguonQc(url: string): void {
  const v = nguonQc(url);
  if (!v) return;
  try { localStorage.setItem(KHOA, JSON.stringify({ v, t: Date.now() })); } catch { /* bỏ qua */ }
}

export function docNguonQc(): string | null {
  try {
    const x = JSON.parse(localStorage.getItem(KHOA) ?? "null") as { v?: string; t?: number } | null;
    return (x?.v === "meta" || x?.v === "google") && typeof x.t === "number" && Date.now() - x.t < HAN ? x.v : null;
  } catch {
    return null;
  }
}
