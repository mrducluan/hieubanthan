// KW-6T ý 3 — gắn video Shorts (chủ dự án đăng YouTube 2026-11-11) vào 8 bài tuần 1–2: khối "Video YouTube" ngay sau đoạn
// mở đầu (đoạn văn đầu tiên của thân bài). Link lưu dạng /shorts/ → web hiện khung dọc 9:16 (hbt-video-doc).
// Chạy lại không đổi thêm: bài đã có khối video cùng mã thì bỏ qua. Bài đang có bản nháp mới hơn (Chủ biên đang sửa) →
// chỉ gắn vào bản nháp, không tự xuất bản đè lên chữ biên tập.
import type { Payload, PayloadRequest } from "payload";
import { maYoutube } from "../lib/video.ts";

type Nut = { type?: string; children?: Nut[]; fields?: Record<string, unknown> } & Record<string, unknown>;

export const VIDEO_KW6T: { slug: string; ma: string; tieu_de: string; chu_thich: string }[] = [
  { slug: "cach-chon-nguoi-xong-dat-dau-nam", ma: "G_ObyI__Zhk", tieu_de: "Video: cách chọn người xông đất Tết Đinh Mùi 2027 trong 4 bước",
    chu_thich: "Video 43 giây tóm tắt 4 bước chọn người xông đất, có ví dụ gia chủ sinh năm 1988." },
  { slug: "khong-co-nguoi-hop-tuoi-xong-dat-thi-lam-sao", ma: "5FylQ1pxaNw", tieu_de: "Video: không có người hợp tuổi xông đất thì làm sao",
    chu_thich: "Video 35 giây tóm tắt 5 cách tập quán khi không tìm được người hợp tuổi xông đất." },
  { slug: "tam-tai-la-gi-cach-tinh", ma: "fPYPMdBWa7o", tieu_de: "Video: Tam tai là gì và cách tự tính tuổi gặp Tam tai năm 2027",
    chu_thich: "Video 44 giây: bốn nhóm tam hợp, ví dụ người sinh 1991 và các tuổi gặp Tam tai năm 2027." },
  { slug: "kim-lau-la-gi-cach-tinh-tuoi-kim-lau", ma: "g73JH2G8ntc", tieu_de: "Video: Kim lâu là gì và cách tính tuổi Kim lâu",
    chu_thich: "Video 48 giây: tuổi mụ chia 9, ví dụ cô dâu sinh 1998 cưới năm 2027." },
  { slug: "hoang-oc-la-gi-cach-dem-tuoi-lam-nha", ma: "auzGa_1NljE", tieu_de: "Video: Hoang ốc là gì và cách đếm tuổi làm nhà trên 6 cung",
    chu_thich: "Video 39 giây: sáu cung Hoang ốc và ví dụ đếm tuổi mụ 37." },
  { slug: "muon-tuoi-lam-nha-nhu-the-nao", ma: "EJ24vpKdEhY", tieu_de: "Video: mượn tuổi làm nhà như thế nào, ví dụ năm 2027",
    chu_thich: "Video 39 giây: chọn người cho mượn tuổi và ví dụ gia chủ sinh năm 1986." },
  { slug: "sao-la-hau-ke-do-nam-2027-nen-lam-gi", ma: "qWkyAkxAwSc", tieu_de: "Video: sao La Hầu, Kế Đô năm 2027 — tuổi nào gặp, nên làm gì",
    chu_thich: "Video 44 giây: cách tính sao hạn theo tuổi mụ và việc nên làm trong năm." },
  { slug: "than-so-hoc-cho-nguoi-moi-bat-dau", ma: "MM2YzCNsOXc", tieu_de: "Video: thần số học cho người mới — 4 con số cần biết",
    chu_thich: "Video 36 giây: Đường đời, Sứ mệnh, Linh hồn, Nhân cách và ví dụ ngày sinh 24/10/1988." },
];

const khoiVideo = (v: (typeof VIDEO_KW6T)[number]): Nut => ({
  type: "block", version: 2, format: "",
  fields: { id: `kw6t${v.ma.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toLowerCase()}`, blockName: "", blockType: "video",
    url: `https://www.youtube.com/shorts/${v.ma}`, tieu_de: v.tieu_de, chu_thich: v.chu_thich },
});

/** Thân bài (Lexical) có khối video cùng mã chưa. */
export function coVideo(goc: Nut[], ma: string): boolean {
  return goc.some((n) => (n.type === "block" && n.fields?.blockType === "video" && maYoutube(n.fields?.url) === ma)
    || (Array.isArray(n.children) && coVideo(n.children, ma)));
}

/** Chèn khối video ngay sau đoạn văn đầu tiên (đoạn mở đầu); không có đoạn văn → đặt đầu bài. Trả mảng mới. */
export function chenSauMoDau(goc: Nut[], khoi: Nut): Nut[] {
  const i = goc.findIndex((n) => n.type === "paragraph");
  const ra = [...goc];
  ra.splice(i < 0 ? 0 : i + 1, 0, khoi);
  return ra;
}

export async function ganVideoKw6t(payload: Payload, req?: PayloadRequest): Promise<{ gan: string[]; bo_qua: string[] }> {
  const kq = { gan: [] as string[], bo_qua: [] as string[] };
  for (const v of VIDEO_KW6T) {
    const r = await payload.find({ collection: "bai-viet", where: { slug: { equals: v.slug } }, draft: true, limit: 1, depth: 0,
      overrideAccess: true, req });
    const d = r.docs[0] as unknown as { id: number | string; _status?: string; noi_dung?: { root?: { children?: Nut[] } } } | undefined;
    const goc = d?.noi_dung?.root?.children;
    if (!d || !Array.isArray(goc)) { kq.bo_qua.push(`${v.slug} (không thấy bài)`); continue; }
    if (coVideo(goc, v.ma)) { kq.bo_qua.push(`${v.slug} (đã có video)`); continue; }
    const noi_dung = { ...d.noi_dung, root: { ...d.noi_dung!.root, children: chenSauMoDau(goc, khoiVideo(v)) } };
    const xuatBan = d._status === "published";
    await payload.update({ collection: "bai-viet", id: d.id, overrideAccess: true, req, context: { giuSlugGoc: true },
      ...(xuatBan ? {} : { draft: true }),
      data: { noi_dung, ...(xuatBan ? { _status: "published" } : {}) } as never });
    kq.gan.push(`${v.slug}${xuatBan ? "" : " (vào bản nháp)"}`);
  }
  return kq;
}
