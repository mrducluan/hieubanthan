// EEAT-1 — đội ngũ chuyên gia (hiện có chủ biên; chuyên gia cộng đồng thêm theo docs/LO-TRINH-CHUYEN-GIA.md).
import { AnhTacGia } from "@/components/khung/AnhTacGia";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
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
              <AnhTacGia cg={cg} lop="size-14 text-xl" px={56} />
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
      {process.env.NEXT_PUBLIC_MO_HOP_TAC_CG === "1" && (
        <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.04] p-5">
          <p className="text-sm font-medium text-fg">Hợp tác chuyên gia (Founding Masters)</p>
          <p className="mt-1 text-sm text-fg-muted">
            Dành cho người nghiên cứu và làm nghề nghiêm túc về Tử vi, Bát tự, Phong thuỷ, Kinh Dịch hoặc Thần số học muốn đồng hành thẩm định tri thức và sử dụng trợ lý tính toán đa mảng.
          </p>
          <Link href="/hop-tac-chuyen-gia" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold underline-offset-4 hover:underline">
            Tìm hiểu chương trình hợp tác <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}
      <KhoiCms ds={nd.khoi.cuoi} duong="/tac-gia" viTri="cuoi" className="mt-10" />
    </div>
  );
}
