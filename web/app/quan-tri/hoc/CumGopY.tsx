"use client";
// TS-V3 tầng HỌC — một cụm góp ý "chưa đúng": người duyệt đổi trạng thái + ghi luật đề xuất (sửa thật ở Kho tri thức).
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function CumGopY({ id, luat }: { id: number; luat: string | null }) {
  const [chu, setChu] = useState(luat ?? "");
  const [tt, setTt] = useState<string | null>(null);
  async function doi(trang_thai: string) {
    setTt("Đang lưu…");
    const r = await fetch("/api/quan-tri/hoc", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, trang_thai, luat: chu || undefined }),
    });
    setTt(r.ok ? "Đã lưu — tải lại trang để thấy danh sách mới." : ((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Chưa lưu được.");
  }
  return (
    <div className="mt-3 space-y-2">
      <Textarea rows={2} maxLength={1000} value={chu} onChange={(e) => setChu(e.target.value)} aria-label="Luật đề xuất"
        placeholder="Luật đề xuất (vd: thêm ý 'làm việc độc lập' cho số 33 ở câu chọn nghề)" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => doi("da_sua")}>Đã sửa trong KB</Button>
        <Button size="sm" variant="outline" onClick={() => doi("bo_qua")}>Bỏ qua</Button>
        <Button size="sm" variant="ghost" onClick={() => doi("theo_doi")}>Theo dõi tiếp</Button>
      </div>
      {tt && <p className="text-xs text-fg-muted" role="status">{tt}</p>}
    </div>
  );
}
