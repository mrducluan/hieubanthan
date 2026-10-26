// QH-URL — khối "Kiến thức {mảng}" ở trang công cụ (trang trụ): liệt kê các cụm con trong silo (/tu-vi → chính tinh,
// cung, sao ở cung, tứ hoá, lá số mẫu…). Liên kết trụ ↔ cụm hai chiều: cụm có breadcrumb về trụ, trụ trỏ xuống cụm.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TheLap } from "@/components/khung/TheLap";
import { TEN_MANG_SILO, dsCumTru } from "@/lib/kien-thuc";
import { DoKhoiCuoi } from "@/components/khung/DoKhoiCuoi";
import { lopCot, lopOCuoi, soCanLap, theLap, type TuyChonLap } from "@/lib/the-lap";

export function CumKienThucTru({ tru, className = "", tieuDe, dau = {}, lapTuyChon = {} }: {
  tru: string; className?: string;
  /** CTA-2: cấu hình CMS + thẻ ưu tiên của URL + tỉ lệ bấm (lib/the-lap-cms boLapTrang) */ lapTuyChon?: TuyChonLap;
  /** ND-7: chữ CMS — tiêu đề khối + tên/mô tả thẻ theo H1/lời dẫn của trang đích (layDauNhieuTrang). */
  tieuDe?: string; dau?: Record<string, { ten: string | null; moTa: string | null }>;
}) {
  const ds = dsCumTru(tru);
  if (!ds.length) return null;
  // CTA-2: silo ít cụm (Hợp đôi, Kinh Dịch: 1; Phong thuỷ: 2; Tử vi: 5) → bù lối đi chéo mảng cho kín hàng 3 cột.
  const lap = theLap(soCanLap(ds.length), { ...lapTuyChon, tru, boQua: [tru, ...ds.map((c) => c.duong)] });
  const tong = ds.length + lap.length;
  // Ban biên tập tắt thẻ bù → co số cột theo số mục thật thay vì để lủng ô.
  const cot = tong % 3 === 0 || lap.length ? "sm:grid-cols-2 lg:grid-cols-3" : lopCot(tong);
  return (
    <nav aria-labelledby="kien-thuc-tru" className={`mx-auto max-w-5xl ${className}`} data-testid="cum-kien-thuc-tru">
      <h2 id="kien-thuc-tru" className="text-2xl">{tieuDe ?? `Kiến thức ${TEN_MANG_SILO[tru]}`}</h2>
      <DoKhoiCuoi khoi="kien_thuc_tru" />
      <ul className={`mt-4 grid gap-3 ${cot}`}>
        {ds.map((c, i) => (
          <li key={c.duong} className={lopOCuoi(i, tong)}>
            <Link href={c.duong} className="glass group flex h-full flex-col rounded-2xl p-4 transition-colors hover:border-gold/50">
              <span className="flex items-center justify-between gap-2 font-serif text-lg">{dau[c.duong]?.ten ?? c.ten}
                <ArrowRight className="size-4 shrink-0 text-gold/70 transition-transform group-hover:translate-x-1" aria-hidden /></span>
              <span className="mt-1 line-clamp-2 text-sm text-fg-muted">{dau[c.duong]?.moTa ?? c.mo_ta}</span>
            </Link>
          </li>
        ))}
        {lap.map((t, i) => <TheLap key={t.duong} t={t} kieu="chu" className={lopOCuoi(ds.length + i, tong)} />)}
      </ul>
    </nav>
  );
}
