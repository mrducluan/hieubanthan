"use client";
// TS-V3 — tổng hợp ba phái (Pitago · Chaldea · Qabalah). Engine tính số lặp lại giữa các phái và các tương tác liên phái
// (cộng hưởng / hai góc nhìn / bổ sung / nhịp thời gian) — /api/thanso/tong-hop; web chỉ hiển thị.
import { Card } from "@/components/ui/card";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { useEngineDoc } from "@/lib/dung-engine";
import type { HoSo } from "@/lib/hoso";
import type { QuyUocDD } from "@/lib/quy-uoc-dd";
import { cn } from "@/lib/utils";

interface SoNoiBat { goc: number; lan: number; phai: string[]; vi_tri: string[]; tu_khoa: string | null; mat_toi: string | null; phan_chung: string | null }
interface TuongTac { quan_he: string; ten_quan_he: string; nhom: string; ten_nhom: string;
  cac_so: { phai: string; ten: string; so: number; goc: number }[]; cach_doc: string; goi_y: string }
interface BaiTongHop {
  phai: "tong_hop"; so_noi_bat: SoNoiBat[]; tuong_tac: TuongTac[]; cach_doc: string; luu_y: string; nguon: string;
  ho_so: Record<string, Record<string, { so: number; goc: number }>>;
}

const MAU: Record<string, string> = {
  cong_huong: "border-jade/50 bg-jade/[0.06]", khac_nhip: "border-moon/40 bg-moon/[0.05]",
  bo_sung: "border-gold/50 bg-gold/[0.06]", nhip_thoi_gian: "border-gold/50 bg-gold/[0.08]",
};

export function TongHopDoc({ hoSo, quyUoc }: { hoSo: HoSo; quyUoc: QuyUocDD }) {
  const { kq, loi, thuLai } = useEngineDoc<BaiTongHop>("/api/thanso/tong-hop", hoSo, { quy_uoc_duong_doi: quyUoc });
  if (loi) return <BaoLoi loi={loi} thuLai={thuLai} />;
  if (!kq) return <KhungTai dong={3} />;
  return (
    <div className="space-y-10" data-testid="bai-tong-hop">
      <section aria-labelledby="th-noi-bat">
        <TieuDeMuc id="th-noi-bat" nho="Tổng hợp ba phái" lon="Điều nhiều cách tính cùng chỉ ra" mo_ta={kq.cach_doc} />
        {kq.so_noi_bat.length === 0 ? (
          <p className="text-sm text-fg-muted">Ba phái không trùng con số nào — mỗi phái là một góc nhìn riêng, đọc từng phái để đối chiếu.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {kq.so_noi_bat.slice(0, 4).map((s) => (
              <Card key={s.goc} data-testid={`noi-bat-${s.goc}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-xl">Số {s.goc}</h3>
                  <span className="text-xs text-gold">lặp {s.lan} lần · {s.phai.length} phái</span>
                </div>
                {s.tu_khoa && <p className="mt-1 text-sm">{s.tu_khoa}</p>}
                <ul className="mt-2 flex flex-wrap gap-1.5">{s.vi_tri.map((v) => <li key={v} className="rounded-full bg-gold/10 px-2 py-0.5 text-xs">{v}</li>)}</ul>
                {s.mat_toi && <p className="mt-2 text-sm text-cinnabar">Mặt tối: {s.mat_toi}</p>}
                {s.phan_chung && <p className="mt-1 text-sm text-fg-muted">Tự soi: {s.phan_chung}</p>}
              </Card>
            ))}
          </div>
        )}
      </section>
      <section aria-labelledby="th-tuong-tac">
        <TieuDeMuc id="th-tuong-tac" nho="Đồ thị liên phái" lon="Các phái gặp nhau và khác nhau ở đâu" />
        <div className="grid gap-3 md:grid-cols-2">
          {kq.tuong_tac.map((t) => (
            <article key={`${t.quan_he}-${t.nhom}`} data-testid={`tuong-tac-${t.nhom}`} className={cn("rounded-xl border p-4", MAU[t.quan_he])}>
              <p className="eyebrow">{t.ten_quan_he}</p>
              <h3 className="mt-1 text-lg">{t.ten_nhom}</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {t.cac_so.map((c) => <li key={c.ten} className="rounded-full bg-bg/60 px-2 py-0.5 text-xs">{c.ten} <b className="text-gold">{c.so}</b></li>)}
              </ul>
              <p className="mt-2 text-sm">{t.cach_doc}</p>
              <p className="mt-1 text-sm text-fg-muted">{t.goi_y}</p>
            </article>
          ))}
        </div>
      </section>
      <p className="text-xs text-fg-faint">{kq.luu_y} Nguồn: {kq.nguon}.</p>
    </div>
  );
}
