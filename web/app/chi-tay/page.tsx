// Xem chỉ tay theo sách xưa — Thần Tướng Toàn Biên quyển 10. Đồ hình tám cung bàn tay (lớp phủ chú giải trên bản khắc gỗ)
// + công cụ tự soi: người dùng chọn hình vân giống tay mình → lời sách theo khuôn SX-C. Thư viện đủ hình (số hình do engine trả) render ở máy chủ
// (Google, bot AI đọc được không cần JS). Engine lỗi → 5xx. Web chỉ hiển thị.
// CT-2: khối "Chụp lòng bàn tay" đầu trang — ảnh chỉ xử lý trên máy người dùng, chỉ 21 toạ độ điểm mốc gửi engine (ChupBanTay).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { DuongDan } from "@/components/khung/DuongDan";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { DoHinhPhu } from "@/components/nhan-tuong/DoHinhPhu";
import { ChonVanTay } from "@/components/chi-tay/ChonVanTay";
import { ChupBanTay } from "@/components/chi-tay/ChupBanTay";
import { CongTacPhai, TheoPhai } from "@/components/chi-tay/PhaiChiTay";
import { ChonChiTayTay, MucTayView } from "@/components/chi-tay/ChonChiTayTay";
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang, urlDayDu } from "@/lib/seo";
import { duongDanCongCu } from "@/lib/duong-dan";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { anhDoHinh } from "@/lib/do-hinh";
import { anhVan, DUONG_CHI_TAY, layThuVienChiTay, layThuVienChiTayTay, tachCau, type ThuVienChiTayTay } from "@/lib/chi-tay";

const MAC = {
  tieuDe: "Xem chỉ tay hợp nhất Đông – Tây: chụp cả hai tay trên máy",
  moTa: "Chụp hoặc tải cả hai bàn tay (trái Tiên Thiên, phải Hậu Thiên) ngay trên trình duyệt để đo 21 điểm 3D, quét đường chỉ tay và nhận luận giải hợp nhất Thần Tướng Toàn Biên + Cheiro, Benham, Dale, Baughan. Ảnh không rời máy.",
};
const NHAN: Record<string, string> = { A: "Sách ghi", B: "Nên chú ý", C: "Ghi chép xưa" };

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ ...MAC, duong: DUONG_CHI_TAY }), await layNoiDungTrang(DUONG_CHI_TAY));
}

export default async function Page() {
  const [tv, nd, tvTay] = await Promise.all([layThuVienChiTay(), layNoiDungTrang(DUONG_CHI_TAY), layThuVienChiTayTay()]);
  const h1 = nd.dau.h1 ?? "Xem chỉ tay theo sách xưa";
  const dd = [...duongDanCongCu("/nhan-tuong", "Nhân tướng"), { ten: "Xem chỉ tay", duong: DUONG_CHI_TAY }];   // chỉ tay thuộc mảng Nhân tướng
  const tl = `Sách tướng xưa xem bàn tay theo tám cung bát quái (mỗi cung một mảng đời: cha, mẹ, vợ chồng, nhà cửa, công danh, tổ nghiệp)
    và theo hình vân. ${tv.nguon_hien_thi} khắc 72 hình vân, mỗi hình một bài thơ bốn câu. Bạn tự soi tay mình,
    chọn hình giống tay mình, trang này đọc nguyên văn và nói lại bằng lời thường. Nếu chụp ảnh lòng bàn tay, ảnh chỉ xử lý trên
    máy bạn — chỉ 21 toạ độ điểm mốc gửi lên để đo và đặt tám cung lên đúng tay bạn, không lưu gì lên máy chủ.${tvTay
      ? " Trang cũng có cách xem chỉ tay phương Tây theo sách Cheiro (1894) và Benham (1900): dáng bàn tay, các gò, các đường chỉ. Đường Sinh dài hay ngắn không nói bạn sống bao lâu." : ""}`
    .replace(/\s+/g, " ");
  const theoChuDe = tv.chu_de.map((c) => ({ ...c, van: tv.van.filter((v) => v.chu_de === c.ma) })).filter((c) => c.van.length);
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG_CHI_TAY, ten: h1, tomTat: MAC.moTa, about: ["Xem chỉ tay", "Nhân tướng học", "Thần Tướng Toàn Biên", ...(tvTay ? ["Chỉ tay phương Tây"] : [])] }),
        ldDuongDan(dd),
        ...(tv.do_hinh ? [{ "@type": "ImageObject", contentUrl: urlDayDu(anhDoHinh(tv.do_hinh.tep)), width: tv.do_hinh.rong,
          height: tv.do_hinh.cao, caption: `${tv.do_hinh.ten} (${tv.do_hinh.ten_han}) — ${tv.do_hinh.nguon_hien_thi}` }] : []),
      )} />
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc cap={1} nho="Nhân tướng học · bàn tay" lon={h1} mo_ta={nd.dau.loiDan ?? MAC.moTa} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG_CHI_TAY} viTri="tren" className="mb-6" />
      <div className="mb-8"><TraLoiNhanh chu={tl} /></div>

      {tvTay && <CongTacPhai />}

      <ChupBanTay />

      <TheoPhai tay={tvTay ? <PhanTay tv={tvTay} /> : null} dong={<>

      {tv.do_hinh && (
        <section aria-labelledby="tam-cung" className="mb-12">
          <h2 id="tam-cung" className="mb-2 text-2xl">Tám cung trên bàn tay</h2>
          <p className="mb-4 text-fg-muted">{tv.do_hinh.mo_ta} Chạm vào chữ khắc để đọc nghĩa.</p>
          <DoHinhPhu dh={tv.do_hinh} />
        </section>
      )}

      <section aria-labelledby="tu-soi" className="mb-12">
        <h2 id="tu-soi" className="mb-2 text-2xl">Tay bạn có vân nào giống những hình này?</h2>
        <p className="mb-4 text-fg-muted">
          Ngửa bàn tay ra chỗ sáng, nhìn kỹ các đường và dấu nhỏ (hình sao, chữ tỉnh, vòng tròn, các nét song song) rồi chạm vào hình
          giống tay bạn. Hình khắc gỗ xưa vẽ giản lược, chỉ cần giống dáng là được.
        </p>
        <ChonVanTay van={tv.van} chuDe={tv.chu_de} tenCung={Object.fromEntries((tv.do_hinh?.diem ?? []).map((p) => [p.id, p.ten]))} duongChi={tv.duong_chi} />
      </section>


      <section aria-labelledby="thu-vien">
        <h2 id="thu-vien" className="text-2xl">Thư viện {tv.van.length} hình vân tay trong sách</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Nguyên văn {tv.nguon_hien_thi}. Lời sách đoán nặng (tình duyên, người thân) đã nói giảm và kèm việc nên làm. Sáu hình sách
          đoán phẩm hạnh người khác (người vợ, người đã có đôi) không đưa vào. Lời «ghi chép xưa» gập lại, bấm để đọc.
        </p>
        {theoChuDe.map((c) => (
          <div key={c.ma} className="mt-8">
            <h3 className="text-xl">{c.ten}</h3>
            <ul className="mt-3 grid gap-3 md:grid-cols-2" data-testid="thu-vien-van">
              {c.van.map((v) => (
                <li key={v.ma} id={`van-${v.ma}`} className="flex gap-3 rounded-xl border border-line/70 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh bản khắc tự phục vụ */}
                  <img src={anhVan(v.anh)} width={v.rong} height={v.cao} alt={`Hình ${v.ten_han} trong ${tv.nguon_hien_thi}`} loading="lazy"
                    className="h-40 w-16 shrink-0 rounded-md bg-[#e9dcc0] object-cover object-top" />
                  <div className="min-w-0">
                    <p className="text-fg">{v.ten} · <span lang="zh-Hant" className="font-serif">{v.ten_han}</span>
                      <span className="ml-2 text-xs text-fg-faint">{NHAN[v.nhom]}</span></p>
                    <p className="mt-1 font-serif text-sm text-fg-muted" lang="zh-Hant">{tachCau(v.han).join("，")}</p>
                    {v.am && <p className="mt-0.5 text-xs italic text-fg-faint">{v.am}</p>}
                    {v.nhom === "C" ? (
                      <details className="mt-1.5 text-sm">
                        <summary className="cursor-pointer text-fg-muted">Ghi chép xưa (đã nói giảm) — bấm để đọc</summary>
                        <p className="mt-1 leading-relaxed">{v.y}{v.ham_y ? ` ${v.ham_y}` : ""}</p>
                        {v.viec && <p className="mt-1 text-xs text-fg-muted">Việc nên làm: {v.viec}</p>}
                      </details>
                    ) : (
                      <>
                        <p className="mt-1.5 text-sm leading-relaxed">{v.y}{v.ham_y ? ` ${v.ham_y}` : ""}</p>
                        {v.viec && <p className="mt-1 text-xs text-fg-muted">Việc nên làm: {v.viec}</p>}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mt-8 text-sm text-fg-faint">{tv.cau_ket}</p>
      </section>

      </>} />

      <KhoiCms ds={nd.khoi.duoi} duong={DUONG_CHI_TAY} viTri="duoi" className="mb-10" />

      <p className="mt-10 text-sm text-fg-muted">
        Đọc thêm: <Link href="/nhan-tuong" className="text-gold underline">Soi gương theo sách xưa</Link> ·{" "}
        <Link href="/nhan-tuong/do-hinh" className="text-gold underline">Đồ hình nhân tướng</Link>
      </p>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG_CHI_TAY} viTri="cuoi" className="mt-10" />
    </div>
  );
}

/** TK-2 — phần chỉ tay phương Tây: tự soi (client) + thư viện đầy đủ dựng ở máy chủ (gập), nguồn công khai. */
function PhanTay({ tv }: { tv: ThuVienChiTayTay }) {
  return (
    <>
      <section aria-labelledby="tu-soi-tay" className="mb-12">
        <h2 id="tu-soi-tay" className="mb-2 text-2xl">Chỉ tay phương Tây: tự soi bàn tay của bạn</h2>
        <p className="mb-4 text-fg-muted">{tv.gioi_thieu}</p>
        <ChonChiTayTay tv={tv} />
      </section>

      <section aria-labelledby="thu-vien-tay" className="mb-10">
        <h2 id="thu-vien-tay" className="text-2xl">Dáng tay, các gò và đường chỉ theo sách chỉ tay phương Tây</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Theo {tv.nguon_hien_thi.join(" và ")}. Câu tiếng Anh là nguyên văn sách (bấm «Nguyên văn» để đọc); lời tiếng Việt do ban
          biên tập viết lại cho dễ hiểu. Những phần sách dùng để đoán quãng đời, bệnh tật hay phẩm hạnh không đưa vào.
        </p>
        <details className="mt-4 rounded-2xl border border-line/70 p-4" data-testid="thu-vien-tay">
          <summary className="cursor-pointer text-fg">Bảy dáng bàn tay</summary>
          <ul className="mt-3 space-y-3">
            {tv.dang_tay.lua_chon.map((d) => (
              <li key={d.ma}><h3 className="text-base text-fg">{d.ten}</h3><p className="text-xs text-fg-muted">{d.mo_ta}</p><MucTayView m={d} nho /></li>
            ))}
          </ul>
        </details>
        <details className="mt-3 rounded-2xl border border-line/70 p-4">
          <summary className="cursor-pointer text-fg">Bảy gò trên lòng bàn tay</summary>
          <ul className="mt-3 space-y-4">
            {tv.go.muc.map((g) => (
              <li key={g.ma}>
                <h3 className="text-base text-fg">{g.ten}</h3>
                <p className="text-xs text-fg-muted">{g.vi_tri}</p>
                <div className="mt-1 space-y-2"><MucTayView m={g.day} nho /><MucTayView m={g.trung} nho /></div>
              </li>
            ))}
          </ul>
        </details>
        <details className="mt-3 rounded-2xl border border-line/70 p-4">
          <summary className="cursor-pointer text-fg">Các đường chỉ</summary>
          {tv.luu_y_do_dai && <div className="mt-3 text-sm"><p className="font-medium text-fg">{tv.luu_y_do_dai.ten}</p><MucTayView m={tv.luu_y_do_dai} nho /></div>}
          <ul className="mt-3 space-y-4">
            {tv.duong.map((du) => (
              <li key={du.ma}>
                <h3 className="text-base text-fg">{du.ten}</h3>
                <p className="text-xs text-fg-muted">{du.vi_tri}</p>
                {du.cau.flatMap((c) => c.lua_chon).map((l) => (
                  <div key={l.ma} className="mt-2"><p className="text-sm text-fg">{l.ten}</p><MucTayView m={l} nho /></div>
                ))}
              </li>
            ))}
          </ul>
        </details>
        {tv.khong_dua_vao.length > 0 && (
          <p className="mt-4 text-xs text-fg-faint">Không đưa vào: {tv.khong_dua_vao.map((k) => `${k.ten} (${k.ly_do})`).join("; ")}.</p>
        )}
        <p className="mt-3 text-sm text-fg-faint">{tv.cau_ket}</p>
      </section>
    </>
  );
}
