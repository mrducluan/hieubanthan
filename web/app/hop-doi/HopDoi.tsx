"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/khung/Lien";
import { HeartHandshake, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { KhungTai } from "@/components/khung/TieuDe";
import { KetQuaHopDoi, type KetQuaHopDoiT } from "@/components/hop-doi/KetQuaHopDoi";
import { TheChiaSeHopDoi } from "@/components/hop-doi/TheChiaSeHopDoi";
import { NutChiaSe } from "@/components/chia-se/NutChiaSe";
import { MocDocXong } from "@/components/khung/CuoiBaiDoc";
import { CuoiPhanXem } from "@/components/cta/CuoiPhanXem";
import { GopY } from "@/components/khung/GopY";
import { postJson } from "@/lib/goi-api";
import { hoTenList, ngayHopLe, tenGoi, useHoSo } from "@/lib/hoso";
import { useQuyUocDD } from "@/lib/quy-uoc-dd";
import { cn } from "@/lib/utils";
import { batDauDoc, ghi } from "@/lib/do-luong";
import { LoiDan, TieuDeTrang, useChu, useDauCms } from "@/components/cms/DauCms";

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
  const quyUoc = useQuyUocDD();   // TS-V3: cùng cách cộng Đường đời đã chọn ở /than-so
  const router = useRouter();
  const [ten, setTen] = useState("");
  const [ngay, setNgay] = useState("");
  const [thang, setThang] = useState("");
  const [nam, setNam] = useState("");
  const [quanHe, setQuanHe] = useState<MaQuanHe>("nguoi_yeu");
  const [kq, setKq] = useState<KetQuaHopDoiT | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const dauCms = useDauCms(), c = useChu();
  const thangRef = useRef<HTMLInputElement>(null);
  const namRef = useRef<HTMLInputElement>(null);

  // Lúc chờ hồ sơ vẫn có <h1> trong HTML phía máy chủ (SEO).
  if (hoSo === undefined) return <div className="mx-auto max-w-lg"><TieuDeTrang nho={c("dau.nhan_tren")} lon={c("dau.dang_tai")} /><KhungTai /></div>;
  if (hoSo === null) {
    return (
      <div className="mx-auto max-w-lg">
        <TieuDeTrang nho={c("dau.nhan_tren")} lon={c("dau.chua_ho_so")} mo_ta={c("dau.chua_ho_so_dan")} />
        <Card><NhapHoSo nutGui="Tiếp tục" onXong={() => router.refresh()} /></Card>
      </div>
    );
  }

  const chiSo = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

  async function xem(e: React.FormEvent) {
    e.preventDefault();
    if (!hoSo) return;
    const d = Number(ngay), m = Number(thang), y = Number(nam);
    if (!ngay && !thang && !nam) { setLoi("Nhập ngày sinh người ấy."); return; }
    if (!(nam.length === 4 && ngayHopLe(d, m, y)) || y < 1900 || Date.UTC(y, m - 1, d) > Date.now()) { setLoi("Ngày sinh người ấy chưa đúng — kiểm tra lại ngày, tháng, năm."); return; }
    setLoi(null); setDang(true);
    try {
      setKq(await postJson<KetQuaHopDoiT>("/api/thanso/hop-doi", {
        a: { ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam },
        b: { ...(ten.trim() ? { ho_ten: [ten.trim()] } : {}), ngay: d, thang: m, nam: y },
        quan_he: quanHe, quy_uoc_duong_doi: quyUoc,
      }));
      ghi("compatibility_created", { kind: "truc_tiep", quan_he: quanHe });
      batDauDoc("hopdoi", { quan_he: quanHe });
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
        <h1 className="mt-2 text-4xl sm:text-5xl">{dauCms.h1 ?? "Hai người, hai con số"}</h1>
        <LoiDan macDinh={<>
          Thần số không chấm điểm “hợp” hay “khắc”. Chọn người ấy là ai với bạn — người yêu, bạn bè, đồng nghiệp, sếp hay người thân —
          để xem mỗi người hiện ra thế nào trong vai đó, chỗ dễ hoà, chỗ dễ va, và một việc nên cùng làm.
        </>} />
        {/* Trục 2 UX: Tử vi "Xem lá số 2 người" có điểm tham khảo (HN-2N) — nói rõ hai mảng khác nhau, trỏ sang. */}
        <p className="mt-2 text-sm">
          <Link href="/tu-vi#hop-tham" className="text-gold underline-offset-4 hover:underline" data-testid="link-diem-tu-vi">
            Muốn xem điểm tham khảo theo Tử vi →
          </Link>
        </p>
      </header>
      {dauCms.khoiTren}

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
                <Input id="ten-kia" value={ten} maxLength={80} onChange={(e) => setTen(e.target.value)} placeholder="Ví dụ: Minh" />
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
            <NutChiaSe loai="invite" hoSo={hoSo} duongDan={(ma) => quanHe === "nguoi_yeu" ? `/hop-doi/${ma}` : `/hop-doi/${ma}?qh=${quanHe}`} nutTao="Tạo link mời"
              loiNhan={`${tenGoi(hoSo)} mời bạn xem hai người hợp nhau thế nào qua con số.`} />
          </Card>
        </div>
      )}

      {kq && (
        <>
          <KetQuaHopDoi kq={kq} tenA={tenGoi(hoSo)} tenB={ten.trim() ? tenGoi({ ho_ten: ten }) : "Người ấy"} />
          <TheChiaSeHopDoi kq={kq} tenA={tenGoi(hoSo)} tenB={ten.trim() ? tenGoi({ ho_ten: ten }) : "Người ấy"} />
          <div className="mx-auto max-w-3xl"><MocDocXong moDun="hopdoi" /><GopY moDun="hopdoi" cauHoi="Phần so hai người có giúp bạn hiểu mối quan hệ này hơn?" /></div>
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            <Card>
              <p className="font-serif text-lg">Mời người ấy xem cùng</p>
              <p className="mb-4 mt-1 text-sm text-fg-muted">Người ấy mở link sẽ thấy đúng vai {QUAN_HE.find((q) => q.ma === quanHe)?.ten.toLowerCase() ?? "quan hệ"} bạn chọn và tự nhập ngày sinh để mở góc nhìn 2 chiều.</p>
              <NutChiaSe loai="invite" hoSo={hoSo} duongDan={(ma) => quanHe === "nguoi_yeu" ? `/hop-doi/${ma}` : `/hop-doi/${ma}?qh=${quanHe}`} nutTao="Tạo link mời"
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
          <section className="mx-auto max-w-3xl space-y-4" data-testid="hop-doi-mo-rong-bac-1">
            {(kq.quan_he?.ma === "dong_nghiep" || kq.quan_he?.ma === "sep") && (
              <>
                <Card className="flex flex-col justify-between gap-3 border-gold/35 bg-gold/[0.06] sm:flex-row sm:items-center" data-testid="cau-noi-ban-do-doi-ngu">
                  <div>
                    <p className="eyebrow text-gold">Phối hợp cả đội ngũ</p>
                    <p className="mt-1 font-serif text-lg text-fg">Đang quản lý hoặc làm chung nhóm 2–8 người?</p>
                    <p className="mt-1 text-sm text-fg-muted">Xem Bản đồ Đội ngũ để nhìn bức tranh cân bằng 5 hành, sở trường từng người và cách ghép cặp dự án.</p>
                  </div>
                  <Button asChild size="sm" className="shrink-0 self-start sm:self-center">
                    <Link href="/quan-ly-nhan-su">Mở Bản đồ Đội ngũ</Link>
                  </Button>
                </Card>
                <p className="rounded-xl border border-line/70 bg-surface/40 px-4 py-3 text-xs leading-relaxed text-fg-muted" data-testid="luu-y-phap-ly-cong-viec">
                  <b className="text-fg">Lưu ý ranh giới ứng dụng:</b> Nội dung đối chiếu trong môi trường công việc chỉ dùng để tham khảo giao tiếp và văn hóa phối hợp — không dùng làm tiêu chí sàng lọc tuyển dụng hay đánh giá nhân sự.
                </p>
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="flex flex-col justify-between border-gold/30 bg-gold/[0.04]">
                <div>
                  <p className="eyebrow text-gold">Nhịp 12 tháng tới</p>
                  <p className="mt-1 font-serif text-lg text-fg">Xem Năm Mới của bạn</p>
                  <p className="mt-1 text-sm text-fg-muted">Gộp Tử vi · Bát tự · Thần số · Ngày đẹp cho 12 tháng tới để chọn đúng nhịp mở rộng hay giữ sức.</p>
                </div>
                <Button asChild size="sm" variant="secondary" className="mt-4 self-start">
                  <Link href="/thoi-gian-toi">Xem Năm Mới của tôi</Link>
                </Button>
              </Card>
              <Card className="flex flex-col justify-between border-jade/30 bg-jade/[0.04]">
                <div>
                  <p className="eyebrow text-jade">Hội viên &amp; Chuyên gia</p>
                  <p className="mt-1 font-serif text-lg text-fg">Hội viên năm &amp; Hỏi chuyên gia</p>
                  <p className="mt-1 text-sm text-fg-muted">Gom quyền lợi Sao hàng tháng và lượt hỏi chuyên gia trực tiếp (mức giá và trạng thái mở gói hiển thị theo cài đặt hiện hành).</p>
                </div>
                <Button asChild size="sm" className="mt-4 self-start">
                  <Link href="/hoi-vien">Xem quyền lợi Hội viên</Link>
                </Button>
              </Card>
            </div>
          </section>
          <div className="mx-auto max-w-5xl"><CuoiPhanXem mang="hop_doi" /></div>
        </>
      )}
    </div>
  );
}
