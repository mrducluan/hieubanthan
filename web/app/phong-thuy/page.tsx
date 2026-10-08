import type { Metadata } from "next";
import { GioiThieuCongCu, type NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";
import { metaTrang } from "@/lib/seo";
import { PhongThuy } from "./PhongThuy";

const ND: NoiDungCongCu = {
  duong: "/phong-thuy",
  ten: "Phong thuỷ",
  moTa: "Phong thuỷ Bát trạch: mệnh quái theo năm sinh và giới tính, tám hướng du niên, cửa – chủ – bếp, Huyền Không phi tinh, đo hướng bằng la bàn điện thoại, khảo sát bố cục nhà.",
  doan: [
    "Mệnh quái tính theo năm sinh (mốc Lập xuân) và giới tính, cho ra tám hướng du niên: bốn hướng cát, bốn hướng hung. Từ đó xét cửa chính, phòng ngủ, bếp theo nguyên tắc cửa – chủ – bếp.",
    "Bạn có thể đo hướng nhà bằng la bàn điện thoại hoặc nhập độ, xem bàn Huyền Không phi tinh theo vận, và khai bố cục nhà (phòng nào ở phương nào, 18 dấu hiệu quan sát được) để nhận nhận xét gắn với từng mục kho tri thức.",
    "Mục nào là quan niệm dân gian đều ghi rõ. Trang không giới thiệu hay bán vật phẩm “hoá giải”.",
  ],
  hoiDap: [
    { hoi: "Tuổi tôi hợp hướng nào?", dap: "Nhập năm sinh và giới tính, trang tính mệnh quái và liệt kê bốn hướng cát (Sinh Khí, Thiên Y, Diên Niên, Phục Vị) cùng bốn hướng hung. Sinh đầu năm dương lịch thì mốc đầu năm quan trọng: mặc định Lập xuân, bạn chọn được Tết âm lịch (lịch Việt hoặc Trung Quốc) và xem đổi mốc có làm khác mệnh quái không." },
    { hoi: "Đo hướng nhà thế nào cho đúng?", dap: "Đứng ở cửa chính nhìn thẳng ra ngoài, để điện thoại nằm ngang, tránh xa kim loại; trang dùng la bàn của máy và cho nhập độ tay nếu cần." },
    { hoi: "Có cần mua vật phẩm phong thuỷ không?", dap: "Không. Trang chỉ nêu cách bố trí và quan niệm, không giới thiệu vật phẩm." },
  ],
  lienKet: [{ href: "/phong-thuy/huong-hop-tuoi", ten: "Tuổi nào hợp hướng nào (1960–2005)" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ phong thuỷ" }, { href: "/kham-pha", ten: "Các hệ thống khác" }],
};

export const metadata: Metadata = metaTrang({ tieuDe: "Phong thuỷ Bát trạch: mệnh quái, hướng nhà hợp tuổi, bố cục nhà", moTa: ND.moTa, duong: ND.duong });

export default function Page() {
  return (
    <>
      <PhongThuy />
      <GioiThieuCongCu {...ND} />
    </>
  );
}
