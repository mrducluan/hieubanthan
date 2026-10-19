// ND-2 — khung chung của trang công cụ: đọc "Trang website" của URL (CMS > mặc định trong lib/so-trang.ts) rồi đặt
// đầu trang (H1, lời dẫn, khối phía trên — qua DauCms vào trong công cụ), khối phía dưới, bài viết liên quan, phần
// "Về công cụ…" (giới thiệu + hỏi đáp → FAQPage), khối cuối trang. CMS trống / chưa nối → HTML như trước ND-2.
import { Suspense, type ReactNode } from "react";
import { BaiLienQuanMang } from "@/components/blog/BaiLienQuanMang";
import { DauCms } from "@/components/cms/DauCms";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { CumKienThucTru } from "@/components/kien-thuc/CumKienThucTru";
import { GioiThieuCongCu } from "@/components/seo/GioiThieuCongCu";
import { gioiThieuTu, layNoiDungTrang } from "@/lib/noi-dung-trang";

export async function TrangCongCu({ duong, mang, truoc, sau, children }: {
  /** Mảng cho "Bài viết liên quan" (không có → không hiện khối này). */ duong: string; mang?: string; truoc?: ReactNode; sau?: ReactNode; children: ReactNode;
}) {
  const nd = await layNoiDungTrang(duong);
  return (
    <>
      {truoc}
      <DauCms h1={nd.dau.h1} loiDan={nd.dau.loiDan} kieuChu={nd.dau.kieuChu}
        khoiTren={nd.khoi.tren.length ? <KhoiCms ds={nd.khoi.tren} duong={duong} viTri="tren" /> : null}>
        {children}
      </DauCms>
      <KhoiCms ds={nd.khoi.duoi} duong={duong} viTri="duoi" className="mx-auto mt-12 max-w-5xl" />
      {/* QH-URL: trang công cụ là trang trụ của silo → trỏ xuống các cụm kiến thức của mảng. */}
      <CumKienThucTru tru={duong} className="mt-12" />
      {mang && <Suspense fallback={null}><BaiLienQuanMang mang={mang} className="mt-12" /></Suspense>}
      {nd.gioiThieu.doan.length > 0 && <GioiThieuCongCu {...gioiThieuTu(nd)} />}
      {sau}
      <KhoiCms ds={nd.khoi.cuoi} duong={duong} viTri="cuoi" className="mx-auto mt-12 max-w-5xl" />
    </>
  );
}
