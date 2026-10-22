// Phần giới thiệu render phía máy chủ ở cuối trang công cụ (Thần số, Tử vi, Bát tự…): nói công cụ làm gì, cần gì,
// tính thế nào, hỏi đáp thường gặp. Máy tìm kiếm và bot AI đọc được nội dung này, không phải đợi JavaScript.
// Kèm schema WebPage + BreadcrumbList + FAQPage. Chỉ mô tả cách hệ thống làm việc, không viết nghĩa mới.
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { TEN_MANG_SILO, truCua } from "@/lib/kien-thuc";
import { goiLd, ldDuongDan, ldHoiDap, siteUrl, urlDayDu } from "@/lib/seo";

export interface NoiDungCongCu {
  duong: string;
  ten: string;
  moTa: string;
  doan: string[];
  hoiDap: { hoi: string; dap: string }[];
  lienKet?: { href: string; ten: string }[];
}

/** Nhãn khung (ND-7, chữ CMS) — thiếu thì dùng chữ mặc định. */
type NhanGioiThieu = { tieuDe?: string; hoiDap?: string; docThem?: string };

export function GioiThieuCongCu({ duong, ten, moTa, doan, hoiDap, lienKet = [], nhan = {} }: NoiDungCongCu & { nhan?: NhanGioiThieu }) {
  return (
    <section aria-labelledby="gioi-thieu-cong-cu" className="mx-auto mt-12 max-w-3xl border-t border-line/50 pt-8 text-fg-muted md:mt-16 md:pt-10">
      <JsonLd data={goiLd(
        { "@type": "WebPage", "@id": `${urlDayDu(duong)}#trang`, url: urlDayDu(duong), name: ten, description: moTa,
          inLanguage: "vi-VN", isPartOf: { "@id": `${siteUrl()}/#website` }, about: ten,
          potentialAction: { "@type": "UseAction", target: urlDayDu(duong) } },
        // QH-URL: công cụ nằm trong silo (vd /phong-thuy/huong-xau-nam) → cha là trang trụ; công cụ gốc → cha là Khám phá.
        ldDuongDan([{ ten: "Trang chủ", duong: "/" },
          duong.split("/").length > 2 && TEN_MANG_SILO[truCua(duong)] ? { ten: TEN_MANG_SILO[truCua(duong)]!, duong: truCua(duong) } : { ten: "Khám phá", duong: "/kham-pha" },
          { ten, duong }]),
        ldHoiDap(hoiDap),
      )} />
      <h2 id="gioi-thieu-cong-cu" className="text-2xl text-fg">{nhan.tieuDe || `Về công cụ ${ten}`}</h2>
      <div className="mt-3 space-y-3 leading-relaxed">{doan.map((p) => <p key={p}>{p}</p>)}</div>
      <h3 className="mt-8 text-xl text-fg">{nhan.hoiDap || "Câu hỏi thường gặp"}</h3>
      <dl className="mt-3 space-y-4">
        {hoiDap.map((h) => (
          <div key={h.hoi}>
            <dt className="font-medium text-fg">{h.hoi}</dt>
            <dd className="mt-1 leading-relaxed">{h.dap}</dd>
          </div>
        ))}
      </dl>
      {lienKet.length > 0 && (
        <p className="mt-6 text-sm">{nhan.docThem || "Đọc thêm:"}{" "}
          {lienKet.map((l, i) => <span key={l.href}>{i > 0 && " · "}<Link href={l.href} className="text-gold underline">{l.ten}</Link></span>)}
        </p>
      )}
    </section>
  );
}
