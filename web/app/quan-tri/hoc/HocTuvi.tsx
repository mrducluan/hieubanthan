"use client";
// LG-ĐS tầng HỌC Tử vi — nút quản trị: dựng kho vectơ ý định, bật/tắt một câu trong hàng chờ.
import { useState } from "react";
import { Button } from "@/components/ui/button";

async function guiJson(url: string, body: unknown): Promise<{ ok: boolean; j: Record<string, unknown> }> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, j: ((await r.json().catch(() => ({}))) as Record<string, unknown>) };
}

export function DungKhoVec() {
  const [tt, setTt] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  async function chay() {
    setDang(true);
    setTt("Đang dựng kho…");
    const { ok, j } = await guiJson("/api/quan-tri/hoc/dung-kho", {});
    setTt(ok ? `Đã nạp ${j.nap as number}/${j.tong as number} câu có nhãn ý định.` : (j.error as string) ?? "Chưa dựng được.");
    setDang(false);
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant="secondary" onClick={chay} disabled={dang} data-testid="dung-kho-vec">Dựng kho vectơ</Button>
      {tt && <p className="text-xs text-fg-muted" role="status">{tt}</p>}
    </div>
  );
}

export function DuyetVec({ id, trangThai }: { id: number; trangThai: string }) {
  const [tt, setTt] = useState<string>(trangThai);
  const [loi, setLoi] = useState<string | null>(null);
  async function doi(trang_thai: "hoat_dong" | "cho_duyet" | "tat") {
    const { ok, j } = await guiJson("/api/quan-tri/hoc/tuvi", { id, trang_thai });
    if (ok) { setTt(trang_thai); setLoi(null); } else setLoi((j.error as string) ?? "Chưa lưu được.");
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tt !== "hoat_dong" && <Button size="sm" variant="secondary" onClick={() => doi("hoat_dong")}>Bật</Button>}
      {tt !== "tat" && <Button size="sm" variant="outline" onClick={() => doi("tat")}>Tắt</Button>}
      {tt !== "cho_duyet" && <Button size="sm" variant="ghost" onClick={() => doi("cho_duyet")}>Chờ duyệt</Button>}
      {loi && <span className="text-xs text-cinnabar" role="alert">{loi}</span>}
    </div>
  );
}
