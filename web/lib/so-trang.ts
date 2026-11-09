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
import { ND_HAN_NAM, ND_LAM_NHA, ND_SAO_HAN, ND_XONG_DAT } from "@/app/xem-tuoi-lam-nha/noi-dung";
import { ND_DOI_LICH } from "@/app/doi-lich-am-duong/noi-dung";
import { ND_THOI_GIAN_TOI } from "@/app/thoi-gian-toi/noi-dung";
import { ND_CHAN_DUNG } from "@/app/chan-dung/noi-dung";
import type { BangChu, BangHinh } from "@/lib/chu-trang";
import { CHU_TRANG_CHU, HINH_TRANG_CHU } from "@/lib/chu/trang-chu";
import { CHU_HUYEN_HOC, CHU_KIEN_THUC, HINH_HUYEN_HOC } from "@/lib/chu/trang-tinh";
import { CHU_HAN_NAM_CON, CHU_LAM_NHA_CON, CHU_LAM_NHA_NAM, CHU_LICH_AM_NAM, CHU_NGAY, CHU_THANG, CHU_VIEC_THANG, CHU_XONG_DAT_CON, CHU_XONG_DAT_NAM, CHU_SAO_HAN_NAM, CHU_NAM, CHU_NAM_SINH_CON, CHU_NAM_CUOI_HOI, CHU_NAM_TUOI } from "@/lib/chu/trang-con";
import {
  CHU_BAT_TU, CHU_DOI_LICH, CHU_HAN_NAM, CHU_SAO_HAN, CHU_HOM_NAY, CHU_HOP_DOI, CHU_KINH_DICH, CHU_LAM_NHA, CHU_NHAN_TUONG, CHU_PHONG_THUY, CHU_THAN_SO, CHU_TU_VI,
  CHU_XEM_NGAY, CHU_XONG_DAT, CHU_THOI_GIAN_TOI, CHU_CHAN_DUNG, CHU_TAROT,
} from "@/lib/chu/cong-cu";

export type NhomTrang = "cong_cu" | "tinh" | "phap_ly" | "chu_de" | "kien_thuc" | "tuoi" | "la_so_mau" | "blog_khung" | "cong_cu_con";
/** Ô CMS được phép sửa ở trang này (mục 3.2). */
export type OTrang = "seo" | "dau_trang" | "gioi_thieu" | "muc" | "khoi_tren" | "khoi_duoi" | "khoi_cuoi";

export type MacDinhTrang = {
  tieu_de_seo?: string; mo_ta_seo?: string; h1?: string; loi_dan?: string;
  doan?: string[]; hoi_dap?: { hoi: string; dap: string }[]; lien_ket?: { href: string; ten: string }[];
  /** Mục văn bản: chỉ id neo + tiêu đề (thân mục là JSX trong page.tsx). */
  muc?: { id: string; tieu_de: string }[];
  ngay_hieu_luc?: string;
  /** ND-7 "Chữ trên trang": bảng chữ cố định của trang (khoá → chữ mặc định) — CMS cho sửa từng khoá. */
  chu?: BangChu;
  /** ND-7 đợt 2 "Hình trên trang": chỗ đặt hình thay được bằng ảnh thư viện CMS. */
  hinh?: BangHinh;
};
export type MucSoTrang = { duong: string; nhom: NhomTrang; ten: string; o: readonly OTrang[]; mac_dinh: MacDinhTrang };

/** Nguồn chữ KB của một cụm — CMS xem trước CHỈ ĐỌC + nút "Sửa trong Kho tri thức" (mục 8.2). */
export type NguonKb = { kieu: "kb" | "tuoi" | "la_so_mau"; loai?: LoaiTrang; vi_du: string; tep_kb: string[] };
export type MauCumTrang = {
  mau_duong: string; nhom: "kien_thuc" | "tuoi" | "la_so_mau" | "cong_cu_con"; ten: string;
  /** Biến web cấp cho khối của mẫu ({tieu_de}…); biến lạ giữ nguyên chữ. */
  bien: readonly string[]; o: readonly OTrang[]; nguon_kb: NguonKb | null;
  /** ND-7: bảng chữ dùng chung cho cả cụm (chữ có thể chứa {bien}). */
  chu?: BangChu;
  /** ND-7 đợt 2: hình của cả cụm (mặc định: ảnh chia sẻ khi gửi link — HINH_CUM). */
  hinh?: BangHinh;
};

const O_CONG_CU: readonly OTrang[] = ["seo", "dau_trang", "gioi_thieu", "khoi_tren", "khoi_duoi", "khoi_cuoi"];
const O_TRANG_PHU: readonly OTrang[] = ["seo", "dau_trang", "khoi_tren", "khoi_duoi", "khoi_cuoi"];
const O_TINH: readonly OTrang[] = ["seo", "dau_trang", "khoi_tren", "khoi_duoi", "khoi_cuoi"];
const O_PHAP_LY: readonly OTrang[] = ["seo", "dau_trang", "muc"];
const O_CHU_DE: readonly OTrang[] = ["seo", "dau_trang", "khoi_tren", "khoi_duoi"];
const O_CUM: readonly OTrang[] = ["khoi_tren", "khoi_duoi", "khoi_cuoi"];

/** Công cụ HL-1/TDG-1 giữ chữ giới thiệu ở app/<công cụ>/noi-dung.ts (dùng chung cho trang ngày/tháng/năm con) — sổ đọc lại. */
const tuNd = (nd: NoiDungCongCu, tieu_de_seo: string, chu: BangChu): MucSoTrang => ({
  duong: nd.duong, nhom: "cong_cu", ten: nd.ten, o: O_CONG_CU,
  mac_dinh: { tieu_de_seo, mo_ta_seo: nd.moTa, doan: nd.doan, hoi_dap: nd.hoiDap, lien_ket: nd.lienKet ?? [], chu },
});




export const SO_TRANG: readonly MucSoTrang[] = [
  // ---------------- A · trang công cụ (hằng ND trong app/<mảng>/page.tsx)
  { duong: "/than-so", nhom: "cong_cu", ten: "Thần số học", o: O_CONG_CU, mac_dinh: { chu: CHU_THAN_SO,
    tieu_de_seo: "Thần số học Pythagoras: tính số chủ đạo theo họ tên và ngày sinh",
    mo_ta_seo: "Thần số học Pythagoras theo họ tên và ngày sinh: 4 con số cốt lõi có cách tính từng bước, dải đời, năm và tháng cá nhân, biểu đồ ngày sinh, hỏi đáp có nguồn.",
    doan: [
      "Nhập họ tên khai sinh và ngày sinh (dương lịch, hoặc âm lịch để hệ thống đổi giúp). Máy tính ra số đường đời, số sứ mệnh, số linh hồn, số nhân cách — mỗi con số hiện rõ từng bước cộng rút gọn, giữ số cái 11, 22, 33.",
      "Mỗi con số có ba phần: diễn giải từ kho tri thức có ghi nguồn (kèm mặt tối, không chỉ lời hay), phần kiểm chứng để bạn tích những nét đúng với mình, và cách tính từng bước để tự kiểm lại. Ngoài bốn số cốt lõi còn có dải đời (đỉnh cao, thử thách), năm và tháng cá nhân, biểu đồ ngày sinh và mũi tên, nợ nghiệp.",
      "Hồ sơ lưu trên máy bạn; máy chủ chỉ tính rồi bỏ, không lưu ngày sinh. Đây là nội dung văn hoá để tham khảo, không phải lời tiên đoán.",
    ],
    hoi_dap: [
      { hoi: "Số đường đời tính thế nào?", dap: "Có hai cách. Mặc định là rút gọn con số: cộng riêng ngày, tháng, năm cho gọn rồi mới cộng lại. Cách thứ hai là cộng một lượt mọi chữ số của ngày sinh. Cả hai đều giữ nguyên 11, 22, 33 (số cái). Hai cách có khi ra hai số khác nhau; trang kết quả báo rõ và cho bạn chọn, kèm từng bước cộng để tự kiểm." },
      { hoi: "Có cần họ tên đầy đủ không?", dap: "Có, để tính số sứ mệnh, linh hồn và nhân cách theo bảng chữ cái Pythagoras. Nên dùng họ tên khai sinh, có dấu hay không dấu đều được." },
      { hoi: "Ngày sinh âm lịch thì sao?", dap: "Bạn nhập âm lịch, hệ thống đổi sang dương lịch theo âm lịch Việt Nam rồi mới tính." },
      { hoi: "Thần số học có dự đoán tương lai không?", dap: "Không. Con số chỉ gợi một khung để nhìn lại bản thân; mọi diễn giải đều kèm mặt tối và câu hỏi tự soi, không phán số phận." },
    ],
    lien_ket: [{ href: "/than-so/y-nghia-so", ten: "Ý nghĩa 12 con số" }, { href: "/than-so/nghe-nghiep", ten: "Số chủ đạo hợp nghề gì" }, { href: "/than-so/nam-ca-nhan", ten: "Năm cá nhân 1–9" }, { href: "/than-so/no-nghiep", ten: "Nợ nghiệp" }, { href: "/than-so/so-kep", ten: "Số kép Chaldea" }, { href: "/hop-doi", ten: "Hợp đôi" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }],
  } },
  { duong: "/hom-nay", nhom: "cong_cu", ten: "Hôm nay của bạn", o: O_CONG_CU, mac_dinh: { chu: CHU_HOM_NAY,
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
  { duong: "/hop-doi", nhom: "cong_cu", ten: "Hợp đôi", o: O_CONG_CU, mac_dinh: { chu: CHU_HOP_DOI,
    tieu_de_seo: "Hợp đôi thần số học: hai người hoà và va ở đâu",
    mo_ta_seo: "So hợp đôi theo thần số học cho người yêu, bạn bè, đồng nghiệp, sếp, người thân: con số hai người hoà ở đâu, va ở đâu, việc nên cùng làm. Không chấm điểm hợp hay khắc.",
    doan: [
      "Chọn người ấy là ai với bạn — người yêu, bạn bè, đồng nghiệp, sếp hay người thân — rồi nhập ngày sinh (tên không bắt buộc). Hệ thống so cặp số đường đời và các cặp số theo tên, đọc theo đúng loại quan hệ đó, kèm nhịp năm cá nhân của hai người.",
      "Thần số không chấm điểm “hợp” hay “khắc”: hai con số nào cũng có chỗ dễ hoà và chỗ dễ va. Bạn có thể gửi link mời để người ấy tự nhập ngày sinh của họ — link chỉ chứa tên hiển thị và con số, không chứa ngày sinh.",
    ],
    hoi_dap: [
      { hoi: "Hợp đôi có chấm điểm phần trăm không?", dap: "Không. Điểm số hợp/khắc dễ gây hiểu lầm; trang chỉ nêu chỗ hoà, chỗ va và việc nên cùng làm. Muốn có điểm tham khảo thì dùng khối “Xem lá số 2 người” ở trang Tử vi — điểm ở đó cộng từ các luật hợp – khắc có sẵn trong sách Tử vi và lịch cổ." },
      { hoi: "Ngày sinh người kia có bị lưu lại không?", dap: "Không. Ngày sinh chỉ dùng để tính rồi bỏ. Vui lòng chỉ nhập khi người đó biết và đồng ý." },
      { hoi: "Xem hợp đôi đồng nghiệp hay sếp khác gì người yêu?", dap: "Cùng một cặp số nhưng cách đọc khác: mỗi loại quan hệ có phần diễn giải riêng về cách phối hợp, giao tiếp, ranh giới." },
    ],
    lien_ket: [{ href: "/than-so", ten: "Thần số học của bạn" }, { href: "/hop-doi/cap-so", ten: "Số chủ đạo nào hợp nhau" }, { href: "/than-so/tinh-yeu", ten: "Số chủ đạo trong tình yêu" }, { href: "/than-so/y-nghia-so", ten: "Ý nghĩa 12 con số" }],
  } },
  { duong: "/tu-vi", nhom: "cong_cu", ten: "Tử vi", o: O_CONG_CU, mac_dinh: { chu: CHU_TU_VI,
    tieu_de_seo: "Lập lá số Tử vi online: 12 cung, đại hạn, lưu niên, lưu nguyệt",
    mo_ta_seo: "Lập lá số Tử vi 12 cung theo giờ, ngày, nơi sinh (âm lịch Việt Nam, múi giờ lịch sử). Đại hạn, lưu niên, tiểu hạn, lưu nguyệt theo phái, hỏi đáp theo cung.",
    doan: [
      "Bạn nhập ngày giờ sinh, giới tính và nơi sinh (63 tỉnh thành hoặc nước ngoài). Lá số 12 cung hiện ngay, tính theo âm lịch Việt Nam, có xử lý giờ lịch sử trước năm 1975; sinh ở nước ngoài thì lập theo giờ nơi sinh. Chạm vào cung nào cũng thấy các sao trong cung, độ sáng của sao và lối đọc kỹ từng sao.",
      "Dưới lá số là bài đọc từng mảng đời bằng lời thường: con người bạn, các giai đoạn cuộc đời, công việc, tiền bạc, tình yêu, gia đình, sức khoẻ, bạn bè, nhà cửa, mảng nào kéo mảng nào, năm nay và 3 tháng tới, mười năm tới, lời khuyên. Chương đầu đọc ngay; các chương sau có thể cần Sao. Mỗi mảng có mức Thuận lợi, Cân bằng hoặc Cần lưu ý, kèm việc nên làm. Thuật ngữ gom ở mục “Vì sao nói vậy” cho ai muốn đối chiếu sách.",
      "Dòng 10 năm chỉ ra năm nào nên chú ý tiền bạc, công việc, tình cảm hay sức khoẻ hơn, và năm đó nên làm gì. Về sức khoẻ, trang nhắc năm nên chú ý và đi khám, không nêu tên bệnh, không thay lời bác sĩ. Thắc mắc riêng về một cung, một sao hay một năm thì hỏi ở khung hỏi đáp ngay dưới lá số.",
    ],
    hoi_dap: [
      { hoi: "Lá số Tử vi là gì, xem được những gì?", dap: "Lá số Tử vi là bản đồ 12 cung lập từ giờ, ngày, tháng, năm sinh âm lịch. Mỗi cung nói về một mảng: tính cách, tiền bạc, công việc, vợ chồng, con cái, sức khoẻ, nhà cửa… Ở đây lá số đi kèm bài đọc từng mảng đời bằng lời thường, có mức và việc nên làm cho từng mảng, dòng 10 năm tới và 3 tháng tới." },
      { hoi: "Không biết giờ sinh thì có xem Tử vi được không?", dap: "Được, nhưng nên dò lại giờ. Chọn “Không biết giờ” thì lá số lập tạm theo 12 giờ trưa và bài đọc ghi rõ là giờ tạm. Mục “Định giờ sinh” so các canh giờ với vài năm bạn nhớ rõ đã có việc lớn, để chọn canh khớp nhất. Mỗi canh giờ ra một lá số khác, nên giờ càng đúng thì bài đọc càng sát." },
      { hoi: "Xem Tử vi online có chính xác không, có nên tin?", dap: "Phần lập lá số tính đúng theo sách và được đối chiếu với nhiều lá số mẫu. Phần lời đọc là cách hiểu theo sách xưa, mang tính tham khảo văn hoá, không phải lời phán. Mỗi hộp có nút “Đúng với mình / Chưa đúng” để bạn tự chấm. Việc lớn về tiền, sức khoẻ, giấy tờ vẫn nên hỏi người có chuyên môn." },
      { hoi: "Lập lá số Tử vi ở đây có miễn phí không?", dap: "Lá số 12 cung và chương đầu bài đọc miễn phí, không cần tài khoản. Các chương sau có thể cần Sao, là điểm dùng trong Hiểu Bản Thân. Trang báo trước số Sao cần và chỉ trừ khi bạn bấm đồng ý. Hỏi đáp có lượt hỏi miễn phí mỗi ngày." },
      { hoi: "Vì sao lá số ở đây khác trang khác?", dap: "Thường do lịch. Nhiều trang đổi ngày sinh theo âm lịch Trung Quốc, lệch với âm lịch Việt Nam ở một số ngày, có khi lệch cả tháng âm. Ở đây mặc định âm lịch Việt và tính cả giờ lịch sử miền Nam trước 1975. Mục “Trường phái” (nút “Hiển thị” trên lá số) cho bạn chuyển sang lịch Trung Quốc hoặc cách tính khác để so." },
      { hoi: "Tử vi khác Bát tự và thần số học thế nào?", dap: "Ba môn dùng ngày sinh nhưng nhìn khác nhau. Tử vi chia đời thành 12 cung để xem từng mảng: việc, tiền, tình cảm, nhà cửa. Bát tự xếp bốn cột năm, tháng, ngày, giờ để xem sức ngũ hành của chính bạn. Thần số học tính từ họ tên và ngày sinh dương lịch, không cần giờ sinh." },
      { hoi: "Ngày giờ sinh của tôi có bị lưu hay gửi đi không?", dap: "Không gửi cho bên thứ ba. Lá số tính trên hệ thống của Hiểu Bản Thân rồi bỏ, hồ sơ nằm trên máy bạn. Chỉ khi bạn tự bấm lưu vào tài khoản thì hồ sơ mới được giữ, và bạn xoá được ngay ở mục “Dữ liệu của tôi”." },
      { hoi: "Xem Tử vi cho người khác hay cho hai người được không?", dap: "Được. Mục “Xem lá số 2 người” cho điểm hợp tham khảo từ 0 đến 100 và cách dung hoà, đọc theo đúng quan hệ: người yêu, bạn bè, đồng nghiệp, người trong nhà… Bạn cũng gửi được link mời để người ấy tự nhập ngày sinh và xem hợp đôi. Lá số người thân chỉ lưu trên máy bạn khi bạn đồng ý; nên hỏi ý họ trước." },
    ],
    lien_ket: [{ href: "/tu-vi/chinh-tinh", ten: "14 chính tinh" }, { href: "/tu-vi/cung", ten: "12 cung" }, { href: "/tu-vi/la-so-mau", ten: "Lá số mẫu đọc từng bước" }],
  } },
  { duong: "/bat-tu", nhom: "cong_cu", ten: "Bát tự", o: O_CONG_CU, mac_dinh: { chu: CHU_BAT_TU,
    tieu_de_seo: "Bát tự Tứ trụ: lập lá số theo giờ sinh, ngũ hành, dụng thần",
    mo_ta_seo: "Bát tự tứ trụ theo tiết khí: thiên can, địa chi, thập thần, ngũ hành chấm điểm công bố, cách cục Tử Bình Chân Thuyên, dụng thần trình bày hai cách, đại vận 10 năm.",
    doan: [
      "Bạn từng được bảo mình thiếu Thuỷ nên đặt cái này, đeo cái kia? Trước khi bù, cần biết thật sự mình thiếu gì. Trang lập bốn trụ từ ngày giờ sinh, chấm năm hành theo thang điểm ghi rõ, rồi cho bạn xem hành nào dư, hành nào hụt và sức của chính bạn đang mạnh hay yếu. Thiếu một hành chưa hẳn là phải bù đúng hành đó.",
      "Hay bị nhầm nhất: “mệnh” theo năm sinh (như Hải Trung Kim, Lư Trung Hoả) khác với hành của bạn trong Bát tự. Bát tự lấy hành từ can của ngày sinh, nên hai người cùng tuổi vẫn có thể mang hai hành khác nhau. Bảng chi tiết vẫn ghi mệnh theo năm để bạn đối chiếu với điều đã nghe.",
      "Hành nên bù có nhiều lối tìm. Trang đưa hai lối hay dùng, nói rõ khi chúng khác nhau và không chọn thay bạn. Khi hai lối đọc khác nhau, mục “Cách nào đúng với bạn?” cho bạn kể vài năm đã qua suôn sẻ hay vất vả để tự so. Lời đọc là tham khảo văn hoá, quyết định vẫn ở bạn. Trang không giới thiệu hay bán vật phẩm.",
    ],
    hoi_dap: [
      { hoi: "Mệnh tôi thiếu hành gì, nên bù thế nào?", dap: "Bài đọc có biểu đồ năm cột cho thấy hành nào dư, hành nào hụt. Thiếu một hành chưa hẳn phải bù đúng hành đó, còn tuỳ sức bạn mạnh hay yếu. Bài đọc gợi ý bằng thói quen, ví dụ thiếu Kim dễ khó nói “không”, nên lập danh sách việc mỗi sáng. “Mệnh” theo năm sinh (như Hải Trung Kim) khác với hành của bạn trong Bát tự." },
      { hoi: "Bát tự là gì, tứ trụ là gì?", dap: "Bát tự là tám chữ can chi của năm, tháng, ngày, giờ sinh. Mỗi cặp can chi là một trụ, bốn trụ gọi là tứ trụ. Từ tám chữ ấy, người xưa xét năm hành Kim, Mộc, Thuỷ, Hoả, Thổ nhiều ít ra sao, và hành của chính bạn (gọi là nhật chủ, lấy từ can ngày sinh) đứng ở đâu giữa chúng." },
      { hoi: "Dụng thần là gì, vì sao trang đưa hai cách?", dap: "Dụng thần là hành giúp lá số cân hơn. Sách xưa có nhiều lối tìm, trang đưa hai lối hay dùng: cân sức mạnh yếu (có xét nóng lạnh theo mùa sinh) và theo tháng sinh. Hai lối có khi ra cùng hành, có khi không. Khi khác nhau, mục “Cách nào đúng với bạn?” giúp bạn tự so bằng vài năm đã qua." },
      { hoi: "Không biết giờ sinh thì có xem được không?", dap: "Xem được, nhưng có giới hạn. Chọn “Không biết giờ”, trang tạm lấy 12 giờ trưa và ghi rõ trên bài. Ba trụ năm, tháng, ngày thường vẫn tính đủ nên hành của bạn thường không đổi, trừ khi bạn sinh đúng ngày chuyển tiết hay ngày Lập xuân; phần dựa vào trụ giờ như tỉ lệ năm hành, con cái, tuổi về sau chỉ nên đọc để tham khảo. Hỏi lại người nhà nếu được." },
      { hoi: "Sinh gần Tết hoặc lúc 23 giờ thì tính năm, ngày thế nào?", dap: "Năm đổi ở Lập xuân (khoảng 4/2 dương lịch), không ở mùng 1 Tết; tháng đổi ở ngày giao tiết. Sinh 23:00–23:59, mặc định giữ ngày hôm đó và lấy giờ Tý của ngày hôm sau. Ở mục Trường phái bạn đổi được sang lối tính sang ngày mới từ 23 giờ; trang luôn ghi chú cho người sinh giờ này." },
      { hoi: "Bát tự khác Tử vi thế nào?", dap: "Bát tự xét năm hành trong tám chữ ngày giờ sinh, mạnh về chuyện bạn dư gì, thiếu gì và nhịp từng giai đoạn 10 năm. Tử vi an sao vào 12 cung, mạnh về từng mảng đời như tiền bạc, nhà cửa, người thân. Hai lối nhìn bổ sung cho nhau; một hồ sơ dùng được cho cả hai trang." },
      { hoi: "Xem Bát tự ở đây có chính xác không, có mất phí không?", dap: "Phép tính cố định: cùng ngày giờ sinh luôn ra cùng bốn trụ, cùng biểu đồ năm hành. Tứ trụ, hành của bạn và chương đầu bài luận đọc miễn phí; các chương sau có thể cần Sao, đơn vị dùng trong trang. Lời luận là tham khảo văn hoá, mỗi hộp có nút “Đúng với mình / Chưa đúng” để bạn tự chấm." },
      { hoi: "Ngày giờ sinh của tôi có bị lưu không?", dap: "Mặc định hồ sơ chỉ nằm trên máy bạn, không cần tài khoản. Ngày giờ sinh đi qua một lượt tính rồi thôi, không gửi cho bên thứ ba. Nếu bạn tự bấm lưu hồ sơ vào tài khoản, bạn xoá được ngay khi muốn." },
    ],
    lien_ket: [{ href: "/bat-tu/thap-than", ten: "10 thập thần" }, { href: "/bat-tu/nhat-chu", ten: "10 nhật chủ" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }],
  } },
  { duong: "/kinh-dich", nhom: "cong_cu", ten: "Kinh Dịch", o: O_CONG_CU, mac_dinh: { chu: CHU_KINH_DICH,
    tieu_de_seo: "Gieo quẻ Kinh Dịch online: 64 quẻ, 384 hào, lời quẻ có nguồn",
    mo_ta_seo: "Gieo quẻ Kinh Dịch cho một câu hỏi cụ thể: máy gieo, Mai Hoa theo giờ hoặc tự gieo đồng xu. Đọc theo Nghĩa Lý, Lục Hào, Mai Hoa, có trích Chu Dịch và lời giải thích dễ hiểu.",
    doan: [
      "Đang phân vân một việc — nhận lời mời, dọn nhà, mở quán, nói chuyện lại với một người? Gieo một quẻ, nhận câu trả lời ngắn bằng lời thường: việc đang thuận hay cần đổi cách, và nên làm gì trong tuần này. Quẻ do máy gieo ngẫu nhiên, theo giờ, theo số hay phương vị (Mai Hoa), hoặc bạn tự gieo ba đồng xu — không bước nào tự chọn quẻ thay bạn.",
      "Lời đọc gồm quẻ chủ, hào động, quẻ biến; trích nguyên văn Chu Dịch (quái từ, hào từ, Thoán truyện) kèm dịch nghĩa và lời giải thích dễ hiểu. Mỗi lời đọc có mặt tối và câu hỏi tự soi.",
      "Hỏi lại cùng một việc nhiều lần trong thời gian ngắn, trang sẽ nhắc theo tinh thần quẻ Mông.",
    ],
    hoi_dap: [
      { hoi: "Nên hỏi Kinh Dịch thế nào?", dap: "Hỏi một việc cụ thể, rõ ràng, liên quan đến lựa chọn của chính bạn (ví dụ: có nên nhận lời mời làm việc này không), tránh câu hỏi có/không về số phận." },
      { hoi: "Ba cách gieo khác nhau thế nào?", dap: "Máy gieo mô phỏng ba đồng xu; Mai Hoa lấy quẻ theo năm, tháng, ngày âm và giờ lúc hỏi (chọn được âm lịch Việt Nam hoặc Trung Quốc); tự gieo là bạn tung xu thật rồi nhập. Cách đọc lời quẻ giống nhau." },
      { hoi: "Không có hào động thì đọc thế nào?", dap: "Lời chủ là quái từ của quẻ, kèm Thoán truyện dịch nghĩa." },
    ],
    lien_ket: [{ href: "/kinh-dich/que", ten: "64 quẻ Kinh Dịch" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }],
  } },
  { duong: "/phong-thuy", nhom: "cong_cu", ten: "Phong thuỷ", o: O_CONG_CU, mac_dinh: { chu: CHU_PHONG_THUY,
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
    lien_ket: [{ href: "/phong-thuy/huong-xau-nam", ten: "Hướng xấu theo năm" }, { href: "/xem-tuoi-lam-nha", ten: "Tuổi làm nhà" }, { href: "/phong-thuy/huong-hop-tuoi", ten: "Tuổi nào hợp hướng nào (1960–2005)" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ phong thuỷ" }, { href: "/huyen-hoc", ten: "Các hệ thống khác" }],
  } },
  // NT-1: Nhân tướng học — tự quan sát gương mặt trong gương, không cần ảnh.
  { duong: "/nhan-tuong", nhom: "cong_cu", ten: "Nhân tướng học", o: O_CONG_CU, mac_dinh: { chu: CHU_NHAN_TUONG,
    tieu_de_seo: "Xem tướng mặt online: tự soi gương theo Tam đình, Ngũ quan, 12 cung",
    mo_ta_seo: "Nhân tướng học tự quan sát: trả lời 31 câu về trán, mày, mắt, mũi, miệng, cằm trong gương — bài đọc 8 chương theo Ma Y, Băng Giám, Nội Kinh: tính cách, công việc, sức khoẻ, tuổi lưu niên. Không cần gửi ảnh.",
    doan: [
      "Gương mặt kể gì về bạn? Đứng trước gương, trả lời 31 câu ngắn theo sáu bước (tổng thể, trán và mày, mắt, mũi và gò má, miệng cằm tai, giọng và dáng) — trang ghép điều bạn thấy với cách đọc của sách tướng xưa thành bài đọc tám chương: dáng mặt theo năm hành, tính cách, công việc và tiền bạc, tình cảm, sức khoẻ, năm nay nhìn vào đâu, tướng và lá số, việc nên làm.",
      "Không cần gửi ảnh: mọi câu trả lời nằm trên máy bạn. Phần ‘Y tướng’ chỉ nói hệ cơ quan sách xưa gắn với từng vùng và việc đi khám, không đoán bệnh. Không điểm số, không ‘tướng xấu’, không xem tướng người khác.",
      "Tướng tuỳ tâm sinh: nếp mặt là thói quen nhiều năm — mỗi chương đều có việc 0 đồng để đổi thói quen, soi lại sau ba tháng.",
    ],
    hoi_dap: [
      { hoi: "Có cần chụp ảnh không?", dap: "Không. Bạn tự soi gương và chọn lựa chọn mô tả đúng nhất; câu trả lời chỉ lưu trên máy bạn. Nếu muốn, bạn chấm 4 điểm trên ảnh của mình ngay trên trình duyệt để đo ba đình — ảnh không rời máy." },
      { hoi: "Xem tướng có chính xác không?", dap: "Tướng pháp nói về xu hướng và thói quen, không nói trước điều gì sẽ xảy ra. Mỗi hộp có nút ‘Đúng với mình / Chưa đúng’ để bạn tự chấm; nét nào sách xưa gọi là ‘cần lưu ý’ đều kèm việc nên làm." },
      { hoi: "Có xem tướng cho người khác được không?", dap: "Không. Nhìn mặt mà xét người là bất công với họ; trang chỉ đọc tướng của chính người tự quan sát và không giúp chọn nhân viên, đối tác hay bạn đời theo tướng." },
      { hoi: "Phần sức khoẻ có đoán bệnh không?", dap: "Không. Nội Kinh gắn từng vùng mặt với một hệ cơ quan; trang chỉ nhắc chăm sóc và đi khám định kỳ, luôn kèm câu không thay lời bác sĩ." },
    ],
    lien_ket: [{ href: "/nhan-tuong/bo-vi", ten: "Bộ vị gương mặt" }, { href: "/bat-tu", ten: "Bát tự (hành cần bù)" }, { href: "/tu-dien", ten: "Từ điển thuật ngữ" }, { href: "/huyen-hoc", ten: "Các hệ thống khác" }],
  } },
  // TR-1: Tarot — tự xáo, rút, lật; bốn trường phái có sách; không phán.
  { duong: "/tarot", nhom: "cong_cu", ten: "Tarot", o: O_CONG_CU, mac_dinh: { chu: CHU_TAROT,
    tieu_de_seo: "Xem Tarot online: tự rút bài, ý nghĩa 78 lá theo 4 trường phái",
    mo_ta_seo: "Trải bài Tarot online: nhấn giữ xáo bài, tự rút từ quạt 78 lá, lật từng lá. Bài đọc ghép Waite, Golden Dawn (Thoth), Marseille, B.O.T.A.: từng vị trí, phẩm giá nguyên tố, nhịp thời gian gợi ý, việc nên làm. Ý nghĩa 78 lá xuôi và ngược.",
    doan: [
      "Tarot ở đây là cách nhìn lại một việc qua hình ảnh: bạn đặt câu hỏi, nhấn giữ để xáo (nhịp tay bạn thành hạt giống xáo bài), tự rút lá từ quạt 78 lá úp rồi lật từng lá. Bài đọc tám chương mở bằng phần trả lời đúng câu bạn hỏi (nghiêng về có, có điều kiện hay chưa nên vội — vì sao, điều cần gỡ trước, 3 việc nên làm), rồi ghép bốn trường phái có sách — Waite (chuyện gì đang diễn ra), Golden Dawn và Thoth (phẩm giá nguyên tố giữa các lá, decan hoàng đạo), Marseille (hướng nhìn của nhân vật, việc để làm), B.O.T.A. (lá soi nếp nghĩ nào của bạn).",
      "Năm kiểu trải bài: một lá, ba lá (quá khứ – hiện tại – sắp tới, hoặc tình huống – điều cản – lời khuyên), năm lá chữ thập, Celtic Cross mười lá. Có hồ sơ Nhân tướng (bạn tự soi gương) thì chương “Tướng và lá bài” chọn lá đại diện cho chính bạn.",
      "Không phán điều gì sẽ xảy ra, không điểm số, không đọc người khác, không bán vật phẩm. Nhịp thời gian chỉ là gợi ý để chọn lúc làm. Mỗi hộp có nút “Đúng với mình / Chưa đúng” để bạn tự chấm.",
    ],
    hoi_dap: [
      { hoi: "Tarot có đúng không?", dap: "Tarot không nói trước tương lai. Nó đặt tên cho điều đang có để bạn nhìn rõ hơn, bằng bốn cách đọc có sách; đúng hay chưa, bạn là người chấm ở từng hộp." },
      { hoi: "Lá ngược nghĩa là gì?", dap: "Lá rút ra bị lộn đầu. Theo lối Waite, lá ngược là tính chất của lá đang bị chặn, yếu đi hoặc hướng vào trong — không phải dấu hiệu xấu. Marseille và Thoth không dùng lá ngược mà đọc bằng lá bên cạnh; bạn chọn dùng hay không khi xáo." },
      { hoi: "Máy có chọn lá theo câu hỏi không?", dap: "Không. Máy chỉ xáo (theo hạt giống từ nhịp tay bạn, hoặc ngẫu nhiên thật); lá nào vào vị trí nào là do chính bạn rút từ quạt. Câu hỏi chỉ dùng để bài đọc nói đúng chuyện, không lưu trên máy chủ." },
      { hoi: "Có xem cho người khác được không?", dap: "Không. Lá bài không nói được người khác đang nghĩ gì hay làm gì; hỏi theo hướng “tôi nên làm gì với chuyện này” thì trải bài trả lời được." },
    ],
    lien_ket: [{ href: "/tarot/la-bai", ten: "Ý nghĩa 78 lá bài" }, { href: "/kinh-dich", ten: "Kinh Dịch (gieo quẻ cho một việc)" }, { href: "/nhan-tuong", ten: "Nhân tướng học (lá đại diện)" }, { href: "/huyen-hoc", ten: "Các hệ thống khác" }],
  } },
  // HL-1 / TDG-1: công cụ hoàng lịch + tuổi — giới thiệu + hỏi đáp mặc định ở app/*/noi-dung.ts.
  tuNd(ND_XEM_NGAY, "Xem ngày tốt hôm nay: hoàng đạo, giờ tốt, việc nên làm", CHU_XEM_NGAY),
  tuNd(ND_LAM_NHA, "Xem tuổi làm nhà, cưới hỏi: Kim lâu, Hoang ốc, Tam tai", CHU_LAM_NHA),
  tuNd(ND_XONG_DAT, "Xem tuổi xông đất đầu năm hợp gia chủ, giờ đẹp mùng 1", CHU_XONG_DAT),
  tuNd(ND_HAN_NAM, "Hướng xấu theo năm: Thái Tuế, Tam Sát, Ngũ Hoàng", CHU_HAN_NAM),
  tuNd(ND_SAO_HAN, "Xem sao hạn năm nay theo tuổi: La Hầu, Kế Đô, Thái Bạch…", CHU_SAO_HAN),   // MT-ĐS B3
  tuNd(ND_DOI_LICH, "Đổi lịch âm dương: ngày âm hôm nay, can chi, tháng nhuận", CHU_DOI_LICH),   // SEO-L5
  tuNd(ND_THOI_GIAN_TOI, "3 tháng tới, 12 tháng tới và năm tới của bạn", CHU_THOI_GIAN_TOI),   // NAM-2
  tuNd(ND_CHAN_DUNG, "Chân dung tổng hợp: Tử vi, Bát tự và nhân tướng cùng nhìn bạn", CHU_CHAN_DUNG),   // CD-1
  { duong: "/ban-than", nhom: "cong_cu", ten: "Hồ sơ bản thân", o: ["seo", "khoi_duoi", "khoi_cuoi"], mac_dinh: {
    tieu_de_seo: "Hồ sơ bản thân",
    mo_ta_seo: "Trang của bạn: bốn con số chủ đạo, nhịp ngày – tháng – năm cá nhân, bản đồ con số và lối tắt sang hợp đôi, huyền học.",
  } },
  { duong: "/nap-sao", nhom: "cong_cu", ten: "Nạp Sao", o: O_TRANG_PHU, mac_dinh: {
    tieu_de_seo: "Nạp Sao", h1: "Nạp Sao",
    mo_ta_seo: "Nạp Sao để mở Luận giải toàn bộ và các tính năng chuyên sâu. Thanh toán bằng QR chuyển khoản qua app ngân hàng hoặc ví điện tử.",
  } },
  { duong: "/hoi-vien", nhom: "cong_cu", ten: "Hội viên năm", o: O_TRANG_PHU, mac_dinh: {
    tieu_de_seo: "Hội viên năm — mở mọi luận giải, mua một lần", h1: "Hội viên năm",
    mo_ta_seo: "Hội viên năm Hiểu Bản Thân: mở mọi chương Luận giải toàn bộ Tử vi, Bát tự, Bản đồ con số, Sao tặng mỗi tháng. Trả một lần bằng QR chuyển khoản, không tự gia hạn.",
  } },
  { duong: "/tai-khoan", nhom: "cong_cu", ten: "Tài khoản", o: ["seo"], mac_dinh: { tieu_de_seo: "Tài khoản" } },
  // SAO-CG (0029): trang bán câu hỏi chuyên gia — chữ trong app/hoi-chuyen-gia/page.tsx; chỉ có trong sitemap khi công tắc bật.
  { duong: "/hoi-chuyen-gia", nhom: "cong_cu", ten: "Hỏi chuyên gia", o: ["seo"], mac_dinh: {
    tieu_de_seo: "Hỏi chuyên gia — một câu hỏi, trả lời trong 48 giờ", h1: "Một câu hỏi, một câu trả lời của người thật",
    mo_ta_seo: "Đặt một câu hỏi về thần số học, Tử vi, Bát tự, Kinh Dịch hoặc phong thuỷ cho chuyên gia Đức Luân. Trả lời bằng văn bản trong 48 giờ, quá hạn hoàn 100%. Giá cố định, thanh toán QR.",
  } },
  { duong: "/ung-ho", nhom: "cong_cu", ten: "Ủng hộ đội ngũ phát triển", o: O_TRANG_PHU, mac_dinh: {
    tieu_de_seo: "Ủng hộ đội ngũ phát triển Hiểu Bản Thân", h1: "Ủng hộ đội ngũ phát triển",
    mo_ta_seo: "Hiểu Bản Thân miễn phí phần lớn công cụ. Nếu thấy hữu ích, bạn có thể ủng hộ đội ngũ phát triển bằng chuyển khoản hoặc ví tiền mã hoá.",
  } },

  // ---------------- B · trang tĩnh / giới thiệu
  { duong: "/", nhom: "tinh", ten: "Trang chủ", o: O_TINH, mac_dinh: {
    tieu_de_seo: "Thần số học, Tử vi, Bát tự online miễn phí — Hiểu Bản Thân", h1: "Bạn là số mấy?",
    loi_dan: "Nhập tên và ngày sinh. 30 giây sau bạn biết mình mạnh ở đâu, hay vấp ở đâu, và *năm nay nên dồn sức vào việc gì*.",
    chu: CHU_TRANG_CHU, hinh: HINH_TRANG_CHU,
    mo_ta_seo: "Thần số học, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Nhân tướng, Tarot: tính toán minh bạch, diễn giải có nguồn, câu hỏi để tự soi. Miễn phí.",
  } },
  // Hub Huyền học (trước 2026-10-27 là /kham-pha "Khám phá" — 308 về đây, lib/chuyen-huong.json).
  { duong: "/huyen-hoc", nhom: "tinh", ten: "Huyền học", o: O_TINH, mac_dinh: { chu: CHU_HUYEN_HOC, hinh: HINH_HUYEN_HOC,
    tieu_de_seo: "Huyền học online: Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Nhân tướng, Tarot",
    mo_ta_seo: "Huyền học và thần số học trong một hồ sơ: lá số Tử vi, Bát tự, quẻ Kinh Dịch, phong thuỷ nhà ở, nhân tướng, Tarot. Tính minh bạch, có nguồn, miễn phí.",
    h1: "Huyền học — bảy cách nhìn lại mình",
    // AIO: câu đầu định nghĩa thẳng "huyền học là gì" (≤ 45 chữ) để máy tìm kiếm / AI trích nguyên câu.
    loi_dan: "Huyền học là những hệ thống người xưa dùng để đọc nhịp của con người và thời gian — qua con số, ngày giờ sinh, quẻ dịch, nơi ở, gương mặt và lá bài. Thần số học là cửa vào nhanh nhất; Tử vi, Bát tự, Kinh Dịch, Phong thuỷ, Nhân tướng đi sâu hơn; Tarot nhìn lại một việc cụ thể. Cả bảy dùng chung một hồ sơ, tính từng bước, có nguồn sách.",
  } },
  // NAM-1 (2026-10-30): mục lục năm + mục lục lịch âm (trước 404).
  { duong: "/nam", nhom: "tinh", ten: "Xem theo năm", o: O_TINH, mac_dinh: {
    tieu_de_seo: "Xem theo năm: năm con gì, Tết, Tam tai, tuổi làm nhà, xông đất", h1: "Xem theo năm",
    mo_ta_seo: "Tra từng năm âm lịch: can chi, mệnh nạp âm, ngày Tết, tuổi Tam tai, năm tuổi, sao hạn, tuổi làm nhà, cưới hỏi, xông đất, sinh con — và xem 3 tháng, 12 tháng tới của riêng bạn.",
    loi_dan: "Mỗi năm âm lịch một trang: năm con gì, Tết ngày nào, tuổi nào Tam tai, xung năm — kèm mọi bảng tra theo tuổi của năm đó.",
  } },
  { duong: "/lich-am", nhom: "tinh", ten: "Lịch âm các năm", o: O_TINH, mac_dinh: {
    tieu_de_seo: "Lịch âm các năm: Tết, tháng nhuận, mùng 1 và rằm", h1: "Lịch âm các năm",
    mo_ta_seo: "Lịch âm Việt Nam từng năm: ngày Tết, năm có tháng nhuận không, mùng 1 và rằm từng tháng ứng với dương lịch, tháng đủ hay thiếu. Kèm công cụ đổi ngày âm dương.",
    loi_dan: "Tính theo giờ Hà Nội (thuật toán Hồ Ngọc Đức). Chọn một năm để xem Tết, tháng nhuận, mùng 1 và rằm từng tháng.",
  } },
  { duong: "/kien-thuc", nhom: "tinh", ten: "Thư viện kiến thức", o: O_TINH, mac_dinh: { chu: CHU_KIEN_THUC,
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
    tieu_de_seo: "Blog thần số học, Tử vi, phong thuỷ, Kinh Dịch", h1: "Blog",
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
    muc: [{ id: "tom-tat", tieu_de: "Tóm tắt trong 30 giây" }, { id: "ben-kiem-soat", tieu_de: "Ai chịu trách nhiệm về dữ liệu" }, { id: "du-lieu", tieu_de: "Dữ liệu nào, lưu ở đâu, bao lâu" }, { id: "muc-dich", tieu_de: "Mục đích và căn cứ xử lý" }, { id: "dong-y", tieu_de: "Cách bạn đồng ý và rút lại" }, { id: "ben-thu-ba", tieu_de: "Bên xử lý thay chúng tôi và chuyển dữ liệu ra nước ngoài" }, { id: "quyen", tieu_de: "Quyền của bạn và cách thực hiện" }, { id: "tre-em", tieu_de: "Trẻ em" }, { id: "trinh-duyet", tieu_de: "Cookie và lưu trữ trên trình duyệt" }, { id: "bao-mat", tieu_de: "Bảo mật và sự cố" }, { id: "thay-doi", tieu_de: "Thay đổi chính sách" }],
  } },
  { duong: "/dieu-khoan", nhom: "phap_ly", ten: "Điều khoản sử dụng", o: O_PHAP_LY, mac_dinh: {
    tieu_de_seo: "Điều khoản sử dụng", h1: "Điều khoản sử dụng", ngay_hieu_luc: NGAY_HIEU_LUC,
    mo_ta_seo: "Điều khoản sử dụng Hiểu Bản Thân: tính chất dịch vụ tham khảo văn hoá, tài khoản, Sao, nội dung, sở hữu trí tuệ và giới hạn trách nhiệm.",
    muc: [{ id: "chap-nhan", tieu_de: "Chấp nhận điều khoản" }, { id: "tinh-chat", tieu_de: "Tính chất của dịch vụ" }, { id: "tai-khoan", tieu_de: "Tài khoản" }, { id: "sao", tieu_de: "Sao — điểm dùng trong ứng dụng" }, { id: "hoi-vien", tieu_de: "Hội viên năm" }, { id: "gioi-thieu", tieu_de: "Chương trình giới thiệu (mời bạn)" }, { id: "chuyen-gia", tieu_de: "Hỏi chuyên gia" }, { id: "hanh-vi", tieu_de: "Những điều không được làm" }, { id: "noi-dung", tieu_de: "Nội dung và sở hữu trí tuệ" }, { id: "trach-nhiem", tieu_de: "Giới hạn trách nhiệm" }, { id: "luat", tieu_de: "Luật áp dụng, thay đổi và liên hệ" }],
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
  so_kep: ["thanso_chaldean.json"], dau_hieu: ["phongthuy_kb.json", "phongthuy_do_thi.json"],
  co_thu: ["tuvi_co_thu.json", "tuvi_cach_cuc.json"], bo_vi: ["nhan_tuong_kb.json"], la_bai: ["tarot_kb.json"],
};
/** Trang mẫu của từng loại (để CMS xem trước chữ KB của cụm). */
const VI_DU: Record<LoaiTrang, string> = {
  so: "so-1", que: "que-1-can", sao: "sao-tu-vi", cung: "cung-menh", thap_than: "ty-kien", nhat_chu: "nhat-chu-giap",
  cap_so: "so-chu-dao-1-va-1", nghe: "so-1-hop-nghe-gi", tinh_yeu: "so-1-trong-tinh-yeu", nam_ca_nhan: "nam-ca-nhan-1",
  no_nghiep: "no-nghiep-13", sao_cung: "tu-vi-cung-menh", hoa_cung: "hoa-loc-cung-menh", menh_nam: "sinh-nam-1950-menh-gi",
  so_kep: "so-kep-10", dau_hieu: "duong-dam-thang-vao-nha", co_thu: "cot-tuy-phu", bo_vi: "an-duong", la_bai: "thap",
};

/** ND-7 đợt 2: mọi cụm (trừ hồ sơ chuyên gia) cho đặt MỘT ảnh chia sẻ dùng chung — thay ảnh /og tự vẽ theo tiêu đề. */
const HINH_CUM: BangHinh = {
  chia_se: { nhom: "Ảnh chia sẻ", nhan: "Ảnh khi gửi link trang trong cụm (Facebook, Zalo…)", goi_y: "1200×630, chữ lớn nằm giữa",
    mac_dinh: "Ảnh tự vẽ theo tiêu đề từng trang (vòng sao + tên trang)" },
};

const MAU_CUM_GOC: readonly MauCumTrang[] = [
  ...Object.entries(CHU_DE).map(([k, c]): MauCumTrang => ({
    mau_duong: `${c.duong}/{slug}`, nhom: "kien_thuc", ten: `Trang con · ${c.ten}`,
    bien: ["tieu_de", "mo_ta", "slug", "ten_chu_de"], o: O_CUM,
    nguon_kb: { kieu: "kb", loai: c.loai, vi_du: VI_DU[c.loai], tep_kb: TEP_KB_THEO_LOAI[c.loai] },
  })),
  // AUD-Q2: hướng hợp tuổi gộp theo CUNG PHI (8 trang; CMS migration aud_q2_cung_phi đổi mẫu cũ "tuoi-{nam}").
  { mau_duong: "/phong-thuy/huong-hop-tuoi/{slug}", nhom: "tuoi", ten: "Hướng hợp tuổi theo cung phi (8 cung)",
    bien: ["tieu_de", "slug"], o: O_CUM,
    nguon_kb: { kieu: "tuoi", vi_du: "cung-kham-bac", tep_kb: ["phongthuy_kb.json"] } },
  { mau_duong: "/tu-vi/la-so-mau/{slug}", nhom: "la_so_mau", ten: "Lá số Tử vi mẫu", bien: ["tieu_de", "slug"], o: O_CUM,
    nguon_kb: { kieu: "la_so_mau", vi_du: "tu-phu-dong-cung", tep_kb: ["tuvi_kb.json", "tuvi_cach_cuc.json"] } },
  // ND-7 — trang con theo ngày/năm của công cụ (nội dung engine tính, không phải kho tri thức): khối + "Chữ trên trang".
  // Thứ tự quan trọng: trang tháng trước trang ngày (cùng tiền tố /xem-ngay-tot/).
  { mau_duong: "/xem-ngay-tot/thang-{thang}-{nam}", nhom: "cong_cu_con", ten: "Xem ngày tốt · trang tháng", o: O_CUM, nguon_kb: null,
    bien: ["thang", "nam"], chu: CHU_THANG },
  // SEO-L2: ngày tốt theo việc — trước trang ngày (cùng tiền tố /xem-ngay-tot/).
  { mau_duong: "/xem-ngay-tot/{viec}-thang-{thang}-{nam}", nhom: "cong_cu_con", ten: "Xem ngày tốt · theo việc trong tháng", o: O_CUM,
    nguon_kb: null, bien: ["viec", "thang", "nam", "thang_am"], chu: CHU_VIEC_THANG },
  { mau_duong: "/xem-ngay-tot/{ngay}", nhom: "cong_cu_con", ten: "Xem ngày tốt · trang ngày", o: O_CUM, nguon_kb: null,
    bien: ["ngay", "thu", "am"], chu: CHU_NGAY },
  { mau_duong: "/xem-tuoi-lam-nha/{nam}/tuoi-{nam_sinh}", nhom: "cong_cu_con", ten: "Tuổi làm nhà · theo năm sinh", o: O_CUM, nguon_kb: null,
    bien: ["nam", "nam_sinh", "can_chi", "can_chi_nam", "nam_sau"], chu: CHU_LAM_NHA_CON },
  { mau_duong: "/tuoi-xong-dat/{nam}/tuoi-{nam_sinh}", nhom: "cong_cu_con", ten: "Tuổi xông đất · theo năm sinh", o: O_CUM, nguon_kb: null,
    bien: ["nam", "nam_sinh", "can_chi", "can_chi_nam"], chu: CHU_XONG_DAT_CON },
  // SEO-L1 / SEO-L5: trang trụ theo năm + lịch âm cả năm.
  { mau_duong: "/xem-tuoi-lam-nha/{nam}", nhom: "cong_cu_con", ten: "Tuổi làm nhà · bảng theo năm", o: O_CUM, nguon_kb: null,
    bien: ["nam", "can_chi"], chu: CHU_LAM_NHA_NAM },
  { mau_duong: "/tuoi-xong-dat/{nam}", nhom: "cong_cu_con", ten: "Tuổi xông đất · bảng theo năm", o: O_CUM, nguon_kb: null,
    bien: ["nam", "can_chi"], chu: CHU_XONG_DAT_NAM },
  { mau_duong: "/xem-sao-han/{nam}", nhom: "cong_cu_con", ten: "Sao hạn · bảng theo năm", o: O_CUM, nguon_kb: null,
    bien: ["nam", "can_chi"], chu: CHU_SAO_HAN_NAM },                                                   // MT-ĐS B3
  { mau_duong: "/nam/{nam}", nhom: "cong_cu_con", ten: "Năm · trang trụ theo năm", o: O_CUM, nguon_kb: null,
    bien: ["nam", "can_chi"], chu: CHU_NAM },                                                            // NAM-1
  { mau_duong: "/nam/{nam}/sinh-con", nhom: "cong_cu_con", ten: "Năm · sinh con hợp tuổi bố mẹ", o: O_CUM, nguon_kb: null,
    bien: ["nam", "can_chi"], chu: CHU_NAM_SINH_CON },                                                   // NAM-1
  { mau_duong: "/nam/{nam}/cuoi-hoi", nhom: "cong_cu_con", ten: "Năm · cưới hỏi (Kim lâu cô dâu)", o: O_CUM, nguon_kb: null,
    bien: ["nam", "can_chi"], chu: CHU_NAM_CUOI_HOI },                                                   // NAM-1
  { mau_duong: "/nam/{nam}/tuoi-{nam_sinh}", nhom: "cong_cu_con", ten: "Năm · Tử vi năm theo tuổi", o: O_CUM, nguon_kb: null,
    bien: ["nam", "nam_sinh", "can_chi", "can_chi_nam"], chu: CHU_NAM_TUOI },                            // NAM-3
  { mau_duong: "/lich-am/{nam}", nhom: "cong_cu_con", ten: "Lịch âm · từng năm", o: O_CUM, nguon_kb: null,
    bien: ["nam", "can_chi"], chu: CHU_LICH_AM_NAM },
  { mau_duong: "/phong-thuy/huong-xau-nam/{nam}", nhom: "cong_cu_con", ten: "Hướng xấu theo năm · từng năm", o: O_CUM, nguon_kb: null,
    bien: ["nam", "can_chi"], chu: CHU_HAN_NAM_CON },
  // Hồ sơ chuyên gia giữ trong code (E-E-A-T) — cụm chỉ cho đặt khối quanh hồ sơ.
  { mau_duong: "/tac-gia/{slug}", nhom: "cong_cu_con", ten: "Hồ sơ chuyên gia", o: ["khoi_cuoi"], nguon_kb: null, bien: ["slug"] },
];
export const MAU_CUM: readonly MauCumTrang[] = MAU_CUM_GOC.map((m) => (m.mau_duong === "/tac-gia/{slug}" ? m : { ...m, hinh: HINH_CUM }));

const BIEN_DUONG: Record<string, string> = {
  nam: "(\\d{4})", nam_sinh: "(\\d{4})", gioi: "(nam|nu)", thang: "(\\d{1,2})", ngay: "(\\d{4}-\\d{2}-\\d{2})",
};
/** Mẫu đường dẫn → biểu thức chính quy (biến {x} khớp một đoạn chữ thường/số/gạch ngang; {nam}/{nam_sinh} 4 chữ số,
 *  {gioi} nam|nu, {thang} 1–2 chữ số, {ngay} yyyy-mm-dd). Cùng luật với cms/src/lib/so-trang.ts regexMau. */
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

/** ND-6: một URL thật của cụm để xem trước khối/chữ của mẫu (biến điền giá trị ví dụ: hôm nay, năm nay; trang tuổi và
 *  hồ sơ năm sinh dùng 1990 — nằm trong khoảng có trang). */
export function viDuMau(mau: MauCumTrang, nay = new Date()): string {
  const vn = new Date(nay.getTime() + 7 * 3600_000);   // ngày theo giờ Việt Nam
  const nam = String(vn.getUTCFullYear()), thang = String(vn.getUTCMonth() + 1);
  const ngay = `${nam}-${thang.padStart(2, "0")}-${String(vn.getUTCDate()).padStart(2, "0")}`;
  const gt: Record<string, string> = {
    nam: mau.nhom === "tuoi" ? "1990" : nam, thang, ngay, nam_sinh: "1990", gioi: "nam", viec: "cuoi-hoi", slug: mau.nguon_kb?.vi_du ?? "duc-luan",
  };
  return mau.mau_duong.replace(/\{([a-z_]+)\}/g, (m, b: string) => gt[b] ?? m);
}

export const mucSoTrang = (duong: string): MucSoTrang | null => SO_TRANG.find((m) => m.duong === duong) ?? null;
