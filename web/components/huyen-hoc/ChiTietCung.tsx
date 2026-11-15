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
import { useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { banAnh } from "@/lib/duong-en";

const MAU_HANH: Record<string, string> = {
  "Kim": "text-fg", "Mộc": "text-jade", "Thủy": "text-[rgb(126_172_255)]", "Hỏa": "text-cinnabar", "Thổ": "text-gold",
};
const MAU_HOA: Record<string, string> = {
  "Lộc": "bg-jade/15 text-jade", "Quyền": "bg-cinnabar/15 text-cinnabar", "Khoa": "bg-[rgb(126_172_255)]/15 text-[rgb(126_172_255)]", "Kỵ": "bg-fg/10 text-fg",
};
const NHOM_THU_TU: NhomSao[] = ["cat", "sat", "dao_hoa", "trung"];   // tên nhóm: khoá ct.nhom.<mã> (lib/chu/tu-vi.ts)
const MAU_NHOM: Record<NhomSao, string> = { cat: "text-gold", sat: "text-cinnabar", dao_hoa: "text-[rgb(244_154_193)]", trung: "text-fg-muted" };

/** Một sao trong thẻ chi tiết: tên hiển thị + dữ liệu engine để mở thẻ sao. */
interface MucSao { ten: string; hien: string; doSang: string | null; nguonDoSang?: string; tuHoa: string | null; trang?: string | null; nghia?: string | null }

const nguon = (s: { do_sang_nam_phai?: string | null; do_sang: string | null }) =>
  s.do_sang_nam_phai ? "nam" : s.do_sang ? "trung" : undefined;   // mã nguồn độ sáng → chữ: ct.nam_phai / ct.phai_trung

export function ChiTietCung({ ls, chi, vanHan, hanSao, lop, onHoi, onDienCau, phai = "nam", moDun = "tuvi" }: {
  ls: LaSoOutputT; chi: string; vanHan?: VanHanOutputT | null; onHoi: (cau: string) => void; phai?: PhaiDoSang;
  /** Lớp hạn đang bật trên lá số — dòng vòng sao theo hạn chỉ hiện cho lớp đang bật. */ lop?: { dai_han: boolean; luu_nien: boolean };
  /** Vận hạn của năm xem cho thẻ sao (kể cả khi lớp hạn đang tắt trên lá số). */ hanSao?: VanHanOutputT | null;
  /** Điền sẵn câu vào khung hỏi đáp (không gửi). Không có → dùng onHoi. */ onDienCau?: (cau: string) => void;
  moDun?: string;
}) {
  const [saoChon, setSaoChon] = useState<{ chi: string; ten: string } | null>(null);
  const { c: t, ten: tn, en } = useChuTuVi();
  // Độ sáng đầy đủ: bản Việt bảng DO_SANG_DAY ("Miếu địa"…); bản Anh tên engine (ten_hien).
  const dsDay = (d: string) => (en ? tn("do_sang", d) : DO_SANG_DAY[d] ?? d);
  const i = ls.cung.findIndex((c) => c.chi === chi);
  const c = ls.cung[i];
  if (!c) return null;
  const tp = tamPhuong(chi);
  const tenTai = (x: string) => tn("cung", ls.cung.find((k) => k.chi === x)?.ten ?? x);
  const tenCung = tn("cung", c.ten);
  const nhom: Record<NhomSao, MucSao[]> = { cat: [], sat: [], dao_hoa: [], trung: [] };
  for (const s of c.phu_tinh) {
    const ds = s.do_sang_nam_phai ?? s.do_sang;      // ưu tiên lối Việt (TV-NP2)
    const tS = tn("sao", s.ten);
    nhom[nhomSao(s.ten, s.loai)].push({ ten: s.ten, hien: ds ? `${tS} (${dsDay(ds)})` : tS, doSang: ds,
      tuHoa: s.tu_hoa, nguonDoSang: nguon(s), nghia: c.nghia_sao_nho?.[s.ten]?.y_nghia ?? null });
  }
  const daCo = new Set(c.phu_tinh.map((s) => s.ten));
  for (const t of [c.bac_si, c.tue_tien, c.tuong_tien, ...c.tap_dieu.filter((t) => !AN_TAP_DIEU.has(t))]) {
    if (daCo.has(t)) continue;
    daCo.add(t);
    const ds = c.do_sang_phu?.[t];
    const hien = t === c.tue_tien ? tenThaiTue(c, phai) : t, hienTen = tn("sao", hien);
    nhom[nhomSao(t)].push({ ten: hien, hien: ds ? `${hienTen} (${dsDay(ds)})` : hienTen, doSang: ds ?? null, tuHoa: null,
      nguonDoSang: ds ? "nam" : undefined, nghia: c.nghia_sao_nho?.[hien]?.y_nghia ?? c.nghia_sao_nho?.[t]?.y_nghia ?? null });
  }
  const tt = [ls.tuan_triet?.tuan.includes(chi) && t("ls.tuan"), ls.tuan_triet?.triet.includes(chi) && t("ls.triet")].filter(Boolean);
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
      onHoi={() => { ghi("chart_interacted", { mo_dun: moDun, kind: "hoi_sao" }); (onDienCau ?? onHoi)(t("ct.cau_sao", { sao: tn("sao", m.ten), cung: tenCung })); }} />
  );

  return (
    <section aria-labelledby="ten-cung-chon" className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{tn("can", c.can)} {tn("chi", c.chi)}{t("ct.dau_1")}{c.dai_han.tu_tuoi}–{c.dai_han.den_tuoi}{t("ct.dau_2")}</p>
          <h2 id="ten-cung-chon" className="mt-1 text-2xl sm:text-3xl">
            {t("ct.cung_truoc")}{tenCung}{c.la_than ? <span className="ml-2 align-middle text-sm text-moon">{t("ct.than_cu")}</span> : null}
          </h2>
        </div>
        <Button variant="secondary" onClick={() => onHoi(t("ct.cau_cung", { cung: tenCung }))}>
          <MessageCircleQuestion aria-hidden />{` ${t("ct.hoi_cung")}`}
        </Button>
      </div>
      <p className="mt-2 text-xs text-fg-faint">{t("ct.cham")}</p>

      <div className="mt-4 grid gap-5 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow mb-2">{t("ct.chinh_tinh")}</p>
          {c.chinh_tinh.length ? (
            <ul className="space-y-3">
              {c.chinh_tinh.map((s) => (
                <li key={s.ten} className="flex flex-wrap items-baseline gap-2">
                  <button type="button" aria-expanded={chonTen === s.ten} onClick={() => chonSao(s.ten)} data-testid="chon-sao"
                    className={cn("rounded-md font-serif text-xl underline decoration-dotted decoration-1 underline-offset-4 hover:decoration-solid",
                      MAU_HANH[HANH_SAO[s.ten] ?? "Thổ"])}>{tn("sao", s.ten)}</button>
                  {s.do_sang_nam_phai && <span className="text-sm text-fg-faint">{dsDay(s.do_sang_nam_phai)} <span className="text-xs">{t("ct.nguon_nam")}</span></span>}
                  {s.do_sang && s.do_sang !== s.do_sang_nam_phai && <span className="text-xs text-fg-faint">· {dsDay(s.do_sang)}{t("ct.nguon_trung_sau")}</span>}
                  <span className="text-xs text-fg-faint">{t("ct.hanh_truoc")}{tn("hanh", HANH_SAO[s.ten])}</span>
                  {chonTen === s.ten && theSao({
                    ten: s.ten, hien: s.ten, doSang: s.do_sang_nam_phai ?? s.do_sang, tuHoa: s.tu_hoa, trang: s.trang_sao_cung,
                    nguonDoSang: nguon(s),
                  })}
                  {s.giai_nghia && (
                    <div className="w-full text-sm leading-relaxed text-fg-muted" data-testid="giai-nghia-sao">
                      <p>{s.giai_nghia.thuong_thay}</p>
                      {s.giai_nghia.nen_lam && <p className="mt-1"><span className="text-jade">{t("ct.nen_lam")}</span> {s.giai_nghia.nen_lam}</p>}
                      <ViSao canCu={s.giai_nghia.can_cu} nho />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm italic text-fg-faint">{t("ct.vo_chinh_dieu", { cung: tenTai(tp.xung) })}</p>}
          {hoaCung.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hoaCung.map((s) => (
                <span key={s.ten} className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", MAU_HOA[s.tu_hoa!])}>{t("ct.sao_hoa", { sao: tn("sao", s.ten), hoa: tn("hoa", s.tu_hoa!) })}</span>
              ))}
            </div>
          )}
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-fg-faint">{t("ct.tam_hop")}</dt><dd>{tp.tam_hop.map(tenTai).join(" · ")}</dd>
            <dt className="text-fg-faint">{t("ct.xung_chieu")}</dt><dd>{tenTai(tp.xung)}</dd>
            <dt className="text-fg-faint">{t("ct.truong_sinh")}</dt><dd>{tn("truong_sinh", c.truong_sinh)}{c.nghia_sao_nho?.[c.truong_sinh] && <span className="text-fg-faint" data-testid="nghia-truong-sinh"> — {c.nghia_sao_nho[c.truong_sinh]!.y_nghia}</span>}</dd>
            {tt.length > 0 && (<><dt className="text-fg-faint">{t("ct.khong_vong")}</dt><dd>{t("ct.dong_tai", { ds: tt.join(", ") })}</dd></>)}
            <dt className="text-fg-faint">{t("ct.tieu_han")}</dt><dd>{t("ct.tieu_han_truoc")}{c.tieu_han_tuoi.slice(0, 6).join(", ")}…</dd>
            {vanHan && (
              <>
                <dt className="text-fg-faint">{t("ct.nam", { nam: String(vanHan.nam_xem) })}</dt>
                <dd>
                  {t("ct.coi_la_1")}<b>{tn("cung", vanHan.dai_han.ten_cung[i])}</b>{t("ct.coi_la_2")}<b>{tn("cung", vanHan.luu_nien.ten_cung[i])}</b>
                  {vanHan.luu_nien.sao[i]?.length ? <span className="text-moon"> · {vanHan.luu_nien.sao[i]!.map((x) => tn("sao", x)).join(", ")}</span> : null}
                </dd>
                {lop && <VongHan vh={vanHan} i={i} lop={lop} phai={phai} />}
              </>
            )}
          </dl>
        </div>
        <div className="space-y-3">
          {NHOM_THU_TU.filter((k) => nhom[k].length).map((k) => {
            const mo = nhom[k].find((m) => m.ten === chonTen);
            return (
              <div key={k}>
                <p className="eyebrow mb-1">{t(`ct.nhom.${k}`)}</p>
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
  const { ten: tn } = useChuTuVi();
  const ten = (l: VanHanOutputT["dai_han"] | VanHanOutputT["luu_nien"]) => {
    const tue = l.vong_thai_tue?.[i];
    if (!tue) return null;
    const tueHien = tenThaiTue({ tue_tien: tue, thai_tue_nam_phai: l.vong_thai_tue_nam_phai?.[i] }, phai);
    return [tueHien, l.vong_tuong_tien?.[i]].filter((x): x is string => Boolean(x)).map((x) => tn("sao", x)).join(" · ");
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
  const { c: t, ten: tn, hoa, en } = useChuTuVi();
  const { ngonNgu } = useNgonNgu();
  const theoHan = han ? [
    ...(han.dai_han.tu_hoa_sao ?? []).filter((x) => x.sao === m.ten)
      .map((x) => ({ hoa: x.hoa, nhan: t("han.nhan_dh", { loai: t(han.dai_han.dong_han ? "han.dong_han" : "han.dai_han"), tu: String(han.dai_han.tu_tuoi), den: String(han.dai_han.den_tuoi) }) })),
    ...(han.luu_nien.tu_hoa_sao ?? []).filter((x) => x.sao === m.ten)
      .map((x) => ({ hoa: x.hoa, nhan: t("han.nam", { nam: String(han.nam_xem) }) })),
  ] : [];
  const coHan = Boolean(han?.dai_han.tu_hoa_sao);
  // EN-ALL: trang "sao ở cung" bản Anh mang slug Anh (engine `slug_en` chỉ có ở mục lục) — dùng URL Việt trong cụm đã mở:
  // proxy 308 slug Việt → slug Anh một bước (như cụm Bát tự). Cụm chưa mở bản Anh → không có link.
  const duongVi = m.trang ? duongTrangKb("sao_cung", m.trang) : null;
  const duong = duongVi && ngonNgu === "en" ? banAnh(duongVi) : duongVi;
  const tenCung = tn("cung", cung), tenSao = tn("sao", m.ten);
  const dsDay = (d: string) => (en ? tn("do_sang", d) : DO_SANG_DAY[d] ?? d);
  return (
    <div className="w-full rounded-xl border border-line/70 bg-surface/50 p-3.5 text-sm text-fg-muted" data-testid="the-sao"
      role="group" aria-label={t("ct.the_aria", { sao: tenSao, cung: tenCung })}>
      <p className="font-semibold text-fg">{tenSao} <span className="font-normal text-fg-faint">{t("ct.the_o", { cung: tenCung })}</span></p>
      {m.nghia && <p className="mt-1.5 leading-relaxed" data-testid="nghia-sao-nho">{m.nghia}</p>}
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-fg-faint">{t("ct.do_sang")}</dt>
        <dd>{m.doSang
          ? <>{dsDay(m.doSang)}{m.nguonDoSang && <span className="text-xs text-fg-faint"> ({t(m.nguonDoSang === "nam" ? "ct.nam_phai" : "ct.phai_trung")})</span>}</>
          : <span className="text-fg-faint">{t("ct.khong_xep")}</span>}</dd>
        <dt className="text-fg-faint">{t("ct.nam_sinh")}</dt>
        <dd>{m.tuHoa ? <span className="font-semibold text-fg">{t("ct.hoa", { hoa: hoa(m.tuHoa) })}</span> : <span className="text-fg-faint">{t("ct.khong_hoa")}</span>}</dd>
        {coHan && han && (
          <>
            <dt className="text-fg-faint">{t("ct.theo_han")}</dt>
            <dd className="flex flex-wrap gap-1.5" data-testid="the-sao-han">
              {theoHan.length ? theoHan.map((h) => (
                <span key={h.nhan} className={cn("rounded-full border border-dashed px-2 py-0.5 text-xs font-semibold", MAU_HOA_HAN[h.hoa])}>
                  {t("ct.theo_han_hoa", { nhan: h.nhan, hoa: hoa(TEN_HOA_MA[h.hoa]) })}
                </span>
              )) : <span className="text-fg-faint">{t("ct.khong_hoa_han", { nam: String(han.nam_xem) })}</span>}
            </dd>
          </>
        )}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        {duong && (
          <Button asChild variant="ghost" size="sm" className="min-h-10">
            <Lien href={duong} data-testid="doc-ky-sao"><BookOpen aria-hidden />{` ${t("ct.doc_ky")}`}</Lien>
          </Button>
        )}
        <Button variant="secondary" size="sm" className="min-h-10" onClick={onHoi} data-testid="hoi-sao">
          <MessageCircleQuestion aria-hidden />{` ${t("ct.hoi_sao")}`}
        </Button>
      </div>
    </div>
  );
}
