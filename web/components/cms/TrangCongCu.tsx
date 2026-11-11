// ND-2 — khung chung của trang công cụ: đọc "Trang website" của URL (CMS > mặc định trong lib/so-trang.ts) rồi đặt
// đầu trang (H1, lời dẫn, khối phía trên — qua DauCms vào trong công cụ), khối phía dưới, bài viết liên quan, phần
// "Về công cụ…" (giới thiệu + hỏi đáp → FAQPage), khối cuối trang. CMS trống / chưa nối → HTML như trước ND-2.
import { Suspense, type ReactNode } from "react";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { DauCms } from "@/components/cms/DauCms";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { CumKienThucTru } from "@/components/kien-thuc/CumKienThucTru";
import { GioiThieuCongCu } from "@/components/seo/GioiThieuCongCu";
import { locChu, taoChu } from "@/lib/chu-trang";
import { TEN_MANG_SILO, dsCumTru } from "@/lib/kien-thuc";
import { gioiThieuTu, layDauNhieuTrang, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { mucSoTrang } from "@/lib/so-trang";
import { soCanLap, theLap } from "@/lib/the-lap";
import { DuongDan } from "@/components/khung/DuongDan";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan } from "@/lib/seo";
import { duongDanCongCu } from "@/lib/duong-dan";
import { thanhCua } from "@/lib/thanh-mang";
import { boLap } from "@/lib/the-lap-cms";
import { namTuoiSeo } from "@/lib/nam";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { trangCongCuEn } from "@/lib/so-trang-en";
import { banAnh } from "@/lib/duong-en";
import { ldDuongDanEn } from "@/lib/en/seo";
import Link from "@/components/khung/Lien";
import { ArrowRight } from "lucide-react";

export async function TrangCongCu({ duong, mang, truoc, sau, children }: {
  /** Mảng cho "Bài viết liên quan" (không có → không hiện khối này). */ duong: string; mang?: string; truoc?: ReactNode; sau?: ReactNode; children: ReactNode;
}) {
  // EN-ALL GĐ 3d: URL Anh được proxy rewrite về trang Việt này (`x-ngon-ngu: en`) → khung bản Anh: không CMS (chưa có
  // localization — GĐ 10), không bài viết (blog tiếng Việt), chữ từ lib/so-trang-en.ts + bảng chữ của URL (chiều `en`).
  if ((await ngonNguMayChu()).ngonNgu === "en") return <TrangCongCuEn duong={duong} truoc={truoc} sau={sau}>{children}</TrangCongCuEn>;
  const [nd, dauCum, lapCms] = await Promise.all([layNoiDungTrang(duong), layDauNhieuTrang(dsCumTru(duong).map((x) => x.duong)), boLap()]);
  const lapTuyChon = { ...lapCms, uuTien: nd.loiDiTiep };
  // CTA-2: link đã hiện ở khối "Kiến thức {mảng}" (cụm + thẻ bù của nó) → khối bài viết bên dưới không bù lặp lại.
  const cum = dsCumTru(duong).map((x) => x.duong);
  const daHien = [duong, ...cum, ...theLap(soCanLap(cum.length), { ...lapTuyChon, tru: duong, boQua: [duong, ...cum] }).map((t) => t.duong)];
  // ND-7: bảng chữ của URL + chữ CMS đã lọc → công cụ (client) đọc qua DauCms/useChu; phần dưới đọc ngay ở đây.
  const bang = mucSoTrang(duong)?.mac_dinh.chu ?? {}, c = taoChu(bang, nd.chu);
  // TM-1: trang thuộc 6 mảng có breadcrumb thật (Trang chủ › Huyền học › {mảng}); thanh mảng nằm ở layout.
  const ten = nd.ten ?? mucSoTrang(duong)?.ten ?? "";
  // SEO-N: "Trả lời nhanh" dưới H1; `{nam}` trong link = năm trang theo tuổi đang index (chỉ gọi khi cần).
  const tl = mucSoTrang(duong)?.mac_dinh.tra_loi_nhanh ?? null;
  const namTl = tl?.lien_ket?.some((l) => l.href.includes("{nam}") || l.ten.includes("{nam}")) ? String(await namTuoiSeo()) : "";
  const traLoi = tl ? { ...tl, lien_ket: tl.lien_ket?.map((l) => ({ href: l.href.replaceAll("{nam}", namTl), ten: l.ten.replaceAll("{nam}", namTl) })) } : null;
  return (
    <>
      {/* Một nguồn: dải hiển thị và BreadcrumbList JSON-LD cùng mảng (GioiThieuCongCu bỏ breadcrumb cho 6 trụ). */}
      {thanhCua(duong) && ten && <>
        <JsonLd data={goiLd(ldDuongDan(duongDanCongCu(duong, ten)))} />
        <DuongDan ds={duongDanCongCu(duong, ten)} className="-mt-2 mb-5 md:-mt-4" />
      </>}
      {truoc}
      <DauCms h1={nd.dau.h1} loiDan={nd.dau.loiDan} kieuChu={nd.dau.kieuChu} bang={bang} chu={locChu(bang, nd.chu)} traLoi={traLoi}
        khoiTren={nd.khoi.tren.length ? <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" /> : null}>
        {children}
      </DauCms>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mx-auto mt-12 max-w-5xl" />
      {/* QH-URL: trang công cụ là trang trụ của silo → trỏ xuống các cụm kiến thức của mảng. */}
      <CumKienThucTru tru={duong} className="mt-12" tieuDe={c("kien_thuc.tieu_de", { mang: TEN_MANG_SILO[duong] ?? "" }) || undefined} dau={dauCum} lapTuyChon={lapTuyChon} />
      {mang && <Suspense fallback={null}><BaiLienQuanMang mang={mang} className="mt-12"
        tru={dsCumTru(duong).length ? duong : undefined} boQua={daHien} duong={duong} /></Suspense>}
      {nd.gioiThieu.doan.length > 0 && <GioiThieuCongCu {...gioiThieuTu(nd)}
        nhan={{ tieuDe: c("gioi_thieu.tieu_de", { ten: nd.ten ?? "" }), hoiDap: c("gioi_thieu.hoi_dap"), docThem: c("gioi_thieu.doc_them") }} />}
      {sau}
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mx-auto mt-12 max-w-5xl" />
    </>
  );
}

/** Bản Anh của khung trang công cụ: breadcrumb (Hieuban › {công cụ}), đầu trang (DauCms đọc bảng chữ chiều `en`), "Learn …"
 *  (chỉ cụm kiến thức đã mở bản Anh), "About this tool" + FAQPage tiếng Anh. Không đọc CMS. */
async function TrangCongCuEn({ duong, truoc, sau, children }: { duong: string; truoc?: ReactNode; sau?: ReactNode; children: ReactNode }) {
  const t = trangCongCuEn(duong);
  const bang = mucSoTrang(duong)?.mac_dinh.chu ?? {};
  const duongEn = banAnh(duong) ?? duong;
  const cum = t?.kien_thuc ? dsCumTru(duong).flatMap((c) => {
    const en = banAnh(c.duong), chu = t.kien_thuc!.cum[c.duong];
    return en && chu ? [{ duong: en, ...chu }] : [];
  }) : [];
  const traLoi = t ? { hoi: t.tra_loi_nhanh.hoi, dap: t.tra_loi_nhanh.dap,
    lien_ket: (t.tra_loi_nhanh.lien_ket ?? []).filter((l) => l.href.startsWith("/en")) } : null;
  return (
    <>
      {t && <>
        <JsonLd data={ldDuongDanEn([{ ten: t.ten, duong: duongEn }])} />
        <DuongDan nhan="Breadcrumb" ds={[{ ten: "Hieuban", duong: "/en" }, { ten: t.ten, duong: duongEn }]} className="-mt-2 mb-5 md:-mt-4" />
      </>}
      {truoc}
      <DauCms bang={bang} chu={{}} traLoi={traLoi}>{children}</DauCms>
      {cum.length > 0 && (
        <nav aria-labelledby="kien-thuc-tru" className="mx-auto mt-12 max-w-5xl" data-testid="cum-kien-thuc-tru">
          <h2 id="kien-thuc-tru" className="text-2xl">{t!.kien_thuc!.tieu_de}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cum.map((c) => (
              <li key={c.duong}>
                <Link href={c.duong} className="glass group flex h-full flex-col rounded-2xl p-4 transition-colors hover:border-gold/50">
                  <span className="flex items-center justify-between gap-2 font-serif text-lg">{c.ten}
                    <ArrowRight className="size-4 shrink-0 text-gold/70 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                  <span className="mt-1 line-clamp-2 text-sm text-fg-muted">{c.mo_ta}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {t && <GioiThieuCongCu en duong={duongEn} ten={t.ten} moTa={t.mo_ta_seo} doan={t.gioi_thieu.doan} hoiDap={t.gioi_thieu.hoi_dap}
        lienKet={(t.gioi_thieu.doc_them?.lien_ket ?? []).filter((l) => l.href.startsWith("/en"))}
        nhan={{ tieuDe: t.gioi_thieu.tieu_de, hoiDap: t.gioi_thieu.hoi_dap_tieu_de, docThem: t.gioi_thieu.doc_them?.tieu_de }} />}
      {sau}
    </>
  );
}
