"use client";
// MAU6 — lá số SVG (bấm cung xem chi tiết) + bảy bước đọc, mỗi bước có thuật ngữ gạch chân và khung giải nghĩa.
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LaSoOutputT } from "@/app/api/tuvi/schema";
import { ChiTietCung } from "@/components/huyen-hoc/ChiTietCung";
import { LaSoTuVi } from "@/components/huyen-hoc/LaSoTuVi";
import { KhungLaSo } from "@/components/huyen-hoc/KhungLaSo";
import { doanCoThuatNgu, KhungGiaiNghia } from "@/components/hoi/ThuatNgu";
import type { LaSoMau } from "@/lib/kien-thuc";

export function DocLaSoMau({ duLieu }: { duLieu: LaSoMau }) {
  const ls = duLieu.la_so as LaSoOutputT;
  const menh = ls.cung.find((c) => c.la_menh)?.chi ?? ls.cung[0]!.chi;
  const [chon, setChon] = useState(menh);
  const router = useRouter();
  return (
    <>
      <KhungLaSo chon={chon} testId="la-so-mau" className="mt-8">
        <LaSoTuVi ls={ls} giaoDien="dem" ten={duLieu.ten} gioSinh={duLieu.gio} chon={chon} onChon={setChon} />
      </KhungLaSo>
      <div className="mt-4">
        <ChiTietCung ls={ls} chi={chon} onHoi={() => router.push("/tu-vi")} />
      </div>

      <ol className="mt-12 space-y-10" data-testid="buoc-doc">
        {duLieu.buoc.map((b) => (
          <li key={b.ma} id={b.ma} className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl">{b.tieu_de}</h2>
            <p className="mt-2 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-sm leading-relaxed text-fg-muted">
              <span className="font-semibold text-gold">Bước này là gì? </span>{b.cach_doc}
            </p>
            <div className="prose-vn mt-4 space-y-3 leading-relaxed">{doanCoThuatNgu(b.doan.join("\n\n"), b.thuat_ngu)}</div>
            <div className="mt-3"><KhungGiaiNghia ds={b.thuat_ngu} /></div>
          </li>
        ))}
      </ol>
    </>
  );
}
