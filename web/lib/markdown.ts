// AIO/GEO — bản Markdown của trang công khai cho bot AI / LLM đọc (chuẩn llmstxt.org: cùng URL + ".md").
// Chỉ định dạng lại dữ liệu KB engine đã trả — không viết thêm nghĩa. Dùng ở route handler (server).
import { CHU_DE, duongTrang, duongTuoi, type MucLuc, type MucTuDien, type MucTuoiHuong, type TrangKienThuc, type TuoiHuong } from "@/lib/kien-thuc";
import { CHUYEN_GIA, duongChuyenGia } from "@/lib/chuyen-gia";
import { MO_TA_SITE, TEN_SITE, urlDayDu } from "@/lib/seo";
import { duongMoi } from "@/lib/duong-silo";
import { HOI_HH, MANG_HH, SO_CACH_HH } from "@/lib/huyen-hoc";


/** EEAT-1: dòng tác giả / chủ biên / thẩm định cho bản .md (cùng dữ liệu engine như trang HTML). */
function dongTacGia(t: TrangKienThuc): string {
  const ten = (s: string) => (CHUYEN_GIA[s] ? `[${CHUYEN_GIA[s].ten}](${urlDayDu(duongChuyenGia(s))})` : s);
  if (t.tac_gia) return `Tác giả: ${ten(t.tac_gia)}`;
  if (t.tham_dinh) return `Biên soạn & thẩm định: ${ten(t.tham_dinh.nguoi)} (${t.tham_dinh.ngay}) · Chủ biên: ${ten(t.chu_bien)}`;
  if (t.duyet_xuat_ban) return `Ban biên tập ${TEN_SITE} biên soạn · Chủ biên ${ten(t.duyet_xuat_ban.nguoi)} duyệt xuất bản`;
  return `Ban biên tập ${TEN_SITE} · Chủ biên: ${ten(t.chu_bien)}`;
}

export const NGUYEN_TAC = [
  "- Mọi con số, lá số, quẻ do máy tính toán tất định (kiểm lại được từng bước); phần diễn giải ghi nguồn.",
  "- Mỗi ý nghĩa đi kèm mặt tối và câu hỏi tự soi — không phán số phận, không dự đoán sống chết, bệnh tật, xổ số.",
  "- Nội dung là tham khảo văn hoá, không thay thế tư vấn y tế, tâm lý, pháp lý, tài chính.",
  "- Mọi trang do Ban biên tập Hiểu Bản Thân biên soạn, chủ biên Đức Luân chịu trách nhiệm; trang chuyên gia đã thẩm định ghi tên người thẩm định và ngày.",
];

/** Một trang kiến thức. `cap` = cấp tiêu đề gốc (1 khi đứng riêng; 2 khi gộp vào tệp khác). */
export function mdTrang(t: TrangKienThuc, cap = 1): string {
  const h = (n: number) => "#".repeat(cap + n);
  const d = [`${h(0)} ${t.tieu_de}`, "", `> ${t.mo_ta}`, "",
    `URL: ${urlDayDu(duongTrang(t.loai, t.slug))}`, dongTacGia(t), `${t.ngay_dang ? `Đăng: ${t.ngay_dang} · ` : ""}Cập nhật: ${t.cap_nhat}`, "",
    `${h(1)} Trả lời nhanh`, "", t.tra_loi_nhanh, "",
    ...(t.goc_nhin ? [`${h(1)} Góc nhìn chuyên gia`, "", `> ${t.goc_nhin.noi_dung}`, "",
      `— ${CHUYEN_GIA[t.goc_nhin.nguoi]?.ten ?? t.goc_nhin.nguoi}, ${t.goc_nhin.ngay}`, ""] : [])];
  for (const m of t.muc) {
    d.push(`${h(1)} ${m.tieu_de}`, "");
    if (m.bien_tap) d.push("_Ban biên tập bổ sung_", "");
    if (m.doan) d.push(m.doan, "");
    if (m.danh_sach) d.push(...m.danh_sach.map((x) => `- ${x}`), "");
    // SEO-M: bảng thật + trích dẫn sách (cùng nội dung bản HTML).
    if (m.bang) {
      const o = (x: string) => x.replace(/\|/g, "\\|");
      d.push(`| ${m.bang.cot.map(o).join(" | ")} |`, `|${m.bang.cot.map(() => " --- ").join("|")}|`,
        ...m.bang.dong.map((r) => `| ${r.map(o).join(" | ")} |`), "");
    }
    for (const x of m.trich_dan ?? []) {
      if (x.nguyen_van) d.push(`> ${x.nguyen_van}`, ...(x.phien_am ? [`> _${x.phien_am}_`] : []), ">");
      if (x.nghia) d.push(`> ${x.nghia}`);
      d.push(`> — ${x.sach}${x.chuong ? `, ${x.chuong}` : ""}`, "");
    }
    if (m.xem_them?.length) d.push(...m.xem_them.map((x) => `- Xem: [${x.tieu_de}](${urlDayDu(duongTrang(x.loai, x.slug))}.md)`), "");
  }
  for (const n of [t.trang_con, t.trang_con_hoa]) {
    if (n?.ds.length) d.push(`${h(1)} ${n.tieu_de}`, "", ...n.ds.map((x) => `- [${x.tieu_de}](${urlDayDu(duongTrang(x.loai, x.slug))}.md)`), "");
  }
  if (t.hoi_dap.length) d.push(`${h(1)} Câu hỏi thường gặp`, "", ...t.hoi_dap.flatMap((x) => [`**${x.hoi}**${x.bien_tap ? " _(ban biên tập bổ sung)_" : ""}`, "", x.dap, ""]));
  d.push(`${h(1)} Nguồn`, "", ...t.nguon.map((x) => `- ${x}`), "");
  if (t.lien_quan?.length || t.lien_ket_ngoai?.length) {
    d.push(`${h(1)} Liên quan`, "", ...(t.lien_quan ?? []).map((x) => `- [${x.tieu_de}](${urlDayDu(duongTrang(x.loai, x.slug))}.md)`),
      ...(t.lien_ket_ngoai ?? []).map((x) => `- [${x.ten}](${urlDayDu(duongMoi(x.duong))})`), "");
  }
  return d.join("\n");
}

export function mdChuDe(khoa: string, ds: MucLuc[]): string | null {
  const cd = CHU_DE[khoa];
  if (!cd) return null;
  const muc = ds.filter((t) => t.loai === cd.loai);
  return [`# ${cd.ten}`, "", `> ${cd.mo_ta}`, "", `URL: ${urlDayDu(cd.duong)}`, "",
    ...muc.map((t) => `- [${t.tieu_de}](${urlDayDu(duongTrang(t.loai, t.slug))}.md): ${t.mo_ta}${t.trang_thai === "da_duyet" ? " (đã thẩm định)" : ""}`),
    ""].join("\n");
}

export function mdThuVien(ds: MucLuc[]): string {
  const d = [`# Thư viện kiến thức — ${TEN_SITE}`, "", `> ${MO_TA_SITE}`, ""];
  for (const [k, cd] of Object.entries(CHU_DE)) {
    d.push(`## [${cd.ten}](${urlDayDu(cd.duong)}.md)`, "", cd.mo_ta, `(${ds.filter((t) => t.loai === cd.loai).length} trang)`, "");
  }
  return d.join("\n");
}

export function mdTuDien(muc: MucTuDien[], tenMang: Record<string, string>): string {
  const d = ["# Từ điển thuật ngữ huyền học — giải nghĩa dễ hiểu", "", `URL: ${urlDayDu("/tu-dien")}`,
    `Biên soạn: Ban biên tập ${TEN_SITE} từ cổ thư và tài liệu tham khảo`, ""];
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

// SEO-F → SEO-K — trang tuổi hợp hướng (nam + nữ một trang)
export function mdTuoi(t: TuoiHuong): string {
  const d = [`# ${t.tieu_de}`, "", `> ${t.mo_ta}`, "", `URL: ${urlDayDu(duongTuoi(t.slug))}`,
    `Năm ${t.can_chi} · nạp âm ${t.nap_am.ten} · ${t.gioi.map((g) => `${g.gioi_tinh === "nam" ? "nam" : "nữ"} mệnh quái ${g.menh_quai.quai} (${g.menh_quai.nhom})`).join(" · ")}`, "",
    "## Trả lời nhanh", "", t.tra_loi_nhanh, "",
    ...(t.huong_chung.length ? [`Hướng tốt chung của nam và nữ cùng năm: ${t.huong_chung.join(", ")}.`, ""] : [])];
  for (const g of t.gioi) {
    const ten = g.gioi_tinh === "nam" ? "Nam" : "Nữ";
    d.push(`## ${ten} sinh năm ${t.nam}: mệnh ${g.menh_quai.quai}`, "", g.tra_loi_nhanh, "", "### 4 hướng tốt (từ tốt nhất)", "",
      ...g.huong_tot.map((h) => `- **${h.huong}** — ${h.du_nien}: ${h.y_nghia}`), "", "### 4 hướng nên tránh", "",
      ...g.huong_xau.map((h) => `- **${h.huong}** — ${h.du_nien}: ${h.y_nghia}`), "", "### Cửa, bếp, giường, bàn làm việc", "",
      ...g.goi_y.map((x) => `- ${x.tieu_de}: ${x.huong.join(" → ")}. ${x.noi_dung}`), "");
  }
  d.push("## Mốc đầu năm", "",
    `- Lập xuân: ${t.moc_dau_nam.lap_xuan}; Tết (lịch Việt): ${t.moc_dau_nam.tet_viet}; Tết (lịch Trung Quốc): ${t.moc_dau_nam.tet_trung}.`,
    `- Sinh trước mốc: tính năm ${t.sinh_truoc_moc.nam_tinh} (${t.gioi.map((g) => `${g.gioi_tinh === "nam" ? "nam" : "nữ"} ${g.sinh_truoc_moc.quai}`).join(", ")}).`, "",
    "## Câu hỏi thường gặp", "", ...t.hoi_dap.flatMap((h) => [`**${h.hoi}**`, "", h.dap, ""]),
    `Nguồn: ${t.nguon}.`, "");
  return d.join("\n");
}

export function mdDsTuoi(ds: MucTuoiHuong[]): string {
  return ["# Hướng hợp tuổi (1960–2005, nam và nữ)", "", `URL: ${urlDayDu("/phong-thuy/huong-hop-tuoi")}`, "",
    ...ds.map((t) => `- [${t.tieu_de}](${urlDayDu(duongTuoi(t.slug))}.md): nam ${t.quai_nam} (${t.nhom_nam}), nữ ${t.quai_nu} (${t.nhom_nu})`), ""].join("\n");
}

// HH-1 — hub /huyen-hoc: cùng chữ + cùng thứ tự với trang HTML (lib/huyen-hoc.ts + bảng chữ CHU_HUYEN_HOC qua `c`).
type ChuHH = (k: string, bien?: Record<string, string>) => string;
export function mdHuyenHoc(o: { c: ChuHH; h1: string; loiDan: string; nam: number; lich: string[]; soDap: number;
  cum: Record<string, { duong: string; ten: string; n: number; md: boolean }[]> }): string {
  const { c } = o, l = (d: string) => urlDayDu(d);
  const d = [`# ${o.h1}`, "", `> ${o.loiDan}`, "", `URL: ${l("/huyen-hoc")}`, `Biên soạn: Ban biên tập ${TEN_SITE} · Chủ biên Đức Luân`, "",
    `## ${c("hoi.lon")}`, "",
    ...HOI_HH.map((href, i) => `- ${c(`hoi.cau_${i + 1}`)} → [${c(`hoi.den_${i + 1}`)}](${l(href)})`), "",
    `## ${c("mang.lon")}`, ""];
  for (const m of MANG_HH) {
    d.push(`### [${c(`the.${m.khoa}_ten`)}](${l(m.href)})`, "", `*${c(`the.${m.khoa}_hoi`)}*`, "", c(`the.${m.khoa}_mo`), "",
      ...[1, 2, 3].map((i) => `- ${c(`the.${m.khoa}_nhan_${i}`)}`), `- Cần: ${c(`the.${m.khoa}_can`)}`, "");
    const cum = o.cum[m.khoa] ?? [];
    if (cum.length) d.push(`${c("the.kien_thuc")}: ${cum.map((x) => `[${x.ten}](${l(x.duong)}${x.md ? ".md" : ""})${x.n ? ` (${x.n} trang)` : ""}`).join(" · ")}`, "");
  }
  d.push(`## ${c("lich.lon")}`, "", ...o.lich.map((href, i) => `- [${c(`lich.ten_${i + 1}`, { nam: String(o.nam) })}](${l(href)}): ${c(`lich.mo_${i + 1}`)}`), "",
    `## ${c("so_sanh.lon")}`, "", `| ${[1, 2, 3, 4].map((i) => c(`so_sanh.cot_${i}`)).join(" | ")} |`, "| --- | --- | --- | --- |",
    ...MANG_HH.map((m) => `| ${c(`the.${m.khoa}_ten`)} | ${c(`so_sanh.dua_${m.khoa}`)} | ${c(`so_sanh.tra_${m.khoa}`)} | ${c(`so_sanh.goc_${m.khoa}`)} |`), "",
    c("so_sanh.ket"), "", `## ${c("cach.lon")}`, "",
    ...Array.from({ length: SO_CACH_HH }, (_, i) => `- **${c(`cach.ten_${i + 1}`)}**: ${c(`cach.mo_${i + 1}`)}`), "",
    `## ${c("hoi_dap.lon")}`, "",
    ...Array.from({ length: o.soDap }, (_, i) => [`### ${c(`hoi_dap.hoi_${i + 1}`)}`, "", c(`hoi_dap.dap_${i + 1}`), ""]).flat(),
    "## Nguyên tắc nội dung", "", ...NGUYEN_TAC, "");
  return d.join("\n");
}
