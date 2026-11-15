"use client";
import { fetchSao } from "@/lib/sao-client";
import { taoChu } from "@/lib/chu-trang";
import { CHU_HOI_DAP } from "@/lib/chu/hoi-dap";
import { maNgonNguTrang } from "@/lib/ngon-ngu";
import { tenTheo, type TenHien } from "@/lib/ten-hien";

/** EN-ALL GĐ 3d: chữ khung hỏi đáp theo ngôn ngữ trang đang mở (bản Việt = chữ cũ). */
const chuHoi = () => taoChu(CHU_HOI_DAP, null, maNgonNguTrang() === "vi" ? "vi" : "en");
import type { KetQuaHoi } from "@/components/hoi/KhungChat";
import type { ThuatNgu } from "@/components/hoi/ThuatNgu";
import type { KhoiTrucQuan } from "@/components/hoi/TrucQuan";

export interface HoiMangRes {
  cau_tra_loi?: string;
  che_do?: string;
  co_canh_bao?: { loai: string; chi_tiet: string }[];
  thuat_ngu?: ThuatNgu[];
  /** Căn cứ kỹ thuật cho "Vì sao nói vậy" (Tử vi: câu trả lời về lá của chính người hỏi). */
  can_cu?: string[];
  /** HD-CS — khối hình engine dựng kèm câu trả lời. */
  truc_quan?: KhoiTrucQuan[];
  hoi_tiep?: string[];
  /** EN-3: độ tin thấp → mời chọn câu cụ thể hơn. */
  hoi_lai?: { cau: string; chon: string[] } | null;
  /** EN-ALL GĐ 3d: bản Anh — câu hỏi có một tín hiệu buồn yếu → đoạn hỗ trợ ngắn (đường dây) hiện TRÊN câu trả lời. */
  ho_tro?: string;
  /** EN-ALL: bản Anh — tên hiển thị của mã trong phản hồi. */
  ten_hien?: TenHien;
  error?: string;
  luot?: LuotHoi;
}

/** SAO-2: máy chủ báo lượt miễn phí còn lại / Sao vừa trừ → một dòng nhỏ dưới câu trả lời. */
export type LuotHoi = { con_lai: number; tran: number; tai_khoan: boolean } | { sao_da_tru: number; so_du: number | null };
export function ghiLuot(l?: LuotHoi): string | undefined {
  if (!l) return undefined;
  if ("sao_da_tru" in l) return l.sao_da_tru ? `Đã dùng ${l.sao_da_tru} Sao cho câu này${l.so_du != null ? ` · ví còn ${l.so_du} Sao` : ""}.` : undefined;
  if (l.con_lai > 2) return undefined;
  const c = chuHoi();
  return l.con_lai === 0
    ? `${c("luot_cuoi")}${l.tai_khoan ? c("luot_cuoi_sao") : c("luot_cuoi_dang_nhap")}`
    : c("luot_con", { so: String(l.con_lai) });
}

/** Gọi /api/<mảng>/hoi và chuẩn hoá cho KhungChat. `phu` dựng từ phản hồi thô nếu cần. */
export async function hoiMang<T extends HoiMangRes>(
  url: string,
  body: unknown,
  phu?: (d: T) => KetQuaHoi["phu"],
  boQuaCanhBao: string[] = [],
): Promise<KetQuaHoi> {
  const r = await fetchSao(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }, "hoi");
  const d = (await r.json().catch(() => ({}))) as T;
  const c = chuHoi();
  if (!d.cau_tra_loi) return { loi: (maNgonNguTrang() === "vi" && d.error) || c("loi_tra_loi") };
  return {
    ghiLuot: ghiLuot(d.luot),
    van: d.cau_tra_loi,
    thuatNgu: d.thuat_ngu,
    trucQuan: tenKhoiHinh(d.truc_quan, d.ten_hien),
    hoiTiep: d.hoi_tiep,
    hoiLai: d.hoi_lai,
    hoTro: d.ho_tro || undefined,
    canCu: d.can_cu?.length ? d.can_cu : undefined,
    phu: phu?.(d),
    canhBao: d.co_canh_bao?.filter((c) => !boQuaCanhBao.includes(c.loai)).map((c) => c.chi_tiet),
    ghiChu: d.che_do === "llm" ? c("ghi_chu_llm") : c("ghi_chu_ghep"),
  };
}

/** EN-ALL GĐ 3d: nhãn mục trong khối hình có thể là MÃ (vd hành "Mộc" ở biểu đồ cột) — bản Anh đổi sang tên hiển thị theo
 *  `ten_hien` của phản hồi; nhãn không phải mã giữ nguyên. Bản Việt không có `ten_hien` → giữ nguyên khối. */
function tenKhoiHinh(ds: KhoiTrucQuan[] | undefined, th: TenHien | undefined): KhoiTrucQuan[] | undefined {
  if (!ds || !th) return ds;
  const ten = tenTheo(th, true);
  const laMa = (x: string) => Object.values(th).some((b) => Object.hasOwn(b, x));
  const doi = (m: unknown): unknown => (m && typeof m === "object" && "nhan" in m && typeof (m as { nhan: unknown }).nhan === "string" && laMa((m as { nhan: string }).nhan)
    ? { ...(m as object), nhan: ten("", (m as { nhan: string }).nhan) } : m);
  // EN-ALL GĐ 4: bàn 12 cung Tử vi — tên sao trong ô (`sao`) cũng là mã; `chi` (vị trí ô) và `bay.hoa` (màu) giữ mã, tên hoá
  // hiện qua `ten_hien` gắn kèm khối (`ten_hien` riêng — TrucQuan không nằm trong ngữ cảnh tên của lá số).
  const doiSao = (m: unknown): unknown => {
    const x = doi(m);
    return x && typeof x === "object" && Array.isArray((x as { sao?: unknown }).sao)
      ? { ...(x as object), sao: (x as { sao: unknown[] }).sao.map((s) => (typeof s === "string" ? ten("sao", s) : s)) } : x;
  };
  return ds.map((k) => ("muc" in k && Array.isArray(k.muc)
    ? { ...k, muc: k.muc.map(k.kieu === "cung" ? doiSao : doi), ...(k.kieu === "cung" ? { ten_hien: th } : {}) }
    : k.kieu === "minh_hoa" ? { ...k, ten_hien: th } : k) as KhoiTrucQuan);
}
