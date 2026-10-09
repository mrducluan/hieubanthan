// EEAT-1 — dòng "ai viết / ai chịu trách nhiệm / ai thẩm định" dưới tiêu đề bài kiến thức.
// Chỉ hiển thị theo dữ liệu engine trả (tac_gia, tham_dinh) — không tự suy ra trạng thái.
// BM-1 (chủ dự án 2026-10-09): bỏ chữ "AI" khỏi bài viết. Bài chưa thẩm định ghi "Ban biên tập" + chủ biên — KHÔNG ghi
// chuyên gia là tác giả bài họ chưa đọc; bài chuyên gia đã đọc, sửa, duyệt mới ghi "Biên soạn & thẩm định".
import Link from "next/link";
import { BookOpen, ShieldCheck } from "lucide-react";
import { CHUYEN_GIA, duongChuyenGia, ngayVN } from "@/lib/chuyen-gia";
import type { TrangKienThuc } from "@/lib/kien-thuc";

type Props = Pick<TrangKienThuc, "chu_bien" | "tac_gia" | "tham_dinh">;

function TenChuyenGia({ slug }: { slug: string }) {
  const cg = CHUYEN_GIA[slug];
  if (!cg) return <span>{slug}</span>;
  return <Link href={duongChuyenGia(slug)} rel="author" className="font-medium text-fg underline decoration-gold/40 underline-offset-2 hover:decoration-gold">{cg.ten}</Link>;
}

export function DongTacGia({ chu_bien, tac_gia, tham_dinh }: Props) {
  const nguoi = tac_gia ?? tham_dinh?.nguoi ?? chu_bien;
  const cg = CHUYEN_GIA[nguoi];
  return (
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line/70 p-4" data-dong-tac-gia>
      <span aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/50 bg-gold/10 font-serif text-base text-gold">
        {cg ? cg.ten.split(" ").map((w) => w[0]).join("") : "?"}
      </span>
      <div className="min-w-0 text-sm leading-relaxed text-fg-muted">
        {tac_gia ? (
          <p>Tác giả: <TenChuyenGia slug={tac_gia} /></p>
        ) : tham_dinh ? (
          <p>Biên soạn &amp; thẩm định: <TenChuyenGia slug={tham_dinh.nguoi} /></p>
        ) : (
          <p>Ban biên tập Hiểu Bản Thân · Chủ biên: <TenChuyenGia slug={chu_bien} /></p>
        )}
        {cg && <p className="text-xs text-fg-faint">{cg.vaiTro} · {cg.tomTat}</p>}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {tac_gia ? (
            <span className="inline-flex items-center gap-1 text-jade"><ShieldCheck className="size-3.5" aria-hidden /> Chuyên gia tự biên soạn</span>
          ) : tham_dinh ? (
            <span className="inline-flex items-center gap-1 text-jade"><ShieldCheck className="size-3.5" aria-hidden />
              Đã thẩm định · <time dateTime={tham_dinh.ngay}>{ngayVN(tham_dinh.ngay)}</time></span>
          ) : (
            <span className="inline-flex items-center gap-1 text-fg-faint"><BookOpen className="size-3.5" aria-hidden />
              Biên soạn từ cổ thư và tài liệu tham khảo, ghi rõ nguồn và trường phái</span>
          )}
          <Link href="/gioi-thieu#quy-trinh" className="text-fg-faint underline underline-offset-2 hover:text-fg">Quy trình biên soạn</Link>
        </p>
      </div>
    </div>
  );
}
