"use client";
// HD-CS đợt 3 — một câu trả lời trong khung "Hỏi đáp chuyên sâu".
//  · Ý 3: chữ trong lời trả lời ↔ hình (ChieuSang, mỗi câu trả lời một vùng riêng).
//  · Ý 5: máy tính đủ rộng → hai cột: hình dính bên trái, lời bên phải (cột tự co về một cột khi khung hẹp, vd Kinh Dịch).
//  · Ý 6: "Lưu" vào Bài đã lưu (bảng luan_giai_luu — chỉ khi người dùng bấm, RLS chủ sở hữu, xoá được, hết hạn 12 tháng).
//  · Ý 2: "Chia sẻ" thẻ câu trả lời (lib/the-hoi.ts — chỉ dữ liệu danh mục cố định + câu hỏi chuẩn, không câu gõ / ngày sinh).
import { useState, type ReactNode } from "react";
import Link from "@/components/khung/Lien";
import { ArrowUpRight, BookmarkCheck, BookmarkPlus, Heart, Info, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useNguoiDung } from "@/lib/tai-khoan";
import { laMangThe, tuKhoi } from "@/lib/the-hoi";
import { BangGui, NutRuBan } from "@/components/chia-se/HopChiaSe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";
import { useChuChung } from "@/components/cms/ChuChung";
import { doanCoThuatNgu, KhungGiaiNghia } from "@/components/hoi/ThuatNgu";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { NHAN_MUC } from "@/components/luan-giai/kieu";
import { useTyLe } from "@/lib/ty-le-kiem-chung";
import { KIEU_BIET, TrucQuan, type CoCauChuan, type KhoiTrucQuan } from "@/components/hoi/TrucQuan";
import { banDoKhop, useChieuSang, VungChieuSang } from "@/components/hoi/ChieuSang";
import type { DoiSongLienKetChat, GoNutDoiSongChat, KetQuaHoi, LuanHoiChat } from "@/components/hoi/KhungChat";
import { useXemNguoiThan } from "@/components/huyen-hoc/XemNguoiThan";
import { useChuHoiDap } from "@/components/luan-giai/chu-bao-cao";

interface Props {
  t: KetQuaHoi;
  /** Câu người dùng vừa hỏi (chỉ để lưu vào Bài đã lưu của CHÍNH họ — không vào thẻ chia sẻ). */
  cauHoi?: string;
  moDun: string;
  dang: boolean;
  /** Câu đã hỏi trong phiên — "Hỏi tiếp" bỏ những câu này. */
  daHoi: string[];
  hoi: (c: string) => void;
  /** Mã mời của người đang xem (lấy MỘT lần ở KhungChat) — gắn vào link thẻ để thưởng mời. */
  maMoi?: string | null;
}

export function CauTraLoi(p: Props) {
  return <VungChieuSang><Than {...p} /></VungChieuSang>;
}

function Than({ t, cauHoi, moDun, dang, daHoi, hoi, maMoi }: Props) {
  const { chieu } = useChieuSang();
  const hd = useChuHoiDap();
  const theo = banDoKhop(t.trucQuan);
  const coHinh = !!t.trucQuan?.some((k) => KIEU_BIET.has(k.kieu));
  const tiep = (t.hoiTiep ?? []).filter((c) => !daHoi.includes(c));
  const gapChung = hd.en && !!t.hoiLai?.chon.length;   // EN-AI: bản Anh hỏi lại → lời đáp chung gập
  const loi: ReactNode = (
    <div className="min-w-0 space-y-4">
      {t.hoTro && (
        // EN-ALL GĐ 3d: câu hỏi có một tín hiệu buồn yếu — lời hỗ trợ dịu (không đỏ), câu trả lời vẫn hiện bên dưới.
        <div className="flex gap-2.5 rounded-xl border border-moon/30 bg-moon/5 px-3.5 py-3 text-sm leading-relaxed text-fg"
          role="note" data-testid="ho-tro-mem">
          <Heart className="mt-0.5 size-4 shrink-0 text-moon" aria-hidden />
          <p>{t.hoTro}</p>
        </div>
      )}
      {t.hoiLai && t.hoiLai.chon.length > 0 && (
        <div className="rounded-xl border border-moon/30 bg-moon/5 px-3 py-2.5" data-testid="hoi-lai">
          <p className="text-sm text-fg-muted">{t.hoiLai.cau}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {t.hoiLai.chon.map((c) => (
              <button key={c} type="button" disabled={dang} onClick={() => { ghi("chart_interacted", { mo_dun: moDun, kind: "hoi_lai" }); hoi(c); }}
                className="min-h-10 rounded-full border border-moon/40 px-3.5 py-2 text-left text-sm text-fg transition-colors hover:border-moon disabled:opacity-50">
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      {!hd.en && !t.loi && t.luanHoi && <HopLuanHoiChat lh={t.luanHoi} moDun={moDun} />}
      {t.van && (gapChung ? (
        // EN-AI: bản Anh — máy chưa hiểu chắc câu hỏi → không đoán thay: lời đáp chung gập lại dưới "Did you mean…".
        <details className="group" data-testid="tra-loi-chung">
          <summary className="cursor-pointer text-sm text-fg-muted hover:text-fg">{hd.c("tra_loi_chung")}</summary>
          <div className="prose-vn mt-3 text-[1.05rem] leading-[1.75] text-fg">{doanCoThuatNgu(t.van, t.thuatNgu)}</div>
        </details>
      ) : (
        <div className="prose-vn text-[1.05rem] leading-[1.75] text-fg">
          {doanCoThuatNgu(t.van, t.thuatNgu, undefined, theo.size ? {
            theo, bam: (id) => { chieu(id); ghi("chart_interacted", { mo_dun: moDun, kind: "chu_sang_hinh" }); },
          } : undefined)}
        </div>
      ))}
      {t.van && !gapChung && theo.size > 0 && <p className="text-xs text-fg-faint">{hd.c("chu_xanh")}</p>}
      {t.van && <ViSao canCu={t.canCu} thuatNgu={t.thuatNgu} />}
      <KhungGiaiNghia ds={t.thuatNgu} />
      {!t.loi && t.goNutDoiSong && <HopGoNutDoiSong gn={t.goNutDoiSong} />}
      {!hd.en && !t.loi && !t.luanHoi && t.doiSongLienKet && <LienKetDoiSongChat lk={t.doiSongLienKet} moDun={moDun} />}
      {t.canhBao?.map((c) => (
        <p key={c} className="flex gap-2 rounded-xl bg-moon/10 px-3 py-2 text-xs text-moon"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {c}</p>
      ))}
      {t.ghiChu && <p className="text-xs text-fg-faint">{t.ghiChu}</p>}
      {hd.en && t.van && (
        // EN-ALL GĐ 3c: lưới an toàn bản Anh — luôn có lối cầu cứu, kể cả khi bộ dò khủng hoảng bỏ sót (không đỏ, không doạ).
        <p className="flex gap-2 text-xs leading-relaxed text-fg-faint" data-testid="luoi-an-toan">
          <Heart className="mt-0.5 size-3.5 shrink-0 text-moon/70" aria-hidden /> {hd.c("luoi_an_toan")}
        </p>
      )}
      {t.ghiLuot && <p className="text-xs text-gold" data-testid="ghi-luot">{t.ghiLuot}</p>}
      {/* EN-ALL: Lưu (tài khoản) và thẻ chia sẻ câu trả lời chưa có bản Anh (GĐ 9) → ẩn ở bản Anh. */}
      {t.van && !t.loi && !hd.en && (
        <div className="flex flex-wrap items-start gap-2" data-testid="hanh-dong-tra-loi">
          <NutLuu t={t} cauHoi={cauHoi} moDun={moDun} />
          <NutChiaSe ds={t.trucQuan} moDun={moDun} maMoi={maMoi ?? null} />
        </div>
      )}
      {tiep.length > 0 && (
        <div data-testid="hoi-tiep-chung">
          <p className="text-xs text-fg-muted">{hd.c("hoi_tiep")}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {tiep.map((c) => (
              <button key={c} type="button" disabled={dang} onClick={() => { ghi("chart_interacted", { mo_dun: moDun, kind: "hoi_tiep" }); hoi(c); }}
                className="min-h-10 rounded-full border border-gold/40 bg-gold/5 px-3.5 py-2 text-left text-sm text-fg transition-colors hover:border-gold disabled:opacity-50">
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      {t.sau && <div className="space-y-3" data-testid="sau-tra-loi">{t.sau}</div>}
    </div>
  );
  return (
    <div className="space-y-4">
      {t.loi && <p role="alert" className="rounded-xl bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">{t.loi}</p>}
      {t.phu}
      {coHinh ? (
        // Một cột trên điện thoại (hình trước, lời sau). Máy tính: khung ≥ ~46rem mới chia hai cột đều nhau, hình dính.
        <div className="space-y-4 lg:grid lg:items-start lg:gap-6 lg:space-y-0 lg:[grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]"
          data-testid="tra-loi-co-hinh">
          <div className="min-w-0 lg:sticky lg:top-[calc(6rem+var(--tm-h,0px))]"><TrucQuan ds={t.trucQuan} /></div>
          {loi}
        </div>
      ) : loi}
    </div>
  );
}

function nhayChuongBaoCao(moDun: string, chuong: string, maCau?: string) {
  ghi("sao_cta_clicked", { tu: maCau ? "chat_luan_hoi" : "chat_doi_song", mo_dun: moDun, chuong, ...(maCau ? { cau: maCau } : {}) });
  window.dispatchEvent(new CustomEvent("hbt:mo-chuong", { detail: { mo_dun: moDun, ma: chuong } }));
  const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const dich = document.getElementById(`lg-${chuong}`)
    ?? document.querySelector('[data-testid="lg-phan-khoa"]')
    ?? document.getElementById("luan-giai");
  dich?.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "start" });
}

/** D2 (Chặng 0) — hộp nhận định thẳng từ lá số (đồng bộ 100% nhãn với báo cáo 99 Sao; tôn trọng cổng SAO-2 khi chương khoá), kèm KiemChung nuôi DB 0017 & cầu nối mở chương. */
function HopLuanHoiChat({ lh, moDun }: { lh: LuanHoiChat; moDun: string }) {
  const hd = useChuHoiDap();
  const tyLe = useTyLe(lh.khoa ? [] : [lh.ma_mau]);
  if (lh.khoa) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-surface-2/50 p-4" data-testid="hoi-luan-hoi-khoa" data-ma={lh.ma}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
            <LockKeyhole className="size-3.5 shrink-0" aria-hidden />
            {hd.c("lh.tieu_de")}
          </span>
          <span data-muc={lh.sac} className="chip-muc inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
            {NHAN_MUC[lh.sac]}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-fg">{lh.cau}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{hd.c("lh.khoa_mo_ta", { chuong: lh.ten_chuong })}</p>
        <div className="mt-3 border-t border-line/50 pt-2.5">
          <button type="button" onClick={() => nhayChuongBaoCao(moDun, lh.chuong, lh.ma)} data-testid="hoi-luan-hoi-mo-chuong"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-gold underline-offset-4 hover:underline">
            <span>{hd.c("lh.khoa_nut", { chuong: lh.ten_chuong })}</span>
            <ArrowUpRight className="size-4 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gold/40 bg-surface-2/50 p-4" data-testid="hoi-luan-hoi" data-ma={lh.ma} data-nhan={lh.nhan}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">{hd.c("lh.tieu_de")}</span>
        <span data-muc={lh.sac} className="chip-muc inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
          {NHAN_MUC[lh.sac]}
        </span>
      </div>
      <p className="mt-2 text-xs text-fg-muted">{lh.cau}</p>
      <p className="mt-1.5 text-[1.05rem] font-medium leading-relaxed text-fg" data-testid="hoi-luan-hoi-tra-loi">{lh.tra_loi}</p>
      {lh.giai_thich && <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{lh.giai_thich}</p>}
      {lh.ghi_chu && <p className="mt-2 text-xs leading-relaxed text-fg-faint">{lh.ghi_chu}</p>}
      <div className="mt-3">
        <KiemChung loai="doi_song" mau={lh.ma_mau} phai={lh.phai} tyLe={tyLe[lh.ma_mau]} theoDoi={lh.cau} />
      </div>
      <div className="mt-2.5 border-t border-line/50 pt-2.5">
        <button type="button" onClick={() => nhayChuongBaoCao(moDun, lh.chuong, lh.ma)} data-testid="hoi-luan-hoi-mo-chuong"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-gold underline-offset-4 hover:underline">
          <span>{hd.c("lh.mo_chuong", { chuong: lh.ten_chuong })}</span>
          <ArrowUpRight className="size-4 shrink-0" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** Chặng 0 — với các câu mảng đời sống ngoài 27 câu `luan_hoi`, chỉ hiện KiemChung khi hộp mở & có tiêu đề rõ ràng; khi chương khoá chỉ hiện nút dẫn mở chương. */
function LienKetDoiSongChat({ lk, moDun }: { lk: DoiSongLienKetChat; moDun: string }) {
  const hd = useChuHoiDap();
  const tyLe = useTyLe(lk.khoa ? [] : [lk.ma_mau]);
  if (lk.khoa) {
    return (
      <div className="rounded-2xl border border-line/70 bg-surface/30 p-3.5" data-testid="hoi-doi-song-lien-ket-khoa">
        <button type="button" onClick={() => nhayChuongBaoCao(moDun, lk.chuong)} data-testid="hoi-doi-song-mo-chuong"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-gold underline-offset-4 hover:underline">
          <LockKeyhole className="size-3.5 shrink-0" aria-hidden />
          <span>{hd.c("lh.khoa_nut", { chuong: lk.ten_chuong })}</span>
          <ArrowUpRight className="size-4 shrink-0" aria-hidden />
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-line/70 bg-surface/30 p-3.5" data-testid="hoi-doi-song-lien-ket">
      {lk.tieu_de_hop && (
        <>
          <p className="mb-2 text-sm font-medium text-fg">{lk.tieu_de_hop}</p>
          <KiemChung loai="doi_song" mau={lk.ma_mau} phai={lk.phai} tyLe={tyLe[lk.ma_mau]} />
        </>
      )}
      <div className={cn(lk.tieu_de_hop && "mt-2.5 border-t border-line/50 pt-2.5")}>
        <button type="button" onClick={() => nhayChuongBaoCao(moDun, lk.chuong)} data-testid="hoi-doi-song-mo-chuong"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-gold underline-offset-4 hover:underline">
          <span>{hd.c("lh.ds_mo_chuong", { chuong: lk.ten_chuong })}</span>
          <ArrowUpRight className="size-4 shrink-0" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** Chặng 1 — hộp Gỡ Nút Đời Sống hai mặt (Sau ly hôn, Vợ chồng khắc khẩu, Góp vốn phân vai, Giải oan cách cục). */
function HopGoNutDoiSong({ gn }: { gn: GoNutDoiSongChat }) {
  const hd = useChuHoiDap();
  return (
    <div className="rounded-2xl border border-jade/35 bg-jade/5 p-4" data-testid="hoi-go-nut-doi-song" data-ma={gn.ma}>
      <p className="text-xs font-semibold uppercase tracking-wider text-jade">{hd.c("gn.nhan")}</p>
      <p className="mt-1 font-serif text-lg text-fg">{gn.tieu_de}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{gn.goc_nhin_hai_mat}</p>
      {gn.viec_thuc_te.length > 0 && (
        <div className="mt-2.5 border-t border-line/50 pt-2.5 text-xs leading-relaxed text-fg-muted">
          <p className="font-semibold text-fg">{hd.c("gn.viec")}</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {gn.viec_thuc_te.map((v) => <li key={v}>{v}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Ý 6 — lưu câu trả lời vào "Bài đã lưu" (chỉ người đã đăng nhập; tài khoản chưa bật trên site → ẩn sau lần thử đầu). */
function NutLuu({ t, cauHoi, moDun }: { t: KetQuaHoi; cauHoi?: string; moDun: string }) {
  const nguoi = useNguoiDung();
  const [trang, setTrang] = useState<"" | "dang" | "da" | "an">("");
  const [loi, setLoi] = useState<string | null>(null);
  // NT-1: đang xem lá số người thân → không lưu câu trả lời vào tài khoản người xem.
  const xemNguoiThan = useXemNguoiThan();
  if (!nguoi || trang === "an" || xemNguoiThan) return null;
  if (trang === "da") {
    return (
      <Button asChild size="sm" variant="ghost" data-testid="da-luu-tra-loi">
        <Link href="/ban-than/bai-da-luu"><BookmarkCheck aria-hidden /> Đã lưu · xem</Link>
      </Button>
    );
  }
  async function luu() {
    setTrang("dang"); setLoi(null);
    try {
      const r = await fetch("/api/luan-giai/luu", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mo_dun: moDun, tieu_de: `Hỏi đáp · ${(cauHoi ?? "").slice(0, 150) || "câu trả lời"}`,
          noi_dung: { loai: "hoi_dap", mo_dun: moDun, cau_hoi: cauHoi ?? "", cau_tra_loi: t.van ?? "", truc_quan: t.trucQuan ?? [],
            can_cu: t.canCu ?? [], ghi_chu: t.ghiChu ?? "" },
        }),
      });
      const d = (await r.json().catch(() => null)) as { ok?: boolean; ly_do?: string; id?: unknown; error?: string } | null;
      if (d?.ok === false && d.ly_do === "chua_bat") { setTrang("an"); return; }
      if (r.ok && d?.id != null) { setTrang("da"); ghi("chart_interacted", { mo_dun: moDun, kind: "luu_tra_loi" }); return; }
      setLoi(d?.error ?? "Chưa lưu được, bạn thử lại sau."); setTrang("");
    } catch { setLoi("Chưa lưu được, bạn thử lại sau."); setTrang(""); }
  }
  return (
    <span className="inline-flex flex-col">
      <Button size="sm" variant="secondary" onClick={() => void luu()} disabled={trang === "dang"} data-testid="luu-tra-loi"
        title="Lưu cả câu bạn hỏi và câu trả lời vào tài khoản của bạn — xoá được bất cứ lúc nào ở Bài đã lưu.">
        <BookmarkPlus aria-hidden /> Lưu
      </Button>
      <span className="mt-1 max-w-[14rem] text-[0.7rem] leading-snug text-fg-faint">Lưu cả câu bạn hỏi vào tài khoản của bạn, xoá được bất cứ lúc nào.</span>
      {loi && <span role="alert" className="mt-1 text-xs text-cinnabar">{loi}</span>}
    </span>
  );
}

/** Ý 2 — thẻ chia sẻ: lấy khối đầu tiên có câu hỏi chuẩn + dạng gọn hợp lệ; không có → không hiện nút. */
function NutChiaSe({ ds, moDun, maMoi: maCuaToi }: { ds?: KhoiTrucQuan[]; moDun: string; maMoi: string | null }) {
  const c = useChuChung();
  const [the, setThe] = useState<{ ma: string; tu: string; link: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  if (!laMangThe(moDun)) return null;
  const khoi = ds?.find((k) => (k as CoCauChuan).cau_chuan && tuKhoi(k));
  if (!khoi) return null;
  const cau = (khoi as CoCauChuan).cau_chuan!;
  const gon = tuKhoi(khoi)!;

  async function tao() {
    if (the) return;
    setDang(true); setLoi(null);
    try {
      const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/hoi", { mang: moDun, cau, khoi: gon });
      const u = new URL(`/the/hoi/${ma}`, window.location.origin);
      u.searchParams.set("tu", tu);
      if (maCuaToi) u.searchParams.set("gt", maCuaToi);
      setThe({ ma, tu, link: u.toString() });
      ghi("share_created", { kind: "hoi", ma_moi: tu, kieu: gon.t });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được thẻ.");
    } finally {
      setDang(false);
    }
  }
  return (
    <div className={cn("flex flex-col gap-2", the && "w-full")}>
      {!the && <NutRuBan nhan={dang ? c("chia_se.dang_tao") : CTA_CHIA_SE.hoi.nhan} nho dang={dang} onClick={() => void tao()} testId="chia-se-tra-loi" className="self-start" />}
      {loi && <p role="alert" className="text-xs text-cinnabar">{loi}</p>}
      {the && (
        <div className="w-full space-y-3 rounded-xl border border-gold/30 bg-gold/[0.05] p-3" data-testid="the-tra-loi">
          <p className="text-xs text-fg-muted">Thẻ chỉ có câu hỏi và hình — không ngày sinh, không lời trả lời. Người nhận bấm là hỏi được câu này về chính họ.</p>
          <BangGui kind="hoi" url={the.link} tu={the.tu} tieuDe="Hiểu Bản Thân" testIdLink="link-the-hoi" testIdAnh="tai-anh-the-hoi"
            anh={`/og/hoi?ma=${encodeURIComponent(the.ma)}`} anhDoc={`/og/hoi?ma=${encodeURIComponent(the.ma)}&khung=doc`} tenTep="cau-hoi-cua-toi.png"
            onLuuAnh={() => ghi("share_created", { kind: "hoi_anh", ma_moi: the.tu })} loiNhan={loiNhanThe("hoi", { ten: cau })} />
        </div>
      )}
    </div>
  );
}
