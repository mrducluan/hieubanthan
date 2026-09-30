"use client";
import { Layers } from "lucide-react";
import { KhungChat } from "@/components/hoi/KhungChat";
import { DauMang, XinThemDuLieu } from "@/components/huyen-hoc/KhungMang";
import { TuTru, type LaSoBatTu } from "@/components/huyen-hoc/TuTru";
import { KhungTai } from "@/components/khung/TieuDe";
import { usePost } from "@/lib/goi-api";
import { hoiMang } from "@/lib/hoi-mang";
import { laSoTuHoSo, useHoSo } from "@/lib/hoso";

const GOI_Y = [
  { nhom: "Lá số", cau: ["Dụng thần của tôi là gì?", "Tôi thân vượng hay thân nhược?", "Ngũ hành của tôi thiếu gì?"] },
  { nhom: "Vận", cau: ["Đại vận hiện tại của tôi là gì?", "Năm nay với tôi thế nào?"] },
  { nhom: "Kiến thức", cau: ["Nhật chủ Giáp là người thế nào?", "Thập thần là gì?"] },
];

export function BatTu() {
  const hoSo = useHoSo();
  const laSo = laSoTuHoSo(hoSo);
  const { data: ls, loi } = usePost<LaSoBatTu>("/api/battu/la-so", laSo);

  if (hoSo === undefined) return <KhungTai />;
  return (
    <div>
      <DauMang Icon={Layers} ten="Bát tự" mo_ta="Tứ trụ năm – tháng – ngày – giờ theo tiết khí, ngũ hành chấm theo thang điểm công bố, dụng thần luôn trình bày hai cách để bạn tự cân nhắc." />
      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section aria-label="Tứ trụ" className="min-w-0 space-y-3">
          {!laSo && <XinThemDuLieu hoSo={hoSo} ly_do="Tứ trụ cần giờ sinh và giới tính. Giờ sinh càng chính xác càng tốt nếu bạn sinh gần ngày chuyển tiết." />}
          {laSo && !ls && !loi && <KhungTai dong={4} />}
          {loi && <p className="rounded-xl bg-cinnabar/10 p-4 text-sm text-cinnabar">{loi}</p>}
          {ls && (
            <div className="glass rounded-2xl p-5" data-testid="tu-tru">
              <TuTru ls={ls} namNay={new Date().getFullYear()} />
              {ls.co_canh_bao.map((c) => <p key={c.loai} className="mt-3 text-xs text-moon">{c.chi_tiet}</p>)}
            </div>
          )}
        </section>
        <section aria-label="Hỏi Bát tự" className="min-w-0 lg:sticky lg:top-24">
          <KhungChat
            moDun="battu"
            loiChao={laSo ? "Hỏi về dụng thần, ngũ hành, đại vận hay một năm cụ thể." : "Hỏi kiến thức chung về nhật chủ, thập thần — hoặc bổ sung giờ sinh để hỏi về tứ trụ của bạn."}
            goiY={GOI_Y}
            nhanO="Câu hỏi Bát tự"
            gui={(cau) => hoiMang("/api/battu/hoi", { cau_hoi: cau, ...(laSo ? { la_so: laSo } : {}) })}
          />
        </section>
      </div>
    </div>
  );
}
