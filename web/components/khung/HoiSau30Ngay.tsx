"use client";
// Q7 — khối "30 ngày trước bạn thấy đúng điều này" trên Hôm nay: hỏi lại hai câu ba mức (đã làm theo chưa · thấy khác gì) cho
// MỘT hộp đến hạn (lưu trên máy, lib/kiem-chung-sau). Câu trả lời = phiếu ẩn danh (mã + hai mức), không chữ.
import { useEffect, useState } from "react";
import { CheckCircle2, History } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { boQuaHoi, denHanHoi, traLoiSau, type GhiNhan } from "@/lib/kiem-chung-sau";

const DA_LAM = [["da_lam", "Đã làm"], ["mot_phan", "Làm một phần"], ["chua", "Chưa làm"]] as const;
const THAY = [["tot_hon", "Dễ chịu hơn"], ["nhu_cu", "Như cũ"], ["kho_noi", "Khó nói"]] as const;
// KD-2d (P9): cùng hai câu ba mức (cùng mã phiếu) nhưng lời hỏi cho QUẺ đã gieo — "việc đó ra sao?" thay vì "hộp có ích không?".
const DA_LAM_QUE = [["da_lam", "Đã làm theo"], ["mot_phan", "Theo một phần"], ["chua", "Không theo"]] as const;
const THAY_QUE = [["tot_hon", "Thuận hơn"], ["nhu_cu", "Như cũ"], ["kho_noi", "Khó nói"]] as const;

export function HoiSau30Ngay({ homNay, moDun }: { homNay: string; moDun?: string }) {
  const [g, setG] = useState<(GhiNhan & { sau_ngay: number }) | null>(null);
  const [daLam, setDaLam] = useState<(typeof DA_LAM)[number][0] | null>(null);
  const [xong, setXong] = useState(false);
  useEffect(() => { setG(denHanHoi(homNay, moDun)); }, [homNay, moDun]);
  if (!g) return null;
  const laQue = g.loai_hoi === "que";
  const dsDaLam = laQue ? DA_LAM_QUE : DA_LAM, dsThay = laQue ? THAY_QUE : THAY;
  const tra = (thay: (typeof THAY)[number][0]) => {
    if (!daLam) return;
    setXong(true);
    void traLoiSau(g, daLam, thay);
    ghi("feedback_submitted", { kind: "sau_30", mo_dun: g.mo_dun, da_lam: daLam, thay_khac: thay, sau_ngay: g.sau_ngay, loai_hoi: g.loai_hoi ?? "hop" });
  };
  return (
    <section aria-labelledby="hoi-sau-30" className="glass space-y-2 rounded-2xl p-5" data-testid="hoi-sau-30">
      <h2 id="hoi-sau-30" className="flex items-center gap-2 text-xl"><History className="size-5 text-gold" aria-hidden /> {laQue ? `${g.sau_ngay} ngày trước bạn gieo quẻ này` : `${g.sau_ngay} ngày trước bạn thấy đúng điều này`}</h2>
      <p className="text-sm text-fg">“{g.nhan}”</p>
      {xong ? (
        <p className="flex items-center gap-2 text-sm text-jade" role="status"><CheckCircle2 className="size-4" aria-hidden /> Cảm ơn bạn — chỉ hai lựa chọn này được ghi lại, không kèm gì khác.</p>
      ) : (
        <>
          <p className="text-sm text-fg-muted">{laQue ? "Bạn có làm theo hướng quẻ gợi không?" : "Bạn đã làm theo chưa?"}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Đã làm theo chưa">
            {dsDaLam.map(([m, t]) => (
              <button key={m} type="button" role="radio" aria-checked={daLam === m} onClick={() => setDaLam(m)}
                className={`rounded-full border px-3 py-1 text-sm ${daLam === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg"}`}>{t}</button>
            ))}
          </div>
          {daLam && (
            <>
              <p className="text-sm text-fg-muted">{laQue ? "Việc đó giờ ra sao?" : daLam === "chua" ? "Chỗ đó giờ thế nào?" : "Thấy khác gì không?"}</p>
              <div className="flex flex-wrap gap-2">
                {dsThay.map(([m, t]) => (
                  <button key={m} type="button" onClick={() => tra(m)} className="rounded-full border border-line px-3 py-1 text-sm text-fg-muted hover:border-gold/60 hover:text-fg">{t}</button>
                ))}
              </div>
            </>
          )}
          <button type="button" onClick={() => { boQuaHoi(g.mau); setG(null); }} className="text-xs text-fg-faint underline-offset-4 hover:underline">Không hỏi lại điều này</button>
        </>
      )}
      <p className="text-xs text-fg-faint">{laQue ? "Câu trả lời giúp xem lại lời quẻ nào thật sự ứng. Chỉ ghi mã lời đọc và hai lựa chọn — không câu hỏi, không sáu hào, không tên." : "Câu trả lời giúp xem lại lời khuyên nào thật sự có ích. Chỉ ghi mã hộp và hai lựa chọn — không tên, không nhà, không ngày sinh."}</p>
    </section>
  );
}
