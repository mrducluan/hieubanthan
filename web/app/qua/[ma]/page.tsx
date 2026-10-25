// SAO-V "Tặng một chương" — trang nhận quà /qua/<mã> (noindex, robots chặn /qua/, không vào sitemap). Máy chủ đọc quà
// (xem_qua_chuong: chỉ mảng + hạn, không lộ người gửi) + người xem đã đăng nhập / lưu hồ sơ chưa; trình duyệt lo phần
// bấm nhận. ?gt=<mã mời> (nếu có) do GhiGioiThieu ở layout tự lưu như link mời thường.
import type { Metadata } from "next";
import { MA_QUA } from "@/lib/luan-giai-mang";
import { docQua } from "@/lib/qua-chuong";
import { NhanQua } from "./NhanQua";

export const metadata: Metadata = {
  title: "Một chương được tặng",
  description: "Một người bạn tặng bạn một chương luận giải — đọc trong báo cáo của chính bạn.",
  robots: { index: false, follow: false },
};

interface Props { params: Promise<{ ma: string }> }

export default async function Page({ params }: Props) {
  const { ma } = await params;
  const hopLe = MA_QUA.test(ma);
  const banDau = hopLe ? await docQua(ma) : null;   // mã sai → trang báo "link không đúng", không gọi máy chủ
  return <NhanQua ma={hopLe ? ma : ""} banDau={banDau} />;
}
