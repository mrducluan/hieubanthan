"use client";
// HCS-1 — khung chung cho thẻ cần máy chủ ký mã từ kết quả vừa xem (hai người, nhà, quẻ, trải bài…): MỘT chạm mở khung là
// thẻ được tạo ngay (tên trên thẻ để trống = "Bạn"), tên sửa sau rồi bấm "Cập nhật tên" để ký lại. Phần gửi là `BangGui`
// dùng chung — ảnh xem trước, lời nhắn soạn sẵn, kênh Zalo / Messenger / Facebook / Gửi ảnh.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BangGui, NutRuBan, type BangGuiProps } from "@/components/chia-se/HopChiaSe";

export interface TheDaTao { ma: string; tu: string; link: string }

export function KhungTaoThe({ moTestId, nhanNut, phuNut, nho, tieuDe, idTen, nhanTen, ghiChu, taoTestId, tao, daGui, bangGui, children, className = "" }: {
  moTestId: string; nhanNut: string; phuNut?: string; nho?: boolean;
  tieuDe: string; idTen: string; nhanTen: string; ghiChu: ReactNode; taoTestId: string;
  /** Ký mã thẻ với tên người dùng gõ (có thể rỗng). Ném lỗi kèm câu cho người dùng. */
  tao: (ten: string) => Promise<TheDaTao>;
  /** Đo share_created cho đúng thẻ người dùng GỬI (lần bấm kênh đầu tiên) — thẻ tạo sẵn rồi đổi tên không đếm hai lần. */
  daGui: (the: TheDaTao) => void;
  bangGui: (the: TheDaTao) => Omit<BangGuiProps, "url" | "tu" | "children">;
  children?: ReactNode; className?: string;
}) {
  const [mo, setMo] = useState(false);
  const [ten, setTen] = useState("");
  const [the, setThe] = useState<TheDaTao | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const luot = useRef(0);

  async function chay(t: string) {
    const so = ++luot.current;
    setDang(true); setLoi(null); setThe(null);
    try {
      const kq = await tao(t.trim());
      if (so === luot.current) setThe(kq);
    } catch (e) {
      if (so === luot.current) setLoi(e instanceof Error ? e.message : "Chưa tạo được thẻ.");
    } finally {
      if (so === luot.current) setDang(false);
    }
  }
  // Mở khung = tạo thẻ luôn (một chạm).
  useEffect(() => { if (mo && !the && !dang && !loi && luot.current === 0) void chay(""); }, [mo]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!mo) return <NutRuBan nhan={nhanNut} phu={phuNut} nho={nho} onClick={() => setMo(true)} testId={moTestId} className={className} />;

  return (
    <section className={`w-full space-y-4 rounded-2xl border border-gold/30 bg-gold/[0.04] p-4 ${className}`} aria-label={tieuDe} data-testid={moTestId.replace(/^mo-/, "")}>
      <h3 className="font-sans text-[1.02rem] font-semibold text-fg">{tieuDe}</h3>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-xs">
          <Label htmlFor={idTen}>{nhanTen}</Label>
          <Input id={idTen} value={ten} maxLength={24} placeholder="Bạn" onChange={(e) => setTen(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={() => void chay(ten)} disabled={dang} data-testid={taoTestId}>
          {dang ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />} Cập nhật tên
        </Button>
      </div>
      <p className="text-xs text-fg-faint">{ghiChu}</p>
      {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
      {dang && !the && <p role="status" className="flex items-center gap-2 text-sm text-fg-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Đang tạo thẻ…</p>}
      {the && <BangGui key={the.ma} {...bangGui(the)} url={the.link} tu={the.tu} onGuiDau={() => daGui(the)}>{children}</BangGui>}
    </section>
  );
}
