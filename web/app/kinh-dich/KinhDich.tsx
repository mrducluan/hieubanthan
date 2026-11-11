"use client";
import { useEffect, useRef, useState } from "react";
import { Hexagon } from "lucide-react";
import { KhungChat } from "@/components/hoi/KhungChat";
import { CuoiBaiDoc } from "@/components/khung/CuoiBaiDoc";
import { batDauDoc } from "@/lib/do-luong";
import { DauMang } from "@/components/huyen-hoc/KhungMang";
import { VeQue, type Quai } from "@/components/huyen-hoc/VeQue";
import { TrucQuan } from "@/components/hoi/TrucQuan";
import { Input, Select } from "@/components/ui/input";
import { hoiMang, type HoiMangRes } from "@/lib/hoi-mang";
import { cn } from "@/lib/utils";
import { DocQue, type DocQueKq } from "@/components/huyen-hoc/DocQue";
import { ghi } from "@/lib/do-luong";
import { CHE_DO_THEO_PHAI, daChonTay, danhDauChonTay, phaiUuThich } from "@/lib/thoi-quen-doc";
// UI-KD: nghi thức lật đồng xu · bộ chọn tự gieo · cách gieo thật · lịch sử quẻ trên máy · thẻ chia sẻ quẻ
import { ChonHao } from "@/components/kinh-dich/ChonHao";
import { CachGieo } from "@/components/kinh-dich/CachGieo";
import { KetQuaQue } from "@/components/kinh-dich/KetQuaQue";
import { LichSuQue } from "@/components/kinh-dich/LichSuQue";
import { HoiSau30Ngay } from "@/components/khung/HoiSau30Ngay";
import { ghiNhanDung } from "@/lib/kiem-chung-sau";
import { NutChiaSeQue } from "@/components/kinh-dich/NutChiaSeQue";
import { type GiaTriHao, giaTriTuQue, laGiaTriHao } from "@/lib/dong-xu";
import { luuQue, nhanLuc, type QueDaLuu } from "@/lib/lich-su-que";
import { ChanQr } from "@/components/khung/ChanQr";

interface Res extends HoiMangRes {
  que?: { quai_ban: Quai; quai_bien: Quai | null; hao_dong: number[]; nguon_ngau_nhien?: string; gia_tri_hao_1_den_6?: number[] } | null;
  phan_loai?: { truong_phai: string | null };
  /** TP-LICH: Mai Hoa lấy năm/tháng/ngày âm theo âm lịch người dùng chọn. `chi_nam`, `thoi_diem` (giờ VN) engine trả kèm. */
  mai_hoa?: { dau_vao?: { ngay_am?: number; thang_am?: number; nam_am?: number; chi_nam?: string; chi_gio?: string; lich?: "viet" | "trung"; cach?: string; so?: number[]; huong?: string; thoi_diem?: string } } | null;
  /** KD-ĐS: lời đọc đời thường hai tầng; câu mơ hồ → engine hỏi lại trước khi gieo. */
  doc_que?: DocQueKq | null;
  chu_de?: { ma: string; ten: string } | null;
  /** UI-KD: thời điểm gieo engine dùng (giờ VN) + can chi ngày, chi giờ, tuần không — web chỉ hiển thị. */
  thoi_diem_gieo?: { thoi_diem: string; chi_gio: string; can_ngay: string; chi_ngay: string; chi_thang: string; tuan_khong: string[] } | null;
  can_lam_ro?: { ma: string; cau_hoi: string; lua_chon: { ma: string; nhan: string }[] } | null;
}
const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];

const PHAI: Record<string, string> = { nghia_ly: "Nghĩa Lý", luc_hao: "Lục Hào", mai_hoa: "Mai Hoa" };
const KHOA_LS = "kd-da-hoi";
const SAU_NULL: (GiaTriHao | null)[] = [null, null, null, null, null, null];

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
/** "2026-10-23T14:05" (giờ VN engine trả) → "14:05 ngày 23/10". */
/** Ngày hôm nay theo giờ Việt Nam (YYYY-MM-DD) — mốc hỏi lại sau 30 ngày. */
const ngayVN = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
/** Mốc UTC (ISO) → chuỗi giờ Việt Nam không múi "YYYY-MM-DDTHH:MM:SS" cho engine (engine đọc `thoi_diem` là giờ VN). */
function gioVietNam(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 19);
}
function nhanThoiDiem(iso?: string): string | null {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? `${m[4]}:${m[5]} ngày ${m[3]}/${m[2]}` : null;
}

interface HieuCau {
  gieo: boolean; loai?: string | null; chu_de?: { ma: string; ten: string } | null; kieu?: string | null; kieu_ten?: string | null;
  vai?: string | null; ten_dung_than?: string | null; can_lam_ro?: { ma: string; cau_hoi: string; lua_chon: { ma: string; nhan: string }[] } | null;
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
  // KD-2c: Hôm nay "Quẻ ngày của bạn" → ?cach=mai_hoa_so&so=7,12 điền sẵn hai số để đọc kỹ cùng quẻ cho việc cụ thể.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const c = q.get("cach");
    if (c === "mai_hoa") setCach("mai_hoa");
    if (c === "mai_hoa_so") {
      const so = (q.get("so") ?? "").split(",").map((x) => x.replace(/\D/g, "").slice(0, 4));
      if (so.length === 2 && so.every((x) => x && Number(x) >= 1)) { setCach("mai_hoa_so"); setSoMH([so[0]!, so[1]!]); }
    }
  }, []);
  // KC-5: thói quen đọc (đếm trên máy) → chế độ mặc định theo phái hay mở, trừ khi người dùng đã tự chọn tay.
  useEffect(() => {
    const p = phaiUuThich();
    if (p && CHE_DO_THEO_PHAI[p] && !daChonTay()) setCheDo(CHE_DO_THEO_PHAI[p]!);
  }, []);
  const [maYDinh, setMaYDinh] = useState<string | null>(null);
  // UI-KD 2: "Tôi tự gieo" = 6 giá trị chọn bằng đồng xu / kiểu hào (null = chưa chọn); ô gõ nhanh vẫn còn trong ChonHao.
  const [giaTriTay, setGiaTriTay] = useState<(GiaTriHao | null)[]>(SAU_NULL);
  const [lichMH, setLichMH] = useState<"viet" | "trung">("viet");
  const [coQue, setCoQue] = useState(false);   // Gate 1: đã có lời quẻ → bắt đầu đọc + mốc đọc xong/góp ý dưới khung
  // KD-ĐS: Mai Hoa theo số / phương vị; chủ đề (chip) đi kèm MỘT câu hỏi tiếp theo; câu đẩy từ chip "Hỏi tiếp".
  const [soMH, setSoMH] = useState(["", ""]);
  const [phuongMH, setPhuongMH] = useState("Đông");
  const [chuDe, setChuDe] = useState<{ ma: string; ten: string }[]>([]);
  const chuDeChon = useRef<string | null>(null);
  // KD-V3: engine hiểu câu TRƯỚC khi gieo (debounce 500 ms, ≥ 8 ký tự): chủ đề gợi ý + kiểu câu + câu làm rõ. Chỉ mã / nhãn
  // danh mục cố định đi về; người dùng vẫn đổi được bằng chip (chip đã chọn tay thắng gợi ý).
  const [tuNhan, setTuNhan] = useState<HieuCau | null>(null);
  const [, veLai] = useState(0);
  const henHieu = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cauDangGo = useRef("");
  const cauDoi = (c: string) => {
    cauDangGo.current = c;
    if (henHieu.current) clearTimeout(henHieu.current);
    const t = c.trim();
    if (t.length < 8) { setTuNhan(null); return; }
    henHieu.current = setTimeout(() => {
      fetch("/api/kinhdich/hieu-cau", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cau_hoi: t.slice(0, 500) }) })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: HieuCau | null) => { if (cauDangGo.current.trim() === t && d) { setTuNhan(d); ghi("chart_interacted", { mo_dun: "kinhdich", kind: "hieu_cau", kieu: d.kieu ?? "khong", co_chu_de: Boolean(d.chu_de) }); } })
        .catch(() => { /* không gợi — người dùng vẫn chọn chip */ });
    }, 500);
  };
  useEffect(() => () => { if (henHieu.current) clearTimeout(henHieu.current); cauDangGo.current = ""; }, []);   // rời trang: huỷ hẹn, bỏ kết quả về muộn
  const chonChuDe = (ma: string | null) => { chuDeChon.current = ma; veLai((n) => n + 1); };
  // Tên hiển thị của mã chủ đề — chip chỉ có chủ đề gốc; biến thể (người kia là nữ / nam) lấy tên từ engine hiểu câu hoặc
  // nhãn nút làm rõ đã bấm (nhớ lại theo mã, không gọi thêm).
  const tenMa = useRef<Record<string, string>>({});
  if (tuNhan?.chu_de) tenMa.current[tuNhan.chu_de.ma] = tuNhan.chu_de.ten;
  for (const l of tuNhan?.can_lam_ro?.lua_chon ?? []) {
    // gốc dài nhất thắng: "hon_nhan_tt_nam" thuộc "hon_nhan_tt", không phải "hon_nhan"
    const goc = chuDe.filter((c) => l.ma.startsWith(c.ma + "_") || l.ma === c.ma).sort((a, b) => b.ma.length - a.ma.length)[0];
    if (goc) tenMa.current[l.ma] = l.ma === goc.ma ? goc.ten : `${goc.ten} (${l.nhan.toLowerCase()})`;
  }
  const tenCua = (ma: string) => chuDe.find((c) => c.ma === ma)?.ten ?? tenMa.current[ma] ?? ma;
  /** Chủ đề đang hiển thị = chip người dùng chọn tay, không có thì chủ đề engine tự nhận từ câu đang gõ. */
  const chuDeHien = chuDeChon.current ?? tuNhan?.chu_de?.ma ?? null;
  const [cauNgoai, setCauNgoai] = useState<{ cau: string; lan: number } | null>(null);
  // UI-KD 4: lịch sử quẻ trên máy; "Xem lại" = gọi lại engine với đúng 6 giá trị cũ (gieo_tay), không gieo lại, không lưu thêm.
  const xemLai = useRef<QueDaLuu | null>(null);
  const [lamMoiLS, setLamMoiLS] = useState(0);
  const [dang, setDang] = useState(false);
  useEffect(() => {
    // KC-3: link gợi mở từ mảng khác mang ?chu_de= → chọn sẵn chip.
    const q = new URLSearchParams(location.search).get("chu_de");
    if (q && /^[a-z_]{2,40}$/.test(q)) chuDeChon.current = q;
    fetch("/api/kinhdich/chu-de").then((r) => (r.ok ? r.json() : null)).then((d) => setChuDe((d?.chu_de ?? []) as { ma: string; ten: string }[])).catch(() => setChuDe([]));
  }, []);
  const hoiLai = (cau: string, ma?: string) => { if (ma) chuDeChon.current = ma; setCauNgoai({ cau, lan: Date.now() }); };
  const xemLaiQue = (q: QueDaLuu) => {
    xemLai.current = q;
    ghi("chart_interacted", { mo_dun: "kinhdich", kind: "que_replayed", nguon: q.cach });
    setCauNgoai({ cau: q.cau, lan: Date.now() });
  };

  async function gui(cau: string) {
    const laXemLai = xemLai.current; xemLai.current = null;
    const vals = laXemLai ? laXemLai.gia_tri_hao : giaTriTay.filter(laGiaTriHao);
    const cachGui = laXemLai ? "gieo_tay" : cach;
    if (cachGui === "gieo_tay" && vals.length !== 6) return { loi: "Tự gieo: chọn đủ 6 lần gieo (bấm đồng xu ngửa hoặc kiểu hào), từ lần 1 (hào dưới cùng) lên lần 6." };
    const so = soMH.map((x) => Number(x));
    if (cachGui === "mai_hoa_so" && !so.every((x) => Number.isInteger(x) && x >= 1 && x <= 9999)) return { loi: "Mai Hoa theo số: nhập hai số nguyên từ 1 đến 9999 (số bạn tự chọn, vd số nhà, số đồ vật đếm được)." };
    const nhac = !laXemLai && daHoiGanDay(cau);
    // Chủ đề gửi kèm: chip chọn tay, hoặc chủ đề tự nhận KHI câu không còn gì phải làm rõ (gửi chủ đề = engine bỏ bước làm rõ;
    // câu mơ hồ mà người dùng chưa chọn thì để engine hỏi lại như cũ).
    const tuNhanMa = tuNhan && !tuNhan.can_lam_ro ? (tuNhan.chu_de?.ma ?? null) : null;
    const ma = laXemLai ? (laXemLai.chu_de?.ma ?? null) : (chuDeChon.current ?? tuNhanMa); chuDeChon.current = null; setTuNhan(null);
    const giu: { d: Res | null } = { d: null };   // phản hồi thô (hoiMang chỉ trả bản chuẩn hoá)
    const lucGieo = new Date();
    setDang(true);
    let kq;
    try {
      kq = await hoiMang<Res>(
        "/api/kinhdich/hoi",
        { cau_hoi: cau, che_do: laXemLai ? laXemLai.che_do : cheDo, cach_ra_que: cachGui, ...(cachGui === "gieo_tay" ? { gia_tri_hao: vals } : {}),
          ...(cachGui === "mai_hoa" && lichMH === "trung" ? { lich: lichMH } : {}),
          ...(cachGui === "mai_hoa_so" ? { so_mai_hoa: so } : {}), ...(cachGui === "mai_hoa_phuong" ? { phuong_mai_hoa: phuongMH } : {}),
          ...(ma ? { chu_de: ma } : {}), ...(laXemLai && gioVietNam(laXemLai.luc) ? { thoi_diem: gioVietNam(laXemLai.luc) } : {}),
          dien_dat: true },
        (d) => { giu.d = d; if (d.doc_que?.y_dinh_chung) setMaYDinh(d.doc_que.y_dinh_chung); return null; },
        ["khong_gieo_lai"],
      );
    } finally { setDang(false); }
    const d = giu.d;
    if (nhac) kq.canhBao = ["Bạn đã hỏi đúng câu này trong 30 ngày qua. Theo lời quẻ Mông, hỏi lại cùng việc làm lần xem mất giá trị — nên suy ngẫm quẻ trước.", ...(kq.canhBao ?? [])];
    if (!kq.van || !d) return kq;

    // Không có quẻ (câu hỏi lại, câu đặc biệt / kiến thức): KhungChat hiện lời như cũ.
    if (!d.que) {
      if (d.can_lam_ro) {
        kq.phu = (
          <div className="flex flex-wrap gap-2" data-testid="lam-ro">
            {d.can_lam_ro.lua_chon.map((l) => (
              <button key={l.ma} type="button" onClick={() => hoiLai(cau, l.ma)}
                className="rounded-full border border-gold/60 px-3 py-1 text-sm text-gold hover:bg-gold/10">{l.nhan}</button>
            ))}
          </div>
        );
      }
      batDauDoc("kinhdich"); setCoQue(true);
      return kq;
    }

    // Có quẻ: lời chính = kết luận đời thường (bản theo sách gập trong DocQue); quẻ + lời hiện sau nghi thức lật xu (may_gieo).
    const que = d.que, dq = d.doc_que ?? null;
    const giaTri = giaTriTuQue(que);
    // KD-V3 hướng C: có bản AI diễn đạt (đã qua bộ kiểm engine) thì làm lời chính; kết luận tất định vẫn ở hộp đầu của DocQue.
    const vanAi = dq?.dien_dat === "tra_loi" ? dq.tra_loi?.van_ai : undefined;
    const van = dq ? (vanAi ?? dq.ket_luan) : kq.van;
    const nghiThuc = !laXemLai && cachGui === "may_gieo" && !!giaTri;
    if (!laXemLai) {
      ghiDaHoi(cau);
      if (giaTri) {
        luuQue({ cau, gia_tri_hao: giaTri, cach: cachGui, che_do: cheDo, chu_de: d.chu_de ?? null, ten_que: que.quai_ban.ten, ten_bien: que.quai_bien?.ten ?? null });
        setLamMoiLS((n) => n + 1);
        // KD-2d (P9): nhớ MÃ hộp lời đọc trên máy → ≥ 30 ngày sau Hôm nay / trang này hỏi "việc đó ra sao?" (phiếu chỉ mã, không câu hỏi).
        const hopTheoDoi = dq?.hop.find((h) => h.ma_mau && (h.loai === "loi_khuyen" || h.loai === "luu_y")) ?? dq?.hop.find((h) => h.ma_mau);
        if (dq && hopTheoDoi?.ma_mau) {
          ghiNhanDung({ loai: "doi_song", mau: hopTheoDoi.ma_mau, phai: dq.goc_nhin.chinh, mo_dun: "kinhdich", loai_hoi: "que",
            nhan: `Quẻ ${que.quai_ban.ten}${d.chu_de ? ` — ${d.chu_de.ten}` : ""}`.slice(0, 80) });
        }
      }
    }
    const mh = d.mai_hoa?.dau_vao;
    const thoiDiemMH = nhanThoiDiem(mh?.thoi_diem);
    const tdg = d.thoi_diem_gieo ?? null;
    const idDq = `dq-${Date.now()}`;
    const hao = kq.trucQuan?.some((k) => k.kieu === "hao") ? kq.trucQuan.filter((k) => k.kieu === "hao") : undefined;
    const phu = (
      <KetQuaQue giaTri={giaTri} nghiThuc={nghiThuc} cach={cachGui} van={van} thuatNgu={kq.thuatNgu} canCu={kq.canCu}
        ghiChu={vanAi ? "Phần trả lời được diễn đạt tự động từ lời đọc quẻ có nguồn; hộp bên dưới là bản gốc để đối chiếu." : kq.ghiChu} canhBao={kq.canhBao}
        trucQuan={hao}
        onHien={() => { batDauDoc("kinhdich"); setCoQue(true); }}>
        <div className="glass rounded-2xl p-4" data-testid="que">
          <div className="flex flex-wrap gap-8">
            {/* HD-CS đợt 3 (ý 4): có khối hào engine dựng → quẻ bản bấm được từng hào; không có (engine cũ) → hình tĩnh như trước. */}
            {hao ? (
              <div className="min-w-[15rem] flex-1">
                <TrucQuan ds={hao} />
                <p className="mt-2 font-serif text-xl" data-testid="ten-que-ban">{que.quai_ban.ten} <span className="text-xs text-fg-faint">quẻ {que.quai_ban.so_king_wen}</span></p>
              </div>
            ) : <VeQue q={que.quai_ban} dong={que.hao_dong} nhan="Quẻ bản" />}
            {que.quai_bien && <VeQue q={que.quai_bien} nhan="Quẻ biến" />}
          </div>
          <ChanQr className="max-w-sm" nhan="Quét để gieo quẻ của bạn" />
          {que.hao_dong.length > 0 && (
            <p className="mt-2 text-xs text-fg-muted" data-testid="giai-thich-dong">
              Vạch vàng là <b>hào động</b> ({que.hao_dong.map((h) => `hào ${h}`).join(", ")}) — chỗ việc đang chuyển; đổi vạch đó thì ra <b>quẻ biến</b>: xu hướng việc chuyển tới.
            </p>
          )}
          {d.phan_loai?.truong_phai && (
            <p className="mt-3 text-xs text-fg-faint">Phái đọc: {PHAI[d.phan_loai.truong_phai] ?? d.phan_loai.truong_phai}
              {que.nguon_ngau_nhien ? ` · nguồn quẻ: ${que.nguon_ngau_nhien}` : ""}</p>
          )}
          {mh?.ngay_am && (
            <p className="mt-1 text-xs text-fg-faint" data-testid="mai-hoa-lich">
              Mai Hoa lấy theo âm lịch {mh.lich === "trung" ? "Trung Quốc" : "Việt Nam"}: ngày {mh.ngay_am} tháng {mh.thang_am} năm {mh.nam_am}{mh.chi_nam ? ` (${mh.chi_nam})` : ""}, giờ {mh.chi_gio}{thoiDiemMH ? ` — lúc ${thoiDiemMH}` : ""}.
            </p>
          )}
          {mh?.cach === "so" && <p className="mt-1 text-xs text-fg-faint" data-testid="mai-hoa-so">Mai Hoa theo số bạn chọn: {mh.so?.join(" và ")}, giờ {mh.chi_gio}{tdg ? ` — lúc ${nhanThoiDiem(tdg.thoi_diem)} (giờ Việt Nam), ngày ${tdg.can_ngay} ${tdg.chi_ngay}` : ""}.</p>}
          {mh?.cach === "phuong_vi" && <p className="mt-1 text-xs text-fg-faint" data-testid="mai-hoa-phuong">Mai Hoa theo phương {mh.huong}, giờ {mh.chi_gio}{tdg ? ` — lúc ${nhanThoiDiem(tdg.thoi_diem)} (giờ Việt Nam), ngày ${tdg.can_ngay} ${tdg.chi_ngay}` : ""}.</p>}
          {!mh?.ngay_am && !laXemLai && (
            <p className="mt-1 text-xs text-fg-faint" data-testid="gio-gieo">
              {tdg ? `Gieo lúc ${nhanThoiDiem(tdg.thoi_diem)} (giờ Việt Nam) — giờ ${tdg.chi_gio}, ngày ${tdg.can_ngay} ${tdg.chi_ngay}, tháng ${tdg.chi_thang}, tuần không ${tdg.tuan_khong.join("/")}.`
                : `Gieo lúc ${nhanLuc(lucGieo.toISOString())} (giờ máy của bạn). Ngày tháng dùng cho Lục Hào ghi trong “Ba cách đọc cùng một quẻ”.`}
            </p>
          )}
          {laXemLai && (
            <p className="mt-1 text-xs text-fg-faint" data-testid="xem-lai-ghi-chu">
              Xem lại quẻ đã gieo lúc {nhanLuc(laXemLai.luc)} — sáu hào giữ nguyên, không gieo lại{tdg ? `; Lục Hào đọc theo ngày gieo (${tdg.can_ngay} ${tdg.chi_ngay}, giờ ${tdg.chi_gio})` : ""}.
            </p>
          )}
          {giaTri && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <NutChiaSeQue giaTri={giaTri} chuDe={d.chu_de?.ma ?? null} idSuffix={`-${idDq}`} />
            </div>
          )}
        </div>
        {dq && <DocQue id={idDq} dq={dq} thuatNgu={d.thuat_ngu} vanDayDu={d.cau_tra_loi} onHoi={(c) => hoiLai(c)} anKetLuan tenQue={que.quai_ban.ten} />}
      </KetQuaQue>
    );
    // Lời chính, giải nghĩa, cảnh báo, ghi chú được vẽ TRONG KetQuaQue (sau khi lật xong) — không trả cho KhungChat.
    return { ...kq, van: undefined, thuatNgu: undefined, canCu: undefined, ghiChu: undefined, canhBao: undefined, trucQuan: undefined, phu };
  }

  return (
    <div>
      <DauMang Icon={Hexagon} hinh="kinh-dich" ten="Gieo quẻ Kinh Dịch: việc này nên hay chưa?" mo_ta="Đang phân vân một việc? Gieo một quẻ, nhận câu trả lời ngắn bằng lời thường: việc đang thuận hay cần đổi cách, và nên làm gì trong tuần này. Quẻ do máy gieo (bạn tự lật từng hào), theo giờ, theo số hay phương vị, hoặc bạn gieo đồng xu thật rồi nhập — không bước nào tự chọn quẻ thay bạn. Lời kinh gốc và ba cách đọc theo phái gập bên dưới cho ai muốn đào sâu." />
      <div className="mx-auto max-w-3xl space-y-4">
        <KhungChat
            moDun="kinhdich"
          loiChao="Tĩnh tâm một chút, rồi viết câu hỏi về một việc cụ thể — càng rõ việc, quẻ càng dễ soi. Bấm một câu gợi ý thì câu đó điền vào ô, bạn sửa rồi gửi."
          goiY={GOI_Y}
          nhanO="Câu hỏi Kinh Dịch"
          goiYO="Viết câu hỏi của bạn, ví dụ: Có nên nhận lời làm quản lý không?"
          cauNgoai={cauNgoai}
          chipDienSan
          onCauDoi={cauDoi}
          dieuKhienDuoi={
            <div className="grid gap-2 sm:grid-cols-2">
              {/* KD-V3: chủ đề — engine tự nhận từ câu đang gõ (dòng "Mình hiểu…"), hàng chip MỘT dòng cuộn ngang để đổi; chip chọn tay thắng. */}
              {chuDe.length > 0 && (
                <div className="min-w-0 max-w-full sm:col-span-2" data-testid="chip-chu-de" aria-label="Chủ đề câu hỏi">
                  {/* min-w-0: ô lưới không được nở theo hàng chip cuộn ngang (điện thoại tràn 900px khi thiếu) */}
                  <p className="mb-1.5 text-xs text-fg-muted" data-testid="tu-nhan" aria-live="polite">
                    {tuNhan && !tuNhan.gieo ? (tuNhan.loai === "ky_thuat" || tuNhan.loai === "doc_que_da_co"
                      ? "Câu này là câu kiến thức — trả lời không cần gieo quẻ." : "Câu này được trả lời trực tiếp, không gieo quẻ.") : (
                      <>
                        {tuNhan?.kieu_ten ? <>Câu hỏi dạng <b className="text-fg">{tuNhan.kieu_ten}</b> · </> : null}
                        {chuDeHien ? <>Bạn đang hỏi về <b className="text-gold">{tenCua(chuDeHien)}</b>{chuDeChon.current ? "" : " (tự nhận — bấm chip để đổi)"}</>
                          : "Bạn đang hỏi về: chọn một chủ đề để quẻ chọn đúng hào đại diện (hoặc để máy tự nhận khi bạn gõ)."}
                      </>
                    )}
                  </p>
                  {tuNhan?.can_lam_ro && !chuDeChon.current && (
                    <div className="mb-2 flex flex-wrap items-center gap-1.5" data-testid="lam-ro-truoc">
                      <span className="text-xs text-fg-muted">{tuNhan.can_lam_ro.cau_hoi}</span>
                      {tuNhan.can_lam_ro.lua_chon.map((l) => (
                        <button key={l.ma} type="button" onClick={() => { chonChuDe(l.ma); ghi("pain_point_clicked", { mo_dun: "kinhdich", ma: l.ma }); }}
                          className="rounded-full border border-gold/60 px-2.5 py-0.5 text-xs text-gold hover:bg-gold/10">{l.nhan}</button>
                      ))}
                    </div>
                  )}
                  <div className="-mx-1 flex w-[calc(100%+0.5rem)] gap-1.5 overflow-x-auto px-1 pb-1 [mask-image:linear-gradient(to_right,black_92%,transparent)] [scrollbar-width:none]">
                    {[...chuDe].sort((a, b) => (a.ma === chuDeHien ? -1 : b.ma === chuDeHien ? 1 : 0)).map((c) => (
                      <button key={c.ma} type="button" aria-pressed={chuDeHien === c.ma}
                        onClick={() => { chonChuDe(chuDeChon.current === c.ma ? null : c.ma); ghi("pain_point_clicked", { mo_dun: "kinhdich", ma: c.ma }); }}
                        className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs", chuDeHien === c.ma ? "border-gold/70 bg-gold/10 text-gold" : "border-line text-fg-muted hover:text-fg")}>{c.ten}</button>
                    ))}
                  </div>
                </div>
              )}
              <Select aria-label="Chế độ" value={cheDo} onChange={(e) => { setCheDo(e.target.value); danhDauChonTay(); }} className="h-10 text-sm">
                <option value="tu_dong">Tự động chọn phái</option>
                <option value="nghia_ly">Chỉ Nghĩa Lý (phản tư)</option>
                <option value="day_du">Đầy đủ (thành bại, ứng kỳ)</option>
              </Select>
              <Select aria-label="Cách ra quẻ" value={cach} onChange={(e) => setCach(e.target.value)} className="h-10 text-sm">
                <option value="may_gieo">Máy gieo, tôi lật từng hào</option>
                <option value="mai_hoa">Mai Hoa theo giờ hiện tại</option>
                <option value="mai_hoa_so">Mai Hoa theo hai số tôi chọn</option>
                <option value="mai_hoa_phuong">Mai Hoa theo phương vị</option>
                <option value="gieo_tay">Tôi gieo đồng xu thật</option>
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
              {cach === "gieo_tay" && <ChonHao giaTri={giaTriTay} onChange={setGiaTriTay} />}
              <div className="sm:col-span-2"><CachGieo /></div>
            </div>
          }
          gui={gui}
        />
        <HoiSau30Ngay homNay={ngayVN()} moDun="kinhdich" />
        <LichSuQue lamMoi={lamMoiLS} onXemLai={xemLaiQue} dang={dang} />
        {coQue && <CuoiBaiDoc moDun="kinhdich" cauHoi="Lời quẻ có giúp bạn nhìn rõ việc đang cân nhắc?" maYDinh={maYDinh} />}
      </div>
    </div>
  );
}
