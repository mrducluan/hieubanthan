"use client";
// KD-ĐS — lời đọc quẻ hai tầng: tầng ĐỜI THƯỜNG (mức · kết luận · hộp nổi bật · ba nhóm việc · câu tự soi) hiện ngay;
// tầng HỌC THUẬT (vì sao nói vậy · ba cách đọc cùng một quẻ · lời kinh nguyên văn · bản đọc đầy đủ) gập lại, bấm mới mở.
// Component THUẦN: mọi chữ do engine dựng (`doc_que`), web không tự tính, không thêm ý.
import { useRef, useState } from "react";
import { BookOpen, ChevronDown, Layers, ScrollText } from "lucide-react";
import { ChipMuc } from "@/components/luan-giai/BaoCaoDoiSong";
import { HopNoiBat, ViSao } from "@/components/luan-giai/HopNoiBat";
import type { Hop, Muc } from "@/components/luan-giai/kieu";
import type { ThuatNgu } from "@/components/hoi/ThuatNgu";
import { doanCoThuatNgu } from "@/components/hoi/ThuatNgu";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";
import { ghiMoPhai } from "@/lib/thoi-quen-doc";
import { GoiMoCheo, type GoiMo } from "@/components/khung/GoiMoCheo";
import { NhacToi } from "@/components/khung/NhacToi";
import { maKhongDau } from "@/lib/nhac-viec";

export interface GocNhin { muc: Muc; nhan: string; tom_tat?: string; can_cu: string[] }
export interface GocNhinLucHao extends GocNhin {
  dung_than: string | null; phuc: boolean | null; luc_thu: string[];
  hao: { vi_tri: number; dia_chi: string; ngu_hanh: string; luc_than: string; the_ung: string | null; luc_thu: string; dong: boolean; tong: string;
    hoa?: { dia_chi: string; loai: string } | null; phuc?: { luc_than: string; dia_chi: string } }[];
  ung_ky: { chi: string; ly_do: string; ngay_gan_nhat: string; sau_bao_nhieu_ngay: number }[];
}
export interface GocNhinMaiHoa extends GocNhin { the: string; dung: string; ho: { thuong: string; ha: string }; bien: string; luu_y?: string | null }
export interface DocQueKq {
  muc: Muc; nhan_muc: string; mo_ta_muc?: string; ket_luan: string;
  hop: Hop[]; doan: string[];
  hanh_dong: { muc: Muc; nhan: string; viec: string[] }[];
  can_cu: { tieu_de: string; noi_dung: string }[];
  cau_tu_soi?: string | null;
  loi_kinh: { tieu_de: string; han: string; dich: string; y?: string | null; nom_na?: string | null; thoan?: string | null; chu?: boolean }[];
  goc_nhin: { chinh: string; nghia_ly: GocNhin; mai_hoa: GocNhinMaiHoa | null; luc_hao: GocNhinLucHao | null };
  ung_ky: { chi: string; ly_do: string; ngay_gan_nhat: string; sau_bao_nhieu_ngay: number }[];
  cau_lien_quan: string[];
  chu_de: { ma: string; ten: string; dung_than: string | null };
  mot_que_mot_viec?: string;
  /** KC-3: mã ý định chung + gợi mở sang mảng khác. */
  y_dinh_chung?: string | null; goi_mo?: GoiMo | null;
}

const TEN_PHAI: Record<string, string> = { nghia_ly: "Nghĩa Lý (lời kinh)", mai_hoa: "Mai Hoa (thể – dụng)", luc_hao: "Lục Hào (dụng thần)" };

function Gap({ id, Icon, tieuDe, children, testId, onMo }: { id: string; Icon: typeof BookOpen; tieuDe: string; children: React.ReactNode; testId?: string; onMo?: () => void }) {
  const [mo, setMo] = useState(false);
  return (
    <div className="rounded-xl border border-line/70 bg-bg/30" data-testid={testId}>
      <button type="button" aria-expanded={mo} aria-controls={id} onClick={() => { if (!mo) onMo?.(); setMo((v) => !v); }}
        className="flex min-h-10 w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg-muted hover:text-fg">
        <Icon className="size-4 text-gold" aria-hidden /><span className="flex-1">{tieuDe}</span>
        <ChevronDown className={cn("size-4 transition-transform", mo && "rotate-180")} aria-hidden />
      </button>
      {mo && <div id={id} className="border-t border-line/70 px-3 py-3 text-sm">{children}</div>}
    </div>
  );
}

export function DocQue({ dq, thuatNgu, vanDayDu, onHoi, id, anKetLuan = false, tenQue }: {
  dq: DocQueKq; thuatNgu?: ThuatNgu[]; /** lời đọc đầy đủ theo sách (cau_tra_loi) — gập */ vanDayDu?: string;
  onHoi?: (cau: string) => void; id: string; /** nơi gọi đã hiện kết luận làm lời chính */ anKetLuan?: boolean;
  /** tên quẻ bản (nhãn mốc nhắc). */ tenQue?: string;
}) {
  const [nhom, setNhom] = useState(0);
  const [moPhai, setMoPhai] = useState<Record<string, boolean>>({});
  const gn = dq.goc_nhin;
  const cac = (["nghia_ly", "mai_hoa", "luc_hao"] as const).filter((k) => gn[k]);
  // KC-5: tín hiệu ngầm — chạm vào cách đọc nào thì đếm trên máy (không chữ), mỗi cách đọc một lần cho mỗi quẻ; cách đọc
  // chính đang mở sẵn nên bấm vào tiêu đề của nó (dù là đóng lại) cũng tính là quan tâm. Đo bằng mã.
  const daDem = useRef(new Set<string>());
  const moCachDoc = (k: string) => {
    const dangMo = moPhai[k] ?? k === gn.chinh;
    setMoPhai((m) => ({ ...m, [k]: !dangMo }));
    if ((!dangMo || k === gn.chinh) && !daDem.current.has(k)) {
      daDem.current.add(k);
      ghiMoPhai(k); ghi("chart_interacted", { mo_dun: "kinhdich", kind: `mo_phai:${k}` });
    }
  };
  const ungKy = (gn.luc_hao?.ung_ky ?? dq.ung_ky ?? []).slice(0, 3);
  return (
    <div className="space-y-4" data-testid="doc-que">
      <div className="flex flex-wrap items-center gap-2">
        <ChipMuc muc={dq.muc} nhan={dq.nhan_muc} />
        <span className="text-xs text-fg-faint">Chủ đề: {dq.chu_de.ten} · đọc chính theo {TEN_PHAI[gn.chinh] ?? gn.chinh}</span>
      </div>
      {!anKetLuan && <p className="text-lg leading-relaxed text-fg" data-testid="ket-luan">{dq.ket_luan}</p>}
      {dq.hop.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {dq.hop.map((h, i) => <HopNoiBat key={`${h.loai}-${i}`} hop={h} thuatNgu={thuatNgu} />)}
        </div>
      )}
      <div className="prose-vn space-y-2 text-[0.95rem] leading-relaxed text-fg-muted">{doanCoThuatNgu(dq.doan.join("\n\n"), thuatNgu)}</div>

      {dq.hanh_dong.length > 0 && (
        <section aria-label="Việc nên làm" className="rounded-xl border border-line/70 bg-surface/40 p-3" data-testid="hanh-dong">
          <div role="tablist" className="flex flex-wrap gap-1.5">
            {dq.hanh_dong.map((n, i) => (
              <button key={n.muc} role="tab" type="button" aria-selected={i === nhom} onClick={() => setNhom(i)}
                data-muc={n.muc}
                className={cn("chip-muc rounded-full px-3 py-1 text-xs", i === nhom ? "font-semibold ring-1 ring-current" : "opacity-70 hover:opacity-100")}>
                {n.nhan}
              </button>
            ))}
          </div>
          <ul role="tabpanel" className="mt-3 list-disc space-y-1.5 pl-5 text-[0.95rem] text-fg">
            {(dq.hanh_dong[nhom] ?? dq.hanh_dong[0])?.viec.map((v) => <li key={v}>{v}</li>)}
          </ul>
        </section>
      )}

      {dq.cau_tu_soi && (
        <p className="rounded-xl bg-moon/10 px-4 py-2.5 text-moon" data-testid="cau-tu-soi">
          <span className="text-xs font-semibold uppercase tracking-wider">Tự hỏi mình</span>
          <span className="mt-0.5 block italic">{dq.cau_tu_soi}</span>
        </p>
      )}

      {dq.cau_lien_quan.length > 0 && onHoi && (
        <div className="flex flex-wrap gap-2" data-testid="cau-lien-quan">
          <span className="self-center text-xs text-fg-faint">Hỏi tiếp:</span>
          {dq.cau_lien_quan.map((c) => (
            <button key={c} type="button" onClick={() => onHoi(c)}
              className="rounded-full border border-line px-3 py-1 text-xs text-fg-muted hover:border-gold/60 hover:text-fg">{c}</button>
          ))}
        </div>
      )}

      {ungKy.length > 0 && (
        <div className="rounded-xl border border-line/70 bg-bg/30 p-3 text-sm" data-testid="ung-ky">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-faint">Mốc đáng để ý (nhịp gợi ý, không phải dự báo)</p>
          <ul className="mt-2 space-y-2">
            {ungKy.map((u) => (
              <li key={u.chi + u.ngay_gan_nhat} className="flex flex-wrap items-center gap-2">
                <span>Ngày {u.chi} · {u.ngay_gan_nhat.slice(8, 10)}/{u.ngay_gan_nhat.slice(5, 7)} — {u.ly_do}</span>
                <NhacToi ngay={u.ngay_gan_nhat} ma={`kd.ungky.${maKhongDau(u.chi)}`} moDun="kinhdich"
                  nhan={`Ngày ${u.chi} — mốc ứng kỳ${tenQue ? ` quẻ ${tenQue}` : ""} (${dq.chu_de.ten})`} duong="/kinh-dich" />
              </li>
            ))}
          </ul>
        </div>
      )}
      {dq.goi_mo && <GoiMoCheo goiMo={dq.goi_mo} moDun="kinhdich" gon />}

      {/* ---- tầng học thuật: gập ---- */}
      <ViSao canCu={dq.can_cu.map((c) => `${c.tieu_de}: ${c.noi_dung}`)} thuatNgu={thuatNgu} />
      <div className="space-y-2">
        <Gap id={`${id}-goc-nhin`} Icon={Layers} tieuDe={`Ba cách đọc cùng một quẻ (${cac.length})`} testId="goc-nhin"
          onMo={() => ghi("chart_interacted", { mo_dun: "kinhdich", kind: "mo_goc_nhin" })}>
          <div className="space-y-3">
            {cac.map((k) => {
              const g = gn[k]!;
              const mo = moPhai[k] ?? k === gn.chinh;
              return (
                <div key={k} className={cn("rounded-lg border p-3", k === gn.chinh ? "border-gold/50" : "border-line/60")} data-phai={k}>
                  <button type="button" aria-expanded={mo} onClick={() => moCachDoc(k)} className="flex w-full flex-wrap items-center gap-2 text-left text-sm font-semibold text-fg">
                    {TEN_PHAI[k]} <ChipMuc muc={g.muc} nhan={g.nhan} />{k === gn.chinh && <span className="text-xs font-normal text-gold">đang dùng</span>}
                    <ChevronDown className={cn("ml-auto size-4 text-fg-muted transition-transform", mo && "rotate-180")} aria-hidden />
                  </button>
                  {mo && <>
                  {g.tom_tat && <p className="mt-1 text-fg-muted">{g.tom_tat}</p>}
                  {k === "luc_hao" && gn.luc_hao && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="text-fg-faint"><th className="text-left">Hào</th><th className="text-left">Lục thân</th><th className="text-left">Chi</th><th className="text-left">Lục thú</th><th className="text-left">Ngày tháng</th><th className="text-left">Động / hoá</th></tr></thead>
                        <tbody>
                          {[...gn.luc_hao.hao].reverse().map((h) => (
                            <tr key={h.vi_tri} className={cn(h.dong && "text-gold")}>
                              <td>{h.vi_tri}{h.the_ung ? ` (${h.the_ung})` : ""}</td><td>{h.luc_than}{h.phuc ? ` · phục ${h.phuc.luc_than}` : ""}</td>
                              <td>{h.dia_chi} {h.ngu_hanh}</td><td>{h.luc_thu}</td><td>{h.tong}</td>
                              <td>{h.dong ? (h.hoa ? `→ ${h.hoa.dia_chi} (${h.hoa.loai})` : "động") : ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {gn.luc_hao.ung_ky.length > 0 && (
                        <p className="mt-2 text-xs text-fg-faint">Ứng kỳ (nhịp gợi ý): {gn.luc_hao.ung_ky.map((u) => `ngày ${u.chi} ${u.ngay_gan_nhat.slice(8, 10)}/${u.ngay_gan_nhat.slice(5, 7)} — ${u.ly_do}`).join("; ")}.</p>
                      )}
                    </div>
                  )}
                  {k === "mai_hoa" && gn.mai_hoa && (
                    <p className="mt-1 text-xs text-fg-faint">Thể {gn.mai_hoa.the} · Dụng {gn.mai_hoa.dung} · Hỗ {gn.mai_hoa.ho.ha}/{gn.mai_hoa.ho.thuong} · Biến {gn.mai_hoa.bien}.{gn.mai_hoa.luu_y ? ` ${gn.mai_hoa.luu_y}` : ""}</p>
                  )}
                  <ul className="mt-2 space-y-1 border-l-2 border-line pl-3 text-xs text-fg-faint">{g.can_cu.map((c, i) => <li key={i}>{c}</li>)}</ul>
                  </>}
                </div>
              );
            })}
          </div>
        </Gap>
        {dq.loi_kinh.length > 0 && (
          <Gap id={`${id}-loi-kinh`} Icon={ScrollText} tieuDe="Lời kinh nguyên văn (Chu Dịch)" testId="loi-kinh" onMo={() => ghi("chart_interacted", { mo_dun: "kinhdich", kind: "mo_loi_kinh" })}>
            <div className="space-y-3">
              {dq.loi_kinh.map((l, i) => (
                <div key={i}>
                  <p className="font-semibold text-fg">{l.chu ? "【Lời chủ】 " : ""}{l.tieu_de}</p>
                  <p className="text-fg-muted" style={{ fontFamily: "var(--font-han), serif" }}>「{l.han}」</p>
                  <p className="text-fg-muted">{l.dich}{l.y ? ` — ${l.y}` : ""}</p>
                  {l.thoan && <p className="text-fg-faint">Thoán truyện: {l.thoan}</p>}
                  {l.nom_na && <p className="text-fg-faint">Nói nôm na: {l.nom_na}</p>}
                </div>
              ))}
            </div>
          </Gap>
        )}
        {vanDayDu && (
          <Gap id={`${id}-day-du`} Icon={BookOpen} tieuDe="Bản đọc đầy đủ theo sách" testId="ban-day-du" onMo={() => ghi("chart_interacted", { mo_dun: "kinhdich", kind: "mo_ban_day_du" })}>
            <div className="space-y-2 text-fg-muted">{doanCoThuatNgu(vanDayDu, thuatNgu)}</div>
          </Gap>
        )}
      </div>
      {dq.mot_que_mot_viec && <p className="text-xs text-fg-faint">{dq.mot_que_mot_viec}</p>}
    </div>
  );
}
