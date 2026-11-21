"use client";
// Tra nhanh Cửa – Chủ – Bếp theo Dương Trạch Tam Yếu (rà soát 2026-11-21).
// Người dùng chạm thẳng ô trên sơ đồ 3×3 (Bắc ở trên, như SoDoNha) theo thứ tự Cửa → Phòng chính → Bếp. Web CHỈ vẽ:
// du niên, mức (thang chung), lời, gợi ý phía đặt bếp, việc nên làm, khối sách xưa đều do engine trả
// (`/api/phongthuy/tam-yeu/so-do`). Nhóm C (SX-C) chỉ hiện khi engine biết người đọc đủ 18 tuổi (năm sinh trong hồ sơ,
// hoặc người đọc tự xác nhận) — luôn kèm nguồn sách, câu kết và lời tham khảo.
// "Lưu vị trí vào hồ sơ nhà" chỉ ghi `bo_cuc.vi_tri` (cua_chinh, phong_ngu_chinh, bep) — KHÔNG đụng hướng nhà đã đo.
import { useEffect, useRef, useState } from "react";
import { Check, Compass, Flame, Home } from "lucide-react";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { LUOI_9 } from "@/components/huyen-hoc/SoDoNha";
import { SachXuaGhi, type KhoiSachGhi } from "@/components/huyen-hoc/SachXuaGhi";
import { NHAN_MUC, type Muc } from "@/components/luan-giai/kieu";
import { ghi } from "@/lib/do-luong";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
import { urlTheoNgonNgu } from "@/lib/ngon-ngu";
import { cn } from "@/lib/utils";

// Tên quái của 8 phương (bảng tên, không phải phép tính) — engine nhận quái.
const QUAI_CUA_HUONG: Record<string, string> = {
  "Bắc": "Khảm", "Đông Bắc": "Cấn", "Đông": "Chấn", "Đông Nam": "Tốn",
  "Nam": "Ly", "Tây Nam": "Khôn", "Tây": "Đoài", "Tây Bắc": "Càn",
};
type Cho = "cua" | "chu" | "bep";
const THU_TU: Cho[] = ["cua", "chu", "bep"];
const KHOA_VI_TRI: Record<Cho, "cua_chinh" | "phong_ngu_chinh" | "bep"> = { cua: "cua_chinh", chu: "phong_ngu_chinh", bep: "bep" };
const BIEU_TUONG = { cua: Compass, chu: Home, bep: Flame } as const;

interface Cap { cap: string; ten: string; tu: string; den: string; du_nien: string; muc: Muc; loi: string }
interface GoiYBep { quai: string; huong: string; du_nien_cua: string; du_nien_chu: string | null; loai: "hop" | "tam" | "tranh"; nhan: string }
export interface TamYeuRes {
  cap: Cap[];
  ket_luan: { muc: Muc; loi: string } | null;
  bep_goi_y: GoiYBep[];
  viec: { chi_phi: "0" | "co"; lam: string }[];
  can_cu: string[];
  sach_ghi: KhoiSachGhi | null;
  luu_y_tham_khao: string;
  nhom_c_an?: { so: number; loi: string };
}

const MUC_LOAI_BEP: Record<GoiYBep["loai"], Muc> = { hop: "thuan", tam: "can_bang", tranh: "can_chu_dong" };

export function TamYeuCuaChuBep({ huongCuaGoiY, namSinh }: { huongCuaGoiY?: string | null; namSinh?: number | null }) {
  const { c, en, huong: tenHuong } = useChuPT();
  const hoSoNha = useHoSoNha();
  const [vt, setVt] = useState<Record<Cho, string | null>>({ cua: null, chu: null, bep: null });
  const [dang, setDang] = useState<Cho>("cua");
  const [tuHoSo, setTuHoSo] = useState(false);
  const [du18, setDu18] = useState(false);
  const [kq, setKq] = useState<TamYeuRes | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState(false);
  const [daLuu, setDaLuu] = useState(false);
  const daDien = useRef(false);

  // Điền sẵn một lần từ hồ sơ nhà trên máy (vị trí ba chỗ đã khảo sát).
  useEffect(() => {
    if (daDien.current || !hoSoNha) return;
    daDien.current = true;
    const v = hoSoNha.bo_cuc?.vi_tri as Record<string, string | undefined> | undefined;
    const lay = (k: string) => (v?.[k] && QUAI_CUA_HUONG[v[k]!] ? v[k]! : null);
    const moi = { cua: lay("cua_chinh"), chu: lay("phong_ngu_chinh"), bep: lay("bep") };
    if (moi.cua) {
      setVt(moi);
      setTuHoSo(true);
      setDang(moi.chu ? "bep" : "chu");
    }
  }, [hoSoNha]);

  // Vừa đo hướng nhà (nhà có cửa ở mặt trước, không phải căn hộ) → gợi ý cửa ở phía đó, chỉ khi chưa đặt cửa.
  useEffect(() => {
    if (!huongCuaGoiY || !QUAI_CUA_HUONG[huongCuaGoiY]) return;
    setVt((cu) => (cu.cua ? cu : { ...cu, cua: huongCuaGoiY }));
    setDang((d) => (d === "cua" ? "chu" : d));
  }, [huongCuaGoiY]);

  useEffect(() => {
    if (!vt.cua) { setKq(null); return; }
    let huy = false;
    setDangTai(true);
    setLoi(false);
    const q = new URLSearchParams({ cua: QUAI_CUA_HUONG[vt.cua]! });
    if (vt.chu) q.set("chu", QUAI_CUA_HUONG[vt.chu]!);
    if (vt.bep) q.set("bep", QUAI_CUA_HUONG[vt.bep]!);
    if (namSinh) q.set("nam_sinh", String(namSinh));
    else if (du18) q.set("du_18", "1");
    fetch(urlTheoNgonNgu(`/api/phongthuy/tam-yeu/so-do?${q.toString()}`))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("loi"))))
      .then((d: TamYeuRes) => { if (!huy) setKq(d); })
      .catch(() => { if (!huy) setLoi(true); })
      .finally(() => { if (!huy) setDangTai(false); });
    return () => { huy = true; };
  }, [vt.cua, vt.chu, vt.bep, namSinh, du18]);

  const dat = (o: string) => {
    if (!QUAI_CUA_HUONG[o]) return;
    setDaLuu(false);
    setVt((cu) => ({ ...cu, [dang]: o }));
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "tam_yeu_dat", cho: dang });
    const tiep = THU_TU[THU_TU.indexOf(dang) + 1];
    if (tiep && !vt[tiep]) setDang(tiep);
  };

  const luu = () => {
    const cu = (hoSoNha?.bo_cuc?.vi_tri ?? {}) as Record<string, string | undefined>;
    const khac = THU_TU.filter((k) => vt[k] && cu[KHOA_VI_TRI[k]] && cu[KHOA_VI_TRI[k]] !== vt[k]);
    if (khac.length) {
      const moTaCu = khac.map((k) => `${c(`ty.${k}`)}: ${tenHuong(cu[KHOA_VI_TRI[k]]!)}`).join(", ");
      if (!window.confirm(c("ty.luu_hoi", { cu: moTaCu }))) return;
    }
    const moi: Record<string, string> = {};
    for (const k of THU_TU) if (vt[k]) moi[KHOA_VI_TRI[k]] = vt[k]!;
    try {
      luuHoSoNha({ bo_cuc: { ...(hoSoNha?.bo_cuc ?? {}), vi_tri: { ...(hoSoNha?.bo_cuc?.vi_tri ?? {}), ...moi } } } as Parameters<typeof luuHoSoNha>[0]);
      setDaLuu(true);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "tam_yeu_luu" });
    } catch { /* chế độ riêng tư */ }
  };

  const nhanO = (o: string) => THU_TU.filter((k) => vt[k] === o);

  return (
    <section id="tam-yeu" data-testid="tam-yeu-cua-chu-bep" aria-labelledby="tam-yeu-ten" className="glass rounded-2xl p-5 sm:p-6">
      <p className="text-xs uppercase tracking-wider text-gold">{c("ty.nhan")}</p>
      <h2 id="tam-yeu-ten" className="mt-1 font-serif text-xl text-fg sm:text-2xl">{c("ty.ten")}</h2>
      <p className="mt-1 text-sm text-fg-muted"><ChuB chu={c("ty.mo_ta")} /></p>

      <div className="mt-4 grid items-start gap-5 md:grid-cols-[minmax(0,20rem)_1fr]">
        <div>
          {/* Chọn chỗ đang đặt */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs" role="radiogroup" aria-label={c("ty.dang_dat")}>
            <span className="text-fg-muted">{c("ty.dang_dat")}</span>
            {THU_TU.map((k) => {
              const Icon = BIEU_TUONG[k];
              return (
                <button key={k} type="button" role="radio" aria-checked={dang === k} data-testid={`tam-yeu-che-do-${k}`}
                  onClick={() => setDang(k)}
                  className={cn("inline-flex min-h-[36px] items-center gap-1 rounded-full border px-2.5 py-1",
                    dang === k ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
                  <Icon className="size-3.5 text-gold" aria-hidden /> {c(`ty.${k}`)}
                  {vt[k] && <span className="text-fg-faint">· {tenHuong(vt[k])}</span>}
                </button>
              );
            })}
          </div>
          <p className="mb-2 text-xs text-fg-faint">{c("ty.goi_y_cham", { cho: c(`ty.${dang}`).toLowerCase() })}</p>
          {/* Sơ đồ 3×3 — Bắc ở trên */}
          <div className="grid grid-cols-3 gap-1" data-testid="tam-yeu-luoi">
            {LUOI_9.map((o) => {
              const giua = o === "Trung cung";
              const ds = nhanO(o);
              const datTen = ds.map((k) => c(`ty.${k}`)).join(", ");
              if (giua) {
                return <div key={o} className="flex min-h-[4.2rem] items-center justify-center rounded-lg border border-line/50 bg-surface-2/30 text-[10px] text-fg-faint">{c("ty.tam")}</div>;
              }
              return (
                <button key={o} type="button" data-testid={`tam-yeu-o-${QUAI_CUA_HUONG[o]}`} onClick={() => dat(o)}
                  aria-label={c("ty.o_aria", { huong: tenHuong(o), dat: datTen ? ` — ${datTen}` : "" })}
                  className={cn("flex min-h-[4.2rem] flex-col rounded-lg border p-1.5 text-left transition-colors motion-reduce:transition-none",
                    ds.length ? "border-gold/60 bg-gold/10" : "border-line/60 bg-bg/30 hover:border-gold/50")}>
                  <span className="text-[10px] uppercase leading-none tracking-wide text-fg-faint">{tenHuong(o)}</span>
                  <span className="mt-auto space-y-0.5 pt-1">
                    {ds.map((k) => {
                      const Icon = BIEU_TUONG[k];
                      return <span key={k} className="flex items-center gap-1 text-[11px] font-semibold leading-tight text-fg"><Icon className="size-3 text-gold" aria-hidden />{c(`ty.${k}`)}</span>;
                    })}
                  </span>
                </button>
              );
            })}
          </div>
          {tuHoSo && <p className="mt-2 text-[11px] text-fg-faint">{c("ty.tu_ho_so")}</p>}
        </div>

        <div className="space-y-3" aria-live="polite">
          {dangTai && !kq && <p className="text-sm text-fg-muted">{c("ty.dang_tai")}</p>}
          {loi && <p className="text-sm text-fg-muted">{c("ty.loi")}</p>}

          {kq && <KetQuaTamYeu kq={kq} bep={vt.bep} onChonBep={vt.cua ? (h) => { setDang("bep"); setVt((cu) => ({ ...cu, bep: h })); setDaLuu(false); } : undefined} />}

          {vt.cua && (vt.chu || vt.bep) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button type="button" data-testid="tam-yeu-ap-dung" onClick={luu}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-gold/60 bg-gold/15 px-3 py-1 font-medium text-gold hover:bg-gold/25">
                {daLuu ? <><Check className="size-3.5" aria-hidden /> {c("ty.da_luu")}</> : c("ty.luu")}
              </button>
              <span className="text-fg-faint">{c("ty.luu_ghi_chu")}</span>
            </div>
          )}
        </div>
      </div>

      {kq && <SachTamYeu kq={kq} coNamSinh={Boolean(namSinh)} du18={du18} onDu18={setDu18} />}
    </section>
  );
}


/** Phần kết quả Cửa – Chủ – Bếp (dùng chung cho tra nhanh trên sơ đồ và "Đứng giữa nhà, chĩa điện thoại"). Chỉ vẽ engine trả. */
export function KetQuaTamYeu({ kq, bep, onChonBep }: { kq: TamYeuRes; bep?: string | null; onChonBep?: (huong: string) => void }) {
  const { c, en, huong: tenHuong } = useChuPT();
  const nhanMuc = (m: Muc) => (en ? c(m === "can_chu_dong" ? "sd.luu_y" : `sd.${m}`) : NHAN_MUC[m]);
  return (
    <>
            {kq.ket_luan && (
              <div data-testid="tam-yeu-ket-luan" data-muc={kq.ket_luan.muc} className="chip-muc rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide opacity-80">{c("ty.ket_luan")} · {nhanMuc(kq.ket_luan.muc)}</p>
                <p className="mt-1 text-[0.95rem] leading-relaxed">{kq.ket_luan.loi}</p>
              </div>
            )}

            {kq.cap.length > 0 && (
              <ul className="space-y-2" data-testid="tam-yeu-cap">
                {kq.cap.map((p) => (
                  <li key={p.cap} className="rounded-xl border border-line/70 bg-surface/40 p-3">
                    <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-fg">
                      {p.ten}
                      <span className="chip-muc rounded-full border px-2 py-0.5 text-xs" data-muc={p.muc}>{nhanMuc(p.muc)}</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{p.loi}</p>
                  </li>
                ))}
              </ul>
            )}

            {kq.viec.length > 0 && (
              <div className="rounded-xl border border-gold/30 bg-gold/5 p-3" data-testid="tam-yeu-viec">
                <p className="text-sm font-medium text-fg">{c("ty.viec")}</p>
                <ul className="mt-1.5 space-y-1.5 text-sm text-fg-muted">
                  {kq.viec.map((v, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 rounded-full border border-line px-1.5 text-[10px] leading-5">{c(v.chi_phi === "0" ? "ty.mien_phi" : "ty.ton_tien")}</span>
                      <span>{v.lam}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {onChonBep && (
              <div data-testid="tam-yeu-bep-goi-y">
                <p className="text-sm font-medium text-fg">{c("ty.bep_goi_y")}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {kq.bep_goi_y.map((g) => (
                    <button key={g.quai} type="button" data-muc={MUC_LOAI_BEP[g.loai]} data-testid={`tam-yeu-bep-${g.quai}`}
                      onClick={() => onChonBep(g.huong)}
                      className={cn("chip-muc rounded-full border px-2.5 py-1 text-xs", bep === g.huong && "ring-1 ring-gold")}>
                      {tenHuong(g.huong)} · {g.nhan}{bep === g.huong ? ` (${c("ty.bep_dang")})` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {kq.can_cu.length > 0 && (
              <details className="text-xs text-fg-muted">
                <summary className="cursor-pointer text-gold">{c("ty.vi_sao")}</summary>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">{kq.can_cu.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </details>
            )}
    </>
  );
}

/** Khối sách xưa (SX-C, nhóm C sau cổng 18 tuổi) + lời tham khảo của Tam Yếu. */
export function SachTamYeu({ kq, coNamSinh, du18, onDu18 }: { kq: TamYeuRes; coNamSinh: boolean; du18: boolean; onDu18: (v: boolean) => void }) {
  const { c, en } = useChuPT();
  return (
    <>
        {!en && (kq.sach_ghi || kq.nhom_c_an || du18) && (
          <div className="mt-5 space-y-2" data-testid="tam-yeu-sach">
            {kq.sach_ghi && <SachXuaGhi khoi={kq.sach_ghi} moDun="phongthuy" tieuDe={c("ty.sach_tieu_de")} />}
            {(kq.nhom_c_an || du18) && !coNamSinh && (
              <div className="rounded-xl border border-line/70 bg-surface/40 p-3 text-xs text-fg-muted" data-testid="tam-yeu-nhom-c">
                {kq.nhom_c_an && <p>{kq.nhom_c_an.loi}</p>}
                <label className="mt-1.5 inline-flex min-h-[36px] items-center gap-2 text-fg">
                  <input type="checkbox" checked={du18} onChange={(e) => onDu18(e.target.checked)} data-testid="tam-yeu-du-18" />
                  {c("ty.du_18_hoi")}
                </label>
              </div>
            )}
          </div>
        )}

        {(
          <p className="mt-4 text-[11px] leading-relaxed text-fg-faint" data-testid="tam-yeu-luu-y">
            {kq.luu_y_tham_khao} {c("ty.nguon")}
          </p>
        )}
    </>
  );
}
