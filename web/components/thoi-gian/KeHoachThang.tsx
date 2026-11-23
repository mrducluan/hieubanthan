"use client";
// KH-1 — "Việc bạn định làm: tháng nào hợp" (đầu trang /thoi-gian-toi). Người dùng chọn một việc → engine trả 12 tháng tới,
// mỗi tháng đếm các cách xem (thần số, con giáp, sách lịch; Tử vi + Bát tự khi đủ giờ sinh) + ngày nên đặt việc chính.
// Web chỉ hiện; không điểm số; màu không đỏ. Máy nhớ MÃ việc đã chọn (localStorage) để lần sau mở lại đúng việc — không gửi đi.
import { useEffect, useRef, useState } from "react";
import { CalendarCheck2, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { CHIP_KE_HOACH, MA_KE_HOACH, type KetQuaKeHoach, type MaKeHoach, type ThangKeHoach } from "@/lib/ke-hoach";

const KHOA = "hbt.ke_hoach.v1";
const MUC: Record<ThangKeHoach["nhip"], string | undefined> = { thuan: "thuan", duoc: "thuan", binh: undefined, can_nhac: "can_chu_dong", cham: "can_chu_dong" };

function ngayHien(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const thu = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][new Date(y!, m! - 1, d!).getDay()];
  return `${thu} ${d}/${m}`;
}

export function KeHoachThang({ ten, than }: { ten: string; /** ngày sinh (+ giới tính, lá số) — đúng thân gọi Thời gian tới */ than: Record<string, unknown> }) {
  const [ma, setMa] = useState<MaKeHoach | null>(null);
  const [kq, setKq] = useState<KetQuaKeHoach | null>(null);
  const [chon, setChon] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const luot = useRef(0);
  const khoaThan = JSON.stringify(than);

  const tai = async (m: MaKeHoach, bam: boolean) => {
    const so = ++luot.current;
    setMa(m); setDang(true); setLoi(null);
    try { localStorage.setItem(KHOA, m); } catch { /* chế độ riêng tư */ }
    try {
      const { nam: _bo, ...goc } = than;
      const d = await postJson<KetQuaKeHoach>("/api/thoi-gian-toi/ke-hoach", { ke_hoach: m, ...goc });
      if (so !== luot.current) return;
      setKq(d);
      setChon(d.tot_nhat[0]?.thang ?? d.thang[0]?.thang ?? null);
      if (bam) ghi("chart_interacted", { mo_dun: "thoi_gian", kind: "ke_hoach_chon", ke_hoach: m, co_thang_hop: d.thang.some((x) => x.nhip === "thuan") });
    } catch (e) {
      if (so === luot.current) setLoi(e instanceof Error && e.message ? e.message : "Chưa xem được, thử lại sau ít phút.");
    } finally { if (so === luot.current) setDang(false); }
  };

  // Lần sau quay lại: mở đúng việc đã chọn lần trước (chỉ mã, trên máy). Đổi hồ sơ / năm → tải lại.
  useEffect(() => {
    let cu: string | null = null;
    try { cu = localStorage.getItem(KHOA); } catch { /* bỏ qua */ }
    const m = (ma ?? cu) as MaKeHoach | null;
    if (m && (MA_KE_HOACH as readonly string[]).includes(m)) void tai(m, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ theo hồ sơ gửi đi
  }, [khoaThan]);

  const th = kq?.thang.find((x) => x.thang === chon) ?? null;
  return (
    <section className="glass space-y-4 rounded-2xl border border-gold/40 p-5 sm:p-6" data-testid="ke-hoach-thang" aria-labelledby="kh-tieu-de">
      <div>
        <p className="eyebrow flex items-center gap-1.5"><CalendarCheck2 className="size-4 text-gold" aria-hidden />Miễn phí · 12 tháng tới</p>
        <h2 id="kh-tieu-de" className="mt-1 text-xl sm:text-2xl">{ten ? `${ten}, bạn định làm gì trong 12 tháng tới?` : "Bạn định làm gì trong 12 tháng tới?"}</h2>
        <p className="mt-1 text-sm text-fg-muted">Chọn một việc — xem tháng nào hợp nhất, tháng nào nên lùi, và ngày nên đặt việc chính.</p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Việc bạn định làm">
        {MA_KE_HOACH.map((m) => (
          <button key={m} type="button" aria-pressed={ma === m} onClick={() => void tai(m, true)} data-testid={`kh-chip-${m}`}
            className={cn("min-h-10 rounded-full border px-3.5 text-sm transition-colors",
              ma === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:border-gold/50 hover:text-fg")}>
            {CHIP_KE_HOACH[m]}
          </button>
        ))}
      </div>

      {dang && !kq && <p className="text-sm text-fg-muted" aria-live="polite">Đang xem 12 tháng tới…</p>}
      {loi && <p role="alert" className="text-sm text-moon">{loi}</p>}

      {kq && (
        <div className={cn("space-y-4", dang && "opacity-60")} aria-busy={dang} data-testid="kh-ket-qua">
          <p className="font-serif text-lg leading-snug" data-testid="kh-tra-loi">{kq.tra_loi}</p>

          {/* Dải 12 tháng — bấm để xem vì sao. Màu: lục = thuận, hổ phách = nên chậm, không đỏ. */}
          <div className="-mx-1 overflow-x-auto pb-1">
            <ol className="flex min-w-max gap-1.5 px-1" aria-label="12 tháng tới">
              {kq.thang.map((x) => {
                const tot = kq.tot_nhat.some((t) => t.thang === x.thang);
                return (
                  <li key={x.thang}>
                    <button type="button" onClick={() => { setChon(x.thang); ghi("chart_interacted", { mo_dun: "thoi_gian", kind: "ke_hoach_thang", nhip: x.nhip }); }}
                      aria-pressed={chon === x.thang} data-testid="kh-thang" data-nhip={x.nhip}
                      className={cn("flex w-[4.6rem] flex-col items-center gap-1 rounded-xl border px-1.5 py-2 text-xs transition-colors",
                        chon === x.thang ? "border-gold bg-gold/10" : "border-line/70 hover:border-gold/50")}>
                      <span className="font-medium text-fg">{x.thang}</span>
                      <span data-muc={MUC[x.nhip]} className={cn("chip-muc rounded-full px-1.5 py-0.5 text-[10px] leading-tight", x.nhip === "duoc" && "opacity-75")}>{x.nhan_nhip}</span>
                      {tot && <Sparkles className="size-3 text-gold" aria-label="tháng hợp nhất" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {th && (
            <div className="rounded-xl border border-line/70 p-4 text-sm" data-testid="kh-chi-tiet">
              <p className="font-medium text-fg">Tháng {th.thang}: <span className="text-gold">{th.nhan_nhip}</span>
                <span className="font-normal text-fg-muted"> · tháng cá nhân {th.so} ({th.nhan_so.toLowerCase()})</span></p>
              {th.dau.length > 0 && <p className="mt-2 text-fg-muted"><span className="text-jade">Thuận:</span> {th.dau.join("; ")}.</p>}
              {th.cham.length > 0 && <p className="mt-1 text-fg-muted"><span className="text-moon">Nên để ý:</span> {th.cham.join("; ")}.</p>}
              {!th.dau.length && !th.cham.length && <p className="mt-2 text-fg-muted">Không cách xem nào lệch hẳn — tháng đều nhịp.</p>}
              {th.ngay.length > 0
                ? <p className="mt-2"><span className="text-fg-muted">Ngày sách lịch ghi hợp việc này ({th.so_ngay} ngày, không xung tuổi bạn):</span>{" "}
                  {th.ngay.map((n, i) => <span key={n.ngay}>{i > 0 && " · "}<b className="font-medium text-fg">{ngayHien(n.ngay)}</b> <span className="text-fg-faint">(âm {n.am})</span></span>)}</p>
                : <p className="mt-2 text-fg-muted">Sách lịch không có ngày hợp việc này trong tháng.</p>}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-fg">Nên làm trước</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-fg-muted">{kq.viec_lam.map((v) => <li key={v}>{v}</li>)}</ul>
            </div>
            {kq.nam_luu_y.length > 0 && (
              <div data-testid="kh-nam">
                <p className="text-sm font-medium text-fg">Tập quán theo năm</p>
                <ul className="mt-1 space-y-1 text-sm text-fg-muted">{kq.nam_luu_y.map((v) => <li key={v}>{v}</li>)}</ul>
                {kq.tap_quan && <p className="mt-1 text-xs text-fg-faint">{kq.tap_quan}</p>}
              </div>
            )}
          </div>

          {kq.thieu_loi && <p className="text-xs text-fg-faint" data-testid="kh-thieu">{kq.thieu_loi}</p>}
          <details className="group text-xs text-fg-faint">
            <summary className="flex cursor-pointer list-none items-center gap-1 hover:text-fg-muted">Vì sao nói vậy <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden /></summary>
            <p className="mt-1">{kq.cach_xep}</p>
          </details>
          <p className="text-xs text-fg-faint">{[kq.ranh_gioi, kq.ket].filter(Boolean).join(" ")}</p>
          <a href="#bai-doc-thoi-gian" className="inline-block text-sm text-gold underline underline-offset-4" data-testid="kh-xuong-bai"
            onClick={() => ghi("chart_interacted", { mo_dun: "thoi_gian", kind: "ke_hoach_xuong_bai" })}>
            Đọc từng tháng kỹ hơn (công việc, tiền bạc, tình cảm) ở bài bên dưới ↓
          </a>
        </div>
      )}
    </section>
  );
}
