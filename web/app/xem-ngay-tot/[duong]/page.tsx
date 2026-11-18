// HL-1 — trang một ngày (/xem-ngay-tot/2026-10-13) hoặc một tháng (/xem-ngay-tot/thang-10-2026).
// Ngày ngoài cửa sổ hữu ích (7 ngày trước → NGAY_SAU = 90 ngày tới) vẫn xem được nhưng noindex; tháng index trong ±2 năm.
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { HoiDapHien, TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { LichThang, XemNgayTot } from "@/components/hoang-lich/XemNgayTot";
import { LichAmNam } from "@/components/lich-am/LichAmNam";
import { KyMonTheoNgay } from "@/components/ky-mon/KyMonTheoNgay";
import { lichNgayChoNgay } from "@/lib/lich-am";
import { homNayVN } from "@/lib/hoang-lich";
import { VIEC_SEO, docDuong, duongNgay, duongThang, duongViecThang, ngayDangIndex, ngayTotCongKhai, thangCongKhai, thangIndex, viecThangCongKhai, viecThangIndex } from "@/lib/hoang-lich";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { taoChu } from "@/lib/chu-trang";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { CHU_NGAY, CHU_THANG, CHU_VIEC_THANG } from "@/lib/chu/trang-con";
import { permanentRedirect } from "next/navigation";
import { GOC_EN, docDuongEn, duoiEn, type NgayTot, type ThangLich, type ViecThang } from "@/lib/hoang-lich";
import { chuLichMayChu, voiHreflang } from "@/lib/en/lich";
import { ldDuongDanEn, metaEn, tieuDeVua } from "@/lib/en/seo";
import { urlDayDu } from "@/lib/seo";
import { dinhNgay } from "@/lib/dinh-dang";

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

async function metaGoc({ params }: P): Promise<Metadata> {
  const { en } = await chuLichMayChu();
  if (en) return metaEnTrang((await params).duong);
  const x = docDuong((await params).duong);
  if (!x) return {};
  // EN-ALL GĐ 8: hreflang tới trang Anh tương đương (đuôi Anh khác đuôi Việt).
  const hl = (m: Metadata, duong: string) => voiHreflang(m, duong, `${GOC_EN}/${duoiEn(x)}`);
  if (x.loai === "viec") {
    // SEO-L2: "Ngày tốt cưới hỏi tháng 12 năm 2026" — cùng cửa sổ index với trang tháng.
    const ten = x.viec.ten.charAt(0).toLowerCase() + x.viec.ten.slice(1);
    const m = metaTrang({ tieuDe: `Ngày tốt ${ten} tháng ${x.thang}/${x.nam} theo hoàng lịch`,
      moTa: `Các ngày tốt ${ten} tháng ${x.thang} năm ${x.nam}: ngày âm, can chi, hoàng đạo, trực — chọn theo mục nên/kiêng của sách lịch, kèm ngày đẹp nhất trong tháng.`,
      duong: duongViecThang(x.viec.slug, x.nam, x.thang), anh: anhBai({ tieuDe: `Ngày tốt ${ten} tháng ${x.thang}/${x.nam}`, mang: "lich" }) });
    // AUD-Q3: số ngày tốt lấy từ cùng dữ liệu trang (cache fetch dùng chung); engine lỗi → null → chỉ xét cửa sổ tháng.
    const d = viecThangIndex(x.nam, x.thang, null) ? await viecThangCongKhai(x.viec.ma, x.nam, x.thang) : null;
    const mh = hl(m, duongViecThang(x.viec.slug, x.nam, x.thang));
    return viecThangIndex(x.nam, x.thang, d ? d.so_ngay : null) ? mh : { ...mh, robots: { index: false, follow: true } };
  }
  if (x.loai === "ngay") {
    const m = metaTrang({ tieuDe: `Ngày ${dmy(x.iso)} tốt hay xấu? Hoàng đạo, giờ tốt, việc nên làm`,
      moTa: `Xem ngày ${dmy(x.iso)}: âm lịch, can chi, hoàng đạo hay hắc đạo, trực, giờ hoàng đạo, việc nên làm và nên kiêng, tuổi xung, hướng xuất hành.`,
      duong: duongNgay(x.iso) });
    const mh = hl(m, duongNgay(x.iso));
    return ngayDangIndex(x.iso) ? mh : { ...mh, robots: { index: false, follow: true } };
  }
  const m = metaTrang({ tieuDe: `Lịch ngày tốt tháng ${x.thang}/${x.nam}: ngày hoàng đạo, ngày đẹp`,
    moTa: `Lịch tháng ${x.thang} năm ${x.nam} có ngày âm, ngày hoàng đạo/hắc đạo, trực từng ngày; tìm ngày đẹp cưới hỏi, khai trương, về nhà mới, động thổ trong tháng.`,
    duong: `/xem-ngay-tot/${(await params).duong}` });
  const mh = hl(m, `/xem-ngay-tot/${(await params).duong}`);
  return thangIndex(x.nam, x.thang) ? mh : { ...mh, robots: { index: false, follow: true } };
}

/** Lối sang tháng dương trước / sau (lịch cũ có sẵn ở đầu lưới; lịch năm âm đi theo tháng âm nên giữ riêng hàng này).
 *  Ngoài cửa sổ index: vẫn bấm được nhưng nofollow; hết phạm vi 1901–2099 thì ẩn. */
function ThangKe({ nam, thang }: { nam: number; thang: number }) {
  const truoc = thang === 1 ? { nam: nam - 1, thang: 12 } : { nam, thang: thang - 1 };
  const sau = thang === 12 ? { nam: nam + 1, thang: 1 } : { nam, thang: thang + 1 };
  const rel = (n: { nam: number; thang: number }) => (thangIndex(n.nam, n.thang) ? undefined : "nofollow");
  return (
    <nav aria-label="Tháng dương lịch" className="flex items-center justify-between gap-2 text-sm" data-testid="thang-ke">
      {truoc.nam >= 1901 ? <Link href={duongThang(truoc.nam, truoc.thang)} rel={rel(truoc)} aria-label="Tháng trước"
        className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-fg-muted hover:border-gold/50 hover:text-gold">‹ Tháng {truoc.thang}/{truoc.nam}</Link> : <span />}
      {sau.nam <= 2099 ? <Link href={duongThang(sau.nam, sau.thang)} rel={rel(sau)} aria-label="Tháng sau"
        className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-fg-muted hover:border-gold/50 hover:text-gold">Tháng {sau.thang}/{sau.nam} ›</Link> : <span />}
    </nav>
  );
}

export default async function Page({ params }: P) {
  if ((await chuLichMayChu()).en) return <TrangEn duoi={(await params).duong} />;
  const x = docDuong((await params).duong);
  if (!x) notFound();
  if (x.loai === "viec") return <TrangViecThang x={x} />;
  if (x.loai === "ngay") {
    const [d, t, lichAm] = await Promise.all([ngayTotCongKhai(x.iso), thangCongKhai(Number(x.iso.slice(0, 4)), Number(x.iso.slice(5, 7))),
      lichNgayChoNgay(x.iso)]);
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
          <div className="mb-5"><TraLoiNhanh chu={d.tra_loi_nhanh} /></div>
          <XemNgayTot banDau={d} thang={t} lichAm={lichAm} />
          <KyMonTheoNgay ngay={x.iso} nhan={dmy(x.iso)} />
        </div>
        {/* SEO-O: ảnh tóm tắt ngày (alt cùng nguồn với chữ trong ảnh). */}
        <AnhTomTat kieu="ngay" ngay={x.iso} />
        <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mx-auto mt-10 max-w-3xl" />
        <LdTrangCon duong={duong} ten={tieuDe} cuoi={{ chu: c("cuoi.chu"), link: c("cuoi.link") }}
          moTa={`${d.thu}, âm lịch ${d.am.chu}, ngày ${d.can_chi.ngay}: ${d.hoang_dao ? "hoàng đạo" : "hắc đạo"} (${d.than.ten}), trực ${d.truc.ten}.`}
          cap={[{ ten: `Tháng ${thangCua.thang}/${thangCua.nam}`, duong: `/xem-ngay-tot/thang-${thangCua.thang}-${thangCua.nam}` },
            { ten: `Ngày ${dmy(x.iso)}`, duong: duongNgay(x.iso) }]} />
        <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mx-auto mt-10 max-w-3xl" />
      </>
    );
  }
  // LA-UI: lịch năm âm mở sẵn ở hôm nay (nếu thuộc tháng này) hoặc ngày 15 — tháng âm phủ phần lớn tháng dương đang xem.
  const homNay = homNayVN(), mm = String(x.thang).padStart(2, "0");
  const moSan = homNay.startsWith(`${x.nam}-${mm}-`) ? homNay : `${x.nam}-${mm}-15`;
  const [t, lichAm] = await Promise.all([thangCongKhai(x.nam, x.thang), lichNgayChoNgay(moSan)]);
  if (!t) throw new Error("engine lịch không phản hồi");
  const dep = t.ngay.filter((n) => n.dep);
  const duong = `/xem-ngay-tot/thang-${x.thang}-${x.nam}`, bien = { thang: String(x.thang), nam: String(x.nam) };
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_THANG, nd.chu), tieuDe = c("dau.tieu_de", bien);
  return (
    <>
      <div className="mx-auto max-w-3xl space-y-5">
        <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} mo_ta={c("dau.mo_ta", bien)} />
        <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" />
        <TraLoiNhanh chu={t.tra_loi_nhanh} />
        {lichAm ? (
          <>
            <ThangKe nam={x.nam} thang={x.thang} />
            <LichAmNam d={lichAm} homNay={homNay} chon={moSan} lienKet />
          </>
        ) : <LichThang t={t} />}
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
          {t.theo_viec?.length ? (
            // SEO-M: số ngày tốt + ngày đẹp nhất từng việc (engine dùng đúng chon_ngay như trang việc).
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {t.theo_viec.map((v) => (
                <li key={v.slug}><Link href={duongViecThang(v.slug, x.nam, x.thang)} className="block rounded-xl border border-line/70 px-3 py-2 hover:border-gold/50">
                  <b className="text-fg">{v.viec.ten}</b> <span className="text-fg-muted">· {v.so_ngay} ngày tốt{v.dep_nhat ? ` · đẹp nhất ${dmy(v.dep_nhat.ngay)}` : ""}</span></Link></li>
              ))}
            </ul>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {VIEC_SEO.map((v) => <li key={v.slug}><Link href={duongViecThang(v.slug, x.nam, x.thang)} className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 py-2 text-fg-muted hover:border-gold/50 hover:text-fg">{v.ten}</Link></li>)}
            </ul>
          )}
        </nav>
        <HoiDapHien ds={t.hoi_dap} />
        {t.hoi_dap?.length ? <JsonLd data={goiLd(ldHoiDap(t.hoi_dap))} /> : null}
        <AnhTomTat kieu="thang" nam={x.nam} thang={x.thang} className="mt-4" />
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
                  <span className={`ml-1 inline-flex rounded-full px-2 text-xs ${n.hoang_dao ? "bg-gold/15 text-gold" : "border border-moon/50 text-moon"}`}
                    data-testid="nhan-dao">{n.hoang_dao ? "Hoàng đạo" : "Hắc đạo"}</span>
                  {n.diem_cong && n.diem_cong.filter((x) => x !== "hoàng đạo").length > 0 &&
                    <span className="mt-0.5 block text-xs text-jade">{n.diem_cong.filter((x) => x !== "hoàng đạo").join(" · ")}</span>}
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

// ND-7 đợt 2: ảnh chia sẻ của cụm (CMS → Mẫu cụm trang → "Hình trên trang") thay ảnh /og tự vẽ khi có.
export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));

// ------------------------------------------------------------------------------------------------- EN-ALL GĐ 8 — bản Anh
// /en/auspicious-dates/{2026-11-16 | 2026-11 | weddings-2026-11} (rewrite của trang này). Cùng component (TheNgay,
// XemNgayTot, LichThang), chữ từ lib/chu/lich.ts; đuôi Việt gõ ở bản Anh → 308 về đuôi Anh. Không khối CMS, không ảnh tóm tắt
// (ảnh vẽ chữ Việt), JSON-LD tiếng Anh.

/** Đuôi URL bản Anh → kết quả; đuôi Việt hợp lệ → 308 sang đuôi Anh; sai → 404. */
function docEn(duoi: string) {
  const x = docDuongEn(duoi);
  if (x) return x;
  const v = docDuong(duoi);
  if (v) permanentRedirect(`${GOC_EN}/${duoiEn(v)}`);
  notFound();
}

const VIEC_EN = (ma: string, c: Awaited<ReturnType<typeof chuLichMayChu>>["c"]) => c(`viec.ten.${ma}`);

async function metaEnTrang(duoi: string): Promise<Metadata> {
  const x = docDuongEn(duoi);
  if (!x) return {};
  const { c, ma } = await chuLichMayChu();
  const tn = (y: number, m: number) => dinhNgay({ nam: y, thang: m, ngay: 1 }, ma, "thang_nam");
  const path = `${GOC_EN}/${duoiEn(x)}`;
  if (x.loai === "ngay") {
    const ngay = dinhNgay(x.iso, ma, "dai");
    return metaEn({ title: tieuDeVua([`${c("con.ngay_seo", { ngay })} · Hieuban`, c("con.ngay_seo", { ngay }), `${c("con.ngay_h1", { ngay })} · Hieuban`]), description: c("con.ngay_mo_ta", { ngay }), path, vi: duongNgay(x.iso),
      noindex: !ngayDangIndex(x.iso) });
  }
  if (x.loai === "thang") {
    return metaEn({ title: tieuDeVua([`${c("con.thang_seo", { thang_nam: tn(x.nam, x.thang) })} · Hieuban`, `${c("con.thang_h1", { thang_nam: tn(x.nam, x.thang) })} · Hieuban`]), description: c("con.thang_seo_mo_ta", { thang_nam: tn(x.nam, x.thang) }),
      path, vi: duongThang(x.nam, x.thang), noindex: !thangIndex(x.nam, x.thang) });
  }
  const viec = VIEC_EN(x.viec.ma, c).toLowerCase();
  const d = viecThangIndex(x.nam, x.thang, null) ? await viecThangCongKhai(x.viec.ma, x.nam, x.thang) : null;
  return metaEn({ title: tieuDeVua([`${c("con.viec_seo", { viec, thang_nam: tn(x.nam, x.thang) })} · Hieuban`,
    `${c("con.viec_h1", { viec, thang_nam: tn(x.nam, x.thang) })} · Hieuban`, c("con.viec_h1", { viec, thang_nam: tn(x.nam, x.thang) })]),
    description: c("con.viec_seo_mo_ta", { viec, thang_nam: tn(x.nam, x.thang) }), path, vi: duongViecThang(x.viec.slug, x.nam, x.thang),
    noindex: !viecThangIndex(x.nam, x.thang, d ? d.so_ngay : null) });
}

function LdEn({ duong, ten, moTa, cap }: { duong: string; ten: string; moTa: string; cap: { ten: string; duong: string }[] }) {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", "@id": `${urlDayDu(duong)}#trang`, url: urlDayDu(duong), name: ten,
        description: moTa, inLanguage: "en", about: [{ "@type": "Thing", name: "Chinese almanac" }, { "@type": "Thing", name: "Auspicious dates" }] }} />
      <JsonLd data={ldDuongDanEn(cap)} />
    </>
  );
}

function CuoiEn({ c }: { c: Awaited<ReturnType<typeof chuLichMayChu>>["c"] }) {
  return (
    <p className="mx-auto mt-10 max-w-3xl border-t border-line/50 pt-6 text-sm text-fg-muted">
      {c("con.cuoi_chu")} <Link href={GOC_EN} className="text-gold underline">{c("con.cuoi_link")}</Link>.
    </p>
  );
}

function DuongDanEn({ cap, nhan }: { cap: { ten: string; duong: string }[]; nhan: string }) {
  return (
    <nav aria-label={nhan} className="mb-2 text-sm text-fg-muted">
      {cap.map((x, i) => <span key={x.duong}>{i > 0 && " › "}<Link href={x.duong} className="hover:underline">{x.ten}</Link></span>)}
    </nav>
  );
}

async function TrangEn({ duoi }: { duoi: string }) {
  const x = docEn(duoi);
  const { c, ma } = await chuLichMayChu();
  const tn = (y: number, m: number) => dinhNgay({ nam: y, thang: m, ngay: 1 }, ma, "thang_nam");
  const goc = { ten: c("con.goc"), duong: GOC_EN };
  if (x.loai === "ngay") {
    const [d, t] = await Promise.all([ngayTotCongKhai(x.iso), thangCongKhai(Number(x.iso.slice(0, 4)), Number(x.iso.slice(5, 7)))]) as [NgayTot | null, ThangLich | null];
    if (!d) throw new Error("engine lịch không phản hồi");
    const y = Number(x.iso.slice(0, 4)), m = Number(x.iso.slice(5, 7)), ngay = dinhNgay(x.iso, ma, "dai");
    const tieuDe = c("con.ngay_h1", { ngay });
    const cap = [goc, { ten: tn(y, m), duong: duongThang(y, m, true) }];
    return (
      <>
        <div className="mx-auto max-w-3xl">
          <DuongDanEn cap={cap} nhan={c("con.duong_dan")} />
          <TieuDeMuc cap={1} nho={c("con.ngay_nhan")} lon={tieuDe} />
          <div className="mb-5"><TraLoiNhanh chu={d.tra_loi_nhanh} en /></div>
          <XemNgayTot banDau={d} thang={t} />
        </div>
        <LdEn duong={duongNgay(x.iso, true)} ten={tieuDe} cap={[...cap, { ten: ngay, duong: duongNgay(x.iso, true) }]}
          moTa={c("con.ngay_ld", { thu: d.thu, am: d.am.chu, can_chi: d.can_chi.ngay, dao: d.hoang_dao ? c("the.hoang_dao_ngan") : c("the.hac_dao_ngan"), than: d.than.ten, truc: d.truc.ten })} />
        <CuoiEn c={c} />
      </>
    );
  }
  if (x.loai === "thang") {
    const t = await thangCongKhai(x.nam, x.thang);
    if (!t) throw new Error("engine lịch không phản hồi");
    const dep = t.ngay.filter((n) => n.dep), thangNam = tn(x.nam, x.thang), tieuDe = c("con.thang_h1", { thang_nam: thangNam });
    const duong = duongThang(x.nam, x.thang, true);
    return (
      <>
        <div className="mx-auto max-w-3xl space-y-5">
          <DuongDanEn cap={[goc]} nhan={c("con.duong_dan")} />
          <TieuDeMuc cap={1} nho={c("con.thang_nhan")} lon={tieuDe} mo_ta={c("con.thang_mo_ta")} />
          <TraLoiNhanh chu={t.tra_loi_nhanh} en />
          <LichThang t={t} />
          <section aria-labelledby="ngay-dep" className="glass rounded-2xl p-5" data-testid="ngay-dep-thang">
            <h2 id="ngay-dep" className="text-xl">{c("con.dep_tieu_de")}</h2>
            <p className="mt-1 text-sm text-fg-muted">{c("con.dep_mo_ta")}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {dep.map((n) => (
                <li key={n.ngay}><Link href={duongNgay(n.ngay, true)} className="block rounded-xl border border-line/70 px-3 py-2 text-sm hover:border-gold/50">
                  <b>{dinhNgay(n.ngay, ma, "dai")}</b> <span className="text-fg-muted">{c("con.dong_ngay", { am: n.am, can_chi: n.can_chi, than: n.than, truc: n.truc })}</span></Link></li>
              ))}
            </ul>
          </section>
          <nav aria-labelledby="theo-viec" className="text-sm">
            <h2 id="theo-viec" className="text-xl">{c("con.theo_viec", { thang_nam: thangNam })}</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {VIEC_SEO.map((v) => {
                const tv = t.theo_viec?.find((z) => z.slug === v.slug);
                return (
                  <li key={v.slug}><Link href={duongViecThang(v.slug, x.nam, x.thang, true)} className="block rounded-xl border border-line/70 px-3 py-2 hover:border-gold/50">
                    <b className="text-fg">{tv?.viec.ten ?? VIEC_EN(v.ma, c)}</b>
                    {tv && <span className="text-fg-muted">{c("con.so_ngay_tot", { so: String(tv.so_ngay), dep: tv.dep_nhat ? c("con.dep_nhat", { ngay: dinhNgay(tv.dep_nhat.ngay, ma, "ngay_thang") }) : "" })}</span>}</Link></li>
                );
              })}
            </ul>
          </nav>
          {t.hoi_dap?.length ? <HoiDapEn ds={t.hoi_dap} tieuDe={c("con.hoi_dap")} /> : null}
          {t.hoi_dap?.length ? <JsonLd data={goiLd(ldHoiDap(t.hoi_dap))} /> : null}
        </div>
        <LdEn duong={duong} ten={tieuDe} moTa={c("con.thang_ld", { thang_nam: thangNam, so: String(dep.length) })} cap={[goc, { ten: thangNam, duong }]} />
        <CuoiEn c={c} />
      </>
    );
  }
  const d = await viecThangCongKhai(x.viec.ma, x.nam, x.thang) as ViecThang | null;
  if (!d) throw new Error("engine lịch không phản hồi");
  const duong = duongViecThang(x.viec.slug, x.nam, x.thang, true), thangNam = tn(x.nam, x.thang);
  const tieuDe = d.tieu_de || c("con.viec_h1", { viec: VIEC_EN(x.viec.ma, c).toLowerCase(), thang_nam: thangNam });
  const truoc = x.thang === 1 ? { nam: x.nam - 1, thang: 12 } : { nam: x.nam, thang: x.thang - 1 };
  const sau = x.thang === 12 ? { nam: x.nam + 1, thang: 1 } : { nam: x.nam, thang: x.thang + 1 };
  const cap = [goc, { ten: thangNam, duong: duongThang(x.nam, x.thang, true) }];
  const hd = (z: string) => /^yellow path/i.test(z);
  return (
    <>
      <JsonLd data={goiLd(ldHoiDap(d.hoi_dap))} />
      <div className="mx-auto max-w-3xl space-y-5">
        <DuongDanEn cap={cap} nhan={c("con.duong_dan")} />
        <TieuDeMuc cap={1} nho={c("con.viec_nhan", { thang_am: d.thang_am })} lon={tieuDe} />
        <TraLoiNhanh chu={d.tra_loi_nhanh} en />
        <section aria-labelledby="ds-ngay" data-testid="ngay-tot-viec">
          <h2 id="ds-ngay" className="text-xl">{c("con.ds_tieu_de")}</h2>
          {d.ngay.length === 0 ? <p className="mt-2 text-sm text-fg-muted">{c("con.ds_khong")}</p> : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {d.ngay.map((n) => (
                <li key={n.ngay}><Link href={duongNgay(n.ngay, true)} className="block rounded-xl border border-line/70 px-3 py-2 text-sm hover:border-gold/50">
                  <b>{dinhNgay(n.ngay, ma, "dai")}</b> <span className="text-fg-muted">{c("con.dong_ngay", { am: n.am, can_chi: n.can_chi, than: n.than, truc: n.truc })}</span>
                  <span className={`ml-1 inline-flex rounded-full px-2 text-xs ${n.hoang_dao ? "bg-gold/15 text-gold" : "border border-moon/50 text-moon"}`}
                    data-testid="nhan-dao">{n.hoang_dao ? c("the.hoang_dao_ngan") : c("the.hac_dao_ngan")}</span>
                  {n.diem_cong && n.diem_cong.filter((z) => !hd(z)).length > 0 &&
                    <span className="mt-0.5 block text-xs text-jade">{n.diem_cong.filter((z) => !hd(z)).join(" · ")}</span>}
                </Link></li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs leading-relaxed text-fg-faint">{d.cach_chon}{c("con.ds_ghi")}</p>
        </section>
        <nav aria-labelledby="viec-khac" className="text-sm">
          <h2 id="viec-khac" className="text-xl">{c("con.viec_khac", { thang_nam: thangNam })}</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {VIEC_SEO.filter((v) => v.slug !== x.viec.slug).map((v) => <li key={v.slug}><Link href={duongViecThang(v.slug, x.nam, x.thang, true)} className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 py-2 text-fg-muted hover:border-gold/50 hover:text-fg">{VIEC_EN(v.ma, c)}</Link></li>)}
          </ul>
          <p className="mt-3 flex flex-wrap gap-3">
            {truoc.nam >= 1901 && <Link href={duongViecThang(x.viec.slug, truoc.nam, truoc.thang, true)} className="text-gold underline">← {tn(truoc.nam, truoc.thang)}</Link>}
            {sau.nam <= 2099 && <Link href={duongViecThang(x.viec.slug, sau.nam, sau.thang, true)} className="text-gold underline">{tn(sau.nam, sau.thang)} →</Link>}
          </p>
        </nav>
        <HoiDapEn ds={d.hoi_dap} tieuDe={c("con.hoi_dap")} />
        <p className="text-xs text-fg-faint">{d.luu_y}</p>
      </div>
      <LdEn duong={duong} ten={tieuDe} moTa={d.tra_loi_nhanh.slice(0, 300)} cap={[...cap, { ten: VIEC_EN(x.viec.ma, c), duong }]} />
      <CuoiEn c={c} />
    </>
  );
}

function HoiDapEn({ ds, tieuDe }: { ds: { hoi: string; dap: string }[]; tieuDe: string }) {
  if (!ds.length) return null;
  return (
    <section aria-labelledby="hoi-dap" className="space-y-3">
      <h2 id="hoi-dap" className="text-xl">{tieuDe}</h2>
      <dl className="space-y-3">{ds.map((h) => (
        <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
      ))}</dl>
    </section>
  );
}
