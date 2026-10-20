"use client";
// TS-V3b — trong thẻ "Hôm nay": số nổi bật của bạn qua hai phái (Pitago · Chaldea). Engine tính
// (/api/thanso/the-ngay), web chỉ hiển thị; lỗi hoặc chưa có số nổi bật thì ẩn (phần phụ).
import { useEffect, useState } from "react";
import { hoTenList, type HoSo } from "@/lib/hoso";
import { useQuyUocDD } from "@/lib/quy-uoc-dd";

interface TheNgayKq { so_noi_bat: { goc: number; lan: number; phai: string[]; tu_khoa: string | null } | null }

export function SoNoiBatNgay({ hoSo }: { hoSo: HoSo }) {
  const quyUoc = useQuyUocDD();
  const [kq, setKq] = useState<TheNgayKq | null>(null);
  const khoa = JSON.stringify([hoTenList(hoSo), hoSo.ngay, hoSo.thang, hoSo.nam, quyUoc]);
  useEffect(() => {
    let huy = false;
    fetch("/api/thanso/the-ngay", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam, quy_uoc_duong_doi: quyUoc }),
    }).then((r) => (r.ok ? (r.json() as Promise<TheNgayKq>) : null))
      .then((d) => { if (!huy && d) setKq(d); })
      .catch(() => { /* phần phụ */ });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khoa đại diện đủ cho hoSo + quyUoc
  }, [khoa]);
  const nb = kq?.so_noi_bat;
  if (!nb) return null;
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/[0.05] p-3" data-testid="so-noi-bat-ngay">
      <p className="text-xs uppercase tracking-wider text-fg-muted">Số nổi bật của bạn</p>
      <p className="mt-1"><b className="font-serif text-2xl text-gold">{nb.goc}</b>
        {nb.tu_khoa && <span className="ml-2 text-sm">{nb.tu_khoa}</span>}</p>
      <p className="mt-1 text-xs text-fg-faint">Gặp ở {nb.lan} cách tính độc lập của hai phái.</p>
    </div>
  );
}
