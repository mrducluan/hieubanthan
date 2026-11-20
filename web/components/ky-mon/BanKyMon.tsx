"use client";
// Bàn Kỳ Môn theo giờ — CHỈ VẼ dữ liệu engine đã lập và đã đọc (mức, lời, cách cục). La bàn tám hướng (Bắc ở trên) tô theo
// mức engine chấm (lục / xám / hổ phách — không đỏ, không điểm số); chọn việc → engine chỉ hướng + giờ hợp trong ngày;
// bấm một khung giờ → xin engine bàn của giờ ấy. Không tên, không ngày sinh; không lưu gì.
import { useCallback, useEffect, useRef, useState } from "react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { LUOI_BAC_TREN, type BanKM, type DanhMucKM, type GioTyKM, type HuongKM, type MucKM, type NgayKM, type PhepKM, type ViecKM } from "@/lib/ky-mon";

const MAU: Record<MucKM, { o: string; cham: string; chu: string }> = {
  thuan: { o: "border-jade/50 bg-jade/10", cham: "bg-jade", chu: "text-jade" },
  binh: { o: "border-line bg-surface/60", cham: "bg-fg-faint", chu: "text-fg-muted" },
  cham: { o: "border-[rgb(245_170_80/0.45)] bg-[rgb(245_170_80/0.08)]", cham: "bg-[rgb(245_170_80)]", chu: "text-[rgb(245_170_80)]" },
};

type TuyChon = { phep: PhepKM; gio_ty: GioTyKM; utc: number };

async function goi<T>(duong: string, than: unknown): Promise<T | null> {
  try {
    const r = await fetch(duong, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(than) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch { return null; }
}

const ngayCua = (thoiDiem: string) => thoiDiem.slice(0, 10);
/** Giờ đầu của khung chứa `thoiDiem`, dạng "HH" khớp `luc` engine trả (00, 01, 03 … 21, 23). */
const khungCua = (thoiDiem: string) => { const h = Number(thoiDiem.slice(11, 13)); return String(h === 0 || h % 2 ? h : h - 1).padStart(2, "0"); };
const docNgay = (iso: string) => { const [y, m, d] = iso.split("-"); return `${Number(d)}/${Number(m)}/${y}`; };

export function BanKyMon({ banDau, ngayDau, viec }: { banDau: BanKM; ngayDau: NgayKM; viec: DanhMucKM["viec"] }) {
  const [ban, setBan] = useState(banDau);
  const [ngay, setNgay] = useState(ngayDau);
  const [chonViec, setChonViec] = useState<ViecKM | null>(null);
  const [chonCung, setChonCung] = useState<number | null>(null);
  const [chuyenSau, setChuyenSau] = useState(false);
  const [tc, setTc] = useState<TuyChon>({ phep: banDau.tuy_chon.phep, gio_ty: banDau.tuy_chon.gio_ty, utc: banDau.tuy_chon.utc });
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState(false);
  const luot = useRef(0);

  const tai = useCallback(async (o: { thoiDiem?: string; viec?: ViecKM | null; tc?: TuyChon }) => {
    const t = o.tc ?? tc;
    const v = o.viec === undefined ? chonViec : o.viec;
    const chung = { utc: t.utc, phep: t.phep, gio_ty: t.gio_ty, ...(v ? { viec: v } : {}) };
    const toi = ++luot.current;
    setDangTai(true); setLoi(false);
    const [b, n] = await Promise.all([
      goi<BanKM>("/api/ky-mon/ban", { ...chung, ...(o.thoiDiem ? { thoi_diem: o.thoiDiem } : {}) }),
      goi<NgayKM>("/api/ky-mon/ngay", { ...chung, ...(o.thoiDiem ? { ngay: ngayCua(o.thoiDiem) } : {}) }),
    ]);
    if (toi !== luot.current) return;               // đã có lượt bấm mới hơn
    setDangTai(false);
    if (!b || !n) { setLoi(true); return; }
    setBan(b); setNgay(n); setChonCung(null);
  }, [tc, chonViec]);

  // Máy người xem ở múi giờ khác Việt Nam → lập lại bàn theo giờ nơi họ đang ở (bàn Kỳ Môn theo giờ địa phương).
  useEffect(() => {
    const utc = Math.round((-new Date().getTimezoneOffset() / 60) * 4) / 4;
    if (utc !== banDau.tuy_chon.utc && utc >= -12 && utc <= 14) {
      const moi = { phep: banDau.tuy_chon.phep, gio_ty: banDau.tuy_chon.gio_ty, utc };
      setTc(moi);
      void tai({ tc: moi });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy một lần lúc gắn vào trang
  }, []);

  const d = ban.doc;
  const huong = new Map(d.huong.map((h) => [h.cung, h]));
  const dangXem: HuongKM | null = (chonCung ? huong.get(chonCung) : null) ?? (d.viec?.cung ? huong.get(d.viec.cung) ?? null : null);
  const khungDangXem = khungCua(ban.thoi_diem);

  const doiViec = (v: ViecKM | null) => {
    setChonViec(v);
    ghi("chart_interacted", { mo_dun: "kymon", kind: "chon_viec", muc: v ?? "tat_ca" });
    void tai({ viec: v, thoiDiem: ban.thoi_diem });
  };

  return (
    <div data-testid="ban-ky-mon" aria-busy={dangTai}>
      <fieldset className="mb-5">
        <legend className="mb-2 text-sm text-fg-muted">Bạn định làm việc gì?</legend>
        <div className="flex flex-wrap gap-2">
          {[{ ma: null as ViecKM | null, ten: "Xem chung" }, ...viec].map((v) => (
            <button key={v.ma ?? "chung"} type="button" onClick={() => doiViec(v.ma)} aria-pressed={chonViec === v.ma}
              className={cn("vung-cham rounded-full border px-3 py-1.5 text-sm transition", chonViec === v.ma
                ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:border-gold/50 hover:text-fg")}>{v.ten}</button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-fg-muted" data-testid="km-gio">
              Giờ <span className="text-fg">{d.gio.chi}</span> ({d.gio.khung}) ngày {docNgay(ngayCua(ban.thoi_diem))} ·{" "}
              <span className={MAU[d.gio.muc].chu}>{d.gio.muc_nhan}</span>
            </p>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-muted">
              <input type="checkbox" className="accent-[rgb(var(--gold))]" checked={chuyenSau} onChange={(e) => setChuyenSau(e.target.checked)} />
              Hiện Sao · Thần
            </label>
          </div>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="La bàn tám hướng của giờ này, Bắc ở trên">
            {LUOI_BAC_TREN.map((k) => {
              const h = huong.get(k);
              if (!h) return (
                <div key={k} className="flex aspect-square flex-col items-center justify-center rounded-xl border border-line/60 text-center text-xs text-fg-faint">
                  <span>{ban.ban.am_duong === "duong" ? "Dương" : "Âm"} độn</span><span className="text-base text-fg-muted">{ban.ban.cuc} cục</span>
                </div>
              );
              const chon = dangXem?.cung === k;
              return (
                <button key={k} type="button" data-cung={k} data-muc={h.muc} aria-pressed={chon}
                  onClick={() => { setChonCung(k); ghi("chart_interacted", { mo_dun: "kymon", kind: "chon_huong", muc: h.muc }); }}
                  className={cn("relative flex aspect-square flex-col items-center justify-center rounded-xl border p-1 text-center transition",
                    MAU[h.muc].o, chon && "ring-2 ring-gold", d.viec?.cung === k && "outline outline-1 outline-gold/70")}>
                  <span className="text-[0.7rem] uppercase tracking-wide text-fg-faint">{h.phuong}</span>
                  <span className="mt-0.5 text-lg leading-tight text-fg">{h.cua.ten}</span>
                  <span className={cn("mt-0.5 text-[0.7rem] leading-tight", MAU[h.muc].chu)}>{h.muc_nhan}{h.noi_bat ? " ★" : ""}</span>
                  {chuyenSau && (
                    <span className="mt-0.5 line-clamp-1 text-[0.62rem] text-fg-faint">
                      {h.sao.ten.replace("Thiên ", "")} · {h.than.ten}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-faint" aria-label="Chú thích màu">
            {(["thuan", "binh", "cham"] as MucKM[]).map((m) => (
              <li key={m} className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", MAU[m].cham)} aria-hidden />{m === "thuan" ? "Thuận" : m === "binh" ? "Bình thường" : "Nên chậm"}</li>
            ))}
            <li>★ có thêm «kỳ» hoặc thế tốt</li>
          </ul>
        </div>

        <div className="min-w-0 space-y-4">
          <p className="text-lg leading-relaxed text-fg" data-testid="km-tom-tat">{d.tom_tat}</p>
          {d.viec && (
            <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4" data-testid="km-viec">
              <p className="eyebrow">{d.viec.ten}</p>
              <p className="mt-1.5 leading-relaxed">{d.viec.loi}</p>
              {ngay.viec && ngay.viec.gio_tot.length > 0 && (
                <>
                  <p className="mt-3 text-sm text-fg-muted">Giờ hợp việc này trong ngày {docNgay(ngay.ngay)}:</p>
                  <ul className="mt-1.5 space-y-1 text-sm">
                    {ngay.viec.gio_tot.map((g) => (
                      <li key={g.luc}>
                        <button type="button" className="text-left underline decoration-gold/50 underline-offset-4 hover:text-gold"
                          onClick={() => { ghi("chart_interacted", { mo_dun: "kymon", kind: "chon_gio", muc: "gio_tot" }); void tai({ thoiDiem: `${ngay.ngay}T${g.luc}` }); }}>
                          {g.loi}</button>{g.ban_dem ? <span className="text-fg-faint"> (giờ đêm)</span> : null}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {ngay.viec?.loi && <p className="mt-3 text-sm text-fg-muted">{ngay.viec.loi}</p>}
              {(d.viec.chuyen_nghia?.length ?? 0) > 0 && (
                <details className="mt-3 rounded-xl border border-line/60 bg-bg/40 p-3 text-sm" data-testid="km-chuyen-nghia">
                  <summary className="cursor-pointer text-fg">Sách xưa nói gì về việc này?</summary>
                  <ul className="mt-2 space-y-3">
                    {d.viec.chuyen_nghia!.map((c) => (
                      <li key={c.ma}>
                        <p className="text-fg">{c.ten_co}</p>
                        <p className="mt-0.5 text-xs text-fg-faint"><span lang="zh-Hant" className="font-serif">{c.sach.han}</span> — {c.sach.y}</p>
                        {c.hom_nay && <p className="mt-1">Ngày nay{c.linh_vuc_ten ? ` (${c.linh_vuc_ten.toLowerCase()})` : ""}: {c.hom_nay}</p>}
                      </li>
                    ))}
                    {d.viec.nguyen_tac && (
                      <li>
                        <p className="text-fg">{d.viec.nguyen_tac.ten_co}</p>
                        <p className="mt-0.5 text-xs text-fg-faint"><span lang="zh-Hant" className="font-serif">{d.viec.nguyen_tac.sach.han}</span> — {d.viec.nguyen_tac.sach.y}</p>
                        <p className="mt-1">{d.viec.nguyen_tac.nghia}</p>
                      </li>
                    )}
                  </ul>
                </details>
              )}
              {d.viec.ranh_gioi && <p className="mt-3 text-xs text-fg-faint">{d.viec.ranh_gioi}</p>}
            </div>
          )}
          {d.luu_y_gio.map((l) => <p key={l} className="rounded-xl border border-[rgb(245_170_80/0.4)] bg-[rgb(245_170_80/0.06)] p-3 text-sm leading-relaxed">{l}</p>)}
          {d.hiem.map((h) => <p key={h.ma} className="rounded-xl border border-jade/40 bg-jade/5 p-3 text-sm">{h.loi}</p>)}

          {dangXem ? <ChiTietHuong h={dangXem} /> : <p className="text-sm text-fg-muted">Chạm vào một hướng trên la bàn để đọc kỹ.</p>}
          {loi && <p role="alert" className="text-sm text-[rgb(245_170_80)]">Chưa lấy được bàn mới. Bạn thử lại sau ít phút.</p>}
        </div>
      </div>

      <section aria-labelledby="km-ngay" className="mt-8">
        <h2 id="km-ngay" className="text-xl">Mười ba khung giờ của ngày {docNgay(ngay.ngay)}</h2>
        <p className="mt-1 text-sm text-fg-muted">Bấm một khung giờ để xem la bàn của giờ ấy.</p>
        <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" data-testid="km-13-gio">
          {ngay.gio.map((g) => {
            const dang = ngay.ngay === ngayCua(ban.thoi_diem) && g.luc.slice(0, 2) === khungDangXem;
            return (
              <li key={g.luc}>
                <button type="button" aria-current={dang ? "time" : undefined} data-muc={g.muc}
                  onClick={() => { ghi("chart_interacted", { mo_dun: "kymon", kind: "chon_gio", muc: g.muc }); void tai({ thoiDiem: `${ngay.ngay}T${g.luc}` }); }}
                  className={cn("w-full rounded-xl border p-2.5 text-left text-sm transition", MAU[g.muc].o, dang && "ring-2 ring-gold")}>
                  <span className="flex items-baseline justify-between gap-2"><span className="text-fg">{g.chi}</span><span className="text-xs text-fg-faint">{g.khung}</span></span>
                  <span className={cn("mt-1 block text-xs leading-snug", MAU[g.muc].chu)}>
                    {g.viec ? `${g.viec.phuong} · cửa ${g.viec.cua}` : g.huong_thuan.length ? g.huong_thuan.join(", ") : g.luu_y[0] ?? g.muc_nhan}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <details className="mt-6 rounded-2xl border border-line/70 p-4 text-sm" data-testid="km-cach-tinh">
        <summary className="cursor-pointer text-fg">Cách tính của bàn này</summary>
        <p className="mt-3 text-fg-muted">
          {ban.ban.am_duong === "duong" ? "Dương" : "Âm"} độn {ban.ban.cuc} cục ({ban.ban.tiet.ten}), ngày {ban.ban.can_chi.ngay}, giờ {ban.ban.can_chi.gio},
          tuần {ban.ban.tuan_thu}. Trực phù {ban.ban.truc_phu.sao}, trực sử cửa {ban.ban.truc_su.cua}. Giờ tính theo múi UTC{tc.utc >= 0 ? "+" : ""}{tc.utc} của máy bạn.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="text-fg-muted">Phép định cục</span>
            <select className="mt-1 w-full rounded-lg border border-line bg-surface p-2" value={tc.phep}
              onChange={(e) => { const moi = { ...tc, phep: e.target.value as PhepKM }; setTc(moi); ghi("chart_interacted", { mo_dun: "kymon", kind: "doi_phai", muc: moi.phep }); void tai({ tc: moi, thoiDiem: ban.thoi_diem }); }}>
              <option value="sach_bo">Sách bổ (theo tiết khí đang đi — phổ biến ngày nay)</option>
              <option value="tri_nhuan">Trí nhuận (phép sách cổ trình bày)</option>
            </select></label>
          <label className="block"><span className="text-fg-muted">Giờ 23:00–23:59</span>
            <select className="mt-1 w-full rounded-lg border border-line bg-surface p-2" value={tc.gio_ty}
              onChange={(e) => { const moi = { ...tc, gio_ty: e.target.value as GioTyKM }; setTc(moi); void tai({ tc: moi, thoiDiem: ban.thoi_diem }); }}>
              <option value="da_ty">Vẫn tính ngày hôm đó (như Bát tự ở đây)</option>
              <option value="sang_ngay">Tính sang ngày hôm sau</option>
            </select></label>
        </div>
        {ban.tuy_chon.phep_ghi_chu && <p className="mt-2 text-xs text-fg-faint">{ban.tuy_chon.phep_ghi_chu}</p>}
      </details>
    </div>
  );
}

function ChiTietHuong({ h }: { h: HuongKM }) {
  return (
    <article className="rounded-2xl border border-line/70 p-4" data-testid="km-chi-tiet" aria-live="polite">
      <h3 className="text-lg text-fg">Hướng {h.phuong}: cửa {h.cua.ten} <span className={cn("ml-1 text-sm", MAU[h.muc].chu)}>· {h.muc_nhan}</span></h3>
      <p className="mt-2 leading-relaxed">{h.cua.loi}</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div><dt className="inline text-fg-muted">Nên: </dt><dd className="inline">{h.cua.nen}</dd></div>
        <div><dt className="inline text-fg-muted">Tránh: </dt><dd className="inline">{h.cua.tranh}</dd></div>
      </dl>
      {h.cuu_don && h.cuu_don.length > 0 && h.cuu_don.map((cd) => (
        <div key={cd.ma} className="mt-3 rounded-xl border border-gold/40 bg-gold/5 p-3 text-sm" data-testid="km-cuu-don">
          <p className="font-medium text-gold">Cửu Độn · {cd.ten}</p>
          <p className="mt-1 text-xs text-fg-muted">{cd.dieu_kien}</p>
          <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
            <p className="rounded-lg bg-jade/10 p-2 leading-relaxed"><b className="text-jade">Đắc dụng:</b> {cd.mat_tich_cuc}</p>
            <p className="rounded-lg bg-amber-500/10 p-2 leading-relaxed"><b className="text-amber-500">Nên chú ý:</b> {cd.mat_tieu_cuc_can_chu_y}</p>
          </div>
          {cd.sach_ghi?.han && <p className="mt-2 border-l-2 border-gold/40 pl-2 text-xs text-fg-faint">{cd.sach_ghi.han} {cd.sach_ghi.nguon ? `— ${cd.sach_ghi.nguon}` : ""}</p>}
        </div>
      ))}
      {h.cach.map((c) => (
        <div key={c.ma} className={cn("mt-3 rounded-xl border p-3 text-sm", c.loai === "cat" ? "border-jade/40 bg-jade/5" : "border-[rgb(245_170_80/0.4)] bg-[rgb(245_170_80/0.06)]")}>
          <p className="text-fg">{c.loai === "cat" ? "Điểm sáng" : "Nên để ý"}: {c.ten}</p>
          <p className="mt-1 leading-relaxed text-fg-muted">{c.loi} {c.nen}</p>
        </div>
      ))}
      <p className="mt-3 text-sm text-fg-muted">
        Đi cùng: sao {h.sao.ten} ({h.sao.tom.toLowerCase()}) và thần {h.than.ten} ({h.than.tom.toLowerCase()}).
        {h.can_cu[1] ? <span className="block mt-1 text-xs text-fg-faint">{h.can_cu[1]}</span> : null}
      </p>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-fg-muted">Vì sao nói vậy</summary>
        <ul className="mt-2 space-y-1.5 text-fg-muted">
          {h.can_cu.map((c) => <li key={c}>{c}</li>)}
          {h.cach.map((c) => <li key={c.ma}>{c.ten}{c.han ? ` (${c.han})` : ""}: {c.dieu_kien}</li>)}
          {[h.cua.sach, h.sao.sach, h.than.sach, ...h.cach.map((c) => c.sach)].filter(Boolean).map((s) => <li key={s as string} lang="vi">{s}</li>)}
        </ul>
      </details>
    </article>
  );
}
