"use client";
// SAO-HH (0030, phần 2) — khối "Huy hiệu" (Bản thân) + dòng tóm tắt (Tài khoản). Đạt thì sáng, chưa đạt thì mờ + điều kiện.
//   Đã đăng nhập: huy hiệu máy chủ (/api/sao/huy-hieu, chỉ đọc) + huy hiệu máy; khách / chưa bật tài khoản: chỉ huy hiệu máy
//   (nhãn "trên máy này"). Huy hiệu không mua bán, không đổi ra Sao / tiền — ghi rõ ngay dưới khối. Không doạ, không thúc.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, BadgeCheck, CalendarCheck, Cloud, Compass, Flame, HeartHandshake, MessageCircle, Trophy, UserPlus, Users, type LucideIcon } from "lucide-react";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { CAU_BAN_CHAT, DANH_MUC, demDat, gopHuyHieu, huyHieuMay, type HuyHieu as HuyHieuKieu, type TrangThaiHuyHieu } from "@/lib/huy-hieu";

const ICON: Record<string, LucideIcon> = { Flame, CalendarCheck, Cloud, MessageCircle, UserPlus, Users, BadgeCheck, Compass, HeartHandshake, Trophy };
const ngayVn = (iso: string) => iso.split("-").reverse().join("/");

/** Gom huy hiệu máy chủ (khi đăng nhập) + máy. `null` = đang tải. */
function useHuyHieu(): { ds: HuyHieuKieu[]; dangNhap: boolean } | null {
  const [kq, setKq] = useState<{ ds: HuyHieuKieu[]; dangNhap: boolean } | null>(null);
  useEffect(() => {
    let huy = false;
    const may = huyHieuMay();
    fetch("/api/sao/huy-hieu", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<TrangThaiHuyHieu>) : null))
      .then((t) => {
        if (huy) return;
        const mc = t && t.tai_khoan && t.dang_nhap && t.san_sang ? t.huy_hieu : null;
        setKq({ ds: gopHuyHieu(mc, may), dangNhap: Boolean(t && t.tai_khoan && t.dang_nhap) });
      })
      .catch(() => { if (!huy) setKq({ ds: gopHuyHieu(null, may), dangNhap: false }); });
    return () => { huy = true; };
  }, []);
  return kq;
}

export function HuyHieu() {
  const kq = useHuyHieu();
  if (!kq) return null;
  const dat = demDat(kq.ds);
  return (
    <section aria-labelledby="muc-huy-hieu" className="scroll-mt-24" data-testid="huy-hieu">
      <TieuDeMuc id="muc-huy-hieu" nho="Huy hiệu" lon={dat > 0 ? `Bạn đã có ${dat} dấu mốc` : "Những dấu mốc của riêng bạn"}
        mo_ta={kq.dangNhap ? undefined : "Chưa đăng nhập: chỉ hiện dấu mốc ghi trên máy này."} />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="huy-hieu-ds" data-dat={dat}>
        {kq.ds.map((h) => {
          const dm = DANH_MUC[h.ma];
          const Icon = ICON[dm.bieu_tuong] ?? Award;
          return (
            <li key={h.ma} data-testid={`hh-${h.ma}`} data-dat={h.dat ? 1 : 0}
              className={`flex gap-3 rounded-2xl border p-4 ${h.dat ? "border-gold/50 bg-gold/[0.06]" : "border-line/70 opacity-60"}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${h.dat ? "bg-gold/20 text-gold" : "bg-surface-2 text-fg-faint"}`} aria-hidden>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-medium text-fg">{dm.ten}</p>
                {h.dat
                  ? <p className="text-xs text-fg-muted">Đã đạt{h.luc ? ` · ${ngayVn(h.luc)}` : ""}{h.nguon === "may" ? " · trên máy này" : ""}</p>
                  : <p className="text-xs text-fg-muted">{dm.dieu_kien}{h.nguon === "may" ? " (trên máy này)" : ""}</p>}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-fg-faint">{CAU_BAN_CHAT}</p>
    </section>
  );
}

/** Dòng tóm tắt cho trang Tài khoản: "N dấu mốc · xem ở Bản thân". */
export function TomTatHuyHieu() {
  const kq = useHuyHieu();
  if (!kq) return null;
  const dat = demDat(kq.ds);
  return (
    <p className="inline-flex flex-wrap items-center gap-x-1.5 text-sm text-fg-muted" data-testid="huy-hieu-tom-tat">
      <Award className="size-4 text-gold" aria-hidden />
      <span>Huy hiệu: {dat > 0 ? `${dat}/${kq.ds.length} dấu mốc` : "chưa có dấu mốc nào"}</span>
      <Link href="/ban-than#muc-huy-hieu" className="text-gold hover:underline">Xem ở Bản thân</Link>
    </p>
  );
}
