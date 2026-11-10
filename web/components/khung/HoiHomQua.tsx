"use client";
// KC-4 GĐ2 — khối "Hôm qua của bạn" trên Hôm nay: hôm qua người dùng chọn ý định X → hỏi một chạm "gợi ý nhịp đó có
// đúng với bạn không?". Cùng câu hỏi với thông báo buổi sáng (sw.js); đã trả lời ở thông báo thì khối không hiện.
// Ý định chỉ nằm trên máy; câu trả lời là phiếu kiểm chứng ẩn danh (mã, không chữ).
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { docYDinh, nenHoi, traLoiHomQua, type YDinhNgay } from "@/lib/hom-qua";

const NHIP: Record<string, string> = { thuan: "nhịp thuận", trung_tinh: "nhịp bình thường", can_nhac: "nên làm cách khác" };

export function HoiHomQua({ homNay, tieuDe, cau, camOn }: { homNay: string; tieuDe: string; cau: (b: Record<string, string>) => string; camOn: string }) {
  const [y, setY] = useState<YDinhNgay | null>(null);
  const [xong, setXong] = useState(false);
  // BT-UI: sau 18 giờ, ý định chọn từ sớm của CHÍNH hôm nay được hỏi luôn ("Hôm nay thế nào?") — cùng phiếu, không hỏi lại sáng mai.
  const [luc, setLuc] = useState<"hom_qua" | "toi_nay">("hom_qua");
  useEffect(() => {
    let huy = false;
    void docYDinh().then((v) => { const k = nenHoi(v, homNay, new Date().getHours()); if (!huy && v && k) { setLuc(k); setY(v); } });
    return () => { huy = true; };
  }, [homNay]);
  if (!y) return null;
  const dau = y.ds[0]!;
  const tra = (kq: "dung" | "chua_dung") => {
    setXong(true);
    void traLoiHomQua(y, kq);
    ghi("feedback_submitted", { kind: "hom_qua", ket_qua: kq, y_dinh: dau.ma, nhip: dau.nhip, nguon: luc === "toi_nay" ? "trang_toi" : "trang" });
  };
  return (
    <section aria-labelledby="hom-qua" className="scroll-mt-24 glass space-y-2 rounded-2xl p-5" data-testid="hoi-hom-qua" data-luc={luc}>
      <h2 id="hom-qua" className="text-xl">{luc === "toi_nay" ? "Hôm nay thế nào?" : tieuDe}</h2>
      {xong ? (
        <p className="flex items-center gap-2 text-sm text-jade" role="status"><CheckCircle2 className="size-4" aria-hidden /> {camOn}</p>
      ) : (
        <>
          <p className="text-sm">{luc === "toi_nay"
            ? `Sáng nay bạn chọn việc ${dau.ten.toLowerCase()} — gợi ý “${NHIP[dau.nhip] ?? ""}” có đúng với ngày của bạn không?`
            : cau({ ten: dau.ten.toLowerCase(), nhip: NHIP[dau.nhip] ?? "" })}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => tra("dung")} className="rounded-full border border-jade/50 px-3 py-1 text-sm text-jade hover:bg-jade/10">Đúng với mình</button>
            <button type="button" onClick={() => tra("chua_dung")} className="rounded-full border border-line px-3 py-1 text-sm text-fg-muted hover:text-fg">Chưa đúng</button>
          </div>
        </>
      )}
    </section>
  );
}
