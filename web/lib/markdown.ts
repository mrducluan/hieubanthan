// AIO/GEO — bản Markdown của trang công khai cho bot AI / LLM đọc (chuẩn llmstxt.org: cùng URL + ".md").
// Chỉ định dạng lại dữ liệu KB engine đã trả — không viết thêm nghĩa. Dùng ở route handler (server).
import { CHU_DE, duongTrang, type MucLuc, type MucTuDien, type TrangKienThuc } from "@/lib/kien-thuc";
import { MO_TA_SITE, TEN_SITE, urlDayDu } from "@/lib/seo";

const nhan = (trangThai: string) => (trangThai === "da_duyet" ? "đã duyệt" : "bản nháp AI, đang được chuyên gia duyệt");

export const NGUYEN_TAC = [
  "- Mọi con số, lá số, quẻ do máy tính toán tất định (kiểm lại được từng bước); phần diễn giải ghi nguồn.",
  "- Mỗi ý nghĩa đi kèm mặt tối và câu hỏi tự soi — không phán số phận, không dự đoán sống chết, bệnh tật, xổ số.",
  "- Nội dung là tham khảo văn hoá, không thay thế tư vấn y tế, tâm lý, pháp lý, tài chính.",
  "- Trang ghi \"bản nháp\" là nháp AI chưa đối chiếu nguyên văn cổ thư.",
];

/** Một trang kiến thức. `cap` = cấp tiêu đề gốc (1 khi đứng riêng, 2 khi gộp trong llms-full.txt). */
export function mdTrang(t: TrangKienThuc, cap = 1): string {
  const h = (n: number) => "#".repeat(cap + n);
  const d = [`${h(0)} ${t.tieu_de}`, "", `> ${t.mo_ta}`, "",
    `URL: ${urlDayDu(duongTrang(t.loai, t.slug))}`, `Trạng thái: ${nhan(t.trang_thai)} · Cập nhật: ${t.cap_nhat}`, "",
    `${h(1)} Trả lời nhanh`, "", t.tra_loi_nhanh, ""];
  for (const m of t.muc) {
    d.push(`${h(1)} ${m.tieu_de}`, "");
    if (m.doan) d.push(m.doan, "");
    if (m.danh_sach) d.push(...m.danh_sach.map((x) => `- ${x}`), "");
  }
  if (t.hoi_dap.length) d.push(`${h(1)} Câu hỏi thường gặp`, "", ...t.hoi_dap.flatMap((x) => [`**${x.hoi}**`, "", x.dap, ""]));
  d.push(`${h(1)} Nguồn`, "", ...t.nguon.map((x) => `- ${x}`), "");
  if (t.lien_quan?.length) {
    d.push(`${h(1)} Liên quan`, "", ...t.lien_quan.map((x) => `- [${x.tieu_de}](${urlDayDu(duongTrang(x.loai, x.slug))}.md)`), "");
  }
  return d.join("\n");
}

export function mdChuDe(khoa: string, ds: MucLuc[]): string | null {
  const cd = CHU_DE[khoa];
  if (!cd) return null;
  const muc = ds.filter((t) => t.loai === cd.loai);
  return [`# ${cd.ten}`, "", `> ${cd.mo_ta}`, "", `URL: ${urlDayDu(`/kien-thuc/${khoa}`)}`, "",
    ...muc.map((t) => `- [${t.tieu_de}](${urlDayDu(duongTrang(t.loai, t.slug))}.md): ${t.mo_ta}${t.trang_thai === "da_duyet" ? "" : " (bản nháp)"}`),
    ""].join("\n");
}

export function mdThuVien(ds: MucLuc[]): string {
  const d = [`# Thư viện kiến thức — ${TEN_SITE}`, "", `> ${MO_TA_SITE}`, ""];
  for (const [k, cd] of Object.entries(CHU_DE)) {
    d.push(`## [${cd.ten}](${urlDayDu(`/kien-thuc/${k}`)}.md)`, "", cd.mo_ta, `(${ds.filter((t) => t.loai === cd.loai).length} trang)`, "");
  }
  return d.join("\n");
}

export function mdTuDien(muc: MucTuDien[], tenMang: Record<string, string>): string {
  const d = ["# Từ điển thuật ngữ huyền học — giải nghĩa dễ hiểu", "", `URL: ${urlDayDu("/tu-dien")}`,
    "Trạng thái: bản nháp AI, đang được chuyên gia duyệt dần", ""];
  for (const [ma, ten] of Object.entries(tenMang)) {
    const nhom = muc.filter((m) => m.mo_dun === ma);
    if (!nhom.length) continue;
    d.push(`## ${ten}`, "");
    for (const m of nhom) d.push(`- **${m.ten}**${m.han ? ` (${m.han})` : ""}: ${m.de_hieu}${m.vi_du ? ` Ví dụ: ${m.vi_du}` : ""}`);
    d.push("");
  }
  return d.join("\n");
}

export const TEN_MANG: Record<string, string> = {
  tuvi: "Tử vi", battu: "Bát tự", kinhdich: "Kinh Dịch", phongthuy: "Phong thuỷ", thanso: "Thần số học",
};

/** Header cho mọi phản hồi .md: canonical về trang HTML (tránh trùng lặp nội dung với Google). */
export function traMd(noiDung: string, duongHtml: string): Response {
  return new Response(noiDung, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      link: `<${urlDayDu(duongHtml)}>; rel="canonical"`,
      "cache-control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
