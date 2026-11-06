"use client";
// NT-1 — "Soi gương sáu bước": khảo sát tự quan sát (bộ câu hỏi từ engine), chip chọn một, bản đồ mặt sáng đúng vùng đang hỏi.
// Câu trả lời lưu trên máy (lib/nhan-tuong.ts); không ảnh, không gửi gì cho tới khi bấm "Xem bài đọc".
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eraser, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { BanDoMat } from "./BanDoMat";
import { ChamDiemAnh } from "./ChamDiemAnh";
import { demTraLoi, luuTraLoi, TOI_THIEU_CAU, xoaTraLoi, type KhaoSat, type TraLoi } from "@/lib/nhan-tuong";

export function KhaoSatGuong({ ks, traLoi, onXong, dangTai }: { ks: KhaoSat; traLoi: TraLoi; onXong: () => void; dangTai?: boolean }) {
  const [buoc, setBuoc] = useState(1);
  const [tl, setTl] = useState<TraLoi>(traLoi);
  const [cauSang, setCauSang] = useState<string | null>(null);
  useEffect(() => setTl(traLoi), [traLoi]);
  const cauBuoc = useMemo(() => ks.cau_hoi.filter((c) => c.buoc === buoc), [ks, buoc]);
  const buocHT = ks.buoc.find((b) => b.so === buoc) ?? ks.buoc[0]!;
  const soBuoc = ks.buoc.length;
  const daTraLoi = demTraLoi(tl);
  const vungSang = (cauSang ? ks.cau_hoi.find((c) => c.ma === cauSang) : cauBuoc[0]);
  const nhanVung = Object.fromEntries(Object.values(ks.bo_vi).map((b) => [b.vung, b.ten]));

  const chon = (cau: string, lua: string) => {
    const moi = { ...tl, [cau]: tl[cau] === lua ? "khong_chac" : lua };
    setTl(moi); luuTraLoi(moi); setCauSang(cau);
  };
  const xong = () => {
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: "khao_sat_xong", so_cau: daTraLoi });
    onXong();
  };
  const daXongBuoc = (so: number) => ks.cau_hoi.filter((c) => c.buoc === so).every((c) => tl[c.ma]);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:gap-8" data-testid="khao-sat-guong">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <BanDoMat sang={vungSang ? [vungSang.bo_vi ? ks.bo_vi[vungSang.bo_vi]?.vung ?? "" : ""] : []} nhan={nhanVung} chuThich={false}
          ghiChu={vungSang ? <span>Đang hỏi về <b className="text-fg">{ks.bo_vi[vungSang.bo_vi]?.ten}</b></span> : undefined} />
        <p className="mt-2 text-center text-xs text-fg-faint">Vùng sáng là vùng đang hỏi. Gương mặt vẽ giản lược, không phải mặt của ai.</p>
        <ol className="mt-4 hidden gap-1 lg:grid" aria-label="Các bước">
          {ks.buoc.map((b) => (
            <li key={b.so}>
              <button type="button" onClick={() => setBuoc(b.so)} aria-current={b.so === buoc ? "step" : undefined}
                className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm", b.so === buoc ? "bg-gold/15 text-fg" : "text-fg-muted hover:bg-surface/60")}>
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-xs", daXongBuoc(b.so) ? "border-jade bg-jade/20 text-jade" : "border-line")}>
                  {daXongBuoc(b.so) ? <Check className="size-3.5" aria-hidden /> : b.so}
                </span>{b.ten}
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="eyebrow">Bước {buoc}/{soBuoc}</p>
            <h3 className="mt-1 text-2xl">{buocHT.ten}</h3>
            <p className="mt-1 text-sm text-fg-muted"><Eye className="mr-1 inline size-4 text-gold" aria-hidden />{buocHT.goi_y}</p>
          </div>
          <div className="text-right text-xs text-fg-faint">
            <span data-testid="so-cau-da-tra-loi">{daTraLoi}</span>/{ks.cau_hoi.length} câu
            <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(daTraLoi / ks.cau_hoi.length) * 100}%` }} /></div>
          </div>
        </div>
        <ol className="space-y-5">
          {cauBuoc.map((c, i) => (
            <li key={c.ma} className={cn("rounded-2xl border p-4 transition-colors", tl[c.ma] && tl[c.ma] !== "khong_chac" ? "border-jade/40 bg-jade/[0.04]" : "border-line/70 bg-surface/30")}
              onFocusCapture={() => setCauSang(c.ma)} onMouseEnter={() => setCauSang(c.ma)} data-testid={`cau-${c.ma}`}>
              <p className="font-medium text-fg"><span className="mr-1.5 text-fg-faint">{i + 1}.</span>{c.hoi}</p>
              <p className="mt-1 text-xs text-fg-muted">{c.huong_dan}</p>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={c.hoi}>
                {c.lua_chon.map((l) => {
                  const chonRoi = tl[c.ma] === l.ma;
                  return (
                    <button key={l.ma} type="button" aria-pressed={chonRoi} onClick={() => chon(c.ma, l.ma)}
                      className={cn("min-h-10 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        chonRoi ? (l.ma === "khong_chac" ? "border-line bg-surface text-fg-muted" : "border-gold bg-gold/15 text-fg") : "border-line/70 text-fg-muted hover:border-gold/60 hover:text-fg")}>
                      {l.nhan}
                    </button>
                  );
                })}
              </div>
              {c.ma === "tam_dinh" && <ChamDiemAnh onKetQua={(lua) => chon("tam_dinh", lua)} />}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="secondary" disabled={buoc <= 1} onClick={() => setBuoc((b) => Math.max(1, b - 1))}><ArrowLeft aria-hidden /> Bước trước</Button>
          {buoc < soBuoc
            ? <Button onClick={() => setBuoc((b) => Math.min(soBuoc, b + 1))}>Bước tiếp <ArrowRight aria-hidden /></Button>
            : <Button onClick={xong} disabled={dangTai || daTraLoi === 0} data-testid="nut-xem-bai-doc">{dangTai ? "Đang đọc…" : "Xem bài đọc"}</Button>}
          {buoc < soBuoc && daTraLoi >= TOI_THIEU_CAU && (
            <Button variant="ghost" onClick={xong} disabled={dangTai} data-testid="nut-xem-som">Xem bài đọc ngay ({daTraLoi} câu)</Button>
          )}
          {daTraLoi > 0 && (
            <button type="button" className="ml-auto inline-flex items-center gap-1 text-xs text-fg-faint hover:text-fg" onClick={() => { xoaTraLoi(); setTl({}); setBuoc(1); }}>
              <Eraser className="size-3.5" aria-hidden /> Xoá câu trả lời trên máy
            </button>
          )}
        </div>
        {daTraLoi > 0 && daTraLoi < TOI_THIEU_CAU && <p className="mt-2 text-xs text-fg-faint">Trả lời ít nhất {TOI_THIEU_CAU} câu để bài đọc có nội dung.</p>}
      </div>
    </div>
  );
}
