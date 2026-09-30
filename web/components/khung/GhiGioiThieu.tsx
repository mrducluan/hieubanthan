"use client";
import { useEffect } from "react";
import { ghiMaGioiThieuTuUrl } from "@/lib/sao";

/** Nhớ mã giới thiệu (?gt=) từ bất kỳ trang nào người được mời mở. Không hiển thị gì. */
export function GhiGioiThieu() {
  useEffect(() => { ghiMaGioiThieuTuUrl(window.location.search); }, []);
  return null;
}
