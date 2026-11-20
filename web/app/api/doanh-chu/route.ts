// POST /api/doanh-chu — Proxy cho Studio Doanh Chủ (/v1/doanh-chu/doi-ngu).
// Tuân thủ DC-1 & Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (không lưu dữ liệu ngày sinh trên máy chủ):
//   - Chế độ "mau": 100% nhân vật giả lập phía server để trải nghiệm Radar 5 Hành & Ma Trận 2 Chiều ngay 1 chạm.
//   - Chế độ "doi_ngu": chỉ chấp nhận các `tv_token` mã hóa AES-256-GCM đã được chính nhân sự xác nhận qua /doanh-chu/moi.
//     Proxy giải mã, kiểm tra đúng `nonce` & còn hạn rồi mới đặt `dong_y_tu_nguyen: true` và `cam_ket_thoa_thuan: true`.
//   - Chế độ "tu_nhap" (theo quyết định DC-1): chủ doanh nghiệp tự nhập trực tiếp 1–8 cộng sự, BẮT BUỘC tự tích
//     `cam_ket_thoa_thuan: true` (đã ký thoả thuận riêng & có đồng ý của từng thành viên theo Luật 91/2025/QH15)
//     và `dong_y_tu_nguyen: true` cho từng người — proxy KHÔNG bao giờ tự mặc định true.
//   - Cổng Sao (SEC-2): đọc công tắc `luan_giai.thu_sao.doanh_chu` (mặc định TẮT → mở dùng thử; bật ở /quan-tri/cai-dat).
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { layCauHinh } from "@/lib/cau-hinh";
import { chaoMungConNhan, coTaiKhoan, phienNguoiDung } from "@/lib/cua-sao";
import { docLoiMoiDoiNgu, giaiMaDongYThanhVien } from "@/lib/doanh-chu-ma";
import { dauNguoiGoi, goiEngineDaKiem, laBanAnh, loiChung } from "@/lib/proxy";

const OngChuIn = z.object({
  ten: z.string().trim().max(60).default("Ông chủ"),
  vai_tro: z.string().trim().max(60).default("Chủ doanh nghiệp"),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1930).max(2025),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
}).strict();

const ThanhVienTuNhapIn = z.object({
  ten: z.string().trim().min(1).max(60),
  vai_tro: z.string().trim().max(60).default(""),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1930).max(2025),
  gioi_tinh: z.enum(["nam", "nu"]).default("nam"),
  dong_y_tu_nguyen: z.literal(true),
}).strict();

const Input = z.discriminatedUnion("che_do", [
  z.object({
    che_do: z.literal("mau"),
    nam_xem: z.number().int().min(2020).max(2050).default(2026),
  }).strict(),
  z.object({
    che_do: z.literal("doi_ngu"),
    ma_moi: z.string().trim().min(10).max(600),
    ong_chu: OngChuIn,
    tv_tokens: z.array(z.string().trim().min(20).max(900)).min(1).max(8),
    nam_xem: z.number().int().min(2020).max(2050),
  }).strict(),
  z.object({
    che_do: z.literal("tu_nhap"),
    ong_chu: OngChuIn,
    doi_ngu: z.array(ThanhVienTuNhapIn).min(1).max(8),
    nam_xem: z.number().int().min(2020).max(2050),
    cam_ket_thoa_thuan: z.literal(true),
  }).strict(),
]);

const DOI_NGU_MAU = {
  ong_chu: { ten: "Anh Hoàng (Mẫu)", vai_tro: "Nhà sáng lập / CEO", ngay: 15, thang: 8, nam: 1986, gioi_tinh: "nam", dong_y_tu_nguyen: true },
  doi_ngu: [
    { ten: "Chị Minh (Mẫu)", vai_tro: "Giám đốc Vận hành", ngay: 10, thang: 3, nam: 1992, gioi_tinh: "nu", dong_y_tu_nguyen: true },
    { ten: "Anh Tuấn (Mẫu)", vai_tro: "Trưởng phòng Kinh doanh", ngay: 22, thang: 11, nam: 1989, gioi_tinh: "nam", dong_y_tu_nguyen: true },
    { ten: "Chị Lan (Mẫu)", vai_tro: "Kiểm soát Tài chính", ngay: 5, thang: 1, nam: 1994, gioi_tinh: "nu", dong_y_tu_nguyen: true },
    { ten: "Anh Khoa (Mẫu)", vai_tro: "Phát triển Sản phẩm / R&D", ngay: 18, thang: 6, nam: 1996, gioi_tinh: "nam", dong_y_tu_nguyen: true },
  ],
};

function ngayHopLe(nam: number, thang: number, ngay: number): boolean {
  const d = new Date(Date.UTC(nam, thang - 1, ngay));
  return d.getUTCFullYear() === nam && d.getUTCMonth() === thang - 1 && d.getUTCDate() === ngay;
}

export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  const en = laBanAnh(req);
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: loiChung("dau_vao", en) }, { status: 422 });
  }

  let payloadEngine: Record<string, unknown>;
  let laMau = false;

  if (parsed.data.che_do === "mau") {
    laMau = true;
    // Nhân vật mẫu giả lập 100% phía server (không phải dữ liệu cá nhân thật) → đặt cam_ket_thoa_thuan=true để qua DC-1.
    payloadEngine = { ...DOI_NGU_MAU, nam_xem: parsed.data.nam_xem, cam_ket_thoa_thuan: true };
  } else if (parsed.data.che_do === "tu_nhap") {
    const { ong_chu, doi_ngu, nam_xem, cam_ket_thoa_thuan } = parsed.data;
    if (!ngayHopLe(ong_chu.nam, ong_chu.thang, ong_chu.ngay)) {
      return NextResponse.json({ error: loiChung("khong_hop_le", en) }, { status: 422 });
    }
    for (let i = 0; i < doi_ngu.length; i++) {
      const tv = doi_ngu[i]!;
      if (!ngayHopLe(tv.nam, tv.thang, tv.ngay)) {
        return NextResponse.json(
          { error: en ? `Invalid birth date for member #${i + 1}.` : `Ngày sinh của cộng sự #${i + 1} (${tv.ten}) không hợp lệ.` },
          { status: 422 },
        );
      }
    }
    payloadEngine = {
      ong_chu: { ...ong_chu, dong_y_tu_nguyen: true },
      doi_ngu,
      nam_xem,
      cam_ket_thoa_thuan, // Bắt buộc do chủ doanh nghiệp tự tích xác nhận (z.literal(true)), không tự mặc định.
    };
  } else {
    const { ma_moi, ong_chu, tv_tokens, nam_xem } = parsed.data;
    if (!ngayHopLe(ong_chu.nam, ong_chu.thang, ong_chu.ngay)) {
      return NextResponse.json({ error: loiChung("khong_hop_le", en) }, { status: 422 });
    }
    const moi = docLoiMoiDoiNgu(ma_moi);
    if (!moi) {
      return NextResponse.json(
        { error: en ? "Team invite code is invalid or expired." : "Mã mời đội ngũ không hợp lệ hoặc đã hết hạn (7 ngày)." },
        { status: 410 },
      );
    }
    const doiNgu: Record<string, unknown>[] = [];
    for (let i = 0; i < tv_tokens.length; i++) {
      const tv = giaiMaDongYThanhVien(tv_tokens[i]!, moi.nonce);
      if (!tv) {
        return NextResponse.json(
          {
            error: en
              ? `Member consent token #${i + 1} is invalid, expired, or does not match this team invite.`
              : `Mã xác nhận của thành viên #${i + 1} không hợp lệ, đã hết hạn hoặc không khớp mã mời đội ngũ này.`,
          },
          { status: 422 },
        );
      }
      doiNgu.push({
        ten: tv.biet_danh,
        vai_tro: tv.vai_tro,
        ngay: tv.ngay,
        thang: tv.thang,
        nam: tv.nam,
        gioi_tinh: tv.gioi_tinh,
        dong_y_tu_nguyen: true, // Chỉ proxy đặt true sau khi giải mã AES-256-GCM thành công.
      });
    }
    // Mỗi thành viên đã tự bấm đồng ý & được ký mã hóa AES-256-GCM theo đúng nonce lời mời → cam_ket_thoa_thuan=true.
    payloadEngine = {
      ong_chu: { ...ong_chu, dong_y_tu_nguyen: true },
      doi_ngu: doiNgu,
      nam_xem,
      cam_ket_thoa_thuan: true,
    };
  }

  // Cổng Sao SEC-2 (chỉ áp dụng cho đội ngũ thật khi quản trị bật công tắc `luan_giai.thu_sao.doanh_chu`, mặc định TẮT).
  let khoaTruSao: string | null = null;
  let phienTruSao: Awaited<ReturnType<typeof phienNguoiDung>> = null;
  if (!laMau && !en && coTaiKhoan()) {
    const thuSao = await layCauHinh<boolean>("luan_giai.thu_sao.doanh_chu");
    if (thuSao) {
      const giaRieng = await layCauHinh<number>("luan_giai.gia_sao.doanh_chu");
      const gia = giaRieng > 0 ? giaRieng : await layCauHinh<number>("luan_giai.gia_sao");
      const phien = await phienNguoiDung();
      if (!phien) {
        return NextResponse.json(
          { error: "Đăng nhập tài khoản để mở bản phân tích đội ngũ.", can: "dang_nhap", gia },
          { status: 402 },
        );
      }
      const { data: du } = await phien.sb.rpc("so_du_sao");
      const soDu = typeof du === "number" ? du : 0;
      if (soDu < gia) {
        return NextResponse.json(
          {
            error: `Bản phân tích đội ngũ cần ${gia} Sao, ví bạn còn ${soDu} Sao.`,
            can: "nap",
            gia,
            so_du: soDu,
            chao_mung: await chaoMungConNhan(phien),
          },
          { status: 402 },
        );
      }
      if (req.headers.get("x-dong-y-sao") !== "1") {
        return NextResponse.json(
          { error: `Xác nhận dùng ${gia} Sao để phân tích đội ngũ này.`, can: "xac_nhan_sao", gia, so_du: soDu },
          { status: 402 },
        );
      }
      const khoa = `doanh_chu:${randomUUID()}`;
      const { data: d } = await phien.sb.rpc("dung_sao", { p_so: gia, p_khoa: khoa, p_ghi_chu: "Phân tích đội ngũ Doanh Chủ" });
      const kqTru = d as { ket_qua?: string; so_du?: number } | null;
      if (kqTru?.ket_qua !== "da_dung") {
        const con = typeof kqTru?.so_du === "number" ? kqTru.so_du : soDu;
        return NextResponse.json(
          { error: `Bản phân tích đội ngũ cần ${gia} Sao, ví bạn còn ${con} Sao.`, can: "nap", gia, so_du: con },
          { status: 402 },
        );
      }
      khoaTruSao = khoa;
      phienTruSao = phien;
    }
  }

  const kq = await goiEngineDaKiem(payloadEngine, "/v1/doanh-chu/doi-ngu", dauNguoiGoi(req));
  if (!kq.ok) {
    if (khoaTruSao && phienTruSao) {
      await phienTruSao.sb.rpc("hoan_sao_hoi", { p_khoa: khoaTruSao }).then(() => {}, () => {});
    }
    return kq.res;
  }

  const body = kq.body && typeof kq.body === "object" ? { ...(kq.body as Record<string, unknown>), la_du_lieu_mau: laMau } : kq.body;
  return NextResponse.json(body);
}
