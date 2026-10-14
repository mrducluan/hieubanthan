// ND — "cỡ chữ" CMS là lựa chọn có sẵn (cỡ · căn · nền nhấn) → lớp Tailwind theo token màu, đúng cả hai giao diện.
// Không CSS/px tự do (docs/KIEN-TRUC-NOI-DUNG-TRANG.md mục 3.3).
import type { KieuChu } from "@/lib/noi-dung-trang";

const CO = { nho: "text-sm", thuong: "", lon: "text-lg sm:text-xl", rat_lon: "text-xl sm:text-2xl" } as const;
const NEN = { khong: "", nhan: "glass rounded-2xl p-4", vang: "rounded-2xl bg-gold/10 p-4", ngoc: "rounded-2xl bg-jade/10 p-4" } as const;

export function lopKieuChu(k?: Partial<KieuChu> | null): string {
  if (!k) return "";
  return [CO[k.co ?? "thuong"] ?? "", k.can === "giua" ? "text-center mx-auto" : "", NEN[k.nen ?? "khong"] ?? ""].filter(Boolean).join(" ");
}
