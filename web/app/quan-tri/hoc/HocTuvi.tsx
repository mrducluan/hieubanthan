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


/** Q7: người duyệt đánh dấu một dòng hàng đợi "đề xuất luật" (0022). */
export function DuyetDeXuat({ id, trangThai }: { id: number; trangThai: string }) {
  const [tt, setTt] = useState<string>(trangThai);
  const [ghi, setGhi] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  async function doi(trang_thai: "cho_duyet" | "da_sua" | "bo_qua") {
    const { ok, j } = await guiJson("/api/quan-tri/hoc/de-xuat", { id, trang_thai, ...(ghi.trim() ? { ghi_chu: ghi.trim() } : {}) });
    if (ok) { setTt(trang_thai); setLoi(null); } else setLoi((j.error as string) ?? "Chưa lưu được.");
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input aria-label="Ghi chú duyệt (PR, lý do)" value={ghi} onChange={(e) => setGhi(e.target.value.slice(0, 500))} placeholder="PR / lý do (tuỳ chọn)"
        className="h-8 w-56 rounded-full border border-line bg-surface/60 px-3 text-xs" />
      {tt !== "da_sua" && <Button size="sm" variant="secondary" onClick={() => doi("da_sua")}>Đã sửa</Button>}
      {tt !== "bo_qua" && <Button size="sm" variant="outline" onClick={() => doi("bo_qua")}>Bỏ qua</Button>}
      {tt !== "cho_duyet" && <Button size="sm" variant="ghost" onClick={() => doi("cho_duyet")}>Chờ duyệt</Button>}
      {loi && <span className="text-xs text-cinnabar" role="alert">{loi}</span>}
    </div>
  );
}
