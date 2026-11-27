"use client";
// Chặng 3.3B — "Lá ngược nói thêm gì?": với lá Ẩn phụ đang NGƯỢC, một câu nghĩa ngược ngắn theo sách xưa. Khối gọn, gập
// sẵn, đặt sau bài đọc. Không lặp phần BaoCaoTarot / BanTraiBai đã có (nghĩa từng vị trí, việc nhỏ, câu tự hỏi, đường phẩm
// giá giữa các lá) — chỉ giữ câu nghĩa ngược mới; tên sách + câu trích chỉ trong "Vì sao nói vậy" (TR-4).
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "@/components/khung/Lien";
import { useDuong } from "@/components/khung/NgonNgu";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { useChuTarot } from "@/components/tarot/chu-tarot";
import { ghi } from "@/lib/do-luong";
import { kemNgonNgu } from "@/lib/sao-client";

interface LaRut {
  id: string;
  nguoc: boolean;
}

interface KetQuaChieuSau {
  khung: { tieu_de: string; phu_de: string; cau_noi_menh_ly: string };
  so_la_nguoc: number;
  la_nguoc: {
    vi_tri: number;
    id: string;
    ten: string;
    chieu_nguoc_go_mo: string;
    trich_waite_1910_nguoc?: string | null;
    trich_mathers_1888_nguoc?: string | null;
  }[];
  lien_ket_menh_ly: { ten: string; duong: string }[];
}

export function ChieuSauTraiBai({ la }: { la: LaRut[] }) {
  const { c, en } = useChuTarot();
  const d = useDuong();
  const [kq, setKq] = useState<KetQuaChieuSau | null>(null);

  // Khoá theo NỘI DUNG lá (không theo mảng `la` — mảng mới mỗi lần cha render sẽ gọi lại liên tục).
  const keyLa = la.map((x) => `${x.id}:${x.nguoc ? 1 : 0}`).join(",");

  useEffect(() => {
    setKq(null);
    if (!keyLa) return;
    let huy = false;
    const ds = keyLa.split(",").map((p) => { const [id, n] = p.split(":"); return { id: id!, nguoc: n === "1" }; });
    if (!ds.some((x) => x.nguoc)) return;
    const url = "/api/tarot/chieu-sau";
    fetch(url, kemNgonNgu(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ la: ds }),
    }))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!huy) setKq(j ? (j as KetQuaChieuSau) : null); })
      .catch(() => { if (!huy) setKq(null); });
    return () => { huy = true; };
  }, [keyLa, en]);

  if (!kq || !kq.la_nguoc?.length) return null;

  return (
    <details
      className="group mt-6 rounded-2xl border border-line/80 bg-surface/35"
      data-testid="chieu-sau-trai-bai"
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open) ghi("chart_interacted", { mo_dun: "tarot", kind: "tarot_chieu_sau_mo", so_la: kq.la_nguoc.length });
      }}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
        <span>{c("cs.tieu_de")} <span className="font-normal text-fg-muted">({kq.la_nguoc.length})</span></span>
        <ChevronDown className="size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-3 px-5 pb-5">
        <p className="text-xs leading-relaxed text-fg-muted">{c("cs.dan")}</p>
        {kq.la_nguoc.map((l) => {
          const trich = [
            l.trich_waite_1910_nguoc ? `Waite (1910): “${l.trich_waite_1910_nguoc}”` : null,
            l.trich_mathers_1888_nguoc ? `Mathers (1888): “${l.trich_mathers_1888_nguoc}”` : null,
          ].filter((x): x is string => !!x);
          return (
            <div key={`${l.vi_tri}-${l.id}`} className="rounded-xl border border-line/70 bg-bg/55 p-3.5 text-sm">
              <p className="font-semibold text-fg">
                {l.vi_tri}. {l.ten} <span className="text-xs font-normal text-fg-muted">({c("cs.nguoc")})</span>
              </p>
              <p className="mt-1 leading-relaxed text-fg-muted">{l.chieu_nguoc_go_mo}</p>
              <ViSao nho canCu={trich} />
            </div>
          );
        })}
        {kq.lien_ket_menh_ly?.length > 0 && (
          <div className="border-t border-line/50 pt-3 text-xs text-fg-muted">
            {kq.khung?.cau_noi_menh_ly && <p>{kq.khung.cau_noi_menh_ly}</p>}
            <div className="mt-1 flex flex-wrap gap-x-4">
              {kq.lien_ket_menh_ly.map((lk) => (
                <Link key={lk.duong} href={d(lk.duong)} className="inline-flex min-h-11 items-center gap-1 font-medium text-gold hover:underline">
                  {lk.ten} <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
