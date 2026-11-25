// /pricing.md & /goi-xem.md — Bảng giá & chính sách Sao dạng Markdown động cho AI / LLM Agent.
// Đọc đúng nguồn dữ liệu thật của máy chủ (GOI_XEM, dsGoiSao, dangThuSao, giaLuanGiaiSao, layCauHinh) để không bao giờ lệch giá.
import { layCauHinh } from "@/lib/cau-hinh";
import { GOI_XEM, baCachTra } from "@/lib/goi-xem";
import { dangThuSao, giaLuanGiaiSao } from "@/lib/luan-giai-sao";
import { TEN_SITE, urlDayDu } from "@/lib/seo";
import { congDangBat, dsGoiSao } from "@/lib/thanh-toan/cong";
import { uuDaiCho } from "@/lib/uu-dai-may-chu";

const vnd = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;

export async function taoPricingMd(): Promise<string> {
  const so = <T,>(k: string, md: T) => layCauHinh<T>(k).catch(() => md);
  const [goi, giaChung, mienPhi, giaCau, hvBat, hvGia, hvSao, hvCau, ...theoGoi] = await Promise.all([
    dsGoiSao(),
    giaLuanGiaiSao().catch(() => 99),
    so<number>("luan_giai.chuong_mien_phi", 1),
    so<number>("sao.hoi.gia", 5),
    so<boolean>("sao.hoi_vien.bat", false),
    so<number>("sao.hoi_vien.gia_vnd", 399000),
    so<number>("sao.hoi_vien.sao_thang", 15),
    so<number>("sao.hoi_vien.cau_hoi_nam", 1),
    ...GOI_XEM.map(async (g) =>
      g.maGia
        ? { thu: await dangThuSao(g.maGia).catch(() => false), gia: await giaLuanGiaiSao(g.maGia).catch(() => 99) }
        : { thu: false, gia: 0 },
    ),
  ]);
  const cong = congDangBat();
  const uuDaiChung = theoGoi.some((x) => x.thu) ? await uuDaiCho(giaChung) : null;
  const dangThu = theoGoi.some((x) => x.thu);
  const hoiVienMo = Boolean(hvBat) && cong !== null;
  const { le, dich } = baCachTra(goi, giaChung);

  const lines: string[] = [
    `# Bảng giá & Gói xem luận giải — ${TEN_SITE}`,
    "",
    `> Trang nguồn: ${urlDayDu("/goi-xem")} · Chính sách Sao & hoàn tiền: ${urlDayDu("/dieu-khoan#sao")}`,
    "",
    "## Nguyên tắc miễn phí",
    "",
    `- Toàn bộ công cụ lập lá số, tra cứu thần số học, gieo quẻ Kinh Dịch, đo hướng nhà, xem chỉ tay, lịch âm dương, thư viện kiến thức và ${mienPhi > 0 ? `${mienPhi} chương đầu của mọi luận giải` : "phần tổng quan"} đều **miễn phí**, không cần tài khoản.`,
    dangThu
      ? `- Các chương chuyên sâu của Luận giải toàn bộ mở bằng **Sao** (mức chuẩn: ${uuDaiChung ? `${uuDaiChung.gia} Sao trong đợt ưu đãi, giá thường ${giaChung} Sao` : `${giaChung} Sao`}).`
      : "- **Hiện tại mọi bài luận giải toàn bộ đang mở miễn phí** trong giai đoạn hiện hành — người dùng chưa cần nạp Sao.",
    "- Thanh toán một lần qua VietQR chuyển khoản ngân hàng; **không lưu thẻ, không tự động gia hạn**.",
    "- Sao đã mua **không hết hạn**. Nạp nhầm và chưa sử dụng Sao có thể yêu cầu hoàn tiền trong 7 ngày.",
    "",
    "## Danh mục các gói xem theo nhu cầu",
    "",
    "| Gói xem | Mảng | Trạng thái / Mức Sao | Đường dẫn |",
    "| --- | --- | --- | --- |",
    ...GOI_XEM.map((g, i) => {
      const p = theoGoi[i] ?? { thu: false, gia: 0 };
      const giaText = p.thu ? `${p.gia} Sao (${g.chuong ? `${g.chuong} chương` : "trọn bộ"})` : g.maGia ? "Đang miễn phí" : "Miễn phí";
      return `| ${g.ten} | ${g.mang} | ${giaText} | ${urlDayDu(g.duong)} |`;
    }),
    "",
  ];

  if (dangThu && cong && le) {
    lines.push("## Các gói nạp Sao & Hội viên", "");
    for (const x of goi) {
      lines.push(`- **${x.ten}**: ${vnd(x.gia_vnd)} → ${x.sao} Sao${x.nhan ? ` (${x.nhan})` : ""}`);
    }
    if (dich) {
      lines.push(`- Gói nhiều lần khuyến nghị: **${dich.goi.ten}** (${vnd(dich.goi.gia_vnd)} / ${dich.goi.sao} Sao).`);
    }
    if (hoiVienMo) {
      lines.push(`- **Hội viên năm**: ${vnd(hvGia)} / 365 ngày — mở mọi luận giải, tặng ${hvSao} Sao/tháng${hvCau > 0 ? `, kèm ${hvCau} câu hỏi chuyên gia` : ""} (${urlDayDu("/hoi-vien")}).`);
    }
    lines.push(`- Câu hỏi chuyên sâu thêm khi hết lượt miễn phí: ${giaCau} Sao / câu.`, "");
  }

  lines.push(
    "## Liên kết nhanh",
    "",
    `- Trang bảng giá trực quan: ${urlDayDu("/goi-xem")}`,
    `- Trang nạp Sao: ${urlDayDu("/nap-sao")}`,
    `- Hội viên năm: ${urlDayDu("/hoi-vien")}`,
    `- Bản đồ Đội ngũ (B2B): ${urlDayDu("/quan-ly-nhan-su")}`,
    "",
  );

  return lines.join("\n");
}
