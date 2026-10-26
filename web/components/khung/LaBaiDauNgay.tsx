"use client";
// SAO-HH — khối "Lá bài đầu ngày" trên Hôm nay (thay gacha, docs/CO-CHE-RUI-RO-VA-THAY-THE.md §1): một lá úp, bấm lật →
// MỘT điều của hôm nay chọn tất định theo (hồ sơ, ngày) từ dữ liệu /hom-nay đã có (lib/la-bai.ts). Không giải thưởng,
// không trả gì, không random, không gọi engine thêm. Mỗi ngày một lá; lật rồi máy nhớ. Chia sẻ dùng thẻ ngày sẵn có
// (?the= / /og/ngay) — chỉ tên hiển thị + con số, không ngày sinh. Chữ: không "trúng / thưởng / quay".
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Copy, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE } from "@/lib/chuyen-dong";
import { ghi } from "@/lib/do-luong";
import type { HoSo } from "@/lib/hoso";
import { chonLaBai, laDaLat, nhoDaLat, type LaBai, type NguyenLieuLaBai } from "@/lib/la-bai";
import { maMoiNgay, taoLinkNgay } from "@/components/chia-se/NutChiaSeNgay";

export function LaBaiDauNgay({ the, hoSo, tieuDe }: { the: NguyenLieuLaBai; hoSo: HoSo; tieuDe: string }) {
  const giam = Boolean(useReducedMotion());
  const [lat, setLat] = useState<boolean | null>(null);   // null = chưa đọc máy
  const [maNho, setMaNho] = useState<LaBai["ma"] | null>(null);   // lá đã lật hôm nay (máy nhớ) — giữ nguyên khi thẻ về muộn
  const [daChep, setDaChep] = useState(false);
  const [dangChiaSe, setDangChiaSe] = useState(false);
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
  };
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
        <div className="lat-3d mx-auto h-52 w-36">
          <motion.div className="relative size-full [transform-style:preserve-3d]"
            animate={{ rotateY: lat ? 180 : 0 }} transition={giam ? { duration: 0 } : { duration: 0.7, ease: EASE }}>
            <button type="button" onClick={latLa} aria-label="Lật lá bài của hôm nay" disabled={lat} data-testid="la-bai-up"
              className="lat-mat absolute inset-0 grid place-items-center rounded-2xl border border-gold/40 bg-gradient-to-b from-surface-2 to-bg shadow-card transition-colors hover:border-gold disabled:cursor-default">
              <span className="flex flex-col items-center gap-2 text-gold/80">
                <Sparkles className="size-8" aria-hidden />
                <span className="text-xs uppercase tracking-[0.14em]">Lật lá</span>
              </span>
            </button>
            <div className="lat-mat absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gold/60 bg-[#1a1530] px-3 text-center shadow-card [transform:rotateY(180deg)]"
              aria-hidden={!lat} data-testid="la-bai-mat">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">Hôm nay</span>
              <span className="text-gradient-gold mt-1 font-serif text-5xl leading-none">{the.ngay_ca_nhan.so}</span>
              <span className="mt-2 line-clamp-3 text-xs text-fg-muted">{lat ? la.nhan : ""}</span>
            </div>
          </motion.div>
        </div>
        <div className="min-h-24 text-sm">
          {lat ? (
            <div className="space-y-2" data-testid="la-bai-noi-dung" role="status">
              <p className="text-xs uppercase tracking-wider text-moon">{la.nhan}</p>
              <p className="text-lg leading-snug">{la.chu}</p>
              {la.phu && <p className="text-fg-muted">{la.phu}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={() => void chiaSe()} disabled={dangChiaSe} data-testid="la-bai-chia-se">
                  {daChep ? <Check aria-hidden /> : <Share2 aria-hidden />}{daChep ? "Đã chép" : "Chia sẻ lá bài"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void chep()} data-testid="la-bai-chep"><Copy aria-hidden /> Sao chép câu</Button>
              </div>
            </div>
          ) : (
            <p className="text-fg-muted">Một điều nhỏ của hôm nay đang úp — bấm lật để xem. Ngày mai sẽ là lá khác.</p>
          )}
        </div>
      </div>
    </section>
  );
}
