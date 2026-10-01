"use client";
// VZ-2 — trang Tử vi: lá số lớn (2 giao diện, lớp vận hạn theo năm xem) → chi tiết cung đang chọn
// → hỏi đáp AI ở DƯỚI, chiếm hết chiều ngang (chủ dự án chốt 2026-10-01).
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, List, Moon, Orbit, ScrollText } from "lucide-react";
import type { LaSoOutputT, VanHanOutputT } from "@/app/api/tuvi/schema";
import { KhungChat } from "@/components/hoi/KhungChat";
import { ChiTietCung } from "@/components/huyen-hoc/ChiTietCung";
import { DauMang, XinThemDuLieu } from "@/components/huyen-hoc/KhungMang";
import { LaSoTuVi } from "@/components/huyen-hoc/LaSoTuVi";
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
  { nhom: "Hạn", cau: ["Đại hạn hiện tại của tôi là chủ đề gì?", "Năm nay lưu niên của tôi thế nào?"] },
  { nhom: "Kiến thức", cau: ["Tứ hoá là gì?", "Tham Lang ở cung Quan Lộc có ý nghĩa gì?"] },
];

const namNayVN = () => Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));

export function TuVi() {
  const hoSo = useHoSo();
  const laSo = laSoTuHoSo(hoSo);
  const { data: ls, loi, thuLai } = usePost<LaSoOutputT>("/api/tuvi/la-so", laSo);
  const [namXem, setNamXem] = useState(namNayVN);
  const { data: vh } = usePost<VanHanOutputT>("/api/tuvi/van-han", laSo ? { la_so: laSo, nam_xem: namXem } : null);
  const [lop, setLop] = useState({ dai_han: false, luu_nien: true });
  const [giaoDien, doiGiaoDien] = useGiaoDien("tuvi");
  const [chon, setChon] = useState<string | null>(null);
  const [cheDo, setCheDo] = useState<"tham_khao" | "chi_tiet">("tham_khao");
  const [cauNgoai, setCauNgoai] = useState<{ cau: string; lan: number } | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const chatRef = useRef<HTMLElement>(null);

  const chiMenh = ls?.cung.find((c) => c.la_menh)?.chi ?? ls?.chi_cung_menh ?? "Dần";
  const chiChon = chon ?? chiMenh;
  const hoi = (cau: string) => {
    setCauNgoai({ cau, lan: Date.now() });
    chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (hoSo === undefined) return <KhungTai />;
  return (
    <div>
      <DauMang Icon={Orbit} ten="Tử vi" mo_ta="Lá số an ngay trên hệ thống của Hiểu Bản Thân — ngày giờ sinh không gửi cho bên thứ ba. Hạn đọc theo thứ tự đại hạn › lưu niên › tiểu hạn. Không phán bệnh, tai nạn hay sống chết." />

      <section aria-label="Lá số" className="space-y-4">
        {!laSo && <XinThemDuLieu hoSo={hoSo} ly_do="Để an lá số cần giờ sinh, giới tính và nơi sinh (nơi sinh quyết định múi giờ lúc bạn chào đời). Bạn vẫn hỏi được câu kiến thức chung ở khung bên dưới." />}
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
                <button type="button" className="grid size-8 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Năm trước" onClick={() => setNamXem((n) => Math.max(1900, n - 1))}><ChevronLeft className="size-4" /></button>
                <span className="min-w-[7.5rem] text-center text-sm" aria-live="polite">
                  Năm <b className="text-fg">{namXem}</b>{vh && vh.nam_xem === namXem ? <span className="text-fg-faint"> · {vh.can_chi_nam_xem}</span> : null}
                </span>
                <button type="button" className="grid size-8 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Năm sau" onClick={() => setNamXem((n) => Math.min(2100, n + 1))}><ChevronRight className="size-4" /></button>
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
                try { await taiAnhSvg(svgRef.current, `la-so-tu-vi-${ls.can_chi_nam.can}-${ls.can_chi_nam.chi}.png`); ghi("chart_interacted", { mo_dun: "tuvi", kind: "tai_anh" }); }
                finally { setDangTai(false); }
              }}><Download aria-hidden /> Tải ảnh</Button>
            </div>

            {/* Lá số: trên điện thoại cuộn ngang để giữ chữ đủ lớn */}
            <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" data-testid="la-so-tu-vi">
              <div className="min-w-[760px] overflow-hidden rounded-[1.25rem] shadow-card">
                <LaSoTuVi ref={svgRef} ls={ls} vanHan={vh} lop={lop} giaoDien={giaoDien} ten={hoSo?.ho_ten} gioSinh={hoSo?.gio}
                  chon={chiChon} onChon={(c) => { setChon(c); ghi("chart_interacted", { mo_dun: "tuvi", kind: "chon_cung" }); }} />
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-fg-faint sm:hidden"><List className="size-3.5" aria-hidden />Vuốt ngang để xem trọn lá số · chạm một cung để xem chi tiết bên dưới.</p>

            <ChuGiai />
            <ChiTietCung ls={ls} chi={chiChon} vanHan={lop.dai_han || lop.luu_nien ? vh : null} onHoi={hoi} />
            {ls.co_canh_bao.length > 0 && (
              <p className="text-xs text-fg-faint">{ls.co_canh_bao.map((c) => LOI_NHAN_CO[c.loai] ?? c.chi_tiet).join(" ")}</p>
            )}
          </>
        )}
      </section>

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
        <p><span className="text-fg">Độ sáng:</span> (M) miếu · (V) vượng · (Đ) đắc · (L) lợi · (B) bình/bất · (H) hãm.</p>
        <p><span className="text-fg">Hai cột phụ tinh:</span> trái là cát tinh và Hoá Lộc/Quyền/Khoa; phải là sát tinh, Hoá Kỵ và sao khác.</p>
        <p><span className="text-fg">Tam phương tứ chính:</span> cung đang chọn nối tam giác với hai cung tam hợp; đường đứt là cung xung chiếu.</p>
        <p><span className="text-fg">Đáy cung:</span> vòng Trường sinh; khi bật lớp vận hạn, ĐH./L. là tên cung đại hạn/lưu niên, chữ nghiêng tím là sao lưu.</p>
        <p><span className="text-fg">Tuần, Triệt:</span> nhãn đặt giữa hai cung bị án ngữ (lối Việt).</p>
      </div>
    </details>
  );
}
