// Trang kiến thức (dùng chung cho mọi route cụm của các mảng) — Server Component: HTML đầy đủ ngay lần tải đầu (Google, Bing, và bot AI đọc được không cần JS).
// Cấu trúc GEO: tiêu đề = câu hỏi người ta tìm · đoạn "trả lời nhanh" đứng đầu · mục có tiêu đề · hỏi đáp · nguồn ·
// ngày cập nhật · nhãn đã thẩm định (BM-1: bài chưa duyệt không gắn nhãn) · liên kết nội bộ. Schema: Article + FAQPage + BreadcrumbList.
// EEAT-1: dòng tác giả / chủ biên / thẩm định + Person; trang đã thẩm định có WebPage.reviewedBy + lastReviewed.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { MinhHoa } from "@/components/minh-hoa/MinhHoa";
import { DongTacGia } from "@/components/kien-thuc/DongTacGia";
import { GocNhinChuyenGia } from "@/components/kien-thuc/GocNhinChuyenGia";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { CHUYEN_GIA, idChuyenGia, ldNguoi } from "@/lib/chuyen-gia";
import { CHU_DE, CHU_DE_THEO_LOAI, TEN_MANG_SILO, duongTrang, trang, truCua, slugEnCua, slugViCua, type LoaiTrang, type TrangKienThuc } from "@/lib/kien-thuc";
import { anhBai, catMoTa, goiLd, ldAnh, ldDuongDan, ldHoiDap, ldThucThe, mangTheoDuong, siteUrl, TEN_SITE, tieuDeSeo, urlDayDu } from "@/lib/seo";
import { duongMoi } from "@/lib/duong-silo";
import { idTu } from "@/lib/cms-html";
import { DuongDan } from "@/components/khung/DuongDan";
import { duongDanCum, duongDanCumEn } from "@/lib/duong-dan";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { banAnh, duongTheo } from "@/lib/duong-en";
import { anhOgEn, ldThucTheEn, metaEn, tieuDeVua } from "@/lib/en/seo";
import { cumEn, trangCongCuEn } from "@/lib/so-trang-en";
import { tenTheo } from "@/lib/ten-hien";
import { taoChu, tachNhan, type DocChu } from "@/lib/chu-trang";
import { CHU_KIEN_THUC } from "@/lib/chu/kien-thuc";
import { dinhNgay } from "@/lib/dinh-dang";

type Thamso = { khoa: string | null; slug: string };

/** SEO-K: ảnh đại diện có hình theo mảng; số/quẻ lấy đúng dữ liệu minh hoạ engine trả (vòng số, 6 hào). */
function anhKienThuc(t: TrangKienThuc, duongCum: string) {
  const mh = t.minh_hoa;
  return anhBai({
    tieuDe: t.tieu_de, mang: mangTheoDuong(duongCum),
    ...(mh?.kieu === "so" ? { so: mh.so } : mh?.kieu === "cap_so" ? { so: `${mh.a}` } : {}),
    ...(mh?.kieu === "que" ? { hao: mh.hao } : {}),
  });
}

/** SEO-M: ảnh infographic dọc của trang (route /og/y-chinh vẽ từ `y_chinh`). */
const anhYChinh = (t: TrangKienThuc) => `/og/y-chinh?loai=${t.loai}&slug=${encodeURIComponent(t.slug)}&v=${t.cap_nhat}`;

async function tai({ khoa, slug }: Thamso) {
  const cd = khoa ? CHU_DE[khoa] : undefined;
  if (!cd) return null;
  const t = await trang(cd.loai, slug);
  return t ? { cd, t } : null;
}

/** ND-7 đợt 2: ảnh chia sẻ của cụm (CMS) thay ảnh /og tự vẽ khi có. */
export async function metaKienThuc(params: Thamso): Promise<Metadata> {
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaKienThucEn(params);
  return voiAnhChiaSe(await metaGoc(params));
}

/** EN-ALL GĐ 3d — metadata trang kiến thức bản Anh (rewrite của trang Việt, engine trả chữ Anh + `slug_en`): canonical = URL
 *  Anh (slug Anh), hreflang về trang Việt CÙNG mục; title ≤ 70, description ≤ 160; ảnh /og chữ Anh. Không CMS. */
async function metaKienThucEn(params: Thamso): Promise<Metadata> {
  const kq = await tai(params);
  const en = kq ? banAnh(kq.cd.duong, `/${kq.t.slug_en ?? kq.t.slug}`) : null;
  if (!kq || !en) return { title: { absolute: "Page not found · Hieuban" }, robots: { index: false } };
  const { t } = kq;
  return metaEn({ title: tieuDeVua([`${t.tieu_de} · Hieuban`, t.tieu_de]), description: t.mo_ta, path: en,
    vi: duongTrang(t.loai, t.slug), noindex: !t.index, ngayDang: t.ngay_dang, capNhat: t.cap_nhat });
}

async function metaGoc(params: Thamso): Promise<Metadata> {
  const kq = await tai(params);
  if (!kq) return { title: "Không tìm thấy", robots: { index: false } };
  const { t, cd } = kq;
  const duong = duongTrang(t.loai, t.slug);
  const anh = anhKienThuc(t, cd.duong);
  // EN-ALL GĐ 3d: cụm đã mở bản Anh → hreflang tới trang Anh CÙNG mục (slug Anh từ mục lục bản Anh của engine).
  const banEn = t.ban_en ?? (banAnh(cd.duong) ? await slugEnCua(t.loai, t.slug).then((s) => (s ? banAnh(cd.duong, `/${s}`) ?? undefined : undefined)) : undefined);
  return {
    title: tieuDeSeo(t.tieu_de),
    description: catMoTa(t.mo_ta),
    // QTE: trang có bản tiếng Anh tương đương (engine trả `ban_en`) → hreflang hai chiều, bản Việt là x-default.
    alternates: { canonical: duong, types: { "text/markdown": `${duong}.md` }, ...(banEn ? { languages: { vi: duong, en: banEn, "x-default": duong } } : {}) },
    robots: { index: t.index, follow: true },
    openGraph: {
      type: "article", title: t.tieu_de, description: t.mo_ta, url: duong, locale: "vi_VN", siteName: TEN_SITE,
      ...(t.ngay_dang ? { publishedTime: t.ngay_dang } : {}), modifiedTime: t.cap_nhat, images: [{ url: anh, width: 1200, height: 630, alt: t.tieu_de }],
    },
    twitter: { card: "summary_large_image", title: t.tieu_de, description: t.mo_ta, images: [anh] },
  };
}

/** Trang kiến thức một mục KB (QH-URL: /{mảng}/{cụm}/{trang}); route của từng mảng chỉ đổi đường dẫn → khoá chủ đề. */
/** Lời mời cuối trang theo loại trang — câu hỏi người đọc chỉ trả lời được bằng dữ liệu của chính mình. */
// SEO-N: chữ nút mời theo trang dịch vụ đích.
const NUT_CONG_CU: Record<string, string> = {
  "/tu-vi": "Lập lá số Tử vi của tôi", "/bat-tu": "Lập lá số Bát tự của tôi", "/than-so": "Tính thần số học của tôi",
  "/hop-doi": "Xem hợp đôi của tôi", "/kinh-dich": "Gieo quẻ Kinh Dịch", "/phong-thuy": "Xem phong thuỷ nhà tôi",
  "/nhan-tuong": "Xem tướng mặt của tôi", "/tarot": "Rút bài Tarot của tôi",
};
const LOI_MOI: Partial<Record<string, string>> = {
  sao_cung: "Trên lá số của bạn, sao này nằm ở cung nào, sáng hay hãm, năm nào được hoá? Nhập ngày giờ sinh để xem — có từng bước an sao.",
  sao: "Trên lá số của bạn, sao này nằm ở cung nào, sáng hay hãm? Nhập ngày giờ sinh để xem — có từng bước an sao.",
  cung: "Cung này trên lá số của bạn có những sao nào, mười năm nào đi qua? Nhập ngày giờ sinh để xem.",
  hoa_cung: "Năm sinh của bạn cho sao nào hoá Lộc, Quyền, Khoa, Kỵ, rơi vào cung nào? Nhập ngày giờ sinh để xem.",
  que: "Gieo một quẻ cho đúng việc bạn đang băn khoăn — sáu hào, hào động, quẻ biến tính sẵn, có lời đời thường.",
  so: "Số chủ đạo, linh hồn, sứ mệnh, năm cá nhân của chính bạn là bao nhiêu? Nhập tên và ngày sinh — có từng bước cộng.",
  so_kep: "Tên và ngày sinh của bạn ra số kép nào theo bảng Chaldea? Nhập để xem từng bước cộng.",
  nghe: "Số chủ đạo của bạn là bao nhiêu, hợp kiểu việc nào? Nhập tên và ngày sinh — có từng bước cộng.",
  tinh_yeu: "Số chủ đạo của bạn là bao nhiêu, yêu theo kiểu nào? Nhập tên và ngày sinh — có từng bước cộng.",
  nam_ca_nhan: "Năm nay bạn đang ở năm cá nhân số mấy, tháng này số mấy? Nhập ngày sinh để biết.",
  no_nghiep: "Ngày sinh và tên của bạn có mang nợ nghiệp 13, 14, 16, 19 không, nằm ở chỉ số nào? Nhập để xem từng bước.",
  cap_so: "Hai người cụ thể hợp ở đâu, dễ va ở đâu, nên cùng làm gì? Nhập ngày sinh của hai người.",
  thap_than: "Tứ trụ của bạn có những thập thần nào, đậm hay nhạt? Nhập ngày giờ sinh để lập tứ trụ.",
  nhat_chu: "Nhật chủ của bạn là can nào, thân mạnh hay yếu? Nhập ngày giờ sinh để lập tứ trụ.",
  menh_nam: "Ngoài mệnh theo năm sinh, ngũ hành trong tứ trụ của bạn thiếu đủ thế nào? Nhập ngày giờ sinh để xem.",
  dau_hieu: "Nhà bạn có dấu hiệu này không, nên xử lý gì trước, việc nào không tốn tiền? Khảo sát nhà miễn phí.",
  co_thu: "Câu phú nào ứng với lá số của bạn — sao nào ở Mệnh, cách cục nào thành? Nhập ngày giờ sinh để xem, có từng bước an sao.",
};

export async function TrangKienThucView(params: Thamso) {
  const nn = await ngonNguMayChu(), en = nn.ngonNgu === "en";
  const kq = await tai(params);
  if (!kq) {
    // EN-ALL: nút / link đổi ngôn ngữ không chạy JS có thể mở URL Việt với slug Anh → 308 về slug Việt (chỉ cụm đã mở bản Anh).
    const cd = params.khoa ? CHU_DE[params.khoa] : undefined;
    const vi = !en && cd && banAnh(cd.duong) ? await slugViCua(cd.loai, params.slug) : null;
    if (vi && cd) permanentRedirect(duongTrang(cd.loai, vi));
    notFound();
  }
  const { cd, t } = kq;
  // EN-ALL GĐ 3d: trang Anh = rewrite của trang này (`x-ngon-ngu: en`); URL Anh mang slug Anh do engine sinh. Cụm chưa mở
  // bản Anh → 404; URL Anh mang slug Việt → 308 về slug Anh (một URL cho một trang).
  const duongEn = en ? banAnh(cd.duong, `/${t.slug_en ?? t.slug}`) : null;
  if (en && !duongEn) notFound();
  if (en && t.slug_en && params.slug !== t.slug_en) permanentRedirect(duongEn!);
  if (en) return <TrangKienThucEn cd={cd} t={t} duong={duongEn!} ma={nn.ma} />;
  const duong = duongTrang(t.loai, t.slug);
  // ND-5: khối CMS của mẫu cụm (+ ghi đè riêng URL này) — đặt quanh văn KB, không xen vào giữa.
  const nd = await layNoiDungTrang(duong, { tieu_de: t.tieu_de, mo_ta: t.mo_ta, ten_chu_de: cd.ten });
  const nhap = t.trang_thai !== "da_duyet";
  const tacGia = [t.tac_gia, t.tham_dinh?.nguoi].find((x) => x && CHUYEN_GIA[x]);

  const dd = duongDanCum({ ten: cd.ten, duong: cd.duong }, { ten: t.tieu_de, duong });
  const c = taoChu(CHU_KIEN_THUC);
  const ld = goiLd(
    {
      "@type": "Article",
      "@id": `${urlDayDu(duong)}#bai`,
      headline: t.tieu_de,
      description: t.mo_ta,
      inLanguage: "vi-VN",
      datePublished: t.ngay_dang ?? t.cap_nhat,   // SEO-L4: ngày thật theo sổ băm nội dung
      dateModified: t.cap_nhat,
      mainEntityOfPage: { "@id": `${urlDayDu(duong)}#trang` },
      image: t.y_chinh?.length
        ? [ldAnh(anhKienThuc(t, cd.duong), t.tieu_de), { ...ldAnh(anhYChinh(t), c("bai.anh_dai_dien", { tieu_de: t.tieu_de })), width: 1080, height: 1350 }]
        : ldAnh(anhKienThuc(t, cd.duong), t.tieu_de),
      // Tác giả là người khi chuyên gia tự viết hoặc đã đọc, sửa, duyệt bài; bài chưa thẩm định ghi tác giả là ban biên tập.
      author: tacGia
        ? { "@id": idChuyenGia(tacGia) }
        : { "@type": "Organization", name: `Ban biên tập ${TEN_SITE}`, url: siteUrl() },
      ...(CHUYEN_GIA[t.chu_bien] ? { editor: { "@id": idChuyenGia(t.chu_bien) } } : {}),
      publisher: { "@id": `${siteUrl()}/#to-chuc` },
      isAccessibleForFree: true,
      isPartOf: { "@id": `${siteUrl()}/#website` },
      about: [ldThucThe(mangTheoDuong(cd.duong)), { "@type": "Thing", name: cd.ten }].filter(Boolean),
      keywords: [t.tieu_de.split(":")[0], cd.ten, TEN_MANG_SILO[truCua(cd.duong)]].filter(Boolean).join(", "),
      citation: t.nguon,
      ...(nhap ? {} : { creativeWorkStatus: "Published" }),
      abstract: t.tra_loi_nhanh,
    },
    {
      "@type": "WebPage",
      "@id": `${urlDayDu(duong)}#trang`,
      url: urlDayDu(duong),
      name: t.tieu_de,
      inLanguage: "vi-VN",
      isPartOf: { "@id": `${siteUrl()}/#website` },
      primaryImageOfPage: ldAnh(anhKienThuc(t, cd.duong), t.tieu_de),
      ...(t.tham_dinh && CHUYEN_GIA[t.tham_dinh.nguoi]
        ? { reviewedBy: { "@id": idChuyenGia(t.tham_dinh.nguoi) }, lastReviewed: t.tham_dinh.ngay } : {}),
    },
    ...[...new Set([t.chu_bien, t.tac_gia, t.tham_dinh?.nguoi])].map((x) => (x ? CHUYEN_GIA[x] : undefined))
      .filter((cg) => cg !== undefined).map(ldNguoi),
    ldHoiDap(t.hoi_dap),
    ldDuongDan(dd),
  );
  const idMuc = idCacMuc(t.muc);

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={ld} />
      <DuongDan ds={dd} />

      <header className="mt-4">
        <h1 className="text-3xl leading-tight sm:text-5xl">{t.tieu_de}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
          <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />
            {t.ngay_dang && t.ngay_dang !== t.cap_nhat && <>{`${c("bai.dang")} `}<time dateTime={t.ngay_dang}>{t.ngay_dang.split("-").reverse().join("/")}</time> · </>}
            {`${c("bai.cap_nhat")} `}<time dateTime={t.cap_nhat}>{t.cap_nhat.split("-").reverse().join("/")}</time></span>
          {!nhap && <span className="inline-flex items-center gap-1 rounded-full border border-jade/40 px-2.5 py-0.5 text-jade"><ShieldCheck className="size-3.5" aria-hidden /> {t.tac_gia ? c("bai.chuyen_gia_bien_soan") : c("bai.da_tham_dinh")}</span>}
        </div>
        <DongTacGia chu_bien={t.chu_bien} tac_gia={t.tac_gia} tham_dinh={t.tham_dinh} duyet_xuat_ban={t.duyet_xuat_ban} />
      </header>

      {/* AUD-1 (2026-11): "Trả lời nhanh" đứng ngay dưới tiêu đề — trước hình + dải QR — để máy tìm kiếm / AI gặp câu
          trả lời trong ~50 chữ đầu thay vì sau ~110–150 chữ chú thích hình. */}
      <TraLoiDau chu={t.tra_loi_nhanh} c={c} />
      <MinhHoa mh={t.minh_hoa} duong={duong} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mt-6" />


      {t.goc_nhin && <GocNhinChuyenGia goc_nhin={t.goc_nhin} loai={t.loai} />}

      <CacMuc muc={t.muc} idMuc={idMuc} c={c} lk={lkVi} />

      {[["trang-con", t.trang_con], ["trang-con-hoa", t.trang_con_hoa]].map(([id, nhom]) => {
        const n = nhom as TrangKienThuc["trang_con"];
        if (!n || n.ds.length === 0) return null;
        return (
          <nav key={id as string} className="mt-10" aria-labelledby={id as string}>
            <h2 id={id as string} className="text-2xl">{n.tieu_de}</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {n.ds.map((l) => (
                <li key={l.slug}><Link href={duongTrang(l.loai, l.slug)} className="glass flex items-center justify-between rounded-xl px-4 py-3 text-sm text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">{l.tieu_de}<ArrowRight className="size-4 shrink-0 text-gold/70" aria-hidden /></Link></li>
              ))}
            </ul>
          </nav>
        );
      })}

      {t.y_chinh && t.y_chinh.length > 0 && (
        // SEO-M: ảnh tóm tắt (infographic dọc, có QR + đường dẫn trang + hieuban.com) — vẽ từ ý chính engine trả.
        <figure className="mt-10">
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh do chính site vẽ, đã đúng cỡ */}
          <img src={anhYChinh(t)} width={1080} height={1350} loading="lazy" decoding="async"
            alt={`Tóm tắt: ${t.tieu_de} — ${t.y_chinh.join("; ")}`} className="mx-auto h-auto w-full max-w-sm rounded-2xl border border-line/60" />
          <figcaption className="mt-2 text-center text-xs text-fg-faint">{t.tac_gia ? "Ban biên tập tóm tắt · " : ""}Ảnh tóm tắt có mã QR về trang này ·{" "}
            <a href={anhYChinh(t)} download className="text-gold underline">Tải ảnh</a></figcaption>
        </figure>
      )}

      <HoiDapBai hd={t.hoi_dap} c={c} />

      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-10" />
      {/* Rà soát 2026-11-03: lời mời nói rõ người đọc sẽ nhận được gì, theo đúng loại trang; data-nosnippet để đoạn trích /
          câu AI trích không dính lời mời. */}
      <aside className="glass mt-10 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center" data-nosnippet="">
        <BookOpen className="size-6 shrink-0 text-gold" aria-hidden />
        <p className="flex-1 text-fg-muted">{LOI_MOI[t.loai] ?? <LoiMoiChung c={c} />}</p>
        {/* SEO-N: chữ liên kết nói rõ công cụ (≈ 600 trang kiến thức trỏ về trang dịch vụ bằng đúng từ khoá của nó). */}
        <Button asChild><Link href={cd.mang}>{NUT_CONG_CU[cd.mang] ?? c("moi.nut_chung")} <ArrowRight aria-hidden /></Link></Button>
      </aside>

      {(t.lien_quan.length > 0 || (t.lien_ket_ngoai?.length ?? 0) > 0) && (
        <nav className="mt-10" aria-labelledby="lien-quan">
          <h2 id="lien-quan" className="text-xl">{c("bai.doc_tiep")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {t.lien_quan.map((l) => (
              <li key={l.slug}><Link href={duongTrang(l.loai, l.slug)} className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">{l.tieu_de}</Link></li>
            ))}
            {t.lien_ket_ngoai?.map((l) => (
              <li key={l.duong}><Link href={duongMoi(l.duong)} className="inline-flex min-h-10 items-center rounded-full border border-gold/40 px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-gold hover:text-fg">{l.ten}</Link></li>
            ))}
          </ul>
        </nav>
      )}

      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
      <footer className="mt-10 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        <p className="font-medium text-fg-muted">{c("bai.nguon")}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">{t.nguon.map((n) => <li key={n}>{n}</li>)}</ul>
        <p className="mt-3">{c("bai.mien_tru")}</p>
      </footer>
    </article>
  );
}

/** EN-ALL GĐ 3d — trang kiến thức bản Anh. Cùng khối hiển thị với bản Việt (TraLoiDau, MinhHoa, CacMuc, HoiDapBai, chữ từ
 *  bảng lib/chu/kien-thuc.ts chiều `en`); chữ bài do engine trả tiếng Anh. Khác bản Việt: không khối CMS (chưa có CMS tiếng
 *  Anh), không "Góc nhìn chuyên gia" (lời chính chuyên gia viết bằng tiếng Việt — không dịch thay), không ảnh tóm tắt dọc
 *  (/og/y-chinh chỉ vẽ chữ Việt), dòng tác giả ghi ban biên tập (EEAT-1 / BM-1); mọi link nội bộ là URL Anh đã mở, link tới
 *  trang chưa có bản Anh thì ẩn. JSON-LD: Article + WebPage + FAQPage + BreadcrumbList tiếng Anh. */
async function TrangKienThucEn({ cd, t, duong, ma }: { cd: (typeof CHU_DE)[string]; t: TrangKienThuc; duong: string; ma: string }) {
  const c = taoChu(CHU_KIEN_THUC, null, "en");
  const ten = tenTheo(t.ten_hien, true);
  const cum = cumEn(cd.duong), duongCum = banAnh(cd.duong)!, mang = mangTheoDuong(cd.duong);
  const tenCum = cum?.ten ?? cd.ten;
  const dd = duongDanCumEn(truCua(cd.duong), { ten: tenCum, duong: duongCum }, { ten: t.tieu_de, duong });
  const anh = anhOgEn(t.tieu_de);
  const tenCongCu = trangCongCuEn(cd.mang)?.ten;
  const ld = goiLd(
    {
      "@type": "Article",
      "@id": `${urlDayDu(duong)}#bai`,
      headline: t.tieu_de,
      description: t.mo_ta,
      inLanguage: "en",
      datePublished: t.ngay_dang ?? t.cap_nhat,
      dateModified: t.cap_nhat,
      mainEntityOfPage: { "@id": `${urlDayDu(duong)}#trang` },
      image: ldAnh(anh, t.tieu_de),
      // Bản Anh do ban biên tập chuyển thể — tác giả là tổ chức, không ghi chuyên gia (EEAT-1).
      author: { "@type": "Organization", name: "Hieuban editorial team", url: urlDayDu("/en") },
      publisher: { "@id": `${siteUrl()}/#to-chuc` },
      isAccessibleForFree: true,
      isPartOf: { "@id": `${siteUrl()}/#website` },
      about: [ldThucTheEn(mang), { "@type": "Thing", name: tenCum }].filter(Boolean),
      keywords: [t.tieu_de.split(":")[0], tenCum, tenCongCu].filter(Boolean).join(", "),
      citation: t.nguon,
      abstract: t.tra_loi_nhanh,
      translationOfWork: { "@id": `${urlDayDu(duongTrang(t.loai, t.slug))}#bai` },
    },
    {
      "@type": "WebPage",
      "@id": `${urlDayDu(duong)}#trang`,
      url: urlDayDu(duong),
      name: t.tieu_de,
      inLanguage: "en",
      isPartOf: { "@id": `${siteUrl()}/#website` },
      primaryImageOfPage: ldAnh(anh, t.tieu_de),
    },
    ldHoiDap(t.hoi_dap),
    ldDuongDan(dd),
  );
  const idMuc = idCacMuc(t.muc);
  const lienQuan = t.lien_quan.flatMap((l) => { const h = lkEn(l); return h ? [{ ...l, h }] : []; });
  const ngoai = (t.lien_ket_ngoai ?? []).flatMap((l) => { const h = duongTheo("en", duongMoi(l.duong)); return h.startsWith("/en") ? [{ ...l, h }] : []; });
  const nhom = [["trang-con", t.trang_con], ["trang-con-hoa", t.trang_con_hoa]] as const;
  const loiMoi = (CHU_KIEN_THUC as Record<string, unknown>)[`moi.${t.loai}`] ? c(`moi.${t.loai}`) : null;
  const congCu = banAnh(cd.mang);
  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={ld} />
      <DuongDan ds={dd} nhan="Breadcrumb" />

      <header className="mt-4">
        <h1 className="text-3xl leading-tight sm:text-5xl">{t.tieu_de}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
          <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />
            {t.ngay_dang && t.ngay_dang !== t.cap_nhat && <>{`${c("bai.dang")} `}<time dateTime={t.ngay_dang}>{dinhNgay(t.ngay_dang, ma)}</time> · </>}
            {`${c("bai.cap_nhat")} `}<time dateTime={t.cap_nhat}>{dinhNgay(t.cap_nhat, ma)}</time></span>
        </div>
        <DongTacGia en chu_bien={t.chu_bien} tac_gia={t.tac_gia} tham_dinh={t.tham_dinh} duyet_xuat_ban={t.duyet_xuat_ban} />
      </header>

      <TraLoiDau chu={t.tra_loi_nhanh} c={c} />
      <MinhHoa mh={t.minh_hoa} duong={duong} en ten={ten} />

      <CacMuc muc={t.muc} idMuc={idMuc} c={c} lk={lkEn} />

      {nhom.map(([id, n]) => {
        const ds = (n?.ds ?? []).flatMap((l) => { const h = lkEn(l); return h ? [{ ...l, h }] : []; });
        if (!n || ds.length === 0) return null;
        return (
          <nav key={id} className="mt-10" aria-labelledby={id}>
            <h2 id={id} className="text-2xl">{n.tieu_de}</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {ds.map((l) => (
                <li key={l.slug}><Link href={l.h} className="glass flex items-center justify-between rounded-xl px-4 py-3 text-sm text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">{l.tieu_de}<ArrowRight className="size-4 shrink-0 text-gold/70" aria-hidden /></Link></li>
              ))}
            </ul>
          </nav>
        );
      })}

      <HoiDapBai hd={t.hoi_dap} c={c} />

      {congCu && (
        <aside className="glass mt-10 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center" data-nosnippet="">
          <BookOpen className="size-6 shrink-0 text-gold" aria-hidden />
          <p className="flex-1 text-fg-muted">{loiMoi ?? <LoiMoiChung c={c} />}</p>
          <Button asChild><Link href={congCu}>{cd.mang === "/bat-tu" ? c("moi.nut_bat_tu") : c("moi.nut_chung")} <ArrowRight aria-hidden /></Link></Button>
        </aside>
      )}

      {(lienQuan.length > 0 || ngoai.length > 0) && (
        <nav className="mt-10" aria-labelledby="lien-quan">
          <h2 id="lien-quan" className="text-xl">{c("bai.doc_tiep")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {lienQuan.map((l) => (
              <li key={l.slug}><Link href={l.h} className="inline-flex min-h-10 items-center rounded-full border border-line px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">{l.tieu_de}</Link></li>
            ))}
            <li><Link href={duongCum} className="inline-flex min-h-10 items-center rounded-full border border-gold/40 px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-gold hover:text-fg">{tenCum}</Link></li>
            {ngoai.map((l) => (
              <li key={l.h}><Link href={l.h} className="inline-flex min-h-10 items-center rounded-full border border-gold/40 px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-gold hover:text-fg">{l.ten}</Link></li>
            ))}
          </ul>
        </nav>
      )}

      <footer className="mt-10 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        <p className="font-medium text-fg-muted">{c("bai.nguon")}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">{t.nguon.map((n) => <li key={n}>{n}</li>)}</ul>
        <p className="mt-3">{c("bai.mien_tru")}</p>
      </footer>
    </article>
  );
}

type Chu = DocChu<typeof CHU_KIEN_THUC>;
type LienKb = { loai: LoaiTrang; slug: string; slug_en?: string };
/** Link tới trang kiến thức khác: bản Việt = URL Việt; bản Anh = URL Anh (slug Anh) hoặc null khi cụm chưa mở bản Anh (ẩn link). */
type DungLink = (l: LienKb) => string | null;
const lkVi: DungLink = (l) => duongTrang(l.loai, l.slug);
const lkEn: DungLink = (l) => banAnh(CHU_DE[CHU_DE_THEO_LOAI[l.loai]]!.duong, `/${l.slug_en ?? l.slug}`);

/** Neo mục: id từ tiêu đề (dùng chung bản Việt + Anh). */
function idCacMuc(muc: TrangKienThuc["muc"]): string[] {
  // Bỏ dấu từ tiêu đề; trùng (hoặc trùng neo sẵn có của trang) thì thêm hậu tố số.
  const daDung = new Set(["hoi-dap", "lien-quan", "trang-con", "trang-con-hoa"]);
  return muc.map((m) => {
    const goc = idTu(m.tieu_de);
    let id = goc;
    for (let n = 2; daDung.has(id); n++) id = `${goc}-${n}`;
    daDung.add(id);
    return id;
  });
}

/** "Trả lời nhanh" ngay dưới tiêu đề (AUD-1) — dùng chung bản Việt + Anh. */
function TraLoiDau({ chu, c }: { chu: string; c: Chu }) {
  return (
    <section aria-label={c("tln.nhan")} className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
      <p className="eyebrow">{c("tln.nhan")}</p>
      <p className="mt-2 text-lg leading-relaxed text-fg">{chu}</p>
    </section>
  );
}

/** Lời mời mặc định cuối bài: `*đoạn*` trong bảng chữ = chữ đậm (như bản cũ `<b>chính bạn</b>`). */
function LoiMoiChung({ c }: { c: Chu }) {
  return <>{tachNhan(c("moi.chung")).map((p, i) => (p.nhan ? <b key={i} className="text-fg">{p.chu}</b> : p.chu))}</>;
}

/** Các mục của bài (dùng chung bản Việt + Anh; chữ cố định theo bảng `c`). */
function CacMuc({ muc, idMuc, c, lk }: { muc: TrangKienThuc["muc"]; idMuc: string[]; c: Chu; lk: DungLink }) {
  return (
    <div className="mt-8 space-y-8">
      {muc.map((m, i) => (
        // SEO-M: mục nói sức khoẻ (luôn kèm "không thay lời bác sĩ") → data-nosnippet, AI Overviews không cắt câu ra ngoài ngữ cảnh.
        <section key={m.tieu_de} {...(/bác sĩ|[Dd]octor/.test(`${m.doan ?? ""} ${(m.danh_sach ?? []).join(" ")}`) ? { "data-nosnippet": "" } : {})}>
          {/* Neo ổn định cho từng mục: người đọc và trợ lý AI dẫn link thẳng tới đoạn (#ten-muc). */}
          {m.gap ? (
            // TV-YBS: mục phụ ("Góc nhìn khác") — gập sẵn, chữ vẫn nằm trong HTML máy chủ (bot đọc được).
            <details className="group rounded-2xl border border-line/70 px-4 py-3" data-testid="muc-gap">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <span>
                  <h2 id={idMuc[i]} className="scroll-mt-24 text-xl">{m.tieu_de}</h2>
                  <span className="mt-1 block text-sm text-fg-faint">{c("bai.muc_gap")}</span>
                </span>
                <ChevronDown className="mt-1.5 size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <ThanMuc m={m} c={c} lk={lk} />
            </details>
          ) : (
            <>
              <h2 id={idMuc[i]} className="scroll-mt-24 text-2xl">{m.tieu_de}</h2>
              <ThanMuc m={m} c={c} lk={lk} />
            </>
          )}
        </section>
      ))}
    </div>
  );
}

/** Hỏi đáp cuối bài (dùng chung bản Việt + Anh). */
function HoiDapBai({ hd, c }: { hd: TrangKienThuc["hoi_dap"]; c: Chu }) {
  return (
    <section className="mt-10" aria-labelledby="hoi-dap">
      <h2 id="hoi-dap" className="text-2xl">{c("bai.hoi_dap")}</h2>
      {/* EEAT-1: trên trang chuyên gia tự viết, câu hỏi do ban biên tập bổ sung tách nhóm riêng có ghi chú. */}
      {[hd.filter((h) => !h.bien_tap), hd.filter((h) => h.bien_tap)].map((ds, n) => ds.length > 0 && (
        <div key={n} {...(n ? { "data-testid": "hoi-dap-bien-tap" } : {})}>
          {n === 1 && <p className="mt-6 text-xs text-fg-faint">{c("bai.bien_tap")}</p>}
          <dl className="mt-4 space-y-4">
            {ds.map((h) => (
              <div key={h.hoi} className="rounded-xl border border-line/70 p-4">
                <dt className="font-medium text-fg">{h.hoi}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}

/** Thân một mục (dùng chung cho mục thường và mục gập "Góc nhìn khác"). */
function ThanMuc({ m, c, lk }: { m: TrangKienThuc["muc"][number]; c: Chu; lk: DungLink }) {
  return (
    <>
      {m.bien_tap && <p className="mt-1 text-xs text-fg-faint">{c("bai.bien_tap")}</p>}
      {m.doan && <p className="mt-2 leading-relaxed text-fg-muted">{m.doan}</p>}
      {m.bang && (
        // SEO-M: bảng thật (caption + th) — trợ lý AI và Google đọc được dạng lưới.
        <div className="mt-3 overflow-x-auto rounded-xl border border-line/70">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <caption className="sr-only">{m.tieu_de}</caption>
            <thead><tr>{m.bang.cot.map((c) => <th key={c} scope="col" className="border-b border-line/70 bg-white/5 px-3 py-2 font-medium text-fg">{c}</th>)}</tr></thead>
            <tbody>{m.bang.dong.map((d, j) => (
              <tr key={j} className="border-b border-line/40 last:border-0">{d.map((o, k) => k === 0
                ? <th key={k} scope="row" className="px-3 py-2 align-top font-medium text-fg">{o}</th>
                : <td key={k} className="px-3 py-2 align-top text-fg-muted">{o}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {m.trich_dan && (
        <div className="mt-3 space-y-3">
          {m.trich_dan.map((x) => (
            <blockquote key={`${x.sach}${x.chuong ?? ""}${x.nghia ?? ""}`} {...(x.neo ? { id: x.neo } : {})}
              className="scroll-mt-24 border-l-2 border-gold/50 pl-4">
              {x.nguyen_van && <p className="font-serif text-lg text-fg" lang="zh-Hant">{x.nguyen_van}</p>}
              {x.phien_am && <p className="text-sm italic text-fg-muted">{x.phien_am}</p>}
              {x.nghia && <p className="mt-1 leading-relaxed text-fg-muted">{x.nghia}</p>}
              {/* TV-CTP: điều kiện trên lá số bằng lời thường + chú thích chữ của bản chép. */}
              {x.khi && <p className="mt-1 text-sm text-fg-muted"><span className="text-gold">Câu này nói về lá số khi</span> {x.khi}.</p>}
              {x.chu_thich && <p className="mt-1 text-xs text-fg-faint">Chú thích: {x.chu_thich}</p>}
              <footer className="mt-1 text-xs text-fg-faint">— <cite>{x.sach}</cite>{x.chuong ? `, ${x.chuong}` : ""}</footer>
            </blockquote>
          ))}
        </div>
      )}
      {m.danh_sach && (
        <ul className="mt-3 space-y-2">
          {m.danh_sach.map((d) => <li key={d} className="flex gap-2 leading-relaxed text-fg-muted"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold/70" aria-hidden />{d}</li>)}
        </ul>
      )}
      {m.xem_them && m.xem_them.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {m.xem_them.flatMap((x) => { const h = lk(x); return h ? [{ ...x, h }] : []; }).map((x) => (
            <li key={x.slug}><Link href={x.h} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-gold/40 px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-gold hover:text-fg">{x.tieu_de}<ArrowRight className="size-3.5 text-gold/70" aria-hidden /></Link></li>
          ))}
        </ul>
      )}
    </>
  );
}
