"use client";
// UI-KD 2 — "Tôi tự gieo" không cần hiểu 6/7/8/9: mỗi lần gieo (hào 1 → 6) bấm những đồng xu NGỬA (ngửa 3 + sấp 2 → 6/7/8/9)
// hoặc bấm thẳng Âm · Dương · Âm động · Dương động. Quẻ dựng dần bên cạnh (chỉ vạch; tên quẻ do engine trả sau khi hỏi).
// Vẫn giữ ô gõ nhanh "7 7 8 7 7 9" ở dưới cho người quen. Web chỉ gom 6 giá trị gửi engine — không tự luận.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VeQueNho } from "@/components/huyen-hoc/VeQue";
import { cn } from "@/lib/utils";
import { type BaXu, type GiaTriHao, GIA_TRI_HAO, docGoNhanh, giaTriTuXu, NHAN_HAO, xuTuGiaTri } from "@/lib/dong-xu";
import { DongXu, VachHao } from "./DongXu";

const DAY_NULL: (BaXu | null)[] = [null, null, null, null, null, null];

export function ChonHao({ giaTri, onChange }: {
  /** 6 giá trị hiện có (null = chưa chọn), hào 1 → 6. */
  giaTri: (GiaTriHao | null)[];
  onChange: (v: (GiaTriHao | null)[]) => void;
}) {
  const [xu, setXu] = useState<(BaXu | null)[]>(() => giaTri.map((v) => (v == null ? null : xuTuGiaTri(v))));
  const [hangDang, setHangDang] = useState<number>(0);   // chỉ số hào đang chọn (0..5) để hiện bốn nút nhanh
  const [goNhanh, setGoNhanh] = useState(() => giaTri.every((v) => v != null) ? giaTri.join(" ") : "");

  // Đồng bộ khi giá trị đổi từ ngoài (gõ nhanh, xem lại lịch sử): chỉ ghi đè hàng nào lệch để giữ cách bày đồng xu.
  useEffect(() => {
    setXu((cu) => {
      let doi = false;
      const moi = cu.map((x, i) => {
        const v = giaTri[i] ?? null;
        const hienCo = x ? giaTriTuXu(x) : null;
        if (v === hienCo) return x;
        doi = true;
        return v == null ? null : xuTuGiaTri(v);
      });
      return doi ? moi : cu;
    });
    const dau = giaTri.findIndex((v) => v == null);
    if (dau >= 0) setHangDang(dau);
  }, [giaTri]);

  const phat = (ds: (BaXu | null)[]) => {
    setXu(ds);
    const vals = ds.map((x) => (x ? giaTriTuXu(x) : null));
    onChange(vals);
    setGoNhanh(vals.every((v) => v != null) ? vals.join(" ") : "");
  };
  const latXu = (hao: number, i: number) => {
    const ds = [...xu];
    const cu: BaXu = ds[hao] ? [...ds[hao]!] as BaXu : [false, false, false];
    cu[i] = !cu[i];
    ds[hao] = cu;
    phat(ds);
    setHangDang(hao);
  };
  const chonNhanh = (hao: number, v: GiaTriHao) => {
    const ds = [...xu];
    ds[hao] = xuTuGiaTri(v);
    phat(ds);
    const tiep = ds.findIndex((x, j) => j > hao && x == null);
    setHangDang(tiep >= 0 ? tiep : hao);
  };
  const xoaHet = () => { phat([...DAY_NULL]); setHangDang(0); };
  const vals = xu.map((x) => (x ? giaTriTuXu(x) : null));
  const du = vals.filter((v) => v != null).length;

  return (
    <div className="rounded-xl border border-line/70 bg-bg/30 p-3 sm:col-span-2" data-testid="chon-hao">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-fg">Nhập kết quả bạn vừa gieo <span className="text-xs font-normal text-fg-faint">({du}/6 hào)</span></p>
        <p className="text-xs text-fg-faint">Mỗi lần gieo: bấm những đồng xu <b className="text-gold">ngửa</b>, hoặc bấm thẳng kiểu hào.</p>
      </div>
      <div className="mt-3 flex gap-3">
        <ol className="min-w-0 flex-1 space-y-1.5" aria-label="Sáu lần gieo, lần 1 là hào dưới cùng">
          {vals.map((v, hao) => {
            const dang = hangDang === hao;
            const x = xu[hao];
            return (
              <li key={hao} className={cn("rounded-lg px-1.5 py-1", dang && "bg-gold/[0.06] ring-1 ring-gold/30")} data-testid={`chon-hao-${hao + 1}`} data-gia-tri={v ?? ""}>
                <div className="flex min-h-10 items-center gap-2">
                  <button type="button" onClick={() => setHangDang(hao)} className="w-14 shrink-0 text-left text-xs text-fg-faint hover:text-fg" aria-label={`Chọn lần gieo ${hao + 1} (hào ${hao + 1})`}>
                    Lần {hao + 1}
                  </button>
                  <span className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <DongXu key={i} ngua={x ? x[i]! : false} mo={!x} hao={hao + 1} thuTu={i + 1} pressed={!!x && !!x[i]} onClick={() => latXu(hao, i)} />
                    ))}
                  </span>
                  <VachHao v={v} className="hidden min-[360px]:flex" />
                  <span className={cn("min-w-0 flex-1 truncate text-xs", v == null ? "text-fg-faint" : v === 6 || v === 9 ? "text-gold" : "text-fg-muted")}>
                    {v == null ? "chưa chọn" : NHAN_HAO[v].ten}
                  </span>
                </div>
                {dang && (
                  <div className="mt-1 flex flex-wrap gap-1 pl-14" role="group" aria-label={`Kiểu hào ${hao + 1}`}>
                    {GIA_TRI_HAO.map((g) => (
                      <button key={g} type="button" onClick={() => chonNhanh(hao, g)} aria-pressed={v === g} data-testid={`hao-${hao + 1}-${g}`}
                        title={NHAN_HAO[g].mo_ta}
                        className={cn("min-h-8 rounded-full border px-2.5 text-xs", v === g ? "border-gold/70 text-gold" : "border-line text-fg-muted hover:text-fg")}>
                        {NHAN_HAO[g].ten}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
          <VeQueNho giaTri={vals} nhan="Quẻ của bạn" />
          {du > 0 && <Button type="button" variant="ghost" size="sm" onClick={xoaHet} data-testid="xoa-hao">Làm lại</Button>}
        </div>
      </div>
      <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
        <span>Hoặc gõ nhanh 6 số (6/7/8/9, hào 1 → 6):</span>
        <Input aria-label="Sáu hào tự gieo" value={goNhanh} inputMode="numeric"
          onChange={(e) => { setGoNhanh(e.target.value); const d = docGoNhanh(e.target.value); if (d) { onChange(d); } }}
          placeholder="7 7 8 7 7 9" className="h-9 w-40 text-sm" />
      </label>
    </div>
  );
}
