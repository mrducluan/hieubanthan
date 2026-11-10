"use client";
// BT-UI đợt 2 — "Tuần này của bạn" trên Hôm nay (mục gập đầu tầng "Đọc thêm", mở sẵn vào thứ Hai): bảy ngày của tuần
// (số ngày cá nhân, ngày lịch ghi đẹp, hợp / xung tuổi) + tối đa ba ngày đáng để ý. Engine ghép và soạn mọi chữ
// (/v1/thanso/tuan); web chỉ vẽ. Không doạ, không đếm ngược; màu không đỏ.
import { useEffect, useState } from "react";
import Link from "@/components/khung/Lien";
import { MucGap } from "@/components/khung/MucGap";
import type { HoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";

interface NgayTuan { ngay: string; thu: string; so: number; chu_de: string; hoang_dao: boolean; dep: boolean; tuoi: string | null; tuoi_ten: string | null; da_qua: boolean; hom_nay: boolean }
interface DongNoiBat { loai: "thuan" | "hop_tuoi" | "cham" | "mo_dau" | "khep"; ngay: string; thu: string; tieu_de: string; cau: string; can_cu: string[] }
interface Tuan { tu: string; den: string; ngay: NgayTuan[]; noi_bat: DongNoiBat[]; tom_tat: string; luu_y: string }

const MAU: Record<DongNoiBat["loai"], string> = {
  thuan: "border-jade/40 bg-jade/[0.06]", hop_tuoi: "border-jade/40 bg-jade/[0.06]", cham: "border-[#f0b35c]/40 bg-[#f0b35c]/[0.06]",
  mo_dau: "border-gold/40 bg-gold/[0.06]", khep: "border-moon/40 bg-moon/[0.06]",
};
const dm = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;
const THU_NGAN = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function TuanCuaToi({ hoSo, ngay }: { hoSo: HoSo; ngay: string }) {
  const [t, setT] = useState<Tuan | null>(null);
  useEffect(() => {
    let huy = false;
    fetch("/api/thanso/tuan", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam, ngay_xem: ngay }) })
      .then((r) => (r.ok ? (r.json() as Promise<Tuan>) : null))
      .then((j) => { if (!huy && j && Array.isArray(j.ngay) && j.ngay.length === 7) setT(j); else if (!huy) setT(null); })
      .catch(() => { if (!huy) setT(null); });   // lỗi → ẩn mục, không để tuần của hồ sơ / ngày trước
    return () => { huy = true; };
  }, [hoSo.ngay, hoSo.thang, hoSo.nam, ngay]);
  if (!t) return null;   // engine cũ / lỗi mạng → mục tự ẩn
  const thuHai = t.ngay[0]?.hom_nay ?? false;
  return (
    <MucGap ma="tuan" testId="tuan-cua-toi" moSan={thuHai} tieuDe="Tuần này của bạn" phu={<>{dm(t.tu)} – {dm(t.den)}</>} tomTat={t.tom_tat}>
      <p className="text-sm">{t.tom_tat}</p>
      <ol className="grid grid-cols-7 gap-1.5" aria-label="Bảy ngày của tuần" data-testid="tuan-luoi">
        {t.ngay.map((n, i) => (
          <li key={n.ngay} data-hom-nay={n.hom_nay ? 1 : 0} title={`${n.thu} ${dm(n.ngay)} — ngày cá nhân ${n.so}: ${n.chu_de}`}
            className={cn("rounded-xl border px-1 py-2 text-center", n.hom_nay ? "border-gold bg-gold/10" : "border-line/60", n.da_qua && "opacity-50")}>
            <span className="block text-[0.7rem] text-fg-muted">{THU_NGAN[i]}</span>
            <span className="block font-serif text-xl leading-tight text-gold">{n.so}</span>
            <span className="block text-[0.65rem] tabular-nums text-fg-faint">{dm(n.ngay)}</span>
            <span className="mt-1 flex justify-center gap-0.5" aria-hidden>
              <span className={cn("size-1.5 rounded-full", n.dep ? "bg-jade" : n.hoang_dao ? "bg-gold/70" : "bg-transparent")} />
              <span className={cn("size-1.5 rounded-full", n.tuoi === "xung" ? "bg-[#f0b35c]" : n.tuoi === "tam_hop" || n.tuoi === "luc_hop" ? "bg-moon" : "bg-transparent")} />
            </span>
            <span className="sr-only">{n.dep ? "lịch ghi ngày đẹp. " : n.hoang_dao ? "ngày hoàng đạo. " : ""}{n.tuoi_ten && n.tuoi ? `${n.tuoi_ten} với tuổi bạn.` : ""}</span>
          </li>
        ))}
      </ol>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-fg-faint" aria-hidden>
        <span><i className="mr-1 inline-block size-1.5 rounded-full bg-jade align-middle" />lịch ghi ngày đẹp</span>
        <span><i className="mr-1 inline-block size-1.5 rounded-full bg-gold/70 align-middle" />hoàng đạo</span>
        <span><i className="mr-1 inline-block size-1.5 rounded-full bg-moon align-middle" />hợp tuổi</span>
        <span><i className="mr-1 inline-block size-1.5 rounded-full bg-[#f0b35c] align-middle" />xung tuổi</span>
      </p>
      {t.noi_bat.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-3" data-testid="tuan-noi-bat">
          {t.noi_bat.map((x) => (
            <li key={x.ngay} data-loai={x.loai} className={cn("rounded-xl border p-3 text-sm", MAU[x.loai])}>
              <p className="font-medium text-fg">{x.tieu_de}</p>
              <p className="mt-1 text-fg-muted">{x.cau}</p>
              <p className="mt-1.5 text-[0.7rem] text-fg-faint">{x.can_cu.join(" · ")}</p>
              <Link href={`/xem-ngay-tot/${x.ngay}`} className="mt-1 inline-block text-xs text-gold hover:underline">Xem kỹ ngày {dm(x.ngay)}</Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-fg-faint">{t.luu_y}</p>
    </MucGap>
  );
}
