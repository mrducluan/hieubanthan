"use client";
// VZ-2 — thẻ chi tiết cung đang chọn trên lá số: đủ mọi sao (kể cả tạp diệu bị gọn trên lá số),
// độ sáng viết đầy đủ, tam phương tứ chính, Tuần/Triệt, lớp vận hạn; nút đẩy câu hỏi xuống khung hỏi đáp.
// TV-HOA-HAN: chạm một sao → thẻ nhỏ ngay dưới: độ sáng, hoá năm sinh, hoá theo đại hạn / năm xem (engine `tu_hoa_sao`),
// "Đọc kỹ" sang trang "sao ở cung" (slug engine dựng) và "Hỏi về sao này" (chỉ ĐIỀN SẴN câu vào khung hỏi đáp, không gửi).
import { Fragment, useState } from "react";
import { BookOpen, MessageCircleQuestion } from "lucide-react";
import type { LaSoOutputT, VanHanOutputT } from "@/app/api/tuvi/schema";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { useChu } from "@/components/cms/DauCms";
import Lien from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { duongTrangKb } from "@/lib/duong-silo";
import { cn } from "@/lib/utils";
import { tenThaiTue, type PhaiDoSang } from "@/components/huyen-hoc/LaSoTuVi";
import { MAU_HOA_HAN } from "@/components/huyen-hoc/HanLaSo";
import { AN_TAP_DIEU, DO_SANG_DAY, HANH_SAO, TEN_HOA_MA, nhomSao, tamPhuong, type NhomSao } from "@/lib/tuvi-hien-thi";

const MAU_HANH: Record<string, string> = {
  "Kim": "text-fg", "Mộc": "text-jade", "Thủy": "text-[rgb(126_172_255)]", "Hỏa": "text-cinnabar", "Thổ": "text-gold",
};
const MAU_HOA: Record<string, string> = {
  "Lộc": "bg-jade/15 text-jade", "Quyền": "bg-cinnabar/15 text-cinnabar", "Khoa": "bg-[rgb(126_172_255)]/15 text-[rgb(126_172_255)]", "Kỵ": "bg-fg/10 text-fg",
};
const TEN_NHOM: Record<NhomSao, string> = { cat: "Cát tinh", sat: "Sát tinh", dao_hoa: "Đào hoa", trung: "Sao khác" };
const MAU_NHOM: Record<NhomSao, string> = { cat: "text-gold", sat: "text-cinnabar", dao_hoa: "text-[rgb(244_154_193)]", trung: "text-fg-muted" };

/** Một sao trong thẻ chi tiết: tên hiển thị + dữ liệu engine để mở thẻ sao. */
interface MucSao { ten: string; hien: string; doSang: string | null; nguonDoSang?: string; tuHoa: string | null; trang?: string | null }

const nguon = (s: { do_sang_nam_phai?: string | null; do_sang: string | null }) =>
  s.do_sang_nam_phai ? "Nam phái" : s.do_sang ? "phái Trung" : undefined;

export function ChiTietCung({ ls, chi, vanHan, hanSao, lop, onHoi, onDienCau, phai = "nam", moDun = "tuvi" }: {
  ls: LaSoOutputT; chi: string; vanHan?: VanHanOutputT | null; onHoi: (cau: string) => void; phai?: PhaiDoSang;
  /** Lớp hạn đang bật trên lá số — dòng vòng sao theo hạn chỉ hiện cho lớp đang bật. */ lop?: { dai_han: boolean; luu_nien: boolean };
  /** Vận hạn của năm xem cho thẻ sao (kể cả khi lớp hạn đang tắt trên lá số). */ hanSao?: VanHanOutputT | null;
  /** Điền sẵn câu vào khung hỏi đáp (không gửi). Không có → dùng onHoi. */ onDienCau?: (cau: string) => void;
  moDun?: string;
}) {
  const [saoChon, setSaoChon] = useState<{ chi: string; ten: string } | null>(null);
  const i = ls.cung.findIndex((c) => c.chi === chi);
  const c = ls.cung[i];
  if (!c) return null;
  const tp = tamPhuong(chi);
  const tenTai = (x: string) => ls.cung.find((k) => k.chi === x)?.ten ?? x;
  const nhom: Record<NhomSao, MucSao[]> = { cat: [], sat: [], dao_hoa: [], trung: [] };
  for (const s of c.phu_tinh) {
    const ds = s.do_sang_nam_phai ?? s.do_sang;      // ưu tiên lối Việt (TV-NP2)
    nhom[nhomSao(s.ten, s.loai)].push({ ten: s.ten, hien: ds ? `${s.ten} (${DO_SANG_DAY[ds] ?? ds})` : s.ten, doSang: ds,
      tuHoa: s.tu_hoa, nguonDoSang: nguon(s) });
  }
  const daCo = new Set(c.phu_tinh.map((s) => s.ten));
  for (const t of [c.bac_si, c.tue_tien, c.tuong_tien, ...c.tap_dieu.filter((t) => !AN_TAP_DIEU.has(t))]) {
    if (daCo.has(t)) continue;
    daCo.add(t);
    const ds = c.do_sang_phu?.[t];
    const hien = t === c.tue_tien ? tenThaiTue(c, phai) : t;
    nhom[nhomSao(t)].push({ ten: hien, hien: ds ? `${hien} (${DO_SANG_DAY[ds] ?? ds})` : hien, doSang: ds ?? null, tuHoa: null,
      nguonDoSang: ds ? "Nam phái" : undefined });
  }
  const tt = [ls.tuan_triet?.tuan.includes(chi) && "Tuần", ls.tuan_triet?.triet.includes(chi) && "Triệt"].filter(Boolean);
  const hoaCung = [...c.chinh_tinh, ...c.phu_tinh].filter((s) => s.tu_hoa);
  const chonTen = saoChon?.chi === chi ? saoChon.ten : null;
  const chonSao = (ten: string) => {
    const mo = chonTen !== ten;
    setSaoChon(mo ? { chi, ten } : null);
    if (mo) ghi("chart_interacted", { mo_dun: moDun, kind: "chon_sao" });
  };
  const han = hanSao ?? vanHan;
  const theSao = (m: MucSao) => (
    <TheSao m={m} cung={c.ten} han={han}
      onHoi={() => { ghi("chart_interacted", { mo_dun: moDun, kind: "hoi_sao" }); (onDienCau ?? onHoi)(`Sao ${m.ten} ở cung ${c.ten} của tôi nói gì?`); }} />
  );

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
      <p className="mt-2 text-xs text-fg-faint">Chạm tên một sao để xem độ sáng, hoá theo hạn và đọc kỹ.</p>

      <div className="mt-4 grid gap-5 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow mb-2">Chính tinh</p>
          {c.chinh_tinh.length ? (
            <ul className="space-y-3">
              {c.chinh_tinh.map((s) => (
                <li key={s.ten} className="flex flex-wrap items-baseline gap-2">
                  <button type="button" aria-expanded={chonTen === s.ten} onClick={() => chonSao(s.ten)} data-testid="chon-sao"
                    className={cn("rounded-md font-serif text-xl underline decoration-dotted decoration-1 underline-offset-4 hover:decoration-solid",
                      MAU_HANH[HANH_SAO[s.ten] ?? "Thổ"])}>{s.ten}</button>
                  {s.do_sang_nam_phai && <span className="text-sm text-fg-faint">{DO_SANG_DAY[s.do_sang_nam_phai] ?? s.do_sang_nam_phai} <span className="text-xs">(Nam phái)</span></span>}
                  {s.do_sang && s.do_sang !== s.do_sang_nam_phai && <span className="text-xs text-fg-faint">· {DO_SANG_DAY[s.do_sang] ?? s.do_sang} (phái Trung)</span>}
                  <span className="text-xs text-fg-faint">hành {HANH_SAO[s.ten]}</span>
                  {chonTen === s.ten && theSao({
                    ten: s.ten, hien: s.ten, doSang: s.do_sang_nam_phai ?? s.do_sang, tuHoa: s.tu_hoa, trang: s.trang_sao_cung,
                    nguonDoSang: nguon(s),
                  })}
                  {s.giai_nghia && (
                    <div className="w-full text-sm leading-relaxed text-fg-muted" data-testid="giai-nghia-sao">
                      <p>{s.giai_nghia.thuong_thay}</p>
                      {s.giai_nghia.nen_lam && <p className="mt-1"><span className="text-jade">Nên làm:</span> {s.giai_nghia.nen_lam}</p>}
                      <ViSao canCu={s.giai_nghia.can_cu} nho />
                    </div>
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
                {lop && <VongHan vh={vanHan} i={i} lop={lop} phai={phai} />}
              </>
            )}
          </dl>
        </div>
        <div className="space-y-3">
          {(Object.keys(TEN_NHOM) as NhomSao[]).filter((k) => nhom[k].length).map((k) => {
            const mo = nhom[k].find((m) => m.ten === chonTen);
            return (
              <div key={k}>
                <p className="eyebrow mb-1">{TEN_NHOM[k]}</p>
                <p className={cn("text-sm leading-relaxed", MAU_NHOM[k])}>
                  {nhom[k].map((m, j) => (
                    <span key={m.ten}>
                      {j > 0 && <span aria-hidden> · </span>}
                      <button type="button" aria-expanded={chonTen === m.ten} onClick={() => chonSao(m.ten)}
                        className="rounded underline decoration-dotted decoration-1 underline-offset-[3px] hover:decoration-solid">{m.hien}</button>
                    </span>
                  ))}
                </p>
                {mo && <div className="mt-2">{theSao(mo)}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** TV-VONG — vòng Thái Tuế + vòng Tướng tiền của lớp hạn đang bật tại cung này (engine trả 12 tên theo mảng cung, 0 = Dần).
 *  Tên vòng Thái Tuế theo phái đang chọn như vòng gốc (tenThaiTue). Chỉ hiển thị — không đổi mức nào. */
function VongHan({ vh, i, lop, phai }: { vh: VanHanOutputT; i: number; lop: { dai_han: boolean; luu_nien: boolean }; phai: PhaiDoSang }) {
  const c = useChu();
  const ten = (l: VanHanOutputT["dai_han"] | VanHanOutputT["luu_nien"]) => {
    const tue = l.vong_thai_tue?.[i];
    if (!tue) return null;
    const tueHien = tenThaiTue({ tue_tien: tue, thai_tue_nam_phai: l.vong_thai_tue_nam_phai?.[i] }, phai);
    return [tueHien, l.vong_tuong_tien?.[i]].filter(Boolean).join(" · ");
  };
  const dong = [
    lop.dai_han && { ma: "dh", nhan: c("vong_han.dai_han"), chu: ten(vh.dai_han) },
    lop.luu_nien && { ma: "ln", nhan: c("vong_han.nam", { nam: String(vh.nam_xem) }), chu: ten(vh.luu_nien) },
  ].filter((d): d is { ma: string; nhan: string; chu: string } => Boolean(d && d.chu));
  if (!dong.length) return null;
  return (
    <>
      {dong.map((d) => (
        <Fragment key={d.ma}>
          <dt className="text-fg-faint">{d.nhan}</dt><dd data-testid="vong-han" data-lop={d.ma}>{d.chu}</dd>
        </Fragment>
      ))}
      <dd className="col-span-2 -mt-1"><ViSao canCu={[c("vong_han.giai_thich")]} nho /></dd>
    </>
  );
}

/** Thẻ một sao: độ sáng · hoá năm sinh · hoá theo đại hạn / năm xem · Đọc kỹ · Hỏi về sao này. Chỉ hiện dữ liệu engine. */
function TheSao({ m, cung, han, onHoi }: { m: MucSao; cung: string; han?: VanHanOutputT | null; onHoi: () => void }) {
  const theoHan = han ? [
    ...(han.dai_han.tu_hoa_sao ?? []).filter((x) => x.sao === m.ten)
      .map((x) => ({ hoa: x.hoa, nhan: `${han.dai_han.dong_han ? "Đồng hạn" : "Đại hạn"} ${han.dai_han.tu_tuoi}–${han.dai_han.den_tuoi} tuổi` })),
    ...(han.luu_nien.tu_hoa_sao ?? []).filter((x) => x.sao === m.ten)
      .map((x) => ({ hoa: x.hoa, nhan: `Năm ${han.nam_xem}` })),
  ] : [];
  const coHan = Boolean(han?.dai_han.tu_hoa_sao);
  const duong = m.trang ? duongTrangKb("sao_cung", m.trang) : null;
  return (
    <div className="w-full rounded-xl border border-line/70 bg-surface/50 p-3.5 text-sm text-fg-muted" data-testid="the-sao"
      role="group" aria-label={`Sao ${m.ten} ở cung ${cung}`}>
      <p className="font-semibold text-fg">{m.ten} <span className="font-normal text-fg-faint">ở cung {cung}</span></p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-fg-faint">Độ sáng</dt>
        <dd>{m.doSang
          ? <>{DO_SANG_DAY[m.doSang] ?? m.doSang}{m.nguonDoSang && <span className="text-xs text-fg-faint"> ({m.nguonDoSang})</span>}</>
          : <span className="text-fg-faint">sách không xếp độ sáng sao này ở cung này</span>}</dd>
        <dt className="text-fg-faint">Năm sinh</dt>
        <dd>{m.tuHoa ? <span className="font-semibold text-fg">hoá {m.tuHoa}</span> : <span className="text-fg-faint">không hoá</span>}</dd>
        {coHan && han && (
          <>
            <dt className="text-fg-faint">Theo hạn</dt>
            <dd className="flex flex-wrap gap-1.5" data-testid="the-sao-han">
              {theoHan.length ? theoHan.map((h) => (
                <span key={h.nhan} className={cn("rounded-full border border-dashed px-2 py-0.5 text-xs font-semibold", MAU_HOA_HAN[h.hoa])}>
                  {h.nhan}: hoá {TEN_HOA_MA[h.hoa]}
                </span>
              )) : <span className="text-fg-faint">đại hạn và năm {han.nam_xem} không hoá sao này</span>}
            </dd>
          </>
        )}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        {duong && (
          <Button asChild variant="ghost" size="sm" className="min-h-10">
            <Lien href={duong} data-testid="doc-ky-sao"><BookOpen aria-hidden /> Đọc kỹ</Lien>
          </Button>
        )}
        <Button variant="secondary" size="sm" className="min-h-10" onClick={onHoi} data-testid="hoi-sao">
          <MessageCircleQuestion aria-hidden /> Hỏi về sao này
        </Button>
      </div>
    </div>
  );
}
