"use client";
// CTA-1 — "Tạo thẻ Bản đồ 5 mảng": máy chủ xin engine năm nhãn đã tính rồi ký mã (lib/ma-moi.ts kyMaBanDo — chỉ tên
// hiển thị + nhãn, không ngày sinh). Link /the/ban-do/<mã>?tu=bd.<…> (người nhận chơi "Đoán số" rồi được mời tự xem);
// ảnh /og/ban-do (dọc 1080×1350 cho story là bản chính khi tải) có mã QR + hieuban.com.
import { useState } from "react";
import { Check, Copy, Download, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TheBanDo } from "@/components/chia-se/TheBanDo";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { tenGoi, type HoSo } from "@/lib/hoso";
import { docQuyUocDD } from "@/lib/quy-uoc-dd";
import { useMaCuaToi } from "@/lib/sao";
import { useNguoiDung } from "@/lib/tai-khoan";
import { bienThe, dien, manhBanDo } from "@/lib/the-ban-do";
import type { NoiDungMaBanDo } from "@/lib/ma-moi";

type The = Omit<NoiDungMaBanDo, "v" | "d">;

/** Nút mở (viền sáng chạy) — khung tạo thẻ đặt riêng ở hàng rộng (KhungTheBanDo) để thẻ không bị bó trong cột hẹp. */
export function NutTheBanDo({ onMo }: { onMo: () => void }) {
  return (
    <button type="button" onClick={onMo} data-testid="mo-the-ban-do"
      className="vien-chay group inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-fg">
      <Sparkles className="size-4 text-gold" aria-hidden /> Tạo thẻ “5 mảnh ghép làm nên tôi”
    </button>
  );
}

export function KhungTheBanDo({ hoSo, tu }: { hoSo: HoSo; tu: string }) {
  const [ten, setTen] = useState(tenGoi(hoSo).slice(0, 24));
  const [kq, setKq] = useState<{ ma: string; tu: string; bien_the: string; the: The; link: string } | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const nguoiDung = useNguoiDung();
  const maCuaToi = useMaCuaToi(Boolean(nguoiDung));

  async function tao() {
    setDang(true); setLoi(null);
    try {
      const d = await postJson<{ ma: string; tu: string; bien_the: string; the: The }>("/api/chia-se/ban-do", {
        ten_hien_thi: ten.trim() || tenGoi(hoSo).slice(0, 24), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam,
        quy_uoc_duong_doi: docQuyUocDD(),
        ...(hoSo.gio ? { gio: hoSo.gio } : {}), ...(hoSo.do_tin_gio ? { do_tin_gio: hoSo.do_tin_gio } : {}),
        ...(hoSo.gioi_tinh ? { gioi_tinh: hoSo.gioi_tinh } : {}), ...(hoSo.noi_sinh ? { noi_sinh: hoSo.noi_sinh } : {}),
        ...(hoSo.vung ? { vung: hoSo.vung } : {}), ...(hoSo.gio_mua_he ? { gio_mua_he: true } : {}),
      });
      const u = new URL(`/the/ban-do/${d.ma}`, window.location.origin);
      u.searchParams.set("tu", d.tu);
      if (maCuaToi) u.searchParams.set("gt", maCuaToi);
      setKq({ ...d, link: u.toString() });
      ghi("share_created", { kind: "ban_do", ma_moi: d.tu, bien_the: d.bien_the, tu });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa tạo được thẻ.");
    } finally {
      setDang(false);
    }
  }

  async function chep() {
    if (!kq) return;
    try { await navigator.clipboard.writeText(kq.link); setDaChep(true); setTimeout(() => setDaChep(false), 2000); } catch { /* bỏ qua */ }
  }
  async function chiaSe() {
    if (!kq) return;
    const bt = bienThe(kq.the.b);
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: dien(bt.tieuDe, kq.the.t), text: bt.loiMoi, url: kq.link }); return; } catch { /* huỷ → chép */ }
    }
    await chep();
  }

  return (
    <section className="w-full space-y-4 rounded-2xl border border-gold/30 bg-gold/[0.04] p-4" aria-labelledby="tao-ban-do" data-testid="khung-the-ban-do">
      <h3 id="tao-ban-do" className="font-sans text-[1.02rem] font-semibold text-fg">Thẻ Bản đồ 5 mảng của bạn</h3>
      {!kq ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ban-do-ten">Tên trên thẻ (có thể là biệt danh)</Label>
            <Input id="ban-do-ten" value={ten} maxLength={24} onChange={(e) => setTen(e.target.value)} />
          </div>
          <p className="text-xs text-fg-faint">
            Thẻ chỉ có tên bạn gõ và 5 nhãn: đường đời, bản chất, sao chủ mệnh, hướng hợp, quẻ hôm nay — không có ngày giờ
            sinh. Người nhận được đoán đường đời của bạn trước khi xem. Hết hạn sau 90 ngày.
          </p>
          {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
          <Button onClick={() => void tao()} disabled={dang} data-testid="tao-the-ban-do">
            <Sparkles aria-hidden /> {dang ? "Đang ghép…" : "Ghép thẻ"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <TheBanDo tieuDe={dien(bienThe(kq.the.b).tieuDe, kq.the.t)} manh={manhBanDo(kq.the)} loiMoi={bienThe(kq.the.b).loiMoi}
            testId="xem-truoc-ban-do" />
          <div className="flex gap-2">
            <Input readOnly value={kq.link} aria-label="Link thẻ bản đồ" onFocus={(e) => e.currentTarget.select()} className="text-sm" data-testid="link-the-ban-do" />
            <Button variant="secondary" size="icon" onClick={() => void chep()} aria-label="Sao chép link">{daChep ? <Check aria-hidden /> : <Copy aria-hidden />}</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void chiaSe()}><Share2 aria-hidden /> Gửi bạn bè đoán thử</Button>
            <Button asChild size="sm" variant="outline">
              <a href={`/og/ban-do?ma=${encodeURIComponent(kq.ma)}&khung=doc`} download="ban-do-5-mang.png" data-testid="tai-anh-ban-do"
                onClick={() => ghi("share_created", { kind: "ban_do_anh", ma_moi: kq.tu, bien_the: kq.bien_the, tu })}>
                <Download aria-hidden /> Tải ảnh story
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href={`/og/ban-do?ma=${encodeURIComponent(kq.ma)}`} download="ban-do-5-mang-ngang.png">
                <Download aria-hidden /> Ảnh ngang
              </a>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
