"use client";
// Chỉ tay — người dùng TỰ SOI bàn tay mình, chọn hình vân giống tay mình (lọc theo chủ đề) → engine trả lời sách xưa theo
// khuôn SX-C. Khối này không đụng ảnh; chỉ gửi MÃ vân + MÃ lựa chọn từng cung (CT-2: người dùng chọn ở khối "Chụp lòng bàn
// tay" đầu trang) + ngày sinh trong hồ sơ trên máy (để biết đã đủ 18 tuổi — chưa rõ thì engine bỏ nhóm C). Lựa chọn nhớ trên
// máy (hbt.chi_tay.v1, lib/chi-tay-chon — dùng chung với khối chụp ảnh). Web chỉ hiển thị.
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Maximize2, RotateCcw, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { anhVan, type DuongChi, type VanTay } from "@/lib/chi-tay";
import { boHet, datDuong, datVan, useChonChiTay } from "@/lib/chi-tay-chon";

/** Mỗi mục là một vân hoặc một cung (CT-2) — mục cung có thể không có tên Hán / ảnh. */
type MucKq = Pick<VanTay, "ma" | "loi"> & { ten?: string; ten_han?: string; viec?: string; cung?: string; cau?: string };
/** `muc` = vân; `muc_cung` = câu sách theo lựa chọn từng cung (CT-2, có `cung` = mã cung). */
type KetQua = { muc: MucKq[]; muc_cung?: MucKq[]; muc_duong?: MucKq[]; bo_nhom_c: number; cau_ket: string };

export function ChonVanTay({ van, chuDe, tenCung = {}, duongChi }: { van: VanTay[]; chuDe: { ma: string; ten: string }[]; tenCung?: Record<string, string>; duongChi?: DuongChi }) {
  const hs = useHoSo();
  const [loc, setLoc] = useState<string | null>(null);
  const luu = useChonChiTay();
  const [kq, setKq] = useState<KetQua | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [phong, setPhong] = useState<VanTay | null>(null);
  const tieuDeKq = useRef<HTMLHeadingElement>(null);
  const cuonToi = useRef(false);

  const chon = useMemo(() => { const ma = new Set(van.map((v) => v.ma)); return luu.van.filter((x) => ma.has(x)); }, [van, luu.van]);
  const cung = luu.cung;
  const soCung = Object.keys(cung).length;
  const duong = luu.duong;
  const soDuong = Object.keys(duong).length;
  const tenCau = useMemo(() => Object.fromEntries((duongChi?.cau ?? []).map((c) => [c.ma, c.ten])), [duongChi]);
  const khoaChon = JSON.stringify([chon, cung, duong]);
  // Lựa chọn đổi khi đang chờ máy chủ → bỏ kết quả cũ về muộn (so khoá lựa chọn lúc gửi với khoá hiện tại).
  const khoaHienTai = useRef(khoaChon);
  useEffect(() => { khoaHienTai.current = khoaChon; setKq(null); }, [khoaChon]);
  const ds = useMemo(() => van.filter((v) => !loc || v.chu_de === loc), [van, loc]);
  // Kết quả về → cuộn tới và đặt tiêu điểm vào tiêu đề (người dùng thấy ngay, trình đọc màn hình đọc từ đó); giảm chuyển động → nhảy.
  useEffect(() => {
    if (!kq || !cuonToi.current || !tieuDeKq.current) return;
    cuonToi.current = false;
    const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    tieuDeKq.current.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "start" });
    tieuDeKq.current.focus({ preventScroll: true });
  }, [kq]);

  const bat = (ma: string) => datVan(chon.includes(ma) ? chon.filter((x) => x !== ma) : chon.length >= 30 ? chon : [...chon, ma]);

  const doc = async () => {
    if (!chon.length && !soCung && !soDuong) return;
    setDang(true); setLoi(null);
    const khoaGui = khoaChon;
    try {
      const r = await fetch("/api/chi-tay/doc", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...(chon.length ? { van: chon } : {}), ...(soCung ? { cung } : {}), ...(soDuong ? { duong } : {}), ...(hs ? { ngay_sinh: ngaySinhIso(hs) } : {}) }),
      });
      if (!r.ok) throw new Error();
      const j = (await r.json()) as KetQua;
      if (khoaGui !== khoaHienTai.current) return;
      setKq(j);
      cuonToi.current = true;
      ghi("chart_interacted", { mo_dun: "chitay", kind: "doc_van", so_van: chon.length, so_cung: soCung, so_duong: soDuong });
    } catch { setLoi("Máy chủ đang bận, bạn thử lại sau ít phút."); }
    finally { setDang(false); }
  };

  return (
    <div data-testid="chon-van-tay">
      {duongChi && duongChi.cau.length > 0 && (
        <div className="mb-8 rounded-2xl border border-line/70 p-4" data-testid="duong-chi">
          <h3 className="text-lg">Ba đường chỉ lớn của bạn</h3>
          <p className="mt-1 text-sm text-fg-muted">{duongChi.gioi_thieu}</p>
          <div className="mt-3 space-y-3">
            {duongChi.cau.map((c) => (
              <fieldset key={c.ma}>
                <legend className="text-sm text-fg">{c.ten}</legend>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {c.lua_chon.map((l) => {
                    const co = duong[c.ma] === l.ma;
                    return (
                      <button key={l.ma} type="button" aria-pressed={co} data-testid="nut-duong" data-cau={c.ma} data-ma={l.ma}
                        onClick={() => datDuong(c.ma, co ? null : l.ma)}
                        className={cn("min-h-[40px] rounded-full border px-3 text-sm", co ? "border-gold/60 bg-gold/10 text-fg" : "border-line text-fg-muted hover:border-gold/40")}>
                        {co && <Check className="mr-1 inline size-3.5" aria-hidden />}{l.ten}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <p className="mt-3 text-xs text-fg-faint">Máy không tự dò đường chỉ trên ảnh — bạn tự nhìn tay mình rồi chọn.</p>
        </div>
      )}
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
            <li key={v.ma} className="relative">
              <button type="button" onClick={() => bat(v.ma)} aria-pressed={co} data-testid="nut-van" data-ma={v.ma}
                className={cn("relative block w-full overflow-hidden rounded-xl border bg-[#e9dcc0] text-left transition-colors",
                  co ? "border-gold ring-2 ring-gold/50" : "border-line/70 hover:border-gold/50")}>
                {/* Chỉ phần lòng bàn tay (nửa dưới hình khắc) — dải chữ tên ở đầu hình đã in ở dưới thẻ. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh bản khắc tự phục vụ */}
                <img src={anhVan(v.anh)} width={v.rong} height={v.cao} alt={`Hình ${v.ten_han} (${v.ten}) trong sách`} loading="lazy"
                  className="aspect-[3/4] w-full object-cover object-bottom" draggable={false} />
                <span className="block bg-bg/90 px-1.5 py-1 text-[0.72rem] leading-tight text-fg">{v.ten}</span>
                {co && <span className="absolute right-1 top-1 rounded-full bg-gold p-0.5 text-bg"><Check className="size-3.5" aria-hidden /></span>}
              </button>
              <button type="button" onClick={() => setPhong(v)} aria-label={`Phóng to hình ${v.ten}`} data-testid="phong-van" data-ma={v.ma}
                className="absolute left-0 top-0 grid size-10 place-items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
                <span className="grid size-7 place-items-center rounded-full bg-bg/80 text-fg shadow"><Maximize2 className="size-3.5" aria-hidden /></span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mt-5 md:bottom-3 flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-bg/95 p-3 backdrop-blur">
        <p className="text-sm text-fg-muted" data-testid="chon-tom-tat">{chon.length || soCung || soDuong
          ? `Đã chọn ${[chon.length ? `${chon.length} hình vân` : "", soCung ? `${soCung} cung trên ảnh tay` : "", soDuong ? `${soDuong} điều về đường chỉ` : ""].filter(Boolean).join(", ")}.`
          : "Chạm vào hình vân giống tay bạn (chọn được nhiều)."}</p>
        {(chon.length > 0 || soCung > 0 || soDuong > 0) && (
          <button type="button" onClick={() => { boHet(); setKq(null); }}
            className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-line px-3 text-sm">
            <X className="size-4" aria-hidden /> Bỏ chọn
          </button>
        )}
        <button type="button" onClick={doc} disabled={(!chon.length && !soCung && !soDuong) || dang} data-testid="doc-van-tay"
          className="ml-auto min-h-[44px] rounded-full bg-gold px-5 text-sm font-medium text-bg disabled:opacity-50">
          {dang ? "Đang đọc…" : "Xem sách xưa nói gì"}
        </button>
        {kq && <a href="#ket-qua-chi-tay" className="w-full text-xs text-gold underline underline-offset-2" data-testid="co-ket-qua">Đã có kết quả — xem bên dưới ↓</a>}
      </div>
      {loi && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-amber-600" role="alert">
          <span>{loi}</span>
          <button type="button" onClick={doc} disabled={dang} className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-line px-3 text-fg" data-testid="doc-thu-lai">
            <RotateCcw className="size-4" aria-hidden /> Thử lại
          </button>
        </div>
      )}
      {kq && (
        <section id="ket-qua-chi-tay" className="mt-6 scroll-mt-24 space-y-4" aria-live="polite" data-testid="ket-qua-van-tay">
          <h3 ref={tieuDeKq} tabIndex={-1} className="text-xl outline-none">{soCung || soDuong ? "Sách xưa nói gì về bàn tay bạn" : "Sách xưa nói gì về những vân bạn chọn"}</h3>
          {[...(kq.muc_duong ?? []), ...(kq.muc_cung ?? []), ...kq.muc].map((m, i) => (
            <article key={`${i}-${m.ma}`} className="rounded-2xl border border-line/70 p-4" data-testid={m.cau ? "kq-duong" : m.cung ? "kq-cung" : "kq-van"}>
              <p className="font-medium text-fg">{m.ten ?? (m.cau ? tenCau[m.cau] ?? "Đường chỉ" : m.cung ? tenCung[m.cung] ?? `Cung ${m.cung}` : m.ma)}{" "}
                {m.ten_han && <span lang="zh-Hant" className="font-serif text-fg-muted">{m.ten_han}</span>}</p>
              <p className="mt-2 leading-relaxed">{m.loi}</p>
              {m.viec && <p className="mt-2 text-sm text-fg-muted"><span className="text-fg">Việc nên làm:</span> {m.viec}</p>}
            </article>
          ))}
          {!kq.muc.length && !kq.muc_cung?.length && !kq.muc_duong?.length && kq.bo_nhom_c === 0 && (
            <p className="text-sm text-fg-muted">Sách không có câu riêng cho những lựa chọn này (vd “bình thường”). Thử chọn thêm hình vân giống tay bạn.</p>
          )}
          {kq.bo_nhom_c > 0 && (
            <p className="text-sm text-fg-muted">
              {hs ? `${kq.bo_nhom_c} mục bạn chọn có lời sách chỉ dành cho người từ 18 tuổi, nên không hiện ở đây.`
                : `${kq.bo_nhom_c} mục bạn chọn có lời sách chỉ hiện khi biết bạn đã đủ 18 tuổi — lưu hồ sơ (ngày sinh) để xem đủ.`}
            </p>
          )}
          {kq.cau_ket && <p className="text-sm text-fg-faint">{kq.cau_ket}</p>}
        </section>
      )}
      <Sheet open={phong !== null} onOpenChange={(o) => { if (!o) setPhong(null); }}>
        {phong && (
          <SheetContent title={phong.ten} description={`${phong.ten_han} · hình khắc trong sách`} data-testid="phong-van-hop">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh bản khắc tự phục vụ */}
            <img src={anhVan(phong.anh)} width={phong.rong} height={phong.cao} alt={`Hình ${phong.ten_han} (${phong.ten}) trong sách`}
              className="mx-auto max-h-[55dvh] w-auto rounded-xl bg-[#e9dcc0] object-contain" />
            <p className="mt-4 leading-relaxed">{phong.nhom === "C" ? "Hàm ý theo ghi chép xưa: " : ""}{phong.y}{phong.ham_y ? ` ${phong.ham_y}` : ""}</p>
            <button type="button" onClick={() => bat(phong.ma)} aria-pressed={chon.includes(phong.ma)} data-testid="phong-van-chon"
              className={cn("mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium",
                chon.includes(phong.ma) ? "border-gold bg-gold text-bg" : "border-gold/60 text-fg")}>
              {chon.includes(phong.ma) && <Check className="size-4" aria-hidden />} Giống tay tôi
            </button>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
