"use client";
import { useEffect } from "react";
import { khoiTaoGiamSat } from "@/lib/giam-sat";

/** Bật Sentry phía trình duyệt (chỉ khi có NEXT_PUBLIC_SENTRY_DSN). Không hiển thị gì. */
export function GiamSat() {
  useEffect(() => { void khoiTaoGiamSat(); }, []);
  return null;
}
