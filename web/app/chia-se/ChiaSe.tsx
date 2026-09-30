"use client";
import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { TheDanhTinh } from "@/components/than-so/TheDanhTinh";
import { NutChiaSe } from "@/components/chia-se/NutChiaSe";
import { useBaiDoc } from "@/lib/bai-doc";
import { tenGoi, useHoSo } from "@/lib/hoso";

// Thẻ Metaphysics ID để khoe (danh tính, không phải kết quả) — không lộ ngày sinh.
export function ChiaSe() {
  const hoSo = useHoSo();
  const { kq } = useBaiDoc(hoSo);
  const [ma, setMa] = useState<string | null>(null);

  if (hoSo === undefined) return <KhungTai />;
  if (hoSo === null) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <p className="text-fg-muted">Bạn chưa có hồ sơ để chia sẻ.</p>
        <Button asChild className="mt-4"><Link href="/">Tạo hồ sơ</Link></Button>
      </div>
    );
  }
  if (!kq) return <KhungTai dong={2} />;

  return (
    <div className="mx-auto max-w-4xl">
      <TieuDeMuc nho="Chia sẻ" lon="Thẻ hồ sơ của bạn"
        mo_ta="Bạn bè bấm link sẽ thấy thẻ này và có thể tự xem con số của họ. Thẻ không có ngày sinh." />
      <div className="grid items-start gap-6 md:grid-cols-2">
        <TheDanhTinh kq={kq} tenHienThi={hoSo.ho_ten} />
        <Card>
          <NutChiaSe loai="card" hoSo={hoSo} duongDan={(m) => `/the/${m}`} nutTao="Tạo link thẻ" onDaTao={setMa}
            loiNhan={`Con số đường đời của ${tenGoi(hoSo)} là ${kq.cac_vi_tri[0]?.gia_tri}. Còn bạn?`} />
          {ma && (
            <Button asChild variant="outline" className="mt-3 w-full">
              <a href={`/og?ma=${encodeURIComponent(ma)}`} download="the-hieu-ban-than.png"><Download aria-hidden /> Tải ảnh thẻ (đăng story)</a>
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
