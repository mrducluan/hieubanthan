// Khung trang /blog và /blog/trang/{n} — mục lục bài blog: bài của ban biên tập (CMS) + bài trao đổi SEO từ NotFair, gộp bằng gopBaiBlog
// (bài CMS thắng khi trùng slug; mọi link giữ dạng /blog/{slug}). Chip chuyên mục dẫn tới /blog/chuyen-muc/{slug}.
// SEO-K: phân trang 24 bài/trang — trang 1 ở /blog, trang sau ở /blog/trang/{n}.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { ChipChuyenMuc, chuyenMucCoBai, DanhSachGon, LuoiBai, LuoiChuDe, ThanhMangBlog } from "@/components/blog/LuoiBai";
import { nhomTheoMang } from "@/lib/blog-mang";
import { PhanTrang } from "@/components/blog/PhanTrang";
import { dsBaiTongHop, duongBlog } from "@/lib/blog";
import { goiLd, ldDuongDan, metaTrang, siteUrl, urlDayDu } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { layNoiDungTrang } from "@/lib/noi-dung-trang";
import { catTrang, duongTrangSo, soTrang } from "@/lib/phan-trang";

const MO_TA = "Bài viết về hiểu bản thân, thần số học, Tử vi, Kinh Dịch, Bát tự, phong thuỷ và đời sống — đọc thêm ngoài thư viện kiến thức.";
const TIEU_DE = "Blog thần số học, Tử vi, phong thuỷ, Kinh Dịch";
const META = metaTrang({ tieuDe: TIEU_DE, moTa: MO_TA, duong: "/blog" });
export const META_BLOG: Metadata = { ...META, alternates: { ...META.alternates, types: { "application/rss+xml": "/blog/rss.xml" } } };

export const DUONG_BLOG = "/blog";
const DUONG = DUONG_BLOG;

/** Metadata trang n ≥ 2: canonical tự trỏ, tiêu đề có "trang n" để không trùng title trang 1. */
export function metaTrangBlog(n: number): Metadata {
  const m = metaTrang({ tieuDe: `${TIEU_DE} — trang ${n}`, moTa: `${MO_TA} Trang ${n}.`, duong: duongTrangSo(DUONG, n) });
  return { ...m, alternates: { ...m.alternates, types: { "application/rss+xml": "/blog/rss.xml" } } };
}

export async function TrangBlog({ n }: { n: number }) {
  const [tatCa, nd] = await Promise.all([dsBaiTongHop(), layNoiDungTrang(DUONG)]);
  const tong = soTrang(tatCa.length);
  if (n > tong) notFound();
  const ds = catTrang(tatCa, n);
  const duong = duongTrangSo(DUONG, n);
  // Trang 1: 7 bài mới nhất (1 nổi bật + 6) → "Đọc theo chủ đề" (mỗi mảng ≤ 3 tiêu đề mới nhất — mục lục theo môn, có thể
  // trùng bài phía trên) → danh sách gọn những bài của trang chưa có link nào phía trên.
  const nhom = nhomTheoMang(tatCa);
  const dau = ds.slice(0, 7);
  const ke = nhom.map((g) => ({ mang: g.mang, tong: g.bai.length, bai: g.bai.slice(0, 3) }));
  const daHien = new Set([...dau, ...ke.flatMap((k) => k.bai)].map((b) => b.slug));
  const con = ds.filter((b) => !daHien.has(b.slug));
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        {
          "@type": "Blog", "@id": `${urlDayDu("/blog")}#blog`, name: TIEU_DE, description: MO_TA, url: urlDayDu("/blog"), inLanguage: "vi-VN",
          publisher: { "@id": `${siteUrl()}/#to-chuc` }, isPartOf: { "@id": `${siteUrl()}/#website` },
          blogPost: ds.map((p) => ({ "@type": "BlogPosting", headline: p.tieuDe, url: urlDayDu(duongBlog(p.slug)), ...(p.anh ? { image: p.anh.src } : {}), ...(p.ngay ? { datePublished: p.ngay } : {}) })),
        },
        ...(n > 1 ? [{ "@type": "CollectionPage", "@id": `${urlDayDu(duong)}#trang`, url: urlDayDu(duong), name: `${TIEU_DE} — trang ${n}`, isPartOf: { "@id": `${urlDayDu("/blog")}#blog` } }] : []),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Blog", duong: "/blog" }, ...(n > 1 ? [{ ten: `Trang ${n}`, duong }] : [])]),
      )} />
      <p className="eyebrow">Blog{n > 1 ? ` · trang ${n}` : ""}</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">{n > 1 ? `Blog — trang ${n}` : (nd.dau.h1 ?? "Blog")}</h1>
      {n === 1 && <LoiDanCms nd={nd} className="mt-3 max-w-2xl text-fg-muted">{MO_TA}</LoiDanCms>}
      {n === 1 && <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-8" />}
      {/* UI-BLOG: chủ đề Huyền học (luôn có, tính từ bài) trước; chuyên mục CMS (nếu ban biên tập đặt) là lớp lọc thứ hai. */}
      <ThanhMangBlog ds={nhom.map((g) => ({ mang: g.mang, so: g.bai.length }))} tong={tatCa.length} />
      <ChipChuyenMuc ds={chuyenMucCoBai(tatCa)} />

      {ds.length === 0 ? (
        <p className="glass mt-8 rounded-2xl p-6 text-fg-muted">Chưa có bài viết. Trong lúc chờ, mời bạn đọc <Link href="/kien-thuc" className="text-gold underline underline-offset-4">thư viện kiến thức</Link>.</p>
      ) : n > 1 ? <LuoiBai ds={ds} noiBat={false} /> : (
        <>
          <LuoiBai ds={dau} />
          <LuoiChuDe ds={ke} />
          {con.length > 0 && <DanhSachGon ds={con} tieuDe="Các bài khác" />}
        </>
      )}
      <PhanTrang goc={DUONG} n={n} tong={tong} />
      {n === 1 && <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-12" />}
      {n === 1 && <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />}
    </div>
  );
}

