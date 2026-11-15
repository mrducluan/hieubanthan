"use client";
// Chỉ tay — người dùng TỰ SOI bàn tay mình, chọn hình vân giống tay mình (lọc theo chủ đề) → engine trả lời sách xưa theo
// khuôn SX-C. Không chụp, không tải ảnh tay; chỉ gửi MÃ vân + ngày sinh trong hồ sơ trên máy (để biết đã đủ 18 tuổi — chưa rõ
// thì engine bỏ nhóm C). Lựa chọn nhớ trên máy (hbt.chi_tay.v1). Web chỉ hiển thị.
import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { anhVan, KHOA_CHI_TAY, type VanTay } from "@/lib/chi-tay";

type KetQua = { muc: VanTay[]; bo_nhom_c: number; cau_ket: string };

function docNho(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KHOA_CHI_TAY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 30) : [];
  } catch { return []; }
}

export function ChonVanTay({ van, chuDe }: { van: VanTay[]; chuDe: { ma: string; ten: string }[] }) {
  const hs = useHoSo();
  const [loc, setLoc] = useState<string | null>(null);
  const [chon, setChon] = useState<string[]>([]);
  const [kq, setKq] = useState<KetQua | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => { const ma = new Set(van.map((v) => v.ma)); setChon(docNho().filter((x) => ma.has(x))); }, [van]);
  const ds = useMemo(() => van.filter((v) => !loc || v.chu_de === loc), [van, loc]);

  const bat = (ma: string) => setChon((c) => {
    const moi = c.includes(ma) ? c.filter((x) => x !== ma) : c.length >= 30 ? c : [...c, ma];
    try { localStorage.setItem(KHOA_CHI_TAY, JSON.stringify(moi)); } catch { /* chế độ riêng tư */ }
    setKq(null);
    return moi;
  });

  const doc = async () => {
    if (!chon.length) return;
    setDang(true); setLoi(null);
    try {
      const r = await fetch("/api/chi-tay/doc", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ van: chon, ...(hs ? { ngay_sinh: ngaySinhIso(hs) } : {}) }),
      });
      if (!r.ok) throw new Error();
      setKq((await r.json()) as KetQua);
      ghi("chart_interacted", { mo_dun: "chitay", kind: "doc_van", so_van: chon.length });
    } catch { setLoi("Máy chủ đang bận, bạn thử lại sau ít phút."); }
    finally { setDang(false); }
  };

  return (
    <div data-testid="chon-van-tay">
      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo chủ đề">
        {[{ ma: null as string | null, ten: "Tất cả" }, ...chuDe].map((c) => (
          <button key={c.ma ?? "tat-ca"} type="button" onClick={() => setLoc(c.ma)} aria-pressed={loc === c.ma}
            className={cn("min-h-[36px] rounded-full border px-3 text-xs", loc === c.ma ? "border-gold/60 bg-gold/10 text-fg" : "border-line text-fg-muted")}>
            {c.ten}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {ds.map((v) => {
          const co = chon.includes(v.ma);
          return (
            <li key={v.ma}>
              <button type="button" onClick={() => bat(v.ma)} aria-pressed={co} data-testid="nut-van" data-ma={v.ma}
                className={cn("relative block w-full overflow-hidden rounded-xl border bg-[#e9dcc0] text-left transition-colors",
                  co ? "border-gold ring-2 ring-gold/50" : "border-line/70 hover:border-gold/50")}>
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh bản khắc tự phục vụ */}
                <img src={anhVan(v.anh)} width={v.rong} height={v.cao} alt={`Hình ${v.ten_han} (${v.ten}) trong sách`} loading="lazy"
                  className="aspect-[2/5] w-full object-cover object-top" draggable={false} />
                <span className="block bg-bg/90 px-1.5 py-1 text-[0.72rem] leading-tight text-fg">{v.ten}</span>
                {co && <span className="absolute right-1 top-1 rounded-full bg-gold p-0.5 text-bg"><Check className="size-3.5" aria-hidden /></span>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-3 z-10 mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-bg/95 p-3 backdrop-blur">
        <p className="text-sm text-fg-muted">{chon.length ? `Đã chọn ${chon.length} hình vân giống tay bạn.` : "Chạm vào hình vân giống tay bạn (chọn được nhiều)."}</p>
        {chon.length > 0 && (
          <button type="button" onClick={() => { setChon([]); setKq(null); try { localStorage.removeItem(KHOA_CHI_TAY); } catch { /* bỏ qua */ } }}
            className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-line px-3 text-sm">
            <X className="size-4" aria-hidden /> Bỏ chọn
          </button>
        )}
        <button type="button" onClick={doc} disabled={!chon.length || dang} data-testid="doc-van-tay"
          className="ml-auto min-h-[44px] rounded-full bg-gold px-5 text-sm font-medium text-bg disabled:opacity-50">
          {dang ? "Đang đọc…" : "Xem sách xưa nói gì"}
        </button>
      </div>
      {loi && <p className="mt-3 text-sm text-amber-600" role="alert">{loi}</p>}
      {kq && (
        <section className="mt-6 space-y-4" aria-live="polite" data-testid="ket-qua-van-tay">
          <h3 className="text-xl">Sách xưa nói gì về những vân bạn chọn</h3>
          {kq.muc.map((m) => (
            <article key={m.ma} className="rounded-2xl border border-line/70 p-4">
              <p className="font-medium text-fg">{m.ten} <span lang="zh-Hant" className="font-serif text-fg-muted">{m.ten_han}</span></p>
              <p className="mt-2 leading-relaxed">{m.loi}</p>
              {m.viec && <p className="mt-2 text-sm text-fg-muted"><span className="text-fg">Việc nên làm:</span> {m.viec}</p>}
            </article>
          ))}
          {kq.bo_nhom_c > 0 && (
            <p className="text-sm text-fg-muted">
              {hs ? `${kq.bo_nhom_c} hình vân bạn chọn có lời sách chỉ dành cho người từ 18 tuổi, nên không hiện ở đây.`
                : `${kq.bo_nhom_c} hình vân bạn chọn có lời sách chỉ hiện khi biết bạn đã đủ 18 tuổi — lưu hồ sơ (ngày sinh) để xem đủ.`}
            </p>
          )}
          {kq.cau_ket && <p className="text-sm text-fg-faint">{kq.cau_ket}</p>}
        </section>
      )}
    </div>
  );
}
