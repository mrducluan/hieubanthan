"use client";
// HCS-1 — MỘT giao diện chia sẻ cho mọi thẻ và mọi trang (docs/HOP-CHIA-SE.md):
//  · `BangGui` — phần gửi: ảnh xem trước (đúng ảnh bạn bè thấy khi nhận link) · chọn lời nhắn soạn sẵn theo thẻ / trang ·
//    kênh gửi xếp theo nơi người dùng đứng (Zalo, Messenger, Facebook, Gửi ảnh, Chép, Lưu ảnh, Khác) · ô link + Chép.
//  · `HopGui` — `BangGui` trong hộp trượt (Sheet) cho các nút một chạm (thẻ ngày, xông đất, huy hiệu, trang công khai).
//  · `NutRuBan` — nút mời chia sẻ chung (viền vàng + vệt sáng, dòng phụ nói rõ thẻ KHÔNG có gì riêng tư).
// "Gửi ảnh" gửi thẳng TỆP ảnh dọc qua hộp chia sẻ của máy (Zalo, Messenger, Story) — tệp được tải sẵn lúc hộp mở để lần bấm
// vẫn còn là "cú bấm của người dùng" (Safari mất quyền chia sẻ nếu chờ mạng sau khi bấm). Trình duyệt trong app không lưu được
// ảnh bằng <a download> → nhắc "nhấn giữ ảnh để lưu". Không SDK bên thứ ba; Facebook mở link chia sẻ công khai ở tab mới.
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Download, ImageUp, Loader2, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChepTay, chepLink } from "@/components/chia-se/GuiLink";
import { ghi } from "@/lib/do-luong";
import { appNhung, type AppNhung } from "@/lib/trinh-duyet-nhung";
import { ghepLoiNhan, laDienThoai, thuTuKenh, urlFacebook, urlMessenger, type Kenh } from "@/lib/kenh-chia-se";
import type { LoiNhan } from "@/lib/loi-nhan-chia-se";

export interface BangGuiProps {
  /** Mã loại cho đo lường (share_target{kind}). */
  kind: string;
  /** Link gửi đi (đã gắn ?tu=, ?gt=). */
  url: string;
  /** Mã ?tu= của link (đo). */
  tu?: string | null;
  /** Ảnh ngang 1200×630 — đúng ảnh hiện khi dán link vào Zalo / Messenger. */
  anh?: string | null;
  /** Ảnh dọc 1080×1350 có QR — để gửi tệp / lưu đăng story. Thiếu → dùng ảnh ngang. */
  anhDoc?: string | null;
  tenTep?: string;
  /** Tiêu đề cho hộp chia sẻ của máy. */
  tieuDe: string;
  loiNhan: LoiNhan[];
  testIdLink?: string;
  testIdAnh?: string;
  /** Đo thêm khi lưu ảnh (giữ sự kiện cũ share_created{kind: …_anh}). */
  onLuuAnh?: () => void;
  /** Gọi MỘT lần khi người dùng bấm kênh gửi / chép / lưu ảnh đầu tiên (thẻ tạo sẵn mà không gửi thì không tính là đã chia sẻ). */
  onGuiDau?: () => void;
  /** Dòng thưởng mời, quyền riêng tư… đặt dưới cùng. */
  children?: ReactNode;
}

const NHAN_KENH: Record<Kenh, string> = {
  zalo: "Zalo", messenger: "Messenger", facebook: "Facebook", anh: "Gửi ảnh", chep: "Chép lời nhắn + link", luu_anh: "Lưu ảnh", khac: "Ứng dụng khác",
};

function BieuTuong({ k }: { k: Kenh }) {
  const vong = "flex size-8 shrink-0 items-center justify-center rounded-full text-white";
  switch (k) {
    case "zalo": return <span className={`${vong} bg-[#0068FF] text-[0.62rem] font-bold tracking-tight`} aria-hidden>Zalo</span>;
    case "messenger": return <span className={`${vong} bg-gradient-to-br from-[#0099FF] via-[#A033FF] to-[#FF5280]`} aria-hidden><MessageCircle className="size-4" /></span>;
    case "facebook": return <span className={`${vong} bg-[#1877F2] font-serif text-lg font-bold`} aria-hidden>f</span>;
    case "anh": return <span className={`${vong} bg-gold text-ink`} aria-hidden><ImageUp className="size-4" /></span>;
    case "chep": return <span className={`${vong} bg-surface-2 text-fg`} aria-hidden><Copy className="size-4" /></span>;
    case "luu_anh": return <span className={`${vong} bg-surface-2 text-fg`} aria-hidden><Download className="size-4" /></span>;
    case "khac": return <span className={`${vong} bg-surface-2 text-fg`} aria-hidden><Share2 className="size-4" /></span>;
  }
}

/** Tải sẵn ảnh dọc thành tệp để gửi qua hộp chia sẻ của máy. Không gửi được tệp → null. */
function useTepAnh(src: string | null | undefined, ten: string): File | null {
  const [tep, setTep] = useState<File | null>(null);
  useEffect(() => {
    setTep(null);
    if (!src || typeof navigator === "undefined" || typeof navigator.canShare !== "function") return;
    const ctrl = new AbortController();
    fetch(src, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (!b) return;
        const f = new File([b], ten, { type: b.type || "image/png" });
        try { if (navigator.canShare({ files: [f] })) setTep(f); } catch { /* máy không gửi được tệp */ }
      })
      .catch(() => { /* bỏ: vẫn còn các kênh khác */ });
    return () => ctrl.abort();
  }, [src, ten]);
  return tep;
}

export function BangGui({ kind, url, tu, anh, anhDoc, tenTep = "hieu-ban-than.png", tieuDe, loiNhan, testIdLink = "link-chia-se",
  testIdAnh = "luu-anh-chia-se", onLuuAnh, onGuiDau, children }: BangGuiProps) {
  const [chon, setChon] = useState(0);
  const [sua, setSua] = useState<string | null>(null);   // người dùng sửa lời → dùng chữ của họ
  const [moLoi, setMoLoi] = useState(false);
  const [bao, setBao] = useState<string | null>(null);
  const [chepTay, setChepTay] = useState<string | null>(null);
  const [daChepLink, setDaChepLink] = useState(false);
  const [moiTruong, setMoiTruong] = useState<{ dienThoai: boolean; app: AppNhung; coShare: boolean }>({ dienThoai: false, app: null, coShare: false });
  const daDo = useRef(false);
  const daGui = useRef(false);
  const anhGui = anhDoc ?? anh ?? null;
  const tep = useTepAnh(anhGui, tenTep);

  useEffect(() => {
    const ua = navigator.userAgent;
    setMoiTruong({ dienThoai: laDienThoai(ua), app: appNhung(ua), coShare: typeof navigator.share === "function" });
    if (!daDo.current) { daDo.current = true; ghi("share_sheet_opened", { kind, ma_moi: tu ?? undefined }); }
  }, [kind, tu]);

  const loi = loiNhan[Math.min(chon, loiNhan.length - 1)] ?? { ma: "chung", chu: "" };
  const chu = sua ?? loi.chu;
  const kenh = useMemo(() => thuTuKenh({ dienThoai: moiTruong.dienThoai, app: moiTruong.app, coGuiTep: Boolean(tep), coAnh: Boolean(anhGui) }),
    [moiTruong, tep, anhGui]);

  function baoTam(s: string) { setBao(s); window.setTimeout(() => setBao((x) => (x === s ? null : x)), 4000); }
  function doKenh(k: Kenh, ket: string) {
    if (!daGui.current) { daGui.current = true; onGuiDau?.(); }
    ghi("share_target", { kind, kenh: k, ket_qua: ket, bien_the: sua ? "sua" : loi.ma, ma_moi: tu ?? undefined });
  }

  async function chepChu(k: Kenh, thongBao: string) {
    const toanBo = ghepLoiNhan(chu, url);
    const kq = await chepLink(toanBo);
    if (kq === "da_chep") { setChepTay(null); baoTam(thongBao); } else setChepTay(toanBo);
    doKenh(k, kq);
  }

  async function chiaSeMay(k: Kenh, files?: File[]) {
    try {
      await navigator.share(files ? { files, title: tieuDe, text: ghepLoiNhan(chu, url) } : { title: tieuDe, text: chu, url });
      doKenh(k, "da_gui");
    } catch (e) {
      if ((e as { name?: string } | null)?.name === "AbortError") { doKenh(k, "huy"); return; }
      await chepChu(k, "Máy chưa mở được hộp chia sẻ — đã chép lời nhắn và link, bạn dán vào ứng dụng muốn gửi.");
    }
  }

  async function bam(k: Kenh) {
    switch (k) {
      case "zalo":
        if (moiTruong.coShare) return chiaSeMay(k);
        return chepChu(k, "Đã chép lời nhắn và link — mở Zalo rồi dán vào cuộc trò chuyện.");
      case "messenger":
        // Messenger chỉ nhận link → chép lời nhắn trước để người gửi dán thêm nếu muốn.
        await chepLink(chu);
        doKenh(k, "mo_app");
        window.location.href = urlMessenger(url);
        return;
      case "facebook":
        doKenh(k, "mo_tab");
        window.open(urlFacebook(url), "_blank", "noopener,noreferrer,width=640,height=600");
        return;
      case "anh":
        if (tep) return chiaSeMay(k, [tep]);
        return;
      case "chep":
        return chepChu(k, "Đã chép lời nhắn và link.");
      case "khac":
        if (moiTruong.coShare) return chiaSeMay(k);
        return chepChu(k, "Đã chép lời nhắn và link.");
      default:
        return;
    }
  }

  async function chepChiLink() {
    const kq = await chepLink(url);
    if (kq === "da_chep") { setChepTay(null); setDaChepLink(true); window.setTimeout(() => setDaChepLink(false), 2000); } else setChepTay(url);
    doKenh("chep", `link_${kq}`);
  }

  return (
    <div className="space-y-4" data-testid="bang-gui" data-kind={kind}>
      {anh && (
        <figure className="space-y-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh /og động, không qua bộ tối ưu ảnh */}
          <img src={anh} alt="Ảnh bạn bè sẽ thấy khi nhận link" width={1200} height={630} loading="eager"
            className="mx-auto aspect-[1200/630] w-full max-w-[22rem] rounded-xl border border-line bg-surface-2 object-cover sm:max-w-none" data-testid="xem-truoc-chia-se" />
          <figcaption className="text-xs text-fg-faint">
            Bạn bè sẽ thấy ảnh này khi nhận link — không có ngày sinh của bạn.
            {moiTruong.dienThoai && !tep ? " Nhấn giữ ảnh để lưu." : ""}
          </figcaption>
        </figure>
      )}

      {loiNhan.length > 0 && (
        // Lời đang chọn hiện gọn ngay trên các nút gửi; "Đổi lời nhắn" mở danh sách — kênh gửi luôn nằm trong màn đầu điện thoại.
        <fieldset className="space-y-2">
          <legend className="flex w-full items-center justify-between gap-2 text-sm font-medium text-fg">
            <span>Lời nhắn gửi kèm</span>
            {sua === null && (
              <span className="flex gap-3 text-xs font-normal">
                {loiNhan.length > 1 && (
                  <button type="button" className="text-gold hover:underline" aria-expanded={moLoi} onClick={() => setMoLoi((x) => !x)} data-testid="doi-loi-nhan">
                    {moLoi ? "Thu gọn" : `Đổi lời (${loiNhan.length})`}
                  </button>
                )}
                <button type="button" className="text-gold hover:underline" onClick={() => { setSua(loi.chu); setMoLoi(false); }} data-testid="sua-loi-nhan">Sửa</button>
              </span>
            )}
          </legend>
          {sua !== null ? (
            <textarea value={sua} maxLength={280} rows={3} onChange={(e) => setSua(e.target.value)} aria-label="Lời nhắn của bạn"
              className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-fg focus:border-gold focus:outline-none" data-testid="o-loi-nhan" />
          ) : (
            <div className="space-y-1.5" role="radiogroup" aria-label="Chọn lời nhắn">
              {loiNhan.map((l, i) => (moLoi || chon === i) && (
                <label key={l.ma} className={`flex cursor-pointer gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  chon === i ? "border-gold/60 bg-gold/[0.07] text-fg" : "border-line text-fg-muted hover:border-gold/40"}`}>
                  <input type="radio" name={`loi-nhan-${kind}`} className="mt-1 accent-[rgb(var(--gold))]" checked={chon === i}
                    onChange={() => { setChon(i); setMoLoi(false); }} data-testid={`loi-nhan-${i}`} />
                  <span>{l.chu}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      <div className="grid grid-cols-2 gap-2" data-testid="kenh-gui">
        {kenh.map((k) => k === "luu_anh" && anhGui ? (
          <a key={k} href={anhGui} download={tenTep} onClick={() => { doKenh(k, "tai"); onLuuAnh?.(); }} data-testid={testIdAnh}
            className="flex min-h-12 items-center gap-2.5 rounded-xl border border-line bg-surface-2/40 px-3 py-2 text-sm font-medium text-fg hover:border-gold/50">
            <BieuTuong k={k} /> {NHAN_KENH[k]}
          </a>
        ) : (
          <button key={k} type="button" onClick={() => void bam(k)} data-testid={`kenh-${k}`}
            className={`flex min-h-12 items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm font-medium text-fg hover:border-gold/50 ${
              k === kenh[0] ? "border-gold/50 bg-gold/[0.06]" : "border-line bg-surface-2/40"}`}>
            <BieuTuong k={k} /> {NHAN_KENH[k]}
          </button>
        ))}
      </div>
      {bao && <p role="status" className="flex items-center gap-1.5 text-sm text-jade" data-testid="bao-chia-se"><Check className="size-4" aria-hidden /> {bao}</p>}
      {chepTay && <ChepTay url={chepTay} />}

      <div className="flex gap-2">
        <Input readOnly value={url} aria-label="Link chia sẻ" onFocus={(e) => e.currentTarget.select()} className="text-sm" data-testid={testIdLink} />
        <Button variant="secondary" onClick={() => void chepChiLink()} className="shrink-0" data-testid="chep-link-chia-se">
          {daChepLink ? <Check aria-hidden /> : <Copy aria-hidden />}{daChepLink ? "Đã chép" : "Chép link"}
        </Button>
      </div>
      {children}
    </div>
  );
}

/** Hộp trượt chứa `BangGui` — cho nút một chạm. `gui` null trong lúc máy chủ ký link. */
export function HopGui({ mo, onMoChange, tieuDeHop, moTa, dang, loi, gui, children }: {
  mo: boolean; onMoChange: (mo: boolean) => void; tieuDeHop: string; moTa?: string; dang?: boolean; loi?: string | null;
  gui: BangGuiProps | null; children?: ReactNode;
}) {
  return (
    <Sheet open={mo} onOpenChange={onMoChange}>
      <SheetContent title={tieuDeHop} description={moTa} data-testid="hop-chia-se">
        {gui ? <BangGui {...gui}>{children}</BangGui> : loi ? (
          <p role="alert" className="text-sm text-cinnabar">{loi}</p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-fg-muted" role="status">
            <Loader2 className={`size-4 ${dang ? "animate-spin" : ""}`} aria-hidden /> Đang chuẩn bị thẻ…
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Nút mời chia sẻ chung: viền vàng, vệt sáng (tắt khi giảm chuyển động — .nut-sang), dòng phụ nói rõ thẻ có gì / không có gì. */
export function NutRuBan({ nhan, phu, onClick, dang, testId, nho = false, className = "" }: {
  nhan: string; phu?: string; onClick: () => void; dang?: boolean; testId?: string; nho?: boolean; className?: string;
}) {
  // Tên nút cho trình đọc màn hình = chính nhãn; dòng phụ là mô tả (aria-describedby).
  const idPhu = useId();
  const coPhu = Boolean(phu && !nho);
  return (
    <button type="button" onClick={onClick} disabled={dang} data-testid={testId} aria-label={nhan} aria-describedby={coPhu ? idPhu : undefined}
      className={`nut-sang group inline-flex max-w-full items-center gap-3 rounded-2xl border border-gold/60 bg-gold/[0.08] text-left
        text-fg shadow-[0_8px_30px_-12px_rgb(var(--gold)/0.55)] transition-colors hover:bg-gold/[0.14] disabled:opacity-70
        ${nho ? "min-h-10 px-3 py-1.5" : "min-h-12 px-4 py-2.5"} ${className}`}>
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-gold text-ink ${nho ? "size-7" : "size-9"}`} aria-hidden>
        {dang ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
      </span>
      <span className="min-w-0">
        <span className={`block font-semibold ${nho ? "text-sm" : "text-[0.95rem]"}`}>{nhan}</span>
        {coPhu && <span id={idPhu} className="block text-xs font-normal text-fg-muted">{phu}</span>}
      </span>
    </button>
  );
}
