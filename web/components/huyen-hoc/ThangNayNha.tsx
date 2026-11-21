"use client";
// KC-2 — thẻ "Tháng này nhà bạn" trên Hôm nay: đọc hồ sơ nhà lưu trên máy (lib/ho-so-nha), hỏi engine sao tháng tại cung
// cửa (đổi theo tiết khí → lý do quay lại mỗi tháng). Chưa có nhà → một dòng mời đo hướng ở trang Phong thuỷ.
// DC-MB: `cuaHang` = cùng thẻ cho hồ sơ cửa hàng trên máy (lib/mat-bang): hướng mặt tiền, năm xây chỉ khi biết (đúng năm /
// khoảng năm); chưa có hồ sơ cửa hàng → không hiện gì (không mời, tránh trùng lời mời đo hướng nhà).
import Link from "@/components/khung/Lien";
import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { ChipMuc } from "@/components/luan-giai/BaoCaoDoiSong";
import type { Muc } from "@/components/luan-giai/kieu";
import { nhaTuHoSo, tenNha, useHoSoNha } from "@/lib/ho-so-nha";
import { ghi } from "@/lib/do-luong";
import { useMatBang } from "@/lib/mat-bang";
import { postJson } from "@/lib/goi-api";

interface ThangNay {
  nam: number; huong: string; cua_trung_phuong_tranh: boolean;
  phuong_tranh: { ten: string; phuong: string }[];
  thang: { chi_thang: string; ten_sao: string; muc: Muc; nhan_muc: string; y: string };
  ba_thang: { chi_thang: string; muc: Muc; nhan_muc: string }[];
  viec: string[];
  huyen_khong: { cuc_ten: string; van: number } | null;
}

export function ThangNayNha({ cuaHang = false }: { cuaHang?: boolean } = {}) {
  const nhaO = useHoSoNha();
  const mb = useMatBang();
  const nha = cuaHang ? undefined : nhaO;
  const [kq, setKq] = useState<ThangNay | null>(null);
  const than = cuaHang ? null : nhaTuHoSo(nha);
  // Cửa hàng: năm xây chỉ gửi khi đúng năm / khoảng năm (không rõ → không có nam_xay).
  const thanCh = cuaHang && mb
    ? { huong_do: mb.do_huong, ...(mb.cach_nam !== "khong_ro" && mb.nam_xay ? { nam_xay: mb.nam_xay } : {}) }
    : null;
  // Route thang-nay không nhận `theo` (chỉ là ghi chú cách đo) → bỏ trước khi gửi.
  const khoa = than ? JSON.stringify({ ...than, theo: undefined }) : thanCh ? JSON.stringify(thanCh) : "";
  const [daGhi, setDaGhi] = useState(false);
  useEffect(() => {
    if (cuaHang && kq && !daGhi) { setDaGhi(true); ghi("chart_interacted", { mo_dun: "doanh_chu", kind: "cua_hang_thang_nay" }); }
  }, [cuaHang, kq, daGhi]);
  useEffect(() => {
    if (!khoa) { setKq(null); return; }
    let huy = false;
    postJson<ThangNay>("/api/phongthuy/thang-nay", JSON.parse(khoa)).then((d) => { if (!huy) setKq(d); }).catch(() => { if (!huy) setKq(null); });
    return () => { huy = true; };
  }, [khoa]);
  if (cuaHang) {
    if (!thanCh || !kq) return null;
    return <TheThangNay kq={kq} tieuDe="Tháng này cửa hàng của bạn" testid="thang-nay-cua-hang"
      link={{ href: "/ban-do-doi-ngu", chu: "Xem Mặt bằng & Lịch 12 tháng của cửa hàng →" }} />;
  }
  if (nha === undefined) return null;
  if (!than) {
    return (
      <section aria-labelledby="thang-nay-nha" className="glass rounded-2xl p-5" data-testid="thang-nay-nha-trong">
        <h2 id="thang-nay-nha" className="flex items-center gap-2 text-xl"><Home className="size-5 text-gold" aria-hidden /> Tháng này nhà bạn</h2>
        <p className="mt-1 text-sm text-fg-muted">Đo hướng cửa một lần ở trang Phong thuỷ, mỗi tháng thẻ này sẽ nói tháng nào nên sửa, tháng nào nên giữ yên phía cửa.</p>
        <Link href="/phong-thuy#nha-cua-ban" className="mt-2 inline-block text-sm text-gold hover:underline">Đo hướng nhà của tôi →</Link>
      </section>
    );
  }
  if (!kq) return null;
  return <TheThangNay kq={kq} tieuDe={`Tháng này ${tenNha(nha)}`} testid="thang-nay-nha"
    link={{ href: "/phong-thuy#nha-cua-ban", chu: 'Đọc đủ bài "Nhà của bạn" →' }} />;
}

function TheThangNay({ kq, tieuDe, testid, link }: { kq: ThangNay; tieuDe: string; testid: string; link: { href: string; chu: string } }) {
  const id = testid;   // "thang-nay-nha" giữ neo cũ (thông báo đẩy mở /hom-nay#thang-nay-nha)
  return (
    <section aria-labelledby={id} className="glass space-y-2 rounded-2xl p-5" data-testid={testid}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="flex items-center gap-2 text-xl"><Home className="size-5 text-gold" aria-hidden /> {tieuDe}</h2>
        <ChipMuc muc={kq.thang.muc} nhan={kq.thang.nhan_muc} />
      </div>
      <p className="text-sm">Tháng {kq.thang.chi_thang} (theo tiết khí), sao {kq.thang.ten_sao} tới phía cửa {kq.huong}: {kq.thang.y}.</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-fg">{kq.viec.map((v) => <li key={v}>{v}</li>)}</ul>
      <p className="text-xs text-fg-faint">Hai tháng tới: {kq.ba_thang.slice(1).map((t) => `tháng ${t.chi_thang} ${t.nhan_muc.toLowerCase()}`).join(" · ")}.
        {kq.cua_trung_phuong_tranh && ` Năm ${kq.nam}, phía cửa trùng phương sách xưa khuyên giữ yên — không đục phá phía đó trong năm.`}</p>
      <Link href={link.href} className="text-sm text-gold hover:underline">{link.chu}</Link>
    </section>
  );
}
