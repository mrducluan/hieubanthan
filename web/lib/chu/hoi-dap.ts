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
} as const satisfies BangChu;
