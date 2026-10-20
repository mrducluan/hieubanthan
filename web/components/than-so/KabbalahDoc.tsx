"use client";
// TS-V3 — bài đọc thần số Qabalah Hermetic. Engine tính mọi con số (/api/thanso/kabbalah); web chỉ hiển thị, giữ 3 lớp
// ĐÃ TÍNH / DIỄN GIẢI / TỰ SOI như các phái khác, kèm độ nhạy bảng chuyển chữ và đối chiếu Đường đời Pitago.
import { Card } from "@/components/ui/card";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhoiLop } from "@/components/than-so/LopNoiDung";
import { useEngineDoc } from "@/lib/dung-engine";
import type { HoSo } from "@/lib/hoso";
import type { QuyUocDD } from "@/lib/quy-uoc-dd";

interface Nghia { ten: string; nghia_chu?: string; nghia?: string; nhom?: string; tuong_ung?: string; con_duong?: string; cot?: string;
  xu_huong: string; mat_toi: string; cau_tu_soi: string }
interface SoKab { ma: string; ten: string; so: number; mo_ta: string; cach_tinh: string; nghia: Nghia | null; khac?: number[];
  pitago?: { ten: string; so: number; trung: boolean; so_sanh_duoc?: boolean } }
interface BaiKabbalah {
  phai: "kabbalah"; cac_so: SoKab[]; luu_y: string; nguon: string;
  gioi_thieu: { ten_phai: string; tom_tat: string; cach_doc: string; luu_y: string };
  bang_chuyen_chu: Record<string, string>;
}

function TheSo({ s }: { s: SoKab }) {
  const n = s.nghia;
  return (
    <Card className="space-y-4" data-testid={`kabbalah-${s.ma}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl">{s.ten}{n ? <span className="text-fg-muted"> · {n.ten}</span> : null}</h3>
          <p className="mt-1 text-xs text-fg-muted">{s.mo_ta}</p>
        </div>
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold/15 font-serif text-3xl text-gold" aria-label={`Số ${s.so}`}>{s.so}</span>
      </div>
      <KhoiLop loai="tinh">
        <p className="break-words font-mono text-xs leading-relaxed text-fg-muted">{s.cach_tinh}</p>
        {s.khac && s.khac.length > 0 && (
          <p className="mt-1 text-xs text-moon">Bảng chuyển chữ khác (O, S, T, C) có thể cho con đường {s.khac.join(", ")} — đọc thêm để đối chiếu.</p>
        )}
        {s.pitago && (
          <p className={s.pitago.trung || s.pitago.so_sanh_duoc === false ? "mt-1 text-xs text-fg-faint" : "mt-1 text-xs text-moon"}>
            Phái Pitago: {s.pitago.ten} {s.pitago.so} — {s.pitago.so_sanh_duoc === false
              ? "Malkuth (10) không có số 1–9 tương ứng nên không so" : s.pitago.trung ? "cùng gốc với Sephirah này" : "khác gốc với Sephirah này"}
          </p>
        )}
      </KhoiLop>
      {n && (
        <KhoiLop loai="giai">
          <p>
            <b>{n.ten}</b>
            {n.nghia_chu && <span className="text-xs text-fg-muted"> — {n.nghia_chu}</span>}
            {n.nghia && <span className="text-xs text-fg-muted"> — {n.nghia}</span>}
          </p>
          {(n.con_duong || n.cot) && (
            <p className="mt-1 text-xs text-fg-muted">{n.con_duong ? `Con đường nối ${n.con_duong}` : n.cot}{n.tuong_ung ? ` · ${n.tuong_ung}` : ""}</p>
          )}
          <p className="mt-2 text-sm">{n.xu_huong}</p>
          <p className="mt-2 text-sm text-cinnabar">Mặt tối: {n.mat_toi}</p>
        </KhoiLop>
      )}
      {n && <KhoiLop loai="soi"><p>{n.cau_tu_soi}</p></KhoiLop>}
    </Card>
  );
}

export function KabbalahDoc({ hoSo, quyUoc }: { hoSo: HoSo; quyUoc: QuyUocDD }) {
  const { kq, loi, thuLai } = useEngineDoc<BaiKabbalah>("/api/thanso/kabbalah", hoSo, { quy_uoc_duong_doi: quyUoc });
  if (loi) return <BaoLoi loi={loi} thuLai={thuLai} />;
  if (!kq) return <KhungTai dong={3} />;
  const gt = kq.gioi_thieu;
  return (
    <div className="space-y-10" data-testid="bai-kabbalah">
      <section aria-labelledby="kabbalah-so">
        <TieuDeMuc id="kabbalah-so" nho="Phái Qabalah" lon="Tên và ngày sinh trên Cây Sự sống" mo_ta={gt.cach_doc} />
        <div className="grid gap-4 md:grid-cols-3">{kq.cac_so.map((s) => <TheSo key={s.ma} s={s} />)}</div>
      </section>
      <section aria-labelledby="kabbalah-gioi-thieu" className="glass rounded-2xl p-5">
        <h2 id="kabbalah-gioi-thieu" className="text-lg">{gt.ten_phai} là gì?</h2>
        <p className="mt-2 text-sm text-fg-muted">{gt.tom_tat}</p>
        <p className="mt-2 text-sm text-moon">{gt.luu_y}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-sm">
            <caption className="mb-2 text-left text-xs text-fg-muted">Bảng chuyển chữ (dấu tiếng Việt bỏ, Đ tính như D; chữ ghép xét trước)</caption>
            <tbody>
              {Object.entries(kq.bang_chuyen_chu).map(([chu, heb]) => (
                <tr key={chu} className="border-t border-line/60"><th scope="row" className="w-12 py-1 text-left text-gold">{chu}</th><td className="py-1">{heb}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-xs text-fg-faint">{kq.luu_y} Nguồn: {kq.nguon}.</p>
    </div>
  );
}
