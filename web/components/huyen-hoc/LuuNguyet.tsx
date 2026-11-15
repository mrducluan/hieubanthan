"use client";
// TV-LN — lưu nguyệt (hạn từng tháng) theo phái người dùng chọn. Engine tính hết (cung tháng, sao, tứ hoá tháng,
// quan hệ với đại hạn/lưu niên/tiểu hạn, cung tháng theo cả 5 phái); web chỉ hiển thị và cho chọn tháng.
import { useState } from "react";
import { CalendarRange, MessageCircleQuestion, MousePointerClick } from "lucide-react";
import type { LuuNguyetOutputT } from "@/app/api/tuvi/schema";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";

type ChuLN = ReturnType<typeof useChuTuVi>;
const tenLop = (l: "dai_han" | "luu_nien" | "tieu_han", t: ChuLN) => t.c(`lop.${l}_thuong`);
const MAU_KET: Record<string, string> = {
  "thuận hơn": "bg-jade", "nhiều thử thách hơn": "bg-cinnabar", "cân bằng": "bg-gold",
};

const ngan = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}/${Number(m)}`; };
const homNayVN = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

function tenThang(t: LuuNguyetOutputT["thang"][number], c: ChuLN["c"]) {
  return `${c("ln.thang", { thang: String(t.thang) })}${t.nhuan ? c("ln.nhuan") : ""}${t.phan === "nua_dau" ? c("ln.nua_dau") : t.phan === "nua_sau" ? c("ln.nua_sau") : ""}`;
}

export function LuuNguyet({ d, onChonCung, onHoi }: {
  d: LuuNguyetOutputT; onChonCung: (chi: string) => void; onHoi: (cau: string) => void;
}) {
  const homNay = homNayVN();
  const tv = useChuTuVi();
  const { c, ten } = tv;
  const tc = (x: string) => ten("cung", x);
  const ts = (x: string) => ten("sao", x);
  const macDinh = Math.max(0, d.thang.findIndex((t) => t.tu <= homNay && homNay <= t.den));
  const [i, setI] = useState(macDinh);
  const t = d.thang[Math.min(i, d.thang.length - 1)];
  const cacPhai = Object.entries(d.so_sanh_phai);
  if (!t) return null;

  return (
    <section aria-labelledby="tieu-de-luu-nguyet" className="rounded-2xl border border-line/70 bg-surface/40 p-4 sm:p-5" data-testid="luu-nguyet">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="tieu-de-luu-nguyet" className="flex items-center gap-2 text-xl">
          <CalendarRange className="size-5 text-gold" aria-hidden /> {c("ln.tieu_de", { nam: d.can_chi_nam })}
        </h2>
        <p className="text-xs text-fg-faint">{c("ln.phai")} <b className="text-fg">{d.phai_ten}</b></p>
      </div>
      <details className="mt-1 text-xs text-fg-muted">
        <summary className="cursor-pointer hover:text-fg">{c("ln.cach_tinh")}</summary>
        <p className="mt-1 leading-relaxed">{d.phai_cach_tinh} <span className="text-fg-faint">{c("ln.nguon", { nguon: d.phai_nguon })}</span></p>
        <p className="mt-1 text-fg-faint">{c("ln.ban_sinh", { thang: String(d.thang_sinh), gio: ten("chi", d.gio_sinh), dh: tc(d.han_nam.dai_han.cung_goc), ln: tc(d.han_nam.luu_nien.cung_goc), th: tc(d.han_nam.tieu_han.cung_goc) })}</p>
      </details>

      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6" aria-label={c("ln.cac_thang")}>
        {d.thang.map((x, k) => (
          <li key={`${x.thang}-${x.nhuan}-${x.phan}`}>
            <button type="button" aria-pressed={k === i} onClick={() => { setI(k); ghi("chart_interacted", { mo_dun: "tuvi", kind: "luu_nguyet_thang" }); }}
              className={cn("w-full rounded-xl border px-3 py-2 text-left transition-colors",
                k === i ? "border-gold bg-gold/10" : "border-line/70 hover:border-line hover:bg-surface-2/60")}>
              <span className="flex items-center justify-between gap-1 text-sm font-medium text-fg">
                {tenThang(x, c)}
                <span className={cn("size-2 shrink-0 rounded-full", MAU_KET[x.xu_huong.ket] ?? "bg-fg-faint")} title={c("ln.xu_huong_title", { ket: ten("xu_huong_tuvi", x.xu_huong.ket) })} />
              </span>
              <span className="block text-[11px] text-fg-faint">{tv.en ? tv.khoangNgay(x.tu, x.den) : <>{ngan(x.tu)}–{ngan(x.den)}</>}</span>
              <span className="block truncate text-xs text-fg-muted">{tc(x.cung_goc)}</span>
              {x.trung.length > 0 && <span className="mt-0.5 block text-[10px] text-moon">{c("ln.trung", { ds: x.trung.map((l) => tenLop(l, tv)).join(", ") })}</span>}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]" data-testid="luu-nguyet-chi-tiet">
        <div className="space-y-2 text-sm">
          <p className="font-serif text-lg text-fg">
            {tenThang(t, c)} · {t.can_chi} <span className="text-sm text-fg-faint">({tv.en ? tv.khoangNgay(t.tu, t.den, true) : <>{ngan(t.tu)}–{ngan(t.den)}/{t.den.slice(0, 4)}</>})</span>
          </p>
          <p>{c("ln.menh_thang_1")}<b className="text-gold">{tc(t.cung_goc)}</b> ({ten("chi", t.chi)}). {t.chu_de}</p>
          <p className="text-fg-muted">
            {c("ln.chinh_tinh")}{t.chinh_tinh.length ? t.chinh_tinh.map((s) => `${ts(s.ten)}${s.do_sang ? ` (${ten("do_sang", s.do_sang)})` : ""}`).join(", ") : c("ls.vo_chinh_dieu")}
            {t.tuan_triet.length > 0 && <>{c("ln.co", { ds: t.tuan_triet.map(ts).join(", ") })}</>}
          </p>
          <ul className="grid gap-1 sm:grid-cols-2" aria-label={c("ln.tu_hoa_thang")}>
            {t.tu_hoa_thang.map((h) => (
              <li key={h.hoa} className={cn("rounded-lg px-2.5 py-1.5 text-xs", h.vao_cung_thang ? "bg-gold/15 text-fg" : "bg-surface-2/50 text-fg-muted")}>
                <b className={h.hoa === "Kỵ" ? "text-cinnabar" : h.hoa === "Lộc" ? "text-jade" : "text-fg"}>{c("ln.hoa", { hoa: tv.hoa(h.hoa) })}</b> {ts(h.sao)} · {h.cung_goc ? tc(h.cung_goc) : "—"}
                {h.vao_cung_thang ? c("ln.dung_cung") : h.vao_tam_phuong ? c("ln.tam_phuong") : ""}
              </li>
            ))}
          </ul>
          {(t.trung.length > 0 || t.chieu.length > 0) && (
            <p className="text-xs text-moon">
              {t.trung.length > 0 && <>{c("ln.trung_cung", { ds: t.trung.map((l) => tenLop(l, tv)).join(", ") })}</>}
              {t.chieu.length > 0 && <>{c("ln.chieu", { ds: t.chieu.map((l) => tenLop(l, tv)).join(", ") })}</>}
            </p>
          )}
          <p className="text-xs">
            {c("ln.xu_huong")}<b>{ten("xu_huong_tuvi", t.xu_huong.ket)}</b>
            {(t.xu_huong.cat.length > 0 || t.xu_huong.sat.length > 0) &&
              <span className="text-fg-faint">{c("ln.sao_tot", { tot: t.xu_huong.cat.map(ts).join(", ") || c("ln.khong"), kho: t.xu_huong.sat.map(ts).join(", ") || c("ln.khong") })}</span>}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={() => onChonCung(t.chi)}><MousePointerClick aria-hidden /> {c("ln.xem_cung")}</Button>
            <Button size="sm" variant="ghost" onClick={() => onHoi(c("ln.cau_hoi", { thang: String(t.thang), nam: String(d.nam_am) }))}>
              <MessageCircleQuestion aria-hidden /> {c("ln.hoi")}
            </Button>
          </div>
        </div>
        <div>
          <p className="eyebrow">{c("ln.cac_phai")}</p>
          <table className="mt-1 w-full text-xs" data-testid="so-sanh-phai">
            <tbody>
              {cacPhai.map(([k, v]) => (
                <tr key={k} className={cn("border-t border-line/50", k === d.phai && "text-gold")}>
                  <td className="py-1 pr-2">{v.ten}</td>
                  <td className="py-1 text-right font-medium">{v.theo_thang[i] ? tc(v.theo_thang[i]!) : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-4 text-xs text-fg-faint">{d.uu_tien} {d.luu_y}</p>
    </section>
  );
}
