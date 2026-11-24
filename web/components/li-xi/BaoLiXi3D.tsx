"use client";
// LX-2027 — Bao Lì Xì 3D thủ công LÌ XÌ TẾT 2027 (4 chất liệu giấy × 4 hoạ tiết Tết = 16 tổ hợp).
// Tích hợp texture giấy gấm đồng xu cổ, cành hoa mai/hoa đào, biểu trưng Linh Vật Đinh Mùi 2027, con dấu triện son,
// hiệu ứng hoa rơi nhẹ (bật/tắt) và pháo hoa bung tia khi mở bao. Sạch CSP-2, 0 CDN ngoài, 0 hydration warning.
import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { hoaTietTheoMa, mauThiepTheoMa, type HoaTietTet, type MauThiep } from "@/lib/li-xi-tet";
import { BieuTrungDinhMui, CanhHoaRoi, CanhHoaXuan, ConDauTrien, PhaoHoaXuan, TextureGamCo } from "./HoaTietTet";

interface Props {
  mauThiep: MauThiep;
  hoaTiet?: HoaTietTet;
  hoaRoi?: boolean;
  tenNguoiTang?: string | null;
  loiChuc?: string | null;
  daMo: boolean;
  onMo?: () => void;
  nhanNut?: string;
  compact?: boolean;
}

export function BaoLiXi3D({
  mauThiep,
  hoaTiet,
  hoaRoi = true,
  tenNguoiTang,
  loiChuc,
  daMo,
  onMo,
  nhanNut = "Mở Bao LÌ XÌ TẾT 2027",
  compact = false,
}: Props) {
  const giam = useReducedMotion();
  const patId = useId();
  const t = mauThiepTheoMa(mauThiep);
  const hoa = hoaTietTheoMa(hoaTiet, mauThiep);
  const mauCanh = hoa === "hoa_dao" ? "#fda4af" : hoa === "hoa_mai" ? "#fde047" : t.mauCanhHoa;
  const chucHien = (loiChuc ?? "").trim() || "Chúc năm Đinh Mùi 2027 vạn sự hanh thông, tâm an trí sáng, mọi quyết định lớn đều đúng thời điểm.";

  return (
    <div className={`relative mx-auto w-full ${compact ? "max-w-sm" : "max-w-md"} select-none`} data-testid="bao-li-xi-3d">
      {/* Pháo hoa bung tia vàng kim ngay khoảnh khắc mở bao lì xì */}
      {daMo && (
        <div className="pointer-events-none absolute -inset-4 z-30 overflow-visible" aria-hidden data-testid="lx-phao-hoa">
          <PhaoHoaXuan color={t.nhan} bungNo className="absolute -left-2 -top-2 size-24" />
          <PhaoHoaXuan color="#fda4af" bungNo className="absolute -right-2 top-2 size-20" />
          <PhaoHoaXuan color="#fde047" bungNo className="absolute right-8 -top-5 size-16" />
        </div>
      )}

      {/* Thiệp lời chúc trượt lên khi mở bao */}
      <motion.div
        initial={false}
        animate={daMo ? { y: 0, opacity: 1, scale: 1 } : { y: 24, opacity: 0, scale: 0.96 }}
        transition={{ duration: giam ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden={!daMo}
        className={`relative z-20 mx-3 rounded-2xl border p-5 shadow-2xl ${daMo ? "mb-[-20px]" : "pointer-events-none h-0 overflow-hidden border-0 p-0"}`}
        style={{ background: "#fffaf0", borderColor: t.vien, color: "#2b1610" }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a3412]">Thiệp LÌ XÌ TẾT 2027</span>
          <ConDauTrien />
        </div>
        <p className="mt-3 font-serif text-lg leading-relaxed text-[#2b1610]">“{chucHien}”</p>
        <p className="mt-3 text-right text-xs font-medium text-[#7c2d12]">
          — {tenNguoiTang?.trim() ? `Từ ${tenNguoiTang.trim()}` : "Gửi tặng bạn từ Hiểu Bản Thân"}
        </p>
      </motion.div>

      {/* Thân Bao Lì Xì */}
      <div
        className="relative overflow-hidden rounded-3xl border-2 shadow-2xl"
        style={{
          background: `radial-gradient(circle at 25% 15%, ${t.nenChinh}, ${t.nenPhu} 82%)`,
          borderColor: t.vien,
          color: t.chu,
        }}
      >
        {/* Texture giấy gấm đồng xu cổ */}
        <TextureGamCo id={`gam-${patId}`} color={t.vien} />

        {/* Hiệu ứng cánh hoa mai / hoa đào rơi nhẹ */}
        {hoaRoi && <CanhHoaRoi mau={mauCanh} />}

        {/* Hoạ tiết Tết theo lựa chọn (4 kiểu) */}
        {hoa === "hoa_mai" && (
          <>
            <CanhHoaXuan loai="mai" className="pointer-events-none absolute -right-2 -top-1 size-32 opacity-90" />
            <CanhHoaXuan loai="mai" className="pointer-events-none absolute -bottom-2 -left-2 size-28 rotate-180 opacity-75" />
          </>
        )}
        {hoa === "hoa_dao" && (
          <>
            <CanhHoaXuan loai="dao" className="pointer-events-none absolute -right-2 -top-1 size-32 opacity-90" />
            <CanhHoaXuan loai="dao" className="pointer-events-none absolute -bottom-2 -left-2 size-28 rotate-180 opacity-75" />
          </>
        )}
        {hoa === "linh_vat" && (
          <>
            <BieuTrungDinhMui color={t.nhan} className="pointer-events-none absolute -right-5 top-16 size-32 opacity-30" />
            <CanhHoaXuan loai="mai" className="pointer-events-none absolute -bottom-3 -left-3 size-24 rotate-180 opacity-65" />
          </>
        )}
        {hoa === "phao_hoa" && (
          <>
            <PhaoHoaXuan color={t.nhan} className="pointer-events-none absolute -right-3 -top-3 size-28 opacity-75" />
            <PhaoHoaXuan color="#fda4af" className="pointer-events-none absolute -bottom-3 -left-3 size-24 opacity-60" />
          </>
        )}

        {/* Khung viền kép ép kim */}
        <div className="pointer-events-none absolute inset-2.5 rounded-2xl border opacity-45" style={{ borderColor: t.vien }} />

        {/* Nắp bao lì xì lật 3D khi mở */}
        <motion.div
          initial={false}
          animate={daMo ? { rotateX: 165, opacity: 0.35 } : { rotateX: 0, opacity: 1 }}
          transition={{ duration: giam ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            transformOrigin: "top center",
            background: `linear-gradient(180deg, ${t.nenChinh} 0%, ${t.nenPhu} 100%)`,
            borderBottom: `1.5px solid ${t.vien}`,
          }}
          className="relative z-10 flex flex-col items-center rounded-b-[44%] px-6 pb-8 pt-6 text-center shadow-md"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: t.nhan }}>
            LÌ XÌ TẾT · ĐINH MÙI 2027
          </p>
          <p className="mt-1 font-serif text-xl font-semibold">
            {tenNguoiTang?.trim() ? `${tenNguoiTang.trim()} lì xì bạn` : "LÌ XÌ TẾT 2027"}
          </p>
        </motion.div>

        {/* Huy hiệu Linh Vật Đinh Mùi (khi chưa mở ở chế độ linh_vat) + Nút Mở con dấu sáp vàng */}
        <div className="relative z-10 flex flex-col items-center px-6 pb-7 pt-5 text-center">
          {!daMo && hoa === "linh_vat" && (
            <BieuTrungDinhMui color={t.nhan} className="mb-3 size-16 opacity-90" />
          )}

          {!daMo ? (
            <button
              type="button"
              onClick={onMo}
              data-testid="nut-mo-li-xi"
              className="group relative flex size-24 flex-col items-center justify-center rounded-full border-2 shadow-xl transition-transform duration-200 hover:scale-105 hover:shadow-2xl active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={{
                background: `radial-gradient(circle at 30% 30%, #fde68a, ${t.vien} 65%, #b47b1e 100%)`,
                borderColor: "#fff8dc",
                color: "#3b170b",
              }}
            >
              <span className="font-serif text-2xl font-bold leading-none">Mở</span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest">2027</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-medium" style={{ borderColor: t.vien, color: t.nhan }}>
              <Sparkles className="size-3.5" aria-hidden /> Đã mở bao lì xì
            </div>
          )}

          <p className="mt-4 text-xs opacity-90">
            {!daMo ? nhanNut : "Trọn bộ Báo cáo Năm Đinh Mùi 2027 (Tử vi · Bát tự · Thần số · 9 việc lớn)"}
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] opacity-75">
            <span>hieuban.com</span>
            <span>·</span>
            <span>Đinh Mùi Thiên Hà Thuỷ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
