// SAO-CG (0029) — "Hỏi chuyên gia" phía MÁY CHỦ: đọc thông tin (công tắc, giá, lần đầu) từ SQL cùng nguồn với hàm tạo câu hỏi,
// hỏi lượt hội viên (0028 — không có thì coi như không phải hội viên), và dựng "bảng số do engine tính" cho chuyên gia trả lời
// có căn cứ (web không tính gì; chỉ gọi engine rồi rút vài dòng).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { congDangBat, khachNguoiMua } from "@/lib/thanh-toan/cong";
import { goiEngineDaKiem } from "@/lib/proxy";
import { GIO_DAI_DIEN_KHONG_BIET } from "@/lib/hoso";
import type { HoSoCg, MangCg, ThongTinCg } from "@/lib/chuyen-gia-hoi";

const KHONG_LUU = { auth: { persistSession: false, autoRefreshToken: false } } as const;

/** Thông tin cho trang /hoi-chuyen-gia. Chưa chạy 0029 / thiếu Supabase → bat=false (không hứa điều máy chủ chưa làm). */
export async function thongTinChuyenGia(req?: Request): Promise<ThongTinCg> {
  const tat: ThongTinCg = { bat: false, gia_vnd: 199000, giam_lan_dau_pt: 30, han_gio: 48, gia_lan_dau: 139000, lan_dau: null,
    gia_lan_nay: 139000, dang_cho: null, cong: congDangBat(), dang_nhap: false, hoi_vien_con_luot: null };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return tat;
  try {
    const nm = req?.headers.get("authorization") ? await khachNguoiMua(req) : null;
    const sb = nm?.sb ?? createClient(url, anon, KHONG_LUU);
    const { data, error } = await sb.rpc("chuyen_gia_thong_tin");
    if (error || !data || typeof data !== "object") return tat;
    const d = data as Partial<ThongTinCg>;
    const so = (v: unknown, m: number) => (typeof v === "number" && Number.isFinite(v) ? v : m);
    return {
      bat: d.bat === true, gia_vnd: so(d.gia_vnd, tat.gia_vnd), giam_lan_dau_pt: so(d.giam_lan_dau_pt, tat.giam_lan_dau_pt),
      han_gio: so(d.han_gio, tat.han_gio), gia_lan_dau: so(d.gia_lan_dau, tat.gia_lan_dau),
      lan_dau: typeof d.lan_dau === "boolean" ? d.lan_dau : null, gia_lan_nay: so(d.gia_lan_nay, tat.gia_lan_nay),
      dang_cho: typeof d.dang_cho === "number" ? d.dang_cho : null,
      cong: congDangBat(), dang_nhap: Boolean(nm), hoi_vien_con_luot: nm ? await hoiVienConLuot(nm.sb) : null,
    };
  } catch {
    return tat;
  }
}

/** 0028 (hội viên): số câu hỏi chuyên gia còn trong gói, đọc qua RPC `hoi_vien_cua_toi` nếu có. Không có hàm / lỗi / không
 *  phải hội viên → null (nút "Dùng lượt hội viên" ẩn). Khi gộp 0028, chỉ cần hàm đó trả một trong các khoá số bên dưới. */
export async function hoiVienConLuot(sb: SupabaseClient): Promise<number | null> {
  try {
    const { data, error } = await sb.rpc("hoi_vien_cua_toi");
    if (error || !data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    for (const k of ["cau_hoi_chuyen_gia_con", "con_cau_hoi", "cau_hoi_con", "con_luot", "luot_con"]) {
      if (typeof d[k] === "number") return Math.max(0, Math.floor(d[k] as number));
    }
    return null;
  } catch {
    return null;
  }
}

export interface DongSo { ten: string; gia_tri: string }
export interface BangSo { mang: MangCg; dong: DongSo[]; ghi_chu: string | null; tho: unknown }

const ten = (x: unknown): string => (x && typeof x === "object" && "ten" in x ? String((x as { ten: unknown }).ten) : String(x ?? ""));
const canChi = (x: unknown): string => (x && typeof x === "object" ? `${(x as { can?: unknown }).can ?? ""} ${(x as { chi?: unknown }).chi ?? ""}`.trim() : String(x ?? ""));

/** Bảng số tóm tắt cho chuyên gia theo mảng, từ ảnh chụp hồ sơ người dùng đã đồng ý chia sẻ. Thiếu dữ kiện (giờ, giới tính) →
 *  ghi chú thay vì đoán. Engine lỗi → ghi chú, không vỡ trang. */
export async function bangSoChuyenGia(mang: MangCg, hs: HoSoCg | null): Promise<BangSo> {
  if (!hs) return { mang, dong: [], ghi_chu: "Người hỏi không chia sẻ hồ sơ — trả lời theo câu chữ.", tho: null };
  const [nam, thang, ngay] = hs.ngay_sinh.split("-").map(Number);
  const gio = hs.gio_sinh ?? GIO_DAI_DIEN_KHONG_BIET;
  const doTin = hs.gio_sinh ? hs.do_tin_gio ?? "exact" : "unknown";
  const laSo = {
    birth_date: hs.ngay_sinh, birth_time: gio, gender: hs.gioi_tinh, do_tin_gio: doTin,
    ...(hs.noi_sinh ? { noi_sinh: hs.noi_sinh } : {}), ...(hs.gio_mua_he ? { gio_mua_he: true } : {}),
  };
  try {
    if (mang === "than_so") {
      const r = await goiEngineDaKiem({ ho_ten: [hs.ho_ten], ngay, thang, nam, quy_uoc_duong_doi: "tung_phan" }, "/v1/thanso/tong-hop");
      if (!r.ok) return { mang, dong: [], ghi_chu: "Engine chưa trả được số thần số.", tho: null };
      const b = r.body as { ho_so?: { pitago?: Record<string, { so?: unknown; goc?: unknown }>; chaldea?: Record<string, { so?: unknown; kep?: unknown; goc?: unknown }> } };
      const p = b.ho_so?.pitago ?? {}, c = b.ho_so?.chaldea ?? {};
      const nhan: Record<string, string> = { duong_doi: "Đường đời", su_menh: "Sứ mệnh", linh_hon: "Linh hồn", nhan_cach: "Nhân cách" };
      const dong: DongSo[] = Object.entries(nhan).map(([k, t]) => ({
        ten: t, gia_tri: `${p[k]?.so ?? "—"}${p[k]?.goc != null && p[k]?.goc !== p[k]?.so ? ` (gốc ${p[k]?.goc})` : ""} · Chaldea ${c[k]?.so ?? "—"}`,
      }));
      return { mang, dong, ghi_chu: "Đường đời theo cách \"Rút gọn con số\" (mặc định web). Hồ sơ không mang tên khác (ten_khac).", tho: b.ho_so ?? null };
    }
    if (mang === "phong_thuy") {
      if (!hs.gioi_tinh) return { mang, dong: [], ghi_chu: "Thiếu giới tính → không tính được mệnh quái.", tho: null };
      const r = await goiEngineDaKiem({ birth_date: hs.ngay_sinh, gender: hs.gioi_tinh }, "/v1/phongthuy/menh-quai");
      if (!r.ok) return { mang, dong: [], ghi_chu: "Engine chưa trả được mệnh quái.", tho: null };
      const b = r.body as { quai?: unknown; nhom?: unknown; huong_cat?: unknown[]; bang_huong?: Record<string, string>; moc_khac?: boolean };
      return { mang, dong: [
        { ten: "Mệnh quái", gia_tri: `${b.quai ?? "—"} (${b.nhom ?? "—"})` },
        { ten: "Hướng tốt", gia_tri: (b.huong_cat ?? []).map(String).join(", ") || "—" },
        { ten: "Du niên 8 hướng", gia_tri: Object.entries(b.bang_huong ?? {}).map(([h, d]) => `${h}: ${d}`).join(" · ") || "—" },
      ], ghi_chu: b.moc_khac ? "Mốc Lập xuân / Tết cho quái KHÁC nhau — nói rõ với người hỏi." : null, tho: b };
    }
    if (mang === "kinh_dich") return { mang, dong: [], ghi_chu: "Kinh Dịch không cần hồ sơ — gieo quẻ theo câu hỏi của người dùng nếu cần.", tho: null };
    if (!hs.gioi_tinh) return { mang, dong: [], ghi_chu: "Thiếu giới tính → không lập được lá số.", tho: null };
    if (mang === "tu_vi") {
      const r = await goiEngineDaKiem(laSo, "/v1/tuvi/an-sao");
      if (!r.ok) return { mang, dong: [], ghi_chu: "Engine chưa trả được lá số Tử vi.", tho: null };
      const b = r.body as { tu_tru?: unknown; menh_chu?: unknown; than_chu?: unknown; ngu_hanh_cuc?: unknown; chi_cung_menh?: unknown;
        am_lich?: { ngay?: unknown; thang?: unknown; nam?: unknown; nhuan?: unknown }; cung?: { ten: string; chi: string; la_menh?: boolean; la_than?: boolean; chinh_tinh?: { ten: string; do_sang_nam_phai?: string | null; tu_hoa?: string | null }[] }[] };
      const dong: DongSo[] = [
        { ten: "Tứ trụ", gia_tri: String(b.tu_tru ?? "—") },
        { ten: "Âm lịch", gia_tri: b.am_lich ? `${b.am_lich.ngay}/${b.am_lich.thang}${b.am_lich.nhuan ? " nhuận" : ""}/${b.am_lich.nam}` : "—" },
        { ten: "Cục · Mệnh chủ · Thân chủ", gia_tri: `${b.ngu_hanh_cuc ?? "—"} · ${b.menh_chu ?? "—"} · ${b.than_chu ?? "—"}` },
        { ten: "Mệnh tại", gia_tri: String(b.chi_cung_menh ?? "—") },
        ...(b.cung ?? []).map((cg) => ({
          ten: `${cg.ten} (${cg.chi})${cg.la_menh ? " · Mệnh" : ""}${cg.la_than ? " · Thân" : ""}`,
          gia_tri: (cg.chinh_tinh ?? []).map((s) => `${s.ten}${s.do_sang_nam_phai ? ` ${s.do_sang_nam_phai}` : ""}${s.tu_hoa ? ` [${s.tu_hoa}]` : ""}`).join(", ") || "vô chính diệu",
        })),
      ];
      return { mang, dong, ghi_chu: doTin === "unknown" ? "Người hỏi KHÔNG biết giờ sinh — lá số an tạm 12:00, chỉ dùng phần không phụ thuộc giờ." : null, tho: null };
    }
    const r = await goiEngineDaKiem(laSo, "/v1/battu/la-so");
    if (!r.ok) return { mang, dong: [], ghi_chu: "Engine chưa trả được tứ trụ.", tho: null };
    const b = r.body as { tru?: unknown[]; nhat_chu?: { can?: unknown; ngu_hanh?: unknown; am_duong?: unknown }; than?: { ket_luan?: unknown };
      thap_than_can?: unknown[]; dai_van?: { ds?: { can?: unknown; chi?: unknown; tu_nam?: unknown; den_nam?: unknown }[] }; ngu_hanh?: { diem?: Record<string, unknown> } };
    const tru = (b.tru ?? []).map(canChi);
    const dong: DongSo[] = [
      { ten: "Tứ trụ (năm · tháng · ngày · giờ)", gia_tri: tru.join(" · ") || "—" },
      { ten: "Nhật chủ", gia_tri: `${b.nhat_chu?.can ?? "—"} ${b.nhat_chu?.ngu_hanh ?? ""} ${b.nhat_chu?.am_duong ?? ""}`.trim() },
      { ten: "Thập thần can", gia_tri: (b.thap_than_can ?? []).map(String).join(" · ") || "—" },
      { ten: "Thân", gia_tri: ten(b.than?.ket_luan ?? "—") },
      { ten: "Ngũ hành (điểm)", gia_tri: Object.entries(b.ngu_hanh?.diem ?? {}).map(([k, v]) => `${k} ${v}`).join(" · ") || "—" },
      { ten: "Đại vận", gia_tri: (b.dai_van?.ds ?? []).slice(0, 8).map((d) => `${d.can ?? ""}${d.chi ?? ""} ${d.tu_nam ?? ""}–${d.den_nam ?? ""}`).join(" · ") || "—" },
    ];
    return { mang, dong, ghi_chu: doTin === "unknown" ? "Người hỏi KHÔNG biết giờ sinh — trụ giờ an tạm, bỏ qua trụ giờ khi luận." : null, tho: null };
  } catch {
    return { mang, dong: [], ghi_chu: "Không kết nối được máy tính toán.", tho: null };
  }
}
