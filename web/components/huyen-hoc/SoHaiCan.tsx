"use client";
// UI-PT2 P5 — "So hai căn": hai căn đã lưu trên máy đặt cạnh nhau — mức từng chương (engine chấm), sơ đồ phòng, điều
// quan trọng nhất. KHÔNG điểm số, không "căn nào tốt hơn": người đi mua tự nhìn chỗ hợp, chỗ cần lưu ý của từng căn.
// Mỗi căn một lời gọi /api/phongthuy/luan-giai với đúng dữ liệu căn đó (hướng, năm xây, người cùng ở, bố cục đã khai).
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/input";
import { ChipMuc } from "@/components/luan-giai/BaoCaoDoiSong";
import type { Hop, Muc } from "@/components/luan-giai/kieu";
import { SoDoNha } from "@/components/huyen-hoc/SoDoNha";
import { chonCan, nhaGui, tenCan, TEN_LOAI_NHA, type CanDaLuu } from "@/lib/ho-so-nha";
import { useGocNhin } from "@/lib/goc-nhin-pt";
import { postJson } from "@/lib/goi-api";
import { ghi } from "@/lib/do-luong";
import type { MocNam } from "@/components/huyen-hoc/KhungPhai";

export type SinhSo = { birth_date: string; gender: "nam" | "nu"; moc_nam?: MocNam } | null;
interface ChuongNgan { ma: string; tieu_de: string; muc: Muc | null; nhan_muc: string | null; tom_tat?: string; tran_muc?: unknown;
  phong?: { ten: string; cung: string; muc: Muc; du_nien: string | null }[] }
interface BaoCaoNgan { cot_loi: Hop[]; chuong: ChuongNgan[]; da_tinh: { huong_nha: string | null; veto_da_xac_nhan?: { tieu_de: string }[] } }

function CotCan({ c, i, sinh, gocNhin }: { c: CanDaLuu; i: number; sinh: SinhSo; gocNhin: string }) {
  const [bc, setBc] = useState<BaoCaoNgan | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const khoa = JSON.stringify({ n: nhaGui(c), sinh, gocNhin });
  useEffect(() => {
    let huy = false;
    const { n, sinh: s, gocNhin: g } = JSON.parse(khoa) as { n: ReturnType<typeof nhaGui>; sinh: SinhSo; gocNhin: string };
    postJson<BaoCaoNgan>("/api/phongthuy/luan-giai", { ...(s ? { sinh: s } : {}), ...n, goc_nhin: g })
      .then((r) => { if (!huy) setBc(r); })
      .catch((e) => { if (!huy) setLoi(e instanceof Error ? e.message : "Chưa đọc được căn này."); });
    return () => { huy = true; };
  }, [khoa]);
  const tp = bc?.chuong.find((x) => x.ma === "tung_phong");
  return (
    <div className="min-w-0 rounded-xl border border-line/70 bg-bg/40 p-3" data-testid={`so-can-${i}`}>
      <p className="font-semibold text-fg">{tenCan(c, i)}</p>
      <p className="text-xs text-fg-muted">
        {c.loai_nha ? TEN_LOAI_NHA[c.loai_nha] : "Nhà"}{bc?.da_tinh.huong_nha ? ` · hướng ${bc.da_tinh.huong_nha}` : c.huong_do != null ? ` · ${c.huong_do}°` : ""}
        {c.nam_xay ? ` · năm ${c.nam_xay}` : ""}{c.thanh_vien.length ? ` · ${c.thanh_vien.length} người cùng ở` : ""}
      </p>
      {loi && <p role="alert" className="mt-2 text-sm text-cinnabar">{loi}</p>}
      {!bc && !loi && <p className="mt-2 text-sm text-fg-faint">Đang đọc…</p>}
      {bc && (
        <>
          <ul className="mt-2 space-y-1 text-sm" data-testid="so-can-chuong">
            {bc.chuong.filter((x) => x.muc).map((x) => (
              <li key={x.ma} className="flex items-center justify-between gap-2"><span className="text-fg-muted">{x.tieu_de}</span><ChipMuc muc={x.muc!} nhan={x.nhan_muc ?? undefined} /></li>
            ))}
          </ul>
          {(bc.da_tinh.veto_da_xac_nhan?.length ?? 0) > 0 && (
            <p className="mt-1.5 text-xs text-moon">Xử lý trước: {bc.da_tinh.veto_da_xac_nhan!.map((v) => v.tieu_de.toLowerCase()).join(", ")}</p>
          )}
          {tp?.phong && tp.phong.length > 0 && (
            <SoDoNha className="mt-2 max-w-[14rem]" chuThich={false} huongNha={bc.da_tinh.huong_nha} phong={tp.phong.map((p) => ({ cung: p.cung, ten: p.ten, muc: p.muc }))} />
          )}
          {bc.cot_loi[0] && <p className="mt-2 text-xs text-fg-muted"><b className="text-fg">Điều quan trọng nhất:</b> {bc.cot_loi[0].tieu_de}</p>}
        </>
      )}
    </div>
  );
}

export function SoHaiCan({ ds, sinh }: { ds: CanDaLuu[]; sinh: SinhSo }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const gocNhin = useGocNhin();
  useEffect(() => { ghi("chart_interacted", { mo_dun: "phongthuy", kind: "so_hai_can", so_can: ds.length }); }, [ds.length]);
  const ca = ds[Math.min(a, ds.length - 1)]!, cb = ds[Math.min(b, ds.length - 1)]!;
  return (
    <section aria-labelledby="so-hai-can-td" className="mt-3 rounded-2xl border border-gold/30 bg-gold/[0.04] p-3 sm:p-4" data-testid="so-hai-can">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="so-hai-can-td" className="font-serif text-lg">So hai căn</h3>
        {ds.length > 2 && (
          <div className="flex items-center gap-1.5 text-xs">
            <Select value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="Căn bên trái" className="h-8 text-xs">{ds.map((c, i) => <option key={c.id} value={i}>{tenCan(c, i)}</option>)}</Select>
            <span className="text-fg-faint">và</span>
            <Select value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="Căn bên phải" className="h-8 text-xs">{ds.map((c, i) => <option key={c.id} value={i}>{tenCan(c, i)}</option>)}</Select>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-fg-muted">Mỗi căn đọc theo đúng dữ liệu của căn đó{sinh ? " với năm sinh của bạn" : " (chưa có năm sinh → theo trạch)"}. Không chấm điểm — bạn tự so chỗ hợp, chỗ cần lưu ý và việc phải làm của từng căn.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <CotCan key={ca.id} c={ca} i={ds.indexOf(ca)} sinh={sinh} gocNhin={gocNhin} />
        {cb.id !== ca.id ? <CotCan key={cb.id} c={cb} i={ds.indexOf(cb)} sinh={sinh} gocNhin={gocNhin} /> : <p className="text-sm text-fg-faint">Chọn hai căn khác nhau.</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {[ca, cb].filter((c, i, arr) => arr.indexOf(c) === i).map((c) => (
          <button key={c.id} type="button" onClick={() => { chonCan(c.id); ghi("chart_interacted", { mo_dun: "phongthuy", kind: "chon_can_chinh" }); }}
            className="rounded-full border border-line px-3 py-1 text-fg-muted hover:text-fg">Xem kỹ {tenCan(c, ds.indexOf(c))} →</button>
        ))}
      </div>
    </section>
  );
}
