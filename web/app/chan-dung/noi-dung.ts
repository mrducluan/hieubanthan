// CD-1 — chữ giới thiệu + hỏi đáp mặc định của /chan-dung (sổ trang đọc lại; CMS ghi đè được).
import type { NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";

export const ND_CHAN_DUNG: NoiDungCongCu = {
  duong: "/chan-dung",
  ten: "Chân dung tổng hợp",
  moTa: "Đặt lá số Tử vi, lá số Bát tự và điều bạn tự quan sát trên gương mặt cạnh nhau theo từng mảng đời: công việc, tiền bạc, tình cảm, gia đình, sức khoẻ, năm nay — mảng nào ba cách cùng thấy, mảng nào nhìn khác nhau. Không điểm số.",
  doan: [
    "Mỗi môn huyền học nhìn bạn từ một phía: Tử vi nhìn hoàn cảnh quanh bạn (việc, tiền, nhà, người), Bát tự nhìn sức của chính bạn (hành đang nhiều, hành đang thiếu), nhân tướng nhìn điều bạn đang thấy ở mình bây giờ. Trang này không trộn ba thứ thành một con số; nó đặt ba cách nhìn cạnh nhau theo từng mảng đời và nói rõ chỗ nào các cách cùng thấy, chỗ nào khác nhau và vì sao.",
    "Cần lá số (giờ sinh, giới tính, nơi sinh). Có thêm khảo sát gương mặt ở trang Nhân tướng học thì có cách nhìn thứ ba; chưa có thì vẫn đọc được với hai lá số. Mỗi hộp trong bài vẫn là hộp gốc của từng môn — bấm “Đúng với mình” thì phiếu đi về đúng môn đã nói câu ấy.",
    "Chương đầu (ma trận và các mảng cùng thấy) luôn miễn phí. Các chương sau mở bằng Sao khi tính năng thu Sao được bật; giai đoạn ra mắt đang miễn phí. Không lưu ngày giờ sinh trên máy chủ.",
  ],
  hoiDap: [
    { hoi: "Trang có cộng điểm ba môn lại không?", dap: "Không. Mỗi mảng chỉ ghi mức của từng cách xem (Thuận lợi, Cân bằng, Cần lưu ý) đúng như bài đọc của môn đó, rồi nói các cách cùng thấy hay nhìn khác nhau. Không có điểm tổng, không xếp hạng." },
    { hoi: "Khi ba cách nói khác nhau thì tin cách nào?", dap: "Không cách nào sai — mỗi cách soi một mặt. Trang gợi ý lấy mặt dè dặt nhất làm khung an toàn và mặt thuận để quyết việc đã chuẩn bị kỹ. Mảng nhiều cách cùng thấy thì đáng tin hơn mảng chỉ một cách nói." },
    { hoi: "Chưa làm khảo sát gương mặt thì sao?", dap: "Vẫn đọc được với hai lá số Tử vi và Bát tự. Cột Nhân tướng để trống; làm khảo sát ở trang Nhân tướng học (5 phút, không cần ảnh) rồi quay lại là có cách nhìn thứ ba." },
    { hoi: "Thần số học có trong chân dung này không?", dap: "Chưa. Thần số dùng ngày sinh dương lịch và không chấm mức theo mảng đời như ba môn phương Đông, nên để riêng ở trang Thần số học và Thời gian tới." },
  ],
  lienKet: [{ href: "/tu-vi", ten: "Lá số Tử vi" }, { href: "/bat-tu", ten: "Lá số Bát tự" }, { href: "/nhan-tuong", ten: "Nhân tướng học" },
    { href: "/thoi-gian-toi", ten: "Thời gian tới của bạn" }],
};
