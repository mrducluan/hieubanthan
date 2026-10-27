"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CaiDat as KieuCaiDat } from "@/lib/cau-hinh";
import { goiQT } from "@/lib/goi-quan-tri";

/** thieu = migration chưa chạy mà khoá này cần (lib/migration-qt) — còn thiếu thì không cho bật. */
export interface DongCaiDat { c: KieuCaiDat; daLuu: boolean; hieuLuc: unknown; luc: string | null; thieu: string[] }

const ngayGio = (s: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(s));

function Muc({ d, duocSua }: { d: DongCaiDat; duocSua: boolean }) {
  const router = useRouter();
  const { c } = d;
  const [v, setV] = useState<string | boolean>(c.loai === "bat_tat" ? Boolean(d.hieuLuc) : String(d.hieuLuc ?? ""));
  const [dang, setDang] = useState(false);
  const [bao, setBao] = useState<{ loi?: string; ok?: string } | null>(null);

  async function gui(xoa = false) {
    setDang(true); setBao(null);
    try {
      await goiQT("/api/quan-tri/cai-dat", xoa ? { khoa: c.khoa, xoa: true }
        : { khoa: c.khoa, gia_tri: c.loai === "so" ? Number(v) : v });
      setBao({ ok: xoa ? "Đã trả về mặc định." : "Đã lưu." });
      router.refresh();
    } catch (e) { setBao({ loi: (e as Error).message }); } finally { setDang(false); }
  }

  const id = `cd-${c.khoa}`;
  return (
    <div className="space-y-2 border-b border-line/60 py-4 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="font-medium text-fg">{c.ten}</label>
        <span className="font-mono text-xs text-fg-faint">{c.khoa}</span>
        {d.daLuu ? <Badge tone="gold">Đã chỉnh</Badge> : <Badge>Mặc định</Badge>}
        {d.thieu.length > 0 && <Badge tone="cinnabar" data-testid="can-migration">Cần migration {d.thieu.join(", ")}</Badge>}
      </div>
      <p className="text-xs text-fg-muted">{c.moTa}</p>
      <div className="flex flex-wrap items-center gap-2">
        {c.loai === "bat_tat" ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input id={id} type="checkbox" checked={v === true} disabled={!duocSua || (d.thieu.length > 0 && v !== true)}
              onChange={(e) => setV(e.target.checked)}
              className="size-4 accent-gold" />
            {v === true ? "Bật" : "Tắt"}
          </label>
        ) : (
          <Input id={id} value={String(v)} disabled={!duocSua} onChange={(e) => setV(e.target.value)}
            inputMode={c.loai === "so" ? "numeric" : undefined} className={c.loai === "so" ? "w-28" : "min-w-0 flex-1"}
            maxLength={c.loai === "chu" ? c.toiDa : 200} placeholder={c.loai === "duong_dan" ? "/tai-khoan" : undefined} />
        )}
        {duocSua && <Button size="sm" onClick={() => void gui()} disabled={dang}>Lưu</Button>}
        {duocSua && d.daLuu && <Button size="sm" variant="ghost" onClick={() => void gui(true)} disabled={dang}>Về mặc định</Button>}
        {c.loai === "so" && <span className="text-xs text-fg-faint">({c.min}–{c.max}, mặc định {c.macDinh})</span>}
      </div>
      {d.luc && <p className="text-xs text-fg-faint">Sửa lần cuối {ngayGio(d.luc)}</p>}
      {bao?.loi && <p role="alert" className="text-sm text-cinnabar">{bao.loi}</p>}
      {bao?.ok && <p role="status" className="text-sm text-jade">{bao.ok}</p>}
    </div>
  );
}

export function CaiDat({ dong, duocSua }: { dong: DongCaiDat[]; duocSua: boolean }) {
  const nhom = [...new Set(dong.map((d) => d.c.nhom))];
  return (
    <>
      {!duocSua && <p className="text-sm text-fg-muted">Chỉ chủ sở hữu được sửa cài đặt.</p>}
      {nhom.map((n) => (
        <Card key={n}>
          <h2 className="text-lg">{n}</h2>
          {dong.filter((d) => d.c.nhom === n).map((d) => <Muc key={d.c.khoa} d={d} duocSua={duocSua} />)}
        </Card>
      ))}
    </>
  );
}
