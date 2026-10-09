"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, BriefcaseBusiness, Flame, Heart, Milestone, ShieldAlert, Sprout, Target, UserRound, Wallet } from "lucide-react";
import type { ChanDung as ChanDungT, LopThem, MatChanDung } from "@/lib/engine";
import { cn } from "@/lib/utils";

// Chân dung 4 mặt (TS-SAU): trục số Đường đời + một lớp riêng từ chỉ số khác của chính người đọc.
// Engine chọn nội dung; web chỉ trình bày.
const ICON = { tong_quan: UserRound, tinh_cam: Heart, cong_viec: BriefcaseBusiness, bien_co: Milestone } as const;

function Muc({ nhan, children, mau = "text-fg-faint", Icon }: { nhan: string; children: React.ReactNode; mau?: string; Icon?: typeof Heart }) {
  return (
    <div className="rounded-xl border border-line/60 bg-bg/40 p-4">
      <p className={cn("flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider", mau)}>
        {Icon && <Icon className="size-3.5" aria-hidden />} {nhan}
      </p>
      <div className="mt-1.5 text-[0.95rem] leading-relaxed">{children}</div>
    </div>
  );
}

function DanhSach({ ds, mau }: { ds: string[]; mau: "jade" | "cinnabar" }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {ds.map((x) => (
        <li key={x} className="flex gap-2">
          <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", mau === "jade" ? "bg-jade" : "bg-cinnabar")} aria-hidden />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

function LopRieng({ lop }: { lop: LopThem[] }) {
  if (!lop.length) return null;
  return (
    <div className="space-y-2" data-testid="lop-them">
      <p className="eyebrow text-moon">Lớp riêng của bạn</p>
      {lop.map((l) => (
        <div key={l.nhan} className="flex gap-3 rounded-xl border border-moon/25 bg-moon/[0.05] p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-moon/40 font-serif text-lg text-moon">{l.so}</span>
          <div>
            <p className="text-sm font-semibold text-moon">{l.nhan}</p>
            <p className="mt-0.5 text-[0.95rem] leading-relaxed">{l.noi_dung}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function NoiDung({ m }: { m: MatChanDung }) {
  switch (m.ma) {
    case "tong_quan":
      return (
        <div className="space-y-4">
          <p className="font-serif text-lg leading-relaxed sm:text-xl">{m.chan_dung}</p>
          <p className="text-fg-muted"><Target className="mr-1.5 inline size-4 text-gold" aria-hidden />Động lực: {m.dong_luc}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Muc nhan="Điểm mạnh" mau="text-jade" Icon={Sprout}><DanhSach ds={m.diem_manh} mau="jade" /></Muc>
            <Muc nhan="Điểm mù" mau="text-cinnabar" Icon={ShieldAlert}><DanhSach ds={m.diem_mu} mau="cinnabar" /></Muc>
          </div>
          <Muc nhan="Khi căng thẳng" Icon={Flame}>{m.khi_cang_thang}</Muc>
          <blockquote className="rounded-xl border-l-2 border-gold/60 bg-gold/[0.05] py-3 pl-4 pr-3 font-serif text-lg italic text-gold">{m.huong_lon}</blockquote>
        </div>
      );
    case "tinh_cam":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Muc nhan="Cách yêu">{m.cach_yeu}</Muc>
          <Muc nhan="Cần được">{m.can_duoc}</Muc>
          <Muc nhan="Điểm mù" mau="text-cinnabar">{m.diem_mu}</Muc>
          <Muc nhan="Hợp với kiểu người" mau="text-jade">{m.hop_kieu_nguoi}</Muc>
          <Muc nhan="Dấu hiệu lệch nhịp" mau="text-cinnabar">{m.dau_hieu_lech}</Muc>
          <Muc nhan="Khi về chung một nhà">{m.hon_nhan}</Muc>
        </div>
      );
    case "cong_viec":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Muc nhan="Thế mạnh" mau="text-jade">{m.the_manh}</Muc>
            <Muc nhan="Môi trường hợp">{m.moi_truong}</Muc>
            <Muc nhan="Vai trò tự nhiên">{m.vai_tro}</Muc>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-faint">Hướng nghề hay được gợi ý</p>
            <ul className="mt-2 flex flex-wrap gap-2" data-testid="nghe">
              {m.nghe.map((n) => <li key={n} className="rounded-full border border-gold/40 bg-gold/[0.07] px-3 py-1 text-sm text-gold">{n}</li>)}
            </ul>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Muc nhan="Cái bẫy" mau="text-cinnabar" Icon={ShieldAlert}>{m.cai_bay}</Muc>
            <Muc nhan="Với tiền bạc" Icon={Wallet}>{m.tien_bac}</Muc>
          </div>
        </div>
      );
    case "bien_co":
      return (
        <div className="space-y-3">
          <Muc nhan="Kiểu bước ngoặt hay được kể lại">{m.kieu_bien_co}</Muc>
          <div className="grid gap-3 sm:grid-cols-2">
            <Muc nhan="Bài học" mau="text-gold">{m.bai_hoc}</Muc>
            <Muc nhan="Cách đi qua" mau="text-jade">{m.cach_di_qua}</Muc>
          </div>
          <Link href="/than-so#dong-doi" className="inline-flex items-center gap-1 text-sm text-gold hover:underline">
            Xem các năm bước ngoặt trên dòng đời của bạn <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      );
  }
}

export function ChanDung({ cd }: { cd: ChanDungT }) {
  const [chon, setChon] = useState(cd.mat[0]?.ma ?? "tong_quan");
  const giam = useReducedMotion();
  const m = cd.mat.find((x) => x.ma === chon) ?? cd.mat[0];
  if (!m) return null;
  return (
    <div className="space-y-5" data-testid="chan-dung">
      <div role="tablist" aria-label="Bốn mặt chân dung" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cd.mat.map((x) => {
          const Icon = ICON[x.ma as keyof typeof ICON] ?? UserRound;
          const on = x.ma === m.ma;
          return (
            <button key={x.ma} role="tab" type="button" aria-selected={on} onClick={() => setChon(x.ma)}
              data-testid={`mat-${x.ma}`}
              className={cn("relative overflow-hidden rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                on ? "border-gold/60 text-gold" : "border-line text-fg-muted hover:text-fg")}>
              {on && <motion.span layoutId={giam ? undefined : "nen-mat"} className="absolute inset-0 bg-gold/10" transition={{ duration: 0.25 }} />}
              <span className="relative flex items-center gap-2"><Icon className="size-4 shrink-0" aria-hidden /> {x.ten}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="glass rounded-2xl p-5 sm:p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={m.ma} className="space-y-5"
            {...(giam ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2 } })}>
            <NoiDung m={m} />
            <LopRieng lop={m.lop_them} />
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="text-xs text-fg-faint">{cd.cach_doc} Nguồn: {cd.nguon}{cd.trang_thai === "nhap_ai" ? " · biên soạn có AI hỗ trợ, chờ thẩm định" : ""}</p>
    </div>
  );
}
