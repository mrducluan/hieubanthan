"use client";
// NAM-2 — "Thời gian tới của bạn": hồ sơ trên máy → báo cáo 4 chương do engine ghép (3 tháng + tóm tắt năm miễn phí;
// 12 tháng, năm đầy đủ, nên tránh & nên làm mở bằng Sao khi công tắc bật). Chọn năm âm đang đi / năm tới. Thiếu giờ +
// giới tính + nơi sinh → vẫn đọc thần số + tập quán, mời bổ sung để thêm Tử vi và Bát tự. Web không tính gì.
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { KhungTai } from "@/components/khung/TieuDe";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { LuanGiaiToanBo } from "@/components/huyen-hoc/LuanGiaiToanBo";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { laSoTuHoSo, ngaySinhIso, tenGoi, useHoSo } from "@/lib/hoso";
import { ghi } from "@/lib/do-luong";
import { useChuThoiGian } from "@/components/chan-dung/chu-chan-dung";
import { Dam } from "@/components/nhan-tuong/chu-nhan-tuong";
import { KeHoachThang } from "@/components/thoi-gian/KeHoachThang";

// EN-ALL GĐ 8: /en/year-ahead là rewrite của trang này — chữ ở lib/chu/chan-dung.ts (CHU_THOI_GIAN_UI), chương do engine trả.

export function ThoiGianToi({ cacNam, namBanDau }: { cacNam: number[]; /** ?nam= hợp lệ, không thì năm mặc định engine trả. */ namBanDau: number | null }) {
  const { t, en } = useChuThoiGian();
  const hs = useHoSo();
  const [nam, setNam] = useState<number | null>(namBanDau && cacNam.includes(namBanDau) ? namBanDau : null);
  const [boSung, setBoSung] = useState(false);
  useBatDauDoc("thoi_gian", Boolean(hs));
  if (hs === undefined) return <KhungTai dong={3} />;
  if (hs === null) {
    return <Card data-testid="tgt-nhap"><NhapHoSo nutGui={t("tg.nut_nhap")} onXong={() => { /* useHoSo tự cập nhật */ }} /></Card>;
  }
  const laSo = laSoTuHoSo(hs);
  const than = { ngay_sinh: ngaySinhIso(hs), ...(hs.gioi_tinh ? { gioi_tinh: hs.gioi_tinh } : {}), ...(laSo ? { la_so: laSo } : {}),
    ...(nam ? { nam } : {}) };
  return (
    <div className="space-y-5" data-testid="thoi-gian-toi">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("tg.chon_nam")}>
        <span className="text-sm text-fg-muted">{en ? t("tg.xem_cho", { ten: tenGoi(hs) }) : <>Xem cho {tenGoi(hs)} ·</>}</span>
        {cacNam.map((n, i) => {
          const dang = nam === n;
          return (
            <button key={n} type="button" onClick={() => { setNam(n); ghi("chart_interacted", { mo_dun: "thoi_gian", kind: "chon_nam", nam: n }); }}
              aria-pressed={nam === n} className={`rounded-full border px-3 py-1.5 text-sm ${dang ? "border-gold bg-gold/10 text-gold" : "border-line text-fg-muted hover:border-gold/50"}`}>
              {i === 0 ? t("tg.nam_dang_di", { nam: String(n) }) : t("tg.nam_toi", { nam: String(n) })}
            </button>
          );
        })}
      </div>
      {!laSo && (
        <div className="rounded-2xl border border-line/70 p-4 text-sm" data-testid="tgt-bo-sung">
          {en ? <p className="text-fg-muted"><Dam s={t("tg.bo_sung", { pt: hs.gioi_tinh ? t("tg.bo_sung_pt") : "", gt: hs.gioi_tinh ? "" : t("tg.bo_sung_gt"), hm: hs.gioi_tinh ? "" : t("tg.bo_sung_hm") })} /></p>
            : <p className="text-fg-muted">Đang đọc theo ngày sinh: thần số, con giáp, ngày đẹp{hs.gioi_tinh ? ", góc nhà hợp bạn (phong thuỷ)" : ""} và tập quán theo tuổi. Thêm <b className="text-fg">giờ sinh{hs.gioi_tinh ? "" : ", giới tính"}, nơi sinh</b> để mỗi tháng có thêm lá số Tử vi và Bát tự của riêng bạn{hs.gioi_tinh ? "" : ", cùng góc nhà hợp mệnh"} — tháng nào nhiều cách cùng thuận, tháng nào nên đi chậm.</p>}
          {boSung ? <NhapHoSo macDinh={hs} can="day_du" nutGui={t("tg.cap_nhat")} onXong={() => setBoSung(false)} className="mt-3" />
            : <button type="button" onClick={() => setBoSung(true)} className="mt-2 text-gold underline underline-offset-4">{t("tg.bo_sung_nut")}</button>}
        </div>
      )}
      {/* KH-1: câu người ta mang tới nhất — "việc tôi định làm thì tháng nào hợp?" — trả lời ngay, miễn phí, trước bài đọc. */}
      {!en && <KeHoachThang ten={tenGoi(hs)} than={than} />}
      <div id="bai-doc-thoi-gian" className="scroll-mt-24" />
      <LuanGiaiToanBo key={JSON.stringify(than)} duongDan="/api/thoi-gian-toi" laSo={than} than={than} ten={t("tg.ten")}
        moDun="thoi_gian" tuMo />
      <CuoiBaiDoc moDun="thoi_gian" khongCta={en} />
    </div>
  );
}
