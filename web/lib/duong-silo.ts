// QH-URL — tra đường dẫn theo bảng chuyển hướng (lib/chuyen-huong.json), dùng được cả ở trình duyệt.
// duongMoi: link do engine dựng (lien_ket_ngoai, trang_menh, quẻ ngày) đi qua đây → engine/cache dữ liệu còn bản cũ
// (Render và Vercel deploy lệch nhau, cache 6 giờ) thì người đọc và Googlebot vẫn nhận URL mới, không phải đi qua 308.
// laTrangKienThuc: nhóm trang cho đo lường (landing_viewed) — sau silo, trang kiến thức nằm dưới đoạn đầu của mảng.
import CHUYEN from "@/lib/chuyen-huong.json";

const CU_MOI: [string, string][] = [
  ...Object.entries(CHUYEN.chu_de).map(([k, moi]) => [`/kien-thuc/${k}`, moi] as [string, string]),
  ...(CHUYEN.trang as [string, string][]),
];
const TUOI_CU = /^\/phong-thuy\/(tuoi-\d{4}-(?:nam|nu)(?:\.md)?)$/;

/** URL cũ (trước QH-URL) → URL mới; URL khác giữ nguyên. Giữ query/hash. */
export function duongMoi(duong: string): string {
  const m = duong.match(/^([^?#]*)(.*)$/)!;
  const p = m[1]!, duoi = m[2]!;
  const t = p.match(TUOI_CU);
  if (t) return `${CHUYEN.tuoi_huong}/${t[1]}${duoi}`;
  for (const [cu, moi] of CU_MOI) {
    if (p === cu || p === `${cu}.md`) return `${moi}${p.slice(cu.length)}${duoi}`;
    if (p.startsWith(`${cu}/`)) return `${moi}${p.slice(cu.length)}${duoi}`;
  }
  return duong;
}

// Hướng xấu năm là công cụ (chỉ dời vào /phong-thuy) → không tính là trang kiến thức; lá số mẫu là kiến thức.
const GOC_KIEN_THUC = [...Object.values(CHUYEN.chu_de), "/tu-vi/la-so-mau", CHUYEN.tuoi_huong];

/** Trang kiến thức (thư viện, cụm, trang con) — để tách "vào từ trang kiến thức" khỏi "vào từ công cụ" khi đo. */
export function laTrangKienThuc(duong: string): boolean {
  return duong === "/kien-thuc" || duong.startsWith("/kien-thuc/") || duong === "/tu-dien" ||
    GOC_KIEN_THUC.some((g) => duong === g || duong.startsWith(`${g}/`));
}
