"use client";
// LX-2027 — Bao Lì Xì 3D thủ công LÌ XÌ TẾT 2027 (4 chất liệu giấy × 6 hoạ tiết nghệ thuật + nền gấm ép kim 24K tuỳ chọn).
// Tích hợp artwork độ phân giải cao tự phục vụ tại /public/li-xi/ (Linh Vật Đinh Mùi 3 phong cách · Hoa Mai Vàng · Hoa Đào Bích ·
// Nền Gấm Ép Kim 24K), hiệu ứng hoa rơi nhẹ (bật/tắt) và pháo hoa bung tia khi mở bao. Sạch CSP-2, 0 CDN ngoài, 0 hydration warning.
import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { RotateCw, Sparkles } from "lucide-react";
import {
  ANH_NEN_GAM_EP_KIM,
  hoaTietTheoMa,
  mauThiepTheoMa,
  thongTinHoaTiet,
  type HoaTietTet,
  type MauThiep,
} from "@/lib/li-xi-tet";
import { BieuTrungDinhMui, CanhHoaRoi, CanhHoaXuan, ConDauTrien, PhaoHoaXuan, TextureGamCo } from "./HoaTietTet";
import { PhaoHoaCanvas } from "./PhaoHoaCanvas";

interface Props {
  mauThiep: MauThiep;
  hoaTiet?: HoaTietTet;
  hoaRoi?: boolean;
  nenGam?: boolean;
  tenNguoiTang?: string | null;
  loiChuc?: string | null;
  daMo: boolean;
  onMo?: () => void;
  nhanNut?: string;
  compact?: boolean;
  /** Tăng giá trị để bắn lại pháo hoa từ bên ngoài (nút "Xem thử" ở trang mua). */
  phatLai?: number;
}

export function BaoLiXi3D({
  mauThiep,
  hoaTiet,
  hoaRoi = true,
  nenGam = true,
  tenNguoiTang,
  loiChuc,
  daMo,
  onMo,
  nhanNut = "Mở Bao LÌ XÌ TẾT 2027",
  compact = false,
  phatLai = 0,
}: Props) {
  const giam = useReducedMotion();
  const patId = useId();
  const t = mauThiepTheoMa(mauThiep);
  const hoa = hoaTietTheoMa(hoaTiet, mauThiep);
  const ttHoa = thongTinHoaTiet(hoa, mauThiep);
  const mauCanh = hoa === "hoa_dao" ? "#fda4af" : hoa === "hoa_mai" ? "#fde047" : t.mauCanhHoa;
  const chucHien = (loiChuc ?? "").trim() || "Chúc năm Đinh Mùi 2027 vạn sự hanh thông, tâm an trí sáng, mọi quyết định lớn đều đúng thời điểm.";
  const neo = useRef<HTMLDivElement>(null);
  const [lan, setLan] = useState(0);   // số lần bắn pháo hoa (0 = chưa mở)
  useEffect(() => { if (daMo) setLan((n) => (n === 0 ? 1 : n)); else setLan(0); }, [daMo]);
  const bangMau = [t.nhan, "#fda4af", "#fde047", "#fff7d6", "#f97316"];
  // Lời chúc đổi (chọn mẫu / gõ) → hiện lại từng chữ sau khi người dùng ngừng gõ ~0,5 giây.
  const [chucAnim, setChucAnim] = useState(chucHien);
  useEffect(() => { const h = setTimeout(() => setChucAnim(chucHien), 500); return () => clearTimeout(h); }, [chucHien]);
  const tu = chucAnim.split(/\s+/).filter(Boolean);
  const khoaChuc = Array.from(chucAnim).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
  useEffect(() => { if (phatLai > 0) setLan((n) => Math.max(n, 1) + 1); }, [phatLai]);

  return (
    <div ref={neo} className={`relative mx-auto w-full ${compact ? "max-w-sm" : "max-w-md"} select-none`} data-testid="bao-li-xi-3d">
      {/* Pháo hoa canvas: tên lửa + nhiều kiểu nổ + màn kết; chạm trang để bắn thêm */}
      {daMo && !giam && (
        <div className="pointer-events-none absolute -inset-4 z-30 overflow-visible" aria-hidden data-testid="lx-phao-hoa">
          <PhaoHoaCanvas kich={lan} neo={neo} bangMau={bangMau} chu={["2027", "PHÚC"]} />
        </div>
      )}

      {/* Thiệp lời chúc trượt lên khi mở bao */}
      <motion.div
        initial={false}
        animate={daMo ? { y: 0, opacity: 1, scale: 1 } : { y: 24, opacity: 0, scale: 0.96 }}
        transition={{ duration: giam ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden={!daMo}
        className={`relative z-20 mx-3 rounded-2xl border p-5 shadow-2xl ${daMo ? "mb-[-20px] overflow-hidden" : "pointer-events-none h-0 overflow-hidden border-0 p-0"}`}
        style={{ background: "#fffaf0", borderColor: t.vien, color: "#2b1610" }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a3412]">Thiệp LÌ XÌ TẾT 2027</span>
          <ConDauTrien />
        </div>
        <p className="mt-3 font-serif text-lg leading-relaxed text-[#2b1610]" aria-label={chucHien}>
          <span aria-hidden>“</span>
          {tu.map((w, i) => (
            <motion.span
              key={`${lan}-${khoaChuc}-${i}`}
              aria-hidden
              className="inline-block whitespace-pre"
              initial={giam || !daMo ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={daMo ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0 }}
              transition={{ duration: giam ? 0 : 0.45, delay: giam ? 0 : 0.55 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {w}{i < tu.length - 1 ? " " : ""}
            </motion.span>
          ))}
          <span aria-hidden>”</span>
        </p>
        {daMo && !giam && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-[#ffd36a]/35 to-transparent"
            initial={{ x: "0%" }}
            animate={{ x: "420%" }}
            transition={{ duration: 1.3, delay: 0.5, ease: "easeInOut" }}
          />
        )}
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
        {/* Lớp nền Gấm Đỏ Son Ép Kim 24K (khi bật nenGam) hòa trộn với màu chất liệu đã chọn */}
        {nenGam && (
          <img
            src={ANH_NEN_GAM_EP_KIM}
            alt=""
            aria-hidden
            data-testid="lx-nen-gam"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity"
          />
        )}

        {/* Texture giấy gấm đồng xu cổ */}
        <TextureGamCo id={`gam-${patId}`} color={t.vien} />

        {/* Hiệu ứng cánh hoa mai / hoa đào rơi nhẹ */}
        {hoaRoi && <CanhHoaRoi mau={mauCanh} />}

        {/* Hoạ tiết góc phụ trợ */}
        {hoa === "hoa_mai" && (
          <CanhHoaXuan loai="mai" className="pointer-events-none absolute -bottom-2 -left-2 size-24 rotate-180 opacity-60" />
        )}
        {hoa === "hoa_dao" && (
          <CanhHoaXuan loai="dao" className="pointer-events-none absolute -bottom-2 -left-2 size-24 rotate-180 opacity-60" />
        )}
        {hoa === "phao_hoa" && (
          <>
            <PhaoHoaXuan color={t.nhan} className="pointer-events-none absolute -right-3 -top-3 size-28 opacity-80" />
            <PhaoHoaXuan color="#fda4af" className="pointer-events-none absolute -bottom-3 -left-3 size-24 opacity-65" />
          </>
        )}

        {/* Khung viền kép ép kim */}
        <div className="pointer-events-none absolute inset-2.5 rounded-2xl border opacity-55" style={{ borderColor: t.vien }} />

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
          className="relative z-10 flex flex-col items-center rounded-b-[42%] px-6 pb-6 pt-5 text-center shadow-md"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: t.nhan }}>
            LÌ XÌ TẾT · ĐINH MÙI 2027
          </p>
          <p className="mt-1 font-serif text-xl font-semibold">
            {tenNguoiTang?.trim() ? `${tenNguoiTang.trim()} lì xì bạn` : "LÌ XÌ TẾT 2027"}
          </p>
        </motion.div>

        {/* Tâm điểm mặt bao: Medallion Artwork (Linh Vật Đinh Mùi 3 mẫu / Hoa Mai / Hoa Đào) + Nút Mở con dấu sáp vàng */}
        <div className="relative z-10 flex flex-col items-center px-6 pb-7 pt-4 text-center">
          {ttHoa.anh ? (
            <div
              className="relative mb-3.5 overflow-hidden rounded-2xl border-2 p-1 shadow-xl transition-transform duration-300"
              style={{
                borderColor: t.vien,
                background: "rgba(0,0,0,0.28)",
                width: daMo ? 112 : 168,
                height: daMo ? 112 : 168,
              }}
              data-testid="lx-artwork-medallion"
            >
              <img
                src={ttHoa.anh}
                alt={ttHoa.ten}
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
          ) : (
            !daMo && <BieuTrungDinhMui color={t.nhan} className="mb-3 size-20 opacity-90" />
          )}

          {!daMo ? (
            <button
              type="button"
              onClick={onMo}
              data-testid="nut-mo-li-xi"
              className="group relative flex size-20 flex-col items-center justify-center rounded-full border-2 shadow-xl transition-transform duration-200 hover:scale-105 hover:shadow-2xl active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={{
                background: `radial-gradient(circle at 30% 30%, #fde68a, ${t.vien} 65%, #b47b1e 100%)`,
                borderColor: "#fff8dc",
                color: "#3b170b",
              }}
            >
              <span className="font-serif text-xl font-bold leading-none">Mở</span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest">2027</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-medium" style={{ borderColor: t.vien, color: t.nhan }}>
              <Sparkles className="size-3.5" aria-hidden /> Đã mở bao lì xì
            </div>
          )}

          {daMo && !giam && (
            <button
              type="button"
              onClick={() => setLan((n) => n + 1)}
              data-testid="lx-ban-lai"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              style={{ borderColor: t.vien, color: t.nhan }}
            >
              <RotateCw className="size-3" aria-hidden /> Bắn pháo hoa lại · chạm màn hình để bắn thêm
            </button>
          )}
          <p className="mt-3.5 text-xs opacity-90">
            {!daMo ? nhanNut : "Trọn bộ Báo cáo Năm Đinh Mùi 2027 (Tử vi · Bát tự · Thần số · 9 việc lớn)"}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] opacity-75">
            <span>{ttHoa.ten}</span>
            <span>·</span>
            <span>hieuban.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
