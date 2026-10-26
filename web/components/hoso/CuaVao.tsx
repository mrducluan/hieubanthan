"use client";
import Link from "next/link";
import { useChuChung } from "@/components/cms/ChuChung";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarHeart, Heart, HeartHandshake, Hash, Orbit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NhapHoSo } from "./NhapHoSo";
import { NutChiaSe } from "@/components/chia-se/NutChiaSe";
import { NutChiaSeNgay } from "@/components/chia-se/NutChiaSeNgay";
import { tenGoi, useHoSo, type HoSo } from "@/lib/hoso";
import { boTienToNgay, useNhip } from "@/lib/nhip";
import { batDauDoc } from "@/lib/do-luong";

// Ô nhập ở trang chủ: chưa có hồ sơ → form 2 trường; đã có → lối về trung tâm "Bản thân".
export function CuaVao() {
  const hoSo = useHoSo();
  const router = useRouter();
  const c = useChuChung();
  if (hoSo === undefined) return <div className="h-[15rem] animate-pulse rounded-2xl bg-surface/50" />;
  if (hoSo) return <ChaoLai hoSo={hoSo} />;
  return (
    <div className="glass rounded-2xl p-6">
      <p className="mb-5 font-serif text-xl">{c("cua_vao.tieu_de")}</p>
      <NhapHoSo onXong={() => router.push("/than-so?moi=1")} />
    </div>
  );
}

const LOI_TAT = [["/hom-nay", "Hôm nay", CalendarHeart], ["/than-so", "Thần số", Hash], ["/hop-doi", "Hợp đôi", Heart], ["/tu-vi", "Tử vi", Orbit]] as const;

// Người quay lại (khâu QUAY LẠI → MỜI): con số của chính họ hôm nay + một câu tự soi (engine tính, NHIP-1), chia sẻ thẻ
// ngày có ảnh, "Xem hợp với ai" tạo link mời hợp đôi ngay tại chỗ, và lối tắt tới việc hay làm mỗi ngày.
function ChaoLai({ hoSo }: { hoSo: HoSo }) {
  const nhip = useNhip(hoSo);
  const [moiMo, setMoiMo] = useState(false);
  const c = useChuChung();
  useEffect(() => { if (nhip) batDauDoc("nhip", { kind: "trang_chu" }); }, [nhip]);
  return (
    <div className="glass rounded-2xl p-5 sm:p-6" data-testid="chao-lai">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <p className="eyebrow">{c("cua_vao.chao_lai")}</p>
          <p className="mt-1 font-serif text-3xl">{tenGoi(hoSo)}</p>
        </div>
        <p className="text-sm text-fg-muted">{c("cua_vao.san_sang")}</p>
      </div>

      {nhip ? (
        <div className="mt-4 flex gap-4 rounded-xl border border-gold/25 bg-gold/[0.05] p-4" data-testid="nhip-hom-nay">
          <span className="grid size-14 shrink-0 place-items-center rounded-full border border-gold/50 bg-bg/50 font-serif text-3xl text-gold shadow-glow"
            aria-label={`Ngày cá nhân ${nhip.ngay_ca_nhan.so}`}>{nhip.ngay_ca_nhan.so}</span>
          <div className="min-w-0 text-sm">
            <p className="text-fg-muted">Hôm nay · Ngày cá nhân <b className="text-gold">{nhip.ngay_ca_nhan.so}</b></p>
            <p className="mt-0.5">{boTienToNgay(nhip.ngay_ca_nhan.nghia)}</p>
            <p className="mt-1.5 italic text-fg-muted">“{nhip.ngay_ca_nhan.tu_soi}”</p>
          </div>
        </div>
      ) : <div className="mt-4 h-[5.5rem] animate-pulse rounded-xl bg-surface/50" aria-hidden />}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button asChild size="lg"><Link href="/hom-nay">{c("cua_vao.nut_hom_nay")} <ArrowRight aria-hidden /></Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/ban-than">{c("cua_vao.nut_ho_so")}</Link></Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {nhip && <NutChiaSeNgay hoSo={hoSo} soNgay={nhip.ngay_ca_nhan.so} chuDe={boTienToNgay(nhip.ngay_ca_nhan.nghia).replace(/\.$/, "").toLowerCase()} nho />}
        <Button size="sm" variant="secondary" onClick={() => setMoiMo((v) => !v)} aria-expanded={moiMo} data-testid="xem-hop-voi-ai">
          {moiMo ? <X aria-hidden /> : <HeartHandshake aria-hidden />} {c("cua_vao.nut_hop")}
        </Button>
      </div>
      {moiMo && (
        <div className="mt-3 rounded-xl border border-line/70 bg-bg/40 p-4" data-testid="khung-hop-voi-ai">
          <p className="mb-3 text-sm text-fg-muted">{c("cua_vao.moi_mo_ta")}</p>
          <NutChiaSe loai="invite" hoSo={hoSo} duongDan={(m) => `/hop-doi/${m}`} nutTao="Tạo link mời xem hợp"
            loiNhan={`${tenGoi(hoSo)} muốn xem hai người hợp nhau thế nào — mở link, nhập ngày sinh của bạn là thấy.`} />
        </div>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-2 border-t border-line/60 pt-4 text-sm sm:grid-cols-4">
        {LOI_TAT.map(([href, ten, Icon]) => (
          <li key={href}>
            <Link href={href} className="flex items-center justify-center gap-1.5 rounded-xl border border-line/70 bg-bg/30 px-2 py-2 text-fg-muted transition-colors hover:border-gold/50 hover:text-fg">
              <Icon className="size-4 text-gold" aria-hidden />{ten}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
