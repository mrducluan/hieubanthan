// PL-1 — khung chung cho trang pháp lý / giới thiệu: tiêu đề, ngày hiệu lực, mục lục neo, nội dung dễ đọc.
import type { ReactNode } from "react";
import Link from "next/link";
import { NGAY_HIEU_LUC } from "@/lib/van-hanh";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan } from "@/lib/seo";

export interface Muc { id: string; tieuDe: string; noiDung: ReactNode }

const LIEN_QUAN = [
  { href: "/chinh-sach-rieng-tu", ten: "Chính sách quyền riêng tư" },
  { href: "/dieu-khoan", ten: "Điều khoản sử dụng" },
  { href: "/mien-tru-trach-nhiem", ten: "Miễn trừ trách nhiệm" },
  { href: "/gioi-thieu", ten: "Giới thiệu & phương pháp" },
  { href: "/lien-he", ten: "Liên hệ" },
];

export function TrangPhapLy({ nhan, tieuDe, moDau, muc, duongDan, hieuLuc = true }: {
  nhan: string; tieuDe: string; moDau: ReactNode; muc: Muc[]; duongDan: string; hieuLuc?: boolean;
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: tieuDe, duong: duongDan }]))} />
      <p className="eyebrow">{nhan}</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{tieuDe}</h1>
      {hieuLuc && <p className="mt-2 text-sm text-fg-faint">Hiệu lực từ {NGAY_HIEU_LUC}</p>}
      <div className="mt-4 text-fg-muted prose-vn">{moDau}</div>

      {muc.length > 2 && (
        <nav aria-label="Mục lục" className="mt-6 rounded-2xl border border-line/70 bg-surface/40 px-5 py-4">
          <p className="eyebrow">Mục lục</p>
          <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {muc.map((m, i) => (
              <li key={m.id}><a href={`#${m.id}`} className="text-fg-muted hover:text-gold">{i + 1}. {m.tieuDe}</a></li>
            ))}
          </ol>
        </nav>
      )}

      <div className="mt-8 space-y-10">
        {muc.map((m, i) => (
          <section key={m.id} id={m.id} aria-labelledby={`${m.id}-td`} className="scroll-mt-24">
            <h2 id={`${m.id}-td`} className="text-xl sm:text-2xl">{muc.length > 1 ? `${i + 1}. ` : ""}{m.tieuDe}</h2>
            <div className="noi-dung-phap-ly mt-3 space-y-3 leading-relaxed text-fg-muted">{m.noiDung}</div>
          </section>
        ))}
      </div>

      <nav aria-label="Trang liên quan" className="mt-12 border-t border-line/60 pt-5">
        <p className="eyebrow">Xem thêm</p>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {LIEN_QUAN.filter((l) => l.href !== duongDan).map((l) => (
            <li key={l.href}><Link href={l.href} className="text-fg-muted underline-offset-4 hover:text-gold hover:underline">{l.ten}</Link></li>
          ))}
        </ul>
      </nav>
    </article>
  );
}

/** Bảng gọn cho trang pháp lý (cuộn ngang trên điện thoại). */
export function Bang({ dau, dong }: { dau: string[]; dong: ReactNode[][] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-fg">{dau.map((d) => <th key={d} scope="col" className="py-2 pr-3 font-semibold">{d}</th>)}</tr>
        </thead>
        <tbody>
          {dong.map((r, i) => (
            <tr key={i} className="border-b border-line/50 align-top">{r.map((c, k) => <td key={k} className="py-2 pr-3">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
