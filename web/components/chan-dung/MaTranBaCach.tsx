"use client";
// CD-1 — ma trận "mảng đời × cách nhìn": web chỉ VẼ mức engine đã đọc từ ba báo cáo (Tử vi · Bát tự · Nhân tướng), không
// tính gì. Mỗi dòng: tên mảng, ba ô mức (chip như báo cáo đời sống), cột cuối "cùng thấy / nhìn khác nhau / chưa đủ".
// Bấm một dòng → cuộn tới chương nói về mảng đó. Điện thoại: mỗi dòng là một thẻ, ba ô xếp ngang.
import { Check, Scale, CircleDashed } from "lucide-react";
import Link from "@/components/khung/Lien";
import { ChipMuc } from "@/components/luan-giai/BaoCaoDoiSong";
import type { Muc } from "@/components/luan-giai/kieu";
import { cn } from "@/lib/utils";

export interface DongMaTran { ma: string; ten: string; muc: Record<string, Muc | null>; dong_thuan: "cung" | "khac" | "thieu"; muc_chung: Muc | null; so_mon: number }
export interface MaTran { mon: string[]; ten_mon: Record<string, string>; dong: DongMaTran[] }

const NHAN: Record<Muc, string> = { thuan: "Thuận lợi", can_bang: "Cân bằng", can_chu_dong: "Cần lưu ý" };
/** Mảng → chương của báo cáo tổng hợp (neo `lg-<mã chương>` do BaoCaoDoiSongView đặt). */
const CHUONG: Record<string, string> = { cong_viec: "cong_viec_tien", tien_bac: "cong_viec_tien", tinh_cam: "tinh_cam_gia_dinh", gia_dinh: "tinh_cam_gia_dinh", suc_khoe: "suc_khoe", nam_nay: "nam_nay" };

export function MaTranBaCach({ mt, thieu, className }: { mt: MaTran; thieu: string[]; className?: string }) {
  const toi = (ma: string) => document.getElementById(`lg-${CHUONG[ma] ?? ma}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <section aria-labelledby="ma-tran" className={cn("glass rounded-2xl p-4 sm:p-6", className)} data-testid="ma-tran-ba-cach">
      <p className="eyebrow">Ba cách nhìn, một con người</p>
      <h3 id="ma-tran" className="mt-1 text-2xl">Mảng nào các cách xem cùng thấy?</h3>
      <p className="mt-1 text-sm text-fg-muted">Mức của từng cách lấy từ chính bài đọc của cách đó — không cộng điểm, không chấm bạn. Bấm một dòng để tới chương tương ứng.</p>
      <div className="mt-4 overflow-hidden rounded-xl border border-line/60">
        <table className="w-full text-sm">
          <thead className="hidden bg-surface/60 text-xs uppercase tracking-wider text-fg-muted sm:table-header-group">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-semibold">Mảng</th>
              {mt.mon.map((m) => <th key={m} scope="col" className="px-3 py-2 text-left font-semibold">{mt.ten_mon[m]}</th>)}
              <th scope="col" className="px-3 py-2 text-left font-semibold">Kết</th>
            </tr>
          </thead>
          <tbody>
            {mt.dong.map((d) => (
              <tr key={d.ma} data-testid={`mt-${d.ma}`} data-dong-thuan={d.dong_thuan}
                className="block cursor-pointer border-b border-line/40 px-3 py-3 last:border-0 hover:bg-surface/40 sm:table-row sm:p-0"
                onClick={() => toi(d.ma)}>
                <th scope="row" className="block pb-1.5 text-left font-serif text-base text-fg sm:table-cell sm:px-3 sm:py-2.5 sm:align-middle">{d.ten}</th>
                {mt.mon.map((m) => (
                  <td key={m} className="inline-block pr-2 align-middle sm:table-cell sm:px-3 sm:py-2.5">
                    <span className="mr-1 text-xs text-fg-faint sm:hidden">{mt.ten_mon[m]}:</span>
                    {d.muc[m] ? <ChipMuc muc={d.muc[m]!} nhan={NHAN[d.muc[m]!]} /> : <span className="text-xs text-fg-faint">—</span>}
                  </td>
                ))}
                <td className="block pt-1.5 text-xs sm:table-cell sm:px-3 sm:py-2.5 sm:align-middle">
                  {d.dong_thuan === "cung" ? (
                    <span className="inline-flex items-center gap-1 text-jade"><Check className="size-3.5" aria-hidden /> {d.so_mon} cách cùng thấy</span>
                  ) : d.dong_thuan === "khac" ? (
                    <span className="inline-flex items-center gap-1 text-fg-muted"><Scale className="size-3.5" aria-hidden /> nhìn khác nhau</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-fg-faint"><CircleDashed className="size-3.5" aria-hidden /> chưa đủ cách xem</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {thieu.includes("nhan_tuong") && (
        <p className="mt-3 text-sm text-fg-muted" data-testid="mt-thieu-nhan-tuong">
          Cột Nhân tướng còn trống — <Link href="/nhan-tuong#khao-sat" className="text-gold underline underline-offset-4">làm khảo sát gương mặt</Link> (5 phút, không cần ảnh) rồi quay lại để có cách nhìn thứ ba.
        </p>
      )}
    </section>
  );
}
