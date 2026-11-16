"use client";
// TS-V3b — "Phái nào nói đúng về bạn?" dưới mỗi câu trả lời thần số: ba câu ngắn (mỗi phái một câu, engine soạn từ KB
// theo lĩnh vực câu hỏi) → bấm chọn câu nghe đúng hơn. Phiếu đếm trên máy (lib/phieu-phai). Đủ 7 phiếu → gợi ý phái hợp
// nhất + lời mời mở bản đồ con số đầy đủ (BanDoConSo).
import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { hoTenList, type HoSo } from "@/lib/hoso";
import type { QuyUocDD } from "@/lib/quy-uoc-dd";
import { boPhieu, NGUONG_GOI_Y, phaiDanDau, tongPhieu, usePhieu, type PhaiPhieu } from "@/lib/phieu-phai";
import { cn } from "@/lib/utils";
import { maNgonNguTrang } from "@/lib/ngon-ngu";
import { fetchNN, useChuThanSo } from "./chu-than-so";

interface GocNhin { phai: PhaiPhieu; ten_phai: string; nhan: string; y: string }
interface BaGocNhin { goc_nhin: GocNhin[]; luu_y: string }
const boNho = new Map<string, BaGocNhin>();

export function PhaiNaoDung({ hoSo, quyUoc, linhVuc, onDungPhai }: {
  hoSo: HoSo; quyUoc: QuyUocDD; linhVuc?: string; onDungPhai?: (p: PhaiPhieu) => void;
}) {
  const lv = linhVuc && /^[a-z_]{2,30}$/.test(linhVuc) ? linhVuc : undefined;
  const khoa = JSON.stringify([hoTenList(hoSo), hoSo.ngay, hoSo.thang, hoSo.nam, quyUoc, lv ?? "", maNgonNguTrang()]);
  const { c } = useChuThanSo();
  const tenPhai = (p: PhaiPhieu) => c(`phai.${p}`);
  const [d, setD] = useState<BaGocNhin | null>(boNho.get(khoa) ?? null);
  const [chon, setChon] = useState<PhaiPhieu | "khong" | null>(null);
  const phieu = usePhieu();
  useEffect(() => {
    if (boNho.has(khoa)) { setD(boNho.get(khoa)!); return; }
    let huy = false;
    fetchNN("/api/thanso/ba-goc-nhin", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam, quy_uoc_duong_doi: quyUoc, ...(lv ? { linh_vuc: lv } : {}) }),
    }).then((r) => (r.ok ? (r.json() as Promise<BaGocNhin>) : null))
      .then((v) => { if (v) { boNho.set(khoa, v); if (!huy) setD(v); } })
      .catch(() => { /* phần phụ */ });
    return () => { huy = true; };
  }, [khoa]); // eslint-disable-line react-hooks/exhaustive-deps -- khoa đại diện cho hoSo + quyUoc + lv
  if (!d) return null;

  function bau(p: PhaiPhieu) {
    setChon(p);
    const moi = boPhieu(p);
    ghi("school_voted", { mo_dun: "thanso", phai: p, lan: tongPhieu(moi) });
  }
  const tong = tongPhieu(phieu);
  const dau = phaiDanDau(phieu);
  return (
    <div className="rounded-xl border border-line/70 p-3" data-testid="phai-nao-dung">
      <p className="inline-flex items-center gap-1.5 text-sm font-medium"><Scale className="size-4 text-gold" aria-hidden />{c("pn.tieu_de")}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {d.goc_nhin.map((g) => (
          <button key={g.phai} type="button" disabled={chon !== null} onClick={() => bau(g.phai)} aria-pressed={chon === g.phai}
            data-testid={`bau-${g.phai}`}
            className={cn("rounded-lg border p-2 text-left text-xs transition-colors disabled:cursor-default",
              chon === g.phai ? "border-gold bg-gold/10" : "border-line/70 hover:border-gold/60", chon && chon !== g.phai && "opacity-60")}>
            <span className="block font-semibold text-fg">{g.ten_phai} · {g.nhan}</span>
            <span className="mt-1 block text-fg-muted">{g.y}</span>
          </button>
        ))}
      </div>
      {chon === null ? (
        <button type="button" className="mt-2 text-xs text-fg-faint hover:text-fg" onClick={() => setChon("khong")}>{c("pn.chua")}</button>
      ) : (
        <p className="mt-2 text-xs text-fg-muted" data-testid="tien-do-phieu">
          {tong < NGUONG_GOI_Y ? c("pn.tien_do", { tong: String(tong), nguong: String(NGUONG_GOI_Y) }) : c("pn.da_chon", { tong: String(tong) })}
          {" "}{c("pn.tren_may")}
        </p>
      )}
      {chon !== null && tong >= NGUONG_GOI_Y && dau.length > 0 && (
        <div className="mt-3 rounded-lg border border-gold/40 bg-gold/[0.06] p-3 text-sm" data-testid="goi-y-phai">
          <p>{c("pn.hop_nhat")} <b className="text-gold">{dau.map((p) => tenPhai(p)).join(c("pn.va"))}</b> {c("pn.lan", { n: String(phieu[dau[0]!]), tong: String(tong) })}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dau.length === 1 && onDungPhai && (
              <Button size="sm" variant="secondary" onClick={() => onDungPhai(dau[0]!)}>{c("pn.dung", { ten: tenPhai(dau[0]!) })}</Button>
            )}
            <Button size="sm" asChild><a href="#ban-do-con-so">{c("pn.ban_do")}</a></Button>
          </div>
        </div>
      )}
      <p className="mt-2 text-[11px] text-fg-faint">{d.luu_y}</p>
    </div>
  );
}
