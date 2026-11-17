// SEO-Q (chủ dự án giao 2026-11-17: "phần sửa tiêu đề blog em gợi ý, em tự sửa luôn trong CMS"): đổi TIÊU ĐỀ SEO + MÔ TẢ
// (thẻ <title>, meta description — chỗ Google hiện ở trang kết quả) của các bài đang có hiển thị mà ít / không có nhấp, và
// các tiêu đề nhồi từ khoá còn sót. Không đụng tiêu đề bài (H1), đường dẫn, ảnh, thân bài. Mô tả mở bằng câu trả lời.
// Bài có bản nháp đang sửa dở (khác bản xuất bản) thì không đè. Ghi dấu ở ghi chú duyệt để chạy lại không đổi thêm; down
// trả đúng chữ cũ (lưu trong kế hoạch dưới đây).
import type { Payload } from "payload";
import { dauNoiDung } from "./kw6t-bai-cu.ts";

export const DAU_SEO_Q = "SEO-Q";

export type KeSeoQ = { slug: string; title: string; description: string; cu: { title: string; description: string }; lyDo: string };

export const KE_SEO_Q: KeSeoQ[] = [
  {
    slug: "ngu-hanh-la-gi-hieu-kim-moc-thuy-hoa-tho-va-cac-moi-quan-he",
    lyDo: "Search Console: 'ngũ hành là gì' vị trí ~12, 0 nhấp — tiêu đề trả lời đúng câu hỏi + nêu sinh khắc",
    title: "Ngũ hành là gì? Kim Mộc Thủy Hỏa Thổ và cách sinh khắc",
    description: "Ngũ hành gồm Kim, Mộc, Thủy, Hỏa, Thổ. Tương sinh: Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim, Kim sinh Thủy, Thủy sinh Mộc. Xem thêm tương khắc, cách dùng.",
    cu: { title: "Ngũ Hành Là Gì? Hiểu Kim, Mộc, Thủy, Hỏa, Thổ",
      description: "Ngũ hành là gì? Tìm hiểu năm hành, vòng tương sinh–tương khắc và cách đọc Bát tự, phong thủy có ngữ cảnh, tránh nhầm biểu tượng với kết luận." },
  },
  {
    slug: "vong-tron-ngu-hanh-cach-doc-tuong-sinh-va-tuong-khac",
    lyDo: "Search Console: 'vòng tròn ngũ hành' vị trí ~7, 27 hiển thị, 0 nhấp — người tìm muốn sơ đồ + mẹo nhớ",
    title: "Vòng tròn ngũ hành: sơ đồ tương sinh, tương khắc dễ nhớ",
    description: "Vòng ngoài là tương sinh: Mộc → Hỏa → Thổ → Kim → Thủy → Mộc. Đường chéo hình sao là tương khắc: Mộc khắc Thổ, Thổ khắc Thủy… Cách đọc sơ đồ, mẹo nhớ.",
    cu: { title: "Vòng Tròn Ngũ Hành: Cách đọc tương sinh và tương khắc",
      description: "Vòng tròn ngũ hành thể hiện gì? Hiểu thứ tự tương sinh, tương khắc, cách đọc sơ đồ và những giới hạn cần nhớ khi áp dụng vào đời sống." },
  },
  {
    slug: "xem-boi-dong-nghiep-xem-boi-sep-xem-hop-sep-dung-the-nao-cho-huu-ich",
    lyDo: "tiêu đề nhồi 3 cụm từ khoá",
    title: "Xem hợp sếp, đồng nghiệp: đọc sao cho hữu ích ở chỗ làm",
    description: "Xem hợp sếp, đồng nghiệp bằng thần số học để hiểu cách mỗi người làm việc, chỗ dễ lệch nhịp và cách phối hợp — không dùng để phán xét người khác.",
    cu: { title: "Xem Bói Đồng Nghiệp, Xem Bói Sếp, Xem Hợp Sếp",
      description: "Xem bói đồng nghiệp, xem bói sếp, xem hợp sếp để hiểu phản ứng của mình, nhận diện điểm cần thống nhất và phối hợp dựa trên hành vi thực tế." },
  },
  {
    slug: "xem-hop-doi-xem-tinh-yeu-boi-tinh-yeu-boi-nguoi-do-doc-sao-cho-tinh-tao",
    lyDo: "tiêu đề + mô tả nhồi 4 cụm từ khoá",
    title: "Xem hợp đôi, bói tình yêu: đọc sao cho tỉnh táo",
    description: "Xem hợp đôi qua thần số học, Tử vi: mỗi người hợp nhau ở đâu, dễ va ở đâu, nên hỏi nhau câu gì. Tham khảo để hiểu nhau, không quyết định thay hai người.",
    cu: { title: "Xem Hợp Đôi, Xem Tình Yêu, Bói Tình Yêu, Bói Người Đó",
      description: "Xem hợp đôi, xem tình yêu, bói tình yêu, bói người đó: hiểu cách đọc mức độ tương hợp, câu hỏi nên đặt và giới hạn để không quyết định thay trái tim." },
  },
  {
    slug: "xem-kinh-dich-huyen-khong-phi-tinh-bat-tu-chon-dung-phuong-phap-truy-van",
    lyDo: "tiêu đề nhồi 3 phương pháp; mô tả gõ sai 'kinh dịnh'",
    title: "Kinh Dịch, Huyền Không hay Bát tự: hỏi gì dùng cách nào?",
    description: "Hỏi về một quyết định thì gieo quẻ Kinh Dịch, về nhà ở thì xem Huyền Không phi tinh, về con người và vận trình thì xem Bát tự. Cách chọn đúng cho câu hỏi.",
    cu: { title: "Xem Kinh Dịch, Huyền Không Phi Tinh, Bát Tự",
      description: "Phân biệt xem kinh dịnh, huyền không phi tinh, xem bát tự để chọn cách phù hợp cho câu hỏi về quyết định, nhà ở hoặc lá số cá nhân." },
  },
  {
    slug: "self-discovery-tu-hieu-minh-qua-gia-tri-thoi-quen-va-lua-chon",
    lyDo: "thiếu dấu cách sau dấu phẩy, tiêu đề 60 ký tự sát trần",
    title: "Self discovery: tự hiểu mình qua giá trị, thói quen",
    description: "Self discovery giúp bạn nhận ra giá trị, nhu cầu và khuôn mẫu hành vi qua ghi chép thực tế, kèm bài tập tự soi và cách dùng thần số học tỉnh táo.",
    cu: { title: "Self Discovery: Tự hiểu mình qua giá trị, thói quen,lựa chọn",
      description: "Self discovery giúp bạn nhận ra giá trị, nhu cầu và khuôn mẫu hành vi qua ghi chép thực tế, kèm bài tập tự soi và cách dùng thần số học tỉnh táo." },
  },
];

export type KetQuaSeoQ = { slug: string; ok: boolean; ly_do?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bai = Record<string, any>;

async function tim(payload: Payload, slug: string): Promise<Bai | undefined> {
  const r = await payload.find({ collection: "bai-viet", where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true });
  return r.docs[0] as Bai | undefined;
}

async function coNhapDangSua(payload: Payload, bai: Bai): Promise<boolean> {
  const v = await payload.findVersions({ collection: "bai-viet", where: { parent: { equals: bai.id } }, sort: "-updatedAt", limit: 1,
    depth: 0, overrideAccess: true });
  const moi = (v.docs[0] as { version?: Bai } | undefined)?.version;
  return moi?._status === "draft" && dauNoiDung(moi) !== dauNoiDung(bai);
}

const ghi = (bai: Bai, them: string) => [String(bai.ghi_chu_duyet ?? "").trim(), them].filter(Boolean).join("\n").slice(-2000);

export async function apDungSeoQ(payload: Payload): Promise<KetQuaSeoQ[]> {
  const kq: KetQuaSeoQ[] = [];
  for (const ke of KE_SEO_Q) {
    try {
      const bai = await tim(payload, ke.slug);
      if (!bai) { kq.push({ slug: ke.slug, ok: false, ly_do: "không thấy bài" }); continue; }
      if (bai._status !== "published") { kq.push({ slug: ke.slug, ok: false, ly_do: "bài chưa xuất bản — không đụng" }); continue; }
      if (bai.meta?.title === ke.title && bai.meta?.description === ke.description) { kq.push({ slug: ke.slug, ok: true, ly_do: "đã đúng" }); continue; }
      if (await coNhapDangSua(payload, bai)) { kq.push({ slug: ke.slug, ok: false, ly_do: "có bản nháp đang sửa — không đè" }); continue; }
      await payload.update({ collection: "bai-viet", id: bai.id, overrideAccess: true, context: { giuSlugGoc: true },
        data: { _status: "published", meta: { ...(bai.meta ?? {}), title: ke.title, description: ke.description },
          ghi_chu_duyet: ghi(bai, `${DAU_SEO_Q}: đổi tiêu đề SEO + mô tả (${ke.lyDo}).`) } as never });
      kq.push({ slug: ke.slug, ok: true });
    } catch (e) { kq.push({ slug: ke.slug, ok: false, ly_do: String((e as Error)?.message ?? e).slice(0, 300) }); }
  }
  return kq;
}

/** Hoàn tác: chỉ bài còn đúng chữ SEO-Q mới trả về chữ cũ (bài đã sửa tay sau đó giữ nguyên). */
export async function hoanTacSeoQ(payload: Payload): Promise<number> {
  let dem = 0;
  for (const ke of KE_SEO_Q) {
    const bai = await tim(payload, ke.slug);
    if (!bai || bai.meta?.title !== ke.title || bai.meta?.description !== ke.description) continue;
    await payload.update({ collection: "bai-viet", id: bai.id, overrideAccess: true, context: { giuSlugGoc: true },
      data: { _status: "published", meta: { ...(bai.meta ?? {}), ...ke.cu } } as never });
    dem++;
  }
  return dem;
}
