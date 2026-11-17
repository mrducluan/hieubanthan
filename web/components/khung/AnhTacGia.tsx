// EEAT: ảnh đại diện chuyên gia (có ảnh trong lib/chuyen-gia `anhChuyenGia`) — chưa có ảnh thì chữ cái đầu như cũ.
// Ảnh nhỏ, tự lưu ở /public (không ảnh ngoài, hợp CSP). `lop` = cỡ + viền (giữ nguyên lớp của chỗ dùng).
import { anhChuyenGia, type ChuyenGia } from "@/lib/chuyen-gia";

export function AnhTacGia({ cg, ten, lop, px, alt }: { cg?: ChuyenGia; ten?: string; lop: string; px: number; alt?: string }) {
  const anh = cg ? anhChuyenGia(cg.slug) : undefined;
  const chu = (cg?.ten ?? ten ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 3);
  if (anh) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={anh.webp} alt={alt ?? `Ảnh ${cg!.ten}`} width={px} height={px} loading="lazy" decoding="async"
      className={`${lop} shrink-0 rounded-full object-cover`} data-testid="anh-tac-gia" />;
  }
  return <span aria-hidden className={`${lop} grid shrink-0 place-items-center rounded-full border border-gold/50 bg-gold/10 font-serif text-gold`}>{chu}</span>;
}
