// Blog — bài thuộc MẢNG nào (thần số · Tử vi · Bát tự · Kinh Dịch · phong thuỷ · hợp đôi · xem ngày · chung) để CTA chân
// bài, thẻ bên lề và kiến thức gợi ý ĐỔI THEO chủ đề bài (bài phong thuỷ → mời xem nhà, bài thần số → mời xem số…).
// Bài CMS có trường `mang` do ban biên tập chọn → dùng luôn (trừ "chung"). Bài NotFair / bài chưa gắn mảng → luật từ khoá
// tất định trên tiêu đề (tính gấp đôi), slug, thẻ, mô tả — không AI, không mạng; không khớp → "chung".
import { CHU_DE } from "@/lib/kien-thuc";
import type { MangTrang } from "@/lib/goi-y-cheo";

export const MANG_BLOG = ["than_so", "tu_vi", "bat_tu", "kinh_dich", "phong_thuy", "hop_doi", "xem_ngay", "chung"] as const;
export type MangBlog = (typeof MANG_BLOG)[number];

const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase();

/** Từ khoá (đã bỏ dấu, chữ thường) và trọng số. Cụm dài đặt trước để "tu vi" không ăn vào "tu tru". */
const TU_KHOA: Record<Exclude<MangBlog, "chung">, [string, number][]> = {
  than_so: [["than so hoc", 3], ["than so", 3], ["numerology", 3], ["so chu dao", 3], ["duong doi", 2], ["so linh hon", 2], ["so su menh", 2],
    ["pitago", 2], ["pythagoras", 2], ["chaldea", 2], ["con so", 1], ["bieu do ngay sinh", 2], ["nam ca nhan", 2], ["no nghiep", 2]],
  tu_vi: [["tu vi dau so", 3], ["tu vi", 3], ["la so", 2], ["chinh tinh", 2], ["tu hoa", 2], ["dai han", 2], ["cung menh", 2], ["luu nien", 1],
    ["astrology", 2], ["chiem tinh", 2], ["cung hoang dao", 2], ["horoscope", 2], ["ban do sao", 1]],
  bat_tu: [["bat tu", 3], ["tu tru", 3], ["bazi", 3], ["nhat chu", 2], ["thap than", 2], ["dung than", 2], ["dai van", 1], ["can chi", 1], ["menh gi", 1]],
  kinh_dich: [["kinh dich", 3], ["i ching", 3], ["gieo que", 3], ["mai hoa", 2], ["luc hao", 2], ["64 que", 2], ["que dich", 2], ["hao dong", 2]],
  phong_thuy: [["phong thuy", 3], ["feng shui", 3], ["bat trach", 2], ["huyen khong", 2], ["phi tinh", 2], ["huong nha", 2], ["huong ban", 1],
    ["la ban", 1], ["cung phi", 2], ["ban tho", 1], ["phong ngu", 1], ["phong bep", 1], ["nha o", 1]],
  hop_doi: [["hop doi", 3], ["hop nhau", 2], ["cap doi", 2], ["tuong hop", 2], ["doi lua", 2], ["tinh yeu", 1], ["nguoi ay", 1], ["hon nhan", 1]],
  xem_ngay: [["ngay tot", 3], ["xem ngay", 3], ["hoang dao", 2], ["ngay lanh", 2], ["cuoi hoi", 1], ["khai truong", 1], ["dong tho", 1], ["xuat hanh", 1], ["lich am", 1]],
};

export function mangCuaBai(b: { mang?: string | null; tieuDe: string; slug?: string | null; the?: string[] | null; moTa?: string | null }): MangBlog {
  if (b.mang && b.mang !== "chung" && (MANG_BLOG as readonly string[]).includes(b.mang)) return b.mang as MangBlog;
  const van = ` ${boDau([b.tieuDe, b.tieuDe, (b.slug ?? "").replace(/-/g, " "), ...(b.the ?? []), b.moTa ?? ""].join(" ")).replace(/[^a-z0-9]+/g, " ")} `;
  let tot: MangBlog = "chung", diemTot = 0;
  for (const m of MANG_BLOG) {
    if (m === "chung") continue;
    let diem = 0;
    for (const [tu, w] of TU_KHOA[m]) diem += (van.split(` ${tu} `).length - 1) * w;
    if (diem > diemTot) { tot = m; diemTot = diem; }
  }
  return tot;
}

export type ThongTinMang = {
  ten: string; duong: string; /** mã mô-đun của khối CtaCuoiBai */ moDun: string; /** mã mảng engine gợi chéo */ mangGoiY: MangTrang;
  tieuDe: string; loi: string; nut: string; ngan: string; diem: [string, string, string];
  /** khoá cụm kiến thức (lib/kien-thuc CHU_DE) + link thêm → hàng "Kiến thức {mảng}" */
  cum: string[]; them: { ten: string; duong: string }[];
};

export const THONG_TIN_MANG: Record<MangBlog, ThongTinMang> = {
  than_so: {
    ten: "Thần số học", duong: "/than-so", moDun: "thanso", mangGoiY: "than_so",
    tieuDe: "Bài này nói về con số. Còn con số của bạn?",
    loi: "Nhập ngày sinh và họ tên — 30 giây có 4 con số cốt lõi: Đường đời, Sứ mệnh, Linh hồn, Nhân cách, kèm từng bước tính để tự kiểm.",
    nut: "Xem số của tôi", ngan: "4 con số cốt lõi từ ngày sinh và họ tên, có từng bước tính.",
    diem: ["4 con số cốt lõi + biểu đồ ngày sinh", "3 điểm mạnh · 3 điểm mù để tự tích đúng – sai", "Hai trường phái Pitago · Chaldea"],
    cum: ["than-so", "nghe-nghiep", "nam-ca-nhan", "no-nghiep"], them: [],
  },
  tu_vi: {
    ten: "Tử vi", duong: "/tu-vi", moDun: "tuvi", mangGoiY: "tu_vi",
    tieuDe: "Bài này nói về Tử vi. Lá số của bạn thì sao?",
    loi: "Lập lá số theo âm lịch Việt Nam: 12 cung, 14 chính tinh, đại hạn — xem bản Đêm sao hoặc Giấy cổ, hỏi đáp ngay dưới lá số.",
    nut: "Lập lá số của tôi", ngan: "Lá số 12 cung theo âm lịch Việt, đại hạn và 3 tháng tới.",
    diem: ["12 cung, độ sáng sao lối Việt", "Đại hạn · lưu niên · nhịp 3 tháng tới", "Luận giải đời sống, chương đầu miễn phí"],
    cum: ["tu-vi", "cung-tu-vi", "sao-cung", "tu-hoa"], them: [],
  },
  bat_tu: {
    ten: "Bát tự", duong: "/bat-tu", moDun: "battu", mangGoiY: "bat_tu",
    tieuDe: "Bài này nói về Bát tự. Tứ trụ của bạn thì sao?",
    loi: "Xem nhật chủ, ngũ hành thừa – thiếu, đại vận đang đi. Dụng thần trình bày cả hai cách — không chọn thay bạn.",
    nut: "Xem Bát tự của tôi", ngan: "Tứ trụ, nhật chủ, ngũ hành thừa thiếu, đại vận đang đi.",
    diem: ["Tứ trụ · nhật chủ · thập thần", "Ngũ hành thừa – thiếu theo thang điểm công bố", "Đại vận theo ngày khởi vận"],
    cum: ["nhat-chu", "thap-than", "menh-tuoi"], them: [],
  },
  kinh_dich: {
    ten: "Kinh Dịch", duong: "/kinh-dich", moDun: "kinhdich", mangGoiY: "kinh_dich",
    tieuDe: "Bài này nói về Kinh Dịch. Bạn đang có câu hỏi nào?",
    loi: "Gieo một quẻ cho đúng việc đang băn khoăn: ba đồng xu, Mai Hoa theo số hoặc theo giờ — mỗi hào có lời nói nôm na.",
    nut: "Gieo một quẻ", ngan: "Gieo quẻ cho việc đang băn khoăn, mỗi hào có lời nói nôm na.",
    diem: ["3 cách gieo, quẻ do máy gieo tất định", "Lời kinh gốc + nói nôm na từng hào", "Lịch sử quẻ lưu trên máy bạn"],
    cum: ["kinh-dich"], them: [{ ten: "Quẻ ngày hôm nay", duong: "/hom-nay" }],
  },
  phong_thuy: {
    ten: "Phong thuỷ", duong: "/phong-thuy", moDun: "phongthuy", mangGoiY: "phong_thuy",
    tieuDe: "Bài này nói về phong thuỷ. Nhà bạn thì sao?",
    loi: "Đo hướng bằng điện thoại, xem 4 hướng tốt theo tuổi, khảo sát bố cục từng phòng — hình thế trước, lý khí sau.",
    nut: "Xem nhà của tôi", ngan: "Đo hướng, 4 hướng tốt theo tuổi, khảo sát từng phòng.",
    diem: ["La bàn sống: tô 8 cung hợp tuổi bạn", "Sơ đồ nhà 3×3, việc nên xử lý trước", "Tháng này nhà bạn, theo tiết khí"],
    cum: [], them: [{ ten: "Tuổi nào hợp hướng nào", duong: "/phong-thuy/huong-hop-tuoi" }, { ten: "Hướng cần tránh năm nay", duong: "/phong-thuy/huong-xau-nam" },
      { ten: "Xem tuổi làm nhà", duong: "/xem-tuoi-lam-nha" }],
  },
  hop_doi: {
    ten: "Hợp đôi", duong: "/hop-doi", moDun: "hop_doi", mangGoiY: "hop_doi",
    tieuDe: "Bài này nói về hai người. Bạn và người ấy thì sao?",
    loi: "Nhập ngày sinh hai người: cặp số chủ đạo, nhịp năm của mỗi bên — không chấm điểm hợp – khắc, chỉ nói rõ chỗ dễ hiểu nhau và chỗ cần nói chuyện.",
    nut: "Xem hợp đôi", ngan: "Cặp số chủ đạo hai người, chỗ dễ hiểu nhau và chỗ cần nói chuyện.",
    diem: ["Theo quan hệ: người yêu · bạn · đồng nghiệp · gia đình", "Không chấm điểm, không phán hợp – khắc", "Gửi link để người ấy tự nhập"],
    cum: ["hop-so", "tinh-yeu"], them: [],
  },
  xem_ngay: {
    ten: "Xem ngày tốt", duong: "/xem-ngay-tot", moDun: "xem_ngay", mangGoiY: "xem_ngay",
    tieuDe: "Bài này nói về chọn ngày. Việc của bạn thì ngày nào?",
    loi: "Xem ngày tốt theo hoàng lịch cho cưới hỏi, khai trương, về nhà mới, động thổ — giờ hoàng đạo và tuổi hợp ngay trong trang.",
    nut: "Xem ngày tốt", ngan: "Ngày tốt theo việc, giờ hoàng đạo, tuổi hợp ngay trong trang.",
    diem: ["6 việc hay cần chọn ngày", "Giờ hoàng đạo từng ngày", "Đối chiếu tuổi của bạn"],
    cum: [], them: [{ ten: "Lịch âm năm nay", duong: `/lich-am/${new Date().getFullYear()}` }, { ten: "Tuổi xông đất", duong: "/tuoi-xong-dat" }],
  },
  chung: {
    ten: "Hiểu bản thân", duong: "/than-so", moDun: "thanso", mangGoiY: "than_so",
    tieuDe: "Đọc xong bài này, thử nhìn lại chính mình.",
    loi: "Bắt đầu từ con số của bạn: ngày sinh + họ tên → 4 con số cốt lõi, 3 điểm mạnh, 3 điểm mù để tự tích đúng – sai. Miễn phí, 30 giây.",
    nut: "Bạn là số mấy?", ngan: "4 con số cốt lõi, 3 điểm mạnh, 3 điểm mù — tự tích đúng sai.",
    diem: ["Tính tất định, có từng bước để tự kiểm", "Hồ sơ lưu trên máy bạn, không cần tài khoản", "Mỗi ngày một câu tự soi ở Hôm nay"],
    cum: ["than-so"], them: [{ ten: "Hôm nay của bạn", duong: "/hom-nay" }],
  },
};

/** Hàng link "Kiến thức {mảng}" (≤ 4), lấy đường dẫn cụm từ một nguồn QH-URL (lib/kien-thuc). */
export function lienKetKienThuc(m: MangBlog): { ten: string; duong: string }[] {
  const tt = THONG_TIN_MANG[m];
  const cum = tt.cum.map((k) => CHU_DE[k]).filter(Boolean).map((c) => ({ ten: c!.ten, duong: c!.duong }));
  return [...cum, ...tt.them].slice(0, 4);
}
