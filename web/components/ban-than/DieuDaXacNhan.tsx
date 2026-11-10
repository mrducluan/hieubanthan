"use client";
// BT-UI — "Điều bạn đã xác nhận" trên /ban-than: ghép tất định (engine /v1/giao-thoa, HTT-1) từ MÃ các hộp người dùng đã bấm
// "Đúng với mình" — mã còn nhớ trên máy (lib/kiem-chung-sau) + phiếu đã lưu của chính tài khoản (máy chủ tự thêm, RLS).
// Chỉ mã, không chữ, không lá số. Chưa đủ hai phiếu → khối không hiện (người mới không thấy khối trống).
import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import type { Hop } from "@/components/luan-giai/kieu";
import { MA_DOI_SONG } from "@/lib/kiem-chung";
import { maDaXacNhan } from "@/lib/kiem-chung-sau";
import { ghi } from "@/lib/do-luong";

interface KetQua { du: boolean; so_dung: number; hop: Hop[]; tom_tat: string; cau_tu_soi: string }

export function DieuDaXacNhan() {
  const [kq, setKq] = useState<KetQua | null>(null);
  useEffect(() => {
    let huy = false;
    const phieu = maDaXacNhan().filter((m) => MA_DOI_SONG.test(m) && m.length <= 60 && !m.startsWith("ds.giao_thoa.")).slice(0, 200).map((ma) => ({ ma, ket_qua: "dung" as const }));
    fetch("/api/giao-thoa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phieu }) })
      .then((r) => (r.ok ? (r.json() as Promise<KetQua>) : null))
      .then((d) => { if (!huy && d?.du && d.hop?.length) { setKq(d); ghi("chart_interacted", { kind: "giao_thoa_hien", nguon: "ban_than" }); } })
      .catch(() => null);
    return () => { huy = true; };
  }, []);
  if (!kq) return null;
  return (
    <section aria-labelledby="muc-xac-nhan" className="rounded-2xl border border-jade/30 bg-jade/[0.04] p-5" data-testid="dieu-da-xac-nhan">
      <h2 id="muc-xac-nhan" className="flex items-center gap-2 font-serif text-xl"><BadgeCheck className="size-5 text-jade" aria-hidden /> Điều bạn đã xác nhận</h2>
      <p className="mt-1 text-sm text-fg-muted">Ghép từ {kq.so_dung} hộp bạn đã bấm “Đúng với mình” — không tính lại, không đổi mức nào.</p>
      {kq.tom_tat && <p className="mt-3 text-[0.95rem] leading-relaxed">{kq.tom_tat}</p>}
      <ul className="mt-3 space-y-2">
        {kq.hop.slice(0, 3).map((h) => (
          <li key={h.ma_mau ?? h.tieu_de} className="rounded-xl border border-line/70 bg-bg/40 px-4 py-3">
            <p className="font-medium">{h.tieu_de}</p>
            {h.noi_dung && <p className="mt-1 text-sm text-fg-muted">{h.noi_dung}</p>}
          </li>
        ))}
      </ul>
      {kq.cau_tu_soi && <p className="mt-3 text-sm italic text-moon">{kq.cau_tu_soi}</p>}
    </section>
  );
}
