"use client";
// KC-2 — thẻ "Tháng này nhà bạn" trên Hôm nay: đọc hồ sơ nhà lưu trên máy (lib/ho-so-nha), hỏi engine sao tháng tại cung
// cửa (đổi theo tiết khí → lý do quay lại mỗi tháng). Chưa có nhà → một dòng mời đo hướng ở trang Phong thuỷ.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { ChipMuc } from "@/components/luan-giai/BaoCaoDoiSong";
import type { Muc } from "@/components/luan-giai/kieu";
import { nhaTuHoSo, tenNha, useHoSoNha } from "@/lib/ho-so-nha";
import { postJson } from "@/lib/goi-api";

interface ThangNay {
  nam: number; huong: string; cua_trung_phuong_tranh: boolean;
  phuong_tranh: { ten: string; phuong: string }[];
  thang: { chi_thang: string; ten_sao: string; muc: Muc; nhan_muc: string; y: string };
  ba_thang: { chi_thang: string; muc: Muc; nhan_muc: string }[];
  viec: string[];
  huyen_khong: { cuc_ten: string; van: number } | null;
}

export function ThangNayNha() {
  const nha = useHoSoNha();
  const [kq, setKq] = useState<ThangNay | null>(null);
  const than = nhaTuHoSo(nha);
  const khoa = than ? JSON.stringify(than) : "";
  useEffect(() => {
    if (!khoa) { setKq(null); return; }
    let huy = false;
    postJson<ThangNay>("/api/phongthuy/thang-nay", JSON.parse(khoa)).then((d) => { if (!huy) setKq(d); }).catch(() => { if (!huy) setKq(null); });
    return () => { huy = true; };
  }, [khoa]);
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
  return (
    <section aria-labelledby="thang-nay-nha" className="glass space-y-2 rounded-2xl p-5" data-testid="thang-nay-nha">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="thang-nay-nha" className="flex items-center gap-2 text-xl"><Home className="size-5 text-gold" aria-hidden /> Tháng này {tenNha(nha)}</h2>
        <ChipMuc muc={kq.thang.muc} nhan={kq.thang.nhan_muc} />
      </div>
      <p className="text-sm">Tháng {kq.thang.chi_thang} (theo tiết khí), sao {kq.thang.ten_sao} tới phía cửa {kq.huong}: {kq.thang.y}.</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-fg">{kq.viec.map((v) => <li key={v}>{v}</li>)}</ul>
      <p className="text-xs text-fg-faint">Hai tháng tới: {kq.ba_thang.slice(1).map((t) => `tháng ${t.chi_thang} ${t.nhan_muc.toLowerCase()}`).join(" · ")}.
        {kq.cua_trung_phuong_tranh && ` Năm ${kq.nam}, phía cửa trùng phương sách xưa khuyên giữ yên — không đục phá phía đó trong năm.`}</p>
      <Link href="/phong-thuy#nha-cua-ban" className="text-sm text-gold hover:underline">Đọc đủ bài "Nhà của bạn" →</Link>
    </section>
  );
}
