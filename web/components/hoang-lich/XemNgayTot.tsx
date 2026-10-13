"use client";
// HL-1 — "Xem ngày tốt": thẻ ngày (máy chủ dựng sẵn bản công khai cho SEO) + cá nhân hoá theo hồ sơ trên máy
// (tuổi xung/hợp — ngày sinh chỉ gửi để tính, không lưu) + lịch tháng + tìm ngày tốt cho một việc.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TheNgay } from "@/components/hoang-lich/TheNgay";
import { useHoSo } from "@/lib/hoso";
import { ghi } from "@/lib/do-luong";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import {
  congNgay, duongNgay, duongThang, homNayVN, thangIndex, type ChonNgayKq, type NgayTot, type ThangLich, type TomTatNgay,
} from "@/lib/hoang-lich";

const THU = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function LichThang({ t, chon }: { t: ThangLich; chon?: string }) {
  const homNay = homNayVN();
  const dau = (new Date(Date.UTC(t.nam, t.thang - 1, 1)).getUTCDay() + 6) % 7;   // thứ Hai = 0
  const truoc = t.thang === 1 ? { nam: t.nam - 1, thang: 12 } : { nam: t.nam, thang: t.thang - 1 };
  const sau = t.thang === 12 ? { nam: t.nam + 1, thang: 1 } : { nam: t.nam, thang: t.thang + 1 };
  // Ngoài cửa sổ index: link tháng trước/sau vẫn bấm được nhưng nofollow; hết phạm vi 1901–2099 thì ẩn.
  const rel = (n: { nam: number; thang: number }) => (thangIndex(n.nam, n.thang) ? undefined : "nofollow");
  return (
    <section aria-labelledby="lich-thang" className="glass rounded-2xl p-4 sm:p-5" data-testid="lich-thang">
      <div className="flex items-center justify-between">
        {truoc.nam >= 1901 ? <Link href={duongThang(truoc.nam, truoc.thang)} rel={rel(truoc)} aria-label="Tháng trước" className="vung-cham rounded-lg p-1.5 hover:bg-surface"><ChevronLeft className="size-5" /></Link> : <span />}
        <h2 id="lich-thang" className="text-lg">Tháng {t.thang}/{t.nam}</h2>
        {sau.nam <= 2099 ? <Link href={duongThang(sau.nam, sau.thang)} rel={rel(sau)} aria-label="Tháng sau" className="vung-cham rounded-lg p-1.5 hover:bg-surface"><ChevronRight className="size-5" /></Link> : <span />}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-fg-faint">{THU.map((x) => <span key={x}>{x}</span>)}</div>
      <ol className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: dau }, (_, i) => <li key={`r${i}`} aria-hidden />)}
        {t.ngay.map((n) => {
          const so = Number(n.ngay.slice(8));
          const dangChon = n.ngay === chon, laHomNay = n.ngay === homNay;
          return (
            <li key={n.ngay}>
              <Link href={duongNgay(n.ngay)} aria-current={dangChon ? "date" : undefined}
                aria-label={`${so}/${t.thang}, âm ${n.am}, ${n.hoang_dao ? "Hoàng đạo" : "Hắc đạo"} ${n.than}, trực ${n.truc}${n.dep ? ", ngày đẹp" : ""}${n.ky_dan_gian.length ? ", " + n.ky_dan_gian.join(", ") : ""}${laHomNay ? ", hôm nay" : ""}`}
                className={`flex min-h-14 flex-col items-center justify-center rounded-lg border px-0.5 py-1 text-sm leading-tight transition-colors
                  ${dangChon ? "border-gold bg-gold/15" : laHomNay ? "border-gold/60" : n.hoang_dao ? "border-gold/25 bg-gold/[0.04] hover:border-gold/50" : "border-line/50 hover:border-gold/40"}`}>
                <span className={`font-semibold ${n.hoang_dao ? "text-gold" : ""}`}>{so}{n.dep && <span aria-hidden className="ml-0.5 text-[0.6rem] text-jade">★</span>}</span>
                <span className="text-[0.7rem] text-fg-muted">{n.am}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 flex items-center gap-3 text-xs text-fg-muted">
        <span><b className="text-gold">Số vàng</b>: hoàng đạo</span>
        <span><span className="text-jade">★</span> ngày đẹp (hoàng đạo, trực tốt)</span>
        <span>Số nhỏ: ngày âm</span>
      </p>
    </section>
  );
}

function ChonNgay({ dsViec, tu, tuoi }: { dsViec: { ma: string; ten: string }[]; tu: string;
  tuoi: { nam_sinh: number; thang_sinh: number; ngay_sinh: number } | null }) {
  const [viec, setViec] = useState(dsViec[0]?.ma ?? "");
  const [soThang, setSoThang] = useState(1);
  const [kq, setKq] = useState<ChonNgayKq | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);

  async function tim() {
    setDang(true); setLoi(null);
    try {
      const r = await fetch("/api/lich/chon-ngay", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ viec, tu, den: congNgay(tu, soThang * 30), ...(tuoi ?? {}) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Chưa tìm được ngày.");
      setKq(j as ChonNgayKq);
      ghi("good_day_searched", { viec, so_thang: soThang, co_tuoi: tuoi ? 1 : 0, so_ngay: (j as ChonNgayKq).ngay.length });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa tìm được ngày."); }
    finally { setDang(false); }
  }

  return (
    <section aria-labelledby="chon-ngay" className="glass space-y-3 rounded-2xl p-5" data-testid="chon-ngay">
      <h2 id="chon-ngay" className="text-xl">Tìm ngày đẹp cho việc của bạn</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn việc">
        {dsViec.map((v) => (
          <button key={v.ma} type="button" aria-pressed={viec === v.ma} onClick={() => { setViec(v.ma); setKq(null); }}
            className={`rounded-full border px-3 py-1.5 text-sm ${viec === v.ma ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:border-gold/60"}`}>{v.ten}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="so-thang" className="text-fg-muted">Trong</label>
        <select id="so-thang" value={soThang} onChange={(e) => { setSoThang(Number(e.target.value)); setKq(null); }}
          className="rounded-lg border border-line bg-bg/60 px-2 py-1">
          <option value={1}>30 ngày tới</option><option value={2}>60 ngày tới</option><option value={3}>90 ngày tới</option>
        </select>
        <Button size="sm" onClick={() => void tim()} disabled={dang || !viec}><Search aria-hidden />{dang ? "Đang tìm…" : "Tìm ngày"}</Button>
      </div>
      {!tuoi && <p className="text-xs text-fg-muted">Có hồ sơ ngày sinh thì kết quả tự bỏ ngày xung tuổi bạn. <Link href="/than-so" className="text-gold hover:underline">Tạo hồ sơ</Link></p>}
      {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
      {kq && (
        <div data-testid="ket-qua-chon-ngay" aria-live="polite" ref={(el) => { el?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }}>
          {kq.ngay.length === 0 ? <p className="text-sm text-fg-muted">Khoảng này sách lịch không có ngày hợp riêng cho việc {kq.viec.ten.toLowerCase()} — thử khoảng dài hơn.</p> : (
            <ol className="space-y-2">
              {kq.ngay.slice(0, 8).map((n: TomTatNgay) => (
                <li key={n.ngay}>
                  <Link href={duongNgay(n.ngay)} className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-line/70 px-3 py-2 hover:border-gold/50">
                    <span><b>{n.ngay.split("-").reverse().join("/")}</b> <span className="text-sm text-fg-muted">({n.am} âm · {n.can_chi})</span></span>
                    <span className="text-xs text-jade">{n.diem_cong?.length ? n.diem_cong.join(" · ") : `trực ${n.truc}`}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-2 text-xs text-fg-faint">{kq.cach_chon}{kq.tuoi ? ` Tuổi xét: ${kq.tuoi.can_chi}.` : ""}</p>
        </div>
      )}
    </section>
  );
}

export function XemNgayTot({ banDau, thang }: { banDau: NgayTot; thang: ThangLich | null }) {
  const hoSo = useHoSo();
  const [d, setD] = useState<NgayTot>(banDau);
  const tuoi = useMemo(() => hoSo ? { nam_sinh: hoSo.nam, thang_sinh: hoSo.thang, ngay_sinh: hoSo.ngay } : null, [hoSo]);

  useEffect(() => { setD(banDau); }, [banDau]);
  useEffect(() => {
    if (!tuoi) return;
    let huy = false;
    fetch("/api/lich/ngay-tot", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ngay: banDau.ngay, ...tuoi }) })
      .then((r) => r.ok ? r.json() : null).then((j) => { if (!huy && j) setD(j as NgayTot); })
      .catch(() => { /* giữ bản công khai */ });
    return () => { huy = true; };
  }, [tuoi, banDau.ngay]);

  useBatDauDoc("xem_ngay", true);
  const homNay = homNayVN();
  return (
    <div className="space-y-5">
      <TheNgay d={d} />
      <ChonNgay dsViec={banDau.danh_sach_viec} tu={banDau.ngay >= homNay ? banDau.ngay : homNay} tuoi={tuoi} />
      {thang && <LichThang t={thang} chon={banDau.ngay} />}
      <CuoiBaiDoc moDun="xem_ngay" cauHoi="Thông tin ngày tốt có giúp bạn sắp xếp việc của mình?" />
    </div>
  );
}
