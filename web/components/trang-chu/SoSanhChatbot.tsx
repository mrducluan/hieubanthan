import Link from "next/link";
import {
  ArrowRight, BookOpen, Calculator, CalendarDays, Check, ListChecks, ListOrdered, Lock, Minus, Scale, Sparkles, Split, X,
  type LucideIcon,
} from "lucide-react";
import { ChuNhan } from "@/components/cms/ChuNhan";
import type { DocChu } from "@/lib/chu-trang";
import type { CHU_TRANG_CHU } from "@/lib/chu/trang-chu";
import { HienKhiThay } from "./HienKhiThay";

// TC-HOOK — thay khối "Vì sao tin được / Ba lớp" ở trang chủ. So với NHÓM "chatbot AI đa năng", không nêu tên hãng:
// Luật Quảng cáo cấm so sánh trực tiếp với sản phẩm cùng loại của tổ chức khác. Mỗi dòng phía Hiểu Bản Thân phải đúng
// với cách hệ thống đang chạy (CLAUDE.md: bộ tính tất định, KB có nguồn, âm lịch Việt, trường phái, kiểm chứng,
// AI không nhận tên/ngày sinh) — đổi tính năng thì sửa dòng tương ứng. ND-7: chữ ở lib/chu/trang-chu.ts (CMS sửa được).
type MucAi = "khong" | "mot_phan";
// Chữ mỗi hàng: bảng chữ trang chủ (so_sanh.hang_<n>_*) — ở đây chỉ còn biểu tượng + mức đánh dấu theo thứ tự hàng.
const HANG: { Icon: LucideIcon; muc: MucAi }[] = [
  { Icon: Calculator, muc: "mot_phan" }, { Icon: ListOrdered, muc: "mot_phan" }, { Icon: BookOpen, muc: "khong" },
  { Icon: CalendarDays, muc: "mot_phan" }, { Icon: Split, muc: "khong" }, { Icon: Scale, muc: "mot_phan" },
  { Icon: ListChecks, muc: "khong" }, { Icon: Lock, muc: "mot_phan" },
];

const BUOC_A = ["2", "4", "1", "0", "1", "9", "8", "8"];
const BUOC_B = ["24 → 6", "10 → 1", "1988 → 26 → 8"];

function DauCo({ i }: { i: number }) {
  return (
    <span className="dau-nay mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-jade/15 text-jade ring-1 ring-jade/40" style={{ "--i": i } as React.CSSProperties}>
      <Check className="size-3.5" strokeWidth={3} aria-label="Có" />
    </span>
  );
}

function DauAi({ muc }: { muc: MucAi }) {
  return muc === "khong" ? (
    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-cinnabar/10 text-cinnabar/80 ring-1 ring-cinnabar/30">
      <X className="size-3.5" strokeWidth={3} aria-label="Không" />
    </span>
  ) : (
    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-fg-faint/10 text-fg-faint ring-1 ring-fg-faint/30">
      <Minus className="size-3.5" strokeWidth={3} aria-label="Tuỳ lúc" />
    </span>
  );
}

export function SoSanhChatbot({ c }: { c: DocChu<typeof CHU_TRANG_CHU> }) {
  return (
    <HienKhiThay className="space-y-5" data-testid="so-sanh-chatbot">
      {/* Bằng chứng nhỏ trước bảng: cùng một ngày sinh, hai cách cộng đều đang được dùng, ra hai số khác hẳn. */}
      <div className="bau-troi hien-tung p-5 sm:p-6" data-testid="so-sanh-vi-du">
        <p className="eyebrow flex items-center gap-2 !text-gold"><Sparkles className="size-3.5" aria-hidden /> {c("so_sanh.vi_du_tieu_de")}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-line/60 bg-bg/40 p-4">
            <p className="text-xs text-fg-faint">{c("so_sanh.vi_du_cach_1")}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-sm text-fg-muted">
              {BUOC_A.map((c, i) => <span key={i} className="hien-tung" style={{ "--i": i + 1 } as React.CSSProperties}>{i ? "+ " : ""}{c}</span>)}
              <span className="ml-1">=</span>
              <span className="dau-nay ml-1 font-serif text-3xl text-gold" style={{ "--i": 9 } as React.CSSProperties}>33</span>
            </p>
          </div>
          <div className="rounded-2xl border border-line/60 bg-bg/40 p-4">
            <p className="text-xs text-fg-faint">{c("so_sanh.vi_du_cach_2")}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm text-fg-muted">
              {BUOC_B.map((c, i) => <span key={i} className="hien-tung" style={{ "--i": i + 3 } as React.CSSProperties}>{c}{i < BUOC_B.length - 1 ? " ·" : " ⇒"}</span>)}
              <span className="hien-tung" style={{ "--i": 7 } as React.CSSProperties}>6 + 1 + 8 = 15 →</span>
              <span className="dau-nay font-serif text-3xl text-gold" style={{ "--i": 9 } as React.CSSProperties}>6</span>
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm text-fg-muted">
          <ChuNhan chu={c("so_sanh.vi_du_ket")} lopNhan="font-bold text-fg" />
        </p>
      </div>

      <div className="glass overflow-hidden rounded-3xl p-3 md:p-0">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">So sánh Hiểu Bản Thân với chatbot AI đa năng khi xem thần số học và huyền học</caption>
          <thead className="hidden md:table-header-group">
            <tr>
              <th scope="col" className="w-[20%] px-5 pb-4 pt-6 align-bottom"><span className="eyebrow">{c("so_sanh.cot_tieu_chi")}</span></th>
              <th scope="col" className="quet-sang w-[42%] border-x border-t border-gold/40 bg-gold/[0.09] px-5 pb-4 pt-5 align-bottom">
                <span className="nhan-sang inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-gold">
                  <Sparkles className="size-3" aria-hidden /> {c("so_sanh.huy_hieu")}
                </span>
                <span className="mt-2 block font-serif text-xl text-fg">{c("so_sanh.cot_hbt")}</span>
                <span className="block text-xs font-normal text-fg-muted">{c("so_sanh.cot_hbt_phu")}</span>
              </th>
              <th scope="col" className="px-5 pb-4 pt-6 align-bottom">
                <span className="block font-serif text-xl text-fg-muted">{c("so_sanh.cot_ai")}</span>
                <span className="block text-xs font-normal text-fg-faint">{c("so_sanh.cot_ai_phu")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {HANG.map(({ Icon, muc }, i) => (
              <tr key={i} className="hien-tung group block py-3 first:pt-1 md:table-row md:py-0" style={{ "--i": i } as React.CSSProperties}>
                <th scope="row" className="block pb-2 font-normal md:table-cell md:border-t md:border-line/50 md:px-5 md:py-4 md:align-top">
                  <span className="flex items-center gap-2 font-serif text-base text-fg">
                    <Icon className="size-4 shrink-0 text-gold/80" aria-hidden /> {c(`so_sanh.hang_${i + 1}_tieu_chi`)}
                  </span>
                </th>
                <td className="block rounded-xl border border-gold/35 bg-gold/[0.07] p-3 md:table-cell md:rounded-none md:border-x md:border-b-0 md:border-t md:border-t-line/50 md:bg-gold/[0.09] md:px-5 md:py-4 md:align-top md:transition-colors md:group-hover:bg-gold/[0.14] md:group-last:border-b md:group-last:border-b-gold/40">
                  <span className="mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-wider text-gold md:hidden">{c("so_sanh.cot_hbt")}</span>
                  <span className="flex gap-2.5 text-fg"><DauCo i={i} />{c(`so_sanh.hang_${i + 1}_hbt`)}</span>
                </td>
                <td className="mt-2 block rounded-xl border border-line/50 p-3 md:mt-0 md:table-cell md:rounded-none md:border-0 md:border-t md:border-line/50 md:px-5 md:py-4 md:align-top">
                  <span className="mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-wider text-fg-faint md:hidden">{c("so_sanh.cot_ai")}</span>
                  <span className="flex gap-2.5 text-fg-muted"><DauAi muc={muc} />{c(`so_sanh.hang_${i + 1}_ai`)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hien-tung flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style={{ "--i": 2 } as React.CSSProperties}>
        <p className="max-w-2xl text-sm text-fg-muted">
          {c("so_sanh.ket")}
        </p>
        <Link href="/than-so" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-bg shadow-glow transition-transform hover:-translate-y-0.5">
          {c("so_sanh.nut")} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </HienKhiThay>
  );
}
