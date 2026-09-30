"use client";
import { Compass } from "lucide-react";
import { KhungChat } from "@/components/hoi/KhungChat";
import { DauMang, XinThemDuLieu } from "@/components/huyen-hoc/KhungMang";
import { LaBan } from "@/components/huyen-hoc/LaBan";
import { KhungTai } from "@/components/khung/TieuDe";
import { usePost } from "@/lib/goi-api";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { hoiMang } from "@/lib/hoi-mang";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";

interface MenhQuai { quai: string; nhom: string; bang_huong: Record<string, string>; huong_cat: string[]; co_canh_bao: { loai: string; chi_tiet: string }[] }

const GOI_Y = [
  { nhom: "Hướng", cau: ["Nhà hướng Nam có hợp với tôi không?", "Hướng bếp nào hợp với tôi?", "Tôi nên kê bàn làm việc hướng nào?"] },
  { nhom: "Năm nay", cau: ["Năm nay tôi làm nhà được không?", "Năm nay sao Ngũ Hoàng ở hướng nào?"] },
  { nhom: "Bố trí", cau: ["Gương đối diện giường có sao không?", "Cửa chính đối cửa sau có sao không?"] },
];

export function PhongThuy() {
  const hoSo = useHoSo();
  const sinh = hoSo?.gioi_tinh ? { birth_date: ngaySinhIso(hoSo), gender: hoSo.gioi_tinh } : null;
  const { data: mq, loi, thuLai } = usePost<MenhQuai>("/api/phongthuy/menh-quai", sinh);

  if (hoSo === undefined) return <KhungTai />;
  return (
    <div>
      <DauMang Icon={Compass} ten="Phong thuỷ" mo_ta="Bát trạch: mệnh quái theo năm sinh (mốc Lập xuân) và giới tính, tám hướng du niên, cửa – chủ – bếp, sao năm. Mục nào là quan niệm dân gian đều ghi rõ; không giới thiệu vật phẩm “hoá giải”." />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
        <section aria-label="Mệnh quái" className="min-w-0 space-y-3">
          {!sinh && <XinThemDuLieu hoSo={hoSo} can="gioi_tinh" nut="Thêm giới tính" ly_do="Mệnh quái tính theo năm sinh và giới tính. Câu hỏi bố trí chung thì không cần." />}
          {sinh && !mq && !loi && <KhungTai dong={2} />}
          {loi && <BaoLoi loi={loi} thuLai={thuLai} />}
          {mq && (
            <div className="glass rounded-2xl p-5" data-testid="menh-quai">
              <p className="text-center text-sm text-fg-muted">Mệnh quái của bạn: <b className="text-gold">{mq.quai}</b> · {mq.nhom}</p>
              <LaBan quai={mq.quai} nhom={mq.nhom} bang={mq.bang_huong} huongCat={mq.huong_cat} />
              {mq.co_canh_bao.map((c) => <p key={c.loai} className="mt-3 text-xs text-moon">{c.chi_tiet}</p>)}
            </div>
          )}
        </section>
        <section aria-label="Hỏi Phong thuỷ" className="min-w-0 lg:sticky lg:top-24">
          <KhungChat
            moDun="phongthuy"
            loiChao="Hỏi về hướng nhà, bếp, bàn làm việc, năm làm nhà — hoặc một tình huống bố trí cụ thể."
            goiY={GOI_Y}
            nhanO="Câu hỏi Phong thuỷ"
            gui={(cau) => hoiMang("/api/phongthuy/hoi", { cau_hoi: cau, ...(sinh ? { sinh } : {}) })}
          />
        </section>
      </div>
    </div>
  );
}
