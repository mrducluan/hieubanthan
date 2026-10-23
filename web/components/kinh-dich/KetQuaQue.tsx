"use client";
// UI-KD — khung kết quả một lượt hỏi Kinh Dịch trong KhungChat: với "Máy gieo ngẫu nhiên" thì hiện nghi thức lật đồng xu
// (GieoDongXu) TRƯỚC, đủ 6 hào mới hiện quẻ + lời đọc; các cách khác hiện ngay. Lời chính (`van`) + giải nghĩa thuật ngữ
// được vẽ ở đây (thay vì KhungChat) để không lộ tên quẻ trước khi lật xong. Mọi chữ đều của engine.
import { useEffect, useState, type ReactNode } from "react";
import { doanCoThuatNgu, KhungGiaiNghia, type ThuatNgu } from "@/components/hoi/ThuatNgu";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { Info } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import type { GiaTriHao } from "@/lib/dong-xu";
import { GieoDongXu } from "./DongXu";

export function KetQuaQue({ giaTri, nghiThuc, cach, van, thuatNgu, canCu, ghiChu, canhBao, children, onHien }: {
  giaTri: GiaTriHao[] | null; nghiThuc: boolean; cach: string;
  van?: string; thuatNgu?: ThuatNgu[]; canCu?: string[]; ghiChu?: string; canhBao?: string[];
  children: ReactNode;
  /** Gọi một lần khi quẻ + lời đọc hiện ra (sau nghi thức, hoặc ngay). */
  onHien?: () => void;
}) {
  const coNghiThuc = nghiThuc && !!giaTri;
  const [xong, setXong] = useState(!coNghiThuc);
  useEffect(() => {
    if (coNghiThuc) ghi("chart_interacted", { mo_dun: "kinhdich", kind: "coin_toss_started", nguon: cach });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- một lần khi dựng
  }, []);
  useEffect(() => { if (xong) onHien?.(); // eslint-disable-next-line react-hooks/exhaustive-deps -- một lần khi hiện
  }, [xong]);
  return (
    <div className="space-y-3" aria-live="polite" data-testid="ket-qua-que" data-xong={xong ? 1 : 0}>
      {!xong && giaTri && (
        <GieoDongXu giaTri={giaTri} onXong={(boQua) => {
          ghi("chart_interacted", { mo_dun: "kinhdich", kind: "coin_toss_completed", nguon: cach, ket_qua: boQua ? "bo_qua" : "du_6" });
          setXong(true);
        }} />
      )}
      {xong && (
        <>
          {children}
          {van && (
            <div className="prose-vn rounded-2xl rounded-tl-md border border-line/70 bg-bg/40 px-4 py-3 text-[0.95rem] leading-relaxed">
              {doanCoThuatNgu(van, thuatNgu)}
              <ViSao canCu={canCu} thuatNgu={thuatNgu} nho />
            </div>
          )}
          <KhungGiaiNghia ds={thuatNgu} />
          {canhBao?.map((c) => (
            <p key={c} className="flex gap-2 rounded-xl bg-moon/10 px-3 py-2 text-xs text-moon"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {c}</p>
          ))}
          {ghiChu && <p className="text-xs text-fg-faint">{ghiChu}</p>}
        </>
      )}
    </div>
  );
}
