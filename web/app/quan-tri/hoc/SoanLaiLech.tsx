"use client";
// HTT-2 H6 — nút "Soạn lại nháp" trên mỗi mã lệch theo ngôn ngữ: gọi máy chuyển ngữ QT-0 cho đúng cụm KB của mã, hiện bản đang
// dùng ↔ bản nháp (+ lỗi bộ kiểm), rồi người duyệt chọn chuỗi và bấm "Mở PR" (QT-1). Máy không ghi KB.
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Muc { duong: string; vi: string; hien_tai: string | null; moi: string | null; loi: { ma: string; chi_tiet: string }[] }
interface Nhap { ma: string; ngon_ngu: string; tep: string | null; cum: string[]; mo_ta: string; muc: Muc[]; so: { tong: number; qua: number; kiem_dinh: string } }

export function SoanLaiLech({ ma, ngonNgu }: { ma: string; ngonNgu: string }) {
  const [nhap, setNhap] = useState<Nhap | null>(null);
  const [cho, setCho] = useState<"nhap" | "pr" | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [pr, setPr] = useState<{ url: string; so: number } | null>(null);
  const [chon, setChon] = useState<Record<string, boolean>>({});
  if (ngonNgu !== "en") return <span className="text-xs text-fg-faint">Chỉ hỗ trợ bản tiếng Anh.</span>;

  const goi = async (body: unknown) => {
    const r = await fetch("/api/quan-tri/hoc/soan-lai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((d as { error?: string }).error ?? `Lỗi ${r.status}`);
    return d;
  };
  const soan = async () => {
    setCho("nhap"); setLoi(null);
    try {
      const d = (await goi({ viec: "nhap", ma, ngon_ngu: "en" })) as Nhap;
      setNhap(d);
      setChon(Object.fromEntries(d.muc.filter((m) => m.moi && m.hien_tai !== null && m.moi !== m.hien_tai && !m.loi.length).map((m) => [m.duong, true])));
    } catch (e) { setLoi((e as Error).message); } finally { setCho(null); }
  };
  const moPr = async () => {
    if (!nhap?.tep) return;
    setCho("pr"); setLoi(null);
    try {
      const sua = nhap.muc.filter((m) => chon[m.duong] && m.moi && m.hien_tai !== null).map((m) => ({ duong: m.duong, cu: m.hien_tai as string, moi: m.moi as string }));
      const d = (await goi({ viec: "pr", ma, tep: nhap.tep, sua })) as { pr: { url: string; so: number } };
      setPr(d.pr);
    } catch (e) { setLoi((e as Error).message); } finally { setCho(null); }
  };
  const soChon = Object.values(chon).filter(Boolean).length;
  return (
    <div className="mt-1" data-testid="soan-lai-lech">
      {!nhap && <Button size="sm" variant="secondary" onClick={soan} disabled={cho === "nhap"}>{cho === "nhap" ? "Đang soạn…" : "Soạn lại nháp"}</Button>}
      {loi && <p role="alert" className="mt-1 text-xs text-cinnabar">{loi}</p>}
      {nhap && !nhap.tep && <p className="mt-1 text-xs text-fg-muted">{nhap.mo_ta}</p>}
      {nhap?.tep && (
        <div className="mt-2 space-y-2 text-xs">
          <p className="text-fg-muted">Cụm: {nhap.mo_ta} · <code>{nhap.tep}</code> · {nhap.so.qua}/{nhap.so.tong} chuỗi qua kiểm · kiểm định: {nhap.so.kiem_dinh}</p>
          <ul className="space-y-2">
            {nhap.muc.map((m) => {
              const doiDuoc = Boolean(m.moi) && m.hien_tai !== null && m.moi !== m.hien_tai;
              return (
                <li key={m.duong} className="rounded-lg border border-line/50 p-2">
                  <div className="flex items-start gap-2">
                    {doiDuoc && <input type="checkbox" className="mt-0.5" checked={Boolean(chon[m.duong])} onChange={(e) => setChon((c) => ({ ...c, [m.duong]: e.target.checked }))} aria-label={`Dùng nháp cho ${m.duong}`} />}
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-fg-faint">{m.duong}</p>
                      <p className="mt-0.5 text-fg-muted"><span className="text-fg-faint">Việt:</span> {m.vi}</p>
                      <p className="mt-0.5"><span className="text-fg-faint">Đang dùng:</span> {m.hien_tai ?? <i>chưa có trong bản phủ — thêm tay</i>}</p>
                      <p className="mt-0.5"><span className="text-fg-faint">Nháp:</span> {m.moi ?? <i>máy không trả / không qua kiểm</i>}</p>
                      {m.loi.length > 0 && <p className="mt-0.5 text-cinnabar">{m.loi.map((l) => `${l.ma}: ${l.chi_tiet}`).join(" · ")}</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {pr ? (
            <p className="text-gold">Đã mở PR #{pr.so}: <a href={pr.url} target="_blank" rel="noreferrer" className="underline">{pr.url}</a> — người bản xứ đọc rồi merge.</p>
          ) : (
            <Button size="sm" onClick={moPr} disabled={cho === "pr" || soChon === 0}>{cho === "pr" ? "Đang mở PR…" : `Mở PR với ${soChon} chuỗi đã chọn`}</Button>
          )}
        </div>
      )}
    </div>
  );
}
