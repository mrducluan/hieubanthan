"use client";
// TCS-1 — "Chia sẻ thẻ điểm" sau khi xem "Xem lá số 2 người": máy chủ chấm lại qua engine rồi ký mã (lib/ma-moi.ts
// kyMaHai — chỉ tên hiển thị, quan hệ, điểm, mức, ≤ 3 tiêu chí; không ngày sinh). Link /the/hai/<mã>?tu=hp.<…> đo
// referral_signup như các thẻ khác; ảnh /og/hai (dọc 1080×1350) tải về để đăng story — ảnh có mã QR + hieuban.com.
import { useState } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";

export function NutChiaSeHai({ yeuCau }: { yeuCau: Record<string, unknown> }) {
  const [mo, setMo] = useState(false);
  const [tenBan, setTenBan] = useState("");
  const [tenKia, setTenKia] = useState("");
  const [the, setThe] = useState<{ ma: string; tu: string; link: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));

  async function tao() {
    setDang(true); setLoi(null);
    try {
      const { ma, tu } = await postJson<{ ma: string; tu: string }>("/api/chia-se/hai", { ...yeuCau, ten_ban: tenBan.trim(), ten_kia: tenKia.trim() });
      const u = new URL(`/the/hai/${ma}`, window.location.origin);
      u.searchParams.set("tu", tu);
      if (maCuaToi) u.searchParams.set("gt", maCuaToi);
      setThe({ ma, tu, link: u.toString() });
      ghi("share_created", { kind: "hai_nguoi", ma_moi: tu });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được thẻ.");
    } finally {
      setDang(false);
    }
  }

  async function chep() {
    if (!the) return;
    try { await navigator.clipboard.writeText(the.link); setDaChep(true); setTimeout(() => setDaChep(false), 2000); } catch { /* bỏ qua */ }
  }

  async function chiaSe() {
    if (!the) return;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: "Xem lá số 2 người", text: "Điểm tham khảo của hai đứa mình — xem của bạn với người ấy:", url: the.link }); return; } catch { /* huỷ → chép */ }
    }
    await chep();
  }

  if (!mo) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setMo(true)} data-testid="mo-chia-se-hai">
        <Share2 aria-hidden /> Chia sẻ thẻ điểm
      </Button>
    );
  }

  return (
    <section className="w-full rounded-2xl border border-gold/30 bg-gold/[0.05] p-4" aria-labelledby="chia-se-hai" data-testid="chia-se-hai">
      <h3 id="chia-se-hai" className="font-sans text-[1.02rem] font-semibold text-fg">Thẻ điểm hai người</h3>
      {!the ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hai-ten-ban">Tên bạn trên thẻ (không bắt buộc)</Label>
              <Input id="hai-ten-ban" value={tenBan} maxLength={24} placeholder="Bạn" onChange={(e) => setTenBan(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hai-ten-kia">Tên người ấy (không bắt buộc)</Label>
              <Input id="hai-ten-kia" value={tenKia} maxLength={24} placeholder="Người ấy" onChange={(e) => setTenKia(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-fg-faint">
            Thẻ chỉ có tên bạn gõ, quan hệ, điểm và ba mặt nổi bật — không có ngày sinh, không có con số nào suy ra được tuổi.
            Hết hạn sau 90 ngày.
          </p>
          {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
          <Button onClick={() => void tao()} disabled={dang} data-testid="tao-the-hai">
            <Share2 aria-hidden /> {dang ? "Đang tạo…" : "Tạo thẻ"}
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={the.link} aria-label="Link thẻ điểm" onFocus={(e) => e.currentTarget.select()} className="text-sm" data-testid="link-the-hai" />
            <Button variant="secondary" size="icon" onClick={() => void chep()} aria-label="Sao chép link">{daChep ? <Check aria-hidden /> : <Copy aria-hidden />}</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void chiaSe()}><Share2 aria-hidden /> Gửi qua Zalo, Messenger…</Button>
            <Button asChild size="sm" variant="outline">
              <a href={`/og/hai?ma=${encodeURIComponent(the.ma)}&khung=doc`} download="diem-hai-nguoi.png" data-testid="tai-anh-the-hai"
                onClick={() => ghi("share_created", { kind: "hai_nguoi_anh", ma_moi: the.tu })}>
                <Download aria-hidden /> Tải ảnh (đăng story)
              </a>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
