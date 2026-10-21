// ND-0 — Sổ trang: danh mục cố định các URL công khai mà CMS (collection "Trang website") được phép phủ nội dung, cùng
// chữ ĐANG CHẠY trong code (mac_dinh) để CMS hiện chỉ đọc. Thiết kế: docs/KIEN-TRUC-NOI-DUNG-TRANG.md (mục 3.5 + mục 8).
// Bản gọn (mục 8.1): chỉ ~40 URL nhóm công cụ, tĩnh, pháp lý, chủ đề kiến thức; trang KB (nhóm C) không có tài liệu
// riêng mà dùng MẪU CỤM (MAU_CUM) — muốn chỉnh riêng một URL thì tạo "ghi đè theo yêu cầu" trong CMS.
// CMS đọc sổ này qua /api/so-trang (bí mật chung) để đồng bộ; web đọc trực tiếp (lib/noi-dung-trang.ts).
// Thêm trang công khai mới trong code → thêm một dòng ở đây (e2e/noi-dung-trang.spec.ts kiểm sitemap không sót).
// LƯU Ý: mac_dinh là BẢN CHÉP của hằng trong page.tsx (pha ND-0 chưa trang nào đọc sổ này) — e2e so với HTML thật.
import { CHU_DE, type LoaiTrang } from "@/lib/kien-thuc";
import { NGAY_HIEU_LUC } from "@/lib/van-hanh";
import type { NoiDungCongCu } from "@/components/seo/GioiThieuCongCu";
import { ND_XEM_NGAY } from "@/app/xem-ngay-tot/noi-dung";
import { ND_HAN_NAM, ND_LAM_NHA, ND_XONG_DAT } from "@/app/xem-tuoi-lam-nha/noi-dung";

export type NhomTrang = "cong_cu" | "tinh" | "phap_ly" | "chu_de" | "kien_thuc" | "tuoi" | "la_so_mau" | "blog_khung";
/** Ô CMS được phép sửa ở trang này (mục 3.2). */
export type OTrang = "seo" | "dau_trang" | "gioi_thieu" | "muc" | "khoi_tren" | "khoi_duoi" | "khoi_cuoi";

export type MacDinhTrang = {
  tieu_de_seo?: string; mo_ta_seo?: string; h1?: string; loi_dan?: string;
  doan?: string[]; hoi_dap?: { hoi: string; dap: string }[]; lien_ket?: { href: string; ten: string }[];
  /** Mục văn bản: chỉ id neo + tiêu đề (thân mục là JSX trong page.tsx). */
  muc?: { id: string; tieu_de: string }[];
  ngay_hieu_luc?: string;
};
export type MucSoTrang = { duong: string; nhom: NhomTrang; ten: string; o: readonly OTrang[]; mac_dinh: MacDinhTrang };

/** Nguồn chữ KB của một cụm — CMS xem trước CHỈ ĐỌC + nút "Sửa trong Kho tri thức" (mục 8.2). */
export type NguonKb = { kieu: "kb" | "tuoi" | "la_so_mau"; loai?: LoaiTrang; vi_du: string; tep_kb: string[] };
export type MauCumTrang = {
  mau_duong: string; nhom: "kien_thuc" | "tuoi" | "la_so_mau"; ten: string;
  /** Biến web cấp cho khối của mẫu ({tieu_de}…); biến lạ giữ nguyên chữ. */
  bien: readonly string[]; o: readonly OTrang[]; nguon_kb: NguonKb;
};

const O_CONG_CU: readonly OTrang[] = ["seo", "dau_trang", "gioi_thieu", "khoi_tren", "khoi_duoi", "khoi_cuoi"];
const O_TRANG_PHU: readonly OTrang[] = ["seo", "dau_trang", "khoi_tren", "khoi_duoi", "khoi_cuoi"];
const O_TINH: readonly OTrang[] = ["seo", "dau_trang", "khoi_tren", "khoi_duoi", "khoi_cuoi"];
const O_PHAP_LY: readonly OTrang[] = ["seo", "dau_trang", "muc"];
const O_CHU_DE: readonly OTrang[] = ["seo", "dau_trang", "khoi_tren", "khoi_duoi"];
const O_CUM: readonly OTrang[] = ["khoi_tren", "khoi_duoi", "khoi_cuoi"];

/** Công cụ HL-1/TDG-1 giữ chữ giới thiệu ở app/<công cụ>/noi-dung.ts (dùng chung cho trang ngày/tháng/năm con) — sổ đọc lại. */
const tuNd = (nd: NoiDungCongCu, tieu_de_seo: string): MucSoTrang => ({
  duong: nd.duong, nhom: "cong_cu", ten: nd.ten, o: O_CONG_CU,
  mac_dinh: { tieu_de_seo, mo_ta_seo: nd.moTa, doan: nd.doan, hoi_dap: nd.hoiDap, lien_ket: nd.lienKet ?? [] },
});




export const SO_TRANG: readonly MucSoTrang[] = [
  // ---------------- A · trang công cụ (hằng ND trong app/<mảng>/page.tsx)
  { duong: "/than-so", nhom: "cong_cu", ten: "Thần số học", o: O_CONG_CU, mac_dinh: {
    tieu_de_seo: "Thần số học Pythagoras: tính số chủ đạo theo họ tên và ngày sinh",
    mo_ta_seo: "Thần số học Pythagoras theo họ tên và ngày sinh: 4 con số cốt lõi có cách tính từng bước, dải đời, năm và tháng cá nhân, biểu đồ ngày sinh, hỏi đáp có nguồn.",
    doan: [
      "Nhập họ tên khai sinh và ngày sinh (dương lịch, hoặc âm lịch để hệ thống đổi giúp). Máy tính ra số đường đời, số sứ mệnh, số linh hồn, số nhân cách — mỗi con số hiện rõ từng bước cộng rút gọn, giữ số cái 11, 22, 33.",
      "Mỗi con số có ba lớp: phần đã tính (kiểm lại được), phần diễn giải từ kho tri thức có ghi nguồn (kèm mặt tối, không chỉ lời hay), và câu hỏi để bạn tự soi. Ngoài bốn số cốt lõi còn có dải đời (đỉnh cao, thử thách), năm và tháng cá nhân, biểu đồ ngày sinh và mũi tên, nợ nghiệp.",
      "Hồ sơ lưu trên máy bạn; máy chủ chỉ tính rồi bỏ, không lưu ngày sinh. Đây là nội dung văn hoá để tham khảo, không phải lời tiên đoán.",
    ],
    hoi_dap: [
      { hoi: "Số đường đời tính thế nào?", dap: "Cộng tất cả chữ số của ngày, tháng, năm sinh rồi rút gọn về một chữ số; nếu gặp 11, 22 hoặc 33 thì giữ nguyên (số cái). Trang kết quả hiện từng bước cộng để bạn tự kiểm." },
      { hoi: "Có cần họ tên đầy đủ không?", dap: "Có, để tính số sứ mệnh, linh hồn và nhân cách theo bảng chữ cái Pythagoras. Nên dùng họ tên khai sinh, có dấu hay không dấu đều được." },
      { hoi: "Ngày sinh âm lịch thì sao?", dap: "Bạn nhập âm lịch, hệ thống đổi sang dương lịch theo âm lịch Việt Nam rồi mới tính." },
      { hoi: "Thần số học có dự đoán tương lai không?", dap: "Không. Con số chỉ gợi một khung để nhìn lại bản thân; mọi diễn giải đều kèm mặt tối và câu hỏi tự soi, không phán số phận." },
    ],
    lien_ket: [{ href: "/than-so/y-nghia-so", ten: "Ý nghĩa 12 con số" }, { href: "/than-so/nghe-nghiep", ten: "Số chủ đạo hợp nghề gì" }, { href: "/than-so/nam-ca-nhan", ten: "Năm cá nhân 1–9" }, { href: "/than-so/no-nghiep", ten: "Nợ nghiệp" }, { href: "/than-so/so-kep", ten: "Số kép Chaldea" }, { href: "/hop-doi", ten: "Hợp đôi" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }],
  } },
  { duong: "/hom-nay", nhom: "cong_cu", ten: "Hôm nay của bạn", o: O_CONG_CU, mac_dinh: {
    tieu_de_seo: "Hôm nay của bạn: ngày cá nhân, âm lịch và câu hỏi tự soi",
    mo_ta_seo: "Mỗi ngày một thẻ theo thần số học: ngày, tháng, năm cá nhân của riêng bạn, ngày âm lịch và can chi hôm nay, một câu hỏi để tự soi.",
    doan: [
      "Ngày cá nhân tính từ ngày và tháng sinh của bạn cộng với ngày đang xem, rút gọn về 1–9. Mỗi con số gợi một chủ đề cho ngày: bắt đầu, lắng nghe, gặp gỡ, sắp xếp, thay đổi, chăm sóc, suy ngẫm, quyết định, khép lại.",
      "Thẻ có thêm tháng và năm cá nhân để thấy nhịp lớn hơn, ngày âm lịch Việt Nam và can chi của hôm nay, cùng một câu hỏi để bạn tự soi. Ngày mai có thẻ mới.",
      "Hồ sơ lưu trên máy bạn; máy chủ chỉ tính rồi bỏ. Đây là nội dung văn hoá để tham khảo, gợi chủ đề chứ không dự báo việc sẽ xảy ra.",
    ],
    hoi_dap: [
      { hoi: "Ngày cá nhân tính thế nào?", dap: "Năm cá nhân = ngày sinh + tháng sinh + năm đang xem (rút gọn); tháng cá nhân = năm cá nhân + tháng đang xem; ngày cá nhân = tháng cá nhân + ngày đang xem, rút gọn về 1–9." },
      { hoi: "Mỗi ngày thẻ có khác không?", dap: "Có. Ngày cá nhân đổi mỗi ngày theo chu kỳ 1–9, thẻ cũng báo trước chủ đề của ngày mai." },
      { hoi: "Có cần tài khoản không?", dap: "Không. Chỉ cần hồ sơ (tên và ngày sinh) lưu trên máy bạn." },
    ],
    lien_ket: [{ href: "/ban-than", ten: "Bản thân" }, { href: "/than-so/nam-ca-nhan", ten: "Năm cá nhân 1–9" }, { href: "/than-so", ten: "Thần số học" }, { href: "/hop-doi", ten: "Hợp đôi" }],
  } },
  { duong: "/hop-doi", nhom: "cong_cu", ten: "Hợp đôi", o: O_CONG_CU, mac_dinh: {
    tieu_de_seo: "Hợp đôi thần số học: hai người hoà và va ở đâu",
    mo_ta_seo: "So hợp đôi theo thần số học cho người yêu, bạn bè, đồng nghiệp, sếp, người thân: con số hai người hoà ở đâu, va ở đâu, việc nên cùng làm. Không chấm điểm hợp hay khắc.",
    doan: [
      "Chọn người ấy là ai với bạn — người yêu, bạn bè, đồng nghiệp, sếp hay người thân — rồi nhập ngày sinh (tên không bắt buộc). Hệ thống so cặp số đường đời và các cặp số theo tên, đọc theo đúng loại quan hệ đó, kèm nhịp năm cá nhân của hai người.",
      "Không có điểm “hợp” hay “khắc”: hai con số nào cũng có chỗ dễ hoà và chỗ dễ va. Bạn có thể gửi link mời để người ấy tự nhập ngày sinh của họ — link chỉ chứa tên hiển thị và con số, không chứa ngày sinh.",
    ],
    hoi_dap: [
      { hoi: "Hợp đôi có chấm điểm phần trăm không?", dap: "Không. Điểm số hợp/khắc dễ gây hiểu lầm; trang chỉ nêu chỗ hoà, chỗ va và việc nên cùng làm." },
      { hoi: "Ngày sinh người kia có bị lưu lại không?", dap: "Không. Ngày sinh chỉ dùng để tính rồi bỏ. Vui lòng chỉ nhập khi người đó biết và đồng ý." },
      { hoi: "Xem hợp đôi đồng nghiệp hay sếp khác gì người yêu?", dap: "Cùng một cặp số nhưng cách đọc khác: mỗi loại quan hệ có phần diễn giải riêng về cách phối hợp, giao tiếp, ranh giới." },
    ],
    lien_ket: [{ href: "/than-so", ten: "Thần số học của bạn" }, { href: "/hop-doi/cap-so", ten: "Số chủ đạo nào hợp nhau" }, { href: "/than-so/tinh-yeu", ten: "Số chủ đạo trong tình yêu" }, { href: "/than-so/y-nghia-so", ten: "Ý nghĩa 12 con số" }],
  } },
  { duong: "/tu-vi", nhom: "cong_cu", ten: "Tử vi", o: O_CONG_CU, mac_dinh: {
    tieu_de_seo: "Lập lá số Tử vi online: 12 cung, đại hạn, lưu niên, lưu nguyệt",
    mo_ta_seo: "Lập lá số Tử vi 12 cung theo giờ, ngày, nơi sinh (âm lịch Việt Nam, múi giờ lịch sử). Đại hạn, lưu niên, tiểu hạn, lưu nguyệt theo phái, hỏi đáp theo cung.",
    doan: [
      "Nhập ngày giờ sinh, giới tính và nơi sinh (63 tỉnh thành hoặc nước ngoài). Lá số an ngay trên hệ thống của Hiểu Bản Thân theo âm lịch Việt Nam, có xử lý múi giờ lịch sử trước năm 1975; sinh ở nước ngoài lập theo giờ địa phương.",
      "Lá số vẽ 12 cung với 14 chính tinh, phụ tinh, tứ hoá, Tuần Triệt, độ sáng theo Nam phái (có công tắc xem bảng phái Trung). Hạn đọc theo thứ tự đại hạn › lưu niên › tiểu hạn › lưu nguyệt; lưu nguyệt cho bạn chọn phái tính tháng.",
      "Các khác biệt giữa trường phái (lịch Việt/Trung, Hoả Linh, tháng nhuận…) gom trong khung “Trường phái” có giải thích. Không phán bệnh tật, tai nạn hay sống chết.",
    ],
    hoi_dap: [
      { hoi: "Không biết giờ sinh chính xác có lập được không?", dap: "Tử vi cần giờ sinh theo canh giờ (12 giờ âm). Nếu không chắc, hãy hỏi người thân hoặc so vài giờ gần nhau; hỏi đáp kiến thức chung vẫn dùng được không cần lá số." },
      { hoi: "Vì sao lá số ở đây có thể khác trang khác?", dap: "Nhiều trang đổi âm lịch theo lịch Trung Quốc (UTC+8), lệch với âm lịch Việt Nam ở một số ngày. Ở đây mặc định âm lịch Việt Nam, có công tắc chuyển sang lịch Trung Quốc để so." },
      { hoi: "Lưu nguyệt tính theo phái nào?", dap: "Mặc định Đẩu Quân từ Thái Tuế; bạn có thể chọn 4 phái khác. Mỗi tháng hiện cung theo cả 5 phái để so." },
      { hoi: "Ngày giờ sinh có bị gửi đi đâu không?", dap: "Không gửi cho bên thứ ba. Máy chủ tính xong là bỏ; hồ sơ nằm trên máy bạn." },
    ],
    lien_ket: [{ href: "/tu-vi/chinh-tinh", ten: "14 chính tinh" }, { href: "/tu-vi/cung", ten: "12 cung" }, { href: "/tu-vi/la-so-mau", ten: "Lá số mẫu đọc từng bước" }],
  } },
  { duong: "/bat-tu", nhom: "cong_cu", ten: "Bát tự", o: O_CONG_CU, mac_dinh: {
    tieu_de_seo: "Bát tự Tứ trụ: lập lá số theo giờ sinh, ngũ hành, dụng thần",
    mo_ta_seo: "Bát tự tứ trụ theo tiết khí: thiên can, địa chi, thập thần, ngũ hành chấm điểm công bố, cách cục Tử Bình Chân Thuyên, dụng thần trình bày hai cách, đại vận 10 năm.",
    doan: [
      "Tứ trụ năm – tháng – ngày – giờ lập theo tiết khí (tính thiên văn), không theo ngày mùng 1 âm lịch. Kết quả có thiên can, địa chi, tàng can, thập thần, nạp âm, trường sinh, thần sát và các quan hệ hợp – xung.",
      "Ngũ hành được chấm theo thang điểm công bố để bạn kiểm lại; cách cục định theo nguyệt lệnh (Tử Bình Chân Thuyên). Dụng thần luôn trình bày hai cách (phù ức và điều hậu) để bạn tự cân nhắc, hệ thống không tự chọn thay.",
      "Đại vận 10 năm và lưu niên giúp xem nhịp từng giai đoạn. Đây là tham khảo văn hoá, không phải lời phán.",
    ],
    hoi_dap: [
      { hoi: "Bát tự khác Tử vi thế nào?", dap: "Bát tự lấy tám chữ can chi của năm, tháng, ngày, giờ sinh và xét ngũ hành; Tử vi an sao vào 12 cung. Hai hệ thống bổ sung góc nhìn cho nhau." },
      { hoi: "Sinh lúc 23 giờ thì tính ngày nào?", dap: "Mặc định giữ trụ ngày của hôm đó và lấy giờ Tý của ngày hôm sau (dạ Tý). Ở khung Trường phái bạn chọn được phái đổi ngày lúc 23:00 — khi đó trụ ngày là ngày hôm sau; trang luôn gắn cờ để bạn biết." },
      { hoi: "Dụng thần là gì?", dap: "Hành giúp lá số cân bằng hơn. Vì các trường phái xác định khác nhau, trang trình bày hai cách thay vì chọn một." },
    ],
    lien_ket: [{ href: "/bat-tu/thap-than", ten: "10 thập thần" }, { href: "/bat-tu/nhat-chu", ten: "10 nhật chủ" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }],
  } },
  { duong: "/kinh-dich", nhom: "cong_cu", ten: "Kinh Dịch", o: O_CONG_CU, mac_dinh: {
    tieu_de_seo: "Gieo quẻ Kinh Dịch online: 64 quẻ, 384 hào, lời quẻ có nguồn",
    mo_ta_seo: "Gieo quẻ Kinh Dịch cho một câu hỏi cụ thể: máy gieo, Mai Hoa theo giờ hoặc tự gieo đồng xu. Đọc theo Nghĩa Lý, Lục Hào, Mai Hoa, có trích Chu Dịch và lời nói nôm na.",
    doan: [
      "Đang phân vân một việc — nhận lời mời, dọn nhà, mở quán, nói chuyện lại với một người? Gieo một quẻ, nhận câu trả lời ngắn bằng lời thường: việc đang thuận hay cần đổi cách, và nên làm gì trong tuần này. Quẻ do máy gieo ngẫu nhiên, theo giờ, theo số hay phương vị (Mai Hoa), hoặc bạn tự gieo ba đồng xu — AI không chọn quẻ.",
      "Lời đọc gồm quẻ chủ, hào động, quẻ biến; trích nguyên văn Chu Dịch (quái từ, hào từ, Thoán truyện) kèm dịch nghĩa và lời nói nôm na. Mỗi lời đọc có mặt tối và câu hỏi tự soi.",
      "Hỏi lại cùng một việc nhiều lần trong thời gian ngắn, trang sẽ nhắc theo tinh thần quẻ Mông.",
    ],
    hoi_dap: [
      { hoi: "Nên hỏi Kinh Dịch thế nào?", dap: "Hỏi một việc cụ thể, rõ ràng, liên quan đến lựa chọn của chính bạn (ví dụ: có nên nhận lời mời làm việc này không), tránh câu hỏi có/không về số phận." },
      { hoi: "Ba cách gieo khác nhau thế nào?", dap: "Máy gieo mô phỏng ba đồng xu; Mai Hoa lấy quẻ theo năm, tháng, ngày âm và giờ lúc hỏi (chọn được âm lịch Việt Nam hoặc Trung Quốc); tự gieo là bạn tung xu thật rồi nhập. Cách đọc lời quẻ giống nhau." },
      { hoi: "Không có hào động thì đọc thế nào?", dap: "Lời chủ là quái từ của quẻ, kèm Thoán truyện dịch nghĩa." },
    ],
    lien_ket: [{ href: "/kinh-dich/que", ten: "64 quẻ Kinh Dịch" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }],
  } },
  { duong: "/phong-thuy", nhom: "cong_cu", ten: "Phong thuỷ", o: O_CONG_CU, mac_dinh: {
    tieu_de_seo: "Phong thuỷ Bát trạch: mệnh quái, hướng nhà hợp tuổi, bố cục nhà",
    mo_ta_seo: "Phong thuỷ Bát trạch: mệnh quái theo năm sinh và giới tính, tám hướng du niên, cửa – chủ – bếp, Huyền Không phi tinh, đo hướng bằng la bàn điện thoại, khảo sát bố cục nhà.",
    doan: [
      "Nhà bạn đang ở — hay căn định mua — có hợp bạn không, và nếu chỉ kê lại một món đồ thì kê gì? Nhập năm sinh, đo hướng cửa bằng điện thoại, trang đọc cho bạn bằng lời thường: bạn hợp phía nào, từng phòng nên đặt gì, tháng nào nên sửa. Phần sách vở (du niên, phi tinh) gập lại cho ai muốn mở.",
      "Bạn có thể đo hướng nhà bằng la bàn điện thoại hoặc nhập độ, xem bàn Huyền Không phi tinh theo vận, và khai bố cục nhà (phòng nào ở phương nào, 18 dấu hiệu quan sát được) để nhận nhận xét gắn với từng mục kho tri thức.",
      "Mục nào là quan niệm dân gian đều ghi rõ. Trang không giới thiệu hay bán vật phẩm “hoá giải”.",
    ],
    hoi_dap: [
      { hoi: "Tuổi tôi hợp hướng nào?", dap: "Nhập năm sinh và giới tính, trang tính mệnh quái và liệt kê bốn hướng cát (Sinh Khí, Thiên Y, Diên Niên, Phục Vị) cùng bốn hướng hung. Sinh đầu năm dương lịch thì mốc đầu năm quan trọng: mặc định Lập xuân, bạn chọn được Tết âm lịch (lịch Việt hoặc Trung Quốc) và xem đổi mốc có làm khác mệnh quái không." },
      { hoi: "Đo hướng nhà thế nào cho đúng?", dap: "Đứng ở cửa chính nhìn thẳng ra ngoài, để điện thoại nằm ngang, tránh xa kim loại; trang dùng la bàn của máy và cho nhập độ tay nếu cần." },
      { hoi: "Có cần mua vật phẩm phong thuỷ không?", dap: "Không. Trang chỉ nêu cách bố trí và quan niệm, không giới thiệu vật phẩm." },
    ],
    lien_ket: [{ href: "/phong-thuy/huong-xau-nam", ten: "Hướng xấu theo năm" }, { href: "/xem-tuoi-lam-nha", ten: "Tuổi làm nhà" }, { href: "/phong-thuy/huong-hop-tuoi", ten: "Tuổi nào hợp hướng nào (1960–2005)" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ phong thuỷ" }, { href: "/kham-pha", ten: "Các hệ thống khác" }],
  } },
  // HL-1 / TDG-1: công cụ hoàng lịch + tuổi — giới thiệu + hỏi đáp mặc định ở app/*/noi-dung.ts.
  tuNd(ND_XEM_NGAY, "Xem ngày tốt hôm nay: hoàng đạo, giờ tốt, việc nên làm"),
  tuNd(ND_LAM_NHA, "Xem tuổi làm nhà, cưới hỏi: Kim lâu, Hoang ốc, Tam tai"),
  tuNd(ND_XONG_DAT, "Xem tuổi xông đất đầu năm hợp gia chủ, giờ đẹp mùng 1"),
  tuNd(ND_HAN_NAM, "Hướng xấu theo năm: Thái Tuế, Tam Sát, Ngũ Hoàng"),
  { duong: "/ban-than", nhom: "cong_cu", ten: "Hồ sơ bản thân", o: ["seo", "khoi_duoi", "khoi_cuoi"], mac_dinh: {
    tieu_de_seo: "Hồ sơ bản thân",
    mo_ta_seo: "Hồ sơ bản thân theo thần số học: số đường đời, sứ mệnh, linh hồn, nhân cách — mỗi số ba lớp: đã tính, diễn giải, tự soi.",
  } },
  { duong: "/nap-sao", nhom: "cong_cu", ten: "Nạp Sao", o: O_TRANG_PHU, mac_dinh: {
    tieu_de_seo: "Nạp Sao", h1: "Nạp Sao",
    mo_ta_seo: "Nạp Sao để mở Luận giải toàn bộ và các tính năng chuyên sâu. Thanh toán bằng QR chuyển khoản qua app ngân hàng hoặc ví điện tử.",
  } },
  { duong: "/tai-khoan", nhom: "cong_cu", ten: "Tài khoản", o: ["seo"], mac_dinh: { tieu_de_seo: "Tài khoản" } },
  { duong: "/ung-ho", nhom: "cong_cu", ten: "Ủng hộ đội ngũ phát triển", o: O_TRANG_PHU, mac_dinh: {
    tieu_de_seo: "Ủng hộ đội ngũ phát triển Hiểu Bản Thân", h1: "Ủng hộ đội ngũ phát triển",
    mo_ta_seo: "Hiểu Bản Thân miễn phí phần lớn công cụ. Nếu thấy hữu ích, bạn có thể ủng hộ đội ngũ phát triển bằng chuyển khoản hoặc ví tiền mã hoá.",
  } },

  // ---------------- B · trang tĩnh / giới thiệu
  { duong: "/", nhom: "tinh", ten: "Trang chủ", o: O_TINH, mac_dinh: {
    tieu_de_seo: "Hiểu Bản Thân — con số nói gì về bạn", h1: "Con số nói gì về bạn?",
    mo_ta_seo: "Thần số học và huyền học phương Đông (Tử vi, Bát tự, Kinh Dịch, Phong thuỷ): tính toán minh bạch, diễn giải có nguồn, câu hỏi để tự soi. Miễn phí.",
  } },
  { duong: "/kham-pha", nhom: "tinh", ten: "Khám phá", o: O_TINH, mac_dinh: {
    tieu_de_seo: "Khám phá: thần số học, Tử vi, Bát tự, Phong thuỷ, Kinh Dịch",
    mo_ta_seo: "Năm lăng kính nhìn lại bản thân: thần số học, Tử vi, Bát tự, Phong thuỷ, Kinh Dịch — dùng chung một hồ sơ, cách tính minh bạch, diễn giải có nguồn.",
    h1: "Năm hệ thống, một hồ sơ",
  } },
  { duong: "/kien-thuc", nhom: "tinh", ten: "Thư viện kiến thức", o: O_TINH, mac_dinh: {
    tieu_de_seo: "Thư viện kiến thức thần số học, Kinh Dịch, Tử vi, Bát tự",
    mo_ta_seo: "Ý nghĩa 12 con số thần số học, 64 quẻ Kinh Dịch, 14 chính tinh và 12 cung Tử vi, 10 thập thần, 10 nhật chủ Bát tự — có nguồn, có mặt tối, có câu tự soi.",
    h1: "Thư viện kiến thức",
    loi_dan: "Ý nghĩa 12 con số thần số học, 64 quẻ Kinh Dịch, 14 chính tinh và 12 cung Tử vi, 10 thập thần, 10 nhật chủ Bát tự — có nguồn, có mặt tối, có câu tự soi.",
  } },
  { duong: "/tu-vi/la-so-mau", nhom: "tinh", ten: "Lá số mẫu", o: O_TINH, mac_dinh: {
    tieu_de_seo: "Lá số Tử vi mẫu — đọc từng bước cho người mới", h1: "Lá số Tử vi mẫu — đọc từng bước",
    mo_ta_seo: "6 lá số Tử vi minh hoạ được đọc từng bước: Mệnh–Thân, chính tinh, độ sáng, tam phương tứ chính, cách cục, tứ hoá, đại hạn, lưu niên — kèm giải nghĩa thuật ngữ.",
  } },
  { duong: "/tu-dien", nhom: "tinh", ten: "Từ điển thuật ngữ", o: O_TINH, mac_dinh: {
    tieu_de_seo: "Từ điển thuật ngữ Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Thần số", h1: "Từ điển thuật ngữ — nói cho dễ hiểu",
    mo_ta_seo: "Hơn 200 thuật ngữ huyền học giải nghĩa bằng ngôn ngữ đời thường: cung Mệnh, Hoá Kỵ, nhật chủ, dụng thần, hào động, quẻ biến, sơn tinh, hướng tinh, số đường đời…",
  } },
  { duong: "/phong-thuy/huong-hop-tuoi", nhom: "tinh", ten: "Hướng hợp tuổi", o: O_TINH, mac_dinh: {
    tieu_de_seo: "Hướng hợp tuổi: tuổi nào hợp hướng nào (1960–2005)", h1: "Tuổi nào hợp hướng nào?",
    mo_ta_seo: "Tra hướng nhà, hướng bếp, hướng giường hợp tuổi theo Bát trạch cho nam và nữ sinh từ 1960 đến 2005: mệnh quái, 4 hướng tốt, 4 hướng nên tránh.",
  } },
  { duong: "/blog", nhom: "blog_khung", ten: "Blog", o: O_TINH, mac_dinh: {
    tieu_de_seo: "Blog", h1: "Blog",
    mo_ta_seo: "Bài viết về hiểu bản thân, thần số học, Tử vi, Kinh Dịch, Bát tự, phong thuỷ và đời sống — đọc thêm ngoài thư viện kiến thức.",
    loi_dan: "Bài viết về hiểu bản thân, thần số học, Tử vi, Kinh Dịch, Bát tự, phong thuỷ và đời sống — đọc thêm ngoài thư viện kiến thức.",
  } },
  { duong: "/lien-he", nhom: "tinh", ten: "Liên hệ", o: ["seo", "dau_trang", "muc", "khoi_cuoi"], mac_dinh: {
    tieu_de_seo: "Liên hệ", h1: "Liên hệ",
    mo_ta_seo: "Liên hệ Hiểu Bản Thân: góp ý, báo lỗi, yêu cầu về dữ liệu cá nhân, hợp tác.",
    muc: [{ id: "thong-tin", tieu_de: "Thông tin liên hệ" }, { id: "chu-de", tieu_de: "Bạn cần gì?" }],
  } },
  // Mục "quy-trinh" (ai biên soạn, ai thẩm định) chỉ Quản trị/Chủ biên sửa — CMS chặn ở hook máy chủ.
  { duong: "/gioi-thieu", nhom: "tinh", ten: "Giới thiệu & phương pháp", o: ["seo", "dau_trang", "muc", "khoi_cuoi"], mac_dinh: {
    tieu_de_seo: "Giới thiệu & phương pháp", h1: "Giới thiệu & phương pháp",
    mo_ta_seo: "Hiểu Bản Thân là gì, làm việc ra sao, ai biên soạn và thẩm định, kho tri thức dựa trên những cổ thư nào.",
    muc: [{ id: "su-menh", tieu_de: "Chúng tôi làm gì" }, { id: "phuong-phap", tieu_de: "Cách chúng tôi làm" }, { id: "quy-trinh", tieu_de: "Ai biên soạn, ai thẩm định" }, { id: "nguon", tieu_de: "Nguồn tri thức" }, { id: "cam-ket", tieu_de: "Cam kết" }, { id: "ung-ho", tieu_de: "Ủng hộ đội ngũ" }, { id: "van-hanh", tieu_de: "Đơn vị vận hành" }],
  } },
  // Hồ sơ chuyên gia giữ trong code (E-E-A-T, đổi bằng PR lib/chuyen-gia.ts) — CMS chỉ thêm khối cuối trang.
  { duong: "/tac-gia", nhom: "tinh", ten: "Đội ngũ chuyên gia", o: ["khoi_cuoi"], mac_dinh: {} },
  { duong: "/tac-gia/duc-luan", nhom: "tinh", ten: "Chủ biên Đức Luân", o: ["khoi_cuoi"], mac_dinh: {} },

  // ---------------- pháp lý — chỉ Quản trị/Chủ biên sửa và xuất bản; không có khối quảng bá
  { duong: "/chinh-sach-rieng-tu", nhom: "phap_ly", ten: "Chính sách quyền riêng tư", o: O_PHAP_LY, mac_dinh: {
    tieu_de_seo: "Chính sách quyền riêng tư", h1: "Chính sách quyền riêng tư", ngay_hieu_luc: NGAY_HIEU_LUC,
    mo_ta_seo: "Hiểu Bản Thân thu gì, lưu ở đâu, bao lâu, gửi cho ai và bạn có quyền gì với dữ liệu cá nhân của mình — theo Luật Bảo vệ dữ liệu cá nhân 2025.",
    muc: [{ id: "tom-tat", tieu_de: "Tóm tắt trong 30 giây" }, { id: "ben-kiem-soat", tieu_de: "Ai chịu trách nhiệm về dữ liệu" }, { id: "du-lieu", tieu_de: "Dữ liệu nào, lưu ở đâu, bao lâu" }, { id: "muc-dich", tieu_de: "Mục đích và căn cứ xử lý" }, { id: "ben-thu-ba", tieu_de: "Bên xử lý thay chúng tôi và chuyển dữ liệu ra nước ngoài" }, { id: "quyen", tieu_de: "Quyền của bạn và cách thực hiện" }, { id: "tre-em", tieu_de: "Trẻ em" }, { id: "trinh-duyet", tieu_de: "Cookie và lưu trữ trên trình duyệt" }, { id: "bao-mat", tieu_de: "Bảo mật và sự cố" }, { id: "thay-doi", tieu_de: "Thay đổi chính sách" }],
  } },
  { duong: "/dieu-khoan", nhom: "phap_ly", ten: "Điều khoản sử dụng", o: O_PHAP_LY, mac_dinh: {
    tieu_de_seo: "Điều khoản sử dụng", h1: "Điều khoản sử dụng", ngay_hieu_luc: NGAY_HIEU_LUC,
    mo_ta_seo: "Điều khoản sử dụng Hiểu Bản Thân: tính chất dịch vụ tham khảo văn hoá, tài khoản, Sao, nội dung, sở hữu trí tuệ và giới hạn trách nhiệm.",
    muc: [{ id: "chap-nhan", tieu_de: "Chấp nhận điều khoản" }, { id: "tinh-chat", tieu_de: "Tính chất của dịch vụ" }, { id: "tai-khoan", tieu_de: "Tài khoản" }, { id: "sao", tieu_de: "Sao — điểm dùng trong ứng dụng" }, { id: "hanh-vi", tieu_de: "Những điều không được làm" }, { id: "noi-dung", tieu_de: "Nội dung và sở hữu trí tuệ" }, { id: "trach-nhiem", tieu_de: "Giới hạn trách nhiệm" }, { id: "luat", tieu_de: "Luật áp dụng, thay đổi và liên hệ" }],
  } },
  { duong: "/mien-tru-trach-nhiem", nhom: "phap_ly", ten: "Miễn trừ trách nhiệm", o: O_PHAP_LY, mac_dinh: {
    tieu_de_seo: "Miễn trừ trách nhiệm", h1: "Miễn trừ trách nhiệm", ngay_hieu_luc: NGAY_HIEU_LUC,
    mo_ta_seo: "Hiểu Bản Thân là góc nhìn văn hoá để tự suy ngẫm — không dự báo, không thay thế bác sĩ, luật sư, chuyên gia tài chính hay tâm lý.",
    muc: [{ id: "tham-khao", tieu_de: "Góc nhìn tham khảo, không phải lời tiên đoán" }, { id: "khong-tra-loi", tieu_de: "Những điều hệ thống không trả lời" }, { id: "khung-hoang", tieu_de: "Khi bạn đang khủng hoảng" }, { id: "noi-dung", tieu_de: "Nội dung được làm ra thế nào" }, { id: "truong-phai", tieu_de: "Trường phái khác nhau" }, { id: "trach-nhiem", tieu_de: "Quyết định là của bạn" }],
  } },

  // ---------------- chủ đề kiến thức (tên + mô tả = CHU_DE trong lib/kien-thuc.ts)
  ...Object.entries(CHU_DE).map(([k, c]): MucSoTrang => ({
    duong: c.duong, nhom: "chu_de", ten: c.ten, o: O_CHU_DE, mac_dinh: { h1: c.ten, loi_dan: c.mo_ta },
  })),
];

/** Tệp kho tri thức chứa chữ của từng loại trang KB (engine/app/kb/trang*.py) — nút "Sửa trong Kho tri thức". */
export const TEP_KB_THEO_LOAI: Record<LoaiTrang, string[]> = {
  so: ["thanso_meanings.json", "thanso_depth.json"], que: ["kinhdich_kb.json", "kinhdich_hao.json"],
  sao: ["tuvi_kb.json"], cung: ["tuvi_kb.json"], sao_cung: ["tuvi_kb.json"], hoa_cung: ["tuvi_kb.json"],
  thap_than: ["battu_kb.json"], nhat_chu: ["battu_kb.json"], menh_nam: ["battu_kb.json"],
  cap_so: ["thanso_cap_so.json", "thanso_quan_he.json"], nghe: ["thanso_chan_dung.json", "thanso_linh_vuc.json"],
  tinh_yeu: ["thanso_chan_dung.json", "thanso_linh_vuc.json"], nam_ca_nhan: ["thanso_depth.json"], no_nghiep: ["thanso_chi_so_phu.json"],
  so_kep: ["thanso_chaldean.json"],
};
/** Trang mẫu của từng loại (để CMS xem trước chữ KB của cụm). */
const VI_DU: Record<LoaiTrang, string> = {
  so: "so-1", que: "que-1-can", sao: "sao-tu-vi", cung: "cung-menh", thap_than: "ty-kien", nhat_chu: "nhat-chu-giap",
  cap_so: "so-chu-dao-1-va-1", nghe: "so-1-hop-nghe-gi", tinh_yeu: "so-1-trong-tinh-yeu", nam_ca_nhan: "nam-ca-nhan-1",
  no_nghiep: "no-nghiep-13", sao_cung: "tu-vi-cung-menh", hoa_cung: "hoa-loc-cung-menh", menh_nam: "sinh-nam-1950-menh-gi",
  so_kep: "so-kep-10",
};

export const MAU_CUM: readonly MauCumTrang[] = [
  ...Object.entries(CHU_DE).map(([k, c]): MauCumTrang => ({
    mau_duong: `${c.duong}/{slug}`, nhom: "kien_thuc", ten: `Trang con · ${c.ten}`,
    bien: ["tieu_de", "mo_ta", "slug", "ten_chu_de"], o: O_CUM,
    nguon_kb: { kieu: "kb", loai: c.loai, vi_du: VI_DU[c.loai], tep_kb: TEP_KB_THEO_LOAI[c.loai] },
  })),
  { mau_duong: "/phong-thuy/huong-hop-tuoi/tuoi-{nam}-{gioi}", nhom: "tuoi", ten: "Tuổi hợp hướng (1960–2005)",
    bien: ["tieu_de", "nam", "gioi"], o: O_CUM,
    nguon_kb: { kieu: "tuoi", vi_du: "tuoi-1990-nam", tep_kb: ["phongthuy_kb.json"] } },
  { mau_duong: "/tu-vi/la-so-mau/{slug}", nhom: "la_so_mau", ten: "Lá số Tử vi mẫu", bien: ["tieu_de", "slug"], o: O_CUM,
    nguon_kb: { kieu: "la_so_mau", vi_du: "tu-phu-dong-cung", tep_kb: ["tuvi_kb.json", "tuvi_cach_cuc.json"] } },
];

const BIEN_DUONG: Record<string, string> = { nam: "(\\d{4})", gioi: "(nam|nu)" };
/** Mẫu đường dẫn → biểu thức chính quy (biến {x} khớp một đoạn chữ thường/số/gạch ngang; {nam} 4 chữ số, {gioi} nam|nu). */
export function regexMau(mau: string): RegExp {
  const thoat = mau.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  return new RegExp(`^${thoat.replace(/\{([a-z_]+)\}/g, (_, b: string) => BIEN_DUONG[b] ?? "([a-z0-9-]+)")}$`);
}

/** URL cụ thể thuộc cụm nào (null nếu không thuộc cụm). Trả kèm giá trị biến đọc từ đường dẫn. */
export function khopMauCum(duong: string): { mau: MauCumTrang; bien: Record<string, string> } | null {
  for (const mau of MAU_CUM) {
    const m = regexMau(mau.mau_duong).exec(duong);
    if (!m) continue;
    const ten = [...mau.mau_duong.matchAll(/\{([a-z_]+)\}/g)].map((x) => x[1]!);
    return { mau, bien: Object.fromEntries(ten.map((t, i) => [t, m[i + 1]!])) };
  }
  return null;
}

export const mucSoTrang = (duong: string): MucSoTrang | null => SO_TRANG.find((m) => m.duong === duong) ?? null;
