"use client";
// BT-UI đợt 2 — "Hôm nay của hai người" trên Hôm nay (mục gập tầng "Đọc thêm"): chọn một người thân ĐÃ LƯU TRÊN MÁY
// (lib/nguoi-than, không đồng bộ tài khoản) → engine tính ngày cá nhân của hai người + một việc nên làm cùng
// (/v1/thanso/hom-nay-hai; chỉ gửi ngày + tháng sinh của người kia, năm chỉ khi nhập âm lịch; không tên). Không chấm điểm.
// Chia sẻ: thẻ ngày của CHÍNH người dùng (mã ký sẵn có) + lời nhắn nêu hai con số — không tên, không ngày sinh người kia.
import { useEffect, useState } from "react";
import Link from "@/components/khung/Lien";
import { Check, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MucGap } from "@/components/khung/MucGap";
import { ChepTay, guiHoacChep } from "@/components/chia-se/GuiLink";
import { taoLinkNgay } from "@/components/chia-se/NutChiaSeNgay";
import { ghi, maNgauNhien } from "@/lib/do-luong";
import type { HoSo } from "@/lib/hoso";
import { tenHien, useNguoiThan, type NguoiThan } from "@/lib/nguoi-than";
import { cn } from "@/lib/utils";

interface KetQua {
  kieu: string; ban: { so: number; nghia: string }; nguoi_kia: { so: number; nghia: string };
  tieu_de: string; cau: string; viec_cung: string; cau_tu_soi: string; luu_y: string;
}

export function HaiNguoiHomNay({ hoSo, ngay }: { hoSo: HoSo; ngay: string }) {
  const ds = useNguoiThan();
  const [chon, setChon] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQua | null>(null);
  const [loi, setLoi] = useState(false);
  const [daChep, setDaChep] = useState(false);
  const [chepTay, setChepTay] = useState<string | null>(null);
  const nguoi: NguoiThan | undefined = ds?.find((x) => x.id === chon);

  useEffect(() => {
    if (!nguoi) { setKq(null); return; }
    let huy = false;
    setLoi(false);
    fetch("/api/thanso/hom-nay-hai", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ngay: hoSo.ngay, thang: hoSo.thang, kia_ngay: nguoi.ngay, kia_thang: nguoi.thang, quan_he: nguoi.quan_he, ngay_xem: ngay,
        ...(nguoi.lich_nhap === "am" ? { kia_lich: "am", kia_nam: nguoi.nam, ...(nguoi.am_nhuan ? { kia_nhuan: true } : {}) } : {}) }) })
      .then((r) => (r.ok ? (r.json() as Promise<KetQua>) : Promise.reject(new Error("x"))))
      .then((j) => { if (!huy) { setKq(j); ghi("chart_interacted", { kind: "hai_nguoi_hom_nay", muc: j.kieu }); } })
      .catch(() => { if (!huy) { setKq(null); setLoi(true); } });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nguoi suy từ chon + ds
  }, [chon, ngay, hoSo.ngay, hoSo.thang]);

  if (ds === undefined) return null;

  async function chiaSe() {
    if (!kq) return;
    const tu = `h2.${maNgauNhien(10)}`;
    ghi("share_created", { kind: "hai_nguoi_hom_nay", ma_moi: tu });
    const { url } = await taoLinkNgay(hoSo, tu);
    const chu = `Hôm nay mình là ngày ${kq.ban.so}, bạn là ngày ${kq.nguoi_kia.so}. ${kq.viec_cung} Xem ngày của bạn:`;
    setChepTay(null);
    const r = await guiHoacChep({ title: "Hôm nay của hai người", text: chu, url }, `${chu} ${url}`);
    if (r === "da_chep") { setDaChep(true); setTimeout(() => setDaChep(false), 2500); }
    else if (r === "khong_duoc") setChepTay(url);
  }

  return (
    <MucGap ma="hai_nguoi" testId="hai-nguoi-hom-nay" tieuDe="Hôm nay của hai người"
      tomTat={ds.length ? "Chọn một người thân đã lưu để xem hôm nay hai bạn cùng nhịp hay lệch nhịp." : "Lưu một người thân trên máy để xem nhịp hôm nay của hai người."}>
      {ds.length === 0 ? (
        <div className="space-y-2 text-sm">
          <p className="text-fg-muted">Bạn chưa lưu người thân nào trên máy này. Thêm một người ở trang Tử vi (mục “Xem lá số 2 người”), rồi quay lại đây.</p>
          <Link href="/tu-vi#hop-tham" className="inline-flex items-center gap-1.5 text-gold hover:underline"><UserPlus className="size-4" aria-hidden /> Thêm người thân</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn người thân">
            {ds.map((x) => (
              <button key={x.id} type="button" aria-pressed={chon === x.id} onClick={() => setChon(chon === x.id ? null : x.id)} data-testid="hai-nguoi-chon"
                className={cn("vung-cham min-h-10 rounded-full border px-3.5 py-2 text-sm transition-colors", chon === x.id ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:border-gold/60 hover:text-fg")}>
                {tenHien(x)}
              </button>
            ))}
          </div>
          {loi && <p role="alert" className="text-sm text-fg-muted">Chưa tính được lúc này. Bạn thử lại sau ít phút nhé.</p>}
          {kq && (
            <div className="space-y-3" data-testid="hai-nguoi-kq" data-kieu={kq.kieu} aria-live="polite">
              <div className="grid grid-cols-2 gap-3">
                {[{ nhan: "Bạn", ...kq.ban }, { nhan: "Người ấy", ...kq.nguoi_kia }].map((x) => (
                  <div key={x.nhan} className="rounded-xl border border-line/70 bg-bg/40 p-3 text-center">
                    <p className="text-xs text-fg-muted">{x.nhan} · ngày cá nhân</p>
                    <p className="font-serif text-4xl leading-tight text-gold">{x.so}</p>
                    <p className="text-xs text-fg-muted">{x.nghia}</p>
                  </div>
                ))}
              </div>
              <h3 className="font-serif text-lg">{kq.tieu_de}</h3>
              <p className="text-sm">{kq.cau}</p>
              <p className="text-sm"><b className="text-jade">Việc nên làm cùng:</b> {kq.viec_cung}</p>
              <p className="text-sm italic text-moon">{kq.cau_tu_soi}</p>
              <Button size="sm" variant="secondary" onClick={() => void chiaSe()} data-testid="hai-nguoi-chia-se">
                {daChep ? <Check aria-hidden /> : <Share2 aria-hidden />}{daChep ? "Đã chép" : "Gửi cho người ấy"}
              </Button>
              {chepTay && <ChepTay url={chepTay} />}
              <p className="text-xs text-fg-faint">{kq.luu_y} Lời nhắn gửi đi chỉ có hai con số — không có tên hay ngày sinh của ai.</p>
            </div>
          )}
        </>
      )}
    </MucGap>
  );
}
