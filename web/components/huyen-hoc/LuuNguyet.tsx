"use client";
// TV-LN — lưu nguyệt (hạn từng tháng) theo phái người dùng chọn. Engine tính hết (cung tháng, sao, tứ hoá tháng,
// quan hệ với đại hạn/lưu niên/tiểu hạn, cung tháng theo cả 5 phái); web chỉ hiển thị và cho chọn tháng.
import { useState } from "react";
import { CalendarRange, MessageCircleQuestion, MousePointerClick } from "lucide-react";
import type { LuuNguyetOutputT } from "@/app/api/tuvi/schema";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

const TEN_LOP = { dai_han: "đại hạn", luu_nien: "lưu niên", tieu_han: "tiểu hạn" } as const;
const MAU_KET: Record<string, string> = {
  "thuận hơn": "bg-jade", "nhiều thử thách hơn": "bg-cinnabar", "cân bằng": "bg-gold",
};

const ngan = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}/${Number(m)}`; };
const homNayVN = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

function tenThang(t: LuuNguyetOutputT["thang"][number]) {
  return `Tháng ${t.thang}${t.nhuan ? " nhuận" : ""}${t.phan === "nua_dau" ? " (1–15)" : t.phan === "nua_sau" ? " (16–hết)" : ""}`;
}

export function LuuNguyet({ d, onChonCung, onHoi }: {
  d: LuuNguyetOutputT; onChonCung: (chi: string) => void; onHoi: (cau: string) => void;
}) {
  const homNay = homNayVN();
  const macDinh = Math.max(0, d.thang.findIndex((t) => t.tu <= homNay && homNay <= t.den));
  const [i, setI] = useState(macDinh);
  const t = d.thang[Math.min(i, d.thang.length - 1)];
  const cacPhai = Object.entries(d.so_sanh_phai);
  if (!t) return null;

  return (
    <section aria-labelledby="tieu-de-luu-nguyet" className="rounded-2xl border border-line/70 bg-surface/40 p-4 sm:p-5" data-testid="luu-nguyet">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="tieu-de-luu-nguyet" className="flex items-center gap-2 text-xl">
          <CalendarRange className="size-5 text-gold" aria-hidden /> Lưu nguyệt năm {d.can_chi_nam}
        </h2>
        <p className="text-xs text-fg-faint">Phái: <b className="text-fg">{d.phai_ten}</b></p>
      </div>
      <details className="mt-1 text-xs text-fg-muted">
        <summary className="cursor-pointer hover:text-fg">Phái này tính thế nào?</summary>
        <p className="mt-1 leading-relaxed">{d.phai_cach_tinh} <span className="text-fg-faint">Nguồn: {d.phai_nguon}.</span></p>
        <p className="mt-1 text-fg-faint">Bạn sinh tháng {d.thang_sinh} âm, giờ {d.gio_sinh}. Năm này: đại hạn ở {d.han_nam.dai_han.cung_goc},
          lưu niên ở {d.han_nam.luu_nien.cung_goc}, tiểu hạn ở {d.han_nam.tieu_han.cung_goc}.</p>
      </details>

      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6" aria-label="Các tháng âm lịch">
        {d.thang.map((x, k) => (
          <li key={`${x.thang}-${x.nhuan}-${x.phan}`}>
            <button type="button" aria-pressed={k === i} onClick={() => { setI(k); ghi("chart_interacted", { mo_dun: "tuvi", kind: "luu_nguyet_thang" }); }}
              className={cn("w-full rounded-xl border px-3 py-2 text-left transition-colors",
                k === i ? "border-gold bg-gold/10" : "border-line/70 hover:border-line hover:bg-surface-2/60")}>
              <span className="flex items-center justify-between gap-1 text-sm font-medium text-fg">
                {tenThang(x)}
                <span className={cn("size-2 shrink-0 rounded-full", MAU_KET[x.xu_huong.ket] ?? "bg-fg-faint")} title={`Xu hướng: ${x.xu_huong.ket}`} />
              </span>
              <span className="block text-[11px] text-fg-faint">{ngan(x.tu)}–{ngan(x.den)}</span>
              <span className="block truncate text-xs text-fg-muted">{x.cung_goc}</span>
              {x.trung.length > 0 && <span className="mt-0.5 block text-[10px] text-moon">trùng {x.trung.map((l) => TEN_LOP[l]).join(", ")}</span>}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]" data-testid="luu-nguyet-chi-tiet">
        <div className="space-y-2 text-sm">
          <p className="font-serif text-lg text-fg">
            {tenThang(t)} · {t.can_chi} <span className="text-sm text-fg-faint">({ngan(t.tu)}–{ngan(t.den)}/{t.den.slice(0, 4)})</span>
          </p>
          <p>Mệnh của tháng ở cung <b className="text-gold">{t.cung_goc}</b> ({t.chi}). {t.chu_de}</p>
          <p className="text-fg-muted">
            Chính tinh: {t.chinh_tinh.length ? t.chinh_tinh.map((s) => `${s.ten}${s.do_sang ? ` (${s.do_sang})` : ""}`).join(", ") : "vô chính diệu"}
            {t.tuan_triet.length > 0 && <> · có {t.tuan_triet.join(", ")}</>}
          </p>
          <ul className="grid gap-1 sm:grid-cols-2" aria-label="Tứ hoá theo can tháng">
            {t.tu_hoa_thang.map((h) => (
              <li key={h.hoa} className={cn("rounded-lg px-2.5 py-1.5 text-xs", h.vao_cung_thang ? "bg-gold/15 text-fg" : "bg-surface-2/50 text-fg-muted")}>
                <b className={h.hoa === "Kỵ" ? "text-cinnabar" : h.hoa === "Lộc" ? "text-jade" : "text-fg"}>Hoá {h.hoa}</b> {h.sao} · {h.cung_goc ?? "—"}
                {h.vao_cung_thang ? " · đúng cung tháng" : h.vao_tam_phuong ? " · tam phương" : ""}
              </li>
            ))}
          </ul>
          {(t.trung.length > 0 || t.chieu.length > 0) && (
            <p className="text-xs text-moon">
              {t.trung.length > 0 && <>Cung tháng trùng cung {t.trung.map((l) => TEN_LOP[l]).join(", ")}. </>}
              {t.chieu.length > 0 && <>Cung {t.chieu.map((l) => TEN_LOP[l]).join(", ")} nằm trong tam phương của cung tháng.</>}
            </p>
          )}
          <p className="text-xs">
            Xu hướng: <b>{t.xu_huong.ket}</b>
            {(t.xu_huong.cat.length > 0 || t.xu_huong.sat.length > 0) &&
              <span className="text-fg-faint"> — sao tốt: {t.xu_huong.cat.join(", ") || "không"}; sao khó: {t.xu_huong.sat.join(", ") || "không"}</span>}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={() => onChonCung(t.chi)}><MousePointerClick aria-hidden /> Xem cung này trên lá số</Button>
            <Button size="sm" variant="ghost" onClick={() => onHoi(`Tháng ${t.thang} âm năm ${d.nam_am} của tôi thế nào?`)}>
              <MessageCircleQuestion aria-hidden /> Hỏi về tháng này
            </Button>
          </div>
        </div>
        <div>
          <p className="eyebrow">Các phái đặt tháng này ở</p>
          <table className="mt-1 w-full text-xs" data-testid="so-sanh-phai">
            <tbody>
              {cacPhai.map(([k, v]) => (
                <tr key={k} className={cn("border-t border-line/50", k === d.phai && "text-gold")}>
                  <td className="py-1 pr-2">{v.ten}</td>
                  <td className="py-1 text-right font-medium">{v.theo_thang[i]}</td>
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
