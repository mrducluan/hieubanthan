"use client";
// KD-2c (P8) — "Quẻ ngày của bạn" trên Hôm nay: Mai Hoa theo HAI SỐ người dùng tự nghĩ tới (tâm động thì số động) + giờ lúc
// khởi. Engine tính (`/v1/kinhdich/que-rieng`) + nghĩa nôm na KB; web chỉ hiển thị và NHỚ TRÊN MÁY theo ngày (`hbt.que_rieng.v1`)
// — một ngày một quẻ, không "khởi lại cho đẹp" (lời quẻ Mông). Không câu hỏi, không hồ sơ, không gửi gì ngoài hai số.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Hexagon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { duongMoi } from "@/lib/duong-silo";

export const KHOA_QUE_RIENG = "hbt.que_rieng.v1";

export interface QueRiengKq {
  so: number; ten: string; thuong: string; ha: string; hao_dong: number; bien: { so: number; ten: string } | null;
  y_chinh: string | null; loi_khuyen: string | null; cau_tu_soi: string | null; duong: string | null; cach_khoi: string;
  dau_vao: { so: number[]; chi_gio: string; thoi_diem: string };
}
interface DaLuu { ngay: string; kq: QueRiengKq }

/** Giờ Việt Nam không múi "YYYY-MM-DDTHH:MM:SS" — engine đọc `thoi_diem` là giờ VN. */
export const gioVietNam = (d = new Date()) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 19);

function docDaLuu(ngay: string): QueRiengKq | null {
  try {
    const x = JSON.parse(localStorage.getItem(KHOA_QUE_RIENG) ?? "null") as DaLuu | null;
    return x && x.ngay === ngay && x.kq && typeof x.kq.ten === "string" ? x.kq : null;
  } catch { return null; }
}
function luu(ngay: string, kq: QueRiengKq) {
  try { localStorage.setItem(KHOA_QUE_RIENG, JSON.stringify({ ngay, kq } satisfies DaLuu)); } catch { /* trình duyệt chặn lưu */ }
}

export function QueRieng({ homNay }: { homNay: string }) {
  const [so, setSo] = useState(["", ""]);
  const [kq, setKq] = useState<QueRiengKq | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => { setKq(docDaLuu(homNay)); }, [homNay]);

  const khoi = async () => {
    const a = Number(so[0]), b = Number(so[1]);
    if (!(Number.isInteger(a) && a >= 1 && a <= 9999 && Number.isInteger(b) && b >= 1 && b <= 9999)) { setLoi("Gõ hai số nguyên từ 1 đến 9999."); return; }
    setDang(true); setLoi(null);
    try {
      const r = await fetch("/api/kinhdich/que-rieng", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ so: [a, b], thoi_diem: gioVietNam() }) });
      const d = (await r.json().catch(() => null)) as (QueRiengKq & { error?: string }) | null;
      if (!r.ok || !d || typeof d.ten !== "string") { setLoi(d?.error ?? "Chưa khởi được quẻ, bạn thử lại."); return; }
      luu(homNay, d); setKq(d);
      ghi("chart_interacted", { mo_dun: "kinhdich", kind: "que_rieng" });
    } catch { setLoi("Chưa khởi được quẻ, bạn thử lại."); }
    finally { setDang(false); }
  };
  const docLai = () => { try { localStorage.removeItem(KHOA_QUE_RIENG); } catch { /* bỏ qua */ } setKq(null); setSo(["", ""]); };

  return (
    <div className="mt-3 rounded-xl border border-line/70 bg-bg/30 p-3" data-testid="que-rieng">
      <p className="flex items-center gap-2 text-sm font-medium text-fg"><Sparkles className="size-4 text-gold" aria-hidden /> Quẻ ngày của riêng bạn</p>
      {!kq ? (
        <>
          <p className="mt-1 text-xs text-fg-muted">Nghĩ tới việc đang bận tâm, rồi gõ <b>hai số đầu tiên</b> hiện lên trong đầu (1–9999). Mai Hoa lấy số đó làm quẻ trên, quẻ dưới; cộng giờ lúc này ra hào động.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input inputMode="numeric" value={so[0]} onChange={(e) => setSo([e.target.value.replace(/\D/g, "").slice(0, 4), so[1] ?? ""])} placeholder="Số thứ nhất" aria-label="Số thứ nhất của bạn" className="h-10 w-32 text-sm" />
            <Input inputMode="numeric" value={so[1]} onChange={(e) => setSo([so[0] ?? "", e.target.value.replace(/\D/g, "").slice(0, 4)])} placeholder="Số thứ hai" aria-label="Số thứ hai của bạn" className="h-10 w-32 text-sm" />
            <Button type="button" size="sm" className="min-h-10" onClick={khoi} disabled={dang || !so[0] || !so[1]} data-testid="que-rieng-khoi">{dang ? "Đang khởi…" : "Khởi quẻ"}</Button>
          </div>
          {loi && <p className="mt-1 text-xs text-cinnabar" role="alert">{loi}</p>}
        </>
      ) : (
        <div className="mt-1 space-y-1.5" data-testid="que-rieng-kq">
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <Hexagon className="size-4 text-gold" aria-hidden />
            <b className="font-serif text-base" data-testid="que-rieng-ten">{kq.ten}</b>
            <span className="text-xs text-fg-muted">quẻ {kq.so} · {kq.thuong} trên {kq.ha} · hào {kq.hao_dong} động{kq.bien ? ` → ${kq.bien.ten}` : ""} · số {kq.dau_vao.so.join(" và ")}, giờ {kq.dau_vao.chi_gio}</span>
          </p>
          {kq.y_chinh && <p className="text-sm">{kq.y_chinh}</p>}
          {kq.loi_khuyen && <p className="text-sm"><span className="text-jade">Gợi ý:</span> {kq.loi_khuyen}</p>}
          {kq.cau_tu_soi && <p className="text-sm text-moon">Tự soi: {kq.cau_tu_soi}</p>}
          <p className="text-xs text-fg-faint">
            Quẻ này của riêng bạn hôm nay — theo lời quẻ Mông, không khởi lại cho tới ngày mai.{" "}
            <Link href={`/kinh-dich?cach=mai_hoa_so&so=${kq.dau_vao.so.join(",")}`} className="text-gold hover:underline" data-testid="que-rieng-doc-ky">Đọc kỹ quẻ này cho việc của bạn →</Link>
            {kq.duong && <> · <Link href={duongMoi(kq.duong)} className="text-gold hover:underline">Nghĩa quẻ {kq.ten}</Link></>}
            {" "}· <button type="button" onClick={docLai} className="underline-offset-4 hover:underline">Gõ nhầm số, nhập lại</button>
          </p>
        </div>
      )}
    </div>
  );
}
