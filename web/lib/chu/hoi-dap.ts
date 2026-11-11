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
} as const satisfies BangChu;
