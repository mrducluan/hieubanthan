"use client";
// QT-3 — trợ lý AI cho MỘT ô chuỗi: chọn kiểu biên tập → AI soạn nháp → hiện cảnh báo kiểm định → người quản trị
// bấm "Dùng bản nháp" mới đưa vào ô (vẫn chưa xuất bản; Xuất bản = mở PR, chủ dự án duyệt).
import { useState } from "react";
import { Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DuongDan } from "@/lib/kb-sua";
import { goiQT } from "@/lib/goi-quan-tri";

const KIEU: [string, string][] = [
  ["viet_lai", "Viết lại mượt hơn"], ["mo_rong", "Viết sâu hơn"], ["rut_gon", "Rút gọn"],
  ["soat_loi", "Soát chính tả"], ["doi_thuong", "Nói đời thường"],
];

export interface CanhBao { ma: string; noi_dung: string }

export function DanhSachCanhBao({ ds }: { ds: CanhBao[] }) {
  if (ds.length === 0) return null;
  return (
    <ul className="space-y-1 text-xs text-cinnabar">
      {ds.map((c) => <li key={c.ma} className="flex gap-1.5"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />{c.noi_dung}</li>)}
    </ul>
  );
}

export function TroLyAI({ tep, duong, hienTai, nguCanh, onDung }: {
  tep: string; duong: DuongDan; hienTai: string; nguCanh: () => Record<string, string>; onDung: (s: string) => void;
}) {
  const [kieu, setKieu] = useState("viet_lai");
  const [yeuCau, setYeuCau] = useState("");
  const [dang, setDang] = useState(false);
  const [kq, setKq] = useState<{ nhap: string | null; kiem_dinh: CanhBao[]; loi?: string } | null>(null);

  async function soan() {
    setDang(true); setKq(null);
    try {
      setKq(await goiQT("/api/quan-tri/ai", { viec: "soan", tep, duong, hien_tai: hienTai, hanh_dong: kieu, yeu_cau: yeuCau, ngu_canh: nguCanh() }));
    } catch (e) { setKq({ nhap: null, kiem_dinh: [], loi: (e as Error).message }); } finally { setDang(false); }
  }

  return (
    <div className="mt-2 space-y-2 rounded-xl border border-moon/30 bg-moon/5 p-3" data-testid="qt-tro-ly-ai">
      <div className="flex flex-wrap items-center gap-2">
        <select value={kieu} onChange={(e) => setKieu(e.target.value)} aria-label="Kiểu biên tập"
          className="h-9 rounded-xl border border-line bg-bg/60 px-2 text-sm text-fg">
          {KIEU.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
        </select>
        <Input value={yeuCau} onChange={(e) => setYeuCau(e.target.value)} maxLength={500} placeholder="Ghi chú thêm cho AI (tuỳ chọn)"
          aria-label="Ghi chú cho AI" className="h-9 min-w-0 flex-1" />
        <Button size="sm" variant="secondary" disabled={dang} onClick={() => void soan()}>
          <Sparkles aria-hidden />{dang ? "Đang soạn…" : "Soạn nháp"}
        </Button>
      </div>
      {kq?.loi && <p role="alert" className="text-sm text-cinnabar">{kq.loi}</p>}
      {kq?.nhap && (
        <div className="space-y-2">
          <p className="whitespace-pre-wrap rounded-lg bg-bg/60 p-2 text-sm text-fg">{kq.nhap}</p>
          <DanhSachCanhBao ds={kq.kiem_dinh} />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => onDung(kq.nhap!)}>Dùng bản nháp</Button>
            <span className="text-xs text-fg-faint">Nháp AI — đọc kỹ, sửa tiếp trong ô trước khi xuất bản.</span>
          </div>
        </div>
      )}
    </div>
  );
}
