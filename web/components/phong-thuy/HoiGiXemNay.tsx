"use client";
// HG-1 — "Hỏi gì xem nấy": sáu câu người dùng hay mang tới trang Phong thuỷ. Thẻ này chỉ là LỚP VẼ trên engine:
// danh mục câu hỏi lấy từ `GET /api/phongthuy/hoi-gi`, câu trả lời từ `POST /api/phongthuy/hoi-gi` (hồ sơ nhà trên máy +
// năm sinh). Web không có chữ phong thuỷ nào ở đây, không tính gì, không đọc cảm biến. Thiếu dữ kiện nào (engine nêu ở
// `thieu`) thì mời nhập đúng thứ đó: đo hướng (khối bên dưới), hồ sơ, người ở cùng (ô nhỏ tại chỗ), mấy câu có / không.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Lien from "@/components/khung/Lien";
import { useDuong } from "@/components/khung/NgonNgu";
import { TenHienProvider } from "@/components/khung/TenHien";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { ghi } from "@/lib/do-luong";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
import { urlTheoNgonNgu } from "@/lib/ngon-ngu";
import { henQuayLai } from "@/lib/quay-lai-hoi-gi";
import { kemNgonNgu } from "@/lib/sao-client";
import { cn } from "@/lib/utils";
import type { MocNam } from "@/components/huyen-hoc/KhungPhai";
import { HaiNguoiKhoi, HoiNhanhKhoi, LuoiNamKhoi, Nguoi2Khoi } from "./hoi-gi/Khoi";
import { boCucSauTraLoi, daTraLoi, homNayMay, laMaCau, nhaHoiGi, type DanhMuc, type MaCau, type MaThieu, type Nguoi2, type TraLoi } from "./hoi-gi/kieu";

export type { MaCau } from "./hoi-gi/kieu";
type Sinh = { birth_date: string; gender: "nam" | "nu"; moc_nam?: MocNam } | null;

const URL_HOI = "/api/phongthuy/hoi-gi";
const giamChuyenDong = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
/** Cuộn MỘT lần tới khối có id (tôn trọng "giảm chuyển động"). */
function cuonToi(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: giamChuyenDong() ? "auto" : "smooth", block: "start" });
}

export function HoiGiXemNay({ sinh, onChon, onHoiTiep }: {
  sinh: Sinh;
  /** Câu hỏi đang chọn (null = bỏ chọn) — trang dùng để chọn sẵn điều băn khoăn ở "Nhà của bạn". */
  onChon?: (ma: MaCau | null) => void;
  /** Điền sẵn câu hỏi vào khung hỏi đáp (khung tự cuộn tới). */
  onHoiTiep?: (cauHoi: string) => void;
}) {
  const nha = useHoSoNha();
  const { c: t } = useChuPT();
  const duong = useDuong();
  const [danhMuc, setDanhMuc] = useState<DanhMuc | null>(null);
  const [chon, setChon] = useState<MaCau | null>(null);
  const [kq, setKq] = useState<TraLoi | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState(false);
  const [lan, setLan] = useState(0);
  const [nguoi2Chon, setNguoi2Chon] = useState<Nguoi2 | null>(null);
  const [neoCo, setNeoCo] = useState<string[]>([]);
  /** Câu vừa bấm chọn, chờ câu trả lời đầu tiên để ghi đo lường (chỉ mã + cờ). */
  const choGhi = useRef<MaCau | null>(null);

  // Danh mục sáu câu hỏi: tải một lần. Lỗi → không vẽ gì (không có bản chữ dự phòng trong web).
  useEffect(() => {
    const dk = new AbortController();
    fetch(urlTheoNgonNgu(URL_HOI), { signal: dk.signal })
      .then((r) => (r.ok ? (r.json() as Promise<DanhMuc>) : null))
      .then((d) => { if (d && Array.isArray(d.cau_hoi)) setDanhMuc({ ...d, cau_hoi: d.cau_hoi.filter((x) => laMaCau(x.ma)) }); })
      .catch(() => { /* bỏ qua: thẻ ẩn */ });
    return () => dk.abort();
  }, []);

  // Người ở cùng: người dùng vừa nhập / chọn; chưa có thì lấy người đầu tiên trong hồ sơ nhà (ưu tiên vợ / chồng).
  const thanhVien = nha?.thanh_vien;
  const nguoi2 = useMemo<Nguoi2 | null>(() => {
    if (nguoi2Chon) return nguoi2Chon;
    const tv = thanhVien?.find((x) => x.vai === "vo" || x.vai === "chong") ?? thanhVien?.[0];
    return tv ? { nam: tv.nam, gioi_tinh: tv.gioi_tinh } : null;
  }, [nguoi2Chon, thanhVien]);

  // Thân lượt gọi dưới dạng chuỗi: đổi hồ sơ nhà / năm sinh / người ở cùng thì chuỗi đổi → hỏi lại (không lặp vô hạn).
  const sanSang = nha !== undefined;
  const than = useMemo(() => {
    if (!chon || !sanSang) return null;
    const n = nhaHoiGi(nha);
    return JSON.stringify({
      ma: chon,
      ...(n ? { nha: n } : {}),
      ...(sinh ? { sinh } : {}),
      ...(chon === "gia_dinh" && nguoi2 ? { nguoi_2: nguoi2 } : {}),
    });
  }, [chon, sanSang, nha, sinh, nguoi2]);

  useEffect(() => {
    if (than == null) { setKq(null); setDang(false); setLoi(false); return; }
    const dk = new AbortController();
    setDang(true); setLoi(false);
    const hen = window.setTimeout(() => {
      const body = JSON.stringify({ ...(JSON.parse(than) as object), ngay_xem: homNayMay() });
      fetch(URL_HOI, kemNgonNgu(URL_HOI, { method: "POST", headers: { "content-type": "application/json" }, body, signal: dk.signal }))
        .then(async (r) => {
          if (!r.ok) throw new Error("loi");
          return (await r.json()) as TraLoi;
        })
        .then((d) => {
          if (dk.signal.aborted) return;
          setKq(d); setDang(false);
          if (choGhi.current === d.ma) {
            choGhi.current = null;
            ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hoi_gi_chon", ma: d.ma, rieng: d.rieng ? 1 : 0, thieu: d.thieu.map((x) => x.ma).join("+") });
          }
        })
        .catch(() => { if (!dk.signal.aborted) { setLoi(true); setDang(false); } });
    }, 200);
    return () => { window.clearTimeout(hen); dk.abort(); };
  }, [than, lan]);

  // Lối đi tới khối khác trên trang: chỉ hiện khi khối đó có thật (bản Anh không có khối máy đọc ảnh).
  useEffect(() => {
    setNeoCo((kq?.lien_ket ?? []).flatMap((l) => (l.neo && document.getElementById(l.neo) ? [l.neo] : [])));
  }, [kq]);

  const chonCau = (ma: MaCau) => {
    const moi = chon === ma ? null : ma;
    choGhi.current = moi;
    if (moi !== chon) setKq(null);
    setChon(moi);
    onChon?.(moi);
  };

  const traLoiNhanh = useCallback((ma: string, co: boolean) => {
    try { luuHoSoNha({ bo_cuc: boCucSauTraLoi(nha, ma, co) }); } catch { /* chế độ riêng tư: bỏ qua */ }
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hoi_gi_tra_loi_nhanh", ma, co: co ? 1 : 0 });
  }, [nha]);

  const diToi = (neo: string) => { henQuayLai("hoi-gi"); cuonToi(neo); };

  if (!danhMuc || danhMuc.cau_hoi.length === 0) return null;
  const hienKq = kq && kq.ma === chon ? kq : null;
  const thieu = new Set<MaThieu>((hienKq?.thieu ?? []).map((x) => x.ma));
  const diem = hienKq?.diem ? [...hienKq.diem].sort((a, b) => Number(b.nen_xu_ly_truoc) - Number(a.nen_xu_ly_truoc)) : [];
  const lienKet = (hienKq?.lien_ket ?? []).filter((l) => (l.duong ? l.duong.startsWith("/") : Boolean(l.neo && neoCo.includes(l.neo))));

  return (
    <section id="hoi-gi" aria-labelledby="hoi-gi-tieu-de" data-testid="hoi-gi-xem-nay"
      className="glass mx-auto mb-6 min-w-0 max-w-3xl scroll-mt-24 rounded-2xl border border-gold/30 p-4 sm:p-5">
      <p className="eyebrow flex items-center gap-1.5"><Sparkles className="size-3.5 text-gold" aria-hidden />{t("hg.eyebrow")}</p>
      <h2 id="hoi-gi-tieu-de" className="mt-1 text-lg font-medium text-fg sm:text-xl">{t("hg.tieu_de")}</h2>
      <p className="mt-0.5 text-xs text-fg-muted">{t("hg.mo_ta")}</p>

      {/* Điện thoại: lưới 2 cột nút ngắn (chỉ tiêu đề); từ sm: 3×2 kèm một dòng mô tả. */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={t("hg.nhom_aria")}>
        {danhMuc.cau_hoi.map((c) => {
          const bat = c.ma === chon;
          return (
            <button key={c.ma} type="button" aria-pressed={bat} data-testid={`hoi-gi-cau-${c.ma}`} onClick={() => chonCau(c.ma)}
              className={cn("flex min-h-11 min-w-0 flex-col items-start justify-center gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors motion-reduce:transition-none",
                bat ? "border-gold bg-gold/12 text-fg ring-1 ring-gold/50" : "border-line/70 bg-bg/40 text-fg-muted hover:border-gold/50 hover:text-fg")}>
              <span className="text-[0.8rem] font-medium leading-snug text-fg sm:text-sm">{c.tieu_de}</span>
              <span className="hidden text-[0.72rem] leading-snug text-fg-faint sm:block">{c.mo_ta}</span>
            </button>
          );
        })}
      </div>

      {chon && (
        <TenHienProvider ten={[hienKq?.ten_hien]}>
          <div className="mt-4 space-y-3 rounded-xl border border-line/80 bg-bg/50 p-4" data-testid="hoi-gi-ket-qua" data-ma={chon}
            data-rieng={hienKq ? (hienKq.rieng ? "1" : "0") : undefined} aria-busy={dang}>
            {/* Vùng đọc tự động chỉ bọc câu kết quả. */}
            <div aria-live="polite" className="space-y-2">
              {hienKq ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className={cn("rounded-full border px-2 py-0.5", hienKq.rieng ? "border-gold/50 text-gold" : "border-line text-fg-faint")}>
                      {hienKq.rieng ? t("hg.rieng") : t("hg.chung")}
                    </span>
                    {hienKq.muc && (
                      <span className="chip-muc rounded-full border px-2 py-0.5 first-letter:uppercase" data-muc={hienKq.muc} data-testid="hoi-gi-muc">
                        {t(hienKq.muc === "can_chu_dong" ? "sd.luu_y" : `sd.${hienKq.muc}`)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-fg" data-testid="hoi-gi-tra-loi">{hienKq.tra_loi}</p>
                </>
              ) : loi ? (
                <p className="text-sm text-fg-muted" data-testid="hoi-gi-loi">{t("hg.loi")}</p>
              ) : (
                <p className="text-sm text-fg-faint">{t("hg.dang")}</p>
              )}
            </div>
            {loi && !hienKq && (
              <Button type="button" size="sm" variant="secondary" onClick={() => setLan((n) => n + 1)}>{t("hg.thu_lai")}</Button>
            )}

            {hienKq && (
              <>
                {hienKq.y.length > 0 && (
                  <ul className="space-y-1 text-sm text-fg-muted" data-testid="hoi-gi-y">
                    {hienKq.y.map((y, i) => <li key={`${y.nhan}-${i}`}>{y.noi_dung}</li>)}
                  </ul>
                )}

                {hienKq.luoi_nam && <LuoiNamKhoi luoi={hienKq.luoi_nam} />}
                {hienKq.hai_nguoi && <HaiNguoiKhoi hai={hienKq.hai_nguoi} />}

                {(thieu.has("huong") || thieu.has("sinh")) && (
                  <div className="space-y-2 rounded-lg border border-moon/40 bg-moon/10 px-3 py-2.5 text-xs text-fg" data-testid="hoi-gi-thieu">
                    <p className="font-medium">{t("hg.can_them")}</p>
                    <ul className="space-y-2">
                      {hienKq.thieu.filter((x) => x.ma === "huong" || x.ma === "sinh").map((x) => (
                        <li key={x.ma} className="flex flex-wrap items-center justify-between gap-2">
                          <span className="min-w-0 flex-1 basis-44 text-fg-muted">{x.loi}</span>
                          <Button type="button" size="sm" variant="secondary" data-testid={`hoi-gi-thieu-${x.ma}`}
                            onClick={() => (x.ma === "huong" ? diToi("do-huong") : cuonToi("menh-quai"))}>
                            {x.ma === "huong" ? t("hg.di_do") : t("hg.them_sinh")}
                            <ArrowDown className="ml-1 size-3.5" aria-hidden />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {chon === "gia_dinh" && sinh && (thieu.has("nguoi_2") || hienKq.hai_nguoi) && (
                  <Nguoi2Khoi thanhVien={thanhVien ?? []} hienTai={nguoi2} onChon={setNguoi2Chon} />
                )}

                {hienKq.hoi_nhanh && hienKq.hoi_nhanh.length > 0 && (
                  <HoiNhanhKhoi ds={hienKq.hoi_nhanh} giaTri={(ma, mayChu) => daTraLoi(nha, ma) ?? mayChu} onTraLoi={traLoiNhanh} />
                )}

                {diem.length > 0 && (
                  <div className="space-y-1.5" data-testid="hoi-gi-diem">
                    <p className="text-xs font-medium text-gold">{t("hg.diem")}</p>
                    <ul className="space-y-1.5">
                      {diem.map((d) => (
                        <li key={d.ma} className="rounded-lg border border-line/60 bg-surface/40 px-3 py-2 text-sm">
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-fg">
                            {d.tieu_de}
                            {d.nen_xu_ly_truoc && <span className="rounded-full border border-gold/60 px-1.5 py-0.5 text-[10px] font-medium text-gold">{t("hg.nen_truoc")}</span>}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-fg-muted">{d.giai_thich}</p>
                          {d.trang?.startsWith("/") && (
                            <Lien href={duong(d.trang)} className="mt-1 inline-flex min-h-9 items-center gap-1 text-xs text-gold hover:underline">
                              {t("hg.doc_ky")} <ArrowRight className="size-3" aria-hidden />
                            </Lien>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hienKq.viec.length > 0 && (
                  <div className="space-y-1.5 text-xs" data-testid="hoi-gi-viec">
                    <p className="font-medium text-gold">{t("hg.viec")}</p>
                    <ul className="list-disc space-y-1 pl-4 text-sm text-fg-muted">
                      {hienKq.viec.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>
                )}

                <details className="rounded-lg border border-line/60 bg-surface/40 p-3 text-xs" data-testid="hoi-gi-vi-sao">
                  <summary className="flex min-h-9 cursor-pointer items-center font-medium text-fg">{t("hg.vi_sao")}</summary>
                  <ul className="mt-2 space-y-1.5 leading-relaxed text-fg-muted">
                    {hienKq.vi_sao.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                  {hienKq.nguon && (
                    <p className="mt-2 border-l-2 border-gold/60 pl-2 text-[0.72rem] text-fg-faint"><b className="text-fg-muted">{t("hg.nguon")}</b> {hienKq.nguon}</p>
                  )}
                </details>

                <div className="flex flex-wrap items-center gap-2 pt-1" role="group" aria-label={t("hg.xem_them")} data-testid="hoi-gi-lien-ket">
                  {lienKet.map((l) => (l.duong ? (
                    <Lien key={l.duong} href={duong(l.duong)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface/60 px-3 text-xs font-medium text-fg hover:border-gold/50">
                      {l.nhan} <ArrowRight className="size-3" aria-hidden />
                    </Lien>
                  ) : (
                    <button key={l.neo} type="button" data-testid={`hoi-gi-neo-${l.neo}`} onClick={() => diToi(l.neo!)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface/60 px-3 text-xs font-medium text-fg hover:border-gold/50">
                      {l.nhan} <ArrowDown className="size-3" aria-hidden />
                    </button>
                  )))}
                  {onHoiTiep && (
                    <Button type="button" size="sm" variant="ghost" data-testid="hoi-gi-hoi-tiep" onClick={() => onHoiTiep(hienKq.cau_chat)}>
                      <MessageSquare className="mr-1.5 size-3.5" aria-hidden />{t("hg.hoi_tiep")}
                    </Button>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-fg-faint">{hienKq.luu_y}</p>
              </>
            )}
          </div>
        </TenHienProvider>
      )}
    </section>
  );
}
