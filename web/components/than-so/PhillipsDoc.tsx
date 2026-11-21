"use client";
// Đợt 2A — Thần số học phái David A. Phillips: 11 Số Chủ Đạo (2–11 & 22/4) + 4 Đỉnh Kim Tự Tháp Animated SVG.
// Dữ liệu 100% từ engine `/api/thanso/phillips`, hiển thị đầy đủ mặt tích cực, mặt tiêu cực cần chú ý & trích dẫn sách gốc.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Briefcase, Check, Copy, Sparkles } from "lucide-react";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { hoTenList, type HoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";

// TK-2: sách còn bản quyền — engine chỉ trả nơi dẫn (trang) + cờ tóm ý, không có nguyên văn.
interface SachGhi { trang: string; tom_y?: boolean }
interface NghiaSCD {
  ten: string; tu_khoa: string[]; cot_loi: string; diem_manh: string; can_chu_y: string;
  nghe_phu_hop?: string; tu_soi: string; sach_ghi?: SachGhi;
}
interface DinhKTT {
  dinh: number; so: number; tuoi: number; nam: number; tu_tuoi: number; den_tuoi: number | null;
  cong_thuc: string; trang_thai: "da_qua" | "dang_trong" | "sap_toi" | null;
  nghia: { chu_de: string; y_nghia: string; can_chu_y?: string; goi_y: string; sach_ghi?: SachGhi };
}
interface BaiPhillips {
  phai: "phillips"; ten_phai: string; gioi_thieu: string; ho_ten: string; ngay_sinh: string;
  sach_goc?: { ten: string; tac_gia: string; nxb: string };
  so_chu_dao: { so: number; ma: string; nhan: string; goc: number; tong_goc: number; dang_day_du: string; cach_tinh: string; nghia: NghiaSCD };
  kim_tu_thap: { chan_de: { thang: number; ngay: number; nam: number }; dinh: DinhKTT[]; tuoi_hien_tai: number | null; tuoi_tron?: number | null };
  doi_chieu_pitago: { so_pitago: number; so_phillips: string; lech: boolean; ly_do: string | null };
  luu_y: string;
}

const TRANG_THAI: Record<string, { nhan: string; mau: string }> = {
  da_qua: { nhan: "Đã qua", mau: "border-line text-fg-faint bg-surface/40" },
  dang_trong: { nhan: "Đang ở chặng này", mau: "border-jade/60 text-jade bg-jade/10" },
  sap_toi: { nhan: "Sắp tới", mau: "border-gold/50 text-gold bg-gold/10" },
};

// TS-PHAI-3: hình học sơ đồ — chân đế giãn rộng ra hai mép để cạnh Đỉnh 4 (từ Tháng lên đỉnh rồi xuống Năm) đi NGOÀI các
// vòng Đỉnh 1, 2, 3 (trước cạnh ấy cắt ngang Đỉnh 1 và nhãn tuổi Đỉnh 3). Nhãn tuổi đặt ngay dưới vòng tròn của từng đỉnh
// (Đỉnh 4 đặt bên phải) để không đè lên đường nối. Vòng đỉnh tô nền đặc rồi mới phủ màu chọn, đường nối không lộ qua.
const POS_BASE = { thang: { x: 44, y: 292 }, ngay: { x: 280, y: 292 }, nam: { x: 516, y: 292 } };
const POS_PEAK = [
  { x: 164, y: 214 },
  { x: 396, y: 214 },
  { x: 280, y: 132 },
  { x: 280, y: 36 },
];

export function PhillipsDoc({ hoSo, quyUoc }: { hoSo: HoSo; quyUoc: "tong_het" | "tung_phan" }) {
  const [kq, setKq] = useState<BaiPhillips | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [chonDinh, setChonDinh] = useState<number>(1);
  const [daChep, setDaChep] = useState(false);

  const tai = async () => {
    setLoi(null);
    try {
      const res = await fetch("/api/thanso/phillips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam, quy_uoc_duong_doi: quyUoc,
        }),
      });
      const d = (await res.json()) as BaiPhillips & { error?: string };
      if (!res.ok) throw new Error(d.error || "Chưa tải được bài đọc phái Phillips.");
      setKq(d);
      const hienTai = d.kim_tu_thap.dinh.find((p) => p.trang_thai === "dang_trong");
      setChonDinh(hienTai?.dinh ?? 1);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tải được bài đọc phái Phillips.");
    }
  };

  useEffect(() => { void tai(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [hoSo.ho_ten, hoSo.ngay, hoSo.thang, hoSo.nam, quyUoc]);

  if (loi) return <BaoLoi loi={loi} thuLai={tai} />;
  if (!kq) return <KhungTai dong={4} nhan="Đang dựng 4 Đỉnh Kim Tự Tháp…" />;

  const scd = kq.so_chu_dao;
  const ktt = kq.kim_tu_thap;
  const dinhDangXem = ktt.dinh.find((p) => p.dinh === chonDinh) ?? ktt.dinh[0]!;
  const namSinh = hoSo.nam;
  // TUOI-1: tuổi nói với người đọc = tuổi tròn theo sinh nhật (engine tính); engine cũ chưa có trường → không nói tuổi.
  const tuoiNay = ktt.tuoi_tron ?? null;
  const tacGia = kq.sach_goc ? `${kq.sach_goc.tac_gia} · ${kq.sach_goc.ten}` : "David A. Phillips, Ph.D.";

  const saoChep = async () => {
    const tom = [
      `✨ ${kq.ho_ten} — Thần số học phái Phillips`,
      `• Số Chủ Đạo: ${scd.dang_day_du} (${scd.nghia.ten})`,
      `• 4 Đỉnh Kim Tự Tháp: ${ktt.dinh.map((p) => `Đỉnh ${p.dinh}: số ${p.so} (${p.tuoi}t · ${p.nam})`).join(" | ")}`,
      `Xem tại https://hieuban.com/than-so`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(tom);
      setDaChep(true);
      ghi("chart_interacted", { mo_dun: "thanso", kind: "phillips_chia_se" });
      setTimeout(() => setDaChep(false), 2200);
    } catch { /* bỏ qua */ }
  };

  return (
    <div className="space-y-10" data-testid="phillips-doc">
      {/* 1. Hero Số Chủ Đạo Phillips */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="glass rounded-2xl border border-gold/40 p-5 sm:p-7 space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-20 shrink-0 place-items-center rounded-2xl border border-gold/60 bg-gold/10 font-serif text-4xl font-semibold text-gold shadow-glow">
              {scd.nhan}
            </div>
            <div>
              <p className="eyebrow flex items-center gap-1.5 text-gold"><Sparkles className="size-3.5" aria-hidden /> {kq.ten_phai}</p>
              <h2 className="mt-1 text-2xl sm:text-3xl">{scd.nghia.ten}</h2>
              <p className="mt-1 font-mono text-xs text-fg-faint">{scd.cach_tinh}</p>
            </div>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={saoChep} data-testid="phillips-copy">
            {daChep ? <><Check className="size-4 text-jade" aria-hidden /> Đã chép tóm tắt</> : <><Copy className="size-4" aria-hidden /> Chép thẻ chia sẻ</>}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {scd.nghia.tu_khoa.map((tk) => (
            <span key={tk} className="rounded-full border border-gold/40 bg-gold/10 px-3 py-0.5 text-xs text-gold">{tk}</span>
          ))}
        </div>

        {kq.doi_chieu_pitago.lech && kq.doi_chieu_pitago.ly_do && (
          <div className="rounded-xl border border-moon/40 bg-moon/[0.07] px-4 py-3 text-sm text-fg" data-testid="phillips-lech-pitago">
            <b className="text-moon">Vì sao khác phái Pitago?</b> {kq.doi_chieu_pitago.ly_do}
          </div>
        )}

        <p className="text-base leading-relaxed text-fg">{scd.nghia.cot_loi}</p>

        {/* 2 cột rõ nét: Mặt tích cực vs Mặt tiêu cực cần chú ý */}
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <div className="rounded-xl border border-jade/35 bg-jade/[0.07] p-4">
            <p className="eyebrow text-jade">Mặt tích cực nổi bật</p>
            <p className="mt-1.5 leading-relaxed text-fg">{scd.nghia.diem_manh}</p>
          </div>
          <div className="rounded-xl border border-cinnabar/40 bg-cinnabar/[0.07] p-4">
            <p className="eyebrow text-cinnabar">Mặt tiêu cực &amp; điều nên chú ý</p>
            <p className="mt-1.5 leading-relaxed text-fg">{scd.nghia.can_chu_y}</p>
          </div>
        </div>

        {scd.nghia.nghe_phu_hop && (
          <div className="flex items-start gap-2.5 rounded-xl border border-line/70 bg-surface/40 px-4 py-3 text-sm text-fg-muted">
            <Briefcase className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <p><b className="text-fg">Hướng nghề hợp sở trường:</b> {scd.nghia.nghe_phu_hop}</p>
          </div>
        )}

        {scd.nghia.sach_ghi && (
          <p className="flex items-center gap-1.5 text-xs text-fg-faint">
            <BookOpen className="size-3.5" aria-hidden /> Tóm ý theo {tacGia}, {scd.nghia.sach_ghi.trang}
          </p>
        )}

        <p className="rounded-xl border border-line/70 bg-bg/50 px-4 py-3 text-sm italic text-fg-muted">
          Tự soi: “{scd.nghia.tu_soi}”
        </p>
      </motion.section>

      {/* 2. Sơ đồ SVG 4 Đỉnh Kim Tự Tháp Animated */}
      <section aria-labelledby="ktt-tieu-de" className="space-y-5">
        <TieuDeMuc
          id="ktt-tieu-de"
          nho="4 Đỉnh Kim Tự Tháp · Chu kỳ 9 năm"
          lon="Bốn cột mốc trưởng thành của bạn"
          mo_ta="Bấm vào từng đỉnh trên Kim Tự Tháp để xem cơ hội nổi bật, điểm tiêu cực cần chú ý và nguyên văn sách gốc."
        />

        <div className="glass rounded-2xl border border-line/70 p-4 sm:p-6">
          <svg viewBox="0 0 560 330" className="mx-auto w-full max-w-2xl select-none" role="img" aria-label="Sơ đồ 4 Đỉnh Kim Tự Tháp Thần số học phái Phillips">
            <defs>
              <linearGradient id="kttGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(232,194,106)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="rgb(74,222,178)" stopOpacity="0.65" />
              </linearGradient>
            </defs>

            {[
              `M${POS_BASE.thang.x},${POS_BASE.thang.y} L${POS_PEAK[0]!.x},${POS_PEAK[0]!.y} L${POS_BASE.ngay.x},${POS_BASE.ngay.y}`,
              `M${POS_BASE.ngay.x},${POS_BASE.ngay.y} L${POS_PEAK[1]!.x},${POS_PEAK[1]!.y} L${POS_BASE.nam.x},${POS_BASE.nam.y}`,
              `M${POS_PEAK[0]!.x},${POS_PEAK[0]!.y} L${POS_PEAK[2]!.x},${POS_PEAK[2]!.y} L${POS_PEAK[1]!.x},${POS_PEAK[1]!.y}`,
              `M${POS_BASE.thang.x},${POS_BASE.thang.y} L${POS_PEAK[3]!.x},${POS_PEAK[3]!.y} L${POS_BASE.nam.x},${POS_BASE.nam.y}`,
            ].map((dPath, idx) => (
              <motion.path
                key={idx} d={dPath} fill="none" stroke="url(#kttGold)"
                strokeWidth={idx === 3 ? 1.5 : 2} strokeDasharray={idx === 3 ? "5 4" : undefined}
                initial={{ pathLength: 0, opacity: 0.2 }} animate={{ pathLength: 1, opacity: 0.85 }}
                transition={{ duration: 0.7, delay: idx * 0.12 }}
              />
            ))}

            {[
              { label: "Tháng", val: ktt.chan_de.thang, pos: POS_BASE.thang },
              { label: "Ngày", val: ktt.chan_de.ngay, pos: POS_BASE.ngay },
              { label: "Năm", val: ktt.chan_de.nam, pos: POS_BASE.nam },
            ].map((b) => (
              <g key={b.label} transform={`translate(${b.pos.x},${b.pos.y})`}>
                <circle r="19" fill="rgba(17,19,28,0.9)" stroke="rgba(232,194,106,0.55)" strokeWidth="1.5" />
                <text y="1" textAnchor="middle" dominantBaseline="central" className="fill-fg font-serif text-base font-semibold">{b.val}</text>
                <text y="32" textAnchor="middle" className="fill-fg-faint text-[11px]">{b.label}</text>
              </g>
            ))}

            {ktt.dinh.map((p, idx) => {
              const pos = POS_PEAK[idx]!;
              const sel = chonDinh === p.dinh;
              const active = p.trang_thai === "dang_trong";
              return (
                <g key={p.dinh} transform={`translate(${pos.x},${pos.y})`}
                  onClick={() => { setChonDinh(p.dinh); ghi("chart_interacted", { mo_dun: "thanso", kind: "phillips_chon_dinh" }); }}
                  className="cursor-pointer" role="button" tabIndex={0} aria-label={`Đỉnh ${p.dinh}: số ${p.so}, tuổi ${p.tuoi}`}>
                  {active && (
                    <motion.circle r="31" fill="none" stroke="rgb(74,222,178)" strokeWidth="2" style={{ transformBox: "fill-box", transformOrigin: "center" }}
                      animate={{ scale: [1, 1.18, 1], opacity: [0.8, 0.2, 0.8] }}
                      transition={{ duration: 2.2, repeat: Infinity }} />
                  )}
                  <circle r="24" fill="rgb(17,19,28)" />
                  <circle r="24"
                    fill={sel ? "rgba(232,194,106,0.22)" : active ? "rgba(74,222,178,0.16)" : "rgba(17,19,28,0.92)"}
                    stroke={sel ? "#f7d774" : active ? "#4adeb2" : "rgba(232,194,106,0.7)"}
                    strokeWidth={sel ? 3 : 2} />
                  <text y="-2" textAnchor="middle" dominantBaseline="central" className="fill-gold font-serif text-xl font-bold">{p.so}</text>
                  <text y="14" textAnchor="middle" className="fill-fg-muted text-[9px] font-medium">Đỉnh {p.dinh}</text>
                  <text x={idx === 3 ? 36 : 0} y={idx === 3 ? 4 : 42}
                    textAnchor={idx === 3 ? "start" : "middle"} className="fill-fg-faint text-[11px]">
                    {p.tuoi}t ({p.nam})
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {ktt.dinh.map((p) => (
              <button key={p.dinh} type="button" onClick={() => setChonDinh(p.dinh)} aria-pressed={chonDinh === p.dinh}
                className={cn("rounded-xl border p-2 text-center text-xs transition",
                  chonDinh === p.dinh ? "border-gold bg-gold/15 text-gold" : "border-line/70 bg-bg/40 text-fg-muted hover:border-gold/50")}>
                <span className="block font-serif text-lg leading-tight text-fg">{p.so}</span>
                <span>Đỉnh {p.dinh} · {p.tuoi}t</span>
              </button>
            ))}
          </div>

          <motion.article
            key={dinhDangXem.dinh}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
            className="mt-5 rounded-xl border border-gold/40 bg-bg/60 p-4 sm:p-5 space-y-3"
            data-testid="phillips-chi-tiet-dinh"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="eyebrow text-gold">
                  Đỉnh {dinhDangXem.dinh} · Số {dinhDangXem.so} · {dinhDangXem.den_tuoi === null
                    ? `từ ${dinhDangXem.tu_tuoi} tuổi trở đi, đỉnh ở tuổi ${dinhDangXem.tuoi} (năm ${dinhDangXem.nam})`
                    : `từ ${dinhDangXem.tu_tuoi} đến ${dinhDangXem.tuoi} tuổi (${namSinh + dinhDangXem.tu_tuoi}–${dinhDangXem.nam})`}
                </p>
                <h3 className="mt-0.5 text-lg font-medium text-fg">{dinhDangXem.nghia.chu_de}</h3>
              </div>
              {dinhDangXem.trang_thai && TRANG_THAI[dinhDangXem.trang_thai] && (
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", TRANG_THAI[dinhDangXem.trang_thai]!.mau)}>
                  {TRANG_THAI[dinhDangXem.trang_thai]!.nhan}
                  {dinhDangXem.trang_thai === "dang_trong" && tuoiNay !== null && ` · bạn đang ${tuoiNay} tuổi`}
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-fg-faint">Cách tính: {dinhDangXem.cong_thuc}</p>
            <p className="text-sm leading-relaxed text-fg">{dinhDangXem.nghia.y_nghia}</p>
            {dinhDangXem.nghia.can_chu_y && (
              <p className="rounded-lg border border-cinnabar/35 bg-cinnabar/[0.07] px-3.5 py-2.5 text-sm text-fg">
                {dinhDangXem.nghia.can_chu_y}
              </p>
            )}
            <p className="rounded-lg border border-jade/30 bg-jade/[0.06] px-3.5 py-2.5 text-sm text-fg-muted">
              <b className="text-jade">Gợi ý hành động:</b> {dinhDangXem.nghia.goi_y}
            </p>
            {dinhDangXem.nghia.sach_ghi && (
              <p className="text-xs text-fg-faint">Tóm ý theo sách gốc, {dinhDangXem.nghia.sach_ghi.trang}</p>
            )}
          </motion.article>
        </div>
      </section>

      <p className="text-xs text-fg-faint">{kq.luu_y}</p>
    </div>
  );
}
