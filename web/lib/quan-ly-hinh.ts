// QLNS-2 — ảnh minh hoạ của trang /quan-ly-nhan-su: chữ trong ảnh, alt và chú thích dựng từ MỘT hàm này (như
// lib/tom-tat-anh.ts) nên alt luôn khớp chữ trong ảnh. Ảnh do route /og/quan-ly vẽ (PNG thật — Google Hình ảnh lấy được,
// khác SVG nội dòng). Chỉ dữ liệu công khai của kho (không có dữ liệu người dùng). Thuần: nhận kho làm tham số.
import type { DanhMucQuanLy } from "@/lib/quan-ly-danh-muc";

export const KIEU_HINH_QL = ["van-phong", "quy-trinh", "ngu-hanh", "tinh-huong", "ke-hoach"] as const;
export type KieuHinhQL = (typeof KIEU_HINH_QL)[number];
export interface MucHinhQL { nhan: string; tieu: string; phu?: string }
export interface HinhQL {
  kieu: KieuHinhQL;
  /** dòng nhỏ trên cùng */ nhan: string;
  tieuDe: string;
  muc: MucHinhQL[];
  alt: string;
  chuThich: string;
}

export const urlHinhQL = (kieu: KieuHinhQL) => `/og/quan-ly?hinh=${kieu}`;
export const laKieuHinhQL = (v: string | null): v is KieuHinhQL => !!v && (KIEU_HINH_QL as readonly string[]).includes(v);

/** Thứ tự tương sinh vẽ quanh vòng (Mộc → Hỏa → Thổ → Kim → Thủy → Mộc); khoá so khớp bỏ dấu để "Thuỷ"/"Thủy" đều nhận. */
export const THU_TU_SINH = ["moc", "hoa", "tho", "kim", "thuy"] as const;
export const khoaHanh = (h: string) => h.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

/** Hai vai trò đầu ("A · B · C" → "A · B") — vừa khung ảnh, không cắt giữa chữ. */
export const vaiTroGon = (s: string) => s.split(" · ").slice(0, 2).join("\u00a0· ");   // NBSP: dấu · không rớt xuống đầu dòng

/** alt ≤ 300 ký tự: mô tả + các ý (câu thật, không nhồi từ khoá); dừng ở ý trọn, không cắt giữa câu. */
function taoAlt(mo: string, muc: MucHinhQL[]): string {
  const cham = (x: string) => (/[.?!…]$/.test(x) ? x : `${x}.`);
  let s = cham(mo);
  for (const m of muc) {
    const dau = /^\d+$/.test(m.nhan) ? `${m.nhan}. ${m.tieu}` : `${m.nhan}: ${m.tieu}`;
    const y = cham(m.phu ? `${dau} — ${m.phu.replace(/[.\s]+$/, "")}` : dau);
    if ((s + " " + y).length > 298) break;
    s += ` ${y}`;
  }
  return s;
}

export function hinhQL(kieu: KieuHinhQL, dm: DanhMucQuanLy | null): HinhQL | null {
  const xong = (nhan: string, tieuDe: string, muc: MucHinhQL[], mo: string, chuThich: string): HinhQL | null =>
    muc.length ? { kieu, nhan, tieuDe, muc, alt: taoAlt(mo, muc), chuThich } : null;
  switch (kieu) {
    case "van-phong":
      // Tranh minh hoạ không chữ: alt mô tả đúng cảnh vẽ (năm người, mỗi người một màu áo ứng một hành; màn hình số liệu trên tường).
      return { kieu, nhan: "Bản đồ đội ngũ", tieuDe: "Quản lý nhân sự theo ngũ hành", muc: [],
        alt: "Minh hoạ văn phòng: năm người ngồi quanh bàn làm việc, mỗi người mặc áo một màu ứng với một hành; màn hình trên tường hiện biểu đồ năm hành và các cột số liệu của cả nhóm.",
        chuThich: "Một đội, năm kiểu làm việc — mỗi màu áo là một hành. Tranh minh hoạ, không phải đội thật." };
    case "quy-trinh":
      return xong("Cách dùng", "Từ ngày sinh đến kế hoạch 30 ngày", [
        { nhan: "1", tieu: "Nhập ngày sinh", phu: "Bạn nhập, hoặc gửi link để mỗi người tự điền" },
        { nhan: "2", tieu: "Xem bản đồ 5 hành", phu: "Nhóm mạnh trục nào, thiếu trục nào" },
        { nhan: "3", tieu: "Nhận kế hoạch 30 ngày", phu: "Việc từng tuần, câu hỏi 1-1, tình huống dễ gặp" },
      ], "Sơ đồ ba bước quản lý nhân sự theo ngũ hành, từ ngày sinh đến kế hoạch 30 ngày.",
      "Ba bước dùng bản đồ quản lý nhân sự — tóm tắt từ công cụ, lưu ảnh để gửi người trong nhóm.");
    case "ngu-hanh": {
      if (!dm?.vai_tro_hanh.length) return null;
      const theoKhoa = new Map(dm.vai_tro_hanh.map((r) => [khoaHanh(r.hanh), r]));
      const ds = THU_TU_SINH.map((k) => theoKhoa.get(k)).filter((r): r is NonNullable<typeof r> => !!r);
      if (ds.length !== 5) return null;
      return xong("Năm trục làm việc", "Năm hành và vai trò hợp trong đội ngũ",
        ds.map((r) => ({ nhan: r.hanh, tieu: vaiTroGon(r.vai_tro) })),
        "Sơ đồ năm hành tương sinh trong đội ngũ, mỗi hành kèm vai trò làm việc thường hợp.",
        "Năm hành quanh vòng tương sinh và vai trò thường hợp — để chia việc và trao đổi, không để xếp hạng người.");
    }
    case "tinh-huong": {
      const ds = dm?.tinh_huong.slice(0, 6) ?? [];
      return xong("Tình huống hay gặp", "Tình huống quản lý nhân sự hay gặp",
        ds.map((t, i) => ({ nhan: String(i + 1), tieu: t.van_de })),
        "Danh sách tình huống quản lý nhân sự hay gặp trong một nhóm.",
        "Các tình huống công cụ có thể gợi ý khi chạy bản đồ cho nhóm của bạn, mỗi tình huống kèm câu mở lời mẫu.");
    }
    case "ke-hoach": {
      const ds = dm?.ke_hoach_mau ?? [];
      return xong("Kế hoạch 30 ngày", "Bốn tuần đầu của người quản lý",
        ds.map((t) => ({ nhan: t.tuan, tieu: t.tieu_de, phu: t.y })),
        "Kế hoạch 30 ngày chia theo bốn tuần cho người quản lý nhóm.",
        "Khung bốn tuần của kế hoạch 30 ngày — khi chạy bản đồ cho nhóm thật, mỗi việc gắn với từng người cụ thể.");
    }
  }
}
