// AUD-P0 (đo GEO, kiểm toán 2026-11): nguồn vào của phiên → MÃ cố định cho landing_viewed. Chỉ đọc TÊN MIỀN của
// document.referrer / giá trị utm_source để xếp nhóm — không gửi, không lưu URL giới thiệu (có thể chứa câu hỏi người dùng).
// Dùng được ở trình duyệt và test (hàm thuần).
export type NguonVao = { den_tu: "ai" | "tim_kiem" | "mxh" | "truc_tiep" | "noi_bo" | "khac"; ai?: string };

const AI: [RegExp, string][] = [
  [/(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com)$/, "chatgpt"],
  [/(^|\.)perplexity\.ai$/, "perplexity"],
  [/(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/, "gemini"],
  [/(^|\.)copilot\.microsoft\.com$/, "copilot"],
  [/(^|\.)claude\.ai$/, "claude"],
  [/(^|\.)(deepseek\.com|chat\.deepseek\.com)$/, "deepseek"],
  [/(^|\.)(you\.com|phind\.com|meta\.ai|grok\.com|x\.ai)$/, "khac"],
];
// tenMien() đã bỏ "www." → khớp nguyên tên miền: chỉ trang tìm kiếm Google (google.com, google.com.vn…), không mail/docs/
// drive.google.com. Copilot trong Bing (bing.com/chat) cùng tên miền với Bing tìm kiếm → không tách được, tính tim_kiem.
const TIM_KIEM = /^(google\.[a-z]{2,3}(\.[a-z]{2})?|bing\.com|coccoc\.com|duckduckgo\.com|(search\.)?yahoo\.com|yandex\.[a-z]+|search\.brave\.com|ecosia\.org)$/;
/** utm_source chỉ là TÊN (vd "chatgpt", "perplexity") — không phải tên miền. */
const AI_TEN: Record<string, string> = { chatgpt: "chatgpt", openai: "chatgpt", perplexity: "perplexity", gemini: "gemini",
  copilot: "copilot", claude: "claude", deepseek: "deepseek" };
const MXH = /(^|\.)(facebook\.com|fb\.com|messenger\.com|zalo\.me|chat\.zalo\.me|tiktok\.com|youtube\.com|instagram\.com|threads\.net|x\.com|t\.co|twitter\.com|linkedin\.com|lnkd\.in|reddit\.com|pinterest\.com)$/;

const tenMien = (s: string): string | null => {
  const x = s.trim().toLowerCase();
  if (!x) return null;
  try { return new URL(x.includes("://") ? x : `https://${x}`).hostname.replace(/^www\./, ""); } catch { return null; }
};

export function phanLoaiNguon(referrer: string, utmSource: string | null, host: string): NguonVao {
  const ten = (utmSource ?? "").trim().toLowerCase();
  if (AI_TEN[ten]) return { den_tu: "ai", ai: AI_TEN[ten] };
  for (const nguon of [utmSource ?? "", referrer]) {
    const h = tenMien(nguon);
    if (!h) continue;
    const ai = AI.find(([re]) => re.test(h));
    if (ai) return { den_tu: "ai", ai: ai[1] };
  }
  const h = tenMien(referrer);
  if (referrer.trim() === "") return { den_tu: "truc_tiep" };
  if (!h) return { den_tu: "khac" };
  if (h === host.replace(/^www\./, "")) return { den_tu: "noi_bo" };
  if (TIM_KIEM.test(h)) return { den_tu: "tim_kiem" };
  if (MXH.test(h)) return { den_tu: "mxh" };
  return { den_tu: "khac" };
}
