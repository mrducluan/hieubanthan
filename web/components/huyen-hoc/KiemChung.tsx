"use client";
// KC-0 — nút 1 chạm "Đúng với mình / Chưa đúng" (thay RLHF của bộ tài liệu v2.2, docs/PHAN-TICH-MIGRATION-V2-2.md).
// Không ô nhập chữ. Chỉ gửi MÃ (lib/kiem-chung) lên PostHog; mỗi thẻ ghi một lần mỗi phiên trình duyệt.
import { useEffect, useState } from "react";
import { ghi, lanDauTrongPhien } from "@/lib/do-luong";
import type { KetQuaKiemChung, LoaiKiemChung } from "@/lib/kiem-chung";

const KHOA = (k: string) => `hbt.mot-lan.kiem-chung.${k}`;

export function KiemChung({ loai, mau, phai, khoa, cauHoi = "Điều này có đúng với bạn?" }: {
  loai: LoaiKiemChung; mau: string; phai: string; /** định danh thẻ trong phiên (mặc định = mã mẫu) */ khoa?: string; cauHoi?: string;
}) {
  const k = `${loai}.${khoa ?? mau}`;
  const [da, setDa] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem(KHOA(k))) setDa(true); } catch { /* chế độ riêng tư */ }
  }, [k]);
  const bam = (kq: KetQuaKiemChung) => {
    if (da) return;
    setDa(true);
    if (lanDauTrongPhien(`kiem-chung.${k}`)) ghi("tuvi_kiem_chung", { loai, mau, ket_qua: kq, phai });
  };
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line/50 pt-2 text-xs" data-testid="kiem-chung">
      {da ? (
        <p className="text-fg-faint" role="status">Cảm ơn bạn — đã ghi nhận để ban biên tập xem lại.</p>
      ) : (
        <>
          <span className="text-fg-muted">{cauHoi}</span>
          {([["dung", "Đúng với mình"], ["chua_dung", "Chưa đúng"]] as const).map(([gt, nhan]) => (
            <button key={gt} type="button" onClick={() => bam(gt)}
              className="rounded-full border border-line px-3 py-1 text-fg-muted transition-colors hover:border-gold/60 hover:text-fg">
              {nhan}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
