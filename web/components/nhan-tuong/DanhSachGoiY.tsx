"use client";
// Danh sách gợi ý nét mặt (từ phép đo của hệ thống hoặc từ máy AI) → người dùng tích xác nhận từng nét → "Dùng N nét" điền
// vào khảo sát trên máy → "Xem bài đọc ngay". Component thuần: không gọi engine, không tính gì.
// NT-2: nét đo ra "vừa / cân đối" (cờ `vua`) cũng là câu trả lời — gom thành một dòng gọn dưới các nét nổi bật; có
// `onDungVaXem` thì một nút "Dùng N nét và xem bài đọc" (vẫn là người dùng xác nhận, chỉ bớt một bước).
import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import type { KhaoSat, TraLoi } from "@/lib/nhan-tuong";
import { cn } from "@/lib/utils";

export interface GoiYNet { cau: string; lua_chon: string; do_tin?: number; do?: string; vua?: boolean }

export function DanhSachGoiY({ ks, goiY, luuY, daTraLoi, onGoiY, onXem, onDungVaXem, dangXem, nguon, chuRong }: {
  ks: KhaoSat; goiY: GoiYNet[]; luuY?: string[]; daTraLoi: TraLoi; onGoiY: (tl: TraLoi) => void; onXem: () => void;
  onDungVaXem?: (tl: TraLoi) => void; dangXem?: boolean;
  /** "do" = hệ thống đo · "ai" = máy AI gợi ý (mã đo lường). */ nguon: "do" | "ai"; chuRong?: string;
}) {
  const cau = useMemo(() => Object.fromEntries(ks.cau_hoi.map((c) => [c.ma, c])), [ks]);
  const hopLe = goiY.filter((x) => cau[x.cau]?.lua_chon.some((l) => l.ma === x.lua_chon));
  const [chon, setChon] = useState<Record<string, boolean>>(() => Object.fromEntries(hopLe.map((x) => [x.cau, true])));
  const [daDung, setDaDung] = useState<number | null>(null);
  const soChon = hopLe.filter((x) => chon[x.cau]).length;
  const dung = (xemLuon = false) => {
    const moi: TraLoi = { ...daTraLoi };
    for (const x of hopLe) if (chon[x.cau]) moi[x.cau] = x.lua_chon;
    onGoiY(moi); setDaDung(soChon);
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: nguon === "do" ? "do_mat_xac_nhan" : "doc_anh_xac_nhan", so_goi_y: soChon, xem_luon: xemLuon ? 1 : 0 });
    if (xemLuon) onDungVaXem?.(moi);
  };
  const noiBat = hopLe.filter((x) => !x.vua), vua = hopLe.filter((x) => x.vua);
  // Câu ảnh không đo được (sắc, thịt, nếp, ánh mắt, giọng, dáng…) mà người dùng chưa trả lời.
  const conLai = ks.cau_hoi.filter((c) => !hopLe.some((x) => x.cau === c.ma) && !daTraLoi[c.ma]).length;
  const the = (x: GoiYNet) => {
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
  };
  return (
    <div className="rounded-2xl border border-line/70 bg-bg/60 p-4 sm:p-5" data-testid={nguon === "do" ? "do-goi-y" : "anh-goi-y"}>
      {(luuY ?? []).map((l, i) => <p key={i} className="mb-1 text-xs text-fg-muted">{l}</p>)}
      {hopLe.length === 0 ? (
        <p className="text-sm text-fg-muted">{chuRong ?? "Chưa có nét nào đủ rõ để gợi ý — bạn tự soi gương ở phần Khảo sát nhé."}</p>
      ) : (
        <>
          <p className="flex items-center gap-2 font-serif text-lg text-fg"><Sparkles className="size-4 text-gold" aria-hidden /> {nguon === "do" ? "Hệ thống đo được" : "Máy thấy"} {hopLe.length} nét{noiBat.length && vua.length ? ` (${noiBat.length} nổi bật)` : ""} — bạn xác nhận</p>
          <p className="mt-1 text-xs text-fg-muted">Bỏ tích nét nào bạn thấy chưa đúng; nét còn lại điền vào khảo sát, bạn vẫn sửa được ở dưới.</p>
          {conLai > 0 && (
            <p className="mt-1 text-xs text-fg-muted" data-testid="goi-y-con-lai">
              Ảnh không đo được {conLai} câu còn lại (sắc da, độ đầy thịt, nếp, ánh mắt, giọng, dáng…) — bài đọc vẫn có đủ chương,{" "}
              <a href="#khao-sat" className="text-gold underline underline-offset-2">trả lời thêm</a> thì chương nào cũng dày hơn.
            </p>
          )}
          {noiBat.length > 0 && <ul className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="goi-y-noi-bat">{noiBat.map(the)}</ul>}
          {vua.length > 0 && (
            <div className="mt-3" data-testid="goi-y-vua">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-faint">Nét cân đối, trong khoảng thường</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">{vua.map(the)}</ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {daDung === null
              ? onDungVaXem
                ? <>
                  <Button onClick={() => dung(true)} disabled={soChon === 0 || dangXem} data-testid={nguon === "do" ? "do-dung-xem" : "anh-dung-xem"}>
                    <Check aria-hidden /> {dangXem ? "Đang đọc…" : `Dùng ${soChon} nét và xem bài đọc`}</Button>
                  <button type="button" onClick={() => dung()} disabled={soChon === 0} className="text-sm text-gold underline underline-offset-4" data-testid={nguon === "do" ? "do-dung" : "anh-dung"}>Chỉ điền vào khảo sát</button>
                </>
                : <Button onClick={() => dung()} disabled={soChon === 0} data-testid={nguon === "do" ? "do-dung" : "anh-dung"}><Check aria-hidden /> Dùng {soChon} nét đã tích</Button>
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
