"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import type { ThuatNgu } from "@/components/hoi/ThuatNgu";
import { KhungChat, type KetQuaHoi } from "@/components/hoi/KhungChat";
import { DaiDoi } from "@/components/than-so/DaiDoi";
import { BieuDoNgaySinh, ChiSoPhu } from "@/components/than-so/BieuDoNgaySinh";
import { TheBaLop } from "@/components/than-so/TheBaLop";
import { useBaiDoc } from "@/lib/bai-doc";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { hoTenList, tenGoi, useHoSo, type HoSo } from "@/lib/hoso";

// Gợi ý ở dạng TỰ SOI, không dự đoán tương lai.
const GOI_Y = [
  { nhom: "Bản thân", cau: ["Điểm mạnh cốt lõi của tôi là gì?", "Mặt tối nào tôi hay bỏ qua ở chính mình?"] },
  { nhom: "Nghề nghiệp", cau: ["Con số của tôi hợp với môi trường làm việc thế nào?", "Đâu là điểm nghẽn sự nghiệp theo con số của tôi?"] },
  { nhom: "Tình cảm", cau: ["Tôi cần gì trong một mối quan hệ?", "Điều gì hay cản trở tôi trong tình cảm?"] },
  { nhom: "Cuộc sống", cau: ["Bài học lớn của đời tôi là gì?", "Giai đoạn này tôi nên tập trung điều gì?"] },
];

async function hoiThanSo(h: HoSo, cau: string): Promise<KetQuaHoi> {
  const r = await fetch("/api/thanso/hoi", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ho_ten: hoTenList(h), ngay: h.ngay, thang: h.thang, nam: h.nam, cau_hoi: cau }),
  });
  const d = (await r.json()) as { cau_tra_loi?: string; che_do?: string; can_them?: string[]; error?: string; thuat_ngu?: ThuatNgu[] };
  const canNguoiKia = d.can_them?.includes("nguoi_kia");
  return {
    van: d.cau_tra_loi,
    thuatNgu: d.thuat_ngu,
    loi: d.cau_tra_loi ? undefined : d.error ?? "Chưa trả lời được lúc này, thử lại sau.",
    phu: canNguoiKia ? (
      <Button asChild variant="secondary" size="sm"><Link href="/hop-doi"><HeartHandshake aria-hidden /> Nhập ngày sinh người ấy ở mục Hợp đôi</Link></Button>
    ) : undefined,
    ghiChu: d.cau_tra_loi ? (d.che_do === "llm" ? "Diễn đạt bởi AI từ kho tri thức có nguồn." : "Ghép trực tiếp từ kho tri thức có nguồn.") : undefined,
  };
}

export function ThanSo() {
  const hoSo = useHoSo();
  const router = useRouter();
  const { kq, loi, thuLai } = useBaiDoc(hoSo);

  if (hoSo === undefined) return <KhungTai />;
  if (hoSo === null) {
    return (
      <div className="mx-auto max-w-lg">
        <TieuDeMuc cap={1} nho="Thần số học" lon="Nhập tên và ngày sinh để bắt đầu" />
        <Card><NhapHoSo onXong={() => router.push("/ban-than?moi=1")} /></Card>
      </div>
    );
  }
  if (loi) return <BaoLoi loi={loi} thuLai={thuLai} />;
  if (!kq) return <KhungTai dong={4} />;

  const cs = kq.chieu_sau;
  const tuoi = cs.nam_ca_nhan[0]?.tuoi ?? 0;
  return (
    <div className="space-y-14">
      <header>
        <p className="eyebrow">Thần số học · chiều sâu</p>
        <h1 className="mt-2 text-4xl sm:text-5xl" data-testid="ten-chinh">{kq.ten_chinh}</h1>
        <p className="mt-2 text-sm text-fg-muted" data-testid="ngay-sinh">Sinh {kq.ngay_sinh} · {kq.tom_tat_do_tin}</p>
      </header>

      <section aria-labelledby="bon-so">
        <TieuDeMuc id="bon-so" nho="Bốn con số cốt lõi" lon="Cách tính, ý nghĩa, câu tự soi" />
        <div className="grid gap-4 md:grid-cols-2">
          {kq.cac_vi_tri.map((vt) => <TheBaLop key={vt.vi_tri} vt={vt} macDinh="tinh" />)}
        </div>
      </section>

      <section aria-labelledby="chieu-sau">
        <TieuDeMuc id="chieu-sau" nho="Chiều sâu" lon="Đời bạn theo nhịp" mo_ta={cs.cach_doc_chieu_sau} />
        <Tabs defaultValue="dai-doi">
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
            <TabsList>
              <TabsTrigger value="dai-doi">Dải đời</TabsTrigger>
              <TabsTrigger value="nam">Năm cá nhân</TabsTrigger>
              {kq.mo_rong && <TabsTrigger value="bieu-do">Biểu đồ ngày sinh</TabsTrigger>}
              {kq.mo_rong && <TabsTrigger value="phu">Chỉ số phụ</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="dai-doi" className="space-y-4">
            <DaiDoi dinhCao={cs.dinh_cao} tuoi={tuoi} />
            <div className="grid gap-3 md:grid-cols-2">
              {cs.dinh_cao.map((p) => p.nghia && (
                <article key={p.dinh} className="rounded-xl border border-line/70 bg-bg/40 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-lg">{p.nghia.chu_de}</h3>
                    <span className="shrink-0 text-xs text-gold">số {p.so} · {p.den_tuoi ? `${p.tu_tuoi}–${p.den_tuoi}` : `${p.tu_tuoi}+`} tuổi</span>
                  </div>
                  <p className="mt-1 text-sm">{p.nghia.y_nghia}</p>
                  <p className="mt-1 text-sm text-cinnabar">Bóng tối: {p.nghia.bong_toi}</p>
                </article>
              ))}
            </div>
            {cs.thu_thach_chinh.nghia && (
              <article className="rounded-xl border border-cinnabar/40 bg-cinnabar/[0.06] p-4">
                <p className="eyebrow text-cinnabar">Thử thách chính</p>
                <h3 className="mt-1 text-lg">Số {cs.thu_thach_chinh.so} — {cs.thu_thach_chinh.nghia.mo_ta}</h3>
                <p className="mt-1 text-sm">{cs.thu_thach_chinh.nghia.y_nghia}</p>
                <p className="mt-1 text-sm text-jade">Cách vượt: {cs.thu_thach_chinh.nghia.cach_vuot}</p>
              </article>
            )}
          </TabsContent>

          <TabsContent value="nam">
            <ol className="relative space-y-3 border-l border-line pl-5">
              {cs.nam_ca_nhan.map((n, i) => n.nghia && (
                <li key={n.nam} className="relative">
                  <span className={`absolute -left-[1.6rem] top-5 size-2.5 rounded-full ${i === 0 ? "bg-gold shadow-glow" : "bg-line"}`} aria-hidden />
                  <article className="rounded-xl border border-line/70 bg-bg/40 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-lg">{n.nam} — {n.nghia.chu_de}</h3>
                      <span className="shrink-0 text-xs text-gold">số {n.so} · {n.tuoi} tuổi</span>
                    </div>
                    <p className="mt-1 text-sm">{n.nghia.y_nghia}</p>
                    <p className="mt-1 text-sm"><span className="text-jade">Nên:</span> {n.nghia.nen} · <span className="text-cinnabar">Tránh:</span> {n.nghia.tranh}</p>
                  </article>
                </li>
              ))}
            </ol>
          </TabsContent>

          {kq.mo_rong && <TabsContent value="bieu-do"><BieuDoNgaySinh mo={kq.mo_rong} /></TabsContent>}
          {kq.mo_rong && <TabsContent value="phu"><ChiSoPhu mo={kq.mo_rong} /></TabsContent>}
        </Tabs>
      </section>

      <section id="hoi" aria-labelledby="muc-hoi" className="scroll-mt-24">
        <TieuDeMuc id="muc-hoi" nho="Hỏi sâu hơn" lon={`${tenGoi(hoSo)}, bạn đang băn khoăn điều gì?`}
          mo_ta="Câu trả lời soi câu hỏi của bạn qua chính những con số ở trên — góc nhìn tham khảo để tự ngẫm, không phải lời tiên đoán." />
        <KhungChat
            moDun="thanso"
          loiChao="Chọn một câu gợi ý bên dưới, hoặc tự đặt câu hỏi về bản thân, nghề nghiệp, tình cảm."
          goiY={GOI_Y}
          gui={(c) => hoiThanSo(hoSo, c)}
        />
      </section>

      <p className="text-xs text-fg-faint">{kq.trich_nguon_chung} · Bản tính v{kq.engine_version} · Tên đã quét: {kq.ten_bien_the_da_quet.join(", ")}</p>
    </div>
  );
}
