// POST /api/chia-se/ban-do — CTA-1: mã có KÝ cho thẻ "Bản đồ 5 mảng của tôi". Máy chủ tự gọi engine
// (/v1/ban-do-5-mang) rồi ký: mã CHỈ mang tên hiển thị + các nhãn engine đã tính + ba lựa chọn trò "Đoán số" + mã biến
// thể câu mời (chọn ngẫu nhiên để so câu nào kéo người bấm hơn). Ngày giờ sinh chỉ đi qua lượt gọi, không ghi vào mã.
import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { dauNguoiGoi, goiEngineDaKiem } from "@/lib/proxy";
import { kyMaBanDo, tuTuMa } from "@/lib/ma-moi";
import { traLoiChiaSe } from "@/lib/loi-chia-se";

const Input = z.object({
  ten_hien_thi: z.string().trim().min(1).max(24),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  gio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  do_tin_gio: z.enum(["exact", "approx", "unknown"]).optional(),
  gioi_tinh: z.enum(["nam", "nu"]).optional(),
  noi_sinh: z.string().regex(/^[a-z0-9_-]{2,40}$/).optional(),
  vung: z.enum(["north", "south"]).optional(),
  gio_mua_he: z.boolean().optional(),
  quy_uoc_duong_doi: z.enum(["tong_het", "tung_phan"]).optional(),
}).strict();

const BanDo = z.object({
  duong_doi: z.object({ so: z.number().int(), tu_khoa: z.string().nullable() }),
  nhat_chu: z.object({ nhan: z.string(), hinh_tuong: z.string().nullable() }),
  sao_menh: z.object({ nhan: z.string() }).nullable(),
  cung_phi: z.object({ quai: z.string(), huong: z.string() }).nullable(),
  que_ngay: z.object({ ten: z.string() }),
  doan: z.object({ lua_chon: z.array(z.number().int()).length(3) }),
});

const cat = (s: string | null | undefined, n: number) => (s ?? "").slice(0, n);

export async function POST(req: Request): Promise<NextResponse> {
  const p = Input.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Đầu vào không hợp lệ" }, { status: 422 });
  const { ten_hien_thi, ...hoSo } = p.data;
  const r = await goiEngineDaKiem(hoSo, "/v1/ban-do-5-mang", dauNguoiGoi(req));
  if (!r.ok) return r.res;
  const bd = BanDo.safeParse(r.body);
  if (!bd.success) return NextResponse.json({ error: "Chưa đủ dữ liệu để tạo thẻ." }, { status: 502 });
  const x = bd.data;
  const b = randomInt(3);
  try {
    const the = {
      t: ten_hien_thi, s: x.duong_doi.so, k: cat(x.duong_doi.tu_khoa, 60), n: cat(x.nhat_chu.nhan, 16),
      h: cat(x.nhat_chu.hinh_tuong, 40), m: cat(x.sao_menh?.nhan, 30), c: cat(x.cung_phi?.quai, 8), g: cat(x.cung_phi?.huong, 12),
      q: cat(x.que_ngay.ten, 16), o: x.doan.lua_chon, b,
    };
    const ma = kyMaBanDo(the);
    // `the`: đúng phần đã ký (để người gửi xem trước thẻ) — dữ liệu của chính họ, không có ngày sinh.
    return NextResponse.json({ ma, tu: tuTuMa("bd", ma), bien_the: `b${b}`, the });
  } catch (e) {
    return traLoiChiaSe(e, "ban-do");
  }
}
