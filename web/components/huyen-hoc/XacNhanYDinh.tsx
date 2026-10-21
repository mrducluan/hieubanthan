"use client";
// LG-ĐS mục 4 — hỏi đáp Tử vi: khi từ khoá không nhận ra ý định, máy chủ tìm câu gần nghĩa trong kho vectơ và trả
// `goi_y_vec` {id, y_dinh, do_gan}. Hỏi lại người dùng "đúng ý bạn chứ?" — bấm thì gửi xác nhận (đủ 3 người khác nhau
// cùng ý định thì câu vào kho, xem supabase 0017 `xac_nhan_y_dinh`). Lỗi mạng → im lặng.
// Không tìm được câu gần nghĩa (`co_the_goi_y` mà không có `goi_y_vec`) → `ChonYDinh`: người dùng tự chọn 1 trong 8 ý
// định (chỉ ghi nhận cho kho; route hỏi không nhận ý định gửi kèm nên không hỏi lại — không tốn thêm lượt hỏi).
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

function guiXacNhan(moDun: string, cau: string, y_dinh: string, dung: boolean) {
  try {
    void fetch("/api/hoi/xac-nhan-y-dinh", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ mo_dun: moDun, cau, y_dinh, dung }),
    }).catch(() => { /* im lặng */ });
  } catch { /* im lặng */ }
}

/** 8 chip ý định — bảng nhãn chép từ Y_DINH_TUVI (lib/hoc-tuvi.ts chỉ chạy máy chủ). */
export function ChonYDinh({ cau, moDun = "tuvi" }: { cau: string; moDun?: string }) {
  const [chon, setChon] = useState<string | null>(null);
  return (
    <div className="mt-2 rounded-xl border border-line/70 px-3 py-2 text-xs" data-testid="chon-y-dinh">
      {chon ? (
        <p role="status" className="text-fg-faint">
          Cảm ơn bạn — đã ghi nhận câu này là về <b className="text-fg-muted">{NHAN_Y_DINH_TUVI[chon]}</b>. Lần sau câu hỏi kiểu này sẽ được hiểu nhanh hơn.
        </p>
      ) : (
        <>
          <p className="text-fg-muted">Bạn đang hỏi về chuyện gì? Chọn để lần sau hệ thống hiểu nhanh hơn</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Chọn chủ đề câu hỏi">
            {Object.entries(NHAN_Y_DINH_TUVI).map(([ma, nhan]) => (
              <button key={ma} type="button" data-y-dinh={ma}
                onClick={() => { setChon(ma); guiXacNhan(moDun, cau, ma, true); }}
                className="rounded-full border border-line px-3 py-1 text-fg-muted first-letter:uppercase hover:border-gold/60 hover:text-fg">
                {nhan}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function XacNhanYDinh({ cau, goi, moDun = "tuvi" }: { cau: string; goi: GoiYVec; moDun?: string }) {
  const [da, setDa] = useState<boolean | null>(null);
  const nhan = goi.ten ?? goi.nhan ?? NHAN_Y_DINH_TUVI[goi.y_dinh] ?? goi.y_dinh.replace(/_/g, " ");
  const bam = (dung: boolean) => {
    if (da !== null) return;
    setDa(dung);
    guiXacNhan(moDun, cau, goi.y_dinh, dung);
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
