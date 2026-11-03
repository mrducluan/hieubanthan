// TM-1 (việc nền) — lối vào 150 trang "ngày tốt {việc} tháng M/YYYY" ngay trên công cụ Xem ngày tốt (trước chỉ tới được từ
// trang một ngày, sâu 3 cú bấm). Tháng này + tháng sau × 6 việc, kèm số ngày tốt engine đếm (cùng hàm chon_ngay của trang
// việc). Engine lỗi → khối vẫn có link, không có số. Server Component.
import Link from "@/components/khung/Lien";
import { VIEC_SEO, demViecThang, duongViecThang, homNayVN } from "@/lib/hoang-lich";

export async function NgayTotTheoViec({ className }: { className?: string }) {
  const h = homNayVN();
  const nam = Number(h.slice(0, 4)), thang = Number(h.slice(5, 7));
  const sau = thang === 12 ? { nam: nam + 1, thang: 1 } : { nam, thang: thang + 1 };
  const dem = await demViecThang(nam, thang, 2);
  const so = (ma: string, n: number, t: number) => dem?.find((d) => d.ma === ma && d.nam === n && d.thang === t)?.so_ngay;
  return (
    <section aria-labelledby="ngay-tot-theo-viec" className={className} data-testid="ngay-tot-theo-viec">
      <h2 id="ngay-tot-theo-viec" className="text-2xl">Ngày tốt theo việc</h2>
      <p className="mt-2 text-sm text-fg-muted">Danh sách ngày sách lịch ghi hợp từng việc trong tháng, chưa xét tuổi — mở trang để xem ngày và giờ tốt.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[{ nam, thang }, sau].map((m) => (
          <div key={`${m.nam}-${m.thang}`} className="rounded-2xl border border-line/70 bg-surface/40 p-4">
            <h3 className="text-base font-semibold text-fg">Tháng {m.thang}/{m.nam}</h3>
            <ul className="mt-2 divide-y divide-line/50">
              {VIEC_SEO.map((v) => {
                const n = so(v.ma, m.nam, m.thang);
                return (
                  <li key={v.ma}>
                    <Link href={duongViecThang(v.slug, m.nam, m.thang)} className="flex min-h-11 items-center justify-between gap-3 py-1.5 text-sm text-fg hover:text-gold">
                      <span>{v.ten}</span>
                      {n !== undefined && <span className="text-xs tabular-nums text-fg-faint">{n ? `${n} ngày tốt` : "chưa có ngày đủ tốt"}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
