// Một đồ hình khắc gỗ (Thần Tướng Toàn Biên) + lớp phủ chú giải bấm được. Danh sách MỌI điểm render ở máy chủ (chữ Hán, âm,
// nghĩa) để Google và bot AI đọc được không cần JS. Engine 404 → notFound; engine lỗi → 5xx.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { DuongDan } from "@/components/khung/DuongDan";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { DoHinhPhu } from "@/components/nhan-tuong/DoHinhPhu";
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang, urlDayDu } from "@/lib/seo";
import { duongDanCum } from "@/lib/duong-dan";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { anhDoHinh, layDoHinh, DUONG_DO_HINH } from "@/lib/do-hinh";

type P = { params: Promise<{ ma: string }> };

async function metaGoc(p: P): Promise<Metadata> {
  const dh = await layDoHinh((await p.params).ma);
  if (!dh) return {};
  return metaTrang({ tieuDe: `${dh.ten} (${dh.ten_han}) — đồ hình nhân tướng`, moTa: dh.mo_ta.slice(0, 158), duong: dh.duong });
}
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));

export default async function Page(p: P) {
  const dh = await layDoHinh((await p.params).ma);
  if (!dh) notFound();
  const nd = await layNoiDungTrang(dh.duong, { ten: dh.ten });
  const dd = duongDanCum({ ten: "Đồ hình sách xưa", duong: DUONG_DO_HINH }, { ten: dh.ten, duong: dh.duong });
  const theoNhom = dh.nhom.map((n) => ({ ...n, diem: dh.diem.filter((x) => x.nhom === n.ma) })).filter((n) => n.diem.length);
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: dh.duong, ten: dh.ten, tomTat: dh.mo_ta, about: ["Nhân tướng học", "Thần Tướng Toàn Biên", dh.ten_han] }),
        ldDuongDan(dd),
        { "@type": "ImageObject", contentUrl: urlDayDu(anhDoHinh(dh.tep)), width: dh.rong, height: dh.cao,
          caption: `${dh.ten} (${dh.ten_han}) — ${dh.nguon_hien_thi}` },
      )} />
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc cap={1} nho={`${dh.ten_han} · ${dh.am}`} lon={nd.dau.h1 ?? dh.ten} />
      <KhoiCms ds={nd.khoi.tren} duong={dh.duong} viTri="tren" className="mb-6" />
      <div className="mb-6"><TraLoiNhanh chu={dh.mo_ta} /></div>
      <DoHinhPhu dh={dh} />
      <section className="mt-12" aria-labelledby="ds-diem">
        <h2 id="ds-diem" className="text-2xl">Các chữ khắc trên {dh.ten.toLowerCase()}</h2>
        {theoNhom.map((n) => (
          <div key={n.ma} className="mt-6">
            <h3 className="text-lg">{n.ten}</h3>
            <dl className="mt-3 grid gap-3 md:grid-cols-2" data-testid="ds-diem-may-chu">
              {n.diem.map((x) => (
                <div key={x.id} className="rounded-xl border border-line/70 p-3">
                  <dt className="text-fg"><span lang="zh-Hant" className="font-serif">{x.han}</span>{x.am ? ` · ${x.am}` : ""} — {x.ten}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-fg-muted">{x.y}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        {dh.cau_khung && <p className="mt-6 text-sm text-fg-faint">{dh.cau_khung}</p>}
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={dh.duong} viTri="duoi" className="mt-8" />
      <section className="mt-12" aria-labelledby="do-hinh-khac">
        <h2 id="do-hinh-khac" className="text-xl">Đồ hình khác</h2>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          {dh.khac.map((x) => <li key={x.ma}><Link href={x.duong} className="text-gold underline decoration-gold/40 underline-offset-2">{x.ten}</Link></li>)}
        </ul>
        <p className="mt-6 text-sm text-fg-muted">
          Đọc theo gương mặt của chính bạn: <Link href="/nhan-tuong" className="text-gold underline">Soi gương theo sách xưa</Link>
        </p>
      </section>
      <KhoiCms ds={nd.khoi.cuoi} duong={dh.duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}
