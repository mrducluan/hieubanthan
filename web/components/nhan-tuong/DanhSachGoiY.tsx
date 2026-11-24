"use client";
// Danh sách gợi ý nét mặt (từ phép đo của hệ thống hoặc từ máy AI) → người dùng tích xác nhận từng nét → "Dùng N nét" điền
// vào khảo sát trên máy → "Xem bài đọc ngay". Component thuần: không gọi engine, không tính gì.
// NT-2: nét đo ra "vừa / cân đối" (cờ `vua`) cũng là câu trả lời — gom thành một dòng gọn dưới các nét nổi bật; có
// `onDungVaXem` thì một nút "Dùng N nét và xem bài đọc" (vẫn là người dùng xác nhận, chỉ bớt một bước).
// PR #338 (chủ dự án: phép đo ước lượng được giữ, nhưng người dùng phải BÁO ĐƯỢC "chưa đúng" và CHỈNH LẠI): mỗi thẻ có nút
// "Chưa đúng — chọn lại" mở các lựa chọn của chính câu đó; lựa chọn ĐÃ CHỈNH là thứ được điền. Sự kiện `do_mat_chinh` chỉ mang mã.
import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import type { KhaoSat, TraLoi } from "@/lib/nhan-tuong";
import { cn } from "@/lib/utils";
import { useChuNhanTuong } from "./chu-nhan-tuong";

export interface GoiYNet {
  cau: string;
  lua_chon: string;
  do_tin?: number | "thap" | "trung_binh" | "cao";
  do?: string;
  vua?: boolean;
  anh?: string;
}

export function DanhSachGoiY({ ks, goiY, luuY, daTraLoi, onGoiY, onXem, onDungVaXem, onMoCauHoiPhu, soCauPhiAnhThieu, dangXem, nguon, chuRong }: {
  ks: KhaoSat; goiY: GoiYNet[]; luuY?: string[]; daTraLoi: TraLoi; onGoiY: (tl: TraLoi) => void; onXem: () => void;
  onDungVaXem?: (tl: TraLoi) => void; onMoCauHoiPhu?: () => void; soCauPhiAnhThieu?: number; dangXem?: boolean;
  /** "do" = hệ thống đo · "ai" = máy AI gợi ý (mã đo lường). */ nguon: "do" | "ai"; chuRong?: string;
}) {
  const { t, en } = useChuNhanTuong();
  const cau = useMemo(() => Object.fromEntries(ks.cau_hoi.map((c) => [c.ma, c])), [ks]);
  const hopLe = goiY.filter((x) => cau[x.cau]?.lua_chon.some((l) => l.ma === x.lua_chon));
  const [chon, setChon] = useState<Record<string, boolean>>(() => Object.fromEntries(hopLe.map((x) => [x.cau, true])));
  const [daDung, setDaDung] = useState<number | null>(null);
  /** Lựa chọn người dùng chọn lại cho từng câu (khác lựa chọn máy đo). */
  const [chinh, setChinh] = useState<Record<string, string>>({});
  const [moChon, setMoChon] = useState<string | null>(null);
  const chonLai = (x: GoiYNet, ma: string) => {
    setMoChon(null);
    setChon((s) => ({ ...s, [x.cau]: true }));
    if (ma === x.lua_chon) { setChinh((s) => { const m = { ...s }; delete m[x.cau]; return m; }); return; }
    setChinh((s) => ({ ...s, [x.cau]: ma }));
    setDaDung(null);   // đã điền rồi mới chỉnh → hiện lại nút "Dùng" để điền lựa chọn mới
    ghi("chart_interacted", {
      mo_dun: "nhantuong", kind: "do_mat_chinh", cau: x.cau, may: x.lua_chon, nguoi: ma,
      do_tin: typeof x.do_tin === "number" ? "so" : x.do_tin ?? "khong",
    });
  };
  const soChon = hopLe.filter((x) => chon[x.cau]).length;
  const dung = (xemLuon = false) => {
    const moi: TraLoi = { ...daTraLoi };
    for (const x of hopLe) if (chon[x.cau]) moi[x.cau] = chinh[x.cau] ?? x.lua_chon;
    onGoiY(moi); setDaDung(soChon);
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: nguon === "do" ? "do_mat_xac_nhan" : "doc_anh_xac_nhan", so_goi_y: soChon, xem_luon: xemLuon ? 1 : 0 });
    if (xemLuon) onDungVaXem?.(moi);
  };
  const noiBat = hopLe.filter((x) => !x.vua), vua = hopLe.filter((x) => x.vua);
  // Câu ảnh không đo được (sắc, thịt, nếp, ánh mắt, giọng, dáng…) mà người dùng chưa trả lời.
  const conLai = ks.cau_hoi.filter((c) => !hopLe.some((x) => x.cau === c.ma) && !daTraLoi[c.ma]).length;
  const the = (x: GoiYNet) => {
    const c = cau[x.cau]!, daChinh = chinh[x.cau], ma = daChinh ?? x.lua_chon;
    const nhan = c.lua_chon.find((l) => l.ma === ma)?.nhan ?? ma;
    const dangMo = moChon === x.cau;
    return (
      <li key={x.cau} data-testid="goi-y-the" data-cau={x.cau} data-chinh={daChinh ? "1" : "0"}
        className={cn("flex h-full flex-col rounded-lg border px-3 py-2 text-sm", chon[x.cau] ? "border-gold/50 bg-gold/[0.06]" : "border-line/60")}>
        <label className="flex cursor-pointer items-start gap-2">
          <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={Boolean(chon[x.cau])}
            onChange={(e) => setChon((s) => ({ ...s, [x.cau]: e.target.checked }))} />
          <span>
            <span className="text-fg-muted">{c.hoi}</span> <b className="text-fg" data-testid="goi-y-nhan">{nhan}</b>
            {daChinh && (
              <span className="ml-1.5 inline-block rounded-full border border-gold/50 bg-gold/10 px-1.5 py-0.5 align-middle text-[10px] font-medium text-gold" data-testid="goi-y-da-chinh">
                {t("gy.da_chinh")}
              </span>
            )}
            {!daChinh && typeof x.do_tin === "number" && <span className="text-xs text-fg-faint"> ({Math.round(x.do_tin * 100)}%)</span>}
            {!daChinh && x.do_tin === "thap" && (
              <span className="ml-1.5 inline-block rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 align-middle text-[10px] font-medium text-amber-300">
                {t("gy.badge_roi")}
              </span>
            )}
            {!daChinh && x.anh === "3d" && x.do_tin === "trung_binh" && (
              <span className="ml-1.5 inline-block rounded-full border border-jade/40 bg-jade/10 px-1.5 py-0.5 align-middle text-[10px] font-medium text-jade">
                {t("gy.badge_3d")}
              </span>
            )}
            {x.do && <span className="mt-1 block text-xs leading-snug text-fg-faint">{x.do}</span>}
          </span>
        </label>
        {c.lua_chon.length > 1 && (
          <div className="mt-auto pt-1.5 pl-6">
            <button type="button" onClick={() => setMoChon(dangMo ? null : x.cau)} aria-expanded={dangMo} data-testid="goi-y-chua-dung"
              className="min-h-[32px] text-xs text-gold underline underline-offset-2 hover:text-fg">
              {dangMo ? t("gy.dong_chon") : t("gy.chua_dung")}
            </button>
            {dangMo && (
              <div role="radiogroup" aria-label={t("gy.chon_lai_nhan")} className="mt-1.5 flex flex-wrap gap-1.5" data-testid="goi-y-lua-chon">
                {c.lua_chon.map((l) => (
                  <button key={l.ma} type="button" role="radio" aria-checked={l.ma === ma} data-ma={l.ma} onClick={() => chonLai(x, l.ma)}
                    className={cn("min-h-[36px] rounded-full border px-3 text-left text-xs", l.ma === ma ? "border-gold/70 bg-gold/15 text-fg" : "border-line text-fg-muted hover:border-gold/50")}>
                    {l.nhan}{l.ma === x.lua_chon && <span className="text-fg-faint"> · {t("gy.may_do")}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </li>
    );
  };
  return (
    <div className="rounded-2xl border border-line/70 bg-bg/60 p-4 sm:p-5" data-testid={nguon === "do" ? "do-goi-y" : "anh-goi-y"}>
      {(luuY ?? []).map((l, i) => <p key={i} className="mb-1 text-xs text-fg-muted">{l}</p>)}
      {hopLe.length === 0 ? (
        <p className="text-sm text-fg-muted">{chuRong ?? t("gy.rong")}</p>
      ) : (
        <>
          <p className="flex items-center gap-2 font-serif text-lg text-fg"><Sparkles className="size-4 text-gold" aria-hidden /> {en ? `${nguon === "do" ? t("gy.do_duoc") : t("gy.may_thay")} ${t("gy.so_net", { so: String(hopLe.length) })}${noiBat.length && vua.length ? t("gy.noi_bat", { so: String(noiBat.length) }) : ""}${t("gy.xac_nhan")}`
            : <>{nguon === "do" ? "Hệ thống đo được" : "Máy thấy"} {hopLe.length} nét{noiBat.length && vua.length ? ` (${noiBat.length} nổi bật)` : ""} — bạn xác nhận</>}</p>
          <p className="mt-1 text-xs text-fg-muted">{t("gy.bo_tich")}</p>
          {conLai > 0 && (
            <p className="mt-1 text-xs text-fg-muted" data-testid="goi-y-con-lai">
              {en ? <>{t("gy.con_lai", { so: String(conLai) })}{" "}
              <a href="#khao-sat" className="text-gold underline underline-offset-2">{t("gy.tra_loi_them")}</a> {t("gy.con_lai_2")}</> : <>
              Ảnh không đo được {conLai} câu còn lại (sắc da, độ đầy thịt, nếp, ánh mắt, giọng, dáng…) — bài đọc vẫn có đủ chương,{" "}
              <a href="#khao-sat" className="text-gold underline underline-offset-2">trả lời thêm</a> thì chương nào cũng dày hơn.</>}
            </p>
          )}
          {noiBat.length > 0 && <ul className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="goi-y-noi-bat">{noiBat.map(the)}</ul>}
          {vua.length > 0 && (
            <div className="mt-3" data-testid="goi-y-vua">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-faint">{t("gy.vua")}</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">{vua.map(the)}</ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {daDung === null
              ? onDungVaXem
                ? <>
                  <Button onClick={() => dung(true)} disabled={soChon === 0 || dangXem} data-testid={nguon === "do" ? "do-dung-xem" : "anh-dung-xem"}>
                    <Check aria-hidden /> {dangXem ? t("gy.dang_doc") : t("gy.dung_xem", { so: String(soChon) })}</Button>
                  <button type="button" onClick={() => dung()} disabled={soChon === 0} className="text-sm text-gold underline underline-offset-4" data-testid={nguon === "do" ? "do-dung" : "anh-dung"}>{t("gy.chi_dien")}</button>
                </>
                : <Button onClick={() => dung()} disabled={soChon === 0} data-testid={nguon === "do" ? "do-dung" : "anh-dung"}><Check aria-hidden /> {t("gy.dung", { so: String(soChon) })}</Button>
              : <>
                <span className="text-sm text-jade" data-testid={nguon === "do" ? "do-da-dung" : "anh-da-dung"}>{t("gy.da_dien", { so: String(daDung) })}</span>
                <Button onClick={onXem} disabled={dangXem} data-testid={nguon === "do" ? "do-xem-bai-doc" : "anh-xem-bai-doc"}>{dangXem ? t("gy.dang_doc") : t("gy.xem_ngay")}</Button>
                <a href="#khao-sat" className="text-sm text-gold underline underline-offset-4">{t("gy.tra_loi_net")}</a>
              </>}
            {onMoCauHoiPhu && (soCauPhiAnhThieu ?? 0) > 0 && (
              <button type="button" onClick={onMoCauHoiPhu} data-testid="gy-mo-popup-phi-anh"
                className="ml-auto rounded-full border border-gold/40 bg-gold/[0.06] px-3 py-1.5 text-xs text-gold hover:bg-gold/15">
                {t("gy.bo_sung_phi_anh", { so: String(soCauPhiAnhThieu) })}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
