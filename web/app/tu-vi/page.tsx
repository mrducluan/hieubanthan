import type { Metadata } from "next";
import { GioiThieuCongCu, type NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";
import { metaTrang } from "@/lib/seo";
import { TuVi } from "./TuVi";

const ND: NoiDungCongCu = {
  duong: "/tu-vi",
  ten: "Tử vi",
  moTa: "Lập lá số Tử vi 12 cung theo giờ, ngày, nơi sinh (âm lịch Việt Nam, múi giờ lịch sử). Đại hạn, lưu niên, tiểu hạn, lưu nguyệt theo phái, hỏi đáp theo cung.",
  doan: [
    "Nhập ngày giờ sinh, giới tính và nơi sinh (63 tỉnh thành hoặc nước ngoài). Lá số an ngay trên hệ thống của Hiểu Bản Thân theo âm lịch Việt Nam, có xử lý múi giờ lịch sử trước năm 1975; sinh ở nước ngoài lập theo giờ địa phương.",
    "Lá số vẽ 12 cung với 14 chính tinh, phụ tinh, tứ hoá, Tuần Triệt, độ sáng theo Nam phái (có công tắc xem bảng phái Trung). Hạn đọc theo thứ tự đại hạn › lưu niên › tiểu hạn › lưu nguyệt; lưu nguyệt cho bạn chọn phái tính tháng.",
    "Các khác biệt giữa trường phái (lịch Việt/Trung, Hoả Linh, tháng nhuận…) gom trong khung “Trường phái” có giải thích. Không phán bệnh tật, tai nạn hay sống chết.",
  ],
  hoiDap: [
    { hoi: "Không biết giờ sinh chính xác có lập được không?", dap: "Tử vi cần giờ sinh theo canh giờ (12 giờ âm). Nếu không chắc, hãy hỏi người thân hoặc so vài giờ gần nhau; hỏi đáp kiến thức chung vẫn dùng được không cần lá số." },
    { hoi: "Vì sao lá số ở đây có thể khác trang khác?", dap: "Nhiều trang đổi âm lịch theo lịch Trung Quốc (UTC+8), lệch với âm lịch Việt Nam ở một số ngày. Ở đây mặc định âm lịch Việt Nam, có công tắc chuyển sang lịch Trung Quốc để so." },
    { hoi: "Lưu nguyệt tính theo phái nào?", dap: "Mặc định Đẩu Quân từ Thái Tuế; bạn có thể chọn 4 phái khác. Mỗi tháng hiện cung theo cả 5 phái để so." },
    { hoi: "Ngày giờ sinh có bị gửi đi đâu không?", dap: "Không gửi cho bên thứ ba. Máy chủ tính xong là bỏ; hồ sơ nằm trên máy bạn." },
  ],
  lienKet: [{ href: "/kien-thuc/tu-vi", ten: "14 chính tinh" }, { href: "/kien-thuc/cung-tu-vi", ten: "12 cung" }, { href: "/la-so-mau", ten: "Lá số mẫu đọc từng bước" }],
};

export const metadata: Metadata = metaTrang({ tieuDe: "Lập lá số Tử vi online: 12 cung, đại hạn, lưu niên, lưu nguyệt", moTa: ND.moTa, duong: ND.duong });

export default function Page() {
  return (
    <>
      <TuVi />
      <GioiThieuCongCu {...ND} />
    </>
  );
}
