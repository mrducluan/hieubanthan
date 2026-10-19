"use client";
// TS-PHAI — bài đọc thần số phái Chaldea (Cheiro). Engine tính mọi con số (/api/thanso/chaldea); web chỉ hiển thị,
// giữ 3 lớp ĐÃ TÍNH / DIỄN GIẢI / TỰ SOI như phái Pitago, kèm đối chiếu số Pitago để người dùng thấy hai phái khác nhau.
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhoiLop } from "@/components/than-so/LopNoiDung";
import { hoTenList, type HoSo } from "@/lib/hoso";

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
  nghia: { pitago: string; chaldea: string; cach_dung: string; tu_soi: string } | null;
}
export interface BaiChaldea {
  phai: "chaldea"; ten_chinh: string; ngay_sinh: string; so_khac_pitago: number; luu_y: string; nguon: string; trang_thai: string;
  gioi_thieu: { ten_phai: string; tom_tat: string; khac_pitago: string[]; cach_doc: string; bang_chu: Record<string, string> };
  cac_so: SoChaldea[];
  giao_diem?: GiaoDiem[];
}

const boNho = new Map<string, BaiChaldea>();

function useChaldea(h: HoSo) {
  const khoa = JSON.stringify([hoTenList(h), h.ngay, h.thang, h.nam]);
  const [kq, setKq] = useState<BaiChaldea | null>(boNho.get(khoa) ?? null);
  const [loi, setLoi] = useState<string | null>(null);
  const [lan, setLan] = useState(0);
  useEffect(() => {
    const coSan = boNho.get(khoa);
    if (coSan) { setKq(coSan); return; }
    let huy = false;
    setKq(null); setLoi(null);
    fetch("/api/thanso/chaldea", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ho_ten: hoTenList(h), ngay: h.ngay, thang: h.thang, nam: h.nam }),
    }).then(async (r) => {
      const d = (await r.json()) as BaiChaldea & { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Chưa tính được lúc này.");
      return d;
    }).then((d) => { boNho.set(khoa, d); if (!huy) setKq(d); })
      .catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : "Chưa tính được lúc này."); });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khoa đại diện đủ cho h
  }, [khoa, lan]);
  return { kq, loi, thuLai: () => setLan((n) => n + 1) };
}

function TheSo({ s }: { s: SoChaldea }) {
  return (
    <Card className="space-y-4" data-testid={`chaldea-${s.ma}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl">{s.ten}{s.ten_goi ? <span className="text-fg-muted"> · “{s.ten_goi}”</span> : null}</h3>
          <p className="mt-1 text-xs text-fg-muted">{s.mo_ta}</p>
        </div>
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold/15 font-serif text-3xl text-gold" aria-label={`Số gốc ${s.goc}`}>{s.goc}</span>
      </div>
      <KhoiLop loai="tinh">
        <p className="break-words font-mono text-xs leading-relaxed text-fg-muted">{s.cach_tinh}</p>
        {s.kep !== null && <p className="mt-1 text-sm">Số kép <b className="text-gold">{s.kep}</b>{s.nghia_kep ? ` — ${s.nghia_kep.bieu_tuong}` : ""}</p>}
        {s.pitago && (
          <p className={s.pitago.khac ? "mt-1 text-xs text-moon" : "mt-1 text-xs text-fg-faint"}>
            Phái Pitago: {s.pitago.ten} {s.pitago.so} — {s.pitago.khac ? "hai phái ra số khác nhau" : "trùng với Chaldea"}
          </p>
        )}
      </KhoiLop>
      {(s.nghia_goc || s.nghia_kep) && (
        <KhoiLop loai="giai">
          {s.nghia_goc && <p><b>{s.nghia_goc.ten}</b> <span className="text-xs text-fg-muted">({s.nghia_goc.hanh_tinh})</span> — {s.nghia_goc.xu_huong}</p>}
          {s.nghia_kep && <p className="mt-2 text-sm text-fg-muted">Sắc thái số kép {s.kep}: {s.nghia_kep.xu_huong}</p>}
          {s.nghia_goc && <p className="mt-2 text-sm text-cinnabar">Mặt tối: {s.nghia_goc.mat_toi}</p>}
          {s.nghia_goc && <p className="mt-1 text-sm text-jade">Thử trong tuần: {s.nghia_goc.goi_y}</p>}
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
  if (loi) return <BaoLoi loi={loi} thuLai={thuLai} />;
  if (!kq) return <KhungTai dong={4} />;
  const gt = kq.gioi_thieu;
  return (
    <div className="space-y-10" data-testid="bai-chaldea">
      <section aria-labelledby="chaldea-so">
        <TieuDeMuc id="chaldea-so" nho="Phái Chaldea" lon="Sáu con số theo Chaldea" mo_ta={gt.cach_doc} />
        {kq.so_khac_pitago > 0 && (
          <p className="mb-4 text-sm text-moon" data-testid="chaldea-so-khac">
            Có {kq.so_khac_pitago} con số khác với phái Pitago — vì hai phái gán giá trị chữ cái và rút gọn khác nhau, không phải vì một bên tính sai.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {kq.cac_so.map((s) => <TheSo key={s.ma} s={s} />)}
        </div>
      </section>

      {kq.giao_diem && kq.giao_diem.length > 0 && (
        <section aria-labelledby="giao-diem" data-testid="giao-diem">
          <TieuDeMuc id="giao-diem" nho="Giao điểm hai phái" lon="Cùng một con số, hai cách đọc"
            mo_ta="Số 13, 14, 16, 19: phái Pitago gọi là nợ nghiệp (bài học cần tập), phái Chaldea đọc là số kép mang biểu tượng riêng. Đọc cả hai để thấy chỗ chúng gặp nhau." />
          <div className="grid gap-3 md:grid-cols-2">
            {kq.giao_diem.map((g) => (
              <article key={g.ma} className="rounded-xl border border-line/70 bg-bg/40 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg">{g.ten}</h3>
                  <span className="shrink-0 text-xs text-gold">
                    {g.pitago_no_nghiep ? `Pitago: nợ nghiệp ${g.pitago_no_nghiep}` : "Pitago: không có nợ nghiệp"} · {g.chaldea_kep ? `Chaldea: kép ${g.chaldea_kep}` : "Chaldea: kép khác"}
                  </span>
                </div>
                {g.nghia && (<>
                  {g.pitago_no_nghiep && <p className="mt-2 text-sm">{g.nghia.pitago}</p>}
                  {g.chaldea_kep && <p className="mt-1 text-sm">{g.nghia.chaldea}</p>}
                  {g.cung_so && <p className="mt-2 text-sm text-jade">{g.nghia.cach_dung}</p>}
                  <p className="mt-2 text-sm text-fg-muted">Tự soi: {g.nghia.tu_soi}</p>
                </>)}
              </article>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="chaldea-gioi-thieu" className="glass rounded-2xl p-5">
        <h2 id="chaldea-gioi-thieu" className="text-lg">Phái Chaldea khác Pitago thế nào?</h2>
        <p className="mt-2 text-sm text-fg-muted">{gt.tom_tat}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{gt.khac_pitago.map((x) => <li key={x}>{x}</li>)}</ul>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-sm">
            <caption className="mb-2 text-left text-xs text-fg-muted">Bảng chữ Chaldea (dấu tiếng Việt bỏ, Đ tính như D)</caption>
            <tbody>
              {Object.entries(gt.bang_chu).map(([so, chu]) => (
                <tr key={so} className="border-t border-line/60"><th scope="row" className="w-10 py-1 text-left text-gold">{so}</th><td className="py-1 tracking-widest">{chu}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-xs text-fg-faint">{kq.luu_y} Nguồn: {kq.nguon}.</p>
    </div>
  );
}
