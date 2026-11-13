// KW-6T (chủ dự án giao 2026-11-11): sửa 24 bài blog đã có theo tab "Bài cũ" của kế hoạch từ khoá 6 tháng
// (docs/KE-HOACH-TU-KHOA-SEO-6-THANG.md mục 5). Hàm thuần cho thân bài Lexical + kế hoạch từng bài + hàm áp dụng (Local API).
// - Gộp 3 cặp trùng từ khoá: bài phụ thôi xuất bản, slug của nó vào slug_cu bài chính → web 308 (như BLOG-9d).
// - Sửa tiêu đề nhồi từ khoá (3 bài), đổi slug (slug cũ tự vào slug_cu), vẽ lại ảnh bìa + ảnh minh hoạ có in tiêu đề.
// - Mọi bài: link "Hiểu Bản Thân" về trang chủ → trang công cụ đúng mảng; đoạn "Đọc tiếp" trỏ trang kiến thức + bài cùng cụm;
//   bài liên quan; từ khoá chính không trùng nhau giữa các bài.
// Không viết lại lời luận; chỉ thêm đoạn có dữ kiện của site (âm lịch Việt / Trung, hai cách cộng đường đời…).
import type { Payload, PayloadRequest } from "payload";
import { htmlSangKhoi } from "./html-lexical.ts";
import { veAnhBia, veAnhCauHoi, veAnhLoTrinh, veAnhTomTat, type MangAnh } from "./anh-minh-hoa.ts";

export const DAU_KW6T = "KW-6T";
const NGUON_ANH = "Ban biên tập Hiểu Bản Thân vẽ minh hoạ (BLOG-7, nền sáng)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Nut = { type: string; children?: Nut[]; [k: string]: any };
export type Goc = { url: string; chu: string };

export type Ke = {
  slug: string;
  dat?: Record<string, unknown>;
  slugMoi?: string;
  tuKhoaChinh?: string;
  phuThem?: string[];
  thayChu?: [string, string][];
  goc?: Goc;
  chen?: { cuoiMuc: string; html: string }[];
  themCuoi?: string;
  hoiDapThem?: { cau_hoi: string; tra_loi: string }[];
  hoiDapThay?: [string, string][];
  nguonThem?: { ten: string; url?: string }[];
  lienQuan?: string[];
  veAnh?: boolean;
  gopVao?: string;
};

// ---------- hàm thuần trên Lexical ----------

export const chuCua = (n: Nut): string => (n.type === "text" ? String(n.text ?? "") : (n.children ?? []).map(chuCua).join(""));

/** Thay chữ trong mọi nút text (cả tiêu đề mục, danh sách, link). Chỉ thay trong cùng một nút text. */
export function thayChuNut(n: Nut, cap: [string, string][]): void {
  if (n.type === "text" && typeof n.text === "string") {
    for (const [a, b] of cap) n.text = n.text.split(a).join(b);
  }
  for (const c of n.children ?? []) thayChuNut(c, cap);
}

const LA_GOC = /^https?:\/\/(www\.)?hieuban\.com\/?$/i;

/** Link về trang chủ (chữ "Hiểu Bản Thân", "hieuban.com") → trang công cụ đúng mảng, chữ liên kết nói rõ công cụ. */
export function thayLinkGoc(n: Nut, goc: Goc): number {
  let dem = 0;
  if (n.type === "link" && LA_GOC.test(String(n.fields?.url ?? ""))) {
    n.fields = { ...n.fields, url: goc.url };
    const chu = chuCua(n).trim();
    if (/^(hiểu bản thân|hieuban\.com)$/i.test(chu)) {
      const dau = (n.children ?? []).find((c) => c.type === "text");
      n.children = [{ ...(dau ?? { type: "text", detail: 0, format: 0, mode: "normal", style: "", version: 1 }), text: goc.chu }];
    }
    dem++;
  }
  for (const c of n.children ?? []) dem += thayLinkGoc(c, goc);
  return dem;
}

const capDo = (n: Nut) => (n.type === "heading" ? Number(String(n.tag ?? "h2").slice(1)) : 99);

/** Chèn khối vào CUỐI mục có tiêu đề `tieuDe` (trước tiêu đề cùng cấp / cấp cao hơn kế tiếp, lùi qua ảnh đứng sát). */
export function chenCuoiMuc(ds: Nut[], tieuDe: string, khoi: Nut[]): boolean {
  const i = ds.findIndex((n) => n.type === "heading" && chuCua(n).trim() === tieuDe.trim());
  if (i < 0) return false;
  const cap = capDo(ds[i]!);
  let j = ds.findIndex((n, k) => k > i && capDo(n) <= cap);
  if (j < 0) j = ds.length;
  while (j - 1 > i && ds[j - 1]!.type === "upload") j--;
  ds.splice(j, 0, ...khoi);
  return true;
}

export const khoiTuHtml = (html: string): Nut[] => htmlSangKhoi(html).filter((k) => k.type !== "__anh") as Nut[];

export type KetQuaThan = { noi_dung: { root: Nut }; loi: string[] };

/** Áp phần thân bài của kế hoạch (không chạm DB). Trả lỗi cho mục không tìm thấy chỗ chèn. */
export function apThan(noiDung: { root: Nut }, ke: Ke): KetQuaThan {
  const nd = JSON.parse(JSON.stringify(noiDung)) as { root: Nut };
  const ds = nd.root.children ?? (nd.root.children = []);
  const loi: string[] = [];
  if (ke.thayChu?.length) thayChuNut(nd.root, ke.thayChu);
  if (ke.goc) thayLinkGoc(nd.root, ke.goc);
  for (const c of ke.chen ?? []) {
    if (!chenCuoiMuc(ds, c.cuoiMuc, khoiTuHtml(c.html))) loi.push(`không thấy mục "${c.cuoiMuc}"`);
  }
  if (ke.themCuoi) ds.push(...khoiTuHtml(ke.themCuoi));
  return { noi_dung: nd, loi };
}

const boTrung = (ds: string[]) => [...new Set(ds.map((s) => s.trim()).filter(Boolean))];

/** Phần trường (không gồm thân bài, ảnh, liên quan) của bản mới. */
export function apTruong(bai: Record<string, any>, ke: Ke): Record<string, unknown> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const data: Record<string, unknown> = { ...(ke.dat ?? {}) };
  if (ke.dat?.meta) data.meta = { ...(bai.meta ?? {}), ...(ke.dat.meta as object) };
  for (const k of ["tra_loi_nhanh", "mo_ta_ngan"] as const) {
    if (ke.thayChu?.length && data[k] === undefined && typeof bai[k] === "string") {
      let s = bai[k] as string;
      for (const [a, b] of ke.thayChu) s = s.split(a).join(b);
      if (s !== bai[k]) data[k] = s;
    }
  }
  if (ke.tuKhoaChinh) data.tu_khoa_chinh = ke.tuKhoaChinh;
  if (ke.phuThem?.length) data.tu_khoa_phu = boTrung([...(bai.tu_khoa_phu ?? []), ...ke.phuThem]).slice(0, 10);
  if (ke.slugMoi) { data.slug = ke.slugMoi; data.generateSlug = false; }
  if (ke.hoiDapThem?.length || ke.hoiDapThay?.length) {
    let hd = ((bai.hoi_dap ?? []) as { cau_hoi: string; tra_loi: string }[]).map(({ cau_hoi, tra_loi }) => ({ cau_hoi, tra_loi }));
    for (const [a, b] of ke.hoiDapThay ?? []) hd = hd.map((h) => (h.cau_hoi === a ? { ...h, cau_hoi: b } : h));
    const co = new Set(hd.map((h) => h.cau_hoi));
    for (const h of ke.hoiDapThem ?? []) if (!co.has(h.cau_hoi)) hd.push(h);
    data.hoi_dap = hd.slice(0, 10);
  }
  if (ke.nguonThem?.length) {
    const ng = ((bai.nguon ?? []) as { ten: string; url?: string | null }[]).map(({ ten, url }) => ({ ten, url: url ?? null }));
    const co = new Set(ng.map((n) => n.ten));
    for (const n of ke.nguonThem) if (!co.has(n.ten)) ng.push({ ten: n.ten, url: n.url ?? null });
    data.nguon = ng.slice(0, 12);
  }
  const ghi = `${DAU_KW6T} ${new Date().toISOString().slice(0, 10)}: máy sửa theo kế hoạch từ khoá 6 tháng (tab "Bài cũ") — `
    + "link về công cụ đúng mảng, đoạn đọc tiếp, bài liên quan" + (ke.gopVao ? `; gộp vào /blog/${ke.gopVao}` : "")
    + (ke.slugMoi ? "; đổi tiêu đề + đường dẫn (đường cũ chuyển hướng 308)" : "") + ". Chủ biên đọc lại khi rảnh.";
  data.ghi_chu_duyet = [ghi, bai.ghi_chu_duyet ?? ""].filter(Boolean).join("\n").slice(0, 2000);
  return data;
}

// ---------- kế hoạch ----------

const G = {
  than_so: { url: "/than-so", chu: "tra cứu thần số học miễn phí" },
  tu_vi: { url: "/tu-vi", chu: "lập lá số Tử vi miễn phí" },
  bat_tu: { url: "/bat-tu", chu: "xem lá số Bát tự" },
  kinh_dich: { url: "/kinh-dich", chu: "gieo quẻ Kinh Dịch" },
  phong_thuy: { url: "/phong-thuy", chu: "xem hướng nhà hợp tuổi" },
  chung: { url: "/huyen-hoc", chu: "bảy môn huyền học trên Hiểu Bản Thân" },
} satisfies Record<string, Goc>;

const B = (slug: string, chu: string) => `<a href="/blog/${slug}">${chu}</a>`;
const docTiep = (...ds: string[]) => `<p><strong>Đọc tiếp:</strong> ${ds.join(" · ")}.</p>`;

const S = {
  tvLaGi: "tu-vi-la-gi-cau-truc-la-so-cach-doc-va-gioi-han",
  tvLySo: "tu-vi-ly-so-la-gi-cach-hieu-la-so-va-kiem-tra-du-lieu-sinh",
  tvCachXem: "cach-xem-tu-vi-lap-la-so-va-doc-12-cung-tung-buoc",
  tvTronDoi: "luan-giai-la-so-tu-vi-tron-doi-6-buoc-doc-va-tu-doi-chieu",
  tvVanHan: "xem-van-han-cach-doc-dai-han-tu-vi-va-hieu-gioi-han-cua-loi-luan",
  tsLaGi: "than-so-hoc-la-gi",
  tsCachTinh: "cach-tinh-than-so-hoc-tu-ngay-sinh-va-ho-ten",
  tsNumerology: "xem-than-so-hoc-numerology-cach-tinh-va-doc-ho-so-tinh-tao",
  btLaGi: "bat-tu-la-gi-cach-doc-tu-tru",
  nhLaGi: "ngu-hanh-la-gi-hieu-kim-moc-thuy-hoa-tho-va-cac-moi-quan-he",
  nhVong: "vong-tron-ngu-hanh-cach-doc-tuong-sinh-va-tuong-khac",
  tenNH: "ten-theo-ngu-hanh-6-buoc-chon-ten-co-y-nghia-va-de-dung",
  ptHuong: "cach-xem-huong-nha-hop-tuoi",
  ptTheoTuoi: "phong-thuy-nha-o-theo-tuoi-cach-tinh-huong-va-doi-chieu-can-nha",
  ptTuDanhGia: "xem-phong-thuy-cach-tu-danh-gia-nha-o-va-chon-viec-nen-uu-tien",
  kdGieo: "cach-gieo-que-kinh-dich-bang-3-dong-xu",
  kdMaiHoa: "que-kinh-dich-mai-hoa-cach-lap-que-va-luan-que-co-can-cu",
  chonMon: "xem-kinh-dich-huyen-khong-phi-tinh-bat-tu-chon-dung-phuong-phap-truy-van",
  chonMonMoi: "kinh-dich-huyen-khong-hay-bat-tu-viec-nao-hoi-mon-nao",
  hopDoi: "xem-hop-doi-xem-tinh-yeu-boi-tinh-yeu-boi-nguoi-do-doc-sao-cho-tinh-tao",
  hopDoiMoi: "xem-hop-doi-theo-ngay-sinh-doc-sao-cho-tinh-tao",
  hopSep: "xem-boi-dong-nghiep-xem-boi-sep-xem-hop-sep-dung-the-nao-cho-huu-ich",
  hopSepMoi: "xem-hop-sep-dong-nghiep-dung-the-nao-cho-huu-ich",
  taiLoc: "xem-tai-loc-doc-van-tien-bac-va-bien-goi-y-thanh-ke-hoach-thuc-te",
  suNghiep: "xem-su-nghiep-dung-than-so-hoc-tu-vi-va-bat-tu-de-soi-huong-di",
  astrology: "astrology-la-gi-cach-doc-ban-do-sao-va-hieu-gioi-han-cua-chiem-tinh",
  selfDiscovery: "self-discovery-tu-hieu-minh-qua-gia-tri-thoi-quen-va-lua-chon",
} as const;

export const KE_HOACH: Ke[] = [
  // ----- 1. Gộp "Tử vi lý số" vào "Tử vi là gì" -----
  { slug: S.tvLySo, gopVao: S.tvLaGi },
  {
    slug: S.tvLaGi, goc: G.tu_vi, tuKhoaChinh: "tử vi là gì", phuThem: ["tử vi lý số", "lá số tử vi", "âm lịch việt nam"],
    chen: [
      { cuoiMuc: "Tử Vi Là Gì và lá số biểu diễn điều gì?", html: `<h3>Tử vi lý số là gì?</h3>
<p>"Lý số" là tên gọi chung cho các môn dùng quy tắc, biểu tượng và phép tính để luận về người và việc. Tử vi lý số là cách lập và luận lá số Tử Vi Đẩu Số theo quy tắc truyền thống. Các môn khác trong nhóm có khung riêng, không thay cho nhau:</p>
<ul><li>Tử vi: đọc 12 cung, các sao và quan hệ giữa chúng.</li><li>Bát tự: đọc bốn trụ năm, tháng, ngày, giờ và cán cân ngũ hành.</li><li>Kinh Dịch: lập quẻ để suy xét một việc cụ thể.</li><li>Thần số học: tính con số từ ngày sinh và họ tên.</li></ul>` },
      { cuoiMuc: "Ngày giờ sinh ảnh hưởng đến việc lập lá số ra sao?", html: `<h3>Âm lịch Việt Nam và lịch Trung Quốc có thể lệch nhau</h3>
<p>Âm lịch Việt Nam tính theo giờ Hà Nội (UTC+7), lịch Trung Quốc tính theo giờ Bắc Kinh (UTC+8). Khi trăng mới rơi sát nửa đêm, hai lịch có thể bắt đầu tháng âm lệch nhau một ngày. Năm 1985, hai nước còn đón Tết Ất Sửu cách nhau một tháng.</p>
<p>Người sinh đúng những ngày ấy có thể ra ngày âm, đôi khi cả tháng âm, khác nhau giữa hai lịch, và lá số cũng khác theo. Người sinh ở miền Nam từ năm 1960 đến giữa năm 1975 thì lịch thời đó tính theo UTC+8. Công cụ <a href="/tu-vi">lập lá số Tử vi</a> của Hiểu Bản Thân mặc định dùng âm lịch Việt Nam và báo cho bạn khi ngày sinh rơi vào chỗ hai lịch lệch nhau.</p>` },
      { cuoiMuc: "Khi giờ sinh chưa chắc chắn", html: `<p>Nếu hoàn toàn không biết giờ sinh, công cụ Tử vi cho chọn "Không biết giờ" và có phần thử định giờ: bạn chọn vài năm đã có chuyện lớn, máy so các canh giờ gần nhau để bạn tự xem canh nào khớp hơn.</p>` },
    ],
    themCuoi: docTiep(B(S.tvCachXem, "cách xem Tử vi từng bước"), B(S.tvTronDoi, "luận giải lá số trọn đời"),
      `<a href="/tu-vi/chinh-tinh">14 chính tinh</a>`, `<a href="/tu-vi/cung">ý nghĩa 12 cung</a>`),
    hoiDapThem: [
      { cau_hoi: "Tử vi lý số là gì?", tra_loi: "Là cách lập và luận lá số Tử Vi Đẩu Số theo quy tắc truyền thống. \"Lý số\" là tên chung cho các môn dùng quy tắc và phép tính để luận về người và việc, gồm cả Bát tự, Kinh Dịch, phong thuỷ." },
      { cau_hoi: "Vì sao lá số Tử vi ở mỗi trang một khác?", tra_loi: "Thường do khác lịch (âm lịch Việt Nam UTC+7 hay lịch Trung Quốc UTC+8), khác cách xử lý giờ Tý muộn hoặc khác trường phái an sao. Hãy so ngày âm và giờ đã nhập trước khi so lời luận." },
    ],
    lienQuan: [S.tvCachXem, S.tvTronDoi, S.tvVanHan],
  },
  // ----- 2. Gộp "Phong thuỷ nhà ở theo tuổi" vào "Cách xem hướng nhà hợp tuổi" -----
  { slug: S.ptTheoTuoi, gopVao: S.ptHuong },
  {
    slug: S.ptHuong, tuKhoaChinh: "hướng nhà hợp tuổi", phuThem: ["phong thuỷ nhà ở theo tuổi", "cung phi", "hướng cửa chính"],
    chen: [
      { cuoiMuc: "Cách đo hướng nhà bằng la bàn điện thoại", html: `<h3>Đo hướng cửa, mặt nhà hay ban công?</h3>
<p>Trước khi tra tuổi, hãy chốt mình đang hỏi về cái gì: hướng cửa chính, hướng mặt nhà hay một chỗ cụ thể như đầu giường, bàn làm việc. Đây không phải lúc nào cũng là một hướng. Căn hộ có cửa chính và ban công quay về hai phía khác nhau thì đừng lấy kết quả của một phía áp cho cả căn.</p>
<p>Ghi lại quy ước mình dùng và giữ nguyên khi so. Hai nguồn cho kết quả khác nhau thì kiểm định nghĩa "hướng nhà" và mốc năm tính tuổi trước, rồi mới nghĩ tới chuyện tuổi bạn "khác".</p>` },
      { cuoiMuc: "Nhà không hợp tuổi thì làm gì?", html: `<table><thead><tr><th>Kết quả</th><th>Việc nên làm tiếp</th><th>Không nên kết luận</th></tr></thead><tbody>
<tr><td>Hướng hợp tuổi, nhà ở thoải mái</td><td>Ghi lại cách tính; chăm sáng, gió, gọn gàng</td><td>Nhà chắc chắn mang lại điều tốt</td></tr>
<tr><td>Hướng chưa hợp, chưa thấy bất tiện</td><td>Giữ làm thông tin tham khảo; kê giường, bàn theo hướng hợp</td><td>Phải chuyển nhà hay đập sửa</td></tr>
<tr><td>Hướng chưa hợp, nhà bí, tối, ẩm</td><td>Sửa thông gió, ánh sáng trước; nhờ thợ có chuyên môn khi đụng tới kết cấu, điện, gas</td><td>Hướng là nguyên nhân duy nhất</td></tr>
</tbody></table>` },
    ],
    themCuoi: docTiep(B(S.ptTuDanhGia, "tự đánh giá nhà ở"), `<a href="/phong-thuy/huong-hop-tuoi">hướng hợp từng tuổi</a>`,
      `<a href="/phong-thuy/dau-hieu">dấu hiệu trong nhà nên để ý</a>`),
    hoiDapThem: [{ cau_hoi: "Nên đo hướng cửa chính hay hướng ban công?", tra_loi: "Nhà phố thường đo theo cửa chính, đứng ở cửa quay lưng vào nhà. Chung cư thường đo ở ban công hoặc cửa sổ lớn. Quan trọng là chọn một quy ước, ghi lại và giữ nguyên khi so với bảng hướng." }],
    lienQuan: [S.ptTuDanhGia, S.tenNH],
  },
  // ----- 3. Gộp "Xem thần số học, numerology" vào "Cách tính thần số học" -----
  { slug: S.tsNumerology, gopVao: S.tsCachTinh },
  {
    slug: S.tsCachTinh, goc: G.than_so, tuKhoaChinh: "cách tính thần số học", phuThem: ["xem thần số học", "numerology", "số chủ đạo"],
    chen: [
      { cuoiMuc: "Bước 3: Tính số chủ đạo từ ngày sinh", html: `<h3>Khi hai cách cộng ra hai số khác nhau: ví dụ 24/10/1988</h3>
<p>Với ngày 14/09/1998, hai cách cộng cùng ra 5. Nhưng không phải ngày nào cũng vậy. Lấy ngày 24/10/1988:</p>
<ul><li>Cộng hết một lượt: 2 + 4 + 1 + 0 + 1 + 9 + 8 + 8 = 33. Đây là số bậc thầy nên giữ 33.</li><li>Rút gọn từng phần: ngày 24 → 6, tháng 10 → 1, năm 1988 → 26 → 8. Cộng 6 + 1 + 8 = 15 → 6.</li></ul>
<p>Hai kết quả đều đúng phép tính, chỉ khác quy ước. Trên <a href="/than-so">trang thần số học</a>, Hiểu Bản Thân mặc định cách "Rút gọn con số" (từng phần) và cho đổi sang cách cộng hết, đồng thời báo khi hai cách ra hai số khác nhau.</p>` },
      { cuoiMuc: "Bước 5: Rà soát kết quả trước khi diễn giải", html: `<h3>Sau khi tính: đọc ý nghĩa bằng cách đối chiếu trải nghiệm</h3>
<p>Một hồ sơ thần số học thường có nhiều nhận xét về xu hướng và thử thách. Đọc từng ý theo ba bước:</p>
<ul><li>Viết lại cho trung tính: "luôn thích làm một mình" thành "đôi khi cần thời gian một mình để nghĩ".</li><li>Tìm ví dụ hai chiều: một lần đúng và một lần không đúng với bạn.</li><li>Chọn một điều quan sát được trong tuần tới, ghi lại.</li></ul>
<p>Mô tả chung chung dễ khiến ai đọc cũng thấy "đúng mình" (hiệu ứng Barnum). Vì vậy trang thần số học của Hiểu Bản Thân có thẻ để bạn tự tích ba điểm mạnh và ba điểm mù nào đúng, thay vì nhận cả gói.</p>` },
    ],
    themCuoi: docTiep(B(S.tsLaGi, "thần số học là gì"), `<a href="/than-so/y-nghia-so">ý nghĩa các con số</a>`,
      `<a href="/than-so/nam-ca-nhan">năm cá nhân</a>`),
    hoiDapThem: [
      { cau_hoi: "Numerology là gì?", tra_loi: "Numerology là tên tiếng Anh của thần số học: cách gán ý nghĩa cho con số rút ra từ ngày sinh và họ tên. Ở Việt Nam phổ biến nhất là trường phái Pitago." },
      { cau_hoi: "Ngày 24/10/1988 là số chủ đạo 33 hay 6?", tra_loi: "Cộng hết một lượt ra 33, rút gọn từng phần ra 6. Cả hai đúng phép tính, khác quy ước. Hãy ghi rõ mình dùng cách nào khi so với nơi khác." },
    ],
    nguonThem: [{ ten: "Encyclopaedia Britannica – Barnum effect", url: "https://www.britannica.com/science/Barnum-Effect" }],
    lienQuan: [S.tsLaGi, S.selfDiscovery, S.suNghiep],
  },
  // ----- 4. Sửa tiêu đề "Xem hợp đôi…" -----
  {
    slug: S.hopDoi, slugMoi: S.hopDoiMoi, veAnh: true, goc: { url: "/hop-doi", chu: "xem hợp đôi theo ngày sinh" },
    tuKhoaChinh: "xem hợp đôi", phuThem: ["xem tình yêu", "bói tình yêu", "hợp tuổi"],
    dat: {
      tieu_de: "Xem hợp đôi theo ngày sinh: đọc sao cho tỉnh táo",
      mo_ta_ngan: "Xem hợp đôi, xem tình yêu theo ngày sinh: bài đọc tương hợp trả lời được gì, không trả lời được gì, và cách biến kết quả thành câu hỏi để hai người cùng nói chuyện.",
      meta: { title: "Xem hợp đôi theo ngày sinh: đọc sao cho tỉnh táo",
        description: "Xem hợp đôi theo ngày sinh trả lời được gì, không trả lời được gì? Cách đọc bài tương hợp như gợi ý trò chuyện, không phải lời phán cho hai người." },
    },
    thayChu: [
      // Đoạn mở đầu tách ba nút chữ (giữa in đậm) → thay từng nút.
      ["Nếu bạn đang tìm ", ""],
      ["xem hợp đôi, xem tình yêu, bói tình yêu, bói người đó", "Xem hợp đôi, xem tình yêu theo ngày sinh"],
      [", câu trả lời thẳng là: một bài đọc", ": một bài đọc"],
      ["“Bói người đó” không đồng nghĩa đọc được suy nghĩ", "Không bài đọc nào biết được người kia đang nghĩ gì"],
      ["Ranh giới dữ liệu và sự đồng thuận khi “bói người đó”", "Ranh giới dữ liệu và sự đồng thuận khi xem về người kia"],
      ["Nên làm gì sau khi xem bói tình yêu?", "Nên làm gì sau khi xem hợp đôi?"],
      ["bài bói không xác minh được điều đó", "bài đọc không xác minh được điều đó"],
    ],
    hoiDapThay: [["Nên làm gì sau khi xem bói tình yêu?", "Nên làm gì sau khi xem hợp đôi?"]],
    themCuoi: docTiep(`<a href="/hop-doi/cap-so">các cặp số chủ đạo</a>`, `<a href="/tu-vi#hop-tham">xem lá số Tử vi của hai người</a>`,
      B(S.hopSepMoi, "xem hợp sếp, đồng nghiệp")),
    lienQuan: [S.hopSepMoi, S.tsLaGi, S.nhVong],
  },
  // ----- 5. Sửa tiêu đề "Xem bói đồng nghiệp, xem bói sếp…" -----
  {
    slug: S.hopSep, slugMoi: S.hopSepMoi, veAnh: true, goc: G.than_so, tuKhoaChinh: "xem hợp sếp",
    phuThem: ["hợp đồng nghiệp", "xem bói sếp", "giao tiếp công sở"],
    dat: {
      tieu_de: "Xem hợp sếp, đồng nghiệp: dùng thế nào cho hữu ích?",
      mo_ta_ngan: "Xem hợp sếp, hợp đồng nghiệp để hiểu phản ứng của chính mình và điểm cần thống nhất trong công việc, rồi phối hợp dựa trên hành vi thực tế.",
      meta: { title: "Xem hợp sếp, đồng nghiệp: dùng thế nào cho hữu ích?",
        description: "Xem hợp sếp, đồng nghiệp theo thần số học hay lá số: dùng để hiểu cách mình phản ứng, không để dán nhãn người khác. Cách đổi lời đọc thành việc làm ở chỗ làm." },
    },
    thayChu: [
      ["Xem bói đồng nghiệp, xem bói sếp, xem hợp sếp", "Xem hợp sếp, hợp đồng nghiệp"],
      ["Một bài xem bói không thể thay thế", "Một bài đọc tương hợp không thể thay thế"],
      ["Xem bói sếp: tách phong cách cá nhân khỏi kỳ vọng công việc", "Xem hợp sếp: tách phong cách cá nhân khỏi kỳ vọng công việc"],
      ["Xem bói đồng nghiệp: xử lý khác biệt bằng hành vi quan sát được", "Xem hợp đồng nghiệp: xử lý khác biệt bằng hành vi quan sát được"],
      ["hãy dùng xem bói như một lời gợi mở", "hãy dùng bài đọc tương hợp như một lời gợi mở"],
    ],
    chen: [{ cuoiMuc: "Giới hạn của thần số học và các cách xem tương hợp", html: `<p>Một ranh giới cần giữ: không dùng con số hay lá số để chọn, loại hay đánh giá nhân viên. Tuyển dụng và đánh giá cần tiêu chí công việc và quy trình nhân sự rõ ràng, áp dụng như nhau cho mọi người.</p>` }],
    themCuoi: docTiep(`<a href="/tu-vi#hop-tham">xem lá số Tử vi của hai người (đồng nghiệp, sếp)</a>`,
      `<a href="/than-so/nghe-nghiep">nghề hợp theo con số</a>`, B(S.suNghiep, "xem sự nghiệp qua ba môn")),
    lienQuan: [S.hopDoiMoi, S.suNghiep, S.tsLaGi],
  },
  // ----- 6. Sửa tiêu đề "Xem Kinh Dịch, Huyền Không Phi Tinh, Bát Tự…" -----
  {
    slug: S.chonMon, slugMoi: S.chonMonMoi, veAnh: true, goc: G.chung, tuKhoaChinh: "kinh dịch",
    phuThem: ["bát tự", "huyền không phi tinh", "chọn môn huyền học"],
    dat: {
      tieu_de: "Kinh Dịch, Huyền Không hay Bát tự: việc nào nên hỏi môn nào?",
      mang: "chung",
      mo_ta_ngan: "Hỏi một việc cụ thể thì gieo quẻ Kinh Dịch, hỏi về căn nhà thì xem Huyền Không, hỏi về con người và các giai đoạn đời thì đọc Bát tự. Cách chọn đúng môn cho câu hỏi của bạn.",
      meta: { title: "Kinh Dịch, Huyền Không hay Bát tự: hỏi môn nào?",
        description: "Kinh Dịch hợp câu hỏi về một việc, Huyền Không phi tinh hợp câu hỏi về căn nhà, Bát tự hợp câu hỏi về con người và các giai đoạn. Cách chọn môn theo câu hỏi." },
    },
    themCuoi: docTiep(B(S.kdGieo, "cách gieo quẻ bằng 3 đồng xu"), B(S.btLaGi, "Bát tự là gì"), B(S.ptTuDanhGia, "tự đánh giá nhà ở"),
      `<a href="/huyen-hoc">so sánh bảy môn huyền học</a>`),
    lienQuan: [S.kdGieo, S.btLaGi, S.ptTuDanhGia],
  },
  // ----- 7. Phân vai hai bài Tử vi -----
  {
    slug: S.tvTronDoi, goc: G.tu_vi, tuKhoaChinh: "luận giải lá số tử vi trọn đời",
    themCuoi: `<p>Bài này đi sâu vào cách luận cả lá số. Nếu bạn mới bắt đầu và cần biết lá số gồm những phần nào, hãy đọc ${B(S.tvCachXem, "cách xem Tử vi từng bước")} trước.</p>`
      + docTiep(B(S.tvVanHan, "cách đọc đại hạn"), `<a href="/tu-vi/sao-o-cung">sao ở từng cung</a>`, `<a href="/tu-vi/tu-hoa">tứ hoá ở từng cung</a>`),
    lienQuan: [S.tvCachXem, S.tvVanHan, S.tvLaGi],
  },
  {
    slug: S.tvCachXem, goc: G.tu_vi, tuKhoaChinh: "cách xem tử vi",
    dat: { meta: { description: "Cách xem tử vi cho người mới: chuẩn bị ngày giờ sinh, lập lá số, đọc 12 cung và các sao theo từng câu hỏi, kèm ví dụ về công việc." } },
    themCuoi: `<h3>Xem Tử vi năm 2027 trên lá số của bạn</h3>
<p>Muốn biết năm 2027 (Đinh Mùi) nên chú ý gì, hãy nhìn ba lớp theo thứ tự: giai đoạn mười năm đang đi (đại hạn), năm 2027 trên lá số (lưu niên) rồi tới từng tháng. Trang <a href="/thoi-gian-toi">thời gian tới của bạn</a> ghép sẵn ba lớp này, còn <a href="/nam/2027">năm 2027</a> có phần chung theo tuổi.</p>
<p>Đã nắm cách đọc 12 cung và muốn luận cả lá số, hãy đọc tiếp ${B(S.tvTronDoi, "luận giải lá số Tử vi trọn đời")}.</p>`
      + docTiep(B(S.tvLaGi, "Tử vi là gì"), `<a href="/tu-vi/cung">ý nghĩa 12 cung</a>`, `<a href="/tu-vi/chinh-tinh">14 chính tinh</a>`),
    lienQuan: [S.tvLaGi, S.tvTronDoi, S.tvVanHan],
  },
  // ----- 8. Phân vai hai bài ngũ hành -----
  {
    slug: S.nhVong, goc: G.bat_tu, tuKhoaChinh: "vòng tròn ngũ hành", phuThem: ["tương sinh tương khắc"], dat: { mang: "bat_tu" },
    themCuoi: `<p>Bài này tập trung vào cách đọc hai vòng sinh, khắc. Muốn biết từng hành Kim, Mộc, Thuỷ, Hoả, Thổ là gì, hãy đọc ${B(S.nhLaGi, "ngũ hành là gì")}.</p>`
      + docTiep(`<a href="/bat-tu/menh-theo-nam">sinh năm nào mệnh gì</a>`, B(S.tenNH, "đặt tên theo ngũ hành"), B(S.btLaGi, "Bát tự là gì")),
    lienQuan: [S.nhLaGi, S.btLaGi, S.tenNH],
  },
  {
    slug: S.nhLaGi, goc: G.bat_tu, tuKhoaChinh: "ngũ hành là gì",
    themCuoi: `<p>Muốn xem cách các hành sinh nhau, chế ước nhau trên một vòng, đọc tiếp ${B(S.nhVong, "vòng tương sinh, tương khắc")}.</p>`
      + docTiep(`<a href="/bat-tu/menh-theo-nam">sinh năm nào mệnh gì</a>`, `<a href="/bat-tu/nhat-chu">10 nhật chủ</a>`, B(S.btLaGi, "Bát tự là gì")),
    lienQuan: [S.nhVong, S.btLaGi, S.tenNH],
  },
  // ----- 9. Cập nhật còn lại: link đúng mảng, đọc tiếp, liên quan -----
  {
    slug: S.tsLaGi, goc: G.than_so,
    themCuoi: docTiep(B(S.tsCachTinh, "cách tính thần số học từng bước"), `<a href="/than-so/y-nghia-so">ý nghĩa các con số</a>`,
      `<a href="/hom-nay">ngày cá nhân hôm nay</a>`),
    lienQuan: [S.tsCachTinh, S.selfDiscovery, S.hopDoiMoi],
  },
  {
    slug: S.btLaGi,
    themCuoi: docTiep(`<a href="/bat-tu/thap-than">10 thập thần</a>`, `<a href="/bat-tu/nhat-chu">10 nhật chủ</a>`, B(S.nhLaGi, "ngũ hành là gì")),
    lienQuan: [S.nhLaGi, S.nhVong, S.chonMonMoi],
  },
  {
    slug: S.kdGieo, tuKhoaChinh: "gieo quẻ kinh dịch",
    themCuoi: docTiep(`<a href="/kinh-dich/que">64 quẻ</a>`, B(S.kdMaiHoa, "lập quẻ Mai Hoa"), B(S.chonMonMoi, "việc nào nên hỏi môn nào")),
    lienQuan: [S.kdMaiHoa, S.chonMonMoi],
  },
  {
    slug: S.kdMaiHoa, goc: G.kinh_dich, tuKhoaChinh: "quẻ kinh dịch mai hoa",
    themCuoi: `<p>Muốn thử Mai Hoa mỗi sáng, trang <a href="/hom-nay">Hôm nay</a> có "quẻ ngày của riêng bạn": bạn tự nghĩ hai con số, máy lập quẻ theo giờ khởi.</p>`
      + docTiep(B(S.kdGieo, "gieo quẻ bằng 3 đồng xu"), `<a href="/kinh-dich/que">64 quẻ</a>`),
    nguonThem: [{ ten: "Chu Dịch (Kinh Dịch), bản chữ Hán", url: "https://ctext.org/book-of-changes" },
      { ten: "Mai Hoa Dịch Số (tương truyền Thiệu Ung, đời Tống)" }],
    lienQuan: [S.kdGieo, S.chonMonMoi],
  },
  {
    slug: S.ptTuDanhGia, goc: G.phong_thuy,
    themCuoi: docTiep(B(S.ptHuong, "cách xem hướng nhà hợp tuổi"), `<a href="/phong-thuy/dau-hieu">dấu hiệu trong nhà nên để ý</a>`),
    lienQuan: [S.ptHuong, S.chonMonMoi],
  },
  {
    slug: S.tvVanHan, goc: G.tu_vi, tuKhoaChinh: "xem vận hạn",
    themCuoi: `<p>Muốn xem mười năm tới theo lá số của chính bạn, trang <a href="/thoi-gian-toi">thời gian tới</a> nêu năm nào nên chú ý hơn và việc nên làm. Sao hạn theo tuổi của từng năm (La Hầu, Kế Đô…) ở trang <a href="/xem-sao-han">xem sao hạn</a>; đó là tập quán dân gian, không phải lời phán.</p>`
      + docTiep(B(S.tvTronDoi, "luận giải lá số trọn đời"), B(S.tvCachXem, "cách xem Tử vi")),
    lienQuan: [S.tvTronDoi, S.tvCachXem, S.taiLoc],
  },
  {
    slug: S.taiLoc, goc: G.chung, tuKhoaChinh: "xem tài lộc", dat: { mang: "chung" },
    themCuoi: `<p>Lời đọc về tiền bạc trên Hiểu Bản Thân chỉ là gợi ý để bạn tự lên kế hoạch, không phải lời khuyên đầu tư. Quyết định vay, đầu tư hay mua bán lớn cần số liệu của chính bạn và người có chuyên môn tài chính.</p>`
      + docTiep(`<a href="/thoi-gian-toi">12 tháng tới của bạn</a>`, B(S.suNghiep, "xem sự nghiệp qua ba môn"), B(S.tvVanHan, "cách đọc vận hạn")),
    lienQuan: [S.suNghiep, S.tvVanHan],
  },
  {
    slug: S.suNghiep, goc: G.chung, dat: { mang: "chung" }, tuKhoaChinh: "xem sự nghiệp",
    themCuoi: docTiep(`<a href="/chan-dung">chân dung tổng hợp Tử vi, Bát tự, nhân tướng</a>`, `<a href="/than-so/nghe-nghiep">nghề hợp theo con số</a>`,
      B(S.taiLoc, "xem tài lộc")),
    lienQuan: [S.taiLoc, S.hopSepMoi, S.tsCachTinh],
  },
  {
    slug: S.tenNH, goc: G.bat_tu, dat: { mang: "bat_tu" },
    themCuoi: docTiep(B(S.nhLaGi, "ngũ hành là gì"), `<a href="/bat-tu/menh-theo-nam">sinh năm nào mệnh gì</a>`),
    lienQuan: [S.nhLaGi, S.nhVong],
  },
  {
    slug: S.astrology, goc: G.chung, dat: { mang: "chung" },
    themCuoi: `<p>Chiêm tinh phương Tây đọc vị trí Mặt Trời, Mặt Trăng và các hành tinh lúc sinh. Các môn phương Đông như Tử vi, Bát tự cũng dùng ngày giờ sinh nhưng theo khung riêng. Trang <a href="/huyen-hoc">huyền học</a> so sánh bảy môn để bạn chọn môn hợp câu hỏi.</p>`
      + docTiep(B(S.tvLaGi, "Tử vi là gì"), B(S.selfDiscovery, "tự hiểu mình qua giá trị và thói quen")),
    lienQuan: [S.tvLaGi, S.selfDiscovery],
  },
  {
    slug: S.selfDiscovery, goc: G.chung, dat: { mang: "chung",
      meta: { title: "Tự hiểu mình qua giá trị, thói quen và lựa chọn" } },
    themCuoi: docTiep(`<a href="/hom-nay">câu tự soi mỗi ngày</a>`, B(S.tsLaGi, "thần số học là gì"), B(S.astrology, "astrology là gì")),
    lienQuan: [S.tsLaGi, S.astrology],
  },
];

// ---------- áp dụng (Local API) ----------

const MANG_ANH: Record<string, MangAnh> = { than_so: "than_so", tu_vi: "tu_vi", bat_tu: "bat_tu", kinh_dich: "kinh_dich", phong_thuy: "phong_thuy" };

async function taiAnh(payload: Payload, ten: string, data: Buffer, alt: string): Promise<number | string> {
  const m = await payload.create({ collection: "media", overrideAccess: true,
    file: { data, mimetype: "image/png", name: `${ten}-${Date.now().toString(36)}.png`, size: data.length },
    data: { alt: alt.slice(0, 160), nguon_anh: NGUON_ANH } as never });
  return m.id;
}

/** Vẽ lại ảnh bìa + ảnh "Tóm tắt nhanh / Lộ trình / Câu hỏi thường gặp" theo tiêu đề mới (ảnh cũ giữ trong Thư viện). */
async function veLaiAnh(payload: Payload, bai: Record<string, any>, nd: { root: Nut }): Promise<{ bia: number | string }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const tieuDe = String(bai.tieu_de), slug = String(bai.slug), duong = `/blog/${slug}`;
  const mang = MANG_ANH[String(bai.mang)] ?? "chung";
  const muc = (nd.root.children ?? []).filter((n) => n.type === "heading" && n.tag === "h2").map(chuCua).filter(Boolean);
  const hoi = ((bai.hoi_dap ?? []) as { cau_hoi?: string }[]).map((h) => String(h.cau_hoi ?? "")).filter(Boolean);
  const bia = await taiAnh(payload, `bia-${slug.slice(0, 50)}`, await veAnhBia({ tieuDe, phu: bai.mo_ta_ngan, mang, duong }), tieuDe);
  for (const n of nd.root.children ?? []) {
    if (n.type !== "upload") continue;
    const id = typeof n.value === "object" && n.value ? n.value.id : n.value;
    const m = await payload.findByID({ collection: "media", id, depth: 0, overrideAccess: true }).catch(() => null) as { alt?: string } | null;
    const alt = String(m?.alt ?? "");
    let moi: number | string | null = null;
    if (alt.startsWith("Tóm tắt nhanh")) moi = await taiAnh(payload, `tom-tat-${slug.slice(0, 44)}`, await veAnhTomTat({ tieuDe, y: muc, mang, duong }), `Tóm tắt nhanh: ${tieuDe}`);
    else if (alt.startsWith("Lộ trình bài viết")) moi = await taiAnh(payload, `lo-trinh-${slug.slice(0, 44)}`, await veAnhLoTrinh({ tieuDe, muc, mang, duong }), `Lộ trình bài viết: ${tieuDe}`);
    else if (alt.startsWith("Câu hỏi thường gặp") && hoi.length >= 2) moi = await taiAnh(payload, `hoi-dap-${slug.slice(0, 44)}`, await veAnhCauHoi({ tieuDe, hoi, mang, duong }), `Câu hỏi thường gặp: ${tieuDe}`);
    if (moi != null) n.value = moi;
  }
  return { bia };
}

export type KetQuaKw6t = { slug: string; viec: string; ok: boolean; ly_do?: string };

async function timBai(payload: Payload, slug: string) {
  const r = await payload.find({ collection: "bai-viet", where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true });
  return r.docs[0] as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Dấu nội dung THẬT của một bài (chữ, link, ảnh, trường SEO) — bỏ qua cách trình soạn thảo lưu JSON. */
export function dauNoiDung(x: Record<string, any>): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const link: string[] = [];
  const duyet = (n: Nut | undefined) => {
    if (!n || typeof n !== "object") return;
    if (n.type === "link") link.push(String(n.fields?.url ?? ""));
    if (n.type === "upload") link.push(`anh:${typeof n.value === "object" && n.value ? n.value.id : n.value}`);
    (n.children ?? []).forEach(duyet);
  };
  const goc = (x.noi_dung as { root?: Nut } | undefined)?.root;
  duyet(goc);
  return JSON.stringify([x.tieu_de ?? "", x.slug ?? "", x.mo_ta_ngan ?? "", x.tra_loi_nhanh ?? "",
    x.meta?.title ?? "", x.meta?.description ?? "", goc ? chuCua(goc).replace(/\s+/g, " ").trim() : "", link,
    ((x.hoi_dap ?? []) as { cau_hoi?: string; tra_loi?: string }[]).map((h) => [h.cau_hoi ?? "", h.tra_loi ?? ""])]);
}

/** Bản nháp mới nhất KHÁC bản đang xuất bản ở nội dung thật (Chủ biên đang sửa dở) → không đè. Bản nháp do trình soạn thảo
 *  tự lưu khi chỉ mở bài (autosave 2 giây) có cùng nội dung → không tính (lần chạy đầu bị chặn nhầm cả 21 bài vì lý do này). */
async function coNhapDangSua(payload: Payload, bai: Record<string, any>): Promise<boolean> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const v = await payload.findVersions({ collection: "bai-viet", where: { parent: { equals: bai.id } }, sort: "-updatedAt", limit: 1,
    depth: 0, overrideAccess: true });
  const moi = (v.docs[0] as { version?: Record<string, any> } | undefined)?.version; // eslint-disable-line @typescript-eslint/no-explicit-any
  return moi?._status === "draft" && dauNoiDung(moi) !== dauNoiDung(bai);
}

const loiCua = (e: unknown) => String((e as Error)?.message ?? e).slice(0, 300);

export async function apDungKw6t(payload: Payload, _req?: PayloadRequest): Promise<KetQuaKw6t[]> {
  const kq: KetQuaKw6t[] = [];
  // Bài đổi slug giữ nguyên id → tra theo cả slug mới lẫn slug cũ (bài chưa tới lượt đổi vẫn tìm được).
  const cuCua = new Map(KE_HOACH.filter((k) => k.slugMoi).map((k) => [k.slugMoi!, k.slug]));
  const idTheoSlug = async (slug: string) =>
    (await timBai(payload, slug))?.id ?? (cuCua.has(slug) ? (await timBai(payload, cuCua.get(slug)!))?.id ?? null : null);
  const phuCua = new Map<string, Ke[]>();
  for (const k of KE_HOACH.filter((x) => x.gopVao)) phuCua.set(k.gopVao!, [...(phuCua.get(k.gopVao!) ?? []), k]);

  for (const ke of KE_HOACH.filter((k) => !k.gopVao)) {
    const bai = (await timBai(payload, ke.slug)) ?? (ke.slugMoi ? await timBai(payload, ke.slugMoi) : undefined);
    const phu = phuCua.get(ke.slug) ?? [];
    if (!bai) { kq.push({ slug: ke.slug, viec: "sửa", ok: false, ly_do: "không thấy bài" }); continue; }
    if (bai._status !== "published") { kq.push({ slug: ke.slug, viec: "sửa", ok: false, ly_do: "bài chưa xuất bản — không đụng" }); continue; }
    const baiPhu = await Promise.all(phu.map((p) => timBai(payload, p.slug)));
    if (String(bai.ghi_chu_duyet ?? "").includes(DAU_KW6T)) {
      kq.push({ slug: ke.slug, viec: "sửa", ok: true, ly_do: "đã sửa từ trước" });
    } else {
      try {
        if (await coNhapDangSua(payload, bai)) { kq.push({ slug: ke.slug, viec: "sửa", ok: false, ly_do: "có bản nháp đang sửa — không đè" }); continue; }
        const than = apThan(bai.noi_dung, ke);
        const data = apTruong(bai, ke);
        const ids = (await Promise.all((ke.lienQuan ?? []).map(idTheoSlug))).filter((x) => x != null && x !== bai.id);
        if (ids.length) data.bai_lien_quan = ids.slice(0, 4);
        // Bài chính nhận slug của bài phụ (kể cả bài phụ đã thôi xuất bản ở lần chạy trước) → web 308 về bài chính.
        const them = baiPhu.flatMap((b) => (b ? [b.slug, ...(b.slug_cu ?? [])] : []));
        if (them.length) data.slug_cu = [...new Set([...(bai.slug_cu ?? []), ...them])].filter((x) => x && x !== bai.slug);
        if (ke.veAnh) {
          const tam = { ...bai, ...data, hoi_dap: data.hoi_dap ?? bai.hoi_dap };
          const { bia } = await veLaiAnh(payload, tam, than.noi_dung);
          data.anh_bia = bia;
          data.meta = { ...((data.meta as object) ?? bai.meta ?? {}), image: bia };
        }
        data.noi_dung = than.noi_dung;
        await payload.update({ collection: "bai-viet", id: bai.id, overrideAccess: true, context: { giuSlugGoc: true },
          data: { _status: "published", ...data } as never });
        kq.push({ slug: ke.slug, viec: "sửa", ok: true, ly_do: than.loi.join("; ") || undefined });
      } catch (e) { kq.push({ slug: ke.slug, viec: "sửa", ok: false, ly_do: loiCua(e) }); continue; }
    }
    // Chỉ sau khi bài chính đã nhận slug: bài phụ thôi xuất bản (không còn hai bài cùng hiện, đường cũ 308 về bài chính).
    for (const [n, p] of phu.entries()) {
      const b = baiPhu[n];
      if (!b) { kq.push({ slug: p.slug, viec: "gộp", ok: false, ly_do: "không thấy bài" }); continue; }
      if (b._status !== "published") { kq.push({ slug: p.slug, viec: "gộp", ok: true, ly_do: "đã gộp từ trước" }); continue; }
      try {
        await payload.update({ collection: "bai-viet", id: b.id, overrideAccess: true, context: { giuSlugGoc: true },
          data: { _status: "draft", ...apTruong(b, p) } as never });
        kq.push({ slug: p.slug, viec: `gộp vào ${ke.slug}`, ok: true });
      } catch (e) { kq.push({ slug: p.slug, viec: "gộp", ok: false, ly_do: loiCua(e) }); }
    }
  }
  return kq;
}

/** Hoàn tác: mỗi bài có ghi chú KW-6T → khôi phục phiên bản mới nhất chưa có ghi chú đó. */
export async function hoanTacKw6t(payload: Payload): Promise<number> {
  let dem = 0;
  const r = await payload.find({ collection: "bai-viet", where: { ghi_chu_duyet: { like: DAU_KW6T } }, limit: 100, depth: 0,
    overrideAccess: true, draft: true });
  for (const bai of r.docs) {
    const v = await payload.findVersions({ collection: "bai-viet", where: { parent: { equals: bai.id } }, sort: "-updatedAt", limit: 50,
      depth: 0, overrideAccess: true });
    // Chỉ phiên bản ĐÃ XUẤT BẢN trước KW-6T (bỏ qua bản nháp trình soạn thảo tự lưu).
    const cu = v.docs.find((d) => {
      const x = (d as { version?: { ghi_chu_duyet?: string; _status?: string } }).version;
      return x?._status === "published" && !String(x?.ghi_chu_duyet ?? "").includes(DAU_KW6T);
    });
    if (!cu) continue;
    await payload.restoreVersion({ collection: "bai-viet", id: cu.id, overrideAccess: true, depth: 0 });
    dem++;
  }
  return dem;
}
