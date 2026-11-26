"use client";
// LX-2027 — "Quay video Story 9:16 có pháo hoa": vẽ + ghi tại máy bằng canvas/MediaRecorder (lib/li-xi-video.ts), xem trước ngay,
// rồi Lưu / Chia sẻ. Video không rời máy. Trình duyệt trong app (Zalo, Facebook) thường không quay được → hướng dẫn mở bằng trình duyệt.
import { useEffect, useRef, useState } from "react";
import { Download, Film, Loader2, RotateCw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { hoTroQuayVideo, quayVideoLiXi, type KetQuaVideo } from "@/lib/li-xi-video";
import type { HoaTietTet, MauThiep } from "@/lib/li-xi-tet";

interface Props {
  mau: MauThiep;
  hoa: HoaTietTet;
  nenGam: boolean;
  tenNguoiTang?: string | null;
  loiChuc: string;
  /** Nơi bấm (để đo): trang mua / trang nhận bao. */
  nguon: "mua" | "nhan";
}

export function NutVideoLiXi({ mau, hoa, nenGam, tenNguoiTang, loiChuc, nguon }: Props) {
  const [duoc, setDuoc] = useState<boolean | null>(null);
  const [dang, setDang] = useState(false);
  const [tienDo, setTienDo] = useState(0);
  const [kq, setKq] = useState<{ ket: KetQuaVideo; url: string } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [kemTieng, setKemTieng] = useState(true);
  const urlRef = useRef<string | null>(null);

  useEffect(() => { setDuoc(hoTroQuayVideo()); }, []);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  async function quay() {
    setLoi(null); setDang(true); setTienDo(0);
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    setKq(null);
    try {
      const ket = await quayVideoLiXi({ mau, hoa, nenGam, tenNguoiTang, loiChuc, kemTieng, onTienDo: setTienDo });
      const url = URL.createObjectURL(ket.blob);
      urlRef.current = url;
      setKq({ ket, url });
      ghi("share_created", { kind: "li_xi_video", nguon, mau_thiep: mau, dinh_dang: ket.duoi, co_tieng: ket.coTieng });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa quay được video, bạn thử lại nhé.");
    } finally {
      setDang(false);
    }
  }

  const tenTep = `li-xi-tet-2027-story.${kq?.ket.duoi ?? "mp4"}`;
  async function chiaSe() {
    if (!kq) return;
    const tep = new File([kq.ket.blob], tenTep, { type: kq.ket.mime });
    try {
      if (navigator.canShare?.({ files: [tep] })) { await navigator.share({ files: [tep], title: "LÌ XÌ TẾT 2027" }); ghi("share_clicked", { kind: "li_xi_video", kenh: "share" }); }
    } catch { /* người dùng đóng hộp chia sẻ */ }
  }

  if (duoc === null) return null;
  if (!duoc) {
    return (
      <p className="rounded-xl border border-line/60 bg-bg-2/40 p-3 text-[11px] leading-relaxed text-fg-muted" data-testid="lx-video-khong-ho-tro">
        <Film className="mr-1 inline size-3.5 text-gold" aria-hidden />
        Quay video Story cần mở trang bằng Chrome hoặc Safari (trình duyệt trong Zalo / Facebook chưa quay được). Bạn vẫn tải ảnh Story ở trên.
      </p>
    );
  }
  return (
    <div className="space-y-2.5" data-testid="lx-video">
      {!kq && !dang && (
        <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-fg-muted">
          <input type="checkbox" checked={kemTieng} onChange={(e) => setKemTieng(e.target.checked)} className="mt-0.5 accent-[var(--gold,#e9c46a)]" data-testid="lx-video-tieng" />
          <span>Kèm tiếng pháo hoa và giai điệu Năm mới (tạo tại máy bạn, không dùng bản thu của ai). Nếu trình duyệt không ghi được âm thanh, video vẫn có hình như thường.</span>
        </label>
      )}
      {!kq && (
        <Button type="button" variant="secondary" className="w-full" onClick={() => void quay()} disabled={dang} data-testid="lx-nut-quay-video">
          {dang ? <Loader2 className="animate-spin" aria-hidden /> : <Film aria-hidden className="text-gold" />}
          {dang ? `Đang quay video… ${tienDo}%` : "Quay video Story 9:16 có pháo hoa"}
        </Button>
      )}
      {dang && (
        <div className="space-y-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-line/50" role="progressbar" aria-valuenow={tienDo} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gold transition-[width] duration-200" style={{ width: `${tienDo}%` }} />
          </div>
          <p className="text-[11px] text-fg-muted">Khoảng 10 giây, bạn giữ nguyên tab này nhé (chuyển tab video sẽ bị đứng hình).</p>
        </div>
      )}
      {loi && <p className="text-xs text-cinnabar" role="alert">{loi}</p>}
      {kq && (
        <div className="space-y-2.5">
          <video src={kq.url} controls playsInline loop autoPlay muted className="mx-auto aspect-[9/16] max-h-[420px] w-auto rounded-2xl border border-gold/40 bg-black shadow-xl" data-testid="lx-video-xem" />
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild size="sm"><a href={kq.url} download={tenTep} onClick={() => ghi("share_clicked", { kind: "li_xi_video", kenh: "tai" })}><Download className="size-3.5" aria-hidden /> Lưu video</a></Button>
            {typeof navigator !== "undefined" && typeof navigator.canShare === "function" && (
              <Button size="sm" variant="secondary" onClick={() => void chiaSe()}><Share2 className="size-3.5" aria-hidden /> Chia sẻ</Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => void quay()} disabled={dang}><RotateCw className="size-3.5" aria-hidden /> Quay lại</Button>
          </div>
          <p className="text-center text-[11px] text-fg-faint">Video chỉ nằm trên máy bạn, chưa tải lên đâu. Đăng Story hay gửi Zalo là xong.</p>
        </div>
      )}
    </div>
  );
}
