"use client";
// Gọi route handler của web từ client (không gọi engine trực tiếp).
import { useEffect, useState } from "react";
import { fetchSao } from "@/lib/sao-client";
import { maNgonNguTrang } from "@/lib/ngon-ngu";

export async function postJson<T>(url: string, body: unknown, them: Record<string, string> = {}): Promise<T> {
  const r = await fetchSao(url, { method: "POST", headers: { "content-type": "application/json", ...them }, body: JSON.stringify(body) },
    url.includes("luan-giai") ? "luan_giai" : "hoi");
  const d = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(d.error ?? (maNgonNguTrang() === "vi" ? "Chưa tính được lúc này." : "Could not work this out right now."));
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
      .catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : maNgonNguTrang() === "vi" ? "Lỗi" : "Error"); });
    return () => { huy = true; };
  }, [url, khoa, lan]);
  return { data, loi, thuLai: () => setLan((n) => n + 1) };
}
