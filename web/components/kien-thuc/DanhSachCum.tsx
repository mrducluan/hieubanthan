// TM-1 (C-2) — danh sách bài của một cụm dài, có mục lục: nhóm (H2 + neo), chip nhảy tới nhóm, ô lọc nhanh theo tên và chip
// lọc phụ (vd theo cung). Server Component: toàn bộ bài render ở máy chủ một lần (máy tìm kiếm thấy đủ link, không gửi lại
// dữ liệu bài cho trình duyệt); thanh lọc (BoLocCum, client) chỉ ẩn/hiện các dòng qua data-*, không đổi URL (tránh sinh
// trang trùng để Google index).
import Link from "@/components/khung/Lien";
import { BoLocCum } from "@/components/kien-thuc/BoLocCum";
import { maChu, type MucLucCum } from "@/lib/nhom-cum";
import { taoChu } from "@/lib/chu-trang";
import { CHU_KIEN_THUC } from "@/lib/chu/kien-thuc";

/** `en`: trang Anh (EN-ALL) — chữ theo bảng lib/chu/kien-thuc.ts chiều `en`; nhóm / đường dẫn bài do `mucLucCum(…, en)` dựng. */
export function DanhSachCum({ ml, id = "ds-cum", en = false }: { ml: MucLucCum; id?: string; en?: boolean }) {
  const tong = ml.nhom.reduce((s, n) => s + n.bai.length, 0);
  return (
    <div id={id} className="mt-8" data-testid="danh-sach-cum">
      <BoLocCum goc={id} tong={tong} nhanNhom={ml.nhanNhom} viDu={ml.viDu} loc={ml.loc}
        nhom={ml.nhom.map((n) => ({ ma: n.ma, ten: n.ten, so: n.bai.length }))} />
      <p data-cum-rong hidden className="mt-6 text-fg-muted">{taoChu(CHU_KIEN_THUC, null, en ? "en" : "vi")("ml.rong")}</p>
      {ml.nhom.map((n) => (
        <section key={n.ma} id={`nhom-${n.ma}`} data-nhom={n.ma} aria-labelledby={`nhom-${n.ma}-h`} className="mt-10 scroll-mt-24">
          {/* Số trang nằm NGOÀI H2: heading là câu tự đứng được (AEO), không dính "· 12". */}
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h2 id={`nhom-${n.ma}-h`} className="text-2xl">{n.tieuDe}</h2>
            <span data-so-nhom className="text-base text-fg-faint">· {n.bai.length}</span>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {n.bai.map((b) => (
              <li key={b.duong} data-cum-bai data-tim={maChu(b.tieu_de)} data-phu={b.phu.join(" ")}>
                <Link href={b.duong} className="glass block h-full rounded-2xl p-5 transition-colors hover:border-gold/50">
                  <h3 className="text-lg leading-snug">{b.tieu_de}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{b.mo_ta}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
