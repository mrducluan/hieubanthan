"use client";
// EN-5.1 — "Chọn ngày cho cả nhà": cưới hỏi (cô dâu, chú rể, bố mẹ hai bên), khai trương / về nhà mới (người đứng tên +
// người cùng làm). Engine chọn ngày hợp việc, không xung tuổi ai, gắn lưu ý tháng xung / Kim lâu / tuổi làm nhà của người
// chính — web chỉ hiển thị. Năm sinh của người khác chỉ đi qua lượt gọi, không lưu ở máy chủ hay trên máy.
import { useState } from "react";
import Link from "@/components/khung/Lien";
import { CalendarHeart, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { congNgay, duongNgay, type ChonNgayNhieuKq, type NgayNhieu } from "@/lib/hoang-lich";

const VIEC = [
  { ma: "cuoi_hoi", ten: "Cưới hỏi" }, { ma: "khai_truong", ten: "Khai trương" }, { ma: "nhap_trach", ten: "Về nhà mới" },
  { ma: "dong_tho", ten: "Động thổ" }, { ma: "ky_ket", ten: "Ký kết" },
];
const VAI_CUOI = [
  { ma: "co_dau", ten: "Cô dâu" }, { ma: "chu_re", ten: "Chú rể" }, { ma: "bo_co_dau", ten: "Bố cô dâu" },
  { ma: "me_co_dau", ten: "Mẹ cô dâu" }, { ma: "bo_chu_re", ten: "Bố chú rể" }, { ma: "me_chu_re", ten: "Mẹ chú rể" },
];
const VAI_KHAC = [
  { ma: "chu", ten: "Người đứng tên" }, { ma: "vo_chong_chu", ten: "Vợ / chồng người đứng tên" },
  { ma: "doi_tac", ten: "Đối tác" }, { ma: "nguoi_khac", ten: "Người cùng làm" },
];
const LAP = new Set(["doi_tac", "nguoi_khac"]);   // vai có thể nhiều người

interface Dong { vai: string; nam: string }

function macDinh(viec: string): Dong[] {
  return viec === "cuoi_hoi" ? [{ vai: "co_dau", nam: "" }, { vai: "chu_re", nam: "" }] : [{ vai: "chu", nam: "" }];
}

function dmy(iso: string): string {
  return iso.split("-").reverse().join("/");
}

function NhanLuuY({ ds }: { ds: string[] }) {
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {ds.map((x) => <span key={x} className="rounded-full border border-gold/40 px-2 py-0.5 text-[11px] text-gold">{x}</span>)}
    </span>
  );
}

function DongNgay({ n }: { n: NgayNhieu }) {
  return (
    <li>
      <Link href={duongNgay(n.ngay)} className="block rounded-xl border border-line/70 px-3 py-2 hover:border-gold/50">
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span><b>{dmy(n.ngay)}</b> <span className="text-sm text-fg-muted">({n.am} âm · {n.can_chi})</span></span>
          {n.diem_cong?.length ? <span className="text-xs text-jade">{n.diem_cong.join(" · ")}</span> : null}
        </span>
        {n.hop.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {n.hop.map((h, i) => (
              <span key={`${h.vai}-${i}`} className="rounded-full bg-jade/10 px-2 py-0.5 text-[11px] text-jade">{h.ten} {h.ten_vai}</span>
            ))}
          </span>
        )}
        {n.luu_y.length > 0 && <NhanLuuY ds={n.luu_y} />}
      </Link>
    </li>
  );
}

export function ChonNgayNhieu({ tu }: { tu: string }) {
  const [viec, setViec] = useState("cuoi_hoi");
  const [dong, setDong] = useState<Dong[]>(macDinh("cuoi_hoi"));
  const [soThang, setSoThang] = useState(12);
  const [kq, setKq] = useState<ChonNgayNhieuKq | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const dsVai = viec === "cuoi_hoi" ? VAI_CUOI : VAI_KHAC;

  function doiViec(v: string) {
    setViec(v); setDong(macDinh(v)); setKq(null); setLoi(null);
  }
  function sua(i: number, d: Partial<Dong>) {
    setDong((x) => x.map((y, k) => (k === i ? { ...y, ...d } : y))); setKq(null);
  }
  function them() {
    const da = new Set(dong.map((d) => d.vai));
    const tiep = dsVai.find((v) => !da.has(v.ma)) ?? dsVai.find((v) => LAP.has(v.ma));
    if (tiep && dong.length < 8) setDong((x) => [...x, { vai: tiep.ma, nam: "" }]);
  }

  async function tim() {
    const nguoi = dong.filter((d) => /^\d{4}$/.test(d.nam)).map((d) => ({ vai: d.vai, nam_sinh: Number(d.nam) }));
    if (!nguoi.length) { setLoi("Nhập năm sinh của ít nhất một người."); return; }
    const vaiTrung = nguoi.filter((x) => !LAP.has(x.vai)).map((x) => x.vai);
    if (new Set(vaiTrung).size !== vaiTrung.length) { setLoi("Mỗi vai chỉ một người (trừ đối tác, người cùng làm)."); return; }
    setDang(true); setLoi(null);
    try {
      const r = await fetch("/api/lich/chon-ngay-nhieu", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ viec, tu, den: congNgay(tu, soThang * 30), nguoi }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Chưa tìm được ngày.");
      const k = j as ChonNgayNhieuKq;
      setKq(k);
      ghi("good_day_searched", { viec, so_thang: soThang, co_tuoi: 1, so_nguoi: nguoi.length, so_ngay: k.ngay.length, nhieu: 1 });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa tìm được ngày."); }
    finally { setDang(false); }
  }

  return (
    <section aria-labelledby="chon-ngay-nhieu" className="glass space-y-3 rounded-2xl p-5" data-testid="chon-ngay-nhieu">
      <h2 id="chon-ngay-nhieu" className="flex items-center gap-2 text-xl"><CalendarHeart aria-hidden className="size-5 text-gold" />Chọn ngày cho cả nhà</h2>
      <p className="text-sm text-fg-muted">Cưới hỏi, khai trương hay về nhà mới thường phải hợp tuổi nhiều người. Nhập năm sinh từng người, máy tìm ngày không xung tuổi ai và báo tháng nào cần để ý.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn việc">
        {VIEC.map((v) => (
          <button key={v.ma} type="button" aria-pressed={viec === v.ma} onClick={() => doiViec(v.ma)}
            className={`rounded-full border px-3 py-1.5 text-sm ${viec === v.ma ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:border-gold/60"}`}>{v.ten}</button>
        ))}
      </div>
      <ul className="space-y-2" aria-label="Những người cần hợp tuổi">
        {dong.map((d, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`vai-${i}`}>Vai người thứ {i + 1}</label>
            <select id={`vai-${i}`} value={d.vai} onChange={(e) => sua(i, { vai: e.target.value })}
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg/60 px-2 py-1.5 text-sm sm:flex-none sm:w-56">
              {dsVai.map((v) => <option key={v.ma} value={v.ma}>{v.ten}</option>)}
            </select>
            <label className="sr-only" htmlFor={`nam-${i}`}>Năm sinh người thứ {i + 1}</label>
            <input id={`nam-${i}`} inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="Năm sinh" value={d.nam}
              onChange={(e) => sua(i, { nam: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              className="w-28 rounded-lg border border-line bg-bg/60 px-2 py-1.5 text-sm" />
            {dong.length > 1 && (
              <button type="button" onClick={() => { setDong((x) => x.filter((_, k) => k !== i)); setKq(null); }}
                aria-label={`Bỏ người thứ ${i + 1}`} className="grid size-9 place-items-center rounded-lg text-fg-muted hover:text-fg">
                <X aria-hidden className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {dong.length < 8 && <Button size="sm" variant="ghost" onClick={them}><Plus aria-hidden />Thêm người</Button>}
        <label htmlFor="so-thang-nhieu" className="text-fg-muted">Trong</label>
        <select id="so-thang-nhieu" value={soThang} onChange={(e) => { setSoThang(Number(e.target.value)); setKq(null); }}
          className="rounded-lg border border-line bg-bg/60 px-2 py-1">
          <option value={3}>3 tháng tới</option><option value={6}>6 tháng tới</option><option value={12}>12 tháng tới</option>
        </select>
        <Button size="sm" onClick={() => void tim()} disabled={dang}><Search aria-hidden />{dang ? "Đang tìm…" : "Tìm ngày"}</Button>
      </div>
      <p className="text-xs text-fg-faint">Chỉ cần năm sinh (người sinh tháng Chạp, tháng Giêng trước Tết tính theo năm âm trước). Năm sinh chỉ dùng để tính trong lượt này, không lưu.</p>
      {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
      {kq && (
        <div data-testid="ket-qua-nhieu" aria-live="polite" className="space-y-3">
          <p className="font-medium">{kq.tom_tat}</p>
          {kq.goi_y.map((g) => <p key={g} className="rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-sm">{g}</p>)}
          {kq.giai_thich && kq.giai_thich.length > 0 && (
            <details className="rounded-xl border border-line/70 px-3 py-2 text-sm" data-testid="giai-thich-nhieu">
              <summary className="cursor-pointer font-semibold">Các lưu ý theo tuổi nghĩa là gì</summary>
              <dl className="mt-2 space-y-1.5">
                {kq.giai_thich.map((g) => (
                  <div key={g.nhan}><dt className="text-gold">{g.nhan}</dt><dd className="text-fg-muted">{g.loi}</dd></div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-fg-faint">Ngày có lưu ý vẫn hiện để gia đình tự cân nhắc, xếp sau ngày không vướng.</p>
            </details>
          )}
          {kq.ngay_noi_bat.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-fg-muted">Ngày nên xem trước</h3>
              <ol className="space-y-2">{kq.ngay_noi_bat.map((n) => <DongNgay key={n.ngay} n={n} />)}</ol>
            </div>
          )}
          <details className="rounded-xl border border-line/70 px-3 py-2">
            <summary className="cursor-pointer text-sm font-semibold">Theo từng tháng</summary>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2" data-testid="thang-nhieu">
              {kq.thang.map((m) => {
                const [y, mm] = m.thang.split("-");
                return (
                  <li key={m.thang} className="rounded-xl border border-line/60 p-3">
                    <p className="flex items-baseline justify-between gap-2">
                      <b>Tháng {Number(mm)}/{y}</b>
                      <span className={`text-xs ${m.so_ngay ? "text-jade" : "text-fg-faint"}`}>{m.so_ngay ? `${m.so_ngay} ngày hợp` : "chưa có ngày hợp"}</span>
                    </p>
                    {m.ngay.length > 0 && (
                      <p className="mt-1 flex flex-wrap gap-1.5 text-sm">
                        {m.ngay.map((n) => <Link key={n.ngay} href={duongNgay(n.ngay)} className="text-gold hover:underline">{dmy(n.ngay).slice(0, 5)}</Link>)}
                      </p>
                    )}
                    {m.luu_y.length > 0 && <NhanLuuY ds={m.luu_y} />}
                  </li>
                );
              })}
            </ul>
          </details>
          <details className="text-xs text-fg-faint">
            <summary className="cursor-pointer">Cách chọn</summary>
            <p className="mt-1">{kq.cach_chon} {kq.chua_xet}</p>
            <p className="mt-1">Tuổi đã xét: {kq.nguoi.map((p) => `${p.ten_vai} ${p.can_chi}`).join(" · ")}.</p>
            <p className="mt-1">{kq.luu_y}</p>
          </details>
        </div>
      )}
    </section>
  );
}
