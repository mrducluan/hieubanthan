"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { KhungTai } from "@/components/khung/TieuDe";
import { KetQuaHopDoi, type KetQuaHopDoiT } from "@/components/hop-doi/KetQuaHopDoi";
import { NutChiaSe } from "@/components/chia-se/NutChiaSe";
import { useBaiDoc } from "@/lib/bai-doc";
import { postJson } from "@/lib/goi-api";
import { tenGoi, useHoSo } from "@/lib/hoso";
import { batDauDoc, ghi, maMoiTuToken, nhoMaMoi } from "@/lib/do-luong";
import { MocDocXong } from "@/components/khung/CuoiBaiDoc";
import { GopY } from "@/components/khung/GopY";

interface Props { ma: string; tenMoi: string; soMoi: number; tuKhoa: string | null }

export function NhanLoiMoi({ ma, tenMoi, soMoi, tuKhoa }: Props) {
  const hoSo = useHoSo();
  const { kq: baiDoc, loi: loiDoc } = useBaiDoc(hoSo);
  const [kq, setKq] = useState<KetQuaHopDoiT | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    const m = maMoiTuToken(ma);
    nhoMaMoi(m);
    ghi("share_clicked", { kind: "invite", ma_moi: m });
  }, [ma]);

  useEffect(() => {
    if (!baiDoc) return;
    const so = Object.fromEntries(baiDoc.cac_vi_tri.map((v) => [v.vi_tri, v.gia_tri]));
    postJson<KetQuaHopDoiT>("/api/hop-doi/moi", { ma, b: so })
      .then((d) => { setKq(d); ghi("compatibility_created", { kind: "loi_moi", ma_moi: maMoiTuToken(ma) }); batDauDoc("hopdoi", { kind: "loi_moi" }); })
      .catch((e: unknown) => setLoi(e instanceof Error ? e.message : "Chưa tính được lúc này."));
  }, [baiDoc, ma]);

  return (
    <div className="space-y-10">
      <header className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Lời mời hợp đôi</p>
        <h1 className="mt-3 text-4xl sm:text-5xl"><span className="text-gold">{tenMoi}</span> mời bạn xem hai người</h1>
        <div className="mx-auto mt-6 grid size-28 place-items-center rounded-full border border-gold/50 bg-gold/10 shadow-glow">
          <span className="text-gradient-gold font-serif text-6xl" data-testid="so-nguoi-moi">{soMoi}</span>
        </div>
        <p className="mt-3 text-sm text-fg-muted">Số đường đời của {tenMoi}{tuKhoa ? ` — ${tuKhoa}` : ""}</p>
      </header>

      {hoSo === undefined && <KhungTai />}

      {hoSo === null && (
        <Card className="mx-auto max-w-lg">
          <p className="font-serif text-xl">Con số của bạn là gì?</p>
          <p className="mb-5 mt-1 text-sm text-fg-muted">Nhập tên và ngày sinh để mở kết quả hai người — và bài đọc riêng của bạn.</p>
          <NhapHoSo nutGui="Xem hai người" onXong={() => { /* useHoSo cập nhật → tự tính */ }} />
        </Card>
      )}

      {(loi || loiDoc) && <p className="mx-auto max-w-lg rounded-xl bg-cinnabar/10 p-4 text-center text-sm text-cinnabar">{loi ?? loiDoc}</p>}
      {hoSo && !kq && !loi && !loiDoc && <KhungTai dong={2} />}

      {hoSo && kq && (
        <>
          <KetQuaHopDoi kq={kq} tenA={tenMoi} tenB={tenGoi(hoSo)} />
          <div className="mx-auto max-w-3xl"><MocDocXong moDun="hopdoi" them={{ kind: "loi_moi" }} /><GopY moDun="hopdoi" cauHoi="Phần so hai người có giúp bạn hiểu mối quan hệ này hơn?" /></div>
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            <Card className="flex flex-col justify-between">
              <div>
                <p className="font-serif text-lg">Bài đọc riêng của bạn</p>
                <p className="mt-1 text-sm text-fg-muted">Bốn con số cốt lõi: ý nghĩa, thẻ kiểm chứng, cách tính.</p>
              </div>
              <Button asChild className="mt-4"><Link href="/ban-than">Mở hồ sơ của tôi <ArrowRight aria-hidden /></Link></Button>
            </Card>
            {/* HN-2: khép vòng — người mời mở link của bạn là thấy cùng kết quả hai người (họ chưa thấy vì không biết ngày sinh của bạn). */}
            <Card className="border-gold/40" data-testid="gui-lai-loi-moi">
              <p className="font-serif text-lg">Gửi kết quả lại cho {tenMoi}</p>
              <p className="mb-4 mt-1 text-sm text-fg-muted">{tenMoi} chưa thấy kết quả hai người. Gửi link của bạn để {tenMoi} mở ra là thấy — cũng dùng để mời thêm bạn thân, người yêu, đồng nghiệp.</p>
              <NutChiaSe loai="invite" hoSo={hoSo} duongDan={(m) => `/hop-doi/${m}`} nutTao={`Tạo link gửi ${tenMoi}`}
                loiNhan={`${tenGoi(hoSo)} đã xem hợp đôi với bạn — mở link để thấy kết quả hai người.`} />
            </Card>
          </div>
        </>
      )}
      <p className="flex items-center justify-center gap-1.5 text-xs text-fg-faint"><Lock className="size-3.5" aria-hidden /> {tenMoi} không thấy ngày sinh của bạn; bạn cũng không thấy ngày sinh của {tenMoi}.</p>
    </div>
  );
}
