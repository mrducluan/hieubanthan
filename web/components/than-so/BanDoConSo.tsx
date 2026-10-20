"use client";
// Gói Sao "Bản đồ con số" (Luận giải toàn bộ thần số): đọc miễn phí chương Tổng quan (bạn hiếm cỡ nào, con số lặp lại,
// chỗ bên trong – bên ngoài lệch nhau), ba chương sau hiện tiêu đề + điểm nhấn đã tính và mở bằng Sao khi bật thu Sao.
// Đặt ngay sau "Bốn con số cốt lõi" — điểm chuyển từ tổng quan sang chiều sâu. Không lưu ở máy chủ.
import { LuanGiaiToanBo } from "@/components/huyen-hoc/LuanGiaiToanBo";
import { hoTenList, type HoSo } from "@/lib/hoso";
import type { QuyUocDD } from "@/lib/quy-uoc-dd";

export function BanDoConSo({ hoSo, quyUoc }: { hoSo: HoSo; quyUoc: QuyUocDD }) {
  const than = { ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam, quy_uoc_duong_doi: quyUoc };
  return (
    <section id="ban-do-con-so" aria-label="Bản đồ con số" className="scroll-mt-24" data-testid="ban-do-con-so">
      <LuanGiaiToanBo duongDan="/api/thanso/ban-do-con-so" laSo={than} than={than} ten="bản đồ con số" moDun="thanso" tuMo />
    </section>
  );
}
