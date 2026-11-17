"use client";
// LH-1 — lớp "Luận theo câu hỏi" của Luận giải Tử vi đời sống (engine `luangiai/tuvi_luan_hoi.py`). Web CHỈ VẼ:
//   · BanDoNguoi   bản đồ người quanh bạn (cấp báo cáo): bạn ở giữa, mỗi người một nút; màu đường nối = mức engine chấm,
//                  chấm chạy trên đường = chiều tác động (đường bay tứ hoá engine đã tính). Bấm → chân dung.
//   · KhoiTraLoi   câu người ta hay hỏi → câu trả lời thẳng + giải thích + "Vì sao nói vậy" + kiểm chứng.
//   · DongMang     dòng mười năm riêng của mảng (ba mức, không điểm số, không đỏ).
//   · LaBanNghe    năm hành xếp vòng, hành nổi nhất sáng lên; bấm một hành để xem nhóm ngành.
//   · KhoiHoaGiai  Phát huy · Cần sửa · Cảnh báo · Dân gian thường làm (tập quán — ghi rõ không nằm trong phép tính).
// Chuyển động bằng `motion`, tôn trọng prefers-reduced-motion. Người thuộc chương khoá (SAO-2) chỉ có tên + mức.
import { useContext, useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Heart, Landmark, LockKeyhole, Sprout, TriangleAlert, Wrench, type LucideIcon } from "lucide-react";
import Link from "@/components/khung/Lien";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import type { ThuatNgu } from "@/components/hoi/ThuatNgu";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { KiemChungBai, ViSao } from "./HopNoiBat";
import { useChuBaoCao } from "./chu-bao-cao";
import type { HoaGiai, LaBanNghe as KieuLaBan, LuanHoi, Muc, NamMang, NguoiQuanh, TraLoiThang } from "./kieu";

/** Màu ba mức cho nét SVG (cùng bộ màu chip mức: lục · lam xám · hổ phách — không đỏ). */
const MAU_MUC: Record<Muc, string> = { thuan: "rgb(111 211 181)", can_bang: "rgb(170 180 214)", can_chu_dong: "rgb(245 170 80)" };

function Cham({ muc, className }: { muc: Muc; className?: string }) {
  return <span data-muc={muc} aria-hidden className={cn("cham-muc inline-block size-2.5 shrink-0 rounded-full", className)} />;
}

// ------------------------------------------------------------------ bản đồ người quanh bạn
/** Vị trí nút theo vòng elip quanh tâm (đơn vị % của khung). Nút đầu ở trên cùng. */
function viTri(i: number, n: number): { x: number; y: number } {
  const goc = (-90 + (360 / n) * i) * (Math.PI / 180);
  return { x: 50 + 33 * Math.cos(goc), y: 50 + 38 * Math.sin(goc) };
}

export function BanDoNguoi({ ds, moDun, soChuong, tenChuong, onMo }: {
  ds: NguoiQuanh[]; moDun: string; soChuong: (ma: string) => number; tenChuong: (ma: string) => string; onMo: (ma: string) => void;
}) {
  const giam = useReducedMotion();
  const { c: chu, nhanMuc } = useChuBaoCao();
  const idKhung = useId();
  const [chon, setChon] = useState<string | null>(ds.find((n) => !n.khoa)?.ma ?? null);
  if (!ds.length) return null;
  const n = ds.find((x) => x.ma === chon);
  return (
    <section aria-labelledby="lg-nguoi-quanh-td" className="mt-6 scroll-mt-32 rounded-2xl border border-line/70 p-4 sm:p-5 lg:scroll-mt-24"
      data-testid="lg-nguoi-quanh">
      <h3 id="lg-nguoi-quanh-td" className="font-serif text-2xl">{chu("lh.ban_do_td")}</h3>
      <p className="mt-1 text-sm text-fg-muted">{chu("lh.ban_do_dan")}</p>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center">
        <div className="relative mx-auto aspect-[10/9] w-full max-w-[26rem]">
          <svg viewBox="0 0 100 90" className="absolute inset-0 size-full" aria-hidden>
            {ds.map((x, i) => {
              const p = viTri(i, ds.length);
              const y = p.y * 0.9;
              const dang = x.ma === chon;
              return (
                <g key={x.ma}>
                  <motion.line x1={50} y1={45} x2={p.x} y2={y} stroke={MAU_MUC[x.muc]} strokeLinecap="round"
                    strokeWidth={dang ? 1.1 : 0.6} strokeOpacity={dang ? 0.95 : 0.5} strokeDasharray={x.khoa ? "1.5 2" : undefined}
                    initial={giam ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={giam ? { duration: 0 } : { duration: 0.6, delay: 0.15 + i * 0.08, ease: "easeOut" }} />
                  {/* Chiều tác động: chấm chạy từ bạn ra (bạn → họ) hoặc từ họ vào (họ → bạn). Giảm chuyển động → không vẽ. */}
                  {!giam && !x.khoa && (x.ban_voi_ho?.length ?? 0) > 0 && (
                    <motion.circle r={0.9} fill={MAU_MUC[x.muc]} initial={{ cx: 50, cy: 45, opacity: 0 }}
                      animate={{ cx: [50, p.x], cy: [45, y], opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 2.4, delay: 1 + i * 0.3, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }} />
                  )}
                  {!giam && !x.khoa && (x.ho_voi_ban?.length ?? 0) > 0 && (
                    <motion.circle r={0.9} fill="rgb(233 196 106)" initial={{ cx: p.x, cy: y, opacity: 0 }}
                      animate={{ cx: [p.x, 50], cy: [y, 45], opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 2.4, delay: 2.2 + i * 0.3, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }} />
                  )}
                </g>
              );
            })}
          </svg>
          <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/70 bg-gold/15 font-serif text-base text-gold sm:size-16">
            {chu("lh.ban")}
          </span>
          {ds.map((x, i) => {
            const p = viTri(i, ds.length);
            const dang = x.ma === chon;
            return (
              <span key={x.ma} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <motion.button type="button" aria-pressed={dang} aria-controls={idKhung} data-testid="nguoi-quanh-nut"
                data-ma={x.ma} data-muc={x.muc} data-khoa={x.khoa ? "1" : undefined}
                onClick={() => { setChon(x.ma); ghi("chart_interacted", { mo_dun: moDun, kind: "nguoi_quanh_chon", muc: x.ma, khoa: x.khoa ? 1 : 0 }); }}
                aria-label={`${x.ten}: ${nhanMuc[x.muc]}`}
                initial={giam ? false : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                transition={giam ? { duration: 0 } : { duration: 0.35, delay: 0.45 + i * 0.08, ease: "easeOut" }}
                className={cn("flex w-[5.2rem] flex-col items-center gap-1 rounded-xl border bg-bg/85 px-1.5 py-1.5 text-center text-[0.72rem] leading-tight backdrop-blur transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold sm:w-[6.4rem] sm:text-xs",
                  dang ? "border-gold text-fg" : "border-line/80 text-fg-muted hover:border-gold/60 hover:text-fg")}>
                <span className="flex items-center gap-1">
                  <Cham muc={x.muc} />
                  {x.khoa && <LockKeyhole className="size-3 text-gold" aria-hidden />}
                </span>
                <span className="text-balance">{x.ten}</span>
              </motion.button>
              </span>
            );
          })}
        </div>
        <div id={idKhung} aria-live="polite" className="min-w-0 rounded-xl border border-line/70 p-4" data-testid="nguoi-quanh-chi-tiet">
          {!n ? <p className="text-sm text-fg-muted">{chu("lh.chon_nguoi")}</p> : (
            <>
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-xl">{n.ten}</span>
                <span data-muc={n.muc} className="chip-muc rounded-full px-2.5 py-0.5 text-xs font-medium">{n.nhan_muc || nhanMuc[n.muc]}</span>
              </p>
              {n.khoa ? (
                <p className="mt-2 text-sm text-fg-muted">
                  {chu("lh.nguoi_khoa", { so: String(soChuong(n.tu_chuong)), ten: tenChuong(n.tu_chuong) })}{" "}
                  <a href="#lg-khoa" className="text-gold underline-offset-4 hover:underline">
                    <LockKeyhole className="mr-1 inline size-3.5" aria-hidden />{chu("chuong_con_lai")}
                  </a>
                </p>
              ) : (
                <>
                  <ChiTietNguoi n={n} />
                  <button type="button" onClick={() => onMo(n.tu_chuong)} data-testid="nguoi-quanh-doc"
                    className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-gold/40 px-4 text-sm font-medium text-gold transition-colors hover:bg-gold/10 print:hidden">
                    {chu("lh.doc_chuong", { so: String(soChuong(n.tu_chuong)), ten: tenChuong(n.tu_chuong) })} <ArrowRight className="size-4" aria-hidden />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ChiTietNguoi({ n, thuatNgu }: { n: NguoiQuanh; thuatNgu?: ThuatNgu[] }) {
  const { c: chu } = useChuBaoCao();
  return (
    <>
      {n.chan_dung && <p className="mt-2 leading-relaxed text-fg">{n.chan_dung}</p>}
      {n.song_chung && (
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted"><b className="font-semibold text-fg">{chu("lh.song_chung")}</b> {n.song_chung}</p>
      )}
      {(n.ban_voi_ho?.length ?? 0) > 0 && (
        <p className="mt-2 flex gap-2 text-sm leading-relaxed text-fg-muted" data-testid="nguoi-ban-voi-ho">
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-wide text-fg-faint">
            {chu("lh.ban_voi_ho")} <ArrowRight className="size-3.5" aria-hidden />
          </span>
          <span>{n.ban_voi_ho!.join(" ")}</span>
        </p>
      )}
      {(n.ho_voi_ban?.length ?? 0) > 0 && (
        <p className="mt-2 flex gap-2 text-sm leading-relaxed text-fg-muted" data-testid="nguoi-ho-voi-ban">
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-wide text-fg-faint">
            {chu("lh.ho_voi_ban")} <ArrowLeft className="size-3.5" aria-hidden />
          </span>
          <span>{n.ho_voi_ban!.join(" ")}</span>
        </p>
      )}
      <ViSao canCu={n.can_cu} thuatNgu={thuatNgu} nho />
    </>
  );
}

// ------------------------------------------------------------------ trả lời thẳng
function KhoiTraLoi({ ds, thuatNgu }: { ds: TraLoiThang[]; thuatNgu?: ThuatNgu[] }) {
  const giam = useReducedMotion();
  const { c: chu } = useChuBaoCao();
  const { tyLe, phai, tat, loai = "doi_song" } = useContext(KiemChungBai);
  if (!ds.length) return null;
  return (
    <div className="mt-5" data-testid="lh-tra-loi">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">{chu("lh.tra_loi_td")}</h4>
      <ol className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {ds.map((t, i) => (
          <motion.li key={t.ma} data-testid="lh-cau" data-ma={t.ma} data-nhan={t.nhan}
            className={cn("flex min-w-0 flex-col rounded-2xl border border-line/70 bg-surface/30 p-4", ds.length % 2 === 1 && i === 0 && "md:col-span-2")}
            initial={giam ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
            transition={giam ? { duration: 0 } : { duration: 0.35, delay: Math.min(i, 3) * 0.06, ease: "easeOut" }}>
            <p className="flex items-start gap-2 text-sm text-fg-muted">
              <Cham muc={t.sac} className="mt-1.5" />
              <span>{t.cau}</span>
            </p>
            <p className="mt-2 text-[1.05rem] font-medium leading-relaxed text-fg" data-testid="lh-tra-loi-cau">{t.tra_loi}</p>
            {t.giai_thich && <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t.giai_thich}</p>}
            <ViSao canCu={t.can_cu} thuatNgu={thuatNgu} nho />
            {!tat && (
              <div className="mt-auto pt-3">
                <KiemChung loai={loai} mau={t.ma_mau} phai={phai} tyLe={tyLe[t.ma_mau]} />
              </div>
            )}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

// ------------------------------------------------------------------ dòng mười năm của mảng
function DongMang({ ds, moDun, chuong }: { ds: NamMang[]; moDun: string; chuong: string }) {
  const giam = useReducedMotion();
  const { c: chu, nhanMuc } = useChuBaoCao();
  const idKhung = useId();
  const [chon, setChon] = useState<number | undefined>((ds.find((g) => g.muc !== "can_bang") ?? ds[0])?.nam);
  if (!ds.length) return null;
  const g = ds.find((x) => x.nam === chon) ?? ds[0]!;
  return (
    <figure className="mt-5 min-w-0 rounded-2xl border border-line/70 p-4" data-testid="lh-dong-mang">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-fg">{chu("lh.dong_td")}</span>
        <span className="text-xs text-fg-faint">{chu("lh.dong_goi_y")}</span>
      </figcaption>
      <div className="mt-3 overflow-x-auto pb-1">
        <ol className="relative grid min-w-[25rem] grid-cols-10">
          <span className="absolute left-[5%] right-[5%] top-[1.95rem] h-px bg-line" aria-hidden />
          {ds.map((x, i) => {
            const dang = x.nam === g.nam;
            return (
              <li key={x.nam} className="relative flex min-w-0 flex-col items-center">
                <button type="button" aria-pressed={dang} aria-controls={idKhung} data-testid="lh-nam" data-nam={x.nam} data-muc={x.muc}
                  onClick={() => { setChon(x.nam); ghi("chart_interacted", { mo_dun: moDun, kind: "dong_mang_chon", chuong, muc: x.muc }); }}
                  aria-label={`${x.nam}${x.hien_tai ? ` (${chu("lh.nam_nay")})` : ""}: ${nhanMuc[x.muc]}${x.hy ? ` · ${chu("lh.hy")}` : ""}`}
                  className="flex w-full flex-col items-center gap-1 rounded-lg px-0.5 pb-1 pt-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
                  <span className={x.hien_tai ? "text-[0.6rem] font-semibold text-gold" : "text-[0.6rem] text-transparent"} aria-hidden>{chu("lh.nam_nay")}</span>
                  <motion.span data-muc={x.muc} aria-hidden
                    className={cn("cham-vh relative z-10 block size-4 rounded-full", dang && "ring-2 ring-fg/80 ring-offset-2 ring-offset-bg",
                      !dang && (x.hien_tai || x.noi) && "ring-2 ring-gold/70 ring-offset-2 ring-offset-bg")}
                    initial={giam ? false : { opacity: 0, scale: 0.3 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    transition={giam ? { duration: 0 } : { duration: 0.35, delay: 0.05 + i * 0.06, ease: "easeOut" }} />
                  <span className="text-xs tabular-nums text-fg-muted">{x.nam}</span>
                  <span className="flex h-3.5 items-center" aria-hidden>{x.hy && <Heart className="size-3 text-gold" />}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <div id={idKhung} aria-live="polite" className="mt-2 rounded-xl bg-surface/40 px-4 py-3 text-sm" data-testid="lh-nam-chi-tiet">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-fg">{g.nam}</span>
          <span className="text-xs text-fg-faint">{chu("lh.tuoi", { tuoi: String(g.tuoi) })}</span>
          <span data-muc={g.muc} className="chip-muc rounded-full px-2 py-0 text-xs">{g.nhan_muc || nhanMuc[g.muc]}</span>
        </p>
        <p className="mt-1 leading-relaxed text-fg-muted">
          {g.y.charAt(0).toUpperCase() + g.y.slice(1)}.{g.hy && g.muc === "thuan" && !g.y.includes("duyên") ? ` ${chu("lh.hy")}.` : ""}
          {g.noi && g.muc !== "can_bang" ? ` ${chu("lh.noi")}.` : ""}
        </p>
        <ViSao canCu={g.can_cu} nho />
      </div>
    </figure>
  );
}

// ------------------------------------------------------------------ la bàn nghề
const MAU_HANH: Record<string, string> = {
  "Mộc": "rgb(111 211 181)", "Hoả": "rgb(240 138 93)", "Thổ": "rgb(217 178 106)", "Kim": "rgb(207 214 228)", "Thuỷ": "rgb(106 169 240)",
};

function LaBanNghe({ nghe, moDun }: { nghe: KieuLaBan; moDun: string }) {
  const giam = useReducedMotion();
  const { c: chu } = useChuBaoCao();
  const idKhung = useId();
  const [chon, setChon] = useState<string>(nghe.noi_bat ?? nghe.hanh[0]?.hanh ?? "");
  const h = nghe.hanh.find((x) => x.hanh === chon) ?? nghe.hanh[0];
  if (!h) return null;
  const n = nghe.hanh.length;
  const diem = nghe.hanh.map((_, i) => {
    const goc = (-90 + (360 / n) * i) * (Math.PI / 180);
    return { x: 50 + 34 * Math.cos(goc), y: 50 + 34 * Math.sin(goc) };
  });
  const nhanCap = (cap: string) => chu(cap === "chinh" ? "lh.nghe_chinh" : cap === "phu" ? "lh.nghe_phu" : "lh.nghe_khong");
  return (
    <figure className="mt-5 min-w-0 rounded-2xl border border-line/70 p-4" data-testid="lh-la-ban-nghe">
      <figcaption className="text-sm font-semibold text-fg">{chu("lh.nghe_td")}</figcaption>
      <div className="mt-3 grid grid-cols-1 items-center gap-4 sm:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="relative mx-auto aspect-square w-full max-w-[14rem]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
            {/* vòng tương sinh: Mộc → Hoả → Thổ → Kim → Thuỷ → Mộc */}
            {diem.map((p, i) => {
              const q = diem[(i + 1) % n]!;
              return (
                <motion.line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="currentColor" className="text-line" strokeWidth={0.5}
                  initial={giam ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
                  transition={giam ? { duration: 0 } : { duration: 0.45, delay: i * 0.12 }} />
              );
            })}
            {nghe.hanh.map((x, i) => x.cap === "chinh" && !giam && (
              <motion.circle key={x.hanh} cx={diem[i]!.x} cy={diem[i]!.y} r={11} fill="none" stroke={MAU_HANH[x.hanh]} strokeWidth={0.6}
                animate={{ r: [11, 15, 11], opacity: [0.7, 0, 0.7] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
            ))}
          </svg>
          {nghe.hanh.map((x, i) => {
            const dang = x.hanh === h.hanh;
            const co = x.cap === "chinh" ? "size-14 text-sm" : x.cap === "phu" ? "size-12 text-xs" : "size-10 text-xs";
            return (
              <span key={x.hanh} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${diem[i]!.x}%`, top: `${diem[i]!.y}%` }}>
              <motion.button type="button" aria-pressed={dang} aria-controls={idKhung} data-testid="lh-hanh" data-hanh={x.hanh}
                data-cap={x.cap || "khong"} aria-label={`${chu("lh.nghe_hanh", { hanh: x.hanh })}: ${nhanCap(x.cap)}`}
                onClick={() => { setChon(x.hanh); ghi("chart_interacted", { mo_dun: moDun, kind: "la_ban_nghe_chon", muc: x.cap || "khong" }); }}
                style={{ borderColor: MAU_HANH[x.hanh], color: MAU_HANH[x.hanh],
                  backgroundColor: x.cap ? `color-mix(in srgb, ${MAU_HANH[x.hanh]} ${x.cap === "chinh" ? 22 : 10}%, transparent)` : undefined }}
                initial={giam ? false : { opacity: 0, scale: 0.4 }} whileInView={{ opacity: x.cap ? 1 : 0.5, scale: 1 }} viewport={{ once: true }}
                transition={giam ? { duration: 0 } : { duration: 0.4, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                className={cn("flex items-center justify-center rounded-full border font-serif focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold",
                  co, dang && "ring-2 ring-fg/70 ring-offset-2 ring-offset-bg")}>
                {x.hanh}
              </motion.button>
              </span>
            );
          })}
        </div>
        <div id={idKhung} aria-live="polite" className="min-w-0 text-sm" data-testid="lh-hanh-chi-tiet">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-lg" style={{ color: MAU_HANH[h.hanh] }}>{chu("lh.nghe_hanh", { hanh: h.hanh })}</span>
            <span className="rounded-full border border-line px-2 text-xs text-fg-muted">{nhanCap(h.cap)}</span>
          </p>
          <p className="mt-1 leading-relaxed text-fg-muted">{h.nganh.charAt(0).toUpperCase() + h.nganh.slice(1)}.</p>
          {nghe.cau && <p className="mt-2 leading-relaxed text-fg">{nghe.cau}</p>}
          <ViSao canCu={nghe.can_cu} nho />
        </div>
      </div>
    </figure>
  );
}

// ------------------------------------------------------------------ hoá giải
function CotHoaGiai({ nhan, Icon, ds, loai }: { nhan: string; Icon: LucideIcon; ds: string[]; loai: string }) {
  if (!ds.length) return null;
  return (
    <div className="min-w-0 rounded-xl border border-line/70 p-3.5" data-testid={`lh-hg-${loai}`} data-loai={loai}>
      <p className={cn("flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider",
        loai === "phat_huy" ? "text-[rgb(111_211_181)]" : loai === "canh_bao" ? "text-[rgb(245_170_80)]" : "text-fg-faint")}>
        <Icon className="size-3.5" aria-hidden /> {nhan}
      </p>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-fg-muted">
        {ds.map((x) => <li key={x} className="flex gap-2"><span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-fg-faint" /><span>{x}</span></li>)}
      </ul>
    </div>
  );
}

function KhoiHoaGiai({ hg }: { hg: HoaGiai }) {
  const { c: chu } = useChuBaoCao();
  return (
    <div className="mt-5" data-testid="lh-hoa-giai">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">{chu("lh.hoa_giai_td")}</h4>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <CotHoaGiai nhan={chu("lh.phat_huy")} Icon={Sprout} ds={hg.phat_huy} loai="phat_huy" />
        <CotHoaGiai nhan={chu("lh.can_sua")} Icon={Wrench} ds={hg.can_sua} loai="can_sua" />
        <CotHoaGiai nhan={chu("lh.canh_bao")} Icon={TriangleAlert} ds={hg.canh_bao} loai="canh_bao" />
        {hg.dan_gian.length > 0 && (
          <div className="min-w-0 rounded-xl border border-dashed border-line/80 p-3.5" data-testid="lh-hg-dan-gian" data-nosnippet>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-faint">
              <Landmark className="size-3.5" aria-hidden /> {chu("lh.dan_gian")}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-fg-muted">
              {hg.dan_gian.map((d) => (
                <li key={d.loi} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-fg-faint" />
                  <span>{d.loi}{d.duong?.startsWith("/") && (
                    <> <Link href={d.duong} className="whitespace-nowrap text-gold underline-offset-4 hover:underline print:hidden">{chu("lh.mo_cong_cu")}</Link></>
                  )}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-fg-faint">{hg.ghi_chu_dan_gian}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ ghép trong chương
/** Phần ĐẦU chương: trả lời thẳng → người liên quan → dòng mười năm → la bàn nghề. */
export function LuanHoiDau({ lh, moDun, chuong, thuatNgu }: { lh: LuanHoi; moDun: string; chuong: string; thuatNgu?: ThuatNgu[] }) {
  const { c: chu } = useChuBaoCao();
  return (
    <div data-testid="lh-dau">
      <KhoiTraLoi ds={lh.tra_loi} thuatNgu={thuatNgu} />
      {lh.nghe && <LaBanNghe nghe={lh.nghe} moDun={moDun} />}
      {lh.nguoi.length > 0 && (
        <div className="mt-5" data-testid="lh-nguoi">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gold">{chu("lh.nguoi_td")}</h4>
          <div className={cn("mt-3 grid grid-cols-1 gap-3", lh.nguoi.length > 1 && "md:grid-cols-2", lh.nguoi.length > 2 && "xl:grid-cols-3")}>
            {lh.nguoi.map((n) => (
              <div key={n.ma} className="min-w-0 rounded-2xl border border-line/70 p-4" data-testid="lh-the-nguoi" data-ma={n.ma}>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-lg">{n.ten}</span>
                  <span data-muc={n.muc} className="chip-muc rounded-full px-2 py-0 text-xs">{n.nhan_muc}</span>
                </p>
                <ChiTietNguoi n={n} thuatNgu={thuatNgu} />
              </div>
            ))}
          </div>
        </div>
      )}
      <DongMang ds={lh.dong_mang} moDun={moDun} chuong={chuong} />
    </div>
  );
}

/** Phần CUỐI chương (sau các hộp): hướng hoá giải. */
export function LuanHoiCuoi({ lh }: { lh: LuanHoi }) {
  return <KhoiHoaGiai hg={lh.hoa_giai} />;
}
