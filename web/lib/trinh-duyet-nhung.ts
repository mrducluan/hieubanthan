// CRO-1 — nhận biết trình duyệt nhúng trong app (khách bấm quảng cáo Facebook / Instagram, link trong Zalo / Messenger).
// Google chặn đăng nhập trong trình duyệt nhúng (lỗi "disallowed_useragent"), còn Facebook / Zalo đăng nhập được ngay trong
// app của chính nó. Hàm thuần (nhận user-agent) để test được; chỉ gọi ở trình duyệt SAU khi gắn trang (không lệch hydrate).
import type { NhaCungCap } from "@/lib/dang-nhap";

export type AppNhung = "facebook" | "instagram" | "zalo" | null;

export function appNhung(ua: string | null | undefined): AppNhung {
  if (!ua) return null;
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A|MessengerForiOS|\bMessenger\b/i.test(ua)) return "facebook";
  if (/\bZalo(?:App|Theme)?\b/i.test(ua)) return "zalo";
  return null;
}

/** Thứ tự nút: đưa cách đăng nhập "đi được ngay" trong app đang mở lên đầu; Google xuống cuối khi ở app Meta. */
export function xepNhaCungCap(ds: readonly NhaCungCap[], app: AppNhung): NhaCungCap[] {
  if (!app) return [...ds];
  const dau: NhaCungCap[] = app === "zalo" ? ["zalo", "facebook"] : ["facebook", "zalo"];
  const truoc = dau.filter((p) => ds.includes(p));
  const sau = ds.filter((p) => !truoc.includes(p) && p !== "google");
  return [...truoc, ...sau, ...(ds.includes("google") ? (["google"] as NhaCungCap[]) : [])];
}
