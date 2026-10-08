import type { Metadata } from "next";
import { GioiThieuCongCu, type NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";
import { metaTrang } from "@/lib/seo";
import { HopDoi } from "./HopDoi";

const ND: NoiDungCongCu = {
  duong: "/hop-doi",
  ten: "Hợp đôi",
  moTa: "So hợp đôi theo thần số học cho người yêu, bạn bè, đồng nghiệp, sếp, người thân: con số hai người hoà ở đâu, va ở đâu, việc nên cùng làm. Không chấm điểm hợp hay khắc.",
  doan: [
    "Chọn người ấy là ai với bạn — người yêu, bạn bè, đồng nghiệp, sếp hay người thân — rồi nhập ngày sinh (tên không bắt buộc). Hệ thống so cặp số đường đời và các cặp số theo tên, đọc theo đúng loại quan hệ đó, kèm nhịp năm cá nhân của hai người.",
    "Không có điểm “hợp” hay “khắc”: hai con số nào cũng có chỗ dễ hoà và chỗ dễ va. Bạn có thể gửi link mời để người ấy tự nhập ngày sinh của họ — link chỉ chứa tên hiển thị và con số, không chứa ngày sinh.",
  ],
  hoiDap: [
    { hoi: "Hợp đôi có chấm điểm phần trăm không?", dap: "Không. Điểm số hợp/khắc dễ gây hiểu lầm; trang chỉ nêu chỗ hoà, chỗ va và việc nên cùng làm." },
    { hoi: "Ngày sinh người kia có bị lưu lại không?", dap: "Không. Ngày sinh chỉ dùng để tính rồi bỏ. Vui lòng chỉ nhập khi người đó biết và đồng ý." },
    { hoi: "Xem hợp đôi đồng nghiệp hay sếp khác gì người yêu?", dap: "Cùng một cặp số nhưng cách đọc khác: mỗi loại quan hệ có phần diễn giải riêng về cách phối hợp, giao tiếp, ranh giới." },
  ],
  lienKet: [{ href: "/than-so", ten: "Thần số học của bạn" }, { href: "/kien-thuc/than-so", ten: "Ý nghĩa 12 con số" }],
};

export const metadata: Metadata = metaTrang({ tieuDe: "Hợp đôi thần số học: hai người hoà và va ở đâu", moTa: ND.moTa, duong: ND.duong });

export default function Page() {
  return (
    <>
      <HopDoi />
      <GioiThieuCongCu {...ND} />
    </>
  );
}
