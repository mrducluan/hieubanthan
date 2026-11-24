"use client";
// Pop-up gọn cho các câu hỏi PHI HÌNH ẢNH (giọng nói, dáng đi, cốt nhục, chẩm cốt) sau khi hệ thống đã tự đo khuôn mặt 478 điểm 3D.
// Người dùng có thể trả lời nhanh trong vài giây hoặc bấm "Bỏ qua & Xem bài đọc ngay".
import { useEffect, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CauHoi, TraLoi } from "@/lib/nhan-tuong";
import { cn } from "@/lib/utils";

export const MA_CAU_PHI_ANH = ["giong", "dang", "cot_nhuc", "cham_cot"] as const;

export function PopupCauHoiPhu({
  mo,
  cauHoi,
  traLoiHienTai,
  soCauTuDong,
  en,
  dangTai,
  onXong,
  onDong,
}: {
  mo: boolean;
  cauHoi: CauHoi[];
  traLoiHienTai: TraLoi;
  soCauTuDong: number;
  en?: boolean;
  dangTai?: boolean;
  onXong: (traLoiBoSung: TraLoi) => void;
  onDong: () => void;
}) {
  const [chon, setChon] = useState<TraLoi>({});

  useEffect(() => {
    if (!mo) return;
    const banDau: TraLoi = {};
    for (const c of cauHoi) {
      if (traLoiHienTai[c.ma]) banDau[c.ma] = traLoiHienTai[c.ma]!;
    }
    setChon(banDau);
  }, [mo, cauHoi, traLoiHienTai]);

  useEffect(() => {
    if (!mo) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onDong(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mo, onDong]);

  if (!mo || cauHoi.length === 0) return null;

  const daTraLoi = cauHoi.filter((c) => chon[c.ma] && chon[c.ma] !== "khong_chac").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-phi-anh-title"
      data-testid="popup-cau-hoi-phu"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-gold/40 bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line/60 px-5 py-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gold">
              <Sparkles className="size-3.5" aria-hidden />
              {en ? `Auto-measured ${soCauTuDong} facial traits` : `Hệ thống đã tự tính ${soCauTuDong} nét từ gương mặt`}
            </p>
            <h3 id="popup-phi-anh-title" className="mt-1 font-serif text-xl text-fg">
              {en ? "Quick check: Voice & Posture (optional)" : "Bổ sung nhanh: Giọng nói & Dáng đi (tuỳ chọn)"}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              {en
                ? "Camera photos cannot capture voice tone, gait, or firmness. Answer any of these to enrich your Eastern + Western reading, or skip straight to the report."
                : "Ảnh chụp không đo được giọng nói, dáng đi hay cảm giác chạm. Chọn nhanh nếu muốn bài luận giải Đông – Tây sâu hơn, hoặc bỏ qua để xem ngay."}
            </p>
          </div>
          <button
            type="button"
            onClick={onDong}
            aria-label={en ? "Close" : "Đóng"}
            className="rounded-full p-1.5 text-fg-faint hover:bg-bg/60 hover:text-fg"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {cauHoi.map((c) => {
            const val = chon[c.ma];
            return (
              <div key={c.ma} className="rounded-2xl border border-line/60 bg-bg/40 p-3.5">
                <p className="text-sm font-medium text-fg">{c.hoi}</p>
                {c.huong_dan && <p className="mt-0.5 text-xs text-fg-faint">{c.huong_dan}</p>}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {c.lua_chon
                    .filter((l) => l.ma !== "khong_chac")
                    .map((l) => {
                      const active = val === l.ma;
                      return (
                        <button
                          key={l.ma}
                          type="button"
                          onClick={() => setChon((prev) => ({ ...prev, [c.ma]: active ? "" : l.ma }))}
                          data-testid={`popup-opt-${c.ma}-${l.ma}`}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                            active
                              ? "border-gold bg-gold/15 font-medium text-gold"
                              : "border-line/70 bg-surface/60 text-fg-muted hover:border-gold/50 hover:text-fg",
                          )}
                        >
                          {active && <Check className="size-3" aria-hidden />}
                          {l.nhan}
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 bg-bg/40 px-5 py-3.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={dangTai}
            onClick={() => onXong({})}
            data-testid="popup-bo-qua"
          >
            {en ? "Skip & View Reading" : "Bỏ qua & Xem bài đọc ngay"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={dangTai}
            onClick={() => {
              const sach: TraLoi = {};
              for (const [k, v] of Object.entries(chon)) {
                if (v) sach[k] = v;
              }
              onXong(sach);
            }}
            data-testid="popup-xac-nhan"
          >
            {dangTai
              ? (en ? "Generating…" : "Đang luận giải…")
              : (en
                  ? `View Reading${daTraLoi ? ` (+${daTraLoi})` : ""}`
                  : `Xem bài đọc Đông – Tây${daTraLoi ? ` (+${daTraLoi})` : ""}`)}
          </Button>
        </div>
      </div>
    </div>
  );
}
