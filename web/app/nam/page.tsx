// NAM-1 — mục lục "Xem theo năm": năm âm lịch đang đi + năm tới (trang trụ /nam/{năm}) và lối sang "Thời gian tới của
// bạn". Năm lấy từ engine (namAmHienTai) → tự trượt sau Tết, không sửa tay mỗi năm.
// EN-ALL GĐ 8: /en/year là rewrite của trang này (một cây component, chữ ở lib/chu/nam-tuoi.ts).
import { TomTatNam } from "@/components/seo/TomTatNam";
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb, metaTrang } from "@/lib/seo";
import { namAmHienTai } from "@/lib/tuoi-dan-gian";
import { duongNam, namCongKhai } from "@/lib/nam";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { ldTrangWebEn, metaTrangEn, themHreflangVi } from "@/lib/en/seo";
import { chuNamTuoi, lienNN, ngayNN } from "@/lib/chu/nam-tuoi";
import { noiDungTheo } from "@/lib/nam-tuoi-nd";
import { tenTheo } from "@/lib/ten-hien";

const DUONG = "/nam";

export async function generateMetadata(): Promise<Metadata> {
  const { ngonNgu } = await ngonNguMayChu(), { c } = chuNamTuoi(ngonNgu);
  if (ngonNgu === "en") return metaTrangEn({ tieuDe: c("muc.seo_tieu_de"), moTa: c("muc.seo_mo_ta"), duongVi: DUONG });
  return themHreflangVi(apDungSeo(metaTrang({ tieuDe: c("muc.seo_tieu_de"), moTa: c("muc.seo_mo_ta"), duong: DUONG }), await layNoiDungTrang(DUONG)), DUONG);
}

export default async function Page() {
  const { ngonNgu } = await ngonNguMayChu(), { c, p, en } = chuNamTuoi(ngonNgu);
  const namAm = await namAmHienTai();
  const [nd, ...nam] = await Promise.all([noiDungTheo(en, DUONG), namCongKhai(namAm), namCongKhai(namAm + 1)]);
  if (!nam.some(Boolean)) throw new Error("engine không phản hồi");   // SEO-L3: engine lỗi → 5xx, không trang rỗng 200
  const HOI_DAP = [1, 2, 3].map((i) => ({ hoi: c(`muc.hd${i}_hoi` as "muc.hd1_hoi"), dap: c(`muc.hd${i}_dap` as "muc.hd1_dap") }));
  const h1 = nd.dau.h1 ?? c("muc.h1");
  const duongHien = lienNN(en, DUONG)!;
  const caNhan = lienNN(en, "/thoi-gian-toi");
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        en ? ldTrangWebEn({ duong: duongHien, ten: h1, tomTat: c("muc.seo_mo_ta") }) : ldTrangWeb({ duong: DUONG, ten: h1, tomTat: c("muc.seo_mo_ta") }),
        ldDuongDan([{ ten: c("c.trang_chu"), duong: en ? "/en" : "/" }, { ten: c("muc.ten"), duong: duongHien }]),
        ldHoiDap(HOI_DAP),
      )} />
      <TieuDeMuc cap={1} nho={c("muc.nho")} lon={h1}
        mo_ta={nd.dau.loiDan ?? c("muc.loi_dan")} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mb-6" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {nam.map((d, i) => {
          if (!d) return null;
          const ten = tenTheo(d.ten_hien, en);
          return (
            <li key={d.nam}><Link href={lienNN(en, duongNam(d.nam))!} className="block rounded-2xl border border-line/70 p-5 hover:border-gold/50" data-testid="the-nam">
              <span className="eyebrow">{i === 0 ? c("muc.dang_di") : c("muc.nam_toi")}</span>
              <span className="mt-1 block font-serif text-2xl text-fg">{p("muc.the_ten", { nam: d.nam, can_chi: d.can_chi })}</span>
              <span className="mt-1 block text-sm text-fg-muted">{p("muc.the_phu", { menh: ten("nap_am", d.nap_am.ten), tet: ngayNN(en, d.tet) })}</span>
            </Link></li>
          );
        })}
      </ul>
      {/* Ảnh tóm tắt (/og/tom-tat) chỉ có chữ Việt → bản Anh không hiện khối này. */}
      {!en && <TomTatNam kieu="nam" nam={namAm + 1} tieuDe={c("muc.tom_tat", { nam: namAm + 1 })} nhanLink={c("muc.tom_tat_link", { nam: namAm + 1 })} />}
      <section className="mt-8" aria-labelledby="moi-nam">
        <h2 id="moi-nam" className="text-2xl">{c("muc.co_gi")}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg-muted">
          <li>{c("muc.co_gi_1")}</li>
          <li>{c("muc.co_gi_2")}</li>
          <li>{c("muc.co_gi_3")}</li>
          <li>{c("muc.co_gi_4")}</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{c("muc.co_gi_doan")}</p>
      </section>

      {caNhan && (
        <section className="mt-8 rounded-2xl border border-line bg-surface/40 p-5" aria-labelledby="ca-nhan">
          <h2 id="ca-nhan" className="text-xl">{c("muc.ca_nhan_tieu_de")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{c("muc.ca_nhan_mo_ta")}</p>
          <Link href={caNhan} className="mt-3 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg">{c("muc.ca_nhan_nut")}</Link>
        </section>
      )}
      <section className="mt-10" aria-labelledby="hoi-dap">
        <h2 id="hoi-dap" className="text-2xl">{c("c.hoi_dap")}</h2>
        <dl className="mt-4 space-y-3">{HOI_DAP.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-8" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-10" />
    </div>
  );
}
