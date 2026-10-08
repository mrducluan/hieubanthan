// /llms.txt (chuẩn llmstxt.org) — bản đồ site cho mô hình ngôn ngữ: tóm tắt, nguyên tắc trích dẫn, công cụ, đơn vị
// vận hành, và liên kết tới BẢN MARKDOWN (.md) của từng trang kiến thức. Dùng chung cho /llms.txt và /index.md.
import { CHU_DE, duongTrang, mucLuc } from "@/lib/kien-thuc";
import { NGUYEN_TAC } from "@/lib/markdown";
import { MO_TA_SITE, TEN_SITE, urlDayDu } from "@/lib/seo";
import { vanHanh } from "@/lib/van-hanh";

export async function taoLlmsTxt(): Promise<string> {
  const ds = await mucLuc();
  const vh = vanHanh();
  const dong: string[] = [
    `# ${TEN_SITE}`,
    "",
    `> ${MO_TA_SITE}`,
    "",
    `Website tiếng Việt (${urlDayDu("/")}), vận hành bởi ${vh.chuSoHuu}${vh.email ? ` — liên hệ ${vh.email}` : ""}.`,
    "Mỗi trang kiến thức có bản Markdown: thêm \".md\" vào cuối URL.",
    "",
    "Nguyên tắc nội dung (khi trích dẫn xin giữ đúng):",
    ...NGUYEN_TAC,
    "",
    "## Công cụ",
    `- [Thần số học của bạn](${urlDayDu("/")}): nhập họ tên + ngày sinh (dương hoặc âm lịch) → 4 con số cốt lõi, cách tính từng bước.`,
    `- [Hợp đôi](${urlDayDu("/hop-doi")}): so hai người theo thần số, theo loại quan hệ — điểm hoà, điểm va; không chấm điểm hợp/khắc.`,
    `- [Tử vi](${urlDayDu("/tu-vi")}): lá số 12 cung theo giờ, ngày, nơi sinh (âm lịch Việt Nam, múi giờ lịch sử trước 1975), đại hạn, lưu niên, lưu nguyệt theo phái.`,
    `- [Bát tự](${urlDayDu("/bat-tu")}): tứ trụ, ngũ hành, thập thần, cách cục, đại vận.`,
    `- [Kinh Dịch](${urlDayDu("/kinh-dich")}): gieo quẻ, 64 quẻ, 384 hào.`,
    `- [Phong thuỷ](${urlDayDu("/phong-thuy")}): mệnh quái Bát trạch, Huyền Không phi tinh, khảo sát bố cục nhà, đo hướng bằng la bàn điện thoại.`,
    "",
    "## Tham khảo",
    `- [Thư viện kiến thức](${urlDayDu("/kien-thuc.md")})`,
    `- [Từ điển thuật ngữ](${urlDayDu("/tu-dien.md")})`,
    `- [Hướng hợp tuổi 1930–2029, nam và nữ (200 trang)](${urlDayDu("/phong-thuy/huong-hop-tuoi.md")})`,
    `- [Lá số minh hoạ đọc từng bước](${urlDayDu("/la-so-mau")})`,
    `- [Giới thiệu & phương pháp, nguồn](${urlDayDu("/gioi-thieu")})`,
    `- [Toàn văn thư viện (một tệp)](${urlDayDu("/llms-full.txt")})`,
    "",
  ];
  for (const [k, cd] of Object.entries(CHU_DE)) {
    dong.push(`## ${cd.ten}`, "", cd.mo_ta, "");
    for (const t of ds.filter((x) => x.loai === cd.loai)) {
      dong.push(`- [${t.tieu_de}](${urlDayDu(duongTrang(t.loai, t.slug))}.md): ${t.mo_ta}${t.trang_thai === "da_duyet" ? "" : " (bản nháp)"}`);
    }
    dong.push(`- [Tất cả](${urlDayDu(`/kien-thuc/${k}`)}.md)`, "");
  }
  dong.push("## Optional", "",
    `- [Chính sách quyền riêng tư](${urlDayDu("/chinh-sach-rieng-tu")})`,
    `- [Điều khoản sử dụng](${urlDayDu("/dieu-khoan")})`,
    `- [Miễn trừ trách nhiệm](${urlDayDu("/mien-tru-trach-nhiem")})`,
    `- [Liên hệ](${urlDayDu("/lien-he")})`, "");
  return dong.join("\n");
}
