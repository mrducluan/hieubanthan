"use client";
// Trang /huyen-hoc — lớp hồ sơ trên máy: hồ sơ đã nhập đủ cho mảng nào thì chip "cần gì" của thẻ đổi thành "Sẵn sàng",
// còn thiếu thì nói ĐÚNG trường thiếu ("Thiếu giờ sinh, nơi sinh"). Chỉ đọc trường nào có / chưa có trong hồ sơ (không
// tính gì). Máy chủ và lúc chưa đọc hồ sơ: hiện chữ "cần gì" tĩnh.
import Link from "next/link";
import { Check, CircleDashed, UserRound } from "lucide-react";
import { tenGoi, useHoSo, type HoSo } from "@/lib/hoso";
import type { KhoaMangHH } from "@/lib/huyen-hoc";

const TEN_MANG: Record<KhoaMangHH, string> = { than_so: "Thần số học", tu_vi: "Tử vi", bat_tu: "Bát tự", phong_thuy: "Phong thuỷ", kinh_dich: "Kinh Dịch" };
const KHOA = Object.keys(TEN_MANG) as KhoaMangHH[];

/** Trường hồ sơ còn thiếu để mở mảng này (Tử vi, Bát tự cần giờ + giới tính + nơi sinh; Phong thuỷ cần giới tính). */
export function thieuCho(h: HoSo, khoa: KhoaMangHH): string[] {
  if (khoa === "tu_vi" || khoa === "bat_tu") {
    return [!h.gio && "giờ sinh", !h.gioi_tinh && "giới tính", !h.noi_sinh && "nơi sinh"].filter((x): x is string => Boolean(x));
  }
  if (khoa === "phong_thuy") return h.gioi_tinh ? [] : ["giới tính"];
  return [];
}

const thay = (mau: string, bien: Record<string, string>) => mau.replace(/\{(\w+)\}/g, (m, k: string) => bien[k] ?? m);

export function ChipCan({ khoa, can, sanSang, canThem }: { khoa: KhoaMangHH; can: string; sanSang: string; canThem: string }) {
  const h = useHoSo();
  if (!h) {
    return <span className="relative z-10 shrink-0 rounded-full border border-line px-3 py-1 text-xs text-fg-muted" data-testid="chip-can">{can}</span>;
  }
  const thieu = thieuCho(h, khoa);
  const du = thieu.length === 0;
  return (
    <span data-testid="chip-can" data-du={du ? "1" : "0"}
      className={`relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs ${du ? "border-jade/50 text-jade" : "border-gold/40 text-gold"}`}>
      {du ? <Check className="size-3.5" aria-hidden /> : <CircleDashed className="size-3.5" aria-hidden />}
      {du ? sanSang : thay(canThem, { thieu: thieu.join(", ") })}
    </span>
  );
}

/** Dòng ở đầu trang khi đã có hồ sơ: xem ngay được mấy mảng; thiếu gì để mở mảng nào (link sang /tu-vi — form ở đó hỏi đúng phần còn thiếu). */
export function DongHoSo({ chao, thieu: mauThieu }: { chao: string; thieu: string }) {
  const h = useHoSo();
  if (!h) return null;
  const chua = KHOA.filter((k) => thieuCho(h, k).length > 0);
  const thieu = [...new Set(chua.flatMap((k) => thieuCho(h, k)))];
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted" data-testid="dong-ho-so">
      <UserRound className="size-4 shrink-0 text-gold" aria-hidden />
      <span className="text-fg">{thay(chao, { ten: tenGoi(h), n: String(KHOA.length - chua.length) })}</span>
      {chua.length > 0 && (
        <Link href="/tu-vi" className="inline-flex min-h-11 items-center text-gold underline-offset-4 hover:underline">
          {thay(mauThieu, { thieu: thieu.join(", "), mang: chua.map((k) => TEN_MANG[k]).join(", ") })}
        </Link>
      )}
    </p>
  );
}
