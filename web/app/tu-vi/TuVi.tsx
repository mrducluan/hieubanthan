"use client";
import { useState } from "react";
import { Orbit } from "lucide-react";
import type { LaSoOutputT } from "@/app/api/tuvi/schema";
import { KhungChat } from "@/components/hoi/KhungChat";
import { DauMang, XinThemDuLieu } from "@/components/huyen-hoc/KhungMang";
import { LaSoTuVi } from "@/components/huyen-hoc/LaSoTuVi";
import { KhungTai } from "@/components/khung/TieuDe";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePost } from "@/lib/goi-api";
import { hoiMang, type HoiMangRes } from "@/lib/hoi-mang";
import { laSoTuHoSo, useHoSo } from "@/lib/hoso";

const GOI_Y = [
  { nhom: "Lá số", cau: ["Cung Mệnh của tôi nói gì về tính cách?", "Cung Quan Lộc của tôi nói gì về sự nghiệp?", "Cung Phu Thê của tôi thế nào?"] },
  { nhom: "Hạn", cau: ["Đại hạn hiện tại của tôi là chủ đề gì?", "Năm nay lưu niên của tôi thế nào?"] },
  { nhom: "Kiến thức", cau: ["Tứ hoá là gì?", "Tham Lang ở cung Quan Lộc có ý nghĩa gì?"] },
];

export function TuVi() {
  const hoSo = useHoSo();
  const laSo = laSoTuHoSo(hoSo);
  const { data: ls, loi } = usePost<LaSoOutputT>("/api/tuvi/la-so", laSo);
  const [cheDo, setCheDo] = useState<"tham_khao" | "chi_tiet">("tham_khao");
  const [cauNgoai, setCauNgoai] = useState<{ cau: string; lan: number } | null>(null);

  if (hoSo === undefined) return <KhungTai />;
  return (
    <div>
      <DauMang Icon={Orbit} ten="Tử vi" mo_ta="Lá số an cục bộ bằng iztro (ngày sinh không gửi ra ngoài). Hạn đọc theo thứ tự đại hạn › lưu niên › tiểu hạn. Không phán bệnh, tai nạn hay sống chết." />
      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section aria-label="Lá số" className="min-w-0 space-y-3">
          {!laSo && <XinThemDuLieu hoSo={hoSo} ly_do="Để an lá số cần giờ sinh và giới tính (sinh trước 13/6/1975 cần thêm nơi sinh). Bạn vẫn hỏi được câu kiến thức chung ở khung bên cạnh." />}
          {laSo && !ls && !loi && <KhungTai dong={4} />}
          {loi && <p className="rounded-xl bg-cinnabar/10 p-4 text-sm text-cinnabar">{loi}</p>}
          {ls && (
            <>
              <LaSoTuVi ls={ls} onChonCung={(ten) => setCauNgoai({ cau: `Cung ${ten} của tôi nói gì?`, lan: Date.now() })} />
              <p className="text-xs text-fg-faint">Bấm vào một cung để hỏi về cung đó. {ls.co_canh_bao.map((c) => c.chi_tiet).join(" ")}</p>
            </>
          )}
        </section>
        <section aria-label="Hỏi Tử vi" className="min-w-0 lg:sticky lg:top-24">
          <KhungChat
            loiChao={laSo ? "Hỏi về một cung, một sao, hoặc hạn hiện tại của bạn." : "Hỏi kiến thức chung về cung, sao, tứ hoá — hoặc bổ sung giờ sinh để hỏi về lá số của bạn."}
            goiY={GOI_Y}
            cauNgoai={cauNgoai}
            nhanO="Câu hỏi Tử vi"
            dieuKhien={
              <Tabs value={cheDo} onValueChange={(v) => setCheDo(v as "tham_khao" | "chi_tiet")}>
                <TabsList aria-label="Chế độ đọc">
                  <TabsTrigger value="tham_khao">Tham khảo</TabsTrigger>
                  <TabsTrigger value="chi_tiet">Chi tiết</TabsTrigger>
                </TabsList>
              </Tabs>
            }
            gui={(cau) => hoiMang<HoiMangRes & { phan_loai?: { cung?: string[] } }>(
              "/api/tuvi/hoi",
              { cau_hoi: cau, che_do: cheDo, ...(laSo ? { la_so: laSo } : {}) },
              (d) => d.phan_loai?.cung?.length ? <p className="text-xs text-moon">Cung xem: {d.phan_loai.cung.join(", ")}</p> : null,
            )}
          />
        </section>
      </div>
    </div>
  );
}
