// ND-2 — khung chung của trang công cụ: đọc "Trang website" của URL (CMS > mặc định trong lib/so-trang.ts) rồi đặt
// đầu trang (H1, lời dẫn, khối phía trên — qua DauCms vào trong công cụ), khối phía dưới, bài viết liên quan, phần
// "Về công cụ…" (giới thiệu + hỏi đáp → FAQPage), khối cuối trang. CMS trống / chưa nối → HTML như trước ND-2.
import { Suspense, type ReactNode } from "react";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { DauCms } from "@/components/cms/DauCms";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { CumKienThucTru } from "@/components/kien-thuc/CumKienThucTru";
import { GioiThieuCongCu } from "@/components/seo/GioiThieuCongCu";
import { locChu, taoChu } from "@/lib/chu-trang";
import { TEN_MANG_SILO, dsCumTru } from "@/lib/kien-thuc";
import { gioiThieuTu, layDauNhieuTrang, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { mucSoTrang } from "@/lib/so-trang";

export async function TrangCongCu({ duong, mang, truoc, sau, children }: {
  /** Mảng cho "Bài viết liên quan" (không có → không hiện khối này). */ duong: string; mang?: string; truoc?: ReactNode; sau?: ReactNode; children: ReactNode;
}) {
  const [nd, dauCum] = await Promise.all([layNoiDungTrang(duong), layDauNhieuTrang(dsCumTru(duong).map((x) => x.duong))]);
  // ND-7: bảng chữ của URL + chữ CMS đã lọc → công cụ (client) đọc qua DauCms/useChu; phần dưới đọc ngay ở đây.
  const bang = mucSoTrang(duong)?.mac_dinh.chu ?? {}, c = taoChu(bang, nd.chu);
  return (
    <>
      {truoc}
      <DauCms h1={nd.dau.h1} loiDan={nd.dau.loiDan} kieuChu={nd.dau.kieuChu} bang={bang} chu={locChu(bang, nd.chu)}
        khoiTren={nd.khoi.tren.length ? <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" /> : null}>
        {children}
      </DauCms>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mx-auto mt-12 max-w-5xl" />
      {/* QH-URL: trang công cụ là trang trụ của silo → trỏ xuống các cụm kiến thức của mảng. */}
      <CumKienThucTru tru={duong} className="mt-12" tieuDe={c("kien_thuc.tieu_de", { mang: TEN_MANG_SILO[duong] ?? "" }) || undefined} dau={dauCum} />
      {mang && <Suspense fallback={null}><BaiLienQuanMang mang={mang} className="mt-12"
        tru={dsCumTru(duong).length ? duong : undefined} boQua={[duong, ...dsCumTru(duong).map((x) => x.duong)]} /></Suspense>}
      {nd.gioiThieu.doan.length > 0 && <GioiThieuCongCu {...gioiThieuTu(nd)}
        nhan={{ tieuDe: c("gioi_thieu.tieu_de", { ten: nd.ten ?? "" }), hoiDap: c("gioi_thieu.hoi_dap"), docThem: c("gioi_thieu.doc_them") }} />}
      {sau}
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mx-auto mt-12 max-w-5xl" />
    </>
  );
}
