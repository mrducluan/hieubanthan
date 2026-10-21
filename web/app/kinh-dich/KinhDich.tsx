"use client";
import { useEffect, useRef, useState } from "react";
import { Hexagon } from "lucide-react";
import { KhungChat } from "@/components/hoi/KhungChat";
import { CuoiBaiDoc } from "@/components/khung/CuoiBaiDoc";
import { batDauDoc } from "@/lib/do-luong";
import { DauMang } from "@/components/huyen-hoc/KhungMang";
import { VeQue, type Quai } from "@/components/huyen-hoc/VeQue";
import { Input, Select } from "@/components/ui/input";
import { hoiMang, type HoiMangRes } from "@/lib/hoi-mang";
import { cn } from "@/lib/utils";
import { DocQue, type DocQueKq } from "@/components/huyen-hoc/DocQue";
import { ghi } from "@/lib/do-luong";

interface Res extends HoiMangRes {
  que?: { quai_ban: Quai; quai_bien: Quai | null; hao_dong: number[]; nguon_ngau_nhien?: string } | null;
  phan_loai?: { truong_phai: string | null };
  /** TP-LICH: Mai Hoa lấy năm/tháng/ngày âm theo âm lịch người dùng chọn. */
  mai_hoa?: { dau_vao?: { ngay_am?: number; thang_am?: number; nam_am?: number; chi_gio?: string; lich?: "viet" | "trung"; cach?: string; so?: number[]; huong?: string } } | null;
  /** KD-ĐS: lời đọc đời thường hai tầng; câu mơ hồ → engine hỏi lại trước khi gieo. */
  doc_que?: DocQueKq | null;
  chu_de?: { ma: string; ten: string } | null;
  can_lam_ro?: { ma: string; cau_hoi: string; lua_chon: { ma: string; nhan: string }[] } | null;
}
const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];

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
  // HN-3: link "Quẻ ngày"/"Gieo Mai Hoa giờ này" từ /hom-nay mở sẵn Mai Hoa theo giờ hiện tại (?cach=mai_hoa).
  useEffect(() => { if (new URLSearchParams(location.search).get("cach") === "mai_hoa") setCach("mai_hoa"); }, []);
  const [tay, setTay] = useState("");
  const [lichMH, setLichMH] = useState<"viet" | "trung">("viet");
  const [coQue, setCoQue] = useState(false);   // Gate 1: đã có lời quẻ → bắt đầu đọc + mốc đọc xong/góp ý dưới khung
  // KD-ĐS: Mai Hoa theo số / phương vị; chủ đề (chip) đi kèm MỘT câu hỏi tiếp theo; câu đẩy từ chip "Hỏi tiếp".
  const [soMH, setSoMH] = useState(["", ""]);
  const [phuongMH, setPhuongMH] = useState("Đông");
  const [chuDe, setChuDe] = useState<{ ma: string; ten: string }[]>([]);
  const chuDeChon = useRef<string | null>(null);
  const [cauNgoai, setCauNgoai] = useState<{ cau: string; lan: number } | null>(null);
  useEffect(() => {
    fetch("/api/kinhdich/chu-de").then((r) => (r.ok ? r.json() : null)).then((d) => setChuDe((d?.chu_de ?? []) as { ma: string; ten: string }[])).catch(() => setChuDe([]));
  }, []);
  const hoiLai = (cau: string, ma?: string) => { if (ma) chuDeChon.current = ma; setCauNgoai({ cau, lan: Date.now() }); };

  async function gui(cau: string) {
    const vals = tay.split(/[^6-9]+/).filter(Boolean).map(Number);
    if (cach === "gieo_tay" && vals.length !== 6) return { loi: "Gieo tay: nhập đủ 6 số 6/7/8/9, từ hào 1 lên hào 6." };
    const so = soMH.map((x) => Number(x));
    if (cach === "mai_hoa_so" && !so.every((x) => Number.isInteger(x) && x >= 1 && x <= 9999)) return { loi: "Mai Hoa theo số: nhập hai số nguyên từ 1 đến 9999 (số bạn tự chọn, vd số nhà, số đồ vật đếm được)." };
    const nhac = daHoiGanDay(cau);
    const ma = chuDeChon.current; chuDeChon.current = null;
    const giu: { dq: DocQueKq | null } = { dq: null };   // lấy doc_que từ phản hồi thô (hoiMang chỉ trả bản chuẩn hoá)
    const kq = await hoiMang<Res>(
      "/api/kinhdich/hoi",
      { cau_hoi: cau, che_do: cheDo, cach_ra_que: cach, ...(cach === "gieo_tay" ? { gia_tri_hao: vals } : {}),
        ...(cach === "mai_hoa" && lichMH === "trung" ? { lich: lichMH } : {}),
        ...(cach === "mai_hoa_so" ? { so_mai_hoa: so } : {}), ...(cach === "mai_hoa_phuong" ? { phuong_mai_hoa: phuongMH } : {}),
        ...(ma ? { chu_de: ma } : {}) },
      (d) => (
        (giu.dq = d.doc_que ?? null),
        <div className="space-y-3">
          {d.can_lam_ro && (
            <div className="flex flex-wrap gap-2" data-testid="lam-ro">
              {d.can_lam_ro.lua_chon.map((l) => (
                <button key={l.ma} type="button" onClick={() => hoiLai(cau, l.ma)}
                  className="rounded-full border border-gold/60 px-3 py-1 text-sm text-gold hover:bg-gold/10">{l.nhan}</button>
              ))}
            </div>
          )}
          {d.que && (
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
              {d.mai_hoa?.dau_vao?.cach === "so" && <p className="mt-1 text-xs text-fg-faint" data-testid="mai-hoa-so">Mai Hoa theo số bạn chọn: {d.mai_hoa.dau_vao.so?.join(" và ")}, giờ {d.mai_hoa.dau_vao.chi_gio}.</p>}
              {d.mai_hoa?.dau_vao?.cach === "phuong_vi" && <p className="mt-1 text-xs text-fg-faint" data-testid="mai-hoa-phuong">Mai Hoa theo phương {d.mai_hoa.dau_vao.huong}, giờ {d.mai_hoa.dau_vao.chi_gio}.</p>}
            </div>
          )}
          {d.doc_que && <DocQue id={`dq-${Date.now()}`} dq={d.doc_que} thuatNgu={d.thuat_ngu} vanDayDu={d.cau_tra_loi} onHoi={(c) => hoiLai(c)} anKetLuan />}
        </div>
      ),
      ["khong_gieo_lai"],
    );
    // Có lời đọc đời thường → lời chính là bản đời thường; bản theo sách gập trong DocQue. Câu hỏi lại → chỉ hiện câu hỏi.
    if (kq.van && giu.dq) kq.van = giu.dq.ket_luan;          // lời chính = kết luận đời thường; bản theo sách gập trong DocQue
    if (kq.van) {
      ghiDaHoi(cau); batDauDoc("kinhdich"); setCoQue(true);
    }
    if (nhac) kq.canhBao = ["Bạn đã hỏi đúng câu này trong 30 ngày qua. Theo lời quẻ Mông, hỏi lại cùng việc làm lần xem mất giá trị — nên suy ngẫm quẻ trước.", ...(kq.canhBao ?? [])];
    return kq;
  }

  return (
    <div>
      <DauMang Icon={Hexagon} ten="Kinh Dịch" mo_ta="Đang phân vân một việc? Gieo một quẻ, nhận câu trả lời ngắn bằng lời thường: việc đang thuận hay cần đổi cách, và nên làm gì trong tuần này. Quẻ do máy gieo, theo giờ, theo số hay phương vị, hoặc bạn tự gieo — AI không chọn quẻ. Lời kinh gốc và ba cách đọc theo phái gập bên dưới cho ai muốn đào sâu." />
      <div className="mx-auto max-w-3xl">
        <KhungChat
            moDun="kinhdich"
          loiChao="Tĩnh tâm một chút, rồi viết câu hỏi về một việc cụ thể — càng rõ việc, quẻ càng dễ soi."
          goiY={GOI_Y}
          nhanO="Câu hỏi Kinh Dịch"
          goiYO="Có nên nhận lời làm quản lý không?"
          cauNgoai={cauNgoai}
          dieuKhien={
            <div className="grid gap-2 sm:grid-cols-2">
              {chuDe.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:col-span-2" data-testid="chip-chu-de" aria-label="Chủ đề câu hỏi">
                  <span className="self-center text-xs text-fg-faint">Bạn đang hỏi về:</span>
                  {chuDe.map((c) => (
                    <button key={c.ma} type="button" aria-pressed={chuDeChon.current === c.ma}
                      onClick={() => { chuDeChon.current = chuDeChon.current === c.ma ? null : c.ma; setChuDe((x) => [...x]); ghi("pain_point_clicked", { mo_dun: "kinhdich", ma: c.ma }); }}
                      className={cn("rounded-full border px-2.5 py-0.5 text-xs", chuDeChon.current === c.ma ? "border-gold/70 text-gold" : "border-line text-fg-muted hover:text-fg")}>{c.ten}</button>
                  ))}
                </div>
              )}
              <Select aria-label="Chế độ" value={cheDo} onChange={(e) => setCheDo(e.target.value)} className="h-10 text-sm">
                <option value="tu_dong">Tự động chọn phái</option>
                <option value="nghia_ly">Chỉ Nghĩa Lý (phản tư)</option>
                <option value="day_du">Đầy đủ (thành bại, ứng kỳ)</option>
              </Select>
              <Select aria-label="Cách ra quẻ" value={cach} onChange={(e) => setCach(e.target.value)} className="h-10 text-sm">
                <option value="may_gieo">Máy gieo ngẫu nhiên</option>
                <option value="mai_hoa">Mai Hoa theo giờ hiện tại</option>
                <option value="mai_hoa_so">Mai Hoa theo hai số tôi chọn</option>
                <option value="mai_hoa_phuong">Mai Hoa theo phương vị</option>
                <option value="gieo_tay">Tôi tự gieo</option>
              </Select>
              {cach === "mai_hoa_so" && (
                <div className="flex gap-2 sm:col-span-2">
                  <Input inputMode="numeric" value={soMH[0]} onChange={(e) => setSoMH([e.target.value.replace(/\D/g, "").slice(0, 4), soMH[1] ?? ""])} placeholder="Số thứ nhất (quẻ trên)" aria-label="Số thứ nhất" className="h-10 text-sm" />
                  <Input inputMode="numeric" value={soMH[1]} onChange={(e) => setSoMH([soMH[0] ?? "", e.target.value.replace(/\D/g, "").slice(0, 4)])} placeholder="Số thứ hai (quẻ dưới)" aria-label="Số thứ hai" className="h-10 text-sm" />
                </div>
              )}
              {cach === "mai_hoa_phuong" && (
                <Select aria-label="Phương vị" value={phuongMH} onChange={(e) => setPhuongMH(e.target.value)} className="h-10 text-sm sm:col-span-2">
                  {HUONG8.map((h) => <option key={h} value={h}>Phương {h} (nơi điều bạn thấy / người tới từ phía đó)</option>)}
                </Select>
              )}
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
        {coQue && <CuoiBaiDoc moDun="kinhdich" cauHoi="Lời quẻ có giúp bạn nhìn rõ việc đang cân nhắc?" />}
      </div>
    </div>
  );
}
