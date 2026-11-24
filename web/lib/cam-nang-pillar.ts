// SEO-GEO-1 — Cẩm nang cấu trúc mở (GEO / AI Overview) dùng chung cho các trang công cụ (Pillar Page).
// Mỗi mục cung cấp: (1) danh sách định nghĩa <ul><li><strong>Tên</strong>: định nghĩa 1 câu</li></ul> dễ trích xuất,
// (2) bảng so sánh <table> khi trang có nhiều trường phái/hệ thống, (3) lưới liên kết trực tiếp tới trang con cốt lõi
// (giảm click-depth cho Googlebot & AI), và (4) ngày cập nhật chuẩn ISO cho <time> + WebPage.dateModified.

export interface MucCamNang {
  ten: string;
  yNghia: string;
  href?: string;
}

export interface BangSoSanhPillar {
  tieuDe: string;
  cot: string[];
  hang: string[][];
}

export interface NhomTrangConPillar {
  tieuDe: string;
  ds: { href: string; ten: string; phu?: string }[];
}

export interface CamNangPillar {
  capNhat: string;
  tieuDe: string;
  tomTat: string;
  muc: MucCamNang[];
  bang?: BangSoSanhPillar;
  trangCon?: NhomTrangConPillar;
}

export const CAM_NANG_PILLAR: Record<string, CamNangPillar> = {
  "/than-so": {
    capNhat: "2026-11-24",
    tieuDe: "Ý nghĩa các chỉ số cốt lõi trong thần số học",
    tomTat: "Khi xem thần số học theo tên và ngày sinh, sáu chỉ số dưới đây tạo thành khung đọc chính về tính cách, động lực và nhịp thời gian của bạn:",
    muc: [
      { ten: "Số chủ đạo (Đường đời)", yNghia: "Tính từ ngày, tháng, năm sinh dương lịch; phản ánh bài học lớn, sở trường nổi bật và hướng phát triển xuyên suốt cuộc đời.", href: "/than-so/y-nghia-so" },
      { ten: "Số Sứ mệnh (Biểu đạt)", yNghia: "Tính từ toàn bộ chữ cái trong họ tên khai sinh; cho thấy cách bạn tạo ra giá trị, vai trò công việc và năng lực hành động.", href: "/than-so/nghe-nghiep" },
      { ten: "Số Linh hồn (Nội tâm)", yNghia: "Tính từ các nguyên âm trong họ tên; nói lên khát khao sâu kín, điều khiến bạn thấy đủ đầy và cách bạn tìm bình an." },
      { ten: "Số Nhân cách (Ấn tượng ngoài)", yNghia: "Tính từ các phụ âm trong họ tên; thể hiện ấn tượng ban đầu người khác cảm nhận về bạn khi mới tiếp xúc." },
      { ten: "Biểu đồ ngày sinh & Mũi tên", yNghia: "Sắp các chữ số ngày sinh vào lưới 3×3 (1–9) để thấy các trục năng lực nổi trội (mũi tên sức mạnh) và điểm cần rèn thêm (mũi tên trống)." },
      { ten: "Năm cá nhân & Đỉnh cao cuộc đời", yNghia: "Chu kỳ 9 năm liên tiếp và 4 chặng đỉnh cao giúp nhận diện giai đoạn nên mở rộng, củng cố hay chậm lại.", href: "/than-so/nam-ca-nhan" },
      { ten: "Số Nợ nghiệp (13, 14, 16, 19)", yNghia: "Bốn con số đặc biệt xuất hiện trước khi rút gọn, nhắc về các thói quen cũ cần kỷ luật và tự điều chỉnh.", href: "/than-so/no-nghiep" },
    ],
    bang: {
      tieuDe: "So sánh các trường phái & cách tính thần số học",
      cot: ["Tiêu chí", "Pitago (Pythagoras)", "Phillips (4 Kim Tự Tháp)", "Chaldea (để so sánh)"],
      hang: [
        ["Bảng chữ cái", "1–9 (A=1…I=9, lặp tuần hoàn)", "Dùng khung Pitago cho họ tên", "1–8 (bỏ số 9 trong gán chữ cái)"],
        ["Số chủ đạo", "1–9 và số cái 11, 22, 33", "2–11 và 22/4 (cộng tổng chữ số)", "Chú trọng số kép 10–52 trước khi rút gọn"],
        ["Điểm mạnh", "Phổ biến nhất, minh bạch, dễ tự kiểm", "Trực quan 4 đỉnh cao & biểu đồ ngày sinh", "Đọc sắc thái biểu tượng của số kép tên gọi"],
      ],
    },
    trangCon: {
      tieuDe: "Tra nhanh ý nghĩa 12 con số chủ đạo",
      ds: [
        { href: "/than-so/y-nghia-so/so-1", ten: "Số chủ đạo 1", phu: "Tiên phong & độc lập" },
        { href: "/than-so/y-nghia-so/so-2", ten: "Số chủ đạo 2", phu: "Kết nối & lắng nghe" },
        { href: "/than-so/y-nghia-so/so-3", ten: "Số chủ đạo 3", phu: "Biểu đạt & sáng tạo" },
        { href: "/than-so/y-nghia-so/so-4", ten: "Số chủ đạo 4", phu: "Kỷ luật & nền tảng" },
        { href: "/than-so/y-nghia-so/so-5", ten: "Số chủ đạo 5", phu: "Tự do & trải nghiệm" },
        { href: "/than-so/y-nghia-so/so-6", ten: "Số chủ đạo 6", phu: "Chăm sóc & trách nhiệm" },
        { href: "/than-so/y-nghia-so/so-7", ten: "Số chủ đạo 7", phu: "Chiêm nghiệm & phân tích" },
        { href: "/than-so/y-nghia-so/so-8", ten: "Số chủ đạo 8", phu: "Điều hành & thực tế" },
        { href: "/than-so/y-nghia-so/so-9", ten: "Số chủ đạo 9", phu: "Lý tưởng & phụng sự" },
        { href: "/than-so/y-nghia-so/so-11", ten: "Số chủ đạo 11", phu: "Trực giác & truyền cảm hứng" },
        { href: "/than-so/y-nghia-so/so-22", ten: "Số chủ đạo 22", phu: "Kiến tạo tầm lớn" },
        { href: "/than-so/y-nghia-so/so-33", ten: "Số chủ đạo 33", phu: "Nâng đỡ & chữa lành" },
      ],
    },
  },
  "/tu-vi": {
    capNhat: "2026-11-24",
    tieuDe: "Cấu trúc cốt lõi của một lá số Tử vi 12 cung",
    tomTat: "Để đọc lá số Tử vi có hệ thống thay vì rời rạc từng sao, cần nắm năm thành phần nền tảng sau:",
    muc: [
      { ten: "12 Cung chức năng", yNghia: "Gồm Mệnh, Phụ Mẫu, Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Nữ, Phu Thê và Huynh Đệ — mỗi cung đại diện một mảng đời.", href: "/tu-vi/cung" },
      { ten: "14 Chính tinh & độ sáng", yNghia: "Gồm hai vòng Tử Vi (6 sao) và Thiên Phủ (8 sao), mang độ sáng Miếu, Vượng, Đắc, Bình, Hãm tuỳ vị trí địa chi.", href: "/tu-vi/chinh-tinh" },
      { ten: "Tam phương tứ chính", yNghia: "Không đọc một cung đứng riêng; luôn xét cung chính cùng hai cung tam hợp và một cung xung chiếu để thấy bối cảnh đầy đủ." },
      { ten: "Tứ hoá (Lộc, Quyền, Khoa, Kỵ)", yNghia: "Bốn luồng biến đổi theo thiên can năm sinh, đại hạn và lưu niên, chỉ rõ điểm kích hoạt tài lộc, quyền chủ động, danh tiếng hay thử thách.", href: "/tu-vi/tu-hoa" },
      { ten: "Đại hạn 10 năm & Lưu niên", yNghia: "Đại hạn định nhịp lớn mỗi thập kỷ; lưu niên và nguyệt hạn soi cụ thể năm nay và từng tháng nên đẩy việc hay giữ nhịp." },
    ],
    bang: {
      tieuDe: "So sánh Tử vi, Bát tự và Thần số học",
      cot: ["Tiêu chí", "Tử vi Đẩu Số", "Bát tự (Tứ trụ)", "Thần số học"],
      hang: [
        ["Dữ liệu đầu vào", "Giờ, ngày, tháng, năm âm lịch + giới tính", "Giờ, ngày, tháng, năm theo tiết khí", "Họ tên + ngày sinh dương lịch"],
        ["Trọng tâm đọc", "Hoàn cảnh 12 mảng đời (việc, tiền, nhà, người)", "Sức ngũ hành dư – thiếu & nhịp 10 năm", "Tính cách, sứ mệnh, chu kỳ năm cá nhân"],
        ["Khi không rõ giờ sinh", "Cần định giờ sinh để tránh lệch cung Mệnh", "Vẫn đọc được 3 trụ năm–tháng–ngày", "Không cần giờ sinh"],
      ],
    },
    trangCon: {
      tieuDe: "Tra nhanh 14 chính tinh Tử vi",
      ds: [
        { href: "/tu-vi/chinh-tinh/sao-tu-vi", ten: "Sao Tử Vi" },
        { href: "/tu-vi/chinh-tinh/sao-thien-co", ten: "Sao Thiên Cơ" },
        { href: "/tu-vi/chinh-tinh/sao-thai-duong", ten: "Sao Thái Dương" },
        { href: "/tu-vi/chinh-tinh/sao-vu-khuc", ten: "Sao Vũ Khúc" },
        { href: "/tu-vi/chinh-tinh/sao-thien-dong", ten: "Sao Thiên Đồng" },
        { href: "/tu-vi/chinh-tinh/sao-liem-trinh", ten: "Sao Liêm Trinh" },
        { href: "/tu-vi/chinh-tinh/sao-thien-phu", ten: "Sao Thiên Phủ" },
        { href: "/tu-vi/chinh-tinh/sao-thai-am", ten: "Sao Thái Âm" },
        { href: "/tu-vi/chinh-tinh/sao-tham-lang", ten: "Sao Tham Lang" },
        { href: "/tu-vi/chinh-tinh/sao-cu-mon", ten: "Sao Cự Môn" },
        { href: "/tu-vi/chinh-tinh/sao-thien-tuong", ten: "Sao Thiên Tướng" },
        { href: "/tu-vi/chinh-tinh/sao-thien-luong", ten: "Sao Thiên Lương" },
        { href: "/tu-vi/chinh-tinh/sao-that-sat", ten: "Sao Thất Sát" },
        { href: "/tu-vi/chinh-tinh/sao-pha-quan", ten: "Sao Phá Quân" },
      ],
    },
  },
  "/bat-tu": {
    capNhat: "2026-11-24",
    tieuDe: "Năm khái niệm cốt lõi khi xem Bát tự (Tứ trụ)",
    tomTat: "Khác với cách xem mệnh theo năm sinh phổ biến, Bát tự phân tích cân bằng ngũ hành từ trọn bộ tám chữ ngày giờ sinh:",
    muc: [
      { ten: "Tứ trụ (Năm, Tháng, Ngày, Giờ)", yNghia: "Bốn cặp thiên can – địa chi tính theo tiết khí (năm đổi ở Lập xuân, tháng đổi ở ngày giao tiết), tạo thành 8 chữ Bát tự." },
      { ten: "Nhật chủ (Can ngày sinh)", yNghia: "Một trong 10 thiên can Giáp đến Quý đại diện cho bản thân bạn; mọi hành khác trong lá số được xét theo quan hệ sinh – khắc với nhật chủ.", href: "/bat-tu/nhat-chu" },
      { ten: "Ngũ hành dư – thiếu & Thân vượng/nhược", yNghia: "Chấm điểm Kim, Mộc, Thuỷ, Hoả, Thổ có tính mùa sinh và tàng can để biết sức nhật chủ mạnh hay yếu trước khi kết luận cần bù hành nào." },
      { ten: "10 Thập thần", yNghia: "Gồm Tỷ Kiên, Kiếp Tài, Thực Thần, Thương Quan, Thiên Tài, Chính Tài, Thất Sát, Chính Quan, Thiên Ấn, Chính Ấn — phản ánh cách hành xử với việc, tiền và người.", href: "/bat-tu/thap-than" },
      { ten: "Dụng thần & Đại vận 10 năm", yNghia: "Hành giúp lá số điều hoà (cân sức mạnh yếu hoặc điều hậu nóng lạnh), kết hợp đại vận 10 năm để chọn nhịp hành động phù hợp." },
    ],
    bang: {
      tieuDe: "Phân biệt Mệnh Nạp Âm theo năm sinh và Nhật chủ Bát tự",
      cot: ["Khía cạnh", "Mệnh Nạp Âm (theo năm sinh)", "Nhật chủ Bát tự (theo ngày sinh)"],
      hang: [
        ["Căn cứ tính", "Can chi của năm sinh (vd Canh Ngọ → Lộ Bàng Thổ)", "Thiên can của ngày sinh (vd Giáp Mộc, Bính Hoả)"],
        ["Độ cá nhân hoá", "Mọi người sinh cùng năm có cùng mệnh nạp âm", "Phân biệt theo ngày, tháng tiết khí và giờ sinh"],
        ["Ứng dụng chính", "Tham khảo dân gian, tuổi hợp – xung cơ bản", "Xét cân bằng 5 hành, dụng thần, đại vận 10 năm"],
      ],
    },
    trangCon: {
      tieuDe: "Tra nhanh 10 Nhật chủ trong Bát tự",
      ds: [
        { href: "/bat-tu/nhat-chu/nhat-chu-giap", ten: "Nhật chủ Giáp", phu: "Dương Mộc" },
        { href: "/bat-tu/nhat-chu/nhat-chu-at", ten: "Nhật chủ Ất", phu: "Âm Mộc" },
        { href: "/bat-tu/nhat-chu/nhat-chu-binh", ten: "Nhật chủ Bính", phu: "Dương Hoả" },
        { href: "/bat-tu/nhat-chu/nhat-chu-dinh", ten: "Nhật chủ Đinh", phu: "Âm Hoả" },
        { href: "/bat-tu/nhat-chu/nhat-chu-mau", ten: "Nhật chủ Mậu", phu: "Dương Thổ" },
        { href: "/bat-tu/nhat-chu/nhat-chu-ky", ten: "Nhật chủ Kỷ", phu: "Âm Thổ" },
        { href: "/bat-tu/nhat-chu/nhat-chu-canh", ten: "Nhật chủ Canh", phu: "Dương Kim" },
        { href: "/bat-tu/nhat-chu/nhat-chu-tan", ten: "Nhật chủ Tân", phu: "Âm Kim" },
        { href: "/bat-tu/nhat-chu/nhat-chu-nham", ten: "Nhật chủ Nhâm", phu: "Dương Thuỷ" },
        { href: "/bat-tu/nhat-chu/nhat-chu-quy", ten: "Nhật chủ Quý", phu: "Âm Thuỷ" },
      ],
    },
  },
  "/phong-thuy": {
    capNhat: "2026-11-24",
    tieuDe: "Các lớp cốt lõi khi xem phong thuỷ nhà ở hợp tuổi",
    tomTat: "Xem phong thuỷ nhà ở hiện đại không chỉ dựa vào một hướng cửa mà kết hợp bốn lớp kiểm tra thực tế:",
    muc: [
      { ten: "Cung phi & Bát trạch theo tuổi", yNghia: "Từ năm sinh và giới tính xác định Đông Tứ Mệnh hay Tây Tứ Mệnh, từ đó chia 4 hướng cát (Sinh Khí, Thiên Y, Diên Niên, Phục Vị) và 4 hướng hung.", href: "/phong-thuy/huong-hop-tuoi" },
      { ten: "Huyền Không Phi Tinh theo vận", yNghia: "Đo độ số cửa chính để lập tinh bàn 9 cung theo vận nhà (hiện là Vận 9, 2024–2043), thấy nơi tụ khí và nơi cần giữ tĩnh." },
      { ten: "Hướng xấu lưu niên trong năm", yNghia: "Xác định phương Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng và Nhị Hắc của năm hiện tại để tránh động thổ hay sửa chữa lớn phía đó.", href: "/phong-thuy/huong-xau-nam" },
      { ten: "Khảo sát bố cục từng phòng", yNghia: "Kiểm tra các dấu hiệu thực tế (cửa thông nhau, gương đối giường, xà ngang, bếp – chậu rửa…) kèm giải pháp điều chỉnh không tốn tiền.", href: "/phong-thuy/dau-hieu" },
    ],
    bang: {
      tieuDe: "So sánh Bát trạch và Huyền Không Phi Tinh",
      cot: ["Tiêu chí", "Bát trạch (theo tuổi gia chủ)", "Huyền Không Phi Tinh (theo độ số & vận)"],
      hang: [
        ["Dữ liệu cần có", "Năm sinh âm lịch (hoặc Lập xuân) & giới tính", "Độ số hướng cửa chính (0–360°) & năm xây/nhập trạch"],
        ["Câu hỏi trả lời", "Gia chủ hợp hướng nào, đặt bếp/giường/bàn xoay đâu", "Khí của căn nhà vượng – suy ở cung nào theo từng vận 20 năm"],
        ["Tính thay đổi", "Cố định theo người ở", "Đổi theo vận 20 năm và sao bay từng năm"],
      ],
    },
    trangCon: {
      tieuDe: "Tra nhanh 8 cung phi hướng hợp tuổi",
      ds: [
        { href: "/phong-thuy/huong-hop-tuoi/cung-kham-bac", ten: "Cung Khảm (Bắc)", phu: "Đông Tứ Mệnh" },
        { href: "/phong-thuy/huong-hop-tuoi/cung-ly-nam", ten: "Cung Ly (Nam)", phu: "Đông Tứ Mệnh" },
        { href: "/phong-thuy/huong-hop-tuoi/cung-chan-dong", ten: "Cung Chấn (Đông)", phu: "Đông Tứ Mệnh" },
        { href: "/phong-thuy/huong-hop-tuoi/cung-ton-dong-nam", ten: "Cung Tốn (Đông Nam)", phu: "Đông Tứ Mệnh" },
        { href: "/phong-thuy/huong-hop-tuoi/cung-can-tay-bac", ten: "Cung Càn (Tây Bắc)", phu: "Tây Tứ Mệnh" },
        { href: "/phong-thuy/huong-hop-tuoi/cung-khon-tay-nam", ten: "Cung Khôn (Tây Nam)", phu: "Tây Tứ Mệnh" },
        { href: "/phong-thuy/huong-hop-tuoi/cung-can-dong-bac", ten: "Cung Cấn (Đông Bắc)", phu: "Tây Tứ Mệnh" },
        { href: "/phong-thuy/huong-hop-tuoi/cung-doai-tay", ten: "Cung Đoài (Tây)", phu: "Tây Tứ Mệnh" },
      ],
    },
  },
  "/kinh-dich": {
    capNhat: "2026-11-24",
    tieuDe: "Bốn thành phần khi đọc một quẻ Kinh Dịch",
    tomTat: "Mỗi lần gieo quẻ Kinh Dịch tạo ra một cấu trúc 6 hào phản ánh trạng thái hiện tại và chiều chuyển biến của việc bạn hỏi:",
    muc: [
      { ten: "Quẻ Chủ (Bản quái)", yNghia: "Gồm nội quái (3 hào dưới — phía bạn) và ngoại quái (3 hào trên — bối cảnh bên ngoài), nêu trạng thái cốt lõi của sự việc ngay lúc này.", href: "/kinh-dich/que" },
      { ten: "Hào Động", yNghia: "Các hào lão dương (9) hoặc lão âm (6) đang chuyển hoá; đây là điểm mấu chốt cho biết yếu tố nào đang xoay chuyển tình thế." },
      { ten: "Quẻ Biến (Chi quái)", yNghia: "Quẻ hình thành sau khi đổi cực các hào động, gợi mở xu hướng kết quả nếu mọi thứ tiếp diễn theo đà hiện tại." },
      { ten: "Quái từ, Hào từ & Thoán truyện", yNghia: "Nguyên văn Chu Dịch kèm dịch nghĩa đời thường, giúp bạn cân nhắc nên tiến, nên giữ hay nên đổi cách làm." },
    ],
    bang: {
      tieuDe: "So sánh ba cách lập quẻ Kinh Dịch",
      cot: ["Cách gieo", "Cơ chế lập quẻ", "Khi nào nên chọn"],
      hang: [
        ["Máy gieo 3 đồng xu", "Mô phỏng 6 lần tung 3 xu ngẫu nhiên", "Nhanh gọn khi không có đồng xu bên cạnh"],
        ["Tự gieo 3 đồng xu thật", "Bạn tung 3 đồng xu 6 lần rồi nhập kết quả", "Muốn tự tay gieo để tập trung câu hỏi"],
        ["Mai Hoa Dịch Số", "Lập quẻ theo thời điểm hỏi (năm, tháng, ngày, giờ âm) hoặc số", "Muốn lấy quẻ tức thời theo nhịp thời gian"],
      ],
    },
  },
  "/hop-doi": {
    capNhat: "2026-11-24",
    tieuDe: "Bốn lớp đối chiếu khi xem hợp đôi theo ngày sinh",
    tomTat: "Thay vì chấm một con số phần trăm cứng nhắc, công cụ hợp đôi phân tích tương tác giữa hai người qua bốn trục:",
    muc: [
      { ten: "Cặp số chủ đạo (Đường đời)", yNghia: "So nhịp sống, cách ra quyết định và mục tiêu dài hạn của hai người để thấy chỗ nâng đỡ tự nhiên và chỗ dễ lệch pha.", href: "/hop-doi/cap-so" },
      { ten: "Tương tác Linh hồn & Biểu đạt", yNghia: "Đối chiếu nhu cầu cảm xúc bên trong và cách giao tiếp bên ngoài, giúp hiểu vì sao cùng một câu nói hai người nghe khác nhau." },
      { ten: "Bối cảnh mối quan hệ", yNghia: "Cách đọc tách biệt cho người yêu/vợ chồng, bạn bè, đồng nghiệp, sếp – nhân viên và người thân trong gia đình." },
      { ten: "Nhịp năm cá nhân song song", yNghia: "Đặt chu kỳ năm hiện tại của cả hai cạnh nhau để biết ai đang ở năm mở rộng, ai đang cần khoảng lặng." },
    ],
  },
  "/nhan-tuong": {
    capNhat: "2026-11-24",
    tieuDe: "Ba hệ quy chiếu chính trong Nhân tướng học cổ điển",
    tomTat: "Bài đọc tự quan sát trước gương, đối chiếu Thần Tướng Toàn Biên, Băng Giám và Linh Khu (Hoàng Đế Nội Kinh) qua bốn lớp:",
    muc: [
      { ten: "Tam đình (Thượng – Trung – Hạ đình)", yNghia: "Chia gương mặt thành ba phần trán, mũi–gò má và miệng–cằm để quan sát nhịp phát triển tiền vận, trung vận và hậu vận." },
      { ten: "Ngũ quan (Tai, Mày, Mắt, Mũi, Miệng)", yNghia: "Năm vùng biểu đạt chính về khả năng lắng nghe, khí chất, thần thái, ý chí và cách giao tiếp.", href: "/nhan-tuong/bo-vi" },
      { ten: "12 Cung tướng mặt", yNghia: "Các vùng như Ấn Đường (Mệnh cung), Chuẩn Đầu (Tài Bạch), Lệ Đường (Tử Nữ), Ngư Vĩ (Phu Thê) đối chiếu với từng mảng đời.", href: "/nhan-tuong/do-hinh" },
      { ten: "Ngũ hành dáng mặt & Y tướng", yNghia: "Nhận diện dáng mặt Kim, Mộc, Thuỷ, Hoả, Thổ và nhắc thói quen chăm sóc sức khoẻ — không thay chẩn đoán y khoa." },
    ],
  },
  "/tarot": {
    capNhat: "2026-11-24",
    tieuDe: "Cấu trúc bộ bài 78 lá và bốn trường phái đọc Tarot",
    tomTat: "Bộ bài Tarot chuẩn gồm 78 lá chia làm hai nhóm lớn và được diễn giải đa chiều theo bốn trường phái có sách:",
    muc: [
      { ten: "22 lá Ẩn chính (Major Arcana)", yNghia: "Từ Chàng Khờ (0) đến Thế Giới (XXI), đại diện cho những bước ngoặt, bài học lớn và chuyển hoá sâu.", href: "/tarot/la-bai" },
      { ten: "56 lá Ẩn phụ (Minor Arcana)", yNghia: "Gồm bốn chất Gậy (Hoả – hành động), Cốc (Thuỷ – cảm xúc), Kiếm (Khí – tư duy), Tiền (Đất – vật chất), phản ánh chuyện đời thường." },
      { ten: "Lá Xuôi và Lá Ngược", yNghia: "Lá xuôi thể hiện năng lượng biểu lộ rõ; lá ngược theo trường phái Waite gợi ý phần năng lượng đang bị nghẽn hoặc hướng vào trong." },
      { ten: "Trải bài theo mục đích", yNghia: "Từ 1 lá kiểm tra nhanh, 3 lá cho bối cảnh – trở ngại – lời khuyên, đến 5 lá chữ thập và Celtic Cross 10 lá cho vấn đề phức tạp." },
    ],
    bang: {
      tieuDe: "Bốn trường phái đọc Tarot trên Hiểu Bản Thân",
      cot: ["Trường phái", "Gốc sách", "Điểm nhấn khi luận bài"],
      hang: [
        ["Rider-Waite-Smith", "A. E. Waite (1910)", "Hình ảnh tường minh, đọc xuôi/ngược theo từng vị trí"],
        ["Golden Dawn / Thoth", "S. L. MacGregor Mathers & A. Crowley", "Phẩm giá nguyên tố giữa các lá liền kề, decan hoàng đạo"],
        ["Tarot de Marseille", "Truyền thống Pháp cổ", "Hướng nhìn nhân vật, cấu trúc số học; thường không đọc lá ngược"],
        ["B.O.T.A.", "Paul Foster Case", "Tâm lý học biểu tượng, soi nếp nghĩ và tiềm thức người hỏi"],
      ],
    },
  },
};

export function camNangPillar(duong: string): CamNangPillar | null {
  return CAM_NANG_PILLAR[duong] ?? null;
}
