"use client";
// TK-2 — tự soi bàn tay theo chỉ tay phương Tây (Cheiro 1894, Benham 1900): người dùng tự nhìn tay mình, chọn dáng tay, mức gò,
// dáng đường chỉ → `/api/chi-tay/doc` (`phai: "tay"`) → lời Việt + nguyên văn tiếng Anh (gập). Không ảnh, không ngày sinh: lớp
// này không có câu nào về sống lâu / bệnh / phẩm hạnh. Lựa chọn (chỉ MÃ) nhớ trên máy `hbt.chi_tay_tay.v1`. Web chỉ hiển thị.
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";
import type { KinhDienTay, MucTay, ThuVienChiTayTay } from "@/lib/chi-tay";

const KHOA = "hbt.chi_tay_tay.v1";
const MA = /^[a-z_]{2,20}$/;
interface Chon { dang: string | null; go: Record<string, string>; duong: Record<string, string> }
const RONG: Chon = { dang: null, go: {}, duong: {} };

function docMay(): Chon {
  try {
    const v = JSON.parse(localStorage.getItem(KHOA) ?? "null") as Partial<Chon> | null;
    if (!v || typeof v !== "object") return RONG;
    const loc = (x: unknown) => Object.fromEntries(Object.entries((x && typeof x === "object" ? x : {}) as Record<string, unknown>)
      .filter(([k, g]) => MA.test(k) && typeof g === "string" && MA.test(g)).slice(0, 8)) as Record<string, string>;
    return { dang: typeof v.dang === "string" && MA.test(v.dang) ? v.dang : null, go: loc(v.go), duong: loc(v.duong) };
  } catch { return RONG; }
}

/** Một mục kết quả / thư viện: lời Việt, việc nên làm, nguyên văn gập. */
export function MucTayView({ m, nho = false }: { m: MucTay; nho?: boolean }) {
  return (
    <div className={nho ? "text-sm" : ""}>
      <p className="leading-relaxed">{m.loi}</p>
      {m.viec && <p className="mt-1 text-sm text-fg-muted"><span className="text-fg">Việc nên làm:</span> {m.viec}</p>}
      {m.trich && (
        <details className="mt-1.5 text-xs text-fg-muted">
          <summary className="cursor-pointer">Nguyên văn</summary>
          <p lang="en" className="mt-1 italic">“{m.trich}”</p>
          {m.nguon_hien_thi && <p className="mt-0.5">— {m.nguon_hien_thi}</p>}
        </details>
      )}
    </div>
  );
}

/** RS-3 — dưới mục đường / gò: hai mặt theo sách kinh điển (lời Việt trước), câu tiếng Anh gập. */
function KinhDienView({ k }: { k: KinhDienTay }) {
  return (
    <div className="mt-3 rounded-xl border border-line/60 bg-surface/40 p-3 text-sm" data-testid="ct-tay-kinh-dien">
      <p className="text-xs uppercase tracking-wide text-fg-faint">Sách kinh điển nói thêm về {k.ten}</p>
      <p className="mt-1.5 leading-relaxed"><span className="text-fg">Mặt mạnh:</span> {k.mat_tich_cuc}</p>
      <p className="mt-1 leading-relaxed text-fg-muted">{k.mat_tieu_cuc_can_chu_y}</p>
      {k.trich && (
        <details className="mt-1.5 text-xs text-fg-muted">
          <summary className="cursor-pointer">Nguyên văn</summary>
          <p lang="en" className="mt-1 italic">“{k.trich}”</p>
          {k.nguon && <p className="mt-0.5">— {k.nguon}</p>}
        </details>
      )}
    </div>
  );
}

const nut = (co: boolean) => cn("min-h-[40px] rounded-full border px-3 text-sm",
  co ? "border-gold/60 bg-gold/10 text-fg" : "border-line text-fg-muted hover:border-gold/40");

export function ChonChiTayTay({ tv }: { tv: ThuVienChiTayTay }) {
  const [chon, setChon] = useState<Chon>(RONG);
  const [kq, setKq] = useState<{ muc: MucTay[]; cau_ket: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const tieuDe = useRef<HTMLHeadingElement>(null);
  useEffect(() => { setChon(docMay()); }, []);
  const doi = (moi: Chon) => {
    setChon(moi); setKq(null);
    try { localStorage.setItem(KHOA, JSON.stringify(moi)); } catch { /* chế độ riêng tư */ }
  };
  const so = (chon.dang ? 1 : 0) + Object.keys(chon.go).length + Object.keys(chon.duong).length;
  const hopLe = useMemo(() => ({
    dang: new Set(tv.dang_tay.lua_chon.map((x) => x.ma)), go: new Set(tv.go.muc.map((g) => g.ma)),
  }), [tv]);

  const doc = async () => {
    if (!so) return;
    setDang(true); setLoi(null);
    try {
      const body = {
        phai: "tay",
        ...(chon.dang && hopLe.dang.has(chon.dang) ? { dang_tay: chon.dang } : {}),
        ...(Object.keys(chon.go).length ? { go: chon.go } : {}),
        ...(Object.keys(chon.duong).length ? { duong: chon.duong } : {}),
      };
      const r = await fetch("/api/chi-tay/doc", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
      setKq((await r.json()) as { muc: MucTay[]; cau_ket: string });
      ghi("chart_interacted", { mo_dun: "chitay", kind: "doc_tay", so_go: Object.keys(chon.go).length, so_duong: Object.keys(chon.duong).length, co_dang: chon.dang ? 1 : 0 });
      requestAnimationFrame(() => tieuDe.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
    } catch { setLoi("Máy chủ đang bận, bạn thử lại sau ít phút."); }
    finally { setDang(false); }
  };

  return (
    <div data-testid="chon-chi-tay-tay">
      <div className="space-y-8">
        <fieldset>
          <legend className="text-lg text-fg">1. {tv.dang_tay.cau}</legend>
          <p className="mt-1 text-sm text-fg-muted">{tv.dang_tay.gioi_thieu}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {tv.dang_tay.lua_chon.map((d) => {
              const co = chon.dang === d.ma;
              return (
                <button key={d.ma} type="button" aria-pressed={co} data-testid="ct-tay-dang" data-ma={d.ma}
                  onClick={() => doi({ ...chon, dang: co ? null : d.ma })}
                  className={cn("rounded-2xl border p-3 text-left", co ? "border-gold bg-gold/10" : "border-line/70 hover:border-gold/40")}>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-fg">{co && <Check className="size-4" aria-hidden />}{d.ten}</span>
                  <span className="mt-0.5 block text-xs text-fg-muted">{d.mo_ta}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-lg text-fg">2. {tv.go.cau}</legend>
          <p className="mt-1 text-sm text-fg-muted">{tv.go.gioi_thieu}</p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {tv.go.muc.map((g) => (
              <li key={g.ma} className="rounded-2xl border border-line/70 p-3">
                <p className="text-sm font-medium text-fg">{g.ten}</p>
                <p className="mt-0.5 text-xs text-fg-muted">{g.vi_tri}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tv.go.lua_chon.map((l) => {
                    const co = chon.go[g.ma] === l.ma;
                    const { [g.ma]: _bo, ...con } = chon.go;
                    return (
                      <button key={l.ma} type="button" aria-pressed={co} data-testid="ct-tay-go" data-go={g.ma} data-ma={l.ma}
                        onClick={() => doi({ ...chon, go: co ? con : { ...con, [g.ma]: l.ma } })} className={nut(co)}>
                        {co && <Check className="mr-1 inline size-3.5" aria-hidden />}{l.ten}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend className="text-lg text-fg">3. Các đường chỉ trên tay bạn</legend>
          {tv.luu_y_do_dai && (
            <div className="mt-2 rounded-2xl border border-jade/40 bg-jade/[0.05] p-3 text-sm" data-testid="ct-tay-luu-y">
              <p className="font-medium text-fg">{tv.luu_y_do_dai.ten}</p>
              <MucTayView m={tv.luu_y_do_dai} nho />
            </div>
          )}
          <div className="mt-3 space-y-4">
            {tv.duong.map((du) => (
              <div key={du.ma} className="rounded-2xl border border-line/70 p-3">
                <p className="text-sm font-medium text-fg">{du.ten}</p>
                <p className="mt-0.5 text-xs text-fg-muted">{du.vi_tri}</p>
                {du.cau.map((c) => (
                  <div key={c.ma} className="mt-2.5" role="group" aria-label={c.ten}>
                    <p className="text-sm text-fg">{c.ten}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {c.lua_chon.map((l) => {
                        const lc = l.ma.slice(c.ma.length + 1);
                        const co = chon.duong[c.ma] === lc;
                        const { [c.ma]: _bo, ...con } = chon.duong;
                        return (
                          <button key={l.ma} type="button" aria-pressed={co} data-testid="ct-tay-duong" data-cau={c.ma} data-ma={lc}
                            onClick={() => doi({ ...chon, duong: co ? con : { ...con, [c.ma]: lc } })} className={nut(co)}>
                            {co && <Check className="mr-1 inline size-3.5" aria-hidden />}{l.ten}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-bg/95 p-3 backdrop-blur md:bottom-3">
        <p className="text-sm text-fg-muted" data-testid="ct-tay-tom-tat">{so ? `Đã chọn ${so} điều về bàn tay.` : "Chọn dáng tay, gò hoặc đường chỉ giống tay bạn."}</p>
        {so > 0 && (
          <button type="button" onClick={() => doi(RONG)} className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-line px-3 text-sm">
            <X className="size-4" aria-hidden /> Bỏ chọn
          </button>
        )}
        <button type="button" onClick={doc} disabled={!so || dang} data-testid="ct-tay-doc"
          className="ml-auto min-h-[44px] rounded-full bg-gold px-5 text-sm font-medium text-bg disabled:opacity-50">
          {dang ? "Đang đọc…" : "Xem sách nói gì"}
        </button>
      </div>
      {loi && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-amber-600" role="alert">
          <span>{loi}</span>
          <button type="button" onClick={doc} className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-line px-3 text-fg">
            <RotateCcw className="size-4" aria-hidden /> Thử lại
          </button>
        </div>
      )}
      {kq && (
        <section className="mt-6 space-y-4 scroll-mt-24" aria-live="polite" data-testid="ct-tay-ket-qua">
          <h3 ref={tieuDe} className="text-xl">Sách chỉ tay phương Tây nói gì về bàn tay bạn</h3>
          {kq.muc.map((m) => (
            <article key={m.ma} className="rounded-2xl border border-line/70 p-4" data-testid="ct-tay-muc">
              <p className="font-medium text-fg">{m.ten}</p>
              <div className="mt-2"><MucTayView m={m} /></div>
              {m.kinh_dien && <KinhDienView k={m.kinh_dien} />}
            </article>
          ))}
          {kq.cau_ket && <p className="text-sm text-fg-faint">{kq.cau_ket}</p>}
        </section>
      )}
    </div>
  );
}
