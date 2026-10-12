// Ủng hộ nhà phát triển (chủ dự án yêu cầu 2026-10-12): địa chỉ ví crypto + (tuỳ chọn) tài khoản ngân hàng, khai ở
// env MÁY CHỦ — đổi ví không cần sửa code. Đây là QUÀ TẶNG TỰ NGUYỆN: không mua hàng, không đổi Sao, không quyền lợi.
//   UNG_HO_VI        mỗi dòng (hoặc ngăn bằng ;) "Tên mạng|địa chỉ", vd "USDT (TRC20)|TXyz…;Bitcoin|bc1q…"
//   UNG_HO_NGAN_HANG "Ngân hàng|Số tài khoản|Chủ tài khoản" (tuỳ chọn)
export type ViUngHo = { mang: string; diaChi: string };
export type NganHangUngHo = { nganHang: string; soTk: string; chuTk: string };

const DIA_CHI = /^[A-Za-z0-9:_.-]{10,130}$/;

export function dsViUngHo(env = process.env.UNG_HO_VI): ViUngHo[] {
  return (env ?? "").split(/[;\n]/).map((d) => d.split("|").map((x) => x.trim()))
    .filter(([mang, dc]) => mang && dc && mang.length <= 40 && DIA_CHI.test(dc))
    .map(([mang, dc]) => ({ mang: mang!, diaChi: dc! })).slice(0, 8);
}

export function nganHangUngHo(env = process.env.UNG_HO_NGAN_HANG): NganHangUngHo | null {
  const [nganHang, soTk, chuTk] = (env ?? "").split("|").map((x) => x.trim());
  return nganHang && soTk && /^[0-9 ]{6,24}$/.test(soTk) && chuTk ? { nganHang, soTk: soTk.replace(/\s/g, ""), chuTk } : null;
}

export const coUngHo = () => dsViUngHo().length > 0 || nganHangUngHo() !== null;
