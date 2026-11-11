// Trang cụm kiến thức (vd /kinh-dich/que, /tu-vi/sao-o-cung): danh sách mọi bài, render phía server. Schema: CollectionPage +
// ItemList. QH-URL: cụm nằm dưới trang công cụ của mảng (trang trụ) — breadcrumb Trang chủ › {mảng} › {cụm}.
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHU_DE, HINH_CHU_DE, duongTrang, mucLuc, truCua } from "@/lib/kien-thuc";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { HinhMang } from "@/components/minh-hoa/TrangTri";
import { goiLd, ldDuongDan, ldThucThe, mangTheoDuong, metaTrang, siteUrl, urlDayDu } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { DuongDan } from "@/components/khung/DuongDan";
import { duongDanCum } from "@/lib/duong-dan";
import { DanhSachCum } from "@/components/kien-thuc/DanhSachCum";
import { mucLucCum } from "@/lib/nhom-cum";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { banAnh } from "@/lib/duong-en";
import { duongDanCumEn } from "@/lib/duong-dan";
import { cumEn } from "@/lib/so-trang-en";
import { ldThucTheEn, metaEn } from "@/lib/en/seo";
import { taoChu } from "@/lib/chu-trang";
import { CHU_KIEN_THUC } from "@/lib/chu/kien-thuc";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

// Chủ đề kiến thức → mảng bài CMS, suy từ trang công cụ của chủ đề (CHU_DE[x].mang) — thêm chủ đề không phải sửa ở đây.
const MANG_CONG_CU: Record<string, string> = {
  "/than-so": "than_so", "/hop-doi": "than_so", "/tu-vi": "tu_vi", "/bat-tu": "bat_tu", "/kinh-dich": "kinh_dich", "/phong-thuy": "phong_thuy",
};

// SEO-O: "Trả lời nhanh" cho trang cụm (GEO — câu AI trích đầu tiên). `{so}` = số trang của cụm (đếm từ engine).
const TRA_LOI_CUM: Record<string, string> = {
  "sao-cung": "Mỗi lá số Tử vi có 14 chính tinh rải trong 12 cung, nên có 168 trường hợp \"sao X ở cung Y\". Cụm này có {so} trang, mỗi trang nói sao đó sáng hay hãm theo từng vị trí, sao nào thường đi cùng hay chiếu tới, và đọc thành lời đời thường cho cung đó.",
  "tu-hoa": "Tứ hoá gồm Hoá Lộc, Hoá Quyền, Hoá Khoa, Hoá Kỵ, gắn vào bốn sao theo can năm sinh. Cụm này có {so} trang cho từng hoá rơi vào từng cung: ý nghĩa, năm sinh nào có, nên làm gì khi gặp.",
  "menh-tuoi": "Mệnh theo năm sinh là mệnh nạp âm của năm can chi, tính theo năm âm lịch (từ Tết). Cụm này có {so} trang, mỗi năm sinh một trang: can chi, mệnh, màu và nghề hợp theo ngũ hành, tuổi hợp, tuổi xung, cung phi nam và nữ.",
  "hop-so": "Thần số học so số chủ đạo (đường đời) của hai người: 9 số tạo 45 cặp. Cụm này có {so} trang, mỗi cặp nói chỗ hai người dễ hoà, chỗ dễ va và việc nên cùng làm — không chấm điểm hợp hay khắc.",
  "dau-hieu": "Đây là {so} dấu hiệu trong nhà mà phong thuỷ hay nhắc: cửa đối cửa, bếp đối WC, cầu thang giữa nhà, giường dưới xà… Mỗi trang nói dấu hiệu đó là gì, sách xưa và cách hiểu ngày nay nói sao, việc làm được ngay không tốn tiền.",
  "kinh-dich": "Kinh Dịch có 64 quẻ, mỗi quẻ sáu hào. Cụm này có {so} trang, mỗi quẻ một trang: tên, cấu trúc quái trên dưới, lời quẻ nguyên văn kèm cách hiểu đơn giản, lời từng hào và câu hỏi tự soi.",
  "than-so": "Thần số học Pythagoras dùng các số 1–9 và số chủ đạo 11, 22, 33. Cụm này có {so} trang, mỗi số một trang: tính cách, điểm mạnh, điểm dễ vấp, công việc, tình cảm.",
  "tu-vi": "Tử vi có 14 chính tinh. Cụm này có {so} trang, mỗi sao một trang: ngũ hành, tính chất, khi sáng và khi hãm, và ý nghĩa khi đứng ở từng cung.",
  "cung-tu-vi": "Lá số Tử vi có 12 cung, mỗi cung nói về một mảng đời: Mệnh, Phụ Mẫu, Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Tức, Phu Thê, Huynh Đệ. Cụm có {so} trang.",
};

export async function metaChuDe(khoa: string | null): Promise<Metadata> {
  const cd = khoa ? CHU_DE[khoa] : undefined;
  if (!cd) return { title: "Không tìm thấy", robots: { index: false } };
  const en = banAnh(cd.duong);
  if ((await ngonNguMayChu()).ngonNgu === "en") {
    // EN-ALL GĐ 3d: trang cụm bản Anh (rewrite) — chữ máy chủ từ lib/so-trang-en.ts (CUM_EN), không CMS.
    const ce = cumEn(cd.duong);
    if (!ce || !en) return { title: { absolute: "Page not found · Hieuban" }, robots: { index: false } };
    return metaEn({ title: ce.tieu_de_seo, description: ce.mo_ta, path: en, vi: cd.duong });
  }
  // SEO-K: metaTrang dựng đủ bộ OG + Twitter (trước đây twitter kế thừa tiêu đề trang chủ) + ảnh có hình theo mảng.
  const meta = apDungSeo(metaTrang({ tieuDe: cd.ten, moTa: cd.mo_ta, duong: cd.duong, md: `${cd.duong}.md` }), await layNoiDungTrang(cd.duong));
  // EN-ALL: cụm đã mở bản Anh → hreflang hai chiều (bản Việt là x-default).
  return en ? { ...meta, alternates: { ...meta.alternates, languages: { vi: cd.duong, en, "x-default": cd.duong } } } : meta;
}

export async function TrangChuDe({ khoa }: { khoa: string | null }) {
  const cd = khoa ? CHU_DE[khoa] : undefined;
  if (!khoa || !cd) notFound();
  if ((await ngonNguMayChu()).ngonNgu === "en") return <TrangChuDeEn khoa={khoa} cd={cd} />;
  const duong = cd.duong, tru = truCua(duong);
  const [tatCa, nd] = await Promise.all([mucLuc(), layNoiDungTrang(duong)]);
  const ds = tatCa.filter((t) => t.loai === cd.loai);
  // SEO-L3: cụm rỗng = engine chưa trả mục lục (lỗi) → 5xx thay vì trang 200 rỗng (soft-404).
  if (ds.length === 0) throw new Error("engine chưa trả mục lục kiến thức");
  const dd = duongDanCum({ ten: cd.ten, duong });
  // TM-1 (C-2): cụm dài (≥ 40 trang) có mục lục theo nhóm + lọc nhanh; cụm ngắn giữ lưới phẳng.
  const ml = mucLucCum(khoa, ds.map((t) => ({ duong: duongTrang(t.loai, t.slug), tieu_de: t.tieu_de, mo_ta: t.mo_ta })));
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        { "@type": "CollectionPage", "@id": `${urlDayDu(duong)}#trang`, name: cd.ten, description: cd.mo_ta, url: urlDayDu(duong), inLanguage: "vi-VN",
          isPartOf: { "@id": `${siteUrl()}/#website` }, publisher: { "@id": `${siteUrl()}/#to-chuc` },
          about: [ldThucThe(mangTheoDuong(duong))].filter(Boolean),
          mainEntity: { "@type": "ItemList", numberOfItems: ds.length,
            itemListElement: ds.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(duongTrang(t.loai, t.slug)), name: t.tieu_de })) } },
        ldDuongDan(dd),
      )} />
      <DuongDan ds={dd} />
      <HinhMang kieu={HINH_CHU_DE[khoa] ?? "than-so"} className="mt-4 h-20" />
      <h1 className="mt-3 text-4xl sm:text-5xl">{nd.dau.h1 ?? cd.ten}</h1>
      <LoiDanCms nd={nd} className="mt-3 max-w-2xl text-fg-muted">{cd.mo_ta}</LoiDanCms>
      {TRA_LOI_CUM[khoa] && <div className="mt-6 max-w-3xl"><TraLoiNhanh chu={TRA_LOI_CUM[khoa]!.replace("{so}", String(ds.length))} /></div>}
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mt-8" />
      {ml ? <DanhSachCum ml={ml} /> : <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {ds.map((t) => (
          <li key={t.slug}>
            <Link href={duongTrang(t.loai, t.slug)} className="glass block h-full rounded-2xl p-5 transition-colors hover:border-gold/50">
              <h2 className="text-lg leading-snug">{t.tieu_de}</h2>
              <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{t.mo_ta}</p>
            </Link>
          </li>
        ))}
      </ul>}
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-12" />
      <Suspense fallback={null}><BaiLienQuanMang mang={MANG_CONG_CU[cd.mang] ?? null} className="mt-12" tru={tru} boQua={[duong]} duong={duong} /></Suspense>
    </div>
  );
}

/** EN-ALL GĐ 3d — trang cụm bản Anh (rewrite của trang Việt): cùng khối (DuongDan, HinhMang, TraLoiNhanh, DanhSachCum) với
 *  chữ tiếng Anh; danh sách bài + tiêu đề từ mục lục bản Anh của engine, link = URL Anh (slug Anh). Không khối CMS, không
 *  "Bài viết liên quan" (blog chỉ có tiếng Việt). Lời mời cuối trang trỏ về công cụ của mảng (bản Anh). */
async function TrangChuDeEn({ khoa, cd }: { khoa: string; cd: (typeof CHU_DE)[string] }) {
  const ce = cumEn(cd.duong), duongEn = banAnh(cd.duong);
  if (!ce || !duongEn) notFound();
  const c = taoChu(CHU_KIEN_THUC, null, "en");
  const ds = (await mucLuc()).filter((t) => t.loai === cd.loai);
  if (ds.length === 0) throw new Error("engine chưa trả mục lục kiến thức");
  const lk = (t: (typeof ds)[number]) => banAnh(cd.duong, `/${t.slug_en ?? t.slug}`)!;
  const dd = duongDanCumEn(truCua(cd.duong), { ten: ce.ten, duong: duongEn });
  const ml = mucLucCum(khoa, ds.map((t) => ({ duong: lk(t), tieu_de: t.tieu_de, mo_ta: t.mo_ta })), true);
  const congCu = banAnh(cd.mang);
  const loiMoi = (CHU_KIEN_THUC as Record<string, unknown>)[`moi.${cd.loai}`] ? c(`moi.${cd.loai}`) : null;
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        { "@type": "CollectionPage", "@id": `${urlDayDu(duongEn)}#trang`, name: ce.h1, description: ce.mo_ta, url: urlDayDu(duongEn), inLanguage: "en",
          isPartOf: { "@id": `${siteUrl()}/#website` }, publisher: { "@id": `${siteUrl()}/#to-chuc` },
          about: [ldThucTheEn(mangTheoDuong(cd.duong))].filter(Boolean),
          mainEntity: { "@type": "ItemList", numberOfItems: ds.length,
            itemListElement: ds.map((t, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(lk(t)), name: t.tieu_de })) } },
        ldDuongDan(dd),
      )} />
      <DuongDan ds={dd} nhan="Breadcrumb" />
      <HinhMang kieu={HINH_CHU_DE[khoa] ?? "than-so"} className="mt-4 h-20" />
      <h1 className="mt-3 text-4xl sm:text-5xl">{ce.h1}</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">{ce.mo_ta}</p>
      <div className="mt-6 max-w-3xl"><TraLoiNhanh en chu={ce.tra_loi.replace("{so}", String(ds.length))} /></div>
      {ml ? <DanhSachCum en ml={ml} /> : <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {ds.map((t) => (
          <li key={t.slug}>
            <Link href={lk(t)} className="glass block h-full rounded-2xl p-5 transition-colors hover:border-gold/50">
              <h2 className="text-lg leading-snug">{t.tieu_de}</h2>
              <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{t.mo_ta}</p>
            </Link>
          </li>
        ))}
      </ul>}
      {congCu && (
        <aside className="glass mt-12 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center" data-nosnippet="">
          <BookOpen className="size-6 shrink-0 text-gold" aria-hidden />
          <p className="flex-1 text-fg-muted">{loiMoi ?? c("moi.chung").replace(/\*/g, "")}</p>
          <Button asChild><Link href={congCu}>{cd.mang === "/bat-tu" ? c("moi.nut_bat_tu") : c("moi.nut_chung")} <ArrowRight aria-hidden /></Link></Button>
        </aside>
      )}
    </div>
  );
}
