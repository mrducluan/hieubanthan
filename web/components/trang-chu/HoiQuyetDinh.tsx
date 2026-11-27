"use client";
// CV-4 — "Bạn đang cân nhắc điều gì?" ở trang chủ: người ta tìm bằng đúng câu hỏi ("có nên mở shop năm sau không"), nên cho gõ
// thẳng rồi chuyển sang Cố vấn. Chữ người dùng gõ đi qua sessionStorage (không lên URL → không vào đo lường); chip cố định đi bằng
// ?cau=. Không gửi gì lên máy chủ ở bước này; Cố vấn tự xin ngày sinh (hoặc lấy hồ sơ đã có trên máy).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Target } from "lucide-react";
import Link from "@/components/khung/Lien";
import { ghi } from "@/lib/do-luong";
import { CAU_QUYET_DINH, datCauChoCoVan, duongCoVan } from "@/lib/cau-hoi-co-van";

/** `chu`: chữ đã chọn ở máy chủ (hàm tra chữ không đi qua ranh giới server → client). */
export interface ChuHoiQuyetDinh { nho: string; o_goi_y: string; nut: string; chip_nhan: string; ghi_chu: string; lien_kinh_doanh: string }
export function HoiQuyetDinh({ chu }: { chu: ChuHoiQuyetDinh }) {
  const router = useRouter();
  const [cau, setCau] = useState("");
  const gui = (e: React.FormEvent) => {
    e.preventDefault();
    if (cau.trim().length < 3) return;
    ghi("cross_cta_clicked", { tu: "trang_chu", den: "co_van", kind: "o_hoi" });   // chỉ mã, không có chữ người dùng
    datCauChoCoVan(cau);
    router.push("/co-van");
  };
  return (
    <div className="glass rounded-3xl p-5 sm:p-7" data-testid="hoi-quyet-dinh">
      <form onSubmit={gui} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="hqd-cau" className="sr-only">{chu.nho}</label>
        <input id="hqd-cau" type="text" value={cau} onChange={(e) => setCau(e.target.value)} maxLength={300}
          placeholder={chu.o_goi_y} data-testid="hoi-quyet-dinh-o"
          className="min-h-12 flex-1 rounded-xl border border-line bg-bg/80 px-4 text-base text-fg placeholder:text-fg-faint focus:border-gold focus:outline-none" />
        <button type="submit" disabled={cau.trim().length < 3} data-testid="hoi-quyet-dinh-gui"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-6 text-sm font-semibold text-bg transition-opacity hover:opacity-95 disabled:opacity-50">
          <Target className="size-4" aria-hidden /> {chu.nut}
        </button>
      </form>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label={chu.chip_nhan}>
        {CAU_QUYET_DINH.map((q) => (
          <li key={q}>
            <Link href={duongCoVan(q)} onClick={() => ghi("cross_cta_clicked", { tu: "trang_chu", den: "co_van", kind: "chip" })}
              className="inline-flex min-h-10 items-center gap-1 rounded-full border border-line/70 bg-bg/50 px-3.5 py-1.5 text-xs text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">
              {q}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-faint">
        <span>{chu.ghi_chu}</span>
        <Link href="/co-van-kinh-doanh" className="inline-flex items-center gap-1 text-gold hover:underline">{chu.lien_kinh_doanh} <ArrowRight className="size-3" aria-hidden /></Link>
      </p>
    </div>
  );
}
