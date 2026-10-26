// BLOG-8 — khung "ai biên soạn / ai chịu trách nhiệm" của bài blog CMS. Chủ dự án (2026-10-26): khung cũ chiếm cả màn hình
// đầu bài (điện thoại) → dời xuống CUỐI bài, thu gọn 2–3 dòng, bấm mới xổ phần còn lại.
// <details> thuần HTML: không cần JS, nội dung xổ ra vẫn nằm trong HTML máy chủ (Google / bot AI đọc đủ), bàn phím Enter/Space mở được.
// Quy tắc chữ ký (EEAT-1 / BM-1 / DX-1) giữ nguyên: chưa có chuyên gia đọc → "Ban biên tập … · Chủ biên duyệt xuất bản" (không gắn
// reviewedBy); chỉ khi CMS ghi "tác giả"/"thẩm định" (có xác nhận, có ngày) mới đứng tên người.
import Link from "next/link";
import { BookOpen, ChevronDown, ShieldCheck } from "lucide-react";
import { CHUYEN_GIA, duongChuyenGia, ngayVN } from "@/lib/chuyen-gia";
import type { BaiCms as Bai, NguoiCms } from "@/lib/cms";

export const CHU_BIEN = "duc-luan";

export type KyBai = { vai: "tac_gia" | "tham_dinh"; n: NguoiCms } | null;

/** Người đứng tên trên bài (null = Ban biên tập). */
export function nguoiKy(bai: Bai): KyBai {
  if (bai.ky_ten === "tac_gia" && bai.tac_gia && typeof bai.tac_gia === "object") return { vai: "tac_gia", n: bai.tac_gia };
  if (bai.ky_ten === "tham_dinh" && bai.nguoi_tham_dinh && typeof bai.nguoi_tham_dinh === "object" && bai.ngay_tham_dinh) {
    return { vai: "tham_dinh", n: bai.nguoi_tham_dinh };
  }
  return null;
}

const LIEN_KET = "font-medium text-fg underline decoration-gold/40 underline-offset-2 hover:decoration-gold";

/** Tên có link hồ sơ (rel="author"); chuyên gia ngoài sổ → link `trang_ho_so` của CMS nếu có, không thì chữ thường. */
function TenNguoi({ n }: { n: NguoiCms }) {
  const cg = n.slug ? CHUYEN_GIA[n.slug] : undefined;
  const href = cg ? duongChuyenGia(cg.slug) : n.trang_ho_so;
  return href
    ? <Link href={href} rel="author" className={LIEN_KET}>{cg?.ten ?? n.ten}</Link>
    : <span className="font-medium text-fg">{n.ten}</span>;
}

export function KhungKyBai({ ky, ngayThamDinh }: { ky: KyBai; ngayThamDinh?: string | null }) {
  const chuBien = CHUYEN_GIA[CHU_BIEN]!;
  const noiBo = ky?.n.slug ? CHUYEN_GIA[ky.n.slug] : undefined;
  const ten = ky ? (noiBo?.ten ?? ky.n.ten) : chuBien.ten;
  const chuCai = ten.split(" ").map((w) => w[0]).join("").slice(0, 3);
  const ngay = ngayThamDinh ? ngayThamDinh.slice(0, 10) : null;

  // Hai dòng gọn hiện sẵn (không link, để chạm vào đâu cũng xổ khung ra).
  const dong1 = ky?.vai === "tac_gia" ? <>Tác giả: <b className="font-medium text-fg">{ten}</b></>
    : ky?.vai === "tham_dinh" ? <>Biên soạn &amp; thẩm định: <b className="font-medium text-fg">{ten}</b></>
      : <>Ban biên tập Hiểu Bản Thân biên soạn · Chủ biên <b className="font-medium text-fg">{chuBien.ten}</b> duyệt xuất bản</>;

  return (
    <section aria-label="Thông tin biên soạn" className="mt-10" data-testid="khung-ky-bai">
      <details className="group rounded-2xl border border-line/70 bg-surface/30 open:border-gold/40" data-dong-tac-gia data-ky={ky?.vai ?? "ban_bien_tap"}>
        <summary
          className="flex cursor-pointer list-none items-start gap-3 rounded-2xl p-4 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/50 bg-gold/10 font-serif text-sm text-gold">{chuCai}</span>
          <span className="min-w-0 flex-1 text-sm leading-relaxed text-fg-muted">
            <span className="line-clamp-2 block">{dong1}</span>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gold">
              <span className="group-open:hidden">Xem thông tin biên soạn</span>
              <span className="hidden group-open:inline">Thu gọn</span>
              <ChevronDown className="size-3.5 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
            </span>
          </span>
        </summary>

        <div className="khung-ky-noi-dung space-y-3 border-t border-line/50 px-4 pb-4 pt-3 text-sm leading-relaxed text-fg-muted">
          {ky && !noiBo ? (
            <p>
              <TenNguoi n={ky.n} />
              {ky.n.chuc_danh && <span className="mt-0.5 block text-xs text-fg-faint">{ky.n.chuc_danh}</span>}
            </p>
          ) : (
            <p>
              <TenNguoi n={ky ? ky.n : { id: 0, ten: chuBien.ten, slug: chuBien.slug }} />
              <span className="mt-0.5 block text-xs text-fg-faint">{(noiBo ?? chuBien).vaiTro}</span>
              <span className="mt-0.5 block text-xs text-fg-faint">{(noiBo ?? chuBien).tomTat}</span>
            </p>
          )}

          <p className="flex items-start gap-1.5 text-xs">
            {ky?.vai === "tac_gia" ? <><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-jade" aria-hidden /><span className="text-jade">Chuyên gia tự biên soạn</span></>
              : ky?.vai === "tham_dinh" ? <><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-jade" aria-hidden />
                <span className="text-jade">Đã thẩm định{ngay ? <> · <time dateTime={ngay}>{ngayVN(ngay)}</time></> : null}</span></>
                : <><BookOpen className="mt-0.5 size-3.5 shrink-0 text-fg-faint" aria-hidden /><span className="text-fg-faint">Biên soạn từ sách và tài liệu tham khảo, ghi rõ nguồn</span></>}
          </p>

          <p className="text-xs">
            <Link href="/gioi-thieu#quy-trinh" className="text-gold underline underline-offset-2 hover:text-fg">Quy trình biên soạn</Link>
          </p>
        </div>
      </details>
    </section>
  );
}
