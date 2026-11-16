"use client";
// GD-1 đợt 1 (2026-11-16, chủ dự án duyệt) — "Bảng nhà mình": thêm người nhà (vai + năm sinh + giới tính, tên gọi chỉ trên
// máy) → engine ghép con giáp, Tam tai, năm tuổi, sao hạn, cung phi theo năm âm (`/api/gia-dinh`) → mỗi người một việc nên
// làm, cặp người nhà nổi bật (điểm sáng / nên để ý + việc cụ thể), hướng chung cả nhà, lối sang công cụ đã có.
// Web không tính gì; không điểm số, không xếp hạng. Đo: family_member_added{vai, co_gioi_tinh}, family_viewed{so_nguoi},
// chart_interacted{kind: gia_dinh_viec, muc} — chỉ mã.
import { useEffect, useMemo, useRef, useState } from "react";
import { Compass, Plus, Sparkles, Trash2, Users } from "lucide-react";
import Link from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input, Select } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useHoSo, tenGoi } from "@/lib/hoso";
import { useNguoiThan } from "@/lib/nguoi-than";
import {
  CAM_KET_GIA_DINH, TEN_VAI, TOI_DA_GIA_DINH, VAI_GIA_DINH, thanYeuCau, themNguoiNha, useGiaDinh, xoaCaNha, xoaNguoiNha,
  type VaiGiaDinh,
} from "@/lib/gia-dinh";

interface NguoiKq {
  id: string; vai: VaiGiaDinh; can_chi: string; con_giap: string; tuoi_mu: number; duoi_18: boolean; quan_he_nam: string;
  tam_tai: number | null; ma: string; nhan: string[]; viec: string; sao_han: string | null;
  cung_phi: { quai: string; nhom: string; huong_tot: string[] } | null; chi_nam_sinh_uoc_luong: boolean; can_cu: string;
}
interface CapKq { a: string; b: string; quan_he: string; loai: "diem_sang" | "nen_de_y"; nhom: string; tieu_de: string; noi_dung: string; viec: string; can_cu: string }
interface BangKq {
  nam: { nam: number; can_chi: string }; nguoi: NguoiKq[]; cap: CapKq[];
  huong: { chung: string[]; nhom: Record<string, string[]>; loi: string };
  tom_tat: { muc: { ma: string; so: number; ids: string[]; chu: string }[] };
  viec_chung: { ma: string; id?: string; ten: string; mo_ta: string; duong: string }[]; luu_y: string;
}

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
              <p className="mt-1 text-sm text-fg-muted">Theo con giáp của từng cặp — tập quán để hiểu nhịp của nhau, không phải lời đoán.</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="cap-nha">
                {kq.cap.slice(0, 8).map((c) => (
                  <li key={`${c.a}-${c.b}`} className={`rounded-2xl border p-4 ${c.loai === "diem_sang" ? "border-jade/35 bg-jade/[0.04]" : "border-gold/35 bg-gold/[0.04]"}`}>
                    <p className="text-xs text-fg-muted">{nhanNguoi(c.a)} · {nhanNguoi(c.b)}</p>
                    <p className={`mt-1 font-medium ${c.loai === "diem_sang" ? "text-jade" : "text-gold"}`}>{c.loai === "diem_sang" ? "Điểm sáng" : "Nên để ý"} · {c.tieu_de}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{c.noi_dung}</p>
                    <p className="mt-2 text-sm leading-relaxed"><b className="font-medium text-fg">Nên làm: </b>{c.viec}</p>
                  </li>
                ))}
              </ul>
            </section>
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
