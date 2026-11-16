"use client";
// Gọi một route /api/thanso/* với hồ sơ trên máy, nhớ kết quả trong phiên (khoá = route + hồ sơ + tuỳ chọn).
// Engine tính, web chỉ hiển thị. Dùng cho bài đọc tổng hợp các phái.
import { useEffect, useState } from "react";
import { hoTenList, type HoSo } from "@/lib/hoso";
import { maNgonNguTrang } from "@/lib/ngon-ngu";
import { kemNgonNgu } from "@/lib/sao-client";

const boNho = new Map<string, unknown>();

export function useEngineDoc<T>(duong: string, h: HoSo, them: Record<string, unknown> = {}) {
  const body = { ho_ten: hoTenList(h), ngay: h.ngay, thang: h.thang, nam: h.nam, ...them };
  // EN-ALL GĐ 7: kèm ngôn ngữ trang (engine trả chữ Anh ở bản Anh) — nhớ riêng từng ngôn ngữ.
  const khoa = `${duong}|${JSON.stringify(body)}|${maNgonNguTrang()}`;
  const [kq, setKq] = useState<T | null>((boNho.get(khoa) as T) ?? null);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);
  useEffect(() => {
    const coSan = boNho.get(khoa) as T | undefined;
    if (coSan) { setKq(coSan); setLoi(null); return; }
    let huy = false;
    setKq(null); setLoi(null);
    fetch(duong, kemNgonNgu(duong, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }))
      .then(async (r) => {
        const d = (await r.json()) as T & { error?: string };
        if (!r.ok) throw new Error(d.error ?? (maNgonNguTrang() === "vi" ? "Chưa tính được lúc này." : "Could not work this out right now."));
        return d;
      })
      .then((d) => { boNho.set(khoa, d); if (!huy) setKq(d); })
      .catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : maNgonNguTrang() === "vi" ? "Chưa tính được lúc này." : "Could not work this out right now."); });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khoa đại diện đủ cho body
  }, [khoa, lan]);
  return { kq, loi, thuLai: () => setLan((n) => n + 1) };
}
