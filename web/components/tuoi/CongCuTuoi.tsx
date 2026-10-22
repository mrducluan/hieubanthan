"use client";
// TDG-1 — công cụ: nhập năm sinh (tự điền từ hồ sơ trên máy) + năm xem → engine tính, web hiển thị.
// Ngày sinh chỉ gửi để tính tuổi âm lịch, không lưu. Đo lường chỉ gửi loại công cụ + năm xem.
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHoSo } from "@/lib/hoso";
import { ghi } from "@/lib/do-luong";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { NAM_BANG_TU, type LamNha, type XongDat } from "@/lib/tuoi-dan-gian";
import { NutChiaSeXongDat } from "@/components/chia-se/NutChiaSeXongDat";
import { KetQuaLamNha, KetQuaXongDat } from "./KetQuaTuoi";

type Kieu = "lam_nha" | "xong_dat";

export function CongCuTuoi({ kieu, namMacDinh }: { kieu: Kieu; namMacDinh: number }) {
  const hoSo = useHoSo();
  const [namSinh, setNamSinh] = useState("");
  const [nam, setNam] = useState(String(namMacDinh));
  const [kq, setKq] = useState<LamNha | XongDat | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const tuHoSo = hoSo && String(hoSo.nam) === namSinh;

  useEffect(() => { if (hoSo && !namSinh) setNamSinh(String(hoSo.nam)); }, [hoSo, namSinh]);
  useBatDauDoc(kieu === "lam_nha" ? "tuoi_lam_nha" : "tuoi_xong_dat", Boolean(kq));

  async function xem(e?: React.FormEvent) {
    e?.preventDefault();
    const ns = Number(namSinh), n = Number(nam);
    if (!(ns >= 1900 && ns <= 2099) || !(n >= 1901 && n <= 2099)) { setLoi("Nhập năm sinh và năm xem dạng 4 chữ số."); return; }
    setDang(true); setLoi(null);
    const ngay = tuHoSo && hoSo ? { thang_sinh: hoSo.thang, ngay_sinh: hoSo.ngay } : {};
    const body = kieu === "lam_nha" ? { nam_sinh: ns, nam_xay: n, ...ngay } : { nam: n, nam_sinh: ns, ...ngay };
    try {
      const r = await fetch(kieu === "lam_nha" ? "/api/tuoi/lam-nha" : "/api/tuoi/xong-dat", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Chưa xem được, thử lại sau.");
      setKq(j as LamNha | XongDat);
      ghi("chart_interacted", { mo_dun: kieu === "lam_nha" ? "tuoi_lam_nha" : "tuoi_xong_dat", kind: "xem" });
    } catch (err) { setLoi(err instanceof Error ? err.message : "Chưa xem được."); }
    finally { setDang(false); }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={(e) => void xem(e)} className="glass flex flex-wrap items-end gap-3 rounded-2xl p-5" data-testid="form-tuoi">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-fg-muted">{kieu === "lam_nha" ? "Năm sinh người đứng tên" : "Năm sinh gia chủ"}</span>
          <input inputMode="numeric" maxLength={4} value={namSinh} onChange={(e) => setNamSinh(e.target.value.replace(/\D/g, ""))}
            className="w-28 rounded-xl border border-line bg-bg/60 px-3 py-2 outline-none focus:border-gold" placeholder="1990" aria-label="Năm sinh" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-fg-muted">{kieu === "lam_nha" ? "Năm định làm (âm lịch)" : "Tết năm"}</span>
          <input inputMode="numeric" maxLength={4} value={nam} onChange={(e) => setNam(e.target.value.replace(/\D/g, ""))}
            className="w-28 rounded-xl border border-line bg-bg/60 px-3 py-2 outline-none focus:border-gold" aria-label="Năm xem" />
        </label>
        <Button type="submit" disabled={dang}><Search aria-hidden />{dang ? "Đang xem…" : "Xem ngay"}</Button>
        {tuHoSo && <p className="w-full text-xs text-fg-muted">Đã điền năm sinh từ hồ sơ trên máy bạn (tính cả ngày sinh để biết tuổi âm chính xác).</p>}
      </form>
      {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
      <div aria-live="polite">
        {kq && (kieu === "lam_nha" ? <KetQuaLamNha d={kq as LamNha} /> : <KetQuaXongDat d={kq as XongDat} />)}
      </div>
      {/* Thẻ xông đất theo năm: chỉ năm + can chi năm, không tuổi gia chủ vừa nhập. */}
      {kq && kieu === "xong_dat" && (kq as XongDat).nam.nam >= NAM_BANG_TU && (
        <NutChiaSeXongDat nam={(kq as XongDat).nam.nam} canChi={(kq as XongDat).nam.can_chi} />
      )}
      {kq && <CuoiBaiDoc moDun={kieu === "lam_nha" ? "tuoi_lam_nha" : "tuoi_xong_dat"} cauHoi="Kết quả có giúp bạn lên kế hoạch?" />}
    </div>
  );
}
