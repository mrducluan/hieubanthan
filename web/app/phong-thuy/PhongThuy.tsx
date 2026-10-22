"use client";
import { useChu } from "@/components/cms/DauCms";
import { useState } from "react";
import { Compass } from "lucide-react";
import { DoHuongDienThoai } from "@/components/huyen-hoc/DoHuongDienThoai";
import { KhaoSatNha } from "@/components/huyen-hoc/KhaoSatNha";
import { KhungChat } from "@/components/hoi/KhungChat";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { HuyenKhong } from "@/components/huyen-hoc/HuyenKhong";
import { NhaCuaBan } from "@/components/huyen-hoc/NhaCuaBan";
import { DauMang, XinThemDuLieu } from "@/components/huyen-hoc/KhungMang";
import { DongPhai, KhungPhai, type MocNam } from "@/components/huyen-hoc/KhungPhai";
import { LaBan } from "@/components/huyen-hoc/LaBan";
import { KhungTai } from "@/components/khung/TieuDe";
import { usePost } from "@/lib/goi-api";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { hoiMang } from "@/lib/hoi-mang";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";

interface MenhQuai {
  quai: string; nhom: string; nam_tinh: number; bang_huong: Record<string, string>; huong_cat: string[];
  co_canh_bao: { loai: string; chi_tiet: string }[];
  /** TP-LICH: engine tính cả ba mốc đầu năm để người dùng thấy đổi mốc có làm khác mệnh quái không. */
  so_sanh_moc?: Record<MocNam, { quai: string; nhom: string; nam_tinh: number }>; moc_khac?: boolean;
}

const TEN_MOC: Record<MocNam, string> = { lap_xuan: "Lập xuân", tet_viet: "Tết (lịch Việt)", tet_trung: "Tết (lịch Trung Quốc)" };

const GOI_Y = [
  { nhom: "Hướng", cau: ["Nhà hướng Nam có hợp với tôi không?", "Hướng bếp nào hợp với tôi?", "Tôi nên kê bàn làm việc hướng nào?"] },
  { nhom: "Năm nay", cau: ["Năm nay tôi làm nhà được không?", "Năm nay sao Ngũ Hoàng ở hướng nào?"] },
  { nhom: "Bố trí", cau: ["Gương đối diện giường có sao không?", "Cửa chính đối cửa sau có sao không?"] },
];

export function PhongThuy() {
  const hoSo = useHoSo();
  const c = useChu();
  const [mocNam, setMocNam] = useState<MocNam>("lap_xuan");
  // TP-LICH: mốc đầu năm đi theo mọi lời gọi (mệnh quái, đo hướng, khảo sát nhà, hỏi đáp) — engine tính lại.
  const sinh = hoSo?.gioi_tinh
    ? { birth_date: ngaySinhIso(hoSo), gender: hoSo.gioi_tinh, ...(mocNam !== "lap_xuan" ? { moc_nam: mocNam } : {}) }
    : null;
  const { data: mq, loi, thuLai } = usePost<MenhQuai>("/api/phongthuy/menh-quai", sinh);
  const [doToa, setDoToa] = useState<number | null>(null);
  const [doHuong, setDoHuong] = useState<number | null>(null);

  useBatDauDoc("phongthuy", Boolean(mq));
  // Tiêu đề trang render cả lúc chờ hồ sơ → HTML phía máy chủ có <h1> + mô tả (SEO).
  const dau = <DauMang Icon={Compass} ten="Phong thuỷ" mo_ta="Nhà bạn đang ở — hay căn định mua — có hợp bạn không, và nếu chỉ kê lại một món đồ thì kê gì? Nhập năm sinh, đo hướng cửa bằng điện thoại, trang đọc cho bạn bằng lời thường: bạn hợp phía nào, từng phòng nên đặt gì, tháng nào nên sửa. Phần sách vở (du niên, phi tinh) gập lại cho ai muốn mở. Không giới thiệu vật phẩm “hoá giải”." />;
  if (hoSo === undefined) return <div>{dau}<KhungTai /></div>;
  return (
    <div>
      {dau}
      <section aria-label="Mệnh quái" className="mx-auto max-w-3xl space-y-3">
          {!sinh && <XinThemDuLieu hoSo={hoSo} can="gioi_tinh" nut="Thêm giới tính" ly_do="Mệnh quái tính theo năm sinh và giới tính. Câu hỏi bố trí chung thì không cần." />}
          {sinh && !mq && !loi && <KhungTai dong={2} />}
          {loi && <BaoLoi loi={loi} thuLai={thuLai} />}
          {sinh && (
            <KhungPhai testId="truong-phai-phong-thuy" moTa={<>Bát trạch tính mệnh quái theo năm sinh; sách khác nhau lấy mốc đầu năm khác nhau. Mặc định <b className="text-fg">Lập xuân</b> (tiết khí, khoảng 4/2 dương lịch); dân gian Việt hay lấy <b className="text-fg">Tết âm lịch</b>. Đổi mốc, engine tính lại cả trang (hướng, đo hướng, khảo sát nhà, hỏi đáp).</>}>
              <DongPhai ten="Mốc đầu năm" nhan="Mốc đầu năm tính mệnh quái" giaTri={mocNam} doi={setMocNam}
                luaChon={[["lap_xuan", "Lập xuân"], ["tet_viet", "Tết lịch Việt"], ["tet_trung", "Tết lịch Trung Quốc"]]}
                noiBat={!!mq?.moc_khac}
                goiY={mq?.so_sanh_moc
                  ? (mq.moc_khac
                    ? <>Ngày sinh của bạn nằm giữa các mốc nên mệnh quái KHÁC nhau: {(Object.keys(TEN_MOC) as MocNam[]).map((k, i) => <span key={k}>{i > 0 && " · "}{TEN_MOC[k]}: <b>{mq.so_sanh_moc![k].quai}</b></span>)}.</>
                    : <>Ba mốc cho cùng mệnh quái <b>{mq.quai}</b> với ngày sinh của bạn — đổi mốc không làm khác kết quả.</>)
                  : "Engine sẽ cho biết đổi mốc có làm khác mệnh quái của bạn không."} />
            </KhungPhai>
          )}
          {mq && (
            <div className="glass rounded-2xl p-5" data-testid="menh-quai">
              <p className="text-center text-sm text-fg-muted">Mệnh quái của bạn: <b className="text-gold">{mq.quai}</b> · {mq.nhom} · tính theo năm {mq.nam_tinh} ({TEN_MOC[mocNam]})</p>
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
      <div className="mx-auto mt-8 max-w-3xl scroll-mt-24" id="nha-cua-ban"><NhaCuaBan sinh={sinh} doHuongGoiY={doHuong} /></div>
      <div className="mx-auto mt-8 max-w-5xl scroll-mt-24" id="khao-sat-nha"><KhaoSatNha sinh={sinh} doHuongGoiY={doHuong} /></div>
      <div className="mx-auto mt-8 max-w-3xl scroll-mt-24" id="huyen-khong"><HuyenKhong doToaGoiY={doToa} /></div>
      {mq && <div className="mx-auto max-w-3xl"><CuoiBaiDoc moDun="phongthuy" cauHoi="Phần hướng nhà và bố trí có giúp ích cho bạn?" maYDinh="nha_cua" /></div>}

      <section aria-label="Hỏi Phong thuỷ" className="mt-10">
        <h2 className="mb-4 text-2xl sm:text-3xl">{c("hoi.tieu_de") || "Hỏi đáp cùng AI"}</h2>
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
