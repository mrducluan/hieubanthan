"use client";
import "@/lib/en/hoso";   // EN-ALL: chuyển hồ sơ cũ của bản Anh (hbt.en.profile.v1) sang hồ sơ chung, chạy một lần
import { fetchSao } from "@/lib/sao-client";
import { ghiLuot, type LuotHoi } from "@/lib/hoi-mang";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/khung/Lien";
import { useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import type { ThuatNgu } from "@/components/hoi/ThuatNgu";
import { KhungChat, type KetQuaHoi } from "@/components/hoi/KhungChat";
import { laDacBiet } from "@/lib/hoi-mang";
import type { KhoiTrucQuan } from "@/components/hoi/TrucQuan";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { DaiDoi } from "@/components/than-so/DaiDoi";
import { DongDoi } from "@/components/than-so/DongDoi";
import { BieuDoNgaySinh, ChiSoPhu } from "@/components/than-so/BieuDoNgaySinh";
import { TheBaLop } from "@/components/than-so/TheBaLop";
import { useBaiDoc } from "@/lib/bai-doc";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { hoTenList, ngaySinhIso, tenGoi, useHoSo, type HoSo } from "@/lib/hoso";
import { DoiChieuDaPhaiThanSo } from "@/components/than-so/DoiChieuDaPhaiThanSo";
import { DongPhai, KhungPhai } from "@/components/huyen-hoc/KhungPhai";
import { ChaldeaDoc } from "@/components/than-so/ChaldeaDoc";
import { PhillipsDoc } from "@/components/than-so/PhillipsDoc";
import { NoiDau } from "@/components/than-so/NoiDau";
import { TongHopDoc } from "@/components/than-so/TongHopDoc";
import { GopYCauTraLoi } from "@/components/hoi/GopYCauTraLoi";
import { PhaiNaoDung } from "@/components/than-so/PhaiNaoDung";
import { BanDoConSo } from "@/components/than-so/BanDoConSo";
import { ChanDung } from "@/components/than-so/ChanDung";
import { NghiThuc } from "@/components/than-so/NghiThuc";
import { SoLon } from "@/components/than-so/SoLon";
import { GopY } from "@/components/khung/GopY";
import { ghiQuyUocDD, useQuyUocDD, type QuyUocDD } from "@/lib/quy-uoc-dd";
import { docXong, ghi } from "@/lib/do-luong";
import { TieuDeTrang, useChu, useDauCms } from "@/components/cms/DauCms";
import { useChuThanSo } from "@/components/than-so/chu-than-so";
import { useDuong } from "@/components/khung/NgonNgu";
import { dinhNgay } from "@/lib/dinh-dang";
import type { DocChu } from "@/lib/chu-trang";
import type { CHU_THAN_SO_UI } from "@/lib/chu/than-so";

// TS-PHAI / TS-V3 / Đợt 2A — các trường phái thần số. TS-PHAI-3 (chủ dự án 2026-11-21): bản Việt chỉ còn Pitago (phổ
// biến nhất ở Việt Nam) + Phillips (4 Kim Tự Tháp); Chaldea + "Tổng hợp 2 phái" ít người Việt dùng nên rời khung chọn.
// Bản Anh (Phillips chưa có lời tiếng Anh) giữ Pitago · Chaldea · Tổng hợp — Chaldea quen thuộc ở thị trường nói tiếng Anh.
export type PhaiThanSo = "pitago" | "phillips" | "chaldea" | "tong_hop";
const KHOA_PHAI = "hbt.thanso_phai";
const CAC_PHAI_VI: PhaiThanSo[] = ["pitago", "phillips"];
const CAC_PHAI_EN: PhaiThanSo[] = ["pitago", "chaldea", "tong_hop"];
const cacPhai = (en: boolean) => (en ? CAC_PHAI_EN : CAC_PHAI_VI);
/** Phái đã nhớ trên máy; phái không còn trong khung chọn của ngôn ngữ này (vd Chaldea đã chọn trước đây) → Pitago. */
function docPhai(en: boolean): PhaiThanSo {
  try { const v = localStorage.getItem(KHOA_PHAI) as PhaiThanSo | null; return v && cacPhai(en).includes(v) ? v : "pitago"; } catch { return "pitago"; }
}
// EN-ALL GĐ 7: /en/numerology là rewrite của trang này (một cây component) — chữ cố định ở lib/chu/than-so.ts (chiều `en`),
// lời bài đọc do engine trả theo ngôn ngữ. Tên phái, mô tả khung hỏi, câu gợi ý (dạng TỰ SOI, không dự đoán) đọc từ bảng.
type ChuTS = DocChu<typeof CHU_THAN_SO_UI>;
const GOI_Y_KHOA = [["ban_than", 2], ["nghe", 2], ["tinh_cam", 2], ["cuoc_song", 2]] as const;
const goiY = (t: ChuTS) => GOI_Y_KHOA.map(([k, n]) => ({ nhom: t(`goi_y.${k}`), cau: Array.from({ length: n }, (_, i) => t(`goi_y.${k}_${i + 1}`)) }));

interface CauLienQuan { ma: string; tru: string; cau: string }

async function hoiThanSo(h: HoSo, cau: string, phai: PhaiThanSo, quyUoc: QuyUocDD, hoiTiep: (c: CauLienQuan) => void,
                         t: ChuTS, hopDoi: string, maCau?: string, dungPhai?: (p: PhaiThanSo) => void,
                         binhChonPhai = true): Promise<KetQuaHoi> {
  const r = await fetchSao("/api/thanso/hoi", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ho_ten: hoTenList(h), ngay: h.ngay, thang: h.thang, nam: h.nam, cau_hoi: cau, phai: phai === "phillips" ? "pitago" : phai, quy_uoc_duong_doi: quyUoc }),
  }, "hoi");
  const d = (await r.json()) as { cau_tra_loi?: string; che_do?: string; can_them?: string[]; error?: string; thuat_ngu?: ThuatNgu[]; luot?: LuotHoi;
    cau_lien_quan?: CauLienQuan[]; phan_loai?: { linh_vuc?: string; xu_ly?: string };
    truc_quan?: KhoiTrucQuan[]; hoi_lai?: { cau: string; chon: string[] } | null };
  const canNguoiKia = d.can_them?.includes("nguoi_kia");
  // TS-NOIDAU: engine gợi ≤ 3 câu chuẩn gần với câu vừa hỏi (không gợi gì cho câu khủng hoảng / ngoài phạm vi).
  const tiep = d.cau_tra_loi && !canNguoiKia ? d.cau_lien_quan ?? [] : [];
  // TS-V3 tầng HỌC: góp ý đúng / chưa đúng — không hỏi với câu khủng hoảng, câu ngoài phạm vi, câu cần người kia.
  const gopY = d.cau_tra_loi && !canNguoiKia && !["an_toan", "tu_choi_nhe"].includes(d.phan_loai?.xu_ly ?? "")
    ? <>
        <GopYCauTraLoi hoSo={h} nc={{ phai: phai === "phillips" ? "pitago" : phai, quyUoc, nguon: maCau ? "noi_dau" : "hoi_dap", linhVuc: d.phan_loai?.linh_vuc, maCau }} />
        {/* TS-V3b: bình chọn phái nói đúng hơn — cùng điều kiện với góp ý (không hỏi ở câu khủng hoảng / ngoài phạm vi). */}
        {/* TS-PHAI-3: bình chọn Pitago ↔ Chaldea chỉ còn ở bản Anh (bản Việt không còn Chaldea trong khung chọn). */}
        {binhChonPhai && <PhaiNaoDung hoSo={h} quyUoc={quyUoc} linhVuc={d.phan_loai?.linh_vuc} onDungPhai={dungPhai} />}
      </>
    : null;
  return {
    van: d.cau_tra_loi,
    dacBiet: laDacBiet(d.phan_loai?.xu_ly),
    thuatNgu: d.thuat_ngu,
    trucQuan: d.truc_quan,
    hoiLai: d.hoi_lai,
    loi: d.cau_tra_loi ? undefined : d.error ?? t("hoi.loi"),
    phu: canNguoiKia ? (
      <Button asChild variant="secondary" size="sm"><Link href={hopDoi}><HeartHandshake aria-hidden /> {t("hoi.hop_doi")}</Link></Button>
    ) : undefined,
    // v3 M1: đọc xong câu trả lời → "Hỏi tiếp" → góp ý "Đúng / Chưa đúng" → "Phái nào nói đúng về bạn?".
    sau: (tiep.length || gopY) ? (
      <>
        {tiep.length > 0 && (
          <div data-testid="hoi-tiep">
            <p className="text-xs text-fg-muted">{t("hoi.hoi_tiep")}</p>
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
    ghiChu: d.cau_tra_loi ? (d.che_do === "llm" ? t("hoi.llm") : t("hoi.ghep")) : undefined,
  };
}

export function ThanSo() {
  const { c: t, en, ma } = useChuThanSo();
  const dg = useDuong();
  const hoSo = useHoSo();
  const router = useRouter();
  const { kq, loi, thuLai } = useBaiDoc(hoSo);
  const [tab, setTab] = useState("dai-doi");
  const [phai, setPhai] = useState<PhaiThanSo>("pitago");
  // TP-GON: giữ trạng thái mở khung "Cách xem" ở đây — đổi cách tính đường đời thì bài đọc tải lại (khung tạm gỡ khỏi
  // trang), nếu để khung tự nhớ thì vừa bấm xong khung đã đóng lại.
  const [moPhai, setMoPhai] = useState(false);
  const [cauNgoai, setCauNgoai] = useState<{ cau: string; lan: number } | null>(null);
  const quyUoc = useQuyUocDD();
  const maTheoCau = useRef(new Map<string, string>());   // câu chuẩn → mã câu (cho góp ý gắn đúng câu nỗi đau)
  // Phái Phillips mới có bản Việt (engine + PhillipsDoc chưa có lời tiếng Anh) → bản Anh không mở lựa chọn này.
  useEffect(() => { setPhai(docPhai(en)); }, [en]);
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

  // QH-BT: /than-so là BÀI ĐỌC và cửa vào — người mới nhập hồ sơ (ở đây hoặc trang chủ → /than-so?moi=1) xem nghi thức
  // "đang tính" + con số lớn ngay tại trang này; /ban-than là trang của tôi để quay lại mỗi ngày.
  const [nghiThuc, setNghiThuc] = useState<"chua" | "dang" | "xong">("chua");
  useEffect(() => { if (new URLSearchParams(location.search).get("moi") === "1") setNghiThuc("dang"); }, []);
  const xongNghiThuc = useCallback(() => {
    setNghiThuc("xong");
    router.replace(dg("/than-so"), { scroll: false });
  }, [router, dg]);
  const cuoiBai = useRef<HTMLElement>(null);
  const dangNghiThuc = nghiThuc === "dang";

  const dauCms = useDauCms(), c = useChu();
  // Gate 1: bắt đầu = bài đọc hiện ra (sau nghi thức); đọc xong = cuộn tới hết Chân dung (cuối phần cốt lõi).
  useBatDauDoc("thanso", Boolean(kq && !dangNghiThuc));
  useBatDauDoc("thanso_sau", Boolean(kq && !dangNghiThuc));
  useEffect(() => {
    const el = cuoiBai.current;
    if (!el || !kq || dangNghiThuc) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        docXong("thanso", { so_duong_doi: kq.cac_vi_tri[0]?.gia_tri });
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [kq, dangNghiThuc, phai]);
  // Lúc chờ hồ sơ vẫn có <h1> trong HTML phía máy chủ (SEO); có hồ sơ thì tiêu đề là tên người dùng.
  if (hoSo === undefined) return <div className="mx-auto max-w-lg"><TieuDeTrang nho={c("dau.nhan_tren")} lon={c("dau.dang_tai")} /><KhungTai nhan={t("tai")} /></div>;
  if (hoSo === null) {
    return (
      <div className="mx-auto max-w-lg">
        <TieuDeTrang nho={c("dau.nhan_tren")} lon={c("dau.chua_ho_so")} mo_ta={c("dau.chua_ho_so_dan")} />
        <Card><NhapHoSo onXong={() => setNghiThuc("dang")} /></Card>
      </div>
    );
  }
  if (loi) return <BaoLoi loi={loi} thuLai={thuLai} />;
  if (dangNghiThuc) return <NghiThuc daCoKetQua={Boolean(kq)} onXong={xongNghiThuc} />;
  if (!kq) return <KhungTai dong={4} nhan={t("tai")} />;

  const cs = kq.chieu_sau;
  const tuoi = cs.nam_ca_nhan[0]?.tuoi ?? 0;
  const ddVt = kq.cac_vi_tri.find((v) => v.vi_tri === "duong_doi") ?? kq.cac_vi_tri[0];
  return (
    <div className="space-y-14">
      {/* Khoảnh khắc hé lộ chỉ ngay sau lần nhập đầu — lần sau vào thẳng bài đọc. */}
      {nghiThuc === "xong" && ddVt && <SoLon vt={ddVt} tenGoi={tenGoi(hoSo)} cap="h2" />}
      <header>
        <p className="eyebrow">{c("ket_qua.nhan_tren")}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl" data-testid="ten-chinh">{kq.ten_chinh}</h1>
        <p className="mt-2 text-sm text-fg-muted" data-testid="ngay-sinh">{t("ket_qua.sinh", { ngay: en ? dinhNgay(`${hoSo.nam}-${String(hoSo.thang).padStart(2, "0")}-${String(hoSo.ngay).padStart(2, "0")}`, ma) : kq.ngay_sinh })}</p>
        {kq.tom_tat_do_tin && <p className="mt-1 text-sm text-moon" data-testid="ten-lech">{kq.tom_tat_do_tin}</p>}
      </header>
      {dauCms.khoiTren}

      {/* Người mới không cần chọn phái trước khi đọc: khung thu gọn thành một dòng "Cách xem", bấm cả hàng mới mở.
          Câu "cách còn lại ra số …" đã nằm trong dòng đang xem (màu trăng) nên không lặp lại ở `nhac`. */}
      <KhungPhai testId="truong-phai-than-so" tieuDe={t("phai.cach_xem")} mo={moPhai} doiMo={setMoPhai}
        tomTat={<span data-testid="dang-xem">{t("phai.dang_xem")} <b className="text-fg">{t(`phai.${phai}`)}</b>
          {(phai === "pitago" || phai === "tong_hop") && <> {t("phai.so_dd")} <b className="text-fg">{quyUoc === "tung_phan" ? t("phai.rut_gon") : t("phai.cong_het")}</b></>}
          {(phai === "pitago" || phai === "tong_hop") && kq.duong_doi_hai_cach?.lech && (
            <span className="text-moon">{t("phai.cach_con_lai", { so: String(quyUoc === "tung_phan" ? kq.duong_doi_hai_cach.tong_het : kq.duong_doi_hai_cach.tung_phan) })}</span>
          )}</span>}
        moTa={<>{t("phai.mo_ta")}</>}>
        <DongPhai ten={t("phai.truong_phai")} nhan={t("phai.chon_truong_phai")} giaTri={phai} doi={doiPhai}
          luaChon={cacPhai(en).map((p) => [p, t(p === "tong_hop" ? "phai.tong_hop_chon" : `phai.${p}`)] as [PhaiThanSo, string])}
          goiY={phai === "chaldea"
            ? (hoSo.ten_khac ? t("phai.ten_goi_khac", { ten: hoSo.ten_khac }) : t("phai.ten_goi", { ten: hoSo.ho_ten.trim().split(/\s+/).pop() ?? "" }))
            : phai === "phillips" ? t("phai.goi_y_phillips")
            : phai === "tong_hop" ? t("phai.goi_y_tong_hop")
            : t("phai.goi_y_pitago")} />
        {(phai === "pitago" || phai === "tong_hop") && (
          <DongPhai ten={t("phai.cach_tinh_dd")} nhan={t("phai.chon_cach_tinh_dd")} giaTri={quyUoc} doi={doiQuyUoc}
            luaChon={[["tung_phan", t("phai.nhan_rut_gon")], ["tong_het", t("phai.nhan_cong_het")]]}
            noiBat={Boolean(kq.duong_doi_hai_cach?.lech)} nhanNoiBat={t("phai.doi_ra_khac")}
            goiY={<span data-testid="goi-y-duong-doi">{kq.giai_thich_quy_uoc?.[quyUoc]}{kq.duong_doi_hai_cach?.lech
              ? t("phai.hai_so", { a: String(kq.duong_doi_hai_cach.tung_phan), b: String(kq.duong_doi_hai_cach.tong_het), dung: String(quyUoc === "tung_phan" ? kq.duong_doi_hai_cach.tung_phan : kq.duong_doi_hai_cach.tong_het) })
              : ""}</span>} />
        )}
      </KhungPhai>

      {phai === "phillips" ? <><PhillipsDoc hoSo={hoSo} quyUoc={quyUoc} /><BanDoConSo hoSo={hoSo} quyUoc={quyUoc} /></>
        : phai === "chaldea" ? <><ChaldeaDoc hoSo={hoSo} /><BanDoConSo hoSo={hoSo} quyUoc={quyUoc} /></>
        : phai === "tong_hop" ? <><TongHopDoc hoSo={hoSo} quyUoc={quyUoc} /><BanDoConSo hoSo={hoSo} quyUoc={quyUoc} /></> : (<>
      <section aria-labelledby="bon-so">
        <TieuDeMuc id="bon-so" nho={c("bon_so.nho")} lon={c("bon_so.lon")} />
        <div className="grid gap-4 md:grid-cols-2">
          {kq.cac_vi_tri.map((vt) => <TheBaLop key={vt.vi_tri} vt={vt} />)}
        </div>
      </section>

      {kq.chan_dung && (
        <section aria-labelledby="muc-chan-dung" ref={cuoiBai}>
          <TieuDeMuc id="muc-chan-dung" nho={t("chan_dung.nho")} lon={t("chan_dung.lon")} mo_ta={t("chan_dung.mo_ta")} />
          <ChanDung cd={kq.chan_dung} />
        </section>
      )}
      <GopY />

      <BanDoConSo hoSo={hoSo} quyUoc={quyUoc} />

      <section aria-labelledby="chieu-sau" id="dong-doi" className="scroll-mt-24">
        <TieuDeMuc id="chieu-sau" nho={c("chieu_sau.nho")} lon={c("chieu_sau.lon")} mo_ta={cs.cach_doc_chieu_sau} />
        <Tabs value={tab} onValueChange={setTab}>
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
            <TabsList>
              <TabsTrigger value="dai-doi">{t("tab.dai_doi")}</TabsTrigger>
              {cs.dong_doi && <TabsTrigger value="dong-doi">{t("tab.dong_doi")}</TabsTrigger>}
              <TabsTrigger value="nam">{t("tab.nam")}</TabsTrigger>
              {kq.mo_rong && <TabsTrigger value="bieu-do">{t("tab.bieu_do")}</TabsTrigger>}
              {kq.mo_rong && <TabsTrigger value="phu">{t("tab.phu")}</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="dai-doi" className="space-y-4">
            <DaiDoi dinhCao={cs.dinh_cao} tuoi={tuoi} />
            <div className="grid gap-3 md:grid-cols-2">
              {cs.dinh_cao.map((p) => p.nghia && (
                <article key={p.dinh} className="rounded-xl border border-line/70 bg-bg/40 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-lg">{p.nghia.chu_de}</h3>
                    <span className="shrink-0 text-xs text-gold">{t("dinh.tag", { so: String(p.so), tuoi: p.den_tuoi ? `${p.tu_tuoi}–${p.den_tuoi}` : `${p.tu_tuoi}+` })}</span>
                  </div>
                  <p className="mt-1 text-sm">{p.nghia.y_nghia}</p>
                  <p className="mt-1 text-sm text-cinnabar">{t("dinh.bong_toi")} {p.nghia.bong_toi}</p>
                </article>
              ))}
            </div>
            {cs.thu_thach_chinh.nghia && (
              <article className="rounded-xl border border-cinnabar/40 bg-cinnabar/[0.06] p-4">
                <p className="eyebrow text-cinnabar">{t("thu_thach.nhan")}</p>
                <h3 className="mt-1 text-lg">{t("thu_thach.so", { so: String(cs.thu_thach_chinh.so) })} — {cs.thu_thach_chinh.nghia.mo_ta}</h3>
                <p className="mt-1 text-sm">{cs.thu_thach_chinh.nghia.y_nghia}</p>
                <p className="mt-1 text-sm text-jade">{t("thu_thach.cach_vuot")} {cs.thu_thach_chinh.nghia.cach_vuot}</p>
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
                      <span className="shrink-0 text-xs text-gold">{t("nam.tag", { so: String(n.so), tuoi: String(n.tuoi) })}</span>
                    </div>
                    <p className="mt-1 text-sm">{n.nghia.y_nghia}</p>
                    <p className="mt-1 text-sm"><span className="text-jade">{t("nam.nen")}</span> {n.nghia.nen} · <span className="text-cinnabar">{t("nam.tranh")}</span> {n.nghia.tranh}</p>
                  </article>
                </li>
              ))}
            </ol>
          </TabsContent>

          {kq.mo_rong && <TabsContent value="bieu-do"><BieuDoNgaySinh mo={kq.mo_rong} /></TabsContent>}
          {kq.mo_rong && <TabsContent value="phu"><ChiSoPhu mo={kq.mo_rong} /></TabsContent>}
        </Tabs>
      </section>

      <CuoiBaiDoc moDun="thanso_sau" khongGopY khongCta={en} />
      </>)}

      {/* CHANG-3: khối phụ, gập sẵn, SAU bài đọc chính — các trường phái khác chỉ để so (Pitago / Phillips vẫn là bài đọc chính). */}
      <DoiChieuDaPhaiThanSo key={`${ngaySinhIso(hoSo)}|${hoSo.ho_ten ?? ""}|${quyUoc}`}
        ngaySinhIso={ngaySinhIso(hoSo)} hoTen={hoSo.ho_ten ?? ""} quyUoc={quyUoc} />

      <div id="noi-dau" className="scroll-mt-24"><NoiDau hoSo={hoSo} onHoi={hoiCau} theoPitago={phai === "chaldea"} quyUoc={quyUoc} /></div>

      <section id="hoi" aria-labelledby="muc-hoi" className="scroll-mt-24">
        <TieuDeMuc id="muc-hoi" nho={c("hoi.nho")} lon={c("hoi.lon", { ten: tenGoi(hoSo) })}
          mo_ta={t(`mo_ta_hoi.${phai}`)} />
        <KhungChat
            moDun="thanso"
          loiChao={t("hoi.loi_chao")}
          goiY={goiY(t)}
          cauNgoai={cauNgoai}
          gui={(c) => hoiThanSo(hoSo, c, phai, quyUoc, (t) => {
            ghi("pain_point_clicked", { mo_dun: "thanso", tru: t.tru, ma_cau: t.ma, nguon: "hoi_tiep" });
            hoiCau(t.cau, t.ma);
          }, t, dg("/hop-doi"), maTheoCau.current.get(c), doiPhai, en)}
        />
      </section>

      <p className="text-xs text-fg-faint">{kq.trich_nguon_chung}{t("nguon.ten_tinh", { ten: kq.ten_bien_the_da_quet.join(", ") })}</p>
    </div>
  );
}
