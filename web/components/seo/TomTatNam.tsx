// SEO-O — khối "{chủ đề} năm {năm}: tóm tắt" cho trang GỐC của công cụ lịch & tuổi (/xem-tuoi-lam-nha, /tuoi-xong-dat,
// /xem-sao-han, /phong-thuy/huong-xau-nam, /nam, /doi-lich-am-duong, /xem-ngay-tot): trước đó trang gốc chỉ có ô nhập
// (~350–500 chữ), câu trả lời cho năm nằm ở trang con. Khối này đưa câu trả lời của engine + ý chính + ảnh tóm tắt lên
// trang gốc, kèm lối sang bảng đầy đủ. Engine lỗi → không hiện (công cụ vẫn chạy).
import Link from "@/components/khung/Lien";
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { lichNamCongKhai } from "@/lib/lich-am";
import { namCongKhai } from "@/lib/nam";
import { ngayTotCongKhai } from "@/lib/hoang-lich";
import { hanNamCongKhai, lamNhaNamCongKhai, saoHanNamCongKhai, xongDatNamCongKhai } from "@/lib/tuoi-dan-gian";
import { tomTatAnh, type ThamSoTomTat } from "@/lib/tom-tat-anh";

async function traLoi(t: ThamSoTomTat): Promise<string | null> {
  const n = t.nam ?? 0;
  switch (t.kieu) {
    case "lam_nha": return (await lamNhaNamCongKhai(n))?.tra_loi_nhanh ?? null;
    case "xong_dat": return (await xongDatNamCongKhai(n))?.tra_loi_nhanh ?? null;
    case "sao_han": return (await saoHanNamCongKhai(n))?.tra_loi_nhanh ?? null;
    case "huong_xau": return (await hanNamCongKhai(n))?.tra_loi_nhanh ?? null;
    case "nam": return (await namCongKhai(n))?.tra_loi_nhanh ?? null;
    case "lich_am": return (await lichNamCongKhai(n))?.tra_loi_nhanh ?? null;
    case "ngay": return t.ngay ? (await ngayTotCongKhai(t.ngay))?.tra_loi_nhanh ?? null : null;
    default: return null;
  }
}

/** `gonDong`: bỏ danh sách ý chính khi chính trang đã hiện đủ các ý đó (vd /xem-ngay-tot đã có thẻ hôm nay) — tránh lặp. */
export async function TomTatNam({ tieuDe, nhanLink, gonDong = false, ...t }: ThamSoTomTat & { tieuDe: string; nhanLink: string; gonDong?: boolean }) {
  const [tt, tl] = await Promise.all([tomTatAnh(t), traLoi(t)]);
  if (!tt) return null;
  return (
    <section aria-labelledby={`tom-tat-${t.kieu}`} className="mt-10" data-testid="tom-tat-nam">
      <h2 id={`tom-tat-${t.kieu}`} className="text-2xl">{tieuDe}</h2>
      {tl && <div className="mt-3"><TraLoiNhanh chu={tl} /></div>}
      {!gonDong && (
        <ul className="mt-4 space-y-1.5 text-fg-muted">
          {tt.dong.map((d) => <li key={d} className="flex gap-2"><span aria-hidden className="text-gold">•</span><span>{d}</span></li>)}
        </ul>
      )}
      <p className="mt-3"><Link href={tt.duong} className="text-gold underline underline-offset-4">{nhanLink} →</Link></p>
      <AnhTomTat {...t} className="mt-6" />
    </section>
  );
}
