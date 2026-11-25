"use client";
// PT-NHA (chủ dự án duyệt phương án B, 2026-11-25) — thẻ "Nhà của tôi": MỘT chỗ nhập, mọi khối Phong thuỷ dùng chung.
// Chốt hướng ở "Đo hướng nhà" xong (số độ + tên hướng do ENGINE trả, đã vào hồ sơ nhà trên máy) thì thẻ hiện ngay dưới:
// hỏi nốt loại nhà, năm xây (năm cụ thể hoặc KHOẢNG năm = vận — người ta hay không nhớ đúng năm), người cùng ở (gõ hoặc
// lấy từ "Nhà Tôi"). Các khối bên dưới (Nhà của bạn, Khảo sát nhà, Huyền Không, Đo vị trí) KHÔNG còn ô nhập chung — chỉ
// một dòng `DongNha` báo đang dùng gì / còn thiếu gì, thiếu năm thì chọn ngay tại dòng ấy (ghi cùng hồ sơ).
// Thanh dính "Nhà của tôi" hiện khi cuộn qua thẻ để ở khối nào cũng thấy mình đang xem nhà nào.
// Web không tính gì: tên hướng là của engine (lúc chốt), khoảng năm là nhãn cố định, vận do engine đổi ra năm lập bàn.
// Đo lường chỉ gửi loại thao tác — không gửi số độ, năm, năm sinh.
import { useEffect, useState } from "react";
import { Building2, CalendarRange, Home, Pencil, Plus, Users, X } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { ghi } from "@/lib/do-luong";
import {
  coHuongNha, datNamXay, KHOANG_XAY, LOAI_NHA, luuHoSoNha, nguoiTuGiaDinh, tenLoaiNha, useHoSoNha,
  type HoSoNha, type LoaiNha, type ThanhVienNha,
} from "@/lib/ho-so-nha";
import { useGiaDinh } from "@/lib/gia-dinh";
import { cn } from "@/lib/utils";
import type { z } from "zod";

type ThanhVien = z.infer<typeof ThanhVienNha>;
const VAI: ThanhVien["vai"][] = ["vo", "chong", "con", "cha_me", "khac"];
const TOI_DA_NGUOI = 6;

function cuonToi(id: string) {
  const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "start" });
}

/** Chữ mô tả năm xây đang lưu (null = chưa có). */
function useMoTaNam() {
  const { c: t } = useChuPT();
  return (n: HoSoNha | null | undefined): string | null => {
    if (n?.nam_xay) return String(n.nam_xay);
    const k = KHOANG_XAY.find((x) => x.van === n?.van_xay);
    if (!k) return null;
    return `${k.van === 9 ? t("nt.khoang_cuoi", { tu: String(k.tu) }) : t("nt.khoang", { tu: String(k.tu), den: String(k.den) })} (${t("nt.van", { van: String(k.van) })})`;
  };
}

/** Chọn năm xây: bốn khoảng năm (vận) · năm cụ thể · không rõ. Ghi thẳng vào hồ sơ nhà. */
export function ChonNamXay({ gon = false, onXong }: { gon?: boolean; onXong?: () => void }) {
  const nha = useHoSoNha();
  const { c: t } = useChuPT();
  const [nhap, setNhap] = useState(nha?.nam_xay ? String(nha.nam_xay) : "");
  const [loi, setLoi] = useState<string | null>(null);
  const chon = (v: Parameters<typeof datNamXay>[0], cach: "khoang" | "nam" | "khong_ro") => {
    try { datNamXay(v); } catch { return; }
    setLoi(null);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "nha_toi_nam", cach });
    onXong?.();
  };
  const luuNam = () => {
    const n = Number(nhap);
    if (!(nhap.length === 4 && n >= 1864 && n <= 2150)) { setLoi(t("nt.loi_nam")); return; }
    chon({ nam: n }, "nam");
  };
  return (
    <div className="space-y-1.5" data-testid="chon-nam-xay">
      {!gon && <p className="text-xs text-fg-faint">{t("nt.nam_goi_y")}</p>}
      <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={t("nt.nam")}>
        {KHOANG_XAY.map((k) => {
          const dang = !nha?.nam_xay && nha?.van_xay === k.van;
          return (
            <button key={k.van} type="button" role="radio" aria-checked={dang} data-testid={`nam-khoang-${k.van}`}
              onClick={() => chon({ van: k.van }, "khoang")}
              className={cn("min-h-9 rounded-full border px-3 py-1 text-xs", dang ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
              {k.van === 9 ? t("nt.khoang_cuoi", { tu: String(k.tu) }) : t("nt.khoang", { tu: String(k.tu), den: String(k.den) })}
            </button>
          );
        })}
        <form className="inline-flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); luuNam(); }}>
          <Input inputMode="numeric" value={nhap} onChange={(e) => setNhap(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder={t("nt.nam_vi_du")} aria-label={t("nt.nam_aria")} className="h-9 w-24 text-xs" data-testid="nam-nhap" />
          <button type="submit" disabled={nhap.length !== 4} data-testid="nam-luu"
            className="min-h-9 rounded-full border border-gold/60 px-3 text-xs text-gold disabled:opacity-40">{t("nt.nam_luu")}</button>
        </form>
        {(nha?.nam_xay || nha?.van_xay) ? (
          <button type="button" onClick={() => { setNhap(""); chon(null, "khong_ro"); }} className="min-h-9 px-2 text-xs text-fg-faint hover:text-fg">{t("nt.nam_khong_ro")}</button>
        ) : null}
      </div>
      {loi && <p className="text-xs text-moon" role="alert">{loi}</p>}
    </div>
  );
}

/** Danh sách người cùng ở (chỉ năm sinh + giới tính) + thêm từng người + "Lấy từ Nhà Tôi". */
function NguoiCungO() {
  const nha = useHoSoNha();
  const gd = useGiaDinh();
  const { c: t } = useChuPT();
  const [vai, setVai] = useState<ThanhVien["vai"]>("vo");
  const [nam, setNam] = useState("");
  const [gioi, setGioi] = useState<"nam" | "nu">("nu");
  const [bao, setBao] = useState<string | null>(null);
  const ds = nha?.thanh_vien ?? [];
  const ghiDs = (moi: ThanhVien[]) => { try { luuHoSoNha({ thanh_vien: moi.slice(0, TOI_DA_NGUOI) }); } catch { /* bỏ qua */ } };
  const them = () => {
    const n = Number(nam);
    if (!(nam.length === 4 && n >= 1900 && n <= new Date().getFullYear())) return;
    ghiDs([...ds, { vai, nam: n, gioi_tinh: gioi }]);
    setNam("");
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "nha_toi_nguoi", nguon: "tay" });
  };
  const layGiaDinh = () => {
    const { them: moi, thieu_gioi } = nguoiTuGiaDinh(gd ?? []);
    const khoa = (x: ThanhVien) => `${x.vai}|${x.nam}|${x.gioi_tinh}`;
    const co = new Set(ds.map(khoa));
    const gop = [...ds, ...moi.filter((x) => !co.has(khoa(x)))];
    const so = Math.min(gop.length, TOI_DA_NGUOI) - ds.length;
    if (so > 0) ghiDs(gop);
    setBao([so > 0 ? t("nt.lay_gd_xong", { so: String(so) }) : gop.length > TOI_DA_NGUOI ? t("nt.lay_gd_day") : "",
      thieu_gioi ? t("nt.lay_gd_thieu", { so: String(thieu_gioi) }) : ""].filter(Boolean).join(" ") || null);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "nha_toi_nguoi", nguon: "gia_dinh", so: Math.max(so, 0) });
  };
  const soGd = (gd ?? []).length;
  return (
    <div className="space-y-1.5" data-testid="nguoi-cung-o">
      {ds.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {ds.map((x, i) => (
            <li key={`${x.vai}-${x.nam}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-line py-0.5 pl-2.5 pr-1 text-xs text-fg">
              {t(`nc.vai.${x.vai}`)} · {x.nam} · {x.gioi_tinh === "nam" ? t("nc.nam") : t("nc.nu")}
              <button type="button" aria-label={t("nc.bo_aria")} onClick={() => ghiDs(ds.filter((_, j) => j !== i))}
                className="grid size-6 place-items-center rounded-full text-fg-faint hover:bg-line/60 hover:text-fg"><X className="size-3" aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
      {ds.length < TOI_DA_NGUOI && (
        <form className="grid grid-cols-3 items-center gap-1.5 sm:grid-cols-[8rem_7rem_6rem_auto]" onSubmit={(e) => { e.preventDefault(); them(); }}>
          <Select value={vai} onChange={(e) => setVai(e.target.value as ThanhVien["vai"])} aria-label={t("nc.vai_aria")} className="h-9 pl-3 pr-8 text-xs">
            {VAI.map((m) => <option key={m} value={m}>{t(`nc.vai.${m}`)}</option>)}
          </Select>
          <Input inputMode="numeric" value={nam} onChange={(e) => setNam(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder={t("nc.nam_sinh")} aria-label={t("nc.nam_sinh_aria", { so: String(ds.length + 1) })} className="h-9 text-xs" data-testid="nguoi-nam" />
          <Select value={gioi} onChange={(e) => setGioi(e.target.value as "nam" | "nu")} aria-label={t("nc.gioi_aria")} className="h-9 pl-3 pr-8 text-xs">
            <option value="nam">{t("nc.nam")}</option><option value="nu">{t("nc.nu")}</option>
          </Select>
          <button type="submit" disabled={nam.length !== 4} data-testid="nguoi-them"
            className="col-span-3 inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-gold/60 px-3 text-xs text-gold disabled:opacity-40 sm:col-span-1 sm:justify-self-start">
            <Plus className="size-3.5" aria-hidden /> {t("nc.them")}</button>
        </form>
      )}
      {soGd > 0 && (
        <button type="button" onClick={layGiaDinh} data-testid="lay-gia-dinh"
          className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line px-3 text-xs text-fg-muted hover:text-fg">
          <Users className="size-3.5" aria-hidden /> {t("nt.lay_gd", { so: String(soGd) })}</button>
      )}
      {bao && <p className="text-xs text-fg-muted" role="status">{bao}</p>}
    </div>
  );
}

/** Một dòng của thẻ: nhãn · giá trị (hoặc ô chọn khi chưa có) · Sửa. */
function Dong({ icon, nhan, gia_tri, coGiaTri, children, testId }: {
  icon: React.ReactNode; nhan: string; gia_tri: string | null; coGiaTri: boolean; children: (dong: () => void) => React.ReactNode; testId: string;
}) {
  const { c: t } = useChuPT();
  const [mo, setMo] = useState(false);
  const hien = mo || !coGiaTri;
  return (
    <div className="space-y-1.5 border-t border-line/50 pt-3" data-testid={testId}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-fg-muted">{icon} {nhan}</span>
        {coGiaTri && <b className="font-medium text-fg">{gia_tri}</b>}
        {coGiaTri && (
          <button type="button" onClick={() => setMo((v) => !v)} aria-expanded={mo}
            className="ml-auto inline-flex min-h-8 items-center gap-1 rounded-full border border-line px-2.5 text-xs text-fg-muted hover:text-fg">
            {mo ? t("nt.xong") : <><Pencil className="size-3" aria-hidden /> {t("nt.sua")}</>}</button>
        )}
      </div>
      {hien && children(() => setMo(false))}
    </div>
  );
}

/** Thẻ đầy đủ — đặt ngay dưới "Đo hướng nhà". Chỉ hiện khi hồ sơ đã có hướng. */
export function TheNhaCuaToi() {
  const nha = useHoSoNha();
  const { c: t, en, huong: tenHuong } = useChuPT();
  const moTaNam = useMoTaNam();
  if (!nha || !coHuongNha(nha)) return null;
  const tieuDe = nha.huong_do != null && nha.huong ? t("nt.da_chot", { do: String(nha.huong_do), huong: tenHuong(nha.huong) })
    : nha.huong_do != null ? t("nt.da_chot_do", { do: String(nha.huong_do) }) : t("nt.da_chot_8", { huong: tenHuong(nha.huong) });
  const namChu = moTaNam(nha);
  const thieu = [!nha.loai_nha, !namChu, nha.thanh_vien.length === 0].filter(Boolean).length;
  const chonLoai = (m: LoaiNha) => {
    try { luuHoSoNha({ loai_nha: m }); } catch { return; }
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "nha_toi_loai", loai_nha: m });
  };
  const datTheo = (v: "cua" | "ban_cong") => { try { luuHoSoNha({ theo: v }); } catch { /* bỏ qua */ } };
  return (
    <section id="nha-cua-toi" aria-labelledby="nha-cua-toi-td" className="glass scroll-mt-24 space-y-3 rounded-2xl border border-gold/40 p-4 sm:p-5" data-testid="the-nha-cua-toi">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold"><Home className="size-4" aria-hidden /></span>
        <div className="min-w-0">
          <h2 id="nha-cua-toi-td" className="text-xl">{t("nt.tieu_de")}</h2>
          <p className="text-sm text-fg"><ChuB chu={tieuDe} lop="text-gold" /></p>
          <p className="mt-0.5 text-xs text-fg-faint">{t("nt.mo_ta")}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs" role="radiogroup" aria-label={t("nt.doi_cho_do")}>
        {(["cua", "ban_cong"] as const).map((v) => (
          <button key={v} type="button" role="radio" aria-checked={nha.theo === v} onClick={() => datTheo(v)} data-testid={`nt-theo-${v}`}
            className={cn("min-h-8 rounded-full border px-3", nha.theo === v ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
            {v === "cua" ? t("nt.do_o_cua") : t("nt.do_o_ban_cong")}</button>
        ))}
        <button type="button" onClick={() => cuonToi("do-huong")} className="ml-auto min-h-8 px-2 text-gold underline-offset-2 hover:underline">{t("nt.do_lai")}</button>
      </div>

      <Dong testId="nt-loai" icon={<Building2 className="size-3.5" aria-hidden />} nhan={t("nt.loai")}
        gia_tri={nha.loai_nha ? tenLoaiNha(nha.loai_nha, en) : null} coGiaTri={Boolean(nha.loai_nha)}>
        {(dong) => (
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("nt.loai")}>
            {LOAI_NHA.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={nha.loai_nha === m} data-testid={`nt-loai-${m}`}
                onClick={() => { chonLoai(m); dong(); }}
                className={cn("min-h-9 rounded-full border px-3 py-1 text-xs", nha.loai_nha === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>{tenLoaiNha(m, en)}</button>
            ))}
          </div>
        )}
      </Dong>
      <Dong testId="nt-nam" icon={<CalendarRange className="size-3.5" aria-hidden />} nhan={t("nt.nam")} gia_tri={namChu} coGiaTri={Boolean(namChu)}>
        {(dong) => <ChonNamXay onXong={dong} />}
      </Dong>
      <Dong testId="nt-nguoi" icon={<Users className="size-3.5" aria-hidden />} nhan={t("nt.nguoi")}
        gia_tri={nha.thanh_vien.length ? t("nt.nguoi_so", { so: String(nha.thanh_vien.length) }) : null} coGiaTri={nha.thanh_vien.length > 0}>
        {() => (<><p className="text-xs text-fg-faint">{t("nt.nguoi_ghi_chu")}</p><NguoiCungO /></>)}
      </Dong>

      <p className={cn("border-t border-line/50 pt-3 text-xs", thieu ? "text-fg-muted" : "text-jade")} data-testid="nt-tien-do">
        {thieu === 0 ? t("nt.du") : thieu === 1 ? t("nt.con_thieu_1") : t("nt.con_thieu", { so: String(thieu) })}
      </p>
    </section>
  );
}

/** Tóm tắt một dòng (dùng ở thanh dính và dòng trạng thái của từng khối). */
function useTomTat() {
  const { c: t, en, huong: tenHuong } = useChuPT();
  const moTaNam = useMoTaNam();
  return (n: HoSoNha) => [
    n.huong_do != null ? `${n.huong ? `${tenHuong(n.huong)} ` : ""}${n.huong_do}°` : n.huong ? tenHuong(n.huong) : null,
    n.loai_nha ? tenLoaiNha(n.loai_nha, en) : null,
    moTaNam(n),
    n.thanh_vien.length ? t("nt.nguoi_so", { so: String(n.thanh_vien.length) }) : null,
  ].filter(Boolean).join(" · ");
}

/** Dòng trạng thái đầu mỗi khối. `can = "nam"`: khối KHÔNG chạy được khi thiếu năm (Huyền Không) → chọn năm ngay tại đây.
 *  `namTuyChon`: có năm thì thêm lớp (Nhà của bạn) → mời chọn, không bắt buộc. */
export function DongNha({ can, namTuyChon = false, testId }: { can?: "nam"; namTuyChon?: boolean; testId?: string }) {
  const nha = useHoSoNha();
  const { c: t } = useChuPT();
  const tomTat = useTomTat();
  if (nha === undefined) return null;
  const coHuong = coHuongNha(nha);
  const coNam = Boolean(nha?.nam_xay || nha?.van_xay);
  return (
    <div className="space-y-2 rounded-xl border border-line/70 bg-surface/40 px-3 py-2 text-xs" data-testid={testId ?? "dong-nha"}>
      {coHuong && nha ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-fg-muted">
          <Home className="size-3.5 text-gold" aria-hidden />
          <span>{t("nt.dong")}</span><b className="font-medium text-fg">{tomTat(nha)}</b>
          <button type="button" onClick={() => cuonToi("nha-cua-toi")} className="min-h-8 text-gold underline-offset-2 hover:underline">{t("nt.dong_sua")}</button>
        </p>
      ) : (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-fg-muted">
          <Home className="size-3.5 text-fg-faint" aria-hidden />
          <span>{t("nt.dong_chua_huong")}</span>
          <button type="button" onClick={() => cuonToi("do-huong")} className="min-h-8 text-gold underline-offset-2 hover:underline">{t("nt.dong_toi_do")}</button>
        </p>
      )}
      {!coNam && (can === "nam" || (namTuyChon && coHuong)) && (
        <div className="space-y-1" data-testid="dong-nha-nam">
          <p className={can === "nam" ? "text-fg" : "text-fg-muted"}>{can === "nam" ? t("nt.dong_can_nam") : t("nt.dong_them_nam")}</p>
          <ChonNamXay gon />
        </div>
      )}
    </div>
  );
}

/** Thanh dính: hiện khi đã cuộn qua thẻ "Nhà của tôi" và còn ở vùng các khối nhà (tới mốc #nha-het). Không chiếm chỗ
 *  (fixed) nên không xô bố cục. */
export function ThanhNhaCuaToi() {
  const nha = useHoSoNha();
  const { c: t } = useChuPT();
  const tomTat = useTomTat();
  const [hien, setHien] = useState(false);
  const co = Boolean(nha && coHuongNha(nha));
  useEffect(() => {
    if (!co) { setHien(false); return; }
    let khung = 0;
    const tinh = () => {
      khung = 0;
      const the = document.getElementById("nha-cua-toi"), het = document.getElementById("nha-het");
      if (!the || !het) { setHien(false); return; }
      setHien(the.getBoundingClientRect().bottom < 96 && het.getBoundingClientRect().top > 200);
    };
    const nghe = () => { if (!khung) khung = window.requestAnimationFrame(tinh); };
    tinh();
    window.addEventListener("scroll", nghe, { passive: true });
    window.addEventListener("resize", nghe);
    return () => { window.removeEventListener("scroll", nghe); window.removeEventListener("resize", nghe); if (khung) window.cancelAnimationFrame(khung); };
  }, [co]);
  if (!co || !nha) return null;
  return (
    <div aria-hidden={!hien} data-testid="thanh-nha-cua-toi" data-hien={hien ? "1" : "0"}
      className={cn("pointer-events-none fixed inset-x-0 z-30 flex justify-center px-3 transition-[opacity,transform] duration-200 print:hidden motion-reduce:transition-none",
        hien ? "opacity-100" : "-translate-y-2 opacity-0")}
      style={{ top: "calc(4rem + var(--tm-h) + 0.5rem)" }}>
      <div className={cn("flex max-w-3xl items-center gap-2 rounded-full border border-gold/40 bg-bg/90 px-3 py-1.5 text-xs shadow-lg backdrop-blur-lg", hien && "pointer-events-auto")}
        role="region" aria-label={t("nt.thanh_aria")}>
        <Home className="size-3.5 shrink-0 text-gold" aria-hidden />
        <span className="truncate text-fg">{tomTat(nha)}</span>
        <button type="button" tabIndex={hien ? 0 : -1} onClick={() => { cuonToi("nha-cua-toi"); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "nha_toi_thanh_sua" }); }}
          className="shrink-0 rounded-full border border-line px-2.5 py-0.5 text-fg-muted hover:text-fg">{t("nt.sua")}</button>
      </div>
    </div>
  );
}
