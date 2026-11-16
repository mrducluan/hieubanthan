"use client";
// Lấy bài đọc thần số cho hồ sơ trên máy — qua /api/thanso/luan-giai (engine tính, web chỉ hiển thị).
import { useEffect, useState } from "react";
import type { LuanGiaiResult } from "@/lib/engine";
import { hoTenList, type HoSo } from "@/lib/hoso";
import { useQuyUocDD } from "@/lib/quy-uoc-dd";
import { maNgonNguTrang } from "@/lib/ngon-ngu";
import { kemNgonNgu } from "@/lib/sao-client";

const boNho = new Map<string, LuanGiaiResult>();

export function khoaBaiDoc(h: HoSo): string {
  return JSON.stringify([hoTenList(h), h.ngay, h.thang, h.nam]);
}

export function useBaiDoc(h: HoSo | null | undefined) {
  const qu = useQuyUocDD();
  // EN-ALL GĐ 7: bài đọc theo ngôn ngữ trang (engine trả chữ Anh khi `x-ngon-ngu: en`) — nhớ riêng từng ngôn ngữ.
  const khoa = h ? `${khoaBaiDoc(h)}|${qu}|${maNgonNguTrang()}` : null;
  const [kq, setKq] = useState<LuanGiaiResult | null>(khoa ? boNho.get(khoa) ?? null : null);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);

  useEffect(() => {
    if (!h || !khoa) return;
    const coSan = boNho.get(khoa);
    if (coSan) { setKq(coSan); setLoi(null); return; }
    let huy = false;
    setKq(null);
    setLoi(null);
    fetch("/api/thanso/luan-giai", kemNgonNgu("/api/thanso/luan-giai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ho_ten: hoTenList(h), ngay: h.ngay, thang: h.thang, nam: h.nam, quy_uoc_duong_doi: qu }),
    }))
      .then(async (r) => {
        const d = (await r.json()) as LuanGiaiResult & { error?: string };
        if (!r.ok) throw new Error(d.error ?? (maNgonNguTrang() === "vi" ? "Chưa tính được lúc này." : "Could not work this out right now."));
        return d;
      })
      .then((d) => { boNho.set(khoa, d); if (!huy) setKq(d); })
      .catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : maNgonNguTrang() === "vi" ? "Chưa tính được lúc này." : "Could not work this out right now."); });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khoa đại diện đủ cho h
  }, [khoa, lan]);

  return { kq, loi, thuLai: () => setLan((n) => n + 1) };
}

export const TEN_VI_TRI: Record<string, string> = {
  duong_doi: "Đường đời",
  su_menh: "Sứ mệnh",
  linh_hon: "Linh hồn",
  nhan_cach: "Nhân cách",
};
