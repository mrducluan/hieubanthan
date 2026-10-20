"use client";
// TS-V3 — cách cộng Đường đời người dùng chọn: "tong_het" (mặc định, phổ biến ở VN) | "tung_phan" (Decoz).
// Nhớ trên máy (localStorage) và báo cho mọi nơi đang hiển thị qua sự kiện cửa sổ, để /than-so, /ban-than, thẻ chia sẻ
// cùng một con số. Engine tính; web chỉ gửi lựa chọn.
import { useEffect, useState } from "react";

export type QuyUocDD = "tong_het" | "tung_phan";
const KHOA = "hbt.thanso_dd";
const SU_KIEN = "hbt:quy-uoc-dd";

export function docQuyUocDD(): QuyUocDD {
  try { return localStorage.getItem(KHOA) === "tung_phan" ? "tung_phan" : "tong_het"; } catch { return "tong_het"; }
}

export function ghiQuyUocDD(q: QuyUocDD) {
  try { localStorage.setItem(KHOA, q); } catch { /* chế độ riêng tư: chỉ nhớ trong phiên */ }
  window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: q }));
}

export function useQuyUocDD(): QuyUocDD {
  const [q, setQ] = useState<QuyUocDD>("tong_het");
  useEffect(() => {
    setQ(docQuyUocDD());
    const nghe = (e: Event) => setQ((e as CustomEvent<QuyUocDD>).detail);
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);
  return q;
}
