"use client";
// QTE-1 tuần 3–5 — form ngày giờ + nơi sinh dùng chung cho các công cụ tiếng Anh. Nơi sinh: Việt Nam (Bắc/Nam) hoặc nước +
// bang/thành phố → engine tính múi giờ chuẩn + giờ mùa hè (/api/dia-ly/mui-gio). Trả `payload` đúng khung LaSoVao.
// Nhớ trên máy này (một khoá chung cho mọi công cụ tiếng Anh), không lưu ở máy chủ.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDanhSachNuoc, type KetQuaMuiGio } from "@/lib/dia-ly";

const KHOA = "hbt.en.sinh.v1";
const VN = [["vn-north", "Vietnam — North (Hanoi…)", "ha-noi"], ["vn-south", "Vietnam — South (Ho Chi Minh City…)", "tp-ho-chi-minh"]] as const;

export type PayloadSinh = Record<string, unknown> & { birth_date: string; birth_time: string; gender: string };

export function FormSinhEn({ nut, onTinh, testId }: { nut: string; onTinh: (p: PayloadSinh) => Promise<void>; testId?: string }) {
  const [ngay, setNgay] = useState(""), [gio, setGio] = useState(""), [gioiTinh, setGioiTinh] = useState("");
  const [nuoc, setNuoc] = useState(""), [tp, setTp] = useState("");
  const [loi, setLoi] = useState<string | null>(null), [dang, setDang] = useState(false);
  const ds = useDanhSachNuoc(true, "en");
  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(KHOA) ?? localStorage.getItem("hbt.en.bazi.v1") ?? "null");
      if (o) { setNgay(o.ngay ?? ""); setGio(o.gio ?? ""); setGioiTinh(o.gioiTinh ?? ""); setNuoc(o.nuoc ?? ""); setTp(o.tp ?? ""); }
    } catch { /* bỏ qua */ }
  }, []);
  const nuocChon = ds?.find((n) => n.ma === nuoc);
  const tpChon = nuocChon && nuocChon.thanh_pho.length === 1 ? nuocChon.thanh_pho[0]!.mui_gio : tp;

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || !/^\d{2}:\d{2}$/.test(gio) || !gioiTinh || !nuoc) return setLoi("Please fill in birth date, time, sex and place of birth.");
    const vn = VN.find((v) => v[0] === nuoc);
    if (!vn && !tpChon) return setLoi("Please choose the state or city of birth.");
    setLoi(null); setDang(true);
    try {
      let noiSinh: Record<string, unknown> = vn ? { noi_sinh: vn[2] } : {};
      if (!vn) {
        const r = await fetch(`/api/dia-ly/mui-gio?${new URLSearchParams({ mui_gio: tpChon, ngay, gio })}`);
        if (!r.ok) throw new Error("Could not work out the time zone for this place.");
        const mg = (await r.json()) as KetQuaMuiGio;
        noiSinh = { noi_sinh: "nuoc_ngoai", utc_noi_sinh: mg.utc_chuan, ...(mg.gio_mua_he ? { gio_mua_he: true } : {}) };
      }
      await onTinh({ birth_date: ngay, birth_time: gio, gender: gioiTinh, ...noiSinh });
      try { localStorage.setItem(KHOA, JSON.stringify({ ngay, gio, gioiTinh, nuoc, tp })); } catch { /* bỏ qua */ }
    } catch (e2) {
      setLoi(e2 instanceof Error ? e2.message : "Something went wrong.");
    } finally { setDang(false); }
  }

  return (
    <form onSubmit={gui} className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2 sm:p-6" data-testid={testId}>
      <div className="space-y-2"><Label htmlFor="en-ngay">Date of birth</Label><Input id="en-ngay" type="date" value={ngay} onChange={(e) => setNgay(e.target.value)} min="1900-01-01" max="2100-12-31" /></div>
      <div className="space-y-2"><Label htmlFor="en-gio">Time of birth (clock time on the birth certificate)</Label><Input id="en-gio" type="time" value={gio} onChange={(e) => setGio(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="en-gt">Sex at birth (sets the direction of the luck cycles)</Label>
        <Select id="en-gt" value={gioiTinh} onChange={(e) => setGioiTinh(e.target.value)}>
          <option value="">— Choose —</option><option value="nam">Male</option><option value="nu">Female</option>
        </Select></div>
      <div className="space-y-2"><Label htmlFor="en-nuoc">Country of birth</Label>
        <Select id="en-nuoc" value={nuoc} onChange={(e) => { setNuoc(e.target.value); setTp(""); }} disabled={!ds}>
          <option value="">{ds ? "— Choose —" : "Loading…"}</option>
          {VN.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          {ds?.map((n) => <option key={n.ma} value={n.ma}>{n.ten}</option>)}
        </Select></div>
      {nuocChon && nuocChon.thanh_pho.length > 1 && (
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="en-tp">State / city</Label>
          <Select id="en-tp" value={tp} onChange={(e) => setTp(e.target.value)}>
            <option value="">— Choose —</option>
            {nuocChon.thanh_pho.map((t) => <option key={t.ten} value={t.mui_gio}>{t.ten}</option>)}
          </Select></div>
      )}
      <p className="text-xs text-fg-faint sm:col-span-2">We work out the time zone and daylight saving time for your birth date automatically. Your birth data is sent only to calculate the chart, is not stored on our servers, and is remembered on this device only.</p>
      {loi && <p className="text-sm text-cinnabar sm:col-span-2" role="alert">{loi}</p>}
      <div className="sm:col-span-2"><Button type="submit" disabled={dang}>{dang ? "Calculating…" : nut}</Button></div>
    </form>
  );
}
