"use client";
// TS-V3b — báo cáo ba phái (Pitago · Chaldea · Qabalah) theo chương, cùng khuôn Luận giải toàn bộ: chương đầu (điểm
// chung của các phái) miễn phí, phần còn lại mở bằng Sao khi bật thu Sao. Gửi kèm phiếu "phái nào nói đúng" (3 con số
// đếm trên máy) để engine viết chương cuối. Không lưu ở máy chủ.
import { LuanGiaiToanBo } from "@/components/huyen-hoc/LuanGiaiToanBo";
import { hoTenList, type HoSo } from "@/lib/hoso";
import type { QuyUocDD } from "@/lib/quy-uoc-dd";
import { NGUONG_GOI_Y, tongPhieu, usePhieu } from "@/lib/phieu-phai";

export function BaoCaoBaPhai({ hoSo, quyUoc }: { hoSo: HoSo; quyUoc: QuyUocDD }) {
  const phieu = usePhieu();
  const tong = tongPhieu(phieu);
  const than = { ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam, quy_uoc_duong_doi: quyUoc,
    ...(tong > 0 ? { phieu } : {}) };
  return (
    <section id="bao-cao-ba-phai" aria-label="Báo cáo ba phái" className="scroll-mt-24 space-y-2" data-testid="bao-cao-ba-phai">
      <LuanGiaiToanBo duongDan="/api/thanso/bao-cao-ba-phai" laSo={than} than={than} ten="ba phái thần số" moDun="thanso3" />
      <p className="text-xs text-fg-faint">
        {tong >= NGUONG_GOI_Y
          ? `Chương cuối dựa trên ${tong} lần bạn chọn "phái nào nói đúng".`
          : `Chọn "phái nào nói đúng" dưới mỗi câu trả lời (${tong}/${NGUONG_GOI_Y}) — chương cuối sẽ cho biết phái hợp với bạn nhất.`}
      </p>
    </section>
  );
}
