"use client";
// VZ-2 — trang Tử vi: lá số lớn (2 giao diện, lớp vận hạn theo năm xem) → chi tiết cung đang chọn
// → hỏi đáp AI ở DƯỚI, chiếm hết chiều ngang (chủ dự án chốt 2026-10-01).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, List, Maximize2, Minimize2, Moon, Orbit, ScrollText } from "lucide-react";
import type { LaSoOutputT, LuuNguyetOutputT, PhaiLuuNguyet, VanHanOutputT } from "@/app/api/tuvi/schema";
import { KhungChat } from "@/components/hoi/KhungChat";
import { TruongPhai } from "@/components/huyen-hoc/TruongPhai";
import { CachCuc } from "@/components/huyen-hoc/CachCuc";
import { ChiTietCung } from "@/components/huyen-hoc/ChiTietCung";
import { DauMang, XinThemDuLieu } from "@/components/huyen-hoc/KhungMang";
import { LuanGiaiToanBo } from "@/components/huyen-hoc/LuanGiaiToanBo";
import { LuuNguyet } from "@/components/huyen-hoc/LuuNguyet";
import { LaSoTuVi, type PhaiDoSang } from "@/components/huyen-hoc/LaSoTuVi";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ghi } from "@/lib/do-luong";
import { useGiaoDien, type GiaoDien } from "@/lib/giao-dien-la-so";
import { usePost } from "@/lib/goi-api";
import { hoiMang, type HoiMangRes } from "@/lib/hoi-mang";
import { laSoTuHoSo, useHoSo } from "@/lib/hoso";
import { taiAnhSvg } from "@/lib/tai-anh-svg";
import { cn } from "@/lib/utils";

// Cờ từ engine viết cho người phát triển — đổi sang lời dễ hiểu cho người đọc.
const LOI_NHAN_CO: Record<string, string> = {
  ty_conflict: "Bạn sinh 23:00–23:59: tử vi tính sang giờ Tý của ngày hôm sau, còn thần số và bát tự vẫn tính ngày hôm đó — đây là quy ước của từng môn, không phải lỗi.",
  nam_phai: "Chính tinh và tứ hoá đã đối chiếu độc lập; Tuần/Triệt theo lối Việt; một số tạp diệu riêng của lối Việt đang được bổ sung.",
};

const GOI_Y = [
  { nhom: "Lá số", cau: ["Cung Mệnh của tôi nói gì về tính cách?", "Cung Quan Lộc của tôi nói gì về sự nghiệp?", "Cung Phu Thê của tôi thế nào?"] },
  { nhom: "Hạn", cau: ["Đại hạn hiện tại của tôi là chủ đề gì?", "Năm nay lưu niên của tôi thế nào?", "Tháng sau của tôi thế nào?"] },
  { nhom: "Kiến thức", cau: ["Tứ hoá là gì?", "Tham Lang ở cung Quan Lộc có ý nghĩa gì?"] },
];

const namNayVN = () => Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));

export function TuVi() {
  const hoSo = useHoSo();
  // TV-PHAI (chủ dự án chốt 2026-10-02): "hiện cả hai" — Hoả/Linh lối Việt | Trung Châu; nửa sau tháng nhuận.
  const [hoaLinh, setHoaLinh] = useState<"viet" | "trung">("viet");
  const [thangNhuan, setThangNhuan] = useState<"thang_sau" | "thang_chinh">("thang_sau");
  // TV-LICH (chủ dự án yêu cầu 2026-10-02): âm lịch Việt Nam (mặc định) ↔ lịch Trung Quốc.
  const [lich, setLich] = useState<"viet" | "trung">("viet");
  // TP-LICH: hồ sơ nhập ngày âm theo lịch Trung Quốc → mở lá số theo lịch đó (người dùng vẫn đổi được).
  const lichHoSo = hoSo?.lich_am;
  useEffect(() => { if (lichHoSo === "trung") setLich("trung"); }, [lichHoSo]);
  // TV-LN (chủ dự án yêu cầu 2026-10-08): phái tính lưu nguyệt — chỉ đổi cung tháng, không đổi lá số gốc.
  const [luuNguyet, setLuuNguyet] = useState<PhaiLuuNguyet>("dau_quan_thai_tue");
  const goc = laSoTuHoSo(hoSo);
  const laSoGoc = goc ? { ...goc, ...(hoaLinh === "trung" ? { hoa_linh: hoaLinh } : {}), ...(thangNhuan === "thang_chinh" ? { thang_nhuan: thangNhuan } : {}), ...(lich === "trung" ? { lich } : {}) } : null;
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
  const [dangTai, setDangTai] = useState(false);
  const [loiAnh, setLoiAnh] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chiTietRef = useRef<HTMLDivElement>(null);
  const [toanCanh, setToanCanh] = useState(false);
  const chatRef = useRef<HTMLElement>(null);

  const chiMenh = ls?.cung.find((c) => c.la_menh)?.chi ?? ls?.chi_cung_menh ?? "Dần";
  const chiChon = chon ?? chiMenh;
  const hoi = (cau: string) => {
    setCauNgoai({ cau, lan: Date.now() });
    chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Tiêu đề trang render cả lúc chờ hồ sơ → HTML phía máy chủ có <h1> + mô tả (SEO).
  const dau = <DauMang Icon={Orbit} ten="Tử vi" mo_ta="Lá số an ngay trên hệ thống của Hiểu Bản Thân — ngày giờ sinh không gửi cho bên thứ ba. Hạn đọc theo thứ tự đại hạn › lưu niên › tiểu hạn. Không phán bệnh, tai nạn hay sống chết." />;
  if (hoSo === undefined) return <div>{dau}<KhungTai /></div>;
  return (
    <div>
      {dau}

      <section aria-label="Lá số" className="space-y-4">
        {!laSo && <XinThemDuLieu hoSo={hoSo} ly_do="Để an lá số cần giờ sinh, giới tính và nơi sinh (nơi sinh quyết định múi giờ lúc bạn chào đời). Bạn vẫn hỏi được câu kiến thức chung ở khung bên dưới." />}
        <p className="text-sm text-fg-faint">
          Mới làm quen Tử vi? <Link href="/la-so-mau" className="text-gold underline">Xem 6 lá số mẫu được đọc từng bước</Link>, có giải nghĩa từng thuật ngữ.
        </p>
        {laSo && !ls && !loi && <KhungTai dong={6} />}
        {loi && <BaoLoi loi={loi} thuLai={thuLai} />}
        {ls && (
          <>
            {/* Thanh điều khiển */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Tabs value={giaoDien} onValueChange={(v) => doiGiaoDien(v as GiaoDien)}>
                <TabsList aria-label="Giao diện lá số">
                  <TabsTrigger value="dem"><Moon className="mr-1.5 inline size-3.5" aria-hidden />Đêm sao</TabsTrigger>
                  <TabsTrigger value="giay"><ScrollText className="mr-1.5 inline size-3.5" aria-hidden />Giấy cổ</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center rounded-full border border-line bg-surface/60 p-1" role="group" aria-label="Năm xem hạn">
                <button type="button" className="vung-cham grid size-10 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg" aria-label="Năm trước" onClick={() => setNamXem((n) => Math.max(1900, n - 1))}><ChevronLeft className="size-4" /></button>
                <span className="min-w-[7.5rem] text-center text-sm" aria-live="polite">
                  Năm <b className="text-fg">{namXem}</b>{vh && vh.nam_xem === namXem ? <span className="text-fg-faint"> · {vh.can_chi_nam_xem}</span> : null}
                </span>
                <button type="button" className="vung-cham grid size-10 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg" aria-label="Năm sau" onClick={() => setNamXem((n) => Math.min(2100, n + 1))}><ChevronRight className="size-4" /></button>
              </div>
              {(["dai_han", "luu_nien"] as const).map((k) => (
                <button key={k} type="button" aria-pressed={lop[k]} onClick={() => setLop((l) => ({ ...l, [k]: !l[k] }))}
                  className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                    lop[k] ? (k === "dai_han" ? "border-[rgb(126_172_255)] bg-[rgb(126_172_255)]/15 text-fg" : "border-gold bg-gold/15 text-fg") : "border-line text-fg-muted hover:text-fg")}>
                  {k === "dai_han" ? "Lớp đại hạn" : "Lớp lưu niên"}
                </button>
              ))}
              <Button variant="ghost" size="sm" className="ml-auto" disabled={dangTai} onClick={async () => {
                if (!svgRef.current) return;
                setDangTai(true);
                setLoiAnh(null);
                try { await taiAnhSvg(svgRef.current, `la-so-tu-vi-${ls.can_chi_nam.can}-${ls.can_chi_nam.chi}.png`); ghi("chart_interacted", { mo_dun: "tuvi", kind: "tai_anh" }); }
                catch (e) { setLoiAnh(e instanceof Error ? e.message : "Chưa xuất được ảnh."); }
                finally { setDangTai(false); }
              }}><Download aria-hidden /> Tải ảnh</Button>
            </div>

            {loiAnh && <p role="alert" className="text-sm text-cinnabar">{loiAnh}</p>}
            <TruongPhai
              lich={lich} setLich={setLich} lichKhac={!!ls.phai?.lich_khac}
              phaiDoSang={phaiDoSang} setPhaiDoSang={setPhaiDoSang}
              hoaLinh={hoaLinh} setHoaLinh={setHoaLinh}
              thangNhuan={thangNhuan} setThangNhuan={setThangNhuan}
              coNhuan={!!ls.phai?.co_the_doi_thang_nhuan || thangNhuan === "thang_chinh"}
              luuNguyet={luuNguyet} setLuuNguyet={(v) => { setLuuNguyet(v); ghi("chart_interacted", { mo_dun: "tuvi", kind: "phai_luu_nguyet" }); }} />
            {/* Lá số: trên điện thoại mặc định cuộn ngang để giữ chữ đủ lớn; "Toàn cảnh" thu vừa màn hình */}
            <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" data-testid="la-so-tu-vi">
              <div className={cn("overflow-hidden rounded-[1.25rem] shadow-card", !toanCanh && "min-w-[760px]")}>
                <LaSoTuVi ref={svgRef} ls={ls} vanHan={vh} lop={lop} giaoDien={giaoDien} ten={hoSo?.ho_ten} gioSinh={hoSo?.gio}
                  chon={chiChon} phaiDoSang={phaiDoSang} onChon={(c) => {
                    setChon(c); ghi("chart_interacted", { mo_dun: "tuvi", kind: "chon_cung" });
                    // Điện thoại: chi tiết cung nằm dưới lá số, ngoài tầm mắt → cuộn tới.
                    if (window.matchMedia("(max-width: 639px)").matches) requestAnimationFrame(() => chiTietRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                  }} />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <p className="flex flex-1 items-center gap-1.5 text-xs text-fg-faint"><List className="size-3.5 shrink-0" aria-hidden />
                {toanCanh ? "Đang thu vừa màn hình · chạm một cung để xem chi tiết." : "Vuốt ngang để xem trọn lá số · chạm một cung để xem chi tiết."}</p>
              <Button variant="secondary" size="sm" aria-pressed={toanCanh} onClick={() => setToanCanh((v) => !v)}>
                {toanCanh ? <><Maximize2 aria-hidden /> Phóng to</> : <><Minimize2 aria-hidden /> Toàn cảnh</>}
              </Button>
            </div>

            <div ref={chiTietRef} className="scroll-mt-20">
              <ChiTietCung ls={ls} chi={chiChon} phai={phaiDoSang} vanHan={lop.dai_han || lop.luu_nien ? vh : null} onHoi={hoi} />
            </div>
            {lnm && lnm.nam_am === namXem ? (
              <LuuNguyet d={lnm} onHoi={hoi} onChonCung={(c) => {
                setChon(c);
                requestAnimationFrame(() => chiTietRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
              }} />
            ) : <KhungTai dong={3} />}
            <ChuGiai />
            {ls.cach_cuc && <CachCuc ds={ls.cach_cuc} luuY={ls.cach_cuc_luu_y} onHoi={hoi} />}
            {ls.co_canh_bao.length > 0 && (
              <p className="text-xs text-fg-faint">{ls.co_canh_bao.map((c) => LOI_NHAN_CO[c.loai] ?? c.chi_tiet).join(" ")}</p>
            )}
          </>
        )}
      </section>

      {laSo && ls && (
        <section aria-label="Luận giải toàn bộ" className="mt-10">
          <LuanGiaiToanBo duongDan="/api/tuvi/luan-giai" laSo={laSo} ten="lá số Tử vi" />
        </section>
      )}

      <section ref={chatRef} aria-label="Hỏi Tử vi" className="mt-10 scroll-mt-24">
        <h2 className="mb-4 text-2xl sm:text-3xl">Hỏi đáp cùng AI</h2>
        <KhungChat
          moDun="tuvi"
          loiChao={laSo ? "Hỏi về một cung, một sao, hoặc hạn hiện tại của bạn." : "Hỏi kiến thức chung về cung, sao, tứ hoá — hoặc bổ sung giờ sinh để hỏi về lá số của bạn."}
          goiY={GOI_Y}
          cauNgoai={cauNgoai}
          nhanO="Câu hỏi Tử vi"
          dieuKhien={
            <Tabs value={cheDo} onValueChange={(v) => setCheDo(v as "tham_khao" | "chi_tiet")}>
              <TabsList aria-label="Chế độ đọc">
                <TabsTrigger value="tham_khao">Tham khảo</TabsTrigger>
                <TabsTrigger value="chi_tiet">Chi tiết</TabsTrigger>
              </TabsList>
            </Tabs>
          }
          gui={(cau) => hoiMang<HoiMangRes & { phan_loai?: { cung?: string[] } }>(
            "/api/tuvi/hoi",
            { cau_hoi: cau, che_do: cheDo, ...(laSo ? { la_so: laSo } : {}) },
            (d) => d.phan_loai?.cung?.length ? <p className="text-xs text-moon">Cung xem: {d.phan_loai.cung.join(", ")}</p> : null,
          )}
        />
      </section>
    </div>
  );
}

// Chú giải màu — giúp người mới đọc lá số.
function ChuGiai() {
  const hanh = [["Kim", "bg-[rgb(214_211_230)]"], ["Mộc", "bg-jade"], ["Thủy", "bg-[rgb(126_172_255)]"], ["Hỏa", "bg-cinnabar"], ["Thổ", "bg-gold"]];
  return (
    <details className="group rounded-2xl border border-line/70 bg-surface/40 px-4 py-3 text-sm">
      <summary className="cursor-pointer text-fg-muted hover:text-fg">Cách đọc lá số</summary>
      <div className="mt-3 grid gap-3 text-fg-muted sm:grid-cols-2">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-fg">Màu sao theo ngũ hành:</span>
          {hanh.map(([t, m]) => <span key={t} className="inline-flex items-center gap-1.5"><span className={cn("size-2.5 rounded-full", m)} />{t}</span>)}
        </p>
        <p><span className="text-fg">Độ sáng:</span> (M) miếu · (V) vượng · (Đ) đắc · (L) lợi · (B) bình/bất · (H) hãm. Mặc định theo bảng Nam phái (sách Tử vi Việt) cho 14 chính tinh; chuyển "Phái Trung" để xem bảng Trung Hoa (có cả phụ tinh).</p>
        <p><span className="text-fg">Hai cột phụ tinh:</span> trái là cát tinh và Hoá Lộc/Quyền/Khoa; phải là sát tinh, Hoá Kỵ và sao khác.</p>
        <p><span className="text-fg">Tam phương tứ chính:</span> cung đang chọn nối tam giác với hai cung tam hợp; đường đứt là cung xung chiếu.</p>
        <p><span className="text-fg">Đáy cung:</span> vòng Trường sinh; khi bật lớp vận hạn, ĐH./L. là tên cung đại hạn/lưu niên, chữ nghiêng tím là sao lưu.</p>
        <p><span className="text-fg">Tuần, Triệt:</span> nhãn đặt giữa hai cung bị án ngữ (lối Việt).</p>
      </div>
    </details>
  );
}
