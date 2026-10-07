"use client";
// VZ-2 — thẻ chi tiết cung đang chọn trên lá số: đủ mọi sao (kể cả tạp diệu bị gọn trên lá số),
// độ sáng viết đầy đủ, tam phương tứ chính, Tuần/Triệt, lớp vận hạn; nút đẩy câu hỏi xuống khung hỏi đáp.
import { MessageCircleQuestion } from "lucide-react";
import type { LaSoOutputT, VanHanOutputT } from "@/app/api/tuvi/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tenThaiTue, type PhaiDoSang } from "@/components/huyen-hoc/LaSoTuVi";
import { AN_TAP_DIEU, DO_SANG_DAY, HANH_SAO, nhomSao, tamPhuong, type NhomSao } from "@/lib/tuvi-hien-thi";

const MAU_HANH: Record<string, string> = {
  "Kim": "text-fg", "Mộc": "text-jade", "Thủy": "text-[rgb(126_172_255)]", "Hỏa": "text-cinnabar", "Thổ": "text-gold",
};
const MAU_HOA: Record<string, string> = {
  "Lộc": "bg-jade/15 text-jade", "Quyền": "bg-cinnabar/15 text-cinnabar", "Khoa": "bg-[rgb(126_172_255)]/15 text-[rgb(126_172_255)]", "Kỵ": "bg-fg/10 text-fg",
};
const TEN_NHOM: Record<NhomSao, string> = { cat: "Cát tinh", sat: "Sát tinh", dao_hoa: "Đào hoa", trung: "Sao khác" };
const MAU_NHOM: Record<NhomSao, string> = { cat: "text-gold", sat: "text-cinnabar", dao_hoa: "text-[rgb(244_154_193)]", trung: "text-fg-muted" };

export function ChiTietCung({ ls, chi, vanHan, onHoi, phai = "nam" }: {
  ls: LaSoOutputT; chi: string; vanHan?: VanHanOutputT | null; onHoi: (cau: string) => void; phai?: PhaiDoSang;
}) {
  const i = ls.cung.findIndex((c) => c.chi === chi);
  const c = ls.cung[i];
  if (!c) return null;
  const tp = tamPhuong(chi);
  const tenTai = (x: string) => ls.cung.find((k) => k.chi === x)?.ten ?? x;
  const nhom: Record<NhomSao, string[]> = { cat: [], sat: [], dao_hoa: [], trung: [] };
  for (const s of c.phu_tinh) {
    const ds = s.do_sang_nam_phai ?? s.do_sang;      // ưu tiên lối Việt (TV-NP2)
    nhom[nhomSao(s.ten, s.loai)].push(ds ? `${s.ten} (${DO_SANG_DAY[ds] ?? ds})` : s.ten);
  }
  const daCo = new Set(c.phu_tinh.map((s) => s.ten));
  for (const t of [c.bac_si, c.tue_tien, c.tuong_tien, ...c.tap_dieu.filter((t) => !AN_TAP_DIEU.has(t))]) {
    if (daCo.has(t)) continue;
    daCo.add(t);
    const ds = c.do_sang_phu?.[t];
    const hien = t === c.tue_tien ? tenThaiTue(c, phai) : t;
    nhom[nhomSao(t)].push(ds ? `${hien} (${DO_SANG_DAY[ds] ?? ds})` : hien);
  }
  const tt = [ls.tuan_triet?.tuan.includes(chi) && "Tuần", ls.tuan_triet?.triet.includes(chi) && "Triệt"].filter(Boolean);
  const hoaCung = [...c.chinh_tinh, ...c.phu_tinh].filter((s) => s.tu_hoa);

  return (
    <section aria-labelledby="ten-cung-chon" className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{c.can} {c.chi} · đại hạn {c.dai_han.tu_tuoi}–{c.dai_han.den_tuoi} tuổi</p>
          <h2 id="ten-cung-chon" className="mt-1 text-2xl sm:text-3xl">
            Cung {c.ten}{c.la_than ? <span className="ml-2 align-middle text-sm text-moon">· Thân cư</span> : null}
          </h2>
        </div>
        <Button variant="secondary" onClick={() => onHoi(`Cung ${c.ten} của tôi nói gì?`)}>
          <MessageCircleQuestion aria-hidden /> Hỏi về cung này
        </Button>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow mb-2">Chính tinh</p>
          {c.chinh_tinh.length ? (
            <ul className="space-y-3">
              {c.chinh_tinh.map((s) => (
                <li key={s.ten} className="flex flex-wrap items-baseline gap-2">
                  <span className={cn("font-serif text-xl", MAU_HANH[HANH_SAO[s.ten] ?? "Thổ"])}>{s.ten}</span>
                  {s.do_sang_nam_phai && <span className="text-sm text-fg-faint">{DO_SANG_DAY[s.do_sang_nam_phai] ?? s.do_sang_nam_phai} <span className="text-xs">(Nam phái)</span></span>}
                  {s.do_sang && s.do_sang !== s.do_sang_nam_phai && <span className="text-xs text-fg-faint">· {DO_SANG_DAY[s.do_sang] ?? s.do_sang} (phái Trung)</span>}
                  <span className="text-xs text-fg-faint">hành {HANH_SAO[s.ten]}</span>
                  {s.giai_nghia && (
                    <span className="block w-full text-sm leading-relaxed text-fg-muted" data-testid="giai-nghia-sao">
                      {s.giai_nghia.tinh_chat}{s.giai_nghia.sac_thai && <> {s.giai_nghia.sac_thai}</>}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm italic text-fg-faint">Vô chính diệu — mượn sao cung xung chiếu ({tenTai(tp.xung)}) khi luận.</p>}
          {hoaCung.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hoaCung.map((s) => (
                <span key={s.ten} className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", MAU_HOA[s.tu_hoa!])}>{s.ten} hoá {s.tu_hoa}</span>
              ))}
            </div>
          )}
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-fg-faint">Tam hợp</dt><dd>{tp.tam_hop.map(tenTai).join(" · ")}</dd>
            <dt className="text-fg-faint">Xung chiếu</dt><dd>{tenTai(tp.xung)}</dd>
            <dt className="text-fg-faint">Trường sinh</dt><dd>{c.truong_sinh}</dd>
            {tt.length > 0 && (<><dt className="text-fg-faint">Không vong</dt><dd>{tt.join(", ")} đóng tại cung</dd></>)}
            <dt className="text-fg-faint">Tiểu hạn</dt><dd>tuổi {c.tieu_han_tuoi.slice(0, 6).join(", ")}…</dd>
            {vanHan && (
              <>
                <dt className="text-fg-faint">Năm {vanHan.nam_xem}</dt>
                <dd>
                  đại hạn coi là cung <b>{vanHan.dai_han.ten_cung[i]}</b>, lưu niên coi là cung <b>{vanHan.luu_nien.ten_cung[i]}</b>
                  {vanHan.luu_nien.sao[i]?.length ? <span className="text-moon"> · {vanHan.luu_nien.sao[i]!.join(", ")}</span> : null}
                </dd>
              </>
            )}
          </dl>
        </div>
        <div className="space-y-3">
          {(Object.keys(TEN_NHOM) as NhomSao[]).filter((k) => nhom[k].length).map((k) => (
            <div key={k}>
              <p className="eyebrow mb-1">{TEN_NHOM[k]}</p>
              <p className={cn("text-sm leading-relaxed", MAU_NHOM[k])}>{nhom[k].join(" · ")}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
