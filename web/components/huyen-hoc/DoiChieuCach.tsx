"use client";
// BT-DC — "Cách nào đúng với bạn?": Bát tự luôn đọc theo HAI cách lấy dụng thần và không tự chọn. Engine hỏi lại vài
// năm / giai đoạn đã qua mà hai cách nói khác nhau; người dùng tự kể năm đó ra sao, mỗi câu trả lời lật ra "mỗi cách đã
// nói gì". Đủ câu → lời kết luận (engine soạn) + người dùng có thể chọn một cách làm chính (chỉ đổi chỗ nhấn trong báo
// cáo, không đổi phép tính). Câu trả lời và lựa chọn chỉ lưu trên máy; PostHog chỉ nhận số câu khớp + mã cách cục.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, RotateCcw, Scale } from "lucide-react";
import { ChipMuc } from "@/components/luan-giai/BaoCaoDoiSong";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { usePost } from "@/lib/goi-api";
import { docLa, ghiLa, ketQua, khoaLaSo, useCachChinh, type Cach, type DoiChieuCach as DC, type TraLoi } from "@/lib/cach-chinh-battu";
import { cn } from "@/lib/utils";

type LaSo = { birth_date: string; birth_time: string; gender: "nam" | "nu" } & Record<string, unknown>;

export function DoiChieuCach({ laSo }: { laSo: LaSo }) {
  const { data } = usePost<DC>("/api/battu/doi-chieu-cach", { la_so: laSo });
  const khoa = khoaLaSo(laSo);
  const chinh = useCachChinh(khoa);
  const [traLoi, setTraLoi] = useState<Record<string, TraLoi>>({});
  const giam = useReducedMotion();
  useEffect(() => { setTraLoi(docLa(khoa).tra_loi); }, [khoa]);

  const kq = useMemo(() => (data?.co_cau_hoi ? ketQua(data, traLoi) : null), [data, traLoi]);
  const dangHoi = data?.cau.find((c) => !traLoi[c.ma]);
  const daXong = data ? data.cau.filter((c) => traLoi[c.ma]) : [];

  if (!data || !khoa) return null;
  if (!data.co_cau_hoi) {
    return data.loi_ly_do ? (
      <p className="rounded-2xl border border-line/70 px-4 py-3 text-sm text-fg-muted" data-testid="doi-chieu-cach">
        <Scale className="mr-1.5 inline size-4 text-moon" aria-hidden />{data.loi_ly_do}
      </p>
    ) : null;
  }

  const tra = (ma: string, t: TraLoi) => {
    const moi = { ...traLoi, [ma]: t };
    setTraLoi(moi);
    ghiLa(khoa, { tra_loi: moi, ...(chinh ? { chinh } : {}) });
    const r = ketQua(data, moi);
    if (r.ma && !data.cau.some((c) => !moi[c.ma])) {
      ghi("chart_interacted", { kind: "battu_doi_chieu", ket_qua: r.ma, cach_cuc: data.cach_cuc, than: data.than,
        so_cau: r.so_cau, khop_1: r.khop_1, khop_2: r.khop_2 });
    }
  };
  const chon = (c: Cach | undefined) => {
    ghiLa(khoa, { tra_loi: traLoi, ...(c ? { chinh: c } : {}) });
    ghi("chart_interacted", { kind: "battu_cach_chinh", ket_qua: c ?? "bo_chon", cach_cuc: data.cach_cuc });
  };
  const lamLai = () => { setTraLoi({}); ghiLa(khoa, { tra_loi: {}, ...(chinh ? { chinh } : {}) }); };
  const nghieng: Cach | null = kq?.ma === "cach_1" || kq?.ma === "nghieng_1" ? "cach_1"
    : kq?.ma === "cach_2" || kq?.ma === "nghieng_2" ? "cach_2" : null;
  const nhanTL = (t: TraLoi) => data.lua_chon.find((x) => x.ma === t)?.nhan ?? t;

  return (
    <section aria-labelledby="dc-tieu-de" data-testid="doi-chieu-cach"
      className="rounded-3xl border border-moon/30 bg-gradient-to-b from-moon/[0.07] to-transparent p-5 sm:p-6">
      <h2 id="dc-tieu-de" className="flex items-center gap-2 font-serif text-2xl">
        <Scale className="size-6 text-moon" aria-hidden /> Cách nào đúng với bạn?
      </h2>
      <p className="mt-2 text-fg-muted">
        Bát tự có hai cách đọc, đôi khi nói khác nhau. Bạn là người biết rõ nhất những năm đã qua — kể lại vài năm, xem cách
        nào khớp với đời bạn hơn.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(["cach_1", "cach_2"] as const).map((c, i) => (
          <div key={c} className={cn("rounded-2xl border px-4 py-3", chinh === c ? "border-gold/70 bg-gold/[0.06]" : "border-line/70")}
            data-testid={`dc-${c}`}>
            <p className="flex items-center gap-2 font-medium text-fg">
              <span className={cn("inline-block size-2.5 rounded-full", i ? "border-2 border-moon" : "bg-moon")} aria-hidden />
              {data.cach[c].ten}
              {chinh === c && <span className="rounded-full bg-gold px-2 py-0.5 text-[0.7rem] font-semibold text-[#1a1406]">cách chính của bạn</span>}
            </p>
            <p className="mt-1 text-sm text-fg-muted">{data.cach[c].mo_ta}</p>
          </div>
        ))}
      </div>

      <ol className="mt-5 flex gap-1.5" aria-label="Tiến độ">
        {data.cau.map((c) => (
          <li key={c.ma} className={cn("h-1.5 flex-1 rounded-full", traLoi[c.ma] ? "bg-moon" : c === dangHoi ? "bg-moon/40" : "bg-line")} />
        ))}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        {dangHoi && (
          <motion.div key={dangHoi.ma} className="mt-4" data-testid="dc-cau"
            initial={giam ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={giam ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}>
            <p className="text-lg text-fg">{dangHoi.hoi}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.lua_chon.map((x) => (
                <Button key={x.ma} type="button" size="sm" variant={x.ma === "khong_nho" ? "ghost" : "outline"}
                  onClick={() => tra(dangHoi.ma, x.ma)}>{x.nhan}</Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {daXong.length > 0 && (
        <ul className="mt-5 space-y-2" aria-label="Những năm bạn đã kể">
          {daXong.map((c) => {
            const t = traLoi[c.ma] ?? "khong_nho";
            return (
              <li key={c.ma} className="rounded-2xl border border-line/70 px-4 py-2.5 text-sm" data-testid="dc-da-tra-loi">
                <p className="text-fg"><b>{c.nhan}</b>: bạn kể “{nhanTL(t).toLowerCase()}”</p>
                {t !== "khong_nho" && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-fg-muted">
                    {(["cach_1", "cach_2"] as const).map((k) => (
                      <span key={k} className="inline-flex items-center gap-1.5">
                        {data.cach[k].ten}: <ChipMuc muc={c[k]} className="px-2 py-0 text-[0.7rem]" />
                        {t === c[k] && <Check className="size-4 text-moon" aria-label="khớp" />}
                      </span>
                    ))}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {kq?.ma && (
        <motion.div className="mt-5 rounded-2xl border border-gold/50 bg-gold/[0.06] px-4 py-3" data-testid="dc-ket-luan"
          initial={giam ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <p className="text-sm text-fg-faint">
            Khớp: {data.cach.cach_1.ten} {kq.khop_1}/{kq.so_cau} · {data.cach.cach_2.ten} {kq.khop_2}/{kq.so_cau}
          </p>
          <p className="mt-1 text-fg">{data.ket_luan[kq.ma]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {nghieng && chinh !== nghieng && (
              <Button type="button" size="sm" onClick={() => chon(nghieng)}>Dùng {data.cach[nghieng].ten.toLowerCase()} làm cách chính</Button>
            )}
            {chinh && <Button type="button" size="sm" variant="ghost" onClick={() => chon(undefined)}>Bỏ chọn cách chính</Button>}
            <Button type="button" size="sm" variant="ghost" onClick={lamLai}><RotateCcw className="mr-1 size-3.5" aria-hidden />Kể lại</Button>
          </div>
          <p className="mt-2 text-xs text-fg-faint">
            Chọn cách chính chỉ đổi chỗ nhấn khi hai cách nói khác nhau trong bài luận giải; phép tính và cả hai cách vẫn
            hiện đủ. Câu trả lời chỉ lưu trên máy bạn.
          </p>
        </motion.div>
      )}
    </section>
  );
}
