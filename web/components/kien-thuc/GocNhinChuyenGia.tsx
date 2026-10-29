// GN-1 — khung "Góc nhìn chuyên gia": 2–4 câu kinh nghiệm thật do CHÍNH chuyên gia viết (engine chỉ trả khi trang đã
// được người đó thẩm định hoặc tự viết). Web chỉ hiển thị nguyên văn, không thêm chữ nào vào lời chuyên gia.
import Link from "next/link";
import { Quote } from "lucide-react";
import { CHUYEN_GIA, duongChuyenGia, ngayVN } from "@/lib/chuyen-gia";
import type { LoaiTrang, TrangKienThuc } from "@/lib/kien-thuc";

/** Môn của bài — để chữ ký ghi đúng lĩnh vực chuyên gia đang nói. */
export const MON_THEO_LOAI: Record<LoaiTrang, string> = {
  so: "thần số học", cap_so: "thần số học", nghe: "thần số học", tinh_yeu: "thần số học", nam_ca_nhan: "thần số học",
  no_nghiep: "thần số học", so_kep: "thần số học", que: "Kinh Dịch", sao: "Tử vi", cung: "Tử vi", sao_cung: "Tử vi", hoa_cung: "Tử vi",
  thap_than: "Bát tự", nhat_chu: "Bát tự", menh_nam: "Bát tự", dau_hieu: "Phong thuỷ",
  nap_am: "Bát tự", tiet_khi: "lịch pháp", con_giap_nam: "Bát tự",
};

export function GocNhinChuyenGia({ goc_nhin, loai }: { goc_nhin: NonNullable<TrangKienThuc["goc_nhin"]>; loai: LoaiTrang }) {
  const cg = CHUYEN_GIA[goc_nhin.nguoi];
  return (
    <aside aria-labelledby="goc-nhin" data-goc-nhin className="mt-6 rounded-2xl border border-jade/40 bg-jade/5 p-5">
      <p id="goc-nhin" className="eyebrow flex items-center gap-1.5 text-jade"><Quote className="size-3.5" aria-hidden /> Góc nhìn chuyên gia</p>
      <blockquote className="mt-2 font-serif text-lg leading-relaxed text-fg">“{goc_nhin.noi_dung}”</blockquote>
      <p className="mt-3 text-sm text-fg-muted">
        —{" "}{cg ? <Link href={duongChuyenGia(goc_nhin.nguoi)} rel="author" className="font-medium text-fg underline decoration-gold/40 underline-offset-2 hover:decoration-gold">{cg.ten}</Link> : goc_nhin.nguoi}
        {cg ? ` · ${cg.thamNien} nghiên cứu ${MON_THEO_LOAI[loai]}` : ""} · <time dateTime={goc_nhin.ngay}>{ngayVN(goc_nhin.ngay)}</time>
      </p>
    </aside>
  );
}
