// Ý3 (2026-11-09) — mục lục "Sinh ở nước ngoài": người Việt xa quê lập lá số thế nào (giờ địa phương, múi giờ + giờ mùa hè tự
// tra theo thành phố), mỗi nước một trang dữ kiện engine tính. Khâu THU HÚT (QTE-1 giai đoạn 0: trang SEO Mỹ/Nhật/Úc/Canada).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { DuongDan } from "@/components/khung/DuongDan";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { mucSoTrang } from "@/lib/so-trang";
import { DUONG_SINH_NN, duongSinhNN, mucLucSinhNN } from "@/lib/sinh-nuoc-ngoai";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { CHU_NAM_TUOI_EN, chuNamTuoi, lienNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";


const MD = mucSoTrang(DUONG_SINH_NN)!.mac_dinh;
const DUONG_DAN = [{ ten: "Trang chủ", duong: "/" }, { ten: "Huyền học", duong: "/huyen-hoc" }, { ten: "Sinh ở nước ngoài", duong: DUONG_SINH_NN }];
const hoiDap = (c: ReturnType<typeof chuNamTuoi>["c"]) => ([1, 2, 3, 4] as const).map((i) => ({ hoi: c(`nn.hd${i}_hoi`), dap: c(`nn.hd${i}_dap`) }));

export async function generateMetadata(): Promise<Metadata> {
  // EN-ALL GĐ 8: /en/born-abroad là rewrite của trang này (chữ bản Anh ở lib/chu/nam-tuoi.ts).
  if ((await ngonNguMayChu()).ngonNgu === "en") return metaTrangEn({ tieuDe: CHU_NAM_TUOI_EN["nn.seo_tieu_de_muc"], moTa: CHU_NAM_TUOI_EN["nn.seo_mo_ta_muc"], duongVi: DUONG_SINH_NN });
  return themHreflangVi(apDungSeo(metaTrang({ tieuDe: MD.tieu_de_seo!, moTa: MD.mo_ta_seo!, duong: DUONG_SINH_NN, md: `${DUONG_SINH_NN}.md` }), await layNoiDungTrang(DUONG_SINH_NN)), DUONG_SINH_NN);
}

export default async function Page() {
  const { ngonNgu } = await ngonNguMayChu(), { c, en } = chuNamTuoi(ngonNgu), L = (x: string) => lienNN(en, x);
  const [ds, nd] = await Promise.all([mucLucSinhNN(), noiDungTheo(en, DUONG_SINH_NN)]);
  const h1 = nd.dau.h1 ?? (en ? CHU_NAM_TUOI_EN["nn.h1"] : MD.h1!);
  const HOI_DAP = hoiDap(c);
  const duongHien = L(DUONG_SINH_NN)!;
  const duongDan = en ? [{ ten: "Hieuban", duong: "/en" }, { ten: c("nn.ten"), duong: duongHien }] : DUONG_DAN;
  const homNay = L("/hom-nay");
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        en ? ldTrangWebEn({ duong: duongHien, ten: h1, tomTat: CHU_NAM_TUOI_EN["nn.seo_mo_ta_muc"], about: ["Vietnamese born abroad", "Birthplace time zone", "Zi Wei Dou Shu chart", "BaZi"] })
          : ldTrangWeb({ duong: DUONG_SINH_NN, ten: h1, tomTat: MD.mo_ta_seo, about: ["Người Việt ở nước ngoài", "Múi giờ nơi sinh", "Lá số Tử vi", "Bát tự"] }),
        ldDuongDan(duongDan), ldHoiDap(HOI_DAP),
      )} />
      <DuongDan ds={duongDan} className="mb-2" nhan={c("c.duong_dan")} />
      <TieuDeMuc cap={1} nho={c("nn.nho")} lon={h1} mo_ta={nd.dau.loiDan ?? (en ? CHU_NAM_TUOI_EN["nn.loi_dan"] : MD.loi_dan)} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG_SINH_NN} viTri="tren" className="mb-6" />
      <section aria-label={c("c.tra_loi_nhanh")} className="rounded-2xl border border-gold/30 bg-gold/5 p-5" data-testid="tra-loi-nhanh">
        <p className="eyebrow">{c("c.tra_loi_nhanh")}</p>
        <p className="mt-2 leading-relaxed text-fg">{c("nn.tln")}</p>
      </section>

      <section className="mt-8" aria-labelledby="ds-nuoc">
        <h2 id="ds-nuoc" className="text-2xl">{c("nn.chon_nuoc")}</h2>
        <p className="mt-1 text-sm text-fg-muted">{c("nn.chon_nuoc_mo_ta")}</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2" data-testid="ds-nuoc">
          {ds.map((n) => (
            <li key={n.ma}>
              <Link href={L(duongSinhNN(n.ma))!} className="block rounded-xl border border-line/70 p-4 hover:border-gold/50" data-testid={`nuoc-${n.ma}`}>
                <span className="font-serif text-xl text-fg">{n.ten}</span>
                <span className="mt-1 block text-xs text-fg-muted">{n.mui_gio.join(" · ")} · {n.gio_mua_he ? c("nn.co_he") : c("nn.khong_he")}{n.nam_ban_cau ? ` · ${c("nn.nam_ban_cau")}` : ""}</span>
                {(n.cong_tac.gio_mat_troi || n.cong_tac.mua_noi_sinh) && (
                  <span className="mt-1 block text-xs text-gold">
                    {chuNamTuoi(ngonNgu).p("nn.cach_xem", { ds: [n.cong_tac.gio_mat_troi ? c("nn.gio_mat_troi") : null, n.cong_tac.mua_noi_sinh ? c("nn.mua_noi_sinh") : null].filter(Boolean).join(", ") })}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="cach-lam">
        <h2 id="cach-lam" className="text-2xl">{c("nn.ba_dieu")}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-fg-muted">
          <li><b className="text-fg">{c("nn.ba_1_dam")}</b>{" " + c("nn.ba_1")}</li>
          <li><b className="text-fg">{c("nn.ba_2_dam")}</b>{" " + c("nn.ba_2")}</li>
          <li><b className="text-fg">{c("nn.ba_3_dam")}</b>{" " + c("nn.ba_3")}</li>
        </ol>
      </section>

      <section className="mt-8" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">{c("c.hoi_dap")}</h2>
        <dl className="mt-3 space-y-3">{HOI_DAP.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG_SINH_NN} viTri="duoi" className="mt-8" />
      <p className="mt-6 text-sm text-fg-muted">{c("nn.cuoi") + " "}<Link href={L("/bat-tu")!} className="text-gold underline">{c("nn.cuoi_bat_tu")}</Link>{" · "}<Link href={L("/tu-vi")!} className="text-gold underline">{c("nn.cuoi_tu_vi")}</Link>{homNay ? <>{". " + c("nn.cuoi_hom_nay") + " "}<Link href={homNay} className="text-gold underline">{c("nn.cuoi_hom_nay_link")}</Link>.</> : "."}</p>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG_SINH_NN} viTri="cuoi" className="mt-6" />
    </div>
  );
}
