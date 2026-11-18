"use client";
// KM-3 — mục "Giờ và hướng thuận hôm nay" trên trang Hôm nay. Xin engine 13 khung giờ của ngày theo múi giờ máy người xem
// (bàn Kỳ Môn là của thời điểm — không gửi tên, ngày sinh). Web chỉ chọn khung "sắp tới" theo đồng hồ máy rồi vẽ.
import { useEffect, useState } from "react";
import Link from "@/components/khung/Lien";
import { MucGap } from "@/components/khung/MucGap";
import { conToi, type NgayKM } from "@/lib/ky-mon";

/** Các khung còn lại trong ngày (kể cả khung đang đi) có hướng thuận, giờ thức trước. */
export function khungConLai(n: NgayKM, phutMay: number): NgayKM["gio"] {
  return n.gio.filter((g) => g.muc === "thuan" && conToi(g.luc, phutMay));
}

export function KyMonHomNay({ ngay }: { ngay: string }) {
  const [n, setN] = useState<NgayKM | null>(null);
  const [gio, setGio] = useState(0);
  useEffect(() => {
    const d = new Date();
    setGio(d.getHours() * 60 + d.getMinutes());
    const utc = Math.round((-d.getTimezoneOffset() / 60) * 4) / 4;
    let song = true;
    fetch("/api/ky-mon/ngay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ngay, utc }) })
      .then((r) => (r.ok ? r.json() : null)).then((j: NgayKM | null) => { if (song && j?.gio) setN(j); }).catch(() => {});
    return () => { song = false; };
  }, [ngay]);
  if (!n) return null;                       // engine cũ / lỗi → mục tự ẩn
  const con = khungConLai(n, gio);
  const dau = con[0];
  const tom = dau ? `Giờ ${dau.chi} (${dau.khung}): hướng ${dau.huong_thuan.join(", ")} thuận.` : "Từ giờ tới hết ngày không còn khung nào có hướng nổi bật.";
  return (
    <MucGap id="ky-mon" ma="ky_mon" testId="ky-mon-hom-nay" tieuDe="Giờ và hướng thuận hôm nay" tomTat={tom} phu="theo bàn Kỳ Môn của từng canh giờ">
      {con.length > 0 ? (
        <ul className="space-y-1.5 text-sm">
          {con.slice(0, 5).map((g) => (
            <li key={g.luc}><span className="text-fg">Giờ {g.chi}</span> <span className="text-fg-faint">({g.khung})</span>: hướng {g.huong_thuan.join(", ")}
              {g.noi_bat.length > 0 && <span className="text-jade"> · nổi bật: {g.noi_bat.join(", ")}</span>}</li>
          ))}
        </ul>
      ) : <p className="text-sm text-fg-muted">Hợp làm việc thường ngày; việc cần chọn giờ thì xem ngày mai.</p>}
      <p className="text-xs text-fg-faint">{n.cach_dung}</p>
      <p className="text-xs text-fg-faint">Đây là nhịp gợi ý theo sách xưa, không phải dự báo.{" "}
        <Link href="/ky-mon" className="text-gold hover:underline">Chọn theo việc bạn định làm</Link></p>
    </MucGap>
  );
}
