// LX-2027 — hàm phía MÁY CHỦ cho Lì xì Báo cáo Tết 2027 (migration 0042_li_xi_tet.sql).
import { createClient } from "@supabase/supabase-js";
import { congDangBat } from "@/lib/thanh-toan/cong";
import { MA_LI_XI_RE, type BaoLiXiCongKhai, type ThongTinLiXi } from "@/lib/li-xi-tet";

const KHONG_LUU = { auth: { persistSession: false, autoRefreshToken: false } } as const;

const khachAnon = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, {
    ...KHONG_LUU,
    global: { fetch: (u, i) => fetch(u, { ...i, signal: AbortSignal.timeout(4_000) }) },
  });
};

export async function thongTinLiXi(): Promise<ThongTinLiXi> {
  const cong = congDangBat();
  const macDinh: ThongTinLiXi = { bat: false, gia_1: 99000, gia_3: 249000, gia_5: 399000, nam: 2027, han: "2027-03-31", cong };
  const sb = khachAnon();
  if (!sb) return macDinh;
  try {
    const { data, error } = await sb.rpc("li_xi_thong_tin");
    if (error || !data || typeof data !== "object") return macDinh;
    const d = data as Partial<ThongTinLiXi>;
    const so = (v: unknown, m: number) => (typeof v === "number" && Number.isFinite(v) ? v : m);
    return {
      bat: d.bat === true && cong !== null,
      gia_1: so(d.gia_1, macDinh.gia_1),
      gia_3: so(d.gia_3, macDinh.gia_3),
      gia_5: so(d.gia_5, macDinh.gia_5),
      nam: so(d.nam, 2027),
      han: typeof d.han === "string" ? d.han : macDinh.han,
      cong,
    };
  } catch {
    return macDinh;
  }
}

export async function docLiXi(ma: string): Promise<BaoLiXiCongKhai> {
  if (!MA_LI_XI_RE.test(ma)) return { co: false };
  const sb = khachAnon();
  if (!sb) return { co: false };
  try {
    const { data, error } = await sb.rpc("xem_li_xi_tet", { p_ma: ma });
    if (error || !data || typeof data !== "object") return { co: false };
    return data as BaoLiXiCongKhai;
  } catch {
    return { co: false };
  }
}
