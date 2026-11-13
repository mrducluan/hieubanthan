// EN-ALL GĐ 1 việc 3 — chữ cố định của KHUNG HỎI ĐÁP dùng chung (KhungChat, CauTraLoi, ThuatNgu). `mac_dinh` = chữ Việt cũ
// từng ký tự; `en` viết từ nghĩa. Lời trả lời do engine dựng (bản Anh: engine trả tiếng Anh theo header ngôn ngữ).
import type { BangChu } from "@/lib/chu-trang";

const K = "Khung hỏi đáp";

export const CHU_HOI_DAP = {
  "nhan_o": { nhom: K, nhan: "Nhãn ô hỏi (trình đọc màn hình)", mac_dinh: "Câu hỏi của bạn", en: "Your question" },
  "ban_hoi": { nhom: K, nhan: "Nhãn trên câu người dùng hỏi", mac_dinh: "Bạn hỏi", en: "You asked" },
  "dang_soi": { nhom: K, nhan: "Khung chờ câu trả lời", mac_dinh: "Đang soi câu hỏi…", en: "Looking into your question…" },
  "cau_da_hoi": { nhom: K, nhan: "Dải các câu đã hỏi", mac_dinh: "Các câu đã hỏi", en: "Questions you asked" },
  "goi_y": { nhom: K, nhan: "Nhãn dải câu gợi ý (trình đọc màn hình)", mac_dinh: "Câu hỏi gợi ý", en: "Suggested questions" },
  "gui": { nhom: K, nhan: "Nút gửi (trình đọc màn hình)", mac_dinh: "Gửi câu hỏi", en: "Send question" },
  "chu_xanh": { nhom: K, nhan: "Ghi chú chữ gạch xanh", mac_dinh: "Chữ gạch xanh: bấm để xem trên hình.", en: "Underlined in green: tap to see it on the picture." },
  "hoi_tiep": { nhom: K, nhan: "Nhãn câu hỏi tiếp", mac_dinh: "Hỏi tiếp", en: "Ask next" },
  "vi_du": { nhom: K, nhan: "Nhãn ví dụ (giải nghĩa thuật ngữ)", mac_dinh: "Ví dụ:", en: "Example:" },
  "xem_tu_dien": { nhom: K, nhan: "Link Từ điển (thẻ thuật ngữ)", mac_dinh: "Xem trong Từ điển", en: "See the glossary" },
  "tu_dien": { nhom: K, nhan: "Link Từ điển (khung giải nghĩa)", mac_dinh: "Từ điển", en: "Glossary" },
  "giai_nghia": { nhom: K, nhan: "Tiêu đề khung giải nghĩa", mac_dinh: "Giải nghĩa thuật ngữ ({so})", en: "Terms explained ({so})" },
  "bam_mo": { nhom: K, nhan: "Gợi ý bấm mở", mac_dinh: "· bấm để mở", en: "· tap to open" },
  "xem_tren_hinh": { nhom: K, nhan: "Nhãn chữ trỏ về hình (trình đọc màn hình)", mac_dinh: "{chu} — xem trên hình", en: "{chu} — see it on the picture" },
  // EN-ALL GĐ 3d — chữ do lib/hoi-mang.ts ghép (ghi chú nguồn, lỗi, dòng lượt hỏi miễn phí).
  "ghi_chu_llm": { nhom: K, nhan: "Ghi chú dưới câu trả lời (AI diễn đạt)", mac_dinh: "Diễn đạt tự động từ kho tri thức có nguồn.", en: "Phrased automatically from a sourced knowledge base." },
  "ghi_chu_ghep": { nhom: K, nhan: "Ghi chú dưới câu trả lời (ghép mẫu)", mac_dinh: "Ghép từ kho tri thức có nguồn.", en: "Built from a sourced knowledge base." },
  "loi_tra_loi": { nhom: K, nhan: "Lỗi khi chưa trả lời được", mac_dinh: "Chưa trả lời được lúc này, thử lại sau.", en: "Could not answer right now — please try again later." },
  "luot_cuoi": { nhom: K, nhan: "Câu miễn phí cuối của ngày", mac_dinh: "Đây là câu miễn phí cuối của hôm nay.", en: "This is your last free question today." },
  "luot_cuoi_sao": { nhom: K, nhan: "Vế câu sau dùng Sao", mac_dinh: " Câu tiếp theo dùng Sao.", en: " Come back tomorrow for more." },
  "luot_cuoi_dang_nhap": { nhom: K, nhan: "Vế đăng nhập để hỏi thêm", mac_dinh: " Đăng nhập để hỏi thêm.", en: " Come back tomorrow for more." },
  "luot_con": { nhom: K, nhan: "Còn N câu miễn phí ({so})", mac_dinh: "Còn {so} câu miễn phí hôm nay.", en: "{so} free questions left today." },
  // EN-ALL GĐ 3c — lưới an toàn bản Anh: bộ dò khủng hoảng dựa trên luật không bắt hết mọi cách viết tiếng Anh tự do
  // (bộ câu độc lập thứ tư: 26/30) → dòng cố định dưới MỌI câu trả lời bản Anh. Bản Việt không hiện (mac_dinh rỗng).
  "luoi_an_toan": { nhom: K, nhan: "Bản Anh: dòng hỗ trợ cố định dưới câu trả lời", mac_dinh: "",
    en: "Going through something hard? You don't have to face it alone — call or text 988 (US), 116 123 (UK & Ireland), 1767 (Singapore), or find a line at findahelpline.com. In an emergency, call your local emergency number now." },
  // EN-AI — bản Anh: câu hỏi máy chưa hiểu chắc (engine trả `hoi_lai`) → "Did you mean…" đứng trước, lời đáp chung gập lại
  // (không đoán thay người hỏi). Bản Việt không đổi (mac_dinh rỗng — bản Việt vẫn hiện lời đáp như cũ).
  "tra_loi_chung": { nhom: K, nhan: "Bản Anh: nút mở lời đáp chung khi máy hỏi lại", mac_dinh: "", en: "Or read a general answer for now" },
  // EN-ALL GĐ 4 — chữ cố định của khối hình (components/hoi/TrucQuan.tsx) dùng ở hỏi đáp Tử vi.
  "tq.tu": { nhom: K, nhan: "Khối nhịp — dòng nguồn ({phu})", mac_dinh: "từ {phu}", en: "from {phu}" },
  "tq.tu_hoa": { nhom: K, nhan: "Bàn 12 cung — tự hoá ({ds})", mac_dinh: "↻ tự hoá {ds}", en: "↻ self-transforms {ds}" },
  "tq.tam_hop": { nhom: K, nhan: "Bàn 12 cung — chú thích tam hợp", mac_dinh: "tam hợp", en: "triad" },
  "tq.doi_dien": { nhom: K, nhan: "Bàn 12 cung — chú thích đối diện", mac_dinh: "đối diện", en: "opposite" },
  "tq.xem_tren": { nhom: K, nhan: "Bàn 12 cung — nút xem trên lá số", mac_dinh: "Xem trên lá số", en: "See it on the chart" },
  "tq.aria_cung": { nhom: K, nhan: "Bàn 12 cung — tên ô ({cung}, {sao})", mac_dinh: "Cung {cung}{sao}", en: "{cung}{sao}" },
  "tq.doc_ky": { nhom: K, nhan: "Khối hình minh hoạ — link đọc kỹ ({nhan})", mac_dinh: "Đọc kỹ: {nhan} →", en: "Read more: {nhan} →" },
} as const satisfies BangChu;
