// Mục lục "Đồ hình sách xưa" (Nhân tướng): các bản khắc gỗ Thần Tướng Toàn Biên có lớp phủ chú giải tiếng Việt.
// Engine trả danh mục (tầng KB); web chỉ hiển thị. Lỗi engine → 5xx (không dựng trang rỗng).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { TieuDeMuc } from "@/components/khung/TieuDe";
import { DuongDan } from "@/components/khung/DuongDan";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { TraLoiNhanh } from "@/components/seo/TraLoiNhanh";
import { goiLd, ldDuongDan, ldTrangWeb, metaTrang } from "@/lib/seo";
import { duongDanCum } from "@/lib/duong-dan";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import { anhDoHinh, danhMucDoHinh, DUONG_DO_HINH } from "@/lib/do-hinh";

const MAC = {
  tieuDe: "Đồ hình nhân tướng sách xưa có chú giải tiếng Việt",
  moTa: "Bản khắc gỗ Thần Tướng Toàn Biên: 12 cung, 13 bộ vị, lưu niên 1–100 tuổi, nốt ruồi nam nữ, tam đình lục phủ — chạm vào chữ khắc để đọc nghĩa tiếng Việt.",
};

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(metaTrang({ ...MAC, duong: DUONG_DO_HINH }), await layNoiDungTrang(DUONG_DO_HINH));
}

export default async function Page() {
  const [d, nd] = await Promise.all([danhMucDoHinh(), layNoiDungTrang(DUONG_DO_HINH)]);
  const h1 = nd.dau.h1 ?? "Đồ hình nhân tướng trong sách xưa";
  const dd = duongDanCum({ ten: "Đồ hình sách xưa", duong: DUONG_DO_HINH });
  const tl = `Sách tướng xưa vẽ khuôn mặt rồi khắc tên từng vùng lên hình: 12 cung, 13 bộ vị trên trục giữa, vị trí của từng tuổi,
    các chấm nốt ruồi. Mỗi trang dưới đây giữ nguyên bản khắc gỗ của ${d.nguon_hien_thi}, phủ thêm điểm chú giải: chạm vào chữ
    khắc để đọc âm Hán Việt và nghĩa bằng lời thường.`.replace(/\s+/g, " ");
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG_DO_HINH, ten: h1, tomTat: MAC.moTa, about: ["Nhân tướng học", "Thần Tướng Toàn Biên"] }),
        ldDuongDan(dd),
      )} />
      <DuongDan ds={dd} className="mb-2" />
      <TieuDeMuc cap={1} nho="Nhân tướng học · sách xưa" lon={h1} mo_ta={nd.dau.loiDan ?? MAC.moTa} />
      <KhoiCms ds={nd.khoi.tren} duong={DUONG_DO_HINH} viTri="tren" className="mb-6" />
      <div className="mb-8"><TraLoiNhanh chu={tl} /></div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="ds-do-hinh">
        {d.do_hinh.map((x) => (
          <li key={x.ma}>
            <Link href={x.duong} className="block overflow-hidden rounded-2xl border border-line/70 hover:border-gold/50">
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh bản khắc tự phục vụ */}
              <img src={anhDoHinh(x.tep)} width={x.rong} height={x.cao} alt={`Bản khắc ${x.ten_han} (${x.am})`} loading="lazy"
                className="aspect-[3/4] w-full bg-[#e9dcc0] object-cover object-top" />
              <span className="block p-4">
                <span className="block font-serif text-lg text-fg">{x.ten}</span>
                <span className="mt-0.5 block text-sm text-fg-muted" lang="zh-Hant">{x.ten_han} · {x.so_diem} điểm chú giải</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-fg-muted">
        Muốn đọc theo gương mặt của chính mình? <Link href="/nhan-tuong" className="text-gold underline">Soi gương theo sách xưa</Link> ·{" "}
        <Link href="/nhan-tuong/bo-vi" className="text-gold underline">Các bộ vị gương mặt</Link>
      </p>
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG_DO_HINH} viTri="cuoi" className="mt-10" />
    </div>
  );
}
