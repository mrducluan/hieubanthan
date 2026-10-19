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

const LY_DO: Record<string, string> = {
  gan_ranh_gio: "Giờ bạn nhập nằm sát ranh giới giữa hai canh giờ — lệch vài phút là sang lá số khác.",
  ang_chung: "Bạn ghi giờ sinh là áng chừng.",
  khong_biet: "Bạn chưa biết giờ sinh — lá số đang tạm an theo giờ Ngọ (12:00). Dưới đây là đủ 12 canh giờ để đối chiếu.",
};

const namNay = () => Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));

export function DinhGioSinh({ laSo, hoSo, khongBietGio }: { laSo: ChartInputVao; hoSo: HoSo | null; khongBietGio: boolean }) {
  const [namChon, setNamChon] = useState<number[] | null>(null);   // null = để engine chọn 3 năm âm gần nhất
  const body = { la_so: laSo, ...(namChon ? { nam_doi_chieu: namChon } : {}), ...(khongBietGio ? { tat_ca_gio: true } : {}) };
  const { data: d, loi, thuLai } = usePost<DinhGioOutputT>("/api/tuvi/dinh-gio", body);
  const [moHoSo, setMoHoSo] = useState(false);

  return (
    <div className="space-y-4" data-testid="dinh-gio-noi-dung">
      {loi && <BaoLoi loi={loi} thuLai={thuLai} />}
      {!d && !loi && <KhungTai dong={3} />}
      {d && (
        <>
          {d.ly_do.length > 0 ? (
            <ul className="space-y-1 text-sm text-fg-muted">{d.ly_do.map((l) => <li key={l}>· {LY_DO[l] ?? l}</li>)}</ul>
          ) : (
            <p className="text-sm text-fg-muted">Giờ bạn nhập không sát ranh canh giờ. Khối này vẫn mở để bạn đối chiếu nếu chưa thật chắc.</p>
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
        <SheetContent title="Sửa giờ sinh trong hồ sơ" description="Bạn tự chọn giờ và mức chắc chắn — hệ thống không tự đổi hồ sơ của bạn.">
          <NhapHoSo macDinh={hoSo} can="day_du" nutGui="Lưu và an lại lá số" onXong={() => setMoHoSo(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Người dùng tự chọn ≤ 3 năm họ nhớ rõ (có biến cố, chuyển việc, chuyển nhà…). Không lưu. */
function ChonNam({ macDinh, onDoi }: { macDinh: number[]; onDoi: (ds: number[] | null) => void }) {
  const [sua, setSua] = useState(false);
  const [o, setO] = useState<string[]>(() => [0, 1, 2].map((k) => (macDinh[k] ? String(macDinh[k]) : "")));
  const [loi, setLoi] = useState<string | null>(null);
  if (!sua) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
        Năm đối chiếu: {macDinh.map((n) => <b key={n} className="rounded-full border border-line px-2.5 py-0.5 text-fg">{n}</b>)}
        <Button size="sm" variant="ghost" onClick={() => setSua(true)}><PencilLine aria-hidden /> Chọn năm bạn nhớ rõ</Button>
      </p>
    );
  }
  const max = namNay();
  return (
    <form className="space-y-2 rounded-xl border border-line/70 p-3" data-testid="chon-nam-doi-chieu" onSubmit={(e) => {
      e.preventDefault();
      const ds = [...new Set(o.filter((x) => x.length === 4).map(Number))];
      if (ds.length === 0) return setLoi("Nhập ít nhất một năm (4 chữ số).");
      if (ds.some((n) => n < 1900 || n > max)) return setLoi(`Chọn năm đã qua, từ 1900 đến ${max}.`);
      setLoi(null); setSua(false); onDoi(ds.slice(0, 3));
    }}>
      <p className="text-sm text-fg-muted">Tối đa 3 năm bạn nhớ rõ chuyện gì đã xảy ra — đổi việc, chuyển nhà, học hành, gia đình… (năm tính theo âm lịch, từ Tết đến Tết; chuyện xảy ra trước Tết thì chọn năm trước).</p>
      <div className="flex flex-wrap items-center gap-2">
        {o.map((v, k) => (
          <Input key={k} aria-label={`Năm đối chiếu ${k + 1}`} inputMode="numeric" placeholder="Năm" value={v} className="w-24 text-center"
            onChange={(e) => setO((cu) => cu.map((x, j) => (j === k ? e.target.value.replace(/\D/g, "").slice(0, 4) : x)))} />
        ))}
        <Button size="sm" type="submit">Đối chiếu</Button>
        <Button size="sm" type="button" variant="ghost" onClick={() => { setSua(false); setLoi(null); }}><X aria-hidden /> Thôi</Button>
      </div>
      {loi && <p role="alert" className="text-xs text-cinnabar">{loi}</p>}
    </form>
  );
}

function DanhSachUngVien({ d, onDung }: { d: DinhGioOutputT; onDung: (lech: -1 | 0 | 1) => void }) {
  // Tick "đúng với mình" chỉ nằm trong bộ nhớ trang — không gửi, không lưu.
  const [tick, setTick] = useState<Record<string, boolean>>({});
  const iNhap = d.ung_vien.findIndex((u) => u.la_gio_nhap);
  const nhieu = d.ung_vien.length > 3;
  return (
    <ol className={cn("grid gap-3", nhieu ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-3")} aria-label="Các canh giờ ứng viên">
      {d.ung_vien.map((u, i) => {
        const soDung = u.nam.reduce((s, n) => s + n.cau_hoi.filter((_, k) => tick[`${i}-${n.nam}-${k}`]).length, 0);
        const cau = (
          <div className="space-y-3">
            {u.nam.map((n) => (
              <div key={n.nam}>
                <p className="text-xs font-medium text-fg">Năm {n.nam} · {n.can_chi}</p>
                <ul className="mt-1 space-y-1.5">
                  {n.cau_hoi.map((c, k) => {
                    const khoa = `${i}-${n.nam}-${k}`;
                    return (
                      <li key={khoa}>
                        <label className="flex cursor-pointer items-start gap-2 text-sm text-fg-muted">
                          <input type="checkbox" checked={Boolean(tick[khoa])} onChange={(e) => setTick((t) => ({ ...t, [khoa]: e.target.checked }))}
                            className="mt-1 size-4 shrink-0 accent-[rgb(var(--gold))]" aria-label={`Đúng với mình: ${c.noi_dung}`} />
                          <span>
                            <span className={cn("mr-1 rounded px-1.5 py-0.5 text-[10px]", MAU_HOA_DIU[c.hoa] ?? "bg-surface-2")}>{c.hoa} · {c.cung}</span>
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
          <li key={u.chi_gio} data-testid="ung-vien-gio"
            className={cn("flex flex-col gap-2 rounded-2xl border p-4", u.la_gio_nhap ? "border-gold/50 bg-gold/5" : "border-line/70")}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-serif text-lg text-fg"><Clock3 className="mr-1 inline size-4 text-fg-muted" aria-hidden />Giờ {u.chi_gio}</p>
              <span className="text-xs text-fg-faint">{u.nhan}</span>
            </div>
            <p className="text-xs text-fg-faint">{u.khoang_gio}</p>
            <p className="text-sm text-fg-muted">
              Mệnh ở <b className="text-fg">{u.cung_menh.chi}</b>: {u.cung_menh.chinh_tinh.length ? u.cung_menh.chinh_tinh.join(", ") : "vô chính diệu"}
              <br />{u.cuc} · Thân cư {u.than_cu}
            </p>
            {nhieu ? (
              <details className="text-sm"><summary className="cursor-pointer text-fg-muted hover:text-fg">Câu đối chiếu ({u.nam.reduce((s, n) => s + n.cau_hoi.length, 0)})</summary><div className="mt-2">{cau}</div></details>
            ) : cau}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="text-xs text-fg-faint" aria-live="polite">{soDung > 0 ? <><Check className="mr-0.5 inline size-3.5 text-jade" aria-hidden />{soDung} câu bạn thấy đúng</> : "Chưa tick câu nào"}</span>
              {(nhieu || !u.la_gio_nhap) && (
                <Button size="sm" variant="secondary" onClick={() => onDung(iNhap < 0 ? 0 : (Math.sign(i - iNhap) as -1 | 0 | 1))}>
                  Dùng giờ này
                </Button>
              )}
            </div>
            {(nhieu || !u.la_gio_nhap) && <p className="text-[11px] text-fg-faint">Mở hồ sơ để bạn tự sửa giờ (vd {u.gio_dai_dien}) — hệ thống không tự đổi.</p>}
          </li>
        );
      })}
    </ol>
  );
}
