import type { NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";

export const ND_LAM_NHA: NoiDungCongCu = {
  duong: "/xem-tuoi-lam-nha",
  ten: "Xem tuổi làm nhà, cưới hỏi",
  moTa: "Xem tuổi làm nhà, cưới hỏi theo dân gian Việt: tuổi mụ có phạm Kim lâu, Hoang ốc, Tam tai không, năm nào thuận, hướng nên giữ yên trong năm.",
  doan: [
    "Dân gian Việt xét ba điều khi định làm nhà hoặc cưới hỏi: Kim lâu (tuổi mụ chia 9 dư 1, 3, 6, 8), Hoang ốc (đếm tay sáu cung Nhất Cát, Nhì Nghi, Tam Địa Sát, Tứ Tấn Tài, Ngũ Thọ Tử, Lục Hoang Ốc) và Tam tai (ba năm liên tiếp theo tam hợp của tuổi).",
    "Tuổi tính là tuổi mụ theo năm âm lịch Việt Nam: năm định làm trừ năm sinh âm lịch rồi cộng một. Người sinh trước Tết thuộc năm âm lịch trước — nhập đủ ngày sinh (hoặc dùng hồ sơ trên máy) để tính chính xác.",
    "Trang cũng cho biết các hướng truyền thống khuyên giữ yên trong năm (Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng, Nhị Hắc) để tránh động thổ phía đó, và gợi ý những năm thuận gần nhất.",
    "Đây là tập quán dân gian để tham khảo khi lên kế hoạch, không phải lời tiên đoán.",
  ],
  hoiDap: [
    { hoi: "Kim lâu là gì?", dap: "Tuổi mụ chia 9 dư 1 (Kim lâu Thân), 3 (Kim lâu Thê), 6 (Kim lâu Tử) hoặc 8 (Kim lâu Lục súc). Dân gian thường tránh làm nhà, cưới hỏi vào năm phạm Kim lâu." },
    { hoi: "Hoang ốc tính thế nào?", dap: "Đếm trên sáu cung: 10 tuổi Nhất Cát, 20 Nhì Nghi, 30 Tam Địa Sát, 40 Tứ Tấn Tài, 50 Ngũ Thọ Tử, 60 Lục Hoang Ốc; số lẻ đếm tiếp từ cung của hàng chục. Rơi vào Tam Địa Sát, Ngũ Thọ Tử, Lục Hoang Ốc là năm dân gian thường tránh." },
    { hoi: "Tam tai rơi vào năm nào?", dap: "Thân Tý Thìn: năm Dần, Mão, Thìn. Dần Ngọ Tuất: năm Thân, Dậu, Tuất. Hợi Mão Mùi: năm Tỵ, Ngọ, Mùi. Tỵ Dậu Sửu: năm Hợi, Tý, Sửu." },
    { hoi: "Năm không hợp tuổi thì làm sao?", dap: "Nhiều gia đình chọn năm khác, hoặc nhờ người thân hợp tuổi đứng ra làm lễ động thổ (mượn tuổi). Quyết định nên dựa trên điều kiện thực tế." },
  ],
  lienKet: [{ href: "/phong-thuy/huong-xau-nam", ten: "Hướng xấu theo năm" }, { href: "/xem-ngay-tot", ten: "Xem ngày tốt" },
    { href: "/tuoi-xong-dat", ten: "Tuổi xông đất" }, { href: "/phong-thuy/huong-hop-tuoi", ten: "Tuổi hợp hướng nhà" }],
};

export const ND_XONG_DAT: NoiDungCongCu = {
  duong: "/tuoi-xong-dat",
  ten: "Xem tuổi xông đất",
  moTa: "Chọn tuổi xông đất đầu năm hợp với gia chủ: tam hợp, lục hợp với năm và tuổi chủ nhà, can và mệnh nạp âm tương sinh; tránh tuổi xung, tuổi đang Tam tai; giờ đẹp mùng 1.",
  doan: [
    "Người xông đất (xông nhà) là người đầu tiên bước vào nhà sau giao thừa. Dân gian chọn tuổi hợp với năm mới và với gia chủ để mở đầu năm thuận hoà.",
    "Trang xét: địa chi tam hợp / lục hợp với năm và với tuổi gia chủ; thiên can ngũ hợp hoặc sinh can gia chủ; mệnh nạp âm sinh hoặc cùng hành với gia chủ. Bỏ tuổi xung năm, xung gia chủ và tuổi đang Tam tai.",
    "Kèm giờ hoàng đạo và hướng xuất hành ngày mùng 1 theo hoàng lịch giờ Việt Nam.",
    "Quan trọng nhất vẫn là người xông đất vui vẻ, khoẻ mạnh, thân thiết với gia đình — tuổi chỉ để tham khảo.",
  ],
  hoiDap: [
    { hoi: "Tuổi nào hợp xông đất?", dap: "Tuổi tam hợp hoặc lục hợp với năm mới và với tuổi gia chủ, can ngũ hợp hoặc sinh can gia chủ, mệnh nạp âm sinh hoặc cùng hành với gia chủ, không đang trong Tam tai." },
    { hoi: "Nên tránh tuổi nào?", dap: "Tuổi xung với năm (ví dụ năm Mùi tránh tuổi Sửu), xung với tuổi gia chủ, và tuổi đang trong ba năm Tam tai." },
    { hoi: "Xông đất giờ nào?", dap: "Thường chọn giờ hoàng đạo ngày mùng 1 theo hoàng lịch; trang liệt kê sẵn sáu giờ hoàng đạo và hướng xuất hành của ngày đó." },
  ],
  lienKet: [{ href: "/xem-ngay-tot", ten: "Xem ngày tốt" }, { href: "/xem-tuoi-lam-nha", ten: "Tuổi làm nhà, cưới hỏi" },
    { href: "/phong-thuy/huong-xau-nam", ten: "Hướng xấu theo năm" }],
};

export const ND_HAN_NAM: NoiDungCongCu = {
  duong: "/phong-thuy/huong-xau-nam",
  ten: "Hướng xấu theo năm",
  moTa: "Hướng nên giữ yên trong năm theo phong thuỷ truyền thống: Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng, Nhị Hắc, kèm bàn phi tinh 9 cung của năm — để tránh động thổ, sửa chữa lớn phía đó.",
  doan: [
    "Thái Tuế là phương của chi năm, Tuế Phá là phương đối diện. Tam Sát là ba sơn đối với tam hợp của năm. Ngũ Hoàng và Nhị Hắc là nơi sao 5 và sao 2 bay tới trong bàn phi tinh lưu niên (Huyền Không).",
    "Năm phong thuỷ đổi tại Lập xuân (khoảng 4/2 dương lịch), không phải 1/1 hay mùng 1 Tết.",
    "Truyền thống khuyên giữ yên các phía này: không động thổ, đục phá, sửa chữa lớn. Trang không giới thiệu hay bán vật phẩm hoá giải.",
  ],
  hoiDap: [
    { hoi: "Ngũ Hoàng năm nay ở hướng nào?", dap: "Xem bàn 9 cung trên trang: ô có số 5. Mỗi năm sao 5 bay sang một cung khác theo thứ tự Lạc thư." },
    { hoi: "Tam Sát là gì?", dap: "Ba sơn nằm đối diện với nhóm tam hợp của chi năm, ví dụ năm Ngọ (Dần Ngọ Tuất) Tam Sát ở phía Bắc (Hợi, Tý, Sửu)." },
    { hoi: "Làm nhà có cần tránh hướng Thái Tuế không?", dap: "Truyền thống khuyên không động thổ, đào móng lớn ở phương Thái Tuế và Tuế Phá trong năm; xây nhà hướng khác vẫn bình thường." },
  ],
  lienKet: [{ href: "/xem-tuoi-lam-nha", ten: "Tuổi làm nhà" }, { href: "/phong-thuy", ten: "Phong thuỷ nhà" }, { href: "/xem-ngay-tot", ten: "Xem ngày tốt" }],
};
