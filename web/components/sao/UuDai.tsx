"use client";
// UD-1 — các mảnh hiển thị đợt ưu đãi có hạn (docs/UU-DAI-CO-HAN.md). Chỉ VẼ dữ liệu máy chủ trả (lib/uu-dai.ts):
// giá gạch là giá thường thật, đồng hồ đếm tới hạn chót thật, số suất đếm từ sổ Sao. Hết giờ → tự ẩn và gọi `khiHet`
// để nơi dùng tải lại giá. Chuyển động tắt khi người dùng chọn giảm chuyển động.
import { useEffect, useState } from "react";
import { Flame, LockKeyhole, Sparkles, Timer } from "lucide-react";
import { conLai, loiHan, loiTietKiem, type UuDai } from "@/lib/uu-dai";

const hai = (n: number) => String(n).padStart(2, "0");

/** Đồng hồ đếm ngược tới hạn chót. Máy chủ + lần vẽ đầu ở trình duyệt hiện ngày hạn (không lệch hydrate), sau đó chạy từng giây. */
export function DemNguoc({ hetLuc, khiHet, className = "" }: { hetLuc: string; khiHet?: () => void; className?: string }) {
  const [c, setC] = useState<ReturnType<typeof conLai> | undefined>(undefined);
  useEffect(() => {
    let xong = false;
    const chay = () => {
      const moi = conLai(hetLuc);
      setC(moi);
      if (!moi && !xong) { xong = true; khiHet?.(); }
    };
    chay();
    const t = setInterval(chay, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khiHet không cần theo dõi
  }, [hetLuc]);
  if (c === null) return null;
  const o = (so: number, nhan: string) => (
    <span className="inline-flex min-w-9 flex-col items-center rounded-lg bg-bg/70 px-1.5 py-1 leading-none ring-1 ring-gold/30">
      <span className="font-mono text-base font-semibold tabular-nums text-gold">{hai(so)}</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-fg-faint">{nhan}</span>
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} data-testid="ud-dem-nguoc" role="timer" aria-label={`Ưu đãi ${loiHan(hetLuc)}`}>
      <Timer className="size-4 shrink-0 text-gold" aria-hidden />
      {c === undefined ? <span className="text-sm text-fg-muted">{loiHan(hetLuc)}</span> : (
        <span className="inline-flex items-center gap-1" aria-hidden>
          {c.ngay > 0 && o(c.ngay, "ngày")}{o(c.gio, "giờ")}{o(c.phut, "phút")}{o(c.giay, "giây")}
        </span>
      )}
    </span>
  );
}

/** Giá ưu đãi + giá thường gạch đi + dòng tiết kiệm. */
export function GiaUuDai({ u, lon = false }: { u: UuDai; lon?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2" data-testid="ud-gia">
      <span className={`font-serif text-gold ${lon ? "text-3xl" : "text-xl"}`}>{u.gia} Sao</span>
      <s className="text-sm text-fg-faint" aria-label={`Giá thường ${u.gia_goc} Sao`}>{u.gia_goc} Sao</s>
      <span className="ud-nhan rounded-full bg-cinnabar/15 px-2 py-0.5 text-xs font-semibold text-cinnabar">−{u.giam_pt}%</span>
    </span>
  );
}

/** Thanh suất còn lại (chỉ khi đợt có giới hạn suất và đếm được). */
export function ConSuat({ u, className = "" }: { u: UuDai; className?: string }) {
  if (u.con_suat === null || u.tong_suat === null) return null;
  const daDung = u.tong_suat - u.con_suat;
  return (
    <span className={`block ${className}`} data-testid="ud-con-suat">
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Flame className="size-3.5 shrink-0 text-cinnabar" aria-hidden />
        <span>Còn <b className="text-fg">{u.con_suat}</b>/{u.tong_suat} suất ưu đãi</span>
      </span>
      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
        <span className="ud-thanh block h-full rounded-full bg-gradient-to-r from-gold to-cinnabar" style={{ width: `${Math.max(4, (daDung / u.tong_suat) * 100)}%` }} />
      </span>
    </span>
  );
}

/** Dải ưu đãi đầy đủ (trang /goi-xem, khung mời đọc): tên đợt · giá · tiết kiệm · đồng hồ · suất. Hết giờ → ẩn. */
export function DaiUuDai({ u, className = "" }: { u: UuDai; className?: string }) {
  const [het, setHet] = useState(false);
  if (het) return null;
  return (
    <div className={`vien-chay ud-hien rounded-2xl p-[1.5px] ${className}`} data-testid="ud-dai">
      <div className="flex flex-col gap-3 rounded-[calc(1rem-1.5px)] bg-surface/95 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-cinnabar">{u.ten}</p>
          <p className="mt-1 text-fg">Mở trọn một Luận giải toàn bộ: <GiaUuDai u={u} lon /></p>
          <p className="mt-1 text-sm text-fg-muted">{loiTietKiem(u)} · {loiHan(u.het_luc)}, sau đó về {u.gia_goc} Sao.</p>
          <ConSuat u={u} className="mt-2 max-w-xs" />
        </div>
        <DemNguoc hetLuc={u.het_luc} khiHet={() => setHet(true)} />
      </div>
    </div>
  );
}

/** UD-2 — thẻ "mở khoá" có ưu đãi, đặt NGAY chỗ người đọc gặp chương khoá (cuối chương miễn phí, đầu khung "Cần lưu ý ở
 *  từng mảng"): tên đợt + đồng hồ + giá gạch + nút mở thẳng (cùng hàm "Mở toàn bộ" của báo cáo — không luồng thứ hai). */
export function UuDaiMoKhoa({ u, khoa, dang = false, moKhoa, nguon }: {
  u: UuDai; khoa: number; dang?: boolean; moKhoa: () => void; /** chỗ đặt — chỉ để đo */ nguon: string;
}) {
  const [het, setHet] = useState(false);
  if (het) return null;
  return (
    <div className="vien-chay ud-hien mt-5 rounded-2xl p-[1.5px] print:hidden" data-testid="ud-mo-khoa" data-nguon={nguon}>
      <div className="hop-sao rounded-[calc(1rem-1.5px)] bg-surface/95 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-cinnabar">{u.ten}</span>
          <DemNguoc hetLuc={u.het_luc} khiHet={() => setHet(true)} />
        </div>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-fg">
          <LockKeyhole className="size-4 shrink-0 self-center text-gold" aria-hidden />
          <span className="font-medium">{khoa > 0 ? `Mở ${khoa} chương còn lại` : "Mở toàn bộ báo cáo"}</span>
          <GiaUuDai u={u} />
        </p>
        <p className="mt-1 text-xs text-gold/90">{loiTietKiem(u)} · {loiHan(u.het_luc)}, sau đó về {u.gia_goc} Sao.</p>
        <ConSuat u={u} className="mt-2 max-w-xs" />
        <button type="button" onClick={moKhoa} disabled={dang} data-testid="ud-mo-khoa-nut"
          className="nut-sang mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:opacity-90 disabled:opacity-60 sm:w-auto">
          <Sparkles className="size-4" aria-hidden /> {dang ? "Đang mở…" : `Mở toàn bộ · ${u.gia} Sao`}
        </button>
      </div>
    </div>
  );
}

/** Dải ưu đãi gọn trong hộp đăng nhập / nạp Sao: người đọc thấy ngay giá đang giảm khi quyết định nạp. */
export function DaiUuDaiHop({ u }: { u: UuDai }) {
  const [het, setHet] = useState(false);
  if (het) return null;
  return (
    <div className="ud-hien mb-4 rounded-xl border border-cinnabar/40 bg-cinnabar/[0.06] p-3" data-testid="ud-hop-thoai">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-cinnabar">{u.ten}</span>
        <DemNguoc hetLuc={u.het_luc} khiHet={() => setHet(true)} />
      </div>
      <p className="mt-2 text-sm text-fg">Báo cáo này đang <GiaUuDai u={u} /></p>
      <p className="mt-0.5 text-xs text-gold/90">{loiTietKiem(u)} · {loiHan(u.het_luc)}, sau đó về {u.gia_goc} Sao.</p>
      <ConSuat u={u} className="mt-2" />
    </div>
  );
}
