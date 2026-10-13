import { Suspense } from "react";
import type { Metadata } from "next";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { GioiThieuCongCu, type NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";
import { metaTrang } from "@/lib/seo";
import { ThanSo } from "./ThanSo";

const ND: NoiDungCongCu = {
  duong: "/than-so",
  ten: "Thần số học",
  moTa: "Thần số học Pythagoras theo họ tên và ngày sinh: 4 con số cốt lõi có cách tính từng bước, dải đời, năm và tháng cá nhân, biểu đồ ngày sinh, hỏi đáp có nguồn.",
  doan: [
    "Nhập họ tên khai sinh và ngày sinh (dương lịch, hoặc âm lịch để hệ thống đổi giúp). Máy tính ra số đường đời, số sứ mệnh, số linh hồn, số nhân cách — mỗi con số hiện rõ từng bước cộng rút gọn, giữ số cái 11, 22, 33.",
    "Mỗi con số có ba lớp: phần đã tính (kiểm lại được), phần diễn giải từ kho tri thức có ghi nguồn (kèm mặt tối, không chỉ lời hay), và câu hỏi để bạn tự soi. Ngoài bốn số cốt lõi còn có dải đời (đỉnh cao, thử thách), năm và tháng cá nhân, biểu đồ ngày sinh và mũi tên, nợ nghiệp.",
    "Hồ sơ lưu trên máy bạn; máy chủ chỉ tính rồi bỏ, không lưu ngày sinh. Đây là nội dung văn hoá để tham khảo, không phải lời tiên đoán.",
  ],
  hoiDap: [
    { hoi: "Số đường đời tính thế nào?", dap: "Cộng tất cả chữ số của ngày, tháng, năm sinh rồi rút gọn về một chữ số; nếu gặp 11, 22 hoặc 33 thì giữ nguyên (số cái). Trang kết quả hiện từng bước cộng để bạn tự kiểm." },
    { hoi: "Có cần họ tên đầy đủ không?", dap: "Có, để tính số sứ mệnh, linh hồn và nhân cách theo bảng chữ cái Pythagoras. Nên dùng họ tên khai sinh, có dấu hay không dấu đều được." },
    { hoi: "Ngày sinh âm lịch thì sao?", dap: "Bạn nhập âm lịch, hệ thống đổi sang dương lịch theo âm lịch Việt Nam rồi mới tính." },
    { hoi: "Thần số học có dự đoán tương lai không?", dap: "Không. Con số chỉ gợi một khung để nhìn lại bản thân; mọi diễn giải đều kèm mặt tối và câu hỏi tự soi, không phán số phận." },
  ],
  lienKet: [{ href: "/kien-thuc/than-so", ten: "Ý nghĩa 12 con số" }, { href: "/kien-thuc/nghe-nghiep", ten: "Số chủ đạo hợp nghề gì" },
    { href: "/kien-thuc/nam-ca-nhan", ten: "Năm cá nhân 1–9" }, { href: "/kien-thuc/no-nghiep", ten: "Nợ nghiệp" }, { href: "/kien-thuc/so-kep", ten: "Số kép Chaldea" },
    { href: "/hop-doi", ten: "Hợp đôi" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }],
};

export const metadata: Metadata = metaTrang({ tieuDe: "Thần số học Pythagoras: tính số chủ đạo theo họ tên và ngày sinh", moTa: ND.moTa, duong: ND.duong });

export default function Page() {
  return (
    <>
      <ThanSo />
      <Suspense fallback={null}><BaiLienQuanMang mang="than_so" className="mt-12" /></Suspense>
      <GioiThieuCongCu {...ND} />
    </>
  );
}
