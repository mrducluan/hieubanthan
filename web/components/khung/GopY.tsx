"use client";
import { useState } from "react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

// Góp ý 1 chạm (Gate 1: user satisfaction) — chỉ gửi lựa chọn, không gửi chữ tự do.
const LUA_CHON = [
  { gt: "co", nhan: "Có, khá trúng" },
  { gt: "vua", nhan: "Một phần" },
  { gt: "khong", nhan: "Chưa" },
] as const;

export function GopY({ cauHoi = "Bài đọc này có giúp bạn hiểu mình hơn?", moDun = "thanso" }: { cauHoi?: string; moDun?: string }) {
  const [chon, setChon] = useState<string | null>(null);
  return (
    <div className="glass mx-auto flex max-w-xl flex-col items-center gap-3 rounded-2xl p-5 text-center" data-testid="gop-y">
      {chon ? (
        <p className="text-sm text-fg-muted">Cảm ơn bạn — góp ý này giúp bài đọc tốt hơn.</p>
      ) : (
        <>
          <p className="font-serif text-lg">{cauHoi}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {LUA_CHON.map(({ gt, nhan }) => (
              <button key={gt} type="button" onClick={() => { setChon(gt); ghi("feedback_submitted", { huu_ich: gt, mo_dun: moDun }); }}
                className={cn("rounded-full border border-line px-4 py-2 text-sm text-fg-muted transition-colors hover:border-gold/60 hover:text-fg")}>
                {nhan}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
