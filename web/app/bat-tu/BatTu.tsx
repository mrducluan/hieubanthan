"use client";
// VZ-3 — trang Bát tự: bảng tứ trụ → vòng địa chi + ngũ giác ngũ hành → dụng thần → đại vận/lưu niên
// → hỏi đáp AI ở DƯỚI (chủ dự án chốt 2026-10-01). Hai giao diện dùng chung với lá số Tử vi.
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Layers, Moon, ScrollText } from "lucide-react";
import { KhungChat } from "@/components/hoi/KhungChat";
import { BangTuTru, DaiVanLuuNien, DungThan, NguGiacNguHanh, VongDiaChi } from "@/components/huyen-hoc/BatTuTrucQuan";
import { DauMang, XinThemDuLieu } from "@/components/huyen-hoc/KhungMang";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LaSoBatTu, LuuNienBatTu } from "@/lib/battu-kieu";
import { useGiaoDien, type GiaoDien } from "@/lib/giao-dien-la-so";
import { usePost } from "@/lib/goi-api";
import { hoiMang } from "@/lib/hoi-mang";
import { laSoTuHoSo, useHoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";

// Cờ từ engine viết cho người phát triển — đổi sang lời dễ hiểu cho người đọc.
const LOI_NHAN_CO: Record<string, string> = {
  da_ty: "Bạn sinh 23:00–23:59 (giờ Tý muộn): bát tự ở đây giữ trụ ngày hôm đó, trụ giờ lấy giờ Tý của ngày sau. Có trường phái đổi ngày từ 23:00 nên có thể ra trụ ngày khác; tử vi ở đây tính sang ngày mới.",
};

const GOI_Y = [
  { nhom: "Lá số", cau: ["Dụng thần của tôi là gì?", "Tôi thân vượng hay thân nhược?", "Ngũ hành của tôi thiếu gì?"] },
  { nhom: "Vận", cau: ["Đại vận hiện tại của tôi là gì?", "Năm nay với tôi thế nào?"] },
  { nhom: "Kiến thức", cau: ["Nhật chủ Giáp là người thế nào?", "Thập thần là gì?"] },
];

const namNayVN = () => Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));

export function BatTu() {
  const hoSo = useHoSo();
  const laSo = laSoTuHoSo(hoSo);
  const { data: ls, loi, thuLai } = usePost<LaSoBatTu>("/api/battu/la-so", laSo);
  const [namXem, setNamXem] = useState(namNayVN);
  const { data: ln } = usePost<LuuNienBatTu>("/api/battu/luu-nien", laSo ? { la_so: laSo, nam_xem: namXem } : null);
  const [giaoDien, doiGiaoDien] = useGiaoDien("battu");
  const chatRef = useRef<HTMLElement>(null);

  if (hoSo === undefined) return <KhungTai />;
  const lnDung = ln && ln.nam === namXem ? ln : null;
  return (
    <div>
      <DauMang Icon={Layers} ten="Bát tự" mo_ta="Tứ trụ năm – tháng – ngày – giờ theo tiết khí, ngũ hành chấm theo thang điểm công bố, dụng thần luôn trình bày hai cách để bạn tự cân nhắc." />

      <section aria-label="Tứ trụ" className="space-y-4">
        {!laSo && <XinThemDuLieu hoSo={hoSo} ly_do="Tứ trụ cần giờ sinh, giới tính và nơi sinh. Giờ sinh càng chính xác càng tốt nếu bạn sinh gần ngày chuyển tiết." />}
        {laSo && !ls && !loi && <KhungTai dong={6} />}
        {loi && <BaoLoi loi={loi} thuLai={thuLai} />}
        {ls && (
          <>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Tabs value={giaoDien} onValueChange={(v) => doiGiaoDien(v as GiaoDien)}>
                <TabsList aria-label="Giao diện lá số">
                  <TabsTrigger value="dem"><Moon className="mr-1.5 inline size-3.5" aria-hidden />Đêm sao</TabsTrigger>
                  <TabsTrigger value="giay"><ScrollText className="mr-1.5 inline size-3.5" aria-hidden />Giấy cổ</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center rounded-full border border-line bg-surface/60 p-1" role="group" aria-label="Năm xem">
                <button type="button" className="grid size-8 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Năm trước" onClick={() => setNamXem((n) => Math.max(1900, n - 1))}><ChevronLeft className="size-4" /></button>
                <span className="min-w-[7.5rem] text-center text-sm" aria-live="polite">
                  Năm <b className="text-fg">{namXem}</b>{lnDung ? <span className="text-fg-faint"> · {lnDung.can} {lnDung.chi}</span> : null}
                </span>
                <button type="button" className="grid size-8 place-items-center rounded-full text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Năm sau" onClick={() => setNamXem((n) => Math.min(2100, n + 1))}><ChevronRight className="size-4" /></button>
              </div>
            </div>

            <div className={cn(`la-so-${giaoDien}`, "space-y-6 rounded-[1.25rem] p-4 shadow-card sm:p-6")}
              style={{ background: "var(--ls-nen)", color: "var(--ls-chu)" }} data-testid="tu-tru">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--ls-mo)]">Tứ trụ · 四柱八字</p>
                  <h2 className="font-serif text-2xl text-[var(--ls-nhan)] sm:text-3xl">{hoSo?.ho_ten ?? "Lá số Bát tự"}</h2>
                </div>
                <p className="text-sm text-[var(--ls-mo)]">
                  Nhật chủ <b style={{ color: "var(--ls-nhan)" }}>{ls.nhat_chu.can}</b> · {ls.nhat_chu.am_duong} {ls.nhat_chu.ngu_hanh}
                  {ls.mo_rong ? ` · không vong ${ls.mo_rong.khong_vong.ngay.join(", ")}` : ""}
                </p>
              </div>
              <div className="overflow-x-auto"><div className="min-w-[30rem]"><BangTuTru ls={ls} /></div></div>

              <div className="grid gap-6 border-t border-[var(--ls-vien)] pt-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-center font-serif text-xl">Ngũ hành sinh – khắc</h3>
                  <NguGiacNguHanh ls={ls} />
                </div>
                <div>
                  <h3 className="mb-2 text-center font-serif text-xl">Hợp – xung giữa bốn trụ</h3>
                  <VongDiaChi ls={ls} />
                </div>
              </div>

              <div className="border-t border-[var(--ls-vien)] pt-6"><DungThan ls={ls} /></div>
              <div className="border-t border-[var(--ls-vien)] pt-6">
                <DaiVanLuuNien ls={ls} ln={lnDung} namXem={namXem} setNamXem={setNamXem} />
              </div>
              {ls.mo_rong && (
                <details className="border-t border-[var(--ls-vien)] pt-4 text-sm">
                  <summary className="cursor-pointer text-[var(--ls-mo)]">Ý nghĩa các thần sát trong lá số ({ls.mo_rong.than_sat.length})</summary>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {ls.mo_rong.than_sat.map((t) => (
                      <li key={t.ten}><b>{t.ten}</b> <span className="text-[var(--ls-mo)]">— {t.y} · trụ {t.tru.map((i) => ["năm", "tháng", "ngày", "giờ"][i]).join(", ")}</span></li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-[var(--ls-mo)]">Bảng tra: {ls.mo_rong.than_sat_nguon}. Thần sát chỉ là tín hiệu phụ — luận chính dựa vào ngũ hành, thập thần, dụng thần.</p>
                </details>
              )}
            </div>
            {ls.co_canh_bao.map((c) => <p key={c.loai} className="text-xs text-moon">{LOI_NHAN_CO[c.loai] ?? c.chi_tiet}</p>)}
          </>
        )}
      </section>

      <section ref={chatRef} aria-label="Hỏi Bát tự" className="mt-10 scroll-mt-24">
        <h2 className="mb-4 text-2xl sm:text-3xl">Hỏi đáp cùng AI</h2>
        <KhungChat
          moDun="battu"
          loiChao={laSo ? "Hỏi về dụng thần, ngũ hành, đại vận hay một năm cụ thể." : "Hỏi kiến thức chung về nhật chủ, thập thần — hoặc bổ sung giờ sinh để hỏi về tứ trụ của bạn."}
          goiY={GOI_Y}
          nhanO="Câu hỏi Bát tự"
          gui={(cau) => hoiMang("/api/battu/hoi", { cau_hoi: cau, ...(laSo ? { la_so: laSo } : {}) })}
        />
      </section>
    </div>
  );
}
