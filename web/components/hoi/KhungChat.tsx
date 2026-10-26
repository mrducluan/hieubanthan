"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useChuChung } from "@/components/cms/ChuChung";
import { AnimatePresence, motion } from "motion/react";
import { Info, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";
import { doanCoThuatNgu, KhungGiaiNghia, type ThuatNgu } from "@/components/hoi/ThuatNgu";
import { ViSao } from "@/components/luan-giai/HopNoiBat";

export interface KetQuaHoi {
  van?: string;
  /** Phần trực quan kèm câu trả lời (quẻ, cung, tứ trụ…) — hiện TRƯỚC lời trả lời. */
  phu?: ReactNode;
  /** Phần đi SAU lời trả lời (hỏi tiếp, góp ý "Đúng / Chưa đúng", bình chọn phái…): người dùng đọc xong mới được hỏi
   *  "có đúng không" (vòng thử v3 M1). */
  sau?: ReactNode;
  /** Căn cứ kỹ thuật (tên sao, cung, độ sáng…) — hiện thu gọn "Vì sao nói vậy" ngay dưới câu trả lời. */
  canCu?: string[];
  ghiChu?: string;
  /** SAO-2: lượt miễn phí còn lại / Sao vừa dùng (máy chủ báo). */
  ghiLuot?: string;
  canhBao?: string[];
  loi?: string;
  /** GN — thuật ngữ trong câu trả lời (engine tra từ điển) để gạch chân + giải nghĩa. */
  thuatNgu?: ThuatNgu[];
}

interface Tin extends KetQuaHoi {
  id: number;
  ai: "ban" | "he";
}

interface Props {
  loiChao: string;
  goiY: { nhom: string; cau: string[] }[];
  gui: (cau: string) => Promise<KetQuaHoi>;
  /** Điều khiển phụ (chế độ, cách gieo…) hiện phía trên ô nhập. */
  dieuKhien?: ReactNode;
  nhanO?: string;
  goiYO?: string;
  /** Câu hỏi đẩy từ ngoài vào (vd bấm một cung trên lá số); đổi `lan` để hỏi lại. */
  cauNgoai?: { cau: string; lan: number } | null;
  /** Tên mảng cho đo lường (không gửi nội dung câu hỏi). */
  moDun: string;
  className?: string;
}

// Mỗi mảng một khung chat (chủ dự án chốt): lịch sử trong phiên, gợi ý câu hỏi, không lưu phía server
// ngoài nhật ký ẩn danh đã lọc (0004/0005).
export function KhungChat({ loiChao, goiY, gui, dieuKhien, nhanO = "Câu hỏi của bạn", goiYO, cauNgoai, moDun, className }: Props) {
  const cc = useChuChung();
  const [tin, setTin] = useState<Tin[]>([]);
  const [cau, setCau] = useState("");
  const [dang, setDang] = useState(false);
  const cuoi = useRef<HTMLDivElement>(null);
  const soId = useRef(0);

  // Một lần cuộn duy nhất tới khung (khung chờ / câu trả lời mới). Trang ngoài KHÔNG tự cuộn thêm khi đẩy câu vào
  // (hai lệnh cuộn mượt chồng nhau làm màn hình giật). Giảm chuyển động → nhảy thẳng.
  useEffect(() => {
    if (!tin.length) return;
    // Tự tính thay scrollIntoView({block:"nearest"}) — Chromium bỏ qua lệnh đó với mốc cao 0px ở xa màn hình.
    // Chiều cao thanh đầu trang (dính) và thanh tab dưới (điện thoại) ĐO THẬT mỗi lần, không ghi cứng.
    //  · đang chờ: đáy khung chờ "Đang soi câu hỏi…" ngay trên thanh tab dưới;
    //  · vừa có câu trả lời: mốc là BONG BÓNG CÂU HỎI, đặt ngay dưới thanh đầu trang → câu hỏi rồi câu trả lời
    //    nằm trong màn hình đầu (v3 M1). Chỉ cuộn khi câu hỏi bị che hoặc đầu câu trả lời chưa lộ đủ.
    const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const cuon = (top: number) => window.scrollTo({ top: Math.max(0, top), behavior: giam ? "auto" : "smooth" });
    const cao = window.innerHeight;
    const dau = document.querySelector<HTMLElement>("[data-thanh-dau]")?.getBoundingClientRect().height ?? 0;
    const duoiEl = document.querySelector<HTMLElement>("[data-thanh-duoi]");
    const duoi = duoiEl && duoiEl.offsetParent !== null ? duoiEl.getBoundingClientRect().height : 0;
    const dayNhin = cao - duoi;
    if (dang) {
      const r = cuoi.current?.getBoundingClientRect();
      if (r && (r.top > dayNhin - 16 || r.top < dau + 16)) cuon(window.scrollY + r.top - (dayNhin - 16));
      return;
    }
    const khung = cuoi.current?.parentElement;
    const dsHoi = khung?.querySelectorAll<HTMLElement>("[data-testid='cau-hoi-ban']");
    const dsTra = khung?.querySelectorAll<HTMLElement>("[data-testid='cau-tra-loi']");
    // Vị trí khi đã đứng yên: trừ phần trượt lên của hiệu ứng hiện (y: 8 → 0) nếu bong bóng còn đang chạy.
    const dinh = (el?: HTMLElement) => {
      if (!el) return null;
      const t = getComputedStyle(el).transform;
      return el.getBoundingClientRect().top - (t && t !== "none" ? new DOMMatrix(t).m42 : 0);
    };
    const q = dinh(dsHoi?.[dsHoi.length - 1]);
    const a = dinh(dsTra?.[dsTra.length - 1]);
    if (q === null || a === null) return;
    const moc = dau + 12;
    // Đầu câu trả lời cần lộ ít nhất ~160px (vài dòng) trên thanh tab dưới; câu hỏi không bị thanh đầu che.
    if (q < moc || a + 160 > dayNhin) cuon(window.scrollY + q - moc);
  }, [tin.length, dang]);

  // Câu từ ngoài tới lúc đang chờ trả lời → giữ lại, hỏi ngay khi xong (không bỏ mất cú bấm).
  const cho = useRef<string | null>(null);
  useEffect(() => {
    if (!cauNgoai) return;
    if (dang) cho.current = cauNgoai.cau;
    else void hoi(cauNgoai.cau);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi có câu mới từ ngoài
  }, [cauNgoai?.lan]);
  useEffect(() => {
    if (dang || !cho.current) return;
    const c = cho.current;
    cho.current = null;
    void hoi(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chạy khi vừa trả lời xong
  }, [dang]);

  async function hoi(q: string) {
    const c = q.trim();
    if (c.length < 3 || dang) return;
    setCau("");
    setTin((t) => [...t, { id: ++soId.current, ai: "ban", van: c }]);
    setDang(true);
    ghi("advisor_question_started", { mo_dun: moDun });
    try {
      const kq = await gui(c);
      setTin((t) => [...t, { id: ++soId.current, ai: "he", ...kq }]);
      ghi("advisor_question_completed", { mo_dun: moDun, ket_qua: kq.loi ? "loi" : "ok" });
    } catch {
      setTin((t) => [...t, { id: ++soId.current, ai: "he", loi: cc("hoi.loi_ket_noi") }]);
    } finally {
      setDang(false);
    }
  }

  return (
    <div className={cn("glass flex flex-col rounded-2xl", className)}>
      <div className="space-y-4 p-4 sm:p-6" aria-live="polite">
        <div className="flex gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold/15 text-gold"><Sparkles className="size-4" aria-hidden /></span>
          <p className="pt-1 text-[0.95rem] text-fg-muted">{loiChao}</p>
        </div>

        <AnimatePresence initial={false}>
          {tin.map((t) =>
            t.ai === "ban" ? (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end" data-testid="cau-hoi-ban">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-gold/15 px-4 py-2.5 text-[0.95rem] text-fg">{t.van}</p>
              </motion.div>
            ) : (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3" data-testid="cau-tra-loi">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold/15 text-gold"><Sparkles className="size-4" aria-hidden /></span>
                <div className="min-w-0 flex-1 space-y-3">
                  {t.loi && <p role="alert" className="rounded-xl bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">{t.loi}</p>}
                  {t.phu}
                  {t.van && (
                    <div className="prose-vn rounded-2xl rounded-tl-md border border-line/70 bg-bg/40 px-4 py-3 text-[0.95rem] leading-relaxed">
                      {doanCoThuatNgu(t.van, t.thuatNgu)}
                      <ViSao canCu={t.canCu} thuatNgu={t.thuatNgu} nho />
                    </div>
                  )}
                  <KhungGiaiNghia ds={t.thuatNgu} />
                  {t.canhBao?.map((c) => (
                    <p key={c} className="flex gap-2 rounded-xl bg-moon/10 px-3 py-2 text-xs text-moon"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {c}</p>
                  ))}
                  {t.ghiChu && <p className="text-xs text-fg-faint">{t.ghiChu}</p>}
                  {t.ghiLuot && <p className="text-xs text-gold" data-testid="ghi-luot">{t.ghiLuot}</p>}
                  {t.sau && <div className="space-y-3" data-testid="sau-tra-loi">{t.sau}</div>}
                </div>
              </motion.div>
            ),
          )}
        </AnimatePresence>

        {/* Trục 2 UX: khung chờ nằm ĐÚNG chỗ câu trả lời sẽ hiện (bóng một ô trả lời + chữ "Đang soi câu hỏi…"), để
            người vừa bấm thấy ngay hệ thống đang làm — không phải đoán. */}
        {dang && (
          <div className="flex gap-3" role="status" data-testid="dang-soi">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold/15 text-gold"><Sparkles className="size-4 animate-pulse" aria-hidden /></span>
            <div className="min-w-0 flex-1 space-y-2 rounded-2xl rounded-tl-md border border-line/70 bg-bg/40 px-4 py-3">
              <p className="flex items-center gap-2 text-sm text-fg-muted">
                Đang soi câu hỏi…
                <span className="flex gap-1" aria-hidden>
                  {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-bounce rounded-full bg-gold/70" style={{ animationDelay: `${i * 120}ms` }} />)}
                </span>
              </p>
              <span className="block h-2.5 w-11/12 animate-pulse rounded-full bg-surface-2" aria-hidden />
              <span className="block h-2.5 w-3/4 animate-pulse rounded-full bg-surface-2" aria-hidden />
            </div>
          </div>
        )}
        <div ref={cuoi} />
      </div>

      <div className="border-t border-line/70 p-4 sm:p-5">
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [mask-image:linear-gradient(to_right,black_88%,transparent)] [scrollbar-width:none]" aria-label="Câu hỏi gợi ý">
          {goiY.flatMap((g) => g.cau.map((c) => (
            <button key={c} type="button" disabled={dang} onClick={() => hoi(c)} title={g.nhom}
              className="min-h-10 shrink-0 rounded-full border border-line bg-surface-2/60 px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-gold/50 hover:text-fg active:scale-[0.97] disabled:opacity-50">
              {c}
            </button>
          )))}
        </div>
        {dieuKhien && <div className="mb-3">{dieuKhien}</div>}
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void hoi(cau); }}>
          <Textarea rows={1} value={cau} maxLength={400} aria-label={nhanO} placeholder={goiYO ?? cc("hoi.o_nhap")}
            onChange={(e) => setCau(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void hoi(cau); } }}
            className="max-h-40 min-h-[4.5rem] [field-sizing:content] sm:min-h-12" />
          <Button type="submit" size="icon" className="shrink-0" disabled={dang || cau.trim().length < 3} aria-label="Gửi câu hỏi">
            <Send aria-hidden />
          </Button>
        </form>
      </div>
    </div>
  );
}
