"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { KetQuaHopDoi, type KetQuaHopDoiT } from "@/components/hop-doi/KetQuaHopDoi";
import { NutChiaSe } from "@/components/chia-se/NutChiaSe";
import { postJson } from "@/lib/goi-api";
import { hoTenList, ngayHopLe, tenGoi, useHoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";

// Loại quan hệ — engine luận theo từng vai (người yêu / bạn bè / đồng nghiệp / sếp / gia đình).
const QUAN_HE = [
  { ma: "nguoi_yeu", ten: "Người yêu" },
  { ma: "ban_be", ten: "Bạn bè" },
  { ma: "dong_nghiep", ten: "Đồng nghiệp" },
  { ma: "sep", ten: "Sếp" },
  { ma: "gia_dinh", ten: "Gia đình" },
] as const;
type MaQuanHe = (typeof QUAN_HE)[number]["ma"];

export function HopDoi() {
  const hoSo = useHoSo();
  const router = useRouter();
  const [ten, setTen] = useState("");
  const [ngay, setNgay] = useState("");
  const [thang, setThang] = useState("");
  const [nam, setNam] = useState("");
  const [quanHe, setQuanHe] = useState<MaQuanHe>("nguoi_yeu");
  const tenQuanHe = QUAN_HE.find((q) => q.ma === quanHe)?.ten ?? "Người ấy";
  const [kq, setKq] = useState<KetQuaHopDoiT | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const thangRef = useRef<HTMLInputElement>(null);
  const namRef = useRef<HTMLInputElement>(null);

  // Lúc chờ hồ sơ vẫn có <h1> trong HTML phía máy chủ (SEO).
  if (hoSo === undefined) return <div className="mx-auto max-w-lg"><TieuDeMuc cap={1} nho="Hợp đôi" lon="Hợp đôi theo thần số học" /><KhungTai /></div>;
  if (hoSo === null) {
    return (
      <div className="mx-auto max-w-lg">
        <TieuDeMuc cap={1} nho="Hợp đôi" lon="Trước hết, con số của bạn" mo_ta="Nhập tên và ngày sinh của bạn, rồi mới đến người ấy." />
        <Card><NhapHoSo nutGui="Tiếp tục" onXong={() => router.refresh()} /></Card>
      </div>
    );
  }

  const chiSo = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

  async function xem(e: React.FormEvent) {
    e.preventDefault();
    if (!hoSo) return;
    const d = Number(ngay), m = Number(thang), y = Number(nam);
    if (!(nam.length === 4 && ngayHopLe(d, m, y)) || y < 1900 || Date.UTC(y, m - 1, d) > Date.now()) { setLoi("Ngày sinh người ấy chưa đúng."); return; }
    setLoi(null); setDang(true);
    try {
      setKq(await postJson<KetQuaHopDoiT>("/api/thanso/hop-doi", {
        a: { ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam },
        b: { ...(ten.trim() ? { ho_ten: [ten.trim()] } : {}), ngay: d, thang: m, nam: y },
        quan_he: quanHe,
      }));
      ghi("compatibility_created", { kind: "truc_tiep", quan_he: quanHe });
    } catch (e2) {
      setLoi(e2 instanceof Error ? e2.message : "Chưa tính được lúc này.");
    } finally {
      setDang(false);
    }
  }

  return (
    <div className="space-y-12">
      <header>
        <p className="eyebrow">Hợp đôi</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Hai người, hai con số</h1>
        <p className="mt-3 max-w-2xl text-fg-muted">
          Không có điểm “hợp” hay “khắc”. Chọn người ấy là ai với bạn — người yêu, bạn bè, đồng nghiệp, sếp hay người thân —
          để xem mỗi người hiện ra thế nào trong vai đó, chỗ dễ hoà, chỗ dễ va, và một việc nên cùng làm.
        </p>
      </header>

      {!kq && (
        <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="min-w-0">
            <form onSubmit={xem} className="space-y-5" noValidate>
              <fieldset>
                <legend className="text-sm font-medium text-fg-muted">Người ấy là</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUAN_HE.map((q) => (
                    <button key={q.ma} type="button" onClick={() => setQuanHe(q.ma)} aria-pressed={quanHe === q.ma}
                      data-testid={`quan-he-${q.ma}`}
                      className={cn("rounded-full border px-4 py-1.5 text-sm transition-colors",
                        quanHe === q.ma ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg")}>
                      {q.ten}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="ten-kia">Tên người ấy (không bắt buộc — có tên thì so thêm 3 cặp số)</Label>
                <Input id="ten-kia" value={ten} maxLength={80} onChange={(e) => setTen(e.target.value)} placeholder="Trần Thị Mai" />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-fg-muted">Ngày sinh người ấy (dương lịch)</legend>
                <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
                  <Input aria-label="Ngày sinh người ấy" inputMode="numeric" placeholder="Ngày" value={ngay} className="text-center"
                    onChange={(e) => { const v = chiSo(e.target.value, 2); setNgay(v); if (v.length === 2) thangRef.current?.focus(); }} />
                  <Input ref={thangRef} aria-label="Tháng sinh người ấy" inputMode="numeric" placeholder="Tháng" value={thang} className="text-center"
                    onChange={(e) => { const v = chiSo(e.target.value, 2); setThang(v); if (v.length === 2) namRef.current?.focus(); }} />
                  <Input ref={namRef} aria-label="Năm sinh người ấy" inputMode="numeric" placeholder="Năm" value={nam} className="text-center"
                    onChange={(e) => setNam(chiSo(e.target.value, 4))} />
                </div>
              </fieldset>
              {loi && <p role="alert" className="rounded-xl bg-cinnabar/10 px-4 py-3 text-sm text-cinnabar">{loi}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={dang}>
                <HeartHandshake aria-hidden /> {dang ? "Đang so…" : "Xem hai người"}
              </Button>
              <p className="text-center text-xs text-fg-faint">Ngày sinh người ấy chỉ dùng để tính, không lưu lại.</p>
            </form>
          </Card>

          <Card className="min-w-0">
            <div className="flex items-center gap-2 text-moon"><Send className="size-4" aria-hidden /><p className="font-serif text-lg text-fg">Không biết ngày sinh người ấy?</p></div>
            <p className="mb-4 mt-2 text-sm text-fg-muted">
              Gửi lời mời — người ấy tự nhập ngày sinh của họ, và cả hai cùng thấy kết quả. Tôn trọng dữ liệu của người khác.
            </p>
            <NutChiaSe loai="invite" hoSo={hoSo} duongDan={(ma) => `/hop-doi/${ma}`} nutTao="Tạo link mời"
              loiNhan={`${tenGoi(hoSo)} mời bạn xem hai người hợp nhau thế nào qua con số.`} />
          </Card>
        </div>
      )}

      {kq && (
        <>
          <KetQuaHopDoi kq={kq} tenA={tenGoi(hoSo)} tenB={ten.trim() ? tenGoi({ ho_ten: ten }) : tenQuanHe} />
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            <Card>
              <p className="font-serif text-lg">Mời người ấy xem cùng</p>
              <p className="mb-4 mt-1 text-sm text-fg-muted">Người ấy sẽ tự nhập ngày sinh của họ để mở kết quả đầy đủ.</p>
              <NutChiaSe loai="invite" hoSo={hoSo} duongDan={(ma) => `/hop-doi/${ma}`} nutTao="Tạo link mời"
                loiNhan={`${tenGoi(hoSo)} mời bạn xem hai người hợp nhau thế nào qua con số.`} />
            </Card>
            <Card className="flex flex-col justify-between">
              <div>
                <p className="font-serif text-lg">Xem với người khác</p>
                <p className="mt-1 text-sm text-fg-muted">Bạn bè, đồng nghiệp, bố mẹ — mỗi mối quan hệ một nhịp riêng.</p>
              </div>
              <Button variant="secondary" className="mt-4" onClick={() => { setKq(null); setTen(""); setNgay(""); setThang(""); setNam(""); }}>
                So với người khác
              </Button>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
