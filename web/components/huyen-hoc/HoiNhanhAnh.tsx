"use client";
// UI-PT2 P6 — "Chụp một góc, trả lời 3 câu": thay vì rà 20 ô dấu hiệu, người dùng chọn điều đang băn khoăn → đồ thị tri
// thức (engine, KB) chọn 3–5 câu có / không đúng phòng liên quan. Ảnh (nếu chụp) CHỈ hiện trên máy để nhìn mà trả lời —
// không gửi đi đâu, không lưu, không mô hình thị giác (PT-V2 chờ bộ ảnh có phiếu đồng ý). Câu trả lời điền vào ô dấu hiệu.
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

const Y_DINH: [string, string][] = [
  ["suc_khoe", "Sức khoẻ, giấc ngủ"], ["kinh_doanh_tien", "Tiền bạc, làm ăn"], ["cong_viec", "Công việc"], ["tinh_cam", "Tình cảm"],
  ["gia_dinh", "Gia đình"], ["hoc_hanh", "Học hành của con"], ["nha_cua", "Nhà cửa nói chung"], ["quan_he", "Hàng xóm, quan hệ"],
];
interface DoThi { phong: string[]; dau_hieu: string[]; dau_hieu_hoi: Record<string, string>; ten_phong: Record<string, string> }

export function HoiNhanhAnh({ dau, onDat, onChonAnh, onYDinh }: {
  dau: Set<string>; onDat: (ma: string, co: boolean | null) => void;
  /** PT-V2: ảnh vừa chọn ở đây dùng lại được cho "Để máy đọc ảnh" (vẫn chỉ trên máy cho tới khi người dùng tự tích gửi). */
  onChonAnh?: (f: File | null) => void;
  onYDinh?: (y: string | null) => void;
}) {
  const [yDinh, setYDinh] = useState<string | null>(null);
  const [dt, setDt] = useState<DoThi | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [anh, setAnh] = useState<string | null>(null);
  const [traLoi, setTraLoi] = useState<Record<string, "co" | "khong" | "bo_qua">>({});
  const anhRef = useRef<string | null>(null);

  useEffect(() => () => { if (anhRef.current) URL.revokeObjectURL(anhRef.current); }, []);
  useEffect(() => {
    if (!yDinh) { setDt(null); return; }
    let huy = false;
    setLoi(null);
    fetch(`/api/phongthuy/do-thi/${yDinh}`).then(async (r) => {
      if (!r.ok) throw new Error("Chưa tải được câu hỏi.");
      const d = (await r.json()) as DoThi;
      if (!huy) setDt(d);
    }).catch((e) => { if (!huy) setLoi(e instanceof Error ? e.message : "Chưa tải được câu hỏi."); });
    return () => { huy = true; };
  }, [yDinh]);

  const chonAnh = (f: File | undefined) => {
    if (anhRef.current) URL.revokeObjectURL(anhRef.current);
    if (!f) { anhRef.current = null; setAnh(null); onChonAnh?.(null); return; }
    const u = URL.createObjectURL(f);
    anhRef.current = u; setAnh(u); onChonAnh?.(f);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hoi_nhanh_anh", co_anh: true });
  };
  const dat = (ma: string, v: "co" | "khong" | "bo_qua") => {
    setTraLoi((t) => ({ ...t, [ma]: v }));
    onDat(ma, v === "co" ? true : v === "khong" ? false : null);
  };
  const cau = dt ? dt.dau_hieu.filter((m) => dt.dau_hieu_hoi[m]).slice(0, 5) : [];

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/[0.04] p-3" data-testid="hoi-nhanh-anh">
      <p className="flex items-center gap-2 text-sm font-medium text-fg"><Camera className="size-4 text-gold" aria-hidden /> Cách nhanh: chụp một góc, trả lời 3 câu</p>
      <p className="mt-1 text-xs text-fg-muted">Chọn điều bạn đang băn khoăn — hệ thống hỏi đúng 3–5 câu về phòng liên quan. Chụp ảnh góc đó để vừa nhìn vừa trả lời; <b className="text-fg">ảnh chỉ nằm trên máy bạn</b>, không tải lên, không lưu.</p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Điều đang băn khoăn (hỏi nhanh)">
        {Y_DINH.map(([ma, ten]) => (
          <button key={ma} type="button" role="radio" aria-checked={yDinh === ma} data-testid={`hoi-nhanh-${ma}`}
            onClick={() => { const moi = yDinh === ma ? null : ma; setYDinh(moi); onYDinh?.(moi); setTraLoi({}); if (yDinh !== ma) ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hoi_nhanh_y_dinh", y_dinh: ma }); }}
            className={cn("rounded-full border px-3 py-1 text-xs", yDinh === ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>{ten}</button>
        ))}
      </div>
      {loi && <p role="alert" className="mt-2 text-sm text-cinnabar">{loi}</p>}
      {yDinh && dt && (
        <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_1fr]">
          <div>
            <label className="flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-bg/40 text-center text-xs text-fg-muted">
              {anh ? <img src={anh} alt="Góc nhà bạn vừa chụp (chỉ hiện trên máy)" className="size-full object-cover" /> : <span className="px-2"><Camera className="mx-auto mb-1 size-5" aria-hidden />Chụp hoặc chọn ảnh {dt.phong.map((p) => dt.ten_phong[p]?.toLowerCase()).filter(Boolean).slice(0, 2).join(" / ")}</span>}
              <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Chụp hoặc chọn ảnh góc nhà (chỉ hiện trên máy)" onChange={(e) => chonAnh(e.target.files?.[0])} />
            </label>
            {anh && <button type="button" onClick={() => chonAnh(undefined)} className="mt-1 inline-flex items-center gap-1 text-xs text-fg-faint hover:text-fg"><X className="size-3" aria-hidden /> Bỏ ảnh</button>}
          </div>
          <ul className="space-y-2" data-testid="hoi-nhanh-cau">
            {cau.map((ma) => {
              const v = traLoi[ma] ?? (dau.has(ma) ? "co" : undefined);
              return (
                <li key={ma} className="text-sm">
                  <p className="text-fg">{dt.dau_hieu_hoi[ma]}</p>
                  <div className="mt-1 flex gap-1.5" role="radiogroup" aria-label={dt.dau_hieu_hoi[ma]}>
                    {([["co", "Có"], ["khong", "Không"], ["bo_qua", "Không rõ"]] as const).map(([k, t]) => (
                      <button key={k} type="button" role="radio" aria-checked={v === k} onClick={() => dat(ma, k)}
                        className={cn("rounded-full border px-2.5 py-0.5 text-xs", v === k ? (k === "co" ? "border-moon bg-moon/15 text-fg" : "border-gold bg-gold/15 text-fg") : "border-line text-fg-muted hover:text-fg")}>{t}</button>
                    ))}
                  </div>
                </li>
              );
            })}
            {!cau.length && <li className="text-sm text-fg-muted">Điều này không gắn với dấu hiệu nào trong nhà — hãy khai phòng và hướng ở trên.</li>}
          </ul>
        </div>
      )}
      {yDinh && dt && cau.length > 0 && <p className="mt-2 text-xs text-fg-faint">Câu “Có” đã được tích vào mục 4 bên dưới. Bấm “Xem luận bố cục” để đọc.</p>}
    </div>
  );
}
