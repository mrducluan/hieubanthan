"use client";
// VZ-2 — trang Tử vi: lá số lớn (2 giao diện, lớp vận hạn theo năm xem) → chi tiết cung đang chọn
// → hỏi đáp AI ở DƯỚI, chiếm hết chiều ngang (chủ dự án chốt 2026-10-01).
import { caoDinhTren } from "@/lib/thanh-mang";
import { useChu } from "@/components/cms/DauCms";
import { useChuChung } from "@/components/cms/ChuChung";
import Link from "@/components/khung/Lien";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarClock, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, HeartHandshake, Moon, Orbit, ScrollText, SlidersHorizontal, Waypoints } from "lucide-react";
import type { ChartInputVao, LaSoOutputT, LuuNguyetOutputT, PhaiLuuNguyet, VanHanOutputT } from "@/app/api/tuvi/schema";
import { KhungChat } from "@/components/hoi/KhungChat";
import { HanhDongTrucQuan } from "@/components/hoi/TrucQuan";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { TruongPhai, type ThangNhuan } from "@/components/huyen-hoc/TruongPhai";
import { CachCuc } from "@/components/huyen-hoc/CachCuc";
import { SachXuaNoi } from "@/components/huyen-hoc/SachXuaNoi";
import { CungSaoMenh } from "@/components/huyen-hoc/CungSaoMenh";
import { ChiTietCung } from "@/components/huyen-hoc/ChiTietCung";
import { DaiHanNhay, DongHoaHan } from "@/components/huyen-hoc/HanLaSo";
import { DauMang } from "@/components/huyen-hoc/KhungMang";
import { MoiLapLaSo } from "@/components/huyen-hoc/MoiLapLaSo";
import { LuanGiaiToanBo } from "@/components/huyen-hoc/LuanGiaiToanBo";
import { LuuNguyet } from "@/components/huyen-hoc/LuuNguyet";
import { KhoiMoLuoi } from "@/components/huyen-hoc/KhoiMoLuoi";
import { PhiHoa } from "@/components/huyen-hoc/PhiHoa";
import { NhipBaThang } from "@/components/huyen-hoc/NhipBaThang";
import { DinhGioSinh } from "@/components/huyen-hoc/DinhGioSinh";
import { HopThamTuVi } from "@/components/huyen-hoc/HopThamTuVi";
import { ChonNguoiXem, XemNguoiThanCtx } from "@/components/huyen-hoc/NguoiThan";
import { ChonYDinh, XacNhanYDinh, type GoiYVec } from "@/components/huyen-hoc/XacNhanYDinh";
import { LaSoTuVi, type PhaiDoSang } from "@/components/huyen-hoc/LaSoTuVi";
import { KhungLaSo } from "@/components/huyen-hoc/KhungLaSo";
import { ChanLaSo } from "@/components/huyen-hoc/ChanLaSo";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ghi } from "@/lib/do-luong";
import { useGiaoDien, type GiaoDien } from "@/lib/giao-dien-la-so";
import { usePost } from "@/lib/goi-api";
import { hoiMang, type HoiMangRes } from "@/lib/hoi-mang";
import { gioHienThi, kemTinhTrang, laSoTuHoSo, useHoSo } from "@/lib/hoso";
import { laSoNguoiThan, tenHien, useNguoiThan, type NguoiThan } from "@/lib/nguoi-than";
import { taiAnhSvg } from "@/lib/tai-anh-svg";
import { cn } from "@/lib/utils";
import { useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";
import { TenHienProvider } from "@/components/khung/TenHien";
import { useDuong } from "@/components/khung/NgonNgu";
import { gopTenHien, tenTheo } from "@/lib/ten-hien";

// Cờ từ engine viết cho người phát triển — đổi sang lời dễ hiểu cho người đọc (EN-ALL: chữ ở lib/chu/tu-vi.ts, khoá co.<loại>).
const CO_CO_LOI = new Set(["ty_conflict", "nam_phai"]);

// Gợi ý câu hỏi theo nhóm (chữ ở lib/chu/tu-vi.ts).
const GOI_Y_KHOA = [
  { nhom: "hoi.nhom_la_so", cau: ["hoi.la_so_1", "hoi.la_so_2", "hoi.la_so_3"] },
  { nhom: "hoi.nhom_han", cau: ["hoi.han_1", "hoi.han_2", "hoi.han_3"] },
  { nhom: "hoi.nhom_kien_thuc", cau: ["hoi.kien_thuc_1", "hoi.kien_thuc_2"] },
];

const namNayVN = () => Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));

export function TuVi() {
  const hoSo = useHoSo();
  const c = useChu();
  const { c: ct, en } = useChuTuVi();
  const d = useDuong();
  const GOI_Y = GOI_Y_KHOA.map((g) => ({ nhom: ct(g.nhom), cau: g.cau.map((k) => ct(k)) }));
  // TV-PHAI (chủ dự án chốt 2026-10-02): "hiện cả hai" — Hoả/Linh lối Việt | Trung Châu; nửa sau tháng nhuận.
  const [hoaLinh, setHoaLinh] = useState<"viet" | "trung">("viet");
  // HTT-1: giờ sinh theo đồng hồ (mặc định, như sách Việt) hay giờ mặt trời thực tại kinh độ nơi sinh — engine lập lại lá số.
  const [gioSinh, setGioSinh] = useState<"dong_ho" | "mat_troi">("dong_ho");
  const [thangNhuan, setThangNhuan] = useState<ThangNhuan>("thang_sau");
  // TV-LICH (chủ dự án yêu cầu 2026-10-02): âm lịch Việt Nam (mặc định) ↔ lịch Trung Quốc.
  const [lich, setLich] = useState<"viet" | "trung">("viet");
  // TP-GON: khung Trường phái thu gọn — giữ trạng thái mở ở đây vì lá số tạm gỡ mỗi lần engine an lại.
  const [moPhai, setMoPhai] = useState(false);
  const nutHienThi = useRef<HTMLButtonElement>(null);   // TM-1: "Thu gọn" trong bảng Hiển thị → trả focus về nút mở
  // NT-1: lá số người thân đã lưu trên máy (chỉ xem) — null = lá số của chính người dùng.
  const dsNguoiThan = useNguoiThan();
  const [xemId, setXemId] = useState<string | null>(null);
  const nt = (xemId && dsNguoiThan?.find((x) => x.id === xemId)) || null;
  // TP-LICH: hồ sơ nhập ngày âm theo lịch Trung Quốc → mở lá số theo lịch đó (người dùng vẫn đổi được).
  const lichHoSo = hoSo?.lich_am;
  useEffect(() => { if (lichHoSo === "trung") setLich("trung"); }, [lichHoSo]);
  // TV-LN (chủ dự án yêu cầu 2026-10-08): phái tính lưu nguyệt — chỉ đổi cung tháng, không đổi lá số gốc.
  const [luuNguyet, setLuuNguyet] = useState<PhaiLuuNguyet>("dau_quan_thai_tue");
  const laSoBan = laSoTuHoSo(hoSo);
  const goc: ChartInputVao | null = nt ? laSoNguoiThan(nt) : laSoBan;
  const laSoGoc = goc ? { ...goc, ...(hoaLinh === "trung" ? { hoa_linh: hoaLinh } : {}), ...(thangNhuan !== "thang_sau" ? { thang_nhuan: thangNhuan } : {}), ...(lich === "trung" ? { lich } : {}), ...(gioSinh === "mat_troi" ? { gio_sinh: gioSinh } : {}) } : null;
  const laSo = laSoGoc ? { ...laSoGoc, ...(luuNguyet !== "dau_quan_thai_tue" ? { luu_nguyet: luuNguyet } : {}) } : null;
  // Lá số gốc không phụ thuộc phái lưu nguyệt → không an lại khi chỉ đổi phái tháng.
  const { data: ls, loi, thuLai } = usePost<LaSoOutputT>("/api/tuvi/la-so", laSoGoc);
  const [namXem, setNamXem] = useState(namNayVN);
  const { data: vh } = usePost<VanHanOutputT>("/api/tuvi/van-han", laSoGoc ? { la_so: laSoGoc, nam_xem: namXem } : null);
  const { data: lnm } = usePost<LuuNguyetOutputT>("/api/tuvi/luu-nguyet", laSo ? { la_so: laSo, nam_am: namXem } : null);
  const [lop, setLop] = useState({ dai_han: false, luu_nien: true });
  const [giaoDien, doiGiaoDien] = useGiaoDien("tuvi");
  const [phaiDoSang, setPhaiDoSang] = useState<PhaiDoSang>("nam");
  const [chon, setChon] = useState<string | null>(null);
  const [cheDo, setCheDo] = useState<"tham_khao" | "chi_tiet">("tham_khao");
  const [cauNgoai, setCauNgoai] = useState<{ cau: string; lan: number } | null>(null);
  // TV-HOA-HAN: "Hỏi về sao này" chỉ điền sẵn câu vào ô hỏi đáp (người dùng tự bấm gửi).
  const [cauDienSan, setCauDienSan] = useState<{ cau: string; lan: number } | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const cc = useChuChung();
  const [loiAnh, setLoiAnh] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chiTietRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLElement>(null);

  const chiMenh = ls?.cung.find((c) => c.la_menh)?.chi ?? ls?.chi_cung_menh ?? "Dần";
  // TM-1: như TruongPhai — có lựa chọn khác mặc định / điều cần biết thì nút "Hiển thị" có chấm, nhắc hiện cả khi đóng.
  const phaiKhac = lich !== "viet" || phaiDoSang !== "nam" || hoaLinh !== "viet" || luuNguyet !== "dau_quan_thai_tue" || thangNhuan !== "thang_sau" || gioSinh !== "dong_ho";
  // TV-NHUAN3: sinh trong tháng nhuận (mọi ngày — cách "cả tháng tính tháng sau" đổi cả nửa đầu tháng)
  const coNhuan = !!ls?.phai?.co_the_doi_thang_nhuan || !!ls?.phai?.sinh_thang_nhuan || thangNhuan !== "thang_sau";
  const nhacPhai = [
    ls?.phai?.lich_khac && ct("nhac.lich_khac"),
    coNhuan && ct("nhac.nhuan"),
  ].filter(Boolean).join(" ");
  const chiChon = chon ?? chiMenh;
  const khongBietGio = !nt && hoSo?.do_tin_gio === "unknown";
  const xemCung = (c: string) => {
    setChon(c);
    requestAnimationFrame(() => chiTietRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  // HD-CS đợt 2: từ câu trả lời → chọn cung trên lá số và đưa lá số vào giữa màn hình (thấy cung sáng + tam phương).
  const xemTrenLaSo = (c: string) => {
    setChon(c);
    ghi("chart_interacted", { mo_dun: "tuvi", kind: "xem_tren_la_so" });
    // Đầu lá số ngay dưới thanh đầu trang (đo thật, không ghi cứng) — lá số cao hơn màn hình điện thoại nên "center" lệch.
    requestAnimationFrame(() => {
      const el = svgRef.current;
      if (!el) return;
      const dau = caoDinhTren();
      const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - dau - 8, behavior: giam ? "auto" : "smooth" });
    });
  };
  const hoi = (cau: string) => {
    setCauNgoai({ cau, lan: Date.now() });
    chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const dienCau = (cau: string) => setCauDienSan({ cau, lan: Date.now() });
  // TV-HOA-HAN: chạm một giai đoạn 10 năm → năm xem nhảy tới năm đầu giai đoạn (engine trả), bật lớp đại hạn.
  const nhayDaiHan = (nam: number) => {
    setNamXem(Math.min(2100, Math.max(1900, nam)));
    setLop((l) => ({ ...l, dai_han: true }));
    ghi("chart_interacted", { mo_dun: "tuvi", kind: "nhay_dai_han" });
  };

  // NT-1: đổi người xem → về cung Mệnh, lịch theo hồ sơ người đó.
  const chonNguoi = (moi: NguoiThan | null) => {
    setXemId(moi?.id ?? null); setChon(null);
    setLich((moi ? moi.lich_am : lichHoSo) === "trung" ? "trung" : "viet");
  };

  useBatDauDoc("tuvi", Boolean(ls) && !nt);
  // EN-ALL: mã (cung…) giữ chữ Việt làm khoá; HIỆN qua `ten_hien` của phản hồi (bản Việt: nguyên mã).
  const tenMa = tenTheo(gopTenHien(ls?.ten_hien, vh?.ten_hien), en);
  // Tiêu đề trang render cả lúc chờ hồ sơ → HTML phía máy chủ có <h1> + mô tả (SEO).
  const dau = <DauMang Icon={Orbit} hinh="tu-vi" ten={ct("dau.ten")} mo_ta={ct("dau.mo_ta")} />;
  if (hoSo === undefined) return <div>{dau}<KhungTai /></div>;
  return (
    <TenHienProvider ten={[ls?.ten_hien, vh?.ten_hien, lnm?.ten_hien]}>
    <div>
      {dau}

      <XemNguoiThanCtx.Provider value={Boolean(nt)}>
      <section aria-label={ct("aria.la_so")} className="space-y-4">
        {(laSoBan || (dsNguoiThan?.length ?? 0) > 0) && <ChonNguoiXem dangXem={nt} onChon={chonNguoi} coBan={Boolean(laSoBan)} />}
        {!laSo && <MoiLapLaSo moDun="tuvi" hoSo={hoSo} />}
        {laSo && <p className="text-sm text-fg-faint">
          {ct("la_so_mau.moi")} <Link href={d("/tu-vi/la-so-mau")} className="text-gold underline">{ct("la_so_mau.link")}</Link>{ct("la_so_mau.sau")}
        </p>}
        {laSo && !ls && !loi && <KhungTai dong={6} />}
        {loi && <BaoLoi loi={loi} thuLai={thuLai} />}
        {ls && (
          <>
            {/* Thanh điều khiển */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Tabs value={giaoDien} onValueChange={(v) => doiGiaoDien(v as GiaoDien)}>
                <TabsList aria-label={ct("giao_dien")}>
                  <TabsTrigger value="dem"><Moon className="mr-1.5 inline size-3.5" aria-hidden />{ct("giao_dien.dem")}</TabsTrigger>
                  <TabsTrigger value="giay"><ScrollText className="mr-1.5 inline size-3.5" aria-hidden />{ct("giao_dien.giay")}</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="order-2 flex items-center rounded-full border border-line bg-surface/60 p-1 sm:order-none" role="group" aria-label={ct("nam_xem")}>
                <button type="button" className="vung-cham grid size-10 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg" aria-label={ct("nam_truoc")} onClick={() => setNamXem((n) => Math.max(1900, n - 1))}><ChevronLeft className="size-4" /></button>
                <span className="min-w-[5.5rem] text-center text-sm sm:min-w-[7.5rem]" aria-live="polite">
                  {ct("nam")} <b className="text-fg">{namXem}</b>{vh && vh.nam_xem === namXem ? <span className="hidden text-fg-faint sm:inline"> · {vh.can_chi_nam_xem}</span> : null}
                </span>
                <button type="button" className="vung-cham grid size-10 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg" aria-label={ct("nam_sau")} onClick={() => setNamXem((n) => Math.min(2100, n + 1))}><ChevronRight className="size-4" /></button>
              </div>
              {/* TM-1: lớp hạn + trường phái gom vào "Hiển thị" (trước là 2 nút rời + khung riêng — đọc như thanh tab, điện thoại
                  gãy 3 hàng). Nhãn nút nói đang hiện lớp nào; có điều cần biết (lệch lịch, tháng nhuận) thì nhắc ngay dưới hàng. */}
              <button type="button" ref={nutHienThi} aria-expanded={moPhai} aria-controls={moPhai ? "tv-hien-thi" : undefined} data-testid="tv-hien-thi-mo"
                onClick={() => { setMoPhai(!moPhai); if (!moPhai) ghi("chart_interacted", { mo_dun: "tuvi", kind: "mo_truong_phai" }); }}
                className={cn("order-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors sm:order-none",
                  moPhai ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
                <SlidersHorizontal className="size-4" aria-hidden />
                {ct("hien_thi")}
                <span className="hidden text-fg-faint sm:inline">· {lop.dai_han && lop.luu_nien ? ct("hien_thi.ca_hai") : lop.dai_han ? ct("hien_thi.dai_han") : lop.luu_nien ? ct("hien_thi.luu_nien") : ct("hien_thi.khong")}</span>
                {(phaiKhac || nhacPhai) && <><span className="size-1.5 rounded-full bg-moon" aria-hidden /><span className="sr-only">{ct("hien_thi.cham")}</span></>}
                <ChevronDown className={cn("size-4 transition-transform motion-reduce:transition-none", moPhai && "rotate-180")} aria-hidden />
              </button>
              {/* Điện thoại: nút tải ảnh (chỉ biểu tượng) đứng cùng hàng giao diện → còn 2 hàng thay vì 3. */}
              <Button variant="ghost" size="sm" className="order-1 ml-auto sm:order-none" disabled={dangTai} onClick={async () => {
                if (!svgRef.current) return;
                setDangTai(true);
                setLoiAnh(null);
                try { await taiAnhSvg(svgRef.current, en ? `${ct("anh.ten_tep")}.png` : `la-so-tu-vi-${ls.can_chi_nam.can}-${ls.can_chi_nam.chi}.png`); ghi("chart_interacted", { mo_dun: "tuvi", kind: "tai_anh" }); }
                catch (e) { setLoiAnh(e instanceof Error ? e.message : ct("loi_anh")); }
                finally { setDangTai(false); }
              }} aria-label={cc("doc.tai_anh")}><Download aria-hidden /> <span className="hidden sm:inline">{cc("doc.tai_anh")}</span></Button>
            </div>
            {!moPhai && nhacPhai && (
              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-moon" data-testid="truong-phai-nhac">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-moon" aria-hidden />
                <span>{nhacPhai} <button type="button" className="underline underline-offset-2" onClick={() => setMoPhai(true)}>{ct("nhac.xem_phai")}</button></span>
              </p>
            )}

            {loiAnh && <p role="alert" className="text-sm text-cinnabar">{loiAnh}</p>}
            {khongBietGio && (
              <p className="rounded-xl bg-moon/10 px-4 py-3 text-sm text-fg" data-testid="nhac-khong-biet-gio-tuvi">
                {ct("khong_gio.1")}<b>{ct("khong_gio.2")}</b>{ct("khong_gio.3")}
              </p>
            )}
            {moPhai && (
              <div id="tv-hien-thi" className="space-y-3" data-testid="tv-hien-thi">
                <div className="rounded-2xl border border-line/70 bg-surface/40 px-4 py-3 sm:px-5" role="group" aria-labelledby="tv-lop-han">
                  <p id="tv-lop-han" className="text-sm font-semibold text-fg">{ct("lop.tieu_de")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">{ct("lop.mo_ta")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["dai_han", "luu_nien"] as const).map((k) => (
                      <button key={k} type="button" aria-pressed={lop[k]} onClick={() => setLop((l) => ({ ...l, [k]: !l[k] }))}
                        className={cn("min-h-10 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                          lop[k] ? (k === "dai_han" ? "border-[rgb(126_172_255)] bg-[rgb(126_172_255)]/15 text-fg" : "border-gold bg-gold/15 text-fg") : "border-line text-fg-muted hover:text-fg")}>
                        {k === "dai_han" ? ct("lop.dai_han") : ct("lop.luu_nien")}
                      </button>
                    ))}
                  </div>
                </div>
                <TruongPhai
                  lich={lich} setLich={setLich} lichKhac={!!ls.phai?.lich_khac}
                  phaiDoSang={phaiDoSang} setPhaiDoSang={setPhaiDoSang}
                  hoaLinh={hoaLinh} setHoaLinh={setHoaLinh}
                  gioSinh={gioSinh} setGioSinh={(v) => { setGioSinh(v); ghi("chart_interacted", { mo_dun: "tuvi", kind: "phai_gio_sinh", gio_sinh: v }); }}
                  coKinhDo={!!goc?.noi_sinh && (goc.noi_sinh !== "nuoc_ngoai" || /^[a-z]{2}-(?!khac$)[a-z0-9_]+$/.test(goc.mui_gio ?? ""))}
                  thangNhuan={thangNhuan} setThangNhuan={setThangNhuan}
                  coNhuan={coNhuan}
                  luuNguyet={luuNguyet} setLuuNguyet={(v) => { setLuuNguyet(v); ghi("chart_interacted", { mo_dun: "tuvi", kind: "phai_luu_nguyet" }); }}
                  mo doiMo={(v) => { if (!v) { setMoPhai(false); requestAnimationFrame(() => nutHienThi.current?.focus()); } }} />
              </div>
            )}
            {/* Lá số: điện thoại mặc định thu vừa màn hình, "Phóng to" để đọc chữ rõ rồi vuốt (Trục 1 — KhungLaSo) */}
            <KhungLaSo chon={chiChon} chan={<ChanLaSo giaoDien={giaoDien} tieuDe={ct("chan.tieu_de")} duong={d("/tu-vi")} />}>
              <LaSoTuVi ref={svgRef} ls={ls} vanHan={vh} lop={lop} giaoDien={giaoDien} ten={nt ? (en ? nt.ten_goi || `${ct(`qh.${nt.quan_he}`)} · ${nt.nam}` : tenHien(nt)) : hoSo?.ho_ten} gioSinh={nt ? gioHienThi(nt) : gioHienThi(hoSo)}
                chon={chiChon} phaiDoSang={phaiDoSang} onChon={(c) => {
                  setChon(c); ghi("chart_interacted", { mo_dun: "tuvi", kind: "chon_cung" });
                  // Điện thoại: chi tiết cung nằm dưới lá số, ngoài tầm mắt → cuộn tới.
                  if (window.matchMedia("(max-width: 639px)").matches) requestAnimationFrame(() => chiTietRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                }} />
            </KhungLaSo>
            <DongHoaHan vh={vh} lop={lop} namXem={namXem} />
            <DaiHanNhay ls={ls} vh={vh} namXem={namXem} tieuDe={c("dai_han.tieu_de")} onNhay={nhayDaiHan} />
            <CungSaoMenh d={ls.cung_sao_menh} />

            <div ref={chiTietRef} className="scroll-mt-20">
              <ChiTietCung ls={ls} chi={chiChon} phai={phaiDoSang} vanHan={lop.dai_han || lop.luu_nien ? vh : null} lop={lop}
                hanSao={vh && vh.nam_xem === namXem ? vh : null} onHoi={hoi} onDienCau={dienCau} />
            </div>
            {lnm && lnm.nam_am === namXem ? (
              <LuuNguyet d={lnm} onHoi={hoi} onChonCung={xemCung} />
            ) : <KhungTai dong={3} />}
            {/* TV-V2: bốn khối nâng cao — mỗi khối chỉ gọi engine khi người dùng mở (không 4 request mỗi lần vào trang). */}
            {laSoGoc && laSo && (
              <div className="space-y-3">
                <KhoiMoLuoi id="phi-hoa" Icon={Waypoints} tieuDe={ct("khoi.phi_hoa.tieu_de")}
                  moTa={ct("khoi.phi_hoa.mo_ta")}
                  onMoLanDau={() => ghi("chart_interacted", { mo_dun: "tuvi", kind: "phi_hoa" })}>
                  <PhiHoa laSo={laSoGoc} namXem={namXem} onChonCung={xemCung} onHoi={hoi} />
                </KhoiMoLuoi>
                <KhoiMoLuoi id="nhip-3-thang" Icon={CalendarClock} tieuDe={ct("khoi.nhip.tieu_de")}
                  moTa={ct("khoi.nhip.mo_ta")}
                  onMoLanDau={() => ghi("chart_interacted", { mo_dun: "tuvi", kind: "nhip_3_thang" })}>
                  <NhipBaThang laSo={laSo} onHoi={hoi} onChonCungTen={(ten) => { const c = ls.cung.find((k) => k.ten === ten); if (c) xemCung(c.chi); }} />
                </KhoiMoLuoi>
                {/* NT-1: định giờ (sửa giờ trong hồ sơ của bạn) và xem 2 người (so với lá số của bạn) chỉ cho lá số của chính bạn. */}
                {!nt && <>
                <KhoiMoLuoi id="dinh-gio" Icon={Clock3} tieuDe={ct("khoi.dinh_gio.tieu_de")}
                  moTa={khongBietGio ? ct("khoi.dinh_gio.mo_ta_khong") : ct("khoi.dinh_gio.mo_ta")}
                  onMoLanDau={() => ghi("chart_interacted", { mo_dun: "tuvi", kind: "dinh_gio_mo" })}>
                  <DinhGioSinh laSo={laSoGoc} hoSo={hoSo} khongBietGio={khongBietGio} />
                </KhoiMoLuoi>
                <KhoiMoLuoi id="hop-tham" Icon={HeartHandshake} tieuDe={ct("khoi.hop_tham.tieu_de")}
                  moTa={ct("khoi.hop_tham.mo_ta")}
                  onMoLanDau={() => ghi("chart_interacted", { mo_dun: "tuvi", kind: "hop_tham" })}>
                  <HopThamTuVi laSo={laSoGoc} onHoi={hoi} />
                </KhoiMoLuoi>
                </>}
              </div>
            )}
            <ChuGiai />
            {ls.cach_cuc && <CachCuc ds={ls.cach_cuc} luuY={ls.cach_cuc_luu_y} onHoi={hoi} />}
            {!nt && <SachXuaNoi ds={ls.sach_xua} moDun="tuvi" />}
            {ls.co_canh_bao.length > 0 && (
              <p className="text-xs text-fg-faint">{ls.co_canh_bao.map((c) => (CO_CO_LOI.has(c.loai) ? ct(`co.${c.loai}`) : c.chi_tiet)).join(" ")}</p>
            )}
          </>
        )}
      </section>

      {/* NT-1: luận giải toàn bộ (trả Sao, lưu bài, góp ý) chỉ cho lá số của chính người dùng. */}
      {laSo && ls && !nt && (
        <section aria-label={ct("aria.luan_giai")} className="mt-10">
          <LuanGiaiToanBo duongDan="/api/tuvi/luan-giai" laSo={kemTinhTrang(laSo, hoSo)} ten={ct("luan_giai.ten")} />
          {/* EN-ALL: bản Anh chưa có lối đi chéo mảng → bỏ khối CTA, giữ mốc đọc xong + góp ý (như Bát tự). */}
          <CuoiBaiDoc moDun="tuvi" cauHoi={ct("luan_giai.cau_hoi")} khongCta={en} />
        </section>
      )}

      <section ref={chatRef} aria-label={ct("aria.hoi")} className="mt-10 scroll-mt-24">
        <h2 className="mb-4 text-2xl sm:text-3xl">{c("hoi.tieu_de") || ct("hoi.tieu_de")}</h2>
        {/* HD-CS đợt 2 (hướng C): "Xem trên lá số" trong câu trả lời chọn đúng cung trên lá số phía trên. */}
        <HanhDongTrucQuan.Provider value={laSo && ls ? { xemCung: xemTrenLaSo } : {}}>
        <KhungChat
          key={nt?.id ?? "ban"}
          moDun="tuvi"
          loiChao={laSo ? ct("hoi.loi_chao_co") : ct("hoi.loi_chao_khong")}
          goiY={GOI_Y}
          cauNgoai={cauNgoai}
          cauDienSan={cauDienSan}
          nhanO={ct("hoi.nhan_o")}
          dieuKhien={
            <Tabs value={cheDo} onValueChange={(v) => setCheDo(v as "tham_khao" | "chi_tiet")}>
              <TabsList aria-label={ct("hoi.che_do")}>
                <TabsTrigger value="tham_khao">{ct("hoi.tham_khao")}</TabsTrigger>
                <TabsTrigger value="chi_tiet">{ct("hoi.chi_tiet")}</TabsTrigger>
              </TabsList>
            </Tabs>
          }
          gui={(cau) => { let sauTraLoi: ReactNode = null; return hoiMang<HoiMangRes & {
            phan_loai?: { cung?: string[]; xu_ly?: string }; goi_y_vec?: GoiYVec | null; co_the_goi_y?: boolean; nhan_ra_y_dinh?: boolean;
          }>(
            "/api/tuvi/hoi",
            { cau_hoi: cau, che_do: cheDo, ...(laSo ? { la_so: laSo } : {}), ...(nt ? { nguoi_than: true } : {}) },
            (d) => {
              // LG-ĐS: có câu gần nghĩa trong kho → hỏi lại "đúng ý bạn chứ?"; không có → cho chọn 1 trong 8 chủ đề.
              // v3 M1: phần hỏi lại này đi SAU câu trả lời (đọc trước, xác nhận sau); "Cung xem" vẫn ở trên.
              // EN-ALL: kho vectơ ý định chỉ có câu tiếng Việt → bản Anh không hỏi lại.
              sauTraLoi = en ? null : d.goi_y_vec?.y_dinh ? <XacNhanYDinh cau={cau} goi={d.goi_y_vec} />
                : d.co_the_goi_y && !d.nhan_ra_y_dinh && !["an_toan", "tu_choi_nhe", "dan_huong"].includes(d.phan_loai?.xu_ly ?? "")
                  ? <ChonYDinh cau={cau} /> : null;
              return d.phan_loai?.cung?.length ? <p className="text-xs text-moon">{ct("hoi.cung_xem", { ds: d.phan_loai.cung.map((x) => tenMa("cung", x)).join(", ") })}</p> : null;
            },
          ).then((kq) => (sauTraLoi ? { ...kq, sau: sauTraLoi, hoiLai: null } : kq)); }}   // EN-3: một khối hỏi lại
        />
        </HanhDongTrucQuan.Provider>
      </section>
      </XemNguoiThanCtx.Provider>
    </div>
    </TenHienProvider>
  );
}

// Chú giải màu — giúp người mới đọc lá số.
function ChuGiai() {
  const { c, ten } = useChuTuVi();
  const hanh = [["Kim", "bg-[rgb(214_211_230)]"], ["Mộc", "bg-jade"], ["Thủy", "bg-[rgb(126_172_255)]"], ["Hỏa", "bg-cinnabar"], ["Thổ", "bg-gold"]];
  return (
    <details className="group rounded-2xl border border-line/70 bg-surface/40 px-4 py-3 text-sm">
      <summary className="cursor-pointer text-fg-muted hover:text-fg">{c("chu_giai.tieu_de")}</summary>
      <div className="mt-3 grid gap-3 text-fg-muted sm:grid-cols-2">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-fg">{c("chu_giai.mau")}</span>
          {hanh.map(([t, m]) => <span key={t} className="inline-flex items-center gap-1.5"><span className={cn("size-2.5 rounded-full", m)} />{ten("hanh", t)}</span>)}
        </p>
        <p><span className="text-fg">{c("chu_giai.do_sang")}</span>{c("chu_giai.do_sang_chu")}</p>
        <p><span className="text-fg">{c("chu_giai.cot")}</span>{c("chu_giai.cot_chu")}</p>
        <p><span className="text-fg">{c("chu_giai.tam_phuong")}</span>{c("chu_giai.tam_phuong_chu")}</p>
        <p><span className="text-fg">{c("chu_giai.day")}</span>{c("chu_giai.day_chu")}</p>
        <p><span className="text-fg">{c("chu_giai.tt")}</span>{c("chu_giai.tt_chu")}</p>
      </div>
    </details>
  );
}
