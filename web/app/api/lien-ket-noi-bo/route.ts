// CMS-4 — danh sách trang nội bộ (công khai như sitemap) để CMS gợi ý liên kết khi viết bài: công cụ, chủ đề kiến thức,
// mọi trang kiến thức có index. Không có dữ liệu người dùng. Cache 6 giờ.
import { NextResponse } from "next/server";
import { CHU_DE, duongTrang, mucLuc } from "@/lib/kien-thuc";

export const revalidate = 21600;

const CONG_CU: [string, string, string][] = [
  ["/than-so", "Thần số học — tính số chủ đạo", "Tính 4 con số cốt lõi từ họ tên và ngày sinh"],
  ["/hom-nay", "Hôm nay của bạn", "Ngày cá nhân, âm lịch, câu tự soi mỗi ngày"],
  ["/hop-doi", "Hợp đôi thần số", "Hai người, năm kiểu quan hệ"],
  ["/tu-vi", "Lập lá số Tử vi", "Lá số 12 cung, đại hạn, lưu niên"],
  ["/bat-tu", "Bát tự tứ trụ", "Tứ trụ, ngũ hành, dụng thần, đại vận"],
  ["/kinh-dich", "Gieo quẻ Kinh Dịch", "64 quẻ, hào động, quẻ biến"],
  ["/phong-thuy", "Phong thuỷ hướng nhà", "Mệnh quái, hướng hợp tuổi, Huyền Không"],
  ["/tu-dien", "Từ điển thuật ngữ", "Giải nghĩa thuật ngữ thần số, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ"],
];

export async function GET() {
  const ds = await mucLuc();
  return NextResponse.json({
    ds: [
      ...CONG_CU.map(([url, tieu_de, mo_ta]) => ({ url, tieu_de, mo_ta })),
      ...Object.entries(CHU_DE).map(([k, c]) => ({ url: `/kien-thuc/${k}`, tieu_de: c.ten, mo_ta: c.mo_ta })),
      ...ds.filter((t) => t.index !== false).map((t) => ({ url: duongTrang(t.loai, t.slug), tieu_de: t.tieu_de, mo_ta: t.mo_ta })),
    ],
  });
}
