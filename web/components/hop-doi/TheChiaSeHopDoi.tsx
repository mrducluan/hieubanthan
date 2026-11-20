"use client";
// Thẻ chia sẻ hợp đôi Zero-PII (không ngày sinh, không tuổi): tải ảnh Story 1080×1350 hoặc chép tóm tắt gửi Zalo/Messenger.
import { useState } from "react";
import { Check, Copy, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { KetQuaHopDoiT } from "@/components/hop-doi/KetQuaHopDoi";
import { chepLink } from "@/components/chia-se/GuiLink";
import { ghi } from "@/lib/do-luong";

interface Props {
  kq: KetQuaHopDoiT;
  tenA: string;
  tenB: string;
}

function catDong(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width <= maxW) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1] ?? "";
    lines[maxLines - 1] = `${last.replace(/[.,;:\s]+$/, "")}…`;
  }
  return lines;
}

function veTheStory(kq: KetQuaHopDoiT, tenA: string, tenB: string): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Nền Đêm sao phương Đông
  const bg = ctx.createLinearGradient(0, 0, 0, 1350);
  bg.addColorStop(0, "#0b1020");
  bg.addColorStop(0.55, "#11192e");
  bg.addColorStop(1, "#090d18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1350);

  // Hạt sao nhẹ
  for (let i = 0; i < 64; i++) {
    const x = ((i * 197 + 53) % 1040) + 20;
    const y = ((i * 313 + 71) % 1310) + 20;
    const r = (i % 3) * 0.7 + 0.8;
    ctx.fillStyle = i % 5 === 0 ? "rgba(214, 181, 108, 0.45)" : "rgba(226, 232, 240, 0.25)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Khung viền mảnh
  ctx.strokeStyle = "rgba(214, 181, 108, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, 984, 1254);

  // Eyebrow + nhãn quan hệ
  const nhanQH = kq.quan_he?.ten ? `HỢP ĐÔI · ${kq.quan_he.ten.toUpperCase()}` : "HỢP ĐÔI THẦN SỐ";
  ctx.fillStyle = "#d6b56c";
  ctx.font = "600 24px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(nhanQH, 540, 135);

  ctx.fillStyle = "#f4efe4";
  ctx.font = "600 46px Georgia, serif";
  ctx.fillText(`${tenA}  &  ${tenB}`, 540, 210);

  // Hai vòng tròn con số Đường đời
  const veVong = (cx: number, so: number, ten: string, tuKhoa: string | null) => {
    ctx.strokeStyle = "rgba(214, 181, 108, 0.75)";
    ctx.lineWidth = 3;
    ctx.fillStyle = "rgba(214, 181, 108, 0.10)";
    ctx.beginPath();
    ctx.arc(cx, 390, 108, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e8cb82";
    ctx.font = "700 96px Georgia, serif";
    ctx.fillText(String(so), cx, 422);

    ctx.fillStyle = "#f4efe4";
    ctx.font = "600 28px Georgia, serif";
    ctx.fillText(ten.slice(0, 18), cx, 548);

    if (tuKhoa) {
      ctx.fillStyle = "#9aa7bd";
      ctx.font = "400 22px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(tuKhoa.slice(0, 28), cx, 584);
    }
  };

  veVong(315, kq.a.duong_doi, tenA, kq.a.tu_khoa);
  veVong(765, kq.b.duong_doi, tenB, kq.b.tu_khoa);

  // Đường nối ở giữa
  ctx.strokeStyle = "rgba(214, 181, 108, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(435, 390);
  ctx.lineTo(645, 390);
  ctx.stroke();

  const capChinh = kq.cac_cap[0]?.nghia;
  const khoi = [
    { nhan: "DỄ HOÀ Ở ĐÂU", mau: "#6ec4a7", noi: capChinh?.hoa ?? kq.cach_doc },
    { nhan: "NÊN CHÚ Ý ĐỂ ÊM", mau: "#f0b35c", noi: capChinh?.va ?? "" },
    { nhan: "VIỆC NÊN CÙNG LÀM", mau: "#d6b56c", noi: capChinh?.cung_lam ?? kq.quan_he?.cau_hoi_chung ?? "" },
  ].filter((x) => x.noi);

  let y = 665;
  ctx.textAlign = "left";
  for (const item of khoi) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.fillRect(92, y, 896, 162);
    ctx.strokeRect(92, y, 896, 162);

    ctx.fillStyle = item.mau;
    ctx.font = "700 21px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(item.nhan, 126, y + 42);

    ctx.fillStyle = "#e6ebf5";
    ctx.font = "400 26px ui-sans-serif, system-ui, sans-serif";
    const lines = catDong(ctx, item.noi, 828, 3);
    lines.forEach((line, idx) => {
      ctx.fillText(line, 126, y + 82 + idx * 34);
    });
    y += 186;
  }

  // Chân thẻ
  ctx.textAlign = "center";
  ctx.fillStyle = "#d6b56c";
  ctx.font = "600 26px Georgia, serif";
  ctx.fillText("Hiểu Bản Thân · hieuban.com/hop-doi", 540, 1230);
  ctx.fillStyle = "#8a96ad";
  ctx.font = "400 21px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Thẻ tóm tắt không hiển thị ngày sinh · Chỉ để tham khảo phối hợp", 540, 1268);

  return canvas.toDataURL("image/png");
}

export function TheChiaSeHopDoi({ kq, tenA, tenB }: Props) {
  const [daChep, setDaChep] = useState(false);
  const [daTai, setDaTai] = useState(false);

  const capChinh = kq.cac_cap[0]?.nghia;
  const nhanQH = kq.quan_he?.ten ?? "Hai người";

  async function taiAnhStory() {
    if (typeof document !== "undefined" && "fonts" in document) {
      await document.fonts.ready.catch(() => undefined);
    }
    const url = veTheStory(kq, tenA, tenB);
    if (!url) return;
    const tenTep = `hop-doi-${kq.a.duong_doi}-${kq.b.duong_doi}.png`;
    // Ưu tiên Web Share API với tệp ảnh trên điện thoại (iOS Safari); fallback tải trực tiếp trên máy tính.
    try {
      if (typeof navigator !== "undefined" && "canShare" in navigator && typeof fetch !== "undefined") {
        const blob = await (await fetch(url)).blob();
        const file = new File([blob], tenTep, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Hợp đôi ${kq.a.duong_doi} & ${kq.b.duong_doi}` });
          setDaTai(true);
          setTimeout(() => setDaTai(false), 2500);
          ghi("share_created", { kind: "hop_doi_story", quan_he: kq.quan_he?.ma ?? "nguoi_yeu" });
          return;
        }
      }
    } catch {
      // Người dùng huỷ hộp thoại chia sẻ hoặc trình duyệt không hỗ trợ → fallback tải tệp
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = tenTep;
    a.click();
    setDaTai(true);
    setTimeout(() => setDaTai(false), 2500);
    ghi("share_created", { kind: "hop_doi_story", quan_he: kq.quan_he?.ma ?? "nguoi_yeu" });
  }

  async function chepTomTat() {
    const dong = [
      `✨ Hợp đôi (${nhanQH}): ${tenA} (số ${kq.a.duong_doi}) & ${tenB} (số ${kq.b.duong_doi})`,
      capChinh?.hoa ? `• Dễ hoà: ${capChinh.hoa}` : "",
      capChinh?.va ? `• Nên chú ý: ${capChinh.va}` : "",
      capChinh?.cung_lam ? `• Việc nên cùng làm: ${capChinh.cung_lam}` : "",
      `Xem cặp số của hai bạn (không lưu ngày sinh): https://hieuban.com/hop-doi`,
    ].filter(Boolean).join("\n");
    const res = await chepLink(dong);
    if (res === "da_chep") {
      setDaChep(true);
      setTimeout(() => setDaChep(false), 2200);
      ghi("share_created", { kind: "hop_doi_text", quan_he: kq.quan_he?.ma ?? "nguoi_yeu" });
    }
  }

  return (
    <Card className="mx-auto max-w-3xl border-gold/30 bg-gold/[0.04]" data-testid="the-chia-se-hop-doi">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow flex items-center gap-1.5 text-gold">
            <Sparkles className="size-3.5" aria-hidden /> Thẻ tóm tắt chia sẻ
          </p>
          <p className="mt-1 font-serif text-lg text-fg">
            Lưu thẻ cặp số {kq.a.duong_doi} &amp; {kq.b.duong_doi} ({nhanQH})
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            Thẻ chỉ hiện tên hiển thị, con số Đường đời và điểm hoà — tuyệt đối không ghi ngày sinh hay tuổi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => void taiAnhStory()} data-testid="tai-the-story-hop-doi">
            <Download aria-hidden /> {daTai ? "Đã tải ảnh Story" : "Tải ảnh Story"}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => void chepTomTat()} data-testid="chep-tom-tat-hop-doi">
            {daChep ? <Check aria-hidden /> : <Copy aria-hidden />} {daChep ? "Đã sao chép" : "Chép tóm tắt"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
