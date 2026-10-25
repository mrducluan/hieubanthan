"use client";
// SAO-V — mức thưởng Sao đang áp dụng (GET /api/sao/muc, cache 60 giây) + câu chữ nói rõ điều kiện mời bạn / hoa hồng.
// Câu chữ là hàm THUẦN (không Supabase) để test e2e gọi thẳng. Số thật vẫn do hàm SQL quyết — ở đây chỉ để hiển thị.
import { useEffect, useState } from "react";

export interface HoaHongMuc { bat: boolean; phan_tram: number; so_don: number; thang: number }
export interface MucSao { moi_ban: number; duoc_moi: number; chao_mung: number; tran: number; hoa_hong: HoaHongMuc }

/** Mặc định = mặc định trong lib/cau-hinh.ts (hoa hồng tắt) — dùng khi mạng lỗi. */
export const MUC_MAC_DINH: MucSao = {
  moi_ban: 20, duoc_moi: 20, chao_mung: 10, tran: 20, hoa_hong: { bat: false, phan_tram: 20, so_don: 1, thang: 12 },
};

let dangTai: Promise<MucSao> | null = null;
function taiMuc(): Promise<MucSao> {
  dangTai ??= fetch("/api/sao/muc").then((r) => (r.ok ? r.json() : null)).then((m: Partial<MucSao> | null) => ({
    ...MUC_MAC_DINH, ...(m ?? {}), hoa_hong: { ...MUC_MAC_DINH.hoa_hong, ...(m?.hoa_hong ?? {}) },
  })).catch(() => { dangTai = null; return MUC_MAC_DINH; });
  return dangTai;
}

/** null khi đang tải (để không hiện số sai rồi nhảy). */
export function useMucSao(): MucSao | null {
  const [muc, setMuc] = useState<MucSao | null>(null);
  useEffect(() => {
    let huy = false;
    void taiMuc().then((m) => { if (!huy) setMuc(m); });
    return () => { huy = true; };
  }, []);
  return muc;
}

/** "lần nạp đầu" / "3 lần nạp đầu". */
export function lanNapDau(soDon: number): string {
  return soDon <= 1 ? "lần nạp đầu" : `${soDon} lần nạp đầu`;
}

/** Điều kiện hoa hồng bằng lời thường. "" khi tắt. */
export function loiHoaHong(hh: HoaHongMuc): string {
  if (!hh.bat || hh.phan_tram <= 0) return "";
  return `Bạn nhận ${hh.phan_tram}% số Sao ${lanNapDau(hh.so_don)} của mỗi bạn bè bạn mời, trong ${hh.thang} tháng kể từ lúc bạn ấy nhận lời mời.`;
}

/** Dòng nhỏ dưới nút chia sẻ khi ĐÃ đăng nhập (link có gắn mã mời). "" khi không có thưởng nào. */
export function dongThuongMoi(m: MucSao): string {
  const coThuong = m.moi_ban > 0 || m.duoc_moi > 0;
  const hh = m.hoa_hong.bat && m.hoa_hong.phan_tram > 0;
  if (!coThuong && !hh) return "";
  if (!coThuong) return `Bạn bè mở link này rồi nạp Sao: bạn nhận ${m.hoa_hong.phan_tram}% số Sao ${lanNapDau(m.hoa_hong.so_don)} của bạn ấy.`;
  const dau = m.moi_ban === m.duoc_moi ? `Bạn bè lưu hồ sơ vào tài khoản: cả hai nhận ${m.moi_ban} Sao`
    : m.moi_ban === 0 ? `Bạn bè lưu hồ sơ vào tài khoản: bạn ấy nhận ${m.duoc_moi} Sao`
    : m.duoc_moi === 0 ? `Bạn bè lưu hồ sơ vào tài khoản: bạn nhận ${m.moi_ban} Sao`
    : `Bạn bè lưu hồ sơ vào tài khoản: bạn nhận ${m.moi_ban} Sao, bạn ấy nhận ${m.duoc_moi} Sao`;
  const sau = !hh ? "" : m.hoa_hong.so_don <= 1 ? `, bạn nhận thêm ${m.hoa_hong.phan_tram}% khi bạn ấy nạp Sao lần đầu`
    : `, bạn nhận thêm ${m.hoa_hong.phan_tram}% số Sao ${m.hoa_hong.so_don} lần nạp đầu của bạn ấy`;
  return `${dau}${sau}.`;
}

/** Dòng nhỏ dưới nút chia sẻ khi CHƯA đăng nhập. */
export const DONG_KHACH = "Đăng nhập để link mời có thưởng Sao";
