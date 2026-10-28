"use client";
// HD-CS đợt 3 — một câu trả lời trong khung "Hỏi đáp chuyên sâu".
//  · Ý 3: chữ trong lời trả lời ↔ hình (ChieuSang, mỗi câu trả lời một vùng riêng).
//  · Ý 5: máy tính đủ rộng → hai cột: hình dính bên trái, lời bên phải (cột tự co về một cột khi khung hẹp, vd Kinh Dịch).
//  · Ý 6: "Lưu" vào Bài đã lưu (bảng luan_giai_luu — chỉ khi người dùng bấm, RLS chủ sở hữu, xoá được, hết hạn 12 tháng).
//  · Ý 2: "Chia sẻ" thẻ câu trả lời (lib/the-hoi.ts — chỉ dữ liệu danh mục cố định + câu hỏi chuẩn, không câu gõ / ngày sinh).
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BookmarkCheck, BookmarkPlus, Check, Copy, Download, Info, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useNguoiDung } from "@/lib/tai-khoan";
import { laMangThe, tuKhoi } from "@/lib/the-hoi";
import { ChepTay, chepLink, guiHoacChep } from "@/components/chia-se/GuiLink";
import { useChuChung } from "@/components/cms/ChuChung";
import { doanCoThuatNgu, KhungGiaiNghia } from "@/components/hoi/ThuatNgu";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { KIEU_BIET, TrucQuan, type CoCauChuan, type KhoiTrucQuan } from "@/components/hoi/TrucQuan";
import { banDoKhop, useChieuSang, VungChieuSang } from "@/components/hoi/ChieuSang";
import type { KetQuaHoi } from "@/components/hoi/KhungChat";

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
  const theo = banDoKhop(t.trucQuan);
  const coHinh = !!t.trucQuan?.some((k) => KIEU_BIET.has(k.kieu));
  const tiep = (t.hoiTiep ?? []).filter((c) => !daHoi.includes(c));
  const loi: ReactNode = (
    <div className="min-w-0 space-y-4">
      {t.van && (
        <div className="prose-vn text-[1.05rem] leading-[1.75] text-fg">
          {doanCoThuatNgu(t.van, t.thuatNgu, undefined, theo.size ? {
            theo, bam: (id) => { chieu(id); ghi("chart_interacted", { mo_dun: moDun, kind: "chu_sang_hinh" }); },
          } : undefined)}
        </div>
      )}
      {t.van && theo.size > 0 && <p className="text-xs text-fg-faint">Chữ gạch xanh: bấm để xem trên hình.</p>}
      {t.van && <ViSao canCu={t.canCu} thuatNgu={t.thuatNgu} />}
      <KhungGiaiNghia ds={t.thuatNgu} />
      {t.canhBao?.map((c) => (
        <p key={c} className="flex gap-2 rounded-xl bg-moon/10 px-3 py-2 text-xs text-moon"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {c}</p>
      ))}
      {t.ghiChu && <p className="text-xs text-fg-faint">{t.ghiChu}</p>}
      {t.ghiLuot && <p className="text-xs text-gold" data-testid="ghi-luot">{t.ghiLuot}</p>}
      {t.van && !t.loi && (
        <div className="flex flex-wrap items-start gap-2" data-testid="hanh-dong-tra-loi">
          <NutLuu t={t} cauHoi={cauHoi} moDun={moDun} />
          <NutChiaSe ds={t.trucQuan} moDun={moDun} maMoi={maMoi ?? null} />
        </div>
      )}
      {tiep.length > 0 && (
        <div data-testid="hoi-tiep-chung">
          <p className="text-xs text-fg-muted">Hỏi tiếp</p>
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
          <div className="min-w-0 lg:sticky lg:top-24"><TrucQuan ds={t.trucQuan} /></div>
          {loi}
        </div>
      ) : loi}
    </div>
  );
}

/** Ý 6 — lưu câu trả lời vào "Bài đã lưu" (chỉ người đã đăng nhập; tài khoản chưa bật trên site → ẩn sau lần thử đầu). */
function NutLuu({ t, cauHoi, moDun }: { t: KetQuaHoi; cauHoi?: string; moDun: string }) {
  const nguoi = useNguoiDung();
  const [trang, setTrang] = useState<"" | "dang" | "da" | "an">("");
  const [loi, setLoi] = useState<string | null>(null);
  if (!nguoi || trang === "an") return null;
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
  const [daChep, setDaChep] = useState(false);
  const [chepLoi, setChepLoi] = useState(false);
  if (!laMangThe(moDun)) return null;
  const khoi = ds?.find((k) => (k as CoCauChuan).cau_chuan && tuKhoi(k));
  if (!khoi) return null;
  const cau = (khoi as CoCauChuan).cau_chuan!;
  const gon = tuKhoi(khoi)!;

  async function guiLink(link: string) {
    const kq = await guiHoacChep({ title: "Hiểu Bản Thân", text: `Mình vừa hỏi “${cau}” — bạn hỏi thử câu này về chính bạn:`, url: link });
    if (kq === "da_chep") { setChepLoi(false); setDaChep(true); setTimeout(() => setDaChep(false), 2000); }
    else setChepLoi(kq === "khong_duoc");
  }
  async function tao() {
    if (the) { await guiLink(the.link); return; }
    setDang(true); setLoi(null);
    try {
      const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/hoi", { mang: moDun, cau, khoi: gon });
      const u = new URL(`/the/hoi/${ma}`, window.location.origin);
      u.searchParams.set("tu", tu);
      if (maCuaToi) u.searchParams.set("gt", maCuaToi);
      setThe({ ma, tu, link: u.toString() });
      ghi("share_created", { kind: "hoi", ma_moi: tu, kieu: gon.t });
      await guiLink(u.toString());
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được thẻ.");
    } finally {
      setDang(false);
    }
  }
  return (
    <div className={cn("flex flex-col gap-2", the && "w-full")}>
      <Button size="sm" variant="secondary" onClick={() => void tao()} disabled={dang} data-testid="chia-se-tra-loi" className="self-start">
        <Share2 aria-hidden /> {dang ? c("chia_se.dang_tao") : "Chia sẻ"}
      </Button>
      {loi && <p role="alert" className="text-xs text-cinnabar">{loi}</p>}
      {the && (
        <div className="w-full space-y-2 rounded-xl border border-gold/30 bg-gold/[0.05] p-3" data-testid="the-tra-loi">
          <p className="text-xs text-fg-muted">Thẻ chỉ có câu hỏi và hình — không ngày sinh, không lời trả lời. Người nhận bấm là hỏi được câu này về chính họ.</p>
          <div className="flex gap-2">
            <Input readOnly value={the.link} aria-label="Link thẻ câu trả lời" onFocus={(e) => e.currentTarget.select()} className="text-sm" data-testid="link-the-hoi" />
            <Button variant="secondary" size="icon" aria-label={c("chia_se.chep_link")}
              onClick={async () => { if ((await chepLink(the.link)) === "da_chep") { setDaChep(true); setTimeout(() => setDaChep(false), 2000); } else setChepLoi(true); }}>
              {daChep ? <Check aria-hidden /> : <Copy aria-hidden />}
            </Button>
          </div>
          {chepLoi && <ChepTay />}
          <Button asChild size="sm" variant="outline">
            <a href={`/og/hoi?ma=${encodeURIComponent(the.ma)}&khung=doc`} download="cau-hoi-cua-toi.png"
              onClick={() => ghi("share_created", { kind: "hoi_anh", ma_moi: the.tu })}>
              <Download aria-hidden /> {c("chia_se.tai_story")}
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
