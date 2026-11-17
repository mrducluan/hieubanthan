// NF-BT (chủ dự án giao 2026-11-17): biên tập lại các bài NotFair đang xuất bản trên hieuban.com, sau lượt KW-6T.
// Audit 21 bài (docs/kw6t/AUDIT-NOTFAIR-2026-11-17.md): ảnh trong bài chỉ là ảnh tự vẽ "Tóm tắt / Lộ trình / Câu hỏi" có alt
// trùng tiêu đề; đoạn kết lặp một câu quảng bá chung chung trỏ về trang chủ; giọng "lăng kính… suy ngẫm…"; 4 bài mới nhất
// không có hỏi đáp, không có nguồn; ví dụ chưa đối chiếu với engine. Lượt này, mỗi bài:
// - ảnh bìa mới có tiêu đề chữ lớn + hoạ tiết theo mảng + QR (vẽ sẵn trong src/bai-khoi-tao/notfair/anh, alt riêng);
// - alt ảnh cũ viết lại theo nội dung ảnh (các mục / câu hỏi), không lặp tiêu đề;
// - đoạn có số liệu chạy bằng engine Hiểu Bản Thân (+ ảnh minh hoạ số liệu) ở bài có ví dụ;
// - đoạn kết thay bằng lời mời dùng đúng công cụ của mảng; bớt cụm sáo ("lăng kính", "tự phản tỉnh"…), thống nhất "hoà, thuỷ";
// - đủ hỏi đáp (≥ 3) và nguồn tham khảo từ link uy tín có sẵn trong bài.
// Không viết lại lời luận của bài. Bản đang xuất bản cũ còn trong lịch sử phiên bản (Chủ biên khôi phục được).
import type { Payload, PayloadRequest } from "payload";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { htmlSangKhoi } from "./html-lexical.ts";
import { nguonTuThanBai } from "./chuan-hoa-bai.ts";
import { chuCua, chenCuoiMuc, thayChuNut, type Nut } from "./kw6t-bai-cu.ts";

export const DAU_NFBT = "NF-BT";
export const NGUON_ANH_NFBT = "Ban biên tập Hiểu Bản Thân vẽ minh hoạ (NF-BT, số liệu engine)";

export type AnhNf = { ten_tep: string; alt: string };
export type BienTap = {
  slug: string;
  bia: AnhNf;
  /** Chèn khối HTML vào cuối mục có tiêu đề này. `[[ANH:tệp]]` trong html = chỗ đặt ảnh. */
  chen?: { cuoiMuc: string; html: string; anh?: AnhNf }[];
  thayChu?: [string, string][];
  /** Đoạn kết mới (thay đoạn quảng bá chung chung có chữ "Hiểu Bản Thân"). */
  ket: string;
  hoiDapThem?: { cau_hoi: string; tra_loi: string }[];
  dat?: Record<string, unknown>;
};

/** Cụm hay gặp trong giọng bài NotFair → lời thường. Áp trên từng nút chữ (không đụng link, slug). */
export const THAY_CHU_CHUNG: [string, string][] = [
  ["như một lăng kính văn hoá", "như một cách nhìn của văn hoá truyền thống"],
  ["một lăng kính văn hoá", "một cách nhìn của văn hoá truyền thống"],
  ["một lăng kính tự phản tỉnh khác", "một cách tự soi khác"],
  ["một lăng kính tự phản chiếu", "một cách tự soi"],
  ["một lăng kính tham khảo", "một góc tham khảo"],
  ["một lăng kính biểu tượng", "một góc nhìn biểu tượng"],
  ["một lăng kính", "một cách nhìn"],
  ["lăng kính", "cách nhìn"],
  ["tự phản tỉnh", "tự soi lại mình"],
  ["tự phản chiếu", "tự soi lại mình"],
  ["tự phản tư", "tự soi lại mình"],
  ["đánh giá toàn diện", "đánh giá đầy đủ"],
  ["hãy cùng thống nhất", "hai người thống nhất"],
  // Kiểu bỏ dấu của site: "hoà, thuỷ" (kiểm định cảnh báo bài trộn hai kiểu).
  ["Phong Thủy", "Phong Thuỷ"], ["phong thủy", "phong thuỷ"], ["Thủy", "Thuỷ"], ["thủy", "thuỷ"],
  ["Hòa", "Hoà"], ["hòa", "hoà"], ["Hỏa", "Hoả"], ["hỏa", "hoả"],
];

const DOAN_QUANG_BA = /Hiểu Bản Thân/;
const DAU_QUANG_BA = /(cung cấp|có (các )?(công cụ|nội dung)|khám phá tại|bắt đầu tại|tìm hiểu thêm tại)/;
const ANH = /^\[\[ANH:([a-z0-9-]+\.webp)\]\]$/;

const khoi = (html: string): Nut[] => htmlSangKhoi(html).filter((k) => k.type !== "__anh") as Nut[];

/** Đoạn quảng bá cuối bài: đoạn văn cuối cùng ở cấp gốc có "Hiểu Bản Thân" + cụm quảng bá. */
export function viTriDoanKet(ds: Nut[]): number {
  for (let i = ds.length - 1; i >= 0; i--) {
    const n = ds[i]!;
    if (n.type !== "paragraph") continue;
    const t = chuCua(n);
    if (DOAN_QUANG_BA.test(t) && DAU_QUANG_BA.test(t)) return i;
  }
  return -1;
}

export type KetQuaThanNf = { noi_dung: { root: Nut }; anh: string[]; loi: string[] };

/** Phần thân bài (thuần, không chạm DB). Ảnh mới là đoạn giữ chỗ `[[ANH:tệp]]` — hàm áp dụng thay bằng nút upload. */
export function apThanNf(noiDung: { root: Nut }, bt: BienTap): KetQuaThanNf {
  const nd = JSON.parse(JSON.stringify(noiDung)) as { root: Nut };
  const ds = nd.root.children ?? (nd.root.children = []);
  const loi: string[] = [];
  thayChuNut(nd.root, [...(bt.thayChu ?? []), ...THAY_CHU_CHUNG]);
  for (const c of bt.chen ?? []) {
    if (!chenCuoiMuc(ds, c.cuoiMuc, khoi(c.html))) loi.push(`không thấy mục "${c.cuoiMuc}"`);
  }
  const i = viTriDoanKet(ds);
  if (i >= 0) ds.splice(i, 1, ...khoi(bt.ket));
  else { ds.push(...khoi(bt.ket)); loi.push("không thấy đoạn quảng bá cuối — thêm đoạn kết ở cuối bài"); }
  const anh = ds.map((n) => (n.type === "paragraph" ? ANH.exec(chuCua(n).trim())?.[1] : undefined)).filter((x): x is string => !!x);
  return { noi_dung: nd, anh, loi };
}

/** Alt mới cho ảnh tự vẽ cũ (alt dạng "Tóm tắt nhanh: <tiêu đề>") — nói ảnh chứa gì, không lặp tiêu đề. */
export function altMoi(altCu: string, muc: string[], hoi: string[]): string | null {
  const gon = (ds: string[]) => ds.map((s) => s.replace(/^Bước \d+:\s*/, "").replace(/\?$/, "")).join("; ");
  let s: string | null = null;
  if (altCu.startsWith("Tóm tắt nhanh")) s = `Sơ đồ tóm tắt các ý chính: ${gon(muc)}`;
  else if (altCu.startsWith("Lộ trình bài viết")) s = `Các bước theo thứ tự: ${gon(muc)}`;
  else if (altCu.startsWith("Câu hỏi thường gặp") && hoi.length) s = `Những câu hỏi thường gặp: ${gon(hoi)}`;
  if (!s) return null;
  return s.length <= 160 ? s : s.slice(0, s.lastIndexOf(";", 157)) + "…";
}

// ---------- áp dụng (Local API) ----------

async function taiAnhNf(payload: Payload, req: PayloadRequest | undefined, thuMuc: string, a: AnhNf): Promise<number | string | null> {
  const tep = path.join(thuMuc, a.ten_tep);
  if (!existsSync(tep)) return null;
  const data = readFileSync(tep);
  const m = await payload.create({ collection: "media", overrideAccess: true, req,
    file: { data, mimetype: "image/webp", name: a.ten_tep, size: data.length },
    data: { alt: a.alt.slice(0, 160), nguon_anh: NGUON_ANH_NFBT } as never });
  return m.id;
}

async function timTheoSlug(payload: Payload, slug: string) {
  const r = await payload.find({ collection: "bai-viet", where: { or: [{ slug: { equals: slug } }, { slug_cu: { in: [slug] } }] },
    limit: 1, depth: 0, overrideAccess: true });
  return r.docs[0] as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export type KetQuaNf = { slug: string; ok: boolean; ly_do?: string };

export async function apDungBienTap(payload: Payload, req: PayloadRequest | undefined, thuMuc: string,
  ds: BienTap[] = BIEN_TAP): Promise<KetQuaNf[]> {
  const kq: KetQuaNf[] = [];
  for (const bt of ds) {
    try {
      const bai = await timTheoSlug(payload, bt.slug);
      if (!bai) { kq.push({ slug: bt.slug, ok: false, ly_do: "không thấy bài" }); continue; }
      if (bai._status !== "published") { kq.push({ slug: bt.slug, ok: false, ly_do: "bài chưa xuất bản — không đụng" }); continue; }
      if (String(bai.ghi_chu_duyet ?? "").includes(DAU_NFBT)) { kq.push({ slug: bt.slug, ok: true, ly_do: "đã biên tập từ trước" }); continue; }
      const than = apThanNf(bai.noi_dung, bt);
      // Ảnh mới trong bài: đoạn giữ chỗ → nút upload (tải lỗi → bỏ đoạn giữ chỗ, chữ vẫn lên).
      const idAnh = new Map<string, number | string | null>();
      for (const c of bt.chen ?? []) if (c.anh) idAnh.set(c.anh.ten_tep, await taiAnhNf(payload, req, thuMuc, c.anh));
      const goc = than.noi_dung.root;
      goc.children = (goc.children ?? []).flatMap((n): Nut[] => {
        const t = n.type === "paragraph" ? ANH.exec(chuCua(n).trim())?.[1] : undefined;
        if (!t) return [n];
        const id = idAnh.get(t);
        return id == null ? [] : [{ type: "upload", relationTo: "media", value: id, fields: null, format: "", version: 3,
          id: Math.random().toString(16).slice(2, 14).padEnd(12, "0") }];
      });
      // Alt ảnh tự vẽ cũ.
      const muc = (goc.children ?? []).filter((n) => n.type === "heading" && n.tag === "h2").map(chuCua).filter(Boolean);
      const hoiDap = [...((bai.hoi_dap ?? []) as { cau_hoi: string; tra_loi: string }[]).map(({ cau_hoi, tra_loi }) => ({ cau_hoi, tra_loi }))];
      const co = new Set(hoiDap.map((h) => h.cau_hoi));
      for (const h of bt.hoiDapThem ?? []) if (!co.has(h.cau_hoi)) hoiDap.push(h);
      for (const n of goc.children ?? []) {
        if (n.type !== "upload") continue;
        const id = typeof n.value === "object" && n.value ? n.value.id : n.value;
        if ([...idAnh.values()].includes(id)) continue;
        const m = await payload.findByID({ collection: "media", id, depth: 0, overrideAccess: true }).catch(() => null) as { alt?: string } | null;
        const alt = m ? altMoi(String(m.alt ?? ""), muc, hoiDap.map((h) => h.cau_hoi)) : null;
        if (alt) await payload.update({ collection: "media", id, overrideAccess: true, data: { alt } as never }).catch(() => null);
      }
      const bia = await taiAnhNf(payload, req, thuMuc, bt.bia);
      const nguonCo = ((bai.nguon ?? []) as { ten: string; url?: string | null }[]).map(({ ten, url }) => ({ ten, url: url ?? null }));
      const nguon = nguonCo.length >= 2 ? nguonCo
        : [...nguonCo, ...nguonTuThanBai(goc.children ?? []).filter((n) => !nguonCo.some((c) => c.url === n.url))].slice(0, 12);
      const ghi = `${DAU_NFBT} ${new Date().toISOString().slice(0, 10)}: máy biên tập theo audit NotFair — ảnh bìa có tiêu đề, alt ảnh, `
        + `đoạn số liệu engine${than.anh.length ? " + ảnh minh hoạ" : ""}, đoạn kết dẫn đúng công cụ, hỏi đáp, bớt cụm sáo`
        + (than.loi.length ? ` (lưu ý: ${than.loi.join("; ")})` : "") + ". Bản cũ còn trong Phiên bản. Chủ biên đọc lại khi rảnh.";
      await payload.update({ collection: "bai-viet", id: bai.id, overrideAccess: true, req, context: { giuSlugGoc: true },
        data: {
          _status: "published", ...(bt.dat ?? {}), noi_dung: than.noi_dung, hoi_dap: hoiDap.slice(0, 10), nguon,
          ...(bia != null ? { anh_bia: bia, meta: { ...(bai.meta ?? {}), image: bia } } : {}),
          ghi_chu_duyet: [ghi, bai.ghi_chu_duyet ?? ""].filter(Boolean).join("\n").slice(0, 2000),
        } as never });
      kq.push({ slug: bt.slug, ok: true, ly_do: than.loi.join("; ") || undefined });
    } catch (e) {
      kq.push({ slug: bt.slug, ok: false, ly_do: String((e as Error)?.message ?? e).slice(0, 300) });
    }
  }
  return kq;
}

// ---------- nội dung từng bài ----------
// Số liệu ví dụ: engine Hiểu Bản Thân chạy ngày 17/11/2026 (lá số nữ, 14/9/1992 dương lịch, 08:30 — giờ Thìn; âm lịch
// Việt Nam). Mỗi con số trong bài khớp ảnh minh hoạ cùng tên (src/bai-khoi-tao/notfair/ve-anh.mjs).

const L = (url: string, chu: string) => `<a href="${url}">${chu}</a>`;
const B = (slug: string, chu: string) => L(`/blog/${slug}`, chu);
const P = (s: string) => `<p>${s}</p>`;
const anh = (ten_tep: string) => `<p>[[ANH:${ten_tep}]]</p>`;

export const BIEN_TAP: BienTap[] = [
  {
    slug: "cach-doc-dai-van-la-so-tu-vi-6-buoc-de-luan-co-can-cu",
    bia: { ten_tep: "bia-dai-van-tu-vi.webp", alt: "Ảnh bìa: đọc đại vận lá số Tử vi theo 6 bước, lá số 12 cung tô cung Dần — vận 36–45 tuổi ở cung Tử Nữ" },
    chen: [{
      cuoiMuc: "Bước 6: Thử cách đọc bằng ví dụ và ghi cả điều không khớp",
      anh: { ten_tep: "dai-van-vi-du-1992.webp", alt: "Bảng bốn đại vận đầu của lá số nữ sinh 14/9/1992 giờ Thìn: Mệnh Tỵ, Huynh Đệ Thìn, Phu Thê Mão, Tử Nữ Dần từ năm 2027" },
      html: `<h3>Ví dụ trên một lá số: nữ, sinh 14/9/1992, giờ Thìn</h3>${anh("dai-van-vi-du-1992.webp")}`
        + P(`Lập lá số này trên ${L("/tu-vi", "công cụ Tử vi")} (âm lịch Việt Nam), máy cho hai dữ kiện quyết định cách đi của đại vận. Năm Nhâm Thân là năm dương, người xem là nữ, nên thuộc nhóm Dương Nữ và đại vận đi ngược chiều. Cục là Hoả Lục Cục, nên vận đầu bắt đầu từ 6 tuổi (tuổi mụ), ngay tại cung Mệnh ở Tỵ.`)
        + P(`Đi ngược từ Tỵ: 16–25 tuổi ở Thìn (Huynh Đệ), 26–35 ở Mão (Phu Thê), 36–45 ở Dần (Tử Nữ). Người này sinh năm 1992, nên vận ở cung Tử Nữ bắt đầu đúng năm 2027.`)
        + P(`Áp các bước ở trên vào vận 2027–2036. Đọc cung trước: Tử Nữ nói về con cái, học trò, người mình dìu dắt, cả những việc mình tự "sinh ra" như một dự án riêng. Rồi mới xét sao: Tham Lang, độ sáng Đắc. Sau đó xét thêm vòng ngoài: hai cung Dần và Mão đều có Triệt, theo cách đọc phổ biến thì việc trong hai vận này hay khởi động chậm, phải qua một đoạn đầu chưa thuận. Cuối cùng, mỗi năm trong vận đọc lại bằng lưu niên; năm 2027 là Đinh Mùi nên xem thêm tứ hoá của can Đinh.`)
        + P(`Ghi chép mẫu sau khi đọc: "Vận 36–45: chủ đề người mình dìu dắt và việc riêng; đầu vận có thể chậm. Hẹn đọc lại vào cuối năm 2029, ghi điều khớp và điều không khớp." Ghi theo cách này thì vài năm sau bạn kiểm được lời đọc, thay vì chỉ nhớ câu nào nghe đúng.`),
    }],
    ket: P(`Muốn thử sáu bước trên lá số của chính mình, hãy ${L("/tu-vi", "lập lá số Tử vi miễn phí")}: máy hiện dải 12 giai đoạn 10 năm, bấm vào giai đoạn nào thì lá số chuyển sang lớp đại vận đó. Phần ${L("/thoi-gian-toi", "thời gian tới")} đọc riêng 12 tháng và năm tới theo cùng lá số.`)
      + P(`<strong>Đọc tiếp:</strong> ${B("xem-van-han-cach-doc-dai-han-tu-vi-va-hieu-gioi-han-cua-loi-luan", "cách đọc vận hạn tỉnh táo")} · ${B("cach-xem-tu-vi-lap-la-so-va-doc-12-cung-tung-buoc", "đọc 12 cung từng bước")} · ${L("/tu-vi/cung", "ý nghĩa 12 cung")}.`),
    hoiDapThem: [
      { cau_hoi: "Đại vận Tử vi đi thuận hay nghịch tính thế nào?", tra_loi: "Dựa vào âm dương của năm sinh và giới tính. Nam sinh năm dương và nữ sinh năm âm thì đại vận đi thuận; nam sinh năm âm và nữ sinh năm dương thì đi nghịch. Ví dụ nữ sinh năm Nhâm Thân 1992 (năm dương) đi nghịch." },
      { cau_hoi: "Đại vận đầu tiên bắt đầu từ mấy tuổi?", tra_loi: "Bằng số của Cục trên lá số: Thuỷ Nhị Cục từ 2 tuổi, Mộc Tam Cục 3, Kim Tứ Cục 4, Thổ Ngũ Cục 5, Hoả Lục Cục 6. Tuổi ở đây là tuổi mụ, mỗi vận kéo dài 10 năm." },
      { cau_hoi: "Đại vận và lưu niên khác nhau thế nào?", tra_loi: "Đại vận là chặng 10 năm, cho biết chủ đề lớn của giai đoạn. Lưu niên là từng năm đặt bên trong chặng đó. Khi hai lớp nói khác nhau, Hiểu Bản Thân xếp ưu tiên đại vận trước, rồi lưu niên, rồi tiểu hạn." },
    ],
  },
  {
    slug: "vi-du-tinh-so-duong-doi-ngay-sinh-cach-cong-va-rut-gon-tung-buoc",
    bia: { ten_tep: "bia-vi-du-duong-doi.webp", alt: "Ảnh bìa: ví dụ tính số Đường đời ngày sinh 14/09/1992, cộng các chữ số được 35 rồi rút gọn thành 8" },
    chen: [{
      cuoiMuc: "Bước 4: Quyết định cách ghi số chủ đạo",
      anh: { ten_tep: "hai-cach-cong-duong-doi.webp", alt: "Bảng thống kê 25.933 ngày sinh 1940–2010: 13,8% ra hai số Đường đời khác nhau giữa cách cộng hết và rút gọn từng phần" },
      html: `<h3>Khi nào hai cách cộng cho ra hai số khác nhau?</h3>`
        + P(`Bài này cộng hết một lượt. Sách thần số phương Tây hay dùng cách khác: rút gọn ngày, tháng, năm riêng rồi mới cộng. Với 14/09/1992, hai cách cùng ra 8 (5 + 9 + 3 = 17, rồi 1 + 7 = 8). Không phải ngày nào cũng trùng như vậy.`)
        + P(`Ban biên tập cho engine của Hiểu Bản Thân tính cả hai cách cho mọi ngày từ 1/1/1940 đến 31/12/2010. Trong 25.933 ngày sinh có 3.573 ngày (13,8%) ra hai số khác nhau. Chỗ khác luôn nằm ở số cái: một cách giữ 11, 22 hoặc 33, cách kia rút về 2, 4 hoặc 6. Hay gặp nhất là cặp 33 và 6 (1.326 ngày), chẳng hạn ngày 24/10/1988: cộng hết ra 2 + 4 + 1 + 0 + 1 + 9 + 8 + 8 = 33, rút gọn từng phần ra 6 + 1 + 8 = 15, rồi 1 + 5 = 6.`)
        + anh("hai-cach-cong-duong-doi.webp")
        + P(`Vì vậy, khi hai trang cho bạn 33 và 6, nhiều khả năng bạn không tính sai mà hai trang theo hai quy ước. ${L("/than-so", "Công cụ thần số học")} của Hiểu Bản Thân mặc định cách rút gọn từng phần, và luôn ghi kèm số của cách kia khi hai số khác nhau.`),
    }],
    ket: P(`Tự kiểm phép tính của bạn bằng ${L("/than-so", "công cụ thần số học miễn phí")}: nhập ngày sinh, mở "Xem cách tính" dưới mỗi con số để thấy từng phép cộng. Muốn đổi ngày âm sang dương trước khi tính, dùng ${L("/doi-lich-am-duong", "trang đổi lịch âm dương")}.`)
      + P(`<strong>Đọc tiếp:</strong> ${B("cach-tinh-than-so-hoc-tu-ngay-sinh-va-ho-ten", "cách tính đủ bốn con số từ ngày sinh và họ tên")} · ${L("/than-so/y-nghia-so", "ý nghĩa các con số")}.`),
    hoiDapThem: [
      { cau_hoi: "Vì sao trang này ra số 33, trang khác ra số 6?", tra_loi: "Hai trang dùng hai quy ước cộng. Cộng hết một lượt mọi chữ số có thể giữ số cái 33; rút gọn ngày, tháng, năm riêng rồi cộng thì ra 6. Tính trên các ngày 1940–2010, cứ khoảng 7 ngày sinh có 1 ngày rơi vào trường hợp hai cách khác nhau." },
      { cau_hoi: "Số cái 11, 22, 33 có \"đặc biệt hơn\" không?", tra_loi: "Không hơn, chỉ có thêm một lớp nghĩa. Thần số học phổ biến đọc số cái như bản tăng cường của số gốc: 11 với 2, 22 với 4, 33 với 6. Người có số 33 và người có số 6 vẫn đọc chung phần lớn mô tả." },
      { cau_hoi: "Tính số Đường đời theo ngày âm hay ngày dương?", tra_loi: "Theo ngày dương lịch ghi trên giấy khai sinh. Nếu chỉ nhớ ngày âm, hãy đổi sang dương trước rồi mới cộng." },
    ],
  },
  {
    slug: "boi-que-dich-phuc-hy-cach-gieo-xu-nhan-dien-bat-quai-va-lap-que-bien",
    bia: { ten_tep: "bia-que-phuc-hy.webp", alt: "Ảnh bìa: gieo ba đồng xu, nhận Bát quái và lập quẻ biến — quẻ Lôi Hoả Phong biến thành Hoả Lôi Phệ Hạp" },
    thayChu: [["Hoả Lôi Thệ Hạp", "Hoả Lôi Phệ Hạp"]],
    chen: [{
      cuoiMuc: "Bước 5: Lập quẻ biến bằng cách đổi hào động",
      anh: { ten_tep: "que-phong-bien-phe-hap.webp", alt: "Hai quẻ vẽ từ sáu tổng 7, 8, 9, 7, 8, 6: Lôi Hoả Phong số 55 có hào 3 và hào 6 động, biến thành Hoả Lôi Phệ Hạp số 21" },
      html: `<h3>Kiểm lại ví dụ bằng máy</h3>${anh("que-phong-bien-phe-hap.webp")}`
        + P(`Nhập đúng sáu tổng 7, 8, 9, 7, 8, 6 vào ${L("/kinh-dich", "công cụ gieo quẻ Kinh Dịch")} ở chế độ tự gieo, máy cũng ra Lôi Hoả Phong (55), hai hào động ở vị trí 3 và 6, biến thành Hoả Lôi Phệ Hạp (21). Máy ghi thêm hai điều mà bước trên chưa nói:`)
        + `<ul><li>Khi có hai hào động, quy tắc đọc của công cụ lấy hào ở trên (hào 6) làm chủ, hào 3 đọc kèm.</li><li>Quẻ hỗ, ghép từ hào 2–4 làm quái dưới và hào 3–5 làm quái trên, là Trạch Phong Đại Quá (28). Quẻ hỗ dùng để xem diễn biến bên trong việc.</li></ul>`,
    }],
    ket: P(`Gieo xu ở nhà rồi muốn tra nhanh? ${L("/kinh-dich", "Gieo quẻ Kinh Dịch")} có chế độ tự gieo: chọn kết quả ba đồng xu cho từng hào, máy lập quẻ chính, quẻ biến, quẻ hỗ và ghi rõ quy tắc đọc đang dùng. Muốn hiểu sâu một quẻ, xem ${L("/kinh-dich/que", "64 quẻ")}.`)
      + P(`<strong>Đọc tiếp:</strong> ${B("cach-gieo-que-kinh-dich-bang-3-dong-xu", "gieo quẻ bằng 3 đồng xu")} · ${B("que-kinh-dich-mai-hoa-cach-lap-que-va-luan-que-co-can-cu", "lập quẻ Mai Hoa theo thời điểm")}.`),
    hoiDapThem: [
      { cau_hoi: "Bát quái Tiên Thiên và Hậu Thiên khác nhau ở đâu?", tra_loi: "Cùng tám quái nhưng xếp khác nhau. Tiên Thiên (gắn với Phục Hy) xếp các cặp đối nhau: Càn–Khôn, Ly–Khảm, Chấn–Tốn, Đoài–Cấn. Hậu Thiên (gắn với Văn Vương) xếp theo bốn mùa, tám phương, dùng nhiều trong phong thuỷ. Khi lập quẻ bằng xu, bạn chỉ cần nhận đúng tên quái từ ba hào." },
      { cau_hoi: "Quẻ có nhiều hào động thì đọc hào nào?", tra_loi: "Mỗi sách có quy tắc riêng. Công cụ trên Hiểu Bản Thân ghi rõ quy tắc nó dùng ngay trên kết quả, ví dụ hai hào động thì lấy hào ở trên làm chủ. Khi so với sách, hãy dùng cùng một quy tắc." },
      { cau_hoi: "Tự gieo xu ở nhà rồi nhập vào máy được không?", tra_loi: "Được. Trang Gieo quẻ Kinh Dịch có chế độ tự gieo: chọn kết quả ba đồng xu cho từng hào từ dưới lên, máy lập quẻ chính, quẻ biến và quẻ hỗ." },
    ],
  },
  {
    slug: "xem-tuong-cach-hieu-net-mat-theo-truyen-thong-va-gioi-han-can-biet",
    bia: { ten_tep: "bia-xem-tuong.webp", alt: "Ảnh bìa: xem tướng, đọc nét mặt theo sách xưa — gương mặt chia ba phần thượng đình, trung đình, hạ đình" },
    dat: { mang: "chung" },
    chen: [{
      cuoiMuc: "Các nét mặt thường được diễn giải ra sao?",
      anh: { ten_tep: "tam-dinh-tuoi.webp", alt: "Bảng tuổi đi trên gương mặt theo sách Thần Tướng Toàn Biên: tai 1–14, trán 15–30, mày mắt 31–40, mũi 41–50, miệng 51–60, cằm từ 61" },
      html: `<h3>Tuổi đi trên gương mặt: một bảng của sách xưa</h3>`
        + P(`Sách tướng cổ không chỉ đọc từng nét mà còn gắn mỗi tuổi với một chỗ trên mặt, gọi là lưu niên. Bài ca "Lưu niên vận khí bộ vị" trong Thần Tướng Toàn Biên đi từ hai tai (1–14 tuổi) lên trán (15–30), xuống lông mày và mắt (31–40), mũi và gò má (41–50), nhân trung và miệng (51–60), rồi cằm, quai hàm từ 61 tuổi. Tuổi tính theo tuổi mụ; nam xét bên trái, nữ bên phải.`)
        + anh("tam-dinh-tuoi.webp")
        + P(`Ví dụ người sinh năm 1992 thì năm 2027 tuổi mụ 36, theo bảng này sách xưa nhìn vào vùng mắt. Bảng chỉ cho biết người xem tướng nhìn vào đâu ở mỗi tuổi. Nó không nói vùng đó tốt hay xấu, càng không nói được gì chắc về sức khoẻ.`),
    }],
    ket: P(`Mục ${L("/nhan-tuong", "Nhân tướng học")} trên Hiểu Bản Thân có bản đồ ${L("/nhan-tuong/bo-vi", "25 bộ vị")} và 100 vị trí lưu niên theo sách xưa. Bạn tự soi gương trả lời từng câu, ảnh không phải gửi đi đâu; bài đọc nói nét nào sách xưa đọc ra sao và kèm việc nhỏ nên làm. Hãy đọc như một tài liệu văn hoá, không dùng nó để đánh giá người khác.`),
  },
  {
    slug: "que-kinh-dich-mai-hoa-cach-lap-que-va-luan-que-co-can-cu",
    bia: { ten_tep: "bia-mai-hoa.webp", alt: "Ảnh bìa: lập quẻ Mai Hoa theo thời điểm, ví dụ ra quẻ Phong Hoả Gia Nhân hào 5 động, biến thành Sơn Hoả Bí" },
    chen: [{
      cuoiMuc: "Ví dụ minh hoạ: từ con số đến quẻ chủ",
      anh: { ten_tep: "mai-hoa-vi-du-2026.webp", alt: "Ví dụ Mai Hoa lúc 9:15 ngày 20/11/2026: năm Ngọ, tháng 10, ngày 12 âm và giờ Tỵ ra quẻ Gia Nhân, hào 5 động, biến quẻ Bí" },
      html: `<h3>Một ví dụ có đủ số: 9:15 sáng ngày 20/11/2026</h3>`
        + P(`Ngày 20/11/2026 dương lịch là ngày 12 tháng 10 năm Bính Ngọ (âm lịch Việt Nam), 9:15 thuộc giờ Tỵ. Lập quẻ theo thời điểm:`)
        + `<ul><li>Quẻ trên: năm Ngọ (7) + tháng 10 + ngày 12 = 29. Lấy 29 chia 8 dư 5, ra Tốn.</li><li>Quẻ dưới: 29 + giờ Tỵ (6) = 35. Lấy 35 chia 8 dư 3, ra Ly.</li><li>Hào động: 35 chia 6 dư 5, hào 5 động.</li></ul>`
        + anh("mai-hoa-vi-du-2026.webp")
        + P(`Ra quẻ Phong Hoả Gia Nhân (37), hào 5 động, biến thành Sơn Hoả Bí (22). Quái có hào động (Tốn, hành Mộc) là Dụng, quái không động (Ly, hành Hoả) là Thể. Mộc sinh Hoả nên đây là "dụng sinh thể", thường được đọc là việc có trợ lực từ bên ngoài. ${L("/kinh-dich?cach=mai_hoa", "Công cụ Mai Hoa")} của Hiểu Bản Thân chạy ra đúng các số này.`),
    }],
    ket: P(`Muốn thử Mai Hoa với giờ hiện tại, mở ${L("/kinh-dich?cach=mai_hoa", "lập quẻ Mai Hoa theo giờ")}: máy đổi sang âm lịch, cộng số, chỉ ra Thể, Dụng và quẻ biến, kèm lời quẻ dễ hiểu. Câu hỏi càng cụ thể (một việc, một khoảng thời gian), lời đọc càng dùng được.`),
    hoiDapThem: [
      { cau_hoi: "Lập quẻ Mai Hoa có cần giờ chính xác đến phút không?", tra_loi: "Không cần đến phút, chỉ cần biết thời điểm thuộc canh giờ nào (mỗi canh 2 tiếng, ví dụ giờ Tỵ từ 9:00 đến 10:59). Sang canh giờ khác thì quẻ dưới và hào động đổi theo." },
    ],
  },
  {
    slug: "cach-xem-tu-vi-lap-la-so-va-doc-12-cung-tung-buoc",
    bia: { ten_tep: "bia-cach-xem-tu-vi.webp", alt: "Ảnh bìa: cách xem Tử vi, lập lá số và đọc 12 cung — cung Quan Lộc ở Dậu mượn sao của cung Mão" },
    chen: [{
      cuoiMuc: "Ví dụ minh hoạ: đọc một câu hỏi về công việc",
      anh: { ten_tep: "la-so-12-cung-vi-du.webp", alt: "Lá số 12 cung ví dụ nữ sinh 14/9/1992 giờ Thìn: cung Quan Lộc ở Dậu không có chính tinh, đọc mượn Thiên Cơ, Cự Môn ở cung Mão" },
      html: `<h3>Thử trên một lá số thật</h3>${anh("la-so-12-cung-vi-du.webp")}`
        + P(`Lập lá số cho người nữ sinh 14/9/1992, giờ Thìn. Cung Mệnh ở Tỵ có Thiên Lương (Hãm). Cung Quan Lộc, nơi xem công việc, nằm ở Dậu và không có chính tinh nào.`)
        + P(`Gặp cung trống, cách đọc phổ biến (công cụ Tử vi của Hiểu Bản Thân cũng làm vậy) là mượn chính tinh của cung đối diện: cung Mão, có Thiên Cơ và Cự Môn, cả hai đều Miếu. Thiên Cơ thường được mô tả là sao của suy tính, Cự Môn là sao của lời nói, nên câu hỏi về công việc được đọc theo hướng việc cần phân tích, trao đổi, thuyết phục. Đọc thêm hai cung tam hợp với Quan Lộc là Mệnh (Tỵ) và Tài Bạch (Sửu): ba cung này luôn đi cùng nhau khi bàn về việc làm và tiền.`),
    }],
    ket: P(`Lập ${L("/tu-vi", "lá số Tử vi miễn phí")} rồi bấm vào một cung để xem sao, độ sáng, cung đối diện và hai cung tam hợp của nó. Câu hỏi về một cung cụ thể có thể gõ ở khung hỏi đáp ngay dưới lá số.`)
  },
  {
    slug: "tu-vi-la-gi-cau-truc-la-so-cach-doc-va-gioi-han",
    bia: { ten_tep: "bia-tu-vi-la-gi.webp", alt: "Ảnh bìa: Tử vi là gì — lá số 12 cung dựng từ ngày giờ sinh âm lịch, giờ sinh quyết định cung Mệnh" },
    chen: [{
      cuoiMuc: "Ngày giờ sinh ảnh hưởng đến việc lập lá số ra sao?",
      anh: { ten_tep: "mot-ngay-12-gio.webp", alt: "Bảng cùng ngày sinh 14/9/1992 lập ở 12 giờ khác nhau: 12 cung Mệnh khác nhau, Cục đổi 5 lần, Bát tự chỉ đổi trụ giờ" },
      html: `<h3>Phép thử: giữ ngày sinh, chỉ đổi giờ</h3>`
        + P(`Giữ nguyên ngày sinh 14/9/1992 (nữ), chỉ đổi giờ sinh qua 12 canh giờ, rồi cho engine của Hiểu Bản Thân lập lại lá số. Kết quả: 12 giờ cho 12 cung Mệnh khác nhau, và Cục (thứ quyết định tuổi bắt đầu đại vận) đổi 5 lần. Bát tự của cùng người vẫn giữ nguyên ba trụ năm, tháng, ngày, chỉ trụ giờ đổi.`)
        + anh("mot-ngay-12-gio.webp")
        + P(`Vì vậy một lá số Tử vi lập sai giờ có thể đọc ra một người khác hẳn. Không chắc giờ sinh thì hỏi lại người thân, giấy tờ, và ghi rõ mức chắc chắn trước khi đọc.`),
    }],
    ket: P(`${L("/tu-vi", "Lập lá số Tử vi miễn phí")} trên Hiểu Bản Thân: lá số an theo âm lịch Việt Nam, có khung "Trường phái" để đổi lịch Việt / Trung và cách xử lý tháng nhuận. Không biết giờ sinh vẫn chọn được "Không biết giờ", máy ghi rõ phần nào chưa tin được.`),
  },
  {
    slug: "xem-phong-thuy-cach-tu-danh-gia-nha-o-va-chon-viec-nen-uu-tien",
    bia: { ten_tep: "bia-tu-danh-gia-nha.webp", alt: "Ảnh bìa: tự đánh giá phong thuỷ nhà ở — la bàn tám hướng, bốn hướng tốt Đông Bắc, Tây Nam, Tây, Tây Bắc tô xanh" },
    chen: [{
      cuoiMuc: "Chọn phương pháp và hiểu giới hạn của từng cách xem",
      anh: { ten_tep: "cung-phi-1992.webp", alt: "Bảng hướng tốt xấu của nam và nữ sinh năm 1992: nam cung Cấn, nữ cung Đoài, cùng bốn hướng tốt nhưng khác hướng Sinh Khí" },
      html: `<h3>Hướng theo tuổi được tính thế nào?</h3>`
        + P(`Hướng theo tuổi trên ${L("/phong-thuy", "công cụ phong thuỷ")} của Hiểu Bản Thân tính theo Bát trạch: năm sinh (lấy mốc Lập xuân, khoảng 4/2 dương lịch) và giới tính cho ra một cung phi; mỗi cung có bốn hướng tốt và bốn hướng nên tránh.`)
        + anh("cung-phi-1992.webp")
        + P(`Ví dụ cùng sinh năm 1992, sau Lập xuân: nam là cung Cấn, nữ là cung Đoài. Cả hai thuộc Tây tứ mệnh nên bốn hướng tốt trùng nhau (Đông Bắc, Tây Nam, Tây, Tây Bắc). Nhưng hướng Sinh Khí của nam là Tây Nam, của nữ là Tây Bắc, nên vợ chồng cùng tuổi vẫn có thể ưu tiên khác nhau khi kê giường, đặt bàn. Người sinh tháng 1 hoặc đầu tháng 2 dương lịch cần xem lại mốc: sinh trước Lập xuân thì tính theo năm trước.`),
    }],
    ket: P(`Muốn áp vào nhà mình, mở ${L("/phong-thuy", "công cụ phong thuỷ")}: đo hướng bằng la bàn điện thoại (hoặc chọn trên bản đồ khi dùng máy tính), khai những gì bạn thấy trong nhà, máy đọc phần hình thế trước rồi mới tới hướng, kèm việc 0 đồng nên làm trước. Từng dấu hiệu hay gặp có giải thích riêng ở ${L("/phong-thuy/dau-hieu", "dấu hiệu trong nhà")}.`),
    hoiDapThem: [
      { cau_hoi: "Nhà chung cư thì đo hướng ở đâu?", tra_loi: "Với căn hộ, nên đo ở ban công hoặc cửa sổ lớn nhất, vì cửa căn hộ thường mở ra hành lang chung. Công cụ phong thuỷ trên Hiểu Bản Thân hướng dẫn đo theo cách này khi bạn chọn loại nhà là chung cư." },
    ],
  },
  {
    slug: "ngu-hanh-la-gi-hieu-kim-moc-thuy-hoa-tho-va-cac-moi-quan-he",
    bia: { ten_tep: "bia-ngu-hanh-la-gi.webp", alt: "Ảnh bìa: ngũ hành là gì — năm hành Mộc, Hoả, Thổ, Kim, Thuỷ nối vòng tương sinh và đường tương khắc" },
    chen: [{
      cuoiMuc: "Ngũ hành được dùng trong Bát tự và phong thuỷ ra sao?",
      anh: { ten_tep: "ngu-hanh-bat-tu-vi-du.webp", alt: "Biểu đồ năm hành trong lá Bát tự Nhâm Thân, Kỷ Dậu, Quý Tỵ, Bính Thìn: Kim 32%, Thuỷ 27%, Thổ 20%, Hoả 18%, Mộc 3%" },
      html: `<h3>Một lá Bát tự cụ thể: "mệnh năm" và "hành của mình" là hai thứ khác nhau</h3>`
        + P(`Người nữ sinh 14/9/1992, giờ Thìn có bốn trụ Nhâm Thân, Kỷ Dậu, Quý Tỵ, Bính Thìn. Hỏi "sinh năm 1992 mệnh gì", câu trả lời quen thuộc là Kiếm Phong Kim, tức nạp âm của năm Nhâm Thân. Nhưng Bát tự lấy can của ngày sinh làm "mình": can Quý, hành Thuỷ.`)
        + anh("ngu-hanh-bat-tu-vi-du.webp")
        + P(`${L("/bat-tu", "Công cụ Bát tự")} của Hiểu Bản Thân chấm năm hành trên cả bốn trụ (can lộ và can tàng trong chi, theo trọng số công bố): Kim 2,9, Thuỷ 2,4, Thổ 1,8, Hoả 1,6, Mộc 0,3. Kim nhiều nhất lại sinh cho Thuỷ, nên nhật chủ Quý Thuỷ được xếp là thân vượng; theo cách cân sức, hành cần thêm là Mộc, Hoả, Thổ. Cách thứ hai, dựa vào tháng sinh, có thể cho kết quả khác. Công cụ hiện cả hai cách và không tự chọn thay người xem.`),
    }],
    ket: P(`Xem năm hành trong lá số của bạn bằng ${L("/bat-tu", "công cụ Bát tự")}: máy vẽ cột điểm từng hành, nêu hành cần thêm theo cả hai cách. Chỉ cần biết mệnh theo năm sinh thì tra ${L("/bat-tu/menh-theo-nam", "sinh năm nào mệnh gì")}.`),
  },
  {
    slug: "cach-tinh-than-so-hoc-tu-ngay-sinh-va-ho-ten",
    bia: { ten_tep: "bia-cach-tinh-than-so.webp", alt: "Ảnh bìa: cách tính thần số học từ ngày sinh và họ tên — bốn con số 6, 9, 9, 9 của ví dụ Nguyễn Minh Anh, 24/10/1988" },
    chen: [{
      cuoiMuc: "Bước 4: Tính chỉ số tên bằng bảng chữ cái",
      html: `<h3>Tên tiếng Việt: ba điều cần chốt trước khi tính</h3>`
        + `<ul><li>Bỏ dấu trước khi đổi chữ ra số: "Nguyễn" tính như NGUYEN.</li><li>Chữ Đ tính như D (số 4).</li><li>Chữ Y tính là phụ âm, theo cách công cụ thần số của Hiểu Bản Thân đang dùng.</li></ul>`
        + P(`Ví dụ Nguyễn Minh Anh: cộng mọi chữ được 72, rút gọn ra 9 (Sứ mệnh); các nguyên âm U, E, I, A cộng được 18, ra 9 (Linh hồn); các phụ âm cộng được 54, ra 9 (Nhân cách). Ba chỉ số trùng nhau là chuyện có thể gặp, không phải lỗi tính.`),
    }],
    ket: P(`${L("/than-so", "Tra cứu thần số học miễn phí")}: nhập họ tên và ngày sinh, máy tính đủ bốn con số chính, mở "Xem cách tính" để soát từng phép cộng, rồi cho bạn tự tích ba điểm mạnh và ba điểm mù nào đúng với mình.`),
  },
  {
    slug: "xem-hop-doi-theo-ngay-sinh-doc-sao-cho-tinh-tao",
    bia: { ten_tep: "bia-hop-doi.webp", alt: "Ảnh bìa: xem hợp đôi theo ngày sinh, hai vòng tròn số 6 và số 9 giao nhau — thần số không chấm điểm, Tử vi có điểm tham khảo" },
    chen: [{
      cuoiMuc: "Chọn cách xem tình yêu theo điều bạn thực sự muốn hiểu",
      html: `<h3>Hai cách xem hai người trên Hiểu Bản Thân khác nhau ở đâu?</h3>`
        + P(`${L("/hop-doi", "Xem hợp đôi theo thần số")} đặt các con số của hai người cạnh nhau và gợi ý theo đúng quan hệ bạn chọn (người yêu, bạn bè, đồng nghiệp, sếp, gia đình), nhưng không chấm điểm. ${L("/tu-vi#hop-tham", "Xem lá số 2 người")} trong Tử vi thì có điểm tham khảo từ 0 đến 100, cộng từ năm tiêu chí có trọng số công khai: mệnh nạp âm 20, can năm 15, chi năm 20, cung phi 15, và tứ hoá của người kia rơi vào cung trọng tâm của quan hệ 30.`)
        + P(`Điểm đó là một con số để hai người cùng xem và bàn, kèm câu gợi ý việc nên làm cho từng tiêu chí. Nó không phải lời khuyên nên hay không nên ở bên nhau.`),
    }],
    ket: P(`Muốn xem cho hai người, mở ${L("/hop-doi", "xem hợp đôi theo ngày sinh")} rồi gửi link mời để người ấy tự nhập ngày sinh của họ. Một bài đọc tương hợp chỉ có ích khi cả hai cùng biết và cùng muốn đọc.`),
    hoiDapThem: [
      { cau_hoi: "Không biết giờ sinh của người kia thì xem được không?", tra_loi: "Hợp đôi theo thần số chỉ cần họ tên và ngày sinh. Phần Xem lá số 2 người trong Tử vi cần lá số đầy đủ của bạn; người kia có năm sinh và giới tính là chấm được, có đủ ngày giờ sinh thì xét thêm chiều ngược lại." },
    ],
  },
  {
    slug: "xem-hop-sep-dong-nghiep-dung-the-nao-cho-huu-ich",
    bia: { ten_tep: "bia-hop-sep.webp", alt: "Ảnh bìa: xem hợp sếp, đồng nghiệp để hiểu cách làm việc khác nhau, hai vòng tròn Bạn và Sếp giao nhau" },
    chen: [{
      cuoiMuc: "Giới hạn của thần số học và các cách xem tương hợp",
      html: P(`Trên Hiểu Bản Thân, ${L("/hop-doi", "công cụ hợp đôi")} có lựa chọn quan hệ "sếp" và "đồng nghiệp": lời gợi ý đổi theo quan hệ, không chấm điểm. Hệ thống cũng không trả lời những câu như "nên tuyển ai", "nhân viên tuổi nào hợp tôi". Chọn người làm việc cần năng lực và cách làm việc thật, không cần ngày sinh.`),
    }],
    ket: P(`Muốn hiểu nhịp làm việc của mình trước khi nghĩ tới người khác, xem ${L("/than-so/nghe-nghiep", "nghề hợp theo con số")} hoặc mở ${L("/hop-doi", "xem hợp đôi")} với quan hệ "đồng nghiệp". Đọc xong, chọn một việc cụ thể để thử trong tuần, ví dụ thống nhất cách góp ý bằng văn bản.`),
  },
  {
    slug: "kinh-dich-huyen-khong-hay-bat-tu-viec-nao-hoi-mon-nao",
    bia: { ten_tep: "bia-chon-mon.webp", alt: "Ảnh bìa: Kinh Dịch, Huyền Không hay Bát tự — việc nào nên hỏi môn nào, hai quẻ Thái và Bĩ đối nhau" },
    ket: P(`Ba môn đều có công cụ trên Hiểu Bản Thân: ${L("/kinh-dich", "gieo quẻ Kinh Dịch")} cho một việc cụ thể (máy gieo, tự gieo xu, hoặc Mai Hoa theo giờ), ${L("/phong-thuy", "phong thuỷ nhà ở")} cho căn nhà (Bát trạch theo tuổi và sao bay Huyền Không theo năm, tháng), ${L("/bat-tu", "lá số Bát tự")} cho con người và các giai đoạn đời (dụng thần luôn nêu hai cách). Trang ${L("/huyen-hoc", "Huyền học")} xếp bảy môn theo câu hỏi bạn đang có.`),
  },
  {
    slug: "xem-tai-loc-doc-van-tien-bac-va-bien-goi-y-thanh-ke-hoach-thuc-te",
    bia: { ten_tep: "bia-tai-loc.webp", alt: "Ảnh bìa: xem tài lộc rồi làm gì với tiền — bậc thang ghi chép, giữ, dự phòng, tăng thu" },
    ket: P(`Lá số Tử vi và Bát tự trên Hiểu Bản Thân nói về tiền bạc theo kiểu "năm nào nên chú ý tiền bạc hơn", tính từ chính dòng vận hạn của lá số, kèm việc cụ thể nên làm. Xem năm đó của bạn ở ${L("/thoi-gian-toi", "thời gian tới")}, rồi đặt vào kế hoạch thật: quỹ dự phòng, khoản vay, khoản chi lớn. Đây không phải lời khuyên đầu tư.`),
  },
  {
    slug: "xem-van-han-cach-doc-dai-han-tu-vi-va-hieu-gioi-han-cua-loi-luan",
    bia: { ten_tep: "bia-van-han.webp", alt: "Ảnh bìa: đọc vận hạn Tử vi cho tỉnh táo — đại hạn 10 năm, lưu niên từng năm và chỗ lời luận dừng lại" },
    ket: P(`Muốn thấy đại hạn trên một lá số thật, đọc ví dụ trong bài ${B("cach-doc-dai-van-la-so-tu-vi-6-buoc-de-luan-co-can-cu", "cách đọc đại vận 6 bước")}. Với lá số của bạn, ${L("/tu-vi", "lập lá số Tử vi")} rồi mở chương "Mười năm tới & điều nên tránh": mỗi năm có mức, năm nên chú ý có việc nên làm, không có lời doạ.`),
  },
  {
    slug: "xem-su-nghiep-dung-than-so-hoc-tu-vi-va-bat-tu-de-soi-huong-di",
    bia: { ten_tep: "bia-su-nghiep.webp", alt: "Ảnh bìa: xem sự nghiệp qua ba môn thần số, Tử vi, Bát tự — bậc thang thử, đo, chọn, đi tiếp" },
    ket: P(`Ba môn trong bài đều xem được miễn phí trên Hiểu Bản Thân: ${L("/than-so/nghe-nghiep", "nghề hợp theo con số")}, cung Quan Lộc trên ${L("/tu-vi", "lá số Tử vi")}, thập thần trên ${L("/bat-tu", "lá số Bát tự")}. Muốn thấy ba môn đặt cạnh nhau, ${L("/chan-dung", "chân dung tổng hợp")} ghi rõ chỗ các môn cùng thấy và chỗ mỗi môn nhìn một mặt.`),
  },
  {
    slug: "ten-theo-ngu-hanh-6-buoc-chon-ten-co-y-nghia-va-de-dung",
    bia: { ten_tep: "bia-ten-ngu-hanh.webp", alt: "Ảnh bìa: đặt tên theo ngũ hành trong 6 bước — nghĩa trước, hành sau, tên dễ gọi và dễ viết" },
    ket: P(`Muốn biết lá số của bé cần thêm hành nào trước khi chọn chữ, lập ${L("/bat-tu", "lá số Bát tự")}: máy chấm năm hành trên bốn trụ và nêu hành cần thêm theo hai cách, không tự chọn thay gia đình. Sau đó quay lại sáu bước trong bài, đặt nghĩa và cách gọi lên trước.`),
  },
  {
    slug: "vong-tron-ngu-hanh-cach-doc-tuong-sinh-va-tuong-khac",
    bia: { ten_tep: "bia-vong-ngu-hanh.webp", alt: "Ảnh bìa: đọc vòng tương sinh, tương khắc của ngũ hành — đường liền là sinh, đường đứt là khắc" },
    ket: P(`Xem vòng ngũ hành áp vào một lá số thật trong bài ${B("ngu-hanh-la-gi-hieu-kim-moc-thuy-hoa-tho-va-cac-moi-quan-he", "ngũ hành là gì")}, hoặc lập ${L("/bat-tu", "lá số Bát tự")} của chính bạn để thấy hành nào nhiều, hành nào thiếu.`),
  },
  {
    slug: "luan-giai-la-so-tu-vi-tron-doi-6-buoc-doc-va-tu-doi-chieu",
    bia: { ten_tep: "bia-tron-doi.webp", alt: "Ảnh bìa: luận lá số Tử vi trọn đời trong 6 bước, tô ba cung tam hợp Mệnh, Quan Lộc, Tài Bạch" },
    ket: P(`${L("/tu-vi", "Lập lá số Tử vi")} rồi mở "Luận giải toàn bộ": 12 chương theo mảng đời (con người, công việc, tiền, tình cảm, gia đình, sức khoẻ…), mỗi hộp có nút "Đúng với mình / Chưa đúng" để bạn tự đối chiếu như bước 5 trong bài.`),
  },
  {
    slug: "self-discovery-tu-hieu-minh-qua-gia-tri-thoi-quen-va-lua-chon",
    bia: { ten_tep: "bia-tu-hieu-minh.webp", alt: "Ảnh bìa: tự hiểu mình qua giá trị và thói quen, bắt đầu từ một tình huống có thật — ghi lại, nhận ra, chọn một việc" },
    ket: P(`Muốn có một câu hỏi tự soi mỗi sáng, trang ${L("/hom-nay", "Hôm nay")} cho bạn ngày cá nhân và một câu hỏi ngắn theo ngày sinh. Đọc xong, ghi một dòng vào sổ: hôm nay mình chọn gì, vì giá trị nào.`),
    hoiDapThem: [
      { cau_hoi: "Thần số học có giúp tự hiểu mình không?", tra_loi: "Có thể làm điểm bắt đầu nếu dùng như danh sách để tự kiểm. Công cụ thần số trên Hiểu Bản Thân đưa ba điểm mạnh và ba điểm mù của số Đường đời để bạn tự tích nét nào đúng; tích được ít thì nó gợi bạn xem số khác của chính mình." },
    ],
  },
  {
    slug: "astrology-la-gi-cach-doc-ban-do-sao-va-hieu-gioi-han-cua-chiem-tinh",
    bia: { ten_tep: "bia-astrology.webp", alt: "Ảnh bìa: astrology là gì, vòng bản đồ sao 12 nhà của chiêm tinh phương Tây" },
    ket: P(`Hiểu Bản Thân chưa có công cụ chiêm tinh phương Tây. Nếu bạn muốn một bản đồ dựng từ ngày giờ sinh theo lối phương Đông, ${L("/tu-vi", "lá số Tử vi")} và ${L("/bat-tu", "lá số Bát tự")} xem được miễn phí; trang ${L("/huyen-hoc", "Huyền học")} so sánh các môn để bạn chọn môn hợp câu hỏi.`),
  },
];
