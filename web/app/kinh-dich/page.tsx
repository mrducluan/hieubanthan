import type { Metadata } from "next";
import { GioiThieuCongCu, type NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";
import { metaTrang } from "@/lib/seo";
import { KinhDich } from "./KinhDich";

const ND: NoiDungCongCu = {
  duong: "/kinh-dich",
  ten: "Kinh Dịch",
  moTa: "Gieo quẻ Kinh Dịch cho một câu hỏi cụ thể: máy gieo, Mai Hoa theo giờ hoặc tự gieo đồng xu. Đọc theo Nghĩa Lý, Lục Hào, Mai Hoa, có trích Chu Dịch và lời nói nôm na.",
  doan: [
    "Hỏi một quẻ cho một việc cụ thể bạn đang cân nhắc. Quẻ do máy gieo ngẫu nhiên, theo giờ (Mai Hoa) hoặc bạn tự gieo ba đồng xu sáu lần rồi nhập kết quả — AI không chọn quẻ.",
    "Lời đọc gồm quẻ chủ, hào động, quẻ biến; trích nguyên văn Chu Dịch (quái từ, hào từ, Thoán truyện) kèm dịch nghĩa và lời nói nôm na. Mỗi lời đọc có mặt tối và câu hỏi tự soi.",
    "Hỏi lại cùng một việc nhiều lần trong thời gian ngắn, trang sẽ nhắc theo tinh thần quẻ Mông.",
  ],
  hoiDap: [
    { hoi: "Nên hỏi Kinh Dịch thế nào?", dap: "Hỏi một việc cụ thể, rõ ràng, liên quan đến lựa chọn của chính bạn (ví dụ: có nên nhận lời mời làm việc này không), tránh câu hỏi có/không về số phận." },
    { hoi: "Ba cách gieo khác nhau thế nào?", dap: "Máy gieo mô phỏng ba đồng xu; Mai Hoa lấy quẻ theo năm, tháng, ngày âm và giờ lúc hỏi (chọn được âm lịch Việt Nam hoặc Trung Quốc); tự gieo là bạn tung xu thật rồi nhập. Cách đọc lời quẻ giống nhau." },
    { hoi: "Không có hào động thì đọc thế nào?", dap: "Lời chủ là quái từ của quẻ, kèm Thoán truyện dịch nghĩa." },
  ],
  lienKet: [{ href: "/kien-thuc/kinh-dich", ten: "64 quẻ Kinh Dịch" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }],
};

export const metadata: Metadata = metaTrang({ tieuDe: "Gieo quẻ Kinh Dịch online: 64 quẻ, 384 hào, lời quẻ có nguồn", moTa: ND.moTa, duong: ND.duong });

export default function Page() {
  return (
    <>
      <KinhDich />
      <GioiThieuCongCu {...ND} />
    </>
  );
}
