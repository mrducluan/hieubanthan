"use client";
import { useState } from "react";
import { Compass } from "lucide-react";
import { DoHuongDienThoai } from "@/components/huyen-hoc/DoHuongDienThoai";
import { KhaoSatNha } from "@/components/huyen-hoc/KhaoSatNha";
import { KhungChat } from "@/components/hoi/KhungChat";
import { HuyenKhong } from "@/components/huyen-hoc/HuyenKhong";
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
  const [doToa, setDoToa] = useState<number | null>(null);
  const [doHuong, setDoHuong] = useState<number | null>(null);

  // Tiêu đề trang render cả lúc chờ hồ sơ → HTML phía máy chủ có <h1> + mô tả (SEO).
  const dau = <DauMang Icon={Compass} ten="Phong thuỷ" mo_ta="Bát trạch: mệnh quái theo năm sinh (mốc Lập xuân) và giới tính, tám hướng du niên, cửa – chủ – bếp, sao năm. Mục nào là quan niệm dân gian đều ghi rõ; không giới thiệu vật phẩm “hoá giải”." />;
  if (hoSo === undefined) return <div>{dau}<KhungTai /></div>;
  return (
    <div>
      {dau}
      <section aria-label="Mệnh quái" className="mx-auto max-w-3xl space-y-3">
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
      <div className="mx-auto mt-8 max-w-3xl">
        <DoHuongDienThoai sinh={sinh} onChot={(k) => setDoHuong(k.do_huong)} onDungToa={(d) => {
          setDoToa(d);
          document.getElementById("huyen-khong")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }} />
      </div>
      <div className="mx-auto mt-8 max-w-5xl"><KhaoSatNha sinh={sinh} doHuongGoiY={doHuong} /></div>
      <div className="mx-auto mt-8 max-w-3xl scroll-mt-24" id="huyen-khong"><HuyenKhong doToaGoiY={doToa} /></div>

      <section aria-label="Hỏi Phong thuỷ" className="mt-10">
        <h2 className="mb-4 text-2xl sm:text-3xl">Hỏi đáp cùng AI</h2>
          <KhungChat
            moDun="phongthuy"
            loiChao="Hỏi về hướng nhà, bếp, bàn làm việc, năm làm nhà — hoặc một tình huống bố trí cụ thể."
            goiY={GOI_Y}
            nhanO="Câu hỏi Phong thuỷ"
            gui={(cau) => hoiMang("/api/phongthuy/hoi", { cau_hoi: cau, ...(sinh ? { sinh } : {}) })}
          />
      </section>
    </div>
  );
}
