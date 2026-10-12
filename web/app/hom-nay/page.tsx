// HN-1 — "Hôm nay của bạn" (khâu QUAY LẠI, docs/MUC-TIEU-TANG-TRUONG.md): mỗi ngày một thẻ từ hồ sơ trên máy.
import type { Metadata } from "next";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { GioiThieuCongCu, type NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";
import { metaTrang } from "@/lib/seo";
import { UngHoNho } from "@/components/ung-ho/UngHoNho";
import { HomNay } from "./HomNay";

const ND: NoiDungCongCu = {
  duong: "/hom-nay",
  ten: "Hôm nay của bạn",
  moTa: "Mỗi ngày một thẻ theo thần số học: ngày, tháng, năm cá nhân của riêng bạn, ngày âm lịch và can chi hôm nay, một câu hỏi để tự soi.",
  doan: [
    "Ngày cá nhân tính từ ngày và tháng sinh của bạn cộng với ngày đang xem, rút gọn về 1–9. Mỗi con số gợi một chủ đề cho ngày: bắt đầu, lắng nghe, gặp gỡ, sắp xếp, thay đổi, chăm sóc, suy ngẫm, quyết định, khép lại.",
    "Thẻ có thêm tháng và năm cá nhân để thấy nhịp lớn hơn, ngày âm lịch Việt Nam và can chi của hôm nay, cùng một câu hỏi để bạn tự soi. Ngày mai có thẻ mới.",
    "Hồ sơ lưu trên máy bạn; máy chủ chỉ tính rồi bỏ. Đây là nội dung văn hoá để tham khảo, gợi chủ đề chứ không dự báo việc sẽ xảy ra.",
  ],
  hoiDap: [
    { hoi: "Ngày cá nhân tính thế nào?", dap: "Năm cá nhân = ngày sinh + tháng sinh + năm đang xem (rút gọn); tháng cá nhân = năm cá nhân + tháng đang xem; ngày cá nhân = tháng cá nhân + ngày đang xem, rút gọn về 1–9." },
    { hoi: "Mỗi ngày thẻ có khác không?", dap: "Có. Ngày cá nhân đổi mỗi ngày theo chu kỳ 1–9, thẻ cũng báo trước chủ đề của ngày mai." },
    { hoi: "Có cần tài khoản không?", dap: "Không. Chỉ cần hồ sơ (tên và ngày sinh) lưu trên máy bạn." },
  ],
  lienKet: [{ href: "/ban-than", ten: "Bản thân" }, { href: "/kien-thuc/nam-ca-nhan", ten: "Năm cá nhân 1–9" },
    { href: "/than-so", ten: "Thần số học" }, { href: "/hop-doi", ten: "Hợp đôi" }],
};

export const metadata: Metadata = metaTrang({ tieuDe: "Hôm nay của bạn: ngày cá nhân, âm lịch và câu hỏi tự soi", moTa: ND.moTa, duong: ND.duong });

export default function Page() {
  return (
    <>
      <HomNay />
      <BaiLienQuanMang mang="than_so" className="mt-12" />
      <GioiThieuCongCu {...ND} />
      <UngHoNho className="mx-auto mt-10 max-w-3xl" />
    </>
  );
}
