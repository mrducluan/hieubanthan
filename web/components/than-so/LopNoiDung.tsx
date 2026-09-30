import { BookOpen, Calculator, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// Ba lớp nội dung (Blueprint §17) — màu + biểu tượng cố định trên toàn sản phẩm.
export const LOP = {
  tinh: { ten: "Đã tính", mo_ta: "Phép tính minh bạch, cùng đầu vào luôn cùng kết quả", Icon: Calculator, mau: "jade" },
  giai: { ten: "Diễn giải", mo_ta: "Ý nghĩa theo truyền thống, có nguồn", Icon: BookOpen, mau: "gold" },
  soi: { ten: "Tự soi", mo_ta: "Câu hỏi để bạn tự kiểm — không ai trả lời thay bạn", Icon: Moon, mau: "moon" },
} as const;
export type LoaiLop = keyof typeof LOP;

const MAU: Record<string, string> = {
  jade: "text-jade border-jade/30 bg-jade/[0.06]",
  gold: "text-gold border-gold/30 bg-gold/[0.06]",
  moon: "text-moon border-moon/30 bg-moon/[0.06]",
};

export function NhanLop({ loai, className }: { loai: LoaiLop; className?: string }) {
  const { ten, Icon, mau } = LOP[loai];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider", MAU[mau], className)}>
      <Icon className="size-3" aria-hidden /> {ten}
    </span>
  );
}

export function KhoiLop({ loai, children, className }: { loai: LoaiLop; children: React.ReactNode; className?: string }) {
  const mau = LOP[loai].mau;
  return (
    <div className={cn("rounded-xl border-l-2 py-1 pl-4", mau === "jade" ? "border-jade/60" : mau === "gold" ? "border-gold/60" : "border-moon/60", className)}>
      <NhanLop loai={loai} className="mb-2" />
      <div className="text-[0.95rem] leading-relaxed text-fg">{children}</div>
    </div>
  );
}

export function ChuThichLop() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {(Object.keys(LOP) as LoaiLop[]).map((k) => (
        <li key={k} className="glass rounded-xl p-4">
          <NhanLop loai={k} />
          <p className="mt-2 text-sm text-fg-muted">{LOP[k].mo_ta}</p>
        </li>
      ))}
    </ul>
  );
}
