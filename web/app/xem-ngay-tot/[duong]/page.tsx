// HL-1 — trang một ngày (/xem-ngay-tot/2026-10-13) hoặc một tháng (/xem-ngay-tot/thang-10-2026).
// Ngày ngoài cửa sổ hữu ích (7 ngày trước → 400 ngày tới) vẫn xem được nhưng noindex; tháng index trong ±2 năm.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { LichThang, XemNgayTot } from "@/components/hoang-lich/XemNgayTot";
import { VIEC_SEO, docDuong, duongNgay, duongThang, duongViecThang, ngayDangIndex, ngayTotCongKhai, thangCongKhai, thangIndex, viecThangCongKhai } from "@/lib/hoang-lich";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang } from "@/lib/noi-dung-trang";
import { CHU_NGAY, CHU_THANG, CHU_VIEC_THANG } from "@/lib/chu/trang-con";

type P = { params: Promise<{ duong: string }> };
const dmy = (iso: string) => iso.split("-").reverse().join("/");

/** Trang con: WebPage + breadcrumb đúng như đường dẫn hiển thị; giới thiệu + hỏi đáp chỉ ở trang chính /xem-ngay-tot
 *  (không lặp FAQ trên hàng trăm trang ngày/tháng). */
function LdTrangCon({ duong, ten, moTa, cap, cuoi }: { duong: string; ten: string; moTa: string; cap: { ten: string; duong: string }[]; cuoi: { chu: string; link: string } }) {
  return (
    <>
      <JsonLd data={goiLd(
        { ...ldTrangWeb({ duong, ten, about: ["Xem ngày tốt", "Hoàng lịch", "Giờ hoàng đạo"] }), description: moTa },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Xem ngày tốt", duong: "/xem-ngay-tot" }, ...cap]),
      )} />
      <p className="mx-auto mt-10 max-w-3xl border-t border-line/50 pt-6 text-sm text-fg-muted">
        {cuoi.chu} <Link href="/xem-ngay-tot" className="text-gold underline">{cuoi.link}</Link>.
      </p>
    </>
  );
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const x = docDuong((await params).duong);
  if (!x) return {};
  if (x.loai === "viec") {
    // SEO-L2: "Ngày tốt cưới hỏi tháng 12 năm 2026" — cùng cửa sổ index với trang tháng.
    const ten = x.viec.ten.charAt(0).toLowerCase() + x.viec.ten.slice(1);
    const m = metaTrang({ tieuDe: `Ngày tốt ${ten} tháng ${x.thang}/${x.nam} theo hoàng lịch`,
      moTa: `Các ngày tốt ${ten} tháng ${x.thang} năm ${x.nam}: ngày âm, can chi, hoàng đạo, trực — chọn theo mục nên/kiêng của sách lịch, kèm ngày đẹp nhất trong tháng.`,
      duong: duongViecThang(x.viec.slug, x.nam, x.thang), anh: anhBai({ tieuDe: `Ngày tốt ${ten} tháng ${x.thang}/${x.nam}`, mang: "lich" }) });
    return thangIndex(x.nam, x.thang) ? m : { ...m, robots: { index: false, follow: true } };
  }
  if (x.loai === "ngay") {
    const m = metaTrang({ tieuDe: `Ngày ${dmy(x.iso)} tốt hay xấu? Hoàng đạo, giờ tốt, việc nên làm`,
      moTa: `Xem ngày ${dmy(x.iso)}: âm lịch, can chi, hoàng đạo hay hắc đạo, trực, giờ hoàng đạo, việc nên làm và nên kiêng, tuổi xung, hướng xuất hành.`,
      duong: duongNgay(x.iso) });
    return ngayDangIndex(x.iso) ? m : { ...m, robots: { index: false, follow: true } };
  }
  const m = metaTrang({ tieuDe: `Lịch ngày tốt tháng ${x.thang}/${x.nam}: ngày hoàng đạo, ngày đẹp`,
    moTa: `Lịch tháng ${x.thang} năm ${x.nam} có ngày âm, ngày hoàng đạo/hắc đạo, trực từng ngày; tìm ngày đẹp cưới hỏi, khai trương, về nhà mới, động thổ trong tháng.`,
    duong: `/xem-ngay-tot/${(await params).duong}` });
  return thangIndex(x.nam, x.thang) ? m : { ...m, robots: { index: false, follow: true } };
}

export default async function Page({ params }: P) {
  const x = docDuong((await params).duong);
  if (!x) notFound();
  if (x.loai === "viec") return <TrangViecThang x={x} />;
  if (x.loai === "ngay") {
    const [d, t] = await Promise.all([ngayTotCongKhai(x.iso), thangCongKhai(Number(x.iso.slice(0, 4)), Number(x.iso.slice(5, 7)))]);
    if (!d) throw new Error("engine lịch không phản hồi");   // → error.tsx, mã 5xx (không index trang lỗi)
    const thangCua = { nam: Number(x.iso.slice(0, 4)), thang: Number(x.iso.slice(5, 7)) };
    // ND-7: mẫu cụm "/xem-ngay-tot/{ngay}" — khối CMS + chữ (tiêu đề, đoạn cuối) sửa được cho cả cụm hoặc riêng ngày.
    const duong = duongNgay(x.iso), bien = { ngay: dmy(x.iso), thu: d.thu, am: d.am.chu };
    const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_NGAY, nd.chu), tieuDe = c("dau.tieu_de", bien);
    return (
      <>
        <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mx-auto mb-6 max-w-3xl" />
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href="/xem-ngay-tot" className="hover:underline">Xem ngày tốt</Link> ›{" "}
            <Link href={`/xem-ngay-tot/thang-${Number(x.iso.slice(5, 7))}-${x.iso.slice(0, 4)}`} className="hover:underline">Tháng {Number(x.iso.slice(5, 7))}/{x.iso.slice(0, 4)}</Link></nav>
          <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
          <XemNgayTot banDau={d} thang={t} />
        </div>
        <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mx-auto mt-10 max-w-3xl" />
        <LdTrangCon duong={duong} ten={tieuDe} cuoi={{ chu: c("cuoi.chu"), link: c("cuoi.link") }}
          moTa={`${d.thu}, âm lịch ${d.am.chu}, ngày ${d.can_chi.ngay}: ${d.hoang_dao ? "hoàng đạo" : "hắc đạo"} (${d.than.ten}), trực ${d.truc.ten}.`}
          cap={[{ ten: `Tháng ${thangCua.thang}/${thangCua.nam}`, duong: `/xem-ngay-tot/thang-${thangCua.thang}-${thangCua.nam}` },
            { ten: `Ngày ${dmy(x.iso)}`, duong: duongNgay(x.iso) }]} />
        <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mx-auto mt-10 max-w-3xl" />
      </>
    );
  }
  const t = await thangCongKhai(x.nam, x.thang);
  if (!t) throw new Error("engine lịch không phản hồi");
  const dep = t.ngay.filter((n) => n.dep);
  const duong = `/xem-ngay-tot/thang-${x.thang}-${x.nam}`, bien = { thang: String(x.thang), nam: String(x.nam) };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_THANG, nd.chu), tieuDe = c("dau.tieu_de", bien);
  return (
    <>
      <div className="mx-auto max-w-3xl space-y-5">
        <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} mo_ta={c("dau.mo_ta", bien)} />
        <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" />
        <LichThang t={t} />
        <section aria-labelledby="ngay-dep" className="glass rounded-2xl p-5" data-testid="ngay-dep-thang">
          <h2 id="ngay-dep" className="text-xl">{c("dep.tieu_de", bien)}</h2>
          <p className="mt-1 text-sm text-fg-muted">{c("dep.mo_ta", bien)}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {dep.map((n) => (
              <li key={n.ngay}><Link href={duongNgay(n.ngay)} className="block rounded-xl border border-line/70 px-3 py-2 text-sm hover:border-gold/50">
                <b>{dmy(n.ngay)}</b> <span className="text-fg-muted">({n.am} âm · {n.can_chi}) · {n.than} · trực {n.truc}</span></Link></li>
            ))}
          </ul>
        </section>
        {/* SEO-L2: ngày tốt theo việc trong tháng này */}
        <nav aria-labelledby="theo-viec" className="text-sm">
          <h2 id="theo-viec" className="text-xl">Ngày tốt theo việc tháng {x.thang}/{x.nam}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {VIEC_SEO.map((v) => <li key={v.slug}><Link href={duongViecThang(v.slug, x.nam, x.thang)} className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 py-2 text-fg-muted hover:border-gold/50 hover:text-fg">{v.ten}</Link></li>)}
          </ul>
        </nav>
        <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" />
      </div>
      <LdTrangCon duong={duong} ten={tieuDe} cuoi={{ chu: c("cuoi.chu"), link: c("cuoi.link") }}
        moTa={`Lịch tháng ${x.thang}/${x.nam}: ngày âm, hoàng đạo/hắc đạo, trực từng ngày và ${dep.length} ngày hoàng đạo có trực tốt.`}
        cap={[{ ten: `Tháng ${x.thang}/${x.nam}`, duong }]} />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mx-auto mt-10 max-w-3xl" />
    </>
  );
}

/** SEO-L2 — "Ngày tốt {việc} tháng M/YYYY": danh sách do engine lọc bằng đúng `chon_ngay` (không xét tuổi). */
async function TrangViecThang({ x }: { x: { viec: (typeof VIEC_SEO)[number]; nam: number; thang: number } }) {
  const d = await viecThangCongKhai(x.viec.ma, x.nam, x.thang);
  if (!d) throw new Error("engine lịch không phản hồi");
  const duong = duongViecThang(x.viec.slug, x.nam, x.thang);
  const viec = x.viec.ten.charAt(0).toLowerCase() + x.viec.ten.slice(1);
  const bien = { viec, thang: String(x.thang), nam: String(x.nam), thang_am: d.thang_am };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_VIEC_THANG, nd.chu), tieuDe = c("dau.tieu_de", bien);
  const truoc = x.thang === 1 ? { nam: x.nam - 1, thang: 12 } : { nam: x.nam, thang: x.thang - 1 };
  const sau = x.thang === 12 ? { nam: x.nam + 1, thang: 1 } : { nam: x.nam, thang: x.thang + 1 };
  return (
    <>
      <JsonLd data={goiLd(ldHoiDap(d.hoi_dap))} />
      <div className="mx-auto max-w-3xl space-y-5">
        <nav aria-label="Đường dẫn" className="text-sm text-fg-muted"><Link href="/xem-ngay-tot" className="hover:underline">Xem ngày tốt</Link> ›{" "}
          <Link href={duongThang(x.nam, x.thang)} className="hover:underline">Tháng {x.thang}/{x.nam}</Link></nav>
        <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
        <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" />
        <section aria-label="Trả lời nhanh" className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
          <p className="eyebrow">Trả lời nhanh</p>
          <p className="mt-2 leading-relaxed text-fg">{d.tra_loi_nhanh}</p>
        </section>
        <section aria-labelledby="ds-ngay" data-testid="ngay-tot-viec">
          <h2 id="ds-ngay" className="text-xl">{c("ds.tieu_de", bien)}</h2>
          {d.ngay.length === 0 ? <p className="mt-2 text-sm text-fg-muted">Tháng này không có ngày đủ điều kiện. Xem tháng sau bên dưới.</p> : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {d.ngay.map((n) => (
                <li key={n.ngay}><Link href={duongNgay(n.ngay)} className="block rounded-xl border border-line/70 px-3 py-2 text-sm hover:border-gold/50">
                  <b>{dmy(n.ngay)}</b> <span className="text-fg-muted">({n.am} âm · {n.can_chi}) · {n.than} · trực {n.truc}</span>
                  {n.diem_cong && n.diem_cong.length > 0 && <span className="mt-0.5 block text-xs text-jade">{n.diem_cong.join(" · ")}</span>}
                </Link></li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs leading-relaxed text-fg-faint">{d.cach_chon} Danh sách chưa xét tuổi — mở một ngày để xem tuổi xung, giờ hoàng đạo.</p>
        </section>
        <nav aria-labelledby="viec-khac" className="text-sm">
          <h2 id="viec-khac" className="text-xl">{c("viec_khac.tieu_de", bien)}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {VIEC_SEO.filter((v) => v.slug !== x.viec.slug).map((v) => <li key={v.slug}><Link href={duongViecThang(v.slug, x.nam, x.thang)} className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 py-2 text-fg-muted hover:border-gold/50 hover:text-fg">{v.ten}</Link></li>)}
          </ul>
          <p className="mt-3 flex flex-wrap gap-3">
            {truoc.nam >= 1901 && <Link href={duongViecThang(x.viec.slug, truoc.nam, truoc.thang)} className="text-gold underline">← Tháng {truoc.thang}/{truoc.nam}</Link>}
            {sau.nam <= 2099 && <Link href={duongViecThang(x.viec.slug, sau.nam, sau.thang)} className="text-gold underline">Tháng {sau.thang}/{sau.nam} →</Link>}
          </p>
        </nav>
        <section aria-labelledby="hoi-dap" className="space-y-3">
          <h2 id="hoi-dap" className="text-xl">Câu hỏi thường gặp</h2>
          <dl className="space-y-3">{d.hoi_dap.map((h) => (
            <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
          ))}</dl>
        </section>
        <p className="text-xs text-fg-faint">{d.luu_y}</p>
        <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" />
      </div>
      <LdTrangCon duong={duong} ten={tieuDe} cuoi={{ chu: c("cuoi.chu"), link: c("cuoi.link") }}
        moTa={d.tra_loi_nhanh.slice(0, 300)}
        cap={[{ ten: `Tháng ${x.thang}/${x.nam}`, duong: duongThang(x.nam, x.thang) }, { ten: x.viec.ten, duong }]} />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mx-auto mt-10 max-w-3xl" />
    </>
  );
}
