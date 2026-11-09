"use client";
// KC-0 — nút 1 chạm "Đúng với mình / Chưa đúng" (thay RLHF của bộ tài liệu v2.2, docs/PHAN-TICH-MIGRATION-V2-2.md).
// Không ô nhập chữ. Chỉ gửi MÃ (lib/kiem-chung) lên PostHog; mỗi thẻ ghi một lần mỗi phiên trình duyệt.
// LG-ĐS (docs/LUAN-GIAI-DOI-SONG.md mục 3, 5): thêm loại "doi_song"; phiếu còn gửi về máy chủ (POST /api/kiem-chung,
// chỉ mã — lỗi thì im lặng) và hiện công khai "x% trong N người… thấy đúng" khi đủ ≥ 30 phiếu.
// Trục 1 (2026-10-26): một hàng hai nút chia đôi (không rơi dòng ở 360px), cao ≥ 44px; bấm xong đổi thành dấu ✓ màu +
// "Đã ghi" có chuyển động ngắn (tôn trọng giảm chuyển động). Cùng mã hiện hai nơi → bấm một nơi, nơi kia cũng xong.
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { useChuChung } from "@/components/cms/ChuChung";
import { ghi, lanDauTrongPhien } from "@/lib/do-luong";
import type { KetQuaKiemChung, LoaiKiemChung } from "@/lib/kiem-chung";
import { tyLeHien, type TyLe } from "@/lib/ty-le-kiem-chung";
import { ghiNhanDung } from "@/lib/kiem-chung-sau";
import { useXemNguoiThan } from "@/components/huyen-hoc/XemNguoiThan";
import { maNgonNguTrang } from "@/lib/ngon-ngu";

const KHOA = (k: string) => `hbt.mot-lan.kiem-chung.${k}`;

export type LoaiKiemChungWeb = LoaiKiemChung;

/** Ý7: mã ngôn ngữ ghi vào phiếu + PostHog — trang /en có thể đang ở biến thể thị trường (en-us). */
const maPhieu = (ngonNguTrang: "vi" | "en") => (ngonNguTrang === "en" ? maNgonNguTrang() : "vi");

function guiMayChu(loai: string, mau: string, phai: string, ket_qua: KetQuaKiemChung, ngonNguTrang: "vi" | "en") {
  const ngon_ngu = maPhieu(ngonNguTrang);
  try {
    // HTT-1: phiếu mang ngôn ngữ của trang (migration 0034) — DB chưa chạy 0034 thì route tự gọi hàm cũ.
    void fetch("/api/kiem-chung", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ loai, mau, phai, ket_qua, ngon_ngu }),
    }).catch(() => { /* im lặng */ });
  } catch { /* im lặng */ }
}

/** HTT-1: chữ của nút theo ngôn ngữ (bản Anh không có CMS "Chữ dùng chung"). */
export interface NhanKiemChung { hoi: string; dung: string; chua_dung: string; da_ghi: string }

export function KiemChung({ loai, mau, phai, khoa, cauHoi, tyLe, tyLeEngine, theoDoi, ngonNgu = "vi", nhan }: {
  loai: LoaiKiemChungWeb; mau: string; phai: string; /** định danh thẻ trong phiên (mặc định = mã mẫu) */ khoa?: string; cauHoi?: string;
  /** HTT-1: ngôn ngữ trang (ghi kèm phiếu) + chữ nút khi không có CMS (bản /en). */ ngonNgu?: "vi" | "en"; nhan?: NhanKiemChung;
  /** Số phiếu công khai tải về (route tỉ lệ). */ tyLe?: TyLe;
  /** Số engine gắn sẵn vào hộp — ưu tiên hơn `tyLe`. */ tyLeEngine?: { ty_le_dung?: number; so_phieu?: number };
  /** Q7: nhãn hộp đáng hỏi lại sau 30 ngày (hộp Nên để ý / Lời khuyên) — bấm "Đúng với mình" thì máy nhớ để Hôm nay hỏi lại. */
  theoDoi?: string;
}) {
  const k = `${loai}.${khoa ?? mau}`;
  const c = useChuChung();
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
    try {
      window.dispatchEvent(new CustomEvent("hbt-kiem-chung", { detail: k }));
      // HTT-1: lớp giao thoa nghe mã + kết quả (không chữ) để ghép "điểm giao thoa" khi đủ 2 hộp Đúng.
      window.dispatchEvent(new CustomEvent("hbt-phieu", { detail: { loai, mau, phai, ket_qua: kq } }));
    } catch { /* bỏ qua */ }
    if (lanDauTrongPhien(`kiem-chung.${k}`)) {
      ghi("tuvi_kiem_chung", { loai, mau, ket_qua: kq, phai, ngon_ngu: maPhieu(ngonNgu) });
      guiMayChu(loai, mau, phai, kq, ngonNgu);
      if (kq === "dung" && theoDoi && (loai === "doi_song" || loai === "hai_nguoi")) {
        ghiNhanDung({ loai, mau, phai, nhan: theoDoi.slice(0, 80), mo_dun: mau.split(".")[1] ?? "" });
      }
    }
  };
  const giam = useReducedMotion();
  // NT-1: phiếu nói về lá số của chính người bấm → đang xem lá số người thân thì không hỏi.
  const xemNguoiThan = useXemNguoiThan();
  if (xemNguoiThan) return null;
  const dongTyLe = tl && (
    <p className="text-fg-muted" data-testid="ty-le-dung">
      {ngonNgu === "en" ? (
        <><b className="text-sm text-fg">{tl.phanTram}%</b> of {tl.tong} people with this same point found it true
          <span className="block text-[0.7rem] text-fg-faint">self-reported clicks, not a scientific test</span></>
      ) : (
        <><b className="text-sm text-fg">{tl.phanTram}%</b> trong {tl.tong} người có cùng điểm này thấy đúng
          <span className="block text-[0.7rem] text-fg-faint">số người tự bấm, không phải kiểm định khoa học</span></>
      )}
    </p>
  );
  return (
    <div className="space-y-2 border-t border-line/50 pt-2.5 text-xs" data-testid="kiem-chung" data-da={da ? "1" : undefined}>
      {dongTyLe}
      {da ? (
        <p className="flex min-h-11 items-center gap-2 text-sm" role="status">
          <motion.span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-jade/15 text-jade"
            initial={giam ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={giam ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 22 }}>
            <Check className="size-4" strokeWidth={3} />
          </motion.span>
          <motion.span className="font-semibold text-jade" initial={giam ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: giam ? 0 : 0.22, delay: giam ? 0 : 0.08 }}>
            {nhan?.da_ghi ?? c("kiem_chung.da_ghi")}
          </motion.span>
          {!nhan && <span className="sr-only"> — {c("kiem_chung.cam_on")}</span>}
        </p>
      ) : (
        <div className="print:hidden">
          <p className="text-fg-muted">{cauHoi ?? nhan?.hoi ?? c("kiem_chung.hoi")}</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {([["dung", nhan?.dung ?? c("kiem_chung.dung")], ["chua_dung", nhan?.chua_dung ?? c("kiem_chung.chua_dung")]] as const).map(([gt, chuNut]) => (
              <button key={gt} type="button" onClick={() => bam(gt)}
                className="min-h-11 min-w-0 rounded-full border border-line px-2 text-[0.8125rem] leading-tight text-fg-muted transition-colors hover:border-gold/60 hover:text-fg active:bg-surface">
                {chuNut}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
