// CTA-1 — thẻ "Bản đồ 5 mảng của tôi": câu chữ hiển thị (không tính gì) + biến thể câu mời xoay vòng. Biến thể chọn lúc
// ký mã (mã mang `b`), nên ảnh, trang nhận và sự kiện đo cùng một biến thể → so được câu nào kéo người bấm nhiều hơn
// (`bien_the` = "b0" | "b1" | "b2" trên share_created, guess_played, cross_cta_clicked{tu: "the_ban_do"}).
// Giọng: chạm vào tò mò về bản thân, muốn được hiểu, muốn so với bạn bè — không doạ, không hứa trước kết quả.
import type { NoiDungMaBanDo } from "@/lib/ma-moi";

export const BIEN_THE_BAN_DO = [
  {
    tieuDe: "5 mảnh ghép làm nên {t}",
    loiMoi: "Bạn hợp với mình ở mảnh nào?",
    doan: "Bạn hiểu {t} đến đâu? Đoán đường đời của {t}",
    sauDoan: "Giờ tới lượt bạn — 30 giây để có bản đồ của riêng mình",
    nutXem: "Xem bản đồ của bạn",
  },
  {
    tieuDe: "Bản đồ 5 mảng của {t}",
    loiMoi: "Mảnh nào của bạn giống mình nhất?",
    doan: "{t} giấu một con số ở đây — bạn đoán là số mấy?",
    sauDoan: "Còn bạn được ghép từ những mảnh nào? Xem trong 30 giây",
    nutXem: "Ghép bản đồ của tôi",
  },
  {
    tieuDe: "{t} được ghép từ 5 mảnh này",
    loiMoi: "Đặt bản đồ của bạn cạnh mình thử?",
    doan: "Thử xem bạn có đoán trúng {t} không: đường đời là số mấy?",
    sauDoan: "Đến lượt bạn — ngày sinh của bạn kể gì? Chỉ 30 giây",
    nutXem: "Xem 5 mảnh của tôi",
  },
] as const;

export const bienThe = (b: number) => BIEN_THE_BAN_DO[b] ?? BIEN_THE_BAN_DO[0];
export const dien = (mau: string, t: string) => mau.replaceAll("{t}", t);

export type ManhBanDo = { ma: "so" | "nhat_chu" | "sao" | "phi" | "que"; nhom: string; gia_tri: string; phu: string; thieu: boolean };

/** Năm mảnh theo thứ tự trên chòm sao (dữ liệu chỉ từ mã đã ký / engine). `anSo`: giấu đường đời (trò đoán). */
export function manhBanDo(nd: Pick<NoiDungMaBanDo, "s" | "k" | "n" | "h" | "m" | "c" | "g" | "q">, anSo = false): ManhBanDo[] {
  return [
    { ma: "so", nhom: "Đường đời", gia_tri: anSo ? "?" : String(nd.s), phu: anSo ? "đoán xem" : nd.k, thieu: false },
    { ma: "nhat_chu", nhom: "Bản chất", gia_tri: nd.n, phu: nd.h, thieu: !nd.n },
    { ma: "sao", nhom: "Sao chủ mệnh", gia_tri: nd.m || "?", phu: nd.m ? "Tử vi" : "cần giờ sinh", thieu: !nd.m },
    { ma: "phi", nhom: "Hướng hợp", gia_tri: nd.g || "?", phu: nd.c ? `cung ${nd.c}` : "cần giới tính", thieu: !nd.g },
    { ma: "que", nhom: "Quẻ hôm ấy", gia_tri: nd.q, phu: "Kinh Dịch", thieu: !nd.q },
  ];
}

/** Toạ độ năm điểm sáng (khung 1000×640) — một chòm sao không đều, nối theo thứ tự rồi khép về điểm đầu. */
export const DIEM_BAN_DO: [number, number][] = [[500, 150], [800, 270], [700, 520], [300, 520], [200, 270]];
export const NOI_BAN_DO: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 2], [0, 3]];
