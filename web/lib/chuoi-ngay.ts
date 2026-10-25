// SAO-V (migration 0025, phần 4) — chuỗi ngày ghé trên "Hôm nay". Kiểu trả về của /api/sao/chuoi + lời hiển thị.
// Hàm thuần (không React, không Supabase) để trang và e2e dùng chung. Giọng: mời ghé, không doạ, không phạt khi mất chuỗi.
import type { DiemDanh } from "@/lib/sao";

/** /api/sao/chuoi (POST): chưa bật tài khoản · khách (công tắc + mức để mời đăng nhập) · đã đăng nhập (kết quả diem_danh). */
export type TrangThaiChuoi =
  | { tai_khoan: false }
  | { tai_khoan: true; dang_nhap: false; bat: boolean; moc: number; sao_moc: number }
  | ({ tai_khoan: true; dang_nhap: true; san_sang: true } & DiemDanh)
  | { tai_khoan: true; dang_nhap: true; san_sang: false };

export interface LoiChuoi {
  /** Dòng chính: "Bạn ghé N ngày liên tiếp" / ngày đầu / bắt đầu lại. */
  chinh: string;
  /** "dài nhất D ngày" — chỉ khi có số máy chủ. */
  dai_nhat: string | null;
  /** "Còn K ngày nữa tới mốc M ngày: +S Sao" — chỉ khi thưởng đang bật. */
  moc: string | null;
  /** Lời chúc khi vừa nhận Sao. */
  chuc_mung: string | null;
  bat_dau_lai: boolean;
}

export const CAU_BAT_DAU_LAI = "Bắt đầu lại từ hôm nay — không sao cả.";
export const CAU_NGAY_DAU = "Ngày đầu tiên của chuỗi — mai ghé tiếp nhé";

/** Lời cho chuỗi đếm trên máy (khách, hoặc khi máy chủ chưa sẵn sàng). `batDauLai` = có chuỗi cũ nhưng đã cách quãng. */
export function loiChuoiMay(chuoi: number, batDauLai: boolean): LoiChuoi {
  const chinh = chuoi > 1 ? `Bạn ghé ${chuoi} ngày liên tiếp` : batDauLai ? CAU_BAT_DAU_LAI : CAU_NGAY_DAU;
  return { chinh, dai_nhat: null, moc: null, chuc_mung: null, bat_dau_lai: chuoi <= 1 && batDauLai };
}

/** Lời cho chuỗi máy chủ (diem_danh). Mất chuỗi = chuỗi 1 mà dài nhất > 1: câu trung tính, giữ kỷ lục cũ. */
export function loiChuoiMayChu(d: DiemDanh): LoiChuoi {
  const batDauLai = d.chuoi <= 1 && d.dai_nhat > 1;
  const chinh = d.chuoi > 1 ? `Bạn ghé ${d.chuoi} ngày liên tiếp` : batDauLai ? CAU_BAT_DAU_LAI : CAU_NGAY_DAU;
  const daiNhat = d.dai_nhat > 1 ? `dài nhất ${d.dai_nhat} ngày` : null;
  let moc: string | null = null;
  if (d.bat && d.sao_moc > 0 && d.moc > 0 && d.con_ngay > 0) {
    moc = `Còn ${d.con_ngay} ngày nữa tới mốc ${d.chuoi + d.con_ngay} ngày: +${d.sao_moc} Sao`;
  }
  const chucMung = d.sao > 0 ? `+${d.sao} Sao vào ví — cảm ơn bạn ghé đều ${d.chuoi} ngày.` : null;
  return { chinh, dai_nhat: daiNhat, moc, chuc_mung: chucMung, bat_dau_lai: batDauLai };
}

/** Dòng mời khách đăng nhập; phần Sao chỉ khi công tắc thưởng bật và mức > 0. */
export function loiMoiKhach(t: { bat: boolean; moc: number; sao_moc: number }): string {
  const sao = t.bat && t.sao_moc > 0 && t.moc > 0 ? ` và nhận ${t.sao_moc} Sao mỗi ${t.moc} ngày` : "";
  return `Đăng nhập để giữ chuỗi trên mọi máy${sao}.`;
}
