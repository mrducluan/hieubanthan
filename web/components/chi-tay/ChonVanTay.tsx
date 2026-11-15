"use client";
// Chỉ tay — người dùng TỰ SOI bàn tay mình, chọn hình vân giống tay mình (lọc theo chủ đề) → engine trả lời sách xưa theo
// khuôn SX-C. Khối này không đụng ảnh; chỉ gửi MÃ vân + MÃ lựa chọn từng cung (CT-2: người dùng chọn ở khối "Chụp lòng bàn
// tay" đầu trang) + ngày sinh trong hồ sơ trên máy (để biết đã đủ 18 tuổi — chưa rõ thì engine bỏ nhóm C). Lựa chọn nhớ trên
// máy (hbt.chi_tay.v1, lib/chi-tay-chon — dùng chung với khối chụp ảnh). Web chỉ hiển thị.
import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { anhVan, type VanTay } from "@/lib/chi-tay";
import { boHet, datVan, useChonChiTay } from "@/lib/chi-tay-chon";

/** Mỗi mục là một vân hoặc một cung (CT-2) — mục cung có thể không có tên Hán / ảnh. */
type MucKq = Pick<VanTay, "ma" | "ten" | "loi"> & { ten_han?: string; viec?: string };
type KetQua = { muc: MucKq[]; bo_nhom_c: number; cau_ket: string };

export function ChonVanTay({ van, chuDe }: { van: VanTay[]; chuDe: { ma: string; ten: string }[] }) {
  const hs = useHoSo();
  const [loc, setLoc] = useState<string | null>(null);
  const luu = useChonChiTay();
  const [kq, setKq] = useState<KetQua | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const chon = useMemo(() => { const ma = new Set(van.map((v) => v.ma)); return luu.van.filter((x) => ma.has(x)); }, [van, luu.van]);
  const cung = luu.cung;
  const soCung = Object.keys(cung).length;
  const khoaChon = JSON.stringify([chon, cung]);
  useEffect(() => { setKq(null); }, [khoaChon]);
  const ds = useMemo(() => van.filter((v) => !loc || v.chu_de === loc), [van, loc]);

  const bat = (ma: string) => datVan(chon.includes(ma) ? chon.filter((x) => x !== ma) : chon.length >= 30 ? chon : [...chon, ma]);

  const doc = async () => {
    if (!chon.length && !soCung) return;
    setDang(true); setLoi(null);
    try {
      const r = await fetch("/api/chi-tay/doc", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...(chon.length ? { van: chon } : {}), ...(soCung ? { cung } : {}), ...(hs ? { ngay_sinh: ngaySinhIso(hs) } : {}) }),
      });
      if (!r.ok) throw new Error();
      setKq((await r.json()) as KetQua);
      ghi("chart_interacted", { mo_dun: "chitay", kind: "doc_van", so_van: chon.length, so_cung: soCung });
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
        <p className="text-sm text-fg-muted" data-testid="chon-tom-tat">{chon.length || soCung
          ? `Đã chọn ${[chon.length ? `${chon.length} hình vân` : "", soCung ? `${soCung} cung trên ảnh tay` : ""].filter(Boolean).join(" và ")}.`
          : "Chạm vào hình vân giống tay bạn (chọn được nhiều)."}</p>
        {(chon.length > 0 || soCung > 0) && (
          <button type="button" onClick={() => { boHet(); setKq(null); }}
            className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-line px-3 text-sm">
            <X className="size-4" aria-hidden /> Bỏ chọn
          </button>
        )}
        <button type="button" onClick={doc} disabled={(!chon.length && !soCung) || dang} data-testid="doc-van-tay"
          className="ml-auto min-h-[44px] rounded-full bg-gold px-5 text-sm font-medium text-bg disabled:opacity-50">
          {dang ? "Đang đọc…" : "Xem sách xưa nói gì"}
        </button>
      </div>
      {loi && <p className="mt-3 text-sm text-amber-600" role="alert">{loi}</p>}
      {kq && (
        <section className="mt-6 space-y-4" aria-live="polite" data-testid="ket-qua-van-tay">
          <h3 className="text-xl">{soCung ? "Sách xưa nói gì về bàn tay bạn" : "Sách xưa nói gì về những vân bạn chọn"}</h3>
          {kq.muc.map((m, i) => (
            <article key={`${i}-${m.ma}`} className="rounded-2xl border border-line/70 p-4">
              <p className="font-medium text-fg">{m.ten} {m.ten_han && <span lang="zh-Hant" className="font-serif text-fg-muted">{m.ten_han}</span>}</p>
              <p className="mt-2 leading-relaxed">{m.loi}</p>
              {m.viec && <p className="mt-2 text-sm text-fg-muted"><span className="text-fg">Việc nên làm:</span> {m.viec}</p>}
            </article>
          ))}
          {kq.bo_nhom_c > 0 && (
            <p className="text-sm text-fg-muted">
              {hs ? `${kq.bo_nhom_c} mục bạn chọn có lời sách chỉ dành cho người từ 18 tuổi, nên không hiện ở đây.`
                : `${kq.bo_nhom_c} mục bạn chọn có lời sách chỉ hiện khi biết bạn đã đủ 18 tuổi — lưu hồ sơ (ngày sinh) để xem đủ.`}
            </p>
          )}
          {kq.cau_ket && <p className="text-sm text-fg-faint">{kq.cau_ket}</p>}
        </section>
      )}
    </div>
  );
}
