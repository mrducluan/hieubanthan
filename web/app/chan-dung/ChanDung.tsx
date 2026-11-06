"use client";
// CD-1 — phần riêng của /chan-dung: hồ sơ trên máy (cần giờ + giới tính + nơi sinh) + câu trả lời khảo sát Nhân tướng trên
// máy (tuỳ chọn) → báo cáo 8 chương do engine ghép (chương 1 miễn phí; chương sau mở bằng Sao khi công tắc bật — cùng
// luồng `luanGiaiCoSao`, mô-đun "chan_dung"). Ma trận mảng × cách nhìn vẽ ngay trên báo cáo. Web không tính gì.
import { useMemo } from "react";
import { ScanFace } from "lucide-react";
import Link from "@/components/khung/Lien";
import { KhungTai } from "@/components/khung/TieuDe";
import { MoiLapLaSo } from "@/components/huyen-hoc/MoiLapLaSo";
import { LuanGiaiToanBo } from "@/components/huyen-hoc/LuanGiaiToanBo";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { MaTranBaCach, type MaTran } from "@/components/chan-dung/MaTranBaCach";
import { laSoTuHoSo, useHoSo } from "@/lib/hoso";
import { demTraLoi, useTraLoi } from "@/lib/nhan-tuong";

type BcChanDung = { ma_tran?: MaTran; thieu?: string[] };

export function ChanDung() {
  const hs = useHoSo();
  const traLoi = useTraLoi();
  const laSo = laSoTuHoSo(hs);
  const soCau = demTraLoi(traLoi);
  // Chỉ gửi câu trả lời đã có (mã); không có thì engine đọc hai lá số.
  const than = useMemo(() => (laSo ? { la_so: laSo, ...(soCau ? { tra_loi: traLoi } : {}) } : null), [laSo, traLoi, soCau]);
  useBatDauDoc("chan_dung", Boolean(than));
  if (hs === undefined || traLoi === undefined) return <KhungTai dong={3} />;
  if (!than) return <MoiLapLaSo moDun="chan_dung" hoSo={hs} />;
  return (
    <div className="space-y-5" data-testid="chan-dung">
      <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted" data-testid="cd-trang-thai">
        <ScanFace className="size-4 text-gold" aria-hidden />
        {soCau
          ? <>Đang ghép ba cách nhìn: Tử vi, Bát tự và <b className="text-fg">{soCau} nét</b> bạn đã tự quan sát ở Nhân tướng học.</>
          : <>Đang ghép hai lá số. <Link href="/nhan-tuong#khao-sat" className="text-gold underline underline-offset-4">Làm khảo sát gương mặt</Link> (5 phút, không cần ảnh) để có cách nhìn thứ ba.</>}
      </p>
      <LuanGiaiToanBo key={JSON.stringify(than)} duongDan="/api/chan-dung" laSo={than} than={than} ten="chân dung tổng hợp"
        moDun="chan_dung" tuMo
        dau={(bc) => { const b = bc as BcChanDung; return b.ma_tran ? <MaTranBaCach mt={b.ma_tran} thieu={b.thieu ?? []} className="mb-6" /> : null; }} />
      <CuoiBaiDoc moDun="chan_dung" cauHoi="Mảng nào ba cách cùng thấy mà bạn thấy đúng với mình nhất?" />
    </div>
  );
}
