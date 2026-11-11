// NAM-3 (chủ dự án duyệt 2026-11-01) — "Tử vi năm {năm} tuổi {can chi} {năm sinh}" — MỘT trang mỗi năm sinh, gộp nam
// mạng + nữ mạng (không 2 trang văn mẫu): điểm nhấn của tuổi với năm (địa chi, thiên can, nạp âm, Tam tai, làm nhà),
// sao hạn hai giới bằng lời đời thường + việc nên làm, tứ hoá của năm, lối sang lá số riêng. Engine dựng hết
// (`/v1/nam/{nam}/tuoi/{ns}`); web chỉ hiển thị. Index năm âm hiện tại + năm sau, năm sinh 1960–2005.
import { AnhTomTat } from "@/components/seo/AnhTomTat";
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
import { layNoiDungTrang, voiAnhChiaSe } from "@/lib/noi-dung-trang";
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
  const m = metaTrang({ tieuDe: `Tử vi năm ${x.n} tuổi ${x.ns} nam mạng, nữ mạng`,
    moTa: `Tuổi ${x.ns} năm ${x.n}: hợp hay xung với năm, Tam tai, Kim lâu, làm nhà, sao hạn nam mạng và nữ mạng đọc bằng lời đời thường, việc nên làm trong năm — không phán hung, không cúng giải.`,
    duong: duongNamTuoi(x.n, x.ns), anh: anhBai({ tieuDe: `Tử vi ${x.n} tuổi ${x.ns}`, mang: "lich" }) });
  return namTuoiIndex(x.n, await namTuoiSeo(), x.ns) ? m : { ...m, robots: { index: false, follow: true } };
}

const KIEU: Record<DiemNhan["loai"], { nhan: string; lop: string; cham: string }> = {
  thuan: { nhan: "Điểm thuận", lop: "border-jade/40 bg-jade/5", cham: "bg-jade" },
  luu_y: { nhan: "Nên để ý", lop: "border-gold/40 bg-gold/5", cham: "bg-gold" },
  trung: { nhan: "Để biết", lop: "border-line/80 bg-surface/30", cham: "bg-fg-faint" },
};
const MAU_HOA: Record<string, string> = { "Lộc": "text-jade border-jade/40", "Quyền": "text-moon border-moon/40", "Khoa": "text-moon border-moon/40", "Kỵ": "text-gold border-gold/40 bg-gold/5" };
const NGAN_HOA: Record<string, string> = { "Lộc": "thuận lợi, nguồn lợi", "Quyền": "chủ động, sức mạnh", "Khoa": "tiếng tốt, học hỏi", "Kỵ": "chỗ nên để tâm" };

/** AUD-P1: engine gửi sao bản gọn (tên + hạn) cho trang theo tuổi — lời giải thích + việc nên làm giống hệt mọi tuổi cùng
 *  sao, nằm ở trang sao hạn năm (`#sao-{tên}`); engine cũ (bản đầy đủ) vẫn hiện như trước. */
const slugSao = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, "-");
function TheSao({ gioi, s, nam }: { gioi: string; s: SaoGioi; nam: number }) {
  return (
    <article className="glass rounded-2xl p-5" data-testid={`sao-${gioi === "Nam mạng" ? "nam" : "nu"}`}>
      <p className="eyebrow">{gioi}</p>
      <h3 className="mt-1 font-serif text-2xl text-gold">{s.ten}</h3>
      {s.han && <p className="text-xs text-fg-faint">Hạn {s.han}</p>}
      {s.nghia ? <>
        <p className="mt-3 text-sm leading-relaxed text-fg">{s.nghia}</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {(s.viec ?? []).map((v) => <li key={v} className="flex gap-2 text-fg-muted"><CircleDot className="mt-1 size-3.5 shrink-0 text-gold" aria-hidden />{v}</li>)}
        </ul>
        {s.tu_soi && <p className="mt-3 border-t border-line/60 pt-3 text-sm italic text-fg-muted">Tự soi: {s.tu_soi}</p>}
      </> : <Link href={`/xem-sao-han/${nam}#sao-${slugSao(s.ten)}`} className="mt-3 inline-block text-sm text-gold underline">Sao {s.ten} nghĩa là gì, nên làm gì</Link>}
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
  const nd = await layNoiDungTrang(duong, bien), c = taoChu(CHU_NAM_TUOI, nd.chu);
  const tieuDe = c("dau.tieu_de", bien);
  // 6 ô (kín lưới 2 và 3 cột): điều người đọc tìm nhất có màu — hợp (xanh) / năm tuổi, xung, Tam tai (vàng).
  const chi = d.nguoi.can_chi.split(" ")[1];
  const qh: Record<string, string> = { tam_hop: "Tam hợp", luc_hop: "Lục hợp", trung: "Năm tuổi", xung: "Xung", hinh: "Hình", hai: "Hại", binh: "Bình thường" };
  const mauQh = d.quan_he.chi === "tam_hop" || d.quan_he.chi === "luc_hop" ? "jade" : d.quan_he.chi === "binh" ? null : "gold";
  const o: { k: string; v: string; mau?: "jade" | "gold" | null }[] = [
    { k: `Tuổi ${chi} với năm ${d.can_chi_nam.split(" ")[1]}`, v: qh[d.quan_he.chi] ?? d.quan_he.chi, mau: mauQh },
    { k: "Tam tai", v: d.tam_tai ? `Năm thứ ${d.tam_tai}` : "Không", mau: d.tam_tai ? "gold" : null },
    { k: `Tuổi mụ năm ${x.n}`, v: String(d.tuoi_mu) },
    { k: "Sao (nam / nữ)", v: d.sao.nam && d.sao.nu ? `${d.sao.nam.ten} / ${d.sao.nu.ten}` : "Chưa xếp" },
    { k: "Mệnh của bạn", v: d.nguoi.nap_am }, { k: "Mệnh của năm", v: d.nap_am_nam },
  ];
  const LOP_O = { jade: "border-jade/50 bg-jade/10", gold: "border-gold/50 bg-gold/10" } as const;
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: tieuDe, tomTat: d.tra_loi_nhanh, about: [`Tuổi ${d.nguoi.can_chi}`, `Năm ${d.can_chi_nam}`, "Sao hạn"] }),
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Năm", duong: "/nam" }, { ten: `Năm ${x.n}`, duong: duongNam(x.n) }, { ten: `Tuổi ${d.nguoi.can_chi} ${x.ns}`, duong }]),
        ldHoiDap(d.hoi_dap),
      )} />
      <nav aria-label="Đường dẫn" className="mb-2 text-sm text-fg-muted"><Link href={duongNam(x.n)} className="hover:underline">Năm {x.n} {d.can_chi_nam}</Link> › Tuổi {d.nguoi.can_chi}</nav>
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
      <TraLoiNhanh chu={d.tra_loi_nhanh} />
      <p className="mt-3 text-sm"><Link href={`/thoi-gian-toi?nam=${x.n}`} className="inline-flex items-center gap-1 font-medium text-gold hover:underline">Xem năm {x.n} theo ngày giờ sinh của bạn <ArrowRight className="size-4" aria-hidden /></Link></p>

      <section className="mt-8" aria-labelledby="diem-nhan">
        <h2 id="diem-nhan" className="text-2xl">{c("diem_nhan.tieu_de", bien)}</h2>
        <ul className="mt-4 space-y-3" data-testid="diem-nhan">
          {d.diem_nhan.map((h) => { const k = KIEU[h.loai]; return (
            <li key={h.tieu_de} className={`rounded-2xl border p-4 ${k.lop}`} data-loai={h.loai}>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-muted"><span className={`size-2 rounded-full ${k.cham}`} aria-hidden />{k.nhan}</p>
              <p className="mt-1.5 font-medium text-fg">{h.tieu_de}</p>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{h.noi_dung}</p>
              <details className="mt-2 text-xs text-fg-faint"><summary className="cursor-pointer select-none">Vì sao nói vậy</summary><p className="mt-1">{h.can_cu}</p></details>
            </li>
          ); })}
        </ul>
      </section>

      {d.sao.nam && d.sao.nu && (
        <section className="mt-10" aria-labelledby="sao-nam">
          <h2 id="sao-nam" className="text-2xl">{c("sao.tieu_de", bien)}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><TheSao gioi="Nam mạng" s={d.sao.nam} nam={x.n} /><TheSao gioi="Nữ mạng" s={d.sao.nu} nam={x.n} /></div>
          <p className="mt-2 text-xs text-fg-faint">Sao hạn là tục lệ xếp theo tuổi mụ và giới tính, giống nhau với mọi người cùng tuổi. <Link href={`/xem-sao-han/${x.n}`} className="underline">Bảng sao hạn năm {x.n}</Link>.</p>
        </section>
      )}

      {d.nam_toi?.length ? (
        <section className="mt-10" aria-labelledby="nam-toi" data-testid="nam-toi">
          <h2 id="nam-toi" className="text-2xl">Tuổi {d.nguoi.can_chi} ({x.ns}) mười năm tới</h2>
          <p className="mt-2 text-sm text-fg-muted">Từng năm theo tục: tuổi mụ, quan hệ con giáp với năm, Tam tai, Kim lâu, sao hạn nam / nữ.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-fg-faint"><tr><th className="py-1.5 pr-3 font-normal">Năm</th><th className="py-1.5 pr-3 font-normal">Tuổi mụ</th>
                <th className="py-1.5 pr-3 font-normal">Con giáp</th><th className="py-1.5 pr-3 font-normal">Tam tai</th><th className="py-1.5 pr-3 font-normal">Kim lâu</th><th className="py-1.5 font-normal">Sao nam / nữ</th></tr></thead>
              <tbody>
                {d.nam_toi.map((y) => (
                  <tr key={y.nam} className="border-t border-line/50">
                    <td className="py-1.5 pr-3"><Link href={duongNamTuoi(y.nam, x.ns)} className="text-gold underline decoration-gold/40 underline-offset-2">{y.nam}</Link> <span className="text-fg-faint">{y.can_chi}</span></td>
                    <td className="py-1.5 pr-3">{y.tuoi_mu}</td>
                    <td className="py-1.5 pr-3">{y.dia_chi ?? "—"}</td>
                    <td className="py-1.5 pr-3">{y.tam_tai ? `năm thứ ${y.tam_tai}` : "—"}</td>
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
        <h2 id="lam-nha" className="text-2xl">Làm nhà năm {x.n}</h2>
        <div className={`mt-3 rounded-2xl border p-4 ${d.lam_nha.thuan ? "border-jade/40 bg-jade/5" : "border-gold/40 bg-gold/5"}`} data-testid="lam-nha">
          <p className="font-medium text-fg">{d.lam_nha.thuan ? "Thuận theo tập quán — không phạm Kim lâu, Hoang ốc xấu hay Tam tai" : "Dân gian thường cân nhắc làm nhà năm này"}</p>
          {!d.lam_nha.thuan && <p className="mt-1 text-sm text-fg-muted">Vì: {d.lam_nha.xau.join(", ")}. Nhiều gia đình lùi năm hoặc mượn tuổi người thân đứng tên; việc khác vẫn làm như thường. Cưới hỏi xét Kim lâu theo tuổi cô dâu — xem bảng cưới năm {x.n}.</p>}
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href={duongLamNha(x.n, x.ns)} className="text-gold underline">Tuổi {x.ns} làm nhà năm {x.n}</Link>
            <Link href={duongCuoiHoi(x.n)} className="text-gold underline">Cưới năm {x.n} tuổi nào</Link>
          </p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="tu-hoa">
        <h2 id="tu-hoa" className="text-2xl">Bốn sao hoá của năm {d.can_chi_nam}</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {d.tu_hoa.map((h) => (
            <li key={h.hoa} className={`rounded-xl border p-3 text-center ${MAU_HOA[h.hoa] ?? ""}`} title={h.y_nghia}>
              <span className="block text-xs uppercase tracking-wide">Hoá {h.hoa}</span>
              <span className="mt-0.5 block font-serif text-lg text-fg">{h.sao}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-fg-muted">{NGAN_HOA[h.hoa]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{d.tu_hoa_loi}</p>
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-5" aria-labelledby="ca-nhan">
        <p className="flex items-center gap-2 text-gold"><Sparkles className="size-4" aria-hidden /><span className="eyebrow !text-gold">Của riêng bạn</span></p>
        <h2 id="ca-nhan" className="mt-1 text-xl">{c("ca_nhan.tieu_de", bien)}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{c("ca_nhan.mo_ta", bien)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/thoi-gian-toi?nam=${x.n}`} className="inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg" data-testid="nut-ca-nhan">{c("ca_nhan.nut", bien)} <ArrowRight className="size-4" aria-hidden /></Link>
          <Link href="/tu-vi" className="inline-flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-sm text-fg-muted hover:text-fg"><Compass className="size-4" aria-hidden />Lập lá số Tử vi</Link>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">Câu hỏi thường gặp</h2>
        <dl className="mt-4 space-y-3">{d.hoi_dap.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      {/* SEO-O: ảnh tóm tắt có chữ thật (Google Hình ảnh) — alt cùng nguồn với chữ trong ảnh. */}
      <AnhTomTat kieu="tuoi" nam={x.n} ns={x.ns} />
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mt-8" />
      <CungTuoi namSinh={x.ns} canChi={d.nguoi.can_chi} namSeo={namSeo} namTet={namAm + 1} boQua={duongNamTuoi(x.n, x.ns)} />
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mt-10" />
    </div>
  );
}

export const generateMetadata = async (...a: Parameters<typeof metaGoc>) => voiAnhChiaSe(await metaGoc(...a));
