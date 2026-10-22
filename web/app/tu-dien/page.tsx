// GN — Từ điển thuật ngữ dễ hiểu (trang công khai, SEO): giải nghĩa đời thường cho mọi thuật ngữ 5 mảng.
// Nội dung từ KB của engine (nháp AI, luôn gắn nhãn); render phía server để máy tìm kiếm và AI đọc được.
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { tuDien } from "@/lib/kien-thuc";
import { TEN_MANG } from "@/lib/markdown";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, siteUrl, urlDayDu } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { TimTuDien } from "./TimTuDien";

export const revalidate = 21600;

const META: Metadata = {
  title: { absolute: "Từ điển thuật ngữ Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Thần số" },
  description: "Hơn 200 thuật ngữ huyền học giải nghĩa bằng ngôn ngữ đời thường: cung Mệnh, Hoá Kỵ, nhật chủ, dụng thần, hào động, quẻ biến, sơn tinh, hướng tinh, số đường đời…",
  alternates: { canonical: "/tu-dien", types: { "text/markdown": "/tu-dien.md" } },
};


const DUONG = "/tu-dien";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

export default async function Trang() {
  const [d, nd] = await Promise.all([tuDien(), layNoiDungTrang(DUONG)]);
  const muc = d?.muc ?? [];
  return (
    <div className="mx-auto max-w-4xl md:py-4">
      {muc.length > 0 && (
        <JsonLd data={goiLd(
          {
            "@type": "DefinedTermSet", "@id": `${urlDayDu("/tu-dien")}#tu-dien`, name: "Từ điển thuật ngữ huyền học",
            url: urlDayDu("/tu-dien"), inLanguage: "vi-VN", publisher: { "@id": `${siteUrl()}/#to-chuc` },
            hasDefinedTerm: muc.map((m) => ({
              // SEO-K: mỗi thuật ngữ có @id/url = neo trên trang (#mã) → AI dẫn thẳng tới định nghĩa.
              "@type": "DefinedTerm", "@id": `${urlDayDu("/tu-dien")}#${m.ma}`, url: `${urlDayDu("/tu-dien")}#${m.ma}`,
              name: m.ten, description: m.de_hieu, termCode: m.ma,
              ...(m.han ? { alternateName: m.han } : {}), inDefinedTermSet: `${urlDayDu("/tu-dien")}#tu-dien`,
            })),
          },
          ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Từ điển", duong: "/tu-dien" }]),
        )} />
      )}
      <header className="space-y-3">
        <p className="eyebrow flex items-center gap-2"><BookOpen className="size-4" aria-hidden /> Từ điển</p>
        <h1 className="text-4xl">{nd.dau.h1 ?? "Từ điển thuật ngữ — nói cho dễ hiểu"}</h1>
        <LoiDanCms nd={nd} className="text-fg-muted">
          Mỗi thuật ngữ trong lá số và lời luận giải đều có lời giải nghĩa bằng ngôn ngữ đời thường. Trong câu trả lời, chữ
          gạch chân chấm là thuật ngữ — bấm vào để xem nhanh.
        </LoiDanCms>
        <p className="text-xs text-fg-faint">Ban biên tập Hiểu Bản Thân biên soạn · {d?.nguon}</p>
      </header>
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-8" />
      {muc.length === 0 ? (
        <p className="mt-8 text-fg-muted">Từ điển đang tải, vui lòng quay lại sau ít phút.</p>
      ) : (
        <div className="mt-8 space-y-8">
          <TimTuDien tenMang={TEN_MANG} tong={muc.length} />
          {Object.entries(TEN_MANG).map(([md, ten]) => {
            const ds = muc.filter((m) => m.mo_dun === md);
            if (!ds.length) return null;
            return (
              <section key={md} data-td-nhom aria-labelledby={`td-${md}`}>
                <h2 id={`td-${md}`} className="mb-3 text-2xl">{ten}</h2>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {ds.map((m) => (
                    <div key={m.ma} id={m.ma} data-td-muc data-mang={md}
                      className="glass scroll-mt-24 rounded-xl p-4 target:ring-2 target:ring-gold">
                      <dt className="font-serif text-lg">
                        {/* Chữ Hán dùng phông hệ thống: 221 mục × phông Noto Serif TC tải ~1,2 MB (PERF-1). */}
                        {m.ten}{m.han && <span className="ml-2 text-base text-fg-faint" style={{ fontFamily: "serif" }}>{m.han}</span>}
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-fg-muted">{m.de_hieu}</dd>
                      {m.vi_du && <dd className="mt-1 text-sm text-fg-faint">Ví dụ: {m.vi_du}</dd>}
                      {m.bien_the.length > 0 && <dd className="mt-1 text-xs text-fg-faint">Còn gọi: {m.bien_the.join(", ")}</dd>}
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      )}
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-12" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />
    </div>
  );
}
