"use client";
import { useState } from "react";
import { Hexagon } from "lucide-react";
import { KhungChat } from "@/components/hoi/KhungChat";
import { DauMang } from "@/components/huyen-hoc/KhungMang";
import { VeQue, type Quai } from "@/components/huyen-hoc/VeQue";
import { Input, Select } from "@/components/ui/input";
import { hoiMang, type HoiMangRes } from "@/lib/hoi-mang";

interface Res extends HoiMangRes {
  que?: { quai_ban: Quai; quai_bien: Quai | null; hao_dong: number[]; nguon_ngau_nhien?: string } | null;
  phan_loai?: { truong_phai: string | null };
  /** TP-LICH: Mai Hoa lấy năm/tháng/ngày âm theo âm lịch người dùng chọn. */
  mai_hoa?: { dau_vao?: { ngay_am?: number; thang_am?: number; nam_am?: number; chi_gio?: string; lich?: "viet" | "trung" } } | null;
}

const PHAI: Record<string, string> = { nghia_ly: "Nghĩa Lý", luc_hao: "Lục Hào", mai_hoa: "Mai Hoa" };
const KHOA_LS = "kd-da-hoi";

// Quẻ Mông: hỏi lại cùng việc thì lần xem mất giá trị → nhắc nếu đã hỏi trong 30 ngày (lưu trên máy).
function daHoiGanDay(cau: string): boolean {
  try {
    const m = JSON.parse(localStorage.getItem(KHOA_LS) ?? "{}") as Record<string, number>;
    const t = m[cau.trim().toLowerCase()];
    return !!t && Date.now() - t < 30 * 86400_000;
  } catch { return false; }
}
function ghiDaHoi(cau: string) {
  try {
    const m = JSON.parse(localStorage.getItem(KHOA_LS) ?? "{}") as Record<string, number>;
    m[cau.trim().toLowerCase()] = Date.now();
    localStorage.setItem(KHOA_LS, JSON.stringify(m));
  } catch { /* trình duyệt chặn lưu */ }
}

const GOI_Y = [
  { nhom: "Công việc", cau: ["Tôi có nên nhận lời làm quản lý không?", "Có nên chuyển việc trong năm nay?"] },
  { nhom: "Quan hệ", cau: ["Tôi có nên chủ động nói chuyện lại với bạn cũ?"] },
  { nhom: "Kiến thức", cau: ["Quẻ Càn có ý nghĩa gì?"] },
];

export function KinhDich() {
  const [cheDo, setCheDo] = useState("tu_dong");
  const [cach, setCach] = useState("may_gieo");
  const [tay, setTay] = useState("");
  const [lichMH, setLichMH] = useState<"viet" | "trung">("viet");

  async function gui(cau: string) {
    const vals = tay.split(/[^6-9]+/).filter(Boolean).map(Number);
    if (cach === "gieo_tay" && vals.length !== 6) return { loi: "Gieo tay: nhập đủ 6 số 6/7/8/9, từ hào 1 lên hào 6." };
    const nhac = daHoiGanDay(cau);
    const kq = await hoiMang<Res>(
      "/api/kinhdich/hoi",
      { cau_hoi: cau, che_do: cheDo, cach_ra_que: cach, ...(cach === "gieo_tay" ? { gia_tri_hao: vals } : {}),
        ...(cach === "mai_hoa" && lichMH === "trung" ? { lich: lichMH } : {}) },
      (d) => d.que ? (
        <div className="glass rounded-2xl p-4" data-testid="que">
          <div className="flex flex-wrap gap-8">
            <VeQue q={d.que.quai_ban} dong={d.que.hao_dong} nhan="Quẻ bản" />
            {d.que.quai_bien && <VeQue q={d.que.quai_bien} nhan="Quẻ biến" />}
          </div>
          {d.phan_loai?.truong_phai && (
            <p className="mt-3 text-xs text-fg-faint">Phái đọc: {PHAI[d.phan_loai.truong_phai] ?? d.phan_loai.truong_phai}
              {d.que.nguon_ngau_nhien ? ` · nguồn quẻ: ${d.que.nguon_ngau_nhien}` : ""}</p>
          )}
          {d.mai_hoa?.dau_vao?.ngay_am && (
            <p className="mt-1 text-xs text-fg-faint" data-testid="mai-hoa-lich">
              Mai Hoa lấy theo âm lịch {d.mai_hoa.dau_vao.lich === "trung" ? "Trung Quốc" : "Việt Nam"}: ngày {d.mai_hoa.dau_vao.ngay_am} tháng {d.mai_hoa.dau_vao.thang_am} năm {d.mai_hoa.dau_vao.nam_am}, giờ {d.mai_hoa.dau_vao.chi_gio}.
            </p>
          )}
        </div>
      ) : null,
      ["khong_gieo_lai"],
    );
    if (kq.van) ghiDaHoi(cau);
    if (nhac) kq.canhBao = ["Bạn đã hỏi đúng câu này trong 30 ngày qua. Theo lời quẻ Mông, hỏi lại cùng việc làm lần xem mất giá trị — nên suy ngẫm quẻ trước.", ...(kq.canhBao ?? [])];
    return kq;
  }

  return (
    <div>
      <DauMang Icon={Hexagon} ten="Kinh Dịch" mo_ta="Hỏi một quẻ cho MỘT việc cụ thể bạn đang cân nhắc. Quẻ do máy gieo ngẫu nhiên, Mai Hoa theo giờ, hoặc bạn tự gieo — AI không chọn quẻ. Lời đọc có nguồn, kèm mặt tối và câu tự soi." />
      <div className="mx-auto max-w-3xl">
        <KhungChat
            moDun="kinhdich"
          loiChao="Tĩnh tâm một chút, rồi viết câu hỏi về một việc cụ thể — càng rõ việc, quẻ càng dễ soi."
          goiY={GOI_Y}
          nhanO="Câu hỏi Kinh Dịch"
          goiYO="Có nên nhận lời làm quản lý không?"
          dieuKhien={
            <div className="grid gap-2 sm:grid-cols-2">
              <Select aria-label="Chế độ" value={cheDo} onChange={(e) => setCheDo(e.target.value)} className="h-10 text-sm">
                <option value="tu_dong">Tự động chọn phái</option>
                <option value="nghia_ly">Chỉ Nghĩa Lý (phản tư)</option>
                <option value="day_du">Đầy đủ (thành bại, ứng kỳ)</option>
              </Select>
              <Select aria-label="Cách ra quẻ" value={cach} onChange={(e) => setCach(e.target.value)} className="h-10 text-sm">
                <option value="may_gieo">Máy gieo ngẫu nhiên</option>
                <option value="mai_hoa">Mai Hoa theo giờ hiện tại</option>
                <option value="gieo_tay">Tôi tự gieo</option>
              </Select>
              {cach === "mai_hoa" && (
                <Select aria-label="Âm lịch cho Mai Hoa" value={lichMH} onChange={(e) => setLichMH(e.target.value as "viet" | "trung")} className="h-10 text-sm sm:col-span-2">
                  <option value="viet">Mai Hoa theo âm lịch Việt Nam</option>
                  <option value="trung">Mai Hoa theo âm lịch Trung Quốc</option>
                </Select>
              )}
              {cach === "gieo_tay" && (
                <Input aria-label="Sáu hào tự gieo" value={tay} onChange={(e) => setTay(e.target.value)}
                  placeholder="6 hào (6/7/8/9), hào 1 → 6: 7 7 8 7 7 9" className="h-10 text-sm sm:col-span-2" />
              )}
            </div>
          }
          gui={gui}
        />
      </div>
    </div>
  );
}
