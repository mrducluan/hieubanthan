// ND — "cỡ chữ" CMS là lựa chọn có sẵn (cỡ · căn · nền nhấn) → lớp Tailwind theo token màu, đúng cả hai giao diện.
// Không CSS/px tự do (docs/KIEN-TRUC-NOI-DUNG-TRANG.md mục 3.3).
import type { KieuChu } from "@/lib/noi-dung-trang";

const CO = { nho: "text-sm", thuong: "", lon: "text-lg sm:text-xl", rat_lon: "text-xl sm:text-2xl" } as const;
const NEN = { khong: "", nhan: "glass rounded-2xl p-4", vang: "rounded-2xl bg-gold/10 p-4", ngoc: "rounded-2xl bg-jade/10 p-4" } as const;

export function lopKieuChu(k?: Partial<KieuChu> | null): string {
  if (!k) return "";
  return [CO[k.co ?? "thuong"] ?? "", k.can === "giua" ? "text-center mx-auto" : "", NEN[k.nen ?? "khong"] ?? ""].filter(Boolean).join(" ");
}

/** Trang chủ — cỡ chữ chọn ở CMS ("Cỡ chữ đầu trang"). Lớp viết đủ để Tailwind quét; khoá lạ → cỡ vừa (mặc định cũ). */
type CoChon = "nho" | "thuong" | "lon" | "rat_lon";
export const CO_TRANG_CHU = {
  h1: {
    nho: "text-[2.1rem] sm:text-5xl", thuong: "text-[2.6rem] sm:text-6xl",
    lon: "text-[3rem] sm:text-7xl", rat_lon: "text-[3.4rem] sm:text-8xl",
  },
  // Dòng điểm mù xếp chồng tuyệt đối trong khung cao cố định → mỗi cỡ đi kèm chiều cao khung (đủ 2 dòng trên điện thoại).
  diemMu: {
    nho: { chu: "text-sm sm:text-base", khung: "h-[2.75rem] sm:h-6" },
    thuong: { chu: "text-base sm:text-lg", khung: "h-[3.25rem] sm:h-7" },
    lon: { chu: "text-lg sm:text-xl", khung: "h-[3.75rem] sm:h-8" },
    rat_lon: { chu: "text-xl sm:text-2xl", khung: "h-[4.25rem] sm:h-10" },
  },
  chip: { nho: "text-xs", thuong: "text-[0.8rem]", lon: "text-base", rat_lon: "text-lg" },
} as const;
export const layCo = <B extends Readonly<Record<CoChon, unknown>>>(bang: B, khoa: string): B[CoChon] => (bang as Readonly<Record<string, B[CoChon]>>)[khoa] ?? bang.thuong;
