"use client";
// SAO-HH — khối "Lá bài đầu ngày" trên Hôm nay (thay gacha, docs/CO-CHE-RUI-RO-VA-THAY-THE.md §1): một lá úp, bấm lật →
// MỘT điều của hôm nay chọn tất định theo (hồ sơ, ngày) từ dữ liệu /hom-nay đã có mà thẻ phía trên CHƯA in (lib/la-bai.ts).
// Không giải thưởng, không trả gì, không random, không gọi engine thêm. Mỗi ngày một lá; lật rồi máy nhớ. Chia sẻ dùng thẻ
// ngày sẵn có (?the= / /og/ngay) — chỉ tên hiển thị + con số, không ngày sinh. Chữ: không "trúng / thưởng / quay".
// Lật 3D thấy được (≈ 550 ms, nhịp vào–ra đều để thấy lá nghiêng qua 90°; giảm chuyển động → tức thì); mặt sau có hình
// riêng theo loại lá (việc nhỏ / câu hỏi / giờ tốt) — tất định theo mã lá, không random. Lật xong cuộn nhẹ tới nội dung
// nếu nó đang nằm ngoài màn hình.
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Clock, Copy, ListChecks, MessageCircleQuestion, Share2, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE } from "@/lib/chuyen-dong";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";
import type { HoSo } from "@/lib/hoso";
import { chonLaBai, laDaLat, nhoDaLat, type MaLaBai, type NguyenLieuLaBai } from "@/lib/la-bai";
import { maMoiNgay, taoLinkNgay } from "@/components/chia-se/NutChiaSeNgay";

// Mặt sau theo loại lá: biểu tượng + màu nhấn + nền riêng (v3 M4). Chữ loại lấy từ `la.ngan` (lib/la-bai.ts).
const MAT_SAU: Record<MaLaBai, { icon: LucideIcon; nhan: string; vien: string; nen: string; vong: string }> = {
  viec: { icon: ListChecks, nhan: "text-jade", vien: "border-jade/60", nen: "bg-[linear-gradient(160deg,#143029_0%,#1a1530_75%)]", vong: "border-jade/50 bg-jade/10" },
  cau_hoi: { icon: MessageCircleQuestion, nhan: "text-moon", vien: "border-moon/60", nen: "bg-[linear-gradient(160deg,#1d2448_0%,#1a1530_75%)]", vong: "border-moon/50 bg-moon/10" },
  gio: { icon: Clock, nhan: "text-gold", vien: "border-gold/60", nen: "bg-[linear-gradient(160deg,#2e2412_0%,#1a1530_75%)]", vong: "border-gold/50 bg-gold/10" },
};
// Nhịp lật: vào–ra đều (không "ra êm" như EASE — kiểu đó qua 90° ngay khung hình đầu nên mắt không thấy lá xoay).
const NHIP_LAT: [number, number, number, number] = [0.45, 0, 0.25, 1];
const ddmm = (iso: string) => { const [, m, d] = iso.split("-"); return d && m ? `${d}/${m}` : ""; };

export function LaBaiDauNgay({ the, hoSo, tieuDe }: { the: NguyenLieuLaBai; hoSo: HoSo; tieuDe: string }) {
  const giam = Boolean(useReducedMotion());
  const [lat, setLat] = useState<boolean | null>(null);   // null = chưa đọc máy
  const [maNho, setMaNho] = useState<string | null>(null);   // lá đã lật hôm nay (máy nhớ) — giữ nguyên khi thẻ về muộn
  const [daChep, setDaChep] = useState(false);
  const [dangChiaSe, setDangChiaSe] = useState(false);
  const noiDung = useRef<HTMLDivElement>(null);
  const la = chonLaBai(the, hoSo, maNho);

  useEffect(() => {
    const d = laDaLat(the.ngay_xem);
    setLat(d !== null);
    setMaNho(d && d !== "co" ? d : null);
  }, [the.ngay_xem]);
  if (!la || lat === null) return null;

  const latLa = () => {
    if (lat) return;
    setLat(true);
    setMaNho(la.ma);
    nhoDaLat(the.ngay_xem, la.ma);
    ghi("daily_card_flipped", { kind: la.ma });
    // Điện thoại: nội dung nằm dưới lá → lật xong cuộn nhẹ tới nội dung (chỉ khi phần đó chưa nằm trọn trong màn hình).
    window.setTimeout(() => {
      const el = noiDung.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top >= 64 && r.bottom <= window.innerHeight - 72) return;
      el.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "center" });
    }, giam ? 0 : 600);
  };
  const mat = MAT_SAU[la.ma];
  const IconLa = mat.icon;
  const chuChiaSe = `${la.nhan}: ${la.chu}`;
  async function chiaSe() {
    setDangChiaSe(true);
    try {
      const tu = maMoiNgay();
      ghi("share_created", { kind: "la_bai", ma_moi: tu });
      const { url } = await taoLinkNgay(hoSo, tu);
      const chu = `Lá bài đầu ngày của mình — ${chuChiaSe} Lật lá của bạn:`;
      if (typeof navigator.share === "function") {
        try { await navigator.share({ title: "Lá bài đầu ngày", text: chu, url }); return; } catch { /* huỷ → chép */ }
      }
      await navigator.clipboard.writeText(`${chu} ${url}`);
      setDaChep(true); setTimeout(() => setDaChep(false), 2500);
    } catch { /* bỏ qua */ }
    finally { setDangChiaSe(false); }
  }
  async function chep() {
    try { await navigator.clipboard.writeText(chuChiaSe); setDaChep(true); setTimeout(() => setDaChep(false), 2500); } catch { /* bỏ qua */ }
  }

  return (
    <section aria-labelledby="la-bai" className="glass rounded-2xl p-5" data-testid="la-bai" data-lat={lat ? 1 : 0}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="la-bai" className="text-xl">{tieuDe}</h2>
        <span className="text-xs text-fg-muted">mỗi ngày một lá · miễn phí</span>
      </div>
      <div className="mt-4 grid items-center gap-5 sm:grid-cols-[9rem_1fr]">
        <div className="mx-auto h-52 w-36 [perspective:700px]">
          <motion.div className="relative size-full [transform-style:preserve-3d]"
            animate={giam ? { rotateY: lat ? 180 : 0 } : { rotateY: lat ? 180 : 0, scale: lat ? [1, 1.08, 1] : 1, y: lat ? [0, -6, 0] : 0 }}
            transition={giam ? { duration: 0 } : { duration: 0.55, ease: NHIP_LAT }}>
            <button type="button" onClick={latLa} aria-label="Lật lá bài của hôm nay" disabled={lat} data-testid="la-bai-up"
              className="lat-mat absolute inset-0 grid place-items-center rounded-2xl border border-gold/40 bg-gradient-to-b from-surface-2 to-bg shadow-card transition-colors [transform:translateZ(1px)] hover:border-gold disabled:cursor-default">
              <span className="flex flex-col items-center gap-2 text-gold/80">
                <Sparkles className="size-8" aria-hidden />
                <span className="text-xs uppercase tracking-[0.14em]">Lật lá</span>
              </span>
            </button>
            <div className={cn("lat-mat absolute inset-0 overflow-hidden rounded-2xl border shadow-card [transform:rotateY(180deg)]", mat.vien, mat.nen)}
              aria-hidden={!lat} data-testid="la-bai-mat" data-loai={lat ? la.ma : undefined}>
              {lat && (
                <div className="flex size-full flex-col items-center justify-center px-3 text-center">
                  {/* Khung trong + bốn góc sao, như mặt lá bài in. */}
                  <svg className={cn("pointer-events-none absolute inset-2 size-[calc(100%-1rem)] opacity-50", mat.nhan)} viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden>
                    <rect x="1" y="1" width="98" height="138" rx="9" fill="none" stroke="currentColor" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
                  </svg>
                  {[["left-3 top-3"], ["right-3 top-3"], ["left-3 bottom-3"], ["right-3 bottom-3"]].map(([v]) => (
                    <Sparkles key={v} className={cn("absolute size-3 opacity-60", v, mat.nhan)} aria-hidden />
                  ))}
                  <span className="text-[0.75rem] font-semibold uppercase leading-tight tracking-[0.12em] text-fg-muted">Hôm nay<span className="block tabular-nums">{ddmm(the.ngay_xem)}</span></span>
                  <span className="relative mt-3 grid size-16 place-items-center">
                    <svg className={cn("absolute inset-[-10px] size-[calc(100%+20px)] opacity-60", mat.nhan)} viewBox="0 0 100 100" aria-hidden>
                      {Array.from({ length: 12 }, (_, i) => {
                        const g = (i * Math.PI) / 6;
                        return <line key={i} x1={50 + 40 * Math.cos(g)} y1={50 + 40 * Math.sin(g)} x2={50 + (i % 2 ? 46 : 49) * Math.cos(g)} y2={50 + (i % 2 ? 46 : 49) * Math.sin(g)} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
                      })}
                    </svg>
                    <span className={cn("grid size-16 place-items-center rounded-full border", mat.vong)}>
                      <IconLa className={cn("size-8", mat.nhan)} aria-hidden />
                    </span>
                  </span>
                  <span className={cn("mt-3 text-sm font-semibold uppercase tracking-[0.12em]", mat.nhan)}>{la.ngan}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        <div className="min-h-24 scroll-mt-24 text-sm" ref={noiDung}>
          {lat ? (
            <motion.div className="space-y-2" data-testid="la-bai-noi-dung" role="status"
              initial={giam ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: giam ? 0 : 0.4, ease: EASE }}>
              <p className="text-xs font-medium text-moon">{la.nhan}</p>
              <p className="text-lg leading-snug" data-testid="la-bai-chu">{la.chu}</p>
              {la.phu && <p className="text-fg-muted">{la.phu}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={() => void chiaSe()} disabled={dangChiaSe} data-testid="la-bai-chia-se">
                  {daChep ? <Check aria-hidden /> : <Share2 aria-hidden />}{daChep ? "Đã chép" : "Chia sẻ lá bài"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void chep()} data-testid="la-bai-chep"><Copy aria-hidden /> Sao chép câu</Button>
              </div>
            </motion.div>
          ) : (
            <p className="text-fg-muted">Một điều nhỏ của hôm nay đang úp — bấm lật để xem. Ngày mai sẽ là lá khác.</p>
          )}
        </div>
      </div>
    </section>
  );
}
