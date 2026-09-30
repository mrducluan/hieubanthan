"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Info, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface KetQuaHoi {
  van?: string;
  /** Phần trực quan kèm câu trả lời (quẻ, cung, tứ trụ…). */
  phu?: ReactNode;
  ghiChu?: string;
  canhBao?: string[];
  loi?: string;
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
  className?: string;
}

// Mỗi mảng một khung chat (chủ dự án chốt): lịch sử trong phiên, gợi ý câu hỏi, không lưu phía server
// ngoài nhật ký ẩn danh đã lọc (0004/0005).
export function KhungChat({ loiChao, goiY, gui, dieuKhien, nhanO = "Câu hỏi của bạn", goiYO = "Gõ điều bạn đang băn khoăn…", cauNgoai, className }: Props) {
  const [tin, setTin] = useState<Tin[]>([]);
  const [cau, setCau] = useState("");
  const [dang, setDang] = useState(false);
  const cuoi = useRef<HTMLDivElement>(null);
  const soId = useRef(0);

  useEffect(() => {
    if (tin.length) cuoi.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [tin.length, dang]);

  useEffect(() => {
    if (cauNgoai) void hoi(cauNgoai.cau);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi có câu mới từ ngoài
  }, [cauNgoai?.lan]);

  async function hoi(q: string) {
    const c = q.trim();
    if (c.length < 3 || dang) return;
    setCau("");
    setTin((t) => [...t, { id: ++soId.current, ai: "ban", van: c }]);
    setDang(true);
    try {
      const kq = await gui(c);
      setTin((t) => [...t, { id: ++soId.current, ai: "he", ...kq }]);
    } catch {
      setTin((t) => [...t, { id: ++soId.current, ai: "he", loi: "Không kết nối được. Thử lại sau." }]);
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
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
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
                      {t.van.split("\n\n").map((p, i) => (
                        <p key={i} className="whitespace-pre-line">{p}</p>
                      ))}
                    </div>
                  )}
                  {t.canhBao?.map((c) => (
                    <p key={c} className="flex gap-2 rounded-xl bg-moon/10 px-3 py-2 text-xs text-moon"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {c}</p>
                  ))}
                  {t.ghiChu && <p className="text-xs text-fg-faint">{t.ghiChu}</p>}
                </div>
              </motion.div>
            ),
          )}
        </AnimatePresence>

        {dang && (
          <div className="flex items-center gap-3 text-sm text-fg-faint" role="status">
            <span className="grid size-8 place-items-center rounded-full bg-gold/15 text-gold"><Sparkles className="size-4 animate-pulse" aria-hidden /></span>
            <span className="flex gap-1" aria-label="Đang soi">
              {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-bounce rounded-full bg-gold/70" style={{ animationDelay: `${i * 120}ms` }} />)}
            </span>
          </div>
        )}
        <div ref={cuoi} />
      </div>

      <div className="border-t border-line/70 p-4 sm:p-5">
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" aria-label="Câu hỏi gợi ý">
          {goiY.flatMap((g) => g.cau.map((c) => (
            <button key={c} type="button" disabled={dang} onClick={() => hoi(c)} title={g.nhom}
              className="shrink-0 rounded-full border border-line bg-surface-2/60 px-3.5 py-1.5 text-sm text-fg-muted transition-colors hover:border-gold/50 hover:text-fg disabled:opacity-50">
              {c}
            </button>
          )))}
        </div>
        {dieuKhien && <div className="mb-3">{dieuKhien}</div>}
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void hoi(cau); }}>
          <Textarea rows={1} value={cau} maxLength={400} aria-label={nhanO} placeholder={goiYO}
            onChange={(e) => setCau(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void hoi(cau); } }}
            className="max-h-40 min-h-12" />
          <Button type="submit" size="icon" disabled={dang || cau.trim().length < 3} aria-label="Gửi câu hỏi">
            <Send aria-hidden />
          </Button>
        </form>
      </div>
    </div>
  );
}
