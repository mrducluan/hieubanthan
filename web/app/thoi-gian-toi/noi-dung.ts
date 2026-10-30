// NAM-2 — chữ giới thiệu + hỏi đáp mặc định của /thoi-gian-toi (sổ trang đọc lại; CMS ghi đè được).
import type { NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";

export const ND_THOI_GIAN_TOI: NoiDungCongCu = {
  duong: "/thoi-gian-toi",
  ten: "Thời gian tới của bạn",
  moTa: "Xem 3 tháng tới, 12 tháng tới và năm tới của riêng bạn: tháng cá nhân thần số, nhịp tháng Tử vi, tháng theo tiết Bát tự, sao hạn, Tam tai, Kim lâu theo tuổi — lời đời thường, không phán định.",
  doan: [
    "Bạn muốn biết ba tháng tới nên dồn sức vào đâu, mười hai tháng tới tháng nào hợp để bắt đầu việc mới, và năm tới mở ra thế nào? Trang ghép ba cách xem từ chính ngày sinh của bạn — thần số học, lá số Tử vi, lá số Bát tự — cùng tập quán theo tuổi (sao hạn, Tam tai, Kim lâu), rồi nói bằng lời thường.",
    "Chỉ cần tên và ngày sinh là có tháng cá nhân, năm cá nhân và tập quán theo tuổi. Thêm giờ sinh, giới tính, nơi sinh để có thêm nhịp tháng Tử vi và tháng theo tiết Bát tự; tháng nào hai lá số cùng thuận hay cùng nên đi chậm được đưa lên đầu.",
    "Đây là nhịp gợi ý để bạn tự sắp việc, không phải lời đoán chuyện sẽ xảy ra. Trang không hướng dẫn cúng giải, không bán vật phẩm, không lưu ngày sinh của bạn trên máy chủ.",
  ],
  hoiDap: [
    { hoi: "Ba cách xem khác nhau thế nào?", dap: "Thần số tính tháng và năm cá nhân từ ngày, tháng sinh (theo dương lịch, năm tính từ 1/1). Tử vi đọc tháng âm lịch theo tứ hoá của tháng trên lá số. Bát tự đọc tháng theo tiết khí (đổi tháng ở ngày giao tiết, năm tính từ Lập xuân). Vì lịch khác nhau nên ranh giới tháng của ba cách không trùng khít." },
    { hoi: "Khi các cách nói khác nhau thì tin cách nào?", dap: "Ưu tiên lớp lớn trước: giai đoạn mười năm, rồi năm, rồi mới đến tháng. Tháng mà hai lá số cùng một mức được đưa lên đầu chương 12 tháng." },
    { hoi: "Năm tới tính từ khi nào?", dap: "Năm âm lịch tính từ Tết Nguyên đán theo âm lịch Việt Nam; năm Bát tự tính từ Lập xuân (khoảng 4/2); năm cá nhân thần số tính từ 1/1 dương lịch. Trang ghi rõ mốc ở từng phần." },
    { hoi: "Có mất phí không?", dap: "Ba tháng tới và phần tóm tắt năm luôn miễn phí. Mười hai tháng chi tiết, năm đầy đủ và phần nên tránh – nên làm mở bằng Sao khi tính năng thu Sao được bật; trong giai đoạn ra mắt đang miễn phí." },
  ],
  lienKet: [{ href: "/nam", ten: "Xem theo năm" }, { href: "/xem-sao-han", ten: "Sao hạn theo tuổi" }, { href: "/xem-tuoi-lam-nha", ten: "Tuổi làm nhà, cưới hỏi" },
    { href: "/tuoi-xong-dat", ten: "Tuổi xông đất" }, { href: "/hom-nay", ten: "Hôm nay của bạn" }],
};
