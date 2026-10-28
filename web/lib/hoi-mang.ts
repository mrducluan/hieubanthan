"use client";
import { fetchSao } from "@/lib/sao-client";
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
  error?: string;
  luot?: LuotHoi;
}

/** SAO-2: máy chủ báo lượt miễn phí còn lại / Sao vừa trừ → một dòng nhỏ dưới câu trả lời. */
export type LuotHoi = { con_lai: number; tran: number; tai_khoan: boolean } | { sao_da_tru: number; so_du: number | null };
export function ghiLuot(l?: LuotHoi): string | undefined {
  if (!l) return undefined;
  if ("sao_da_tru" in l) return l.sao_da_tru ? `Đã dùng ${l.sao_da_tru} Sao cho câu này${l.so_du != null ? ` · ví còn ${l.so_du} Sao` : ""}.` : undefined;
  if (l.con_lai > 2) return undefined;
  return l.con_lai === 0
    ? `Đây là câu miễn phí cuối của hôm nay.${l.tai_khoan ? " Câu tiếp theo dùng Sao." : " Đăng nhập để hỏi thêm."}`
    : `Còn ${l.con_lai} câu miễn phí hôm nay.`;
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
  if (!d.cau_tra_loi) return { loi: d.error ?? "Chưa trả lời được lúc này, thử lại sau." };
  return {
    ghiLuot: ghiLuot(d.luot),
    van: d.cau_tra_loi,
    thuatNgu: d.thuat_ngu,
    trucQuan: d.truc_quan,
    hoiTiep: d.hoi_tiep,
    canCu: d.can_cu?.length ? d.can_cu : undefined,
    phu: phu?.(d),
    canhBao: d.co_canh_bao?.filter((c) => !boQuaCanhBao.includes(c.loai)).map((c) => c.chi_tiet),
    ghiChu: d.che_do === "llm" ? "Diễn đạt tự động từ kho tri thức có nguồn." : "Ghép từ kho tri thức có nguồn.",
  };
}
