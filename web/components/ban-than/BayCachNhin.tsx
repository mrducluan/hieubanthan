"use client";
// BT-UI — "Bảy cách nhìn về bạn" trên /ban-than (docs/DE-XUAT-BAN-THAN-HOM-NAY.md mục 2): mỗi môn một ô — một câu engine đã
// ghép riêng cho người này (/v1/goi-y-cheo, trang "ban_than": con số đã tính + KB, web chỉ hiển thị) và trạng thái "Sẵn
// sàng" hay còn thiếu gì; ô thiếu dữ liệu mở thẳng bảng Sửa hồ sơ. Nhân tướng và Tarot không tính từ ngày sinh → hiện
// trạng thái trên máy (đã soi gương chưa; lá hôm nay đã lật chưa — chưa lật thì KHÔNG lộ lá). Ô thứ tám ghép ba môn.
// Khâu QUAY LẠI + NẠP: đo cross_cta_viewed / cross_cta_clicked{tu: ban_than, den}.
import { useEffect, useRef, useState } from "react";
import Link from "@/components/khung/Lien";
import { ArrowRight, Layers, PencilLine, ScanFace, Sparkles } from "lucide-react";
import { BieuTuongManh } from "@/components/chia-se/TheBanDo";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { ghi } from "@/lib/do-luong";
import { GoiYCheo, TRANG_BAN_THAN, yeuCauGoiY, type TheGoiY } from "@/lib/goi-y-cheo";
import type { HoSo } from "@/lib/hoso";
import { demTraLoi, useTraLoi } from "@/lib/nhan-tuong";
import { baLaDaLat } from "@/lib/ba-la";
import type { LaNgay } from "@/lib/tarot-chung";
import { cn } from "@/lib/utils";

const MON = ["than_so", "tu_vi", "bat_tu", "phong_thuy", "kinh_dich"] as const;
const THIEU: Record<string, string> = { gio: "Cần giờ sinh", gioi_tinh: "Cần giới tính", noi_sinh: "Cần nơi sinh" };
const ngayMay = () => { try { return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); } catch { return new Date().toISOString().slice(0, 10); } };
const hai = (n: number) => String(n).padStart(2, "0");

function BieuTuong({ ma, className }: { ma: string; className?: string }) {
  if (ma === "than_so") return <BieuTuongManh ma="so" className={className} />;
  if (ma === "tu_vi") return <BieuTuongManh ma="sao" className={className} />;
  if (ma === "bat_tu") return <BieuTuongManh ma="nhat_chu" className={className} />;
  if (ma === "phong_thuy") return <BieuTuongManh ma="phi" className={className} />;
  if (ma === "kinh_dich") return <BieuTuongManh ma="que" className={className} />;
  if (ma === "nhan_tuong") return <ScanFace className={className} aria-hidden />;
  if (ma === "tarot") return <Sparkles className={className} aria-hidden />;
  return <Layers className={className} aria-hidden />;
}

interface O { mang: string; ten: string; nhan: string; cau: string; cta: string; duong: string; trang_thai: string; san_sang: boolean; can_them?: string | null }

function OMon({ o, onSua }: { o: O; onSua: () => void }) {
  const than = (
    <>
      <div className="flex items-center gap-2.5">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full border bg-[#1a1530]", o.san_sang ? "border-gold/50 text-gold" : "border-line text-fg-muted")}>
          <BieuTuong ma={o.mang} className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="eyebrow">{o.ten}</p>
          <p className="truncate text-sm font-semibold text-gold" data-testid="cach-nhin-nhan">{o.nhan}</p>
        </div>
      </div>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-fg" data-testid="cach-nhin-cau">{o.cau}</p>
      <span className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", o.san_sang ? "border-jade/40 text-jade" : "border-moon/40 text-moon")} data-testid="cach-nhin-trang-thai">{o.trang_thai}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold">{o.cta} {o.can_them ? <PencilLine className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}</span>
      </span>
    </>
  );
  const lop = "glass flex h-full w-full flex-col rounded-2xl p-5 text-left transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";
  const do_ = () => ghi("cross_cta_clicked", { tu: "ban_than", den: o.mang, ca_nhan: o.san_sang ? 1 : 0, ...(o.can_them ? { can_them: o.can_them } : {}) });
  // Thiếu giờ sinh / giới tính / nơi sinh → mở bảng Sửa hồ sơ ngay tại trang (không bắt đi sang trang khác rồi quay lại).
  return o.can_them
    ? <button type="button" className={lop} onClick={() => { do_(); onSua(); }} data-testid="cach-nhin" data-mang={o.mang} data-thieu={o.can_them}>{than}</button>
    : <Link href={o.duong} className={lop} onClick={do_} data-testid="cach-nhin" data-mang={o.mang}>{than}</Link>;
}

export function BayCachNhin({ hoSo, quyUoc, onSua }: { hoSo: HoSo; quyUoc: "tong_het" | "tung_phan"; onSua: () => void }) {
  const [the, setThe] = useState<TheGoiY[] | null>(null);
  const [la, setLa] = useState<LaNgay["la"] | null>(null);
  const [daLatTarot, setDaLatTarot] = useState(false);
  const traLoi = useTraLoi();
  const daGhi = useRef(false);
  const khoa = JSON.stringify(yeuCauGoiY(TRANG_BAN_THAN, hoSo, quyUoc));

  useEffect(() => {
    let huy = false;
    fetch("/api/goi-y-cheo", { method: "POST", headers: { "content-type": "application/json" }, body: khoa })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { const p = GoiYCheo.safeParse(j); if (!huy && p.success) setThe(p.data.the); })
      .catch(() => null);
    return () => { huy = true; };
  }, [khoa]);

  // Lá Tarot hôm nay: chỉ gọi engine khi người dùng ĐÃ lật lá đó ở Hôm nay (chưa lật thì ô chỉ mời lật, không lộ lá).
  useEffect(() => {
    const ngay = ngayMay();
    const lat = baLaDaLat(ngay).includes("tarot");
    setDaLatTarot(lat);
    if (!lat) return;
    let huy = false;
    fetch("/api/tarot/la-ngay", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ngay, ngay_sinh: `${hoSo.nam}-${hai(hoSo.thang)}-${hai(hoSo.ngay)}` }) })
      .then((r) => (r.ok ? (r.json() as Promise<LaNgay>) : null)).then((j) => { if (!huy && j?.la) setLa(j.la); }).catch(() => null);
    return () => { huy = true; };
  }, [hoSo.ngay, hoSo.thang, hoSo.nam]);

  useEffect(() => {
    if (the && !daGhi.current) { daGhi.current = true; ghi("cross_cta_viewed", { tu: "ban_than", so_san_sang: the.filter((t) => MON.includes(t.mang as never) && !t.can_them).length }); }
  }, [the]);

  if (!the) return null;   // engine cũ / lỗi mạng → khối tự ẩn, trang vẫn đủ các mục khác
  const soNet = demTraLoi(traLoi);
  const o: O[] = MON.map((m) => the.find((t) => t.mang === m)).filter((t): t is TheGoiY => Boolean(t)).map((t) => ({
    mang: t.mang, ten: t.ten, nhan: t.nhan, cau: t.cau, cta: t.cta, duong: t.duong, can_them: t.can_them,
    san_sang: !t.can_them, trang_thai: t.can_them ? THIEU[t.can_them] ?? "Cần bổ sung hồ sơ" : t.ca_nhan ? "Sẵn sàng" : "Mở để xem",
  }));
  o.push(soNet > 0
    ? { mang: "nhan_tuong", ten: "Nhân tướng", nhan: `Đã ghi ${soNet} nét trên gương mặt`, cau: "Bài đọc tám chương dựng từ những nét bạn tự soi — tính cách, công việc, tình cảm và nơi năm nay nên nhìn vào.", cta: "Đọc bài của bạn", duong: "/nhan-tuong", trang_thai: "Sẵn sàng", san_sang: true }
    : { mang: "nhan_tuong", ten: "Nhân tướng", nhan: "Chưa soi gương", cau: "Sáu bước soi gương, chừng năm phút. Môn này không tính từ ngày sinh — bạn tự nhìn và tự chọn từng nét.", cta: "Bắt đầu soi", duong: "/nhan-tuong", trang_thai: "Cần 5 phút soi gương", san_sang: false });
  o.push(daLatTarot && la
    ? { mang: "tarot", ten: "Tarot", nhan: `Lá hôm nay: ${la.ten}`, cau: la.y_xuoi, cta: "Rút bài cho một câu hỏi", duong: "/tarot", trang_thai: "Đã lật hôm nay", san_sang: true }
    : { mang: "tarot", ten: "Tarot", nhan: "Lá hôm nay đang úp", cau: "Mỗi ngày bạn có một lá Tarot riêng theo ngày sinh, luôn đọc xuôi. Lật ở trang Hôm nay cùng hai lá còn lại.", cta: "Lật ba lá hôm nay", duong: "/hom-nay#ba-la", trang_thai: "Chưa lật", san_sang: false });
  const sanSang = o.filter((x) => x.san_sang).length;
  o.push({ mang: "chan_dung", ten: "Ghép lại", nhan: "Chân dung tổng hợp", cau: "Tử vi, Bát tự và Nhân tướng đặt cạnh nhau theo từng mảng đời: chỗ nào cùng thấy, chỗ nào mỗi môn soi một mặt.", cta: "Xem chân dung", duong: "/chan-dung", trang_thai: "Ba môn một bảng", san_sang: true });

  return (
    <section aria-labelledby="muc-cach-nhin" data-testid="bay-cach-nhin" data-san-sang={sanSang}>
      <TieuDeMuc id="muc-cach-nhin" nho="Bảy cách nhìn về bạn" lon={sanSang >= 7 ? "Cả bảy môn đã sẵn sàng" : `${sanSang}/7 môn đã có điều để nói với bạn`}
        mo_ta="Cùng một con người, mỗi môn soi một góc. Mỗi ô là một câu viết riêng từ hồ sơ của bạn; ô còn thiếu ghi rõ cần thêm gì." />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {o.map((x) => <li key={x.mang} className="min-w-0"><OMon o={x} onSua={onSua} /></li>)}
      </ul>
    </section>
  );
}
