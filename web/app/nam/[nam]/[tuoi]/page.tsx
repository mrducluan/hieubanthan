// NAM-3 (chủ dự án duyệt 2026-11-01) — "Tử vi năm {năm} tuổi {can chi} {năm sinh}" — MỘT trang mỗi năm sinh, gộp nam
// mạng + nữ mạng (không 2 trang văn mẫu): điểm nhấn của tuổi với năm (địa chi, thiên can, nạp âm, Tam tai, làm nhà),
// sao hạn hai giới bằng lời đời thường + việc nên làm, tứ hoá của năm, lối sang lá số riêng. Engine dựng hết
// (`/v1/nam/{nam}/tuoi/{ns}`); web chỉ hiển thị. Index năm âm hiện tại + năm sau, năm sinh 1960–2005.
import { AnhTomTat } from "@/components/seo/AnhTomTat";
import { MoiXemRieng } from "@/components/nam/MoiXemRieng";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { ArrowRight, CircleDot, Compass, Sparkles } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { CungTuoi } from "@/components/tuoi/CungTuoi";
import { anhBai, goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { docNamBang, docTuoi, duongLamNha, namAmHienTai } from "@/lib/tuoi-dan-gian";
import { type DiemNhan, type SaoGioi, duongCuoiHoi, duongNam, duongNamTuoi, namTheoTuoiCongKhai, namTuoiIndex, namTuoiSeo } from "@/lib/nam";
import { taoChu } from "@/lib/chu-trang";
import { voiAnhChiaSe } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN, type ChuNamTuoi } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { tenTheo } from "@/lib/ten-hien";
import { slugEnCua } from "@/lib/kien-thuc";
import { CHU_NAM_TUOI } from "@/lib/chu/trang-con";

type P = { params: Promise<{ nam: string; tuoi: string }> };

async function doc(p: P) {
  const { nam, tuoi } = await p.params;
  const n = docNamBang(nam), ns = docTuoi(tuoi);
  return n && ns && ns >= 1930 && ns < n ? { n, ns } : null;
}

async function metaGoc(p: P): Promise<Metadata> {
  const x = await doc(p);
  if (!x) return {};
  const { ngonNgu } = await ngonNguMayChu(), { c } = chuNamTuoi(ngonNgu), b = { nam: x.n, nam_sinh: x.ns };
  const index = namTuoiIndex(x.n, await namTuoiSeo(), x.ns);
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: c("nt.seo_tieu_de", b), moTa: c("nt.seo_mo_ta", b), duongVi: duongNamTuoi(x.n, x.ns), noindex: !index });
  // SEO-P: Search Console — người ta gõ "1998 năm 2026 bao nhiêu tuổi" → tiêu đề + mô tả trả lời đúng câu đó (số do engine
  // tính: tuổi tròn, tuổi mụ, can chi); engine lỗi → tiêu đề mặc định.
  const d = await namTheoTuoiCongKhai(x.n, x.ns);
  const co = d?.tuoi_tron != null;
  const m = themHreflangVi(metaTrang({
    tieuDe: co ? `${x.ns} năm ${x.n} bao nhiêu tuổi? Tử vi tuổi ${d!.nguoi.can_chi} ${x.n}` : c("nt.seo_tieu_de", b),
    moTa: co ? `Sinh năm ${x.ns} (${d!.nguoi.can_chi}), năm ${x.n} bước sang ${d!.tuoi_tron} tuổi, tuổi mụ ${d!.tuoi_mu}. Hợp hay xung với năm, Tam tai, Kim lâu, làm nhà, sao hạn nam và nữ mạng — lời đời thường, không phán hung.`
      : c("nt.seo_mo_ta", b),
    duong: duongNamTuoi(x.n, x.ns), anh: anhBai({ tieuDe: `Tử vi ${x.n} tuổi ${x.ns}`, mang: "lich" }) }), duongNamTuoi(x.n, x.ns));
  return index ? m : { ...m, robots: { index: false, follow: true } };
}

const KIEU: Record<DiemNhan["loai"], { nhan: "nt.kieu_thuan" | "nt.kieu_luu_y" | "nt.kieu_trung"; lop: string; cham: string }> = {
  thuan: { nhan: "nt.kieu_thuan", lop: "border-jade/40 bg-jade/5", cham: "bg-jade" },
  luu_y: { nhan: "nt.kieu_luu_y", lop: "border-gold/40 bg-gold/5", cham: "bg-gold" },
  trung: { nhan: "nt.kieu_trung", lop: "border-line/80 bg-surface/30", cham: "bg-fg-faint" },
};
const MAU_HOA: Record<string, string> = { "Lộc": "text-jade border-jade/40", "Quyền": "text-moon border-moon/40", "Khoa": "text-moon border-moon/40", "Kỵ": "text-gold border-gold/40 bg-gold/5" };
const NGAN_HOA: Record<string, "nt.hoa_loc" | "nt.hoa_quyen" | "nt.hoa_khoa" | "nt.hoa_ky"> = { "Lộc": "nt.hoa_loc", "Quyền": "nt.hoa_quyen", "Khoa": "nt.hoa_khoa", "Kỵ": "nt.hoa_ky" };

/** AUD-P1: engine gửi sao bản gọn (tên + hạn) cho trang theo tuổi — lời giải thích + việc nên làm giống hệt mọi tuổi cùng
 *  sao, nằm ở trang sao hạn năm (`#sao-{tên}`); engine cũ (bản đầy đủ) vẫn hiện như trước. */
const slugSao = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, "-");
function TheSao({ gioi, s, nam, t }: { gioi: "nam" | "nu"; s: SaoGioi; nam: number; t: ChuNamTuoi }) {
  // EN-ALL: neo #sao-… cùng một hàm với trang sao hạn năm (tên sao bản Anh có ngoặc → bỏ ký tự lạ ở bản Anh).
  const neo = t.en ? slugSao(s.ten).replace(/[^a-z0-9-]+/g, "") : slugSao(s.ten);
  const den = lienNN(t.en, `/xem-sao-han/${nam}#sao-${neo}`);
  return (
    <article className="glass rounded-2xl p-5" data-testid={`sao-${gioi}`}>
      <p className="eyebrow">{t.c(gioi === "nam" ? "nt.nam_mang" : "nt.nu_mang")}</p>
      <h3 className="mt-1 font-serif text-2xl text-gold">{s.ten}</h3>
      {s.han && <p className="text-xs text-fg-faint">{t.p("nt.han", { han: s.han })}</p>}
      {s.nghia ? <>
        <p className="mt-3 text-sm leading-relaxed text-fg">{s.nghia}</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {(s.viec ?? []).map((v) => <li key={v} className="flex gap-2 text-fg-muted"><CircleDot className="mt-1 size-3.5 shrink-0 text-gold" aria-hidden />{v}</li>)}
        </ul>
        {s.tu_soi && <p className="mt-3 border-t border-line/60 pt-3 text-sm italic text-fg-muted">{t.p("c.tu_soi", { cau: s.tu_soi })}</p>}
      </> : den && <Link href={den} className="mt-3 inline-block text-sm text-gold underline">{t.p("nt.sao_link", { ten: s.ten })}</Link>}
    </article>
  );
}

export default async function Page(p: P) {
  const x = await doc(p);
  if (!x) notFound();
  const [d, namAm, namSeo] = await Promise.all([namTheoTuoiCongKhai(x.n, x.ns), namAmHienTai(), namTuoiSeo()]);
  if (!d) throw new Error("engine không phản hồi");
  const duong = duongNamTuoi(x.n, x.ns);
  const bien = { nam: String(x.n), nam_sinh: String(x.ns), can_chi: d.nguoi.can_chi, can_chi_nam: d.can_chi_nam };
  const { ngonNgu } = await ngonNguMayChu(), tt = chuNamTuoi(ngonNgu), { c: t, p: tp, en } = tt, ten = tenTheo(d.ten_hien, en);
  const nd = await noiDungTheo(en, duong, bien), c = taoChu(CHU_NAM_TUOI, nd.chu, ngonNgu);
  const L = (s: string) => lienNN(en, s), dHien = L(duong)!;
  const menhEn = en && x.ns >= 1950 && x.ns <= 2027 ? await slugEnCua("menh_nam", `sinh-nam-${x.ns}-menh-gi`) : null;
  const tieuDe = c("dau.tieu_de", bien);
  // 6 ô (kín lưới 2 và 3 cột): điều người đọc tìm nhất có màu — hợp (xanh) / năm tuổi, xung, Tam tai (vàng).
  const chi = d.nguoi.can_chi.split(" ")[1];
  const qh: Record<string, string> = { tam_hop: t("nt.qh_tam_hop"), luc_hop: t("nt.qh_luc_hop"), trung: t("nt.qh_trung"), xung: t("nt.qh_xung"), hinh: t("nt.qh_hinh"), hai: t("nt.qh_hai"), binh: t("nt.qh_binh") };
  const mauQh = d.quan_he.chi === "tam_hop" || d.quan_he.chi === "luc_hop" ? "jade" : d.quan_he.chi === "binh" ? null : "gold";
  const o: { k: string; v: string; mau?: "jade" | "gold" | null }[] = [
    { k: t("nt.o_voi_nam", { chi: chi ?? "", chi_nam: d.can_chi_nam.split(" ")[1] ?? "" }), v: qh[d.quan_he.chi] ?? d.quan_he.chi, mau: mauQh },
    { k: t("nt.o_tam_tai"), v: d.tam_tai ? t("c.Nam_thu", { n: d.tam_tai }) : t("nt.o_khong"), mau: d.tam_tai ? "gold" : null },
    { k: t("nt.o_tuoi_mu", { nam: x.n }), v: String(d.tuoi_mu) },
    { k: t("nt.o_sao"), v: d.sao.nam && d.sao.nu ? `${d.sao.nam.ten} / ${d.sao.nu.ten}` : t("nt.o_chua_xep") },
    { k: t("nt.o_menh_ban"), v: ten("nap_am", d.nguoi.nap_am) }, { k: t("nt.o_menh_nam"), v: ten("nap_am", d.nap_am_nam) },
  ];
  const LOP_O = { jade: "border-jade/50 bg-jade/10", gold: "border-gold/50 bg-gold/10" } as const;
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        en ? ldTrangWebEn({ duong: dHien, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`Born ${x.ns} (${d.nguoi.can_chi})`, `${d.can_chi_nam} year`, "Yearly stars"] })
          : ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`Tuổi ${d.nguoi.can_chi}`, `Năm ${d.can_chi_nam}`, "Sao hạn"] }),
        en ? ldDuongDan([{ ten: "Hieuban", duong: "/en" }, { ten: t("muc.ten"), duong: L("/nam")! }, { ten: String(x.n), duong: L(duongNam(x.n))! }, { ten: t("nt.ld_tuoi", { can_chi: d.nguoi.can_chi, nam_sinh: x.ns }), duong: dHien }])
          : ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Năm", duong: "/nam" }, { ten: `Năm ${x.n}`, duong: duongNam(x.n) }, { ten: `Tuổi ${d.nguoi.can_chi} ${x.ns}`, duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label={t("c.duong_dan")} className="mb-2 text-sm text-fg-muted"><Link href={L(duongNam(x.n))!} className="hover:underline">{tp("muc.the_ten", { nam: x.n, can_chi: d.can_chi_nam })}</Link>{tp("nt.nav_tuoi", { can_chi: d.nguoi.can_chi })}</nav>
      <TieuDeMuc cap={1} nho={c("dau.nhan_tren", bien)} lon={tieuDe} />
      <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" className="mb-6" />
      <dl className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="o-tuoi">
        {o.map((x) => (
          <div key={x.k} className={`rounded-xl border p-3 ${x.mau ? LOP_O[x.mau] : "border-line/70"}`}>
            <dt className="text-xs text-fg-faint">{x.k}</dt>
            <dd className={`mt-0.5 text-sm ${x.mau === "jade" ? "font-semibold text-jade" : x.mau === "gold" ? "font-semibold text-gold" : "text-fg"}`}>{x.v}</dd>
          </div>
        ))}
      </dl>
      <TraLoiNhanh chu={d.tra_loi_nhanh} en={en} />
      {L("/thoi-gian-toi") && <p className="mt-3 text-sm"><Link href={L(`/thoi-gian-toi?nam=${x.n}`)!} className="inline-flex items-center gap-1 font-medium text-gold hover:underline">{tp("nt.xem_rieng", { nam: x.n })}<ArrowRight className="size-4" aria-hidden /></Link></p>}

      <section className="mt-8" aria-labelledby="diem-nhan">
        <h2 id="diem-nhan" className="text-2xl">{c("diem_nhan.tieu_de", bien)}</h2>
        <ul className="mt-4 space-y-3" data-testid="diem-nhan">
          {d.diem_nhan.map((h) => { const k = KIEU[h.loai]; return (
            <li key={h.tieu_de} className={`rounded-2xl border p-4 ${k.lop}`} data-loai={h.loai}>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-muted"><span className={`size-2 rounded-full ${k.cham}`} aria-hidden />{t(k.nhan)}</p>
              <p className="mt-1.5 font-medium text-fg">{h.tieu_de}</p>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{h.noi_dung}</p>
              <details className="mt-2 text-xs text-fg-faint"><summary className="cursor-pointer select-none">{t("c.vi_sao")}</summary><p className="mt-1">{h.can_cu}</p></details>
            </li>
          ); })}
        </ul>
      </section>

      {d.sao.nam && d.sao.nu && (
        <section className="mt-10" aria-labelledby="sao-nam">
          <h2 id="sao-nam" className="text-2xl">{c("sao.tieu_de", bien)}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><TheSao gioi="nam" s={d.sao.nam} nam={x.n} t={tt} /><TheSao gioi="nu" s={d.sao.nu} nam={x.n} t={tt} /></div>
          <p className="mt-2 text-xs text-fg-faint">{t("nt.sao_chu_thich") + " "}<Link href={L(`/xem-sao-han/${x.n}`)!} className="underline">{tp("nt.sao_bang", { nam: x.n })}</Link>.</p>
        </section>
      )}

      {d.nam_toi?.length ? (
        <section className="mt-10" aria-labelledby="nam-toi" data-testid="nam-toi">
          <h2 id="nam-toi" className="text-2xl">{tp("nt.muoi_nam_tieu_de", { can_chi: d.nguoi.can_chi, nam_sinh: x.ns })}</h2>
          <p className="mt-2 text-sm text-fg-muted">{t("nt.muoi_nam_mo_ta")}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-fg-faint"><tr><th className="py-1.5 pr-3 font-normal">{t("nt.cot_nam")}</th><th className="py-1.5 pr-3 font-normal">{t("nt.cot_tuoi_mu")}</th>
                <th className="py-1.5 pr-3 font-normal">{t("nt.cot_con_giap")}</th><th className="py-1.5 pr-3 font-normal">{t("nt.cot_tam_tai")}</th><th className="py-1.5 pr-3 font-normal">{t("nt.cot_kim_lau")}</th><th className="py-1.5 font-normal">{t("nt.cot_sao")}</th></tr></thead>
              <tbody>
                {d.nam_toi.map((y) => (
                  <tr key={y.nam} className="border-t border-line/50">
                    <td className="py-1.5 pr-3"><Link href={L(duongNamTuoi(y.nam, x.ns))!} className="text-gold underline decoration-gold/40 underline-offset-2">{y.nam}</Link> <span className="text-fg-faint">{y.can_chi}</span></td>
                    <td className="py-1.5 pr-3">{y.tuoi_mu}</td>
                    <td className="py-1.5 pr-3">{y.dia_chi ?? "—"}</td>
                    <td className="py-1.5 pr-3">{y.tam_tai ? t("c.nam_thu", { n: y.tam_tai }) : "—"}</td>
                    <td className="py-1.5 pr-3">{y.kim_lau ?? "—"}</td>
                    <td className="py-1.5">{y.sao_nam && y.sao_nu ? `${y.sao_nam} / ${y.sao_nu}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-10" aria-labelledby="lam-nha">
        <h2 id="lam-nha" className="text-2xl">{tp("nt.lam_nha_tieu_de", { nam: x.n })}</h2>
        <div className={`mt-3 rounded-2xl border p-4 ${d.lam_nha.thuan ? "border-jade/40 bg-jade/5" : "border-gold/40 bg-gold/5"}`} data-testid="lam-nha">
          <p className="font-medium text-fg">{d.lam_nha.thuan ? t("nt.lam_nha_thuan") : t("nt.lam_nha_can_nhac")}</p>
          {!d.lam_nha.thuan && <p className="mt-1 text-sm text-fg-muted">{tp("nt.lam_nha_vi", { ly_do: d.lam_nha.xau.join(", "), nam: x.n })}</p>}
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href={L(duongLamNha(x.n, x.ns))!} className="text-gold underline">{tp("nt.lam_nha_link", { nam: x.n, nam_sinh: x.ns })}</Link>
            <Link href={L(duongCuoiHoi(x.n))!} className="text-gold underline">{tp("nt.cuoi_link", { nam: x.n })}</Link>
          </p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="tu-hoa">
        <h2 id="tu-hoa" className="text-2xl">{tp("nt.tu_hoa_tieu_de", { can_chi: d.can_chi_nam })}</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {d.tu_hoa.map((h) => (
            <li key={h.hoa} className={`rounded-xl border p-3 text-center ${MAU_HOA[h.hoa] ?? ""}`} title={h.y_nghia}>
              <span className="block text-xs uppercase tracking-wide">{tp("nt.hoa_nhan", { hoa: ten("hoa", h.hoa) })}</span>
              <span className="mt-0.5 block font-serif text-lg text-fg">{ten("sao", h.sao)}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-fg-muted">{NGAN_HOA[h.hoa] ? t(NGAN_HOA[h.hoa]!) : undefined}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{d.tu_hoa_loi}</p>
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-5" aria-labelledby="ca-nhan">
        <p className="flex items-center gap-2 text-gold"><Sparkles className="size-4" aria-hidden /><span className="eyebrow !text-gold">{t("nt.cua_rieng")}</span></p>
        <h2 id="ca-nhan" className="mt-1 text-xl">{c("ca_nhan.tieu_de", bien)}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{c("ca_nhan.mo_ta", bien)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {L("/thoi-gian-toi") && <Link href={L(`/thoi-gian-toi?nam=${x.n}`)!} className="inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg" data-testid="nut-ca-nhan">{c("ca_nhan.nut", bien)} <ArrowRight className="size-4" aria-hidden /></Link>}
          <Link href={L("/tu-vi")!} className="inline-flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-sm text-fg-muted hover:text-fg"><Compass className="size-4" aria-hidden />{t("nt.lap_tu_vi")}</Link>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">{t("c.hoi_dap")}</h2>
        <dl className="mt-4 space-y-3">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      {/* SEO-O: ảnh tóm tắt có chữ thật (Google Hình ảnh) — alt cùng nguồn với chữ trong ảnh. */}
      {!en && <AnhTomTat kieu="tuoi" nam={x.n} ns={x.ns} />}
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <CungTuoi namSinh={x.ns} canChi={d.nguoi.can_chi} namSeo={namSeo} namTet={namAm + 1} boQua={duongNamTuoi(x.n, x.ns)} ngonNgu={ngonNgu} menhEn={menhEn} />
      <MoiXemRieng trang="tuoi" nam={x.n} className="mt-10" />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
