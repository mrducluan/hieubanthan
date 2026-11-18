"use client";
// KM-3 — hai khối nhỏ dùng lại bài đọc ngày của Kỳ Môn (engine lập + đọc; web chỉ vẽ, engine lỗi → khối tự ẩn):
//  • KyMonTheoNgay: trên trang một NGÀY của Xem ngày tốt — chọn việc → các khung giờ và hướng hợp việc ấy trong ngày đó.
//  • KyMonHuongHop: cạnh la bàn Phong thuỷ — hôm nay, khung giờ nào có hướng vừa hợp mệnh (Bát trạch) vừa thuận giờ.
// Không gửi tên, ngày sinh; hướng hợp mệnh chỉ là TÊN hướng.
import { useEffect, useState } from "react";
import Link from "@/components/khung/Lien";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { conToi, type NgayKM, type ViecKM } from "@/lib/ky-mon";

const VIEC: { ma: ViecKM; ten: string }[] = [
  { ma: "gap_go", ten: "Gặp gỡ" }, { ma: "ky_ket", ten: "Ký kết, mở hàng" }, { ma: "di_xa", ten: "Đi xa" },
  { ma: "giay_to", ten: "Giấy tờ, thi cử" }, { ma: "hoa_giai", ten: "Họp mặt, hoà giải" },
  { ma: "mo_thi_truong", ten: "Mở thị trường" }, { ma: "ra_mat", ten: "Ra mắt, quảng bá" },
];
const utcMay = () => Math.round((-new Date().getTimezoneOffset() / 60) * 4) / 4;

async function layNgay(than: object): Promise<NgayKM | null> {
  try {
    const r = await fetch("/api/ky-mon/ngay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(than) });
    const j = r.ok ? ((await r.json()) as NgayKM) : null;
    return j?.gio ? j : null;
  } catch { return null; }
}

export function KyMonTheoNgay({ ngay, nhan }: { ngay: string; nhan: string }) {
  const [viec, setViec] = useState<ViecKM>("gap_go");
  const [n, setN] = useState<NgayKM | null>(null);
  const [hong, setHong] = useState(false);
  useEffect(() => {
    let song = true;
    void layNgay({ ngay, viec, utc: 7 }).then((j) => { if (!song) return; if (j) setN(j); else setHong(true); });
    return () => { song = false; };
  }, [ngay, viec]);
  if (hong && !n) return null;
  return (
    <section aria-labelledby="km-theo-ngay" className="mt-8 rounded-2xl border border-line/70 p-5" data-testid="ky-mon-theo-ngay">
      <h2 id="km-theo-ngay" className="text-xl">Giờ và hướng theo việc ngày {nhan}</h2>
      <p className="mt-1 text-sm text-fg-muted">Ngày đã chọn rồi thì chọn tiếp giờ và hướng, theo bàn Kỳ Môn của từng canh giờ (giờ Việt Nam).</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Việc định làm">
        {VIEC.map((v) => (
          <button key={v.ma} type="button" aria-pressed={viec === v.ma}
            onClick={() => { setViec(v.ma); ghi("chart_interacted", { mo_dun: "kymon", kind: "chon_viec", muc: `ngay.${v.ma}` }); }}
            className={cn("vung-cham rounded-full border px-3 py-1.5 text-sm", viec === v.ma ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg")}>{v.ten}</button>
        ))}
      </div>
      {n?.viec && n.viec.ma === viec && (
        n.viec.gio_tot.length > 0 ? (
          <ul className="mt-3 space-y-1.5 text-sm">
            {n.viec.gio_tot.map((g) => <li key={g.luc}>{g.loi}{g.ban_dem ? <span className="text-fg-faint"> (giờ đêm)</span> : null}</li>)}
          </ul>
        ) : <p className="mt-3 text-sm text-fg-muted">{n.viec.loi}</p>
      )}
      {n?.viec?.ranh_gioi && <p className="mt-2 text-xs text-fg-faint">{n.viec.ranh_gioi}</p>}
      <p className="mt-3 text-xs text-fg-faint">{n?.cach_dung} Đây là nhịp gợi ý theo sách xưa, không phải dự báo.{" "}
        <Link href="/ky-mon" className="text-gold hover:underline">Xem la bàn tám hướng</Link></p>
    </section>
  );
}

/** `tieuDe` / `ghiChu`: UI-HHT dùng lại trên trang hướng hợp tuổi (cung phi, tra năm sinh, hai người) — mặc định giữ lời cũ của
 *  la bàn mệnh quái. Kỳ Môn chỉ ĐÁNH DẤU giờ thuận của các hướng đưa vào, không đổi thứ hạng Bát trạch. */
export function KyMonHuongHop({ huongCat, tieuDe, ghiChu, maDo }: { huongCat: string[]; tieuDe?: string; ghiChu?: string; maDo?: string }) {
  const [n, setN] = useState<NgayKM | null>(null);
  const [gio, setGio] = useState(0);
  const khoa = huongCat.join("|");
  useEffect(() => {
    let song = true;
    const d = new Date();
    setGio(d.getHours() * 60 + d.getMinutes());
    void layNgay({ utc: utcMay(), huong_hop: khoa ? khoa.split("|") : [] }).then((j) => { if (song) setN(j); });
    return () => { song = false; };
  }, [khoa]);
  if (!n?.hop_menh) return null;                 // engine cũ / lỗi → không hiện
  const con = n.gio.filter((g) => (g.hop_menh?.length ?? 0) > 0 && conToi(g.luc, gio));
  return (
    <div className="mt-4 rounded-xl border border-jade/30 bg-jade/5 p-4 text-sm" data-testid="ky-mon-huong-hop">
      <p className="text-fg">{tieuDe ?? "Hôm nay, hướng hợp mệnh của bạn thuận vào giờ nào?"}</p>
      {con.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {con.slice(0, 4).map((g) => <li key={g.luc}>Giờ {g.chi} <span className="text-fg-faint">({g.khung})</span>: hướng {g.hop_menh!.join(", ")}</li>)}
        </ul>
      ) : <p className="mt-2 text-fg-muted">Từ giờ tới hết ngày chưa có khung nào trùng. Việc thường ngày vẫn làm bình thường.</p>}
      <p className="mt-2 text-xs text-fg-faint">{ghiChu ?? "Hướng hợp mệnh theo Bát trạch (ở trên) ghép với hướng thuận của từng canh giờ theo Kỳ Môn."} Nhịp gợi ý, không phải dự báo.{" "}
        <Link href="/ky-mon" className="text-gold hover:underline" onClick={() => maDo && ghi("cross_cta_clicked", { tu: maDo, den: "ky_mon" })}>Mở la bàn Kỳ Môn</Link></p>
    </div>
  );
}
