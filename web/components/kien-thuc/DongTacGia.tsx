// EEAT-1 — dòng "ai viết / ai chịu trách nhiệm / ai thẩm định" dưới tiêu đề bài kiến thức.
// Chỉ hiển thị theo dữ liệu engine trả (tac_gia, tham_dinh) — không tự suy ra trạng thái.
// BM-1 (chủ dự án 2026-10-09): bỏ chữ "AI" khỏi bài viết. Bài chưa thẩm định ghi "Ban biên tập" + chủ biên — KHÔNG ghi
// chuyên gia là tác giả bài họ chưa đọc; bài chuyên gia đã đọc, sửa, duyệt mới ghi "Biên soạn & thẩm định".
// DX-1: "Chủ biên … duyệt xuất bản" = quyết định biên tập cho toàn kho (như tổng biên tập duyệt đăng), không phải
// thẩm định từng bài → không gắn reviewedBy, không đổi nhãn "Đã thẩm định".
import Link from "@/components/khung/Lien";
import { BookOpen, ShieldCheck } from "lucide-react";
import { CHUYEN_GIA, duongChuyenGia, ngayVN } from "@/lib/chuyen-gia";
import type { TrangKienThuc } from "@/lib/kien-thuc";
import { taoChu, type DocChu } from "@/lib/chu-trang";
import { CHU_KIEN_THUC } from "@/lib/chu/kien-thuc";

type Props = Pick<TrangKienThuc, "chu_bien" | "tac_gia" | "tham_dinh" | "duyet_xuat_ban"> & { en?: boolean };

function TenChuyenGia({ slug }: { slug: string }) {
  const cg = CHUYEN_GIA[slug];
  if (!cg) return <span>{slug}</span>;
  return <Link href={duongChuyenGia(slug)} rel="author" className="font-medium text-fg underline decoration-gold/40 underline-offset-2 hover:decoration-gold">{cg.ten}</Link>;
}

export function DongTacGia({ chu_bien, tac_gia, tham_dinh, duyet_xuat_ban, en = false }: Props) {
  if (en) return <DongTacGiaEn chu_bien={chu_bien} tac_gia={tac_gia} tham_dinh={tham_dinh} c={taoChu(CHU_KIEN_THUC, null, "en")} />;
  const nguoi = tac_gia ?? tham_dinh?.nguoi ?? chu_bien;
  const cg = CHUYEN_GIA[nguoi];
  const c = taoChu(CHU_KIEN_THUC);
  return (
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line/70 p-4" data-dong-tac-gia data-nosnippet="">
      <span aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/50 bg-gold/10 font-serif text-base text-gold">
        {cg ? cg.ten.split(" ").map((w) => w[0]).join("") : "?"}
      </span>
      <div className="min-w-0 text-sm leading-relaxed text-fg-muted">
        {tac_gia ? (
          <p>{c("tg.tac_gia")}<TenChuyenGia slug={tac_gia} /></p>
        ) : tham_dinh ? (
          <p>{c("tg.tham_dinh")}<TenChuyenGia slug={tham_dinh.nguoi} /></p>
        ) : duyet_xuat_ban ? (
          <p>{c("tg.ban_bien_tap_duyet")}<TenChuyenGia slug={duyet_xuat_ban.nguoi} />{c("tg.duyet_sau")}</p>
        ) : (
          <p>{c("tg.ban_bien_tap")}<TenChuyenGia slug={chu_bien} /></p>
        )}
        {cg && <p className="text-xs text-fg-faint">{cg.vaiTro} · {cg.tomTat}</p>}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {tac_gia ? (
            <span className="inline-flex items-center gap-1 text-jade"><ShieldCheck className="size-3.5" aria-hidden />{` ${c("tg.tu_bien_soan")}`}</span>
          ) : tham_dinh ? (
            <span className="inline-flex items-center gap-1 text-jade"><ShieldCheck className="size-3.5" aria-hidden />{c("tg.da_tham_dinh")}<time dateTime={tham_dinh.ngay}>{ngayVN(tham_dinh.ngay)}</time></span>
          ) : (
            <span className="inline-flex items-center gap-1 text-fg-faint"><BookOpen className="size-3.5" aria-hidden />{c("tg.nguon")}</span>
          )}
          <Link href="/gioi-thieu#quy-trinh" className="vung-cham inline-block text-fg-faint underline underline-offset-2 hover:text-fg">{c("tg.quy_trinh")}</Link>
        </p>
      </div>
    </div>
  );
}

/** EN-ALL GĐ 3d — dòng tác giả bản Anh (EEAT-1 / BM-1): bản Anh do BAN BIÊN TẬP chuyển thể từ bản Việt → luôn ghi ban biên
 *  tập + chủ biên, KHÔNG ghi chuyên gia là tác giả / người thẩm định bản Anh (họ chưa đọc bản này); bài bản Việt đã được
 *  thẩm định thì nói đúng điều đó ("The Vietnamese edition was reviewed by…"). Hồ sơ /tac-gia chưa có bản Anh → tên không
 *  kèm link; tên viết không dấu (như chân trang bản Anh). */
function DongTacGiaEn({ chu_bien, tac_gia, tham_dinh, c }: Omit<Props, "duyet_xuat_ban" | "en"> & { c: DocChu<typeof CHU_KIEN_THUC> }) {
  const ten = CHUYEN_GIA[chu_bien] ? c("tg.ten_chu_bien") : "";
  const tenViet = (slug: string | null | undefined) => (slug && CHUYEN_GIA[slug] ? c("tg.ten_chu_bien") : "");
  const banViet = tham_dinh && tenViet(tham_dinh.nguoi) ? c("tg.ban_viet", { ten: tenViet(tham_dinh.nguoi), ngay: tham_dinh.ngay })
    : tac_gia && tenViet(tac_gia) ? c("tg.ban_viet_tac_gia", { ten: tenViet(tac_gia) }) : "";
  return (
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line/70 p-4" data-dong-tac-gia data-nosnippet="">
      <span aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/50 bg-gold/10 font-serif text-base text-gold">
        {ten ? ten.split(" ").map((w) => w[0]).join("") : "?"}
      </span>
      <div className="min-w-0 text-sm leading-relaxed text-fg-muted">
        <p>{c("tg.ban_bien_tap")}<span className="font-medium text-fg">{ten}</span></p>
        {ten && <p className="text-xs text-fg-faint">{c("tg.vai_tro")} · {c("tg.tom_tat")}</p>}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1 text-fg-faint"><BookOpen className="size-3.5" aria-hidden /> {c("tg.nguon")}</span>
        </p>
        {banViet && <p className="mt-1 text-xs text-fg-faint">{banViet}</p>}
      </div>
    </div>
  );
}
