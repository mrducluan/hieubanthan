// GĐ 3 — Thư viện Tình huống Hỏi–Đáp Đa Hệ Thống (/hoi-dap & /hoi-dap/[slug]).
// NGUYÊN TẮC MINH BẠCH (NĐ 38/2021 & Luật 91/2025):
// - Mọi tình huống dưới đây là "Tình huống minh hoạ tổng hợp" do Ban biên tập Hiểu Bản Thân xây dựng từ các câu hỏi
//   đời sống phổ biến — KHÔNG dùng tên thật, KHÔNG lộ dữ liệu cá nhân, KHÔNG bịa kết quả khách hàng.
// - Cấu trúc 3 phần chuẩn đối chiếu đa hệ thống: (1) Bối cảnh ẩn danh · (2) Đối chiếu đa hệ thống · (3) Gợi ý hành động thực tế.
// - Tuyệt đối không phán định mệnh, không chẩn đoán bệnh lý, không hứa lợi nhuận, không chứa SĐT/liên kết ngoài.

export type MangHoiDap = "tuvi" | "battu" | "thanso" | "phongthuy" | "kinhdich" | "thoi_gian";

export type ChuDeHoiDap =
  | "su_nghiep"
  | "tai_chinh"
  | "tinh_cam"
  | "nha_cua"
  | "quyet_dinh"
  | "nhip_song";

export interface TinhHuongHoiDap {
  slug: string;
  mang: MangHoiDap;
  tenMang: string;
  chuDe: ChuDeHoiDap;
  tenChuDe: string;
  cauHoi: string;
  tomTat: string;
  boiCanhAnDanh: string;
  doiChieuDaHeThong: { heThong: string; nhanDinh: string }[];
  diemTrungVaKhac: string;
  hanhDongThucTe: string[];
  hoiDapNgan: { hoi: string; dap: string }[];
  duongCongCu: string;
  tenCongCu: string;
  ngayCapNhat: string;
}

export const NHAN_MANG: Record<MangHoiDap, string> = {
  tuvi: "Tử vi",
  battu: "Bát tự",
  thanso: "Thần số học",
  phongthuy: "Phong thuỷ",
  kinhdich: "Kinh Dịch",
  thoi_gian: "Thời gian tới 2027",
};

export const NHAN_CHU_DE: Record<ChuDeHoiDap, string> = {
  su_nghiep: "Công việc & Đổi hướng",
  tai_chinh: "Tiền bạc & Kinh doanh",
  tinh_cam: "Gia đình & Gắn bó",
  nha_cua: "Nhà cửa & Không gian",
  quyet_dinh: "Chọn bước đi lớn",
  nhip_song: "Nhịp sống & Cân bằng",
};

export const TINH_HUONG_HOI_DAP: readonly TinhHuongHoiDap[] = [
  {
    slug: "chuyen-viec-tuoi-30-khi-dai-han-doi-chieu",
    mang: "tuvi",
    tenMang: "Tử vi",
    chuDe: "su_nghiep",
    tenChuDe: "Công việc & Đổi hướng",
    cauHoi: "Ngoài 30 tuổi muốn đổi việc khi công việc hiện tại ổn định nhưng cạn hứng thú: nhìn từ Tử vi và Bát tự ra sao?",
    tomTat: "Cách phân biệt giữa cảm giác chán ngắn hạn và bước chuyển chu kỳ thật sự khi đối chiếu cung Quan Lộc, Thiên Di và nhịp năm cá nhân.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: người đi làm 7–9 năm trong môi trường ổn định, sắp bước sang một đại vận mới trong Tử vi, đang phân vân giữa ở lại chờ thăng chức hay chuyển sang vị trí mới rủi ro hơn.",
    doiChieuDaHeThong: [
      { heThong: "Tử vi (Quan Lộc – Thiên Di)", nhanDinh: "Khi giáp ranh đổi đại hạn 10 năm, bộ sao ở cung Thiên Di thường thúc đẩy cảm giác muốn rời vùng quen. Nếu cung Tài Bạch vẫn vững, nên chuyển có lộ trình thay vì nghỉ ngang." },
      { heThong: "Bát tự (Quan Ấn – Thực Thương)", nhanDinh: "Giai đoạn Thực Thương vượng làm tăng nhu cầu tự chủ và sáng tạo; nếu môi trường cũ quá gò bó, năng lượng dễ bị nén thành mệt mỏi." },
      { heThong: "Thần số học (Năm cá nhân)", nhanDinh: "Năm số 5 hoặc số 1 thường hợp thử vai trò mới; năm số 4 hoặc số 7 lại hợp tích luỹ kỹ năng và chuẩn bị hồ sơ trước khi nhảy." },
    ],
    diemTrungVaKhac: "Cả ba hệ thống đều cho thấy mong muốn thay đổi là có cơ sở chu kỳ chứ không chỉ là tâm trạng nhất thời; điểm khác nằm ở tốc độ: Tử vi khuyên kiểm tra độ dày tài chính dự phòng trước khi cắt đứt nguồn thu cũ.",
    hanhDongThucTe: [
      "Giữ quỹ dự phòng chi tiêu tối thiểu 6 tháng trước khi nộp đơn nghỉ việc.",
      "Thử phỏng vấn 3–5 nơi hoặc nhận một dự án song song để đo giá trị thị trường thật thay vì đoán.",
      "Chọn quý có nhịp lưu nguyệt thuận cho cung Thiên Di để ký hợp đồng mới và bàn giao êm gọn.",
    ],
    hoiDapNgan: [
      { hoi: "Giáp ranh đổi đại hạn Tử vi có nhất thiết phải đổi việc ngay không?", dap: "Không bắt buộc. Đổi đại hạn cho thấy ưu tiên sống đang dịch chuyển; bạn có thể đổi vai trò ngay trong công ty cũ nếu môi trường vẫn còn dư địa học hỏi." },
      { hoi: "Nên chuẩn bị gì trước khi quyết định chuyển nghề?", dap: "Kiểm lại quỹ dự phòng, kỹ năng mang theo được và mục tiêu 2 năm tới, sau đó đối chiếu thêm nhịp 12 tháng tới để chọn thời điểm ít áp lực nhất." },
    ],
    duongCongCu: "/tu-vi",
    tenCongCu: "Lập lá số Tử vi của bạn",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "mo-kinh-doanh-nho-nam-dinh-mui-2027",
    mang: "thoi_gian",
    tenMang: "Thời gian tới 2027",
    chuDe: "tai_chinh",
    tenChuDe: "Tiền bạc & Kinh doanh",
    cauHoi: "Dự định mở cửa hàng hoặc kinh doanh nhỏ trong năm Đinh Mùi 2027: làm sao chọn đúng quý khởi động?",
    tomTat: "Khung đánh giá thời điểm khai trương và thử nghiệm vốn nhỏ trong năm 2027 theo nhịp 12 tháng cá nhân và Bát tự.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: người có khoản vốn tích luỹ vừa phải, muốn mở mô hình dịch vụ hoặc bán lẻ trong năm Đinh Mùi 2027 nhưng lo ngại chi phí cố định cao ngay từ đầu.",
    doiChieuDaHeThong: [
      { heThong: "Thời gian tới 2027 (Nhịp 12 tháng)", nhanDinh: "Không phải cả 12 tháng trong một năm đều giống nhau. Nên tách rõ tháng thử nghiệm sản phẩm (chi phí nhỏ) và tháng khai trương mở rộng." },
      { heThong: "Bát tự (Tài tinh & Tỷ Kiếp)", nhanDinh: "Năm có Tỷ Kiếp mạnh thường đi kèm cạnh tranh cao và dễ phát sinh chi chung; càng cần rõ ràng hợp đồng góp vốn và giới hạn trần chi phí." },
      { heThong: "Kinh Dịch (Quẻ hỏi việc)", nhanDinh: "Hỏi quẻ tập trung vào một biến số cụ thể như 'có nên thuê mặt bằng lớn ngay quý 1 không' cho tín hiệu rõ hơn hỏi chung chung." },
    ],
    diemTrungVaKhac: "Điểm chung là tránh dồn toàn bộ vốn vào một điểm rơi duy nhất; nên chia 3 giai đoạn nhỏ để kiểm chứng nhu cầu khách hàng trước khi khoá hợp đồng thuê dài hạn.",
    hanhDongThucTe: [
      "Chia vốn thành 3 phần: thử nghiệm 20%, vận hành 6 tháng đầu 50%, dự phòng xoay vòng 30%.",
      "Dùng mục 'Việc bạn định làm: tháng nào hợp' trên công cụ Thời gian tới để chọn 2 tháng có nhịp thuận nhất cho bước ra mắt.",
      "Nếu có người góp vốn, lập văn bản rõ tỷ lệ chia, quyền quyết định và điều khoản rút vốn ngay từ ngày đầu.",
    ],
    hoiDapNgan: [
      { hoi: "Năm Đinh Mùi 2027 có hợp mở kinh doanh cho mọi tuổi không?", dap: "Không có năm nào hợp hoặc kỵ chung cho tất cả mọi người. Mức độ thuận phụ thuộc vào lá số riêng, dòng tiền thực tế và tháng bạn chọn khởi động." },
      { hoi: "Nên chọn ngày khai trương trước hay chốt mô hình trước?", dap: "Luôn chốt mô hình, dòng tiền và nguồn khách trước; chọn ngày giờ tốt là bước sắp xếp tâm thế và lịch trình gọn gàng sau cùng." },
    ],
    duongCongCu: "/thoi-gian-toi?nam=2027",
    tenCongCu: "Xem nhịp 12 tháng năm 2027 của bạn",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "bat-tu-can-bang-nghe-nghiep-dung-than",
    mang: "battu",
    tenMang: "Bát tự",
    chuDe: "su_nghiep",
    tenChuDe: "Công việc & Đổi hướng",
    cauHoi: "Đọc Dụng thần trong Bát tự để chọn môi trường làm việc: hiểu thế nào cho thực tế, không máy móc theo ngũ hành?",
    tomTat: "Chuyển ngũ hành Dụng thần (Mộc, Hoả, Thổ, Kim, Thuỷ) thành phong cách làm việc, vai trò đội nhóm và nhịp ra quyết định thay vì chỉ chọn màu áo.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: người đã biết Nhật chủ và Dụng thần trong Bát tự nhưng băn khoăn vì nghe nhiều nơi chỉ khuyên đổi màu sắc hoặc chuyển ngành hoàn toàn.",
    doiChieuDaHeThong: [
      { heThong: "Bát tự (Nhật chủ – Dụng thần)", nhanDinh: "Dụng thần phản ánh yếu tố giúp tổng thể mệnh cục cân bằng: ví dụ cần Kim nhấn mạnh kỷ luật, quy trình và tiêu chuẩn rõ; cần Mộc nhấn mạnh học hỏi, tăng trưởng và kết nối." },
      { heThong: "Thần số học (Đường đời – Sứ mệnh)", nhanDinh: "Bổ sung góc nhìn về động lực bên trong: cùng một vai trò quản trị nhưng người số 1 hợp dẫn đầu, người số 6 hợp chăm sóc đội nhóm." },
    ],
    diemTrungVaKhac: "Bát tự chỉ ra môi trường giúp bạn bền sức dài hạn, còn Thần số học làm rõ cách bạn tạo giá trị nổi bật trong môi trường đó — không nhất thiết phải bỏ hẳn chuyên môn đang có.",
    hanhDongThucTe: [
      "Giữ chuyên môn cốt lõi, nhưng điều chỉnh vai trò hàng ngày (quy trình, sáng tạo, đối ngoại hay phân tích) theo nhóm năng lượng bạn thấy mình bền sức nhất.",
      "Quan sát 30 ngày: việc nào làm xong thấy sáng đầu, việc nào làm ít nhưng nhanh cạn năng lượng để tự kiểm chứng.",
      "Tránh bỏ việc đột ngột chỉ vì một nhãn ngũ hành đọc nhanh trên mạng.",
    ],
    hoiDapNgan: [
      { hoi: "Dụng thần có nghĩa là phải làm đúng ngành thuộc ngũ hành đó không?", dap: "Không. Trong bất kỳ ngành nào cũng có đủ vai trò: vận hành có quy chuẩn (Kim), truyền thông sáng tạo (Hoả), xây nền tảng dài hạn (Thổ), nghiên cứu mở rộng (Mộc), linh hoạt kết nối (Thuỷ)." },
    ],
    duongCongCu: "/bat-tu",
    tenCongCu: "Xem Bát tự & Dụng thần của bạn",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "nam-ca-nhan-so-4-va-so-7-cam-giac-chung-lai",
    mang: "thanso",
    tenMang: "Thần số học",
    chuDe: "nhip_song",
    tenChuDe: "Nhịp sống & Cân bằng",
    cauHoi: "Bước vào Năm cá nhân số 4 hoặc số 7 thấy mọi thứ chậm lại: nên cố đẩy nhanh hay đổi chiến lược?",
    tomTat: "Cách tận dụng đúng bản chất của năm củng cố nền tảng (số 4) và năm chiều sâu (số 7) để tạo đà cho chu kỳ bứt tốc kế tiếp.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: người quen nhịp tăng trưởng nhanh những năm trước, sang năm mới thấy kế hoạch hay bị kéo dài thời gian và dễ sốt ruột so sánh với xung quanh.",
    doiChieuDaHeThong: [
      { heThong: "Thần số học (Chu kỳ 9 năm)", nhanDinh: "Năm số 4 đặt trọng tâm vào hệ thống, kỷ luật, giấy tờ và nền móng; năm số 7 đặt trọng tâm vào học sâu, rà soát chất lượng và lắng nghe bản thân." },
      { heThong: "Tử vi (Lưu niên 12 tháng)", nhanDinh: "Giúp phân biệt tháng nào thật sự chậm trên toàn cục và tháng nào vẫn có cửa mở để hoàn tất mục tiêu cụ thể." },
    ],
    diemTrungVaKhac: "Cả hai hệ thống đều nhấn mạnh rằng nhịp chậm không đồng nghĩa với thất bại — đó là giai đoạn sửa nền trước khi lên tầng cao hơn.",
    hanhDongThucTe: [
      "Giảm số lượng mục tiêu song song xuống còn 2 việc quan trọng nhất để làm tới nơi tới chốn.",
      "Dành 30% thời gian năm nay để chuẩn hoá quy trình, học thêm một năng lực lõi hoặc dọn gọn tài chính cá nhân.",
      "Đo tiến độ theo chất lượng nền tảng tích luỹ được thay vì chỉ nhìn tốc độ bề nổi.",
    ],
    hoiDapNgan: [
      { hoi: "Năm cá nhân số 4 có nên tránh mọi cơ hội mới không?", dap: "Không cần né tránh; chỉ cần thẩm định kỹ điều kiện hợp đồng, ngân sách và khối lượng cam kết trước khi gật đầu." },
    ],
    duongCongCu: "/than-so",
    tenCongCu: "Tính Năm cá nhân Thần số học",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "vo-chong-khac-khau-nhin-tu-phu-the-va-hop-doi",
    mang: "tuvi",
    tenMang: "Tử vi",
    chuDe: "tinh_cam",
    tenChuDe: "Gia đình & Gắn bó",
    cauHoi: "Hai người thương nhau nhưng hay bất đồng cách nói chuyện: xem cung Phu Thê và Hợp đôi giúp tháo gỡ điểm nào?",
    tomTat: "Tách bạch giữa 'khác nhịp giao tiếp' và 'không hợp lâu dài' qua lăng kính Tử vi, Bát tự và Thần số học đôi.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: cặp đôi cùng mục tiêu xây dựng gia đình nhưng thường căng thẳng khi bàn chuyện tiền bạc, phân chia việc nhà hoặc mỗi khi một bên chịu áp lực công việc.",
    doiChieuDaHeThong: [
      { heThong: "Tử vi (Cung Phu Thê & Mệnh)", nhanDinh: "Nhiều cặp có sao chủ lý trí mạnh (như Vũ Khúc, Thất Sát) gặp người giàu cảm xúc (như Thiên Đồng, Thái Âm): một bên muốn chốt giải pháp ngay, bên kia cần được lắng nghe trước." },
      { heThong: "Thần số học đôi", nhanDinh: "Cho thấy rất rõ khác biệt về nhu cầu không gian riêng và cách thể hiện sự quan tâm (bằng lời nói hay bằng hành động thực tế)." },
      { heThong: "Bát tự (Nhật chi cung phối ngẫu)", nhanDinh: "Nhấn mạnh giai đoạn nào cả hai cùng chịu áp lực công việc thì dễ kéo căng về nhà, cần quy ước 'giờ hạ nhiệt' trước khi tranh luận." },
    ],
    diemTrungVaKhac: "Điểm trùng lớn nhất: phần lớn va chạm đến từ khác phong cách xử lý áp lực, không phải thiếu thiện chí. Hiểu đúng kiểu phản ứng của nhau giảm hẳn cảm giác bị tấn công cá nhân.",
    hanhDongThucTe: [
      "Thống nhất nguyên tắc: không bàn chuyện tài chính hoặc chuyện lớn khi một trong hai đang quá mệt sau giờ làm.",
      "Tách rõ 2 bước khi trao đổi: 10 phút đầu chỉ nghe nhau nói hết ý, sau đó mới cùng viết ra phương án xử lý.",
      "Định kỳ mỗi tháng có một buổi trò chuyện nhẹ về ngân sách chung và lịch trình gia đình.",
    ],
    hoiDapNgan: [
      { hoi: "Nghe nói tuổi xung khắc thì có nên dừng lại không?", dap: "Tuổi theo năm sinh chỉ là một mảnh rất nhỏ. Hôn nhân bền nhờ mức độ tôn trọng, cách giải quyết bất đồng và mục tiêu chung — các hệ thống chỉ giúp nhận diện điểm dễ va chạm để chủ động điều chỉnh." },
    ],
    duongCongCu: "/hop-doi",
    tenCongCu: "Xem Hợp đôi đa hệ thống",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "mua-chung-cu-huong-cua-va-ban-cong-khac-nhau",
    mang: "phongthuy",
    tenMang: "Phong thuỷ",
    chuDe: "nha_cua",
    tenChuDe: "Nhà cửa & Không gian",
    cauHoi: "Mua căn hộ chung cư: nên tính hướng theo cửa ra vào hay theo ban công, và nếu không trùng mệnh quái thì xử lý sao?",
    tomTat: "Cách cân bằng giữa Bát Trạch, ánh sáng – thông gió tự nhiên và bố trí phòng ngủ, bàn làm việc thực tế cho căn hộ hiện đại.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: gia đình trẻ chuẩn bị chọn căn hộ chung cư tầng trung, ưng vị trí và ánh sáng nhưng phân vân vì hướng cửa chính khác hướng ban công.",
    doiChieuDaHeThong: [
      { heThong: "Phong thuỷ (Bát Trạch & Hình thế)", nhanDinh: "Trong chung cư hiện đại, ban công và cửa sổ lớn là nơi nạp khí và ánh sáng mạnh nhất, còn cửa chính là đường lưu thông. Ưu tiên trước hết vẫn là nhà thoáng, đủ sáng, không bí khí, không ồn quá mức." },
      { heThong: "Bố trí nội thất (Phòng ngủ – Bếp – Bàn làm việc)", nhanDinh: "Ngay cả khi hướng tổng thể chưa trùng tuyệt đối mệnh quái, việc đặt đầu giường vững, bếp gọn sạch và bàn làm việc quay hướng thuận mắt vẫn tạo khác biệt lớn về chất lượng sinh hoạt." },
    ],
    diemTrungVaKhac: "Các trường phái đều gặp nhau ở một điểm cốt lõi: môi trường sống sáng, thoáng, yên tĩnh và gọn gàng quan trọng hơn việc bỏ qua một căn hộ tốt chỉ vì lệch một cung trên giấy.",
    hanhDongThucTe: [
      "Kiểm tra thực tế ánh sáng buổi sáng/chiều, tiếng ồn giao thông và hướng gió tại căn hộ ở ít nhất 2 khung giờ khác nhau.",
      "Đo hướng chính xác bằng la bàn và vẽ sơ đồ mặt bằng để xác định vị trí giường ngủ, bàn làm việc và bếp.",
      "Ưu tiên thông thoáng lối vào cửa chính, ánh sáng ấm ở phòng khách và tránh để gương đối diện trực tiếp giường ngủ.",
    ],
    hoiDapNgan: [
      { hoi: "Vợ chồng khác nhóm Đông – Tây Tứ Trạch thì chọn nhà theo ai?", dap: "Theo lối truyền thống thường ưu tiên người đứng tên/trụ cột cho hướng tổng thể, rồi điều chỉnh hướng giường ngủ, bàn làm việc và khu bếp sao cho cả hai đều thấy dễ chịu." },
    ],
    duongCongCu: "/phong-thuy",
    tenCongCu: "Đo hướng & xem Phong thuỷ nhà",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "hoi-que-kinh-dich-truoc-quyet-dinh-hop-tac",
    mang: "kinhdich",
    tenMang: "Kinh Dịch",
    chuDe: "quyet_dinh",
    tenChuDe: "Chọn bước đi lớn",
    cauHoi: "Khi đứng trước một lời mời hợp tác khó chọn, đặt câu hỏi Kinh Dịch thế nào để nhận góc nhìn sáng rõ nhất?",
    tomTat: "Nguyên tắc đặt câu hỏi 1 biến số, đọc cấu trúc Quẻ Chủ – Hào Động – Quẻ Biến như một khung quản trị rủi ro.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: người nhận được lời mời đồng sáng lập dự án mới cùng người quen, thấy cơ hội hấp dẫn nhưng vẫn còn cảm giác băn khoăn chưa rõ nguyên nhân.",
    doiChieuDaHeThong: [
      { heThong: "Kinh Dịch (Quẻ Chủ – Quẻ Biến)", nhanDinh: "Quẻ Chủ phản ánh trạng thái hiện tại, Hào Động chỉ ra điểm đang chuyển hoá hoặc mắt xích dễ lung lay, còn Quẻ Biến gợi hướng diễn tiến nếu giữ nguyên cách làm hiện nay." },
      { heThong: "Tư duy phản biện thực tế", nhanDinh: "Kinh Dịch hữu ích nhất khi giúp bạn nhìn thấy câu hỏi mình đang né tránh (ví dụ: ranh giới trách nhiệm, năng lực tài chính thật của đối tác)." },
    ],
    diemTrungVaKhac: "Quẻ không thay thế thẩm định pháp lý hay hợp đồng; giá trị lớn nhất là buộc người hỏi gọi tên rõ mục tiêu và rủi ro trước khi ký.",
    hanhDongThucTe: [
      "Viết câu hỏi gọn trong 1 câu, gắn mốc thời gian cụ thể (ví dụ: trong 6 tháng tới) thay vì hỏi 'có giàu không'.",
      "Chỉ lập một quẻ cho một vấn đề; tránh lập đi lập lại nhiều lần đến khi ra quẻ vừa ý.",
      "Chuyển lưu ý từ Hào Động thành 3 câu hỏi kiểm chứng trực tiếp với đối tác trước khi ký kết.",
    ],
    hoiDapNgan: [
      { hoi: "Gặp quẻ có vẻ thử thách thì có phải bỏ hẳn cơ hội không?", dap: "Không hẳn. Nhiều quẻ thử thách trong Kinh Dịch khuyên chậm lại, củng cố điều kiện hoặc thu nhỏ quy mô thử nghiệm thay vì tiến vội." },
    ],
    duongCongCu: "/kinh-dich",
    tenCongCu: "Lập quẻ Kinh Dịch hỏi việc",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "quan-ly-dong-tien-nam-bien-dong-tai-bach",
    mang: "battu",
    tenMang: "Bát tự",
    chuDe: "tai_chinh",
    tenChuDe: "Tiền bạc & Kinh doanh",
    cauHoi: "Thu nhập khá nhưng cuối năm khó giữ được tiền: góc nhìn Bát tự và Tử vi gợi ý cách khoá rò rỉ thế nào?",
    tomTat: "Nhận diện thói quen chi tiêu cảm xúc, rủi ro đầu tư theo phong trào và cách thiết kế kỷ luật tài chính phù hợp bản tính.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: người có thu nhập đều nhưng thường hao hụt vào các khoản chi đột xuất, giúp đỡ người quen hoặc rót tiền vào kênh đầu tư chưa tìm hiểu sâu.",
    doiChieuDaHeThong: [
      { heThong: "Bát tự (Tài lộ / Tỷ Kiếp)", nhanDinh: "Cấu trúc Tài lộ thường giỏi kiếm tiền nhưng dễ tiêu thoáng tay hoặc dễ bị rủ rê góp chung khi thiếu quy tắc giữ tiền tự động." },
      { heThong: "Tử vi (Cung Tài Bạch – Điền Trạch)", nhanDinh: "Nếu Tài Bạch biến động mạnh nhưng Điền Trạch vững, cách giữ của phù hợp là chuyển sớm tiền dư sang tài sản tích luỹ dài hạn, ít thanh khoản tức thì." },
    ],
    diemTrungVaKhac: "Cả hai hệ thống đều chỉ ra giải pháp không nằm ở việc 'cầu may', mà ở thiết kế hệ thống trích tiết kiệm tự động ngay ngày nhận lương.",
    hanhDongThucTe: [
      "Tự động tách 20–30% thu nhập sang tài khoản tích luỹ riêng ngay trong 24 giờ đầu nhận tiền.",
      "Đặt quy tắc chờ 72 giờ trước mọi khoản chi lớn hoặc lời mời góp vốn.",
      "Chỉ phân bổ tiền vào các kênh bạn hiểu rõ cơ chế sinh lời và chịu được mức biến động thực tế.",
    ],
    hoiDapNgan: [
      { hoi: "Lá số có dấu hiệu hao tài thì có cách nào cải thiện không?", dap: "Có: dùng kỷ luật hệ thống (tách tài khoản, hạn mức chi, quỹ dự phòng) để thay thế cho việc dựa vào ý chí nhất thời." },
    ],
    duongCongCu: "/bat-tu",
    tenCongCu: "Xem Bát tự & nhịp Tài vận",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "sua-nha-hay-xay-nha-khi-gap-nam-kieng-dan-gian",
    mang: "phongthuy",
    tenMang: "Phong thuỷ",
    chuDe: "nha_cua",
    tenChuDe: "Nhà cửa & Không gian",
    cauHoi: "Cần sửa nhà hoặc xây nhà nhưng năm dự kiến rơi vào Kim Lâu / Hoang Ốc: nên hiểu tập quán này ra sao cho tỉnh táo?",
    tomTat: "Phân biệt sửa chữa nhỏ, cải tạo nội thất và động thổ xây mới; cách lên kế hoạch thực tế kết hợp tập quán Việt.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: gia đình có nhu cầu sửa sang lại không gian sống để đón thêm thành viên mới nhưng lo ngại vì tra nhanh thấy năm đó vướng tuổi dân gian.",
    doiChieuDaHeThong: [
      { heThong: "Tập quán xây dựng Việt (Tam Tai – Kim Lâu – Hoang Ốc)", nhanDinh: "Tập quán truyền thống áp dụng chủ yếu cho việc động thổ xây mới phần kết cấu lớn; các hạng mục sơn sửa, thay nội thất, chống thấm thường không quá nặng nề." },
      { heThong: "Thời gian tới & Ngân sách thực tế", nhanDinh: "Rủi ro lớn nhất khi xây sửa thường đến từ trượt dự toán, chọn nhà thầu vội hoặc thi công đúng mùa mưa bão — cần kiểm soát chặt các yếu tố này trước." },
    ],
    diemTrungVaKhac: "Hiểu rõ nguồn gốc tập quán giúp gia đình vừa giữ được sự yên tâm về mặt tinh thần, vừa không trì hoãn vô lý những hạng mục sửa chữa cần thiết cho an toàn sinh hoạt.",
    hanhDongThucTe: [
      "Phân loại rõ: nếu chỉ cải tạo nhẹ nội thất thì tập trung vào chất lượng thi công và lịch gọn gàng; nếu xây mới toàn bộ thì tham khảo thêm năm kế tiếp hoặc thủ tục truyền thống phù hợp gia đình.",
      "Dự phòng ít nhất 15–20% ngân sách phát sinh và ký hợp đồng thi công ghi rõ tiến độ, vật tư.",
      "Tra thêm lịch ngày đẹp theo tuổi của các thành viên chính để chọn ngày khởi công thuận tiện.",
    ],
    hoiDapNgan: [
      { hoi: "Sửa bếp hoặc sơn lại phòng ngủ có tính là làm nhà không?", dap: "Theo tập quán phổ biến, sơn sửa nhẹ và thay đồ nội thất không được xem là đại sự động thổ xây mới." },
    ],
    duongCongCu: "/xem-tuoi-lam-nha",
    tenCongCu: "Tra tuổi làm nhà theo năm",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "chon-nganh-hoc-va-huong-di-cho-nguoi-tre-tuoi-20",
    mang: "thanso",
    tenMang: "Thần số học",
    chuDe: "su_nghiep",
    tenChuDe: "Công việc & Đổi hướng",
    cauHoi: "Tuổi 18–24 phân vân chọn ngành học hoặc đổi chuyên ngành: kết hợp Thần số học và Tử vi như thế nào?",
    tomTat: "Dùng bản đồ tính cách để thu hẹp 2–3 nhóm năng lực nổi trội thay vì đóng khung tương lai vào một tên nghề duy nhất.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: sinh viên năm hai hoặc người mới đi làm cảm thấy ngành đang học không khớp với thế mạnh tự nhiên nhưng sợ đổi hướng sẽ lãng phí thời gian.",
    doiChieuDaHeThong: [
      { heThong: "Thần số học (Đường đời – Linh hồn – Biểu đạt)", nhanDinh: "Giúp phân biệt giữa điều bạn giỏi làm (Biểu đạt), điều khiến bạn thấy có ý nghĩa (Linh hồn) và bài học trưởng thành dài hạn (Đường đời)." },
      { heThong: "Tử vi (Mệnh – Quan Lộc)", nhanDinh: "Gợi ý môi trường phù hợp: làm chuyên môn sâu độc lập, làm việc với con người hay quản trị tổ chức." },
    ],
    diemTrungVaKhac: "Cả hai hệ thống đều chỉ ra xu hướng năng lực cốt lõi, không phải một danh sách nghề cứng nhắc — vì thị trường nghề nghiệp thay đổi rất nhanh theo công nghệ.",
    hanhDongThucTe: [
      "Chọn 2 hướng nghề gần với nhóm thế mạnh nhất và nói chuyện trực tiếp với ít nhất 2 người đang làm thật trong nghề đó.",
      "Làm một dự án thực hành ngắn 4 tuần để kiểm chứng xem bạn thích công việc hàng ngày hay chỉ thích hình ảnh bề ngoài của nghề.",
      "Tận dụng nền tảng môn học đã có như một lợi thế lai thay vì xoá sạch làm lại từ số 0.",
    ],
    hoiDapNgan: [
      { hoi: "Có nên chọn đại học chỉ dựa trên một con số Đường đời không?", dap: "Không nên. Con số Đường đời là bản đồ gợi mở điểm mạnh; quyết định chọn ngành vẫn cần dựa trên năng lực học thực tế, nhu cầu thị trường và trải nghiệm thử." },
    ],
    duongCongCu: "/chan-dung",
    tenCongCu: "Xem Chân dung tổng hợp 4 hệ thống",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "cang-thang-cong-viec-can-bang-nhip-nghi-2027",
    mang: "thoi_gian",
    tenMang: "Thời gian tới 2027",
    chuDe: "nhip_song",
    tenChuDe: "Nhịp sống & Cân bằng",
    cauHoi: "Làm sao lên lịch nghỉ ngơi và phân bổ sức lực cho cả năm 2027 để không bị kiệt sức vào giữa năm?",
    tomTat: "Cách đọc 12 tháng năng lượng trên bản đồ Thời gian tới để đặt trước các tuần nạp lại pin và tránh dồn việc lớn vào tháng áp lực.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: người làm việc cường độ cao thường dồn lịch dày đặc từ đầu năm đến giữa năm, sau đó rơi vào trạng thái đuối sức và giảm hiệu suất nửa cuối năm.",
    doiChieuDaHeThong: [
      { heThong: "Thời gian tới 2027 (Bản đồ 12 tháng)", nhanDinh: "Mỗi năm luôn có 2–3 tháng nhịp cao (hợp bứt tốc) xen kẽ 2–3 tháng nhịp trầm (hợp rà soát và nghỉ ngơi). Nhìn trước cả năm giúp bạn chủ động đặt lịch nghỉ sớm." },
      { heThong: "Bát tự (Điều hậu & Cân bằng)", nhanDinh: "Nhấn mạnh yếu tố mùa trong năm: khi tiết khí làm mất cân bằng bản mệnh, việc giữ giấc ngủ đều và giảm lịch họp buổi tối tạo hiệu quả rõ rệt." },
    ],
    diemTrungVaKhac: "Nội dung này chỉ nhằm hỗ trợ quản lý nhịp sinh hoạt và làm việc lành mạnh, không thay thế tư vấn y tế chuyên môn khi có vấn đề sức khoẻ thực tế.",
    hanhDongThucTe: [
      "Đánh dấu sẵn 2–3 tháng cần đi chậm trên lịch năm 2027 và không nhận thêm dự án phụ trong những tháng đó.",
      "Khối lượng công việc lớn đặt vào các tháng có nhịp thuận để đạt kết quả cao hơn với ít hao tổn hơn.",
      "Nếu cảm thấy kiệt sức kéo dài hoặc rối loạn giấc ngủ nghiêm trọng, hãy trao đổi trực tiếp với bác sĩ hoặc chuyên gia chăm sóc sức khoẻ.",
    ],
    hoiDapNgan: [
      { hoi: "Bản đồ 12 tháng có dự báo sức khoẻ y khoa không?", dap: "Không. Bản đồ chỉ gợi ý nhịp năng lượng sinh hoạt và thời điểm nên giảm tải công việc mang tính văn hoá tham khảo." },
    ],
    duongCongCu: "/thoi-gian-toi?nam=2027",
    tenCongCu: "Xem bản đồ 12 tháng 2027",
    ngayCapNhat: "2026-11-24",
  },
  {
    slug: "chon-thoi-diem-cuoi-hoi-hai-ben-gia-dinh-khac-quan-diem",
    mang: "kinhdich",
    tenMang: "Kinh Dịch",
    chuDe: "tinh_cam",
    tenChuDe: "Gia đình & Gắn bó",
    cauHoi: "Hai bên gia đình có quan điểm khác nhau về năm cưới và ngày cưới: cách dung hoà bằng dữ liệu lịch và tập quán?",
    tomTat: "Cách trình bày minh bạch giữa lịch âm – dương, tuổi cô dâu chú rể và điều kiện thực tế để hai nhà dễ đi đến đồng thuận.",
    boiCanhAnDanh: "Tình huống minh hoạ tổng hợp: cặp đôi đã sẵn sàng kết hôn nhưng hai bên gia đình nghe tư vấn theo hai cách tính khác nhau về tháng cưới và tuổi đẹp.",
    doiChieuDaHeThong: [
      { heThong: "Lịch Âm – Hoàng Đạo & Tập quán cưới hỏi", nhanDinh: "Các vùng miền có đôi chút khác biệt về cách tính tuổi cưới và chọn tháng đại lợi. Tra bảng minh bạch theo nguồn rõ ràng giúp hai nhà nói chuyện trên cùng một mặt bằng dữ liệu." },
      { heThong: "Kinh Dịch (Tâm thế đồng thuận)", nhanDinh: "Gợi nhắc tinh thần 'Hoà vi quý': mục tiêu của ngày cưới là khởi đầu vui vẻ cho hai người trẻ và sự gắn kết của hai gia đình." },
    ],
    diemTrungVaKhac: "Thay vì tranh luận đúng–sai giữa các nguồn truyền miệng, hãy chọn ra 3–5 ngày cuối tuần cùng đáp ứng các tiêu chí cơ bản của cả hai nhà để cùng thống nhất.",
    hanhDongThucTe: [
      "Dùng công cụ Chọn ngày cưới hỏi cho nhiều thành viên để lọc ra 3–5 ngày đẹp không xung tuổi chính.",
      "Ưu tiên thời tiết, lịch đi lại của họ hàng hai bên và ngân sách tổ chức thoải mái.",
      "Gửi bảng so sánh gọn 1 trang cho hai bên gia đình cùng chọn phương án thuận tiện nhất.",
    ],
    hoiDapNgan: [
      { hoi: "Nếu hai trường phái cho hai ngày đẹp khác nhau thì chọn thế nào?", dap: "Tìm ngày nằm ở phần giao nhau (đều ở mức thuận của cả hai cách xem) và khớp lịch thực tế của gia đình." },
    ],
    duongCongCu: "/xem-ngay-tot",
    tenCongCu: "Chọn ngày tốt cưới hỏi",
    ngayCapNhat: "2026-11-24",
  },
];

export const tinhHuongTheoSlug = (slug: string): TinhHuongHoiDap | undefined =>
  TINH_HUONG_HOI_DAP.find((x) => x.slug === slug);

export const duongHoiDap = (slug: string) => `/hoi-dap/${slug}`;
