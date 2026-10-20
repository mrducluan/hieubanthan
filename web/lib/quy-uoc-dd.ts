"use client";
// TS-V3 — cách tính con số Đường đời người dùng chọn: "tung_phan" = rút gọn con số trước (MẶC ĐỊNH trên web, chủ dự án
// chốt 2026-10-20) | "tong_het" = cộng hết chữ số. Engine giữ mặc định API cũ nên web LUÔN gửi lựa chọn này.
// Nhớ trên máy (localStorage) và báo cho mọi nơi đang hiển thị qua sự kiện cửa sổ, để /than-so, /ban-than, thẻ chia sẻ
// cùng một con số. Engine tính; web chỉ gửi lựa chọn.
import { useEffect, useState } from "react";

export type QuyUocDD = "tong_het" | "tung_phan";
const KHOA = "hbt.thanso_dd";
const SU_KIEN = "hbt:quy-uoc-dd";

export function docQuyUocDD(): QuyUocDD {
  try { return localStorage.getItem(KHOA) === "tong_het" ? "tong_het" : "tung_phan"; } catch { return "tung_phan"; }
}

export function ghiQuyUocDD(q: QuyUocDD) {
  try { localStorage.setItem(KHOA, q); } catch { /* chế độ riêng tư: chỉ nhớ trong phiên */ }
  window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: q }));
}

export function useQuyUocDD(): QuyUocDD {
  const [q, setQ] = useState<QuyUocDD>("tung_phan");
  useEffect(() => {
    setQ(docQuyUocDD());
    const nghe = (e: Event) => setQ((e as CustomEvent<QuyUocDD>).detail);
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);
  return q;
}
