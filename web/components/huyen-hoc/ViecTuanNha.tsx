"use client";
// Y4 — thẻ "Việc 0 đồng tuần này" trên Hôm nay: mỗi tuần một việc không tốn tiền từ dấu hiệu đã khai trong hồ sơ nhà (trên
// máy). Engine chọn việc (ưu tiên nhóm nên xử lý trước, xoay theo tuần). Bấm "Đã làm" → nhớ trên máy + đưa MÃ hộp vào hàng
// đợi hỏi lại sau 30 ngày (Q7, lib/kiem-chung-sau) — phiếu sau 30 ngày vì thế mang nghĩa "đã làm thật". Không gửi nhà đi lưu.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useHoSoNha } from "@/lib/ho-so-nha";
import { ghiNhanDung } from "@/lib/kiem-chung-sau";

interface ViecTuan {
  tuan: string; tu_ngay: string; den_ngay: string; so_dau_hieu: number; ly_do?: "chua_khai" | "da_xu_ly_het";
  viec: { ma: string; tieu_de: string; lam: string; veto: boolean; tot: boolean; trang: string; ma_mau: string; phai: string } | null;
}
const KHOA = "hbt.viec_tuan.v1";
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function daLam(tuan: string, ma: string): boolean {
  try { const x = JSON.parse(localStorage.getItem(KHOA) ?? "{}"); return x.tuan === tuan && x.ma === ma; } catch { return false; }
}

export function ViecTuanNha() {
  const nha = useHoSoNha();
  const [kq, setKq] = useState<ViecTuan | null>(null);
  const [xong, setXong] = useState(false);
  const b = nha?.bo_cuc;
  const dauHieu = b?.dau_hieu ?? [];
  const daXuLy = [...new Set([...(b?.da_xu_ly ?? []), ...(b?.khai_khong ?? [])])];
  const khoa = dauHieu.length ? JSON.stringify({ dau_hieu: dauHieu, da_xu_ly: daXuLy, ...(nha?.loai_nha ? { loai_nha: nha.loai_nha } : {}) }) : "";
  useEffect(() => {
    if (!khoa) { setKq(null); return; }
    let huy = false;
    postJson<ViecTuan>("/api/phongthuy/viec-tuan", JSON.parse(khoa))
      .then((d) => { if (!huy) { setKq(d); setXong(Boolean(d.viec && daLam(d.tuan, d.viec.ma))); } })
      .catch(() => { if (!huy) setKq(null); });
    return () => { huy = true; };
  }, [khoa]);
  // Chưa có nhà / chưa khai dấu hiệu → thẻ "Tháng này nhà bạn" đã mời đo hướng; ở đây không lặp lời mời.
  if (!kq?.viec) return null;
  const v = kq.viec;
  const bam = () => {
    try { localStorage.setItem(KHOA, JSON.stringify({ tuan: kq.tuan, ma: v.ma })); } catch { /* chế độ riêng tư */ }
    ghiNhanDung({ loai: "doi_song", mau: v.ma_mau, phai: v.phai, nhan: `Việc 0 đồng: ${v.tieu_de}`.slice(0, 80), mo_dun: "phongthuy" });
    ghi("chart_interacted", { kind: "viec_tuan_da_lam", ma: v.ma, veto: v.veto });
    setXong(true);
  };
  return (
    <section aria-labelledby="viec-tuan" className="glass space-y-2 rounded-2xl p-5" data-testid="viec-tuan">
      <h2 id="viec-tuan" className="flex items-center gap-2 text-xl"><Sparkles className="size-5 text-gold" aria-hidden /> Việc 0 đồng tuần này</h2>
      <p className="text-xs text-fg-faint">Tuần {dm(kq.tu_ngay)} – {dm(kq.den_ngay)} · từ dấu hiệu bạn đã khai{kq.so_dau_hieu > 1 ? ` (còn ${kq.so_dau_hieu} dấu hiệu, mỗi tuần một việc)` : ""}</p>
      <p className="text-sm"><b className="text-fg">{v.tieu_de}</b>{v.veto && <span className="ml-2 rounded-full border border-moon/50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-moon">Xử lý trước</span>}</p>
      <p className="text-sm text-fg">{v.lam}</p>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {xong
          ? <span className="flex items-center gap-1.5 text-sm text-jade" data-testid="viec-tuan-xong"><Check className="size-4" aria-hidden /> Đã làm — khoảng 30 ngày nữa Hôm nay sẽ hỏi bạn thấy khác gì.</span>
          : <Button size="sm" variant="outline" onClick={bam} data-testid="viec-tuan-da-lam">Tôi đã làm việc này</Button>}
        <Link href={v.trang} className="text-sm text-gold hover:underline">Vì sao nên làm →</Link>
      </div>
    </section>
  );
}
