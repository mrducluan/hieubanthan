"use client";
// UI-PT2 P7 — "Chia sẻ thẻ nhà" dưới bài đọc "Nhà của bạn": máy chủ đọc lại qua engine rồi ký mã (lib/ma-moi.ts kyMaNha —
// chỉ tên hiển thị, hướng 8, loại nhà, mức và ≤ 6 phòng; KHÔNG địa chỉ / toạ độ / độ la bàn / năm xây / năm sinh).
// Link /the/nha/<mã>?tu=nh.<…> đo referral_signup như các thẻ khác; ảnh /og/nha (dọc) có mã QR + hieuban.com.
import { useState } from "react";
import { useChuChung } from "@/components/cms/ChuChung";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChepTay, chepLink, guiHoacChep } from "@/components/chia-se/GuiLink";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";

export function NutChiaSeNha({ yeuCau, loaiNha }: { yeuCau: Record<string, unknown>; loaiNha?: string | null }) {
  const [mo, setMo] = useState(false);
  const [ten, setTen] = useState("");
  const [the, setThe] = useState<{ ma: string; tu: string; link: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const [khongChep, setKhongChep] = useState(false);   // máy không cho chép tự động → nhắc chép tay
  const c = useChuChung();
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));

  async function tao() {
    setDang(true); setLoi(null);
    try {
      const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/nha", { ...yeuCau, ten_hien_thi: ten.trim(), ...(loaiNha ? { loai_nha_the: loaiNha } : {}) });
      const u = new URL(`/the/nha/${ma}`, window.location.origin);
      u.searchParams.set("tu", tu);
      if (maCuaToi) u.searchParams.set("gt", maCuaToi);
      setThe({ ma, tu, link: u.toString() });
      ghi("share_created", { kind: "nha", ma_moi: tu });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được thẻ.");
    } finally {
      setDang(false);
    }
  }
  async function chep() {
    if (!the) return;
    const kq = await chepLink(the.link);
    setKhongChep(kq === "khong_duoc");
    if (kq === "da_chep") { setDaChep(true); setTimeout(() => setDaChep(false), 2000); }
  }
  async function chiaSe() {
    if (!the) return;
    const kq = await guiHoacChep({ title: "Nhà của bạn", text: "Sơ đồ nhà mình đọc theo phong thuỷ — xem thử nhà bạn:", url: the.link });
    setKhongChep(kq === "khong_duoc");
    if (kq === "da_chep") { setDaChep(true); setTimeout(() => setDaChep(false), 2000); }
  }

  if (!mo) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setMo(true)} data-testid="mo-chia-se-nha">
        <Share2 aria-hidden /> Chia sẻ sơ đồ nhà
      </Button>
    );
  }
  return (
    <section className="w-full rounded-2xl border border-gold/30 bg-gold/[0.05] p-4" aria-labelledby="chia-se-nha" data-testid="chia-se-nha">
      <h3 id="chia-se-nha" className="font-sans text-[1.02rem] font-semibold text-fg">Thẻ “Nhà của bạn”</h3>
      {!the ? (
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5 sm:max-w-xs">
            <Label htmlFor="nha-ten">Tên trên thẻ (không bắt buộc)</Label>
            <Input id="nha-ten" value={ten} maxLength={24} placeholder="Bạn" onChange={(e) => setTen(e.target.value)} />
          </div>
          <p className="text-xs text-fg-faint">
            Thẻ chỉ có tên bạn gõ, hướng nhà (một trong 8 hướng), loại nhà, mức từng phòng — không địa chỉ, không toạ độ, không năm sinh, không năm xây. Hết hạn sau 90 ngày.
          </p>
          {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
          <Button onClick={() => void tao()} disabled={dang} data-testid="tao-the-nha"><Share2 aria-hidden /> {dang ? c("chia_se.dang_tao") : "Tạo thẻ"}</Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={the.link} aria-label="Link thẻ nhà" onFocus={(e) => e.currentTarget.select()} className="text-sm" data-testid="link-the-nha" />
            <Button variant="secondary" size="icon" onClick={() => void chep()} aria-label={c("chia_se.chep_link")}>{daChep ? <Check aria-hidden /> : <Copy aria-hidden />}</Button>
          </div>
          {khongChep && <ChepTay />}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void chiaSe()}><Share2 aria-hidden /> {c("chia_se.gui")}</Button>
            <Button asChild size="sm" variant="outline">
              <a href={`/og/nha?ma=${encodeURIComponent(the.ma)}&khung=doc`} download="nha-cua-ban.png" data-testid="tai-anh-the-nha"
                onClick={() => ghi("share_created", { kind: "nha_anh", ma_moi: the.tu })}>
                <Download aria-hidden /> {c("chia_se.tai_story")}
              </a>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
