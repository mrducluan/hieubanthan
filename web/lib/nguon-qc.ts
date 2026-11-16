// META-QC: người vào từ quảng cáo Meta (Facebook / Instagram) — nhận ra ở trang vào đầu tiên (fbclid hoặc utm_source),
// nhớ trên máy 30 ngày để MỌI sự kiện PostHog sau đó mang `qc: "meta"` → /quan-tri/tang-truong so phễu
// vào trang → đọc → hồ sơ → nạp của người đến từ quảng cáo với tiền quảng cáo. Chỉ là MÃ nguồn, không mã lượt bấm.
const KHOA = "hbt.qc";
const HAN = 30 * 86_400_000;
const UTM_META = /^(facebook|fb|ig|instagram|meta|messenger)$/i;

/** Hàm thuần: URL trang vào → "meta" hoặc null. */
export function nguonQc(url: string): "meta" | null {
  try {
    const u = new URL(url, "https://hieuban.com");
    if (u.searchParams.has("fbclid")) return "meta";
    return UTM_META.test((u.searchParams.get("utm_source") ?? "").trim()) ? "meta" : null;
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
    return x?.v === "meta" && typeof x.t === "number" && Date.now() - x.t < HAN ? "meta" : null;
  } catch {
    return null;
  }
}
