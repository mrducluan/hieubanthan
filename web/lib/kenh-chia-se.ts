// HCS-1 — kênh gửi của hộp chia sẻ chung (hàm thuần, test được). Không SDK bên thứ ba: Facebook dùng link chia sẻ công khai
// (sharer.php), Messenger dùng deep link của app (chỉ điện thoại), Zalo đi qua hộp chia sẻ của máy (Zalo luôn có trong đó
// trên điện thoại) — máy tính không có hộp chia sẻ thì chép sẵn lời nhắn + link để dán vào Zalo PC.
import type { AppNhung } from "@/lib/trinh-duyet-nhung";

export type Kenh = "anh" | "zalo" | "messenger" | "facebook" | "chep" | "luu_anh" | "khac";

/** Link chia sẻ công khai của Facebook (không cần app id). */
export const urlFacebook = (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

/** Deep link mở Messenger với link điền sẵn — chỉ dùng trên điện thoại (máy tính không có scheme này). */
export const urlMessenger = (url: string) => `fb-messenger://share/?link=${encodeURIComponent(url)}`;

export function laDienThoai(ua: string | null | undefined): boolean {
  return Boolean(ua && /Android|iPhone|iPad|iPod|Mobile/i.test(ua));
}

/** Thứ tự kênh theo nơi người dùng đang đứng. `coGuiTep`: máy gửi được TỆP ảnh qua hộp chia sẻ (Web Share Level 2). */
export function thuTuKenh(d: { dienThoai: boolean; app: AppNhung; coGuiTep: boolean; coAnh: boolean }): Kenh[] {
  const ds: Kenh[] = [];
  const anh = d.coAnh && d.coGuiTep;
  if (d.app === "zalo") ds.push("zalo", ...(anh ? (["anh"] as Kenh[]) : []), "facebook");
  else if (d.app === "facebook" || d.app === "instagram") ds.push(...(anh ? (["anh"] as Kenh[]) : []), "messenger", "facebook", "zalo");
  else if (d.dienThoai) ds.push("zalo", "messenger", ...(anh ? (["anh"] as Kenh[]) : []), "facebook");
  else ds.push("zalo", "facebook");
  ds.push("chep");
  if (d.coAnh) ds.push("luu_anh");
  if (d.dienThoai) ds.push("khac");
  return [...new Set(ds)];
}

/** Lời nhắn + link — chuỗi đi vào ô chép và vào hộp chia sẻ của máy (nhiều app bỏ trường url khi gửi kèm tệp). */
export const ghepLoiNhan = (chu: string, url: string) => `${chu.trim()} ${url}`.trim();
