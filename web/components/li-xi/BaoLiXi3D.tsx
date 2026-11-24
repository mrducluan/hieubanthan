"use client";
// LX-2027 — Bao Lì Xì 3D thủ công Tết Đinh Mùi 2027 (4 chất liệu: Đỏ Son Hoàng Kim, Mai Vàng Phú Quý, Ngọc Bích An Khang,
// Đêm Giao Thừa). Dùng motion/react sẵn có, 0 CDN ngoài, sạch CSP-2, tôn trọng prefers-reduced-motion.
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { mauThiepTheoMa, type MauThiep } from "@/lib/li-xi-tet";

interface Props {
  mauThiep: MauThiep;
  tenNguoiTang?: string | null;
  loiChuc?: string | null;
  daMo: boolean;
  onMo?: () => void;
  nhanNut?: string;
  compact?: boolean;
}

/** Cánh hoa mai 5 cánh vẽ bằng SVG nội dòng (nhẹ, sắc nét ở mọi mật độ điểm ảnh). */
function HoaMai({ className, color }: { className?: string; color: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx="20" cy="10" rx="5.5" ry="8" fill={color} fillOpacity="0.22" transform={`rotate(${deg} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="3" fill={color} fillOpacity="0.45" />
    </svg>
  );
}

export function BaoLiXi3D({ mauThiep, tenNguoiTang, loiChuc, daMo, onMo, nhanNut = "Mở Bao Lì Xì Đinh Mùi 2027", compact = false }: Props) {
  const giam = useReducedMotion();
  const t = mauThiepTheoMa(mauThiep);
  const chucHien = (loiChuc ?? "").trim() || "Chúc năm Đinh Mùi 2027 vạn sự hanh thông, tâm an trí sáng, mọi quyết định lớn đều đúng thời điểm.";

  return (
    <div className={`relative mx-auto w-full ${compact ? "max-w-sm" : "max-w-md"} select-none`} data-testid="bao-li-xi-3d">
      {/* Thiệp lời chúc trượt lên khi mở bao */}
      <motion.div
        initial={false}
        animate={daMo ? { y: 0, opacity: 1, scale: 1 } : { y: 24, opacity: 0, scale: 0.96 }}
        transition={{ duration: giam ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden={!daMo}
        className={`relative z-20 mx-3 rounded-2xl border p-5 shadow-2xl ${daMo ? "mb-[-20px]" : "pointer-events-none h-0 overflow-hidden border-0 p-0"}`}
        style={{ background: "#fffaf0", borderColor: t.vien, color: "#2b1610" }}
      >
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: "#9a3412" }}>
          <span>Thiệp Chúc Xuân Đinh Mùi</span>
          <span>2027</span>
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
          background: `radial-gradient(circle at 25% 15%, ${t.nenChinh}, ${t.nenPhu} 80%)`,
          borderColor: t.vien,
          color: t.chu,
        }}
      >
        {/* Hoạ tiết góc ép kim + hoa mai */}
        <HoaMai className="pointer-events-none absolute -right-4 -top-4 size-24" color={t.nhan} />
        <HoaMai className="pointer-events-none absolute -bottom-5 -left-5 size-28 opacity-75" color={t.nhan} />
        <div className="pointer-events-none absolute inset-2.5 rounded-2xl border opacity-40" style={{ borderColor: t.vien }} />

        {/* Nắp bao lì xì lật khi mở */}
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
          <p className="text-[11px] font-medium uppercase tracking-[0.28em]" style={{ color: t.nhan }}>
            Xuân Đinh Mùi · 2027
          </p>
          <p className="mt-1 font-serif text-xl font-semibold">
            {tenNguoiTang?.trim() ? `${tenNguoiTang.trim()} lì xì bạn` : "Lì Xì Báo Cáo Năm 2027"}
          </p>
        </motion.div>

        {/* Con dấu sáp vàng / Nút mở bao */}
        <div className="relative z-10 flex flex-col items-center px-6 pb-8 pt-6 text-center">
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

          <p className="mt-4 text-xs opacity-85">
            {!daMo ? nhanNut : "Trọn bộ Báo cáo Năm Đinh Mùi 2027 (Tử vi · Bát tự · Thần số · 9 việc lớn)"}
          </p>
          <p className="mt-1 text-[11px] opacity-65">hieuban.com · Văn hoá tham khảo & tự soi</p>
        </div>
      </div>
    </div>
  );
}
