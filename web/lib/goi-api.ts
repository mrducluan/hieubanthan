"use client";
// Gọi route handler của web từ client (không gọi engine trực tiếp).
import { useEffect, useState } from "react";

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const d = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(d.error ?? "Chưa tính được lúc này.");
  return d;
}

/** Tải dữ liệu khi `body` khác null; khoá theo JSON của body. */
export function usePost<T>(url: string, body: unknown | null) {
  const khoa = body == null ? null : JSON.stringify(body);
  const [data, setData] = useState<T | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);
  useEffect(() => {
    if (khoa == null) { setData(null); return; }
    let huy = false;
    setData(null); setLoi(null);
    postJson<T>(url, JSON.parse(khoa))
      .then((d) => { if (!huy) setData(d); })
      .catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : "Lỗi"); });
    return () => { huy = true; };
  }, [url, khoa, lan]);
  return { data, loi, thuLai: () => setLan((n) => n + 1) };
}
