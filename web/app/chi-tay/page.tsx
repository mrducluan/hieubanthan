// Xem chỉ tay theo sách xưa — Thần Tướng Toàn Biên quyển 10. Đồ hình tám cung bàn tay (lớp phủ chú giải trên bản khắc gỗ)
// + công cụ tự soi: người dùng chọn hình vân giống tay mình → lời sách theo khuôn SX-C. Thư viện đủ 67 hình render ở máy chủ
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
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang, urlDayDu } from "@/lib/seo";
import { duongDanCongCu } from "@/lib/duong-dan";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { anhDoHinh } from "@/lib/do-hinh";
import { anhVan, DUONG_CHI_TAY, layThuVienChiTay, tachCau } from "@/lib/chi-tay";

const MAC = {
  tieuDe: "Xem chỉ tay theo sách xưa: 67 hình vân tay có chú giải",
  moTa: "Tự soi bàn tay theo Thần Tướng Toàn Biên: tám cung trên bản khắc gỗ và trên ảnh tay bạn (ảnh không rời máy), 67 hình vân kèm nguyên văn, lời dễ hiểu.",
};
const NHAN: Record<string, string> = { A: "Sách ghi", B: "Nên chú ý", C: "Ghi chép xưa" };

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ ...MAC, duong: DUONG_CHI_TAY }), await layNoiDungTrang(DUONG_CHI_TAY));
}

export default async function Page() {
  const [tv, nd] = await Promise.all([layThuVienChiTay(), layNoiDungTrang(DUONG_CHI_TAY)]);
  const h1 = nd.dau.h1 ?? "Xem chỉ tay theo sách xưa";
  const dd = duongDanCongCu(DUONG_CHI_TAY, "Xem chỉ tay");
  const tl = `Sách tướng xưa xem bàn tay theo tám cung bát quái (mỗi cung một mảng đời: cha, mẹ, vợ chồng, nhà cửa, công danh, tổ nghiệp)
    và theo hình vân. ${tv.nguon_hien_thi} khắc ${tv.van.length + 5} hình vân, mỗi hình một bài thơ bốn câu. Bạn tự soi tay mình,
    chọn hình giống tay mình, trang này đọc nguyên văn và nói lại bằng lời thường. Nếu chụp ảnh lòng bàn tay, ảnh chỉ xử lý trên
    máy bạn — chỉ 21 toạ độ điểm mốc gửi lên để đo và đặt tám cung lên đúng tay bạn, không lưu gì lên máy chủ.`
    .replace(/\s+/g, " ");
  const theoChuDe = tv.chu_de.map((c) => ({ ...c, van: tv.van.filter((v) => v.chu_de === c.ma) })).filter((c) => c.van.length);
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG_CHI_TAY, ten: h1, tomTat: MAC.moTa, about: ["Xem chỉ tay", "Nhân tướng học", "Thần Tướng Toàn Biên"] }),
        ldDuongDan(dd),
        ...(tv.do_hinh ? [{ "@type": "ImageObject", contentUrl: urlDayDu(anhDoHinh(tv.do_hinh.tep)), width: tv.do_hinh.rong,
          height: tv.do_hinh.cao, caption: `${tv.do_hinh.ten} (${tv.do_hinh.ten_han}) — ${tv.do_hinh.nguon_hien_thi}` }] : []),
      )} />
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc cap={1} nho="Nhân tướng học · bàn tay" lon={h1} mo_ta={nd.dau.loiDan ?? MAC.moTa} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG_CHI_TAY} viTri="tren" className="mb-6" />
      <div className="mb-8"><TraLoiNhanh chu={tl} /></div>

      <ChupBanTay />

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
        <ChonVanTay van={tv.van} chuDe={tv.chu_de} tenCung={Object.fromEntries((tv.do_hinh?.diem ?? []).map((p) => [p.id, p.ten]))} />
      </section>

      <KhoiCms ds={nd.khoi.duoi} duong={DUONG_CHI_TAY} viTri="duoi" className="mb-10" />

      <section aria-labelledby="thu-vien">
        <h2 id="thu-vien" className="text-2xl">Thư viện {tv.van.length} hình vân tay trong sách</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Nguyên văn {tv.nguon_hien_thi}. Lời sách đoán nặng (tình duyên, người thân) đã nói giảm và kèm việc nên làm. Năm hình sách
          đoán về phẩm hạnh người vợ không đưa vào.
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
                    <p className="mt-1.5 text-sm leading-relaxed">{v.nhom === "C" ? "Hàm ý theo ghi chép xưa: " : ""}{v.y}{v.ham_y ? ` ${v.ham_y}` : ""}</p>
                    {v.viec && <p className="mt-1 text-xs text-fg-muted">Việc nên làm: {v.viec}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mt-8 text-sm text-fg-faint">{tv.cau_ket}</p>
      </section>

      <p className="mt-10 text-sm text-fg-muted">
        Đọc thêm: <Link href="/nhan-tuong" className="text-gold underline">Soi gương theo sách xưa</Link> ·{" "}
        <Link href="/nhan-tuong/do-hinh" className="text-gold underline">Đồ hình nhân tướng</Link>
      </p>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG_CHI_TAY} viTri="cuoi" className="mt-10" />
    </div>
  );
}
