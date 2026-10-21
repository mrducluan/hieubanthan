"use client";
// KC-4 — nút "Nhắc tôi hôm đó" (lưu trên máy, hiện ở Hôm nay) + "Thêm vào lịch" (.ics) + tuỳ chọn "cả trên tài khoản".
import { useState } from "react";
import { BellPlus, BellRing, CalendarPlus } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { daNhac, taiIcs, themNhac, type NhacViec } from "@/lib/nhac-viec";
import { useNguoiDung } from "@/lib/tai-khoan";
import { luuNhacTaiKhoan } from "@/lib/tai-khoan-nhac";
import { cn } from "@/lib/utils";

export function NhacToi({ ngay, ma, moDun, nhan, duong, className }: {
  ngay: string; ma: string; moDun: NhacViec["mo_dun"]; nhan: string; duong?: string; className?: string;
}) {
  const nguoi = useNguoiDung();
  const [da, setDa] = useState(() => (typeof window !== "undefined" ? daNhac(ngay, ma) : false));
  const [tk, setTk] = useState<string | null>(null);
  const them = () => {
    // Mốc không hợp lệ (mã/nhãn lạ) thì bỏ qua lặng lẽ — không làm vỡ bài đọc.
    try {
      const n = themNhac({ ngay, ma, mo_dun: moDun, nhan: nhan.slice(0, 80), duong });
      setDa(true);
      ghi("chart_interacted", { mo_dun: moDun, kind: "nhac_viec" });
      return n;
    } catch { return null; }
  };
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)} data-testid="nhac-toi" data-ngay={ngay}>
      <button type="button" onClick={them} aria-pressed={da}
        className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs", da ? "border-gold/60 text-gold" : "border-line text-fg-muted hover:text-fg")}>
        {da ? <BellRing className="size-3.5" aria-hidden /> : <BellPlus className="size-3.5" aria-hidden />}{da ? "Sẽ nhắc ở Hôm nay" : "Nhắc tôi hôm đó"}
      </button>
      <button type="button" onClick={() => { const n = da ? { id: `${ngay}|${ma}`, ngay, ma, mo_dun: moDun, nhan, duong, tao_luc: "" } : them(); if (n) taiIcs(n); }}
        className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-xs text-fg-muted hover:text-fg" title="Tải tệp lịch (.ics) để điện thoại tự nhắc">
        <CalendarPlus className="size-3.5" aria-hidden /> Vào lịch
      </button>
      {nguoi && da && !tk && (
        <button type="button" className="text-xs text-fg-faint underline-offset-4 hover:underline"
          onClick={() => luuNhacTaiKhoan(nguoi.id, { id: `${ngay}|${ma}`, ngay, ma, mo_dun: moDun, nhan, duong, tao_luc: "" }).then(() => setTk("đã lưu vào tài khoản")).catch(() => setTk("tài khoản chưa bật nhắc việc"))}>
          cả trên tài khoản
        </button>
      )}
      {tk && <span className="text-xs text-fg-faint">· {tk}</span>}
    </span>
  );
}
