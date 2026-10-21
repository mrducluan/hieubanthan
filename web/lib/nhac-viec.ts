"use client";
// KC-4 — "Nhắc tôi hôm đó": mốc ngày người dùng tự bấm (ứng kỳ quẻ, tháng nên sửa nhà…), lưu TRÊN MÁY (localStorage).
// Chỉ ngày + mã + nhãn do engine/web soạn — không câu hỏi, không lá số. Hiện ở Hôm nay khi tới ngày; tải .ics để vào lịch
// điện thoại (nhắc thật qua lịch, không cần máy chủ). Tài khoản: lib/tai-khoan-nhac.ts (migration 0018), tuỳ chọn.
import { useSyncExternalStore } from "react";
import { z } from "zod";

export const KHOA_NHAC = "hbt.nhac.v1";
export const NhacViec = z.object({
  id: z.string().min(3).max(120),
  ngay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ma: z.string().regex(/^[a-z0-9_.+-]{3,80}$/),
  mo_dun: z.enum(["kinhdich", "phongthuy", "thanso", "tuvi", "battu", "hom_nay"]),
  nhan: z.string().trim().min(1).max(80),
  duong: z.string().regex(/^\/[a-z0-9/_?=&.#-]{0,120}$/).optional(),
  tao_luc: z.string(),
});
export type NhacViec = z.infer<typeof NhacViec>;
const TOI_DA = 50;
/** Mã nhắc từ chữ có dấu (vd chi "Tý" → "ty"): bỏ dấu, đ → d, chữ thường, ký tự khác → "_". */
export const maKhongDau = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9_.+-]/g, "_");

const nghe = new Set<() => void>();
let daDoc = false;
let cache: NhacViec[] = [];
const RONG: NhacViec[] = [];

function doc(): NhacViec[] {
  if (typeof window === "undefined") return RONG;
  if (!daDoc) {
    daDoc = true;
    try {
      const raw = JSON.parse(window.localStorage.getItem(KHOA_NHAC) ?? "[]");
      cache = Array.isArray(raw) ? raw.map((x) => NhacViec.safeParse(x)).filter((k) => k.success).map((k) => k.data) : [];
    } catch { cache = []; }
  }
  return cache;
}
function ghiXuong(ds: NhacViec[]) {
  cache = ds; daDoc = true;
  try { window.localStorage.setItem(KHOA_NHAC, JSON.stringify(ds)); } catch { /* riêng tư */ }
  nghe.forEach((f) => f());
}
export function themNhac(n: Omit<NhacViec, "id" | "tao_luc">): NhacViec {
  const id = `${n.ngay}|${n.ma}`;
  const moi = NhacViec.parse({ ...n, id, tao_luc: new Date().toISOString() });
  const ds = doc().filter((x) => x.id !== id);
  ds.push(moi);
  ds.sort((a, b) => a.ngay.localeCompare(b.ngay));
  ghiXuong(ds.slice(-TOI_DA));
  return moi;
}
/** Mọi mốc đang lưu trên máy (KC-4 GĐ1: chép mốc sắp tới lên tài khoản khi bật nhắc qua thông báo). */
export const dsNhacTrenMay = (): NhacViec[] => doc();
export function xoaNhac(id: string): void { ghiXuong(doc().filter((x) => x.id !== id)); }
export function daNhac(ngay: string, ma: string): boolean { return doc().some((x) => x.id === `${ngay}|${ma}`); }
function dangKy(f: () => void) {
  nghe.add(f);
  const onStorage = (e: StorageEvent) => { if (e.key === KHOA_NHAC) { daDoc = false; f(); } };
  window.addEventListener("storage", onStorage);
  return () => { nghe.delete(f); window.removeEventListener("storage", onStorage); };
}
export function useNhacViec(): NhacViec[] { return useSyncExternalStore(dangKy, doc, () => RONG); }
/** Mốc trong [hôm nay − 1, hôm nay + `ngay`] theo ngày VN. */
export function nhacSapToi(ds: NhacViec[], homNayIso: string, ngay = 7): NhacViec[] {
  const t0 = Date.parse(`${homNayIso}T00:00:00Z`);
  return ds.filter((x) => { const d = (Date.parse(`${x.ngay}T00:00:00Z`) - t0) / 86_400_000; return d >= -1 && d <= ngay; });
}
/** Tệp .ics một sự kiện cả ngày (giờ địa phương), nhắc 9:00 sáng hôm đó — người dùng mở bằng ứng dụng Lịch. */
export function icsCho(n: NhacViec, site = "hieuban.com"): string {
  const d = n.ngay.replace(/-/g, "");
  const sau = new Date(Date.parse(`${n.ngay}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10).replace(/-/g, "");
  const bo = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const url = n.duong ? `https://${site}${n.duong}` : `https://${site}`;
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hieu Ban Than//Nhac viec//VI", "BEGIN:VEVENT",
    `UID:${n.id.replace(/[^a-z0-9|._-]/gi, "")}@${site}`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${sau}`, `SUMMARY:${bo(n.nhan)}`, `DESCRIPTION:${bo(`Mốc bạn đã đánh dấu trên Hiểu Bản Thân — nhịp gợi ý, không phải dự báo. ${url}`)}`,
    `URL:${url}`, "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${bo(n.nhan)}`, "TRIGGER:PT9H", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
export function taiIcs(n: NhacViec): void {
  try {
    const blob = new Blob([icsCho(n)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `nhac-${n.ngay}.ics`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch { /* trình duyệt chặn tải */ }
}
