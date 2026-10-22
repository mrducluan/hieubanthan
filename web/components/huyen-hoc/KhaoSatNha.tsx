"use client";
// PT-V0 — "Khảo sát nhà": người dùng tự khai bố cục (phòng nằm ở phương nào nhìn từ tâm nhà, dấu hiệu quan sát được,
// hướng vật dụng). Web chỉ gom lựa chọn thành JSON bố cục; engine luận Bát trạch + kho tình huống (có nguồn).
// Cùng JSON này sau này sẽ do ảnh/video điền sẵn (PT-V2) — người dùng chỉ việc xác nhận.
import type { MocNam } from "@/components/huyen-hoc/KhungPhai";
import { useEffect, useRef, useState } from "react";
import { Check, ClipboardList, Home, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
import { datGocNhin, TEN_GOC_NHIN, useGocNhin, type GocNhin } from "@/lib/goc-nhin-pt";
import { cn } from "@/lib/utils";

interface DanhMuc {
  phong: Record<string, string>;
  cung: string[];
  dau_hieu: { ma: string; hoi: string; nhom: string; tot?: boolean }[];
  vat_huong: Record<string, string>;
}
interface ViTri { phong: string; ten: string; cung: string; du_nien_menh: string | null; du_nien_trach: string | null; nen: "cat" | "hung"; hop: boolean | null }
interface Viec { chi_phi: "khong_ton" | "it_tien" | "sua_chua"; lam: string }
interface MatBangKq {
  tam: number[]; tam_o: number[]; tam_ngoai_nha: boolean; so_o: number; khuyet_goc: string[]; dau_hieu_suy_ra: string[];
  o_9: { hang: number; cot: number; ti_le: number; phuong: string | null; khuyet: boolean }[];
  phuong_phong: Record<string, { o: number[]; phuong: string | null; trung_cung: boolean }>;
  wc_trung_cung: boolean; cua_thong_ban_cong: { lech_do: number; thang_hang: boolean } | null; canh_bao: string[];
}
interface KetQua {
  /** Q1 / Q2 / Q4 / Q5 / Q6 */
  veto_da_xac_nhan: string[]; mat_bang: MatBangKq | null; quy_tac: { ma: string; tieu_de: string; noi_dung: string }[];
  goc_nhin: GocNhin; chi_phi: Record<string, string>;
  da_tinh: {
    huong_nha: string | null; trach: { quai: string; nhom: string; toa: string } | null;
    menh_quai: { quai: string; nhom: string } | null; cung_nhom: boolean | null;
    vi_tri: ViTri[];
    huong: { doi_tuong: string; do: number; huong: string; du_nien: string | null; cat: boolean | null }[];
    cua_chu_bep: { cap: { cap: string; du_nien: string; cat: boolean }[]; cung_nhom: boolean } | null;
  };
  dien_giai: {
    vi_tri: { phong: string; tieu_de: string; noi_dung: string; thuc_te: string; nguon: string }[];
    huong: { doi_tuong: string; tieu_de: string; noi_dung: string }[];
    dau_hieu: { ma: string; tot: boolean; tieu_de: string; noi_dung: string; goi_y: string; nguon: string; veto: boolean;
      giai_thich: { sach_xua: string; doi_song: string }; viec: Viec[]; tu_mat_bang: boolean }[];
  };
  tu_soi: string[];
  luu_y: string;
  trang_thai: string;
}

// Lưới 3×3 theo bản đồ: Bắc ở trên, Đông bên phải.
const LUOI = ["Tây Bắc", "Bắc", "Đông Bắc", "Tây", "Trung cung", "Đông", "Tây Nam", "Nam", "Đông Nam"];
const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
const NHOM_DH: Record<string, string> = { ngoai_canh: "Bên ngoài nhà", hinh_nha: "Hình dáng nhà", trong_nha: "Trong nhà" };
const NGUON: Record<string, string> = { co_thu: "cổ thư", dan_gian: "dân gian" };
const LOAI_NHA: [string, string][] = [["", "Loại nhà…"], ["can_ho", "Căn hộ chung cư"], ["nha_pho", "Nhà phố"], ["biet_thu", "Biệt thự"], ["nha_cap4", "Nhà cấp 4"], ["khac", "Khác"]];
// Q2: lưới vẽ mặt bằng 6×6 — hàng trên = mặt trước nhà (phía hướng nhà). Chế độ: tô ô / đặt phòng / ban công.
const N = 6;
const LUOI_TRONG = Array.from({ length: N }, () => Array.from({ length: N }, () => false));
const PHONG_VE: [string, string][] = [["cua_chinh", "Cửa"], ["phong_ngu_chinh", "Ngủ"], ["bep", "Bếp"], ["ve_sinh", "WC"], ["ban_tho", "Thờ"], ["phong_lam_viec", "Làm việc"], ["ban_cong", "Ban công"]];
const TEN_CHI_PHI: Record<string, string> = { khong_ton: "0 đồng", it_tien: "Ít tiền", sua_chua: "Sửa chữa" };

export function KhaoSatNha({ sinh, doHuongGoiY }: {
  sinh: { birth_date: string; gender: "nam" | "nu"; moc_nam?: MocNam } | null;
  doHuongGoiY: number | null;
}) {
  const [dm, setDm] = useState<DanhMuc | null>(null);
  const [huong, setHuong] = useState<string>("");
  const [doNha, setDoNha] = useState("");
  const [viTri, setViTri] = useState<Record<string, string>>({});
  const [phongChon, setPhongChon] = useState("cua_chinh");
  const [dau, setDau] = useState<Set<string>>(new Set());
  const [huongDo, setHuongDo] = useState<Record<string, string>>({});
  const [kq, setKq] = useState<KetQua | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [loaiNha, setLoaiNha] = useState("");
  const gocNhin = useGocNhin();
  // Q2: mặt bằng vẽ tay (tuỳ chọn) — ô tô + ô đại diện phòng + ô ban công; chỉ gửi khi có ≥ 2 ô tô.
  const [veMb, setVeMb] = useState(false);
  const [luoi, setLuoi] = useState<boolean[][]>(LUOI_TRONG);
  const [cheDo, setCheDo] = useState<string>("to");
  const [oPhong, setOPhong] = useState<Record<string, [number, number]>>({});

  useEffect(() => {
    fetch("/api/phongthuy/bo-cuc/danh-muc").then((r) => (r.ok ? r.json() : null)).then(setDm).catch(() => setDm(null));
  }, []);
  useEffect(() => { if (doHuongGoiY != null) setDoNha(String(doHuongGoiY)); }, [doHuongGoiY]);
  // KC-2: bố cục đã khai lần trước (hồ sơ nhà trên máy) điền sẵn một lần.
  const nhaLuu = useHoSoNha();
  const daDien = useRef(false);
  useEffect(() => {
    if (!nhaLuu || daDien.current) return;
    daDien.current = true;
    if (nhaLuu.huong_do != null && doHuongGoiY == null) setDoNha(String(nhaLuu.huong_do)); else if (nhaLuu.huong && doHuongGoiY == null) setHuong(nhaLuu.huong);
    const b = nhaLuu.bo_cuc;
    if (b?.vi_tri) setViTri(b.vi_tri);
    if (b?.dau_hieu) setDau(new Set(b.dau_hieu));
    if (b?.huong_do) setHuongDo(Object.fromEntries(Object.entries(b.huong_do).map(([k, v]) => [k, String(v)])));
    if (nhaLuu.loai_nha) setLoaiNha(nhaLuu.loai_nha);
    if (b?.mat_bang && b.mat_bang.luoi.length === N && b.mat_bang.luoi.every((r) => r.length === N)) {
      setVeMb(true);
      setLuoi(b.mat_bang.luoi.map((r) => [...r].map((c) => c === "1")));
      const o: Record<string, [number, number]> = { ...(b.mat_bang.phong ?? {}) } as Record<string, [number, number]>;
      if (b.mat_bang.ban_cong) o.ban_cong = b.mat_bang.ban_cong;
      setOPhong(o);
    }
  }, [nhaLuu, doHuongGoiY]);

  const bamO = (r: number, c: number) => {
    if (cheDo === "to") { setLuoi((l) => l.map((row, i) => row.map((v, j) => (i === r && j === c ? !v : v)))); return; }
    setOPhong((o) => {
      const m = { ...o };
      if (m[cheDo]?.[0] === r && m[cheDo]?.[1] === c) delete m[cheDo]; else m[cheDo] = [r, c];
      return m;
    });
    if (!luoi[r]![c]) setLuoi((l) => l.map((row, i) => row.map((v, j) => (i === r && j === c ? true : v))));
  };
  const matBang = () => {
    if (!veMb || luoi.flat().filter(Boolean).length < 2) return null;
    const { ban_cong, ...phong } = oPhong;
    return { luoi: luoi.map((row) => row.map((v) => (v ? "1" : "0")).join("")), ...(Object.keys(phong).length ? { phong } : {}), ...(ban_cong ? { ban_cong } : {}) };
  };

  const dat = (cung: string) => setViTri((v) => {
    const m = { ...v };
    if (m[phongChon] === cung) delete m[phongChon]; else m[phongChon] = cung;
    return m;
  });

  const gui = async () => {
    setLoi(null);
    const so = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
    const d = so(doNha);
    if (d != null && !(d >= 0 && d < 360)) { setLoi("Độ hướng nhà cần từ 0 đến dưới 360."); return; }
    const hd: Record<string, number> = {};
    for (const [k, v] of Object.entries(huongDo)) {
      const x = so(v);
      if (x == null) continue;
      if (!(x >= 0 && x < 360)) { setLoi("Độ hướng vật dụng cần từ 0 đến dưới 360."); return; }
      hd[k] = x;
    }
    const mb = matBang();
    if (d == null && !huong && Object.keys(viTri).length === 0 && dau.size === 0 && !mb) {
      setLoi("Hãy khai ít nhất hướng nhà, vị trí một phòng, một dấu hiệu, hoặc vẽ mặt bằng."); return;
    }
    setDang(true);
    try {
      const r = await postJson<KetQua>("/api/phongthuy/bo-cuc", {
        bo_cuc: {
          ...(d != null ? { huong_nha_do: d } : huong ? { huong_nha: huong } : {}),
          ...(loaiNha ? { loai_nha: loaiNha } : {}),
          vi_tri: viTri, huong_do: hd,
          dau_hieu: Object.fromEntries([...dau].map((m) => [m, { co: true, nguon: "nguoi_dung" }])),
          ...(mb ? { mat_bang: mb } : {}),
        },
        goc_nhin: gocNhin,
        ...(sinh ? { sinh } : {}),
      });
      setKq(r);
      try {
        luuHoSoNha({ ...(d != null ? { huong_do: d } : {}), ...(loaiNha ? { loai_nha: loaiNha as "can_ho" } : {}),
          bo_cuc: { vi_tri: viTri, huong_do: hd, dau_hieu: [...dau], ...(mb ? { mat_bang: mb } : {}) } });
      } catch { /* bỏ qua */ }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "khao_sat_nha", co_mat_bang: Boolean(mb), loai_nha: loaiNha, goc_nhin: gocNhin });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa luận được bố cục này."); }
    finally { setDang(false); }
  };

  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="khao-sat-nha" data-testid="khao-sat-nha">
      <h2 id="khao-sat-nha" className="flex items-center gap-2 text-xl"><Home className="size-5 text-gold" aria-hidden /> Khảo sát nhà</h2>
      <p className="mt-1 text-sm text-fg-muted">
        Khai bố cục nhà như khi thầy phong thuỷ đến xem: phòng nằm ở phương nào (nhìn từ giữa nhà), có những dấu hiệu gì.
        Sắp tới bạn chỉ cần chụp ảnh — hệ thống điền sẵn, bạn xác nhận. Ảnh sẽ không được lưu.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-fg">1. Hướng nhà</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Input aria-label="Độ hướng nhà khảo sát" inputMode="decimal" placeholder="độ la bàn, vd 135" className="w-40"
                value={doNha} onChange={(e) => setDoNha(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))} />
              <span className="text-xs text-fg-faint">hoặc</span>
              <select aria-label="Hướng nhà (8 hướng)" value={huong} onChange={(e) => setHuong(e.target.value)} disabled={doNha.trim() !== ""}
                className="h-10 rounded-full border border-line bg-surface/60 px-3 text-sm disabled:opacity-50">
                <option value="">Chọn hướng…</option>
                {HUONG8.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <select aria-label="Loại nhà" value={loaiNha} onChange={(e) => setLoaiNha(e.target.value)}
                className="h-10 rounded-full border border-line bg-surface/60 px-3 text-sm">
                {LOAI_NHA.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
              <span>Giải thích dấu hiệu:</span>
              {(Object.keys(TEN_GOC_NHIN) as GocNhin[]).map((g) => (
                <button key={g} type="button" aria-pressed={gocNhin === g} onClick={() => datGocNhin(g)} data-testid={`ks-goc-nhin-${g}`}
                  className={cn("rounded-full border px-2.5 py-0.5", gocNhin === g ? "border-gold/70 text-gold" : "border-line text-fg-muted hover:text-fg")}>{TEN_GOC_NHIN[g]}</button>
              ))}
            </div>
          </div>

          <div data-testid="ve-mat-bang">
            <label className="flex items-center gap-2 text-sm font-medium text-fg">
              <input type="checkbox" className="size-4 accent-[rgb(var(--gold))]" checked={veMb} onChange={(e) => setVeMb(e.target.checked)} />
              Vẽ mặt bằng (tuỳ chọn) — tô các ô nhà chiếm, đánh dấu cửa, WC, ban công
            </label>
            {veMb && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-fg-muted">Hàng trên cùng là <b className="text-fg">mặt trước nhà</b> (phía nhìn ra). Tô ô theo hình nhà (chữ L thì bỏ trống góc khuyết); chọn chế độ rồi bấm ô để đặt phòng. Máy tính tâm nhà, nhà vệ sinh có ở giữa nhà không, khuyết góc, cửa có thông thẳng ra ban công không.</p>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Chế độ vẽ">
                  {([["to", "Tô ô"], ...PHONG_VE] as [string, string][]).map(([m, t]) => (
                    <button key={m} type="button" role="radio" aria-checked={cheDo === m} onClick={() => setCheDo(m)}
                      className={cn("rounded-full border px-2.5 py-1 text-xs", cheDo === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
                      {t}{m !== "to" && oPhong[m] ? " ✓" : ""}
                    </button>
                  ))}
                </div>
                <div className="grid w-fit grid-cols-6 gap-0.5 rounded-lg border border-line/70 p-1" aria-label="Lưới mặt bằng 6×6, hàng trên là mặt trước">
                  {luoi.map((row, r) => row.map((v, c) => {
                    const nhan = Object.entries(oPhong).filter(([, o]) => o[0] === r && o[1] === c).map(([k]) => PHONG_VE.find(([m]) => m === k)?.[1] ?? k);
                    return (
                      <button key={`${r}-${c}`} type="button" onClick={() => bamO(r, c)} aria-label={`Ô hàng ${r + 1} cột ${c + 1}${v ? " (đã tô)" : ""}${nhan.length ? `: ${nhan.join(", ")}` : ""}`}
                        aria-pressed={v} className={cn("flex size-10 items-center justify-center rounded text-[10px] leading-none sm:size-11", v ? "bg-gold/25 text-fg" : "bg-bg/40 text-fg-faint", nhan.length && "ring-1 ring-gold")}>
                        {nhan.join("·") || (r === 0 ? "▲" : "")}
                      </button>
                    );
                  }))}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-fg">2. Phòng nằm ở phương nào (nhìn từ giữa nhà)</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Chọn phòng để đặt">
              {Object.entries(dm?.phong ?? {}).map(([ma, ten]) => (
                <button key={ma} type="button" role="radio" aria-checked={phongChon === ma} onClick={() => setPhongChon(ma)}
                  className={cn("min-h-9 rounded-full border px-3 py-1.5 text-xs transition-colors", phongChon === ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
                  {ten}{viTri[ma] ? ` · ${viTri[ma]}` : ""}
                </button>
              ))}
            </div>
            <div className="mt-3 grid max-w-xs grid-cols-3 gap-1.5" aria-label="Sơ đồ chín phương (Bắc ở trên)">
              {LUOI.map((c) => {
                const o = Object.entries(viTri).filter(([, v]) => v === c).map(([k]) => dm?.phong[k] ?? k);
                return (
                  <button key={c} type="button" onClick={() => dat(c)} aria-label={`Đặt ${dm?.phong[phongChon] ?? ""} ở phía ${c}`}
                    className={cn("flex aspect-square flex-col items-center justify-center rounded-lg border p-1 text-center",
                      c === "Trung cung" ? "border-line/60 bg-surface-2/40" : "border-line/70 bg-bg/30", o.length > 0 && "border-gold/70 bg-gold/10")}>
                    <span className="text-[10px] uppercase tracking-wide text-fg-faint">{c}</span>
                    {o.map((t) => <span key={t} className="text-[11px] leading-tight text-fg">{t}</span>)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-fg">3. Hướng vật dụng (tuỳ chọn, độ la bàn)</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {Object.entries(dm?.vat_huong ?? {}).map(([ma, ten]) => (
                <label key={ma} className="text-xs text-fg-muted">{ten}
                  <Input aria-label={ten} inputMode="decimal" placeholder="vd 90" className="mt-1"
                    value={huongDo[ma] ?? ""} onChange={(e) => setHuongDo((h) => ({ ...h, [ma]: e.target.value.replace(/[^\d.,]/g, "").slice(0, 6) }))} />
                </label>
              ))}
            </div>
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-fg">4. Dấu hiệu bạn thấy (đánh dấu nếu có)</legend>
          {Object.entries(NHOM_DH).map(([nhom, ten]) => (
            <div key={nhom}>
              <p className="eyebrow mt-2">{ten}</p>
              <ul className="mt-1 space-y-1">
                {(dm?.dau_hieu ?? []).filter((x) => x.nhom === nhom).map((x) => (
                  <li key={x.ma}>
                    <label className="flex items-start gap-2 text-sm text-fg-muted">
                      <input type="checkbox" className="mt-1 size-4 accent-[rgb(var(--gold))]" checked={dau.has(x.ma)}
                        onChange={(e) => setDau((s) => { const n = new Set(s); if (e.target.checked) n.add(x.ma); else n.delete(x.ma); return n; })} />
                      {x.hoi}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </fieldset>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={gui} disabled={dang || !dm}><ClipboardList aria-hidden /> {dang ? "Đang luận…" : "Xem luận bố cục"}</Button>
        {!sinh && <p className="text-xs text-fg-faint">Chưa có giới tính trong hồ sơ → luận theo trạch (toạ nhà), chưa theo mệnh gia chủ.</p>}
        {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
      </div>

      {kq && <KetQuaBoCuc kq={kq} />}
    </section>
  );
}

function KetQuaBoCuc({ kq }: { kq: KetQua }) {
  const d = kq.da_tinh;
  const giai = Object.fromEntries(kq.dien_giai.vi_tri.map((x) => [x.phong, x]));
  return (
    <div className="mt-6 space-y-5" data-testid="ket-qua-bo-cuc">
      <div>
        <p className="eyebrow">Đã tính</p>
        <p className="mt-1 text-sm">
          {d.trach ? <>Nhà hướng <b>{d.huong_nha}</b>, toạ {d.trach.toa} → <b className="text-gold">{d.trach.quai} trạch</b> ({d.trach.nhom}). </> : "Chưa có hướng nhà. "}
          {d.menh_quai && <>Gia chủ mệnh <b className="text-gold">{d.menh_quai.quai}</b> ({d.menh_quai.nhom}){d.cung_nhom != null && <> — {d.cung_nhom ? "cùng nhóm với nhà" : "khác nhóm với nhà"}</>}.</>}
        </p>
        {d.vi_tri.length > 0 && (
          <div className="-mx-1 mt-2 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead><tr className="border-b border-line text-fg"><th className="py-1.5 pr-2">Phòng</th><th className="pr-2">Phương</th><th className="pr-2">Du niên ({d.menh_quai ? "theo mệnh" : "theo trạch"})</th><th className="pr-2">Nên</th><th>Đánh giá</th></tr></thead>
              <tbody>
                {d.vi_tri.map((x) => (
                  <tr key={x.phong} className="border-b border-line/50">
                    <td className="py-1.5 pr-2">{x.ten}</td><td className="pr-2">{x.cung}</td>
                    <td className="pr-2">{x.du_nien_menh ?? x.du_nien_trach ?? "—"}</td>
                    <td className="pr-2 text-fg-muted">{x.nen === "cat" ? "phương tốt" : "phương xấu"}</td>
                    <td>{x.hop == null ? <span className="text-fg-faint">—</span> : x.hop
                      ? <span className="inline-flex items-center gap-1 text-jade"><Check className="size-3.5" aria-hidden />hợp</span>
                      : <span className="inline-flex items-center gap-1 text-cinnabar"><X className="size-3.5" aria-hidden />chưa hợp</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {d.huong.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {d.huong.map((h) => <li key={h.doi_tuong}>{kq.dien_giai.huong.find((x) => x.doi_tuong === h.doi_tuong)?.tieu_de}: {h.huong} ({h.do}°) — <b className={h.cat ? "text-jade" : "text-cinnabar"}>{h.du_nien ?? "—"}</b></li>)}
          </ul>
        )}
        {d.cua_chu_bep && d.cua_chu_bep.cap.length > 0 && (
          <p className="mt-2 text-sm text-fg-muted">Cửa – chủ – bếp (Dương Trạch Tam Yếu): {d.cua_chu_bep.cap.map((c) => `${c.cap} ${c.du_nien}`).join(" · ")}{d.cua_chu_bep.cung_nhom ? " — cùng một nhóm." : " — không cùng nhóm."}</p>
        )}
      </div>

      <div>
        <p className="eyebrow">Diễn giải</p>
        <ul className="mt-2 space-y-2">
          {d.vi_tri.filter((x) => x.hop === false).map((x) => (
            <li key={x.phong} className="rounded-xl border border-cinnabar/30 bg-cinnabar/5 px-4 py-2.5 text-sm">
              <b className="text-fg">{giai[x.phong]?.tieu_de} ở phương {x.du_nien_menh ?? x.du_nien_trach}</b>: {giai[x.phong]?.noi_dung} <span className="text-fg-faint">Thực tế: {giai[x.phong]?.thuc_te}</span>
            </li>
          ))}
          {kq.dien_giai.dau_hieu.map((x) => (
            <li key={x.ma} className={cn("rounded-xl border px-4 py-2.5 text-sm", x.tot ? "border-jade/30 bg-jade/5" : x.veto ? "border-moon/40 bg-moon/[0.06]" : "border-line/70 bg-bg/30")} data-testid={`dau-hieu-${x.ma}`}>
              <b className="text-fg">{x.tieu_de}</b> <span className="text-xs text-fg-faint">({NGUON[x.nguon] ?? x.nguon}{x.tu_mat_bang ? " · suy từ mặt bằng" : ""})</span>
              {x.veto && <span className="ml-2 rounded-full border border-moon/50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-moon" data-testid="dau-hieu-veto">Xử lý trước</span>}
              : {x.noi_dung}
              {x.giai_thich && <span className="block text-xs text-fg-faint">{kq.goc_nhin === "doi_song" ? "Sách xưa" : "Đời sống"}: {kq.goc_nhin === "doi_song" ? x.giai_thich.sach_xua : x.giai_thich.doi_song}</span>}
              {x.viec?.length ? (
                <ul className="mt-1.5 space-y-0.5" data-testid="dau-hieu-viec">
                  {x.viec.map((v) => <li key={v.lam} className="flex gap-2"><span className="shrink-0 rounded-full border border-line px-2 text-[0.65rem] font-semibold uppercase tracking-wide text-fg-faint">{TEN_CHI_PHI[v.chi_phi]}</span><span className="text-fg-muted">{v.lam}</span></li>)}
                </ul>
              ) : <span className="text-fg-muted"> Gợi ý: {x.goi_y}</span>}
            </li>
          ))}
          {kq.quy_tac?.map((q) => (
            <li key={q.ma} className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-2.5 text-sm" data-testid={`quy-tac-${q.ma}`}><b className="text-fg">{q.tieu_de}</b>: {q.noi_dung}</li>
          ))}
          {d.vi_tri.every((x) => x.hop !== false) && kq.dien_giai.dau_hieu.length === 0 && <li className="text-sm text-fg-muted">Chưa thấy điểm nào cần điều chỉnh theo những gì bạn khai.</li>}
        </ul>
      </div>

      {kq.mat_bang && (
        <div data-testid="kq-mat-bang">
          <p className="eyebrow">Mặt bằng</p>
          <p className="mt-1 text-sm text-fg-muted">
            {kq.mat_bang.so_o} ô đã tô, tâm nhà ở ô hàng {kq.mat_bang.tam_o[0]! + 1} cột {kq.mat_bang.tam_o[1]! + 1}{kq.mat_bang.tam_ngoai_nha ? " (rơi ngoài phần đã tô)" : ""}.
            {kq.mat_bang.khuyet_goc.length ? ` Khuyết góc: ${kq.mat_bang.khuyet_goc.join(", ")}.` : " Không khuyết góc lớn."}
            {kq.mat_bang.wc_trung_cung ? " Nhà vệ sinh ở vùng giữa nhà." : ""}
            {kq.mat_bang.cua_thong_ban_cong?.thang_hang ? " Cửa chính nhìn thẳng ra ban công." : ""}
          </p>
          <div className="mt-2 grid w-fit grid-cols-3 gap-0.5" aria-label="Chín ô Cửu cung trên khung nhà">
            {kq.mat_bang.o_9.map((o) => (
              <div key={`${o.hang}${o.cot}`} className={cn("flex size-16 flex-col items-center justify-center rounded border text-[10px]", o.khuyet ? "border-moon/50 bg-moon/10 text-moon" : "border-line/60 bg-bg/30 text-fg-muted")}>
                <span>{o.phuong ?? "—"}</span><span className="text-fg-faint">{Math.round(o.ti_le * 100)}%</span>
              </div>
            ))}
          </div>
          {kq.mat_bang.canh_bao.map((c) => <p key={c} className="mt-1 text-xs text-fg-faint">{c}</p>)}
        </div>
      )}

      <div>
        <p className="eyebrow">Tự soi</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-fg-muted">{kq.tu_soi.map((c) => <li key={c}>{c}</li>)}</ul>
      </div>
      <p className="text-xs text-fg-faint">{kq.luu_y}</p>
    </div>
  );
}
