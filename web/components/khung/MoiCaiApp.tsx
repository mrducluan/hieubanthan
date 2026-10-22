"use client";
// KC-4 GĐ2 — mời "Cài Hiểu Bản Thân lên màn hình chính" ĐÚNG LÚC, không mời khi vừa vào trang:
//   (a) đã ghé Hôm nay ít nhất 2 ngày khác nhau trong 7 ngày, hoặc (b) đã có mốc "Nhắc tôi".
// Android / máy tính Chrome-Edge: nút cài một chạm (sự kiện beforeinstallprompt). iPhone/iPad Safari: hướng dẫn 2 bước
// (Web Push trên iPhone chỉ chạy khi đã cài). Đã cài (mở ở chế độ app) → không hiện. Đóng → 30 ngày sau mới mời lại.
// Chỉ lưu trên máy: ngày ghé (tối đa 7 ngày gần nhất) + ngày đóng. Đo chart_interacted{kind=pwa_*}.
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { useNhacViec } from "@/lib/nhac-viec";
import { laIos } from "@/lib/web-push-trinh-duyet";
import { dangChayApp } from "@/lib/che-do-app";

const KHOA = "hbt.cai_app.v1";
interface TrangThai { ghe: string[]; dong?: string }
type SuKienCai = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let suKienCai: SuKienCai | null = null;     // giữ qua các lần dựng component (sự kiện chỉ bắn một lần mỗi lượt tải trang)
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); suKienCai = e as SuKienCai; });
  window.addEventListener("appinstalled", () => { suKienCai = null; ghi("chart_interacted", { kind: "pwa_da_cai" }); });
}

function doc(): TrangThai {
  try { const j = JSON.parse(localStorage.getItem(KHOA) ?? "null"); return j && Array.isArray(j.ghe) ? j : { ghe: [] }; } catch { return { ghe: [] }; }
}
function luu(t: TrangThai) { try { localStorage.setItem(KHOA, JSON.stringify(t)); } catch { /* riêng tư */ } }
const homNay = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
const cachNgay = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);

/** Ghi một ngày ghé, trả có nên mời không (thuần — test được). */
export function nenMoi(t: TrangThai, hom: string, coMoc: boolean): boolean {
  if (t.dong && cachNgay(hom, t.dong) < 30) return false;
  const gan = t.ghe.filter((d) => cachNgay(hom, d) < 7);
  return coMoc || new Set(gan).size >= 2;
}

export function MoiCaiApp({ noi }: { noi: string }) {
  const coMoc = useNhacViec().length > 0;
  const [hien, setHien] = useState<"nut" | "ios" | null>(null);
  useEffect(() => {
    if (dangChayApp()) return;
    const hom = homNay();
    const t = doc();
    const ghe = [...new Set([...t.ghe, hom])].filter((d) => cachNgay(hom, d) < 7).sort().slice(-7);
    luu({ ...t, ghe });
    if (!nenMoi({ ...t, ghe }, hom, coMoc)) return;
    const chon = () => {
      if (suKienCai) setHien("nut");
      else if (laIos()) setHien("ios");
    };
    chon();
    // beforeinstallprompt có thể đến sau khi trang đã dựng
    const nghe = () => setTimeout(chon, 0);
    window.addEventListener("beforeinstallprompt", nghe);
    return () => window.removeEventListener("beforeinstallprompt", nghe);
  }, [coMoc]);
  useEffect(() => { if (hien) ghi("chart_interacted", { kind: "pwa_moi", noi, cach: hien }); }, [hien, noi]);
  if (!hien) return null;

  const dong = () => { luu({ ...doc(), dong: homNay() }); setHien(null); ghi("chart_interacted", { kind: "pwa_dong", noi }); };
  const cai = async () => {
    const e = suKienCai;
    if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    ghi("chart_interacted", { kind: outcome === "accepted" ? "pwa_cai" : "pwa_tu_choi", noi });
    suKienCai = null;
    setHien(null);
  };
  return (
    <section className="glass relative space-y-2 rounded-2xl p-5" data-testid="moi-cai-app" data-cach={hien}>
      <button type="button" aria-label="Để sau" onClick={dong} className="absolute right-3 top-3 text-fg-faint hover:text-fg"><X className="size-4" /></button>
      <h2 className="pr-6 text-lg">Mở Hiểu Bản Thân nhanh hơn mỗi sáng</h2>
      <p className="text-sm text-fg-muted">Cài lên màn hình chính: mở một chạm vào Hôm nay, toàn màn hình, nhận nhắc mốc đúng ngày. Không tốn dung lượng như ứng dụng tải về.</p>
      {hien === "nut" ? (
        <button type="button" onClick={() => void cai()} className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 px-3 py-1 text-sm text-gold hover:bg-gold/10">
          <Download className="size-4" aria-hidden /> Cài lên màn hình chính</button>
      ) : (
        <ol className="list-decimal space-y-0.5 pl-5 text-sm text-fg-muted">
          <li>Trong Safari, bấm nút Chia sẻ <Share className="inline size-3.5" aria-label="Chia sẻ" /> ở thanh dưới.</li>
          <li>Chọn <b>Thêm vào màn hình chính</b> → <b>Thêm</b>.</li>
        </ol>
      )}
    </section>
  );
}
