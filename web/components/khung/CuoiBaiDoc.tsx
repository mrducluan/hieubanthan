"use client";
// Gate 1 — cuối mỗi bài đọc (mọi mảng): mốc "đọc xong" (reading_completed khi cuộn tới + đã cuộn + ở ≥ 10 giây, mỗi phiên
// một lần mỗi mảng). Nghĩa "đọc xong" từng mảng: Thần số/chiều sâu = tới hết 4 thẻ cốt lõi / phần chiều sâu; Tử vi, Bát tự
// = cuộn qua lá số + chi tiết + cách cục tới khối luận giải; Kinh Dịch = có lời quẻ và cuộn xuống dưới khung hỏi;
// Phong thuỷ = qua la bàn + công cụ hướng nhà; Hợp đôi = hết phần so hai người; Hôm nay = hết thẻ ngày/tháng/năm.
// + góp ý 1 chạm (feedback_submitted, huu_ich) + chỗ cho lời mời chia sẻ của mảng (Gate 2). Đặt SAU phần bài đọc.
import { useEffect, useRef, type ReactNode } from "react";
import { batDauDoc, docXong } from "@/lib/do-luong";
import { GopY } from "./GopY";

/** Ghi reading_started một lần khi `sanSang` (kết quả của mảng đã hiện). */
export function useBatDauDoc(moDun: string, sanSang: boolean): void {
  useEffect(() => { if (sanSang) batDauDoc(moDun); }, [moDun, sanSang]);
}

/** Mốc vô hình cuối bài: reading_completed khi (1) mốc lọt vào màn hình, (2) người dùng ĐÃ CUỘN trang từ lúc bài hiện,
 *  (3) đã ở với bài ít nhất `giayToiThieu` giây — tránh đếm "đọc xong" khi trang ngắn vừa mở đã thấy cuối bài. */
export function MocDocXong({ moDun, them, giayToiThieu = 10 }: { moDun: string; them?: Record<string, unknown>; giayToiThieu?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const thamSo = useRef(them);
  thamSo.current = them;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t0 = Date.now();
    let thay = false, daCuon = false, xong = false, hen: ReturnType<typeof setTimeout> | undefined;
    const thu = () => {
      if (xong || !thay || !daCuon) return;
      const conLai = giayToiThieu * 1000 - (Date.now() - t0);
      if (conLai > 0) { clearTimeout(hen); hen = setTimeout(thu, conLai); return; }
      xong = true; docXong(moDun, thamSo.current); io.disconnect(); window.removeEventListener("scroll", cuon);
    };
    const cuon = () => { daCuon = true; thu(); };
    const io = new IntersectionObserver(([e]) => { thay = Boolean(e?.isIntersecting); thu(); }, { threshold: 0.1 });
    io.observe(el);
    window.addEventListener("scroll", cuon, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", cuon); clearTimeout(hen); };
  }, [moDun, giayToiThieu]);
  return <div ref={ref} aria-hidden className="h-px w-full" data-testid={`doc-xong-${moDun}`} />;
}

export function CuoiBaiDoc({ moDun, cauHoi, chiaSe }: { moDun: string; cauHoi?: string; chiaSe?: ReactNode }) {
  return (
    <section aria-label="Góp ý bài đọc" className="mt-10 space-y-6">
      <MocDocXong moDun={moDun} />
      <GopY moDun={moDun} cauHoi={cauHoi} />
      {chiaSe}
    </section>
  );
}
