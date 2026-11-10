"use client";
// UI-KD — khung kết quả một lượt hỏi Kinh Dịch trong KhungChat: với "Máy gieo ngẫu nhiên" thì hiện nghi thức lật đồng xu
// (GieoDongXu) TRƯỚC, đủ 6 hào mới hiện quẻ + lời đọc; các cách khác hiện ngay. Lời chính (`van`) + giải nghĩa thuật ngữ
// được vẽ ở đây (thay vì KhungChat) để không lộ tên quẻ trước khi lật xong. Mọi chữ đều của engine.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { doanCoThuatNgu, KhungGiaiNghia, type ThuatNgu } from "@/components/hoi/ThuatNgu";
import { banDoKhop, useChieuSang, VungChieuSang } from "@/components/hoi/ChieuSang";
import type { KhoiTrucQuan } from "@/components/hoi/TrucQuan";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { Info } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import type { GiaTriHao } from "@/lib/dong-xu";
import { GieoDongXu } from "./DongXu";

type Props = {
  giaTri: GiaTriHao[] | null; nghiThuc: boolean; cach: string;
  van?: string; thuatNgu?: ThuatNgu[]; canCu?: string[]; ghiChu?: string; canhBao?: string[];
  children: ReactNode;
  /** KD-V4: khối đặt NGAY dưới câu trả lời, trước hình quẻ + phần đọc kỹ (thẻ "Quẻ của bạn nói gì"). */
  truoc?: ReactNode;
  /** Gọi một lần khi quẻ + lời đọc hiện ra (sau nghi thức, hoặc ngay). */
  onHien?: () => void;
  /** HD-CS đợt 3 (ý 4): khối "hao" engine dựng — chữ "Hào Cửu Nhị…" trong lời đọc trỏ về đúng hào trên hình. */
  trucQuan?: KhoiTrucQuan[];
};

export function KetQuaQue(p: Props) {
  return <VungChieuSang><Than {...p} /></VungChieuSang>;
}

function Than({ giaTri, nghiThuc, cach, van, thuatNgu, canCu, ghiChu, canhBao, children, truoc, onHien, trucQuan }: Props) {
  const { chieu } = useChieuSang();
  const theo = banDoKhop(trucQuan);
  const coNghiThuc = nghiThuc && !!giaTri;
  const [xong, setXong] = useState(!coNghiThuc);
  const daGhiBatDau = useRef(false);               // StrictMode dev chạy effect hai lượt → chỉ ghi một lần
  useEffect(() => {
    if (coNghiThuc && !daGhiBatDau.current) { daGhiBatDau.current = true; ghi("chart_interacted", { mo_dun: "kinhdich", kind: "coin_toss_started", nguon: cach }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- một lần khi dựng
  }, []);
  const refTraLoi = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!xong) return;
    onHien?.();
    // KD-V4: lật xong lần 6 → đưa CÂU TRẢ LỜI vào màn hình (trước đây trang đứng yên ở bảng xu, lời nằm cách hơn một màn).
    if (coNghiThuc) requestAnimationFrame(() => {
      const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      refTraLoi.current?.scrollIntoView({ block: "start", behavior: giam ? "auto" : "smooth" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- một lần khi hiện
  }, [xong]);
  return (
    <div className="space-y-3" aria-live="polite" data-testid="ket-qua-que" data-xong={xong ? 1 : 0}>
      {/* Bảng đồng xu GIỮ LẠI sau khi đủ 6 hào (lớp "Cách tính" — người xem đối chiếu quẻ với 6 lần gieo), lời đọc hiện bên dưới. */}
      {coNghiThuc && giaTri && (
        <GieoDongXu giaTri={giaTri} onXong={(boQua) => {
          ghi("chart_interacted", { mo_dun: "kinhdich", kind: "coin_toss_completed", nguon: cach, ket_qua: boQua ? "bo_qua" : "du_6" });
          setXong(true);
        }} />
      )}
      {xong && (
        <>
          {/* KD-V4: thứ tự đọc = cảnh báo (đã hỏi gần đây…) → CÂU TRẢ LỜI → "Quẻ của bạn nói gì" → hình quẻ + đọc kỹ.
              Trước đây lời trả lời nằm sau toàn bộ hình quẻ và phần đọc kỹ (cách câu hỏi hơn ba màn trên điện thoại). */}
          {canhBao?.map((c) => (
            <p key={c} className="flex gap-2 rounded-xl bg-moon/10 px-3 py-2 text-xs text-moon"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {c}</p>
          ))}
          {van && (
            <div ref={refTraLoi} className="scroll-mt-28 rounded-2xl border border-gold/40 bg-gold/[0.06] p-4 sm:p-5" data-testid="tra-loi-que">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-gold/90">Trả lời cho câu của bạn</p>
              <div className="prose-vn mt-1.5 text-[1.05rem] leading-[1.75] text-fg">
                {doanCoThuatNgu(van, thuatNgu, undefined, theo.size ? { theo, bam: (id) => { chieu(id); ghi("chart_interacted", { mo_dun: "kinhdich", kind: "chu_sang_hinh" }); } } : undefined)}
                <ViSao canCu={canCu} thuatNgu={thuatNgu} />
              </div>
            </div>
          )}
          {truoc}
          {children}
          <KhungGiaiNghia ds={thuatNgu} />
          {ghiChu && <p className="text-xs text-fg-faint">{ghiChu}</p>}
        </>
      )}
    </div>
  );
}
