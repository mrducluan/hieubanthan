"use client";
import { useState } from "react";
import { useChuChung } from "@/components/cms/ChuChung";
import { useNguoiDung } from "@/lib/tai-khoan";
import { useMaCuaToi } from "@/lib/sao";
import { DongThuongMoi } from "@/components/chia-se/DongThuongMoi";
import { BangGui, NutRuBan } from "@/components/chia-se/HopChiaSe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hoTenList, tenGoi, type HoSo } from "@/lib/hoso";
import { postJson } from "@/lib/goi-api";
import { docQuyUocDD } from "@/lib/quy-uoc-dd";
import { ghi, maMoiTuToken } from "@/lib/do-luong";

interface Props {
  hoSo: HoSo;
  /** Đường dẫn từ mã: vd (ma) => `/hop-doi/${ma}`. */
  duongDan: (ma: string) => string;
  nutTao: string;
  /** Loại chia sẻ cho đo lường. */
  loai: "invite" | "card";
  loiNhan: string;
  onDaTao?: (ma: string) => void;
}

// Tạo link có ký (chỉ tên hiển thị + con số), rồi gửi qua hộp chia sẻ chung (BangGui — HCS-1).
export function NutChiaSe({ hoSo, duongDan, nutTao, loai, loiNhan, onDaTao }: Props) {
  const [ten, setTen] = useState(tenGoi(hoSo));
  const [gui, setGui] = useState<{ link: string; ma: string; so: number | null; tuKhoa: string | null } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const c = useChuChung();
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));

  async function tao() {
    setDang(true); setLoi(null);
    try {
      const { ma, duong_doi, tu_khoa } = await postJson<{ ma: string; duong_doi?: number | null; tu_khoa?: string | null }>("/api/chia-se/tao", {
        ten_hien_thi: ten.trim() || tenGoi(hoSo), ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam,
        quy_uoc_duong_doi: docQuyUocDD(),
      });
      const u = new URL(duongDan(ma), window.location.origin);
      if (maCuaToi) u.searchParams.set("gt", maCuaToi);   // người được mời tạo tài khoản → cả hai nhận Sao
      setGui({ link: u.toString(), ma, so: duong_doi ?? null, tuKhoa: tu_khoa ?? null });
      ghi("share_created", { kind: loai, ma_moi: maMoiTuToken(ma), co_ma: Boolean(maCuaToi) });
      onDaTao?.(ma);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được link.");
    } finally {
      setDang(false);
    }
  }

  if (!gui) {
    const cta = CTA_CHIA_SE[loai];
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="ten-hien-thi">{c("chia_se.ten_link")}</Label>
          <Input id="ten-hien-thi" value={ten} maxLength={40} onChange={(e) => setTen(e.target.value)} />
        </div>
        <p className="text-xs text-fg-faint">Link chỉ hiện tên hiển thị và các con số của bạn — không có ngày sinh. Hết hạn sau 90 ngày.</p>
        {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
        <NutRuBan nhan={dang ? c("chia_se.dang_tao") : nutTao} phu={cta.phu} dang={dang} onClick={() => void tao()} className="w-full" testId="tao-link-chia-se" />
        <DongThuongMoi dangNhap={nguoiDung === undefined ? undefined : Boolean(nguoiDung)} />
      </div>
    );
  }
  const anh = `/og?ma=${encodeURIComponent(gui.ma)}${loai === "invite" ? "&kieu=moi" : ""}`;
  return (
    <BangGui kind={loai} url={gui.link} tu={maMoiTuToken(gui.ma)} tieuDe="Hiểu Bản Thân" anh={anh} anhDoc={`${anh}&khung=doc`}
      tenTep={loai === "invite" ? "loi-moi-hop-doi.png" : "the-hieu-ban-than.png"}
      loiNhan={[...loiNhanThe(loai, { so: gui.so, tuKhoa: gui.tuKhoa }), ...(loiNhan ? [{ ma: `${loai}.trang`, chu: loiNhan }] : [])]}>
      <DongThuongMoi dangNhap={nguoiDung === undefined ? undefined : Boolean(nguoiDung)} />
    </BangGui>
  );
}
