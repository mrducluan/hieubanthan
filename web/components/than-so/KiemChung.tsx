"use client";
// Thẻ kiểm chứng (thay "Tự soi" — chủ dự án 2026-10-20): 3 nét mạnh + 3 điểm mù thường gặp của con số (engine lấy từ kho
// chân dung). Người dùng tự tích nét đúng với mình; số nét được đếm NGAY TRÊN MÁY (không gửi đi, không lưu) và lời đọc
// kết quả theo ngưỡng engine trả — chỗ nào chưa khớp thì gợi ý con số khác của chính họ.
import { useState } from "react";
import { Check } from "lucide-react";
import type { KiemChung as KC } from "@/lib/engine";
import { cn } from "@/lib/utils";
import { KhoiLop } from "./LopNoiDung";

export function KiemChung({ kc, so, viTri }: { kc: KC; so: number; viTri: string }) {
  const [chon, setChon] = useState<Set<number>>(new Set());
  const n = chon.size;
  const ketQua = n >= kc.nguong.khop ? kc.ket_qua.khop : n >= kc.nguong.mot_phan ? kc.ket_qua.mot_phan : kc.ket_qua.chua_khop;
  const doi = (i: number) => setChon((c) => { const m = new Set(c); if (m.has(i)) m.delete(i); else m.add(i); return m; });
  return (
    <KhoiLop loai="soi" className="mt-4">
      <p className="text-sm" id={`kc-${viTri}`}>{kc.cau_hoi}</p>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2" aria-labelledby={`kc-${viTri}`} data-testid={`kiem-chung-${viTri}`}>
        {kc.net.map((x, i) => (
          <li key={i}>
            <button type="button" role="checkbox" aria-checked={chon.has(i)} onClick={() => doi(i)}
              className={cn("flex w-full items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors",
                chon.has(i) ? "border-moon bg-moon/10" : "border-line/70 hover:border-moon/60")}>
              <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded border",
                chon.has(i) ? "border-moon bg-moon text-bg" : "border-line")}>{chon.has(i) && <Check className="size-3" aria-hidden />}</span>
              <span><span className={cn("text-xs", x.loai === "manh" ? "text-jade" : "text-cinnabar")}>{x.loai === "manh" ? "Điểm mạnh" : "Điểm mù"}:</span> {x.chu}</span>
            </button>
          </li>
        ))}
      </ul>
      {n > 0 ? (
        <p className="mt-3 rounded-lg bg-moon/10 px-3 py-2 text-sm" data-testid={`ket-qua-kiem-chung-${viTri}`} aria-live="polite">
          <b className="text-moon">Khớp {n}/{kc.net.length}.</b> {ketQua}
        </p>
      ) : (
        <p className="mt-3 text-xs text-fg-faint">Khi số {so} căng thẳng, người ta thường: {kc.khi_cang_thang.charAt(0).toLowerCase() + kc.khi_cang_thang.slice(1)} Lựa chọn chỉ đếm trên máy của bạn.</p>
      )}
    </KhoiLop>
  );
}
