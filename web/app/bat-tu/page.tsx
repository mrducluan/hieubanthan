import type { Metadata } from "next";
import { GioiThieuCongCu, type NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";
import { metaTrang } from "@/lib/seo";
import { BatTu } from "./BatTu";

const ND: NoiDungCongCu = {
  duong: "/bat-tu",
  ten: "Bát tự",
  moTa: "Bát tự tứ trụ theo tiết khí: thiên can, địa chi, thập thần, ngũ hành chấm điểm công bố, cách cục Tử Bình Chân Thuyên, dụng thần trình bày hai cách, đại vận 10 năm.",
  doan: [
    "Tứ trụ năm – tháng – ngày – giờ lập theo tiết khí (tính thiên văn), không theo ngày mùng 1 âm lịch. Kết quả có thiên can, địa chi, tàng can, thập thần, nạp âm, trường sinh, thần sát và các quan hệ hợp – xung.",
    "Ngũ hành được chấm theo thang điểm công bố để bạn kiểm lại; cách cục định theo nguyệt lệnh (Tử Bình Chân Thuyên). Dụng thần luôn trình bày hai cách (phù ức và điều hậu) để bạn tự cân nhắc, hệ thống không tự chọn thay.",
    "Đại vận 10 năm và lưu niên giúp xem nhịp từng giai đoạn. Đây là tham khảo văn hoá, không phải lời phán.",
  ],
  hoiDap: [
    { hoi: "Bát tự khác Tử vi thế nào?", dap: "Bát tự lấy tám chữ can chi của năm, tháng, ngày, giờ sinh và xét ngũ hành; Tử vi an sao vào 12 cung. Hai hệ thống bổ sung góc nhìn cho nhau." },
    { hoi: "Sinh lúc 23 giờ thì tính ngày nào?", dap: "Mặc định giữ trụ ngày của hôm đó và lấy giờ Tý của ngày hôm sau (dạ Tý). Ở khung Trường phái bạn chọn được phái đổi ngày lúc 23:00 — khi đó trụ ngày là ngày hôm sau; trang luôn gắn cờ để bạn biết." },
    { hoi: "Dụng thần là gì?", dap: "Hành giúp lá số cân bằng hơn. Vì các trường phái xác định khác nhau, trang trình bày hai cách thay vì chọn một." },
  ],
  lienKet: [{ href: "/kien-thuc/thap-than", ten: "10 thập thần" }, { href: "/kien-thuc/nhat-chu", ten: "10 nhật chủ" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }],
};

export const metadata: Metadata = metaTrang({ tieuDe: "Bát tự Tứ trụ: lập lá số theo giờ sinh, ngũ hành, dụng thần", moTa: ND.moTa, duong: ND.duong });

export default function Page() {
  return (
    <>
      <BatTu />
      <GioiThieuCongCu {...ND} />
    </>
  );
}
