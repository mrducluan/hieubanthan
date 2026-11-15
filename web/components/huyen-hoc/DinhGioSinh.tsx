"use client";
// TV-V2 — định giờ sinh: engine lập lá số cho các canh giờ ứng viên (giờ trước / đã nhập / sau, hoặc đủ 12 canh khi
// không biết giờ) và đặt câu đối chiếu theo những năm NGƯỜI DÙNG nhớ rõ. Người dùng tự tick "đúng với mình";
// web chỉ đếm số tick để họ tự so — không chấm điểm, không tự đổi hồ sơ, không lưu năm hay câu trả lời.
import { useState } from "react";
import { Check, Clock3, PencilLine, X } from "lucide-react";
import type { ChartInputVao, DinhGioOutputT } from "@/app/api/tuvi/schema";
import { NhanLop } from "@/components/huyen-hoc/KhoiMoLuoi";
import { MAU_HOA_DIU } from "@/components/huyen-hoc/PhiHoa";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ghi } from "@/lib/do-luong";
import { usePost } from "@/lib/goi-api";
import type { HoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";
import { useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";
import { TenHienProvider } from "@/components/khung/TenHien";
import { useNgonNgu } from "@/components/khung/NgonNgu";

// Lý do (mã engine `ly_do`) và câu giải thích dòng giờ lịch (mã `ly_do_lech`): khoá dg.ly_do.<mã>, dg.lech.<mã>.{nhan,cau}
// ở lib/chu/tu-vi.ts; thiếu mã = engine cũ → câu chung (dg.lech.chung).
const LY_DO = new Set(["gan_ranh_gio", "ang_chung", "khong_biet"]);
const LY_DO_LECH = new Set(["mui_gio_lich_su", "gio_mua_he", "nuoc_ngoai"]);

/** "1965-03-09" → "09/03/1965". */
const ngayVN = (iso: string) => iso.split("-").reverse().join("/");

const namNay = () => Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));

export function DinhGioSinh({ laSo, hoSo, khongBietGio }: { laSo: ChartInputVao; hoSo: HoSo | null; khongBietGio: boolean }) {
  const [namChon, setNamChon] = useState<number[] | null>(null);   // null = để engine chọn 3 năm âm gần nhất
  const body = { la_so: laSo, ...(namChon ? { nam_doi_chieu: namChon } : {}), ...(khongBietGio ? { tat_ca_gio: true } : {}) };
  const { data: d, loi, thuLai } = usePost<DinhGioOutputT>("/api/tuvi/dinh-gio", body);
  const [moHoSo, setMoHoSo] = useState(false);
  const { c } = useChuTuVi();

  return (
    <TenHienProvider ten={[(d as { ten_hien?: Record<string, Record<string, string>> } | null)?.ten_hien]}>
    <div className="space-y-4" data-testid="dinh-gio-noi-dung">
      {loi && <BaoLoi loi={loi} thuLai={thuLai} />}
      {!d && !loi && <KhungTai dong={3} />}
      {d && (
        <>
          {d.ly_do.length > 0 ? (
            <ul className="space-y-1 text-sm text-fg-muted">{d.ly_do.map((l) => <li key={l}>· {LY_DO.has(l) ? c(`dg.ly_do.${l}`) : l}</li>)}</ul>
          ) : (
            <p className="text-sm text-fg-muted">{c("dg.khong_sat")}</p>
          )}
          {d.loi_dan && <p className="text-sm text-fg-muted">{d.loi_dan}</p>}
          <ChonNam macDinh={d.ung_vien[0]?.nam.map((n) => n.nam) ?? []} onDoi={setNamChon} />
          <DanhSachUngVien d={d} onDung={(lech) => {
            // Chỉ mã + độ lệch canh giờ so với giờ đã nhập — không ngày giờ.
            ghi("chart_interacted", { mo_dun: "tuvi", kind: "dinh_gio", lech });
            setMoHoSo(true);
          }} />
          {d.khac_nhau.length > 0 && (
            <div>
              <NhanLop lop="tinh" />
              <ul className="mt-1 space-y-1 text-xs text-fg-muted">{d.khac_nhau.map((k) => <li key={k}>· {k}</li>)}</ul>
            </div>
          )}
          {d.luu_y.length > 0 && <p className="text-xs text-fg-faint">{d.luu_y.join(" ")}</p>}
        </>
      )}
      <Sheet open={moHoSo} onOpenChange={setMoHoSo}>
        <SheetContent title={c("dg.sua_tieu_de")} description={c("dg.sua_mo_ta")}>
          <NhapHoSo macDinh={hoSo} can="day_du" nutGui={c("dg.luu")} onXong={() => setMoHoSo(false)} />
        </SheetContent>
      </Sheet>
    </div>
    </TenHienProvider>
  );
}

/** Người dùng tự chọn ≤ 3 năm họ nhớ rõ (có biến cố, chuyển việc, chuyển nhà…). Không lưu. */
function ChonNam({ macDinh, onDoi }: { macDinh: number[]; onDoi: (ds: number[] | null) => void }) {
  const [sua, setSua] = useState(false);
  const [o, setO] = useState<string[]>(() => [0, 1, 2].map((k) => (macDinh[k] ? String(macDinh[k]) : "")));
  const [loi, setLoi] = useState<string | null>(null);
  const { c } = useChuTuVi();
  if (!sua) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        {c("dg.nam_doi_chieu")} {macDinh.map((n) => <b key={n} className="rounded-full border border-line px-2.5 py-0.5 text-fg">{n}</b>)}
        <Button size="sm" variant="ghost" onClick={() => setSua(true)}><PencilLine aria-hidden /> {c("dg.chon_nam")}</Button>
      </p>
    );
  }
  const max = namNay();
  return (
    <form className="space-y-2 rounded-xl border border-line/70 p-3" data-testid="chon-nam-doi-chieu" onSubmit={(e) => {
      e.preventDefault();
      const ds = [...new Set(o.filter((x) => x.length === 4).map(Number))];
      if (ds.length === 0) return setLoi(c("dg.loi_it"));
      if (ds.some((n) => n < 1900 || n > max)) return setLoi(c("dg.loi_nam", { max: String(max) }));
      setLoi(null); setSua(false); onDoi(ds.slice(0, 3));
    }}>
      <p className="text-sm text-fg-muted">{c("dg.huong_dan")}</p>
      <div className="flex flex-wrap items-center gap-2">
        {o.map((v, k) => (
          <Input key={k} aria-label={c("dg.o_nam", { so: String(k + 1) })} inputMode="numeric" placeholder={c("dg.nam")} value={v} className="w-24 text-center"
            onChange={(e) => setO((cu) => cu.map((x, j) => (j === k ? e.target.value.replace(/\D/g, "").slice(0, 4) : x)))} />
        ))}
        <Button size="sm" type="submit">{c("dg.doi_chieu")}</Button>
        <Button size="sm" type="button" variant="ghost" onClick={() => { setSua(false); setLoi(null); }}><X aria-hidden /> {c("dg.thoi")}</Button>
      </div>
      {loi && <p role="alert" className="text-xs text-cinnabar">{loi}</p>}
    </form>
  );
}

type UngVien = DinhGioOutputT["ung_vien"][number];

/** Ứng viên sớm hơn (-1) / trùng (0) / muộn hơn (1) giờ đã nhập — theo ngày giờ đồng hồ engine trả (đúng cả khi có
 *  ứng viên thứ 13 "Giờ Tý muộn"); thiếu dau_vao thì theo thứ tự (engine xếp theo thời gian). */
function lechSoVoiNhap(ds: UngVien[], i: number): -1 | 0 | 1 {
  const iNhap = ds.findIndex((u) => u.la_gio_nhap);
  if (iNhap < 0) return 0;
  const a = ds[i]?.dau_vao, b = ds[iNhap]?.dau_vao;
  if (a && b) {
    const x = `${a.birth_date}T${a.birth_time}`, y = `${b.birth_date}T${b.birth_time}`;
    return x === y ? 0 : x < y ? -1 : 1;
  }
  return Math.sign(i - iNhap) as -1 | 0 | 1;
}

function DanhSachUngVien({ d, onDung }: { d: DinhGioOutputT; onDung: (lech: -1 | 0 | 1) => void }) {
  // Tick "đúng với mình" chỉ nằm trong bộ nhớ trang — không gửi, không lưu.
  const [tick, setTick] = useState<Record<string, boolean>>({});
  const nhieu = d.ung_vien.length > 3;
  const { c: t, ten, hoa } = useChuTuVi();
  const { ngonNgu } = useNgonNgu();
  const maLech = d.ly_do_lech && LY_DO_LECH.has(d.ly_do_lech) ? d.ly_do_lech : "chung";
  const lechCau = { nhan: t(`dg.lech.${maLech}.nhan`), cau: t(`dg.lech.${maLech}.cau`) };
  const ngayHien = (iso: string) => (ngonNgu === "en" ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`)) : ngayVN(iso));
  // Ngày đã nhập theo đồng hồ = ngày của ứng viên "giờ đã nhập"; ứng viên khác ngày này thì ghi rõ ngày.
  const ngayNhap = d.ung_vien.find((u) => u.la_gio_nhap)?.ngay_duong ?? d.ung_vien.find((u) => u.la_gio_nhap)?.dau_vao?.birth_date;
  return (
    <ol className={cn("grid gap-3", nhieu ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-3")} aria-label={t("dg.ung_vien")}>
      {d.ung_vien.map((u, i) => {
        const soDung = u.nam.reduce((s, n) => s + n.cau_hoi.filter((_, k) => tick[`${i}-${n.nam}-${k}`]).length, 0);
        const cau = (
          <div className="space-y-3">
            {u.nam.map((n) => (
              <div key={n.nam}>
                <p className="text-xs font-medium text-fg">{t("dg.nam_can_chi", { nam: String(n.nam), can_chi: n.can_chi })}</p>
                <ul className="mt-1 space-y-1.5">
                  {n.cau_hoi.map((c, k) => {
                    const khoa = `${i}-${n.nam}-${k}`;
                    return (
                      <li key={khoa}>
                        <label className="flex cursor-pointer items-start gap-2 text-sm text-fg-muted">
                          <input type="checkbox" checked={Boolean(tick[khoa])} onChange={(e) => setTick((t) => ({ ...t, [khoa]: e.target.checked }))}
                            className="mt-1 size-4 shrink-0 accent-[rgb(var(--gold))]" aria-label={t("dg.dung_voi_minh", { cau: c.noi_dung })} />
                          <span>
                            <span className={cn("mr-1 rounded px-1.5 py-0.5 text-[10px]", MAU_HOA_DIU[c.hoa] ?? "bg-surface-2")}>{hoa(c.hoa)} · {ten("cung", c.cung)}</span>
                            {c.noi_dung}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        );
        return (
          <li key={`${i}-${u.nhan}`} data-testid="ung-vien-gio"
            className={cn("flex flex-col gap-2 rounded-2xl border p-4", u.la_gio_nhap ? "border-gold/50 bg-gold/5" : "border-line/70")}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-serif text-lg text-fg"><Clock3 className="mr-1 inline size-4 text-fg-muted" aria-hidden />{t("dg.gio", { chi: ten("chi", u.chi_gio) })}</p>
              <span className="text-xs text-fg-faint">{u.nhan}</span>
            </div>
            <p className="text-xs text-fg-faint" data-testid="khoang-gio">
              {u.khoang_gio_dong_ho ?? u.khoang_gio}
              {(() => {
                const ngay = u.ngay_duong ?? u.dau_vao?.birth_date;
                return ngay && ngayNhap && ngay !== ngayNhap
                  ? <span className="ml-1 text-fg-muted" data-testid="ngay-ung-vien">{t("dg.ngay", { ngay: ngayHien(ngay) })}</span> : null;
              })()}
            </p>
            {u.lech_gio_lich && (
              <p className="text-[11px] text-fg-faint" data-testid="khoang-gio-lich">
                {lechCau.nhan}: {u.khoang_gio} — {lechCau.cau}
              </p>
            )}
            {u.ghi_chu && <p className="text-[11px] text-fg-muted" data-testid="ghi-chu-ung-vien">{u.ghi_chu}</p>}
            <p className="text-sm text-fg-muted">
              {t("dg.menh_o")}<b className="text-fg">{ten("chi", u.cung_menh.chi)}</b>: {u.cung_menh.chinh_tinh.length ? u.cung_menh.chinh_tinh.map((x) => ten("sao", x)).join(", ") : t("ls.vo_chinh_dieu")}
              <br />{ten("cuc", u.cuc)}{t("dg.than_cu", { cung: ten("cung", u.than_cu) })}
            </p>
            {nhieu ? (
              <details className="text-sm"><summary className="cursor-pointer text-fg-muted hover:text-fg">{t("dg.cau_doi_chieu", { so: String(u.nam.reduce((s, n) => s + n.cau_hoi.length, 0)) })}</summary><div className="mt-2">{cau}</div></details>
            ) : cau}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="text-xs text-fg-faint" aria-live="polite">{soDung > 0 ? <><Check className="mr-0.5 inline size-3.5 text-jade" aria-hidden />{t("dg.so_dung", { so: String(soDung) })}</> : t("dg.chua_tick")}</span>
              {(nhieu || !u.la_gio_nhap) && (
                <Button size="sm" variant="secondary" onClick={() => onDung(lechSoVoiNhap(d.ung_vien, i))}>
                  {t("dg.dung_gio")}
                </Button>
              )}
            </div>
            {(nhieu || !u.la_gio_nhap) && <p className="text-[11px] text-fg-faint">{t("dg.mo_ho_so", { gio: u.gio_dai_dien })}</p>}
          </li>
        );
      })}
    </ol>
  );
}
