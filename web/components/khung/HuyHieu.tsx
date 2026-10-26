"use client";
// SAO-HH (0030, phần 2) — khối "Huy hiệu" (Bản thân) + dòng tóm tắt (Bản thân đầu trang, Tài khoản). Đạt thì sáng, chưa đạt
//   thì mờ + điều kiện + tiến độ khi đếm được trên máy (1/7, 2/5 mảng — lib/huy-hieu tienDoHuyHieu).
//   Đã đăng nhập: huy hiệu máy chủ (/api/sao/huy-hieu, chỉ đọc) + huy hiệu máy; khách / chưa bật tài khoản: chỉ huy hiệu máy
//   (ghi MỘT lần ở đầu mục, không lặp từng dòng). Huy hiệu không mua bán, không đổi ra Sao / tiền — ghi rõ ngay dưới khối.
//   Không doạ, không thúc, không đếm ngược.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, BadgeCheck, CalendarCheck, Cloud, Compass, Flame, HeartHandshake, MessageCircle, Trophy, UserPlus, Users, type LucideIcon } from "lucide-react";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import {
  CAU_BAN_CHAT, DANH_MUC, dangDiGanNhat, demDat, gopHuyHieu, huyHieuMay, nguyenLieuTienDo, tienDoHuyHieu,
  type HuyHieu as HuyHieuKieu, type NguyenLieuTienDo, type TrangThaiHuyHieu,
} from "@/lib/huy-hieu";

const ICON: Record<string, LucideIcon> = { Flame, CalendarCheck, Cloud, MessageCircle, UserPlus, Users, BadgeCheck, Compass, HeartHandshake, Trophy };
const ngayVn = (iso: string) => iso.split("-").reverse().join("/");
const homNayVn = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

interface KetQua { ds: HuyHieuKieu[]; dangNhap: boolean; nl: NguyenLieuTienDo }

/** Gom huy hiệu máy chủ (khi đăng nhập) + máy + nguyên liệu tiến độ trên máy. `null` = đang tải. */
function useHuyHieu(): KetQua | null {
  const [kq, setKq] = useState<KetQua | null>(null);
  useEffect(() => {
    let huy = false;
    const may = huyHieuMay();
    const nl = nguyenLieuTienDo(homNayVn());
    fetch("/api/sao/huy-hieu", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<TrangThaiHuyHieu>) : null))
      .then((t) => {
        if (huy) return;
        const mc = t && t.tai_khoan && t.dang_nhap && t.san_sang ? t.huy_hieu : null;
        setKq({ ds: gopHuyHieu(mc, may), dangNhap: Boolean(t && t.tai_khoan && t.dang_nhap), nl });
      })
      .catch(() => { if (!huy) setKq({ ds: gopHuyHieu(null, may), dangNhap: false, nl }); });
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
        mo_ta={kq.dangNhap ? "Dấu mốc theo tài khoản, kèm vài dấu mốc ghi trên máy này." : "Ghi trên máy này (chưa đăng nhập) — đổi máy hay xoá dữ liệu trình duyệt thì đếm lại."} />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="huy-hieu-ds" data-dat={dat}>
        {kq.ds.map((h) => {
          const dm = DANH_MUC[h.ma];
          const Icon = ICON[dm.bieu_tuong] ?? Award;
          const td = tienDoHuyHieu(h, kq.nl);
          return (
            <li key={h.ma} data-testid={`hh-${h.ma}`} data-dat={h.dat ? 1 : 0}
              className={`flex gap-3 rounded-2xl border p-4 ${h.dat ? "border-gold/50 bg-gold/[0.06]" : td && td.co > 0 ? "border-moon/40" : "border-line/70"}`}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${h.dat ? "bg-gold/20 text-gold" : td && td.co > 0 ? "bg-moon/15 text-moon" : "bg-surface-2 text-fg-faint"}`} aria-hidden>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="flex items-baseline justify-between gap-2 font-medium text-fg">
                  <span>{dm.ten}</span>
                  {td && <span className="shrink-0 text-xs font-semibold tabular-nums text-moon" data-testid="hh-tien-do">{td.co}/{td.can}</span>}
                </p>
                {h.dat
                  ? <p className="text-xs text-fg-muted">Đã đạt{h.luc ? ` · ${ngayVn(h.luc)}` : ""}{kq.dangNhap && h.nguon === "may" ? " · máy này" : ""}</p>
                  : <p className="text-xs text-fg-muted">{dm.dieu_kien}{kq.dangNhap && h.nguon === "may" ? " · máy này" : ""}</p>}
                {td && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={td.can} aria-valuenow={td.co} aria-label={`${dm.ten}: ${td.co}/${td.can}`}>
                    <div className="h-full rounded-full bg-moon" style={{ width: `${Math.round((td.co / td.can) * 100)}%` }} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-fg-faint">{CAU_BAN_CHAT}</p>
    </section>
  );
}

/** Dòng tóm tắt: "Huy hiệu: 1/4 dấu mốc · đang đi Ghé 7 ngày liền 3/7". Ở Bản thân (gần đầu trang) link cuộn xuống mục;
 *  ở Tài khoản link sang Bản thân. */
export function TomTatHuyHieu({ taiBanThan = false, className }: { taiBanThan?: boolean; className?: string }) {
  const kq = useHuyHieu();
  if (!kq) return null;
  const dat = demDat(kq.ds);
  const di = dangDiGanNhat(kq.ds, kq.nl);
  return (
    <p className={`inline-flex flex-wrap items-center gap-x-1.5 text-sm text-fg-muted ${className ?? ""}`} data-testid="huy-hieu-tom-tat">
      <Award className="size-4 text-gold" aria-hidden />
      <span>Huy hiệu: {dat}/{kq.ds.length} dấu mốc</span>
      {di && <span data-testid="huy-hieu-dang-di">· đang đi “{DANH_MUC[di.ma].ten}” {di.co}/{di.can}</span>}
      <Link href={taiBanThan ? "#muc-huy-hieu" : "/ban-than#muc-huy-hieu"} className="text-gold hover:underline">
        {taiBanThan ? "Xem huy hiệu" : "Xem ở Bản thân"}
      </Link>
    </p>
  );
}
