"use client";
// VH-1 — dòng 10 năm của chương "Vận hạn & điều nên tránh" (Tử vi + Bát tự đời sống, docs/LUAN-GIAI-DOI-SONG.md mục 8).
// Chỉ VẼ số engine đã chấm: mỗi năm một chấm màu theo mức (lục = thuận lợi · vàng = cân bằng · hổ phách = cần lưu ý —
// KHÔNG đỏ), năm nay có vòng vàng + nhãn "Năm nay", cờ nhỏ tập quán dân gian (năm tuổi, xung tuổi, tam tai…). Bấm một năm
// → khung dưới mở "Nên tránh / Nên làm" của năm ấy. Bát tự có thêm dải 12 tháng tới theo tiết.
// Chấm hiện lần lượt bằng `motion` (tôn trọng prefers-reduced-motion). Điện thoại 360px: dải năm cuộn ngang TRONG khung
// riêng, trang không cuộn ngang. Không đếm số năm "phải tránh", không màu đỏ, không lời doạ.
import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ngayDuong, ViSao } from "./HopNoiBat";
import { NHAN_MUC, type NamVanHan, type ThangToi } from "./kieu";
import { ChanQr } from "@/components/khung/ChanQr";

/** Cờ nhỏ dưới chấm (chữ ngắn); tên đầy đủ nằm trong khung chi tiết. */
const CO_NGAN: Record<string, string> = {
  nam_tuoi: "tuổi", xung_tuoi: "xung", va_tuoi: "va", tam_tai: "tam tai", xung_ngay: "nhà",
};

export function DongMuoiNam({ ds, thang }: { ds: NamVanHan[]; thang?: ThangToi[] }) {
  const giam = useReducedMotion();
  const idKhung = useId();
  // Mặc định mở năm "Cần lưu ý" gần nhất (để thấy ngay việc nên làm), không có thì năm nay.
  const [chon, setChon] = useState<number | undefined>((ds.find((g) => g.muc === "can_chu_dong") ?? ds[0])?.nam);
  if (!ds.length) return null;
  const g = ds.find((x) => x.nam === chon) ?? ds[0]!;
  return (
    <figure className="mt-5 min-w-0 rounded-2xl border border-line/70 p-4" data-testid="dong-muoi-nam">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-fg">Mười năm tới</span>
        <span className="text-xs text-fg-faint">Bấm vào một năm để xem nên tránh, nên làm</span>
      </figcaption>

      <div className="mt-3 overflow-x-auto pb-1" data-testid="dong-muoi-nam-khung">
        <ol className="relative grid min-w-[25rem] grid-cols-10" aria-label="Mười năm tới, mỗi năm một mức">
          <span className="absolute left-[5%] right-[5%] top-[1.95rem] h-px bg-line" aria-hidden />
          {ds.map((x, i) => {
            const dang = x.nam === g.nam;
            const co = x.co.filter((c) => CO_NGAN[c.ma]);
            return (
              <li key={x.nam} className="relative flex min-w-0 flex-col items-center">
                <button type="button" onClick={() => setChon(x.nam)} aria-pressed={dang} aria-controls={idKhung}
                  data-testid="nam-van-han" data-nam={x.nam} data-muc={x.muc} data-hien-tai={x.hien_tai ? "1" : undefined}
                  aria-label={`Năm ${x.nam}${x.hien_tai ? " (năm nay)" : ""}: ${NHAN_MUC[x.muc]}${x.co.length ? ` · ${x.co.map((c) => c.nhan).join(", ")}` : ""}`}
                  className="flex w-full flex-col items-center gap-1 rounded-lg px-0.5 pb-1 pt-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
                  <span className={x.hien_tai ? "text-[0.6rem] font-semibold text-gold" : "text-[0.6rem] text-transparent"} aria-hidden>
                    Năm nay
                  </span>
                  <motion.span data-muc={x.muc} aria-hidden
                    className={`cham-vh relative z-10 block size-4 rounded-full ${dang ? "ring-2 ring-fg/80 ring-offset-2 ring-offset-bg" : ""} ${x.hien_tai && !dang ? "ring-2 ring-gold ring-offset-2 ring-offset-bg" : ""}`}
                    initial={giam ? false : { opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
                    transition={giam ? { duration: 0 } : { duration: 0.35, delay: 0.08 + i * 0.07, ease: "easeOut" }} />
                  <span className={`text-[0.68rem] tabular-nums ${dang ? "font-semibold text-fg" : "text-fg-muted"}`}>{x.nam}</span>
                </button>
                {co.length > 0 && (
                  <span className="flex flex-col items-center gap-0.5" data-testid="co-nam">
                    {co.map((c) => (
                      <span key={c.ma} title={c.nhan} className="whitespace-nowrap rounded-full border border-moon/40 px-1 text-[0.56rem] leading-tight text-moon">
                        {CO_NGAN[c.ma]}
                      </span>
                    ))}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-fg-faint" aria-hidden>
        {(["thuan", "can_bang", "can_chu_dong"] as const).map((m) => (
          <span key={m} className="inline-flex items-center gap-1"><span data-muc={m} className="cham-vh inline-block size-2.5 rounded-full" /> {NHAN_MUC[m]}</span>
        ))}
        <span>· cờ nhỏ: tập quán dân gian</span>
      </div>

      <div id={idKhung} role="region" aria-live="polite" aria-label={`Năm ${g.nam}`} data-testid="nam-chi-tiet" data-nam={g.nam}
        className="mt-3 rounded-xl border border-line/70 bg-bg/40 p-3.5">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <b className="text-fg">Năm {g.nam}</b>
          <span className="text-fg-faint">{g.tuoi} tuổi</span>
          <span data-muc={g.muc} className="chip-muc rounded-full px-2 py-0 text-xs" data-testid="nam-chi-tiet-muc">{NHAN_MUC[g.muc]}</span>
          {g.hai_cach_khac && <span className="text-[0.7rem] text-moon">hai cách đọc khác nhau</span>}
        </p>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-fg-muted">{g.y}</p>
        {g.nen_tranh && (
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-fg" data-testid="nen-tranh">
            <b className="font-semibold text-[rgb(var(--vh-can))]">Nên tránh:</b> {g.nen_tranh}.
          </p>
        )}
        {g.nen_lam && (
          <p className="mt-1 text-[0.95rem] leading-relaxed text-fg" data-testid="nen-lam">
            <b className="font-semibold text-[rgb(var(--vh-thuan))]">Nên làm:</b> {g.nen_lam}.
          </p>
        )}
        {g.co.filter((c) => c.y).map((c) => (
          <p key={c.ma} className="mt-2 rounded-lg bg-moon/10 px-3 py-2 text-xs leading-relaxed text-moon" data-testid="co-chi-tiet">
            <b>Theo tập quán dân gian — {c.nhan}:</b> {c.y}
            {c.tranh && <> Nên tránh: {c.tranh}.</>}
            {c.lam && <> Nên làm: {c.lam}.</>}
          </p>
        ))}
        <ViSao canCu={g.can_cu} nho />
      </div>

      {thang && thang.length > 0 && (
        <div className="mt-4" data-testid="thang-toi">
          <p className="text-xs font-semibold text-fg">Mười hai tháng tới <span className="font-normal text-fg-faint">(tính theo tiết)</span></p>
          <ol className="mt-1.5 grid grid-cols-12 gap-1" aria-label="Mười hai tháng tới, mỗi tháng một mức">
            {thang.map((t, i) => (
              <li key={t.tu} className="min-w-0">
                <motion.span data-muc={t.muc} className="cham-vh block h-2.5 rounded-sm" title={`${ngayDuong(t.tu)} – ${ngayDuong(t.den)}: ${t.nhan_muc} (${t.mang})`}
                  aria-label={`Từ ${ngayDuong(t.tu)} đến ${ngayDuong(t.den)}: ${t.nhan_muc}`} role="img"
                  initial={giam ? false : { opacity: 0, scaleX: 0.2 }} animate={{ opacity: 1, scaleX: 1 }}
                  transition={giam ? { duration: 0 } : { duration: 0.3, delay: 0.4 + i * 0.04 }} />
              </li>
            ))}
          </ol>
          <div className="mt-1 flex justify-between text-[0.65rem] tabular-nums text-fg-faint">
            <span>{ngayDuong(thang[0]!.tu)}</span><span>{ngayDuong(thang[thang.length - 1]!.den)}</span>
          </div>
        </div>
      )}
      <ChanQr nhan="Quét để xem mười năm của bạn" />
    </figure>
  );
}
