"use client";
import { fetchSao } from "@/lib/sao-client";
import { ghiLuot, type LuotHoi } from "@/lib/hoi-mang";
import { useEffect, useRef, useState } from "react";
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
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { DaiDoi } from "@/components/than-so/DaiDoi";
import { DongDoi } from "@/components/than-so/DongDoi";
import { BieuDoNgaySinh, ChiSoPhu } from "@/components/than-so/BieuDoNgaySinh";
import { TheBaLop } from "@/components/than-so/TheBaLop";
import { useBaiDoc } from "@/lib/bai-doc";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { hoTenList, tenGoi, useHoSo, type HoSo } from "@/lib/hoso";
import { DongPhai, KhungPhai } from "@/components/huyen-hoc/KhungPhai";
import { ChaldeaDoc } from "@/components/than-so/ChaldeaDoc";
import { NoiDau } from "@/components/than-so/NoiDau";
import { TongHopDoc } from "@/components/than-so/TongHopDoc";
import { GopYCauTraLoi } from "@/components/hoi/GopYCauTraLoi";
import { PhaiNaoDung } from "@/components/than-so/PhaiNaoDung";
import { BanDoConSo } from "@/components/than-so/BanDoConSo";
import { ghiQuyUocDD, useQuyUocDD, type QuyUocDD } from "@/lib/quy-uoc-dd";
import { ghi } from "@/lib/do-luong";
import { TieuDeTrang, useChu, useDauCms } from "@/components/cms/DauCms";

// TS-PHAI / TS-V3 — ba trường phái thần số + tổng hợp; lựa chọn nhớ trên máy (localStorage), mặc định Pitago như trước.
export type PhaiThanSo = "pitago" | "chaldea" | "tong_hop";
const KHOA_PHAI = "hbt.thanso_phai";
const CAC_PHAI: PhaiThanSo[] = ["pitago", "chaldea", "tong_hop"];
function docPhai(): PhaiThanSo {
  try { const v = localStorage.getItem(KHOA_PHAI) as PhaiThanSo | null; return v && CAC_PHAI.includes(v) ? v : "pitago"; } catch { return "pitago"; }
}
const MO_TA_HOI: Record<PhaiThanSo, string> = {
  pitago: "Câu trả lời soi câu hỏi của bạn qua chính những con số ở trên — góc nhìn tham khảo để tự ngẫm, không phải lời tiên đoán.",
  chaldea: "Câu về bản thân, tên, tính cách trả lời theo số Chaldea (số kép + số gốc); chủ đề phái Chaldea không có (năm cá nhân, đỉnh cao, biểu đồ, hợp đôi) trả lời theo Pitago và ghi rõ.",
  tong_hop: "Câu về bản thân mở đầu bằng điểm chung của hai phái, phần còn lại theo Pitago.",
};

// Gợi ý ở dạng TỰ SOI, không dự đoán tương lai.
const GOI_Y = [
  { nhom: "Bản thân", cau: ["Điểm mạnh cốt lõi của tôi là gì?", "Mặt tối nào tôi hay bỏ qua ở chính mình?"] },
  { nhom: "Nghề nghiệp", cau: ["Con số của tôi hợp với môi trường làm việc thế nào?", "Đâu là điểm nghẽn sự nghiệp theo con số của tôi?"] },
  { nhom: "Tình cảm", cau: ["Tôi cần gì trong một mối quan hệ?", "Điều gì hay cản trở tôi trong tình cảm?"] },
  { nhom: "Cuộc sống", cau: ["Bài học lớn của đời tôi là gì?", "Giai đoạn này tôi nên tập trung điều gì?"] },
];

interface CauLienQuan { ma: string; tru: string; cau: string }

async function hoiThanSo(h: HoSo, cau: string, phai: PhaiThanSo, quyUoc: QuyUocDD, hoiTiep: (c: CauLienQuan) => void,
                         maCau?: string, dungPhai?: (p: PhaiThanSo) => void): Promise<KetQuaHoi> {
  const r = await fetchSao("/api/thanso/hoi", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ho_ten: hoTenList(h), ngay: h.ngay, thang: h.thang, nam: h.nam, cau_hoi: cau, phai, quy_uoc_duong_doi: quyUoc }),
  }, "hoi");
  const d = (await r.json()) as { cau_tra_loi?: string; che_do?: string; can_them?: string[]; error?: string; thuat_ngu?: ThuatNgu[]; luot?: LuotHoi;
    cau_lien_quan?: CauLienQuan[]; phan_loai?: { linh_vuc?: string; xu_ly?: string } };
  const canNguoiKia = d.can_them?.includes("nguoi_kia");
  // TS-NOIDAU: engine gợi ≤ 3 câu chuẩn gần với câu vừa hỏi (không gợi gì cho câu khủng hoảng / ngoài phạm vi).
  const tiep = d.cau_tra_loi && !canNguoiKia ? d.cau_lien_quan ?? [] : [];
  // TS-V3 tầng HỌC: góp ý đúng / chưa đúng — không hỏi với câu khủng hoảng, câu ngoài phạm vi, câu cần người kia.
  const gopY = d.cau_tra_loi && !canNguoiKia && !["an_toan", "tu_choi_nhe"].includes(d.phan_loai?.xu_ly ?? "")
    ? <>
        <GopYCauTraLoi hoSo={h} nc={{ phai, quyUoc, nguon: maCau ? "noi_dau" : "hoi_dap", linhVuc: d.phan_loai?.linh_vuc, maCau }} />
        {/* TS-V3b: bình chọn phái nói đúng hơn — cùng điều kiện với góp ý (không hỏi ở câu khủng hoảng / ngoài phạm vi). */}
        <PhaiNaoDung hoSo={h} quyUoc={quyUoc} linhVuc={d.phan_loai?.linh_vuc} onDungPhai={dungPhai} />
      </>
    : null;
  return {
    van: d.cau_tra_loi,
    thuatNgu: d.thuat_ngu,
    loi: d.cau_tra_loi ? undefined : d.error ?? "Chưa trả lời được lúc này, thử lại sau.",
    phu: canNguoiKia ? (
      <Button asChild variant="secondary" size="sm"><Link href="/hop-doi"><HeartHandshake aria-hidden /> Nhập ngày sinh người ấy ở mục Hợp đôi</Link></Button>
    ) : undefined,
    // v3 M1: đọc xong câu trả lời → "Hỏi tiếp" → góp ý "Đúng / Chưa đúng" → "Phái nào nói đúng về bạn?".
    sau: (tiep.length || gopY) ? (
      <>
        {tiep.length > 0 && (
          <div data-testid="hoi-tiep">
            <p className="text-xs text-fg-muted">Hỏi tiếp</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {tiep.map((c) => (
                <Button key={c.ma} variant="outline" size="sm" className="h-auto whitespace-normal py-1 text-left" onClick={() => hoiTiep(c)}>{c.cau}</Button>
              ))}
            </div>
          </div>
        )}
        {gopY}
      </>
    ) : undefined,
    ghiLuot: ghiLuot(d.luot),
    ghiChu: d.cau_tra_loi ? (d.che_do === "llm" ? "Diễn đạt tự động từ kho tri thức có nguồn." : "Ghép trực tiếp từ kho tri thức có nguồn.") : undefined,
  };
}

export function ThanSo() {
  const hoSo = useHoSo();
  const router = useRouter();
  const { kq, loi, thuLai } = useBaiDoc(hoSo);
  const [tab, setTab] = useState("dai-doi");
  const [phai, setPhai] = useState<PhaiThanSo>("pitago");
  const [cauNgoai, setCauNgoai] = useState<{ cau: string; lan: number } | null>(null);
  const quyUoc = useQuyUocDD();
  const maTheoCau = useRef(new Map<string, string>());   // câu chuẩn → mã câu (cho góp ý gắn đúng câu nỗi đau)
  useEffect(() => { setPhai(docPhai()); }, []);
  // TS-NOIDAU: câu bấm từ bảng nỗi đau / "hỏi tiếp" → đẩy vào khung hỏi đáp; khung hỏi đáp tự cuộn MỘT lần tới khung chờ
  // "Đang soi câu hỏi…" (trục 2 UX: hai lệnh cuộn mượt chồng nhau làm màn hình giật giữa chừng).
  function hoiCau(cau: string, maCau?: string) {
    if (maCau) maTheoCau.current.set(cau, maCau);
    setCauNgoai((c) => ({ cau, lan: (c?.lan ?? 0) + 1 }));
  }
  function doiPhai(p: PhaiThanSo) {
    setPhai(p);
    try { localStorage.setItem(KHOA_PHAI, p); } catch { /* chế độ riêng tư: chỉ nhớ trong phiên */ }
    ghi("school_switched", { mo_dun: "thanso", phai: p });
  }
  function doiQuyUoc(q: QuyUocDD) {
    ghiQuyUocDD(q);
    ghi("school_switched", { mo_dun: "thanso_duong_doi", phai: q });
  }
  // Link "/than-so#dong-doi" (từ chân dung) mở thẳng tab Dòng đời.
  useEffect(() => {
    const doc = () => { if (location.hash === "#dong-doi") setTab("dong-doi"); };
    doc();
    window.addEventListener("hashchange", doc);
    return () => window.removeEventListener("hashchange", doc);
  }, []);
  useEffect(() => {
    if (kq && tab === "dong-doi" && location.hash === "#dong-doi") document.getElementById("chieu-sau")?.scrollIntoView({ block: "start" });
  }, [kq, tab]);

  const dauCms = useDauCms(), c = useChu();
  useBatDauDoc("thanso_sau", Boolean(kq));
  // Lúc chờ hồ sơ vẫn có <h1> trong HTML phía máy chủ (SEO); có hồ sơ thì tiêu đề là tên người dùng.
  if (hoSo === undefined) return <div className="mx-auto max-w-lg"><TieuDeTrang nho={c("dau.nhan_tren")} lon={c("dau.dang_tai")} /><KhungTai /></div>;
  if (hoSo === null) {
    return (
      <div className="mx-auto max-w-lg">
        <TieuDeTrang nho={c("dau.nhan_tren")} lon={c("dau.chua_ho_so")} />
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
        <p className="eyebrow">{c("ket_qua.nhan_tren")}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl" data-testid="ten-chinh">{kq.ten_chinh}</h1>
        <p className="mt-2 text-sm text-fg-muted" data-testid="ngay-sinh">Sinh {kq.ngay_sinh} · {kq.tom_tat_do_tin}</p>
      </header>
      {dauCms.khoiTren}

      <KhungPhai testId="truong-phai-than-so" moTa={<>Hai phái tính khác nhau từ cùng họ tên và ngày sinh. Pitago (mặc định) dùng bảng chữ 1–9 theo thứ tự ABC, có biểu đồ ngày sinh, đỉnh cao, năm cá nhân. Chaldea dùng bảng chữ 1–8 theo âm, đọc số kép 10–52 và coi trọng tên thường gọi. Tổng hợp cho thấy điều các phái cùng chỉ ra.</>}>
        <DongPhai ten="Trường phái" nhan="Chọn trường phái thần số" giaTri={phai} doi={doiPhai}
          luaChon={[["pitago", "Pitago"], ["chaldea", "Chaldea"], ["tong_hop", "Tổng hợp 2 phái"]]}
          goiY={phai === "chaldea"
            ? (hoSo.ten_khac ? `Số tên gọi lấy theo tên thường gọi “${hoSo.ten_khac}”.` : "Chưa có tên thường gọi trong hồ sơ — số tên gọi lấy tiếng cuối của họ tên.")
            : phai === "tong_hop" ? "So con số của hai phái: chỗ trùng là nét đáng đối chiếu trước, chỗ khác là hai góc nhìn."
            : "Phổ biến nhất ở Việt Nam; mọi phần chiều sâu bên dưới theo phái này."} />
        {(phai === "pitago" || phai === "tong_hop") && (
          <DongPhai ten="Cách tính con số đường đời" nhan="Chọn cách tính con số đường đời" giaTri={quyUoc} doi={doiQuyUoc}
            luaChon={[["tung_phan", "Rút gọn con số"], ["tong_het", "Cộng hết chữ số"]]}
            noiBat={Boolean(kq.duong_doi_hai_cach?.lech)}
            goiY={<span data-testid="goi-y-duong-doi">{kq.giai_thich_quy_uoc?.[quyUoc]}{kq.duong_doi_hai_cach?.lech
              ? ` Với ngày sinh của bạn hai cách ra khác nhau: ${kq.duong_doi_hai_cach.tung_phan} (rút gọn con số) và ${kq.duong_doi_hai_cach.tong_het} (cộng hết chữ số) — luận giải đi theo cách bạn chọn.`
              : " Với ngày sinh của bạn hai cách ra cùng một số."}</span>} />
        )}
      </KhungPhai>

      {phai === "chaldea" ? <><ChaldeaDoc hoSo={hoSo} /><BanDoConSo hoSo={hoSo} quyUoc={quyUoc} /></>
        : phai === "tong_hop" ? <><TongHopDoc hoSo={hoSo} quyUoc={quyUoc} /><BanDoConSo hoSo={hoSo} quyUoc={quyUoc} /></> : (<>
      <section aria-labelledby="bon-so">
        <TieuDeMuc id="bon-so" nho={c("bon_so.nho")} lon={c("bon_so.lon")} />
        <div className="grid gap-4 md:grid-cols-2">
          {kq.cac_vi_tri.map((vt) => <TheBaLop key={vt.vi_tri} vt={vt} />)}
        </div>
      </section>

      <BanDoConSo hoSo={hoSo} quyUoc={quyUoc} />

      <section aria-labelledby="chieu-sau" id="dong-doi" className="scroll-mt-24">
        <TieuDeMuc id="chieu-sau" nho={c("chieu_sau.nho")} lon={c("chieu_sau.lon")} mo_ta={cs.cach_doc_chieu_sau} />
        <Tabs value={tab} onValueChange={setTab}>
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
            <TabsList>
              <TabsTrigger value="dai-doi">Dải đời</TabsTrigger>
              {cs.dong_doi && <TabsTrigger value="dong-doi">Bước ngoặt</TabsTrigger>}
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

          {cs.dong_doi && (
            <TabsContent value="dong-doi">
              <DongDoi dd={cs.dong_doi} ngaySinh={{ ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam }} />
            </TabsContent>
          )}

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

      <CuoiBaiDoc moDun="thanso_sau" cauHoi="Phần chiều sâu có giúp bạn hiểu mình hơn?" />
      </>)}

      <div id="noi-dau" className="scroll-mt-24"><NoiDau hoSo={hoSo} onHoi={hoiCau} theoPitago={phai === "chaldea"} quyUoc={quyUoc} /></div>

      <section id="hoi" aria-labelledby="muc-hoi" className="scroll-mt-24">
        <TieuDeMuc id="muc-hoi" nho={c("hoi.nho")} lon={c("hoi.lon", { ten: tenGoi(hoSo) })}
          mo_ta={MO_TA_HOI[phai]} />
        <KhungChat
            moDun="thanso"
          loiChao="Chọn một câu gợi ý bên dưới, hoặc tự đặt câu hỏi về bản thân, nghề nghiệp, tình cảm."
          goiY={GOI_Y}
          cauNgoai={cauNgoai}
          gui={(c) => hoiThanSo(hoSo, c, phai, quyUoc, (t) => {
            ghi("pain_point_clicked", { mo_dun: "thanso", tru: t.tru, ma_cau: t.ma, nguon: "hoi_tiep" });
            hoiCau(t.cau, t.ma);
          }, maTheoCau.current.get(c), doiPhai)}
        />
      </section>

      <p className="text-xs text-fg-faint">{kq.trich_nguon_chung} · Tên đã quét: {kq.ten_bien_the_da_quet.join(", ")}</p>
    </div>
  );
}
