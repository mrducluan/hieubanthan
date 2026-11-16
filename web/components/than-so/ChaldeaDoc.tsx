"use client";
// TS-PHAI — bài đọc thần số phái Chaldea (Cheiro). Engine tính mọi con số (/api/thanso/chaldea); web chỉ hiển thị,
// giữ 3 lớp ĐÃ TÍNH / DIỄN GIẢI / TỰ SOI như phái Pitago, kèm đối chiếu số Pitago để người dùng thấy hai phái khác nhau.
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhoiLop } from "@/components/than-so/LopNoiDung";
import { hoTenList, type HoSo } from "@/lib/hoso";
import { useQuyUocDD } from "@/lib/quy-uoc-dd";
import { maNgonNguTrang } from "@/lib/ngon-ngu";
import { fetchNN, useChuThanSo } from "./chu-than-so";

interface NghiaGoc { ten: string; hanh_tinh: string; xu_huong: string; mat_toi: string; goi_y: string; cau_tu_soi: string }
interface NghiaKep { bieu_tuong: string; xu_huong: string; mat_toi: string; cau_tu_soi: string }
interface SoChaldea {
  ma: string; ten: string; mo_ta: string; tong: number; kep: number | null; goc: number; cach_tinh: string;
  ten_goi?: string; nghia_goc: NghiaGoc | null; nghia_kep: NghiaKep | null;
  pitago?: { ten: string; so: number; khac: boolean };
}
// TS-NOIDAU: cùng số 13/14/16/19 — Pitago đọc là nợ nghiệp, Chaldea đọc là số kép; engine nối hai cách đọc (KB).
interface GiaoDiem {
  ma: string; ten: string; pitago_no_nghiep: number | null; chaldea_kep: number | null; cung_so: boolean;
  pitago: string | null; chaldea: string | null; cach_dung: string | null; tu_soi: string | null;
}
export interface BaiChaldea {
  phai: "chaldea"; ten_chinh: string; ngay_sinh: string; so_khac_pitago: number; luu_y: string; nguon: string; trang_thai: string;
  gioi_thieu: { ten_phai: string; tom_tat: string; khac_pitago: string[]; cach_doc: string; bang_chu: Record<string, string> };
  cac_so: SoChaldea[];
  giao_diem?: GiaoDiem[];
}

const boNho = new Map<string, BaiChaldea>();

function useChaldea(h: HoSo) {
  const qu = useQuyUocDD();   // TS-V3: đối chiếu Đường đời Pitago theo cách cộng đã chọn
  const { c } = useChuThanSo();
  const khoa = JSON.stringify([hoTenList(h), h.ngay, h.thang, h.nam, qu, maNgonNguTrang()]);
  const [kq, setKq] = useState<BaiChaldea | null>(boNho.get(khoa) ?? null);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);
  useEffect(() => {
    const coSan = boNho.get(khoa);
    if (coSan) { setKq(coSan); return; }
    let huy = false;
    setKq(null); setLoi(null);
    fetchNN("/api/thanso/chaldea", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ho_ten: hoTenList(h), ngay: h.ngay, thang: h.thang, nam: h.nam, quy_uoc_duong_doi: qu }),
    }).then(async (r) => {
      const d = (await r.json()) as BaiChaldea & { error?: string };
      if (!r.ok) throw new Error(d.error ?? c("ch.loi"));
      return d;
    }).then((d) => { boNho.set(khoa, d); if (!huy) setKq(d); })
      .catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : c("ch.loi")); });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khoa đại diện đủ cho h
  }, [khoa, lan]);
  return { kq, loi, thuLai: () => setLan((n) => n + 1) };
}

function TheSo({ s }: { s: SoChaldea }) {
  const { c } = useChuThanSo();
  return (
    <Card className="space-y-4" data-testid={`chaldea-${s.ma}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl">{s.ten}{s.ten_goi ? <span className="text-fg-muted"> · “{s.ten_goi}”</span> : null}</h3>
          <p className="mt-1 text-xs text-fg-muted">{s.mo_ta}</p>
        </div>
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold/15 font-serif text-3xl text-gold" aria-label={c("ch.so_goc", { so: String(s.goc) })}>{s.goc}</span>
      </div>
      <KhoiLop loai="tinh">
        <p className="break-words font-mono text-xs leading-relaxed text-fg-muted">{s.cach_tinh}</p>
        {s.kep !== null && <p className="mt-1 text-sm">{c("ch.so_kep")} <b className="text-gold">{s.kep}</b>{s.nghia_kep ? ` — ${s.nghia_kep.bieu_tuong}` : ""}</p>}
        {s.pitago && (
          <p className={s.pitago.khac ? "mt-1 text-xs text-moon" : "mt-1 text-xs text-fg-faint"}>
            {c("ch.pitago", { ten: s.pitago.ten, so: String(s.pitago.so) })}{s.pitago.khac ? c("ch.khac") : c("ch.trung")}
          </p>
        )}
      </KhoiLop>
      {(s.nghia_goc || s.nghia_kep) && (
        <KhoiLop loai="giai">
          {s.nghia_goc && <p><b>{s.nghia_goc.ten}</b> <span className="text-xs text-fg-muted">({s.nghia_goc.hanh_tinh})</span> — {s.nghia_goc.xu_huong}</p>}
          {s.nghia_kep && <p className="mt-2 text-sm text-fg-muted">{c("ch.sac_thai", { so: String(s.kep), chu: s.nghia_kep.xu_huong })}</p>}
          {s.nghia_goc && <p className="mt-2 text-sm text-cinnabar">{c("ch.mat_toi", { chu: s.nghia_goc.mat_toi })}</p>}
          {s.nghia_goc && <p className="mt-1 text-sm text-jade">{c("ch.thu", { chu: s.nghia_goc.goi_y })}</p>}
        </KhoiLop>
      )}
      {s.nghia_goc && (
        <KhoiLop loai="soi">
          <p>{s.nghia_goc.cau_tu_soi}</p>
          {s.nghia_kep && <p className="mt-1 text-sm text-fg-muted">{s.nghia_kep.cau_tu_soi}</p>}
        </KhoiLop>
      )}
    </Card>
  );
}

export function ChaldeaDoc({ hoSo }: { hoSo: HoSo }) {
  const { kq, loi, thuLai } = useChaldea(hoSo);
  const { c } = useChuThanSo();
  if (loi) return <BaoLoi loi={loi} thuLai={thuLai} />;
  if (!kq) return <KhungTai dong={4} nhan={c("tai")} />;
  const gt = kq.gioi_thieu;
  return (
    <div className="space-y-10" data-testid="bai-chaldea">
      <section aria-labelledby="chaldea-so">
        <TieuDeMuc id="chaldea-so" nho={c("ch.nho")} lon={c("ch.lon")} mo_ta={gt.cach_doc} />
        {kq.so_khac_pitago > 0 && (
          <p className="mb-4 text-sm text-moon" data-testid="chaldea-so-khac">
            {c("ch.so_khac", { so: String(kq.so_khac_pitago) })}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {kq.cac_so.map((s) => <TheSo key={s.ma} s={s} />)}
        </div>
      </section>

      {kq.giao_diem && kq.giao_diem.length > 0 && (
        <section aria-labelledby="giao-diem" data-testid="giao-diem">
          <TieuDeMuc id="giao-diem" nho={c("ch.giao_nho")} lon={c("ch.giao_lon")} mo_ta={c("ch.giao_mo_ta")} />
          <div className="grid gap-3 md:grid-cols-2">
            {kq.giao_diem.map((g) => (
              <article key={g.ma} className="rounded-xl border border-line/70 bg-bg/40 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg">{g.ten}</h3>
                  <span className="shrink-0 text-xs text-gold">
                    {g.pitago_no_nghiep ? c("ch.no_nghiep", { so: String(g.pitago_no_nghiep) }) : c("ch.khong_no")} · {g.chaldea_kep ? c("ch.kep", { so: String(g.chaldea_kep) }) : c("ch.kep_khac")}
                  </span>
                </div>
                {g.pitago && <p className="mt-2 text-sm">{g.pitago}</p>}
                {g.chaldea && <p className="mt-1 text-sm">{g.chaldea}</p>}
                {g.cach_dung && <p className="mt-2 text-sm text-jade">{g.cach_dung}</p>}
                {g.tu_soi && <p className="mt-2 text-sm text-fg-muted">{c("ch.tu_soi", { chu: g.tu_soi })}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="chaldea-gioi-thieu" className="glass rounded-2xl p-5">
        <h2 id="chaldea-gioi-thieu" className="text-lg">{c("ch.khac_the_nao")}</h2>
        <p className="mt-2 text-sm text-fg-muted">{gt.tom_tat}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{gt.khac_pitago.map((x) => <li key={x}>{x}</li>)}</ul>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-sm">
            <caption className="mb-2 text-left text-xs text-fg-muted">{c("ch.bang_chu")}</caption>
            <tbody>
              {Object.entries(gt.bang_chu).map(([so, chu]) => (
                <tr key={so} className="border-t border-line/60"><th scope="row" className="w-10 py-1 text-left text-gold">{so}</th><td className="py-1 tracking-widest">{chu}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-xs text-fg-faint">{c("ch.nguon", { luu_y: kq.luu_y, nguon: kq.nguon })}</p>
    </div>
  );
}
