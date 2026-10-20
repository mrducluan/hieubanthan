"use client";
// TS-V3b — trong thẻ "Hôm nay": số nổi bật của bạn qua ba phái + chữ Hebrew của ngày (Qabalah). Engine tính
// (/api/thanso/the-ngay), web chỉ hiển thị; lỗi thì ẩn (phần phụ, thẻ ngày cá nhân vẫn đủ).
import { useEffect, useState } from "react";
import { hoTenList, type HoSo } from "@/lib/hoso";
import { useQuyUocDD } from "@/lib/quy-uoc-dd";

export interface TheNgayKq {
  ngay_xem: string;
  so_noi_bat: { goc: number; lan: number; phai: string[]; tu_khoa: string | null } | null;
  chu_ngay: { chu: number; ten: string; so_duong_cay: number; cach_tinh: string;
    nghia: { nghia_chu?: string; xu_huong?: string; cau_tu_soi?: string } | null };
  luu_y: string;
}

export function ChuCuaNgay({ hoSo }: { hoSo: HoSo }) {
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
  if (!kq) return null;
  const c = kq.chu_ngay, n = c.nghia ?? {};
  return (
    <div className="grid gap-3 sm:grid-cols-2" data-testid="chu-cua-ngay">
      {kq.so_noi_bat && (
        <div className="rounded-xl border border-gold/30 bg-gold/[0.05] p-3" data-testid="so-noi-bat-ngay">
          <p className="text-xs uppercase tracking-wider text-fg-muted">Số nổi bật của bạn</p>
          <p className="mt-1"><b className="font-serif text-2xl text-gold">{kq.so_noi_bat.goc}</b>
            {kq.so_noi_bat.tu_khoa && <span className="ml-2 text-sm">{kq.so_noi_bat.tu_khoa}</span>}</p>
          <p className="mt-1 text-xs text-fg-faint">Gặp ở {kq.so_noi_bat.lan} cách tính độc lập của ba phái.</p>
        </div>
      )}
      <div className="rounded-xl border border-moon/30 bg-moon/5 p-3" data-testid="chu-ngay">
        <p className="text-xs uppercase tracking-wider text-fg-muted">Chữ của ngày (Qabalah)</p>
        <p className="mt-1"><b className="font-serif text-2xl text-moon">{c.ten}</b>
          <span className="ml-2 text-xs text-fg-muted">chữ thứ {c.chu} · con đường số {c.so_duong_cay} trên Cây</span></p>
        {n.nghia_chu && <p className="mt-1 text-sm">{n.nghia_chu}</p>}
        {n.cau_tu_soi && <p className="mt-1 text-sm text-fg-muted">{n.cau_tu_soi}</p>}
        <p className="mt-1 text-[11px] text-fg-faint">{c.cach_tinh}</p>
      </div>
    </div>
  );
}
