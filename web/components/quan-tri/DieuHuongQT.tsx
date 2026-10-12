"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const MUC: [string, string][] = [
  ["/quan-tri", "Tổng quan"], ["/quan-tri/tang-truong", "Tăng trưởng"], ["/quan-tri/doanh-thu", "Doanh thu & Sao"], ["/quan-tri/tri-thuc", "Kho tri thức"],
  ["/quan-tri/hoi-dap", "Hỏi đáp"], ["/quan-tri/nguoi-dung", "Người dùng & Sao"], ["/quan-tri/cai-dat", "Cài đặt"],
];

export function DieuHuongQT() {
  const p = usePathname();
  if (p === "/quan-tri/xac-thuc") return null;
  return (
    <nav aria-label="Quản trị" className="mb-6 flex gap-1 overflow-x-auto whitespace-nowrap border-b border-line/60 text-sm">
      {MUC.map(([href, ten]) => {
        const dang = href === "/quan-tri" ? p === href : p.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={dang ? "page" : undefined}
            className={cn("-mb-px border-b-2 px-3 py-2", dang ? "border-gold text-fg" : "border-transparent text-fg-muted hover:text-fg")}>
            {ten}
          </Link>
        );
      })}
    </nav>
  );
}
