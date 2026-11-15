// EN-AI — công tắc quản trị `hoi.phan_loai_ai_en` → header `x-phan-loai-ai: 1` gửi engine cho lượt hỏi đáp BẢN ANH.
// Engine chỉ chạy lớp phân loại AI khi có CẢ header này lẫn env HOI_PHAN_LOAI_AI=1 (engine/app/narrative/phan_loai_en.py).
// Bản Việt không bao giờ gửi header. Đọc công tắc lỗi → tắt.
import { layCauHinh } from "@/lib/cau-hinh";
import { laBanAnh } from "@/lib/proxy";

export async function dauPhanLoaiAi(req: Request): Promise<Record<string, string>> {
  if (!laBanAnh(req)) return {};
  const bat = await layCauHinh<boolean>("hoi.phan_loai_ai_en").catch(() => false);
  return bat === true ? { "x-phan-loai-ai": "1" } : {};
}
