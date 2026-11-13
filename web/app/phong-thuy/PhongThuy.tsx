"use client";
import { useChu } from "@/components/cms/DauCms";
import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { DoHuongDienThoai } from "@/components/huyen-hoc/DoHuongDienThoai";
import { HanhTrinhNha } from "@/components/huyen-hoc/HanhTrinhNha";
import { KhaoSatNha } from "@/components/huyen-hoc/KhaoSatNha";
import { KhungChat } from "@/components/hoi/KhungChat";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { HuyenKhong } from "@/components/huyen-hoc/HuyenKhong";
import { NhaCuaBan } from "@/components/huyen-hoc/NhaCuaBan";
import { DauMang, XinThemDuLieu } from "@/components/huyen-hoc/KhungMang";
import { ChipPhai, DongPhai, KhungPhai, type MocNam } from "@/components/huyen-hoc/KhungPhai";
import { LaBan } from "@/components/huyen-hoc/LaBan";
import { KhungTai } from "@/components/khung/TieuDe";
import { usePost } from "@/lib/goi-api";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { hoiMang } from "@/lib/hoi-mang";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { nhaGui, useHoSoNha } from "@/lib/ho-so-nha";
import { ChanQr } from "@/components/khung/ChanQr";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { TenHienProvider } from "@/components/khung/TenHien";
import type { TenHien } from "@/lib/ten-hien";

interface MenhQuai {
  quai: string; nhom: string; nam_tinh: number; bang_huong: Record<string, string>; huong_cat: string[];
  co_canh_bao: { loai: string; chi_tiet: string }[];
  /** TP-LICH: engine tính cả ba mốc đầu năm để người dùng thấy đổi mốc có làm khác mệnh quái không. */
  so_sanh_moc?: Record<MocNam, { quai: string; nhom: string; nam_tinh: number }>; moc_khac?: boolean;
  /** UI-PT 1: nghĩa + "dùng cho" của 8 du niên (KB) cho la bàn sống. */
  du_nien_y?: Record<string, { loai: string; y_nghia: string; dung_cho: string }>;
  ten_hien?: TenHien;
}

const MOC: MocNam[] = ["lap_xuan", "tet_viet", "tet_trung"];

/** Câu gợi ý hỏi đáp — chữ ở bảng lib/chu/phong-thuy.ts (bản Anh: câu đã thử định tuyến đúng chủ đề ở engine). */
const GOI_Y_KHOA = [
  { nhom: "hoi.nhom_huong", cau: ["hoi.huong_1", "hoi.huong_2", "hoi.huong_3"] },
  { nhom: "hoi.nhom_nam", cau: ["hoi.nam_1", "hoi.nam_2"] },
  { nhom: "hoi.nhom_bo_tri", cau: ["hoi.bo_tri_1", "hoi.bo_tri_2"] },
];

export function PhongThuy() {
  const hoSo = useHoSo();
  const c = useChu();
  const { c: t, en, quai, nhom } = useChuPT();
  const TEN_MOC = (m: MocNam) => t(`moc.${m}`);
  const GOI_Y = GOI_Y_KHOA.map((g) => ({ nhom: t(g.nhom), cau: g.cau.map((k) => t(k)) }));
  const [mocNam, setMocNam] = useState<MocNam>("lap_xuan");
  // TP-LICH: mốc đầu năm đi theo mọi lời gọi (mệnh quái, đo hướng, khảo sát nhà, hỏi đáp) — engine tính lại.
  const sinh = hoSo?.gioi_tinh
    ? { birth_date: ngaySinhIso(hoSo), gender: hoSo.gioi_tinh, ...(mocNam !== "lap_xuan" ? { moc_nam: mocNam } : {}) }
    : null;
  const { data: mq, loi, thuLai } = usePost<MenhQuai>("/api/phongthuy/menh-quai", sinh);
  // TP-GON: giữ bảng so ba mốc của lần tính trước trong lúc engine tính lại (đổi mốc) — dòng nhắc trong khung trường phái
  // không chớp tắt, các nút chọn không nhảy chỗ ngay lúc vừa bấm. So sánh ba mốc chỉ phụ thuộc ngày sinh, không phụ thuộc mốc đang chọn.
  const khoaSinh = sinh ? `${sinh.birth_date}|${sinh.gender}` : null;
  const [mqTruoc, setMqTruoc] = useState<{ khoa: string; mq: MenhQuai } | null>(null);
  useEffect(() => { if (mq && khoaSinh) setMqTruoc({ khoa: khoaSinh, mq }); }, [mq, khoaSinh]);
  const ss = mq ?? (mqTruoc && mqTruoc.khoa === khoaSinh ? mqTruoc.mq : null);
  const [doToa, setDoToa] = useState<number | null>(null);
  const [doHuong, setDoHuong] = useState<number | null>(null);
  // Y6: hỏi đáp đọc hồ sơ nhà trên máy (hướng + bố cục) → "bếp nhà tôi có sao không?" trả lời theo đúng nhà; không lưu.
  const hoSoNha = useHoSoNha();
  const nhaHoi = hoSoNha && (hoSoNha.huong_do != null || hoSoNha.huong || hoSoNha.bo_cuc) ? nhaGui(hoSoNha).nha : null;

  useBatDauDoc("phongthuy", Boolean(mq));
  // Tiêu đề trang render cả lúc chờ hồ sơ → HTML phía máy chủ có <h1> + mô tả (SEO).
  const dau = <DauMang Icon={Compass} hinh="phong-thuy" ten={t("dau.ten")} mo_ta={t("dau.mo_ta")} />;
  if (hoSo === undefined) return <div>{dau}<KhungTai /></div>;
  return (
    <TenHienProvider ten={[mq?.ten_hien ?? ss?.ten_hien]}>
    <div>
      {dau}
      <div className="mx-auto mb-6 max-w-3xl"><HanhTrinhNha mq={mq ? { quai: mq.quai, nhom: mq.nhom } : null} coSinh={Boolean(sinh)} sinh={sinh} /></div>
      <section aria-label={t("aria.menh_quai")} id="menh-quai" className="mx-auto max-w-3xl scroll-mt-24 space-y-3">
          {!sinh && <XinThemDuLieu hoSo={hoSo} can="gioi_tinh" nut={t("xin.nut")} ly_do={t("xin.ly_do")} />}
          {sinh && !mq && !loi && <KhungTai dong={2} />}
          {loi && <BaoLoi loi={loi} thuLai={thuLai} />}
          {/* TP-GON: đóng chỉ còn chip mốc đang dùng; nhắc riêng khi ngày sinh nằm giữa các mốc (mệnh quái đổi theo mốc). */}
          {sinh && (
            <KhungPhai testId="truong-phai-phong-thuy"
              tomTat={<ChipPhai ds={[{ nhan: t("phai.chip", { moc: TEN_MOC(mocNam) }), khac: mocNam !== "lap_xuan" }]} />}
              nhac={ss?.moc_khac ? t("phai.nhac") : undefined}
              moTa={<ChuB chu={t("phai.mo_ta")} lop="text-fg" />}>
              <DongPhai ten={t("phai.ten")} nhan={t("phai.nhan")} giaTri={mocNam} doi={setMocNam}
                luaChon={MOC.map((m) => [m, t(`moc.chon_${m}`)] as [MocNam, string])}
                noiBat={!!ss?.moc_khac} nhanNoiBat={t("phai.ap_dung")}
                goiY={ss?.so_sanh_moc
                  ? (ss.moc_khac
                    ? <>{t("phai.khac")}{MOC.map((k, i) => <span key={k}>{i > 0 && " · "}{TEN_MOC(k)}: <b>{quai(ss.so_sanh_moc![k].quai)}</b></span>)}.</>
                    : <ChuB chu={t("phai.cung", { quai: quai(ss.quai) })} />)
                  : t("phai.dang_tinh")} />
            </KhungPhai>
          )}
          {mq && (
            <div className="glass rounded-2xl p-5" data-testid="menh-quai">
              <p className="text-center text-sm text-fg-muted">{t("mq.truoc")}<b className="text-gold">{quai(mq.quai)}</b>{t("mq.sau", { nhom: nhom(mq.nhom), nam: String(mq.nam_tinh), moc: TEN_MOC(mocNam) })}</p>
              <LaBan quai={mq.quai} nhom={mq.nhom} bang={mq.bang_huong} huongCat={mq.huong_cat} />
              <ChanQr nhan={t("mq.qr")} />
              {mq.co_canh_bao.map((c) => <p key={c.loai} className="mt-3 text-xs text-moon">{c.chi_tiet}</p>)}
            </div>
          )}
      </section>
      <div className="mx-auto mt-8 max-w-3xl">
        <DoHuongDienThoai sinh={sinh} laBan={mq ? { quai: mq.quai, bang: mq.bang_huong, huongCat: mq.huong_cat, duNienY: mq.du_nien_y } : null}
          onChot={(k) => setDoHuong(k.do_huong)} onDungToa={(d) => {
          setDoToa(d);
          document.getElementById("huyen-khong")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }} />
      </div>
      <div className="mx-auto mt-8 max-w-3xl scroll-mt-24" id="nha-cua-ban"><NhaCuaBan sinh={sinh} doHuongGoiY={doHuong} /></div>
      <div className="mx-auto mt-8 max-w-5xl scroll-mt-24" id="khao-sat-nha"><KhaoSatNha sinh={sinh} doHuongGoiY={doHuong} /></div>
      <div className="mx-auto mt-8 max-w-3xl scroll-mt-24" id="huyen-khong"><HuyenKhong doToaGoiY={doToa} /></div>
      {/* EN-ALL: bản Anh chưa có lối đi chéo mảng → bỏ khối CTA, giữ mốc đọc xong + góp ý (như Bát tự, Tử vi). */}
      {mq && <div className="mx-auto max-w-3xl"><CuoiBaiDoc moDun="phongthuy" cauHoi={t("cuoi.cau_hoi")} maYDinh="nha_cua" khongCta={en} /></div>}

      <section aria-label={t("aria.hoi")} className="mt-10">
        <h2 className="mb-4 text-2xl sm:text-3xl">{c("hoi.tieu_de") || t("hoi.tieu_de")}</h2>
          <KhungChat
            moDun="phongthuy"
            loiChao={nhaHoi ? t("hoi.loi_chao_nha") : t("hoi.loi_chao")}
            goiY={GOI_Y}
            nhanO={t("hoi.nhan_o")}
            gui={(cau) => hoiMang("/api/phongthuy/hoi", { cau_hoi: cau, ...(sinh ? { sinh } : {}), ...(nhaHoi ? { nha: nhaHoi } : {}) })}
          />
      </section>
    </div>
    </TenHienProvider>
  );
}
