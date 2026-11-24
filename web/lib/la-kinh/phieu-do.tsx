"use client";
// "Phiếu đo": kết quả engine của một lần "giữ yên" (hoặc hai lần ở hai chỗ) TRƯỚC khi người dùng chốt. Mọi con số và
// lời ở đây (độ, hướng, sơn, toạ, độ rung, lệch hai lần, lời nhắc) đều là của engine — web không tính.
import { Compass, MapPin, RotateCcw, Footprints } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { tenTheo, type TenHien } from "@/lib/ten-hien";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";

export interface KetQuaDoHuong {
  do_huong: number; huong: string; son_huong: string; do_toa: number; toa: string; son_toa: string;
  canh_bao: string | null; canh_bao_y: string | null; luu_y: string;
  trach: { quai: string; nhom: string };
  menh_quai?: { quai: string; nhom: string };
  du_nien?: { du_nien: string; cat: boolean };
  hop_nhom?: boolean;
  /** EN-ALL GĐ 5: tên Anh của mã (sơn, hướng…) — chỉ bản Anh có. */
  ten_hien?: TenHien;
}
/** LK-1: khối engine trả thêm khi gửi mẫu la bàn thô. */
export interface KhoiDo { do: number; rung: number; so_mau: number; on_dinh: "on" | "giu_yen" | "do_lai"; can_hieu_chinh: boolean; loi: string }
export interface KhoiHaiLan { lan: { do: number }[]; lech: number; nhieu: boolean; do: number | null; loi: string }
export type KetQuaMau = KetQuaDoHuong & { do: KhoiDo; hai_lan?: KhoiHaiLan };

/** Chỉ chốt được khi engine không bảo đo lại, không đòi hiệu chỉnh và hai lần đo (nếu có) không vênh nhau. */
export function chotDuoc(r: KetQuaMau): boolean {
  return r.do.on_dinh !== "do_lai" && !r.do.can_hieu_chinh && !r.hai_lan?.nhieu;
}

/** Hình "vẽ số 8" để hiệu chỉnh la bàn; chấm chạy theo đường số 8 (đứng yên khi người dùng giảm chuyển động). */
export function HinhSo8({ nhan }: { nhan: string }) {
  const giam = Boolean(useReducedMotion());
  const duong = "M40 20 C40 4 12 4 12 20 C12 36 40 36 40 20 C40 4 68 4 68 20 C68 36 40 36 40 20 Z";
  return (
    <svg viewBox="0 0 80 40" className="h-10 w-20 shrink-0 text-moon" role="img" aria-label={nhan} data-testid="hinh-so-8">
      <path d={duong} fill="none" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.55" strokeLinecap="round" />
      <rect x="-3.5" y="-5.5" width="7" height="11" rx="1.6" fill="rgb(var(--gold))" transform={giam ? "translate(26 8.5)" : undefined}>
        {!giam && <animateMotion dur="2.4s" repeatCount="indefinite" path={duong} />}
      </rect>
    </svg>
  );
}

export function PhieuDo({ r, dang, onChot, onDoLai, onDoLan2, onMoBanDo }: {
  r: KetQuaMau; dang: boolean;
  onChot: () => void; onDoLai: () => void;
  /** Có thì hiện lối "đo thêm một lần ở chỗ khác" (chỉ sau lần đo đầu). */
  onDoLan2?: () => void;
  /** Hai lần đo vênh nhau → dẫn sang cách lấy hướng từ bản đồ / ảnh vệ tinh. */
  onMoBanDo: () => void;
}) {
  const { c: t, en, huong } = useChuPT();
  const tn = tenTheo(r.ten_hien, en);
  const duoc = chotDuoc(r);
  const hai = r.hai_lan;
  return (
    <div className="space-y-2 rounded-xl border border-gold/40 bg-gold/[0.06] p-3" data-testid="phieu-do" data-chot={duoc}>
      <p className="eyebrow">{hai ? t("dh.phieu_hai_lan") : t("dh.phieu_mot_lan")}</p>
      <div aria-live="polite">
        <p className="font-serif text-2xl" data-testid="phieu-do-so">
          {r.do_huong}° <span className="text-base text-fg-muted">· {huong(r.huong)} · {t("dh.son")} {tn("son", r.son_huong)}</span>
        </p>
        <p className="text-xs text-fg-muted">{t("dh.toa")}: {huong(r.toa)} · {t("dh.son")} {tn("son", r.son_toa)} · {r.do_toa}°</p>
      </div>
      {hai && (
        <p className="text-sm" data-testid="phieu-hai-lan">
          <span className="text-fg-muted">{t("dh.hai_lan_so", { a: String(hai.lan[0]?.do ?? ""), b: String(hai.lan[1]?.do ?? "") })} </span>{hai.loi}
        </p>
      )}
      {!hai?.nhieu && (
        <div className="flex items-start gap-2">
          {r.do.can_hieu_chinh && <HinhSo8 nhan={t("dh.hinh_so_8")} />}
          <p className={duoc ? "text-sm text-fg-muted" : "text-sm text-moon"} data-testid="phieu-loi">{r.do.loi}</p>
        </div>
      )}
      {r.canh_bao_y && duoc && <p className="text-xs text-moon">{r.canh_bao_y}</p>}
      <div className="flex flex-wrap gap-2">
        {duoc && (
          <Button onClick={onChot} disabled={dang} data-testid="phieu-chot"><Compass aria-hidden /> {t("dh.chot")}</Button>
        )}
        {duoc && onDoLan2 && (
          <Button variant="secondary" onClick={onDoLan2} disabled={dang} data-testid="phieu-do-lan-2" className="h-auto min-h-11 whitespace-normal py-2 text-left"><Footprints aria-hidden /> {t("dh.do_lan_2")}</Button>
        )}
        <Button variant={duoc ? "ghost" : "secondary"} onClick={onDoLai} disabled={dang} data-testid="phieu-do-lai"><RotateCcw aria-hidden /> {t("dh.do_lai")}</Button>
        {hai?.nhieu && (
          <Button variant="ghost" onClick={onMoBanDo} data-testid="phieu-mo-ban-do"><MapPin aria-hidden /> {t("dh.nhieu_mo_ban_do")}</Button>
        )}
      </div>
      {duoc && onDoLan2 && <p className="text-xs text-fg-faint">{t("dh.bac_tu")}</p>}
    </div>
  );
}
