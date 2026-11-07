"use client";
// TR-1 — "Lá của ngày": một lá úp, bấm lật → lá engine chọn tất định theo ngày (và ngày sinh khi có hồ sơ → lá riêng). Không
// random trên máy, không lưu gì ngoài cờ "đã lật hôm nay" trên máy. Mỗi ngày một lá; luôn đọc xuôi.
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { LaBai } from "./LaBai";
import { ghi } from "@/lib/do-luong";
import type { HoSo } from "@/lib/hoso";
import type { LaNgay as LaNgayKq } from "@/lib/tarot-chung";
import Link from "@/components/khung/Lien";

const KHOA = "hbt.tarot_ngay.v1";
const ngayVN = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

export function LaNgay({ hoSo, tieuDe = "Lá của ngày" }: { hoSo: HoSo | null | undefined; tieuDe?: string }) {
  const [kq, setKq] = useState<LaNgayKq | null>(null);
  const [lat, setLat] = useState(false);
  const [loi, setLoi] = useState(false);
  const ngay = ngayVN();
  useEffect(() => {
    try { setLat(localStorage.getItem(KHOA) === ngay); } catch { /* bỏ qua */ }
  }, [ngay]);
  useEffect(() => {
    if (hoSo === undefined) return;
    const ngaySinh = hoSo?.nam && hoSo.thang && hoSo.ngay && hoSo.am == null ? `${hoSo.nam}-${String(hoSo.thang).padStart(2, "0")}-${String(hoSo.ngay).padStart(2, "0")}` : null;
    const req = ngaySinh
      ? fetch("/api/tarot/la-ngay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ngay, ngay_sinh: ngaySinh }) })
      : fetch(`/api/tarot/la-ngay?ngay=${ngay}`);
    req.then((r) => (r.ok ? (r.json() as Promise<LaNgayKq>) : Promise.reject(new Error("x")))).then(setKq).catch(() => setLoi(true));
  }, [hoSo, ngay]);
  if (loi || (!kq && hoSo === undefined)) return null;
  const latLa = () => {
    if (!kq) return;
    setLat(true);
    try { localStorage.setItem(KHOA, ngay); } catch { /* bỏ qua */ }
    ghi("chart_interacted", { mo_dun: "tarot", kind: "la_ngay", rieng: kq.rieng });
  };
  return (
    <section aria-labelledby="la-ngay" className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-[auto_1fr] sm:items-center" data-testid="la-ngay">
      <LaBai la={kq?.la ?? null} lat={lat && !!kq} w={96} onClick={!lat ? latLa : undefined} nhan={lat ? undefined : "Lật lá của ngày"} className="mx-auto" />
      <div>
        <p className="eyebrow flex items-center gap-1.5"><Sparkles className="size-3.5 text-gold" aria-hidden /> {tieuDe}{kq?.rieng ? " · riêng theo ngày sinh của bạn" : " · chung cho mọi người"}</p>
        {!lat || !kq ? (
          <>
            <h2 id="la-ngay" className="mt-1 text-xl">Một lá cho hôm nay</h2>
            <p className="mt-1 text-sm text-fg-muted">Chạm lá để lật. Lá chọn tất định theo ngày — cùng ngày thì cùng lá — và luôn đọc xuôi; không phải điềm, là một câu để mang theo trong ngày.</p>
          </>
        ) : (
          <>
            <h2 id="la-ngay" className="mt-1 text-xl">{kq.la.ten} <span className="text-base text-fg-faint">({kq.la.en})</span></h2>
            <p className="mt-1 text-sm text-fg">{kq.la.y_xuoi}</p>
            <p className="mt-2 text-sm text-fg-muted"><b className="text-fg">Việc 0 đồng:</b> {kq.la.viec}</p>
            <p className="mt-1 text-sm italic text-fg-muted">{kq.la.cau_tu_soi}</p>
            <p className="mt-2 text-xs"><Link href={`/tarot/la-bai/${slug(kq.la.ten)}`} className="text-gold underline-offset-4 hover:underline">Đọc kỹ lá {kq.la.ten}</Link></p>
          </>
        )}
      </div>
    </section>
  );
}

/** Slug tên lá (cùng luật với engine `trang._slug`: bỏ dấu, chữ thường, gạch nối). */
export function slug(s: string): string {
  return s.replace(/Đ/g, "D").replace(/đ/g, "d").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).join("-");
}
