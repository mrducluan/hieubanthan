// Công tắc tính năng NỘI DUNG trên web (web đọc qua /api/globals/tinh-nang, cache 5 phút, đổi là báo web làm mới).
// Công tắc kinh tế (thưởng Sao, giá, thu Sao) KHÔNG nằm ở đây — vẫn ở /quan-tri/cai-dat (Supabase, MFA, SQL tự kẹp).
import type { GlobalConfig } from "payload";
import { ai, chiChuBien } from "../access";
import { lamMoiGlobal } from "../hooks/lamMoiWeb";

export const TinhNang: GlobalConfig = {
  slug: "tinh-nang",
  label: "Tính năng nội dung",
  admin: { group: "Hệ thống", description: "Bật/tắt các phần nội dung trên hieuban.com. Có hiệu lực trong vòng vài giây." },
  access: { read: ai, update: chiChuBien },
  hooks: { afterChange: [lamMoiGlobal] },
  fields: [
    { name: "blog_bat", label: "Hiện bài từ CMS trên /blog", type: "checkbox", defaultValue: true,
      admin: { description: "Tắt = công tắc khẩn: mọi bài CMS ẩn khỏi /blog, sitemap, llms.txt (bài đối tác vẫn hiện)." } },
    { name: "muc_luc", label: "Mục lục tự động đầu bài", type: "checkbox", defaultValue: true },
    { name: "bai_lien_quan", label: "Khối \"Đọc tiếp\" (bài liên quan) cuối bài", type: "checkbox", defaultValue: true },
    { name: "keu_goi_cong_cu", label: "Khung mời dùng công cụ cuối bài (theo mảng)", type: "checkbox", defaultValue: true },
    { name: "llms_txt", label: "Đưa bài CMS vào llms.txt", type: "checkbox", defaultValue: true },
    { name: "ban_markdown", label: "Bản Markdown cho từng bài (/blog/{slug}.md)", type: "checkbox", defaultValue: true },
  ],
};
