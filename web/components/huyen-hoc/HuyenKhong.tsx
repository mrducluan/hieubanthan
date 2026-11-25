"use client";
// PT-HK — Huyền Không phi tinh: nhập năm xây + toạ sơn (hoặc độ la bàn) → hạ quái bàn 3×3 (Nam ở trên).
// Mỗi cung: sơn tinh (trái) · hướng tinh (phải) · vận tinh (giữa dưới) · lưu niên (góc). Engine tính hết.
import { useCallback, useEffect, useRef, useState } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { laHuong8, luuHoSoNha, namXayGui, useHoSoNha } from "@/lib/ho-so-nha";
import { DongNha } from "@/components/phong-thuy/NhaCuaToi";
import { cn } from "@/lib/utils";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { ChonTrenVeTinh, coBanDoVeTinh, type LaBanHuyenKhongMap } from "@/components/huyen-hoc/ChonTrenVeTinh";
import { tenTheo, type TenHien } from "@/lib/ten-hien";

const SON_24: [string, string][] = [
  ["Nhâm", "Bắc"], ["Tý", "Bắc"], ["Quý", "Bắc"], ["Sửu", "Đông Bắc"], ["Cấn", "Đông Bắc"], ["Dần", "Đông Bắc"],
  ["Giáp", "Đông"], ["Mão", "Đông"], ["Ất", "Đông"], ["Thìn", "Đông Nam"], ["Tốn", "Đông Nam"], ["Tỵ", "Đông Nam"],
  ["Bính", "Nam"], ["Ngọ", "Nam"], ["Đinh", "Nam"], ["Mùi", "Tây Nam"], ["Khôn", "Tây Nam"], ["Thân", "Tây Nam"],
  ["Canh", "Tây"], ["Dậu", "Tây"], ["Tân", "Tây"], ["Tuất", "Tây Bắc"], ["Càn", "Tây Bắc"], ["Hợi", "Tây Bắc"],
];

interface YCap {
  ma: string; ten: string; y: string; muc: string; hop_cho: string; luu_y: string;
  hop_thap?: boolean;
  linh_vuc?: Record<string, string>;
  an_toan?: string[];
  sach_ghi?: { loi: string; nhom: string; viec?: string; cau_ket?: string };
  nam_chu_y?: { chu_dong: number[]; thuan: number[] };
}
interface ThanhMonCung { vai: string; cung: string; phuong: string; son: string; van_tinh: number; thuan: boolean; sao_den: number; dung_duoc: boolean }
interface ThanhMon {
  van: number; toa: string; huong: string; co_thanh_mon: boolean;
  chinh: ThanhMonCung; phu: ThanhMonCung;
  y?: { ten: string; y: string; chinh: string; phu: string; khong_dung: string; luu_y: string };
}
interface Cung { cung: string; phuong: string; luoi: [number, number]; goc: number; van: number; son: number; huong: number; y_cap?: YCap }
interface Ban {
  van: number; nam_xay: number | null; khoang_xay?: { tu: number; den: number }; cuc: string; cuc_ten: string; cuc_y: { y: string; goi_y: string };
  toa: { son: string; quai: string; phuong: string }; huong: { son: string; quai: string; phuong: string };
  cung: Cung[]; to_hop: { ma: string; ten: string; nhom: string; y: string; cung?: string[] }[];
  thanh_mon?: ThanhMon;
  trang_thai_sao: { sao: number; ten: string; trang_thai: string }[];
  sao_y: Record<string, { hanh: string; y_vuong: string; y_suy: string }>;
  luu_nien: { nam: number; tam: number; sao_tam: string; cung: Record<string, number> };
  luu_y: string; canh_bao: { loai: string; chi_tiet: string }[];
  phep: "ha_quai" | "the_quai";
  the_tinh?: Record<"son" | "huong", { goc: number; the: number; thuan: boolean }>;
  ha_quai?: { cuc: string; cuc_ten: string };
  the_quai_y?: { y: string; luu_y: string; nguon: string };
  the_quai_trang_thai?: string;
  the_quai_ghi_chu?: string;
  ten_hien?: TenHien;
}

const MAU_TT: Record<string, string> = {
  "vượng": "text-gold", "sinh": "text-jade", "thoái": "text-moon", "suy": "text-fg-muted", "tử": "text-fg-faint",
};
/** Mã trạng thái sao (engine trả chữ Việt) → khoá bảng chữ `hk.tt.<…>`. */
const KHOA_TT: Record<string, string> = { "vượng": "vuong", "sinh": "sinh", "thoái": "thoai", "suy": "suy", "tử": "tu" };

/** Bốn lớp số trong mỗi ô, theo thứ tự hiện khi bấm "Xem từng lớp" (chỉ là thứ tự HIỂN THỊ — số do engine trả). */
const LOP = ["van", "son", "huong", "ln"] as const;
type Lop = (typeof LOP)[number];

export function HuyenKhong() {
  const [lop, setLop] = useState({ van: true, son: true, huong: true, ln: true });
  // Số lớp đã hiện (4 = đủ). "Xem từng lớp" hiện lần lượt vận → sơn → hướng → năm; không mô phỏng đường bay.
  const [buocLop, setBuocLop] = useState<number>(LOP.length);
  const [daXemLop, setDaXemLop] = useState(false);
  const timerRef = useRef<number | null>(null);
  useEffect(() => () => { if (timerRef.current != null) window.clearInterval(timerRef.current); }, []);

  const xemTungLop = () => {
    if (timerRef.current != null) { window.clearInterval(timerRef.current); timerRef.current = null; }
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huyen_khong_khoi_ban" });
    setDaXemLop(true);
    const giam = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (giam) { setBuocLop(LOP.length); return; }
    let buoc = 1;
    setBuocLop(buoc);
    timerRef.current = window.setInterval(() => {
      buoc += 1;
      setBuocLop(buoc);
      if (buoc >= LOP.length && timerRef.current != null) { window.clearInterval(timerRef.current); timerRef.current = null; }
    }, 600);
  };
  const hienLop = (k: Lop) => lop[k] && LOP.indexOf(k) < buocLop;
  // PT-NHA: năm xây (hoặc khoảng năm = vận) + hướng nhà đọc từ hồ sơ nhà (thẻ "Nhà của tôi"); bỏ mặc định "2024" — chưa có
  // năm thì KHÔNG lập bàn, chỉ hỏi năm (DongNha). Có số độ hướng nhà → gửi `huong_do`, engine đổi sang toạ (web không cộng
  // 180°). Chưa có số độ → cho chọn toạ sơn (lưu `toa` vào hồ sơ). Đủ dữ liệu là tự lập, không cần bấm.
  const nhaLuu = useHoSoNha();
  const [kiem, setKiem] = useState(false);
  const [ban, setBan] = useState<Ban | null>(null);
  const [chonCung, setChonCung] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const { c: t, en } = useChuPT();
  // Tên mã (sơn, quái, hướng, cục, sao bay): ten_hien của bàn vừa lập + bảng dự phòng; bản Việt trả nguyên mã.
  const tn = tenTheo(ban?.ten_hien, en);
  const ttTen = (x: string) => (KHOA_TT[x] ? t(`hk.tt.${KHOA_TT[x]}`) : x);

  const huongDo = nhaLuu?.huong_do ?? null;
  const toa = huongDo == null ? nhaLuu?.toa ?? null : null;
  const nam = namXayGui(nhaLuu);
  const coNam = Object.keys(nam).length > 0;
  const than = coNam && (huongDo != null || toa)
    ? { ...nam, ...(huongDo != null ? { huong_do: huongDo } : { toa: toa!, ...(kiem ? { the_quai: true } : {}) }) }
    : null;
  const khoa = than ? JSON.stringify(than) : null;
  const luot = useRef(0);
  const lap = useCallback(async () => {
    if (!khoa) return;
    const g = ++luot.current;
    setDang(true); setLoi(null);
    try {
      const kq = await postJson<Ban>("/api/phongthuy/huyen-khong", JSON.parse(khoa));
      if (g !== luot.current) return;
      setBan(kq);
      setChonCung(kq.huong.quai);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huyen_khong" });
    } catch (e) { if (g === luot.current) setLoi(e instanceof Error ? e.message : t("hk.loi_lap")); }
    finally { if (g === luot.current) setDang(false); }
  }, [khoa, t]);
  const daTai = nhaLuu !== undefined;
  useEffect(() => {
    if (!daTai) return;
    if (!khoa) { luot.current++; setBan(null); setDang(false); return; }
    void lap();
  }, [khoa, lap, daTai]);

  const chonToa = (s: string) => { try { luuHoSoNha({ toa: s }); } catch { /* bỏ qua */ } };

  const duLieuMap: LaBanHuyenKhongMap | null = ban ? {
    van: ban.van,
    toa_quai: ban.toa.quai,
    huong_quai: ban.huong.quai,
    cung: ban.cung.map((c) => ({ cung: c.cung, son: c.son, huong: c.huong, muc: c.y_cap?.muc })),
    thanh_mon: [
      ...(ban.thanh_mon?.chinh.dung_duoc ? [ban.thanh_mon.chinh.cung] : []),
      ...(ban.thanh_mon?.phu.dung_duoc ? [ban.thanh_mon.phu.cung] : []),
    ],
  } : null;

  const tt = (n: number) => ban?.trang_thai_sao.find((x) => x.sao === n)?.trang_thai ?? "tử";
  return (
    <section aria-labelledby="tieu-de-hk" className="glass space-y-5 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold"><Compass className="size-5" aria-hidden /></span>
        <div>
          <h2 id="tieu-de-hk" className="text-2xl">{t("hk.tieu_de")} <span className="text-base text-fg-faint" style={{ fontFamily: "var(--font-han), serif" }}>玄空飛星</span></h2>
          <p className="text-sm text-fg-muted">{t("hk.mo_ta")}</p>
          {nhaLuu?.loai_nha === "can_ho" && (
            <p className="mt-1 text-xs text-fg-faint" data-testid="hk-can-ho">{t("hk.can_ho")}</p>
          )}
        </div>
      </div>

      <DongNha can="nam" testId="dong-nha-hk" />
      {huongDo == null && (
        <div className="space-y-1 text-sm" data-testid="hk-chon-son">
          <span className="text-fg-muted">{t("hk.chon_son")}</span>
          <Select value={toa ?? ""} onChange={(e) => chonToa(e.target.value)} aria-label={t("hk.son_aria")}>
            <option value="">—</option>
            {SON_24.map(([s, p], i) => {
              const [h, ph] = SON_24[(i + 12) % 24]!;
              return <option key={s} value={s}>{en ? t("hk.son_lua_chon", { s: tn("son", s), p: tn("huong", p), h: tn("son", h), ph: tn("huong", ph) }) : `Toạ ${s} (${p}) — hướng ${h} (${ph})`}</option>;
            })}
          </Select>
          <label className="flex items-center gap-1.5 text-xs text-fg-muted">
            <input type="checkbox" checked={kiem} onChange={(e) => setKiem(e.target.checked)} />
            {t("hk.kiem")}
          </label>
        </div>
      )}
      {dang && !ban && <p className="text-sm text-fg-muted" role="status">{t("hk.dang_lap")}</p>}
      {coBanDoVeTinh() && (
        <div className="space-y-2" data-testid="hk-ve-tinh-wrap">
          <p className="text-xs text-fg-muted">
            {en
              ? "Or place the 8-palace Flying Star compass directly over your roof on satellite map (coordinates stay on your device):"
              : "Hoặc phủ trực tiếp la bàn Huyền Không 8 cung lên mái nhà trên ảnh vệ tinh (toạ độ chỉ xử lý trên máy bạn, không lưu):"}
          </p>
          <ChonTrenVeTinh
            sinh={null}
            huyenKhong={duLieuMap}
            chonCung={chonCung}
            onChonCung={(c) => { setChonCung(c); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huyen_khong_map_cung" }); }}
            onDung={(kq) => {
              // Hướng engine vừa đo trên ảnh vệ tinh → hồ sơ nhà (bỏ toạ chọn tay cũ); bàn tự lập lại khi đã có năm.
              try { luuHoSoNha({ huong_do: kq.do_huong, huong: laHuong8(kq.huong) ? kq.huong : undefined, toa: undefined }); } catch { /* bỏ qua */ }
              ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huyen_khong_ve_tinh" });
            }}
          />
        </div>
      )}
      {loi && <BaoLoi loi={loi} thuLai={() => void lap()} />}

      {ban && (
        <div className="space-y-5" data-testid="ban-huyen-khong">
          {en ? (
            <p className="text-sm text-fg-muted">
              {t("hk.van")}<b className="text-gold">{ban.van}</b>{en
                ? <>{t("hk.toa")}<b className="text-fg">{tn("huong", ban.toa.phuong)}</b> · {tn("son", ban.toa.son)}{t("hk.huong")}<b className="text-fg">{tn("huong", ban.huong.phuong)}</b> · {tn("son", ban.huong.son)}</>
                : <>{t("hk.toa")}<b className="text-fg">{tn("son", ban.toa.son)}</b> ({tn("huong", ban.toa.phuong)}){t("hk.huong")}<b className="text-fg">{tn("son", ban.huong.son)}</b> ({tn("huong", ban.huong.phuong)})</>}{t("hk.cuc")}<b className="text-gold">{tn("cuc_hk", ban.cuc_ten)}</b>{t("hk.luu_nien", { nam: String(ban.luu_nien.nam), sao: tn("sao_bay", ban.luu_nien.sao_tam) })}
            </p>
          ) : (
          <p className="text-sm text-fg-muted">
            Vận <b className="text-gold">{ban.van}</b> · Toạ <b className="text-fg">{ban.toa.son}</b> ({ban.toa.phuong}) — hướng <b className="text-fg">{ban.huong.son}</b> ({ban.huong.phuong}) ·
            cục <b className="text-gold">{ban.cuc_ten}</b> · lưu niên {ban.luu_nien.nam} (tính từ Lập xuân): {ban.luu_nien.sao_tam} nhập trung
          </p>
          )}
          {ban.canh_bao.map((c) => <p key={c.loai} className="rounded-xl bg-cinnabar/10 px-4 py-2 text-sm text-cinnabar">{c.chi_tiet}</p>)}
          {ban.phep === "the_quai" && ban.the_tinh && (
            <div className="rounded-xl border border-moon/50 bg-moon/[0.06] p-4 text-sm" data-testid="the-quai">
              <p className="eyebrow">{t("hk.the_quai_td")}</p>
              {en ? (
                <p className="mt-2">
                  {t("hk.son_tinh_nhap", { goc: String(ban.the_tinh.son.goc) })}<b>{ban.the_tinh.son.the}</b> ({ban.the_tinh.son.thuan ? t("hk.thuan") : t("hk.nghich")}){t("hk.huong_tinh_nhap", { goc: String(ban.the_tinh.huong.goc) })}<b>{ban.the_tinh.huong.the}</b> ({ban.the_tinh.huong.thuan ? t("hk.thuan") : t("hk.nghich")}).
                  {ban.ha_quai && <>{t("hk.ha_quai")}<b>{tn("cuc_hk", ban.ha_quai.cuc_ten)}</b>.</>}
                </p>
              ) : (
              <p className="mt-2">
                Sơn tinh nhập trung {ban.the_tinh.son.goc} → <b>{ban.the_tinh.son.the}</b> ({ban.the_tinh.son.thuan ? "thuận" : "nghịch"}) ·
                hướng tinh {ban.the_tinh.huong.goc} → <b>{ban.the_tinh.huong.the}</b> ({ban.the_tinh.huong.thuan ? "thuận" : "nghịch"}).
                {ban.ha_quai && <> Nếu lập hạ quái: <b>{ban.ha_quai.cuc_ten}</b>.</>}
              </p>
              )}
              {ban.the_quai_y && <p className="mt-2 text-fg-muted">{ban.the_quai_y.y} {ban.the_quai_y.luu_y}</p>}
              {ban.the_quai_ghi_chu && (
                <p className="mt-2 rounded-lg bg-moon/10 px-3 py-2 text-xs text-fg-muted" data-testid="the-quai-ghi-chu">{ban.the_quai_ghi_chu}</p>
              )}
            </div>
          )}

          {/* Bật / tắt bốn lớp số + xem lần lượt từng lớp (chỉ đổi cách hiển thị số engine đã trả) */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/60 bg-bg/30 px-3 py-2 text-xs" data-testid="hk-thanh-dieu-khien">
            <Button type="button" size="sm" variant="outline" onClick={xemTungLop} data-testid="hk-khoi-ban">
              {buocLop < LOP.length ? t("hk.lop_dang", { n: String(buocLop), tong: String(LOP.length) }) : t("hk.lop_xem")}
            </Button>
            <div className="flex flex-wrap items-center gap-x-3 text-fg-muted">
              {LOP.map((k) => (
                <label key={k} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5">
                  <input type="checkbox" className="size-4 accent-[rgb(var(--gold))]" checked={lop[k]}
                    onChange={(e) => setLop((p) => ({ ...p, [k]: e.target.checked }))} data-testid={`hk-lop-${k}`} />
                  <span>{t(`hk.lop.${k}`)}</span>
                </label>
              ))}
            </div>
            <p className="sr-only" role="status" data-testid="hk-lop-trang-thai">{daXemLop && buocLop >= LOP.length ? t("hk.lop_du") : ""}</p>
          </div>

          <div className="mx-auto grid max-w-md grid-cols-3 gap-1.5" role="table" aria-label={t("hk.ban_aria")}>
            {[0, 1, 2].map((hang) => (
              <div key={hang} role="row" className="contents">
            {ban.cung.filter((c) => c.luoi[0] === hang).sort((a, b) => a.luoi[1] - b.luoi[1]).map((c) => {
              const laToa = c.cung === ban.toa.quai, laHuong = c.cung === ban.huong.quai;
              const laThanhMon = Boolean(
                (ban.thanh_mon?.chinh.dung_duoc && ban.thanh_mon.chinh.cung === c.cung) ||
                (ban.thanh_mon?.phu.dung_duoc && ban.thanh_mon.phu.cung === c.cung),
              );
              const dangChon = chonCung === c.cung;
              // Nhãn đọc màn hình chỉ nêu lớp đang hiện (lớp đang ẩn không đọc ra).
              const tenO = { cung: tn("cung_hk", c.cung), phuong: tn("huong", c.phuong) };
              const so: Record<Lop, string> = { son: String(c.son), huong: String(c.huong), van: String(c.van), ln: String(ban.luu_nien.cung[c.cung]) };
              const duLop = LOP.every(hienLop);
              const nhanO = duLop
                ? t("hk.o_aria", { ...tenO, ...so })
                : t("hk.o_khung", { ...tenO, ds: (["son", "huong", "van", "ln"] as const).filter(hienLop).map((k) => t(`hk.o_p.${k}`, { so: so[k] })).join(", ") });
              return (
                <button key={c.cung} type="button" role="cell" aria-pressed={dangChon}
                  onClick={() => { setChonCung(c.cung); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huyen_khong_cung" }); }}
                  aria-label={nhanO}
                  className={cn("relative aspect-square rounded-xl border p-2 text-left transition motion-reduce:transition-none hover:border-gold/80",
                    laHuong ? "border-gold/70 bg-gold/[0.07]" : laToa ? "border-moon/60 bg-moon/[0.06]" : "border-line/70 bg-bg/40",
                    dangChon && "ring-2 ring-gold")}>
                  <p className="text-center text-[0.68rem] text-fg-faint">{c.cung === "Trung cung" ? t("hk.trung_cung") : `${tn("cung_hk", c.cung)} · ${tn("huong", c.phuong)}`}{laToa ? t("hk.nhan_toa") : laHuong ? t("hk.nhan_huong") : ""}</p>
                  <div className="mt-1 flex items-center justify-between px-1 font-serif text-3xl leading-none sm:text-4xl">
                    <span className={cn(MAU_TT[tt(c.son)], !hienLop("son") && "invisible")} title={t("hk.son_title", { so: String(c.son), tt: ttTen(tt(c.son)) })}>{c.son}</span>
                    <span className={cn(MAU_TT[tt(c.huong)], !hienLop("huong") && "invisible")} title={t("hk.huong_title", { so: String(c.huong), tt: ttTen(tt(c.huong)) })}>{c.huong}</span>
                  </div>
                  <p className={cn("mt-1 text-center font-serif text-xl text-fg-muted", !hienLop("van") && "invisible")}>{c.van}</p>
                  {laThanhMon && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-jade/20 px-1 py-0.5 text-[0.58rem] font-medium text-jade">
                      {en ? "Gate" : "Thành Môn"}
                    </span>
                  )}
                  <span className={cn("absolute bottom-1.5 right-2 text-[0.65rem] text-cinnabar", !hienLop("ln") && "invisible")} title={t("hk.ln_title")}>{ban.luu_nien.cung[c.cung]}</span>
                </button>
              );
            })}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-fg-faint">{t("hk.chu_giai")}
            {" "}{t("hk.mau")} <span className="text-gold">{t("hk.tt.vuong")}</span> · <span className="text-jade">{t("hk.tt.sinh")}</span> · <span className="text-moon">{t("hk.tt.thoai")}</span> · <span className="text-fg-muted">{t("hk.tt.suy")}</span> · <span className="text-fg-faint">{t("hk.tt.tu")}</span>.
            {!en && " Bấm vào từng cung để đọc nghĩa cặp sao Sơn – Hướng."}</p>

          {(() => {
            const cungChon = ban.cung.find((x) => x.cung === chonCung);
            const yc = cungChon?.y_cap;
            if (!cungChon || !yc) return null;
            const mucNhan = yc.muc === "thuan" ? (en ? "Favorable" : "Thuận") : yc.muc === "can_chu_dong" ? (en ? "Needs care" : "Cần chủ động") : (en ? "Balanced" : "Cân bằng");
            const mucMau = yc.muc === "thuan" ? "text-jade border-jade/40 bg-jade/10" : yc.muc === "can_chu_dong" ? "text-cinnabar border-cinnabar/40 bg-cinnabar/10" : "text-moon border-moon/40 bg-moon/10";
            return (
              <div className="rounded-xl border border-gold/40 bg-bg/50 p-4 text-sm space-y-3" data-testid="hk-chi-tiet-cung" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="eyebrow">
                      {cungChon.cung === "Trung cung" ? t("hk.trung_cung") : `${tn("cung_hk", cungChon.cung)} · ${tn("huong", cungChon.phuong)}`}
                      {" · "}{en
                        ? `Mountain ${cungChon.son} – Facing ${cungChon.huong} (Period ${cungChon.van}, Annual ${ban.luu_nien.cung[cungChon.cung]})`
                        : `Sơn ${cungChon.son} – Hướng ${cungChon.huong} (Vận ${cungChon.van}, Lưu niên ${ban.luu_nien.cung[cungChon.cung]})`}
                    </p>
                    <h3 className="mt-0.5 text-base font-medium text-fg">{yc.ten}{yc.hop_thap ? (en ? " · Sum of Ten" : " · Hợp Thập") : ""}</h3>
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", mucMau)}>{mucNhan}</span>
                </div>
                <p className="leading-relaxed text-fg">{yc.y}</p>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  <div className="rounded-lg border border-line/60 bg-surface/40 p-2.5">
                    <span className="font-medium text-fg">{en ? "Suitable for: " : "Phù hợp bố trí: "}</span>
                    <span className="text-fg-muted">{yc.hop_cho}</span>
                  </div>
                  <div className="rounded-lg border border-line/60 bg-surface/40 p-2.5">
                    <span className="font-medium text-fg">{en ? "Note: " : "Lưu ý: "}</span>
                    <span className="text-fg-muted">{yc.luu_y}</span>
                  </div>
                </div>
                {yc.sach_ghi && (
                  <div className="rounded-lg border border-line/70 bg-bg/60 p-3 text-xs space-y-1">
                    <p className="font-medium text-gold">{en ? "Classical text:" : "Sách xưa ghi:"}</p>
                    <p className="leading-relaxed text-fg">{yc.sach_ghi.loi}</p>
                    {yc.sach_ghi.viec && <p className="text-fg-muted">{yc.sach_ghi.viec}</p>}
                    {yc.sach_ghi.cau_ket && <p className="text-fg-faint">{yc.sach_ghi.cau_ket}</p>}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-line/70 bg-bg/40 p-4 text-sm">
              <p className="eyebrow">{t("hk.cuc_td", { x: tn("cuc_hk", ban.cuc_ten) })}</p>
              <p className="mt-2">{ban.cuc_y.y}</p>
              <p className="mt-2 text-fg-muted">{t("hk.goi_y", { x: ban.cuc_y.goi_y })}</p>
            </div>
            <div className="rounded-xl border border-line/70 bg-bg/40 p-4 text-sm">
              <p className="eyebrow">{t("hk.to_hop")}</p>
              {ban.to_hop.length ? (
                <ul className="mt-2 space-y-2">
                  {ban.to_hop.map((th) => (
                    <li key={th.ma}><b className={th.nhom === "cát" ? "text-gold" : th.nhom === "hung" ? "text-cinnabar" : "text-moon"}>{th.ten}</b>
                      {th.cung ? <span className="text-fg-faint"> ({th.cung.map((x) => tn("cung_hk", x)).join(", ")})</span> : null} — <span className="text-fg-muted">{th.y}</span></li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-fg-muted">{t("hk.khong_to_hop")}</p>}
            </div>
          </div>

          {ban.thanh_mon && !en && (
            <div className="rounded-xl border border-line/70 bg-bg/40 p-4 text-sm" data-testid="hk-thanh-mon">
              <p className="eyebrow">Thành Môn Quyết (城門訣)</p>
              <p className="mt-1.5 text-fg">
                {ban.thanh_mon.chinh.dung_duoc ? (
                  <>Chính Thành Môn tại <b className="text-jade">{ban.thanh_mon.chinh.cung} ({ban.thanh_mon.chinh.phuong}, sơn {ban.thanh_mon.chinh.son})</b> dùng được trong vận {ban.van}.</>
                ) : ban.thanh_mon.phu.dung_duoc ? (
                  <>Phó Thành Môn tại <b className="text-jade">{ban.thanh_mon.phu.cung} ({ban.thanh_mon.phu.phuong}, sơn {ban.thanh_mon.phu.son})</b> dùng được trong vận {ban.van}.</>
                ) : (
                  <>{ban.thanh_mon.y?.khong_dung ?? "Chưa có cung Thành Môn đương vận."}</>
                )}
              </p>
              {ban.thanh_mon.y?.luu_y && <p className="mt-1.5 text-xs text-fg-muted">{ban.thanh_mon.y.luu_y}</p>}
            </div>
          )}
          <p className="text-xs text-fg-faint">{ban.luu_y}</p>
        </div>
      )}
    </section>
  );
}
