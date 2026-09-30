"use client";
import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hoTenList, tenGoi, type HoSo } from "@/lib/hoso";
import { postJson } from "@/lib/goi-api";
import { ghi, maMoiTuToken } from "@/lib/do-luong";

interface Props {
  hoSo: HoSo;
  /** Đường dẫn từ mã: vd (ma) => `/hop-doi/${ma}`. */
  duongDan: (ma: string) => string;
  nutTao: string;
  /** Loại chia sẻ cho đo lường. */
  loai: "invite" | "card";
  loiNhan: string;
  onDaTao?: (ma: string) => void;
}

// Tạo link có ký (chỉ tên hiển thị + con số), rồi chia sẻ bằng Web Share API hoặc sao chép.
export function NutChiaSe({ hoSo, duongDan, nutTao, loai, loiNhan, onDaTao }: Props) {
  const [ten, setTen] = useState(tenGoi(hoSo));
  const [link, setLink] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);

  async function tao() {
    setDang(true); setLoi(null);
    try {
      const { ma } = await postJson<{ ma: string }>("/api/chia-se/tao", {
        ten_hien_thi: ten.trim() || tenGoi(hoSo), ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam,
      });
      const url = new URL(duongDan(ma), window.location.origin).toString();
      setLink(url);
      ghi("share_created", { kind: loai, ma_moi: maMoiTuToken(ma) });
      onDaTao?.(ma);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được link.");
    } finally {
      setDang(false);
    }
  }

  async function chiaSe() {
    if (!link) return;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: "Hiểu Bản Thân", text: loiNhan, url: link }); return; } catch { /* người dùng huỷ */ }
    }
    await chep();
  }

  async function chep() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setDaChep(true); setTimeout(() => setDaChep(false), 2000); } catch { /* bỏ qua */ }
  }

  if (!link) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="ten-hien-thi">Tên hiển thị trên link (có thể dùng biệt danh)</Label>
          <Input id="ten-hien-thi" value={ten} maxLength={40} onChange={(e) => setTen(e.target.value)} />
        </div>
        <p className="text-xs text-fg-faint">Link chỉ hiện tên hiển thị và các con số của bạn — không có ngày sinh. Hết hạn sau 90 ngày.</p>
        {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
        <Button onClick={tao} disabled={dang} className="w-full"><Share2 aria-hidden /> {dang ? "Đang tạo…" : nutTao}</Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input readOnly value={link} aria-label="Link chia sẻ" onFocus={(e) => e.currentTarget.select()} className="text-sm" />
        <Button variant="secondary" size="icon" onClick={chep} aria-label="Sao chép link">{daChep ? <Check aria-hidden /> : <Copy aria-hidden />}</Button>
      </div>
      <Button onClick={chiaSe} className="w-full"><Share2 aria-hidden /> Gửi qua Zalo, Messenger…</Button>
    </div>
  );
}
