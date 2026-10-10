"use client";
// Ví Sao (CR-C): số dư, lịch sử, link mời cá nhân. Tự nhận thưởng chào mừng + thưởng được mời MỘT lần
// sau khi hồ sơ đã lưu vào tài khoản (điều kiện do hàm SQL kiểm, client chỉ gọi).
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KhungTai } from "@/components/khung/TieuDe";
import { ghi } from "@/lib/do-luong";
import {
  lichSu, maGioiThieuDaNho, nhanChaoMung, nhanThuongGioiThieu, quenMaGioiThieu, soDu, TEN_LOAI, useMaCuaToi, type DongSao,
} from "@/lib/sao";

const LOI_THUONG: Record<string, string> = {
  tu_moi: "Mã mời là của chính bạn nên không tính thưởng.",
  tai_khoan_cu: "Thưởng lời mời chỉ dành cho tài khoản mới (trong 7 ngày đầu).",
  khong_hop_le: "Mã mời không còn hợp lệ.",
};

export function ViSao({ daLuuHoSo }: { daLuuHoSo: boolean }) {
  const [du, setDu] = useState<number | null>(null);
  const [ls, setLs] = useState<DongSao[]>([]);
  const [bao, setBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const ma = useMaCuaToi(true);
  const daNhan = useRef(false);
  // QT-2: mức thưởng chủ sở hữu đang đặt (chiến dịch mời). Lỗi mạng → giữ mặc định.
  const [muc, setMuc] = useState({ moi_ban: 20, duoc_moi: 20, tran: 20 });
  useEffect(() => {
    fetch("/api/sao/muc").then((r) => (r.ok ? r.json() : null)).then((m) => { if (m) setMuc(m); }).catch(() => {});
  }, []);

  const tai = useCallback(async () => {
    try { const [d, l] = await Promise.all([soDu(), lichSu()]); setDu(d); setLs(l); setLoi(null); }
    catch (e) { setLoi(e instanceof Error ? e.message : "Chưa đọc được Sao."); }
  }, []);
  useEffect(() => { void tai(); }, [tai]);

  // Hồ sơ vừa lưu vào tài khoản → nhận Sao chào mừng + Sao lời mời (nếu đến từ link mời). Idempotent phía SQL.
  useEffect(() => {
    if (!daLuuHoSo || daNhan.current) return;
    daNhan.current = true;
    void (async () => {
      const bao2: string[] = [];
      try {
        const cm = await nhanChaoMung();
        if (cm.ket_qua === "da_thuong") { bao2.push(`+${cm.sao} Sao chào mừng`); ghi("credit_earned", { kind: "chao_mung", so_sao: cm.sao }); }
        const gt = maGioiThieuDaNho();
        if (gt) {
          const r = await nhanThuongGioiThieu(gt);
          if (r.ket_qua === "da_thuong") { bao2.push(`+${r.sao} Sao vì nhận lời mời của bạn bè`); ghi("credit_earned", { kind: "duoc_moi", so_sao: r.sao }); }
          else if (LOI_THUONG[r.ket_qua]) bao2.push(LOI_THUONG[r.ket_qua]!);
          if (r.ket_qua !== "chua_luu_ho_so") quenMaGioiThieu();
        }
      } catch { /* chưa chạy migration 0008: bỏ qua lặng lẽ */ }
      if (bao2.length) setBao(bao2.join(" · "));
      await tai();
    })();
  }, [daLuuHoSo, tai]);

  const link = ma && typeof window !== "undefined" ? `${window.location.origin}/?gt=${ma}` : null;

  if (loi && du === null) return <p className="text-sm text-fg-faint" data-testid="sao-chua-bat">Sao sẽ có khi hệ thống bật ví (đang chuẩn bị).</p>;
  if (du === null) return <KhungTai dong={1} />;

  return (
    <Card className="space-y-5" data-testid="vi-sao">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-gold/15 text-gold"><Sparkles className="size-6" aria-hidden /></span>
        <div>
          <p className="text-sm text-fg-muted">Sao của bạn</p>
          <p className="font-serif text-4xl text-gold" data-testid="so-sao">{du}</p>
        </div>
      </div>
      {bao && <p role="status" className="rounded-xl bg-jade/10 px-4 py-3 text-sm text-jade">{bao}</p>}

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-medium text-fg"><Gift className="size-4 text-gold" aria-hidden /> {muc.moi_ban === muc.duoc_moi
          ? `Mời bạn — cả hai cùng nhận ${muc.moi_ban} Sao` : `Mời bạn — bạn nhận ${muc.moi_ban} Sao, bạn bè nhận ${muc.duoc_moi} Sao`}</p>
        <p className="text-xs text-fg-faint">Bạn bè mở link, tạo tài khoản và lưu hồ sơ trong 7 ngày là cả hai được cộng. Tối đa {muc.tran} lượt thưởng mỗi 30 ngày.</p>
        {link ? (
          <div className="flex gap-2">
            <Input readOnly value={link} aria-label="Link mời cá nhân" onFocus={(e) => e.currentTarget.select()} />
            <Button variant="secondary" size="icon" aria-label="Sao chép link mời" onClick={() => {
              void navigator.clipboard?.writeText(link).then(() => { setDaChep(true); setTimeout(() => setDaChep(false), 2000); });
            }}>{daChep ? <Check aria-hidden /> : <Copy aria-hidden />}</Button>
          </div>
        ) : <KhungTai dong={1} />}
      </div>

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
      <p className="text-xs text-fg-faint">Sao dùng để mở các luận giải chuyên sâu (sắp ra mắt). Sao không đổi ra tiền và không chuyển cho người khác; Sao tặng có hạn 12 tháng.</p>
    </Card>
  );
}
