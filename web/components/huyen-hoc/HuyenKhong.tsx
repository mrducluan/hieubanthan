"use client";
// PT-HK — Huyền Không phi tinh: nhập năm xây + toạ sơn (hoặc độ la bàn) → hạ quái bàn 3×3 (Nam ở trên).
// Mỗi cung: sơn tinh (trái) · hướng tinh (phải) · vận tinh (giữa dưới) · lưu niên (góc). Engine tính hết.
import { useEffect, useRef, useState } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
import { cn } from "@/lib/utils";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { tenTheo, type TenHien } from "@/lib/ten-hien";

const SON_24: [string, string][] = [
  ["Nhâm", "Bắc"], ["Tý", "Bắc"], ["Quý", "Bắc"], ["Sửu", "Đông Bắc"], ["Cấn", "Đông Bắc"], ["Dần", "Đông Bắc"],
  ["Giáp", "Đông"], ["Mão", "Đông"], ["Ất", "Đông"], ["Thìn", "Đông Nam"], ["Tốn", "Đông Nam"], ["Tỵ", "Đông Nam"],
  ["Bính", "Nam"], ["Ngọ", "Nam"], ["Đinh", "Nam"], ["Mùi", "Tây Nam"], ["Khôn", "Tây Nam"], ["Thân", "Tây Nam"],
  ["Canh", "Tây"], ["Dậu", "Tây"], ["Tân", "Tây"], ["Tuất", "Tây Bắc"], ["Càn", "Tây Bắc"], ["Hợi", "Tây Bắc"],
];

interface Cung { cung: string; phuong: string; luoi: [number, number]; goc: number; van: number; son: number; huong: number }
interface Ban {
  van: number; nam_xay: number; cuc: string; cuc_ten: string; cuc_y: { y: string; goi_y: string };
  toa: { son: string; quai: string; phuong: string }; huong: { son: string; quai: string; phuong: string };
  cung: Cung[]; to_hop: { ma: string; ten: string; nhom: string; y: string; cung?: string[] }[];
  trang_thai_sao: { sao: number; ten: string; trang_thai: string }[];
  sao_y: Record<string, { hanh: string; y_vuong: string; y_suy: string }>;
  luu_nien: { nam: number; tam: number; sao_tam: string; cung: Record<string, number> };
  luu_y: string; canh_bao: { loai: string; chi_tiet: string }[];
  phep: "ha_quai" | "the_quai";
  the_tinh?: Record<"son" | "huong", { goc: number; the: number; thuan: boolean }>;
  ha_quai?: { cuc: string; cuc_ten: string };
  the_quai_y?: { y: string; luu_y: string; nguon: string };
  ten_hien?: TenHien;
}

const MAU_TT: Record<string, string> = {
  "vượng": "text-gold", "sinh": "text-jade", "thoái": "text-moon", "suy": "text-fg-muted", "tử": "text-fg-faint",
};
/** Mã trạng thái sao (engine trả chữ Việt) → khoá bảng chữ `hk.tt.<…>`. */
const KHOA_TT: Record<string, string> = { "vượng": "vuong", "sinh": "sinh", "thoái": "thoai", "suy": "suy", "tử": "tu" };

export function HuyenKhong({ doToaGoiY }: { doToaGoiY?: number | null } = {}) {
  const [namXay, setNamXay] = useState("2024");
  const [cach, setCach] = useState<"son" | "do">("son");
  const [toa, setToa] = useState("Tý");
  const [doLa, setDoLa] = useState("");
  // PT-V1: độ toạ đo bằng la bàn điện thoại → điền sẵn vào ô "Nhập độ la bàn".
  useEffect(() => {
    if (doToaGoiY == null) return;
    setCach("do");
    setDoLa(String(doToaGoiY));
  }, [doToaGoiY]);
  // KC-2: hồ sơ nhà trên máy → năm xây + độ toạ (= hướng + 180°) điền sẵn một lần.
  // Theo dõi cả khi hồ sơ nhà có thêm năm xây / hướng SAU lần tải đầu (vừa đo hướng, vừa nhập năm ở "Nhà của bạn"): ô còn
  // giá trị mặc định hoặc giá trị lần điền tự động trước thì điền lại; người dùng đã gõ tay thì giữ tay.
  const nhaLuu = useHoSoNha();
  const tuDien = useRef<{ nam: string | null; doLa: string | null }>({ nam: null, doLa: null });
  const hienTai = useRef({ namXay, doLa });
  useEffect(() => { hienTai.current = { namXay, doLa }; });
  const namLuu = nhaLuu?.nam_xay ? String(nhaLuu.nam_xay) : null;
  const doLuu = nhaLuu?.huong_do != null ? String(Math.round(((nhaLuu.huong_do + 180) % 360) * 10) / 10) : null;
  useEffect(() => {
    if (!namLuu) return;
    const cu = hienTai.current.namXay;
    if (cu === "2024" || cu === tuDien.current.nam) setNamXay(namLuu);
    tuDien.current.nam = namLuu;
  }, [namLuu]);
  useEffect(() => {
    if (doLuu == null || doToaGoiY != null) return;
    const cu = hienTai.current.doLa;
    if (cu === "" || cu === tuDien.current.doLa) { setCach("do"); setDoLa(doLuu); }
    tuDien.current.doLa = doLuu;
  }, [doLuu, doToaGoiY]);
  const [kiem, setKiem] = useState(false);
  const [ban, setBan] = useState<Ban | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const { c: t, en } = useChuPT();
  // Tên mã (sơn, quái, hướng, cục, sao bay): ten_hien của bàn vừa lập + bảng dự phòng; bản Việt trả nguyên mã.
  const tn = tenTheo(ban?.ten_hien, en);
  const ttTen = (x: string) => (KHOA_TT[x] ? t(`hk.tt.${KHOA_TT[x]}`) : x);

  const lap = async () => {
    const nam = Number(namXay), d = Number(doLa.replace(",", "."));
    if (!(nam >= 1864 && nam <= 2150)) { setLoi(t("hk.loi_nam")); return; }
    if (cach === "do" && !(doLa.trim() !== "" && d >= 0 && d < 360)) { setLoi(t("hk.loi_do")); return; }
    setDang(true); setLoi(null);
    try {
      const body = { nam_xay: Number(namXay), ...(cach === "son" ? { toa, ...(kiem ? { the_quai: true } : {}) } : { do: d }) };
      setBan(await postJson<Ban>("/api/phongthuy/huyen-khong", body));
      try { luuHoSoNha({ nam_xay: nam, ...(cach === "son" ? { toa } : {}) }); } catch { /* bỏ qua */ }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "huyen_khong" });
    } catch (e) { setLoi(e instanceof Error ? e.message : t("hk.loi_lap")); }
    finally { setDang(false); }
  };

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

      <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
        <label className="space-y-1 text-sm">
          <span className="text-fg-muted">{t("hk.nam_nhan")}</span>
          <Input inputMode="numeric" value={namXay} onChange={(e) => setNamXay(e.target.value.replace(/\D/g, "").slice(0, 4))} aria-label={t("hk.nam_aria")} />
        </label>
        <div className="space-y-1 text-sm">
          <div className="flex gap-3 text-fg-muted">
            <label className="flex min-h-10 cursor-pointer items-center gap-2"><input type="radio" className="size-4 accent-[rgb(var(--gold))]" checked={cach === "son"} onChange={() => setCach("son")} />{t("hk.chon_son")}</label>
            <label className="flex min-h-10 cursor-pointer items-center gap-2"><input type="radio" className="size-4 accent-[rgb(var(--gold))]" checked={cach === "do"} onChange={() => setCach("do")} />{t("hk.nhap_do")}</label>
          </div>
          {cach === "son" ? (
            <Select value={toa} onChange={(e) => setToa(e.target.value)} aria-label={t("hk.son_aria")}>
              {SON_24.map(([s, p], i) => {
                const [h, ph] = SON_24[(i + 12) % 24]!;
                return <option key={s} value={s}>{en ? t("hk.son_lua_chon", { s: tn("son", s), p: tn("huong", p), h: tn("son", h), ph: tn("huong", ph) }) : <>Toạ {s} ({p}) — hướng {h} ({ph})</>}</option>;
              })}
            </Select>
          ) : null}
          {cach === "son" && (
            <label className="flex items-center gap-1.5 text-xs text-fg-muted">
              <input type="checkbox" checked={kiem} onChange={(e) => setKiem(e.target.checked)} />
              {t("hk.kiem")}
            </label>
          )}
          {cach === "do" && (
            <Input inputMode="decimal" value={doLa} onChange={(e) => setDoLa(e.target.value)} placeholder={t("hk.do_vi_du")} aria-label={t("hk.do_aria")} />
          )}
        </div>
        <Button onClick={lap} disabled={dang || namXay.length !== 4 || (cach === "do" && doLa === "")}>{dang ? t("hk.dang_lap") : t("hk.lap")}</Button>
      </div>
      {loi && <BaoLoi loi={loi} thuLai={lap} />}

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
            </div>
          )}

          <div className="mx-auto grid max-w-md grid-cols-3 gap-1.5" role="table" aria-label={t("hk.ban_aria")}>
            {[0, 1, 2].map((hang) => (
              <div key={hang} role="row" className="contents">
            {ban.cung.filter((c) => c.luoi[0] === hang).sort((a, b) => a.luoi[1] - b.luoi[1]).map((c) => {
              const laToa = c.cung === ban.toa.quai, laHuong = c.cung === ban.huong.quai;
              return (
                <div key={c.cung} role="cell" aria-label={t("hk.o_aria", { cung: tn("cung_hk", c.cung), phuong: tn("huong", c.phuong), son: String(c.son), huong: String(c.huong), van: String(c.van), ln: String(ban.luu_nien.cung[c.cung]) })}
                  className={cn("relative aspect-square rounded-xl border p-2", laHuong ? "border-gold/70 bg-gold/[0.07]" : laToa ? "border-moon/60 bg-moon/[0.06]" : "border-line/70 bg-bg/40")}>
                  <p className="text-center text-[0.68rem] text-fg-faint">{c.cung === "Trung cung" ? t("hk.trung_cung") : `${tn("cung_hk", c.cung)} · ${tn("huong", c.phuong)}`}{laToa ? t("hk.nhan_toa") : laHuong ? t("hk.nhan_huong") : ""}</p>
                  <div className="mt-1 flex items-center justify-between px-1 font-serif text-3xl leading-none sm:text-4xl">
                    <span className={MAU_TT[tt(c.son)]} title={t("hk.son_title", { so: String(c.son), tt: ttTen(tt(c.son)) })}>{c.son}</span>
                    <span className={MAU_TT[tt(c.huong)]} title={t("hk.huong_title", { so: String(c.huong), tt: ttTen(tt(c.huong)) })}>{c.huong}</span>
                  </div>
                  <p className="mt-1 text-center font-serif text-xl text-fg-muted">{c.van}</p>
                  <span className="absolute bottom-1.5 right-2 text-[0.65rem] text-cinnabar" title={t("hk.ln_title")}>{ban.luu_nien.cung[c.cung]}</span>
                </div>
              );
            })}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-fg-faint">{t("hk.chu_giai")}
            {" "}{t("hk.mau")} <span className="text-gold">{t("hk.tt.vuong")}</span> · <span className="text-jade">{t("hk.tt.sinh")}</span> · <span className="text-moon">{t("hk.tt.thoai")}</span> · <span className="text-fg-muted">{t("hk.tt.suy")}</span> · <span className="text-fg-faint">{t("hk.tt.tu")}</span>.</p>

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
          <p className="text-xs text-fg-faint">{ban.luu_y}</p>
        </div>
      )}
    </section>
  );
}
