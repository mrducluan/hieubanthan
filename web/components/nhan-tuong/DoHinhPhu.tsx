"use client";
// Lớp phủ chú giải trên ĐỒ HÌNH khắc gỗ (Thần Tướng Toàn Biên): ảnh gốc giữ nguyên điểm ảnh, điểm ghim đặt tuyệt đối theo
// toạ độ 0..1 engine trả. Rê / chạm / Tab vào điểm → thẻ giải nghĩa (chữ Hán, âm, tên, nghĩa). Công tắc "Xem bản khắc gốc"
// ẩn toàn bộ lớp phủ. Nốt ruồi tô ba sắc độ dịu theo nhóm lời sách (không màu đỏ). Web chỉ hiển thị, không tính.
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, ZoomIn, ZoomOut } from "lucide-react";
import Link from "@/components/khung/Lien";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { anhDoHinh, type DiemDoHinh, type DoHinh } from "@/lib/do-hinh";

const MAU_MUC: Record<string, string> = {
  A: "bg-jade/90 ring-jade/40",
  B: "bg-gold/90 ring-gold/40",
  C: "bg-amber-700/90 ring-amber-700/40",
};
const NHAN_MUC: Record<string, string> = { A: "Sách ghi", B: "Nên chú ý", C: "Ghi chép xưa" };

export function DoHinhPhu({ dh }: { dh: DoHinh }) {
  const [hien, setHien] = useState(true);
  const [loc, setLoc] = useState<string | null>(null);
  const [chon, setChon] = useState<string | null>(null);
  const [phong, setPhong] = useState(false);
  const khung = useRef<HTMLDivElement>(null);
  const diem = useMemo(() => dh.diem.filter((p) => !loc || p.nhom === loc), [dh.diem, loc]);
  const dang = dh.diem.find((p) => p.id === chon) ?? null;

  useEffect(() => {
    const dong = (e: KeyboardEvent) => { if (e.key === "Escape") setChon(null); };
    window.addEventListener("keydown", dong);
    return () => window.removeEventListener("keydown", dong);
  }, []);

  const mo = (p: DiemDoHinh) => {
    if (p.id === chon) return;
    setChon(p.id);
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: "do_hinh_diem", muc: dh.ma });
  };
  // Chấm trên bản khắc nằm sát nhau (nốt ruồi cách nhau vài phần trăm khổ hình): chạm / rê vào đâu thì mở chấm GẦN NHẤT
  // trong bán kính tính theo điểm ảnh màn hình — nút từng chấm vẫn giữ cho bàn phím (Tab) và trình đọc màn hình.
  const ganNhat = (x: number, y: number, banKinh: number): DiemDoHinh | null => {
    const r = khung.current?.getBoundingClientRect();
    if (!r) return null;
    let tot: DiemDoHinh | null = null, kc = banKinh;
    for (const p of diem) {
      const d = Math.hypot(p.vt[0] * r.width - (x - r.left), p.vt[1] * r.height - (y - r.top));
      if (d < kc) { kc = d; tot = p; }
    }
    return tot;
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start" data-testid="do-hinh-phu">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setHien((v) => !v); setChon(null); }} aria-pressed={!hien}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line px-3 text-sm hover:border-gold/50"
            data-testid="do-hinh-ban-goc">
            {hien ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            {hien ? "Xem bản khắc gốc" : "Hiện chú giải"}
          </button>
          <button type="button" onClick={() => setPhong((v) => !v)} aria-pressed={phong}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-line px-3 text-sm hover:border-gold/50 sm:hidden"
            data-testid="do-hinh-phong">
            {phong ? <ZoomOut className="size-4" aria-hidden /> : <ZoomIn className="size-4" aria-hidden />}
            {phong ? "Thu nhỏ" : "Phóng to"}
          </button>
          {hien && dh.nhom.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo nhóm">
              <button type="button" onClick={() => setLoc(null)} aria-pressed={loc === null}
                className={cn("min-h-[36px] rounded-full border px-3 text-xs", loc === null ? "border-gold/60 bg-gold/10 text-fg" : "border-line text-fg-muted")}>
                Tất cả
              </button>
              {dh.nhom.map((n) => (
                <button key={n.ma} type="button" onClick={() => setLoc(n.ma)} aria-pressed={loc === n.ma}
                  className={cn("min-h-[36px] rounded-full border px-3 text-xs", loc === n.ma ? "border-gold/60 bg-gold/10 text-fg" : "border-line text-fg-muted")}>
                  {n.ten}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={cn("mx-auto w-full max-w-[34rem] rounded-xl border border-line/70 bg-[#e9dcc0]", phong ? "overflow-auto" : "overflow-hidden")}
          data-testid="do-hinh-khung">
        <div ref={khung} className={cn("relative", phong ? "w-[200%] sm:w-full" : "w-full")}
          onClick={hien ? (e) => { const p = ganNhat(e.clientX, e.clientY, 40); if (p) mo(p); } : undefined}
          onMouseMove={hien ? (e) => { const p = ganNhat(e.clientX, e.clientY, 18); if (p) mo(p); } : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh gốc tự phục vụ, giữ đúng tỉ lệ để toạ độ khớp */}
          <img src={anhDoHinh(dh.tep)} width={dh.rong} height={dh.cao} alt={`${dh.ten} — bản khắc gỗ ${dh.ten_han} trong ${dh.nguon_hien_thi}`}
            className="block h-auto w-full select-none" loading="lazy" draggable={false} />
          {hien && diem.map((p) => (
            <button key={p.id} type="button" data-testid="do-hinh-diem" data-id={p.id}
              aria-label={`${p.ten}${p.am ? ` (${p.am})` : ""}`} aria-pressed={chon === p.id}
              onClick={(e) => { if (e.detail === 0) mo(p); }} onFocus={() => mo(p)}
              style={{ left: `${p.vt[0] * 100}%`, top: `${p.vt[1] * 100}%` }}
              className="group pointer-events-none absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
              <span className={cn("block size-3 rounded-full ring-4 transition-transform motion-reduce:transition-none",
                p.muc ? MAU_MUC[p.muc] : "bg-sky-600/90 ring-sky-600/30",
                chon === p.id ? "scale-150" : "group-hover:scale-125")} />
            </button>
          ))}
        </div>
        </div>
        <p className="mt-2 text-center text-xs text-fg-faint">Ảnh gốc: {dh.nguon_hien_thi}. Chấm chỉ là lớp chú giải phủ lên, bản khắc giữ nguyên.</p>
      </div>
      <aside className="lg:sticky lg:top-28" aria-live="polite">
        {dang ? <TheDiem p={dang} onDong={() => setChon(null)} /> : (
          <div className="rounded-xl border border-line/70 p-4 text-sm text-fg-muted">
            Rê chuột, chạm vào gần một chấm trên hình, hoặc dùng phím Tab, để đọc chữ khắc ở đó nghĩa là gì. Trên điện thoại, bấm Phóng to để chạm cho trúng.
          </div>
        )}
        {dh.cau_khung && <p className="mt-3 text-xs leading-relaxed text-fg-faint">{dh.cau_khung}</p>}
      </aside>
    </div>
  );
}

function TheDiem({ p, onDong }: { p: DiemDoHinh; onDong: () => void }) {
  return (
    <div className="rounded-xl border border-gold/40 bg-gold/[0.05] p-4" data-testid="do-hinh-the">
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-2xl text-fg" lang="zh-Hant">{p.han}</p>
        <button type="button" onClick={onDong} className="min-h-[36px] text-xs text-fg-muted hover:text-fg">Đóng</button>
      </div>
      {p.am && <p className="text-sm italic text-fg-muted">{p.am}</p>}
      <p className="mt-2 font-medium text-fg">{p.ten}</p>
      {p.muc && <p className="mt-1 text-xs text-fg-faint">{NHAN_MUC[p.muc]}</p>}
      <p className="mt-2 text-[0.95rem] leading-relaxed">{p.y}</p>
      {p.tuoi?.length ? <p className="mt-2 text-xs text-fg-muted">Tuổi (tuổi mụ): {p.tuoi.join(", ")}</p> : null}
      {p.sach_ghi && (
        <p className="mt-3 border-l-2 border-gold/40 pl-3 text-sm">
          <span lang="zh-Hant" className="font-serif">{p.sach_ghi.han}</span>
          <span className="mt-0.5 block text-fg-muted">{p.sach_ghi.y}</span>
          <span className="mt-0.5 block text-xs text-fg-faint">{p.sach_ghi.sach}</span>
        </p>
      )}
      {p.duong && <Link href={p.duong} className="mt-3 inline-block text-sm text-gold underline decoration-gold/40 underline-offset-2">Đọc kỹ về vùng này</Link>}
    </div>
  );
}
