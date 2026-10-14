"use client";
// SAO-3 — hộp "Nhiệm vụ kiếm Sao": dạy vòng tăng trưởng bằng ba bước Lưu hồ sơ · Hỏi 3 câu · Mời 1 bạn.
// Điều kiện + mức thưởng do SQL kiểm (migration 0014, /api/sao/nhiem-vu); ở đây chỉ hiển thị và gọi nhận.
//   Chưa bật tài khoản / chưa chạy 0014 / lỗi mạng → không hiện gì (không vỡ trang).
//   Khách: chỉ hiện khi công tắc thưởng bật — ba nhiệm vụ + "Đăng nhập để nhận Sao" (hộp thoại Sao dùng chung).
//   Đã đăng nhập: tiến độ từng nhiệm vụ; xong thì "Nhận N Sao". Công tắc tắt → vẫn hiện tiến độ, ghi rõ chưa mở thưởng.
//   Nhận đủ cả ba → hộp tự ẩn (lần mở sau). Giọng: mời làm, không doạ, không đếm ngược.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Gift, Loader2, MessageCircle, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ghi } from "@/lib/do-luong";
import { hoiSao } from "@/lib/sao-client";
import { MA_NHIEM_VU, TEN_NHIEM_VU, type KetQuaNhiemVu, type MaNhiemVu, type TrangThaiNhiemVu } from "@/lib/nhiem-vu";

const ICON: Record<MaNhiemVu, typeof Save> = { luu_ho_so: Save, hoi_3_cau: MessageCircle, moi_1_ban: UserPlus };
const LAM: Record<MaNhiemVu, { href: string; chu: string }> = {
  luu_ho_so: { href: "/tai-khoan#tai-khoan", chu: "Lưu hồ sơ" },
  hoi_3_cau: { href: "/than-so#hoi", chu: "Đặt câu hỏi" },
  moi_1_ban: { href: "/tai-khoan#sao", chu: "Lấy link mời" },
};
const BAO: Partial<Record<KetQuaNhiemVu["ket_qua"], string>> = {
  da_nhan: "Nhiệm vụ này bạn đã nhận Sao rồi.",
  chua_mo: "Thưởng nhiệm vụ đang tạm dừng — tiến độ của bạn vẫn được ghi.",
  chua_dat: "Nhiệm vụ chưa xong — làm tiếp rồi quay lại nhận nhé.",
};

export function NhiemVuSao() {
  const [tt, setTt] = useState<TrangThaiNhiemVu | null>(null);
  const [dang, setDang] = useState<MaNhiemVu | null>(null);
  const [bao, setBao] = useState<string | null>(null);

  const tai = useCallback(async () => {
    try {
      const r = await fetch("/api/sao/nhiem-vu", { cache: "no-store" });
      setTt(r.ok ? ((await r.json()) as TrangThaiNhiemVu) : { tai_khoan: false });
    } catch { setTt({ tai_khoan: false }); }
  }, []);
  useEffect(() => { void tai(); }, [tai]);

  const nhan = async (ma: MaNhiemVu) => {
    setDang(ma); setBao(null);
    try {
      const r = await fetch("/api/sao/nhiem-vu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ma }) });
      const d = (await r.json().catch(() => null)) as (KetQuaNhiemVu & { error?: string }) | null;
      if (d?.ket_qua === "da_thuong") {
        setBao(`+${d.sao} Sao — ${TEN_NHIEM_VU[ma].ten.toLowerCase()} xong.`);
        ghi("credit_earned", { kind: "nhiem_vu", nhiem_vu: ma, so_sao: d.sao });
      } else setBao((d?.ket_qua && BAO[d.ket_qua]) || d?.error || "Chưa nhận được Sao, thử lại sau ít phút.");
    } catch { setBao("Chưa nhận được Sao, thử lại sau ít phút."); }
    setDang(null);
    await tai();
  };

  if (!tt || !tt.tai_khoan) return null;
  if (!tt.dang_nhap) {
    if (!tt.bat) return null;
    const tong = MA_NHIEM_VU.reduce((t, m) => t + (tt.muc[m] ?? 0), 0);
    if (tong <= 0) return null;
    return (
      <Khung tieuDe={`Ba bước nhỏ, nhận ${tong} Sao`} mo="Đăng nhập để theo dõi tiến độ và nhận Sao khi làm xong." trangThai="khach">
        <ul className="divide-y divide-line/60">
          {MA_NHIEM_VU.filter((m) => tt.muc[m] > 0).map((m) => (
            <Dong key={m} ma={m} phai={<span className="text-sm text-gold">+{tt.muc[m]} Sao</span>} />
          ))}
        </ul>
        <Button className="w-full sm:w-auto" data-testid="nhiem-vu-dang-nhap" onClick={() => void hoiSao({
          can: "dang_nhap", nguon: "nhiem_vu", thuong: tt.chao_mung || null,
          error: "Lưu hồ sơ, hỏi 3 câu, mời 1 bạn — mỗi bước xong là nhận Sao vào ví.",
        })}><Gift aria-hidden /> Đăng nhập để nhận Sao</Button>
      </Khung>
    );
  }
  if (!tt.san_sang) return null;
  const ds = tt.nhiem_vu.filter((n) => tt.bat ? n.sao > 0 || n.da_nhan : true);
  if (!ds.length || (ds.every((n) => n.da_nhan) && !bao)) return null;   // vừa nhận cái cuối → giữ hộp để thấy lời báo
  const conNhan = ds.filter((n) => !n.da_nhan).reduce((t, n) => t + n.sao, 0);
  return (
    <Khung trangThai="tai_khoan"
      tieuDe={tt.bat && conNhan > 0 ? `Nhiệm vụ kiếm Sao · còn ${conNhan} Sao` : "Ba bước làm quen"}
      mo={tt.bat ? "Mỗi bước xong là bấm nhận — Sao vào ví ngay." : "Thưởng Sao cho nhiệm vụ sẽ mở sau — tiến độ của bạn vẫn được ghi."}>
      <ul className="divide-y divide-line/60">
        {ds.map((n) => (
          <Dong key={n.ma} ma={n.ma} tienDo={`${n.tien_do}/${n.can}`} xong={n.dat} phai={
            n.da_nhan ? <span className="text-sm text-jade" data-testid={`nhiem-vu-da-nhan-${n.ma}`}>Đã nhận +{n.sao_da_nhan ?? n.sao}</span>
            : n.dat && tt.bat && n.sao > 0 ? (
              <Button size="sm" disabled={dang !== null} onClick={() => void nhan(n.ma)} data-testid={`nhiem-vu-nhan-${n.ma}`}>
                {dang === n.ma ? <Loader2 className="animate-spin" aria-hidden /> : <Gift aria-hidden />} Nhận {n.sao} Sao
              </Button>)
            : !n.dat ? <Link href={LAM[n.ma].href} className="text-sm text-gold underline-offset-4 hover:underline">{LAM[n.ma].chu}</Link>
            : null
          } />
        ))}
      </ul>
      {bao && <p role="status" className="rounded-xl bg-jade/10 px-4 py-3 text-sm text-jade">{bao}</p>}
    </Khung>
  );
}

function Khung({ tieuDe, mo, trangThai, children }: { tieuDe: string; mo: string; trangThai: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby="muc-nhiem-vu">
      <Card className="space-y-4" data-testid="nhiem-vu-sao" data-trang-thai={trangThai}>
        <div>
          <h2 id="muc-nhiem-vu" className="font-serif text-xl text-fg">{tieuDe}</h2>
          <p className="mt-1 text-sm text-fg-muted">{mo}</p>
        </div>
        {children}
        <p className="text-xs text-fg-faint">Sao là điểm thưởng nội bộ để mở luận giải chuyên sâu — không đổi ra tiền, không chuyển nhượng; Sao tặng có hạn 12 tháng.</p>
      </Card>
    </section>
  );
}

function Dong({ ma, tienDo, xong, phai }: { ma: MaNhiemVu; tienDo?: string; xong?: boolean; phai: React.ReactNode }) {
  const Icon = xong ? Check : ICON[ma];
  return (
    <li className="flex items-center gap-3 py-3" data-testid={`nhiem-vu-${ma}`}>
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${xong ? "bg-jade/15 text-jade" : "bg-gold/15 text-gold"}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-fg">{TEN_NHIEM_VU[ma].ten}{tienDo && <span className="ml-2 text-sm text-fg-faint" data-testid={`nhiem-vu-tien-do-${ma}`}>{tienDo}</span>}</span>
        <span className="block text-sm text-fg-muted">{TEN_NHIEM_VU[ma].mo}</span>
      </span>
      <span className="shrink-0">{phai}</span>
    </li>
  );
}
