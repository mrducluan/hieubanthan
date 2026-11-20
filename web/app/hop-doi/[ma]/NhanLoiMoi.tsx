"use client";
import { useEffect, useState } from "react";
import Link from "@/components/khung/Lien";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { QuaNguoiNhan } from "@/components/sao/QuaNguoiNhan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { KhungTai } from "@/components/khung/TieuDe";
import { KetQuaHopDoi, type KetQuaHopDoiT } from "@/components/hop-doi/KetQuaHopDoi";
import { TheChiaSeHopDoi } from "@/components/hop-doi/TheChiaSeHopDoi";
import { NutChiaSe } from "@/components/chia-se/NutChiaSe";
import { useBaiDoc } from "@/lib/bai-doc";
import { postJson } from "@/lib/goi-api";
import { tenGoi, useHoSo } from "@/lib/hoso";
import { batDauDoc, ghi, maMoiTuToken, nhoMaMoi } from "@/lib/do-luong";
import { MocDocXong } from "@/components/khung/CuoiBaiDoc";
import { GopY } from "@/components/khung/GopY";
import { cn } from "@/lib/utils";

const QUAN_HE = [
  { ma: "nguoi_yeu", ten: "Người yêu" },
  { ma: "ban_be", ten: "Bạn bè" },
  { ma: "dong_nghiep", ten: "Đồng nghiệp" },
  { ma: "sep", ten: "Sếp" },
  { ma: "gia_dinh", ten: "Gia đình" },
] as const;
type MaQuanHe = (typeof QUAN_HE)[number]["ma"];

interface Props {
  ma: string;
  tenMoi: string;
  soMoi: number;
  tuKhoa: string | null;
  quanHeBanDau?: MaQuanHe;
}

export function NhanLoiMoi({ ma, tenMoi, soMoi, tuKhoa, quanHeBanDau = "nguoi_yeu" }: Props) {
  const hoSo = useHoSo();
  const { kq: baiDoc, loi: loiDoc } = useBaiDoc(hoSo);
  const [quanHe, setQuanHe] = useState<MaQuanHe>(quanHeBanDau);
  const [kq, setKq] = useState<KetQuaHopDoiT | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    const m = maMoiTuToken(ma);
    nhoMaMoi(m);
    ghi("share_clicked", { kind: "invite", ma_moi: m, quan_he: quanHeBanDau });
  }, [ma, quanHeBanDau]);

  useEffect(() => {
    if (!baiDoc) return;
    let huy = false;
    setLoi(null);
    const so = Object.fromEntries(baiDoc.cac_vi_tri.map((v) => [v.vi_tri, v.gia_tri]));
    postJson<KetQuaHopDoiT>("/api/hop-doi/moi", { ma, b: so, quan_he: quanHe })
      .then((d) => {
        if (huy) return;
        setKq(d);
        ghi("compatibility_created", { kind: "loi_moi", ma_moi: maMoiTuToken(ma), quan_he: quanHe });
        batDauDoc("hopdoi", { kind: "loi_moi" });
      })
      .catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : "Chưa tính được lúc này."); });
    return () => { huy = true; };
  }, [baiDoc, ma, quanHe]);

  const tenQH = QUAN_HE.find((q) => q.ma === quanHe)?.ten ?? "Người yêu";
  const capChinh = kq?.cac_cap[0]?.nghia;

  return (
    <div className="space-y-10">
      <header className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Lời mời hợp đôi · {tenQH}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl"><span className="text-gold">{tenMoi}</span> mời bạn xem hai người</h1>
        <div className="mx-auto mt-6 grid size-28 place-items-center rounded-full border border-gold/50 bg-gold/10 shadow-glow">
          <span className="text-gradient-gold font-serif text-6xl" data-testid="so-nguoi-moi">{soMoi}</span>
        </div>
        <p className="mt-3 text-sm text-fg-muted">Số đường đời của {tenMoi}{tuKhoa ? ` — ${tuKhoa}` : ""}</p>
        <QuaNguoiNhan className="mt-4" />
      </header>

      {hoSo === undefined && <KhungTai />}

      {hoSo === null && (
        <Card className="mx-auto max-w-lg">
          <p className="font-serif text-xl">Con số của bạn là gì?</p>
          <p className="mb-5 mt-1 text-sm text-fg-muted">Nhập tên và ngày sinh để mở góc nhìn 2 chiều với {tenMoi} — và bài đọc riêng của bạn.</p>
          <NhapHoSo nutGui="Mở kết quả hai người" onXong={() => { /* useHoSo cập nhật → tự tính */ }} />
        </Card>
      )}

      {hoSo && (
        <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-2" role="group" aria-label="Chọn mối quan hệ">
          {QUAN_HE.map((q) => (
            <button key={q.ma} type="button" onClick={() => setQuanHe(q.ma)} aria-pressed={quanHe === q.ma}
              data-testid={`loi-moi-qh-${q.ma}`}
              className={cn("rounded-full border px-3.5 py-1 text-xs transition-colors",
                quanHe === q.ma ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg")}>
              {q.ten}
            </button>
          ))}
        </div>
      )}

      {(loi || loiDoc) && <p className="mx-auto max-w-lg rounded-xl bg-cinnabar/10 p-4 text-center text-sm text-cinnabar">{loi ?? loiDoc}</p>}
      {hoSo && !kq && !loi && !loiDoc && <KhungTai dong={2} />}

      {hoSo && kq && (
        <>
          <KetQuaHopDoi kq={kq} tenA={tenMoi} tenB={tenGoi(hoSo)} />

          {/* Mở khoá góc nhìn phối hợp 2 chiều khi người được mời nhập hồ sơ */}
          <Card className="mx-auto max-w-3xl border-jade/35 bg-jade/[0.05]" data-testid="mo-khoa-hai-chieu">
            <p className="eyebrow flex items-center gap-1.5 text-jade">
              <Sparkles className="size-3.5" aria-hidden /> Đã mở góc nhìn phối hợp 2 chiều
            </p>
            <h2 className="mt-1 font-serif text-xl text-fg">
              Gợi ý thực tế cho {tenMoi} &amp; {tenGoi(hoSo)} ({tenQH})
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {capChinh?.cung_lam && (
                <div className="rounded-xl border border-line/70 bg-surface/50 p-3.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-gold">Việc nên làm cùng nhau</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg">{capChinh.cung_lam}</p>
                </div>
              )}
              {kq.quan_he?.cau_hoi_chung && (
                <div className="rounded-xl border border-line/70 bg-surface/50 p-3.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-moon">Câu hỏi mở lời cho hai người</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg">{kq.quan_he.cau_hoi_chung}</p>
                </div>
              )}
            </div>
          </Card>

          <TheChiaSeHopDoi kq={kq} tenA={tenMoi} tenB={tenGoi(hoSo)} />

          {(quanHe === "dong_nghiep" || quanHe === "sep") && (
            <div className="mx-auto max-w-3xl space-y-3">
              <Card className="flex flex-col justify-between gap-3 border-gold/35 bg-gold/[0.06] sm:flex-row sm:items-center">
                <div>
                  <p className="eyebrow text-gold">Phối hợp cả đội ngũ</p>
                  <p className="mt-1 font-serif text-lg text-fg">Làm chung nhóm 2–8 người? Xem Bản đồ Đội ngũ</p>
                  <p className="mt-1 text-sm text-fg-muted">Cân bằng 5 hành, sở trường từng cộng sự và gợi ý ghép cặp dự án — không lưu ngày sinh.</p>
                </div>
                <Button asChild size="sm" className="shrink-0 self-start sm:self-center">
                  <Link href="/ban-do-doi-ngu">Mở Bản đồ Đội ngũ</Link>
                </Button>
              </Card>
              <p className="rounded-xl border border-line/70 bg-surface/40 px-4 py-3 text-xs leading-relaxed text-fg-muted">
                <b className="text-fg">Lưu ý ranh giới ứng dụng:</b> Nội dung đối chiếu trong môi trường công việc chỉ dùng để tham khảo giao tiếp và văn hóa phối hợp — không dùng làm tiêu chí sàng lọc tuyển dụng hay đánh giá nhân sự.
              </p>
            </div>
          )}

          <div className="mx-auto max-w-3xl"><MocDocXong moDun="hopdoi" them={{ kind: "loi_moi" }} /><GopY moDun="hopdoi" cauHoi="Phần so hai người có giúp bạn hiểu mối quan hệ này hơn?" /></div>
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            <Card className="flex flex-col justify-between">
              <div>
                <p className="font-serif text-lg">Bài đọc riêng của bạn</p>
                <p className="mt-1 text-sm text-fg-muted">Bốn con số cốt lõi: ý nghĩa, thẻ kiểm chứng, cách tính.</p>
              </div>
              <Button asChild className="mt-4"><Link href="/ban-than">Mở hồ sơ của tôi <ArrowRight aria-hidden /></Link></Button>
            </Card>
            {/* HN-2: khép vòng — người mời mở link của bạn là thấy cùng kết quả hai người (giữ nguyên quan_he). */}
            <Card className="border-gold/40" data-testid="gui-lai-loi-moi">
              <p className="font-serif text-lg">Gửi kết quả lại cho {tenMoi}</p>
              <p className="mb-4 mt-1 text-sm text-fg-muted">{tenMoi} chưa thấy kết quả hai người. Gửi link của bạn để {tenMoi} mở ra là thấy đúng vai {tenQH.toLowerCase()} — cũng dùng để mời thêm bạn thân, người yêu, đồng nghiệp.</p>
              <NutChiaSe loai="invite" hoSo={hoSo} duongDan={(m) => quanHe === "nguoi_yeu" ? `/hop-doi/${m}` : `/hop-doi/${m}?qh=${quanHe}`} nutTao={`Tạo link gửi ${tenMoi}`}
                loiNhan={`${tenGoi(hoSo)} đã xem hợp đôi (${tenQH}) với bạn — mở link để thấy kết quả hai người.`} />
            </Card>
          </div>
        </>
      )}
      <p className="flex items-center justify-center gap-1.5 text-xs text-fg-faint"><Lock className="size-3.5" aria-hidden /> {tenMoi} không thấy ngày sinh của bạn; bạn cũng không thấy ngày sinh của {tenMoi}.</p>
    </div>
  );
}
