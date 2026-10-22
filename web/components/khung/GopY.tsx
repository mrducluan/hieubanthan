"use client";
import { useState } from "react";
import { useChuChung } from "@/components/cms/ChuChung";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

// Góp ý 1 chạm (Gate 1: user satisfaction) — chỉ gửi lựa chọn, không gửi chữ tự do.
// Nhãn nút sửa được ở CMS ("Chữ dùng chung"); mã đo (gt) cố định.
const LUA_CHON = [
  { gt: "co", khoa: "gop_y_bai.co" },
  { gt: "vua", khoa: "gop_y_bai.vua" },
  { gt: "khong", khoa: "gop_y_bai.khong" },
] as const;

export function GopY({ cauHoi, moDun = "thanso" }: { cauHoi?: string; moDun?: string }) {
  const c = useChuChung();
  const [chon, setChon] = useState<string | null>(null);
  return (
    <div className="glass mx-auto flex max-w-xl flex-col items-center gap-3 rounded-2xl p-5 text-center" data-testid="gop-y">
      {chon ? (
        <p className="text-sm text-fg-muted">{c("gop_y_bai.cam_on")}</p>
      ) : (
        <>
          <p className="font-serif text-lg">{cauHoi ?? c("gop_y_bai.hoi")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {LUA_CHON.map(({ gt, khoa }) => (
              <button key={gt} type="button" onClick={() => { setChon(gt); ghi("feedback_submitted", { huu_ich: gt, mo_dun: moDun }); }}
                className={cn("rounded-full border border-line px-4 py-2 text-sm text-fg-muted transition-colors hover:border-gold/60 hover:text-fg")}>
                {c(khoa)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
