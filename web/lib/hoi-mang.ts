"use client";
import type { KetQuaHoi } from "@/components/hoi/KhungChat";
import type { ThuatNgu } from "@/components/hoi/ThuatNgu";

export interface HoiMangRes {
  cau_tra_loi?: string;
  che_do?: string;
  co_canh_bao?: { loai: string; chi_tiet: string }[];
  thuat_ngu?: ThuatNgu[];
  error?: string;
}

/** Gọi /api/<mảng>/hoi và chuẩn hoá cho KhungChat. `phu` dựng từ phản hồi thô nếu cần. */
export async function hoiMang<T extends HoiMangRes>(
  url: string,
  body: unknown,
  phu?: (d: T) => KetQuaHoi["phu"],
  boQuaCanhBao: string[] = [],
): Promise<KetQuaHoi> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const d = (await r.json().catch(() => ({}))) as T;
  if (!d.cau_tra_loi) return { loi: d.error ?? "Chưa trả lời được lúc này, thử lại sau." };
  return {
    van: d.cau_tra_loi,
    thuatNgu: d.thuat_ngu,
    phu: phu?.(d),
    canhBao: d.co_canh_bao?.filter((c) => !boQuaCanhBao.includes(c.loai)).map((c) => c.chi_tiet),
    ghiChu: d.che_do === "llm" ? "Diễn đạt bởi AI từ kho tri thức có nguồn." : "Ghép từ kho tri thức có nguồn.",
  };
}
