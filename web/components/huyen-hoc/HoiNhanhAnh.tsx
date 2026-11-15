"use client";
// UI-PT2 P6 — "Chụp một góc, trả lời 3 câu": thay vì rà 20 ô dấu hiệu, người dùng chọn điều đang băn khoăn → đồ thị tri
// thức (engine, KB) chọn 3–5 câu có / không đúng phòng liên quan. Ảnh (nếu chụp) CHỈ hiện trên máy để nhìn mà trả lời —
// không gửi đi đâu, không lưu, không mô hình thị giác (PT-V2 chờ bộ ảnh có phiếu đồng ý). Câu trả lời điền vào ô dấu hiệu.
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { urlTheoNgonNgu } from "@/lib/ngon-ngu";

/** Mã ý định — nhãn ở bảng chữ lib/chu/phong-thuy.ts (`hn.y.<mã>`). */
const Y_DINH = ["suc_khoe", "kinh_doanh_tien", "cong_viec", "tinh_cam", "gia_dinh", "hoc_hanh", "nha_cua", "quan_he"] as const;
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
  const { c: t } = useChuPT();

  useEffect(() => () => { if (anhRef.current) URL.revokeObjectURL(anhRef.current); }, []);
  useEffect(() => {
    if (!yDinh) { setDt(null); return; }
    let huy = false;
    setLoi(null);
    fetch(urlTheoNgonNgu(`/api/phongthuy/do-thi/${yDinh}`)).then(async (r) => {
      if (!r.ok) throw new Error(t("hn.loi"));
      const d = (await r.json()) as DoThi;
      if (!huy) setDt(d);
    }).catch((e) => { if (!huy) setLoi(e instanceof Error ? e.message : t("hn.loi")); });
    return () => { huy = true; };
  }, [yDinh, t]);

  const chonAnh = (f: File | undefined) => {
    if (anhRef.current) URL.revokeObjectURL(anhRef.current);
    if (!f) { anhRef.current = null; setAnh(null); onChonAnh?.(null); return; }
    const u = URL.createObjectURL(f);
    anhRef.current = u; setAnh(u); onChonAnh?.(f);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hoi_nhanh_anh", co_anh: 1 });
  };
  const dat = (ma: string, v: "co" | "khong" | "bo_qua") => {
    setTraLoi((t) => ({ ...t, [ma]: v }));
    onDat(ma, v === "co" ? true : v === "khong" ? false : null);
  };
  const cau = dt ? dt.dau_hieu.filter((m) => dt.dau_hieu_hoi[m]).slice(0, 5) : [];

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/[0.04] p-3" data-testid="hoi-nhanh-anh">
      <p className="flex items-center gap-2 text-sm font-medium text-fg"><Camera className="size-4 text-gold" aria-hidden /> {t("hn.tieu_de")}</p>
      <p className="mt-1 text-xs text-fg-muted"><ChuB chu={t("hn.mo_ta")} lop="text-fg" /></p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("hn.y_aria")}>
        {Y_DINH.map((ma) => (
          <button key={ma} type="button" role="radio" aria-checked={yDinh === ma} data-testid={`hoi-nhanh-${ma}`}
            onClick={() => { const moi = yDinh === ma ? null : ma; setYDinh(moi); onYDinh?.(moi); setTraLoi({}); if (yDinh !== ma) ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hoi_nhanh_y_dinh", y_dinh: ma }); }}
            className={cn("rounded-full border px-3 py-1 text-xs", yDinh === ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>{t(`hn.y.${ma}`)}</button>
        ))}
      </div>
      {loi && <p role="alert" className="mt-2 text-sm text-cinnabar">{loi}</p>}
      {yDinh && dt && (
        <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_1fr]">
          <div>
            <label className="flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-bg/40 text-center text-xs text-fg-muted">
              {anh ? <img src={anh} alt={t("hn.anh_alt")} className="size-full object-cover" /> : <span className="px-2"><Camera className="mx-auto mb-1 size-5" aria-hidden />{t("hn.chup", { phong: dt.phong.map((p) => dt.ten_phong[p]?.toLowerCase()).filter(Boolean).slice(0, 2).join(" / ") })}</span>}
              <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label={t("hn.chup_aria")} onChange={(e) => chonAnh(e.target.files?.[0])} />
            </label>
            {anh && <button type="button" onClick={() => chonAnh(undefined)} className="mt-1 inline-flex items-center gap-1 text-xs text-fg-faint hover:text-fg"><X className="size-3" aria-hidden /> {t("hn.bo_anh")}</button>}
          </div>
          <ul className="space-y-2" data-testid="hoi-nhanh-cau">
            {cau.map((ma) => {
              const v = traLoi[ma] ?? (dau.has(ma) ? "co" : undefined);
              return (
                <li key={ma} className="text-sm">
                  <p className="text-fg">{dt.dau_hieu_hoi[ma]}</p>
                  <div className="mt-1 flex gap-1.5" role="radiogroup" aria-label={dt.dau_hieu_hoi[ma]}>
                    {([["co", t("hn.co")], ["khong", t("hn.khong")], ["bo_qua", t("hn.khong_ro")]] as const).map(([k, nhan]) => (
                      <button key={k} type="button" role="radio" aria-checked={v === k} onClick={() => dat(ma, k)}
                        className={cn("rounded-full border px-2.5 py-0.5 text-xs", v === k ? (k === "co" ? "border-moon bg-moon/15 text-fg" : "border-gold bg-gold/15 text-fg") : "border-line text-fg-muted hover:text-fg")}>{nhan}</button>
                    ))}
                  </div>
                </li>
              );
            })}
            {!cau.length && <li className="text-sm text-fg-muted">{t("hn.khong_gan")}</li>}
          </ul>
        </div>
      )}
      {yDinh && dt && cau.length > 0 && <p className="mt-2 text-xs text-fg-faint">{t("hn.da_tich")}</p>}
    </div>
  );
}
