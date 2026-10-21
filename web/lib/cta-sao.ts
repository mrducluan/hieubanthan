"use client";
// CTA-1 — cầu nối giữa "Luận giải toàn bộ" (LuanGiaiToanBo) và nút Sao ở khối "Đọc tiếp" cuối trang: báo cáo đang ở
// trạng thái nào (chưa tải / còn N chương khoá / đã mở hết) và hàm mở — để nút cuối trang đi đúng luồng SAO-2 sẵn có
// (hộp đăng nhập / đồng ý / nạp nhanh qua HopThoaiSao), không tạo luồng trừ Sao thứ hai.
import { useSyncExternalStore } from "react";

export interface CuaLuanGiai {
  moDun: string;
  /** Đã tải bản xem trước / báo cáo chưa. */
  daTai: boolean;
  soKhoa: number;
  tongChuong: number;
  /** Bấm "Mở N chương còn lại" → cùng hàm với nút "Mở toàn bộ" của báo cáo. */
  mo: () => void;
  /** Chưa tải → tải bản xem trước (chương đầu miễn phí) như nút "Đọc miễn phí chương đầu". */
  doc: () => void;
}

let hien: CuaLuanGiai | null = null;
const nghe = new Set<() => void>();

export function dangKyCuaLuanGiai(c: CuaLuanGiai): () => void {
  hien = c;
  nghe.forEach((f) => f());
  return () => {
    if (hien === c) { hien = null; nghe.forEach((f) => f()); }
  };
}

export function useCuaLuanGiai(): CuaLuanGiai | null {
  return useSyncExternalStore(
    (f) => { nghe.add(f); return () => nghe.delete(f); },
    () => hien,
    () => null,
  );
}

/** Cuộn tới báo cáo (phần chương khoá nếu có, không thì khung mời đọc). */
export function cuonToiLuanGiai(): void {
  const el = document.querySelector('[data-testid="lg-phan-khoa"]')
    ?? document.querySelector('[data-testid="luan-giai-toan-bo"]')
    ?? document.querySelector('[data-testid="gia-luan-giai"]')?.closest(".glass");
  el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}
