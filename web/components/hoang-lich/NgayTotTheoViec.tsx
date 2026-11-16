// TM-1 (việc nền) — lối vào 150 trang "ngày tốt {việc} tháng M/YYYY" ngay trên công cụ Xem ngày tốt (trước chỉ tới được từ
// trang một ngày, sâu 3 cú bấm). Tháng này + tháng sau × 6 việc, kèm số ngày tốt engine đếm (cùng hàm chon_ngay của trang
// việc). Tháng 0 ngày tốt (trang đó noindex, AUD-Q3) → chữ thường, không link. Khối vẽ ngay (Suspense) rồi điền số;
// engine lỗi → vẫn đủ link, không có số.
import { Suspense } from "react";
import Link from "@/components/khung/Lien";
import { VIEC_SEO, demViecThang, duongViecThang, homNayVN, type DemViecThang } from "@/lib/hoang-lich";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { taoChu } from "@/lib/chu-trang";
import { CHU_LICH_UI } from "@/lib/chu/lich";
import { dinhNgay } from "@/lib/dinh-dang";

type Nn = { en: boolean; ma: string };

function haiThang() {
  const h = homNayVN();
  const nam = Number(h.slice(0, 4)), thang = Number(h.slice(5, 7));
  return [{ nam, thang }, thang === 12 ? { nam: nam + 1, thang: 1 } : { nam, thang: thang + 1 }];
}

function Bang({ dem, nn }: { dem?: DemViecThang[] | null; nn: Nn }) {
  const c = taoChu(CHU_LICH_UI, null, nn.en ? "en" : "vi");
  const so = (ma: string, n: number, t: number) => dem?.find((d) => d.ma === ma && d.nam === n && d.thang === t)?.so_ngay;
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {haiThang().map((m) => (
        <div key={`${m.nam}-${m.thang}`} className="rounded-2xl border border-line/70 bg-surface/40 p-4">
          <h3 className="text-base font-semibold text-fg">{nn.en ? dinhNgay({ nam: m.nam, thang: m.thang, ngay: 1 }, nn.ma, "thang_nam") : <>Tháng {m.thang}/{m.nam}</>}</h3>
          <ul className="mt-2 divide-y divide-line/50">
            {VIEC_SEO.map((v) => {
              const n = so(v.ma, m.nam, m.thang);
              const dem = n !== undefined && <span className="text-xs tabular-nums text-fg-faint"><span className="sr-only">: </span>{n ? (nn.en ? c(n === 1 ? "viec_thang.mot" : "viec_thang.so", { so: String(n) }) : `${n} ngày tốt`) : c("viec_thang.khong")}</span>;
              const ten = nn.en ? c(`viec.ten.${v.ma}`) : v.ten;
              return (
                <li key={v.ma}>
                  {n === 0
                    ? <span className="flex min-h-11 items-center justify-between gap-3 py-1.5 text-sm text-fg-muted">{ten}{dem}</span>
                    : <Link href={duongViecThang(v.slug, m.nam, m.thang, nn.en)} className="flex min-h-11 items-center justify-between gap-3 py-1.5 text-sm text-fg hover:text-gold">{ten}{dem}</Link>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

async function BangCoSo({ nn }: { nn: Nn }) {
  const [m] = haiThang();
  return <Bang dem={await demViecThang(m!.nam, m!.thang, 2)} nn={nn} />;
}

export async function NgayTotTheoViec({ className }: { className?: string }) {
  const { ngonNgu, ma } = await ngonNguMayChu();
  const nn = { en: ngonNgu === "en", ma }, c = taoChu(CHU_LICH_UI, null, ngonNgu);
  return (
    <section aria-labelledby="ngay-tot-theo-viec" className={className} data-testid="ngay-tot-theo-viec">
      <h2 id="ngay-tot-theo-viec" className="text-2xl">{c("viec_thang.tieu_de")}</h2>
      <p className="mt-2 text-sm text-fg-muted">{c("viec_thang.dan")}</p>
      <Suspense fallback={<Bang nn={nn} />}><BangCoSo nn={nn} /></Suspense>
    </section>
  );
}
