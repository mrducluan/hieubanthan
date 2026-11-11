"use client";
// VZ-3 — trang Bát tự: bảng tứ trụ → vòng địa chi + ngũ giác ngũ hành → dụng thần → đại vận/lưu niên
// → hỏi đáp AI ở DƯỚI (chủ dự án chốt 2026-10-01). Hai giao diện dùng chung với lá số Tử vi.
import { useChu } from "@/components/cms/DauCms";
import { useChuChung } from "@/components/cms/ChuChung";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ChevronDown, ChevronLeft, ChevronRight, Download, Layers, Moon, ScrollText } from "lucide-react";
import { KhungChat } from "@/components/hoi/KhungChat";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { BangTuTru, DaiVanLuuNien, DungThan, NguGiacNguHanh, VongDiaChi } from "@/components/huyen-hoc/BatTuTrucQuan";
import { DauMang } from "@/components/huyen-hoc/KhungMang";
import { MoiLapLaSo } from "@/components/huyen-hoc/MoiLapLaSo";
import { ChipPhai, DongGhiChu, DongPhai, KhungPhai, type PhaiDangDung } from "@/components/huyen-hoc/KhungPhai";
import { DoiChieuCach } from "@/components/huyen-hoc/DoiChieuCach";
import { ChanLaSo } from "@/components/huyen-hoc/ChanLaSo";
import { LuanGiaiToanBo } from "@/components/huyen-hoc/LuanGiaiToanBo";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CachChinhBatTu, khoaLaSo, useCachChinh } from "@/lib/cach-chinh-battu";
import { ghi } from "@/lib/do-luong";
import { cuonToiLuanGiai, useCuaLuanGiai } from "@/lib/cta-sao";
import type { LaSoBatTu, LuuNienBatTu } from "@/lib/battu-kieu";
import { useGiaoDien, type GiaoDien } from "@/lib/giao-dien-la-so";
import { usePost } from "@/lib/goi-api";
import { hoiMang } from "@/lib/hoi-mang";
import { kemTinhTrang, laSoTuHoSo, tenGoi, tenGoiEn, useHoSo } from "@/lib/hoso";
import { taiAnhHtml } from "@/lib/tai-anh-html";
import { cn } from "@/lib/utils";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { TenHienProvider } from "@/components/khung/TenHien";
import { gopTenHien, tenTheo } from "@/lib/ten-hien";
import { useDuong } from "@/components/khung/NgonNgu";
import { useChuBatTu } from "@/components/huyen-hoc/chu-bat-tu";

// Cờ từ engine viết cho người phát triển — đổi sang lời dễ hiểu cho người đọc (EN-ALL: chữ ở lib/chu/bat-tu.ts, khoá co.<loại>).
const CO_CO_LOI = new Set(["hour_confidence", "da_ty"]);

// Gợi ý câu hỏi theo nhóm (chữ ở lib/chu/bat-tu.ts).
const GOI_Y_KHOA = [
  { nhom: "hoi.nhom_la_so", cau: ["hoi.la_so_1", "hoi.la_so_2", "hoi.la_so_3"] },
  { nhom: "hoi.nhom_van", cau: ["hoi.van_1", "hoi.van_2"] },
  { nhom: "hoi.nhom_kien_thuc", cau: ["hoi.kien_thuc_1", "hoi.kien_thuc_2"] },
];

// Trục 2 UX: bảng kỹ thuật (tàng can, nạp âm, tinh vận, thần sát, dụng thần, hợp – xung…) gom vào mục gập "Lá số chi
// tiết"; người đã mở thì máy nhớ (hbt.battu_chi_tiet) — lần sau mở sẵn. Link #la-so-chi-tiet cũng mở sẵn.
const KHOA_CHI_TIET = "hbt.battu_chi_tiet";

const namNayVN = () => Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));

export function BatTu() {
  // Nút đầu trang "Đọc luận giải đời thường": một cú bấm vừa cuộn vừa tải chương đầu (miễn phí) nếu chưa tải — không bắt bấm lần hai.
  const cuaLg = useCuaLuanGiai();
  const hoSo = useHoSo();
  const c = useChu();
  const { c: cb, en, tru } = useChuBatTu();
  const d = useDuong();
  const GOI_Y = GOI_Y_KHOA.map((g) => ({ nhom: cb(g.nhom), cau: g.cau.map((k) => cb(k)) }));
  const [gioTy, setGioTy] = useState<"da_ty" | "sang_ngay">("da_ty");
  // HTT-1: giờ sinh theo đồng hồ (mặc định) hay mặt trời thực tại kinh độ nơi sinh — engine lập lại tứ trụ.
  const [gioSinh, setGioSinh] = useState<"dong_ho" | "mat_troi">("dong_ho");
  // HTT-2 H1: điều hậu theo mùa thực nơi sinh — chỉ hiện khi engine báo nơi sinh ở ngoài chí tuyến Nam (Sydney, Auckland…).
  const [dieuHau, setDieuHau] = useState<"bac_ban_cau" | "noi_sinh">("bac_ban_cau");
  const goc = laSoTuHoSo(hoSo);
  const coKinhDo = !!goc?.noi_sinh && (goc.noi_sinh !== "nuoc_ngoai" || /^[a-z]{2}-(?!khac$)[a-z0-9_]+$/.test(goc.mui_gio ?? ""));
  // TP-LICH: lựa chọn giờ Tý đi theo mọi lời gọi (tứ trụ, lưu niên, hỏi đáp, luận giải) — engine tính lại.
  const laSo = goc ? { ...goc, ...(gioTy === "sang_ngay" ? { gio_ty: gioTy } : {}), ...(gioSinh === "mat_troi" ? { gio_sinh: gioSinh } : {}),
    ...(dieuHau === "noi_sinh" ? { dieu_hau: dieuHau } : {}) } : null;
  const { data: ls, loi, thuLai } = usePost<LaSoBatTu>("/api/battu/la-so", laSo);
  const [namXem, setNamXem] = useState(namNayVN);
  const { data: ln } = usePost<LuuNienBatTu>("/api/battu/luu-nien", laSo ? { la_so: laSo, nam_xem: namXem } : null);
  const [giaoDien, doiGiaoDien] = useGiaoDien("battu");
  const chatRef = useRef<HTMLElement>(null);
  const tuTruRef = useRef<HTMLDivElement>(null);
  const [dangTai, setDangTai] = useState(false);
  const cachChinh = useCachChinh(khoaLaSo(laSo));
  const cc = useChuChung();
  const [loiAnh, setLoiAnh] = useState<string | null>(null);
  const [moChiTiet, setMoChiTiet] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem(KHOA_CHI_TIET) === "1" || location.hash === "#la-so-chi-tiet") setMoChiTiet(true); } catch { /* bỏ qua */ }
  }, []);
  const doiChiTiet = () => setMoChiTiet((v) => {
    try { localStorage.setItem(KHOA_CHI_TIET, v ? "0" : "1"); } catch { /* chế độ riêng tư */ }
    if (!v) ghi("chart_interacted", { mo_dun: "battu", kind: "chi_tiet_mo" });
    return !v;
  });

  useBatDauDoc("battu", Boolean(ls));
  // Tiêu đề trang render cả lúc chờ hồ sơ → HTML phía máy chủ có <h1> + mô tả (SEO).
  const dau = <DauMang Icon={Layers} hinh="bat-tu" ten={cb("dau.ten")} mo_ta={cb("dau.mo_ta")} />;
  if (hoSo === undefined) return <div>{dau}<KhungTai nhan={cb("dang_tai")} /></div>;
  const lnDung = ln && ln.nam === namXem ? ln : null;
  // EN-ALL: mã (can, chi, hành, thập thần, thần sát…) giữ chữ Việt làm khoá; HIỆN qua `ten_hien` của phản hồi (bản Việt: nguyên mã).
  const ten = tenTheo(gopTenHien(ls?.ten_hien, lnDung?.ten_hien), en);
  const tenTru = (ds: number[]) => ds.map((i) => tru(i, "thuong")).join(", ");
  const sinhGioTy = (goc?.birth_time ?? "") >= "23:00";
  const namBanCau = Boolean(ls?.tuy_chon?.nam_ban_cau_kha_dung) || dieuHau === "noi_sinh";
  // TP-GON: khung trường phái đóng chỉ còn chip lựa chọn đang dùng; nhắc riêng khi sinh 23:00–23:59 (hai phái ra trụ ngày khác).
  const phaiDangDung: PhaiDangDung[] = [
    { nhan: gioTy === "da_ty" ? cb("phai.gio_ty_giu") : cb("phai.gio_ty_doi"), khac: gioTy !== "da_ty" },
    { nhan: gioSinh === "mat_troi" ? cb("phai.gio_mat_troi") : cb("phai.gio_dong_ho"), khac: gioSinh === "mat_troi" },
    ...(namBanCau ? [{ nhan: dieuHau === "noi_sinh" ? cb("phai.mua_noi_sinh") : cb("phai.mua_tiet_khi"), khac: dieuHau === "noi_sinh" }] : []),
    { nhan: cb("phai.tiet_khi") },
  ];
  return (
    <TenHienProvider ten={[ls?.ten_hien, lnDung?.ten_hien]}>
    <div>
      {dau}

      <section aria-label={cb("aria.tu_tru")} className="space-y-4">
        {!laSo && <MoiLapLaSo moDun="battu" hoSo={hoSo} />}
        {laSo && !ls && !loi && <KhungTai dong={6} nhan={cb("dang_tai")} />}
        {loi && <BaoLoi loi={loi} thuLai={thuLai} />}
        {/* Trục 2 UX: lời thường lên đầu (câu về nhật chủ từ KB đời sống + nút xuống luận giải), bảng kỹ thuật gập bên dưới. */}
        {ls && (
          <div className="glass space-y-3 rounded-2xl p-5 sm:p-6" data-testid="bat-tu-loi-thuong">
            <p className="text-sm text-fg-muted">
              <ChuNhan lopNhan="font-bold text-gold" chu={hoSo
                ? cb("loi_thuong.co_ten", { ten: en ? tenGoiEn(hoSo) : tenGoi(hoSo), hanh: ten("hanh", ls.nhat_chu.ngu_hanh) })
                : cb("loi_thuong.khong_ten", { hanh: ten("hanh", ls.nhat_chu.ngu_hanh) })} />
              {ls.loi_thuong?.hinh_tuong ? <ChuNhan lopNhan="font-bold text-fg" chu={cb("loi_thuong.hinh", { hinh: ls.loi_thuong.hinh_tuong })} /> : cb("loi_thuong.cham")}
            </p>
            {ls.loi_thuong?.chan_dung && <p className="font-serif text-xl leading-snug sm:text-2xl">{ls.loi_thuong.chan_dung}</p>}
            {ls.loi_thuong?.cau_tu_soi && <p className="text-sm italic text-moon">“{ls.loi_thuong.cau_tu_soi}”</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
              <Button asChild size="lg">
                <a href="#luan-giai" data-testid="bat-tu-den-luan-giai"
                  onClick={(e) => {
                    ghi("chart_interacted", { mo_dun: "battu", kind: "den_luan_giai" });
                    if (cuaLg && cuaLg.moDun === "battu" && !cuaLg.daTai) {
                      e.preventDefault();
                      cuaLg.doc();
                      requestAnimationFrame(() => cuonToiLuanGiai());
                    }
                  }}>
                  {cb("nut.doc_luan_giai")} <ArrowDown aria-hidden />
                </a>
              </Button>
              <span className="text-xs text-fg-faint">{cb("nut.doc_luan_giai_phu")}</span>
            </div>
          </div>
        )}
        {ls && (
          <button type="button" onClick={doiChiTiet} aria-expanded={moChiTiet} aria-controls="la-so-chi-tiet"
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line/70 px-4 py-3 text-left transition-colors hover:border-gold/50"
            data-testid="bat-tu-chi-tiet-mo">
            <span className="min-w-0">
              <span className="block font-medium text-fg">{cb("chi_tiet.tieu_de")}</span>
              <span className="block truncate text-xs text-fg-muted">
                {cb("chi_tiet.phu", { tru: ls.tru.map((t) => `${ten("can", t.can)} ${ten("chi", t.chi)}`).join(" · ") })}
              </span>
            </span>
            <ChevronDown className={cn("size-5 shrink-0 text-fg-muted transition-transform", moChiTiet && "rotate-180")} aria-hidden />
          </button>
        )}
        {laSo && (sinhGioTy || !ls || moChiTiet) && (
          <KhungPhai testId="truong-phai-bat-tu"
            tomTat={<ChipPhai ds={phaiDangDung} />}
            nhac={sinhGioTy ? cb("phai.nhac_ty") : undefined}
            moTa={cb("phai.mo_ta")}>
            <DongPhai ten={cb("phai.ty.ten")} nhan={cb("phai.ty.nhan")} giaTri={gioTy} doi={setGioTy}
              luaChon={[["da_ty", cb("phai.ty.da_ty")], ["sang_ngay", cb("phai.ty.sang_ngay")]]}
              noiBat={sinhGioTy} nhanNoiBat={cb("phai.ap_dung")}
              goiY={sinhGioTy ? cb("phai.ty.goi_y_co") : cb("phai.ty.goi_y_khong")} />
            <DongPhai testId="chon-gio-sinh-bat-tu" ten={cb("phai.gio_sinh.ten")} nhan={cb("phai.gio_sinh.nhan")} giaTri={gioSinh}
              doi={(v) => { setGioSinh(v); ghi("chart_interacted", { mo_dun: "battu", kind: "phai_gio_sinh", gio_sinh: v }); }}
              luaChon={[["dong_ho", cb("phai.gio_sinh.dong_ho")], ["mat_troi", cb("phai.gio_sinh.mat_troi")]]}
              goiY={coKinhDo ? cb("phai.gio_sinh.goi_y_co") : cb("phai.gio_sinh.goi_y_khong")} />
            {namBanCau && (
              <DongPhai testId="chon-dieu-hau-bat-tu" ten={cb("phai.dieu_hau.ten")} nhan={cb("phai.dieu_hau.nhan")} giaTri={dieuHau}
                doi={(v) => { setDieuHau(v); ghi("chart_interacted", { mo_dun: "battu", kind: "phai_dieu_hau", dieu_hau: v }); }}
                luaChon={[["bac_ban_cau", cb("phai.dieu_hau.bac")], ["noi_sinh", cb("phai.dieu_hau.nam")]]}
                noiBat nhanNoiBat={cb("phai.ap_dung")}
                goiY={cb("phai.dieu_hau.goi_y")} />
            )}
            <DongGhiChu ten={cb("phai.am_lich.ten")}>{cb("phai.am_lich.mo_ta")}</DongGhiChu>
          </KhungPhai>
        )}
        {ls && moChiTiet && (
          <div id="la-so-chi-tiet" className="space-y-4" data-testid="la-so-chi-tiet">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Tabs value={giaoDien} onValueChange={(v) => doiGiaoDien(v as GiaoDien)}>
                <TabsList aria-label={cb("giao_dien")}>
                  <TabsTrigger value="dem"><Moon className="mr-1.5 inline size-3.5" aria-hidden />{cb("giao_dien.dem")}</TabsTrigger>
                  <TabsTrigger value="giay"><ScrollText className="mr-1.5 inline size-3.5" aria-hidden />{cb("giao_dien.giay")}</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center rounded-full border border-line bg-surface/60 p-1" role="group" aria-label={cb("nam_xem")}>
                <button type="button" className="vung-cham grid size-10 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg" aria-label={cb("nam_truoc")} onClick={() => setNamXem((n) => Math.max(1900, n - 1))}><ChevronLeft className="size-4" /></button>
                <span className="min-w-[7.5rem] text-center text-sm" aria-live="polite">
                  {cb("nam")} <b className="text-fg">{namXem}</b>{lnDung ? <span className="text-fg-faint"> · {ten("can", lnDung.can)} {ten("chi", lnDung.chi)}</span> : null}
                </span>
                <button type="button" className="vung-cham grid size-10 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg" aria-label={cb("nam_sau")} onClick={() => setNamXem((n) => Math.min(2100, n + 1))}><ChevronRight className="size-4" /></button>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto" disabled={dangTai} onClick={async () => {
                if (!tuTruRef.current) return;
                setDangTai(true); setLoiAnh(null);
                try {
                  await taiAnhHtml(tuTruRef.current, `${en ? "bazi" : "bat-tu"}-${ls.tru.map((t) => `${ten("can", t.can)}-${ten("chi", t.chi)}`).join("_")}.png`);
                  ghi("chart_interacted", { mo_dun: "battu", kind: "tai_anh" });
                } catch (e) { setLoiAnh(e instanceof Error && !en ? e.message : cb("loi_anh")); }
                finally { setDangTai(false); }
              }}><Download aria-hidden /> {cc("doc.tai_anh")}</Button>
            </div>
            {loiAnh && <p role="alert" className="text-sm text-cinnabar">{loiAnh}</p>}

            <div className={cn(`la-so-${giaoDien}`, "space-y-6 rounded-[1.25rem] p-4 shadow-card sm:p-6")}
              style={{ background: "var(--ls-nen)", color: "var(--ls-chu)" }} data-testid="tu-tru" ref={tuTruRef}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--ls-mo)]">{cb("tu_tru.nhan")}</p>
                  <h2 className="font-serif text-2xl text-[var(--ls-nhan)] sm:text-3xl">{hoSo?.ho_ten ?? cb("tu_tru.ten_mac_dinh")}</h2>
                </div>
                <p className="text-sm text-[var(--ls-mo)]">
                  {cb("nhat_chu")} <b style={{ color: "var(--ls-nhan)" }}>{ten("can", ls.nhat_chu.can)}</b> · {ten("am_duong", ls.nhat_chu.am_duong)} {ten("hanh", ls.nhat_chu.ngu_hanh)}
                  {ls.mo_rong ? cb("khong_vong", { ds: ls.mo_rong.khong_vong.ngay.map((x) => ten("chi", x)).join(", ") }) : ""}
                </p>
              </div>
              <div className="overflow-x-auto"><div className={en ? "min-w-[42rem]" : "min-w-[30rem]"}><BangTuTru ls={ls} /></div></div>

              <div className="grid gap-6 border-t border-[var(--ls-vien)] pt-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-center font-serif text-xl">{cb("h3.ngu_hanh")}</h3>
                  <NguGiacNguHanh ls={ls} />
                </div>
                <div>
                  <h3 className="mb-2 text-center font-serif text-xl">{cb("h3.hop_xung")}</h3>
                  <VongDiaChi ls={ls} />
                </div>
              </div>

              <div className="border-t border-[var(--ls-vien)] pt-6"><DungThan ls={ls} /></div>
              <div className="border-t border-[var(--ls-vien)] pt-6">
                <DaiVanLuuNien ls={ls} ln={lnDung} namXem={namXem} setNamXem={setNamXem} />
              </div>
              {ls.mo_rong && (
                <details className="border-t border-[var(--ls-vien)] pt-4 text-sm">
                  <summary className="cursor-pointer text-[var(--ls-mo)]">{cb("than_sat.tieu_de", { so: String(ls.mo_rong.than_sat.length) })}</summary>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {ls.mo_rong.than_sat.map((t) => (
                      <li key={t.ten}><b>{ten("than_sat", t.ten)}</b> <span className="text-[var(--ls-mo)]">— {t.y} · {cb("than_sat.tru", { ds: tenTru(t.tru) })}</span></li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-[var(--ls-mo)]">{cb("than_sat.nguon", { nguon: ls.mo_rong.than_sat_nguon })}</p>
                  {ls.mo_rong.than_sat_tham_khao && ls.mo_rong.than_sat_tham_khao.length > 0 && (
                    <div className="mt-4" data-testid="than-sat-tham-khao">
                      <p className="font-medium">{cb("tk.tieu_de")}</p>
                      <p className="mt-1 text-xs text-[var(--ls-mo)]">{cb("tk.mo_ta", { nguon: ls.mo_rong.than_sat_tham_khao_nguon ?? "" })}</p>
                      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                        {ls.mo_rong.than_sat_tham_khao.map((t) => (
                          <li key={t.ten}>
                            <b>{ten("than_sat", t.ten)}</b>{" "}
                            <span className="text-[var(--ls-mo)]">
                              {t.co ? <>{cb("tk.co", { ds: tenTru(t.tru) })}{t.chinh ? cb("tk.chinh") : ""}: {t.y}</> : <>{cb("tk.khong", { goc: t.goc })}</>}
                            </span>
                            <span className="block text-xs text-[var(--ls-mo)]">
                              {cb("tk.cach_khac")} {t.cach_khac} {t.theo_cach_khac.length ? cb("tk.theo_co", { ds: tenTru(t.theo_cach_khac) }) : cb("tk.theo_khong")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </details>
              )}
              {ls.mo_rong?.cung_than && (
                <details className="border-t border-[var(--ls-vien)] pt-4 text-sm" data-testid="cung-than">
                  <summary className="cursor-pointer text-[var(--ls-mo)]">{cb("ct.tieu_de")}{ls.mo_rong.tieu_van?.length ? cb("ct.tieu_van") : ""}</summary>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                    {(["thai_nguyen", "menh_cung", "than_cung"] as const).map((k) => (
                      <div key={k} className="rounded-xl border border-[var(--ls-vien)] p-3">
                        <dt className="text-xs text-[var(--ls-mo)]">{cb(`ct.${k}`)}</dt>
                        <dd className="font-serif text-lg text-[var(--ls-nhan)]">{ten("can", ls.mo_rong!.cung_than![k].can)} {ten("chi", ls.mo_rong!.cung_than![k].chi)}</dd>
                        <dd className="text-xs text-[var(--ls-mo)]">{ten("nap_am", ls.mo_rong!.cung_than![k].nap_am)}</dd>
                        <dd className="mt-1 text-xs">{ls.mo_rong!.cung_than!.giai_thich[k]}</dd>
                      </div>
                    ))}
                  </dl>
                  {ls.mo_rong.tieu_van && ls.mo_rong.tieu_van.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs">{ls.mo_rong.cung_than.giai_thich.tieu_van}</p>
                      <ol className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        {ls.mo_rong.tieu_van.map((t) => (
                          <li key={t.nam} className="rounded-lg border border-[var(--ls-vien)] px-2 py-1">{t.nam}: <b>{ten("can", t.can)} {ten("chi", t.chi)}</b></li>
                        ))}
                      </ol>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-[var(--ls-mo)]">{cb("ct.cach_lap", { nguon: ls.mo_rong.cung_than.nguon })}</p>
                </details>
              )}
            </div>
            {/* Dải chân hieuban.com + QR: ngoài khối được chụp (tuTruRef) để ảnh tải về không in hai lần, nhưng nằm sát dưới
                khối để chụp màn hình cả hai vẫn mang link về web. */}
            <div className="-mt-2 overflow-hidden rounded-[1.25rem] shadow-card"><ChanLaSo giaoDien={giaoDien} tieuDe={cb("chan.tieu_de")} duong={d("/bat-tu")} /></div>
          </div>
        )}
        {ls?.co_canh_bao.map((c) => <p key={c.loai} className="text-xs text-moon">{CO_CO_LOI.has(c.loai) ? cb(`co.${c.loai}`) : c.chi_tiet}</p>)}
      </section>

      {laSo && ls && (
        <div className="mt-10"><DoiChieuCach laSo={laSo} /></div>
      )}

      {laSo && ls && (
        <section id="luan-giai" aria-label={cb("aria.luan_giai")} className="mt-10 scroll-mt-24">
          <CachChinhBatTu.Provider value={{ cach: cachChinh }}>
            <LuanGiaiToanBo duongDan="/api/battu/luan-giai" laSo={kemTinhTrang(laSo, hoSo)} ten={cb("luan_giai.ten")} />
          </CachChinhBatTu.Provider>
          {/* EN-ALL: bản Anh chưa có lối đi chéo mảng (các mảng khác chưa mở) → bỏ khối CTA, giữ mốc đọc xong + góp ý. */}
          <CuoiBaiDoc moDun="battu" cauHoi={cb("luan_giai.cau_hoi")} khongCta={en} />
        </section>
      )}

      <section ref={chatRef} aria-label={cb("aria.hoi")} className="mt-10 scroll-mt-24">
        <h2 className="mb-4 text-2xl sm:text-3xl">{c("hoi.tieu_de") || cb("hoi.tieu_de")}</h2>
        <KhungChat
          moDun="battu"
          loiChao={laSo ? cb("hoi.loi_chao_co") : cb("hoi.loi_chao_khong")}
          goiY={GOI_Y}
          nhanO={cb("hoi.nhan_o")}
          gui={(cau) => hoiMang("/api/battu/hoi", { cau_hoi: cau, ...(laSo ? { la_so: laSo } : {}) })}
        />
      </section>
    </div>
    </TenHienProvider>
  );
}
