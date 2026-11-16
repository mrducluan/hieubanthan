"use client";
// EN-ALL GĐ 4 — nơi sinh ở nước ngoài cho form phụ (Người thân, Xem lá số 2 người), cùng ô với form hồ sơ chính.
// NS-QT (2026-11-16): ô gõ có gợi ý (GeoNames) thay hai ô chọn Nước → Thành phố. Trả MÃ nơi ("gn-…", mã cũ "us-new_york"
// hoặc mã vùng IANA); múi giờ chuẩn và giờ mùa hè lúc sinh do engine suy từ tzdata — web không tính.
import { ONoiSinh } from "@/components/hoso/ONoiSinh";

export function ChonNuocThanhPho({ id, giaTri, doi }: { id: string; giaTri: string; doi: (ma: string) => void }) {
  return <div data-testid={`${id}-nuoc-ngoai`}><ONoiSinh id={id} giaTri={giaTri} doi={doi} /></div>;
}
