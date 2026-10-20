// TS-V3 — bản chạy được của `08_numerology_engine.service.ts` (Drive "HieuBan_NeuroSymbolic_Engine_V3").
// Bản gốc mở kết nối Postgres (`pg` Pool) và gọi `fn_assemble_llm_context_payload_v2(...)` — hàm không tồn tại trong bộ SQL,
// năm 2026 viết cứng. Ở đây giữ nguyên tên lớp + `consultUser()` để nơi khác dùng như thiết kế V3, nhưng gói ngữ cảnh do
// ENGINE dựng (`POST /v1/thanso/ngu-canh`: một bộ tính Python có golden, KB có nguồn, quy tắc diễn đạt) — không có
// bộ tính thứ hai trong SQL, không cần chuỗi kết nối DB trên Vercel. Chỉ chạy phía máy chủ (giữ ENGINE_API_KEY).
// KHÔNG mở thành route công khai: gói có cả câu trả lời từ KB → sẽ lách hạn mức hỏi đáp SAO-2 (QC TS-V3).

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export type TruongPhai = "pitago" | "chaldea" | "tong_hop";
export interface NguCanhV3 {
  loai: "ngu_canh";
  y_dinh: { linh_vuc: string; xu_ly: string; ma_cau: string | null; tru: string | null };
  ho_so_tinh_toan: Record<string, Record<string, { so: number; goc: number }>>;
  nut_kich_hoat: { ma: string; phai: string; tu_khoa: string; source_id: string; school_id: string }[];
  so_noi_bat: { goc: number; lan: number; phai: string[]; tu_khoa: string | null }[];
  tuong_tac_lien_phai: { quan_he: string; ten_nhom: string; cach_doc: string; goi_y: string }[];
  bang_chung: Record<string, unknown>;
  quy_tac_bat_buoc: { ma: string; noi_dung: string }[];
}

export class HieuBanNumerologyEngineService {
  constructor(private readonly headers: Record<string, string> = {}) {}

  /** fullName: họ tên (có thể nhiều biến thể, phân cách bằng "|"); birthDate: "YYYY-MM-DD". */
  async consultUser(fullName: string, birthDate: string, userQuestion: string,
                    opts: { quyUoc?: "tung_phan" | "tung_phan"; ngayXem?: string } = {}): Promise<NguCanhV3> {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
    if (!m) throw new Error("birthDate phải dạng YYYY-MM-DD");
    const r = await fetch(`${ENGINE_URL}/v1/thanso/ngu-canh`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...this.headers },
      body: JSON.stringify({
        ho_ten: fullName.split("|").map((t) => t.trim()).filter(Boolean).slice(0, 5),
        nam: Number(m[1]), thang: Number(m[2]), ngay: Number(m[3]), cau_hoi: userQuestion,
        quy_uoc_duong_doi: opts.quyUoc ?? "tung_phan", ...(opts.ngayXem ? { ngay_xem: opts.ngayXem } : {}),
      }),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`engine ${r.status}`);
    return (await r.json()) as NguCanhV3;
  }
}
