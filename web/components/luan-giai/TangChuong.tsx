"use client";
// SAO-V "Tặng một chương" — nút cuối báo cáo đã mở bằng Sao: tạo link quà /qua/<mã> (+ ?gt=<mã mời của tôi>) rồi chia sẻ
// bằng Web Share hoặc sao chép (cùng kiểu NutChiaSe). Quà là NỘI DUNG — bạn bè đọc thêm một chương trong báo cáo của
// chính họ — không phải Sao, không trừ ví ai. Chỉ hiện khi công tắc sao.qua.bat bật và người này đã từng mở báo cáo
// bằng Sao (hàm SQL qua_cua_toi). Hết lượt → câu trung tính, không đếm ngược, không giục.
import { useEffect, useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { TEN_BAO_CAO, type MangLuanGiai } from "@/lib/luan-giai-mang";
import { useMaCuaToi } from "@/lib/sao";

interface TrangThai { bat: boolean; tran: number; da_gui_30_ngay: number; co_the_tang: boolean }

export function TangChuong({ moDun }: { moDun: MangLuanGiai }) {
  const [tt, setTt] = useState<TrangThai | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [bao, setBao] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const maCuaToi = useMaCuaToi(true);

  useEffect(() => {
    let huy = false;
    fetch("/api/qua").then((r) => r.json()).then((d: TrangThai) => { if (!huy && d && typeof d.bat === "boolean") setTt(d); })
      .catch(() => { /* chưa mở tặng quà → ẩn */ });
    return () => { huy = true; };
  }, []);

  if (!tt?.bat || !tt.co_the_tang || tt.tran <= 0) return null;
  const conLai = Math.max(0, tt.tran - tt.da_gui_30_ngay);
  const ten = TEN_BAO_CAO[moDun];

  async function tao() {
    setDang(true); setBao(null);
    try {
      const r = await fetch("/api/qua", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mo_dun: moDun }) });
      const d = (await r.json().catch(() => ({}))) as { ket_qua?: string; ma?: string; con_lai?: number; error?: string };
      if (!r.ok) { setBao(d.error ?? "Chưa tạo được quà, thử lại sau ít phút."); return; }
      if (d.ket_qua === "da_tao" && d.ma) {
        const u = new URL(`/qua/${d.ma}`, window.location.origin);
        if (maCuaToi) u.searchParams.set("gt", maCuaToi);   // bạn bè tạo tài khoản qua link → thưởng mời như link mời thường
        setLink(u.toString());
        setTt((t) => (t ? { ...t, da_gui_30_ngay: t.tran - (d.con_lai ?? Math.max(0, conLai - 1)) } : t));
        ghi("gift_sent", { mo_dun: moDun });
      } else if (d.ket_qua === "het_luot") {
        setTt((t) => (t ? { ...t, da_gui_30_ngay: t.tran } : t));
      } else {
        setBao("Tặng chương đang tạm đóng — bạn thử lại sau nhé.");
      }
    } catch {
      setBao("Chưa tạo được quà, thử lại sau ít phút.");
    } finally {
      setDang(false);
    }
  }

  async function chep() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setDaChep(true); setTimeout(() => setDaChep(false), 2000); } catch { /* bỏ qua */ }
  }
  async function chiaSe() {
    if (!link) return;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Hiểu Bản Thân", text: `Mình tặng bạn một chương ${ten} — đọc trong báo cáo của chính bạn.`, url: link });
        return;
      } catch { /* người dùng huỷ */ }
    }
    await chep();
  }

  return (
    <section className="mt-6 rounded-2xl border border-gold/40 bg-gold/[0.05] p-4 sm:p-5 print:hidden" data-testid="tang-chuong">
      <div className="flex items-start gap-3">
        <Gift className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-serif text-lg text-fg">Tặng bạn một chương</p>
          <p className="mt-1 text-fg-muted">
            Người nhận được đọc thêm một chương trong {ten} của chính họ (cần tài khoản và hồ sơ ngày sinh của họ). Quà là
            nội dung, không phải Sao — ví của bạn không bị trừ. Link dùng một lần, hạn 7 ngày.
          </p>
          <p className="mt-1 text-xs text-fg-faint" data-testid="tang-chuong-con">
            {conLai > 0 ? `Bạn còn ${conLai}/${tt.tran} quà trong 30 ngày.` : `Bạn đã gửi đủ ${tt.tran} quà trong 30 ngày qua — lượt mới mở lại dần theo ngày đã gửi.`}
          </p>
        </div>
      </div>
      {link ? (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Input readOnly value={link} aria-label="Link quà" onFocus={(e) => e.currentTarget.select()} className="text-sm" data-testid="tang-chuong-link" />
            <Button variant="secondary" size="icon" onClick={chep} aria-label="Sao chép link quà">{daChep ? <Check aria-hidden /> : <Copy aria-hidden />}</Button>
          </div>
          <Button onClick={chiaSe} className="w-full"><Share2 aria-hidden /> Gửi link quà</Button>
        </div>
      ) : conLai > 0 ? (
        <Button onClick={tao} disabled={dang} className="mt-3 w-full sm:w-auto" data-testid="tang-chuong-nut">
          <Gift aria-hidden /> {dang ? "Đang tạo link…" : "Tặng bạn một chương"}
        </Button>
      ) : null}
      {bao && <p role="status" className="mt-2 text-sm text-fg-muted">{bao}</p>}
    </section>
  );
}
