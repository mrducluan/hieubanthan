"use client";
// HN-1 — thẻ "Hôm nay của bạn". Engine tính mọi con số (web chỉ hiển thị). Chuỗi ngày ghé đếm trên máy người dùng
// (localStorage, không gửi đi) — mất chuỗi không bị phạt gì, chỉ bắt đầu lại. Chia sẻ không kèm ngày sinh.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, Flame, MoonStar, Share2, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { tenGoi, useHoSo } from "@/lib/hoso";
import { ghi, maNgauNhien } from "@/lib/do-luong";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";

interface NgayCN { so: number; nghia: string; tu_soi: string }
interface TheHomNay {
  ngay_xem: string;
  am_lich: { ngay: number; thang: number; nam: number; nhuan: boolean; can_chi_ngay: string; can_chi_thang: string; can_chi_nam: string };
  ngay_ca_nhan: NgayCN;
  thang_ca_nhan: { so: number; thang: number; chu_de: string | null; nen: string | null; tranh: string | null };
  nam_ca_nhan: { so: number; nam: number; chu_de: string | null; nen: string | null; tranh: string | null };
  ngay_mai: NgayCN & { ngay: string };
  luu_y: string;
}

const KHOA_CHUOI = "hbt.hom_nay";

/** Chuỗi ngày ghé liên tiếp, tính theo ngày xem engine trả (giờ Việt Nam). */
export function capNhatChuoi(cu: { ngay: string; chuoi: number } | null, homNay: string): { ngay: string; chuoi: number } {
  if (!cu) return { ngay: homNay, chuoi: 1 };
  if (cu.ngay === homNay) return cu;
  const hom_qua = new Date(Date.parse(`${homNay}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  return { ngay: homNay, chuoi: cu.ngay === hom_qua ? cu.chuoi + 1 : 1 };
}

function docChuoi(): { ngay: string; chuoi: number } | null {
  try { const j = JSON.parse(localStorage.getItem(KHOA_CHUOI) ?? "null"); return j && typeof j.ngay === "string" && typeof j.chuoi === "number" ? j : null; }
  catch { return null; }
}

/** "Ngày cá nhân 7: hợp nghỉ…" → "Hợp nghỉ…" (bỏ tiền tố, viết hoa chữ đầu). */
const boTienTo = (s: string) => { const t = s.replace(/^Ngày cá nhân \d+:\s*/, ""); return t.charAt(0).toUpperCase() + t.slice(1); };

const thu = (iso: string) => new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" })
  .format(new Date(`${iso}T00:00:00Z`));

export function HomNay() {
  const hoSo = useHoSo();
  const [the, setThe] = useState<TheHomNay | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [chuoi, setChuoi] = useState<number | null>(null);
  const [daChep, setDaChep] = useState(false);
  const daGhi = useRef(false);

  useEffect(() => {
    if (!hoSo) return;
    let huy = false;
    fetch("/api/thanso/hom-nay", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam }),
    }).then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Chưa tải được thẻ hôm nay.");
      return j as TheHomNay;
    }).then((t) => {
      if (huy) return;
      setThe(t); setLoi(null);
      const moi = capNhatChuoi(docChuoi(), t.ngay_xem);
      try { localStorage.setItem(KHOA_CHUOI, JSON.stringify(moi)); } catch { /* chế độ riêng tư: bỏ qua chuỗi */ }
      setChuoi(moi.chuoi);
      if (!daGhi.current) { daGhi.current = true; ghi("daily_viewed", { chuoi: moi.chuoi }); }
    }).catch((e: Error) => { if (!huy) setLoi(e.message); });
    return () => { huy = true; };
  }, [hoSo]);

  async function chiaSe() {
    if (!the) return;
    // ?tu=hn.<ngẫu nhiên>: bạn bè mở link → GhiVaoTrang nhớ mã → hồ sơ đầu tiên tính referral_signup (Gate 2, K).
    const tu = `hn.${maNgauNhien(10)}`;
    const url = `${window.location.origin}/hom-nay?tu=${tu}`;
    const chu = `Hôm nay là Ngày cá nhân ${the.ngay_ca_nhan.so} của mình — ${boTienTo(the.ngay_ca_nhan.nghia)} Xem ngày của bạn:`;
    ghi("share_created", { kind: "hom_nay", ma_moi: tu });
    try {
      if (navigator.share) { await navigator.share({ title: "Hôm nay của bạn", text: chu, url }); return; }
      await navigator.clipboard.writeText(`${chu} ${url}`);
      setDaChep(true); setTimeout(() => setDaChep(false), 2500);
    } catch { /* người dùng huỷ chia sẻ */ }
  }

  useBatDauDoc("hom_nay", Boolean(the));
  const tieuDe = <TieuDeMuc cap={1} nho="Mỗi ngày một thẻ" lon="Hôm nay của bạn" />;
  if (hoSo === undefined) return <div className="mx-auto max-w-xl">{tieuDe}<KhungTai /></div>;
  if (hoSo === null) {
    return (
      <div className="mx-auto max-w-lg">
        {tieuDe}
        <p className="mb-4 text-fg-muted">Nhập tên và ngày sinh một lần — mỗi ngày mở lại là có thẻ mới.</p>
        <Card><NhapHoSo nutGui="Xem hôm nay của tôi" onXong={() => { /* useHoSo tự cập nhật */ }} /></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl" data-testid="hom-nay">
      {tieuDe}
      {loi && <Card><p role="alert" className="text-sm text-cinnabar">{loi}</p></Card>}
      {!the && !loi && <KhungTai />}
      {the && (
        <div className="space-y-4">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5 capitalize"><CalendarDays className="size-4" aria-hidden />{thu(the.ngay_xem)}</span>
            <span className="inline-flex items-center gap-1.5"><MoonStar className="size-4" aria-hidden />
              Âm lịch {the.am_lich.ngay}/{the.am_lich.thang}{the.am_lich.nhuan ? " (nhuận)" : ""} · ngày {the.am_lich.can_chi_ngay}, tháng {the.am_lich.can_chi_thang}, năm {the.am_lich.can_chi_nam}</span>
          </p>

          <Card className="space-y-4" data-testid="the-hom-nay">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-fg-muted">{tenGoi(hoSo)}, hôm nay là</p>
                <h2 className="mt-1 text-2xl">Ngày cá nhân <span className="text-gold" data-testid="so-ngay-ca-nhan">{the.ngay_ca_nhan.so}</span></h2>
              </div>
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gold/15 font-serif text-4xl text-gold" aria-hidden>{the.ngay_ca_nhan.so}</span>
            </div>
            <p className="text-lg">{boTienTo(the.ngay_ca_nhan.nghia)}</p>
            <div className="rounded-xl border border-moon/30 bg-moon/5 p-4">
              <p className="text-xs uppercase tracking-wider text-moon">Câu hỏi tự soi</p>
              <p className="mt-1">{the.ngay_ca_nhan.tu_soi}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {chuoi !== null && (
                <p className="inline-flex items-center gap-1.5 text-sm text-fg-muted" data-testid="chuoi-ngay">
                  <Flame className="size-4 text-gold" aria-hidden />{chuoi > 1 ? `Bạn ghé ${chuoi} ngày liên tiếp` : "Ngày đầu tiên của chuỗi — mai ghé tiếp nhé"}
                </p>
              )}
              <Button size="sm" variant="secondary" onClick={() => void chiaSe()}><Share2 aria-hidden />{daChep ? "Đã chép link" : "Chia sẻ"}</Button>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {[{ nhan: `Tháng ${the.thang_ca_nhan.thang}`, ...the.thang_ca_nhan }, { nhan: `Năm ${the.nam_ca_nhan.nam}`, ...the.nam_ca_nhan }].map((x) => x.chu_de && (
              <article key={x.nhan} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm text-fg-muted"><span>{x.nhan}</span>
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">số {x.so}</span></div>
                <h3 className="mt-2 text-lg">{x.chu_de}</h3>
                {x.nen && <p className="mt-1 text-sm"><span className="text-jade">Hợp để:</span> {x.nen}</p>}
                {x.tranh && <p className="mt-1 text-sm"><span className="text-cinnabar">Để ý:</span> {x.tranh}</p>}
              </article>
            ))}
          </div>

          <Card className="flex items-start gap-3">
            <Sunrise className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
            <p className="text-sm"><span className="text-fg-muted">Ngày mai — Ngày cá nhân {the.ngay_mai.so}:</span>{" "}
              {boTienTo(the.ngay_mai.nghia)} <span className="text-fg-muted">Mở lại vào ngày mai để xem câu hỏi mới.</span></p>
          </Card>

          <CuoiBaiDoc moDun="hom_nay" cauHoi="Thẻ hôm nay có giúp bạn định hướng ngày của mình?" />

          <p className="text-xs text-fg-faint">{the.luu_y} Muốn hiểu sâu hơn: <Link href="/ban-than" className="text-gold hover:underline">bài đọc đầy đủ</Link> ·{" "}
            <Link href="/hop-doi" className="text-gold hover:underline">xem hợp với ai</Link>.</p>
        </div>
      )}
    </div>
  );
}
