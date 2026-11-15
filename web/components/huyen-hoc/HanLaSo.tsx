"use client";
// TV-HOA-HAN — hai mảnh quanh lá số Tử vi, chỉ VẼ dữ liệu engine:
//  · DongHoaHan: một dòng tóm tắt tứ hoá của lớp hạn đang bật (đại hạn 10 năm / năm đang xem) — sao nào hoá gì, ở cung nào
//    (`tu_hoa_sao` của /api/tuvi/van-han). Huy hiệu viền đứt cùng màu với huy hiệu trên lá số; Kỵ hổ phách, không đỏ.
//  · DaiHanNhay: dải 12 giai đoạn 10 năm (tuổi + năm do engine trả `dai_han.tu_nam`) — chạm một giai đoạn → năm xem nhảy
//    tới năm đầu giai đoạn, bật lớp đại hạn. Điện thoại cuộn ngang trong khung (không tràn trang).
import { useEffect, useRef } from "react";
import type { LaSoOutputT, VanHanOutputT } from "@/app/api/tuvi/schema";
import { TEN_HOA_MA, hoaHanDangBat, type MaHoa } from "@/lib/tuvi-hien-thi";
import { cn } from "@/lib/utils";
import { useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";

/** Ô hẹp (dải 12 giai đoạn): bản Anh bỏ chữ " Palace" cuối tên cung engine trả; bản Việt không đổi. */
const tenNganCung = (s: string) => s.replace(/ Palace$/, "");

export const MAU_HOA_HAN: Record<MaHoa, string> = {
  loc: "border-jade/60 text-jade", quyen: "border-cinnabar/60 text-cinnabar",
  khoa: "border-[rgb(126_172_255)]/60 text-[rgb(126_172_255)]", ky: "border-[#d9973a]/70 text-[#d9973a]",
};

export function DongHoaHan({ vh, lop, namXem }: { vh: VanHanOutputT | null | undefined; lop: { dai_han: boolean; luu_nien: boolean }; namXem: number }) {
  const { c, ten, hoa } = useChuTuVi();
  if (!vh || vh.nam_xem !== namXem) return null;
  const ds = hoaHanDangBat(vh, lop);
  if (!ds.length) return null;
  const nhom = [
    lop.dai_han && { ma: "dh" as const, nhan: c("han.nhan_dh", { loai: c(vh.dai_han.dong_han ? "han.dong_han" : "han.dai_han"), tu: String(vh.dai_han.tu_tuoi), den: String(vh.dai_han.den_tuoi) }), phu: c("han.cung", { cung: ten("cung", vh.dai_han.cung_goc) }) },
    lop.luu_nien && { ma: "ln" as const, nhan: c("han.nam", { nam: String(vh.nam_xem) }), phu: vh.can_chi_nam_xem },
  ].filter((x): x is { ma: "dh" | "ln"; nhan: string; phu: string } => Boolean(x));
  return (
    <div className="space-y-1.5" data-testid="dong-hoa-han">
      {nhom.map((n) => {
        const cua = ds.filter((b) => b.lop === n.ma);
        if (!cua.length) return null;
        return (
          // Điện thoại: 4 hoá xếp lưới 2 cột (mỗi ô: sao hoá gì + cung nhỏ bên dưới); từ sm một hàng tràn dòng.
          <div key={n.ma} className="text-sm leading-snug" data-lop={n.ma}>
            <p className="text-fg"><b className="font-semibold">{n.nhan}</b> <span className="text-fg-faint">({n.phu})</span></p>
            <ul className="mt-1 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
              {cua.map((b) => (
                <li key={b.hoa} className={cn("rounded-xl border border-dashed px-2.5 py-1 text-xs sm:rounded-full", MAU_HOA_HAN[b.hoa])}>
                  <span className="font-semibold">{c("han.sao_hoa", { sao: ten("sao", b.sao), hoa: hoa(TEN_HOA_MA[b.hoa]) })}</span>
                  {b.cung && <span className="block text-[0.7rem] font-normal text-fg-faint sm:ml-1 sm:inline">{c("han.cung", { cung: ten("cung", b.cung) })}</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function DaiHanNhay({ ls, vh, namXem, tieuDe, onNhay }: {
  ls: LaSoOutputT; vh: VanHanOutputT | null | undefined; namXem: number; tieuDe: string; onNhay: (nam: number) => void;
}) {
  const ds = ls.cung.map((c, i) => ({ c, i })).filter(({ c }) => typeof c.dai_han.tu_nam === "number")
    .sort((a, b) => a.c.dai_han.tu_tuoi - b.c.dai_han.tu_tuoi);
  // Đồng hạn (tuổi mụ < tuổi khởi hạn đầu): chưa vào giai đoạn 10 năm nào — không sáng ô nào, hiện nhãn riêng trước dải
  // (engine vẫn trả cung đồng hạn ở `chi_so`, đó là cung tuổi nhỏ, không phải giai đoạn trong dải).
  const dongHan = vh && vh.nam_xem === namXem && vh.dai_han.dong_han ? vh.dai_han : null;
  // Giai đoạn đang xem: theo engine (chỉ số cung đại hạn của năm xem); chờ engine thì theo năm đầu/cuối engine trả.
  const dang = dongHan ? undefined : vh && vh.nam_xem === namXem ? vh.dai_han.chi_so
    : ds.find(({ c }) => c.dai_han.tu_nam! <= namXem && namXem <= (c.dai_han.den_nam ?? c.dai_han.tu_nam! + 9))?.i;
  const khung = useRef<HTMLDivElement>(null);
  const { c: t, ten } = useChuTuVi();
  // Đưa giai đoạn đang xem vào giữa dải (chỉ cuộn TRONG dải, không cuộn trang).
  useEffect(() => {
    const k = khung.current;
    const el = k?.querySelector<HTMLElement>("[aria-current='true']");
    if (!k || !el) return;
    k.scrollLeft = Math.max(0, el.offsetLeft - k.clientWidth / 2 + el.clientWidth / 2);
  }, [dang]);
  if (ds.length !== 12) return null;   // engine cũ chưa có năm đầu hạn
  return (
    <nav aria-label={tieuDe} className="space-y-1.5" data-testid="dai-han-nhay">
      <p className="text-sm font-semibold text-fg">{tieuDe}</p>
      <div ref={khung} className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:mx-0 sm:px-0">
        <ol className="flex min-w-max gap-1.5 lg:min-w-0">
          {dongHan && (
            <li className="lg:flex-1" data-testid="dong-han" aria-current="true">
              <span className="flex min-h-11 w-[5.25rem] flex-col items-center justify-center rounded-xl border border-[rgb(126_172_255)] bg-[rgb(126_172_255)]/15 px-1.5 py-1.5 text-center text-fg lg:w-full">
                <span className="text-sm font-semibold">{t("han.dong_han")}</span>
                <span className="text-[0.7rem] leading-tight tabular-nums">{t("han.tuoi", { tu: String(dongHan.tu_tuoi), den: String(dongHan.den_tuoi) })}</span>
              </span>
            </li>
          )}
          {ds.map(({ c, i }) => {
            const laDang = i === dang;
            return (
              <li key={c.chi} className="lg:flex-1">
                <button type="button" aria-current={laDang ? "true" : undefined}
                  aria-label={t("han.aria", { tu: String(c.dai_han.tu_tuoi), den: String(c.dai_han.den_tuoi), cung: ten("cung", c.ten), nam: String(c.dai_han.tu_nam) })}
                  onClick={() => onNhay(c.dai_han.tu_nam!)}
                  className={cn("flex min-h-11 w-[5.25rem] flex-col items-center justify-center rounded-xl border px-1.5 py-1.5 text-center transition-colors lg:w-full",
                    laDang ? "border-[rgb(126_172_255)] bg-[rgb(126_172_255)]/15 text-fg" : "border-line/70 text-fg-muted hover:border-line hover:text-fg")}>
                  <span className="text-sm font-semibold tabular-nums">{c.dai_han.tu_tuoi}–{c.dai_han.den_tuoi}</span>
                  <span className="max-w-full truncate text-[0.7rem] leading-tight">{tenNganCung(ten("cung", c.ten))}</span>
                  <span className="text-[0.65rem] tabular-nums text-fg-faint">{c.dai_han.tu_nam}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
