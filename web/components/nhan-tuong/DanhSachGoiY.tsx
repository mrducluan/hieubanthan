"use client";
// Danh sách gợi ý nét mặt (từ phép đo của hệ thống hoặc từ máy AI) → người dùng tích xác nhận từng nét → "Dùng N nét" điền
// vào khảo sát trên máy → "Xem bài đọc ngay". Component thuần: không gọi engine, không tính gì.
import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import type { KhaoSat, TraLoi } from "@/lib/nhan-tuong";
import { cn } from "@/lib/utils";

export interface GoiYNet { cau: string; lua_chon: string; do_tin?: number; do?: string }

export function DanhSachGoiY({ ks, goiY, luuY, daTraLoi, onGoiY, onXem, dangXem, nguon, chuRong }: {
  ks: KhaoSat; goiY: GoiYNet[]; luuY?: string[]; daTraLoi: TraLoi; onGoiY: (tl: TraLoi) => void; onXem: () => void; dangXem?: boolean;
  /** "do" = hệ thống đo · "ai" = máy AI gợi ý (mã đo lường). */ nguon: "do" | "ai"; chuRong?: string;
}) {
  const cau = useMemo(() => Object.fromEntries(ks.cau_hoi.map((c) => [c.ma, c])), [ks]);
  const hopLe = goiY.filter((x) => cau[x.cau]?.lua_chon.some((l) => l.ma === x.lua_chon));
  const [chon, setChon] = useState<Record<string, boolean>>(() => Object.fromEntries(hopLe.map((x) => [x.cau, true])));
  const [daDung, setDaDung] = useState<number | null>(null);
  const soChon = hopLe.filter((x) => chon[x.cau]).length;
  const dung = () => {
    const moi: TraLoi = { ...daTraLoi };
    for (const x of hopLe) if (chon[x.cau]) moi[x.cau] = x.lua_chon;
    onGoiY(moi); setDaDung(soChon);
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: nguon === "do" ? "do_mat_xac_nhan" : "doc_anh_xac_nhan", so_goi_y: soChon });
  };
  return (
    <div className="rounded-2xl border border-line/70 bg-bg/60 p-4 sm:p-5" data-testid={nguon === "do" ? "do-goi-y" : "anh-goi-y"}>
      {(luuY ?? []).map((l, i) => <p key={i} className="mb-1 text-xs text-fg-muted">{l}</p>)}
      {hopLe.length === 0 ? (
        <p className="text-sm text-fg-muted">{chuRong ?? "Chưa có nét nào đủ rõ để gợi ý — bạn tự soi gương ở phần Khảo sát nhé."}</p>
      ) : (
        <>
          <p className="flex items-center gap-2 font-serif text-lg text-fg"><Sparkles className="size-4 text-gold" aria-hidden /> {nguon === "do" ? "Hệ thống đo được" : "Máy thấy"} {hopLe.length} nét — bạn xác nhận</p>
          <p className="mt-1 text-xs text-fg-muted">Bỏ tích nét nào bạn thấy chưa đúng; nét còn lại điền vào khảo sát, bạn vẫn sửa được ở dưới.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {hopLe.map((x) => {
              const c = cau[x.cau]!, nhan = c.lua_chon.find((l) => l.ma === x.lua_chon)?.nhan ?? x.lua_chon;
              return (
                <li key={x.cau}>
                  <label className={cn("flex h-full cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm", chon[x.cau] ? "border-gold/50 bg-gold/[0.06]" : "border-line/60")}>
                    <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={Boolean(chon[x.cau])}
                      onChange={(e) => setChon((s) => ({ ...s, [x.cau]: e.target.checked }))} />
                    <span>
                      <span className="text-fg-muted">{c.hoi}</span> <b className="text-fg">{nhan}</b>
                      {typeof x.do_tin === "number" && <span className="text-xs text-fg-faint"> ({Math.round(x.do_tin * 100)}%)</span>}
                      {x.do && <span className="mt-1 block text-xs leading-snug text-fg-faint">{x.do}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {daDung === null
              ? <Button onClick={dung} disabled={soChon === 0} data-testid={nguon === "do" ? "do-dung" : "anh-dung"}><Check aria-hidden /> Dùng {soChon} nét đã tích</Button>
              : <>
                <span className="text-sm text-jade" data-testid={nguon === "do" ? "do-da-dung" : "anh-da-dung"}>Đã điền {daDung} nét vào khảo sát.</span>
                <Button onClick={onXem} disabled={dangXem} data-testid={nguon === "do" ? "do-xem-bai-doc" : "anh-xem-bai-doc"}>{dangXem ? "Đang đọc…" : "Xem bài đọc ngay"}</Button>
                <a href="#khao-sat" className="text-sm text-gold underline underline-offset-4">Trả lời thêm các nét ảnh không đo được</a>
              </>}
          </div>
        </>
      )}
    </div>
  );
}
