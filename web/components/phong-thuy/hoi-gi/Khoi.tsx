"use client";
// HG-1 — các khối con của "Hỏi gì xem nấy": chỉ vẽ dữ liệu engine trả (sơ đồ chín ô của năm, bảng tám hướng hai người,
// hàng trả lời có / không, ô nhập người ở cùng). Không tính gì ở đây.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { LUOI_9 } from "@/components/huyen-hoc/SoDoNha";
import type { HoSoNha } from "@/lib/ho-so-nha";
import type { HaiNguoi, HoiNhanh, LuoiNam, Nguoi2 } from "./kieu";

const NUT_CHON = "inline-flex min-h-9 min-w-14 items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors motion-reduce:transition-none";
const lopChon = (bat: boolean) => cn(NUT_CHON, bat ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:border-gold/50 hover:text-fg");

/** Sơ đồ 3×3 của năm, Bắc ở trên (cùng cách xếp ô với "Sơ đồ nhà"): số sao của năm + nhãn engine gắn cho phía cần nhắc. */
export function LuoiNamKhoi({ luoi }: { luoi: LuoiNam }) {
  const { c: t, huong } = useChuPT();
  const o = LUOI_9.map((cho) => {
    const giua = cho === "Trung cung";
    const muc = luoi.o.find((x) => (giua ? x.cung === "Trung cung" : x.phuong === cho));
    return { cho, giua, ten: giua ? t("sd.giua") : huong(cho), sao: muc?.sao ?? null, nhan: muc?.nhan ?? null };
  });
  const coNhan = o.filter((x) => x.nhan);
  const nam = String(luoi.nam);
  const tomTat = coNhan.length ? coNhan.map((x) => `${x.ten}: ${x.nhan}`).join("; ") : t("hg.luoi.khong");
  return (
    <figure className="w-full max-w-xs" data-testid="hoi-gi-luoi-nam">
      <figcaption className="mb-1.5 text-xs font-medium text-fg">{t("hg.luoi.tieu_de", { nam })}</figcaption>
      <div className="grid grid-cols-3 gap-1" role="img" aria-label={t("hg.luoi.aria", { nam, ds: tomTat })}>
        {o.map((x) => (
          <div key={x.cho} data-testid="hoi-gi-o-nam" data-nhan={x.nhan ? "1" : undefined} aria-hidden
            className={cn("flex min-h-[4.2rem] flex-col rounded-lg border p-1.5",
              x.nhan ? "border-gold/70 bg-gold/10" : x.giua ? "border-line/50 bg-surface-2/30" : "border-line/60 bg-bg/30")}>
            <span className="text-[9px] uppercase leading-none tracking-wide text-fg-faint">{x.ten}</span>
            <span className={cn("mt-0.5 font-serif text-xl leading-none", x.nhan ? "text-gold" : "text-fg-muted")}>{x.sao ?? ""}</span>
            {x.nhan && <span className="mt-auto pt-0.5 text-[10px] font-medium leading-tight text-fg">{x.nhan}</span>}
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {o.filter((x) => x.sao != null).map((x) => (
          <li key={x.cho}>{t("hg.luoi.o", { phuong: x.ten, so: String(x.sao) })}{x.nhan ? ` — ${x.nhan}` : ""}</li>
        ))}
      </ul>
      <p className="mt-1.5 text-[11px] text-fg-faint">{t("hg.luoi.chu_thich")}</p>
    </figure>
  );
}

/** Tám hướng với hai người: mỗi hướng ghi rõ bằng chữ hợp ai (không chỉ bằng màu); hướng hợp cả hai được làm nổi. */
export function HaiNguoiKhoi({ hai }: { hai: HaiNguoi }) {
  const { c: t, huong } = useChuPT();
  const chu = (hop: boolean) => (hop ? t("hg.hai.hop") : t("hg.hai.kem"));
  return (
    <div className="overflow-x-auto" data-testid="hoi-gi-hai-nguoi">
      <table className="w-full min-w-[17rem] border-separate border-spacing-y-1 text-left text-xs">
        <caption className="mb-1 text-left text-xs font-medium text-fg">{t("hg.hai.tieu_de")}</caption>
        <thead>
          <tr className="text-fg-faint">
            <th scope="col" className="px-2 py-1 font-normal">{t("hg.hai.huong")}</th>
            <th scope="col" className="px-2 py-1 font-normal">{t("hg.hai.ban")}</th>
            <th scope="col" className="px-2 py-1 font-normal">{t("hg.hai.nguoi")}</th>
          </tr>
        </thead>
        <tbody>
          {hai.huong.map((h) => {
            const chung = h.a_hop && h.b_hop;
            return (
              <tr key={h.huong} data-chung={chung ? "1" : undefined} className={cn(chung ? "bg-gold/10 text-fg" : "bg-bg/30 text-fg-muted")}>
                <th scope="row" className="rounded-l-lg px-2 py-1.5 font-medium text-fg">
                  {huong(h.huong)}
                  {chung && <span className="ml-1.5 rounded-full border border-gold/60 px-1.5 py-0.5 text-[10px] font-medium text-gold">{t("hg.hai.chung")}</span>}
                </th>
                <td className={cn("px-2 py-1.5", h.a_hop && "text-jade")}>{chu(h.a_hop)}</td>
                <td className={cn("rounded-r-lg px-2 py-1.5", h.b_hop && "text-jade")}>{chu(h.b_hop)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Mấy câu có / không (engine soạn câu hỏi). `giaTri` = câu trả lời đang có trong hồ sơ nhà; bấm → `onTraLoi`. */
export function HoiNhanhKhoi({ ds, giaTri, onTraLoi }: {
  ds: HoiNhanh[]; giaTri: (ma: string, mayChu: boolean | null) => boolean | null; onTraLoi: (ma: string, co: boolean) => void;
}) {
  const { c: t } = useChuPT();
  return (
    <div className="space-y-2" data-testid="hoi-gi-hoi-nhanh">
      <p className="text-xs font-medium text-fg">{t("hg.hn.tieu_de")}</p>
      <ul className="space-y-1.5">
        {ds.map((h) => {
          const v = giaTri(h.ma, h.tra_loi);
          const id = `hoi-gi-hn-${h.ma}`;
          return (
            <li key={h.ma} data-testid={id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg border border-line/60 bg-bg/30 px-3 py-2">
              <span id={id} className="min-w-0 flex-1 basis-48 text-sm text-fg">{h.hoi}</span>
              <span className="flex shrink-0 gap-1.5" role="group" aria-labelledby={id}>
                <button type="button" aria-pressed={v === true} className={lopChon(v === true)} onClick={() => onTraLoi(h.ma, true)}>{t("hg.co")}</button>
                <button type="button" aria-pressed={v === false} className={lopChon(v === false)} onClick={() => onTraLoi(h.ma, false)}>{t("hg.khong")}</button>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-fg-faint">{t("hg.hn.luu")}</p>
    </div>
  );
}

/** Người ở cùng: năm sinh + giới tính — giữ trong trạng thái của thẻ, chỉ gửi đi để tính lần này (không lưu). */
export function Nguoi2Khoi({ thanhVien, hienTai, onChon }: {
  thanhVien: HoSoNha["thanh_vien"]; hienTai: Nguoi2 | null; onChon: (n: Nguoi2) => void;
}) {
  const { c: t } = useChuPT();
  const [nam, setNam] = useState(hienTai ? String(hienTai.nam) : "");
  const [gioi, setGioi] = useState<"nam" | "nu" | null>(hienTai?.gioi_tinh ?? null);
  const [loi, setLoi] = useState(false);
  const xem = () => {
    const n = Number(nam);
    if (!(Number.isInteger(n) && n >= 1900 && n <= 2100) || !gioi) { setLoi(true); return; }
    setLoi(false);
    onChon({ nam: n, gioi_tinh: gioi });
  };
  return (
    <form className="space-y-2 rounded-lg border border-line/60 bg-bg/30 p-3" data-testid="hoi-gi-nguoi-2"
      onSubmit={(e) => { e.preventDefault(); xem(); }}>
      <p className="text-xs font-medium text-fg">{t("hg.n2.tieu_de")}</p>
      {thanhVien.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
          <span>{t("hg.n2.tu_ho_so")}</span>
          {thanhVien.map((tv, i) => {
            const bat = hienTai?.nam === tv.nam && hienTai.gioi_tinh === tv.gioi_tinh;
            return (
              <button key={`${tv.vai}-${tv.nam}-${i}`} type="button" aria-pressed={bat} className={lopChon(bat)}
                onClick={() => { setNam(String(tv.nam)); setGioi(tv.gioi_tinh); setLoi(false); onChon({ nam: tv.nam, gioi_tinh: tv.gioi_tinh }); }}>
                {t("hg.n2.chip", { vai: t(`nc.vai.${tv.vai}`), nam: String(tv.nam) })}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-xs text-fg-muted">
          <span className="block">{t("hg.n2.nam")}</span>
          <Input inputMode="numeric" value={nam} className="h-10 w-24 px-3 text-sm" data-testid="hoi-gi-n2-nam-sinh"
            aria-invalid={loi || undefined} aria-describedby={loi ? "hoi-gi-n2-loi" : undefined}
            onChange={(e) => setNam(e.target.value.replace(/\D/g, "").slice(0, 4))} />
        </label>
        <div className="space-y-1 text-xs text-fg-muted" role="group" aria-label={t("hg.n2.gioi")}>
          <span className="block" aria-hidden>{t("hg.n2.gioi")}</span>
          <span className="flex gap-1.5">
            {(["nam", "nu"] as const).map((g) => (
              <button key={g} type="button" aria-pressed={gioi === g} data-testid={`hoi-gi-n2-${g}`} className={cn(lopChon(gioi === g), "min-h-10")}
                onClick={() => setGioi(g)}>{t(`hg.n2.gioi_${g}`)}</button>
            ))}
          </span>
        </div>
        <Button type="submit" size="sm" variant="secondary" data-testid="hoi-gi-n2-xem">{t("hg.n2.xem")}</Button>
      </div>
      {loi && <p id="hoi-gi-n2-loi" role="alert" className="text-xs text-moon">{t("hg.n2.loi")}</p>}
      <p className="text-[11px] text-fg-faint">{t("hg.n2.khong_luu")}</p>
    </form>
  );
}
