"use client";
// Trang /huyen-hoc — lớp hồ sơ trên máy: hồ sơ đã nhập đủ cho mảng nào thì chip "cần gì" của thẻ đổi thành "Sẵn sàng".
// Chỉ đọc trường nào có / chưa có trong hồ sơ (không tính gì). Máy chủ và lúc chưa đọc hồ sơ: hiện chữ "cần gì" tĩnh.
import Link from "next/link";
import { Check, CircleDashed, UserRound } from "lucide-react";
import { tenGoi, useHoSo, type HoSo } from "@/lib/hoso";

export type KhoaMang = "than_so" | "tu_vi" | "bat_tu" | "phong_thuy" | "kinh_dich";

/** Hồ sơ đã đủ để mở mảng này chưa (Tử vi, Bát tự cần giờ + giới tính + nơi sinh; Phong thuỷ cần giới tính). */
export function duCho(h: HoSo, khoa: KhoaMang): boolean {
  if (khoa === "tu_vi" || khoa === "bat_tu") return Boolean(h.gio && h.gioi_tinh && h.noi_sinh);
  if (khoa === "phong_thuy") return Boolean(h.gioi_tinh);
  return true;
}

const KHOA: KhoaMang[] = ["than_so", "tu_vi", "bat_tu", "phong_thuy", "kinh_dich"];

export function ChipCan({ khoa, can, sanSang, canThem }: { khoa: KhoaMang; can: string; sanSang: string; canThem: string }) {
  const h = useHoSo();
  if (!h) {
    return <span className="relative z-10 shrink-0 rounded-full border border-line px-3 py-1 text-xs text-fg-muted" data-testid="chip-can">{can}</span>;
  }
  const du = duCho(h, khoa);
  return (
    <span data-testid="chip-can" data-du={du ? "1" : "0"} title={du ? undefined : can}
      className={`relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs ${du ? "border-jade/50 text-jade" : "border-gold/40 text-gold"}`}>
      {du ? <Check className="size-3.5" aria-hidden /> : <CircleDashed className="size-3.5" aria-hidden />}{du ? sanSang : canThem}
    </span>
  );
}

/** Dòng chào ở đầu trang khi đã có hồ sơ: xem ngay được mấy mảng, thiếu gì thì nhắc (link sang /tu-vi — form ở đó hỏi đúng phần còn thiếu). */
export function DongHoSo({ chao, thieu }: { chao: string; thieu: string }) {
  const h = useHoSo();
  if (!h) return null;
  const n = KHOA.filter((k) => duCho(h, k)).length;
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted" data-testid="dong-ho-so">
      <UserRound className="size-4 shrink-0 text-gold" aria-hidden />
      <span className="text-fg">{chao.replace("{ten}", tenGoi(h)).replace("{n}", String(n))}</span>
      {n < KHOA.length && <Link href="/tu-vi" className="text-gold underline-offset-4 hover:underline">{thieu}</Link>}
    </p>
  );
}
