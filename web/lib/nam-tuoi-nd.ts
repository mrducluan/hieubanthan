// EN-ALL GĐ 8 — nội dung CMS của trang năm & tuổi theo ngôn ngữ: bản Việt đọc CMS như cũ; bản Anh chưa có CMS tiếng Anh
// (GĐ 10) → nội dung rỗng (không khối CMS, không chữ CMS tiếng Việt lọt vào trang Anh).
import "server-only";
import { gopNoiDung, layNoiDungTrang, type NoiDungTrang } from "@/lib/noi-dung-trang";

export const noiDungTheo = (en: boolean, duong: string, bien: Record<string, string> = {}): Promise<NoiDungTrang> =>
  en ? Promise.resolve(gopNoiDung(duong, {}, null, null)) : layNoiDungTrang(duong, bien);
