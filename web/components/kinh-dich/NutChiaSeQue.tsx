"use client";
// UI-KD 6 — "Chia sẻ quẻ" dưới kết quả: máy chủ đọc lại quẻ qua engine (6 giá trị hào, gieo tay) rồi ký mã (lib/ma-moi.ts
// kyMaQue — chỉ tên hiển thị, 6 giá trị, tên quẻ bản / biến, tên chủ đề; KHÔNG câu hỏi, KHÔNG giờ gieo, KHÔNG lời đọc).
// Link /the/que/<mã>?tu=qu.<…> đo referral_signup như các thẻ khác; ảnh /og/que (dọc) có mã QR + hieuban.com.
import { useState } from "react";
import { ChepTay, chepLink, guiHoacChep } from "@/components/chia-se/GuiLink";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { useChuChung } from "@/components/cms/ChuChung";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";
import type { GiaTriHao } from "@/lib/dong-xu";

export function NutChiaSeQue({ giaTri, chuDe, idSuffix = "" }: { giaTri: GiaTriHao[]; chuDe?: string | null; idSuffix?: string }) {
  const [mo, setMo] = useState(false);
  const [ten, setTen] = useState("");
  const [the, setThe] = useState<{ ma: string; tu: string; link: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const [chepLoi, setChepLoi] = useState(false);   // máy không cho chép tự động → nhắc chép tay từ ô link (không im lặng)
  const c = useChuChung();
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));
  const idTen = `que-ten${idSuffix}`;

  async function tao() {
    setDang(true); setLoi(null);
    try {
      const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/que",
        { gia_tri_hao: giaTri, ...(chuDe ? { chu_de: chuDe } : {}), ten_hien_thi: ten.trim() });
      const u = new URL(`/the/que/${ma}`, window.location.origin);
      u.searchParams.set("tu", tu);
      if (maCuaToi) u.searchParams.set("gt", maCuaToi);
      setThe({ ma, tu, link: u.toString() });
      ghi("share_created", { kind: "que", ma_moi: tu });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được thẻ.");
    } finally {
      setDang(false);
    }
  }
  async function chep() {
    if (!the) return;
    if ((await chepLink(the.link)) === "da_chep") { setChepLoi(false); setDaChep(true); setTimeout(() => setDaChep(false), 2000); }
    else setChepLoi(true);
  }
  async function chiaSe() {
    if (!the) return;
    const kq = await guiHoacChep({ title: "Quẻ của tôi", text: "Mình vừa gieo một quẻ Kinh Dịch — bạn thử gieo cho việc đang phân vân:", url: the.link });
    if (kq === "da_chep") { setChepLoi(false); setDaChep(true); setTimeout(() => setDaChep(false), 2000); }
    else setChepLoi(kq === "khong_duoc");
  }

  if (!mo) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setMo(true)} data-testid="mo-chia-se-que">
        <Share2 aria-hidden /> Chia sẻ quẻ
      </Button>
    );
  }
  return (
    <section className="w-full rounded-2xl border border-gold/30 bg-gold/[0.05] p-4" aria-label="Thẻ Quẻ của tôi" data-testid="chia-se-que">
      <h3 className="font-sans text-[1.02rem] font-semibold text-fg">Thẻ “Quẻ của tôi”</h3>
      {!the ? (
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5 sm:max-w-xs">
            <Label htmlFor={idTen}>Tên trên thẻ (không bắt buộc)</Label>
            <Input id={idTen} value={ten} maxLength={24} placeholder="Bạn" onChange={(e) => setTen(e.target.value)} />
          </div>
          <p className="text-xs text-fg-faint">Thẻ chỉ có tên bạn gõ, sáu vạch quẻ, tên quẻ và chủ đề — không có câu hỏi, giờ gieo hay lời đọc. Hết hạn sau 90 ngày.</p>
          {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
          <Button onClick={() => void tao()} disabled={dang} data-testid="tao-the-que"><Share2 aria-hidden /> {dang ? c("chia_se.dang_tao") : "Tạo thẻ"}</Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={the.link} aria-label="Link thẻ quẻ" onFocus={(e) => e.currentTarget.select()} className="text-sm" data-testid="link-the-que" />
            <Button variant="secondary" size="icon" onClick={() => void chep()} aria-label={c("chia_se.chep_link")}>{daChep ? <Check aria-hidden /> : <Copy aria-hidden />}</Button>
          </div>
          {chepLoi && <ChepTay />}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void chiaSe()}><Share2 aria-hidden /> {c("chia_se.gui")}</Button>
            <Button asChild size="sm" variant="outline">
              <a href={`/og/que?ma=${encodeURIComponent(the.ma)}&khung=doc`} download="que-cua-toi.png" data-testid="tai-anh-the-que"
                onClick={() => ghi("share_created", { kind: "que_anh", ma_moi: the.tu })}>
                <Download aria-hidden /> {c("chia_se.tai_story")}
              </a>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
