"use client";
// HTT-1 — "Điểm giao thoa từ điều bạn đã xác nhận" (docs/DANH-GIA-HYBRID-TWO-TIER.md mục 3.4). Nghe sự kiện `hbt-phieu`
// (KiemChung phát khi bấm Đúng / Chưa đúng, chỉ MÃ + kết quả), gom trong trang; đủ 2 hộp "Đúng với mình" → POST /api/giao-thoa
// → engine ghép tất định theo môn · mảng · mức của chính các mã ấy. Hộp giao thoa cũng có nút kiểm chứng (mã ds.giao_thoa.*).
// Dùng cho cả bản Việt (HopNoiBat) và bản Anh (`en`: chữ tiếng Anh, hộp gọn).
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { HopNoiBat } from "./HopNoiBat";
import type { Hop } from "./kieu";
import { ghi } from "@/lib/do-luong";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { cn } from "@/lib/utils";

export interface PhieuSuKien { loai: string; mau: string; phai: string; ket_qua: "dung" | "chua_dung" }

interface KetQua { du: boolean; so_dung: number; so_chua_dung: number; hop: Hop[]; tom_tat: string; cau_tu_soi: string; phai?: string;
  /** HTT-2 H5 — đoạn AI diễn đạt lại đúng các hộp bên dưới (chỉ khi công tắc quản trị bật và qua bộ kiểm). */
  van_ai?: string; dien_dat?: "ai" | "mau" }

const CHU = {
  vi: { tieu_de: "Điểm giao thoa từ điều bạn đã xác nhận", dan: "Ghép từ những hộp bạn vừa bấm \"Đúng với mình\" — không tính lại, không đổi mức nào.",
        cho: "Đang ghép…", tu_soi: "Tự hỏi", hoi: "Điểm giao thoa này có đúng với bạn?", dung: "Đúng với mình", chua_dung: "Chưa đúng", da_ghi: "Đã ghi" },
  en: { tieu_de: "Where the readings meet", dan: "Built only from the boxes you marked \"resonates with me\" — nothing recomputed, no level changed.",
        cho: "Weaving…", tu_soi: "Ask yourself", hoi: "Does this meeting point ring true for you?", dung: "Resonates with me", chua_dung: "Not quite me", da_ghi: "Saved" },
};

export function GiaoThoa({ en = false, className }: { en?: boolean; className?: string }) {
  const c = CHU[en ? "en" : "vi"];
  const [phieu, setPhieu] = useState<Record<string, "dung" | "chua_dung">>({});
  const [kq, setKq] = useState<KetQua | null>(null);
  const [cho, setCho] = useState(false);
  const daDo = useRef(false);
  useEffect(() => {
    const nghe = (e: Event) => {
      const d = (e as CustomEvent<PhieuSuKien>).detail;
      if (!d || d.loai !== "doi_song" || !d.mau || d.mau.startsWith("ds.giao_thoa.")) return;
      setPhieu((p) => (p[d.mau] === d.ket_qua ? p : { ...p, [d.mau]: d.ket_qua }));
    };
    window.addEventListener("hbt-phieu", nghe);
    return () => window.removeEventListener("hbt-phieu", nghe);
  }, []);
  const soDung = Object.values(phieu).filter((v) => v === "dung").length;
  const khoa = Object.entries(phieu).sort().map(([m, k]) => `${m}:${k}`).join(",");
  useEffect(() => {
    if (soDung < 2) return;
    const bo = new AbortController();
    const t = setTimeout(async () => {
      setCho(true);
      try {
        const r = await fetch("/api/giao-thoa", {
          method: "POST", headers: { "content-type": "application/json" }, signal: bo.signal,
          body: JSON.stringify({ phieu: Object.entries(phieu).map(([ma, ket_qua]) => ({ ma, ket_qua })), ngon_ngu: en ? "en" : "vi" }),
        });
        if (!r.ok) return;
        const d = (await r.json()) as KetQua;
        setKq(d);
        if (!daDo.current && d.hop?.length) {
          daDo.current = true;
          ghi("chart_interacted", { kind: "giao_thoa_hien", so_dung: d.so_dung, so_hop: d.hop.length, ngon_ngu: en ? "en" : "vi" });
        }
      } catch { /* mạng lỗi → không hiện, không báo */ } finally { setCho(false); }
    }, 700);
    return () => { clearTimeout(t); bo.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khoá gộp mọi phiếu
  }, [khoa, soDung, en]);

  if (soDung < 2 || (!kq && !cho)) return null;
  const hop = kq?.hop ?? [];
  if (!cho && hop.length === 0) return null;
  return (
    <section aria-labelledby="giao-thoa-td" data-testid="giao-thoa" data-so-dung={soDung}
      className={cn("mt-8 rounded-2xl border border-gold/40 bg-gold/5 p-5", className)}>
      <p className="eyebrow flex items-center gap-1.5"><Sparkles className="size-3.5" aria-hidden /> {en ? "Tier 2" : "Lớp 2"}</p>
      <h3 id="giao-thoa-td" className="mt-1 font-serif text-2xl">{c.tieu_de}</h3>
      <p className="mt-1 text-sm text-fg-muted">{c.dan}</p>
      {cho && hop.length === 0 && <p className="mt-3 animate-pulse text-sm text-fg-faint" role="status">{c.cho}</p>}
      {kq?.tom_tat && hop.length > 0 && <p className="mt-3 text-sm text-fg" data-testid="giao-thoa-tom-tat">{kq.tom_tat}</p>}
      {kq?.van_ai && hop.length > 0 && (
        <div className="mt-3 rounded-xl border border-line/60 bg-bg-2/50 p-3" data-testid="giao-thoa-van-ai">
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-fg">{kq.van_ai}</p>
          <p className="mt-1.5 text-xs text-fg-faint">{en ? "Phrased automatically from the boxes below." : "Diễn đạt tự động từ các hộp bên dưới — không thêm dữ kiện."}</p>
        </div>
      )}
      {hop.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {hop.map((h) => en ? <HopGiaoThoaEn key={h.ma_mau ?? h.tieu_de} h={h} c={c} phai={kq?.phai ?? "giao_thoa_1"} />
            : <HopNoiBat key={h.ma_mau ?? h.tieu_de} hop={h} />)}
        </div>
      )}
      {kq?.cau_tu_soi && hop.length > 0 && (
        <p className="mt-4 rounded-xl border border-gold/30 bg-bg/40 px-4 py-2 text-sm"><span className="text-fg-faint">{c.tu_soi}: </span>{kq.cau_tu_soi}</p>
      )}
    </section>
  );
}

function HopGiaoThoaEn({ h, c, phai }: { h: Hop; c: typeof CHU.en; phai: string }) {
  return (
    <div className="rounded-xl border border-line/60 bg-bg/40 p-4" data-testid="hop-giao-thoa-en" data-ma={h.ma_mau}>
      <h4 className="font-medium text-fg">{h.tieu_de}</h4>
      <p className="mt-1 text-sm text-fg-muted">{h.noi_dung}</p>
      {h.huong_xu_ly && <p className="mt-2 text-sm text-fg"><span className="text-fg-faint">Try: </span>{h.huong_xu_ly}</p>}
      {h.ma_mau && <KiemChung loai="doi_song" mau={h.ma_mau} phai={h.phai ?? phai} ngonNgu="en"
        nhan={{ hoi: c.hoi, dung: c.dung, chua_dung: c.chua_dung, da_ghi: c.da_ghi }} />}
    </div>
  );
}
