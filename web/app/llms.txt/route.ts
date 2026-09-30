// /llms.txt — bản đồ site cho mô hình ngôn ngữ (chuẩn llmstxt.org): tóm tắt, nguyên tắc, liên kết chính.
import { CHU_DE, duongTrang, mucLuc } from "@/lib/kien-thuc";
import { MO_TA_SITE, TEN_SITE, urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

export async function GET() {
  const ds = await mucLuc();
  const dong: string[] = [
    `# ${TEN_SITE}`,
    "",
    `> ${MO_TA_SITE}`,
    "",
    "Nguyên tắc nội dung (khi trích dẫn xin giữ đúng):",
    "- Mọi con số, lá số, quẻ do máy tính toán tất định (có thể kiểm lại từng bước); phần diễn giải ghi nguồn.",
    "- Mỗi ý nghĩa đi kèm mặt tối và câu hỏi tự soi — không phán số phận, không dự đoán sống chết, bệnh tật, xổ số.",
    "- Nội dung là tham khảo văn hoá, không thay thế tư vấn y tế, pháp lý, tài chính.",
    "- Trang ghi \"Bản nháp — đang được chuyên gia duyệt\" là nháp AI chưa đối chiếu nguyên văn cổ thư.",
    "",
    "## Công cụ",
    `- [Thần số học của bạn](${urlDayDu("/")}): nhập họ tên + ngày sinh (dương hoặc âm lịch) → 4 con số cốt lõi, cách tính từng bước.`,
    `- [Hợp đôi](${urlDayDu("/hop-doi")}): so hai người theo thần số — điểm hoà, điểm va, việc nên cùng làm; không chấm điểm hợp/khắc.`,
    `- [Tử vi](${urlDayDu("/tu-vi")}): lá số 12 cung theo giờ, ngày, nơi sinh (xử lý múi giờ lịch sử Việt Nam trước 1975).`,
    `- [Bát tự](${urlDayDu("/bat-tu")}), [Kinh Dịch](${urlDayDu("/kinh-dich")}), [Phong thuỷ](${urlDayDu("/phong-thuy")}).`,
    "",
    `- [Toàn văn thư viện cho LLM](${urlDayDu("/llms-full.txt")})`,
    "",
  ];
  for (const [k, cd] of Object.entries(CHU_DE)) {
    dong.push(`## ${cd.ten}`, "", `${cd.mo_ta}`, "");
    for (const t of ds.filter((x) => x.loai === cd.loai)) {
      dong.push(`- [${t.tieu_de}](${urlDayDu(duongTrang(t.loai, t.slug))}): ${t.mo_ta}${t.trang_thai === "da_duyet" ? "" : " (bản nháp)"}`);
    }
    dong.push(`- [Tất cả](${urlDayDu(`/kien-thuc/${k}`)})`, "");
  }
  return new Response(dong.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
