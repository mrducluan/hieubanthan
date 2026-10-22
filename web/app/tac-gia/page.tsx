// EEAT-1 — đội ngũ chuyên gia (hiện có chủ biên; chuyên gia cộng đồng thêm theo docs/LO-TRINH-CHUYEN-GIA.md).
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHUYEN_GIA, duongChuyenGia, ldNguoi } from "@/lib/chuyen-gia";
import { goiLd, ldDuongDan } from "@/lib/seo";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { layNoiDungTrang } from "@/lib/noi-dung-trang";

export const metadata: Metadata = {
  title: "Đội ngũ chuyên gia",
  description: "Những người chịu trách nhiệm nội dung Hiểu Bản Thân: vai trò, lĩnh vực, bài đã viết và đã thẩm định.",
  alternates: { canonical: "/tac-gia" },
};

export default async function Page() {
  const ds = Object.values(CHUYEN_GIA);
  const nd = await layNoiDungTrang("/tac-gia");   // ND-7: CMS chỉ thêm khối cuối trang
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(...ds.map(ldNguoi), ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Đội ngũ", duong: "/tac-gia" }]))} />
      <p className="eyebrow">Về nội dung</p>
      <h1 className="mt-1 text-4xl sm:text-5xl">Đội ngũ chuyên gia</h1>
      <p className="mt-3 leading-relaxed text-fg-muted">Mỗi bài kiến thức ghi rõ ai chịu trách nhiệm, ai viết và ai đã thẩm định.
        Phần tính toán do hệ thống tính toán riêng thực hiện; phần diễn giải do Ban biên tập biên soạn, chuyên gia thẩm định.</p>
      <ul className="mt-8 space-y-3">
        {ds.map((cg) => (
          <li key={cg.slug}>
            <Link href={duongChuyenGia(cg.slug)} className="glass flex items-center gap-4 rounded-2xl p-5 hover:border-gold/50">
              <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full border border-gold/50 bg-gold/10 font-serif text-xl text-gold">
                {cg.ten.split(" ").map((w) => w[0]).join("")}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg text-fg">{cg.ten}</span>
                <span className="block text-xs text-fg-faint">{cg.vaiTro}</span>
                <span className="mt-1 block text-sm text-fg-muted">{cg.tomTat}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-gold/70" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <KhoiCms ds={nd.khoi.cuoi} duong="/tac-gia" viTri="cuoi" className="mt-10" />
    </div>
  );
}
