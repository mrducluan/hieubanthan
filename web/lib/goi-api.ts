"use client";
// Gọi route handler của web từ client (không gọi engine trực tiếp).
import { useEffect, useState } from "react";
import { fetchSao } from "@/lib/sao-client";
import { maNgonNguTrang } from "@/lib/ngon-ngu";

/** CRO-1: route báo cáo trả Sao không mang chữ "luan-giai" trong đường dẫn (Bản đồ con số, Thời gian tới, Chân dung,
 *  báo cáo 3 phái). Lượt gọi mang header mở khoá cũng là báo cáo — trước đây bị coi là hỏi đáp: hiện nhầm hộp
 *  "Hết câu hỏi miễn phí" và không chuyển thẳng tới đăng nhập (DN-5). */
const ROUTE_BAO_CAO = ["luan-giai", "/api/thanso/ban-do-con-so", "/api/thanso/bao-cao-ba-phai", "/api/thoi-gian-toi", "/api/chan-dung", "/api/co-van"];
export function nguonCuaUrl(url: string, them: Record<string, string> = {}): "luan_giai" | "hoi" {
  if (Object.keys(them).some((k) => k.toLowerCase() === "x-mo-khoa")) return "luan_giai";
  return ROUTE_BAO_CAO.some((d) => url.includes(d)) ? "luan_giai" : "hoi";
}

export async function postJson<T>(url: string, body: unknown, them: Record<string, string> = {}): Promise<T> {
  const r = await fetchSao(url, { method: "POST", headers: { "content-type": "application/json", ...them }, body: JSON.stringify(body) },
    nguonCuaUrl(url, them));
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
