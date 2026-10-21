"use client";
// KC-0 — nút 1 chạm "Đúng với mình / Chưa đúng" (thay RLHF của bộ tài liệu v2.2, docs/PHAN-TICH-MIGRATION-V2-2.md).
// Không ô nhập chữ. Chỉ gửi MÃ (lib/kiem-chung) lên PostHog; mỗi thẻ ghi một lần mỗi phiên trình duyệt.
// LG-ĐS (docs/LUAN-GIAI-DOI-SONG.md mục 3, 5): thêm loại "doi_song"; phiếu còn gửi về máy chủ (POST /api/kiem-chung,
// chỉ mã — lỗi thì im lặng) và hiện công khai "x% trong N người… thấy đúng" khi đủ ≥ 30 phiếu.
import { useEffect, useState } from "react";
import { ghi, lanDauTrongPhien } from "@/lib/do-luong";
import type { KetQuaKiemChung, LoaiKiemChung } from "@/lib/kiem-chung";
import { tyLeHien, type TyLe } from "@/lib/ty-le-kiem-chung";

const KHOA = (k: string) => `hbt.mot-lan.kiem-chung.${k}`;

export type LoaiKiemChungWeb = LoaiKiemChung | "doi_song";

function guiMayChu(loai: string, mau: string, phai: string, ket_qua: KetQuaKiemChung) {
  try {
    void fetch("/api/kiem-chung", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ loai, mau, phai, ket_qua }),
    }).catch(() => { /* im lặng */ });
  } catch { /* im lặng */ }
}

export function KiemChung({ loai, mau, phai, khoa, cauHoi = "Điều này có đúng với bạn?", tyLe, tyLeEngine }: {
  loai: LoaiKiemChungWeb; mau: string; phai: string; /** định danh thẻ trong phiên (mặc định = mã mẫu) */ khoa?: string; cauHoi?: string;
  /** Số phiếu công khai tải về (route tỉ lệ). */ tyLe?: TyLe;
  /** Số engine gắn sẵn vào hộp — ưu tiên hơn `tyLe`. */ tyLeEngine?: { ty_le_dung?: number; so_phieu?: number };
}) {
  const k = `${loai}.${khoa ?? mau}`;
  const [da, setDa] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem(KHOA(k))) setDa(true); } catch { /* chế độ riêng tư */ }
    // Cùng mã hiện hai nơi (hộp "Điều quan trọng nhất" dùng chung mã với hộp gốc trong chương) → bấm một nơi, nơi kia cũng xong.
    const nghe = (e: Event) => { if ((e as CustomEvent<string>).detail === k) setDa(true); };
    window.addEventListener("hbt-kiem-chung", nghe);
    return () => window.removeEventListener("hbt-kiem-chung", nghe);
  }, [k]);
  const tl = tyLeHien(tyLeEngine, tyLe);
  const bam = (kq: KetQuaKiemChung) => {
    if (da) return;
    setDa(true);
    try { window.dispatchEvent(new CustomEvent("hbt-kiem-chung", { detail: k })); } catch { /* bỏ qua */ }
    if (lanDauTrongPhien(`kiem-chung.${k}`)) {
      ghi("tuvi_kiem_chung", { loai, mau, ket_qua: kq, phai });
      guiMayChu(loai, mau, phai, kq);
    }
  };
  const dongTyLe = tl && (
    <p className="text-fg-muted" data-testid="ty-le-dung">
      <b className="text-sm text-fg">{tl.phanTram}%</b> trong {tl.tong} người có cùng điểm này thấy đúng
      <span className="block text-[0.7rem] text-fg-faint">số người tự bấm, không phải kiểm định khoa học</span>
    </p>
  );
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line/50 pt-2 text-xs" data-testid="kiem-chung">
      {da ? (
        <>
          <p className="text-fg-faint" role="status">Cảm ơn bạn — đã ghi nhận để ban biên tập xem lại.</p>
          {dongTyLe && <div className="w-full">{dongTyLe}</div>}
        </>
      ) : (
        <>
          {dongTyLe && <div className="w-full">{dongTyLe}</div>}
          <span className="text-fg-muted">{cauHoi}</span>
          {([["dung", "Đúng với mình"], ["chua_dung", "Chưa đúng"]] as const).map(([gt, nhan]) => (
            <button key={gt} type="button" onClick={() => bam(gt)}
              className="rounded-full border border-line px-3 py-1 text-fg-muted transition-colors hover:border-gold/60 hover:text-fg print:hidden">
              {nhan}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
