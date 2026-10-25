"use client";
// Ví Sao (CR-C · SAO-V 0025): số dư tách Sao đã mua (không hết hạn) / Sao tặng (hạn 365 ngày, dùng trước), lịch sử,
// link mời cá nhân, hoa hồng từ lời mời (một tầng — chỉ ngày + số Sao + trạng thái, không lộ bạn nào nạp).
// Tự nhận thưởng chào mừng + thưởng được mời MỘT lần sau khi hồ sơ đã lưu vào tài khoản (lib/nhan-thuong.ts;
// điều kiện do hàm SQL kiểm, client chỉ gọi).
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Gift, HandCoins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KhungTai } from "@/components/khung/TieuDe";
import { lichSu, hoaHongCuaToi, soDu, TEN_LOAI, useMaCuaToi, viChiTiet, type DongSao, type HoaHong, type ViChiTiet } from "@/lib/sao";
import { baoNhanThuong, nhanThuongSauLuu } from "@/lib/nhan-thuong";
import { loiHoaHong, MUC_MAC_DINH, useMucSao } from "@/lib/muc-sao";

const TRANG_THAI_HH: Record<HoaHong["lan"][number]["trang_thai"], string> = {
  da_cong: "đã cộng",
  qua_tran: "vượt trần tháng — chưa cộng",
  thu_hoi: "đã thu hồi vì đơn hoàn tiền",
};
const ngayVn = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : s;
};

export function ViSao({ daLuuHoSo }: { daLuuHoSo: boolean }) {
  const [vi, setVi] = useState<ViChiTiet | null>(null);
  const [chiTiet, setChiTiet] = useState(false);   // false = chưa chạy 0025 → chỉ có tổng
  const [ls, setLs] = useState<DongSao[]>([]);
  const [hh, setHh] = useState<HoaHong | null>(null);
  const [bao, setBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const ma = useMaCuaToi(true);
  const daNhan = useRef(false);
  const muc = useMucSao() ?? MUC_MAC_DINH;

  const tai = useCallback(async () => {
    try {
      const [v, l] = await Promise.all([
        viChiTiet().then((x) => { setChiTiet(true); return x; })
          .catch(async () => { setChiTiet(false); return { so_du: await soDu(), sao_mua: 0, sao_tang: 0 }; }),
        lichSu(),
      ]);
      setVi(v); setLs(l); setLoi(null);
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa đọc được Sao."); }
    hoaHongCuaToi().then(setHh).catch(() => setHh(null));   // chưa chạy 0025 → không hiện khối hoa hồng
  }, []);
  useEffect(() => { void tai(); }, [tai]);

  // Hồ sơ đã lưu vào tài khoản → nhận Sao chào mừng + Sao lời mời (nếu đến từ link mời). Idempotent phía SQL;
  // trang Tài khoản vừa lưu xong cũng gọi cùng hàm — lượt sau chỉ nhận "đã nhận", không báo trùng.
  useEffect(() => {
    if (!daLuuHoSo || daNhan.current) return;
    daNhan.current = true;
    void nhanThuongSauLuu("vi_sao").then(async (kq) => {
      const b = baoNhanThuong(kq);
      if (b) setBao(b);
      await tai();
    });
  }, [daLuuHoSo, tai]);

  const link = ma && typeof window !== "undefined" ? `${window.location.origin}/?gt=${ma}` : null;

  if (loi && vi === null) return <p className="text-sm text-fg-faint" data-testid="sao-chua-bat">Sao sẽ có khi hệ thống bật ví (đang chuẩn bị).</p>;
  if (vi === null) return <KhungTai dong={1} />;

  const coHh = hh && (hh.bat || hh.lan.length > 0);
  return (
    <Card className="space-y-5" data-testid="vi-sao">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-gold/15 text-gold"><Sparkles className="size-6" aria-hidden /></span>
        <div>
          <p className="text-sm text-fg-muted">Sao của bạn</p>
          <p className="font-serif text-4xl text-gold" data-testid="so-sao">{vi.so_du}</p>
        </div>
        <Button asChild size="sm" className="ml-auto"><Link href="/nap-sao">Nạp Sao</Link></Button>
      </div>
      {chiTiet && (
        <div className="space-y-2" data-testid="vi-chi-tiet">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-line/60 p-3">
              <p className="font-serif text-2xl text-fg" data-testid="sao-mua">{vi.sao_mua}</p>
              <p className="text-fg-muted">Sao đã mua</p>
              <p className="text-xs text-fg-faint">Không bao giờ hết hạn.</p>
            </div>
            <div className="rounded-xl border border-line/60 p-3">
              <p className="font-serif text-2xl text-fg" data-testid="sao-tang">{vi.sao_tang}</p>
              <p className="text-fg-muted">Sao tặng</p>
              <p className="text-xs text-fg-faint">Hạn 365 ngày kể từ ngày nhận.</p>
            </div>
          </div>
          <p className="text-xs text-fg-faint">Khi dùng, Sao tặng được trừ trước — Sao bạn đã mua để dành tới sau cùng.</p>
        </div>
      )}
      {bao && <p role="status" className="rounded-xl bg-jade/10 px-4 py-3 text-sm text-jade" data-testid="vi-sao-bao">{bao}</p>}

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-medium text-fg"><Gift className="size-4 text-gold" aria-hidden /> {muc.moi_ban === muc.duoc_moi
          ? `Mời bạn — cả hai cùng nhận ${muc.moi_ban} Sao` : `Mời bạn — bạn nhận ${muc.moi_ban} Sao, bạn bè nhận ${muc.duoc_moi} Sao`}</p>
        <p className="text-xs text-fg-faint" data-testid="dieu-kien-moi">
          Bạn bè mở link của bạn, đăng nhập và lưu hồ sơ vào tài khoản là cả hai được cộng — tài khoản mới hay cũ đều được,
          miễn là bạn ấy chưa từng nhận lời mời của ai. Tối đa {muc.tran} lượt thưởng mỗi 30 ngày.
        </p>
        {link ? (
          <div className="flex gap-2">
            <Input readOnly value={link} aria-label="Link mời cá nhân" onFocus={(e) => e.currentTarget.select()} />
            <Button variant="secondary" size="icon" aria-label="Sao chép link mời" onClick={() => {
              void navigator.clipboard?.writeText(link).then(() => { setDaChep(true); setTimeout(() => setDaChep(false), 2000); });
            }}>{daChep ? <Check aria-hidden /> : <Copy aria-hidden />}</Button>
          </div>
        ) : <KhungTai dong={1} />}
      </div>

      {coHh && hh && (
        <div className="space-y-2 rounded-2xl border border-gold/30 bg-gold/[0.04] p-4" data-testid="hoa-hong">
          <p className="flex items-center gap-2 text-sm font-medium text-fg"><HandCoins className="size-4 text-gold" aria-hidden /> Hoa hồng từ lời mời</p>
          {hh.bat
            ? <p className="text-xs text-fg-faint" data-testid="dieu-kien-hoa-hong">{loiHoaHong(hh)} Trả bằng Sao tặng; đơn bị hoàn tiền thì Sao đó được thu hồi.</p>
            : <p className="text-xs text-fg-faint">Chương trình hoa hồng đang tạm dừng. Sao đã nhận vẫn giữ nguyên.</p>}
          <p className="text-sm text-fg-muted">
            Đã nhận <b className="text-gold" data-testid="hoa-hong-tong">{hh.tong_sao} Sao</b> · {hh.ban_da_moi} bạn đã nhận lời mời của bạn
          </p>
          {hh.lan.length > 0 ? (
            <ul className="divide-y divide-line/60 text-sm" data-testid="hoa-hong-lan">
              {hh.lan.map((x, i) => (
                <li key={`${x.ngay}-${i}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-fg-muted">{ngayVn(x.ngay)} · {TRANG_THAI_HH[x.trang_thai] ?? x.trang_thai}</span>
                  <span className={x.trang_thai === "da_cong" ? "text-jade" : "text-fg-faint"}>{x.trang_thai === "da_cong" ? `+${x.sao}` : x.sao} Sao</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-fg-faint">Chưa có lần nào. Bạn chỉ thấy ngày và số Sao — không thấy ai nạp hay nạp bao nhiêu tiền.</p>}
        </div>
      )}

      {ls.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-fg-muted hover:text-fg">Lịch sử Sao</summary>
          <ul className="mt-3 divide-y divide-line/60">
            {ls.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <span>{TEN_LOAI[d.loai] ?? d.loai}{d.ghi_chu ? <span className="text-fg-faint"> · {d.ghi_chu}</span> : null}</span>
                <span className={d.so_luong > 0 ? "text-jade" : "text-fg-muted"}>{d.so_luong > 0 ? `+${d.so_luong}` : d.so_luong}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="text-xs text-fg-faint">Sao dùng để mở các luận giải chuyên sâu. Sao không đổi ra tiền và không chuyển cho người khác. Sao mua không hết hạn; Sao tặng (chào mừng, mời bạn, hoa hồng, nhiệm vụ…) có hạn 365 ngày.</p>
    </Card>
  );
}
