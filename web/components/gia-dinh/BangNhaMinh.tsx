"use client";
// GD-1 đợt 1 (2026-11-16, chủ dự án duyệt) — "Bảng nhà mình": thêm người nhà (vai + năm sinh + giới tính, tên gọi chỉ trên
// máy) → engine ghép con giáp, Tam tai, năm tuổi, sao hạn, cung phi theo năm âm (`/api/gia-dinh`) → mỗi người một việc nên
// làm, cặp người nhà nổi bật (điểm sáng / nên để ý + việc cụ thể), hướng chung cả nhà, lối sang công cụ đã có.
// Web không tính gì; không điểm số, không xếp hạng. Đo: family_member_added{vai, co_gioi_tinh}, family_viewed{so_nguoi},
// chart_interacted{kind: gia_dinh_viec, muc} — chỉ mã.
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarRange, CloudDownload, CloudUpload, Compass, Plus, ScrollText, Sparkles, Trash2, Users } from "lucide-react";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input, Select } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useHoSo, tenGoi } from "@/lib/hoso";
import { useNguoiThan } from "@/lib/nguoi-than";
import { useNguoiDung } from "@/lib/tai-khoan";
import { giaDinhTaiKhoan, luuGiaDinhTaiKhoan } from "@/lib/tai-khoan-gia-dinh";
import {
  CAM_KET_GIA_DINH, TEN_VAI, TOI_DA_GIA_DINH, VAI_GIA_DINH, nhapTuTaiKhoan, thanYeuCau, themNguoiNha, useGiaDinh, xoaCaNha, xoaNguoiNha,
  type NguoiNha, type VaiGiaDinh,
} from "@/lib/gia-dinh";

interface NguoiKq {
  id: string; vai: VaiGiaDinh; can_chi: string; con_giap: string; tuoi_mu: number; duoi_18: boolean; quan_he_nam: string;
  tam_tai: number | null; ma: string; nhan: string[]; viec: string; sao_han: string | null;
  cung_phi: { quai: string; nhom: string; huong_tot: string[] } | null; chi_nam_sinh_uoc_luong: boolean; can_cu: string;
  nap_am?: { ten: string; hanh: string }; nam_ca_nhan?: { so: number; chu_de: string; nen?: string } | null;
}
type Nhip = "thuan" | "hai_mat" | "de_y" | "binh";
interface LopKq { ma: string; ten: string; muc: Nhip; y: string; nen: string; can_cu: string }
interface CapKq {
  a: string; b: string; quan_he: string | null; loai: string; nhip?: Nhip; nhom: string; tieu_de: string; noi_dung: string; viec: string; can_cu: string;
  lop?: LopKq[]; mang?: { mang: string; chu: string }[];
}
interface MangKq { chuong: string; ten_mang: string; muc: string | null; nhan_muc: string; tom_tat: string; hop: { loai?: string; tieu_de?: string; noi_dung?: string; huong_xu_ly?: string }[] }
interface LaSoKq {
  dan: string; tieu_de_nguoi_nha: string; tuvi: { mang: MangKq[] }; battu: { mang: MangKq[] };
  nguoi_nha: { id: string; dong: { hoa: string; cung: string; nghia: string; trong_tam: boolean }[] }[];
}
interface LichNhaKq { nam: { nam: number; can_chi: string; muc: { id: string; ma: string; nhan: string }[]; so_nguoi_lon: number }[]; nam_nhe: number | null; goi_y: string; ghi_chu: string }
interface BangKq {
  nam: { nam: number; can_chi: string }; nguoi: NguoiKq[]; cap: CapKq[];
  huong: { chung: string[]; nhom: Record<string, string[]>; loi: string };
  tom_tat: { muc: { ma: string; so: number; ids: string[]; chu: string }[] };
  viec_chung: { ma: string; id?: string; ten: string; mo_ta: string; duong: string }[]; luu_y: string;
  lich_nha?: LichNhaKq; la_so_cua_ban?: LaSoKq | null; la_so_goi_y?: string | null;
}

// Nhịp của một cặp / một lớp — không đỏ, không điểm số: lục = thuận, vàng = cần nhường / nói rõ, xám = bình thường.
const NHIP: Record<Nhip, { nhan: string; chu: string; vien: string; cham: string }> = {
  thuan: { nhan: "Điểm sáng", chu: "text-jade", vien: "border-jade/35 bg-jade/[0.04]", cham: "bg-jade" },
  hai_mat: { nhan: "Hai mặt", chu: "text-gold", vien: "border-line/80 bg-surface/50", cham: "bg-gold/60" },
  de_y: { nhan: "Nên để ý", chu: "text-gold", vien: "border-gold/35 bg-gold/[0.04]", cham: "bg-gold" },
  binh: { nhan: "Bình thường", chu: "text-fg-muted", vien: "border-line/80 bg-surface/50", cham: "bg-fg-faint/50" },
};
const nhipCua = (c: CapKq): Nhip => c.nhip ?? (c.loai === "diem_sang" ? "thuan" : "de_y");
const MUC_DS: Record<string, string> = { thuan: "border-jade/45 text-jade", can_bang: "border-line text-fg-muted", can_chu_dong: "border-gold/45 text-gold" };

const MAU_NHAN: Record<string, string> = {
  tam_tai: "border-gold/45 text-gold", trung: "border-gold/45 text-gold", xung: "border-gold/45 text-gold",
  hinh: "border-line text-fg-muted", hai: "border-line text-fg-muted", hop: "border-jade/45 text-jade", binh: "border-line text-fg-muted",
};

export function BangNhaMinh() {
  const hoSo = useHoSo();
  const ds = useGiaDinh();
  const nt = useNguoiThan();
  const [kq, setKq] = useState<BangKq | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [nam, setNam] = useState<number | undefined>(undefined);
  const daDo = useRef(false);

  const ten = useMemo(() => {
    const m: Record<string, string> = { ban: hoSo ? tenGoi(hoSo) : "Bạn" };
    for (const x of ds ?? []) m[x.id] = x.ten_goi || TEN_VAI[x.vai];
    return m;
  }, [hoSo, ds]);

  const khoa = ds && hoSo !== undefined && (hoSo || ds.length) ? JSON.stringify(thanYeuCau(hoSo, ds, nam)) : null;
  useEffect(() => {
    if (!khoa) { setKq(null); return; }
    let huy = false;
    setLoi(null);
    postJson<BangKq>("/api/gia-dinh", JSON.parse(khoa))
      .then((r) => {
        if (huy) return;
        setKq(r);
        if (!daDo.current) { daDo.current = true; ghi("family_viewed", { so_nguoi: r.nguoi.length }); }
      })
      .catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : "Chưa tính được lúc này."); });
    return () => { huy = true; };
  }, [khoa]);

  if (ds === undefined || hoSo === undefined) return <div className="h-64 animate-pulse rounded-2xl bg-surface/50" />;
  const nguoi = (id: string) => kq?.nguoi.find((x) => x.id === id);
  const nhanNguoi = (id: string) => `${ten[id] ?? id}${nguoi(id) ? ` (${nguoi(id)!.con_giap})` : ""}`;

  return (
    <div className="space-y-8">
      {!hoSo && (
        <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-fg-muted">
          Chưa có hồ sơ của bạn trên máy này. <Link href="/than-so" className="text-gold underline">Nhập tên và ngày sinh</Link> để
          bạn cũng có mặt trong bảng nhà.
        </p>
      )}

      <section aria-labelledby="thanh-vien" className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="thanh-vien" className="flex items-center gap-2 text-xl"><Users className="size-5 text-gold" aria-hidden />Người trong nhà</h2>
          {ds.length > 0 && <button type="button" className="text-xs text-fg-faint underline hover:text-fg" onClick={() => { if (window.confirm("Xoá cả danh sách người nhà trên máy này?")) xoaCaNha(); }}>Xoá tất cả</button>}
        </div>
        <ul className="mt-3 flex flex-wrap gap-2" data-testid="ds-nguoi-nha">
          {hoSo && <li className="rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5 text-sm">{tenGoi(hoSo)} · <span className="text-fg-muted">Bạn · {hoSo.nam}</span></li>}
          {ds.map((x) => (
            <li key={x.id} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm">
              {x.ten_goi || TEN_VAI[x.vai]} · <span className="text-fg-muted">{TEN_VAI[x.vai]} · {x.nam_sinh}</span>
              <button type="button" aria-label={`Xoá ${x.ten_goi || TEN_VAI[x.vai]}`} onClick={() => xoaNguoiNha(x.id)} className="vung-cham ml-1 text-fg-faint hover:text-fg"><Trash2 className="size-3.5" aria-hidden /></button>
            </li>
          ))}
        </ul>
        {ds.length < TOI_DA_GIA_DINH
          ? <FormThem nguoiThan={nt ?? []} />
          : <p className="mt-3 text-sm text-fg-muted">Đã đủ {TOI_DA_GIA_DINH} người nhà. Xoá bớt một người để thêm người khác.</p>}
        <p className="mt-3 text-xs text-fg-faint">{CAM_KET_GIA_DINH}</p>
        <LuuTaiKhoan ds={ds} />
      </section>

      {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}

      {kq && (
        <div className="space-y-8" data-testid="bang-nha">
          <section aria-labelledby="nam-nha">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="nam-nha" className="text-2xl">Năm {kq.nam.nam} ({kq.nam.can_chi}) của cả nhà</h2>
              <label className="flex items-center gap-2 text-sm text-fg-muted">Năm
                <Select value={String(kq.nam.nam)} onChange={(e) => setNam(Number(e.target.value))} className="w-28">
                  {[kq.nam.nam - 1, kq.nam.nam, kq.nam.nam + 1].map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </label>
            </div>
            {kq.tom_tat.muc.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {kq.tom_tat.muc.map((m) => <li key={m.ma} className={`rounded-full border px-3 py-1 ${MAU_NHAN[m.ma] ?? "border-line"}`}>{m.chu}: {m.ids.map((i) => ten[i]).join(", ")}</li>)}
              </ul>
            )}
            <ul className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="the-nguoi-nha">
              {kq.nguoi.map((p) => (
                <li key={p.id} className="rounded-2xl border border-line/80 bg-surface/50 p-4">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-serif text-lg">{ten[p.id]}</span>
                    <span className="text-xs text-fg-muted">tuổi {p.can_chi} · tuổi mụ {p.tuoi_mu}</span>
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {p.nhan.map((n) => <span key={n} className={`rounded-full border px-2 py-0.5 ${MAU_NHAN[p.ma] ?? "border-line"}`}>{n}</span>)}
                    {p.sao_han && <span className="rounded-full border border-line px-2 py-0.5 text-fg-muted">Sao hạn: {p.sao_han}</span>}
                    {p.nap_am && <span className="rounded-full border border-line px-2 py-0.5 text-fg-muted">Mệnh {p.nap_am.ten}</span>}
                    {p.nam_ca_nhan && <span className="rounded-full border border-line px-2 py-0.5 text-fg-muted">Năm cá nhân {p.nam_ca_nhan.so}: {p.nam_ca_nhan.chu_de.toLowerCase()}</span>}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.viec}</p>
                </li>
              ))}
            </ul>
            {kq.nguoi.some((p) => p.chi_nam_sinh_uoc_luong) && <p className="mt-2 text-xs text-fg-faint">Tuổi tính theo năm sinh; ai sinh trước Tết năm đó thì tuổi tính theo năm trước.</p>}
          </section>

          {kq.cap.length > 0 && (
            <section aria-labelledby="cap-nha">
              <h2 id="cap-nha" className="text-2xl">Người trong nhà với nhau</h2>
              <p className="mt-1 text-sm text-fg-muted">Mỗi cặp được xem theo nhiều cách (con giáp, bản mệnh, can năm, cung phi; có ngày sinh thì thêm ngày sinh và thần số). Đây là tập quán để hiểu nhịp của nhau, không phải lời đoán.</p>
              {kq.nguoi.length >= 3 && <SoDoNha nguoi={kq.nguoi} cap={kq.cap} ten={ten} />}
              <ul className="mt-4 grid items-start gap-3 lg:grid-cols-2" data-testid="cap-nha">
                {kq.cap.slice(0, 12).map((c) => {
                  const n = NHIP[nhipCua(c)];
                  return (
                    <li key={`${c.a}-${c.b}`} className={`rounded-2xl border p-4 ${n.vien}`} data-nhip={nhipCua(c)}>
                      <p className="text-xs text-fg-muted">{nhanNguoi(c.a)} · {nhanNguoi(c.b)}</p>
                      <p className={`mt-1 font-medium ${n.chu}`}>{n.nhan} · {c.tieu_de}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{c.noi_dung}</p>
                      {c.lop && (
                        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-muted" aria-label="Từng cách xem">
                          {c.lop.map((l) => <li key={l.ma} className="inline-flex items-center gap-1.5"><span className={`size-2 rounded-full ${NHIP[l.muc].cham}`} aria-hidden />{l.ten.split(" · ")[0]}<span className="sr-only">: {NHIP[l.muc].nhan}</span></li>)}
                        </ul>
                      )}
                      <p className="mt-2 text-sm leading-relaxed"><b className="font-medium text-fg">Nên làm: </b>{c.viec}</p>
                      {c.lop && (
                        <details className="mt-2 text-sm" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) ghi("chart_interacted", { kind: "gia_dinh_cap_mo", muc: `${c.nhom}.${nhipCua(c)}` }); }}>
                          <summary className="cursor-pointer text-gold underline-offset-2 hover:underline" data-testid="cap-mo">Xem từng mặt: tình cảm, tiền bạc, việc chung</summary>
                          {c.mang && c.mang.length > 0 && (
                            <ul className="mt-2 space-y-1.5">
                              {c.mang.map((m) => <li key={m.mang} className="leading-relaxed text-fg-muted"><b className="font-medium text-fg">{m.mang}: </b>{m.chu}</li>)}
                            </ul>
                          )}
                          <ul className="mt-3 space-y-2 border-t border-line/60 pt-3">
                            {c.lop.map((l) => (
                              <li key={l.ma} className="leading-relaxed">
                                <span className="flex items-center gap-1.5 text-xs text-fg-faint"><span className={`size-2 rounded-full ${NHIP[l.muc].cham}`} aria-hidden />{l.ten} · {NHIP[l.muc].nhan}</span>
                                <span className="block text-fg-muted">{l.y} <span className="text-fg">{l.nen}</span></span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-xs text-fg-faint">Vì sao nói vậy: {c.can_cu}</p>
                          {c.nhom === "vo_chong" && <p className="mt-2 text-xs"><Link href="/tu-vi#hop-tham" className="text-gold underline">Xem kỹ hơn bằng lá số Tử vi của hai người</Link></p>}
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {kq.lich_nha && (
            <section aria-labelledby="lich-nha" data-testid="lich-nha">
              <h2 id="lich-nha" className="flex items-center gap-2 text-2xl"><CalendarRange className="size-5 text-gold" aria-hidden />Năm năm tới của nhà mình</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg">{kq.lich_nha.goi_y}</p>
              <ol className="mt-3 grid gap-2 sm:grid-cols-5">
                {kq.lich_nha.nam.map((r) => (
                  <li key={r.nam} className={`rounded-xl border p-3 ${r.nam === kq.lich_nha!.nam_nhe ? "border-jade/45 bg-jade/[0.05]" : "border-line/70"}`}>
                    <p className="font-serif text-lg leading-none">{r.nam}</p>
                    <p className="mt-0.5 text-xs text-fg-faint">{r.can_chi}</p>
                    {r.muc.length === 0
                      ? <p className="mt-2 text-xs text-jade">Không ai vướng</p>
                      : <ul className="mt-2 space-y-1 text-xs text-fg-muted">{r.muc.map((m) => <li key={`${m.id}-${m.ma}`}><b className="font-medium text-fg">{ten[m.id]}</b>: {m.nhan}</li>)}</ul>}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-fg-faint">{kq.lich_nha.ghi_chu}</p>
            </section>
          )}

          {kq.la_so_cua_ban ? <LaSoCuaBan d={kq.la_so_cua_ban} ten={ten} /> : kq.la_so_goi_y && hoSo && (
            <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-fg-muted" data-testid="la-so-goi-y">
              {kq.la_so_goi_y} <Link href="/tu-vi" className="text-gold underline">Bổ sung ở trang Tử vi</Link>
            </p>
          )}

          <section aria-labelledby="huong-nha" className="rounded-2xl border border-line/80 p-4 sm:p-5">
            <h2 id="huong-nha" className="flex items-center gap-2 text-xl"><Compass className="size-5 text-gold" aria-hidden />Hướng chung trong nhà</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{kq.huong.loi}</p>
            {Object.keys(kq.huong.nhom).length > 1 && (
              <ul className="mt-2 text-sm text-fg-muted">
                {Object.entries(kq.huong.nhom).map(([n, ids]) => <li key={n}>{n}: {ids.map((i) => ten[i]).join(", ")}</li>)}
              </ul>
            )}
            <p className="mt-2 text-xs"><Link href="/phong-thuy" className="text-gold underline">Xem hướng chi tiết trong nhà của bạn</Link></p>
          </section>

          <section aria-labelledby="viec-chung">
            <h2 id="viec-chung" className="flex items-center gap-2 text-xl"><Sparkles className="size-5 text-gold" aria-hidden />Việc chung của nhà</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="viec-chung">
              {kq.viec_chung.map((v) => (
                <li key={`${v.ma}-${v.id ?? ""}`}>
                  <Link href={v.duong} onClick={() => ghi("chart_interacted", { kind: "gia_dinh_viec", muc: v.ma })}
                    className="block rounded-xl border border-line/70 p-3 hover:border-gold/50">
                    <span className="text-fg">{v.ten}{v.id ? ` · ${ten[v.id]}` : ""}</span>
                    <span className="mt-0.5 block text-xs text-fg-muted">{v.mo_ta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <p className="text-xs leading-relaxed text-fg-faint">{kq.luu_y}</p>
        </div>
      )}
    </div>
  );
}

function FormThem({ nguoiThan }: { nguoiThan: { id: string; ten_goi?: string; lich_nhap: string; ngay: number; thang: number; nam: number; gioi_tinh?: string }[] }) {
  const [vai, setVai] = useState<string>("");
  const [tenGoi, setTenGoi] = useState("");
  const [namSinh, setNamSinh] = useState("");
  const [gt, setGt] = useState("");
  const [ngay, setNgay] = useState<string | undefined>(undefined);
  const [dongY, setDongY] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  function tuNguoiThan(id: string) {
    const x = nguoiThan.find((n) => n.id === id);
    if (!x) return;
    setTenGoi(x.ten_goi ?? ""); setNamSinh(String(x.nam)); setGt(x.gioi_tinh ?? "");
    setNgay(x.lich_nhap === "duong" ? `${x.nam}-${String(x.thang).padStart(2, "0")}-${String(x.ngay).padStart(2, "0")}` : undefined);
  }

  function gui(e: React.FormEvent) {
    e.preventDefault();
    if (!vai) return setLoi("Chọn người này là ai trong nhà.");
    const n = Number(namSinh);
    if (!Number.isInteger(n) || n < 1901 || n > new Date().getFullYear()) return setLoi("Nhập năm sinh (vd 1965).");
    const r = themNguoiNha({ vai: vai as (typeof VAI_GIA_DINH)[number], ten_goi: tenGoi, nam_sinh: n,
      ...(gt ? { gioi_tinh: gt as "nam" | "nu" } : {}), ...(ngay && Number(ngay.slice(0, 4)) === n ? { ngay_sinh: ngay } : {}) }, dongY);
    if (!r.ok) {
      return setLoi(r.ly_do === "chua_dong_y" ? "Tích ô đồng ý bên dưới trước khi lưu." : r.ly_do === "trung_vai" ? "Đã có vợ / chồng trong danh sách."
        : r.ly_do === "day" ? "Đã đủ người." : "Thông tin chưa hợp lệ.");
    }
    ghi("family_member_added", { vai, co_gioi_tinh: gt ? 1 : 0 });
    setVai(""); setTenGoi(""); setNamSinh(""); setGt(""); setNgay(undefined); setDongY(false); setLoi(null);
  }

  return (
    <form onSubmit={gui} className="mt-4 space-y-3 border-t border-line/60 pt-4" data-testid="form-nguoi-nha">
      <p className="flex items-center gap-1.5 text-sm text-fg"><Plus className="size-4 text-gold" aria-hidden />Thêm người nhà</p>
      {nguoiThan.length > 0 && (
        <label className="block text-sm text-fg-muted">Lấy từ lá số người thân đã lưu
          <Select className="mt-1" defaultValue="" onChange={(e) => tuNguoiThan(e.target.value)}>
            <option value="">— Chọn —</option>
            {nguoiThan.map((x) => <option key={x.id} value={x.id}>{x.ten_goi || `Sinh ${x.nam}`}</option>)}
          </Select>
        </label>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="gd-vai">Người này là</Label>
          <Select id="gd-vai" value={vai} onChange={(e) => setVai(e.target.value)}>
            <option value="">— Chọn —</option>
            {VAI_GIA_DINH.map((v) => <option key={v} value={v}>{TEN_VAI[v]}</option>)}
          </Select></div>
        <div className="space-y-1.5"><Label htmlFor="gd-ten">Tên gọi (tuỳ chọn)</Label>
          <Input id="gd-ten" value={tenGoi} maxLength={30} placeholder="vd Mẹ, Bé Na" onChange={(e) => setTenGoi(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="gd-nam">Năm sinh</Label>
          <Input id="gd-nam" inputMode="numeric" value={namSinh} maxLength={4} placeholder="vd 1965" onChange={(e) => setNamSinh(e.target.value.replace(/\D/g, ""))} /></div>
        <div className="space-y-1.5"><Label htmlFor="gd-gt">Giới tính (để xem hướng hợp)</Label>
          <Select id="gd-gt" value={gt} onChange={(e) => setGt(e.target.value)}>
            <option value="">— Không chọn —</option><option value="nam">Nam</option><option value="nu">Nữ</option>
          </Select></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="gd-ngay">Ngày sinh dương lịch (tuỳ chọn, để xem thêm theo ngày sinh và thần số)</Label>
          <Input id="gd-ngay" type="date" value={ngay ?? ""} min="1901-01-01" max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => { const v = e.target.value || undefined; setNgay(v); if (v) setNamSinh(v.slice(0, 4)); }} /></div>
      </div>
      <label className="flex items-start gap-2 text-sm text-fg-muted">
        <input type="checkbox" checked={dongY} onChange={(e) => setDongY(e.target.checked)} className="mt-0.5 size-4 accent-[rgb(var(--gold))]" data-testid="gd-dong-y" />
        Người này đồng ý cho tôi lưu năm sinh trên máy, hoặc tôi là cha mẹ / người giám hộ của người này.
      </label>
      {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
      <Button type="submit" size="sm">Lưu người này</Button>
    </form>
  );
}

/** Sơ đồ nhà: mỗi người một chấm trên vòng tròn, mỗi cặp một nét (lục = thuận, vàng đứt = nên để ý, mảnh = hai mặt). Chỉ vẽ
 *  theo nhịp engine đã gộp. */
function SoDoNha({ nguoi, cap, ten }: { nguoi: NguoiKq[]; cap: CapKq[]; ten: Record<string, string> }) {
  const R = 104, C = 150;
  const vt = new Map(nguoi.map((p, i) => {
    const g = (2 * Math.PI * i) / nguoi.length - Math.PI / 2;
    return [p.id, { x: C + R * Math.cos(g), y: C + R * Math.sin(g) }] as const;
  }));
  return (
    <figure className="mt-4 rounded-2xl border border-line/70 bg-surface/40 p-3" data-testid="so-do-nha">
      <svg viewBox="0 0 300 300" role="img" aria-label="Sơ đồ quan hệ giữa những người trong nhà" className="mx-auto w-full max-w-sm">
        {cap.map((c) => {
          const a = vt.get(c.a), b = vt.get(c.b), n = nhipCua(c);
          if (!a || !b || n === "binh") return null;
          return <line key={`${c.a}-${c.b}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={n === "thuan" ? "stroke-jade" : "stroke-gold"}
            strokeWidth={n === "hai_mat" ? 1 : 2} strokeOpacity={n === "hai_mat" ? 0.45 : 0.9} strokeDasharray={n === "de_y" ? "5 4" : undefined} />;
        })}
        {nguoi.map((p) => {
          const v = vt.get(p.id)!;
          return (
            <g key={p.id}>
              <circle cx={v.x} cy={v.y} r={p.vai === "ban_than" ? 9 : 7} className={p.vai === "ban_than" ? "fill-gold" : "fill-surface stroke-gold"} strokeWidth={1.5} />
              <text x={v.x} y={v.y + (v.y < C ? -14 : 22)} textAnchor="middle" className="fill-fg text-[11px]">{(ten[p.id] ?? "").slice(0, 12)}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-fg-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 bg-jade" aria-hidden />Dễ đồng lòng</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-px w-5 bg-gold/50" aria-hidden />Hai mặt</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-gold" aria-hidden />Nên nói rõ với nhau</span>
      </figcaption>
    </figure>
  );
}

/** GD-2: lá số theo ngày giờ sinh của chính người dùng nhìn về nhà mình — engine mượn mức + tóm tắt + hộp từ báo cáo đời
 *  sống Tử vi / Bát tự (một bộ tính) và đường tứ hoá theo năm sinh từng người nhà. */
function LaSoCuaBan({ d, ten }: { d: LaSoKq; ten: Record<string, string> }) {
  const cot = (tieuDe: string, href: string, mang: MangKq[]) => (
    <div className="rounded-2xl border border-line/80 bg-surface/50 p-4">
      <p className="flex items-baseline justify-between gap-2"><span className="font-serif text-lg">{tieuDe}</span>
        <Link href={href} className="text-xs text-gold underline" onClick={() => ghi("chart_interacted", { kind: "gia_dinh_viec", muc: href.slice(1) })}>Đọc đủ</Link></p>
      <ul className="mt-3 space-y-3">
        {mang.map((m) => (
          <li key={m.chuong}>
            <p className="flex flex-wrap items-center gap-2 text-sm"><b className="font-medium text-fg">{m.ten_mang.charAt(0).toUpperCase() + m.ten_mang.slice(1)}</b>
              {m.muc && <span className={`rounded-full border px-2 py-0.5 text-xs ${MUC_DS[m.muc] ?? "border-line"}`}>{m.nhan_muc}</span>}</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{m.tom_tat}</p>
            {m.hop.length > 0 && (
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer text-xs text-gold">Điểm sáng và điều nên để ý</summary>
                <ul className="mt-1.5 space-y-1.5">
                  {m.hop.map((h, i) => <li key={i} className="leading-relaxed text-fg-muted">{h.tieu_de && <b className="font-medium text-fg">{h.tieu_de}{h.noi_dung ? ". " : ""}</b>}{h.noi_dung}{h.huong_xu_ly ? <span className="text-fg"> {h.huong_xu_ly}</span> : null}</li>)}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <section aria-labelledby="la-so-nha" data-testid="la-so-cua-ban">
      <h2 id="la-so-nha" className="flex items-center gap-2 text-2xl"><ScrollText className="size-5 text-gold" aria-hidden />Lá số của bạn nói gì về nhà mình</h2>
      <p className="mt-1 text-sm text-fg-muted">{d.dan}</p>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {cot("Theo Tử vi", "/tu-vi", d.tuvi.mang)}
        {cot("Theo Bát tự", "/bat-tu", d.battu.mang)}
      </div>
      {d.nguoi_nha.length > 0 && (
        <div className="mt-4 rounded-2xl border border-line/80 p-4">
          <p className="font-serif text-lg">{d.tieu_de_nguoi_nha}</p>
          <ul className="mt-3 space-y-3">
            {d.nguoi_nha.map((x) => (
              <li key={x.id}>
                <p className="text-sm font-medium text-fg">{ten[x.id] ?? x.id}</p>
                <ul className="mt-1 space-y-1 text-sm leading-relaxed text-fg-muted">
                  {x.dong.map((g, i) => <li key={i}>{g.nghia.replace(/^Người ấy/, ten[x.id] ?? "Người ấy")}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** GD-1 đợt 3 — "Lưu nhà mình vào tài khoản" (chỉ người đã đăng nhập, tự tích đồng ý mỗi lần) + "Tải từ tài khoản".
 *  Lên tài khoản chỉ có vai + năm sinh + giới tính; tên gọi và ngày sinh ở lại máy. */
function LuuTaiKhoan({ ds }: { ds: NguoiNha[] }) {
  const nguoi = useNguoiDung();
  const [dongY, setDongY] = useState(false);
  const [tin, setTin] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  if (!nguoi) return null;
  const lam = async (f: () => Promise<string>) => {
    setDang(true); setTin(null);
    try { setTin(await f()); } catch (e) { setTin(e instanceof Error ? e.message : "Chưa làm được."); }
    finally { setDang(false); }
  };
  return (
    <div className="mt-4 rounded-xl border border-line/70 p-4 text-sm" data-testid="luu-gia-dinh-tai-khoan">
      <label className="flex cursor-pointer items-start gap-2 text-fg-muted">
        <input type="checkbox" className="mt-1 size-4 accent-[rgb(var(--gold))]" checked={dongY} onChange={(e) => setDongY(e.target.checked)} />
        <span>Tôi đồng ý lưu <b>vai trong nhà, năm sinh và giới tính</b> của những người trên vào tài khoản để dùng trên máy khác. Tên gọi và ngày sinh không được gửi lên. Rút lại bất cứ lúc nào: xoá ở Tài khoản → Dữ liệu của tôi.{" "}
          <Link href="/chinh-sach-rieng-tu#dong-y" className="text-gold underline">Chính sách quyền riêng tư</Link></span>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={!dongY || dang || ds.length === 0} onClick={() => lam(async () => { await luuGiaDinhTaiKhoan(nguoi.id, ds); ghi("chart_interacted", { kind: "gia_dinh_luu_tk", muc: String(ds.length) }); return "Đã lưu nhà mình vào tài khoản."; })}>
          <CloudUpload aria-hidden /> Lưu nhà mình vào tài khoản
        </Button>
        <Button size="sm" variant="ghost" disabled={dang} onClick={() => lam(async () => {
          const tk = await giaDinhTaiKhoan(nguoi.id);
          if (!tk) return "Tài khoản chưa lưu người nhà nào.";
          const n = nhapTuTaiKhoan(tk);
          return n ? `Đã tải ${n} người nhà từ tài khoản về máy này.` : "Những người trong tài khoản đã có trên máy này.";
        })}>
          <CloudDownload aria-hidden /> Tải từ tài khoản
        </Button>
      </div>
      {tin && <p role="status" className="mt-2 text-fg-muted">{tin}</p>}
    </div>
  );
}
