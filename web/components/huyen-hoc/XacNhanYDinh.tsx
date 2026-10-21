"use client";
// LG-ĐS mục 4 — hỏi đáp Tử vi: khi từ khoá không nhận ra ý định, máy chủ tìm câu gần nghĩa trong kho vectơ và trả
// `goi_y_vec` {id, y_dinh, do_gan}. Hỏi lại người dùng "đúng ý bạn chứ?" — bấm thì gửi xác nhận (đủ 3 người khác nhau
// cùng ý định thì câu vào kho, xem supabase 0017 `xac_nhan_y_dinh`). Lỗi mạng → im lặng.
import { useState } from "react";

export interface GoiYVec { id: string | number; y_dinh: string; do_gan?: number; ten?: string; nhan?: string }

/** Nhãn đời thường của 8 ý định hỏi đáp Tử vi (KB y_dinh_hoi) — dùng khi engine không gửi kèm tên. */
export const NHAN_Y_DINH_TUVI: Record<string, string> = {
  di_hay_o: "ở lại hay đổi việc, ra làm riêng",
  tai_van: "tiền bạc sắp tới",
  hoc_hanh_con: "việc học của con",
  phan_van: "một quyết định đang phân vân",
  ba_thang_toi: "ba tháng tới",
  chon_thoi_diem: "chọn thời điểm khai trương, ký kết, đi xa",
  tong_quan_nam: "tổng quan cả năm",
  hieu_ban_than: "hiểu rõ bản thân",
};

export function XacNhanYDinh({ cau, goi, moDun = "tuvi" }: { cau: string; goi: GoiYVec; moDun?: string }) {
  const [da, setDa] = useState<boolean | null>(null);
  const nhan = goi.ten ?? goi.nhan ?? NHAN_Y_DINH_TUVI[goi.y_dinh] ?? goi.y_dinh.replace(/_/g, " ");
  const bam = (dung: boolean) => {
    if (da !== null) return;
    setDa(dung);
    try {
      void fetch("/api/hoi/xac-nhan-y-dinh", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ mo_dun: moDun, cau, y_dinh: goi.y_dinh, dung }),
      }).catch(() => { /* im lặng */ });
    } catch { /* im lặng */ }
  };
  return (
    <div className="mt-2 rounded-xl border border-line/70 px-3 py-2 text-xs" data-testid="xac-nhan-y-dinh">
      {da === null ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-fg-muted">Hệ thống hiểu câu của bạn là về: <b className="text-fg">{nhan}</b> — đúng ý bạn chứ?</span>
          <button type="button" onClick={() => bam(true)}
            className="rounded-full border border-line px-3 py-1 text-fg-muted hover:border-gold/60 hover:text-fg">Đúng ý mình</button>
          <button type="button" onClick={() => bam(false)}
            className="rounded-full border border-line px-3 py-1 text-fg-muted hover:border-gold/60 hover:text-fg">Không phải</button>
        </div>
      ) : (
        <p role="status" className="text-fg-faint">
          {da ? "Cảm ơn bạn — lần sau câu hỏi kiểu này sẽ được hiểu nhanh hơn." : "Cảm ơn bạn. Thử hỏi lại và nêu rõ việc bạn đang nghĩ tới, câu trả lời sẽ sát hơn."}
        </p>
      )}
    </div>
  );
}
