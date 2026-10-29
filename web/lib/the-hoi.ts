// HD-CS đợt 3 (ý 2) — thẻ chia sẻ một câu trả lời hỏi đáp. Thẻ CHỈ mang dữ liệu thuộc danh mục cố định dưới đây (tên cung,
// chính tinh, hướng, du niên, hành, vai con số) dạng CHỈ SỐ + con số, cùng một câu hỏi chuẩn do engine công bố
// (`/v1/hoi/cau-chuan`) — không chữ người dùng gõ, không lời trả lời, không ngày giờ sinh. Nhờ vậy không ai dùng được thẻ để
// đóng dấu Hiểu Bản Thân lên chữ tuỳ ý, và máy chủ ký mà không cần tính lại (con số giả chỉ vẽ ra hình sai, không lộ gì).
// Phong thuỷ KHÔNG có thẻ: bốn hướng hợp suy ngược ra cung phi → năm sinh (mod 9) — trái tinh thần thẻ nhà P7. Thẻ cung
// Tử vi (chi + chính tinh của một cung) và vòng 9 năm (năm cá nhân → ngày + tháng sinh mod 9) chỉ hé rất ít, đã cân nhắc.
// Dùng chung trình duyệt (chọn khối có thể chia sẻ) + máy chủ (ký / đọc mã) + trang nhận + ảnh OG.
import { z } from "zod";
import type { KhoiTrucQuan } from "@/components/hoi/TrucQuan";

export const CUNG = ["Mệnh", "Huynh Đệ", "Phu Thê", "Tử Nữ", "Tài Bạch", "Tật Ách", "Thiên Di", "Nô Bộc", "Quan Lộc",
  "Điền Trạch", "Phúc Đức", "Phụ Mẫu"] as const;
export const CHINH_TINH = ["Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ", "Thái Âm",
  "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân"] as const;
export const HANH = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"] as const;
export const VAI_SO = ["Đường đời", "Linh hồn", "Nhân cách", "Sứ mệnh", "Ngày sinh", "Thái độ"] as const;
/** Chi theo thứ tự lá số (dùng để dựng lại bàn 12 cung trên thẻ — chỉ vị trí hình, không phải dữ kiện của người gửi). */
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;

export const MANG_THE = ["tuvi", "battu", "thanso"] as const;
export type MangThe = (typeof MANG_THE)[number];
export const DUONG_MANG: Record<MangThe, string> = { tuvi: "/tu-vi", battu: "/bat-tu", thanso: "/than-so" };
export const TEN_MANG: Record<MangThe, string> = { tuvi: "Tử vi", battu: "Bát tự", thanso: "Thần số học" };

const i = (n: number) => z.number().int().min(0).max(n - 1);
export const TheGon = z.discriminatedUnion("t", [
  // cung được hỏi, chi của nó (0–11), ≤ 2 chính tinh, hai cung tam hợp, cung xung chiếu
  z.object({ t: z.literal("cung"), h: i(12), c: i(12), s: z.array(i(14)).max(2), th: z.array(i(12)).length(2), x: i(12) }),
  z.object({ t: z.literal("cot"), v: z.array(z.number().int().min(0).max(100)).length(5) }),
  z.object({ t: z.literal("so"), s: z.array(z.tuple([i(6), z.number().int().min(1).max(33)])).min(1).max(4) }),
  z.object({ t: z.literal("ck"), n: z.number().int().min(1).max(9), y: z.number().int().min(1900).max(2200) }),
]);
export type TheGon = z.infer<typeof TheGon>;

const idx = <T extends readonly string[]>(ds: T, s: unknown): number => ds.indexOf(String(s) as T[number]);

/** Khối engine → dạng gọn của thẻ; null = khối này không chia sẻ được (hoặc có giá trị ngoài danh mục). */
export function tuKhoi(k: KhoiTrucQuan): TheGon | null {
  const ra = ((): unknown => {
    switch (k.kieu) {
      case "cung": {
        const muc = k.muc as { chi: string; nhan: string; vai: string; sao?: string[] }[];
        const hoi = muc.find((m) => m.vai === "hoi");
        const xung = muc.find((m) => m.vai === "xung");
        if (!hoi || !xung) return null;
        return { t: "cung", h: idx(CUNG, hoi.nhan), c: idx(CHI, hoi.chi), s: (hoi.sao ?? []).map((s) => idx(CHINH_TINH, s)),
          th: muc.filter((m) => m.vai === "tam_hop").map((m) => idx(CUNG, m.nhan)), x: idx(CUNG, xung.nhan) };
      }
      case "cot": return { t: "cot", v: HANH.map((h) => Number(k.muc.find((m) => m.nhan === h)?.gia_tri ?? -1)) };
      case "so": {
        const s = k.muc.filter((m) => (VAI_SO as readonly string[]).includes(m.nhan)).map((m) => [idx(VAI_SO, m.nhan), Number(m.gia_tri)]);
        return s.length ? { t: "so", s } : null;
      }
      case "chu_ky": {
        const y = Number(/\d{4}/.exec(k.tieu_de)?.[0]);
        return { t: "ck", n: k.hien_tai, y };
      }
      default: return null;
    }
  })();
  const p = TheGon.safeParse(ra);
  return p.success ? p.data : null;
}

export function tieuDeThe(g: TheGon): string {
  switch (g.t) {
    case "cung": return `Cung ${CUNG[g.h]} trên lá số`;
    case "cot": return "Năm hành trong ngày giờ sinh";
    case "so": return "Những con số của tôi";
    case "ck": return `Năm ${g.y} trong vòng 9 năm`;
  }
}

/** Dạng gọn → khối để vẽ lại bằng chính TrucQuan (trang nhận thẻ). Không có lời giải thích của người gửi. */
export function veKhoi(g: TheGon): KhoiTrucQuan {
  const tieu_de = tieuDeThe(g);
  switch (g.t) {
    case "cung": {
      const ci = g.c;
      // Cung theo chi: cung được hỏi ở chi c, các cung khác lùi theo chiều nghịch (thứ tự an cung) — đủ để vẽ đúng vị trí
      // tương đối của tam hợp / xung chiếu; tên những cung còn lại suy ra từ thứ tự cố định của 12 cung.
      const muc = CUNG.map((_, k) => {
        const ten = CUNG[(g.h + k) % 12]!;
        const chi = CHI[(ci - k + 12) % 12]!;
        const vai = k === 0 ? "hoi" : g.th.includes(CUNG.indexOf(ten)) ? "tam_hop" : CUNG.indexOf(ten) === g.x ? "xung" : "";
        return { chi, nhan: ten, vai, sao: k === 0 ? g.s.map((s) => CHINH_TINH[s]!) : [] as string[],
          sac: (vai === "hoi" ? "chinh" : vai === "tam_hop" ? "hop" : vai === "xung" ? "trung" : "nhat") as "chinh" | "hop" | "trung" | "nhat" };
      });
      return { kieu: "cung", tieu_de, chi_hoi: CHI[ci]!, muc };
    }
    case "cot": {
      const lon = Math.max(...g.v);
      return { kieu: "cot", tieu_de, don_vi: "%", muc: HANH.map((h, k) => { const v = g.v[k] ?? 0; return { nhan: h, gia_tri: v, sac: v === lon ? "chinh" : v < 5 ? "nhat" : "trung" }; }) };
    }
    case "so": return { kieu: "so", tieu_de, muc: g.s.map(([v, n], k) => ({ nhan: VAI_SO[v]!, gia_tri: n, sac: k === 0 ? "chinh" : "trung" })) };
    case "ck": return { kieu: "chu_ky", tieu_de, so_nac: 9, hien_tai: g.n };
  }
}

/** Mảng của khung hỏi đáp có thẻ (Kinh Dịch đã có thẻ quẻ riêng; Phong thuỷ không có — xem đầu tệp). */
export function laMangThe(m: string): m is MangThe {
  return (MANG_THE as readonly string[]).includes(m);
}
